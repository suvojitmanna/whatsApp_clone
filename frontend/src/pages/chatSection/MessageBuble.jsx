import React, { useRef, useState, useEffect } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheckDouble, FaPlus, FaRegCopy, FaSmile } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FiCheck } from "react-icons/fi";
import { HiDotsVertical } from "react-icons/hi";
import { RxCross2 } from "react-icons/rx";
import useOutsideClick from "../../hook/useOutsideClick";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-toastify";

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
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);

  const messageRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const reactionsMenuRef = useRef(null);
  const optionRef = useRef(null);
  const pressTimer = useRef(null);
  const isLongPress = useRef(false);

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

  if (!message) return null;

  return (
    <div
      className={`chat ${bubbleClass}`}
      data-match={dataMatch ? "true" : "false"}
      className={`chat ${bubbleClass} transition-all duration-300 ${
        isActive ? "scale-[1.02]" : ""
      }`}
    >
      <div
        className={`${bubbleContentClass} relative group transition-all duration-300 ${
          isActive
            ? "ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.6)]"
            : ""
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
          {/* MESSAGE */}
          <div className="flex flex-col gap-1">
            {message.contentType === "text" && (
              <p className="break-all whitespace-pre-wrap">
                {searchTerm
                  ? safeHighlight(message.content || "", searchTerm)
                  : message.content}
              </p>
            )}

            {message.contentType === "image" && (
              <div className="max-w-full">
                <img
                  src={message.imageOrVideoUrl}
                  alt="img"
                  className="rounded-xl w-full max-w-[280px] sm:max-w-xs md:max-w-sm object-cover"
                />
                {message.content && (
                  <p className="mt-1 break-words">
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
                  className="rounded-xl w-full max-w-[280px] sm:max-w-xs md:max-w-sm"
                />
                {message.content && (
                  <p className="mt-1 break-words">{message.content}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TIME */}
        <div className="flex items-center justify-end gap-1 text-xs opacity-60 mt-2">
          <span>{format(new Date(message.createdAt), "HH:mm")}</span>

          {isUserMessage && (
            <>
              {message.messageStatus === "send" && <FiCheck size={16} />}
              {message.messageStatus === "delivered" && (
                <FaCheckDouble size={12} />
              )}
              {message.messageStatus === "read" && (
                <FaCheckDouble size={12} className="text-blue-400" />
              )}
            </>
          )}
        </div>

        {/* 3 DOT */}
        <div className="absolute top-1 right-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition z-20">
          <button
            onClick={() => setShowOptions((prev) => !prev)}
            className={`p-1 rounded-full cursor-pointer ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            <HiDotsVertical size={18} />
          </button>
        </div>

        {/* REACTION CONTAINER (FIXED) */}
        <div
          className={`absolute ${
            isUserMessage ? "-left-10" : "-right-10"
          } top-1/2 -translate-y-1/2 flex flex-col items-center`}
        >
          {/* POPUP (NO SHIFT NOW) */}
          {showReactions && (
            <div
              ref={reactionsMenuRef}
              className="absolute bottom-full mb-2 flex items-center rounded-full px-2 py-1.5 gap-1 shadow-lg z-50"
            >
              {quickReactions.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleReact(emoji)}
                  className="hover:scale-125 transition transform p-1 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}

              <div className="w-[1px] h-5 bg-gray-600 mx-1" />
              <button
                className={`${theme === "dark" ? "bg-gray-400" : "hover:bg-gray-400"}hover:bg-[#ffffff1a] rounded-full p-1`}
                onClick={() => setShowEmojiPicker((prev) => !prev)}
              >
                <FaPlus
                  className={`h-4 w-4 cursor-pointer ${
                    theme === "dark"
                      ? "bg-gray-900 text-gray-300"
                      : "text-gray-900"
                  }`}
                />
              </button>
            </div>
          )}

          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="fixed z-[9999]"
              style={{
                bottom: "80px",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              <div className="relative">
                <EmojiPicker
                  onEmojiClick={(emojiObject) => handleReact(emojiObject.emoji)}
                  theme={theme}
                />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmojiPicker(false);
                  }}
                  className="absolute top-2 right-2 bg-white dark:bg-[#202c33] rounded-full p-1 shadow"
                >
                  <RxCross2 className="text-white cursor-pointer" />
                </button>
              </div>
            </div>
          )}

          {/*SMILE BUTTON (FIXED POSITION) */}
          <button
            onClick={() => setShowReactions((prev) => !prev)}
            className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition ${
              theme === "dark"
                ? "bg-[#202c33] hover:bg-[#202c33]/80"
                : "bg-white hover:bg-gray-100"
            } shadow-lg cursor-pointer`}
          >
            <FaSmile
              size={14}
              className={`${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            />
          </button>
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div
            className={`absolute -bottom-3 flex items-center gap-1 px-1.5 py-1 rounded-full shadow-sm border transition-transform duration-200 hover:scale-110 z-20 ${isUserMessage ? "right-3" : "left-3"} ${theme === "dark" ? "bg-[#202c33] border-[#3b4a54] text-gray-300" : "bg-gray-100 border-gray-200 text-gray-600"}`}
          >
            <div className="flex items-center gap-0.5">
              {message.reactions.map((reaction, index) => (
                <span key={index} className="text-[14px] leading-none">
                  {reaction.emoji}
                </span>
              ))}
              {message.reactions.length > 1 && (
                <span className="text-[11px] font-semibold ml-0.5">
                  {message.reactions.length}
                </span>
              )}
            </div>
          </div>
        )}
        {showOptions && (
          <div
            ref={optionRef}
            className={`absolute top-8 z-50 rounded-xl shadow-lg text-sm ${
              theme === "dark"
                ? "bg-[#1d1f1f] text-white"
                : "bg-gray-100 text-black"
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
              className={`flex w-full h-full items-center px-4 py-2 gap-3 rounded-lg cursor-pointer ${theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-200"} `}
            >
              <FaRegCopy size={14} />
              <span>Copy</span>
            </button>
            <div className="" />
            {isUserMessage && (
              <button
                onClick={() => {
                  setDeleteModal(message);
                  setShowOptions(false);
                }}
                className={`border-t flex items-center px-4 py-2 gap-3 rounded-lg text-red-600 cursor-pointer ${theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-200"}`}
              >
                <RiDeleteBin6Line className="text-red-600" size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}

        <AnimatePresence>
          {deleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`fixed inset-0 z-[1000] flex items-center justify-center px-4 backdrop-blur-md ${
                theme === "dark" ? "bg-black/70" : "bg-black/30"
              }`}
              onClick={() => setDeleteModal(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                transition={{
                  type: "spring",
                  duration: 0.5,
                  bounce: 0.3,
                }}
                className={`w-full max-w-sm rounded-[24px] border p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] ${
                  theme === "dark"
                    ? "bg-[#202c33] border-white/10"
                    : "bg-white border-gray-200"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ring-4 ${
                      theme === "dark"
                        ? "bg-red-500/10 text-red-400 ring-red-500/5"
                        : "bg-red-50 text-red-500 ring-red-100"
                    }`}
                  >
                    <RiDeleteBin6Line size={24} />
                  </div>
                  <h2
                    className={`text-xl font-semibold tracking-tight ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Delete message?
                  </h2>
                  <p
                    className={`mt-2 text-sm leading-relaxed ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Choose how you want to delete this message. This action
                    cannot be undone.
                  </p>
                </div>

                <div className="mt-7 flex flex-col gap-2.5">
                  <button
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
                    className="w-full rounded-xl bg-red-500 py-3.5 font-medium text-white shadow-sm shadow-red-500/20 transition-all duration-200 hover:bg-red-600 active:scale-[0.98] cursor-pointer"
                  >
                    Delete for everyone
                  </button>

                  <button
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
                    className={`w-full rounded-xl py-3.5 font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      theme === "dark"
                        ? "bg-white/5 text-white hover:bg-white/10"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    Delete for me
                  </button>

                  <button
                    onClick={() => setDeleteModal(null)}
                    className={`mt-1 w-full rounded-xl py-3 font-medium transition-colors duration-200 cursor-pointer ${
                      theme === "dark"
                        ? "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    Cancel
                  </button>
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
