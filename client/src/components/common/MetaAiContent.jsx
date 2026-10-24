import React, { useState, useEffect, useRef } from "react";
import {
  FaCopy,
  FaCheck,
  FaDownload,
  FaThumbsUp,
  FaThumbsDown,
  FaRegThumbsUp,
  FaRegThumbsDown,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";
import { MdContentCopy, MdRefresh } from "react-icons/md";
import { SiMetaai } from "react-icons/si";
import { HiLanguage } from "react-icons/hi2";
import { toast } from "react-toastify";
import { MetaAiRing } from "./MetaAiIcon";
import { PERSONAS } from "./MetaAiPersonaSelector";

function renderTextWithWordHighlights(rawText, wordCounterRef, activeWordIndex, isSpeaking) {
  if (!rawText) return null;
  if (
    !isSpeaking ||
    !wordCounterRef ||
    activeWordIndex === null ||
    activeWordIndex === undefined ||
    activeWordIndex < 0
  ) {
    return rawText;
  }

  const parts = rawText.split(/(\s+)/);
  return parts.map((part, pIdx) => {
    if (!part) return null;
    if (/^\s+$/.test(part)) {
      return <span key={`ws-${pIdx}`}>{part}</span>;
    }

    const currentWordIdx = wordCounterRef.current++;
    const isCurrent = currentWordIdx === activeWordIndex;
    const isPast = currentWordIdx < activeWordIndex;

    return (
      <span
        key={`w-${currentWordIdx}-${pIdx}`}
        data-word-index={currentWordIdx}
        className={
          isCurrent
            ? "relative inline-block bg-gradient-to-r from-[#0081fb]/25 via-[#7928ca]/25 to-[#ff0080]/25 dark:from-[#38bdf8]/30 dark:via-[#a855f7]/35 dark:to-[#f472b6]/30 text-indigo-950 dark:text-white font-bold rounded-md px-1.5 -my-0.5 shadow-xs ring-1.5 ring-[#7928ca]/50 dark:ring-[#a855f7]/70 scale-[1.04] transition-all duration-150 z-10"
            : isPast
              ? "text-inherit opacity-95 transition-opacity"
              : "text-inherit transition-colors"
        }
      >
        {part}
      </span>
    );
  });
}

function renderInlineFormatting(
  text,
  wordCounterRef = null,
  activeWordIndex = -1,
  isSpeaking = false
) {
  if (!text) return null;
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((codePart, cIdx) => {
    if (codePart.startsWith("`") && codePart.endsWith("`") && codePart.length >= 2) {
      let isCodeCurrent = false;
      if (isSpeaking && wordCounterRef && wordCounterRef.current === activeWordIndex) {
        isCodeCurrent = true;
      }
      if (wordCounterRef) wordCounterRef.current++;

      return (
        <code
          key={`code-${cIdx}`}
          className={`px-1.5 py-0.5 mx-0.5 rounded text-[13px] font-mono transition-all ${isCodeCurrent
            ? "bg-gradient-to-r from-blue-500/25 via-indigo-500/30 to-purple-500/25 text-indigo-900 dark:text-white ring-1.5 ring-purple-400 font-bold scale-105"
            : "bg-black/10 dark:bg-white/10 text-pink-600 dark:text-pink-400"
            }`}
        >
          {codePart.slice(1, -1)}
        </code>
      );
    }

    const linkRegex =
      /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<]+[^<.,:;"')\]\s]|www\.[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+[^<.,:;"')\]\s])/gi;
    const linkParts = codePart.split(linkRegex);

    return linkParts.map((linkPart, lIdx) => {
      if (!linkPart) return null;

      const mdMatch = linkPart.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (mdMatch) {
        return (
          <a
            key={`mdlink-${cIdx}-${lIdx}`}
            href={mdMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#027eb5] hover:text-[#015f8a] dark:text-[#53bdeb] dark:hover:text-[#7ad0f5] underline underline-offset-2 break-all font-medium cursor-pointer transition-colors inline select-text"
            title={mdMatch[2]}
          >
            {renderTextWithWordHighlights(mdMatch[1], wordCounterRef, activeWordIndex, isSpeaking)}
          </a>
        );
      }

      if (/^https?:\/\//i.test(linkPart)) {
        return (
          <a
            key={`rawlink-${cIdx}-${lIdx}`}
            href={linkPart}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#027eb5] hover:text-[#015f8a] dark:text-[#53bdeb] dark:hover:text-[#7ad0f5] underline underline-offset-2 break-all font-medium cursor-pointer transition-colors inline select-text"
            title={linkPart}
          >
            {renderTextWithWordHighlights(linkPart, wordCounterRef, activeWordIndex, isSpeaking)}
          </a>
        );
      }

      if (/^www\./i.test(linkPart)) {
        const fullUrl = `https://${linkPart}`;
        return (
          <a
            key={`wwwlink-${cIdx}-${lIdx}`}
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#027eb5] hover:text-[#015f8a] dark:text-[#53bdeb] dark:hover:text-[#7ad0f5] underline underline-offset-2 break-all font-medium cursor-pointer transition-colors inline select-text"
            title={fullUrl}
          >
            {renderTextWithWordHighlights(linkPart, wordCounterRef, activeWordIndex, isSpeaking)}
          </a>
        );
      }

      const boldParts = linkPart.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (
          (bPart.startsWith("**") && bPart.endsWith("**") && bPart.length >= 4) ||
          (bPart.startsWith("*") && bPart.endsWith("*") && bPart.length >= 2)
        ) {
          const clean = bPart.startsWith("**") ? bPart.slice(2, -2) : bPart.slice(1, -1);
          return (
            <strong key={`bold-${cIdx}-${lIdx}-${bIdx}`} className="font-semibold text-inherit">
              {renderTextWithWordHighlights(clean, wordCounterRef, activeWordIndex, isSpeaking)}
            </strong>
          );
        }
        return renderTextWithWordHighlights(bPart, wordCounterRef, activeWordIndex, isSpeaking);
      });
    });
  });
}
function CodeBlock({ code, language, theme }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const lang = (language || "").toLowerCase().trim();
  const isPreviewable = [
    "html",
    "htm",
    "svg",
    "xml",
    "javascript",
    "js",
    "react",
    "jsx",
  ].includes(lang);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const previewHtml = React.useMemo(() => {
    if (!isPreviewable || !showPreview) return "";

    if (lang === "svg") {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;padding:16px;}</style></head><body>${code}</body></html>`;
    }

    if (lang === "html" || lang === "htm") {
      if (code.includes("<html") || code.includes("<body")) {
        return code;
      }
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><script src="https://cdn.tailwindcss.com"></script><style>body{font-family:system-ui,-apple-system,sans-serif;padding:16px;margin:0;background:#fff;color:#0f172a;}</style></head><body>${code}</body></html>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body{font-family:system-ui,-apple-system,sans-serif;padding:16px;margin:0;background:#ffffff;color:#0f172a;}</style>
</head>
<body>
  <div id="root"></div>
  <div id="output"></div>
  <script>
    const log = (...args) => {
      const out = document.getElementById('output');
      const p = document.createElement('div');
      p.style.fontFamily = 'monospace';
      p.style.fontSize = '12px';
      p.style.padding = '3px 0';
      p.style.color = '#0284c7';
      p.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
      out.appendChild(p);
    };
    console.log = log;
    try {
      ${code}
    } catch(err) {
      document.getElementById('output').innerHTML = '<div style="color:#ef4444;font-family:monospace;font-size:12px;">Error: ' + err.message + '</div>';
    }
  </script>
</body>
</html>`;
  }, [code, lang, isPreviewable, showPreview]);

  return (
    <div className="my-2 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[13px]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] text-xs text-gray-300 border-b border-white/5 select-none">
        <div className="flex items-center gap-2">
          <span className="font-medium lowercase text-gray-400">{language || "code"}</span>
          {isPreviewable && (
            <button
              type="button"
              onClick={() => setShowPreview((p) => !p)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer active:scale-95 ${showPreview
                ? "bg-cyan-500 text-white shadow-xs"
                : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 hover:text-cyan-300"
                }`}
              title="Toggle interactive live preview"
            >
              <span>{showPreview ? "Hide Preview" : "▶ Live Preview"}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/10 active:scale-95 transition-all cursor-pointer text-gray-300 hover:text-white"
        >
          {copied ? <FaCheck size={11} className="text-emerald-400" /> : <FaCopy size={11} />}
          <span>{copied ? "Copied" : "Copy code"}</span>
        </button>
      </div>

      {showPreview && isPreviewable && (
        <div className="border-b border-white/10 bg-white dark:bg-neutral-900 p-2 transition-all">
          <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 px-1">
            <span className="flex items-center gap-1.5 text-cyan-500 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span>Interactive Sandboxed Preview</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 font-mono">
              Tailwind CDN
            </span>
          </div>
          <iframe
            title="Code Preview"
            srcDoc={previewHtml}
            sandbox="allow-scripts"
            className="w-full h-48 sm:h-60 rounded-md border border-black/10 dark:border-white/10 bg-white"
          />
        </div>
      )}

      <pre className="p-3 overflow-x-auto whitespace-pre font-mono leading-relaxed select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MetaAiMarkdown({ content, theme = "dark", messageId }) {
  if (!content) return null;

  const [speechState, setSpeechState] = useState({
    isSpeaking: false,
    activeWordIndex: -1,
    totalWords: 0,
  });

  const effectiveId = messageId || (content ? content.slice(0, 40) : "meta_ai_msg");

  useEffect(() => {
    const handleSpeech = (e) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.type === "start" && detail.messageId === effectiveId) {
        setSpeechState({
          isSpeaking: true,
          activeWordIndex: 0,
          totalWords: detail.totalWords || 0,
        });
      } else if (detail.type === "boundary" && detail.messageId === effectiveId) {
        setSpeechState((prev) => ({
          ...prev,
          isSpeaking: true,
          activeWordIndex: detail.wordIndex,
        }));
      } else if (
        (detail.type === "end" || detail.type === "stop") &&
        detail.messageId === effectiveId
      ) {
        setSpeechState({
          isSpeaking: false,
          activeWordIndex: -1,
          totalWords: 0,
        });
      } else if (detail.type === "stop_all") {
        setSpeechState({
          isSpeaking: false,
          activeWordIndex: -1,
          totalWords: 0,
        });
      }
    };

    window.addEventListener("meta_ai_speech_event", handleSpeech);
    return () => {
      window.removeEventListener("meta_ai_speech_event", handleSpeech);
    };
  }, [effectiveId]);

  const wordCounterRef = { current: 0 };
  const { isSpeaking, activeWordIndex, totalWords } = speechState;

  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: content.substring(lastIndex, match.index),
      });
    }
    segments.push({
      type: "code",
      language: match[1]?.trim() || "code",
      content: match[2]?.trimEnd(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      content: content.substring(lastIndex),
    });
  }

  return (
    <div className="space-y-1.5 leading-relaxed break-words">
      {isSpeaking && (
        <div className="flex items-center justify-between px-2.5 py-1 mb-1.5 rounded-lg bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-purple-500/10 border border-indigo-500/25 text-xs text-indigo-600 dark:text-indigo-300 animate-fadeIn select-none">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5 h-3">
              <span
                className="w-0.5 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-0.5 h-3.5 bg-indigo-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-0.5 h-2.5 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </span>
            <span className="font-semibold text-[11px] tracking-wide">
              Meta AI Voice • Reading Aloud
            </span>
          </div>
          {totalWords > 0 && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
              {Math.min(activeWordIndex + 1, totalWords)} / {totalWords} words
            </span>
          )}
        </div>
      )}

      {segments.map((seg, idx) => {
        if (seg.type === "code") {
          return (
            <CodeBlock
              key={idx}
              code={seg.content}
              language={seg.language}
              theme={theme}
            />
          );
        }

        const lines = seg.content.split("\n");
        return (
          <div key={idx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <div key={lIdx} className="h-1.5" />;
              }

              const lineStartIdx = wordCounterRef.current;

              let lineElement = null;
              if (trimmed.startsWith("### ")) {
                lineElement = (
                  <h4 key={lIdx} className="font-bold text-[15px] mt-2 mb-1 text-inherit">
                    {renderInlineFormatting(trimmed.slice(4), wordCounterRef, activeWordIndex, isSpeaking)}
                  </h4>
                );
              } else if (trimmed.startsWith("## ")) {
                lineElement = (
                  <h3 key={lIdx} className="font-bold text-[16px] mt-2 mb-1 text-inherit">
                    {renderInlineFormatting(trimmed.slice(3), wordCounterRef, activeWordIndex, isSpeaking)}
                  </h3>
                );
              } else if (trimmed.startsWith("# ")) {
                lineElement = (
                  <h2 key={lIdx} className="font-bold text-[17px] mt-2 mb-1 text-inherit">
                    {renderInlineFormatting(trimmed.slice(2), wordCounterRef, activeWordIndex, isSpeaking)}
                  </h2>
                );
              } else if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
                lineElement = (
                  <div key={lIdx} className="flex items-start gap-2 ml-1">
                    <span className="text-emerald-500 font-bold select-none">•</span>
                    <span className="flex-1">
                      {renderInlineFormatting(trimmed.slice(2), wordCounterRef, activeWordIndex, isSpeaking)}
                    </span>
                  </div>
                );
              } else {
                const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
                if (numberedMatch) {
                  lineElement = (
                    <div key={lIdx} className="flex items-start gap-2 ml-1">
                      <span className="text-[#00a884] dark:text-[#25d366] font-semibold text-xs select-none min-w-[16px]">
                        {numberedMatch[1]}.
                      </span>
                      <span className="flex-1">
                        {renderInlineFormatting(numberedMatch[2], wordCounterRef, activeWordIndex, isSpeaking)}
                      </span>
                    </div>
                  );
                } else {
                  lineElement = (
                    <p key={lIdx} className="whitespace-pre-wrap">
                      {renderInlineFormatting(line, wordCounterRef, activeWordIndex, isSpeaking)}
                    </p>
                  );
                }
              }

              const lineEndIdx = wordCounterRef.current - 1;
              const isLineActive =
                isSpeaking &&
                activeWordIndex >= lineStartIdx &&
                activeWordIndex <= lineEndIdx;

              if (isLineActive) {
                return (
                  <div
                    key={lIdx}
                    className="bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent rounded-md px-1 py-0.5 -mx-1 border-l-2 border-indigo-400 dark:border-purple-400 transition-colors duration-150"
                  >
                    {lineElement}
                  </div>
                );
              }

              return lineElement;
            })}
          </div>
        );
      })}
    </div>
  );
}

export function MetaAiImageCard({
  imageUrl,
  prompt,
  theme = "dark",
  onOpenViewer,
}) {
  const [downloading, setDownloading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!imageUrl || downloading) return;
    setDownloading(true);
    try {
      const resp = await fetch(imageUrl);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `meta-ai-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("Image downloaded");
    } catch {
      window.open(imageUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyPrompt = (e) => {
    e.stopPropagation();
    if (!prompt) return;
    navigator.clipboard?.writeText(prompt);
    toast.success("Prompt copied to clipboard");
  };

  return (
    <div className="w-full max-w-[380px] rounded-xl overflow-hidden my-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm">
      <div
        className="relative aspect-square w-full cursor-pointer overflow-hidden group bg-neutral-900 flex items-center justify-center"
        onClick={() => onOpenViewer?.(imageUrl)}
      >
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400 bg-neutral-800 animate-pulse">
            <MetaAiRing size={36} animate />
            <span className="text-xs">Generating with Flux diffusion...</span>
          </div>
        )}
        <img
          src={imageUrl}
          alt={prompt || "Meta AI generated image"}
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-102 ${loaded ? "opacity-100" : "opacity-0"
            }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <span className="text-xs text-white line-clamp-2 drop-shadow">
            {prompt ? `"${prompt}"` : "Generated by Meta AI"}
          </span>
        </div>
      </div>

      <div className="p-2.5 flex items-center justify-between gap-2 border-t border-black/10 dark:border-white/10 text-xs select-none">
        <div
          onClick={handleCopyPrompt}
          className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white truncate cursor-pointer"
          title="Click to copy prompt"
        >
          <span className="px-1.5 py-0.5 rounded-full font-mono text-[10px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 text-[#00a884] dark:text-[#25d366]">
            /imagine
          </span>
          <span className="truncate max-w-[180px]">{prompt || "AI Image"}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all cursor-pointer"
            title="Download image"
          >
            <FaDownload size={13} />
          </button>
        </div>
      </div>

      <div className="px-2.5 pb-2 pt-1 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-1.5 select-none bg-black/[0.02] dark:bg-white/[0.02]">
        <span className="text-[10px] text-gray-400 font-medium mr-0.5">🎨 Remix:</span>
        {[
          { label: "Anime", style: "anime style, vibrant Makoto Shinkai aesthetic" },
          { label: "Cyberpunk", style: "cyberpunk neon lights cinematic night 8k" },
          { label: "4K Real", style: "photorealistic 8k, ultra-detailed photography" },
          { label: "Oil Painting", style: "classical oil painting masterpiece, canvas texture" },
          { label: "Fantasy", style: "epic fantasy concept art, mystical glowing lighting" },
          { label: "3D Render", style: "Pixar 3D animated style, cute colorful octane render" },
        ].map((remix, rIdx) => (
          <button
            key={rIdx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const basePrompt = (prompt || "image").replace(/^\/imagine\s*/i, "").trim();
              const fullPrompt = `@Meta AI /imagine ${basePrompt}, ${remix.style}`;
              window.dispatchEvent(
                new CustomEvent("meta_ai_prefill", {
                  detail: { text: fullPrompt, autoSend: true },
                })
              );
            }}
            className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-black/10 dark:border-white/10 hover:border-cyan-500/50 bg-black/5 dark:bg-white/5 hover:bg-cyan-500/10 text-gray-700 dark:text-gray-300 hover:text-cyan-500 transition-all cursor-pointer active:scale-95"
            title={`Generate "${remix.label}" variation`}
          >
            {remix.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MetaAiFeedbackBar({
  messageId,
  content,
  onFeedback,
  onRegenerate,
  theme = "dark",
  persona: propPersona,
}) {
  const [feedback, setFeedback] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.05);
  const fallbackIntervalRef = useRef(null);

  const speechId = messageId || (content ? content.slice(0, 40) : "meta_ai_msg");

  const cycleSpeechRate = (e) => {
    e.stopPropagation();
    setSpeechRate((prev) => {
      const next = prev <= 1.1 ? 1.5 : prev <= 1.6 ? 2.0 : 1.05;
      toast.info(`Reading speed: ${next > 1.6 ? "2x" : next > 1.1 ? "1.5x" : "1x"}`);
      return next;
    });
  };

  const [activePersonaId, setActivePersonaId] = useState(() => {
    return propPersona || localStorage.getItem("meta_ai_persona") || "default";
  });

  useEffect(() => {
    const handlePersonaChange = (e) => {
      if (e.detail?.id) {
        setActivePersonaId(e.detail.id);
      }
    };
    window.addEventListener("meta_ai_persona_changed", handlePersonaChange);
    return () => window.removeEventListener("meta_ai_persona_changed", handlePersonaChange);
  }, []);

  const activePersonaObj = PERSONAS.find((p) => p.id === activePersonaId) || PERSONAS[0];

  useEffect(() => {
    const handleGlobalSpeech = (e) => {
      if (e.detail?.type === "stop_all" && isSpeaking) {
        if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
        setIsSpeaking(false);
      }
    };
    window.addEventListener("meta_ai_speech_event", handleGlobalSpeech);
    return () => {
      window.removeEventListener("meta_ai_speech_event", handleGlobalSpeech);
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
    };
  }, [isSpeaking]);

  const handleThumb = (type) => {
    if (feedback === type) {
      setFeedback(null);
    } else {
      setFeedback(type);
      toast.success(
        type === "up" ? "Thanks for your feedback!" : "Feedback noted. We'll improve!"
      );
      onFeedback?.(type);
    }
  };

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard?.writeText(content);
    toast.success("Response copied to clipboard");
  };

  const handleSpeak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.info("Speech synthesis not supported in this browser");
      return;
    }

    if (isSpeaking) {
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      window.dispatchEvent(
        new CustomEvent("meta_ai_speech_event", {
          detail: { type: "stop", messageId: speechId },
        })
      );
      return;
    }

    if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
    window.speechSynthesis.cancel();
    window.dispatchEvent(
      new CustomEvent("meta_ai_speech_event", {
        detail: { type: "stop_all" },
      })
    );

    const cleanText = (content || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_#`~>]/g, "")
      .replace(/🌐\s*Sources:[\s\S]*$/i, "")
      .replace(/https?:\/\/\S+/g, "")
      .trim();

    if (!cleanText) return;

    const words = [];
    const wordRegex = /\S+/g;
    let match;
    while ((match = wordRegex.exec(cleanText)) !== null) {
      words.push({
        index: words.length,
        text: match[0],
        charStart: match.index,
        charEnd: match.index + match[0].length,
      });
    }

    if (words.length === 0) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    let hasReceivedBoundary = false;
    let fallbackIndex = 0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      window.dispatchEvent(
        new CustomEvent("meta_ai_speech_event", {
          detail: {
            type: "start",
            messageId: speechId,
            totalWords: words.length,
            text: cleanText,
          },
        })
      );

      fallbackIntervalRef.current = setInterval(() => {
        if (!hasReceivedBoundary) {
          fallbackIndex++;
          if (fallbackIndex < words.length) {
            window.dispatchEvent(
              new CustomEvent("meta_ai_speech_event", {
                detail: {
                  type: "boundary",
                  messageId: speechId,
                  wordIndex: fallbackIndex,
                  charIndex: words[fallbackIndex].charStart,
                  activeWord: words[fallbackIndex].text,
                },
              })
            );
          } else {
            clearInterval(fallbackIntervalRef.current);
          }
        }
      }, Math.round(330 / utterance.rate));
    };

    utterance.onboundary = (event) => {
      hasReceivedBoundary = true;
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
      const charIdx = event.charIndex;
      let wordIdx = 0;
      for (let i = 0; i < words.length; i++) {
        if (charIdx >= words[i].charStart && charIdx <= words[i].charEnd) {
          wordIdx = i;
          break;
        }
        if (charIdx < words[i].charStart) {
          wordIdx = i > 0 ? i - 1 : 0;
          break;
        }
        wordIdx = i;
      }
      window.dispatchEvent(
        new CustomEvent("meta_ai_speech_event", {
          detail: {
            type: "boundary",
            messageId: speechId,
            wordIndex: wordIdx,
            charIndex: charIdx,
            activeWord: words[wordIdx]?.text || "",
          },
        })
      );
    };

    const handleSpeechEnd = () => {
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
      setIsSpeaking(false);
      window.dispatchEvent(
        new CustomEvent("meta_ai_speech_event", {
          detail: { type: "end", messageId: speechId },
        })
      );
    };

    utterance.onend = handleSpeechEnd;
    utterance.onerror = handleSpeechEnd;

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-black/5 dark:border-white/5 text-[11px] select-none text-gray-500 dark:text-gray-400">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleThumb("up")}
          className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${feedback === "up" ? "text-emerald-500 dark:text-emerald-400" : ""
            }`}
          title="Good response"
        >
          {feedback === "up" ? <FaThumbsUp size={12} /> : <FaRegThumbsUp size={12} />}
        </button>
        <button
          type="button"
          onClick={() => handleThumb("down")}
          className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${feedback === "down" ? "text-red-500 dark:text-red-400" : ""
            }`}
          title="Poor response"
        >
          {feedback === "down" ? <FaThumbsDown size={12} /> : <FaRegThumbsDown size={12} />}
        </button>
        <button
          type="button"
          onClick={handleSpeak}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${isSpeaking
            ? "text-indigo-600 dark:text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 animate-pulse shadow-xs"
            : "text-inherit hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          title={isSpeaking ? "Stop speaking" : "Listen to response with karaoke text highlight"}
        >
          {isSpeaking ? (
            <>
              <FaVolumeMute size={12} className="text-indigo-500 dark:text-indigo-400" />
              <span className="flex items-center gap-0.5 h-2.5">
                <span
                  className="w-0.5 h-full bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-0.5 h-2/3 bg-indigo-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-0.5 h-full bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">Speaking...</span>
            </>
          ) : (
            <FaVolumeUp size={13} />
          )}
        </button>

        <button
          type="button"
          onClick={cycleSpeechRate}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-gray-500 dark:text-gray-400 hover:text-cyan-500 transition-all cursor-pointer"
          title="Click to cycle voice reading speed (1x / 1.5x / 2x)"
        >
          {speechRate > 1.6 ? "2x" : speechRate > 1.1 ? "1.5x" : "1x"}
        </button>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("open_translate_modal", {
                detail: { text: content, messageId },
              })
            );
          }}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-inherit hover:text-cyan-500 dark:hover:text-cyan-400"
          title="Translate with Meta AI"
        >
          <HiLanguage size={14} />
        </button>

        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-inherit hover:text-black dark:hover:text-white"
            title="Try again / Regenerate"
          >
            <MdRefresh size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-inherit hover:text-black dark:hover:text-white"
          title="Copy response"
        >
          <MdContentCopy size={13} />
        </button>
      </div>

      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] tracking-wide bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 dark:from-cyan-400/15 dark:via-blue-500/15 dark:to-pink-500/15 border border-cyan-500/20 dark:border-purple-400/25 shadow-2xs select-none backdrop-blur-xs transition-all hover:scale-102 hover:border-cyan-400/40"
        title={activePersonaObj ? `AI Mode: ${activePersonaObj.name}` : "Meta AI"}
      >
        <SiMetaai size={10} className="text-[#0081fb] dark:text-[#38bdf8] shrink-0" />
        <span className="bg-gradient-to-r from-[#0077b6] via-[#6366f1] to-[#d946ef] dark:from-[#38bdf8] dark:via-[#a855f7] dark:to-[#f472b6] bg-clip-text text-transparent font-semibold">
          Meta AI
        </span>
        {activePersonaObj && activePersonaObj.id !== "default" && (
          <>
            <span className="opacity-30">•</span>
            <span className="flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300">
              <span>{activePersonaObj.icon}</span>
              <span>{activePersonaObj.shortName}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function MetaAiQuickFollowups({
  suggestions = [],
  prompt = "",
  content = "",
  onSelect,
  isLatest = true,
  theme = "dark",
}) {
  if (!isLatest) return null;

  let followups = Array.isArray(suggestions) && suggestions.length > 0 ? suggestions : [];
  if (followups.length === 0) {
    const p = (prompt || "").toLowerCase();
    const c = (content || "").toLowerCase();

    if (p.includes("/imagine") || p.includes("generate image") || p.includes("draw")) {
      followups = [
        "Make it cyberpunk neon style",
        "Change to cinematic sunset background",
        "Render in 8K photorealistic",
      ];
    } else if (p.includes("react") || c.includes("react")) {
      followups = [
        "How to install React?",
        "Explain React Hooks with examples",
        "React vs Next.js comparison",
      ];
    } else if (p.includes("python") || c.includes("python")) {
      followups = [
        "Best Python libraries",
        "Python beginner roadmap",
        "Python vs JavaScript",
      ];
    } else if (p.includes("time") || p.includes("date") || p.includes("clock")) {
      followups = [
        "Current time in New York",
        "Current time in London",
        "Time difference with UTC",
      ];
    } else if (p.includes("weather") || c.includes("weather") || c.includes("temperature")) {
      followups = [
        "Weather forecast for tomorrow",
        "Will it rain today?",
        "Weekly temperature trend",
      ];
    } else if (p.includes("who is") || p.includes("biography") || c.includes("born")) {
      followups = [
        "Career & key achievements",
        "Early life & education",
        "Net worth & current role",
      ];
    } else if (c.includes("```") || p.includes("code") || p.includes("function") || p.includes("bug")) {
      followups = [
        "Explain this code step by step",
        "Show a working usage example",
        "Add TypeScript types & error handling",
      ];
    } else if (p.includes("website") || c.includes("official website")) {
      followups = [
        "Getting started tutorial",
        "Official documentation link",
        "Key features & alternatives",
      ];
    } else {
      followups = [
        "Tell me more about this",
        "Explain in simple terms",
        "Give me practical examples",
      ];
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-black/5 dark:border-white/5 select-none">
      <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-medium mr-0.5">
        <span className="text-cyan-500 text-[11px]">✨</span>
        <span>Suggestions:</span>
      </span>
      {followups.map((text, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect?.(text)}
          className={`group flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer hover:scale-102 active:scale-95 shadow-2xs ${theme === "dark"
            ? "bg-[#202c33] hover:bg-[#2a3942] text-gray-200 hover:text-white border-white/10 hover:border-cyan-500/40"
            : "bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-black/10 hover:border-cyan-600/40"
            }`}
          title={`Click to ask: "${text}"`}
        >
          <span>{text}</span>
          <span className="text-[10px] opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-cyan-500 font-bold">
            ↗
          </span>
        </button>
      ))}
    </div>
  );
}

export function MetaAiThumbnailGallery({ images = [], onOpenViewer, theme = "dark" }) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const displayImages = images.slice(0, 5);

  return (
    <div className="my-2 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 select-none">
      <style>{`
        @keyframes imgPanLR {
          0% { transform: scale(1.18) translateX(-7%); }
          100% { transform: scale(1.18) translateX(7%); }
        }
        @keyframes shineSweepLR {
          0% { transform: translateX(-160%) skewX(-20deg); }
          100% { transform: translateX(160%) skewX(-20deg); }
        }
        .group:hover .animate-pan-lr {
          animation: imgPanLR 2.4s ease-in-out infinite alternate;
        }
        .group:hover .animate-shine-lr {
          animation: shineSweepLR 2.4s ease-in-out infinite alternate;
        }
      `}</style>
      <div className="flex items-center justify-between mb-1.5 px-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block animate-pulse" />
          <span>Web Images</span>
        </span>
        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
          {displayImages.length} {displayImages.length === 1 ? "image" : "images"}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {displayImages.map((img, idx) => (
          <div
            key={idx}
            onClick={() => onOpenViewer?.(img.imageUrl)}
            className="group relative aspect-square rounded-lg overflow-hidden border border-black/10 dark:border-white/15 bg-black/10 dark:bg-white/10 cursor-pointer shadow-xs transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
            title={img.title || "Click to view full image"}
          >
            <img
              src={img.imageUrl}
              alt={img.title || "Search image"}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              className="w-full h-full object-cover transition-transform duration-300 ease-out animate-pan-lr"
            />
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 dark:via-white/20 to-transparent animate-shine-lr" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
