import React, { useRef, useState, useEffect } from "react";
import { format } from "date-fns";
import { FaCheckDouble, FaPlus, FaSmile } from "react-icons/fa";
import { FiCheck } from "react-icons/fi";
import { HiDotsVertical } from "react-icons/hi";
import { RxCross2 } from "react-icons/rx";
import useOutsideClick from "../../hook/useOutsideClick";
import EmojiPicker from "emoji-picker-react";
import { reach } from "yup";

const MessageBuble = ({
  message,
  theme,
  onReact,
  currentUser,
  deleteMessage,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const messageRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const reactionsMenuRef = useRef(null);
  const optionRef = useRef(null);

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
    <div className={`chat ${bubbleClass}`}>
      <div className={`${bubbleContentClass} relative group`} ref={messageRef}>
        {/* MESSAGE */}
        <div className="flex flex-col gap-1">
          {message.contentType === "text" && (
            <p className="break-all whitespace-pre-wrap">{message.content}</p>
          )}

          {message.contentType === "image" && (
            <div>
              <img
                src={message.imageOrVideoUrl}
                alt="msg"
                className="rounded-lg max-w-xs"
              />
              <p className="mt-1">{message.content}</p>
            </div>
          )}
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
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition z-20">
          <button
            onClick={() => setShowOptions((prev) => !prev)}
            className={`p-1 rounded-full ${
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
              className="absolute bottom-full mb-2 flex items-center bg-[#202c33] rounded-full px-2 py-1.5 gap-1 shadow-lg z-50"
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
                className="hover:bg-[#ffffff1a] rounded-full p-1"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
              >
                <FaPlus className="h-4 w-4 text-gray-300 cursor-pointer" />
              </button>
            </div>
          )}

          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute left-4 bottom-20 z-50"
            >
              <div className="relative">
                <EmojiPicker
                  className="absolute left-0 mb-6 z-50"
                  onEmojiClick={(emojiObject) => handleReact(emojiObject.emoji)}
                  theme={theme}
                />

                <button
                  onClick={() => {
                    setShowEmojiPicker(false);
                  }}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  <RxCross2 />
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
          <div className="mt-1 flex gap-1">
            {message.reactions.map((reaction, index) => (
              <span key={index} className="text-sm">
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBuble;
