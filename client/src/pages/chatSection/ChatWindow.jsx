import React, { useEffect, useRef, useState, useMemo } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore, decryptSingleMessage, getTargetUserId } from "../../store/chatStore";
import { isToday, isYesterday, format } from "date-fns";
import whatsappImage from "../../assets/whatsapp_image.png";
import {
  FaCamera,
  FaFileAlt,
  FaHeadphones,
  FaImage,
  FaLock,
  FaMicrophone,
  FaRegStar,
  FaStar,
} from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { getChatTheme } from "../../utils/chatThemes";
import { TiArrowRight } from "react-icons/ti";
import { FaSquarePollHorizontal } from "react-icons/fa6";
import { MdEventNote, MdKeyboardArrowUp, MdKeyboardArrowDown, MdBlock, MdLink } from "react-icons/md";
import { TfiClip } from "react-icons/tfi";
import { MdAddReaction } from "react-icons/md";
import MessageBuble, {
  WhatsAppPinIcon,
  WhatsAppUnpinIcon,
  WhatsAppDisappearingIcon,
} from "./MessageBuble";
import MessageSkeletonLoader from "./MessageSkeletonLoader";
import EmojiPicker from "emoji-picker-react";
import useOutsideClick from "../../hook/useOutsideClick";
import { getSocket } from "../../services/chatService";
import useVideoCallStore from "../../store/videoCallStore";
import useLayoutStore from "../../store/layoutStore";
import { FiDownload } from "react-icons/fi";
import { LuForward } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
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
import ChatHeader from "./ChatHeader";
import BlockModal from "../../components/BlockModal";
import ReportModal from "../../components/ReportModal";
import NewCallLinkModal from "../calls/NewCallLinkModal";
import { getPinActorAndLabel } from "./ChatList";
import { MetaAiRing, META_AI_USER_ID } from "../../components/common/MetaAiIcon";

function getDisappearingDurationMs(duration) {
  if (!duration || duration === "Off") return null;
  const dur = String(duration).toLowerCase().trim();
  if (dur.includes("24 hour") || dur === "24h") return 24 * 60 * 60 * 1000;
  if (dur.includes("7 day") || dur === "7d") return 7 * 24 * 60 * 60 * 1000;
  if (dur.includes("90 day") || dur === "90d") return 90 * 24 * 60 * 60 * 1000;
  if (dur.includes("minute")) {
    const m = parseInt(dur, 10);
    return (m || 1) * 60 * 1000;
  }
  if (dur.includes("hour")) {
    const h = parseInt(dur, 10);
    return (h || 1) * 60 * 60 * 1000;
  }
  if (dur.includes("day")) {
    const d = parseInt(dur, 10);
    return (d || 1) * 24 * 60 * 60 * 1000;
  }
  if (dur.includes("second")) {
    const s = parseInt(dur, 10);
    return (s || 1) * 1000;
  }
  return null;
}

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
  const [showCallLinkModal, setShowCallLinkModal] = useState(false);
  const [isStickerMode, setIsStickerMode] = useState(false);
  const [showPinnedMenu, setShowPinnedMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [headerMenuAnchor, setHeaderMenuAnchor] = useState(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [showForwardSelectedModal, setShowForwardSelectedModal] = useState(false);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockedMenu, setShowBlockedMenu] = useState(false);
  const blockedMenuRef = useRef(null);
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
  const {
    messages,
    isMessagesLoading,
    clearMessages,
    sendMessage,
    sendCallLinkMessage,
    users,
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
    pinnedMessages,
    unpinMessage,
    toggleStarMessage,
    isMessageStarred,
    starredMessages,
    blockedContacts,
    blockContact,
    unblockContact,
    deleteChat,
  } = useChatStore();

  const messagesContainerRef = useRef(null);
  const prevContactIdRef = useRef(null);
  const isProgrammaticScrollRef = useRef(true);
  const restoredChatIdRef = useRef(null);
  const previousChatRef = useRef({ contactId: null, convId: null });
  const currentChatScrollRef = useRef(null);
  const hasUserScrolledSinceSwitchRef = useRef(false);
  const isUserInteractingRef = useRef(false);
  const isShowingLastMessageRef = useRef(false);

  let matchCounter = -1;

  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const conversationId = (
    selectedContact?.conversation?._id ||
    selectedContact?.conversation ||
    currentConversation?._id
  )?.toString();
  const isTyping = isUserTyping(conversationId, selectedContact?._id);

  const isMetaAiChat = Boolean(
    selectedContact?.isAI ||
    String(selectedContact?._id) === META_AI_USER_ID ||
    String(selectedContact?.id) === META_AI_USER_ID ||
    selectedContact?.username === "Meta AI"
  );
  const [metaAiOptimisticThinking, setMetaAiOptimisticThinking] = useState(false);

  useEffect(() => {
    if (messages && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (
        last?.isMetaAi ||
        last?.sender?.isAI ||
        String(last?.sender?._id || last?.sender) === META_AI_USER_ID
      ) {
        setMetaAiOptimisticThinking(false);
      }
    }
  }, [messages]);

  const isMetaAiTyping = Boolean(
    metaAiOptimisticThinking ||
    (isMetaAiChat && isTyping) ||
    (conversationId && isUserTyping(conversationId, META_AI_USER_ID)) ||
    isUserTyping(META_AI_USER_ID)
  );

  const [showMentionPopover, setShowMentionPopover] = useState(false);

  useEffect(() => {
    const handlePrefill = (e) => {
      if (e.detail) {
        setMessage(e.detail);
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }
    };
    window.addEventListener("meta_ai_prefill", handlePrefill);
    return () => window.removeEventListener("meta_ai_prefill", handlePrefill);
  }, []);

  const handleSelectMention = () => {
    const words = message.split(/\s/);
    words.pop();
    words.push("@Meta AI ");
    setMessage(words.join(" "));
    setShowMentionPopover(false);
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  const chatId = useMemo(() => {
    return (
      selectedContact?._id ||
      selectedContact?.id ||
      selectedContact?.conversation?._id ||
      selectedContact?.conversation ||
      selectedContact?.conversationId ||
      null
    );
  }, [selectedContact]);

  const targetUserId = useMemo(() => {
    return getTargetUserId(selectedContact, user?._id);
  }, [selectedContact, user?._id]);

  const isBlocked = useMemo(() => {
    if (!blockedContacts || blockedContacts.length === 0) return false;
    const candidates = [
      targetUserId,
      chatId,
      selectedContact?._id,
      selectedContact?.id,
      selectedContact?.conversation?._id,
      selectedContact?.conversation,
      selectedContact?.conversationId,
    ].filter(Boolean).map(String);
    return candidates.some((id) => blockedContacts.map(String).includes(id));
  }, [chatId, selectedContact, blockedContacts, targetUserId]);

  const handleUnblockContact = () => {
    const targetId = targetUserId || selectedContact?._id || chatId;
    if (targetId) {
      unblockContact(targetId, chatId);
      toast.success(`${selectedContact?.username || "Contact"} unblocked`);
    }
  };

  const handleExecuteDeleteChat = async () => {
    const targetId = targetUserId || selectedContact?._id || chatId;
    await deleteChat(chatId, targetId);
    setSelectedContact?.(null);
    setCurrentConversation?.(null);
    try {
      useLayoutStore.getState().setSelectedContact(null);
    } catch { }
    toast.success("Chat deleted");
    setShowDeleteConfirm(false);
  };

  const handleConfirmBlock = ({ report } = {}) => {
    const targetId = targetUserId || selectedContact?._id || chatId;
    if (!targetId) return;
    blockContact(targetId);
    if (report) {
      toast.success(`${selectedContact?.username || "Contact"} reported and blocked`);
    } else {
      toast.success(`${selectedContact?.username || "Contact"} blocked`);
    }
    setShowBlockModal(false);
  };

  const handleConfirmReport = ({ block } = {}) => {
    const targetId = chatId || selectedContact?._id;
    if (block && targetId) {
      blockContact(targetId);
      toast.success(`${selectedContact?.username || "Contact"} reported and blocked`);
    } else {
      toast.success("Report submitted to WhatsApp");
    }
    setShowReportModal(false);
  };
  const { setShowContactInfo, openContactInfoWithTab } = useLayoutStore();
  const disappearingDurations = useLayoutStore((state) => state.disappearingDurations);
  const disappearingEvents = useLayoutStore((state) => state.disappearingEvents);
  const defaultMessageTimer = useLayoutStore((state) => state.defaultMessageTimer);
  const chatThemes = useLayoutStore((state) => state.chatThemes);
  const chatDoodles = useLayoutStore((state) => state.chatDoodles);
  const chatBubbleColors = useLayoutStore((state) => state.chatBubbleColors);
  const isChatSearchOpen = useLayoutStore((state) => state.isChatSearchOpen);
  const setIsChatSearchOpen = useLayoutStore((state) => state.setIsChatSearchOpen);

  useEffect(() => {
    if (isChatSearchOpen) {
      setIsSearchOpen(true);
    }
  }, [isChatSearchOpen]);

  const activeChatId = (
    selectedContact?.conversation?._id ||
    selectedContact?.conversation ||
    selectedContact?._id ||
    ""
  )?.toString();

  const disappearingDuration =
    (activeChatId && disappearingDurations?.[activeChatId]) ||
    (selectedContact?.conversation?.disappearingDuration &&
      selectedContact.conversation.disappearingDuration !== "Off"
      ? selectedContact.conversation.disappearingDuration
      : null) ||
    defaultMessageTimer ||
    "Off";

  const [disappearingTick, setDisappearingTick] = useState(0);
  useEffect(() => {
    const rawMsgs = Array.isArray(messages) ? messages : [];
    const hasDisappearingMsgs = rawMsgs.some(
      (m) => m && m.isDisappearing && !m.isKept
    );
    const isDisappearingActive = disappearingDuration && disappearingDuration !== "Off";

    if (!isDisappearingActive && !hasDisappearingMsgs) return;

    const interval = setInterval(() => {
      setDisappearingTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [disappearingDuration, messages]);

  const chatDisappearingEvents = useMemo(() => {
    if (!activeChatId) return [];
    const convId = (selectedContact?.conversation?._id || selectedContact?.conversation)?.toString();
    const contactId = selectedContact?._id?.toString();
    const storedEvents =
      (convId && disappearingEvents?.[convId]?.length > 0 && disappearingEvents[convId]) ||
      (contactId && disappearingEvents?.[contactId]?.length > 0 && disappearingEvents[contactId]) ||
      disappearingEvents?.[activeChatId] ||
      [];
    if (storedEvents.length === 0 && disappearingDuration && disappearingDuration !== "Off") {
      const eventTime = selectedContact?.conversation?.disappearingUpdatedAt
        ? new Date(selectedContact.conversation.disappearingUpdatedAt).toISOString()
        : new Date().toISOString();
      const effectiveSetBy =
        selectedContact?.conversation?.disappearingSetBy?._id ||
        selectedContact?.conversation?.disappearingSetBy ||
        null;
      return [
        {
          _id: `disp_init_${activeChatId}`,
          isDisappearingSystemEvent: true,
          action: "turned_on",
          duration: disappearingDuration,
          previousDuration: "Off",
          createdAt: eventTime,
          timestamp: new Date(eventTime).getTime(),
          setBy: effectiveSetBy,
        },
      ];
    }
    return storedEvents;
  }, [
    activeChatId,
    selectedContact,
    disappearingEvents,
    disappearingDuration,
    messages,
  ]);

  const combinedMessages = useMemo(() => {
    const rawMsgs = Array.isArray(messages) ? messages : [];
    const now = Date.now();
    const turnedOnTime = selectedContact?.conversation?.disappearingUpdatedAt
      ? new Date(selectedContact.conversation.disappearingUpdatedAt).getTime()
      : null;
    const validMsgs = rawMsgs.filter((msg) => {
      if (msg.isKept || msg.isStarred) return true;
      if (msg.deletedForEveryone) return true;
      if (msg.isDisappearing === false) return true;
      if (msg.isDisappearing === true) {
        const expTime = msg.disappearingExpiresAt
          ? new Date(msg.disappearingExpiresAt).getTime()
          : null;
        if (expTime) {
          return now < expTime;
        }
        const dur = msg.disappearingDuration || disappearingDuration;
        const durMs = getDisappearingDurationMs(dur);
        if (!durMs) return true;
        const msgTime = new Date(msg.createdAt).getTime();
        return (now - msgTime) < durMs;
      }
      if (
        disappearingDuration &&
        disappearingDuration !== "Off" &&
        turnedOnTime &&
        new Date(msg.createdAt).getTime() >= turnedOnTime
      ) {
        const durMs = getDisappearingDurationMs(disappearingDuration);
        if (!durMs) return true;
        const msgTime = new Date(msg.createdAt).getTime();
        return (now - msgTime) < durMs;
      }
      return true;
    });

    if (!chatDisappearingEvents || chatDisappearingEvents.length === 0) {
      return validMsgs;
    }
    const combined = [...validMsgs, ...chatDisappearingEvents];
    combined.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
      const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
      return timeA - timeB;
    });
    return combined;
  }, [
    messages,
    chatDisappearingEvents,
    disappearingDuration,
    selectedContact,
    disappearingTick,
  ]);

  const activeChatThemeId = (activeChatId && chatThemes?.[activeChatId]) || "default";
  const activeChatTheme = useMemo(() => getChatTheme(activeChatThemeId), [activeChatThemeId]);
  const customBubbleColor = activeChatId && chatBubbleColors?.[activeChatId];
  const activeBubbleColor = customBubbleColor || activeChatTheme.bubbleColor;
  const doodlesEnabled = activeChatId ? chatDoodles?.[activeChatId] !== false : true;

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

    if (
      !pin &&
      selectedContact?.conversation?.pinnedMessage &&
      selectedContact.conversation.pinnedMessage.message
    ) {
      const convPin = selectedContact.conversation.pinnedMessage;
      const expires = convPin.expiresAt
        ? new Date(convPin.expiresAt).getTime()
        : null;
      if (!expires || expires > Date.now()) {
        pin = {
          message: convPin.message,
          duration: convPin.duration || "7 days",
          pinnedAt: convPin.pinnedAt
            ? new Date(convPin.pinnedAt).getTime()
            : Date.now(),
          expiresAt: expires,
          pinnedBy: convPin.pinnedBy,
        };
      }
    }

    const isMsgDeleted = (msg) => {
      if (!msg) return true;
      if (msg.isDisappearing && !msg.isKept && !msg.deletedForEveryone) {
        const dur = msg.disappearingDuration || disappearingDuration;
        const durMs = getDisappearingDurationMs(dur);
        const expTime = msg.disappearingExpiresAt
          ? new Date(msg.disappearingExpiresAt).getTime()
          : (msg.createdAt && durMs ? new Date(msg.createdAt).getTime() + durMs : null);
        if (expTime && Date.now() >= expTime) {
          return true;
        }
      }
      if (msg.deletedForEveryone) return true;
      if (
        msg.content === "This message was deleted" ||
        msg.content === "You deleted this message"
      ) {
        return true;
      }
      if (
        user?._id &&
        msg.deletedFor &&
        Array.isArray(msg.deletedFor) &&
        msg.deletedFor.some((id) => String(id) === String(user._id))
      ) {
        return true;
      }
      return false;
    };

    if (!pin || !pin.message) return null;
    if (isMsgDeleted(pin.message)) return null;
    if (pin.expiresAt && pin.expiresAt <= Date.now()) return null;

    if (pin.message?._id && Array.isArray(messages)) {
      const foundInMessages = messages.find(
        (m) => String(m._id) === String(pin.message._id)
      );
      if (foundInMessages && foundInMessages._isDecrypted) {
        return {
          ...pin,
          message: foundInMessages,
        };
      }
    }

    return pin;
  }, [
    pinnedMessages,
    currentConversation?._id,
    selectedContact?._id,
    selectedContact?.conversation,
    messages,
    user?._id,
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
          !m.deletedForEveryone &&
          m.content !== "This message was deleted" &&
          m.content !== "You deleted this message" &&
          String(m.sender?._id || m.sender) === String(user?._id || user?.id)
      )
    );
  }, [selectedMsgsList, user]);

  const hasDeletedSelected = useMemo(() => {
    return (
      selectedMsgsList.length > 0 &&
      selectedMsgsList.some(
        (m) =>
          m.deletedForEveryone ||
          m.content === "This message was deleted" ||
          m.content === "You deleted this message"
      )
    );
  }, [selectedMsgsList]);

  const hasDownloadableSelected = useMemo(() => {
    return (
      selectedMsgsList.length > 0 &&
      selectedMsgsList.some(
        (m) =>
          (m.contentType && m.contentType !== "text") ||
          Boolean(m.imageOrVideoUrl && m.contentType !== "text")
      )
    );
  }, [selectedMsgsList]);

  const handleToggleSelectMessage = (msgId) => {
    if (!msgId) return;
    const idStr = String(msgId);
    const container = messagesContainerRef.current;
    const currentScrollTop = container ? container.scrollTop : null;

    isProgrammaticScrollRef.current = true;
    setSelectedMessageIds((prev) =>
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    );

    if (container && currentScrollTop !== null) {
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = currentScrollTop;
        }
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 80);
      });
    } else {
      isProgrammaticScrollRef.current = false;
    }
  };

  const handleEnterSelectMode = (initialMsgId) => {
    const container = messagesContainerRef.current;
    const currentScrollTop = container ? container.scrollTop : null;

    isProgrammaticScrollRef.current = true;
    setIsSelectMode(true);
    if (initialMsgId) {
      setSelectedMessageIds([String(initialMsgId)]);
    } else {
      setSelectedMessageIds([]);
    }

    if (container && currentScrollTop !== null) {
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = currentScrollTop;
        }
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 80);
      });
    } else {
      isProgrammaticScrollRef.current = false;
    }
  };

  const handleExitSelectMode = () => {
    const container = messagesContainerRef.current;
    const currentScrollTop = container ? container.scrollTop : null;

    isProgrammaticScrollRef.current = true;
    setIsSelectMode(false);
    setSelectedMessageIds([]);

    if (container && currentScrollTop !== null) {
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = currentScrollTop;
        }
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 80);
      });
    } else {
      isProgrammaticScrollRef.current = false;
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
        handleExitSelectMode();
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
      handleExitSelectMode();
    }
  };

  const getPinnedPreviewText = (msg) => {
    if (!msg) return "";
    if (msg.isEncrypted && !msg._isDecrypted) {
      return "Pinned message";
    }
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
    if (msg.contentType === "poll" || msg.pollData || msg.poll) {
      const q =
        msg.pollData?.question ||
        msg.poll?.question ||
        (typeof msg.content === "string" ? msg.content.replace(/^Poll:\s*/, "") : "Poll");
      return `📊 ${q}`;
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

  const [decryptedPinnedText, setDecryptedPinnedText] = useState("");

  useEffect(() => {
    let isMounted = true;
    const resolvePinnedPreview = async () => {
      const msg = activePin?.message;
      if (!msg) {
        setDecryptedPinnedText("");
        return;
      }

      if (msg._isDecrypted || !msg.isEncrypted || !msg.iv) {
        setDecryptedPinnedText(getPinnedPreviewText(msg));
        return;
      }

      if (Array.isArray(messages)) {
        const found = messages.find((m) => String(m._id) === String(msg._id));
        if (found && found._isDecrypted) {
          setDecryptedPinnedText(getPinnedPreviewText(found));
          return;
        }
      }

      try {
        const dec = await decryptSingleMessage(
          msg,
          user?._id,
          selectedContact,
          useChatStore.getState,
        );
        if (isMounted) {
          if (dec?._isDecrypted) {
            setDecryptedPinnedText(getPinnedPreviewText(dec));
            const currConvId =
              currentConversation?._id || selectedContact?.conversation?._id;
            if (currConvId) {
              useChatStore.getState().pinMessage(
                currConvId,
                dec,
                activePin.duration,
                selectedContact?._id,
                null,
                false,
                activePin.pinnedBy,
              );
            }
          } else {
            setDecryptedPinnedText(getPinnedPreviewText(msg));
          }
        }
      } catch (err) {
        if (isMounted) setDecryptedPinnedText(getPinnedPreviewText(msg));
      }
    };

    resolvePinnedPreview();
    return () => {
      isMounted = false;
    };
  }, [activePin, messages, user?._id, selectedContact, currentConversation?._id]);

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

  useEffect(() => {
    const handleReplyEvent = (e) => {
      if (e.detail?.message) {
        handleStartReply(e.detail.message);
      }
    };
    const handleScrollEvent = (e) => {
      if (e.detail?.messageId) {
        setTimeout(() => {
          handleScrollToPinnedMessage(e.detail.messageId);
        }, 300);
      }
    };
    window.addEventListener("start-reply-message", handleReplyEvent);
    window.addEventListener("scroll-to-message", handleScrollEvent);
    return () => {
      window.removeEventListener("start-reply-message", handleReplyEvent);
      window.removeEventListener("scroll-to-message", handleScrollEvent);
    };
  }, []);

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
  useOutsideClick(blockedMenuRef, () => setShowBlockedMenu(false));

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
    const targetId = typeof getTargetUserId === "function" ? getTargetUserId(contact, user?._id) : null;
    return { contactId, convId, targetId };
  };

  const getAnchorMessage = (container) => {
    if (!container) return null;
    const containerRect = container.getBoundingClientRect();
    const bubbles = container.querySelectorAll("[id^='msg-']");
    for (let i = 0; i < bubbles.length; i++) {
      const bubble = bubbles[i];
      const rect = bubble.getBoundingClientRect();
      if (rect.bottom > containerRect.top + 8) {
        const msgId = bubble.id.replace("msg-", "");
        const offset = rect.top - containerRect.top;
        return { msgId, offset };
      }
    }
    return null;
  };

  const commitScrollPosition = (contactId, convId, pos, targetId) => {
    if (!pos) return;
    const save = useChatStore.getState().saveScrollPosition;
    const ids = [contactId, convId, targetId].filter(Boolean);
    if (ids.length > 0) {
      save(ids, pos);
    }
  };

  const saveCurrentScrollNow = () => {
    const el = messagesContainerRef.current;
    if (!el || !selectedContact?._id) return;
    if (isProgrammaticScrollRef.current) return;
    if (isMessagesLoading || messages.length === 0) return;

    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 25;
    const anchor = getAnchorMessage(el);
    const pos = {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      isAtBottom,
      anchorMsgId: anchor?.msgId || null,
      anchorOffset: anchor?.offset || 0,
      timestamp: Date.now(),
    };
    currentChatScrollRef.current = pos;
    const { contactId, convId, targetId } = getChatKeys(selectedContact);
    commitScrollPosition(contactId, convId, pos, targetId);
  };

  const handleCloseChatWindow = () => {
    saveCurrentScrollNow();
    setSelectedContact?.(null);
    setCurrentConversation?.(null);
    try {
      useLayoutStore.getState().setSelectedContact(null);
    } catch { }
  };

  const scrollToLastMessage = (behavior = "auto") => {
    const el = messagesContainerRef.current;
    if (!el) return;
    isProgrammaticScrollRef.current = true;
    if (messageEndRef.current) {
      try {
        messageEndRef.current.scrollIntoView({
          behavior: behavior === "smooth" ? "smooth" : "instant",
          block: "end",
        });
      } catch {
        el.scrollTop = el.scrollHeight;
      }
    } else {
      el.scrollTop = el.scrollHeight;
    }
    const timer = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 100);
    return timer;
  };

  const scrollToBottom = (behavior = "auto") => {
    isShowingLastMessageRef.current = true;
    hasUserScrolledSinceSwitchRef.current = true;
    scrollToLastMessage(behavior);
    const el = messagesContainerRef.current;
    if (el) {
      const bottomPos = {
        isAtBottom: true,
        scrollTop: el.scrollHeight,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        anchorMsgId: null,
        anchorOffset: 0,
      };
      currentChatScrollRef.current = bottomPos;
      const { contactId, convId, targetId } = getChatKeys(selectedContact);
      commitScrollPosition(contactId, convId, bottomPos, targetId);
    }
  };

  const handleMessageScroll = () => {
    const el = messagesContainerRef.current;
    if (!el || !selectedContact?._id) return;
    if (isProgrammaticScrollRef.current) return;
    if (isMessagesLoading || messages.length === 0) return;

    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 35;
    if (!isAtBottom) {
      isShowingLastMessageRef.current = false;
    } else {
      isShowingLastMessageRef.current = true;
    }

    hasUserScrolledSinceSwitchRef.current = true;
    const anchor = getAnchorMessage(el);
    const pos = {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      isAtBottom,
      anchorMsgId: anchor?.msgId || null,
      anchorOffset: anchor?.offset || 0,
      timestamp: Date.now(),
    };
    currentChatScrollRef.current = pos;

    const { contactId, convId, targetId } = getChatKeys(selectedContact);
    commitScrollPosition(contactId, convId, pos, targetId);
  };

  useEffect(() => {
    const nextContactId = selectedContact?._id?.toString() || null;
    const nextConvId = (selectedContact?.conversation?._id || currentConversation?._id)?.toString() || null;

    const prevContactId = previousChatRef.current.contactId;
    const prevConvId = previousChatRef.current.convId;

    if (prevContactId && prevContactId !== nextContactId) {
      const el = messagesContainerRef.current;
      let posToSave = currentChatScrollRef.current;
      if (!posToSave && el && el.scrollHeight > el.clientHeight + 10 && !isProgrammaticScrollRef.current) {
        const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 25;
        const anchor = getAnchorMessage(el);
        posToSave = {
          scrollTop: el.scrollTop,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          isAtBottom,
          anchorMsgId: anchor?.msgId || null,
          anchorOffset: anchor?.offset || 0,
        };
      }
      if (posToSave) {
        commitScrollPosition(prevContactId, prevConvId, posToSave);
      }

      currentChatScrollRef.current = null;
      restoredChatIdRef.current = null;
      hasUserScrolledSinceSwitchRef.current = false;
      isProgrammaticScrollRef.current = true;
      isShowingLastMessageRef.current = false;
    }

    previousChatRef.current = { contactId: nextContactId, convId: nextConvId };
  }, [selectedContact?._id]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentScrollNow();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [selectedContact?._id]);

  useEffect(() => {
    return () => {
      const prevContactId = previousChatRef.current.contactId;
      const prevConvId = previousChatRef.current.convId;
      const el = messagesContainerRef.current;
      let posToSave = currentChatScrollRef.current;
      if (!posToSave && el && el.scrollHeight > el.clientHeight + 10 && !isProgrammaticScrollRef.current) {
        const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 25;
        const anchor = getAnchorMessage(el);
        posToSave = {
          scrollTop: el.scrollTop,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          isAtBottom,
          anchorMsgId: anchor?.msgId || null,
          anchorOffset: anchor?.offset || 0,
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
    const targetId = typeof getTargetUserId === "function" ? getTargetUserId(selectedContact, user?._id) : null;

    if (!el || !contactId || isMessagesLoading || messages.length === 0) return;

    if (restoredChatIdRef.current !== contactId) {
      const allPositions = useChatStore.getState().scrollPositions || {};
      const savedPos =
        (convId && allPositions[convId]) ||
        (contactId && allPositions[contactId]) ||
        (targetId && allPositions[targetId]);

      isProgrammaticScrollRef.current = true;
      restoredChatIdRef.current = contactId;

      if (!savedPos || savedPos.isAtBottom) {
        isShowingLastMessageRef.current = true;
        currentChatScrollRef.current = {
          scrollTop: el.scrollHeight,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          isAtBottom: true,
        };

        scrollToLastMessage();

        const raf = requestAnimationFrame(() => {
          scrollToLastMessage();
        });
        const t1 = setTimeout(() => scrollToLastMessage(), 60);
        const t2 = setTimeout(() => scrollToLastMessage(), 180);
        const t3 = setTimeout(() => scrollToLastMessage(), 350);
        const t4 = setTimeout(() => scrollToLastMessage(), 600);

        return () => {
          cancelAnimationFrame(raf);
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearTimeout(t4);
        };
      } else {
        isShowingLastMessageRef.current = false;
        currentChatScrollRef.current = savedPos;

        const applyPosition = () => {
          const container = messagesContainerRef.current;
          if (!container) return;
          isProgrammaticScrollRef.current = true;

          if (savedPos.anchorMsgId) {
            const bubble = document.getElementById(`msg-${savedPos.anchorMsgId}`);
            if (bubble) {
              const containerRect = container.getBoundingClientRect();
              const bubbleRect = bubble.getBoundingClientRect();
              const diff = bubbleRect.top - (containerRect.top + (savedPos.anchorOffset || 0));
              container.scrollTop += diff;
              return;
            }
          }
          if (typeof savedPos.scrollTop === "number") {
            container.scrollTop = savedPos.scrollTop;
          }
        };

        applyPosition();

        const raf = requestAnimationFrame(applyPosition);
        const t1 = setTimeout(applyPosition, 40);
        const t2 = setTimeout(applyPosition, 120);
        const t3 = setTimeout(() => {
          applyPosition();
          isProgrammaticScrollRef.current = false;
        }, 250);

        return () => {
          cancelAnimationFrame(raf);
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
        };
      }
    } else {
      if (isSelectMode) return;

      if (isShowingLastMessageRef.current) {
        scrollToLastMessage();
      }
    }
  }, [messages, isMessagesLoading, selectedContact?._id, isSelectMode]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    let resizeTimer = null;
    const observer = new ResizeObserver(() => {
      if (isShowingLastMessageRef.current && !isMessagesLoading && messages.length > 0) {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          scrollToLastMessage();
        }, 30);
      }
    });

    observer.observe(el);
    if (el.firstElementChild) {
      observer.observe(el.firstElementChild);
    }

    return () => {
      observer.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [selectedContact?._id, isMessagesLoading, messages.length]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const handleUserInteractionStart = () => {
      isUserInteractingRef.current = true;
    };
    const handleUserInteractionEnd = () => {
      setTimeout(() => {
        isUserInteractingRef.current = false;
      }, 150);
    };

    el.addEventListener("wheel", handleUserInteractionStart, { passive: true });
    el.addEventListener("touchstart", handleUserInteractionStart, { passive: true });
    el.addEventListener("pointerdown", handleUserInteractionStart, { passive: true });
    window.addEventListener("pointerup", handleUserInteractionEnd, { passive: true });
    window.addEventListener("touchend", handleUserInteractionEnd, { passive: true });

    return () => {
      el.removeEventListener("wheel", handleUserInteractionStart);
      el.removeEventListener("touchstart", handleUserInteractionStart);
      el.removeEventListener("pointerdown", handleUserInteractionStart);
      window.removeEventListener("pointerup", handleUserInteractionEnd);
      window.removeEventListener("touchend", handleUserInteractionEnd);
    };
  }, []);

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
      const receiverId = targetUserId || selectedContact?._id;
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
          formData.append("receiverId", receiverId);
          formData.append("messageStatus", "send");
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
        formData.append("receiverId", receiverId);
        formData.append("messageStatus", "send");
        formData.append("content", trimmedMessage);
        formData.append("contentType", "text");
        if (replyData) {
          formData.append("replyTo", replyData._id);
          formData.append("replyMessage", JSON.stringify(replyData));
        }
        await sendMessage(formData);
        if (isMetaAiChat || trimmedMessage.toLowerCase().includes("@meta ai")) {
          setMetaAiOptimisticThinking(true);
          setTimeout(() => setMetaAiOptimisticThinking(false), 20000);
        }
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
        isShowingLastMessageRef.current = true;
        const { contactId, convId, targetId } = getChatKeys(selectedContact);
        commitScrollPosition(contactId, convId, bottomPos, targetId);
      }
      scrollToLastMessage();
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
      formData.append("receiverId", targetUserId || selectedContact?._id);
      formData.append("messageStatus", "send");
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
      formData.append("receiverId", targetUserId || selectedContact?._id);
      formData.append("messageStatus", "send");
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
      formData.append("receiverId", targetUserId || selectedContact?._id);
      formData.append("messageStatus", "send");
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
      formData.append("receiverId", targetUserId || selectedContact?._id);
      formData.append("messageStatus", "send");
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

  const renderDisappearingSystemNotification = (eventData) => {
    const isEvent = Boolean(eventData && eventData.isDisappearingSystemEvent);
    const action = isEvent
      ? eventData.action
      : disappearingDuration === "Off"
        ? "turned_off"
        : "turned_on";
    const duration = isEvent ? eventData.duration : disappearingDuration;
    const isOff = duration === "Off" || action === "turned_off";
    const currentUserId = (user?._id || user?.id)?.toString();
    const setById = (
      eventData?.setBy?._id ||
      eventData?.setBy?.id ||
      eventData?.setBy ||
      selectedContact?.conversation?.disappearingSetBy?._id ||
      selectedContact?.conversation?.disappearingSetBy
    )?.toString();
    const isByMe = Boolean(setById && currentUserId && setById === currentUserId);
    const actor = isByMe ? "You" : (selectedContact?.username || "Contact");

    let text;
    if (isOff) {
      text = isByMe
        ? "You turned off disappearing messages."
        : `${actor} turned off disappearing messages.`;
    } else if (action === "updated") {
      text = isByMe
        ? `You updated the message timer. New messages will disappear from this chat ${duration} after they're sent, except when kept.`
        : `${actor} updated the message timer. New messages will disappear from this chat ${duration} after they're sent, except when kept.`;
    } else {
      text = isByMe
        ? `You turned on disappearing messages. New messages will disappear from this chat ${duration} after they're sent, except when kept.`
        : `${actor} turned on disappearing messages. New messages will disappear from this chat ${duration} after they're sent, except when kept.`;
    }

    return (
      <div className="flex justify-center my-2 select-none px-4">
        <div
          onClick={() => openContactInfoWithTab("disappearing")}
          className={`max-w-[620px] px-3.5 py-1.5 rounded-lg text-[12.5px] leading-[19px] shadow-sm text-center cursor-pointer transition-all duration-150 active:scale-[0.99] border ${theme === "dark"
            ? "bg-[#182229] border-[#222d34]/60 text-[#8696a0] hover:bg-[#202c33]"
            : "bg-white border-black/5 text-[#54656f] hover:bg-gray-50"
            }`}
          title="Click to change disappearing messages timer"
        >
          <span className="inline-flex items-center align-baseline mr-1.5 -mb-0.5 text-[#8696a0]">
            <WhatsAppDisappearingIcon size={14} className="shrink-0" />
          </span>
          <span>{text} </span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              openContactInfoWithTab("disappearing");
            }}
            className={`font-semibold hover:underline cursor-pointer ${theme === "dark" ? "text-[#e9edef]" : "text-[#111b21]"
              }`}
          >
            Change timer.
          </span>
        </div>
      </div>
    );
  };

  const renderDateSeparator = (
    date,
    includePinNotification = false
  ) => {
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

    const currentUserId = (user?._id || user?.id)?.toString();
    const pinnedById = (
      activePin?.pinnedBy?._id ||
      activePin?.pinnedBy?.id ||
      activePin?.pinnedBy
    )?.toString();

    let isPinnedByMe = false;
    if (pinnedById && currentUserId) {
      isPinnedByMe = pinnedById === currentUserId;
    } else if (activePin?.message) {
      const msgSender = (
        activePin.message?.sender?._id || activePin.message?.sender
      )?.toString();
      isPinnedByMe = Boolean(msgSender && currentUserId && msgSender === currentUserId);
    }

    return (
      <div className="flex flex-col items-center justify-center my-2 select-none gap-2">
        <span
          className={`px-3 py-1 text-xs font-normal rounded-lg shadow-sm transition-colors ${theme === "dark"
            ? "bg-[#182229] text-[#8696a0]"
            : "bg-white text-[#54656f] border border-black/5"
            }`}
        >
          {dateString}
        </span>

        {includePinNotification && activePin?.message && (() => {
          const { text: pinNoticeText } = getPinActorAndLabel(
            activePin,
            user?._id || user?.id,
            selectedContact?.username,
          );
          return (
            <button
              type="button"
              onClick={() => handleScrollToPinnedMessage(activePin.message?._id)}
              className={`px-3 py-1 text-xs font-normal rounded-lg shadow-sm transition-all duration-200 cursor-pointer active:scale-95 ${theme === "dark"
                ? "bg-[#182229] hover:bg-[#202c33] text-[#8696a0] hover:text-[#d1d7db]"
                : "bg-white hover:bg-gray-50 text-[#54656f] border border-black/5"
                }`}
              title="Click to jump to pinned message"
            >
              {pinNoticeText}
            </button>
          );
        })()}
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
    if (!Array.isArray(combinedMessages) || combinedMessages.length === 0) return {};
    const acc = {};
    for (let i = 0; i < combinedMessages.length; i++) {
      const msg = combinedMessages[i];
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
  }, [combinedMessages]);

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
      const matched = msgs.filter((msg) => {
        if (msg.isDisappearingSystemEvent) return false;
        return (msg.content || "").toLowerCase().includes(lowerSearch);
      });
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
    if (selectedContact) {
      const { initiateCall } = useVideoCallStore.getState();
      const avatar = selectedContact?.profilePicture;
      initiateCall(
        selectedContact?._id,
        selectedContact?.username,
        avatar,
        "video",
      );
    }
  };

  const handleAudioCall = () => {
    if (selectedContact) {
      const { initiateCall } = useVideoCallStore.getState();
      const avatar = selectedContact?.profilePicture;
      initiateCall(
        selectedContact?._id,
        selectedContact?.username,
        avatar,
        "audio",
      );
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
        className={`h-full w-full flex flex-col overflow-hidden ${theme === "dark" ? "bg-[#0b141a] text-white" : "bg-[#efe7de] text-gray-900"}`}
      >
        <ChatHeader
          handleChatContextMenu={handleChatContextMenu}
          theme={theme}
          selectedContact={selectedContact}
          setSelectedContact={setSelectedContact}
          setCurrentConversation={setCurrentConversation}
          setShowContactInfo={setShowContactInfo}
          online={online}
          openContactInfoWithTab={openContactInfoWithTab}
          disappearingDuration={disappearingDuration}
          isTyping={isTyping}
          lastSeen={lastSeen}
          searchIconRef={searchIconRef}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          setIsChatSearchOpen={setIsChatSearchOpen}
          inputRef={inputRef}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          resultCount={resultCount}
          currentIndex={currentIndex}
          goPrev={goPrev}
          goNext={goNext}
          handleVideoCall={handleVideoCall}
          handleAudioCall={handleAudioCall}
          headerMenuBtnRef={headerMenuBtnRef}
          setHeaderMenuAnchor={setHeaderMenuAnchor}
          setShowHeaderMenu={setShowHeaderMenu}
          onCloseChat={handleCloseChatWindow}
        />

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
                  {decryptedPinnedText || getPinnedPreviewText(activePin.message)}
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
            className={`flex-1 px-2 sm:px-4 md:px-5 py-2 overflow-y-auto [overflow-anchor:none] custom-scrollbar relative transition-colors duration-500 ${theme === "dark" ? "bg-[#0b141a] bg-opacity-95" : "bg-[#efe7de]"
              }`}
            style={{
              backgroundColor:
                theme === "dark"
                  ? (activeChatTheme.bgColor || "#0b141a")
                  : "#efe7de",
              backgroundImage: activeChatTheme.imageUrl
                ? `linear-gradient(rgba(11, 20, 26, 0.42), rgba(11, 20, 26, 0.42)), url('${activeChatTheme.imageUrl}')`
                : theme === "dark"
                  ? doodlesEnabled && (activeChatTheme.hasDoodles || !activeChatTheme.gradient)
                    ? `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`
                    : activeChatTheme.gradient || "none"
                  : `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
              backgroundSize: activeChatTheme.imageUrl ? "cover" : "400px",
              backgroundPosition: activeChatTheme.imageUrl ? "center" : undefined,
              backgroundRepeat: activeChatTheme.imageUrl ? "no-repeat" : "repeat",
              backgroundAttachment: activeChatTheme.imageUrl ? "fixed" : undefined,
              backgroundBlendMode: activeChatTheme.imageUrl
                ? "normal"
                : theme === "dark" ? "overlay" : "soft-light",
            }}
          >
            <div className="w-full max-w-[1400px] mx-auto flex flex-col space-y-1.5">
              <div className="flex justify-center my-3 select-none px-4">
                {isMetaAiChat ? (
                  <div
                    className={`inline-flex items-center gap-2 py-1.5 px-3 sm:px-4 rounded-xl text-[12.5px] leading-[18px] max-w-[480px] text-center shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] border ${theme === "dark"
                      ? "bg-[#182229] text-[#8696a0] border-white/5"
                      : "bg-white text-[#54656f] border-black/5"
                      }`}
                  >
                    <MetaAiRing size={16} showInnerIcon={false} />
                    <span>
                      Messages are generated by AI. Some messages may be inaccurate.{" "}
                      <span className="text-[#00a884] dark:text-[#25d366] font-medium cursor-pointer hover:underline">
                        Learn more
                      </span>
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openContactInfoWithTab("security")}
                    className={`inline-block py-1.5 px-3 sm:px-4 rounded-lg text-[12.5px] leading-[18px] max-w-[430px] text-center transition-all duration-150 cursor-pointer shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] active:scale-[0.99] border ${theme === "dark"
                      ? "bg-[#182229] text-[#ffd279] border-white/5 hover:bg-[#202c33]"
                      : "bg-[#ffeecd] text-[#54656f] border-black/5 hover:bg-[#fde6b8]"
                      }`}
                    title="Messages and calls are end-to-end encrypted. Click to verify."
                  >
                    <FaLock
                      className={`inline-block w-2.5 h-2.5 mr-1.5 -translate-y-[1px] ${theme === "dark" ? "text-[#ffd279]" : "text-[#54656f]"
                        }`}
                    />
                    <span>
                      Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. Click to learn more.
                    </span>
                  </button>
                )}
              </div>

              {isMessagesLoading ? (
                <MessageSkeletonLoader theme={theme} />
              ) : allDateEntries.length === 0 ? (
                isMetaAiChat ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 select-none max-w-[540px] mx-auto text-center animate-fade-in">
                    <MetaAiRing size={68} animate />
                    <div className="flex items-center gap-1.5 mt-3 mb-1">
                      <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        Meta AI
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-[400px]">
                      Ask anything, generate stunning images with <span className="font-mono text-emerald-500">/imagine</span>, or get help with brainstorming and planning.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                      {[
                        { icon: "🎨", text: "/imagine a futuristic cyberpunk neon city in 4k" },
                        { icon: "💡", text: "Explain how quantum computers work simply" },
                        { icon: "✈️", text: "Plan a 3-day weekend itinerary for Tokyo" },
                        { icon: "✍️", text: "Write a polite follow-up email after an interview" },
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setMessage(chip.text);
                            if (messageInputRef.current) messageInputRef.current.focus();
                          }}
                          className={`p-3 rounded-xl text-left text-xs transition-all flex items-start gap-2.5 border cursor-pointer hover:scale-[1.02] active:scale-98 shadow-sm ${theme === "dark"
                            ? "bg-[#202c33] hover:bg-[#2a3942] text-gray-200 border-white/5"
                            : "bg-white hover:bg-gray-50 text-gray-800 border-black/5"
                            }`}
                        >
                          <span className="text-base select-none">{chip.icon}</span>
                          <span className="flex-1 font-medium line-clamp-2">{chip.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 select-none gap-2 text-center">
                    <span
                      className={`px-3 py-1 text-xs font-normal rounded-lg shadow-sm ${theme === "dark"
                        ? "bg-[#182229] text-[#8696a0]"
                        : "bg-white text-[#54656f] border border-black/5"
                        }`}
                    >
                      Today
                    </span>
                    <p className="text-xs sm:text-sm font-medium opacity-70 mt-4">
                      {searchTerm
                        ? `No messages found matching "${searchTerm}"`
                        : "No messages yet. Send a message to start chatting!"}
                    </p>
                  </div>
                )
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
                        {renderDateSeparator(
                          new Date(date),
                          shouldRenderPin
                        )}

                        {msgs.map((msg, index) => {
                          if (msg.isDisappearingSystemEvent) {
                            return (
                              <div key={msg._id || `disp-${index}`}>
                                {renderDisappearingSystemNotification(msg)}
                              </div>
                            );
                          }

                          const prevMsg =
                            index > 0 && !msgs[index - 1]?.isDisappearingSystemEvent
                              ? msgs[index - 1]
                              : null;
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
                              chatBubbleColor={theme === "dark" ? activeBubbleColor : undefined}
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
                              disappearingDuration={(() => {
                                if (msg.isDisappearing !== undefined) {
                                  return (msg.isDisappearing && msg.disappearingDuration && msg.disappearingDuration !== "Off")
                                    ? msg.disappearingDuration
                                    : null;
                                }
                                if (!disappearingDuration || disappearingDuration === "Off") return null;
                                const turnedOnTime = selectedContact?.conversation?.disappearingUpdatedAt
                                  ? new Date(selectedContact.conversation.disappearingUpdatedAt).getTime()
                                  : null;
                                if (!turnedOnTime) return null;
                                return new Date(msg.createdAt).getTime() >= turnedOnTime ? disappearingDuration : null;
                              })()}
                              onOpenDisappearing={() => openContactInfoWithTab("disappearing")}
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

              {isBlocked && (
                <div className="flex flex-col items-center justify-center my-3 select-none">
                  <div
                    className={`px-3.5 py-1.5 text-xs font-normal rounded-lg shadow-sm transition-colors flex items-center gap-2 ${theme === "dark"
                      ? "bg-[#182229] text-[#8696a0]"
                      : "bg-white text-[#54656f] border border-black/5"
                      }`}
                  >
                    <MdBlock size={13} className="text-red-400 shrink-0" />
                    <span>You blocked this contact.</span>
                    <button
                      type="button"
                      onClick={handleUnblockContact}
                      className="text-[#00a884] hover:underline font-semibold cursor-pointer"
                    >
                      Unblock
                    </button>
                    <span className="text-[#8696a0]/40">•</span>
                    <button
                      type="button"
                      onClick={() => setShowReportModal(true)}
                      className="text-red-400 hover:underline font-semibold cursor-pointer"
                    >
                      Report
                    </button>
                  </div>
                </div>
              )}
              {isMetaAiTyping && (
                <div className="flex items-center gap-2 py-1 px-4 justify-start animate-fade-in select-none">
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#202c33] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] border border-black/5 dark:border-white/5">
                    <MetaAiRing size={18} animate />
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-300">
                      <span>Meta AI is thinking</span>
                      <span className="flex gap-1 ml-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce" />
                      </span>
                    </div>
                  </div>
                </div>
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
                  onClick={handleExitSelectMode}
                  className={`p-1.5 rounded-full border border-transparent transition-all cursor-pointer active:scale-95 ${theme === "dark"
                    ? "text-[#aebac1] hover:text-white hover:bg-white/10 hover:border-white/15"
                    : "text-gray-600 hover:text-gray-900 hover:bg-black/5 hover:border-black/10"
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
                {!hasDeletedSelected && (
                  <button
                    type="button"
                    onClick={handleStarSelectedMessages}
                    disabled={selectedMessageIds.length === 0}
                    className={`p-1.5 rounded-full border border-transparent transition-all ${selectedMessageIds.length === 0
                      ? "opacity-30 cursor-not-allowed text-[#8696a0]"
                      : theme === "dark"
                        ? "text-[#aebac1] hover:text-white cursor-pointer active:scale-90 hover:bg-white/10 hover:border-white/15"
                        : "text-gray-600 hover:text-gray-900 cursor-pointer active:scale-90 hover:bg-black/5 hover:border-black/10"
                      }`}
                    title="Star messages"
                  >
                    {areAllSelectedStarred ? (
                      <FaStar size={20} className="text-amber-400" />
                    ) : (
                      <FaRegStar size={20} />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowDeleteSelectedModal(true)}
                  disabled={selectedMessageIds.length === 0}
                  className={`p-1.5 rounded-full border border-transparent transition-all ${selectedMessageIds.length === 0
                    ? "opacity-30 cursor-not-allowed text-[#8696a0]"
                    : theme === "dark"
                      ? "text-[#aebac1] hover:text-white cursor-pointer active:scale-90 hover:bg-white/10 hover:border-white/15"
                      : "text-gray-600 hover:text-gray-900 cursor-pointer active:scale-90 hover:bg-black/5 hover:border-black/10"
                    }`}
                  title="Delete messages"
                >
                  <RiDeleteBin6Line size={21} />
                </button>

                {!hasDeletedSelected && (
                  <button
                    type="button"
                    onClick={() => setShowForwardSelectedModal(true)}
                    disabled={selectedMessageIds.length === 0}
                    className={`p-1.5 rounded-full border border-transparent transition-all ${selectedMessageIds.length === 0
                      ? "opacity-30 cursor-not-allowed text-[#8696a0]"
                      : theme === "dark"
                        ? "text-[#aebac1] hover:text-white cursor-pointer active:scale-90 hover:bg-white/10 hover:border-white/15"
                        : "text-gray-600 hover:text-gray-900 cursor-pointer active:scale-90 hover:bg-black/5 hover:border-black/10"
                      }`}
                    title="Forward messages"
                  >
                    <LuForward size={22} />
                  </button>
                )}

                {!hasDeletedSelected && hasDownloadableSelected && (
                  <button
                    type="button"
                    onClick={handleDownloadSelectedMessages}
                    disabled={selectedMessageIds.length === 0}
                    className={`p-1.5 rounded-full border border-transparent transition-all ${selectedMessageIds.length === 0
                      ? "opacity-30 cursor-not-allowed text-[#8696a0]"
                      : theme === "dark"
                        ? "text-[#aebac1] hover:text-white cursor-pointer active:scale-90 hover:bg-white/10 hover:border-white/15"
                        : "text-gray-600 hover:text-gray-900 cursor-pointer active:scale-90 hover:bg-black/5 hover:border-black/10"
                      }`}
                    title="Download media"
                  >
                    <FiDownload size={20} />
                  </button>
                )}
              </div>
            </div>
          ) : isBlocked ? (
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
                    className="shrink-0 p-2 sm:p-2.5 rounded-full border border-transparent text-gray-500 dark:text-[#8696a0] hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/15 transition-all cursor-pointer"
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
            handleExitSelectMode();
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
          handleEnterSelectMode();
        }}
        onStartCall={(type) => {
          if (type === "video") handleVideoCall();
          else handleAudioCall();
        }}
        onOpenContactInfo={() => setShowContactInfo(true)}
        onOpenDisappearingMessages={() => openContactInfoWithTab("disappearing")}
        onOpenChatTheme={() => openContactInfoWithTab("chatTheme")}
        onOpenCallLink={() => setShowCallLinkModal(true)}
        onCloseChat={handleCloseChatWindow}
      />

      <NewCallLinkModal
        isOpen={showCallLinkModal}
        onClose={() => setShowCallLinkModal(false)}
        contacts={users}
        activeContact={selectedContact}
        onStartCall={(contact, type) => {
          const { initiateCall } = useVideoCallStore.getState();
          if (typeof initiateCall === "function") {
            const peer = selectedContact || contact;
            const pId = (peer?._id || peer?.id || peer)?.toString();
            const pName = peer?.username || peer?.name || "Contact";
            const pAvatar = peer?.profilePicture || peer?.avatar || "";
            initiateCall(pId, pName, pAvatar, type);
          }
        }}
        onSendToChat={(contact, url, type, code) => {
          const receiverId = (contact?._id || contact?.id || selectedContact?._id)?.toString();
          if (receiverId) {
            sendCallLinkMessage({
              receiverId,
              conversationId: currentConversation?._id || selectedContact?.conversation?._id,
              callType: type || "video",
              linkCode: code,
              url,
            });
          }
        }}
      />

      <BlockModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onBlock={handleConfirmBlock}
        contactName={selectedContact?.username || "contact"}
        theme={theme}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReport={handleConfirmReport}
        contactName={selectedContact?.username || "contact"}
        theme={theme}
      />

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/65 backdrop-blur-[2px]"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-[360px] sm:max-w-[400px] rounded-2xl p-6 shadow-2xl border select-none ${theme === "dark"
              ? "bg-[#233138] border-white/10 text-white"
              : "bg-white border-black/10 text-gray-900"
              }`}
          >
            <h3 className="text-lg font-semibold mb-2">Delete this chat?</h3>
            <p
              className={`text-sm mb-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
            >
              Messages will be deleted for you. This chat will be removed from your chats list.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${theme === "dark"
                  ? "hover:bg-white/10 text-gray-300"
                  : "hover:bg-black/5 text-gray-600"
                  }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteChat}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-sm active:scale-95"
              >
                Delete chat
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};


export { ChatWindow };
export default ChatWindow;
