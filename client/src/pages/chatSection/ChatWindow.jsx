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
  FaVideo,
} from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { FaSquarePollHorizontal } from "react-icons/fa6";
import { MdEventNote } from "react-icons/md";
import { TfiClip } from "react-icons/tfi";
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
import PollModal from "../../components/pollModal";
import ContactModal from "../../components/ContactModal";
import EventModal from "../../components/EventModal";
import StickerModal from "../../components/StickerModal";

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
  const [editingEventMessage, setEditingEventMessage] = useState(null);
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
    scrollPositions,
    saveScrollPosition,
  } = useChatStore();

  const messagesContainerRef = useRef(null);
  const prevContactIdRef = useRef(null);
  const isInitialScrollDone = useRef(false);

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
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    } else {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleMessageScroll = () => {
    const el = messagesContainerRef.current;
    if (!el || !selectedContact?._id) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    saveScrollPosition(selectedContact._id, {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      isAtBottom,
    });
  };

  useEffect(() => {
    if (prevContactIdRef.current !== selectedContact?._id) {
      prevContactIdRef.current = selectedContact?._id;
      isInitialScrollDone.current = false;
    }
  }, [selectedContact?._id]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || !selectedContact?._id || messages.length === 0) return;

    const savedPos = scrollPositions?.[selectedContact._id];

    if (!isInitialScrollDone.current) {
      if (savedPos) {
        if (savedPos.isAtBottom) {
          el.scrollTop = el.scrollHeight;
        } else {
          el.scrollTop = savedPos.scrollTop;
        }
      } else {
        el.scrollTop = el.scrollHeight;
      }
      isInitialScrollDone.current = true;
    } else {
      if (savedPos?.isAtBottom ?? true) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [messages, selectedContact?._id]);

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

      if (selectedContact?._id) {
        saveScrollPosition(selectedContact._id, {
          isAtBottom: true,
          scrollTop: 9999999,
          scrollHeight: 9999999,
        });
      }
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }

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

  const handleEditEventClick = (eventMsg) => {
    setEditingEventMessage(eventMsg);
    setShowEventModal(true);
  };

  const handleUpdateEvent = async (updatedEventInfo) => {
    if (!editingEventMessage?._id) return;
    try {
      await editMessage(
        editingEventMessage._id,
        `Event: ${updatedEventInfo.title}`,
        updatedEventInfo
      );
      setShowEventModal(false);
      setEditingEventMessage(null);
    } catch (error) {
      console.error("Failed to update event", error);
    }
  };

  const handleCancelEvent = async () => {
    if (!editingEventMessage?._id) return;
    try {
      const cancelledEventData = {
        ...(editingEventMessage.eventData || {}),
        isCancelled: true,
        cancelledAt: new Date(),
      };
      await editMessage(
        editingEventMessage._id,
        `Cancelled event: ${cancelledEventData.title || ""}`,
        cancelledEventData
      );
      setShowEventModal(false);
      setEditingEventMessage(null);
    } catch (error) {
      console.error("Failed to cancel event", error);
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
          className={`px-3 py-1.5 text-xs font-medium rounded-lg shadow-sm transition-colors ${theme === "dark"
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
        className={`h-screen flex h-full w-full flex-col overflow-hidden ${theme === "dark" ? "bg-[#0b141a] text-white" : "bg-[#efe7de] text-gray-900"}`}
      >
        <div
          className={`px-3 py-2 sm:px-4 sm:py-2.5 min-h-[58px] border-b shrink-0 z-30 ${theme === "dark"
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

        <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
          <div
            ref={messagesContainerRef}
            onScroll={handleMessageScroll}
            className={`flex-1 px-2 sm:px-4 md:px-5 py-2 overflow-y-auto custom-scrollbar relative transition-colors duration-500 ${theme === "dark" ? "bg-[#0b141a] bg-opacity-95" : "bg-[#efe7de]"
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
                          onEditEvent={handleEditEventClick}
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
        </div>
      </div>
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
          onClose={() => {
            setShowEventModal(false);
            setEditingEventMessage(null);
          }}
          onSend={editingEventMessage ? handleUpdateEvent : handleSendEvent}
          onCancelEvent={editingEventMessage ? handleCancelEvent : null}
          initialEvent={editingEventMessage?.eventData}
          isEdit={Boolean(editingEventMessage)}
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


export default ChatWindow;
