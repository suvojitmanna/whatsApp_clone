import React, { useEffect, useRef, useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import { isToday, isYesterday, format } from "date-fns";
import whatsappImage from "../../assets/whatsapp_image.png";
import {
  FaArrowLeft,
  FaEllipsisV,
  FaFile,
  FaImage,
  FaLock,
  FaPaperclip,
  FaPaperPlane,
  FaPhone,
  FaSmile,
  FaTimes,
  FaVideo,
} from "react-icons/fa";
import { FaEllipsis } from "react-icons/fa6";
import { object } from "yup";
import MessageBuble from "./MessageBuble";
import EmojiPicker from "emoji-picker-react";
import useOutsideClick from "../../hook/useOutsideClick";
import formatTimestamp from "../../utils/formatTime";
import VideoCallManager from "../videoCall/videoCallManager";
import { getSocket } from "../../services/chatService";
import useVideoCallStore from "../../store/videoCallStore";
import useLayoutStore from "../../store/layoutStore";
import { HiDotsVertical } from "react-icons/hi";
import { FiSearch } from "react-icons/fi";
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";

const isValidate = (date) => {
  return date instanceof Date && !isNaN(date);
};
const ChatWindow = ({ selectedContact, setSelectedContact }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [searchIcon, setSearchIcon] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const typingTimeOutRef = useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileMenuRef = useRef(null);
  const searchIconRef = useRef(null);
  const inputRef = useRef(null);
  const messageRefs = useRef([]);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { socket } = getSocket();
  const {
    messages,
    loading,
    sendMessage,
    receiveMessage,
    fetchMessages,
    fetchConversations,
    conversations,
    isUserTyping,
    startTying,
    stopTying,
    getUserLastSeen,
    isUserOnline,
    cleanup,
    deleteMessage,
    addReaction,
  } = useChatStore();

  let matchCounter = -1;

  //get online status and last seen
  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTyping = isUserTyping(selectedContact?._id);

  const setShowContactInfo = useLayoutStore(
    (state) => state.setShowContactInfo,
  );

  useEffect(() => {
    if (selectedContact?._id && conversations?.data?.length > 0) {
      const conversation = conversations?.data?.find((conv) =>
        conv.participants.some(
          (participant) => participant._id === selectedContact?._id,
        ),
      );
      if (conversation && conversation._id) {
        fetchMessages(conversation._id);
      }
    }
  }, [selectedContact, conversations]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (message && selectedContact) {
      startTying(selectedContact?._id);

      if (typingTimeOutRef.current) {
        clearTimeout(typingTimeOutRef.current);
      }

      typingTimeOutRef.current = setTimeout(() => {
        stopTying(selectedContact?._id);
      }, 2000);
    }
    return () => {
      if (typingTimeOutRef.current) {
        clearTimeout(typingTimeOutRef.current);
      }
    };
  }, [message, selectedContact, startTying, stopTying]);

  useEffect(() => {
    if (searchTerm) {
      const el = document.querySelector("[data-match='true']");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [searchTerm]);

  useEffect(() => {
    messageRefs.current = [];
  }, [searchTerm]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContact) return;
    setFilePreview(null);
    try {
      const formData = new FormData();
      formData.append("senderId", user?._id);
      formData.append("receiverId", selectedContact?._id);

      const status = online ? "delivered" : "send";
      formData.append("messageStatus", status);
      formData.append("content", message.trim() || "");

      if (selectedFile) {
        formData.append("media", selectedFile);
      }
      if (!message.trim() && !selectedFile) return;
      await sendMessage(formData);

      setMessage("");
      setFilePreview(null);
      setSelectedFile(null);
      setShowFileMenu(false);
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const renderDateSeparator = (date) => {
    if (!isValidate(date)) {
      return null;
    }

    let dateString;
    if (isToday(date)) {
      dateString = "Today";
    } else if (isYesterday(date)) {
      dateString = "Yesterday";
    } else {
      dateString = format(date, "EEEE,MMMM d");
    }

    return (
      // timestamp
      <div className="sticky top-0 z-10 flex justify-center mb-4">
        <span
          className={`px-4 py-1.5 text-xs font-semibold rounded-full backdrop-blur-md shadow-sm border transition-colors duration-300 ${
            theme === "dark"
              ? "bg-[#202c33]/80 text-slate-300 border-white/5"
              : "bg-white/80 text-slate-600 border-black/5"
          }`}
        >
          {dateString}
        </span>
      </div>
    );
  };

  const groupedMessages = Array.isArray(messages)
    ? messages.reduce((acc, message) => {
        if (!message.createdAt) return acc;
        const date = new Date(message.createdAt);
        if (isValidate(date)) {
          const dateString = format(date, "yyyy-MM-dd");
          if (!acc[dateString]) {
            acc[dateString] = [];
          }
          acc[dateString].push(message);
        } else {
          console.error("Invalid date for message", message);
        }
        return acc;
      }, {})
    : {};

  const filteredGroupedMessages = Object.fromEntries(
    Object.entries(groupedMessages)
      .map(([date, msgs]) => {
        const filteredMsgs = msgs.filter((msg) =>
          (msg.content || "").toLowerCase().includes(searchTerm.toLowerCase()),
        );

        return [date, filteredMsgs];
      })
      .filter(([_, msgs]) => msgs.length > 0),
  );

  const finalMessagesToRender = searchTerm
    ? filteredGroupedMessages
    : groupedMessages;

  const resultCount = Object.values(filteredGroupedMessages).flat().length;

  const highlightText = (text, term) => {
    if (!term) return text;

    const parts = text.split(new RegExp(`(${term})`, "gi"));

    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <span key={i} className="bg-yellow-300 text-black px-1 rounded">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const handleReaction = (messageId, emoji) => {
    addReaction(messageId, emoji);
  };

  const handleVideoCall = () => {
    if (selectedContact && online) {
      const { initiateCall } = useVideoCallStore.getState();

      const avatar = selectedContact?.profilePicture;

      initiateCall(
        selectedContact?._id,
        selectedContact?.username,
        avatar,
        "video",
      );
    } else {
      alert("User is offline. Cannot initiate the call");
    }
  };

  const handleAudioCall = () => {
    if (selectedContact && online) {
      const { initiateCall } = useVideoCallStore.getState();

      const avatar = selectedContact?.profilePicture;

      initiateCall(
        selectedContact?._id,
        selectedContact?.username,
        avatar,
        "audio",
      );
    } else {
      alert("User is offline. Cannot initiate the call");
    }
  };

  // Close on outside click
  useOutsideClick(emojiPickerRef, () => {
    if (showEmojiPicker) setShowEmojiPicker(false);
  });

  useOutsideClick(fileMenuRef, () => {
    if (showFileMenu) setShowFileMenu(false);
  });

  useOutsideClick(searchIconRef, () => {
    setIsSearchOpen(false);
    setSearchTerm("");
  });

  useEffect(() => {
    if (isSearchOpen) {
      // so the browser accepts the focus command
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!searchTerm) return;

    const elements = document.querySelectorAll("[data-match='true']");

    if (elements.length === 0) return;

    const el = elements[currentIndex];

    if (el) {
      setTimeout(() => {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
    }
  }, [currentIndex, searchTerm]);

  const goNext = () => {
    setCurrentIndex((prev) => (prev < resultCount - 1 ? prev + 1 : 0));
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : resultCount - 1));
  };

  useEffect(() => {
    setCurrentIndex(0);
  }, [searchTerm]);
  useEffect(() => {
    const handleKey = (e) => {
      if (!searchTerm) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }

      if (e.key === "Enter") {
        e.preventDefault();
        goNext(); // WhatsApp behavior
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [searchTerm, resultCount]);

  if (!selectedContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center">
        <div className="max-w-md">
          <img src={whatsappImage} alt="chat" className="w-full h-auto " />
          <h2
            className={`text-3xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            Select a conversation to start chatting
          </h2>
          <p
            className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6`}
          >
            Choose a contact from the list on the left to being message
          </p>
          <p
            className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mt-8 text-sm flex justify-center items-center gap-2 `}
          >
            <FaLock className="h-4 w-4" />
            Your personal messages are end-to-end encrypted
          </p>
        </div>
      </div>
    );
  }
  return (
    <>
      <div
        className={`flex h-screen w-full flex-col {theme === "dark" ? "bg-[#303430] text-white" : "bg-[rgb(230,235,240)] text-gray-600"}`}
      >
        {/* upper part ui */}
        <div
          className={`p-4 ${
            theme === "dark"
              ? "bg-[#303430] text-white"
              : "bg-[rgb(229,230,232)] text-gray-600"
          } flex items-center`}
        >
          <button onClick={() => setSelectedContact(null)}>
            <FaArrowLeft className="mr-2 focus:outline-none cursor-pointer h-full w-full " />
          </button>

          <div className="relative ml-4">
            {/* Profile Picture */}
            <img
              src={selectedContact?.profilePicture || "/default-avatar.png"}
              alt={selectedContact?.username}
              onClick={() => setShowContactInfo(true)}
              className="w-10 h-10 rounded-full cursor-pointer object-cover hover:opacity-80 transition-opacity border border-white/10"
            />

            {/* Real-life WhatsApp Online Dot */}
            {online && (
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${theme === "dark" ? "border-[#111b21]" : "border-white"} bg-emerald-500 shadow-sm`}
                title="Online"
              ></span>
            )}
          </div>

          {/* contact image and userName */}
          <div
            className="ml-3 flex-grow cursor-pointer"
            onClick={() => setShowContactInfo(true)}
          >
            <h2 className="font-semibold text-start">
              {selectedContact?.username}
            </h2>

            {isTyping ? (
              <div>Typing...</div>
            ) : (
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {online
                  ? "Online"
                  : lastSeen
                    ? `Last seen ${formatTimestamp(lastSeen)}`
                    : "Offline"}
              </p>
            )}
          </div>

          {/* search icon */}
          <div className="px-4 py-2" ref={searchIconRef}>
            <div className="relative flex items-center justify-end">

              {/* Search Icon Trigger */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`${
                  isSearchOpen
                    ? "opacity-0 pointer-events-none scale-90"
                    : "opacity-100 scale-100"
                }

                group relative p-2 rounded-xl
                transition-all duration-300
              bg-white/30 dark:bg-zinc-800/30
                backdrop-blur-xl

                before:absolute before:inset-0 before:rounded-xl
                before:bg-gradient-to-br before:from-white/40 before:to-transparent
                before:opacity-60 before:pointer-events-none

                border border-white/30 dark:border-white/10
              hover:border-green-400/40

                shadow-[0_2px_15px_rgba(0,0,0,0.06)]
                hover:shadow-[0_8px_30px_rgba(0,255,150,0.15)]

                active:scale-95 cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-green-600/50`}
              >
                <FiSearch
                  className="h-4 w-4
                text-zinc-700 dark:text-zinc-300
                group-hover:text-green-500
                  group-hover:scale-110
                  transition-all duration-300"
                />
              </button>

              {/* Expandable Input */}
              <div
                className={`absolute right-0 origin-righttransition-all duration-300 ${
                  isSearchOpen
                    ? "w-60 sm:w-64 scale-100 opacity-100"
                    : "w-0 scale-95 opacity-0 pointer-events-none"
                }`}
              >
                <div className="relative flex flex-col">
                  {/* Input Wrapper */}
                  <div className="relative w-full rounded-xl overflow-hidden group transition-all duration-300">
                    {/* Glass Overlay */}
                    <div className=" absolute inset-0 rounded-xl pointer-events-none bg-gradient-to-br from-white/40 to-transparent opacity-60 group-focus-within:opacity-80 transition-all duration-300" />

                    <input
                      autoFocus
                      ref={inputRef}
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-8 pr-8 py-1.5 rounded-xl outline-none text-xs relative z-10 backdrop-blur-xl bg-white/30 dark:bg-zinc-800/30 border border-white/30 dark:border-white/10 group-focus-within:border-emerald-400/60 ${theme === "dark" ? "text-white" : "text-gray-900"} shadow-[0_4px_15px_rgba(0,0,0,0.05)] group-focus-within:shadow-[0_6px_20px_rgba(0,255,150,0.2)]  transition-all duration-300 `}
                    />

                    {/* Left Icon */}
                    <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 h-3.5 w-3.5 text-gray-400 group-focus-within:text-emerald-400 transition-all duration-300" />

                    {/* Close Button */}
                    <button
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchTerm("");
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20"
                    >
                      <RxCross2 className=" h-3.5 w-3.5 text-gray-500 group-focus-within:text-emerald-400 hover:text-emerald-500 transition-all duration-300 " />
                    </button>
                  </div>

                  {/* RESULTS / NOT FOUND LOGIC */}
                  {searchTerm.trim() !== "" && (
                    <div className="flex items-center justify-end animate-in fade-in slide-in-from-top-1 duration-300 pt-2">
                      {resultCount > 0 ? (
                        <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-full bg-white/60 dark:bg-zinc-900/60  backdrop-blur-md  border border-white/20 dark:border-white/10  shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                          {/* RESULT COUNTER */}
                          <span className="px-3 text-[11px] font-semibold tracking-tight text-gray-600 dark:text-zinc-300 tabular-nums">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {currentIndex + 1}
                            </span>
                            <span className="mx-1 opacity-40">/</span>
                            <span className="opacity-80">{resultCount}</span>
                          </span>

                          {/* DIVIDER */}
                          <div className="h-4 w-px bg-gradient-to-b from-transparent via-gray-300/40 to-transparent dark:via-zinc-700/40" />

                          {/* BUTTONS */}
                          <div className="flex items-center gap-0.5">
                            {/* PREV */}
                            <button
                              onClick={goPrev}
                              aria-label="Previous"
                              className="group p-1.5 rounded-full text-gray-500 dark:text-zinc-400 hover:text-emerald-600  hover:bg-emerald-500/10 active:scale-90  transition-all duration-200 cursor-pointer"
                            >
                              <svg
                                className="w-3 h-3 group-hover:-translate-y-[1px] transition-transform"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M5 15l7-7 7 7"
                                />
                              </svg>
                            </button>

                            {/* NEXT */}
                            <button
                              onClick={goNext}
                              aria-label="Next"
                              className="group p-1.5 rounded-full text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-90 transition-all duration-200 cursor-pointer"
                            >
                              <svg
                                className="w-3 h-3 group-hover:translate-y-[1px] transition-transform"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* PREMIUM EMPTY STATE */
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 text-[11px] font-medium text-rose-500/90">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                          </span>
                          No results found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Calling Button */}
          <div className="flex items-center space-x-4">
            {/* VIDEO CALL */}
            <button
              className="focus:outline-none cursor-pointer"
              onClick={handleVideoCall}
              title={online ? "Start video call" : "user is offline"}
            >
              <FaVideo className="h-7 w-7 text-green-500 hover:text-green-600" />
            </button>

            {/* AUDIO CALL */}
            <button
              className="focus:outline-none cursor-pointer"
              onClick={handleAudioCall}
              title={online ? "Start audio call" : "user is offline"}
            >
              <FaPhone className="h-5 w-5 text-green-500 hover:text-green-600" />
            </button>

            <button className="focus:outline-none cursor-pointer">
              <HiDotsVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* message part seen */}
        <div
          className={`flex-1 p-4 overflow-y-auto scroll-smooth custom-scrollbar relative transition-colors duration-500 ${
            theme === "dark"
              ? "bg-[#0b141a] bg-opacity-95"
              : "bg-[#efe7de]"
          }`}
          style={{
            backgroundImage:
              theme === "dark"
                ? `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`
                : `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
            backgroundBlendMode: theme === "dark" ? "overlay" : "soft-light",
            backgroundSize: "400px",
          }}
        >
          {/* The grouping logic is solid, let's just ensure the rendering is clean */}
          <div className="max-w-4xl mx-auto flex flex-col space-y-2">
            {Object.entries(finalMessagesToRender).map(([date, msgs]) => {
              if (msgs.length === 0) return null;

              return (
                <React.Fragment key={date}>
                  <div className="flex justify-center my-4">
                    <span className="px-4 py-1.5 text-xs text-gray-400">
                      {renderDateSeparator(new Date(date))}
                    </span>
                  </div>

                  {msgs.map((msg) => {
                    const isMatch =
                      searchTerm &&
                      (msg.content || "")
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase());
                    if (isMatch) {
                      matchCounter++;
                    }
                    return (
                      <MessageBuble
                        key={msg._id || msg.temp}
                        message={msg}
                        theme={theme}
                        currentUser={user}
                        onReact={handleReaction}
                        deleteMessage={deleteMessage}
                        searchTerm={searchTerm}
                        highlightText={highlightText}
                        dataMatch={isMatch}
                        isActive={isMatch && matchCounter === currentIndex}
                        setRef={(el) => {
                          if (isMatch && el) {
                            messageRefs.current.push(el);
                          }
                        }}
                      />
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>

          <div ref={messageEndRef} className="h-4" />
        </div>

        {/* file */}
        {filePreview && (
          <div className="relative p-2">
            {selectedFile?.type.startsWith("video/") ? (
              <video
                src={filePreview}
                controls
                className="w-80 object-cover rounded shadow-lg mx-auto "
              />
            ) : (
              <img
                src={filePreview}
                alt="file-preview"
                className="w-80 object-cover rounded shadow-lg mx-auto"
              />
            )}

            <button
              onClick={() => {
                setSelectedFile(null);
                setFilePreview(null);
              }}
              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* down part ui */}
        <div
          className={`p-4 ${theme === "dark" ? "bg-[#303430]" : "bg-white"} flex items-center space-x-2 relative`}
        >
          {/* emoji icon ui */}
          <button
            className="focus:outline-none"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <FaSmile
              className={`h-6 w-6 cursor-pointer ${theme === "dark" ? "text-gray-400" : "text-gray-500"} ml-2 `}
            />
          </button>

          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute left-4 bottom-20 z-50"
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

          {/*file menu ui */}
          <div className="relative" ref={fileMenuRef}>
            <button
              className="focus:outline-none"
              onClick={() => setShowFileMenu(!showFileMenu)}
            >
              <FaPaperclip
                className={`h-5.5 w-5.5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"} mt-2 ml-2 cursor-pointer `}
              />
            </button>

            {showFileMenu && (
              <div
                className={`absolute bottom-full left-0 mb-2 ${theme === "dark" ? "bg-gray-700" : "bg-white"} rounded-lg shadow-lg `}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className={`flex items-center px-4 py-2 w-full transition-colors ${theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-100"} cursor-pointer`}
                >
                  <FaImage className="mr-2" />
                  Image/Video
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className={`flex items-center px-4 py-2 w-full transition-colors ${theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-100"} cursor-pointer`}
                >
                  <FaFile className="mr-2" />
                  Document
                </button>
              </div>
            )}
          </div>

          {/* //send message ui */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            placeholder="Type a message 
        "
            className={`flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 ${theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}
          />
          <button onClick={handleSendMessage} className="focus:outline-none">
            <FaPaperPlane className="h-6 w-6 text-green-500 cursor-pointer" />
          </button>
        </div>
      </div>
      <VideoCallManager socket={socket} />
    </>
  );
};

export default ChatWindow;
