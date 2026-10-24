export function isImagePrompt(text) {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  return (
    lower.startsWith("/imagine") ||
    lower.startsWith("imagine ") ||
    lower.startsWith("draw ") ||
    lower.startsWith("paint ") ||
    lower.startsWith("create an image of ") ||
    lower.startsWith("generate an image of ") ||
    lower.startsWith("make an image of ") ||
    lower.startsWith("picture of ")
  );
}

export function extractImagePrompt(text) {
  let prompt = text.trim();
  const lower = prompt.toLowerCase();
  if (lower.startsWith("/imagine")) {
    prompt = prompt.slice(8).trim();
  } else if (lower.startsWith("imagine ")) {
    prompt = prompt.slice(8).trim();
  } else if (lower.startsWith("draw ")) {
    prompt = prompt.slice(5).trim();
  } else if (lower.startsWith("paint ")) {
    prompt = prompt.slice(6).trim();
  } else if (lower.startsWith("create an image of ")) {
    prompt = prompt.slice(19).trim();
  } else if (lower.startsWith("generate an image of ")) {
    prompt = prompt.slice(21).trim();
  } else if (lower.startsWith("make an image of ")) {
    prompt = prompt.slice(17).trim();
  } else if (lower.startsWith("picture of ")) {
    prompt = prompt.slice(11).trim();
  }
  return prompt || "beautiful abstract scenery";
}

export function generateAiImage(rawPrompt) {
  const cleanPrompt = extractImagePrompt(rawPrompt);
  const seed = Math.floor(Math.random() * 900000) + 100000;
  const encoded = encodeURIComponent(cleanPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;

  return {
    type: "image",
    content: cleanPrompt,
    imageOrVideoUrl: imageUrl,
    isMetaAi: true,
  };
}

export function isStickerPrompt(text) {
  if (!text || typeof text !== "string") return false;
  const lower = text.trim().toLowerCase();
  return (
    lower.startsWith("/sticker") ||
    lower.startsWith("sticker ") ||
    lower.startsWith("make a sticker of ") ||
    lower.startsWith("create a sticker of ")
  );
}

export function extractStickerPrompt(text) {
  let prompt = text.trim();
  const lower = prompt.toLowerCase();
  if (lower.startsWith("/sticker")) {
    prompt = prompt.slice(8).trim();
  } else if (lower.startsWith("sticker ")) {
    prompt = prompt.slice(8).trim();
  } else if (lower.startsWith("make a sticker of ")) {
    prompt = prompt.slice(18).trim();
  } else if (lower.startsWith("create a sticker of ")) {
    prompt = prompt.slice(20).trim();
  }
  return prompt || "cute mascot";
}

export function generateAiSticker(rawPrompt) {
  const cleanPrompt = extractStickerPrompt(rawPrompt);
  const stickerPrompt = `${cleanPrompt}, die-cut vinyl sticker, thick white sticker border, isolated on solid white background, cute chibi kawaii vector illustration, high resolution`;
  const seed = Math.floor(Math.random() * 900000) + 100000;
  const encoded = encodeURIComponent(stickerPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${seed}&model=flux`;

  return {
    type: "sticker",
    content: cleanPrompt,
    imageOrVideoUrl: imageUrl,
    isMetaAi: true,
  };
}
