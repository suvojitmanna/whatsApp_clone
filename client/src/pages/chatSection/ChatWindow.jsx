import React, { useEffect, useRef, useState, useMemo } from "react";
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
  FaEye,
  FaPlus,
  FaMicrophone,
  FaRegStar,
  FaStar,
} from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { TiArrowRight } from "react-icons/ti";
import { FaSquarePollHorizontal } from "react-icons/fa6";
import { MdEventNote, MdKeyboardArrowUp, MdKeyboardArrowDown } from "react-icons/md";
import { TfiClip } from "react-icons/tfi";
import { MdAddReaction } from "react-icons/md";
import MessageBuble, { WhatsAppPinIcon, WhatsAppUnpinIcon } from "./MessageBuble";
import MessageSkeletonLoader from "./MessageSkeletonLoader";
import EmojiPicker from "emoji-picker-react";
import useOutsideClick from "../../hook/useOutsideClick";
import formatTimestamp from "../../utils/formatTime";
import VideoCallManager from "../videoCall/videoCallManager";
import { getSocket } from "../../services/chatService";
import useVideoCallStore from "../../store/videoCallStore";
import useLayoutStore from "../../store/layoutStore";
import { HiDotsVertical } from "react-icons/hi";
import { FiSearch, FiDownload } from "react-icons/fi";
import { LuForward } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { TbPin } from "react-icons/tb";
import { toast } from "react-toastify";
import { RiContactsFill, RiEmojiStickerLine, RiDeleteBin6Line } from "react-icons/ri";
import CameraModal from "../../components/CameraModal";
import PollModal from "../../components/pollModal";
import ContactModal from "../../components/ContactModal";
import EventModal from "../../components/EventModal";
import StickerModal from "../../components/StickerModal";
import FileViewerModal from "../../components/FileViewerModal";
import ForwardModal from "../../components/ForwardModal";
import AttachInput from "../../components/AttachInput";
import ChatHeaderMenu from "./ChatHeaderMenu";

const isValidate = (date) => {
  return date instanceof Date && !isNaN(date);
};
const ChatWindow = ({ selectedContact, setSelectedContact, onStatusClick }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [previewModalFile, setPreviewModalFile] = useState(null);
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
  const [showPinnedMenu, setShowPinnedMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [headerMenuAnchor, setHeaderMenuAnchor] = useState(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [showForwardSelectedModal, setShowForwardSelectedModal] = useState(false);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
  const headerMenuBtnRef = useRef(null);
  const messageInputRef = useRef(null);

  const typingTimeOutRef = useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const pinnedMenuRef = useRef(null);
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
  const socket = getSocket();
  const {
    messages,
    isMessagesLoading,
    clearMessages,
    sendMessage,
    fetchMessages,
    fetchConversations,
    conversations,
    currentConversation,
    isUserTyping,
    startTying,
    stopTying,
    getUserLastSeen,
    isUserOnline,
    deleteMessage,
    addReaction,
    editMessage,
    markMessageAsRead,
    saveScrollPosition,
    pinnedMessages,
    unpinMessage,
    toggleStarMessage,
    isMessageStarred,
    starredMessages,
  } = useChatStore();

  const messagesContainerRef = useRef(null);
  const prevContactIdRef = useRef(null);
  const isProgrammaticScrollRef = useRef(false);
  const restoredChatIdRef = useRef(null);
  const previousChatRef = useRef({ contactId: null, convId: null });
  const currentChatScrollRef = useRef(null);
  const scrollDebounceTimerRef = useRef(null);
  const hasUserScrolledSinceSwitchRef = useRef(false);

  let matchCounter = -1;

  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const conversationId = selectedContact?.conversation?._id;
  const isTyping = isUserTyping(conversationId, selectedContact?._id);
  const { setShowContactInfo, openContactInfoWithTab } = useLayoutStore();
  const setCurrentConversation = useChatStore(
    (state) => state.setCurrentConversation,
  );

  const activePin = useMemo(() => {
    const currConv = currentConversation?._id?.toString();
    const selContactId = selectedContact?._id?.toString();
    const selConvId = (selectedContact?.conversation?._id || selectedContact?.conversation)?.toString();

    let pin =
      (currConv && pinnedMessages?.[currConv]) ||
      (selContactId && pinnedMessages?.[selContactId]) ||
      (selConvId && pinnedMessages?.[selConvId]);

    if (!pin) {
      const allPins = Object.values(pinnedMessages || {});
      pin = allPins.find((p) => {
        if (!p?.message) return false;
        const msgConv = (p.message.conversation?._id || p.message.conversation || p.message.conversationId)?.toString();
        const msgSender = (p.message.sender?._id || p.message.sender)?.toString();
        const msgReceiver = (p.message.receiver?._id || p.message.receiver)?.toString();
        return (
          (currConv && msgConv === currConv) ||
          (selConvId && msgConv === selConvId) ||
          (selContactId && (msgSender === selContactId || msgReceiver === selContactId))
        );
      });
    }

    if (!pin || !pin.message) return null;
    if (pin.expiresAt && pin.expiresAt <= Date.now()) return null;
    return pin;
  }, [
    pinnedMessages,
    currentConversation?._id,
    selectedContact?._id,
    selectedContact?.conversation,
  ]);

  const selectedMsgsList = useMemo(() => {
    return messages.filter((m) =>
      selectedMessageIds.includes(String(m._id || m.temp))
    );
  }, [messages, selectedMessageIds]);

  const areAllSelectedStarred = useMemo(() => {
    return (
      selectedMsgsList.length > 0 &&
      selectedMsgsList.every((m) => isMessageStarred(m._id))
    );
  }, [selectedMsgsList, isMessageStarred, starredMessages]);

  const canDeleteForEveryone = useMemo(() => {
    return (
      selectedMsgsList.length > 0 &&
      selectedMsgsList.every(
        (m) =>
          String(m.sender?._id || m.sender) === String(user?._id || user?.id)
      )
    );
  }, [selectedMsgsList, user]);

  const handleToggleSelectMessage = (msgId) => {
    if (!msgId) return;
    const idStr = String(msgId);
    setSelectedMessageIds((prev) =>
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    );
  };

  const handleEnterSelectMode = (initialMsgId) => {
    setIsSelectMode(true);
    if (initialMsgId) {
      setSelectedMessageIds([String(initialMsgId)]);
    } else {
      setSelectedMessageIds([]);
    }
  };

  useEffect(() => {
    setIsSelectMode(false);
    setSelectedMessageIds([]);
  }, [selectedContact?._id]);

  useEffect(() => {
    if (!isSelectMode) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSelectMode(false);
        setSelectedMessageIds([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelectMode]);

  const handleStarSelectedMessages = () => {
    if (selectedMsgsList.length === 0) return;
    if (areAllSelectedStarred) {
      selectedMsgsList.forEach((m) => {
        if (isMessageStarred(m._id)) {
          toggleStarMessage(m._id, m);
        }
      });
      toast.info(
        `Unstarred ${selectedMsgsList.length} message${selectedMsgsList.length > 1 ? "s" : ""
        }`
      );
    } else {
      selectedMsgsList.forEach((m) => {
        if (!isMessageStarred(m._id)) {
          toggleStarMessage(m._id, m);
        }
      });
      toast.success(
        `Starred ${selectedMsgsList.length} message${selectedMsgsList.length > 1 ? "s" : ""
        }`
      );
    }
  };

  const handleDownloadSelectedMessages = async () => {
    if (selectedMsgsList.length === 0) return;
    const mediaMsgs = selectedMsgsList.filter(
      (m) =>
        m.imageOrVideoUrl &&
        ["image", "video", "document", "audio"].includes(m.contentType)
    );
    if (mediaMsgs.length === 0) {
      toast.info("No media or document files to download in selected messages");
      return;
    }
    toast.info(
      `Downloading ${mediaMsgs.length} file${mediaMsgs.length > 1 ? "s" : ""
      }...`
    );
    for (const msg of mediaMsgs) {
      try {
        const url = msg.imageOrVideoUrl;
        const fileName =
          msg.fileName ||
          (msg.contentType === "document"
            ? "document.pdf"
            : `${msg.contentType}-${msg._id}`);
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        } else {
          window.open(url, "_blank");
        }
      } catch (e) {
        window.open(msg.imageOrVideoUrl, "_blank");
      }
    }
  };

  const executeDeleteSelected = async (deleteFor) => {
    try {
      for (const m of selectedMsgsList) {
        await deleteMessage(m._id, deleteFor);
      }
      toast.success(
        `Deleted ${selectedMsgsList.length} message${selectedMsgsList.length > 1 ? "s" : ""
        }`
      );
    } catch (err) {
      toast.error("Failed to delete some messages");
    } finally {
      setShowDeleteSelectedModal(false);
      setIsSelectMode(false);
      setSelectedMessageIds([]);
    }
  };

  const getPinnedPreviewText = (msg) => {
    if (!msg) return "";
    if (msg.contentType === "text" || (!msg.contentType && msg.content)) {
      return msg.content || "";
    }
    if (msg.contentType === "image") {
      return msg.content ? `📷 ${msg.content}` : "📷 Photo";
    }
    if (msg.contentType === "video") {
      return msg.content ? `🎥 ${msg.content}` : "🎥 Video";
    }
    if (msg.contentType === "audio") {
      return "🎵 Voice message";
    }
    if (msg.contentType === "document") {
      return msg.fileName ? `📄 ${msg.fileName}` : "📄 Document";
    }
    if (msg.contentType === "poll") {
      return `📊 ${msg.pollData?.question || "Poll"}`;
    }
    if (msg.contentType === "event") {
      return `📅 ${msg.eventData?.eventName || "Event"}`;
    }
    if (msg.contentType === "contact") {
      return `👤 ${msg.contactData?.name || "Contact"}`;
    }
    if (msg.contentType === "sticker") {
      return "💟 Sticker";
    }
    return msg.content || "Pinned message";
  };

  const handleScrollToPinnedMessage = (msgId) => {
    if (!msgId) return;
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add(
        "ring-2",
        "ring-emerald-400",
        "shadow-[0_0_15px_rgba(16,185,129,0.55)]",
        "rounded-xl",
        "transition-all",
        "duration-500",
      );
      setTimeout(() => {
        el.classList.remove(
          "ring-2",
          "ring-emerald-400",
          "shadow-[0_0_15px_rgba(16,185,129,0.55)]",
          "rounded-xl",
        );
      }, 2000);
    } else {
      toast.info("Pinned message is earlier in the chat history");
    }
  };

  const handleUnpinFromBanner = (e) => {
    e.stopPropagation();
    setShowPinnedMenu(false);
    unpinMessage(currentConversation?._id, selectedContact?._id);
    toast.info("Message unpinned");
  };

  const handleStartReply = (msg) => {
    if (!msg) return;
    setReplyingTo(msg);
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 50);
  };

  const getReplyPreviewText = (msg) => {
    if (!msg) return "";
    if (msg.contentType === "text" || (!msg.contentType && msg.content)) {
      return msg.content || "";
    }
    if (msg.contentType === "image") {
      return msg.content ? `📷 ${msg.content}` : "📷 Photo";
    }
    if (msg.contentType === "video") {
      return msg.content ? `🎥 ${msg.content}` : "🎥 Video";
    }
    if (msg.contentType === "audio") {
      return "🎵 Voice message";
    }
    if (msg.contentType === "document") {
      return msg.fileName ? `📄 ${msg.fileName}` : "📄 Document";
    }
    if (msg.contentType === "poll") {
      return `📊 ${msg.pollData?.question || "Poll"}`;
    }
    if (msg.contentType === "event") {
      return `📅 ${msg.eventData?.eventName || "Event"}`;
    }
    if (msg.contentType === "contact") {
      return `👤 ${msg.contactData?.name || "Contact"}`;
    }
    if (msg.contentType === "sticker") {
      return "💟 Sticker";
    }
    return msg.content || "Message";
  };

  useOutsideClick(pinnedMenuRef, () => setShowPinnedMenu(false));

  useEffect(() => {
    useChatStore.getState().initSocketListener();
    if (!selectedContact?._id) {
      prevContactIdRef.current = null;
      clearMessages();
      return;
    }

    if (prevContactIdRef.current === selectedContact._id && messages.length > 0) {
      return;
    }

    prevContactIdRef.current = selectedContact._id;
    setSearchTerm("");
    setIsSearchOpen(false);
    setReplyingTo(null);

    const targetConvId =
      selectedContact?.conversation?._id ||
      conversations?.data?.find((conv) =>
        conv.participants?.some(
          (participant) => participant._id === selectedContact?._id,
        ),
      )?._id;

    if (targetConvId) {
      if (currentConversation?._id !== targetConvId || messages.length === 0) {
        fetchMessages(targetConvId).catch((err) =>
          console.error("Error fetching messages:", err)
        );
      }
    } else {
      clearMessages();
    }
  }, [selectedContact?._id]);

  useEffect(() => {
    if (
      selectedContact?._id &&
      !selectedContact?.conversation?._id &&
      conversations?.data?.length > 0 &&
      messages.length === 0 &&
      !isMessagesLoading
    ) {
      const conv = conversations.data.find((c) =>
        c.participants?.some((p) => p._id === selectedContact._id),
      );
      if (conv?._id && currentConversation?._id !== conv._id) {
        fetchMessages(conv._id).catch((err) =>
          console.error("Error fetching messages:", err)
        );
      }
    }
  }, [conversations?.data, selectedContact?._id, isMessagesLoading]);

  const lastMsgId = messages[messages.length - 1]?._id;
  useEffect(() => {
    if (!selectedContact?._id) return;

    useChatStore.getState().clearUnreadCount(selectedContact._id);
    if (selectedContact?.conversation?._id) {
      useChatStore.getState().clearUnreadCount(selectedContact.conversation._id);
    }

    if (!messages.length) return;
    const hasUnread = messages.some(
      (m) =>
        m.messageStatus !== "read" &&
        (m.sender?._id || m.sender)?.toString() === selectedContact._id?.toString()
    );
    if (hasUnread) {
      markMessageAsRead();
    }
  }, [selectedContact?._id, selectedContact?.conversation?._id, messages.length, lastMsgId, markMessageAsRead]);

  useEffect(() => {
    const handleFocus = () => {
      if (!selectedContact?._id) return;
      useChatStore.getState().clearUnreadCount(selectedContact._id);
      if (selectedContact?.conversation?._id) {
        useChatStore.getState().clearUnreadCount(selectedContact.conversation._id);
      }
      if (!messages.length) return;
      markMessageAsRead();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [selectedContact?._id, selectedContact?.conversation?._id, messages.length, markMessageAsRead]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const getChatKeys = (contact) => {
    const contactId = contact?._id?.toString() || null;
    const convId = (contact?.conversation?._id || contact?.conversation || currentConversation?._id)?.toString() || null;
    return { contactId, convId };
  };

  const commitScrollPosition = (contactId, convId, pos) => {
    if (!pos) return;
    const save = useChatStore.getState().saveScrollPosition;
    if (contactId) {
      save(contactId, pos);
    }
    if (convId && convId !== contactId) {
      save(convId, pos);
    }
  };

  const scrollToBottom = (behavior = "auto") => {
    const el = messagesContainerRef.current;
    if (el) {
      isProgrammaticScrollRef.current = true;
      if (behavior === "smooth") {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      } else {
        el.scrollTop = el.scrollHeight;
      }
      hasUserScrolledSinceSwitchRef.current = true;
      const bottomPos = {
        isAtBottom: true,
        scrollTop: el.scrollHeight,
        scrollHeight: el.scrollHeight,
      };
      currentChatScrollRef.current = bottomPos;
      const { contactId, convId } = getChatKeys(selectedContact);
      commitScrollPosition(contactId, convId, bottomPos);
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 60);
    } else {
      messageEndRef.current?.scrollIntoView({ behavior });
    }
  };

  const handleMessageScroll = () => {
    const el = messagesContainerRef.current;
    if (!el || !selectedContact?._id) return;
    if (isProgrammaticScrollRef.current) return;
    if (isMessagesLoading || messages.length === 0) return;
    if (el.scrollHeight <= el.clientHeight + 10) return;

    hasUserScrolledSinceSwitchRef.current = true;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    const pos = {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      isAtBottom,
    };
    currentChatScrollRef.current = pos;

    const { contactId, convId } = getChatKeys(selectedContact);
    if (scrollDebounceTimerRef.current) {
      clearTimeout(scrollDebounceTimerRef.current);
    }
    scrollDebounceTimerRef.current = setTimeout(() => {
      commitScrollPosition(contactId, convId, pos);
    }, 150);
  };

  useEffect(() => {
    const nextContactId = selectedContact?._id?.toString() || null;
    const nextConvId = (selectedContact?.conversation?._id || currentConversation?._id)?.toString() || null;

    const prevContactId = previousChatRef.current.contactId;
    const prevConvId = previousChatRef.current.convId;

    if (prevContactId && prevContactId !== nextContactId) {
      if (scrollDebounceTimerRef.current) {
        clearTimeout(scrollDebounceTimerRef.current);
      }
      const el = messagesContainerRef.current;
      let posToSave = currentChatScrollRef.current;
      if (!posToSave && el && el.scrollHeight > el.clientHeight + 10 && !isProgrammaticScrollRef.current) {
        const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
        posToSave = {
          scrollTop: el.scrollTop,
          scrollHeight: el.scrollHeight,
          isAtBottom,
        };
      }
      if (posToSave) {
        commitScrollPosition(prevContactId, prevConvId, posToSave);
      }

      currentChatScrollRef.current = null;
      restoredChatIdRef.current = null;
      hasUserScrolledSinceSwitchRef.current = false;
      isProgrammaticScrollRef.current = true;
    }

    previousChatRef.current = { contactId: nextContactId, convId: nextConvId };
  }, [selectedContact?._id]);

  useEffect(() => {
    return () => {
      if (scrollDebounceTimerRef.current) {
        clearTimeout(scrollDebounceTimerRef.current);
      }
      const prevContactId = previousChatRef.current.contactId;
      const prevConvId = previousChatRef.current.convId;
      const el = messagesContainerRef.current;
      let posToSave = currentChatScrollRef.current;
      if (!posToSave && el && el.scrollHeight > el.clientHeight + 10 && !isProgrammaticScrollRef.current) {
        const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
        posToSave = {
          scrollTop: el.scrollTop,
          scrollHeight: el.scrollHeight,
          isAtBottom,
        };
      }
      if (prevContactId && posToSave) {
        commitScrollPosition(prevContactId, prevConvId, posToSave);
      }
    };
  }, []);

  useEffect(() => {
    const el = messagesContainerRef.current;
    const contactId = selectedContact?._id?.toString();
    const convId = (selectedContact?.conversation?._id || currentConversation?._id)?.toString();

    if (!el || !contactId || isMessagesLoading || messages.length === 0) return;

    if (restoredChatIdRef.current !== contactId) {
      const allPositions = useChatStore.getState().scrollPositions || {};
      const savedPos =
        (convId && allPositions[convId]) ||
        (contactId && allPositions[contactId]);

      isProgrammaticScrollRef.current = true;

      const rafId = requestAnimationFrame(() => {
        if (!messagesContainerRef.current) return;
        const container = messagesContainerRef.current;

        if (savedPos && !savedPos.isAtBottom && typeof savedPos.scrollTop === "number") {
          container.scrollTop = savedPos.scrollTop;
          currentChatScrollRef.current = savedPos;
        } else {
          container.scrollTop = container.scrollHeight;
          currentChatScrollRef.current = {
            scrollTop: container.scrollHeight,
            scrollHeight: container.scrollHeight,
            isAtBottom: true,
          };
        }

        restoredChatIdRef.current = contactId;

        requestAnimationFrame(() => {
          if (!messagesContainerRef.current) return;
          const currentContainer = messagesContainerRef.current;
          if (
            savedPos &&
            !savedPos.isAtBottom &&
            typeof savedPos.scrollTop === "number" &&
            !hasUserScrolledSinceSwitchRef.current
          ) {
            if (Math.abs(currentContainer.scrollTop - savedPos.scrollTop) > 2) {
              currentContainer.scrollTop = savedPos.scrollTop;
            }
          }
          setTimeout(() => {
            isProgrammaticScrollRef.current = false;
          }, 80);
        });
      });

      return () => cancelAnimationFrame(rafId);
    } else {
      const allPositions = useChatStore.getState().scrollPositions || {};
      const savedPos =
        (convId && allPositions[convId]) ||
        (contactId && allPositions[contactId]);

      if (
        !hasUserScrolledSinceSwitchRef.current &&
        savedPos &&
        !savedPos.isAtBottom &&
        typeof savedPos.scrollTop === "number"
      ) {
        isProgrammaticScrollRef.current = true;
        el.scrollTop = savedPos.scrollTop;
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 50);
        return;
      }

      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      if (isAtBottom) {
        isProgrammaticScrollRef.current = true;
        el.scrollTop = el.scrollHeight;
        requestAnimationFrame(() => {
          isProgrammaticScrollRef.current = false;
        });
      }
    }
  }, [messages, isMessagesLoading, selectedContact?._id]);

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
    const rawFiles = Array.from(e.target.files || []);
    if (!rawFiles.length) return;

    setShowFileMenu(false);
    const newItems = rawFiles.map((file) => {
      let type = "document";
      if (typeHint === "sticker") {
        type = "sticker";
      } else if (file.type.startsWith("image/")) {
        type = "image";
      } else if (file.type.startsWith("video/")) {
        type = "video";
      } else if (file.type.startsWith("audio/")) {
        type = "audio";
      } else {
        type = "document";
      }

      return {
        id: Math.random().toString(36).substring(2, 9) + Date.now(),
        file,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        type,
        previewUrl: URL.createObjectURL(file),
      };
    });

    setSelectedFiles((prev) => [...prev, ...newItems]);
    if (typeHint === "sticker") {
      setIsStickerMode(true);
    }

    if (e.target) {
      e.target.value = "";
    }
  };

  const handleRemoveFile = (idToRemove) => {
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === idToRemove);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const updated = prev.filter((item) => item.id !== idToRemove);
      if (updated.length === 0) {
        setIsStickerMode(false);
      }
      return updated;
    });
    setActiveFileIndex(0);
  };

  const handleClearAllFiles = () => {
    selectedFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setSelectedFiles([]);
    setActiveFileIndex(0);
    setIsStickerMode(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
    if (stickerInputRef.current) stickerInputRef.current.value = "";
  };

  const handleSendMessage = async () => {
    if (!selectedContact || isSending) return;
    const trimmedMessage = message.trim();
    if (!trimmedMessage && selectedFiles.length === 0) return;

    setIsSending(true);
    try {
      const status = online ? "delivered" : "send";
      const replyData = replyingTo
        ? {
          _id: replyingTo._id,
          content: replyingTo.content || "",
          contentType: replyingTo.contentType || "text",
          fileName: replyingTo.fileName || null,
          sender: replyingTo.sender,
          imageOrVideoUrl: replyingTo.imageOrVideoUrl || null,
        }
        : null;

      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const item = selectedFiles[i];
          const formData = new FormData();
          formData.append("senderId", user?._id);
          formData.append("receiverId", selectedContact?._id);
          formData.append("messageStatus", status);
          formData.append("media", item.file);
          formData.append("fileName", item.name);
          formData.append("fileSize", item.size);
          formData.append("contentType", item.type);

          if (i === 0 && trimmedMessage) {
            formData.append("content", trimmedMessage);
          } else {
            formData.append("content", "");
          }

          if (i === 0 && replyData) {
            formData.append("replyTo", replyData._id);
            formData.append("replyMessage", JSON.stringify(replyData));
          }

          await sendMessage(formData);
        }
      } else if (trimmedMessage) {
        const formData = new FormData();
        formData.append("senderId", user?._id);
        formData.append("receiverId", selectedContact?._id);
        formData.append("messageStatus", status);
        formData.append("content", trimmedMessage);
        formData.append("contentType", "text");
        if (replyData) {
          formData.append("replyTo", replyData._id);
          formData.append("replyMessage", JSON.stringify(replyData));
        }
        await sendMessage(formData);
      }

      setMessage("");
      setReplyingTo(null);
      selectedFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setSelectedFiles([]);
      setActiveFileIndex(0);
      setIsStickerMode(false);
      setShowFileMenu(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (documentInputRef.current) documentInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";
      if (stickerInputRef.current) stickerInputRef.current.value = "";

      if (selectedContact?._id) {
        const bottomPos = {
          isAtBottom: true,
          scrollTop: 9999999,
          scrollHeight: 9999999,
        };
        currentChatScrollRef.current = bottomPos;
        hasUserScrolledSinceSwitchRef.current = true;
        const { contactId, convId } = getChatKeys(selectedContact);
        commitScrollPosition(contactId, convId, bottomPos);
      }
      if (messagesContainerRef.current) {
        isProgrammaticScrollRef.current = true;
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 60);
      }
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
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
    setShowContactModal(false);
    try {
      const formData = new FormData();
      formData.append("senderId", user?._id);
      formData.append("receiverId", selectedContact?._id);
      formData.append("messageStatus", online ? "delivered" : "send");
      formData.append("contentType", "contact");
      formData.append("content", `Contact: ${contactInfo.name}`);
      formData.append("contactData", JSON.stringify(contactInfo));

      await sendMessage(formData);
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

  const renderDateSeparator = (date, includePinNotification = false) => {
    if (!isValidate(date)) {
      return null;
    }

    let dateString;
    if (isToday(date)) {
      dateString = "Today";
    } else if (isYesterday(date)) {
      dateString = "Yesterday";
    } else {
      dateString = format(date, "EEEE, MMMM d");
    }

    const isPinnedByMe =
      !activePin?.pinnedBy ||
      String(activePin?.pinnedBy?._id || activePin?.pinnedBy) === String(user?._id);

    return (
      <div className="flex flex-col items-center justify-center my-2 select-none gap-1.5">
        <span
          className={`px-3 py-1 text-xs font-normal rounded-lg shadow-sm transition-colors ${theme === "dark"
            ? "bg-[#182229] text-[#8696a0]"
            : "bg-white text-[#54656f] border border-black/5"
            }`}
        >
          {dateString}
        </span>

        {includePinNotification && activePin?.message && (
          <button
            type="button"
            onClick={() => handleScrollToPinnedMessage(activePin.message?._id)}
            className={`px-3 py-1 text-xs font-normal rounded-lg shadow-sm transition-all duration-200 cursor-pointer active:scale-95 ${theme === "dark"
              ? "bg-[#182229] hover:bg-[#202c33] text-[#8696a0] hover:text-[#d1d7db]"
              : "bg-white hover:bg-gray-50 text-[#54656f] border border-black/5"
              }`}
            title="Click to jump to pinned message"
          >
            {isPinnedByMe
              ? "You pinned a message"
              : `${selectedContact?.username || "Contact"} pinned a message`}
          </button>
        )}
      </div>
    );
  };

  const renderPinSystemNotification = () => {
    if (!activePin || !activePin.message) return null;
    const isPinnedByMe =
      !activePin.pinnedBy ||
      String(activePin.pinnedBy?._id || activePin.pinnedBy) === String(user?._id);

    return (
      <div className="flex justify-center my-1 select-none">
        <button
          type="button"
          onClick={() => handleScrollToPinnedMessage(activePin.message?._id)}
          className={`px-3 py-1 text-xs font-normal rounded-lg shadow-sm transition-all duration-200 cursor-pointer active:scale-95 ${theme === "dark"
            ? "bg-[#182229] hover:bg-[#202c33] text-[#8696a0] hover:text-[#d1d7db]"
            : "bg-white hover:bg-gray-50 text-[#54656f] border border-black/5"
            }`}
          title="Click to jump to pinned message"
        >
          {isPinnedByMe
            ? "You pinned a message"
            : `${selectedContact?.username || "Contact"} pinned a message`}
        </button>
      </div>
    );
  };

  const pinDate = useMemo(() => {
    if (!activePin) return null;
    const rawTime = activePin.pinnedAt || activePin.message?.createdAt;
    if (rawTime) {
      const d = new Date(rawTime);
      if (isValidate(d)) return d;
    }
    return new Date();
  }, [activePin]);

  const pinDateStr = useMemo(() => {
    if (!pinDate || !isValidate(pinDate)) return null;
    return format(pinDate, "yyyy-MM-dd");
  }, [pinDate]);

  const groupedMessages = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) return {};
    const acc = {};
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.createdAt) continue;
      const date = new Date(msg.createdAt);
      if (isValidate(date)) {
        const dateString = format(date, "yyyy-MM-dd");
        if (!acc[dateString]) {
          acc[dateString] = [];
        }
        acc[dateString].push(msg);
      }
    }
    return acc;
  }, [messages]);

  const { finalMessagesToRender, resultCount } = useMemo(() => {
    if (!searchTerm) {
      return { finalMessagesToRender: groupedMessages, resultCount: 0 };
    }
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = {};
    let count = 0;
    const entries = Object.entries(groupedMessages);
    for (let i = 0; i < entries.length; i++) {
      const [date, msgs] = entries[i];
      const matched = msgs.filter((msg) =>
        (msg.content || "").toLowerCase().includes(lowerSearch)
      );
      if (matched.length > 0) {
        filtered[date] = matched;
        count += matched.length;
      }
    }
    return { finalMessagesToRender: filtered, resultCount: count };
  }, [groupedMessages, searchTerm]);

  const allDateEntries = useMemo(() => {
    const entries = { ...finalMessagesToRender };
    if (!searchTerm && activePin && pinDateStr && !entries[pinDateStr]) {
      entries[pinDateStr] = [];
    }
    return Object.entries(entries).sort(([dateA], [dateB]) => {
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  }, [finalMessagesToRender, activePin, pinDateStr, searchTerm]);
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

  const handleChatContextMenu = (e) => {
    if (e.target.closest("input") || e.target.closest("textarea")) {
      return;
    }
    if (e.target.closest("[data-bubble='true']")) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    setHeaderMenuAnchor({
      x: e.clientX,
      y: e.clientY,
      isContextMenu: true,
    });
    setShowHeaderMenu(true);
  };

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
        onContextMenu={handleChatContextMenu}
        className={`h-screen flex h-full w-full flex-col overflow-hidden ${theme === "dark" ? "bg-[#0b141a] text-white" : "bg-[#efe7de] text-gray-900"}`}
      >
        <div
          onContextMenu={handleChatContextMenu}
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
            className="mr-1 sm:mr-2 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Back to chats"
          >
            <FaArrowLeft className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </button>

          <div className="relative ml-1 sm:ml-2">
            <motion.img
              layoutId="profile-image"
              src={selectedContact?.profilePicture || "/default-avatar.png"}
              alt={selectedContact?.username}
              onClick={(e) => {
                e.stopPropagation();
                setShowContactInfo(true);
              }}
              title="View contact info"
              className="w-10 h-10 rounded-full cursor-pointer object-cover hover:opacity-90 active:scale-95 transition-all shadow-sm"
            />

            {online && (
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${theme === "dark" ? "border-[#202c33]" : "border-white"} bg-emerald-500 shadow-sm`}
                title="Online"
              ></span>
            )}
          </div>

          <div
            className="ml-3 flex-grow cursor-pointer min-w-0 group"
            onClick={() => setShowContactInfo(true)}
            title="View contact info"
          >
            <div className="flex items-center gap-2">
              <h2 className={`font-semibold text-start text-base sm:text-lg truncate group-hover:text-emerald-500 transition-colors ${theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                {selectedContact?.username}
              </h2>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openContactInfoWithTab("security");
                }}
                title="End-to-end encrypted chat. Click to verify."
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <FaLock className="w-2.5 h-2.5" />
                <span className="font-medium hidden sm:inline">Encrypted</span>
              </button>
            </div>

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
                title="Search in chat"
                className={`${isSearchOpen
                  ? "opacity-0 pointer-events-none scale-90"
                  : "opacity-100 scale-100"
                  } group relative p-2 rounded-xl transition-all duration-300 bg-white/30 dark:bg-zinc-800/30 backdrop-blur-xl before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-60 before:pointer-events-none border border-white/30 dark:border-white/10 hover:border-green-400/40 shadow-[0_2px_15px_rgba(0,0,0,0.06)]
                hover:shadow-[0_8px_30px_rgba(0,255,150,0.15)] active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-600/50`}
              >
                <FiSearch className="h-4 w-4 text-zinc-700 dark:text-zinc-300 group-hover:text-green-500 group-hover:scale-110 transition-all duration-300" />
              </button>

              <div
                className={`absolute right-0 origin-right transition-all duration-300 ${isSearchOpen
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
                          ? "bg-zinc-800/70 text-white placeholder:text-gray-500 border-white/10 hover:border-emerald-500/50 focus:border-emerald-400 focus:bg-zinc-800/90"
                          : "bg-white/70 text-gray-900 placeholder:text-gray-400 border-gray-200/80 hover:border-emerald-500/50 focus:border-emerald-400 focus:bg-white/90"
                        } shadow-[0_4px_15px_rgba(0,0,0,0.05)] focus:shadow-[0_6px_20px_rgba(0,255,150,0.2)]`}
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
                      title="Close search"
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${theme === "dark"
                        ? "text-gray-400 hover:text-emerald-400 hover:bg-white/10"
                        : "text-gray-500 hover:text-emerald-500 hover:bg-black/5"
                        }`}
                    >
                      <RxCross2 className="h-3.5 w-3.5 cursor-pointer" />
                    </button>
                  </div>

                  {searchTerm.trim() !== "" && (
                    <div className="flex items-center justify-end animate-in fade-in slide-in-from-top-1 duration-300 pt-2">
                      {resultCount > 0 ? (
                        <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
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
                              title="Previous match"
                              className="group p-1.5 rounded-full text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-90 transition-all duration-200 cursor-pointer"
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
                              title="Next match"
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

            <button
              ref={headerMenuBtnRef}
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setHeaderMenuAnchor({
                  x: rect.right,
                  y: rect.bottom + 6,
                  isContextMenu: false,
                });
                setShowHeaderMenu((prev) => !prev);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setHeaderMenuAnchor({
                  x: e.clientX,
                  y: e.clientY,
                  isContextMenu: true,
                });
                setShowHeaderMenu(true);
              }}
              title="Menu"
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <HiDotsVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
          {activePin && (
            <div
              onClick={() => handleScrollToPinnedMessage(activePin.message?._id)}
              className={`h-[42px] px-4 flex items-center justify-between border-b cursor-pointer transition-colors duration-150 select-none z-20 shrink-0 relative group ${theme === "dark"
                ? "bg-[#111b21] hover:bg-[#182229] border-[#222d34] text-[#e9edef]"
                : "bg-[#f0f2f5] hover:bg-[#eaecef] border-[#e9edef] text-[#111b21]"
                }`}
              title="Click to jump to pinned message"
            >
              <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-2">
                <WhatsAppPinIcon
                  size={13}
                  className={`shrink-0 ${theme === "dark" ? "text-[#8696a0]" : "text-gray-500"
                    }`}
                />
                <span
                  className={`text-[13.5px] truncate font-normal ${theme === "dark" ? "text-[#d1d7db]" : "text-gray-800"
                    }`}
                >
                  {getPinnedPreviewText(activePin.message)}
                </span>
              </div>

              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPinnedMenu((prev) => !prev);
                  }}
                  className={`p-1 rounded-full text-[#8696a0] ${theme === "dark" ? "hover:text-white" : "hover:text-black"} ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/10"} transition-all cursor-pointer ${showPinnedMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  title="Options"
                >
                  {showPinnedMenu ? (
                    <MdKeyboardArrowUp size={24} />
                  ) : (
                    <MdKeyboardArrowDown size={24} />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {showPinnedMenu && (
                  <motion.div
                    ref={pinnedMenuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -2 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -2 }}
                    transition={{ duration: 0.12 }}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute right-3 top-[43px] z-50 min-w-[175px] rounded-xl shadow-2xl py-1.5 border select-none ${theme === "dark"
                      ? "bg-[#233138] border-white/10 text-[#d1d7db]"
                      : "bg-white border-black/10 text-[#111b21]"
                      }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        setShowPinnedMenu(false);
                        handleUnpinFromBanner(e);
                      }}
                      className={`group w-full px-4 py-2.5 text-left text-[14px] flex items-center gap-3 transition-colors cursor-pointer ${theme === "dark"
                        ? "hover:bg-[#182229] hover:text-white"
                        : "hover:bg-[#f5f6f6] text-[#111b21]"
                        }`}
                    >
                      <span className="w-5 h-5 flex items-center justify-center shrink-0 text-[#8696a0] group-hover:text-inherit">
                        <WhatsAppUnpinIcon size={18} />
                      </span>
                      <span>Unpin</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowPinnedMenu(false);
                        handleScrollToPinnedMessage(activePin.message?._id);
                      }}
                      className={`group w-full px-4 py-2.5 text-left text-[14px] flex items-center gap-3 transition-colors cursor-pointer ${theme === "dark"
                        ? "hover:bg-[#182229] hover:text-white"
                        : "hover:bg-[#f5f6f6] text-[#111b21]"
                        }`}
                    >
                      <span className="w-5 h-5 flex items-center justify-center shrink-0 text-[#8696a0] group-hover:text-inherit">
                        <TiArrowRight size={20} />
                      </span>
                      <span>Go to message</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

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
              <div className="flex justify-center my-2 select-none">
                <button
                  type="button"
                  onClick={() => openContactInfoWithTab("privacy")}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs max-w-md text-center transition-all duration-200 cursor-pointer shadow-sm active:scale-98 ${theme === "dark"
                    ? "bg-[#182229]/95 text-[#ffd279] border border-white/5 hover:bg-[#202c33]"
                    : "bg-[#ffeecd]/95 text-[#54656f] border border-black/5 hover:bg-[#fedea8]"
                    }`}
                  title="Click to verify end-to-end encryption"
                >
                  <FaLock className="h-3 w-3 shrink-0 text-emerald-500" />
                  <span>
                    Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. Click to learn more.
                  </span>
                </button>
              </div>

              {isMessagesLoading ? (
                <MessageSkeletonLoader theme={theme} />
              ) : allDateEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-70 text-center select-none">
                  <p className="text-xs sm:text-sm font-medium">
                    {searchTerm
                      ? `No messages found matching "${searchTerm}"`
                      : "No messages yet. Send a message to start chatting!"}
                  </p>
                </div>
              ) : (
                (() => {
                  let pinAlreadyRendered = false;
                  return allDateEntries.map(([date, msgs], entryIndex) => {
                    const isLastGroup = entryIndex === allDateEntries.length - 1;
                    const shouldRenderPin =
                      !searchTerm &&
                      Boolean(activePin) &&
                      !pinAlreadyRendered &&
                      (date === pinDateStr || (isLastGroup && !pinAlreadyRendered));

                    if (shouldRenderPin) {
                      pinAlreadyRendered = true;
                    }

                    return (
                      <React.Fragment key={date}>
                        {renderDateSeparator(new Date(date), shouldRenderPin)}

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
                              selectedContact={selectedContact}
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
                              onReply={handleStartReply}
                              isSelectMode={isSelectMode}
                              isSelected={selectedMessageIds.includes(String(msg._id || msg.temp))}
                              onToggleSelect={handleToggleSelectMessage}
                              onEnterSelectMode={handleEnterSelectMode}
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
                  });
                })()
              )}
            </div>

            <div ref={messageEndRef} className="h-4" />
          </div>
          <AttachInput
            selectedFiles={selectedFiles}
            activeFileIndex={activeFileIndex}
            setActiveFileIndex={setActiveFileIndex}
            theme={theme}
            isStickerMode={isStickerMode}
            setPreviewModalFile={setPreviewModalFile}
            handleClearAllFiles={handleClearAllFiles}
            handleRemoveFile={handleRemoveFile}
            fileInputRef={fileInputRef}
          />

          {isSelectMode ? (
            <div
              className={`h-[62px] px-6 sm:px-8 border-t flex items-center justify-between transition-colors z-20 ${theme === "dark"
                ? "bg-[#202c33] border-[#222d34]"
                : "bg-[#f0f2f5] border-gray-200"
                }`}
            >
              <div className="flex items-center gap-6 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectMode(false);
                    setSelectedMessageIds([]);
                  }}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer active:scale-95 ${theme === "dark"
                    ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-black/5"
                    }`}
                  title="Close"
                >
                  <RxCross2 size={21} />
                </button>
                <span
                  className={`text-[15px] font-medium tracking-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-800"
                    }`}
                >
                  {selectedMessageIds.length} selected
                </span>
              </div>

              <div className="flex items-center gap-7 sm:gap-8">
                <button
                  type="button"
                  onClick={handleStarSelectedMessages}
                  disabled={selectedMessageIds.length === 0}
                  className={`p-1.5 rounded-full transition-all ${selectedMessageIds.length === 0
                    ? "opacity-30 cursor-not-allowed text-[#8696a0]"
                    : theme === "dark"
                      ? "text-[#aebac1] hover:text-white cursor-pointer active:scale-90 hover:bg-white/10"
                      : "text-gray-600 hover:text-gray-900 cursor-pointer active:scale-90 hover:bg-black/5"
                    }`}
                  title="Star messages"
                >
                  {areAllSelectedStarred ? (
                    <FaStar size={20} className="text-amber-400" />
                  ) : (
                    <FaRegStar size={20} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteSelectedModal(true)}
                  disabled={selectedMessageIds.length === 0}
                  className={`p-1.5 rounded-full transition-all ${selectedMessageIds.length === 0
                    ? "opacity-30 cursor-not-allowed text-[#8696a0]"
                    : theme === "dark"
                      ? "text-[#aebac1] hover:text-white cursor-pointer active:scale-90 hover:bg-white/10"
                      : "text-gray-600 hover:text-gray-900 cursor-pointer active:scale-90 hover:bg-black/5"
                    }`}
                  title="Delete messages"
                >
                  <RiDeleteBin6Line size={21} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowForwardSelectedModal(true)}
                  disabled={selectedMessageIds.length === 0}
                  className={`p-1.5 rounded-full transition-all ${selectedMessageIds.length === 0
                    ? "opacity-30 cursor-not-allowed text-[#8696a0]"
                    : theme === "dark"
                      ? "text-[#aebac1] hover:text-white cursor-pointer active:scale-90 hover:bg-white/10"
                      : "text-gray-600 hover:text-gray-900 cursor-pointer active:scale-90 hover:bg-black/5"
                    }`}
                  title="Forward messages"
                >
                  <LuForward size={22} />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSelectedMessages}
                  disabled={selectedMessageIds.length === 0}
                  className={`p-1.5 rounded-full transition-all ${selectedMessageIds.length === 0
                    ? "opacity-30 cursor-not-allowed text-[#8696a0]"
                    : theme === "dark"
                      ? "text-[#aebac1] hover:text-white cursor-pointer active:scale-90 hover:bg-white/10"
                      : "text-gray-600 hover:text-gray-900 cursor-pointer active:scale-90 hover:bg-black/5"
                    }`}
                  title="Download media"
                >
                  <FiDownload size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`p-2.5 sm:p-3 border-t flex flex-col relative transition-colors ${theme === "dark"
                ? "bg-[#202c33] border-[#222d34]"
                : "bg-[#f0f2f5] border-gray-200"
                }`}
            >
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className={`w-full mb-2 px-3 py-2 rounded-xl flex items-center justify-between border shadow-sm transition-colors ${theme === "dark"
                      ? "bg-[#1f2c34] border-white/5 text-[#d1d7db]"
                      : "bg-white border-black/5 text-[#111b21]"
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-[4px] self-stretch rounded-full bg-[#7f66ff] shrink-0" />

                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <span className="text-[13px] font-semibold text-[#8b7ff5] leading-tight truncate">
                          {String(replyingTo.sender?._id || replyingTo.sender) === String(user?._id)
                            ? "You"
                            : (replyingTo.sender?.username || selectedContact?.username || "Contact")}
                        </span>
                        <span className="text-xs text-[#8696a0] leading-tight truncate mt-0.5">
                          {getReplyPreviewText(replyingTo)}
                        </span>
                      </div>
                    </div>

                    {replyingTo.imageOrVideoUrl &&
                      ["image", "video", "sticker"].includes(replyingTo.contentType) && (
                        <img
                          src={replyingTo.imageOrVideoUrl}
                          alt="reply thumb"
                          className="w-10 h-10 rounded-lg object-cover shrink-0 ml-2"
                        />
                      )}

                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="p-1 rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer shrink-0 ml-2"
                      title="Close reply"
                    >
                      <RxCross2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                className={`relative w-full flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1.5 rounded-full transition-all duration-200 border ${theme === "dark"
                  ? "bg-[#2a3942] border-white/5 hover:border-emerald-500/50 hover:bg-[#32424b] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
                  : "bg-white shadow-sm border-gray-200 hover:border-emerald-500/50 hover:bg-gray-50 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
                  }`}
              >
                <div className="relative shrink-0" ref={fileMenuRef}>
                  <button
                    type="button"
                    className={`focus:outline-none p-2 rounded-full transition-all duration-200 cursor-pointer active:scale-95 ${showFileMenu
                      ? "bg-black/10 dark:bg-white/15 scale-105"
                      : "hover:bg-black/5 dark:hover:bg-white/10 hover:scale-105"
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
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
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
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
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
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
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
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
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
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
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
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
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
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
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
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#02b875] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
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
                    className="focus:outline-none p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
                    onClick={() =>
                      setShowEmojiPicker(!showEmojiPicker)
                    }
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
                  ref={messageInputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    } else if (e.key === "Escape" && replyingTo) {
                      setReplyingTo(null);
                    }
                  }}
                  placeholder="Type a message"
                  className={`flex-1 min-w-0 w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm sm:text-base transition-colors ${theme === "dark"
                    ? "text-white placeholder-gray-400 hover:placeholder-gray-300"
                    : "text-black placeholder-gray-500 hover:placeholder-gray-400"
                    }`}
                />

                {message.trim() || selectedFiles.length > 0 ? (
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
                    className="shrink-0 p-2 sm:p-2.5 rounded-full text-gray-500 dark:text-[#8696a0] hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title="Voice message"
                  >
                    <FaMicrophone className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {showCamera && (
            <CameraModal
              onClose={() => setShowCamera(false)}
              onCapture={(file) => {
                const item = {
                  id: Math.random().toString(36).substring(2, 9) + Date.now(),
                  file,
                  name: file.name || "camera-photo.jpg",
                  size: (file.size / 1024).toFixed(1) + " KB",
                  type: "image",
                  previewUrl: URL.createObjectURL(file),
                };
                setSelectedFiles((prev) => [...prev, item]);
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

      {showForwardSelectedModal && (
        <ForwardModal
          isOpen={showForwardSelectedModal}
          onClose={() => {
            setShowForwardSelectedModal(false);
            setIsSelectMode(false);
            setSelectedMessageIds([]);
          }}
          messages={selectedMsgsList}
          theme={theme}
        />
      )}

      {showDeleteSelectedModal && (
        <div
          className={`fixed inset-0 z-[10000] flex items-center justify-center px-4 backdrop-blur-xl ${theme === "dark" ? "bg-black/70" : "bg-black/30"
            }`}
          onClick={() => setShowDeleteSelectedModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className={`relative w-full max-w-sm overflow-hidden rounded-[28px] border p-6 shadow-2xl backdrop-blur-2xl ${theme === "dark"
              ? "border-white/[0.08] bg-gradient-to-br from-[#202c33]/95 via-[#111b21]/95 to-[#0b141a]/95 shadow-black/50"
              : "border-white/70 bg-gradient-to-br from-white/95 via-white/90 to-zinc-100/95 shadow-black/10"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl ${theme === "dark" ? "bg-red-500/10" : "bg-red-400/10"
                }`}
            />
            <button
              type="button"
              aria-label="Close"
              title="Close"
              onClick={() => setShowDeleteSelectedModal(false)}
              className={`absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 cursor-pointer ${theme === "dark"
                ? "bg-white/[0.06] text-gray-400 hover:bg-white/15 hover:text-white"
                : "bg-black/[0.05] text-gray-500 hover:bg-black/10 hover:text-gray-900"
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
                className={`relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg ${theme === "dark"
                  ? "border-red-400/10 bg-gradient-to-br from-red-500/20 to-red-600/5 text-red-400 shadow-red-500/10"
                  : "border-red-500/10 bg-gradient-to-br from-red-500/10 to-red-500/5 text-red-500 shadow-red-500/10"
                  }`}
              >
                <RiDeleteBin6Line size={27} />
              </motion.div>
              <h2
                className={`text-xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-zinc-900"
                  }`}
              >
                Delete {selectedMessageIds.length} message{selectedMessageIds.length > 1 ? "s" : ""}?
              </h2>
              <p
                className={`mt-2 max-w-[290px] text-sm leading-6 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                  }`}
              >
                Choose how you want to delete selected messages. This action cannot be undone.
              </p>
            </div>

            <div className="relative mt-7 flex flex-col gap-3">
              {canDeleteForEveryone && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => executeDeleteSelected("everyone")}
                  className="group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 font-semibold transition-all duration-300 cursor-pointer border-red-500/10 bg-gradient-to-r from-red-500/90 to-rose-600/90 text-white shadow-lg shadow-red-500/10 hover:border-red-300/20 hover:from-red-500 hover:to-rose-500"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2.5">
                    <RiDeleteBin6Line size={17} />
                    <span>Delete for everyone</span>
                  </span>
                </motion.button>
              )}

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => executeDeleteSelected("me")}
                className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 font-semibold transition-all duration-300 cursor-pointer ${theme === "dark"
                  ? "border-white/[0.08] bg-gradient-to-r from-zinc-800/90 to-zinc-900/90 text-zinc-100 shadow-lg shadow-black/10 hover:border-emerald-400/20 hover:from-zinc-700/90 hover:to-zinc-800/90 hover:text-emerald-300"
                  : "border-black/[0.06] bg-gradient-to-r from-zinc-100 to-white text-zinc-800 shadow-md hover:border-emerald-500/20 hover:from-emerald-50 hover:to-white hover:text-emerald-700"
                  }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  <RiDeleteBin6Line size={17} />
                  <span>Delete for me</span>
                </span>
              </motion.button>

              <button
                type="button"
                onClick={() => setShowDeleteSelectedModal(false)}
                className={`w-full py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer ${theme === "dark"
                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                  : "text-gray-600 hover:text-gray-900 hover:bg-black/5"
                  }`}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <VideoCallManager socket={socket} />

      {previewModalFile && (
        <FileViewerModal
          isOpen={Boolean(previewModalFile)}
          onClose={() => setPreviewModalFile(null)}
          file={previewModalFile}
          theme={theme}
        />
      )}

      <ChatHeaderMenu
        isOpen={showHeaderMenu}
        onClose={() => setShowHeaderMenu(false)}
        onReopenAt={(coords) => {
          setHeaderMenuAnchor(coords);
          setShowHeaderMenu(true);
        }}
        anchorCoords={headerMenuAnchor}
        selectedContact={selectedContact}
        setSelectedContact={setSelectedContact}
        theme={theme}
        messages={messages}
        onSearchClick={() => setIsSearchOpen(true)}
        onSelectMessages={() => {
          setIsSelectMode(true);
          setSelectedMessageIds([]);
        }}
        onStartCall={(type) => {
          if (type === "video") handleVideoCall();
          else handleAudioCall();
        }}
        onOpenContactInfo={() => setShowContactInfo(true)}
      />
    </>
  );
};


export default ChatWindow;
