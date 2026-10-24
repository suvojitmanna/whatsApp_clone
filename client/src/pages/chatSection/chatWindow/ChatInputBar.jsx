import React, { useState, useMemo, useEffect } from "react";
import { FaCamera, FaFileAlt, FaHeadphones, FaImage, FaMicrophone, FaUsers } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { FaSquarePollHorizontal } from "react-icons/fa6";
import { MdEventNote, MdBlock, MdLink, MdAddReaction } from "react-icons/md";
import { TfiClip } from "react-icons/tfi";
import { RiContactsFill, RiEmojiStickerLine, RiDeleteBin6Line } from "react-icons/ri";
import EmojiPicker from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import { MetaAiRing } from "../../../components/common/MetaAiIcon";
import ReplyPreviewBar from "./ReplyPreviewBar";

const getAvatarColor = (name) => {
  const colors = [
    "#00a884", "#128c7e", "#25d366", "#34b7f1", "#e542a3",
    "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#00bcd4",
    "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b",
    "#ffc107", "#ff9800", "#ff5722", "#795548", "#607d8b"
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

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
  isGroupChat = false,
  groupParticipants = [],
  groupAdmins = [],
}) => {
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredMentionItems = useMemo(() => {
    if (!showMentionPopover) return [];
    const items = [];
    const q = (mentionQuery || "").trim().toLowerCase();
    if (isGroupChat) {
      if (!q || "all".includes(q) || "everyone".includes(q) || "@all".includes(q)) {
        items.push({
          type: "all",
          id: "all",
          tag: "@all",
          name: "@all",
          badge: "Everyone",
          description: "Notify all members in this group",
        });
      }

      const currentUid = (user?._id || user?.id)?.toString();
      const adminSet = new Set((groupAdmins || []).map(String));

      (groupParticipants || []).forEach((member) => {
        const mId = (member?._id || member?.id || member)?.toString();
        const username =
          member?.username ||
          member?.name ||
          member?.displayName ||
          "Member";
        const isMe = Boolean(currentUid && mId && mId === currentUid);
        const isAdmin = Boolean(mId && adminSet.has(mId));

        const matches =
          !q ||
          username.toLowerCase().includes(q) ||
          (member?.about && member.about.toLowerCase().includes(q)) ||
          (member?.phoneNumber && member.phoneNumber.includes(q));

        if (matches) {
          items.push({
            type: "member",
            id: mId || username,
            tag: `@${username}`,
            name: username,
            isMe,
            isAdmin,
            avatar:
              member?.profilePicture ||
              member?.profilePic ||
              member?.avatar,
            description: member?.about || (isAdmin ? "Group admin" : `@${username}`),
          });
        }
      });
    }

    if (!q || "meta ai".includes(q) || "llama".includes(q) || "@meta".includes(q)) {
      items.push({
        type: "meta_ai",
        id: "meta_ai",
        tag: "@Meta AI",
        name: "Meta AI",
        badge: "AI",
        description: "with Llama • Ask anything or type /imagine",
      });
    }

    return items;
  }, [showMentionPopover, isGroupChat, mentionQuery, groupParticipants, groupAdmins, user]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [mentionQuery, showMentionPopover]);

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

        {showMentionPopover && filteredMentionItems.length > 0 && (
          <div
            className={`absolute left-2 sm:left-4 bottom-full mb-3 w-[300px] sm:w-[350px] max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl border overflow-hidden z-50 animate-fade-in ${theme === "dark"
              ? "bg-[#202c33] border-white/10 text-white shadow-[0_12px_28px_rgba(0,0,0,0.55)]"
              : "bg-white border-black/10 text-gray-900 shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
              }`}
          >
            <div className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 border-b border-black/5 dark:border-white/5 select-none flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a884]" />
                {isGroupChat ? "Group Mentions" : "Mention"}
              </span>
              <span className="text-[10px] text-gray-400 normal-case">
                ↑↓ to navigate • Tab/Enter to tag
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto custom-scrollbar p-1 select-none">
              {filteredMentionItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => handleSelectMention(item.tag)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${isSelected
                      ? theme === "dark"
                        ? "bg-white/10"
                        : "bg-black/5"
                      : theme === "dark"
                        ? "hover:bg-white/5"
                        : "hover:bg-black/[0.03]"
                      }`}
                  >
                    {item.type === "all" ? (
                      <div className="w-9 h-9 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center font-bold text-base shrink-0">
                        @
                      </div>
                    ) : item.type === "meta_ai" ? (
                      <div className="shrink-0">
                        <MetaAiRing size={32} />
                      </div>
                    ) : item.avatar ? (
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: getAvatarColor(item.name) }}
                      >
                        {(item.name[0] || "U").toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[13.5px] truncate">
                          {item.name}
                        </span>
                        {item.isMe && (
                          <span className="text-[11px] text-gray-400 font-normal">
                            (You)
                          </span>
                        )}
                        {item.badge && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-[#00a884]/20 text-[#00a884]">
                            {item.badge}
                          </span>
                        )}
                        {item.isAdmin && (
                          <span
                            className={`text-[10.5px] font-medium px-1.5 py-0.2 rounded ${theme === "dark"
                              ? "bg-[#16312e] text-[#00a884]"
                              : "bg-[#e0f0e9] text-[#00897b]"
                              }`}
                          >
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-gray-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <span className="text-[11px] font-mono text-gray-400 opacity-60 shrink-0">
                      {item.tag}
                    </span>
                  </div>
                );
              })}
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
            const cursor = e.target.selectionStart ?? val.length;
            const textBefore = val.slice(0, cursor);
            const lastToken = textBefore.split(/\s/).pop() || "";
            if (lastToken.startsWith("@") && !isMetaAiChat) {
              setMentionQuery(lastToken.slice(1));
              setShowMentionPopover(true);
            } else {
              setShowMentionPopover(false);
              setMentionQuery("");
            }
          }}
          onKeyDown={(e) => {
            if (showMentionPopover && filteredMentionItems.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % filteredMentionItems.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredMentionItems.length) % filteredMentionItems.length);
                return;
              }
              if (e.key === "Tab" || e.key === "Enter") {
                e.preventDefault();
                const selected = filteredMentionItems[selectedIndex] || filteredMentionItems[0];
                if (selected) {
                  handleSelectMention(selected.tag);
                }
                return;
              }
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
              : isGroupChat
                ? "Type a message or @ to tag..."
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
