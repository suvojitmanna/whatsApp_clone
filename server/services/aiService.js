const SYSTEM_PROMPT = `You are Meta AI, the intelligent virtual assistant on WhatsApp.
Your personality is helpful, friendly, thoughtful, and concise.
Rules:
1. Provide accurate, clear, and direct answers formatted nicely for mobile chat.
2. Use markdown formatting: *bold* for emphasis, \`code\` for inline code, \`\`\`language for code blocks, bullet points for lists.
3. Keep responses relatively concise unless asked for deep detail.
4. If asked who you are, state that you are Meta AI on WhatsApp.`;

const META_AI_USER_ID = "66f000000000000000000001";
const META_AI_AVATAR = "https://cdn.simpleicons.org/meta/0081FB";

function isAssistantMessage(msg) {
  if (!msg) return false;
  return Boolean(
    msg.isMetaAi === true ||
    msg.sender?.isAI === true ||
    msg.sender === "meta_ai" ||
    String(msg.sender?._id || msg.sender) === META_AI_USER_ID,
  );
}

function isImagePrompt(text) {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  return (
    lower.startsWith("/imagine") ||
    lower.startsWith("imagine ") ||
    lower.startsWith("draw ") ||
    lower.startsWith("paint ") ||
    lower.startsWith("create an image of ") ||
    lower.startsWith("generate an image of ")
  );
}

function extractImagePrompt(text) {
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
  }
  return prompt || "beautiful abstract scenery";
}

function generateAiImage(rawPrompt) {
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

async function callGeminiApi(apiKey, prompt, chatHistory) {
  const configured = process.env.GEMINI_MODEL || process.env.META_AI_MODEL;
  const model =
    configured && configured.toLowerCase().startsWith("gemini")
      ? configured
      : "gemini-3.8-flash";
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
      }),
      signal: controller.signal,
    },
  );
  clearTimeout(timeout);

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return text.trim();
}

async function callOpenAiCompatible(
  endpoint,
  apiKey,
  defaultModel,
  prompt,
  chatHistory,
) {
  let model = defaultModel;
  if (endpoint.includes("groq")) {
    const configured = process.env.GROQ_MODEL || process.env.META_AI_MODEL;
    model =
      configured &&
      !configured.startsWith("gemini") &&
      !configured.startsWith("gpt")
        ? configured
        : defaultModel;
  } else if (endpoint.includes("openai")) {
    const configured = process.env.OPENAI_MODEL || process.env.META_AI_MODEL;
    model =
      configured && configured.startsWith("gpt") ? configured : defaultModel;
  }
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];
  if (Array.isArray(chatHistory) && chatHistory.length > 0) {
    for (const msg of chatHistory.slice(-4)) {
      if (msg.content) {
        messages.push({
          role: isAssistantMessage(msg) ? "assistant" : "user",
          content: msg.content,
        });
      }
    }
  }
  messages.push({ role: "user", content: prompt });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response");
  return text.trim();
}

async function generateAiText(prompt, chatHistory = []) {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    try {
      const text = await callGeminiApi(
        process.env.GEMINI_API_KEY.trim(),
        prompt,
        chatHistory,
      );
      if (text) {
        return { type: "text", content: text, isMetaAi: true };
      }
    } catch (err) {
      console.warn("Gemini API failed, attempting fallbacks:", err?.message);
    }
  }

  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
    try {
      const text = await callOpenAiCompatible(
        "https://api.groq.com/openai/v1/chat/completions",
        process.env.GROQ_API_KEY.trim(),
        "qwen/qwen3.8-27b",
        prompt,
        chatHistory,
      );
      if (text) {
        return { type: "text", content: text, isMetaAi: true };
      }
    } catch (err) {
      console.warn("Groq API failed, attempting fallbacks:", err?.message);
    }
  }

  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
    try {
      const text = await callOpenAiCompatible(
        "https://api.openai.com/v1/chat/completions",
        process.env.OPENAI_API_KEY.trim(),
        "gpt-4o-mini",
        prompt,
        chatHistory,
      );
      if (text) {
        return { type: "text", content: text, isMetaAi: true };
      }
    } catch (err) {
      console.warn("OpenAI API failed, attempting fallbacks:", err?.message);
    }
  }

  const messages = [{ role: "system", content: SYSTEM_PROMPT }];

  if (Array.isArray(chatHistory) && chatHistory.length > 0) {
    const recent = chatHistory.slice(-4);
    for (const msg of recent) {
      if (msg.content) {
        messages.push({
          role: isAssistantMessage(msg) ? "assistant" : "user",
          content: msg.content,
        });
      }
    }
  }

  messages.push({ role: "user", content: prompt });

  function getSmartFallbackReply(prompt) {
    if (!prompt || typeof prompt !== "string") return null;
    const p = prompt.trim().toLowerCase();

    if (
      /^(hi|hello|hey|hola|greetings|good\s*(morning|afternoon|evening))\b/i.test(
        p,
      )
    ) {
      return "Hello! 👋 I'm **Meta AI** on WhatsApp. How can I help you today? Feel free to ask me anything or type `/imagine` to generate an image!";
    }
    if (
      /who\s*(are\s*you|made\s*you)|what\s*(are\s*you|is\s*meta\s*ai)/i.test(p)
    ) {
      return "I am **Meta AI**, your intelligent assistant on WhatsApp! I can help you answer questions, brainstorm ideas, write code or text, and generate images with `/imagine`.";
    }
    if (
      /what\s*(can\s*you\s*do|are\s*your\s*features|do\s*you\s*do)|help/i.test(
        p,
      )
    ) {
      return "Here are some of the things I can do for you:\n\n* 🎨 **Generate Images:** Type `/imagine <description>` to create high-resolution AI art\n* 💡 **Answer Questions:** Science, history, general knowledge, recipes, and trivia\n* 💻 **Coding & Writing:** Explain code, write essays, drafts, or translate languages\n* ✈️ **Planning:** Itineraries, study schedules, and step-by-step guides\n\nJust ask me anything to get started!";
    }
    if (/joke|make\s*me\s*laugh/i.test(p)) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything! 😄",
        "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
        "What do you call fake spaghetti? An impasta! 🍝",
        "Why did the computer go to the doctor? Because it had a virus! 💻",
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        model: "openai-fast",
        seed: Math.floor(Math.random() * 100000),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        if (text.includes("Free limit reached")) {
          const smart = getSmartFallbackReply(prompt);
          if (smart) return { type: "text", content: smart, isMetaAi: true };

          return {
            type: "text",
            content:
              "⚡ *Meta AI is thinking quickly!*\n\nThe public demo endpoint allows 1 reply every 30 seconds per IP.\n\n💡 *To chat continuously with zero delays:* add a free **Google Gemini** or **Groq** API key in `server/.env` (free with no credit card required!).",
            isMetaAi: true,
          };
        }
        return {
          type: "text",
          content: text.trim(),
          isMetaAi: true,
        };
      }
    }
  } catch (err) {
    console.warn(
      "Primary free AI API timed out, trying fallback...",
      err?.message,
    );
  }

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai-fast`;
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim() && !text.includes("Free limit reached")) {
        return {
          type: "text",
          content: text.trim(),
          isMetaAi: true,
        };
      }
    }
  } catch (err) {
    console.error("AI Fallback also failed:", err?.message);
  }

  const smartFallback = getSmartFallbackReply(prompt);
  if (smartFallback) {
    return { type: "text", content: smartFallback, isMetaAi: true };
  }

  return {
    type: "text",
    content:
      '⚡ *Meta AI received your message:*\n\n> "' +
      prompt +
      "\"\n\nThe public demo server allows 1 request every 30 seconds per IP.\n\n💡 *For unlimited, instant responses:* Add your free Google Gemini API key to `server/.env` (`GEMINI_API_KEY=...`). It's 100% free with no credit card required!",
    isMetaAi: true,
  };
}

async function processMetaAiQuery(prompt, chatHistory = []) {
  if (isImagePrompt(prompt)) {
    return generateAiImage(prompt);
  }
  return await generateAiText(prompt, chatHistory);
}

const User = require("../models/user");

async function ensureMetaAiUser() {
  try {
    let aiUser = await User.findById(META_AI_USER_ID);
    if (!aiUser) {
      aiUser = await User.findOne({ username: "Meta AI" });
    }
    if (!aiUser) {
      aiUser = new User({
        _id: META_AI_USER_ID,
        username: "Meta AI",
        about:
          "Responses are generated by AI. Some may be inaccurate or inappropriate,including for some teens.",
        isVerified: true,
        isAI: true,
        isOnline: true,
        profilePicture: META_AI_AVATAR,
      });
      await aiUser.save();
    } else {
      let changed = false;
      if (!aiUser.isAI) {
        aiUser.isAI = true;
        changed = true;
      }
      if (!aiUser.isVerified) {
        aiUser.isVerified = true;
        changed = true;
      }
      if (!aiUser.isOnline) {
        aiUser.isOnline = true;
        changed = true;
      }
      if (
        !aiUser.profilePicture ||
        aiUser.profilePicture.includes("wikimedia.org")
      ) {
        aiUser.profilePicture = META_AI_AVATAR;
        changed = true;
      }
      if (changed) await aiUser.save();
    }
    return aiUser;
  } catch (err) {
    console.error("Error ensuring Meta AI user:", err?.message);
    return null;
  }
}

module.exports = {
  META_AI_USER_ID,
  META_AI_AVATAR,
  ensureMetaAiUser,
  isImagePrompt,
  extractImagePrompt,
  generateAiImage,
  generateAiText,
  processMetaAiQuery,
};
