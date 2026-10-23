import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus } from "react-icons/fa";
import { BsEmojiSmile } from "react-icons/bs";
import { RxCross2 } from "react-icons/rx";
import EmojiPicker from "emoji-picker-react";

export const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export const MessageReactionsHoverPicker = ({
  isUserMessage,
  isDark,
  theme,
  showReactions,
  setShowReactions,
  reactionsMenuRef,
  message,
  currentUserId,
  handleReact,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiPickerRef,
}) => {
  return (
    <div
      className={`absolute ${isUserMessage ? "-left-8" : "-right-8"
        } top-1/2 -translate-y-1/2 flex flex-col items-center z-10`}
    >
      <AnimatePresence>
        {showReactions && (
          <motion.div
            ref={reactionsMenuRef}
            initial={{ opacity: 0, scale: 0.85, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={`absolute bottom-full mb-2 flex items-center rounded-full px-2 py-1.5 gap-0.5 shadow-xl border z-50 ${isDark
              ? "bg-[#233138]/95 border-white/10 backdrop-blur-md"
              : "bg-white/95 border-black/[0.06] backdrop-blur-md"
              }`}
          >
            {quickReactions.map((emoji, index) => {
              const isSelected = (message.reactions || []).some(
                (r) =>
                  String(r.userId?._id || r.userId) === String(currentUserId) &&
                  r.emoji === emoji
              );
              return (
                <button
                  key={index}
                  onClick={() => handleReact(emoji)}
                  className={`text-lg hover:scale-125 transition-transform duration-150 p-1.5 rounded-full cursor-pointer ${isSelected
                    ? "bg-emerald-500/25 ring-1 ring-emerald-500 scale-110"
                    : "hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                    }`}
                  title={isSelected ? "Click to remove" : `React ${emoji}`}
                >
                  {emoji}
                </button>
              );
            })}

            <div
              className={`w-px h-5 mx-1 ${isDark ? "bg-white/15" : "bg-black/10"
                }`}
            />

            <button
              className={`rounded-full p-1.5 cursor-pointer transition-colors ${isDark
                ? "hover:bg-white/10 text-gray-300"
                : "hover:bg-black/[0.06] text-gray-600"
                }`}
              onClick={() => setShowEmojiPicker((prev) => !prev)}
            >
              <FaPlus className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            ref={emojiPickerRef}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999]"
            style={{
              bottom: "80px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <EmojiPicker
                onEmojiClick={(emojiObject) =>
                  handleReact(emojiObject.emoji)
                }
                theme={theme}
              />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(false);
                }}
                className={`absolute top-2 right-2 rounded-full p-1.5 shadow-md transition-colors ${isDark
                  ? "bg-[#202c33] text-gray-300 hover:bg-[#2a3942]"
                  : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
              >
                <RxCross2 className="cursor-pointer" size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowReactions((prev) => !prev);
        }}
        className={`w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${showReactions
          ? "opacity-100 bg-black/10 dark:bg-white/10"
          : "opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
          }`}
        title="React"
      >
        <BsEmojiSmile
          size={16}
          className={isDark ? "text-[#8696a0] hover:text-[#e9edef]" : "text-[#54656f] hover:text-[#111b21]"}
        />
      </button>
    </div>
  );
};

export const MessageReactionBadge = ({
  reactionBadgeRef,
  setShowReactionDetails,
  isUserMessage,
  isDark,
  uniqueReactions,
  validReactions,
}) => {
  if (!validReactions || validReactions.length === 0) return null;

  return (
    <button
      ref={reactionBadgeRef}
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setShowReactionDetails(true);
      }}
      title="View reactions"
      className={`absolute -bottom-2.5 z-20 flex items-center px-1.5 py-0.5 rounded-full border transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer select-none ${isUserMessage ? "right-2" : "left-2"
        } ${isDark
          ? "bg-[#202c33] border-[#222e35] shadow-[0_1px_3px_rgba(0,0,0,0.45)] hover:bg-[#26343d]"
          : "bg-white border-[#e9edef] shadow-[0_1px_3px_rgba(11,20,26,0.18)] hover:bg-[#f5f6f6]"
        }`}
    >
      <div className="flex items-center -space-x-0.5">
        {uniqueReactions.slice(0, 3).map((emoji, index) => (
          <span
            key={index}
            className="text-[13px] leading-none select-none inline-block"
          >
            {emoji}
          </span>
        ))}
      </div>
      {validReactions.length > 1 && (
        <span
          className={`text-[11px] font-medium ml-1 leading-none ${isDark ? "text-[#8696a0]" : "text-[#667781]"
            }`}
        >
          {validReactions.length}
        </span>
      )}
    </button>
  );
};
