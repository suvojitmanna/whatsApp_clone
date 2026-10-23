import React, { useEffect, useRef, useState, useMemo } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore, decryptSingleMessage, getTargetUserId } from "../../store/chatStore";
import { format } from "date-fns";
import { FaLock } from "react-icons/fa";
import { MdBlock } from "react-icons/md";
import { getChatTheme } from "../../utils/chatThemes";
import MessageBuble from "./MessageBuble";
import MessageSkeletonLoader from "./MessageSkeletonLoader";
import useOutsideClick from "../../hook/useOutsideClick";
import useVideoCallStore from "../../store/videoCallStore";
import useLayoutStore from "../../store/layoutStore";
import { toast } from "react-toastify";
import AttachInput from "../../components/media/AttachInput";
import ChatHeader from "./ChatHeader";
import { MetaAiRing, META_AI_USER_ID } from "../../components/common/MetaAiIcon";
import { isGroupSystemMessage } from "../../utils/systemMessageUtils";
import {
  ChatWindowEmpty,
  PinnedBanner,
  DateSeparatorPill,
  GroupSystemNotice,
  DisappearingSystemNotice,
  MultiSelectActionBar,
  ChatInputBar,
  ChatModals,
  getDisappearingDurationMs,
  isValidate,
  getPinnedPreviewText,
  getReplyPreviewText,
} from "./chatWindow/index.js";

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
  const [showGroupCallModal, setShowGroupCallModal] = useState(false);
  const [groupCallModalType, setGroupCallModalType] = useState("audio");
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
      (selectedContact?.isGroup ? (selectedContact?._id || selectedContact?.id) : null) ||
      conversations?.data?.find((conv) =>
        conv.participants?.some(
          (participant) => (participant?._id || participant) === selectedContact?._id,
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
      const isGroupChat = Boolean(
        selectedContact?.isGroup ||
        selectedContact?.isGroupChat ||
        selectedContact?.groupName ||
        selectedContact?.conversation?.isGroup ||
        selectedContact?.conversation?.groupName ||
        currentConversation?.isGroup ||
        currentConversation?.groupName ||
        (Array.isArray(selectedContact?.participants) && selectedContact.participants.length > 2) ||
        (Array.isArray(selectedContact?.conversation?.participants) && selectedContact.conversation.participants.length > 2) ||
        Boolean(selectedContact?.groupAdmin || selectedContact?.conversation?.groupAdmin)
      );
      const effectiveConversationId =
        conversationId ||
        selectedContact?.conversation?._id ||
        (selectedContact?.isGroup ? (selectedContact?._id || selectedContact?.id) : null);
      const receiverId = isGroupChat
        ? (effectiveConversationId || selectedContact?._id)
        : (targetUserId || selectedContact?._id);
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
          if (effectiveConversationId) {
            formData.append("conversationId", effectiveConversationId);
          }
          if (isGroupChat) {
            formData.append("isGroup", "true");
          }
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
        if (effectiveConversationId) {
          formData.append("conversationId", effectiveConversationId);
        }
        if (isGroupChat) {
          formData.append("isGroup", "true");
        }
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

  const isGroupChat = Boolean(
    selectedContact?.isGroup ||
    selectedContact?.isGroupChat ||
    selectedContact?.groupName ||
    selectedContact?.conversation?.isGroup ||
    selectedContact?.conversation?.groupName ||
    currentConversation?.isGroup ||
    currentConversation?.groupName ||
    (Array.isArray(selectedContact?.participants) && selectedContact.participants.length > 2) ||
    (Array.isArray(selectedContact?.conversation?.participants) && selectedContact.conversation.participants.length > 2) ||
    Boolean(selectedContact?.groupAdmin || selectedContact?.conversation?.groupAdmin)
  );

  const groupParticipants = useMemo(() => {
    if (!isGroupChat) return [];
    return (
      selectedContact?.participants ||
      selectedContact?.conversation?.participants ||
      []
    );
  }, [selectedContact, isGroupChat]);

  const groupAdmins = useMemo(() => {
    if (!isGroupChat) return [];
    const raw =
      selectedContact?.groupAdmin ||
      selectedContact?.conversation?.groupAdmin ||
      [];
    return Array.isArray(raw) ? raw : [raw];
  }, [selectedContact, isGroupChat]);

  const handleVideoCall = () => {
    if (!selectedContact) return;
    if (isGroupChat) {
      const myIdStr = user?._id?.toString();
      const otherMembers = groupParticipants.filter((p) => {
        const pId = (p?._id || p)?.toString();
        return pId && pId !== myIdStr;
      });

      if (otherMembers.length === 0) {
        toast.info("No other participants in this group to call");
        return;
      }

      const otherMemberIds = otherMembers
        .map((p) => (p?._id || p)?.toString())
        .filter(Boolean);

      const { initiateCall } = useVideoCallStore.getState();
      const avatar =
        selectedContact?.profilePicture ||
        selectedContact?.groupProfileImage ||
        "";
      const displayName =
        selectedContact?.groupName ||
        selectedContact?.name ||
        selectedContact?.username ||
        "Group";
      const gId = (selectedContact?._id || selectedContact?.id)?.toString();

      if (typeof initiateCall === "function") {
        initiateCall(
          otherMemberIds[0],
          displayName,
          avatar,
          "video",
          {
            isGroup: true,
            groupId: gId,
            groupName: displayName,
            groupAvatar: avatar,
            participantIds: otherMemberIds,
          }
        );
      }
      return;
    }
    const { initiateCall } = useVideoCallStore.getState();
    const avatar = selectedContact?.profilePicture;
    initiateCall(
      selectedContact?._id,
      selectedContact?.username,
      avatar,
      "video",
    );
  };

  const handleAudioCall = () => {
    if (!selectedContact) return;
    if (isGroupChat) {
      const myIdStr = user?._id?.toString();
      const otherMembers = groupParticipants.filter((p) => {
        const pId = (p?._id || p)?.toString();
        return pId && pId !== myIdStr;
      });

      if (otherMembers.length === 0) {
        toast.info("No other participants in this group to call");
        return;
      }

      const otherMemberIds = otherMembers
        .map((p) => (p?._id || p)?.toString())
        .filter(Boolean);

      const { initiateCall } = useVideoCallStore.getState();
      const avatar =
        selectedContact?.profilePicture ||
        selectedContact?.groupProfileImage ||
        "";
      const displayName =
        selectedContact?.groupName ||
        selectedContact?.name ||
        selectedContact?.username ||
        "Group";
      const gId = (selectedContact?._id || selectedContact?.id)?.toString();

      if (typeof initiateCall === "function") {
        initiateCall(
          otherMemberIds[0],
          displayName,
          avatar,
          "audio",
          {
            isGroup: true,
            groupId: gId,
            groupName: displayName,
            groupAvatar: avatar,
            participantIds: otherMemberIds,
          }
        );
      }
      return;
    }
    const { initiateCall } = useVideoCallStore.getState();
    const avatar = selectedContact?.profilePicture;
    initiateCall(
      selectedContact?._id,
      selectedContact?.username,
      avatar,
      "audio",
    );
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
    return <ChatWindowEmpty theme={theme} />;
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
          <PinnedBanner
            activePin={activePin}
            theme={theme}
            handleScrollToPinnedMessage={handleScrollToPinnedMessage}
            decryptedPinnedText={decryptedPinnedText}
            getPinnedPreviewText={getPinnedPreviewText}
            pinnedMenuRef={pinnedMenuRef}
            showPinnedMenu={showPinnedMenu}
            setShowPinnedMenu={setShowPinnedMenu}
            handleUnpinFromBanner={handleUnpinFromBanner}
          />

          <div
            ref={messagesContainerRef}
            onScroll={handleMessageScroll}
            className={`flex-1 px-2 sm:px-4 md:px-5 py-2 overflow-y-auto [overflow-anchor:none] custom-scrollbar relative transition-colors duration-500 ${theme === "dark" ? "bg-[#0b141a] bg-opacity-95" : "bg-[#efe7de]"}`}
            style={{
              backgroundColor:
                theme === "dark"
                  ? (activeChatTheme.bgColor || "#0b141a")
                  : "#efe7de",
              backgroundImage: activeChatTheme.imageUrl
                ? `linear-gradient(rgba(11, 20, 26, 0.42), rgba(11, 20, 26, 0.42)), url('${activeChatTheme.imageUrl}')`
                : theme === "dark"
                  ? doodlesEnabled && (activeChatTheme.hasDoodles || !activeChatTheme.gradient)
                    ? "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')"
                    : activeChatTheme.gradient || "none"
                  : "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
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
                      className={`inline-block w-2.5 h-2.5 mr-1.5 -translate-y-[1px] ${theme === "dark" ? "text-[#ffd279]" : "text-[#54656f]"}`}
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
                        <DateSeparatorPill
                          date={new Date(date)}
                          includePinNotification={shouldRenderPin}
                          activePin={activePin}
                          user={user}
                          selectedContact={selectedContact}
                          handleScrollToPinnedMessage={handleScrollToPinnedMessage}
                          theme={theme}
                        />

                        {msgs.map((msg, index) => {
                          if (msg.isDisappearingSystemEvent) {
                            return (
                              <div key={msg._id || `disp-${index}`}>
                                <DisappearingSystemNotice
                                  eventData={msg}
                                  disappearingDuration={disappearingDuration}
                                  user={user}
                                  selectedContact={selectedContact}
                                  openContactInfoWithTab={openContactInfoWithTab}
                                  theme={theme}
                                />
                              </div>
                            );
                          }

                          if (isGroupSystemMessage(msg)) {
                            return (
                              <div key={msg._id || `sys-${index}`}>
                                <GroupSystemNotice
                                  msg={msg}
                                  user={user}
                                  theme={theme}
                                />
                              </div>
                            );
                          }

                          const prevMsg =
                            index > 0 &&
                              !msgs[index - 1]?.isDisappearingSystemEvent &&
                              !isGroupSystemMessage(msgs[index - 1])
                              ? msgs[index - 1]
                              : null;
                          const prevSenderId = (prevMsg?.sender?._id || prevMsg?.sender)?.toString();
                          const currentSenderId = (msg?.sender?._id || msg?.sender)?.toString();
                          const isTimeGap =
                            prevMsg &&
                            msg?.createdAt &&
                            prevMsg?.createdAt &&
                            new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 3 * 60 * 1000;
                          const isFirstInSequence = !prevMsg || prevSenderId !== currentSenderId || isTimeGap;

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
                              isGroupChat={isGroupChat}
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
            <MultiSelectActionBar
              theme={theme}
              selectedMessageIds={selectedMessageIds}
              handleExitSelectMode={handleExitSelectMode}
              hasDeletedSelected={hasDeletedSelected}
              areAllSelectedStarred={areAllSelectedStarred}
              handleStarSelectedMessages={handleStarSelectedMessages}
              setShowDeleteSelectedModal={setShowDeleteSelectedModal}
              setShowForwardSelectedModal={setShowForwardSelectedModal}
              hasDownloadableSelected={hasDownloadableSelected}
              handleDownloadSelectedMessages={handleDownloadSelectedMessages}
            />
          ) : (
            <ChatInputBar
              theme={theme}
              isBlocked={isBlocked}
              setShowDeleteConfirm={setShowDeleteConfirm}
              handleUnblockContact={handleUnblockContact}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              user={user}
              selectedContact={selectedContact}
              getReplyPreviewText={getReplyPreviewText}
              fileMenuRef={fileMenuRef}
              showFileMenu={showFileMenu}
              setShowFileMenu={setShowFileMenu}
              fileInputRef={fileInputRef}
              documentInputRef={documentInputRef}
              audioInputRef={audioInputRef}
              stickerInputRef={stickerInputRef}
              handleFileChange={handleFileChange}
              setShowCamera={setShowCamera}
              setShowContactModal={setShowContactModal}
              setShowPollModal={setShowPollModal}
              setShowEventModal={setShowEventModal}
              setShowStickerModal={setShowStickerModal}
              setShowCallLinkModal={setShowCallLinkModal}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              emojiPickerRef={emojiPickerRef}
              message={message}
              setMessage={setMessage}
              showMentionPopover={showMentionPopover}
              setShowMentionPopover={setShowMentionPopover}
              handleSelectMention={handleSelectMention}
              messageInputRef={messageInputRef}
              isMetaAiChat={isMetaAiChat}
              handleSendMessage={handleSendMessage}
              isSending={isSending}
              selectedFiles={selectedFiles}
            />
          )}
        </div>
      </div>

      <ChatModals
        theme={theme}
        selectedContact={selectedContact}
        setSelectedContact={setSelectedContact}
        messages={messages}
        showCamera={showCamera}
        setShowCamera={setShowCamera}
        setSelectedFiles={setSelectedFiles}
        showPollModal={showPollModal}
        setShowPollModal={setShowPollModal}
        handleSendPoll={handleSendPoll}
        showContactModal={showContactModal}
        setShowContactModal={setShowContactModal}
        handleSendContact={handleSendContact}
        conversations={conversations}
        showEventModal={showEventModal}
        setShowEventModal={setShowEventModal}
        editingEventMessage={editingEventMessage}
        setEditingEventMessage={setEditingEventMessage}
        handleSendEvent={handleSendEvent}
        handleUpdateEvent={handleUpdateEvent}
        handleCancelEvent={handleCancelEvent}
        showStickerModal={showStickerModal}
        setShowStickerModal={setShowStickerModal}
        handleSendSticker={handleSendSticker}
        stickerInputRef={stickerInputRef}
        showGroupCallModal={showGroupCallModal}
        setShowGroupCallModal={setShowGroupCallModal}
        groupParticipants={groupParticipants}
        groupAdmins={groupAdmins}
        groupCallModalType={groupCallModalType}
        showForwardSelectedModal={showForwardSelectedModal}
        setShowForwardSelectedModal={setShowForwardSelectedModal}
        handleExitSelectMode={handleExitSelectMode}
        selectedMsgsList={selectedMsgsList}
        showDeleteSelectedModal={showDeleteSelectedModal}
        setShowDeleteSelectedModal={setShowDeleteSelectedModal}
        selectedMessageIds={selectedMessageIds}
        canDeleteForEveryone={canDeleteForEveryone}
        executeDeleteSelected={executeDeleteSelected}
        previewModalFile={previewModalFile}
        setPreviewModalFile={setPreviewModalFile}
        showHeaderMenu={showHeaderMenu}
        setShowHeaderMenu={setShowHeaderMenu}
        headerMenuAnchor={headerMenuAnchor}
        setHeaderMenuAnchor={setHeaderMenuAnchor}
        setIsSearchOpen={setIsSearchOpen}
        handleEnterSelectMode={handleEnterSelectMode}
        handleVideoCall={handleVideoCall}
        handleAudioCall={handleAudioCall}
        setShowContactInfo={setShowContactInfo}
        openContactInfoWithTab={openContactInfoWithTab}
        handleCloseChatWindow={handleCloseChatWindow}
        showCallLinkModal={showCallLinkModal}
        setShowCallLinkModal={setShowCallLinkModal}
        users={users}
        sendCallLinkMessage={sendCallLinkMessage}
        currentConversation={currentConversation}
        showBlockModal={showBlockModal}
        setShowBlockModal={setShowBlockModal}
        handleConfirmBlock={handleConfirmBlock}
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        handleConfirmReport={handleConfirmReport}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        handleExecuteDeleteChat={handleExecuteDeleteChat}
      />
    </>
  );
};

export { ChatWindow };
export default ChatWindow;
