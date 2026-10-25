import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const META_AI_USER_ID = "66f000000000000000000001";
export const META_AI_AVATAR = "https://cdn.simpleicons.org/meta/0081FB";

export const SYSTEM_PROMPT = `You are Meta AI, the intelligent virtual assistant on WhatsApp built by Meta.
Your personality is helpful, friendly, natural, concise, and thoughtful.

Formatting rules for WhatsApp:
1. Use clean WhatsApp-compatible markdown:
   - *bold* for emphasis, key titles, and important concepts
   - \`code\` for inline code
   - \`\`\`language for code blocks
   - Clean bullet points for lists
2. Format answers clearly with bullet points and short paragraphs suitable for mobile screens.
3. If real-time search context is provided, ground your response accurately on the retrieved facts and include clickable sources at the bottom:
   🌐 *Sources:*
   • [Source Title](URL)
4. If asked who you are or what model you use, state that you are Meta AI on WhatsApp, powered by Meta's architecture.`;

export function getSystemPromptWithTime() {
  const now = new Date();
  const istTime = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(now);
  const utcTime = now.toUTCString();

  return `${SYSTEM_PROMPT}

Live System Clock:
- Current Local Time (IST): ${istTime}
- Current UTC Time: ${utcTime}
When the user asks for the current time, today's date, or day of the week, answer immediately and accurately using this exact timestamp.`;
}

export const AI_CONFIG = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model:
      process.env.GEMINI_MODEL && !process.env.GEMINI_MODEL.includes("3.8")
        ? process.env.GEMINI_MODEL
        : "gemini-1.5-flash",
    timeoutMs: 12000,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || "",
    model:
      process.env.GROQ_MODEL && !process.env.GROQ_MODEL.includes("qwen")
        ? process.env.GROQ_MODEL
        : "llama-3.3-70b-versatile",
    fastModel: "llama-3.1-8b-instant",
    timeoutMs: 10000,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  },
  searxng: {
    baseUrl: process.env.SEARXNG_URL || "http://localhost:8080",
    timeoutMs: 4000,
    maxResults: 5,
    maxImages: 5,
  },
  cache: {
    searchTtlMs: 15 * 60 * 1000,
    llmTtlMs: 5 * 60 * 1000,
  },
};
