import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { classifyPromptIntent } from "./intentClassifier.js";
import { searchSearxng } from "./searxngService.js";
import { generateAiImage, generateAiSticker } from "./imageGenService.js";
import { callDualLlm } from "./llmProvider.js";
import { SYSTEM_PROMPT, getSystemPromptWithTime } from "./config.js";

export const PERSONA_PROMPTS = {
  coder:
    "\nSpecial Persona: You are an elite Senior Software Architect. Prioritize clean, modern, bug-free production code with clear architecture.",
  tutor:
    "\nSpecial Persona: You are a friendly, encouraging Teacher. Explain concepts in intuitive, simple terms using fun real-world analogies (ELI5).",
  concise:
    "\nSpecial Persona: You are Ultra Concise. Provide direct, high-density bullet points with zero fluff or filler.",
  creative:
    "\nSpecial Persona: You are a Creative Writer & Storyteller. Use rich imagery, evocative vocabulary, and imaginative prose.",
  default: "",
};

export const MetaAiState = Annotation.Root({
  prompt: Annotation({
    reducer: (prev, next) => (next !== undefined ? next : prev),
    default: () => "",
  }),
  chatHistory: Annotation({
    reducer: (prev, next) => (next !== undefined ? next : prev),
    default: () => [],
  }),
  intent: Annotation({
    reducer: (prev, next) => (next !== undefined ? next : prev),
    default: () => "DIRECT_CHAT",
  }),
  persona: Annotation({
    reducer: (prev, next) => (next !== undefined ? next : prev),
    default: () => "default",
  }),
  searchResults: Annotation({
    reducer: (prev, next) => (next !== undefined ? next : prev),
    default: () => [],
  }),
  searchImages: Annotation({
    reducer: (prev, next) => (next !== undefined ? next : prev),
    default: () => [],
  }),
  finalResult: Annotation({
    reducer: (prev, next) => (next !== undefined ? next : prev),
    default: () => null,
  }),
});

async function routerNode(state) {
  const intent = await classifyPromptIntent(state.prompt);
  return { intent };
}

function routeByIntent(state) {
  if (state.intent === "STICKER_GEN") return "stickerGen";
  if (state.intent === "IMAGE_GEN") return "imageGen";
  if (state.intent === "WEB_SEARCH") return "webSearch";
  return "directChat";
}

export function extractSuggestions(text, prompt = "") {
  if (!text || typeof text !== "string") {
    return {
      cleanContent: text || "",
      suggestions: generateFallbackSuggestions(prompt, text),
    };
  }

  const suggestionsMatch = text.match(
    /💡\s*\*?Suggestions:?\*?[\r\n]+((?:[•\-\*]\s*[^\r\n]+[\r\n]*)+)/i,
  );

  let suggestions = [];
  let cleanContent = text;

  if (suggestionsMatch) {
    const rawBlock = suggestionsMatch[1];
    suggestions = rawBlock
      .split(/[\r\n]+/)
      .map((line) =>
        line
          .replace(/^[•\-\*]\s*/, "")
          .replace(/^\[([^\]]+)\]$/, "$1")
          .trim(),
      )
      .filter((s) => s.length > 2 && s.length < 90)
      .slice(0, 3);

    cleanContent = text.replace(suggestionsMatch[0], "").trim();
  }

  if (suggestions.length === 0) {
    suggestions = generateFallbackSuggestions(prompt, cleanContent);
  }

  return { cleanContent, suggestions };
}

export function generateFallbackSuggestions(prompt = "", content = "") {
  const p = (prompt || "").toLowerCase();
  const c = (content || "").toLowerCase();

  if (
    p.includes("/imagine") ||
    p.includes("generate image") ||
    p.includes("draw")
  ) {
    return [
      "Make it cyberpunk neon style",
      "Change to cinematic sunset background",
      "Render in 8K photorealistic",
    ];
  }
  if (p.includes("react") || c.includes("react")) {
    return [
      "How to install React?",
      "Explain React Hooks with examples",
      "React vs Next.js comparison",
    ];
  }
  if (p.includes("time") || p.includes("date") || p.includes("clock")) {
    return [
      "Current time in New York",
      "Current time in London",
      "Time difference with UTC",
    ];
  }
  if (
    p.includes("weather") ||
    c.includes("weather") ||
    c.includes("temperature")
  ) {
    return [
      "Weather forecast for tomorrow",
      "Will it rain today?",
      "Weekly temperature trend",
    ];
  }
  if (p.includes("who is") || p.includes("biography") || c.includes("born")) {
    return [
      "Career & key achievements",
      "Early life & education",
      "Net worth & current role",
    ];
  }
  if (
    c.includes("```") ||
    p.includes("code") ||
    p.includes("function") ||
    p.includes("bug")
  ) {
    return [
      "Explain this code step by step",
      "Show a working usage example",
      "Add TypeScript types & error handling",
    ];
  }
  if (p.includes("website") || c.includes("official website")) {
    return [
      "Getting started tutorial",
      "Official documentation link",
      "Key features & alternatives",
    ];
  }

  return [
    "Tell me more about this",
    "Explain in simple terms",
    "Give me practical examples",
  ];
}

async function imageGenNode(state) {
  const imageResult = generateAiImage(state.prompt);
  const suggestions = [
    "Make it cyberpunk neon style",
    "Change to cinematic sunset background",
    "Render in 8K photorealistic",
  ];
  return {
    finalResult: {
      ...imageResult,
      metaAiSuggestions: suggestions,
      suggestions: suggestions,
    },
  };
}

async function stickerGenNode(state) {
  const stickerResult = generateAiSticker(state.prompt);
  const suggestions = [
    "Make another sticker of this",
    "Change expression to laughing",
    "Generate a cartoon reaction pack",
  ];
  return {
    finalResult: {
      ...stickerResult,
      contentType: "sticker",
      metaAiSuggestions: suggestions,
      suggestions: suggestions,
    },
  };
}

async function webSearchNode(state) {
  const searchData = await searchSearxng(state.prompt);
  return {
    searchResults: searchData.textResults || [],
    searchImages: searchData.imageResults || [],
  };
}

async function directChatNode(state) {
  const personaSuffix = PERSONA_PROMPTS[state.persona] || "";
  const systemPrompt = `${getSystemPromptWithTime()}${personaSuffix}

Follow-up Suggestions Guideline:
At the very end of your response, on a new line, always provide 3 distinct, concise follow-up questions or suggestions tailored to this specific topic in this exact format:
💡 *Suggestions:*
• [Suggestion 1]
• [Suggestion 2]
• [Suggestion 3]`;

  const { text } = await callDualLlm({
    systemPrompt,
    prompt: state.prompt,
    chatHistory: state.chatHistory,
  });

  const { cleanContent, suggestions } = extractSuggestions(text, state.prompt);

  return {
    finalResult: {
      type: "text",
      content: cleanContent,
      metaAiSuggestions: suggestions,
      suggestions: suggestions,
      isMetaAi: true,
    },
  };
}

async function synthesizerNode(state) {
  const { searchResults, searchImages, prompt, chatHistory, persona } = state;
  const personaSuffix = PERSONA_PROMPTS[persona] || "";

  let contextBlock = "";
  if (searchResults && searchResults.length > 0) {
    contextBlock = searchResults
      .map(
        (r, idx) =>
          `[Source ${idx + 1}] ${r.title}\nURL: ${r.url}\nSummary: ${r.snippet}`,
      )
      .join("\n\n");
  }

  const groundedSystemPrompt = `${getSystemPromptWithTime()}${personaSuffix}

You have access to live real-time web search results provided below.
Ground your response accurately on this data:
---
${contextBlock || "No external web results found."}
---

Formatting Guidelines:
1. If the user is asking to search, find, or show a website, official site, service, or tool (e.g. "search react website", "show react website", "react official website"):
   - Directly state the official website at the very top:
     🔗 **Official Website:** [Website Name](URL)
   - Follow with a concise, helpful summary of what the site/technology is and what users can do there.
   - Mention key sections if available (e.g. Documentation, Getting Started).
2. For all general questions, give a direct, factual, and informative answer for WhatsApp.
3. At the end of your response, list 2 to 3 main clickable sources in this format:
   🌐 *Sources:*
   • [Source Title](URL)
4. Do NOT hallucinate URLs; strictly use verified URLs from the search results above.
5. Follow-up Suggestions Guideline:
   At the very end of your response, on a new line, always provide 3 distinct, concise follow-up questions or suggestions tailored to this specific topic in this exact format:
   💡 *Suggestions:*
   • [Suggestion 1]
   • [Suggestion 2]
   • [Suggestion 3]`;

  const { text } = await callDualLlm({
    systemPrompt: groundedSystemPrompt,
    prompt: prompt,
    chatHistory: chatHistory,
  });

  const { cleanContent, suggestions } = extractSuggestions(text, prompt);

  let primaryImageUrl = null;
  if (searchImages && searchImages.length > 0) {
    primaryImageUrl = searchImages[0]?.imageUrl || null;
  }

  const topFiveImages = Array.isArray(searchImages)
    ? searchImages.slice(0, 5)
    : [];

  return {
    finalResult: {
      type: topFiveImages.length > 0 ? "text_with_image" : "text",
      content: cleanContent,
      imageOrVideoUrl: topFiveImages[0]?.imageUrl || null,
      searchImages: topFiveImages,
      metaAiImages: topFiveImages,
      metaAiSuggestions: suggestions,
      suggestions: suggestions,
      isMetaAi: true,
    },
  };
}

const workflow = new StateGraph(MetaAiState)
  .addNode("router", routerNode)
  .addNode("imageGen", imageGenNode)
  .addNode("stickerGen", stickerGenNode)
  .addNode("webSearch", webSearchNode)
  .addNode("synthesizer", synthesizerNode)
  .addNode("directChat", directChatNode)
  .addEdge(START, "router")
  .addConditionalEdges("router", routeByIntent, {
    imageGen: "imageGen",
    stickerGen: "stickerGen",
    webSearch: "webSearch",
    directChat: "directChat",
  })
  .addEdge("webSearch", "synthesizer")
  .addEdge("synthesizer", END)
  .addEdge("imageGen", END)
  .addEdge("stickerGen", END)
  .addEdge("directChat", END);

export const metaAiGraph = workflow.compile();

export async function executeMetaAiWorkflow(
  promptOrInput,
  maybeChatHistory = [],
  maybePersona = "default",
) {
  let prompt = "";
  let chatHistory = [];
  let persona = "default";
  if (typeof promptOrInput === "object" && promptOrInput !== null) {
    prompt = promptOrInput.prompt || "";
    chatHistory = promptOrInput.chatHistory || maybeChatHistory || [];
    persona = promptOrInput.persona || maybePersona || "default";
  } else {
    prompt = promptOrInput || "";
    chatHistory = maybeChatHistory || [];
    persona = maybePersona || "default";
  }

  try {
    const finalState = await metaAiGraph.invoke({
      prompt: prompt || "",
      chatHistory: chatHistory || [],
      persona: persona || "default",
    });

    if (finalState && finalState.finalResult) {
      return finalState.finalResult;
    }
  } catch (err) {
    console.error("[LangGraph] Workflow execution error:", err);
  }

  const fallback = await callDualLlm({
    systemPrompt: SYSTEM_PROMPT,
    prompt: prompt || "Hello",
    chatHistory,
  });

  return {
    type: "text",
    content: fallback.text,
    isMetaAi: true,
  };
}

export default {
  metaAiGraph,
  executeMetaAiWorkflow,
};
