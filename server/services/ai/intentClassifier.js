import { isImagePrompt } from "./imageGenService.js";
import { callFastLlm } from "./llmProvider.js";

const SEARCH_TRIGGER_REGEX =
  /\b(today|yesterday|tomorrow|weather|news|score|match|price|stock|who won|who is the current|latest|recent|updates on|current president|release date|live score|schedule of|temperature in|website|official website|official site|homepage|portal|docs|documentation|url|link to|link for)\b/i;

const EXPLICIT_SEARCH_REGEX =
  /^(search|google|lookup|find|find out|show|show me|give me|browse|where is|what is the website)\s+(for\s+)?/i;

export async function classifyPromptIntent(prompt) {
  if (!prompt || typeof prompt !== "string") return "DIRECT_CHAT";
  const p = prompt.trim();

  if (isImagePrompt(p)) {
    return "IMAGE_GEN";
  }

  if (
    /\b(current\s*time|what\s+time|time\s+now|time\s+today|today\s*(is\s*)?current\s*time|what\s+is\s+the\s+time|tell\s+me\s+the\s+time|today'?s\s+date|what\s+date|current\s+date|date\s+today|which\s+day\s+is\s+today)\b/i.test(
      p,
    )
  ) {
    return "DIRECT_CHAT";
  }

  if (EXPLICIT_SEARCH_REGEX.test(p) || SEARCH_TRIGGER_REGEX.test(p)) {
    return "WEB_SEARCH";
  }

  if (
    /^(hi|hello|hey|hola|good\s*(morning|afternoon|evening))\b/i.test(p) ||
    /^(who\s*(are\s*you|made\s*you)|what\s*(is\s*meta\s*ai|can\s*you\s*do))/i.test(
      p,
    ) ||
    /\b(joke|laugh|write code|debug|explain this code|write a function|translate)\b/i.test(
      p,
    )
  ) {
    return "DIRECT_CHAT";
  }

  try {
    const classificationPrompt = `Analyze the following user prompt for a WhatsApp AI assistant:
"${p}"

Classify into exactly ONE category:
- WEB_SEARCH: Requires up-to-date facts, current events, live information, weather, or recent news.
- DIRECT_CHAT: General conversation, advice, writing, coding, math, or knowledge that does not require live web search.

Reply with ONLY the category name (WEB_SEARCH or DIRECT_CHAT).`;

    const answer = await callFastLlm(classificationPrompt);
    const cleaned = (answer || "").trim().toUpperCase();

    if (cleaned.includes("WEB_SEARCH")) {
      return "WEB_SEARCH";
    }
  } catch (e) {
    console.log(e);
  }

  return "DIRECT_CHAT";
}

export default {
  classifyPromptIntent,
};
