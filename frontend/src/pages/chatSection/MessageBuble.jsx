import React, { useRef, useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheckDouble, FaPlus, FaRegCopy, FaSmile } from "react-icons/fa";
import { RiDeleteBin6Line, RiEditLine } from "react-icons/ri";
import { FiCheck } from "react-icons/fi";
import { HiDotsVertical } from "react-icons/hi";
import { RxCross2 } from "react-icons/rx";
import useOutsideClick from "../../hook/useOutsideClick";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-toastify";
import { FaRegImage, FaVideo } from "react-icons/fa";
import { FaRegFileAlt } from "react-icons/fa";

const MessageBuble = ({
  message,
  theme,
  onReact,
  currentUser,
  deleteMessage,
  searchTerm,
  highlightText,
  dataMatch,
  isActive,
  onStatusClick,
  onEdit,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message?.content || "");

  const emojiPickerRef = useRef(null);
  const reactionsMenuRef = useRef(null);
  const optionRef = useRef(null);
  const pressTimer = useRef(null);
  const isLongPress = useRef(false);
  const editRef = useRef(null);

  const isDark = theme === "dark";
  const isUserMessage = message.sender?._id === currentUser?._id;

  const bubbleClass = isUserMessage ? "chat-end" : "chat-start";

  const bubbleContentClass = isUserMessage
    ? `chat-bubble md:max-w-[50%] min-w-[130px] ${
        theme === "dark" ? "bg-[#144d38] text-white" : "bg-[#d8fdd3] text-black"
      }`
    : `chat-bubble md:max-w-[50%] min-w-[130px] ${
        theme === "dark"
          ? "bg-[#374151] text-white"
          : "bg-white text-black shadow-sm"
      }`;

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const handleTouchStart = () => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowReactions(true);
    }, 400);
  };

  const handleTouchEnd = () => {
    clearTimeout(pressTimer.current);
  };

  const safeHighlight =
    typeof highlightText === "function" ? highlightText : (text) => text;

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowEmojiPicker(false);
    setShowReactions(false);
  };

  // Close on outside click
  useOutsideClick(emojiPickerRef, () => {
    if (showEmojiPicker) setShowEmojiPicker(false);
  });

  useOutsideClick(reactionsMenuRef, () => {
    if (showReactions) setShowReactions(false);
  });

  useOutsideClick(optionRef, () => {
    if (showOptions) setShowOptions(false);
  });

  useOutsideClick(editRef, () => {
    if (isEditing) {
      setIsEditing(false);
      setEditText(message.content || "");
    }
  });

  if (!message) return null;

  return (
    <div
      className={`chat ${bubbleClass} transition-all duration-300 ${
        isActive ? "scale-[1.02]" : ""
      }`}
      data-match={dataMatch ? "true" : "false"}
    >
      <div
        className={`${bubbleContentClass} relative group !py-2.5 !px-3 transition-all duration-300 ${
          isActive
            ? "ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.55)]"
            : "shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
        }`}
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onClick={() => setShowReactions((prev) => !prev)}
          className="relative"
        >
          {message.statusId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                if (!onStatusClick) return;

                onStatusClick(message.statusId);

                const statusId =
                  typeof message.statusId === "object"
                    ? message.statusId?._id
                    : message.statusId;

                if (statusId) {
                  onStatusClick(String(statusId));
                }
              }}
              className={`mb-2 w-full text-left overflow-hidden rounded-xl border-l-[3px] cursor-pointer transition-all duration-200 hover:brightness-[1.08] active:scale-[0.99] ${
                isDark
                  ? "bg-white/[0.04] border-purple-400"
                  : "bg-black/[0.03] border-purple-500"
              }`}
            >
              {/* Header */}
              <div className="px-3 py-2">
                <p
                  className={`text-sm font-semibold tracking-tight ${
                    isDark ? "text-purple-300" : "text-purple-600"
                  }`}
                >
                  {message.statusId?.user?.username || "Status"}
                </p>

                {message.statusId?.contentType === "text" && (
                  <div className="pt-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FaRegFileAlt
                        size={11}
                        className={isDark ? "text-gray-400" : "text-gray-500"}
                      />

                      <span
                        className={`text-[11px] font-medium uppercase tracking-wide ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Text status
                      </span>
                    </div>

                    <p
                      className={`text-sm leading-snug line-clamp-2 ${
                        isDark ? "text-white/90" : "text-gray-800"
                      }`}
                    >
                      {message.statusId?.content || "Text status"}
                    </p>
                  </div>
                )}

                {message.statusId?.contentType === "image" && (
                  <div
                    className={`mt-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <FaRegImage size={11} />
                    <span>Photo</span>
                  </div>
                )}

                {message.statusId?.contentType === "video" && (
                  <div
                    className={`mt-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <FaVideo size={11} />
                    <span>Video</span>
                  </div>
                )}
              </div>

              {/* Image status */}
              {message.statusId?.contentType === "image" &&
                message.statusId?.mediaUrl && (
                  <img
                    src={message.statusId.mediaUrl}
                    alt="Status"
                    className="w-full h-24 object-cover"
                  />
                )}

              {/* Video status */}
              {message.statusId?.contentType === "video" &&
                message.statusId?.mediaUrl && (
                  <div className="relative h-24 w-full">
                    <video
                      src={message.statusId.mediaUrl}
                      muted
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <FaVideo className="text-white" />
                    </div>
                  </div>
                )}
            </button>
          )}

          {/* MESSAGE */}
          <div className="flex flex-col gap-1">
            {message.contentType === "text" && (
              <>
                {isEditing ? (
                  <div
                    ref={editRef}
                    className="flex w-full min-w-[220px] flex-col gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                      rows={2}
                      className={`w-full resize-none rounded-xl border px-3 py-2 text-sm leading-relaxed outline-none transition-colors ${
                        isDark
                          ? "border-white/10 bg-[#111b21] text-white focus:border-emerald-400"
                          : "border-black/10 bg-white text-black focus:border-emerald-500"
                      }`}
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditText(message.content || "");
                        }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          isDark
                            ? "text-gray-300 hover:bg-white/10"
                            : "text-gray-500 hover:bg-black/5"
                        }`}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={!editText.trim()}
                        onClick={async () => {
                          try {
                            await onEdit(message._id, editText.trim());

                            setIsEditing(false);

                            toast.success("Message edited");
                          } catch (error) {
                            toast.error("Failed to edit message");
                          }
                        }}
                        className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-500/30 transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="break-all whitespace-pre-wrap text-[14.5px] leading-relaxed">
                    {searchTerm
                      ? safeHighlight(message.content || "", searchTerm)
                      : message.content}
                  </p>
                )}
              </>
            )}

            {message.contentType === "image" && (
              <div className="max-w-full">
                <img
                  src={message.imageOrVideoUrl}
                  alt="img"
                  className="rounded-xl w-full max-w-[280px] sm:max-w-xs md:max-w-sm object-cover ring-1 ring-black/[0.06]"
                />
                {message.content && (
                  <p className="mt-1.5 break-words text-[14.5px] leading-relaxed">
                    {searchTerm
                      ? safeHighlight(message.content || "", searchTerm)
                      : message.content}
                  </p>
                )}
              </div>
            )}

            {message.contentType === "video" && (
              <div className="max-w-full">
                <video
                  src={message.imageOrVideoUrl}
                  controls
                  className="rounded-xl w-full max-w-[280px] sm:max-w-xs md:max-w-sm ring-1 ring-black/[0.06]"
                />
                {message.content && (
                  <p className="mt-1.5 break-words text-[14.5px] leading-relaxed">
                    {message.content}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TIME */}
        <div className="flex items-center justify-end gap-1 text-[11px] opacity-60 mt-1.5 select-none">
          <span>{format(new Date(message.createdAt), "HH:mm")}</span>

          {isUserMessage && (
            <>
              {message.messageStatus === "send" && <FiCheck size={15} />}
              {message.messageStatus === "delivered" && (
                <FaCheckDouble size={12} />
              )}
              {message.messageStatus === "read" && (
                <FaCheckDouble size={12} className="text-sky-400" />
              )}
            </>
          )}
        </div>

        {/* 3-DOT MENU TRIGGER */}
        <div className="absolute top-1.5 right-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 z-20">
          <button
            onClick={() => setShowOptions((prev) => !prev)}
            className={`p-1.5 rounded-full cursor-pointer backdrop-blur-sm transition-colors ${
              isDark
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : "text-gray-600 hover:bg-black/[0.06] hover:text-gray-900"
            }`}
          >
            <HiDotsVertical size={16} />
          </button>
        </div>

        {/* REACTION CONTAINER */}
        <div
          className={`absolute ${
            isUserMessage ? "-left-11" : "-right-11"
          } top-1/2 -translate-y-1/2 flex flex-col items-center`}
        >
          <AnimatePresence>
            {showReactions && (
              <motion.div
                ref={reactionsMenuRef}
                initial={{ opacity: 0, scale: 0.85, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 6 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className={`absolute bottom-full mb-2 flex items-center rounded-full px-2 py-1.5 gap-0.5 shadow-xl border z-50 ${
                  isDark
                    ? "bg-[#233138]/95 border-white/10 backdrop-blur-md"
                    : "bg-white/95 border-black/[0.06] backdrop-blur-md"
                }`}
              >
                {quickReactions.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleReact(emoji)}
                    className="text-lg hover:scale-125 transition-transform duration-150 p-1.5 rounded-full cursor-pointer hover:bg-black/[0.05]"
                  >
                    {emoji}
                  </button>
                ))}

                <div
                  className={`w-px h-5 mx-1 ${
                    isDark ? "bg-white/15" : "bg-black/10"
                  }`}
                />

                <button
                  className={`rounded-full p-1.5 cursor-pointer transition-colors ${
                    isDark
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
                    className={`absolute top-2 right-2 rounded-full p-1.5 shadow-md cursor-pointer transition-colors ${
                      isDark
                        ? "bg-[#202c33] text-gray-300 hover:bg-[#2a3942]"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <RxCross2 size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SMILE BUTTON */}
          <button
            onClick={() => setShowReactions((prev) => !prev)}
            className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 ${
              isDark
                ? "bg-[#233138] hover:bg-[#2a3942]"
                : "bg-white hover:bg-gray-50"
            } shadow-md ring-1 ${
              isDark ? "ring-white/10" : "ring-black/[0.06]"
            } cursor-pointer`}
          >
            <FaSmile
              size={13}
              className={isDark ? "text-gray-300" : "text-gray-500"}
            />
          </button>
        </div>

        {/* REACTIONS BADGE */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={`absolute -bottom-3 flex items-center gap-1 px-2 py-1 rounded-full shadow-md border transition-transform duration-200 hover:scale-110 z-20 ${
              isUserMessage ? "right-3" : "left-3"
            } ${
              isDark
                ? "bg-[#233138] border-white/10 text-gray-200"
                : "bg-white border-black/[0.06] text-gray-700"
            }`}
          >
            <div className="flex items-center gap-0.5">
              {message.reactions.slice(0, 5).map((reaction, index) => (
                <span key={index} className="text-[13px] leading-none">
                  {reaction.emoji}
                </span>
              ))}
              {message.reactions.length > 1 && (
                <span className="text-[10.5px] font-semibold ml-0.5 tabular-nums">
                  {message.reactions.length}
                </span>
              )}
            </div>
          </div>
        )}

        {/* OPTIONS DROPDOWN */}
        <AnimatePresence>
          {showOptions && (
            <motion.div
              ref={optionRef}
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={`absolute top-9 right-1.5 z-50 min-w-[168px] overflow-hidden rounded-xl shadow-2xl border text-sm ${
                isDark
                  ? "bg-[#233138]/95 border-white/10 text-white backdrop-blur-md"
                  : "bg-white/95 border-black/[0.06] text-gray-800 backdrop-blur-md"
              }`}
            >
              <button
                onClick={() => {
                  let textToCopy = "";
                  if (message.contentType === "text") {
                    textToCopy = message.content;
                  }
                  if (
                    message.contentType === "image" ||
                    message.contentType === "video"
                  ) {
                    textToCopy = message.imageOrVideoUrl;
                  }

                  if (textToCopy) {
                    navigator.clipboard.writeText(textToCopy);
                    toast.success("Copied");
                  }
                  setShowOptions(false);
                }}
                className={`flex w-full items-center px-3.5 py-2.5 gap-3 cursor-pointer transition-colors ${
                  isDark ? "hover:bg-white/10" : "hover:bg-black/[0.04]"
                }`}
              >
                <FaRegCopy size={13} className="opacity-70" />
                <span className="font-medium">Copy</span>
              </button>

              {isUserMessage && message.contentType === "text" && (
                <button
                  onClick={() => {
                    setEditText(message.content || "");
                    setIsEditing(true);
                    setShowOptions(false);
                  }}
                  className={`flex w-full items-center px-3.5 py-2.5 gap-3 cursor-pointer transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-black/[0.04]"
                  }`}
                >
                  <RiEditLine size={14} className="opacity-70" />
                  <span className="font-medium">Edit</span>
                </button>
              )}

              <div
                className={`h-px ${isDark ? "bg-white/10" : "bg-black/[0.06]"}`}
              />

              <button
                onClick={() => {
                  setDeleteModal(message);
                  setShowOptions(false);
                }}
                className={`flex w-full items-center px-3.5 py-2.5 gap-3 text-red-500 cursor-pointer transition-colors ${
                  isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"
                }`}
              >
                <RiDeleteBin6Line size={14} />
                <span className="font-medium">Delete</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {deleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`fixed inset-0 z-[1000] flex items-center justify-center px-4 backdrop-blur-xl ${
                isDark ? "bg-black/70" : "bg-black/30"
              }`}
              onClick={() => setDeleteModal(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 22,
                }}
                className={`relative w-full max-w-sm overflow-hidden rounded-[28px] border p-6 shadow-2xl backdrop-blur-2xl ${
                  isDark
                    ? "border-white/[0.08] bg-gradient-to-br from-[#202c33]/95 via-[#111b21]/95 to-[#0b141a]/95 shadow-black/50"
                    : "border-white/70 bg-gradient-to-br from-white/95 via-white/90 to-zinc-100/95 shadow-black/10"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl ${
                    isDark ? "bg-red-500/10" : "bg-red-400/10"
                  }`}
                />

                {/* Top highlight */}
                <div
                  className={`pointer-events-none absolute left-8 right-8 top-0 h-px ${
                    isDark
                      ? "bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      : "bg-gradient-to-r from-transparent via-black/10 to-transparent"
                  }`}
                />

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:rotate-90 cursor-pointer ${
                    isDark
                      ? "bg-white/[0.05] text-gray-400 hover:bg-white/10 hover:text-white"
                      : "bg-black/[0.04] text-gray-500 hover:bg-black/[0.08] hover:text-gray-900"
                  }`}
                >
                  <RxCross2 size={16} />
                </button>

                <div className="relative flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.1,
                      type: "spring",
                      stiffness: 300,
                    }}
                    className={`relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg ${
                      isDark
                        ? "border-red-400/10 bg-gradient-to-br from-red-500/20 to-red-600/5 text-red-400 shadow-red-500/10"
                        : "border-red-500/10 bg-gradient-to-br from-red-500/10 to-red-500/5 text-red-500 shadow-red-500/10"
                    }`}
                  >
                    <RiDeleteBin6Line size={27} />
                    <div
                      className={`absolute inset-0 -z-10 rounded-2xl blur-xl ${
                        isDark ? "bg-red-500/20" : "bg-red-500/10"
                      }`}
                    />
                  </motion.div>
                  <h2
                    className={`text-xl font-bold tracking-tight ${
                      isDark ? "text-white" : "text-zinc-900"
                    }`}
                  >
                    Delete message?
                  </h2>
                  <p
                    className={`mt-2 max-w-[290px] text-sm leading-6 ${
                      isDark ? "text-zinc-400" : "text-zinc-500"
                    }`}
                  >
                    Choose how you want to delete this message. This action
                    cannot be undone.
                  </p>
                </div>

                {/* Buttons */}
                <div className="relative mt-7 flex flex-col gap-3">
                  {/* DELETE FOR EVERYONE */}
                  {isUserMessage && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={async () => {
                        try {
                          await deleteMessage(deleteModal._id, "everyone");

                          toast.success("Message deleted for everyone");
                        } catch (error) {
                          toast.error("Failed to delete message");
                        } finally {
                          setDeleteModal(null);
                        }
                      }}
                      className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 font-semibold transition-all duration-300 cursor-pointer ${
                        isDark
                          ? "border-red-400/10 bg-gradient-to-r from-red-500/90 to-rose-600/90 text-white shadow-lg shadow-red-500/10 hover:border-red-300/20 hover:from-red-500 hover:to-rose-500 hover:shadow-xl hover:shadow-red-500/20"
                          : "border-red-500/10 bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20 hover:from-red-600 hover:to-rose-500 hover:shadow-xl hover:shadow-red-500/25"
                      }`}
                    >
                      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                      <span className="relative z-10 flex items-center justify-center gap-2.5">
                        <RiDeleteBin6Line size={17} />

                        <span>Delete for everyone</span>
                      </span>
                    </motion.button>
                  )}

                  {/* DELETE FOR ME */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={async () => {
                      try {
                        await deleteMessage(deleteModal._id, "me");

                        toast.success("Message deleted for me");
                      } catch (error) {
                        toast.error("Failed to delete message");
                      } finally {
                        setDeleteModal(null);
                      }
                    }}
                    className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 font-semibold transition-all duration-300 cursor-pointer ${
                      isDark
                        ? "border-white/[0.08] bg-gradient-to-r from-zinc-800/90 to-zinc-900/90 text-zinc-100 shadow-lg shadow-black/10 hover:border-emerald-400/20 hover:from-zinc-700/90 hover:to-zinc-800/90 hover:text-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5"
                        : "border-black/[0.06] bg-gradient-to-r from-zinc-100 to-white text-zinc-800 shadow-md shadow-black/5 hover:border-emerald-500/20 hover:from-emerald-50 hover:to-white hover:text-emerald-700 hover:shadow-lg"
                    }`}
                  >
                    {/* Shine */}
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                    <span className="relative z-10 flex items-center justify-center gap-2.5">
                      <RiDeleteBin6Line
                        size={17}
                        className="transition-transform duration-300 group-hover:scale-110"
                      />

                      <span>Delete for me</span>
                    </span>
                  </motion.button>

                  {/* CANCEL */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setDeleteModal(null)}
                    className={`mt-1 w-full rounded-2xl border py-3 text-sm font-medium transition-all duration-300 cursor-pointer ${
                      isDark
                        ? "border-transparent text-zinc-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"
                        : "border-transparent text-zinc-500 hover:border-black/[0.05] hover:bg-black/[0.03] hover:text-zinc-900"
                    }`}
                  >
                    Cancel
                  </motion.button>
                </div>

                {/* Bottom hint */}
                <div
                  className={`mt-5 text-center text-[11px] ${
                    isDark ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  Deleted messages cannot be recovered
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MessageBuble;
