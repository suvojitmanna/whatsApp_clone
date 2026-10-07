import React, { useEffect, useRef, useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import { isToday, isYesterday, format } from "date-fns";
import whatsappImage from "../../assets/whatsapp_image.png";
import {
  FaArrowLeft,
  FaCamera,
  FaFileAlt,
  FaHeadphones,
  FaImage,
  FaLock,
  FaPhone,
  FaPlus,
  FaTrash,
  FaVideo,
} from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { BiSolidSend } from "react-icons/bi";
import { FaRegFaceSmile, FaSquarePollHorizontal } from "react-icons/fa6";
import { MdEventNote } from "react-icons/md";
import { TfiClip, TfiLineDouble } from "react-icons/tfi";
import { MdAddReaction } from "react-icons/md";
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
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { RiContactsFill, RiEmojiStickerLine } from "react-icons/ri";
import CameraModal from "../../components/CameraModal";

const isValidate = (date) => {
  return date instanceof Date && !isNaN(date);
};
const ChatWindow = ({ selectedContact, setSelectedContact, onStatusClick }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [isStickerMode, setIsStickerMode] = useState(false);

  const typingTimeOutRef = useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const stickerInputRef = useRef(null);
  const fileMenuRef = useRef(null);
  const searchIconRef = useRef(null);
  const inputRef = useRef(null);
  const messageRefs = useRef([]);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { socket } = getSocket();
  const {
    messages,
    sendMessage,
    fetchMessages,
    fetchConversations,
    conversations,
    isUserTyping,
    startTying,
    stopTying,
    getUserLastSeen,
    isUserOnline,
    deleteMessage,
    addReaction,
    editMessage,
  } = useChatStore();

  let matchCounter = -1;

  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const conversationId = selectedContact?.conversation?._id;
  const isTyping = isUserTyping(conversationId, selectedContact?._id);

  const setShowContactInfo = useLayoutStore(
    (state) => state.setShowContactInfo,
  );

  const setCurrentConversation = useChatStore(
    (state) => state.setCurrentConversation,
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

  useOutsideClick(fileMenuRef, () => {
    if (showFileMenu) setShowFileMenu(false);
  });

  useOutsideClick(emojiPickerRef, () => {
    if (showEmojiPicker) setShowEmojiPicker(false);
  });

  const handleFileChange = (e, typeHint = null) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);
      if (typeHint === "sticker") {
        setIsStickerMode(true);
      } else {
        setIsStickerMode(false);
      }

      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file));
      } else if (file.type.startsWith("audio/")) {
        setFilePreview("audio:" + file.name);
      } else {
        setFilePreview("doc:" + file.name);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContact) return;
    try {
      const formData = new FormData();
      formData.append("senderId", user?._id);
      formData.append("receiverId", selectedContact?._id);

      const status = online ? "delivered" : "send";
      formData.append("messageStatus", status);
      formData.append("content", message.trim() || "");

      if (selectedFile) {
        formData.append("media", selectedFile);
        formData.append("fileName", selectedFile.name);
        formData.append(
          "fileSize",
          `${(selectedFile.size / 1024).toFixed(1)} KB`
        );

        if (isStickerMode) {
          formData.append("contentType", "sticker");
        } else if (selectedFile.type.startsWith("image/")) {
          formData.append("contentType", "image");
        } else if (selectedFile.type.startsWith("video/")) {
          formData.append("contentType", "video");
        } else if (selectedFile.type.startsWith("audio/")) {
          formData.append("contentType", "audio");
        } else {
          formData.append("contentType", "document");
        }
      }

      if (!message.trim() && !selectedFile) return;

      await sendMessage(formData);

      setMessage("");
      setFilePreview(null);
      setSelectedFile(null);
      setIsStickerMode(false);
      setShowFileMenu(false);
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const handleSendPoll = async ({ question, options, allowMultiple }) => {
    if (!selectedContact || !question.trim()) return;
    try {
      const formData = new FormData();
      formData.append("senderId", user?._id);
      formData.append("receiverId", selectedContact?._id);
      formData.append("messageStatus", online ? "delivered" : "send");
      formData.append("contentType", "poll");
      formData.append("content", question.trim());
      formData.append(
        "pollData",
        JSON.stringify({
          question: question.trim(),
          options: options.map((opt) => ({ text: opt.trim(), votes: [] })),
          allowMultiple: !!allowMultiple,
        })
      );

      await sendMessage(formData);
      setShowPollModal(false);
    } catch (error) {
      console.error("Failed to send poll", error);
    }
  };

  const handleSendContact = async (contactInfo) => {
    if (!selectedContact || !contactInfo.name) return;
    try {
      const formData = new FormData();
      formData.append("senderId", user?._id);
      formData.append("receiverId", selectedContact?._id);
      formData.append("messageStatus", online ? "delivered" : "send");
      formData.append("contentType", "contact");
      formData.append("content", `Contact: ${contactInfo.name}`);
      formData.append("contactData", JSON.stringify(contactInfo));

      await sendMessage(formData);
      setShowContactModal(false);
    } catch (error) {
      console.error("Failed to send contact", error);
    }
  };

  const handleSendEvent = async (eventInfo) => {
    if (!selectedContact || !eventInfo.title) return;
    try {
      const formData = new FormData();
      formData.append("senderId", user?._id);
      formData.append("receiverId", selectedContact?._id);
      formData.append("messageStatus", online ? "delivered" : "send");
      formData.append("contentType", "event");
      formData.append("content", `Event: ${eventInfo.title}`);
      formData.append("eventData", JSON.stringify(eventInfo));

      await sendMessage(formData);
      setShowEventModal(false);
    } catch (error) {
      console.error("Failed to send event", error);
    }
  };

  const handleSendSticker = async (stickerUrlOrFile) => {
    if (!selectedContact || !stickerUrlOrFile) return;
    try {
      const formData = new FormData();
      formData.append("senderId", user?._id);
      formData.append("receiverId", selectedContact?._id);
      formData.append("messageStatus", online ? "delivered" : "send");
      formData.append("contentType", "sticker");
      formData.append("content", "Sticker");

      if (stickerUrlOrFile instanceof File) {
        formData.append("media", stickerUrlOrFile);
      } else {
        formData.append("imageOrVideoUrl", stickerUrlOrFile);
      }

      await sendMessage(formData);
      setShowStickerModal(false);
    } catch (error) {
      console.error("Failed to send sticker", error);
    }
  };

  const renderDateSeparator = (date) => {
    if (!isValidate(date)) {
      return null;
    }

    let dateString;
    if (isToday(date)) {
      dateString = "TODAY";
    } else if (isYesterday(date)) {
      dateString = "YESTERDAY";
    } else {
      dateString = format(date, "EEEE, MMMM d");
    }

    return (
      <div className="flex justify-center my-3 select-none">
        <span
          className={`px-3 py-1.5 text-xs font-medium rounded-lg shadow-sm transition-colors ${
            theme === "dark"
              ? "bg-[#182229] text-[#8696a0]"
              : "bg-white text-[#54656f]"
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
        goNext();
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
        className={`flex h-screen w-full flex-col ${theme === "dark" ? "bg-[#0b141a] text-white" : "bg-[#efe7de] text-gray-900"}`}
      >
        <div
          className={`p-1 border-b ${theme === "dark"
            ? "bg-[#202c33] border-gray-700/60 text-white"
            : "bg-[#f0f2f5] border-gray-200 text-gray-900"
            } flex items-center`}
        >
          <button
            onClick={() => {
              setSelectedContact(null);
              setCurrentConversation(null);
            }}
            className="mr-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <FaArrowLeft className="h-5 w-5" />
          </button>

          <div className="relative ml-2 sm:ml-4">
            <motion.img
              layoutId="profile-image"
              src={selectedContact?.profilePicture || "/default-avatar.png"}
              alt={selectedContact?.username}
              onClick={(e) => {
                e.stopPropagation();
                setShowContactInfo(true);
              }}
              className="w-10 h-10 rounded-full cursor-pointer object-cover "
            />

            {online && (
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${theme === "dark" ? "border-[#202c33]" : "border-white"} bg-emerald-500 shadow-sm`}
                title="Online"
              ></span>
            )}
          </div>

          <div
            className="ml-3 flex-grow cursor-pointer min-w-0"
            onClick={() => setShowContactInfo(true)}
          >
            <h2 className={`font-semibold text-start text-base sm:text-lg truncate ${theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
              {selectedContact?.username}
            </h2>

            {isTyping ? (
              <div className="text-xs sm:text-sm text-emerald-500 font-medium">Typing...</div>
            ) : (
              <p
                className={`text-xs sm:text-sm truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
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

          <div className="px-2 sm:px-4 py-2" ref={searchIconRef}>
            <div className="relative flex items-center justify-end">
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`${isSearchOpen
                  ? "opacity-0 pointer-events-none scale-90"
                  : "opacity-100 scale-100"
                  }group relative p-2 rounded-xl transition-all duration-300 bg-white/30 dark:bg-zinc-800/30 backdrop-blur-xl before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-60 before:pointer-events-none border border-white/30 dark:border-white/10 hover:border-green-400/40 shadow-[0_2px_15px_rgba(0,0,0,0.06)]
                hover:shadow-[0_8px_30px_rgba(0,255,150,0.15)] active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-600/50`}
              >
                <FiSearch className="h-4 w-4text-zinc-700 dark:text-zinc-300 group-hover:text-green-500group-hover:scale-110 transition-all duration-300" />
              </button>

              <div
                className={`absolute right-0 origin-righttransition-all duration-300 ${isSearchOpen
                  ? "w-60 sm:w-64 scale-100 opacity-100"
                  : "w-0 scale-95 opacity-0 pointer-events-none"
                  }`}
              >
                <div className="relative flex flex-col">
                  <div className="relative w-full rounded-xl overflow-hidden group transition-all duration-300">

                    <div
                      className={`absolute inset-0 rounded-xl pointer-events-none bg-gradient-to-br opacity-60 group-focus-within:opacity-80 transition-all duration-300 
                        ${theme === "dark"
                          ? "from-white/10 via-white/5 to-transparent"
                          : "from-white/60 via-white/30 to-transparent"
                        }`}
                    />

                    <input
                      autoFocus
                      ref={inputRef}
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-8 pr-8 py-1.5 rounded-xl outline-none text-xs relative z-10 backdrop-blur-xl border transition-all duration-300
                      ${theme === "dark"
                          ? "bg-zinc-800/70 text-white placeholder:text-gray-500 border-white/10 focus:border-emerald-400/60 focus:bg-zinc-800/90"
                          : "bg-white/70 text-gray-900 placeholder:text-gray-400 border-gray-200/80 focus:border-emerald-400/60 focus:bg-white/90"
                        }shadow-[0_4px_15px_rgba(0,0,0,0.05)] focus:shadow-[0_6px_20px_rgba(0,255,150,0.2)]`}
                    />

                    <FiSearch
                      className={`absolute left-2.5 top-1/2 -translate-y-1/2 z-20 h-3.5 w-3.5 transition-all duration-300 ${theme === "dark"
                        ? "text-gray-500 group-focus-within:text-emerald-400"
                        : "text-gray-400 group-focus-within:text-emerald-500"
                        }`}
                    />

                    <button
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchTerm("");
                      }}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 z-20 transition-all duration-300${theme === "dark"
                        ? "text-gray-500 hover:text-emerald-400"
                        : "text-gray-400 hover:text-emerald-500"
                        }`}
                    >
                      <RxCross2 className="h-3.5 w-3.5 cursor-pointer" />
                    </button>
                  </div>

                  {searchTerm.trim() !== "" && (
                    <div className="flex items-center justify-end animate-in fade-in slide-in-from-top-1 duration-300 pt-2">
                      {resultCount > 0 ? (
                        <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-full bg-white/60 dark:bg-zinc-900/60  backdrop-blur-md  border border-white/20 dark:border-white/10  shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                          <span className="px-3 text-[11px] font-semibold tracking-tight text-gray-600 dark:text-zinc-300 tabular-nums">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {currentIndex + 1}
                            </span>
                            <span className="mx-1 opacity-40">/</span>
                            <span className="opacity-80">{resultCount}</span>
                          </span>
                          <div className="h-4 w-px bg-gradient-to-b from-transparent via-gray-300/40 to-transparent dark:via-zinc-700/40" />

                          <div className="flex items-center gap-0.5">
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

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              onClick={handleVideoCall}
              title={online ? "Start video call" : "user is offline"}
            >
              <FaVideo className="h-5 w-5 text-emerald-500 hover:text-emerald-600" />
            </button>

            <button
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              onClick={handleAudioCall}
              title={online ? "Start audio call" : "user is offline"}
            >
              <FaPhone className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
            </button>

            <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer">
              <HiDotsVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          className={`flex-1 px-2 sm:px-4 md:px-5 py-2 overflow-y-auto scroll-smooth custom-scrollbar relative transition-colors duration-500 ${theme === "dark" ? "bg-[#0b141a] bg-opacity-95" : "bg-[#efe7de]"
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
          <div className="w-full max-w-[1400px] mx-auto flex flex-col space-y-1.5">
            {Object.entries(finalMessagesToRender).map(([date, msgs]) => {
              if (msgs.length === 0) return null;

              return (
                <React.Fragment key={date}>
                  {renderDateSeparator(new Date(date))}

                  {msgs.map((msg, index) => {
                    const prevMsg = index > 0 ? msgs[index - 1] : null;
                    const prevSenderId = (prevMsg?.sender?._id || prevMsg?.sender)?.toString();
                    const currentSenderId = (msg?.sender?._id || msg?.sender)?.toString();
                    const isFirstInSequence = !prevMsg || prevSenderId !== currentSenderId;

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
                        onEdit={editMessage}
                        onStatusClick={onStatusClick}
                        searchTerm={searchTerm}
                        highlightText={highlightText}
                        dataMatch={isMatch}
                        isActive={isMatch && matchCounter === currentIndex}
                        isFirstInSequence={isFirstInSequence}
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
        {filePreview && (
          <div
            className={`p-3 border-t flex items-center justify-between transition-colors ${theme === "dark"
              ? "bg-[#1f2c33] border-white/10 text-white"
              : "bg-gray-100 border-gray-200 text-gray-800"
              }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {filePreview.startsWith("doc:") ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#7f66ff]/20 text-[#7f66ff] flex items-center justify-center shrink-0">
                    <FaFileAlt size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate max-w-xs sm:max-w-md">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs opacity-60">
                      {(selectedFile?.size / 1024).toFixed(1)} KB • Document
                    </p>
                  </div>
                </div>
              ) : filePreview.startsWith("audio:") ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#f2790f]/20 text-[#f2790f] flex items-center justify-center shrink-0">
                    <FaHeadphones size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate max-w-xs sm:max-w-md">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs opacity-60">
                      {(selectedFile?.size / 1024).toFixed(1)} KB • Audio
                    </p>
                  </div>
                </div>
              ) : selectedFile?.type?.startsWith("video/") ? (
                <div className="relative">
                  <video
                    src={filePreview}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                    <FaVideo className="text-white text-xs" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={filePreview}
                    alt="preview"
                    className="w-16 h-16 rounded-xl object-cover ring-1 ring-black/10"
                  />
                  {isStickerMode && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#02b875] text-white shadow">
                      Sticker
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setFilePreview(null);
                setIsStickerMode(false);
              }}
              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-red-500 cursor-pointer transition"
              title="Remove"
            >
              <RxCross2 size={18} />
            </button>
          </div>
        )}

        <div
          className={`p-3 sm:p-4 ${theme === "dark" ? "" : ""
            } flex items-center relative transition-colors`}
        >
          <div
            className={`relative w-full flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1.5 rounded-full transition-all duration-200 ${theme === "dark"
              ? "bg-[#2a3942]"
              : "bg-white shadow-sm"
              }`}
          >
            <div className="relative shrink-0" ref={fileMenuRef}>
              <button
                type="button"
                className={`focus:outline-none p-2 rounded-full transition cursor-pointer ${showFileMenu
                  ? "bg-black/10 dark:bg-white/15"
                  : "hover:bg-black/5 dark:hover:bg-white/10"
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
                className="hidden"
              />

              <input
                type="file"
                ref={documentInputRef}
                onChange={(e) => handleFileChange(e, "document")}
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv,application/*"
                className="hidden"
              />

              <input
                type="file"
                ref={audioInputRef}
                onChange={(e) => handleFileChange(e, "audio")}
                accept="audio/*"
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#7f66ff] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#007bfc] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#ff2e74] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#f2790f] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#009de2] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#ffb703] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#a855f7] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#02b875] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
                        <MdAddReaction className="text-white text-[17px]" />
                      </div>

                      <span className="text-[14px] font-medium tracking-tight">
                        New sticker
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            <div className="relative shrink-0">
              <button
                type="button"
                className="focus:outline-none p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                onClick={() =>
                  setShowEmojiPicker(!showEmojiPicker)
                }
                title="Emoji"
              >
                <RiEmojiStickerLine
                  className={`h-5 w-5 sm:h-6 sm:w-6 ${theme === "dark"
                    ? "text-gray-400"
                    : "text-gray-500"
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
                        setMessage(
                          (prev) => prev + emojiObject.emoji
                        );
                      }

                      setShowEmojiPicker(false);
                    }}
                    theme={theme}
                  />
                </div>
              )}
            </div>

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message"
              className={`flex-1 min-w-0 w-full  bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm sm:text-base ${theme === "dark"
                ? "text-white placeholder-gray-400"
                : "text-black placeholder-gray-500"
                }`}
            />

            <button
              type="button"
              onClick={handleSendMessage}
              className="shrink-0 p-2 rounded-full bg-green-500 hover:bg-green-600 active:scale-95 transition cursor-pointer"
              title="Send"
            >
              <IoSend className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
            </button>
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraModal
          onClose={() => setShowCamera(false)}
          onCapture={(file) => {
            setSelectedFile(file);
            setFilePreview(URL.createObjectURL(file));
            setShowCamera(false);
          }}
        />
      )}
      {showPollModal && (
        <PollModal
          onClose={() => setShowPollModal(false)}
          onSend={handleSendPoll}
          theme={theme}
        />
      )}
      {showContactModal && (
        <ContactModal
          onClose={() => setShowContactModal(false)}
          onSend={handleSendContact}
          conversations={conversations}
          theme={theme}
        />
      )}
      {showEventModal && (
        <EventModal
          onClose={() => setShowEventModal(false)}
          onSend={handleSendEvent}
          theme={theme}
        />
      )}
      {showStickerModal && (
        <StickerModal
          onClose={() => setShowStickerModal(false)}
          onSend={handleSendSticker}
          onUploadClick={() => {
            setShowStickerModal(false);
            stickerInputRef.current?.click();
          }}
          theme={theme}
        />
      )}

      <VideoCallManager socket={socket} />
    </>
  );
};

const PollModal = ({ onClose, onSend, theme }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [activeEmojiTarget, setActiveEmojiTarget] = useState(null);
  const emojiPickerRef = useRef(null);
  const isDark = theme === "dark";

  useOutsideClick(emojiPickerRef, (e) => {
    if (e?.target?.closest?.("button[data-emoji-trigger='true']")) {
      return;
    }
    if (activeEmojiTarget !== null) {
      setActiveEmojiTarget(null);
    }
  });

  const handleEmojiSelect = (emojiObject) => {
    if (!emojiObject?.emoji) return;
    const emoji = emojiObject.emoji;
    if (activeEmojiTarget === "question") {
      setQuestion((prev) => prev + emoji);
    } else if (typeof activeEmojiTarget === "number") {
      setOptions((prev) => {
        const updated = [...prev];
        updated[activeEmojiTarget] = (updated[activeEmojiTarget] || "") + emoji;
        return updated;
      });
    }
  };

  const handleOptionChange = (val, idx) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const addOption = () => {
    if (options.length < 12) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (idx) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const updated = [...options];
    const [movedItem] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, movedItem);
    setOptions(updated);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const validOptions = options.filter((o) => o.trim() !== "");
  const canSubmit = question.trim() !== "" && validOptions.length >= 2;

  return (
    <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="flex flex-col md:flex-row items-center justify-center gap-3.5 max-w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`w-[92vw] max-w-md rounded-2xl border shadow-2xl p-6 relative ${isDark
            ? "bg-[#111b21] border-white/10 text-white"
            : "bg-white border-gray-200 text-gray-900"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <FaSquarePollHorizontal className="text-green-600" size={20} />
              <h2 className="text-lg font-bold">Create poll</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <RxCross2 size={18} />
            </button>
          </div>

          <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Question
              </label>

              <div className="relative mt-1.5">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className={`w-full px-3.5 py-2.5 pr-11 rounded-xl border text-sm outline-none transition ${isDark
                    ? "bg-[#202c33] border-white/10 text-white placeholder-gray-400 focus:border-emerald-500"
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-600"
                    }`}
                  autoFocus
                />

                <button
                  type="button"
                  data-emoji-trigger="true"
                  onClick={() =>
                    setActiveEmojiTarget((prev) =>
                      prev === "question" ? null : "question"
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                  title="Add emoji"
                >
                  <FaRegFaceSmile
                    className={`transition ${activeEmojiTarget === "question"
                      ? "text-emerald-500 scale-110"
                      : isDark
                        ? "text-gray-400 hover:text-emerald-400"
                        : "text-gray-500 hover:text-emerald-600"
                      }`}
                  />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Options
              </label>
              <div className="space-y-2.5 mt-1.5">
                {options.map((opt, idx) => (
                  <div
                    key={idx}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`flex items-center gap-2 rounded-xl transition-all duration-150 ${draggedIdx === idx
                      ? "opacity-35 scale-[0.98]"
                      : "opacity-100"
                      } ${dragOverIdx === idx && draggedIdx !== idx
                        ? "ring-2 ring-emerald-500 bg-emerald-500/10 p-0.5"
                        : ""
                      }`}
                  >
                    <span className="text-xs font-bold w-4 shrink-0 text-center select-none text-gray-500 dark:text-gray-400">
                      {idx + 1}
                    </span>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(e.target.value, idx)}
                        placeholder={`Option ${idx + 1}`}
                        className={`w-full px-3 py-2 pr-16 rounded-xl border text-sm outline-none transition ${isDark
                          ? "bg-[#202c33] border-white/10 text-white placeholder-gray-400 focus:border-emerald-500"
                          : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-600"
                          }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <button
                          type="button"
                          data-emoji-trigger="true"
                          onClick={() =>
                            setActiveEmojiTarget((prev) =>
                              prev === idx ? null : idx
                            )
                          }
                          className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                          title="Add emoji"
                        >
                          <FaRegFaceSmile
                            className={`transition ${activeEmojiTarget === idx
                              ? "text-emerald-500 scale-110"
                              : isDark
                                ? "text-gray-400 hover:text-emerald-400"
                                : "text-gray-500 hover:text-emerald-600"
                              }`}
                          />
                        </button>

                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragEnd={handleDragEnd}
                          className="p-1 cursor-grab active:cursor-grabbing hover:bg-black/10 dark:hover:bg-white/10 rounded transition flex items-center justify-center select-none"
                          title="Drag to reorder option"
                        >
                          <TfiLineDouble
                            className={`pointer-events-none transition ${isDark
                              ? "text-gray-500 hover:text-emerald-400"
                              : "text-gray-400 hover:text-emerald-600"
                              }`}
                          />
                        </div>
                      </div>
                    </div>

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="p-2 text-red-400 hover:text-red-500 cursor-pointer shrink-0"
                      >
                        <FaTrash size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 12 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition cursor-pointer"
                >
                  <FaPlus size={10} /> Add option
                </button>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Allow multiple answers</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  People can select more than one option
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAllowMultiple(!allowMultiple)}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${allowMultiple
                  ? "bg-emerald-500"
                  : isDark
                    ? "bg-gray-700"
                    : "bg-gray-300"
                  }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${allowMultiple ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition ${isDark
                ? "hover:bg-white/10 text-gray-300"
                : "hover:bg-black/5 text-gray-600"
                }`}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() =>
                onSend({ question, options: validOptions, allowMultiple })
              }
              className="p-3 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-emerald-500/20 cursor-pointer rounded-full"
            >
              <BiSolidSend className="text-black" size={20} />
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {activeEmojiTarget !== null && (
            <motion.div
              ref={emojiPickerRef}
              initial={{ opacity: 0, x: -15, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -15, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`w-[320px] xs:w-[340px] sm:w-[350px] max-w-[92vw] h-[490px] max-h-[85vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col shrink-0 ${isDark
                ? "bg-[#111b21] border-white/10 text-white"
                : "bg-white border-gray-200 text-gray-900"
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <FaRegFaceSmile className="text-emerald-500" size={16} />
                  <h3 className="text-sm font-semibold">
                    {activeEmojiTarget === "question"
                      ? "Add emoji to Question"
                      : `Add emoji to Option ${activeEmojiTarget + 1}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveEmojiTarget(null)}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                  title="Close emoji picker"
                >
                  <RxCross2 size={16} />
                </button>
              </div>

              <div className="flex-1 w-full overflow-hidden flex justify-center [&_.EmojiPickerReact]:!border-none [&_.EmojiPickerReact]:!w-full [&_.EmojiPickerReact]:!h-full">
                <EmojiPicker
                  theme={isDark ? "dark" : "light"}
                  onEmojiClick={handleEmojiSelect}
                  width="100%"
                  height="100%"
                  lazyLoadEmojis={true}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ContactModal = ({ onClose, onSend, conversations, theme }) => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const isDark = theme === "dark";

  const allContacts =
    conversations?.data?.flatMap((c) => c.participants) || [];
  const uniqueContacts = Array.from(
    new Map(allContacts.map((c) => [c._id, c])).values()
  );

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${isDark
          ? "bg-[#111b21] border-white/10 text-white"
          : "bg-white border-gray-200 text-gray-900"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <RiContactsFill className="text-cyan-500" size={20} />
            <h2 className="text-lg font-bold">Share Contact</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <RxCross2 size={18} />
          </button>
        </div>

        <div className="flex gap-2 my-4 p-1 rounded-xl bg-black/5 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setActiveTab("chats")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${activeTab === "chats"
              ? "bg-emerald-500 text-white shadow-sm"
              : "opacity-70 hover:opacity-100"
              }`}
          >
            From Chats
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${activeTab === "manual"
              ? "bg-emerald-500 text-white shadow-sm"
              : "opacity-70 hover:opacity-100"
              }`}
          >
            Enter Details
          </button>
        </div>

        {activeTab === "chats" ? (
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {uniqueContacts.length > 0 ? (
              uniqueContacts.map((contact) => (
                <div
                  key={contact._id}
                  onClick={() =>
                    onSend({
                      name: contact.username || "User",
                      phoneNumber: contact.phoneNumber || "",
                      email: contact.email || "",
                      avatar: contact.profilePicture || "",
                    })
                  }
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${isDark
                    ? "border-white/5 hover:bg-white/10"
                    : "border-black/5 hover:bg-black/5"
                    }`}
                >
                  <img
                    src={contact.profilePicture || "/default-avatar.png"}
                    alt={contact.username}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {contact.username}
                    </p>
                    <p className="text-xs opacity-60 truncate">
                      {contact.phoneNumber || contact.email || "Contact"}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-500 font-semibold">
                    Share
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-xs opacity-60">
                No contacts found
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className={`mt-1 w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${isDark
                  ? "bg-[#202c33] border-white/10 focus:border-emerald-500"
                  : "bg-gray-50 border-gray-300 focus:border-emerald-600"
                  }`}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                Phone Number *
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 234 567 8900"
                className={`mt-1 w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${isDark
                  ? "bg-[#202c33] border-white/10 focus:border-emerald-500"
                  : "bg-gray-50 border-gray-300 focus:border-emerald-600"
                  }`}
              />
            </div>
            <div>
              <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                Email (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`mt-1 w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${isDark
                  ? "bg-[#202c33] border-white/10 focus:border-emerald-500"
                  : "bg-gray-50 border-gray-300 focus:border-emerald-600"
                  }`}
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!name.trim() || !phoneNumber.trim()}
                onClick={() => onSend({ name, phoneNumber, email })}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 transition cursor-pointer"
              >
                Share
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const EventModal = ({ onClose, onSend, theme }) => {
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const isDark = theme === "dark";

  const canSubmit = title.trim() !== "" && eventDate !== "";

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${isDark
          ? "bg-[#111b21] border-white/10 text-white"
          : "bg-white border-gray-200 text-gray-900"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <MdEventNote className="text-purple-500" size={22} />
            <h2 className="text-lg font-bold">Create event</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <RxCross2 size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
              Event Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Birthday Party, Team Catchup"
              className={`mt-1 w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${isDark
                ? "bg-[#202c33] border-white/10 focus:border-purple-500"
                : "bg-gray-50 border-gray-300 focus:border-purple-600"
                }`}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                Date *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={`mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none ${isDark
                  ? "bg-[#202c33] border-white/10 focus:border-purple-500"
                  : "bg-gray-50 border-gray-300 focus:border-purple-600"
                  }`}
              />
            </div>
            <div>
              <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                Time
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className={`mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none ${isDark
                  ? "bg-[#202c33] border-white/10 focus:border-purple-500"
                  : "bg-gray-50 border-gray-300 focus:border-purple-600"
                  }`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location (optional)"
              className={`mt-1 w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${isDark
                ? "bg-[#202c33] border-white/10 focus:border-purple-500"
                : "bg-gray-50 border-gray-300 focus:border-purple-600"
                }`}
            />
          </div>

          <div>
            <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description (optional)"
              className={`mt-1 w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none resize-none ${isDark
                ? "bg-[#202c33] border-white/10 focus:border-purple-500"
                : "bg-gray-50 border-gray-300 focus:border-purple-600"
                }`}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              onSend({ title, eventDate, eventTime, location, description })
            }
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 transition shadow-md shadow-purple-500/20 cursor-pointer"
          >
            Create Event
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const StickerModal = ({ onClose, onSend, onUploadClick, theme }) => {
  const isDark = theme === "dark";

  const presetStickers = [
    {
      name: "Thumbs Up",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.webp",
    },
    {
      name: "Heart Fire",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp",
    },
    {
      name: "Joy Tears",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp",
    },
    {
      name: "Party Popper",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp",
    },
    {
      name: "Fire",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp",
    },
    {
      name: "Star Struck",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.webp",
    },
    {
      name: "Clapping Hands",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.webp",
    },
    {
      name: "100",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.webp",
    },
    {
      name: "Mind Blown",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.webp",
    },
    {
      name: "Cool Sunglasses",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp",
    },
    {
      name: "Folded Hands",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.webp",
    },
    {
      name: "Rocket",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp",
    },
  ];

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${isDark
          ? "bg-[#111b21] border-white/10 text-white"
          : "bg-white border-gray-200 text-gray-900"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <MdAddReaction className="text-emerald-500" size={22} />
            <h2 className="text-lg font-bold">Stickers</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <RxCross2 size={18} />
          </button>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={onUploadClick}
            className={`w-full py-2.5 px-4 rounded-xl border border-dashed flex items-center justify-center gap-2 font-semibold text-sm transition cursor-pointer ${isDark
              ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              : "border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              }`}
          >
            <FaPlus size={12} /> Upload Custom Sticker (PNG / WebP / Image)
          </button>

          <p className="text-xs font-semibold opacity-60 uppercase tracking-wider mt-5 mb-3">
            Popular Stickers
          </p>

          <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
            {presetStickers.map((s, idx) => (
              <motion.button
                key={idx}
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSend(s.url)}
                className={`p-2 rounded-2xl flex items-center justify-center transition cursor-pointer ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"
                  }`}
                title={s.name}
              >
                <img
                  src={s.url}
                  alt={s.name}
                  className="w-14 h-14 object-contain"
                />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatWindow;
