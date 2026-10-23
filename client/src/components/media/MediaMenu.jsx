import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiExternalLink } from "react-icons/fi";
import {
  SelectCheckboxIcon,
  GoToMessageIcon,
  ReplyArrowIcon,
  ReplyPrivatelyIcon,
  DownloadIcon,
  CopyIcon,
  ForwardDoubleArrowIcon,
  StarIcon,
  TrashBinIcon,
} from "../common/Icons";

const MediaMenu = ({
  isOpen,
  onClose,
  item,
  type,
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
  const isLinkItem = Boolean(
    type === "link" ||
    item?.type === "link" ||
    item?.contentType === "link" ||
    item?.mediaType === "link" ||
    item?.domain ||
    (item?.url &&
      !item?.imageOrVideoUrl &&
      !item?.docUrl &&
      !item?.fileUrl &&
      !item?.docName &&
      !item?.fileName &&
      item?.mediaType !== "image" &&
      item?.mediaType !== "video" &&
      item?.contentType !== "image" &&
      item?.contentType !== "video" &&
      item?.contentType !== "document")
  );

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
              <SelectCheckboxIcon />
            </span>
            <span className="leading-tight">Select</span>
          </button>
          {isLinkItem && (
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
              <GoToMessageIcon />
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
              <ReplyArrowIcon />
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
                <ReplyPrivatelyIcon />
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
                <DownloadIcon />
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
              <CopyIcon />
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
              <ForwardDoubleArrowIcon />
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
              <StarIcon filled={isStarred} />
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
              <TrashBinIcon />
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