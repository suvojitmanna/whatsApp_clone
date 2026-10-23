import React from "react";
import { FaCamera, FaFileAlt, FaHeadphones, FaImage, FaMicrophone } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { FaSquarePollHorizontal } from "react-icons/fa6";
import { MdEventNote, MdBlock, MdLink, MdAddReaction } from "react-icons/md";
import { TfiClip } from "react-icons/tfi";
import { RiContactsFill, RiEmojiStickerLine, RiDeleteBin6Line } from "react-icons/ri";
import EmojiPicker from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import { MetaAiRing } from "../../../components/common/MetaAiIcon";
import ReplyPreviewBar from "./ReplyPreviewBar";

export const ChatInputBar = ({
  theme,
  isBlocked,
  setShowDeleteConfirm,
  handleUnblockContact,
  replyingTo,
  setReplyingTo,
  user,
  selectedContact,
  getReplyPreviewText,
  fileMenuRef,
  showFileMenu,
  setShowFileMenu,
  fileInputRef,
  documentInputRef,
  audioInputRef,
  stickerInputRef,
  handleFileChange,
  setShowCamera,
  setShowContactModal,
  setShowPollModal,
  setShowEventModal,
  setShowStickerModal,
  setShowCallLinkModal,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiPickerRef,
  message,
  setMessage,
  showMentionPopover,
  setShowMentionPopover,
  handleSelectMention,
  messageInputRef,
  isMetaAiChat,
  handleSendMessage,
  isSending,
  selectedFiles = [],
}) => {
  if (isBlocked) {
    return (
      <div
        className={`p-3 sm:p-4 select-none flex items-center justify-center gap-3.5 sm:gap-4 border-t transition-colors ${theme === "dark"
          ? "bg-[#202c33] border-[#222d34]"
          : "bg-[#f0f2f5] border-gray-200"
          }`}
      >
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2 rounded-full border border-gray-300 dark:border-white/15 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer select-none"
        >
          <RiDeleteBin6Line className="text-[17px] text-[#ea868f] shrink-0" />
          <span className="text-[#ea868f] font-medium text-[14px] sm:text-[14.5px]">
            Delete chat
          </span>
        </button>

        <button
          type="button"
          onClick={handleUnblockContact}
          className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2 rounded-full border border-gray-300 dark:border-white/15 hover:bg-[#00a884]/10 active:scale-95 transition-all cursor-pointer select-none"
        >
          <MdBlock className="text-[17px] text-[#00a884] shrink-0" />
          <span className="text-[#00a884] font-medium text-[14px] sm:text-[14.5px]">
            Unblock
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`p-2.5 sm:p-3 border-t flex flex-col relative transition-colors ${theme === "dark"
        ? "bg-[#202c33] border-[#222d34]"
        : "bg-[#f0f2f5] border-gray-200"
        }`}
    >
      <ReplyPreviewBar
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        theme={theme}
        user={user}
        selectedContact={selectedContact}
        getReplyPreviewText={getReplyPreviewText}
      />

      <div
        className={`relative w-full flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1.5 rounded-full transition-all duration-200 border ${theme === "dark"
          ? "bg-[#2a3942] border-white/5 hover:border-emerald-500/50 hover:bg-[#32424b] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
          : "bg-white shadow-sm border-gray-200 hover:border-emerald-500/50 hover:bg-gray-50 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
          }`}
      >
        <div className="relative shrink-0" ref={fileMenuRef}>
          <button
            type="button"
            className={`focus:outline-none p-2 rounded-full border border-transparent transition-all duration-200 cursor-pointer active:scale-95 ${showFileMenu
              ? "bg-black/10 dark:bg-white/15 border-black/15 dark:border-white/20 scale-105"
              : "hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/15 hover:scale-105"
              }`}
            onClick={() => setShowFileMenu(!showFileMenu)}
            title="Attach"
          >
            <TfiClip
              className={`h-5 w-5 transform transition-transform duration-200 ${showFileMenu ? "rotate-45" : ""
                } ${theme === "dark"
                  ? "text-gray-400"
                  : "text-gray-500"
                }`}
            />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e, "media")}
            accept="image/*,video/*"
            multiple
            className="hidden"
          />

          <input
            type="file"
            ref={documentInputRef}
            onChange={(e) => handleFileChange(e, "document")}
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv,application/*"
            multiple
            className="hidden"
          />

          <input
            type="file"
            ref={audioInputRef}
            onChange={(e) => handleFileChange(e, "audio")}
            accept="audio/*"
            multiple
            className="hidden"
          />

          <input
            type="file"
            ref={stickerInputRef}
            onChange={(e) => handleFileChange(e, "sticker")}
            accept="image/png,image/webp,image/gif,image/jpeg"
            className="hidden"
          />

          <AnimatePresence>
            {showFileMenu && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.85,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.85,
                  y: 15,
                }}
                transition={{
                  duration: 0.16,
                  ease: "easeOut",
                }}
                className={`absolute bottom-full left-0 sm:-left-6 mb-4 sm:mb-7 w-[230px] sm:w-56 rounded-2xl p-2 z-50 border shadow-2xl backdrop-blur-xl ${theme === "dark"
                  ? "bg-[#233138] border-white/10 text-[#e9edef] shadow-black/70"
                  : "bg-white border-gray-100 text-[#3b4a54] shadow-black/15"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowFileMenu(false);
                    documentInputRef.current?.click();
                  }}
                  title="Send document"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#7f66ff] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                    <FaFileAlt className="text-white text-[16px]" />
                  </div>
                  <span className="text-[14px] font-medium tracking-tight">
                    Document
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFileMenu(false);
                    fileInputRef.current?.click();
                  }}
                  title="Send photos & videos"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#007bfc] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                    <FaImage className="text-white text-[16px]" />
                  </div>
                  <span className="text-[14px] font-medium tracking-tight">
                    Photos & videos
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFileMenu(false);
                    setShowCamera(true);
                  }}
                  title="Take photo with camera"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#ff2e74] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                    <FaCamera className="text-white text-[16px]" />
                  </div>
                  <span className="text-[14px] font-medium tracking-tight">
                    Camera
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFileMenu(false);
                    audioInputRef.current?.click();
                  }}
                  title="Send audio"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#f2790f] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                    <FaHeadphones className="text-white text-[16px]" />
                  </div>
                  <span className="text-[14px] font-medium tracking-tight">
                    Audio
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFileMenu(false);
                    setShowContactModal(true);
                  }}
                  title="Share contact"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#009de2] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                    <RiContactsFill className="text-white text-[17px]" />
                  </div>
                  <span className="text-[14px] font-medium tracking-tight">
                    Contact
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFileMenu(false);
                    setShowPollModal(true);
                  }}
                  title="Create poll"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#ffb703] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                    <FaSquarePollHorizontal className="text-white text-[17px]" />
                  </div>
                  <span className="text-[14px] font-medium tracking-tight">
                    Poll
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFileMenu(false);
                    setShowEventModal(true);
                  }}
                  title="Create event"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#a855f7] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                    <MdEventNote className="text-white text-[17px]" />
                  </div>
                  <span className="text-[14px] font-medium tracking-tight">
                    Event
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFileMenu(false);
                    setShowStickerModal(true);
                  }}
                  title="Send sticker"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#02b875] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                    <MdAddReaction className="text-white text-[17px]" />
                  </div>
                  <span className="text-[14px] font-medium tracking-tight">
                    New sticker
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFileMenu(false);
                    setShowCallLinkModal(true);
                  }}
                  title="Share call link"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                    <MdLink className="text-white text-[19px] transform -rotate-45" />
                  </div>
                  <span className="text-[14px] font-medium tracking-tight">
                    Call link
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            className="focus:outline-none p-2 rounded-full border border-transparent hover:border-black/10 dark:hover:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emoji and stickers"
          >
            <RiEmojiStickerLine
              className={`h-5 w-5 sm:h-6 sm:w-6 transition-colors ${theme === "dark"
                ? "text-gray-400 hover:text-emerald-400"
                : "text-gray-500 hover:text-emerald-600"
                }`}
            />
          </button>

          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute left-0 sm:left-4 bottom-14 sm:bottom-16 z-50 shadow-2xl"
            >
              <EmojiPicker
                onEmojiClick={(emojiObject) => {
                  if (emojiObject?.emoji) {
                    setMessage((prev) => prev + emojiObject.emoji);
                  }
                  setShowEmojiPicker(false);
                }}
                theme={theme}
              />
            </div>
          )}
        </div>

        {showMentionPopover && (
          <div
            className={`absolute left-4 bottom-full mb-3 w-72 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-fade-in ${theme === "dark"
              ? "bg-[#202c33] border-white/10 text-white"
              : "bg-white border-black/10 text-gray-900"
              }`}
          >
            <div className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 border-b border-black/5 dark:border-white/5 select-none flex items-center justify-between">
              <span>Mention</span>
              <span className="text-[10px] text-gray-400 normal-case">Tab to insert</span>
            </div>
            <div
              onClick={handleSelectMention}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"
                }`}
            >
              <MetaAiRing size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm">Meta AI</span>
                </div>
                <p className="text-xs text-gray-400 truncate">
                  with Llama • Ask anything or type /imagine
                </p>
              </div>
            </div>
          </div>
        )}

        <input
          ref={messageInputRef}
          type="text"
          value={message}
          onChange={(e) => {
            const val = e.target.value;
            setMessage(val);
            const lastWord = val.split(/\s/).pop();
            if (lastWord && lastWord.startsWith("@") && !isMetaAiChat) {
              setShowMentionPopover(true);
            } else {
              setShowMentionPopover(false);
            }
          }}
          onKeyDown={(e) => {
            if (showMentionPopover && (e.key === "Tab" || e.key === "Enter")) {
              e.preventDefault();
              handleSelectMention();
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            } else if (e.key === "Escape") {
              if (showMentionPopover) {
                setShowMentionPopover(false);
              } else if (replyingTo) {
                setReplyingTo(null);
              }
            }
          }}
          placeholder={
            isMetaAiChat
              ? "Ask Meta AI or type /imagine..."
              : "Type a message or @Meta AI"
          }
          className={`flex-1 min-w-0 w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm sm:text-base transition-colors ${theme === "dark"
            ? "text-white placeholder-gray-400 hover:placeholder-gray-300"
            : "text-black placeholder-gray-500 hover:placeholder-gray-400"
            }`}
        />

        {message.trim() || (selectedFiles && selectedFiles.length > 0) ? (
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={isSending}
            className="shrink-0 p-2 sm:p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 hover:scale-105 active:scale-90 text-white shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-50"
            title={isSending ? "Sending..." : "Send message"}
          >
            {isSending ? (
              <div className="h-4 w-4 sm:h-4.5 sm:w-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <IoSend className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
            )}
          </button>
        ) : (
          <button
            type="button"
            className="shrink-0 p-2 sm:p-2.5 rounded-full border border-transparent text-gray-500 dark:text-[#8696a0] hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/15 transition-all cursor-pointer"
            title="Voice message"
          >
            <FaMicrophone className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInputBar;
