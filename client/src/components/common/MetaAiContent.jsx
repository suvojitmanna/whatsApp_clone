import React, { useState } from "react";
import { FaCopy, FaCheck, FaDownload, FaThumbsUp, FaThumbsDown, FaRegThumbsUp, FaRegThumbsDown } from "react-icons/fa";
import { MdContentCopy, MdRefresh } from "react-icons/md";
import { SiMetaai } from "react-icons/si";
import { toast } from "react-toastify";
import { MetaAiRing } from "./MetaAiIcon";

function renderInlineFormatting(text) {
  if (!text) return null;
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((codePart, cIdx) => {
    if (codePart.startsWith("`") && codePart.endsWith("`") && codePart.length >= 2) {
      return (
        <code
          key={`code-${cIdx}`}
          className="px-1.5 py-0.5 mx-0.5 rounded text-[13px] font-mono bg-black/10 dark:bg-white/10 text-pink-600 dark:text-pink-400"
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
            {mdMatch[1]}
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
            {linkPart}
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
            {linkPart}
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
              {clean}
            </strong>
          );
        }
        return bPart;
      });
    });
  });
}
function CodeBlock({ code, language, theme }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[13px]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] text-xs text-gray-300 border-b border-white/5 select-none">
        <span className="font-medium lowercase text-gray-400">{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/10 active:scale-95 transition-all cursor-pointer text-gray-300 hover:text-white"
        >
          {copied ? <FaCheck size={11} className="text-emerald-400" /> : <FaCopy size={11} />}
          <span>{copied ? "Copied" : "Copy code"}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto whitespace-pre font-mono leading-relaxed select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MetaAiMarkdown({ content, theme = "dark" }) {
  if (!content) return null;

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

              if (trimmed.startsWith("### ")) {
                return (
                  <h4 key={lIdx} className="font-bold text-[15px] mt-2 mb-1 text-inherit">
                    {renderInlineFormatting(trimmed.slice(4))}
                  </h4>
                );
              }
              if (trimmed.startsWith("## ")) {
                return (
                  <h3 key={lIdx} className="font-bold text-[16px] mt-2 mb-1 text-inherit">
                    {renderInlineFormatting(trimmed.slice(3))}
                  </h3>
                );
              }
              if (trimmed.startsWith("# ")) {
                return (
                  <h2 key={lIdx} className="font-bold text-[17px] mt-2 mb-1 text-inherit">
                    {renderInlineFormatting(trimmed.slice(2))}
                  </h2>
                );
              }

              if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 ml-1">
                    <span className="text-emerald-500 font-bold select-none">•</span>
                    <span className="flex-1">{renderInlineFormatting(trimmed.slice(2))}</span>
                  </div>
                );
              }

              const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
              if (numberedMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 ml-1">
                    <span className="text-[#00a884] dark:text-[#25d366] font-semibold text-xs select-none min-w-[16px]">
                      {numberedMatch[1]}.
                    </span>
                    <span className="flex-1">{renderInlineFormatting(numberedMatch[2])}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="whitespace-pre-wrap">
                  {renderInlineFormatting(line)}
                </p>
              );
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
    </div>
  );
}

export function MetaAiFeedbackBar({ content, onFeedback, onRegenerate, theme = "dark" }) {
  const [feedback, setFeedback] = useState(null);

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

  return (
    <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/5 dark:border-white/5 text-[11px] select-none text-gray-500 dark:text-gray-400">
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

      <span className="text-[10px] opacity-60 font-mono">Llama 3</span>
    </div>
  );
}

export function MetaAiQuickFollowups({ onSelect, isLatest = true, theme = "dark" }) {
  if (!isLatest) return null;
  const followups = ["Tell me more", "Explain simply", "Give an example"];

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-black/5 dark:border-white/5 select-none">
      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mr-0.5">Suggestions:</span>
      {followups.map((text, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect?.(text)}
          className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs ${theme === "dark"
              ? "bg-[#202c33] hover:bg-[#2a3942] text-gray-300 border-white/10"
              : "bg-white hover:bg-gray-100 text-gray-700 border-black/10"
            }`}
        >
          {text}
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
            className="group relative aspect-square rounded-lg overflow-hidden border border-black/10 dark:border-white/15 bg-black/10 dark:bg-white/10 cursor-pointer shadow-xs hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
            title={img.title || "Click to view full image"}
          >
            <img
              src={img.imageUrl}
              alt={img.title || "Search image"}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-[10px] drop-shadow">🔍</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
