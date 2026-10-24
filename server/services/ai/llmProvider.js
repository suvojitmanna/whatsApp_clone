import { AI_CONFIG, SYSTEM_PROMPT } from "./config.js";

function isAssistantMessage(msg) {
  if (!msg) return false;
  return Boolean(
    msg.isMetaAi === true ||
    msg.sender?.isAI === true ||
    msg.sender === "meta_ai" ||
    msg.role === "assistant" ||
    msg.role === "model",
  );
}

async function callGeminiApi(
  apiKey,
  model,
  systemPrompt,
  contents,
  timeoutMs = 8000,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const cleanModel = (model || "gemini-3.8-flash").replace(/^models\//, "");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;
  const body = {
    contents,
  };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal,
  });
  clearTimeout(timer);

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Gemini API error ${res.status}: ${errorText.slice(0, 150)}`,
    );
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");
  return text.trim();
}

async function callOpenAiCompatible(
  endpoint,
  apiKey,
  model,
  systemPrompt,
  messages,
  timeoutMs = 8000,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const formattedMessages = [];
  if (systemPrompt) {
    formattedMessages.push({ role: "system", content: systemPrompt });
  }
  for (const m of messages) {
    formattedMessages.push({
      role: m.role || (isAssistantMessage(m) ? "assistant" : "user"),
      content: m.content || "",
    });
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      temperature: 0.7,
    }),
    signal: controller.signal,
  });
  clearTimeout(timer);

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${errorText.slice(0, 150)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from provider");
  return text.trim();
}

export async function callDualLlm({
  systemPrompt = SYSTEM_PROMPT,
  prompt,
  chatHistory = [],
  temperature = 0.7,
}) {
  const contents = [];
  if (Array.isArray(chatHistory) && chatHistory.length > 0) {
    for (const msg of chatHistory.slice(-4)) {
      if (msg.content) {
        contents.push({
          role: isAssistantMessage(msg) ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }
  }
  contents.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  const groqMessages = [];
  if (Array.isArray(chatHistory) && chatHistory.length > 0) {
    for (const msg of chatHistory.slice(-4)) {
      if (msg.content) {
        groqMessages.push({
          role: isAssistantMessage(msg) ? "assistant" : "user",
          content: msg.content,
        });
      }
    }
  }
  groqMessages.push({ role: "user", content: prompt });

  if (AI_CONFIG.groq.apiKey) {
    try {
      const text = await callOpenAiCompatible(
        "https://api.groq.com/openai/v1/chat/completions",
        AI_CONFIG.groq.apiKey,
        AI_CONFIG.groq.model,
        systemPrompt,
        groqMessages,
        AI_CONFIG.groq.timeoutMs,
      );
      if (text) return { text, provider: "groq" };
    } catch (err) {
      console.warn(
        `[Dual-LLM] Groq attempt failed (${err.message}). Failing over to Gemini...`,
      );
    }
  }

  if (AI_CONFIG.gemini.apiKey) {
    try {
      const text = await callGeminiApi(
        AI_CONFIG.gemini.apiKey,
        AI_CONFIG.gemini.model,
        systemPrompt,
        contents,
        AI_CONFIG.gemini.timeoutMs,
      );
      if (text) return { text, provider: "gemini" };
    } catch (err) {
      console.warn(
        `[Dual-LLM] Gemini attempt failed (${err.message}). Trying secondary fallbacks...`,
      );
    }
  }

  if (AI_CONFIG.openai.apiKey) {
    try {
      const text = await callOpenAiCompatible(
        "https://api.openai.com/v1/chat/completions",
        AI_CONFIG.openai.apiKey,
        AI_CONFIG.openai.model,
        systemPrompt,
        groqMessages,
        6000,
      );
      if (text) return { text, provider: "openai" };
    } catch (err) {
      console.warn(`[Dual-LLM] OpenAI fallback failed (${err.message})`);
    }
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "system", content: systemPrompt }, ...groqMessages],
        model: "openai-fast",
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes("Free limit reached")) {
        return { text: text.trim(), provider: "pollinations" };
      }
    }
  } catch (err) {
    console.warn(`[Dual-LLM] Pollinations fallback failed: ${err.message}`);
  }

  return {
    text: `⚡ *Meta AI received your message:*\n\n> "${prompt}"\n\nI am currently experiencing higher-than-normal traffic across AI networks. Please try asking again in a moment!`,
    provider: "offline-fallback",
  };
}

export async function callFastLlm(
  prompt,
  systemPrompt = "You are a fast concise classifier.",
) {
  if (AI_CONFIG.groq.apiKey) {
    try {
      return await callOpenAiCompatible(
        "https://api.groq.com/openai/v1/chat/completions",
        AI_CONFIG.groq.apiKey,
        AI_CONFIG.groq.fastModel,
        systemPrompt,
        [{ role: "user", content: prompt }],
        3000,
      );
    } catch (e) {
      console.warn(`[Fast-LLM] Groq fallback failed (${e.message})`);
    }
  }

  if (AI_CONFIG.gemini.apiKey) {
    try {
      return await callGeminiApi(
        AI_CONFIG.gemini.apiKey,
        AI_CONFIG.gemini.model,
        systemPrompt,
        [{ role: "user", parts: [{ text: prompt }] }],
        4000,
      );
    } catch (e) {
      console.warn(`[Fast-LLM] Gemini fallback failed (${e.message})`);
    }
  }

  return "";
}

export default {
  callDualLlm,
  callFastLlm,
};
