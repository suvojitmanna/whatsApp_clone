import { AI_CONFIG } from "./config.js";
import { searchCache } from "./cache.js";

export async function searchSearxng(query) {
  if (!query || typeof query !== "string") {
    return { query: "", textResults: [], imageResults: [], fromCache: false };
  }

  const normalizedQuery = query.trim().toLowerCase();
  const cached = searchCache.get(normalizedQuery);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  const { baseUrl, timeoutMs, maxResults, maxImages } = AI_CONFIG.searxng;
  const encodedQuery = encodeURIComponent(query.trim());
  const cleanBase = baseUrl.replace(/\/+$/, "");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const generalUrl = `${cleanBase}/search?q=${encodedQuery}&format=json&categories=general`;
    const imagesUrl = `${cleanBase}/search?q=${encodedQuery}&format=json&categories=images`;

    const [genResSettled, imgResSettled] = await Promise.allSettled([
      fetch(generalUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }),
      fetch(imagesUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }),
    ]);
    clearTimeout(timer);

    const textResults = [];
    const imageResults = [];

    if (genResSettled.status === "fulfilled" && genResSettled.value.ok) {
      const data = await genResSettled.value.json().catch(() => ({}));
      const rawResults = Array.isArray(data.results) ? data.results : [];

      for (const item of rawResults) {
        if ((item.content || item.title) && textResults.length < maxResults) {
          textResults.push({
            title: item.title || "Web Result",
            url: item.url || "",
            snippet: (item.content || "").replace(/<[^>]*>/g, "").trim(),
          });
        }
      }
    }

    if (imgResSettled.status === "fulfilled" && imgResSettled.value.ok) {
      const imgData = await imgResSettled.value.json().catch(() => ({}));
      const rawImgResults = Array.isArray(imgData.results)
        ? imgData.results
        : [];

      for (const item of rawImgResults) {
        if (imageResults.length >= maxImages) break;
        const imgUrl = item.img_src || item.thumbnail_src || item.url;
        if (imgUrl && typeof imgUrl === "string" && imgUrl.startsWith("http")) {
          if (!imageResults.some((r) => r.imageUrl === imgUrl)) {
            imageResults.push({
              title: item.title || query,
              imageUrl: imgUrl,
              sourceUrl: item.url || "",
            });
          }
        }
      }
    }

    if (textResults.length > 0 || imageResults.length > 0) {
      const searchData = {
        query: query.trim(),
        textResults,
        imageResults: imageResults.slice(0, 5), // Guarantee up to 5 images
        fromCache: false,
      };

      searchCache.set(normalizedQuery, searchData, AI_CONFIG.cache.searchTtlMs);
      return searchData;
    }
  } catch (err) {
    console.warn(
      `[SearXNG] Search error (${err.message}). Attempting fallback...`,
    );
  }

  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(ddgUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const ddg = await res.json();
      const textResults = [];
      const imageResults = [];

      if (ddg.AbstractText) {
        textResults.push({
          title: ddg.Heading || query,
          url: ddg.AbstractURL || "https://duckduckgo.com",
          snippet: ddg.AbstractText,
        });
      }

      if (ddg.Image && ddg.Image.startsWith("http")) {
        imageResults.push({
          title: ddg.Heading || query,
          imageUrl: ddg.Image,
          sourceUrl: ddg.AbstractURL || "",
        });
      }

      if (Array.isArray(ddg.RelatedTopics)) {
        for (const topic of ddg.RelatedTopics.slice(0, 5)) {
          if (topic.Text) {
            textResults.push({
              title: topic.FirstURL || query,
              url: topic.FirstURL || "",
              snippet: topic.Text,
            });
          }
          if (topic.Icon?.URL && topic.Icon.URL.startsWith("http")) {
            imageResults.push({
              title: topic.Text?.slice(0, 30) || query,
              imageUrl: topic.Icon.URL,
              sourceUrl: topic.FirstURL || "",
            });
          }
        }
      }

      if (textResults.length > 0 || imageResults.length > 0) {
        const fallbackData = {
          query: query.trim(),
          textResults,
          imageResults: imageResults.slice(0, 5),
          fromCache: false,
        };
        searchCache.set(
          normalizedQuery,
          fallbackData,
          AI_CONFIG.cache.searchTtlMs,
        );
        return fallbackData;
      }
    }
  } catch (fallbackErr) {
    console.warn("[SearXNG] Fallback search also failed:", fallbackErr.message);
  }

  return {
    query: query.trim(),
    textResults: [],
    imageResults: [],
    fromCache: false,
  };
}

export default {
  searchSearxng,
};
