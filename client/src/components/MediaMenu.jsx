import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiExternalLink } from "react-icons/fi";

const MediaMenu = ({
  isOpen,
  onClose,
  item,
  position = { top: 0, left: 0 },
  isStarred = false,
  canReplyPrivately = true,
  onOpenLink,
  onSelect,
  onGoToMessage,
  onReply,
  onReplyPrivately,
  onDownload,
  onCopy,
  onForward,
  onToggleStar,
  onStar,
  onDelete,
  theme = "dark",
}) => {
  const menuRef = useRef(null);
  const isDark = theme === "dark";
  const toggleStarAction = onToggleStar || onStar;
  const isLinkItem = Boolean(item?.url && !item?.imageOrVideoUrl && !item?.docUrl);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    const handleScroll = () => {
      onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const menuWidth = 210;
  const menuHeight = 430;
  let top = position?.top || 0;
  let left = position?.left || 0;

  if (typeof window !== "undefined") {
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12;
    }
    if (left < 12) left = 12;
    if (top + menuHeight > window.innerHeight - 12) {
      const buttonTop = position?.buttonTop || top;
      top = Math.max(12, buttonTop - menuHeight - 4);
    }
  }

  const handleAction = (callback) => {
    onClose?.();
    callback?.(item);
  };

  const menuContent = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] select-none"
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose?.();
        }}
      >
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.92, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -4 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={{
            top: `${top}px`,
            left: `${left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
          className={`fixed right-0 w-[220px] py-1.5 rounded-2xl shadow-2xl border backdrop-blur-md z-[10000] text-[14.5px] font-normal ${isDark
            ? "bg-[#233138] border-[#313d45] text-[#d1d7db] shadow-[0_4px_24px_rgba(0,0,0,0.65)]"
            : "bg-white border-gray-200 text-[#3b4a54] shadow-[0_4px_24px_rgba(0,0,0,0.18)]"
            }`}
        >
          <button
            type="button"
            onClick={() => handleAction(onSelect)}
            className={`w-[calc(100%-8px)] mx-1 px-4 py-2.5 flex items-center gap-3.5 text-left rounded-lg transition-all duration-200 cursor-pointer group ${isDark
              ? "hover:bg-[#182229] active:bg-[#111b21]"
              : "hover:bg-[#f0f2f5] active:bg-[#e8ebee]"
              }`}
          >
            <span
              className={`shrink-0 transition-colors ${isDark ? "text-[#8696a0] group-hover:text-white" : "text-[#54656f] group-hover:text-[#111b21]"
                }`}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
            <span className="leading-tight">Select</span>
          </button>
          {(item?.url || onOpenLink) && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onOpenLink) {
                    handleAction(onOpenLink);
                  } else if (item?.url) {
                    window.open(item.url, "_blank", "noopener,noreferrer");
                    onClose?.();
                  }
                }}
                className={`w-[calc(100%-8px)] mx-1 px-4 py-2.5 flex items-center gap-3.5 text-left rounded-lg transition-all duration-200 cursor-pointer group ${isDark
                  ? "hover:bg-[#182229] active:bg-[#111b21]"
                  : "hover:bg-[#f0f2f5] active:bg-[#e8ebee]"
                  }`}
              >
                <span
                  className={`shrink-0 transition-colors ${isDark ? "text-[#8696a0] group-hover:text-white" : "text-[#54656f] group-hover:text-[#111b21]"
                    }`}
                >
                  <FiExternalLink size={18} />
                </span>
                <span className="leading-tight">Open link in a new tab</span>
              </button>

              <div
                className={`my-1 border-t ${isDark ? "border-[#374248]/70" : "border-gray-200"
                  }`}
              />
            </>
          )}

          <button
            type="button"
            onClick={() => handleAction(onGoToMessage)}
            className={`w-[calc(100%-8px)] mx-1 px-4 py-2.5 flex items-center gap-3.5 text-left rounded-lg transition-all duration-200 cursor-pointer group ${isDark
              ? "hover:bg-[#182229] active:bg-[#111b21]"
              : "hover:bg-[#f0f2f5] active:bg-[#e8ebee]"
              }`}
          >
            <span
              className={`shrink-0 transition-colors ${isDark ? "text-[#8696a0] group-hover:text-white" : "text-[#54656f] group-hover:text-[#111b21]"
                }`}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <line x1="8" y1="9" x2="16" y2="9" />
                <line x1="8" y1="13" x2="14" y2="13" />
              </svg>
            </span>
            <span className="leading-tight">Go to message</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onReply)}
            className={`w-[calc(100%-8px)] mx-1 px-4 py-2.5 flex items-center gap-3.5 text-left rounded-lg transition-all duration-200 cursor-pointer group ${isDark
              ? "hover:bg-[#182229] active:bg-[#111b21]"
              : "hover:bg-[#f0f2f5] active:bg-[#e8ebee]"
              }`}
          >
            <span
              className={`shrink-0 transition-colors ${isDark ? "text-[#8696a0] group-hover:text-white" : "text-[#54656f] group-hover:text-[#111b21]"
                }`}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 14 4 9 9 4" />
                <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
              </svg>
            </span>
            <span className="leading-tight">Reply</span>
          </button>

          {canReplyPrivately && (
            <button
              type="button"
              onClick={() => handleAction(onReplyPrivately)}
              className={`w-[calc(100%-8px)] mx-1 px-4 py-2.5 flex items-center gap-3.5 text-left rounded-lg transition-all duration-200 cursor-pointer group ${isDark
                ? "hover:bg-[#182229] active:bg-[#111b21]"
                : "hover:bg-[#f0f2f5] active:bg-[#e8ebee]"
                }`}
            >
              <span
                className={`shrink-0 transition-colors ${isDark ? "text-[#8696a0] group-hover:text-white" : "text-[#54656f] group-hover:text-[#111b21]"
                  }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="15" cy="7" r="3.5" />
                  <path d="M19.5 19v-1a4 4 0 0 0-4-4h-2.5" />
                  <polyline points="7 14 3 18 7 22" />
                  <path d="M3 18h7a3 3 0 0 0 3-3v-1" />
                </svg>
              </span>
              <span className="leading-tight">Reply privately</span>
            </button>
          )}

          {!isLinkItem && onDownload && (
            <button
              type="button"
              onClick={() => handleAction(onDownload)}
              className={`w-[calc(100%-8px)] mx-1 px-4 py-2.5 flex items-center gap-3.5 text-left rounded-lg transition-all duration-200 cursor-pointer group ${isDark
                ? "hover:bg-[#182229] active:bg-[#111b21]"
                : "hover:bg-[#f0f2f5] active:bg-[#e8ebee]"
                }`}
            >
              <span
                className={`shrink-0 transition-colors ${isDark ? "text-[#8696a0] group-hover:text-white" : "text-[#54656f] group-hover:text-[#111b21]"
                  }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </span>
              <span className="leading-tight">Download</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleAction(onCopy)}
            className={`w-[calc(100%-8px)] mx-1 px-4 py-2.5 flex items-center gap-3.5 text-left rounded-lg transition-all duration-200 cursor-pointer group ${isDark
              ? "hover:bg-[#182229] active:bg-[#111b21]"
              : "hover:bg-[#f0f2f5] active:bg-[#e8ebee]"
              }`}
          >
            <span
              className={`shrink-0 transition-colors ${isDark ? "text-[#8696a0] group-hover:text-white" : "text-[#54656f] group-hover:text-[#111b21]"
                }`}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </span>
            <span className="leading-tight">{isLinkItem ? "Copy link" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onForward)}
            className={`w-[calc(100%-8px)] mx-1 px-4 py-2.5 flex items-center gap-3.5 text-left rounded-lg transition-all duration-200 cursor-pointer group ${isDark
              ? "hover:bg-[#182229] active:bg-[#111b21]"
              : "hover:bg-[#f0f2f5] active:bg-[#e8ebee]"
              }`}
          >
            <span
              className={`shrink-0 transition-colors ${isDark ? "text-[#8696a0] group-hover:text-white" : "text-[#54656f] group-hover:text-[#111b21]"
                }`}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 7 20 12 15 17" />
                <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                <polyline points="10 7 15 12 10 17" />
              </svg>
            </span>
            <span className="leading-tight">Forward</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(toggleStarAction)}
            className={`w-[calc(100%-8px)] mx-1 px-4 py-2.5 flex items-center gap-3.5 text-left rounded-lg transition-all duration-200 cursor-pointer group ${isDark
              ? "hover:bg-[#182229] active:bg-[#111b21]"
              : "hover:bg-[#f0f2f5] active:bg-[#e8ebee]"
              }`}
          >
            <span
              className={`shrink-0 transition-colors ${isStarred
                ? "text-amber-400"
                : isDark
                  ? "text-[#8696a0] group-hover:text-white"
                  : "text-[#54656f] group-hover:text-[#111b21]"
                }`}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill={isStarred ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            <span className="leading-tight">
              {isStarred ? "Unstar" : "Star"}
            </span>
          </button>

          <div
            className={`my-1 border-t ${isDark ? "border-[#374248]/70" : "border-gray-200"
              }`}
          />

          <button
            type="button"
            onClick={() => handleAction(onDelete)}
            className={`w-[calc(100%-8px)] mx-1 px-4 py-2.5 flex items-center gap-3.5 text-left rounded-lg transition-all duration-200 cursor-pointer group ${isDark
              ? "hover:bg-rose-500/10 active:bg-rose-500/15"
              : "hover:bg-rose-50 active:bg-rose-100/70"
              }`}
          >
            <span className="shrink-0 text-[#ea868f] transition-transform group-hover:scale-105">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </span>
            <span className="leading-tight text-[#ea868f] font-medium">
              Delete
            </span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined"
    ? createPortal(menuContent, document.body)
    : null;
};

export default MediaMenu;