import React, { useState } from "react";
import { RxCross2 } from "react-icons/rx";
import { FaCopy, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";
import { MetaAiRing } from "../common/MetaAiIcon";
import { MetaAiMarkdown } from "../common/MetaAiContent";

export default function ChatSummaryModal({
  isOpen,
  onClose,
  summary,
  messageCount = 0,
  isLoading = false,
  theme = "dark",
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard?.writeText(summary);
    setCopied(true);
    toast.success("Summary copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-[560px] max-h-[85vh] rounded-2xl flex flex-col shadow-2xl border overflow-hidden ${theme === "dark"
          ? "bg-[#1f2c34] border-white/10 text-white"
          : "bg-white border-black/10 text-gray-900"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10 select-none">
          <div className="flex items-center gap-2.5">
            <MetaAiRing size={28} showInnerIcon={false} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">Conversation Summary</h3>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-gradient-to-r from-blue-500/20 to-pink-500/20 text-cyan-400 border border-cyan-500/30">
                  Meta AI
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {messageCount > 0
                  ? `Analyzed recent ${messageCount} messages`
                  : "AI-generated executive briefing"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <RxCross2 size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 text-sm leading-relaxed select-text space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
              <MetaAiRing size={48} animate />
              <span className="text-sm font-medium animate-pulse">
                Analyzing conversation & generating summary...
              </span>
            </div>
          ) : summary ? (
            <MetaAiMarkdown content={summary} theme={theme} />
          ) : (
            <p className="text-gray-400 text-center py-8">
              No summary available for this conversation.
            </p>
          )}
        </div>

        {!isLoading && summary && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-black/5 dark:border-white/10 select-none bg-black/5 dark:bg-white/5">
            <span className="text-[11px] text-gray-400 font-mono">
              ⚡ Powered by Meta AI
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all cursor-pointer active:scale-95"
              >
                {copied ? <FaCheck size={12} className="text-emerald-400" /> : <FaCopy size={12} />}
                <span>{copied ? "Copied" : "Copy Summary"}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
