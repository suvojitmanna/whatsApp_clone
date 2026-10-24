import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { classifyPromptIntent } from "./intentClassifier.js";
import { searchSearxng } from "./searxngService.js";
import { generateAiImage } from "./imageGenService.js";
import { callDualLlm } from "./llmProvider.js";
import { SYSTEM_PROMPT, getSystemPromptWithTime } from "./config.js";

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
  if (state.intent === "IMAGE_GEN") return "imageGen";
  if (state.intent === "WEB_SEARCH") return "webSearch";
  return "directChat";
}

async function imageGenNode(state) {
  const imageResult = generateAiImage(state.prompt);
  return {
    finalResult: imageResult,
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
  const { text } = await callDualLlm({
    systemPrompt: getSystemPromptWithTime(),
    prompt: state.prompt,
    chatHistory: state.chatHistory,
  });

  return {
    finalResult: {
      type: "text",
      content: text,
      isMetaAi: true,
    },
  };
}

async function synthesizerNode(state) {
  const { searchResults, searchImages, prompt, chatHistory } = state;

  let contextBlock = "";
  if (searchResults && searchResults.length > 0) {
    contextBlock = searchResults
      .map(
        (r, idx) =>
          `[Source ${idx + 1}] ${r.title}\nURL: ${r.url}\nSummary: ${r.snippet}`,
      )
      .join("\n\n");
  }

  const groundedSystemPrompt = `${getSystemPromptWithTime()}

You have access to live real-time web search results provided below.
Ground your response accurately on this data:
---
${contextBlock || "No external web results found."}
---

Formatting Guidelines:
1. Provide a direct, factual, and informative answer for WhatsApp.
2. At the end of your response, list 2 to 3 main clickable sources in this format:
   🌐 *Sources:*
   • [Source Title](URL)`;

  const { text } = await callDualLlm({
    systemPrompt: groundedSystemPrompt,
    prompt: prompt,
    chatHistory: chatHistory,
  });

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
      content: text,
      imageOrVideoUrl: topFiveImages[0]?.imageUrl || null,
      searchImages: topFiveImages,
      metaAiImages: topFiveImages,
      isMetaAi: true,
    },
  };
}

const workflow = new StateGraph(MetaAiState)
  .addNode("router", routerNode)
  .addNode("imageGen", imageGenNode)
  .addNode("webSearch", webSearchNode)
  .addNode("synthesizer", synthesizerNode)
  .addNode("directChat", directChatNode)
  .addEdge(START, "router")
  .addConditionalEdges("router", routeByIntent, {
    imageGen: "imageGen",
    webSearch: "webSearch",
    directChat: "directChat",
  })
  .addEdge("webSearch", "synthesizer")
  .addEdge("synthesizer", END)
  .addEdge("imageGen", END)
  .addEdge("directChat", END);

export const metaAiGraph = workflow.compile();

export async function executeMetaAiWorkflow(prompt, chatHistory = []) {
  try {
    const finalState = await metaAiGraph.invoke({
      prompt: prompt || "",
      chatHistory: chatHistory || [],
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
