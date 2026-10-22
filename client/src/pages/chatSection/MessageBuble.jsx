import React, { useRef, useState, useMemo, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheckDouble,
  FaPlus,
  FaRegImage,
  FaVideo,
  FaDownload,
  FaHeadphones,
  FaFileAlt,
  FaStar,
  FaEye,
  FaLock,
} from "react-icons/fa";
import { RiDeleteBin6Line, RiContactsFill } from "react-icons/ri";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import {
  MdEventNote,
  MdLocationOn,
  MdAccessTime,
  MdCallMade,
  MdCallReceived,
  MdCallMissed,
  MdOutlineVideocam,
  MdOutlineCall,
  MdLink,
  MdContentCopy,
  MdVideocam,
  MdCall,
} from "react-icons/md";
import { BsEmojiSmile } from "react-icons/bs";
import { RxCross2 } from "react-icons/rx";
import useOutsideClick from "../../hook/useOutsideClick";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-toastify";
import { useChatStore, decryptSingleMessage } from "../../store/chatStore";
import { getSocket } from "../../services/chatService";
import { getOrCreateUserKeyPair } from "../../utils/cryptoUtils";
import useUserStore from "../../store/useUserStore";
import useLayoutStore from "../../store/layoutStore";
import useVideoCallStore from "../../store/videoCallStore";
import { getDisappearingDurationMs } from "../../utils/formatTime";
import ReactionDetailsModal from "../../components/ReactionDetailsModal";
import FileViewerModal from "../../components/FileViewerModal";
import ForwardModal from "../../components/ForwardModal";
import PinDurationModal from "../../components/PinDurationModal";
import ReportModal from "../../components/ReportModal";
import MessageMenu from "./MessageMenu";
import { MetaAiRing, META_AI_USER_ID } from "../../components/common/MetaAiIcon";
import { MetaAiMarkdown, MetaAiImageCard, MetaAiFeedbackBar } from "../../components/common/MetaAiContent";

import {
  WhatsAppPinIcon,
  WhatsAppUnpinIcon,
  WhatsAppDisappearingIcon,
  TailOutIcon,
  TailInIcon,
  ProhibitedIcon,
  MessageCheckIcon,
  VideoCallOutgoingIcon,
  VideoCallIncomingIcon,
  CallOutgoingIcon,
} from "../../components/common/Icons";

export {
  WhatsAppPinIcon,
  WhatsAppUnpinIcon,
  WhatsAppDisappearingIcon,
};

const formatEventSchedule = (eventData) => {
  if (!eventData?.eventDate) return "Date TBD";
  try {
    const parts = eventData.eventDate.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const targetDate = new Date(year, month, day);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      let dayStr = "";
      if (targetDate.getTime() === today.getTime()) {
        dayStr = "Today";
      } else if (targetDate.getTime() === tomorrow.getTime()) {
        dayStr = "Tomorrow";
      } else {
        dayStr = format(targetDate, "EEE, d MMM");
      }
      let timeStr = "";
      if (eventData.eventTime) {
        timeStr = `, ${eventData.eventTime}`;
        if (eventData.endTime) {
          timeStr += ` - ${eventData.endTime}`;
        }
      }
      return `${dayStr}${timeStr}`;
    }
    return eventData.eventDate;
  } catch (e) {
    return eventData.eventDate;
  }
};

const MessageBuble = ({
  message,
  theme,
  chatBubbleColor,
  onReact,
  currentUser,
  deleteMessage,
  searchTerm,
  highlightText,
  dataMatch,
  isActive,
  onStatusClick,
  onEdit,
  onEditEvent,
  isFirstInSequence = true,
  onReply,
  selectedContact,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  onEnterSelectMode,
  disappearingDuration,
  onOpenDisappearing,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [menuCoords, setMenuCoords] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => {
    if (!deleteModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setDeleteModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteModal]);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message?.content || "");
  const [downloading, setDownloading] = useState(false);
  const [viewerModalFile, setViewerModalFile] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleDownloadFile = async (e, url, fileName) => {
    if (e) {
      e.stopPropagation();
    }
    if (!url) return;

    setDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          throw new Error("CLOUDINARY_RESTRICTED");
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download started");
    } catch (err) {
      console.warn("Blob download failed:", err);
      if (err.message === "CLOUDINARY_RESTRICTED") {
        toast.error(
          "Cloudinary is blocking PDF delivery. Please enable 'Allow delivery of PDF and ZIP files' in your Cloudinary Security Settings."
        );
      }
      try {
        let downloadUrl = url;
        if (url.includes("/upload/")) {
          downloadUrl = url.replace("/upload/", "/upload/fl_attachment/");
        }
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("download", fileName || "document.pdf");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackErr) {
        window.open(url, "_blank");
      }
    } finally {
      setDownloading(false);
    }
  };

  const emojiPickerRef = useRef(null);
  const reactionsMenuRef = useRef(null);
  const optionRef = useRef(null);
  const pressTimer = useRef(null);
  const isLongPress = useRef(false);
  const editRef = useRef(null);
  const bubbleRef = useRef(null);
  const reactionBadgeRef = useRef(null);

  const [showReactionDetails, setShowReactionDetails] = useState(false);
  const votePoll = useChatStore((state) => state.votePoll);
  const removeReaction = useChatStore((state) => state.removeReaction);
  const currentConversation = useChatStore((state) => state.currentConversation);
  const pinnedMessages = useChatStore((state) => state.pinnedMessages);
  const pinMessage = useChatStore((state) => state.pinMessage);
  const starredMessages = useChatStore((state) => state.starredMessages);
  const layoutSelectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedPollDetails = useLayoutStore(
    (state) => state.setSelectedPollDetails
  );
  const setSelectedMessageInfo = useLayoutStore(
    (state) => state.setSelectedMessageInfo
  );
  const storeUser = useUserStore((state) => state.user);
  const effectiveUser = currentUser || storeUser;
  const currentUserId = (effectiveUser?._id || effectiveUser?.id)?.toString();
  const senderId = (
    message?.sender?._id ||
    message?.sender?.id ||
    message?.sender
  )?.toString();
  const isUserMessage = Boolean(
    currentUserId && senderId && currentUserId === senderId
  );
  const isMetaAiMessage = Boolean(
    message?.isMetaAi ||
    senderId === META_AI_USER_ID ||
    message?.sender?.isAI ||
    message?.sender?.username === "Meta AI"
  );
  const isMetaAiChat = Boolean(
    selectedContact?.isAI ||
    selectedContact?.isMetaAi ||
    selectedContact?.username === "Meta AI" ||
    String(selectedContact?._id) === META_AI_USER_ID ||
    String(selectedContact?.id) === META_AI_USER_ID ||
    layoutSelectedContact?.isAI ||
    layoutSelectedContact?.isMetaAi ||
    layoutSelectedContact?.username === "Meta AI" ||
    String(layoutSelectedContact?._id) === META_AI_USER_ID ||
    String(layoutSelectedContact?.id) === META_AI_USER_ID
  );
  const isMetaAi = isMetaAiMessage || isMetaAiChat;
  const isDark = theme === "dark";

  const isSticker = message.contentType === "sticker";
  const isDisappearingExpired = useMemo(() => {
    if (!message || message.isKept || message.deletedForEveryone) return false;
    if (message.isDisappearing) {
      const expTime = message.disappearingExpiresAt
        ? new Date(message.disappearingExpiresAt).getTime()
        : null;
      if (expTime) {
        return Date.now() >= expTime;
      }
      const dur = message.disappearingDuration || disappearingDuration;
      const durMs = getDisappearingDurationMs(dur);
      if (durMs && message.createdAt) {
        return Date.now() >= new Date(message.createdAt).getTime() + durMs;
      }
    }
    return false;
  }, [message, disappearingDuration]);

  const isDeletedForEveryone = Boolean(
    !isDisappearingExpired &&
    (message.deletedForEveryone ||
      message.content === "This message was deleted" ||
      message.content === "You deleted this message")
  );

  const [decryptedText, setDecryptedText] = useState(
    message?._isDecrypted ? message.content : null,
  );

  useEffect(() => {
    let isMounted = true;
    if (message?.isEncrypted && !message?._isDecrypted && !decryptedText) {
      const activeContact = selectedContact || layoutSelectedContact;
      decryptSingleMessage(
        message,
        currentUserId,
        activeContact,
        useChatStore.getState,
      ).then(async (dec) => {
        if (isMounted && dec?._isDecrypted && dec?.content) {
          setDecryptedText(dec.content);
          message.content = dec.content;
          message._isDecrypted = true;
        } else if (isMounted && (!dec?._isDecrypted || !dec?.content)) {
          const socket = getSocket();
          if (socket && currentUserId) {
            try {
              const myKeys = await getOrCreateUserKeyPair(currentUserId);
              if (myKeys?.publicKeyStr) {
                const sId = (message.sender?._id || message.sender)?.toString();
                if (sId && sId !== currentUserId) {
                  socket.emit("request_reencrypt_message", {
                    messageId: (message._id?._id || message._id)?.toString(),
                    conversationId: (
                      message.conversation?._id || message.conversation
                    )?.toString(),
                    senderId: sId,
                    receiverId: currentUserId,
                    receiverPublicKey: myKeys.publicKeyStr,
                  });
                }
              }
            } catch (e) { }
          }
        }
      });
    } else if (
      message?._isDecrypted &&
      message?.content &&
      message.content !== decryptedText
    ) {
      setDecryptedText(message.content);
    }
    return () => {
      isMounted = false;
    };
  }, [
    message?._id,
    message?.content,
    message?.isEncrypted,
    message?._isDecrypted,
    currentUserId,
    selectedContact,
    layoutSelectedContact,
  ]);

  const isWaitingDecryption = Boolean(
    message?.isEncrypted && !message?._isDecrypted && !decryptedText,
  );

  const displayContent = useMemo(() => {
    if (isWaitingDecryption) {
      return null;
    }
    return decryptedText !== null && decryptedText !== undefined
      ? decryptedText
      : message?.content || "";
  }, [isWaitingDecryption, decryptedText, message?.content]);

  useEffect(() => {
    if (!isEditing && displayContent) {
      setEditText(displayContent);
    }
  }, [displayContent, isEditing]);

  const conversationId = currentConversation?._id || message?.conversationId || layoutSelectedContact?._id;
  const secondaryConvId = layoutSelectedContact?._id;

  const activePin = useMemo(() => {
    if (isDeletedForEveryone) return null;

    const currConv = currentConversation?._id?.toString();
    const msgConv = (message?.conversation?._id || message?.conversation || message?.conversationId)?.toString();
    const secConv = layoutSelectedContact?._id?.toString();
    const sender = (message?.sender?._id || message?.sender)?.toString();
    const receiver = (message?.receiver?._id || message?.receiver)?.toString();

    let pin =
      (currConv && pinnedMessages?.[currConv]) ||
      (msgConv && pinnedMessages?.[msgConv]) ||
      (secConv && pinnedMessages?.[secConv]) ||
      (sender && pinnedMessages?.[sender]) ||
      (receiver && pinnedMessages?.[receiver]);

    if (!pin) {
      const allPins = Object.values(pinnedMessages || {});
      const msgIdStr = (message?._id?._id || message?._id)?.toString();
      pin = allPins.find((p) => {
        if (!p?.message) return false;
        const pMsgId = (p.message?._id?._id || p.message?._id)?.toString();
        return pMsgId && msgIdStr && pMsgId === msgIdStr;
      });
    }

    if (!pin || !pin.message) return null;
    if (pin.expiresAt && pin.expiresAt <= Date.now()) return null;
    const pMsg = pin.message;
    if (
      pMsg.deletedForEveryone ||
      pMsg.content === "This message was deleted" ||
      pMsg.content === "You deleted this message"
    ) {
      return null;
    }
    return pin;
  }, [
    pinnedMessages,
    currentConversation?._id,
    layoutSelectedContact?._id,
    message?.conversation,
    message?.conversationId,
    message?.sender,
    message?.receiver,
    message?._id,
    isDeletedForEveryone,
  ]);

  const isPinned = useMemo(() => {
    if (isDeletedForEveryone) return false;
    if (!activePin?.message) return false;
    const activeMsgId = (activePin.message?._id?._id || activePin.message?._id || activePin.message)?.toString();
    const currentMsgId = (message?._id?._id || message?._id)?.toString();
    return Boolean(activeMsgId && currentMsgId && activeMsgId === currentMsgId);
  }, [activePin, message?._id, isDeletedForEveryone]);

  const isStarred = Boolean(
    starredMessages?.[message?._id] || message?.isStarred
  );

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const validReactions = useMemo(() => {
    return (message.reactions || []).filter((r) => Boolean(r && r.emoji));
  }, [message.reactions]);

  const uniqueReactions = useMemo(() => {
    const list = [];
    const seen = new Set();
    validReactions.forEach((r) => {
      if (r.emoji && !seen.has(r.emoji)) {
        seen.add(r.emoji);
        list.push(r.emoji);
      }
    });
    return list;
  }, [validReactions]);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const bubbleContentClass = isSticker
    ? "relative group !p-1 bg-transparent shadow-none"
    : isUserMessage
      ? `relative group max-w-[85%] sm:max-w-[75%] md:max-w-[65%] min-w-[75px] rounded-[7.5px] pt-[6px] pb-[7px] px-[9px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${isFirstInSequence ? "rounded-tr-none" : ""
      } ${theme === "dark"
        ? (chatBubbleColor ? "" : "bg-[#005c4b]") + " text-[#e9edef]"
        : "bg-[#d9fdd3] text-[#111b21]"
      }`
      : `relative group max-w-[85%] sm:max-w-[75%] md:max-w-[65%] min-w-[75px] rounded-[7.5px] pt-[6px] pb-[7px] px-[9px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${isFirstInSequence ? "rounded-tl-none" : ""
      } ${theme === "dark"
        ? "bg-[#202c33] text-[#e9edef]"
        : "bg-white text-[#111b21]"
      }`;

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
    const myExistingReaction = (message.reactions || []).find(
      (r) => String(r.userId?._id || r.userId) === String(currentUserId)
    );
    if (myExistingReaction && myExistingReaction.emoji === emoji) {
      if (removeReaction) {
        removeReaction(message._id);
      } else {
        onReact(message._id, null);
      }
      setShowReactionDetails(false);
    } else {
      onReact(message._id, emoji);
    }
    setShowEmojiPicker(false);
    setShowReactions(false);
  };

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
      setEditText(displayContent || message.content || "");
    }
  });

  useEffect(() => {
    const handleCloseOthers = (e) => {
      if (e.detail !== message._id) {
        setShowOptions(false);
      }
    };
    window.addEventListener("whatsapp_close_all_menus", handleCloseOthers);
    return () => {
      window.removeEventListener("whatsapp_close_all_menus", handleCloseOthers);
    };
  }, [message._id]);

  useEffect(() => {
    if (!showOptions) return;

    const handleDismiss = () => {
      setShowOptions(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowOptions(false);
      }
    };

    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showOptions]);

  useLayoutEffect(() => {
    if (showOptions && optionRef.current && menuCoords?.triggerRect) {
      const el = optionRef.current;
      const realHeight = el.offsetHeight;
      const realWidth = el.offsetWidth;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const padding = 10;
      const triggerRect = menuCoords.triggerRect;

      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      let newTop = menuCoords.top;
      let originY = "top";

      if (spaceBelow >= realHeight || spaceBelow >= spaceAbove) {
        newTop = triggerRect.bottom + 4;
        originY = "top";
        if (newTop + realHeight > viewportHeight - padding) {
          newTop = Math.max(padding, viewportHeight - realHeight - padding);
        }
      } else {
        newTop = triggerRect.top - realHeight - 4;
        originY = "bottom";
        if (newTop < padding) {
          newTop = padding;
        }
      }

      let newLeft = menuCoords.left;
      let originX = isUserMessage ? "right" : "left";
      if (isUserMessage) {
        newLeft = triggerRect.right - realWidth;
        if (newLeft < padding) newLeft = padding;
      } else {
        if (triggerRect.right + realWidth <= viewportWidth - padding) {
          newLeft = triggerRect.left;
          originX = "left";
        } else {
          newLeft = triggerRect.right - realWidth;
          originX = "right";
        }
        if (newLeft < padding) newLeft = padding;
        if (newLeft + realWidth > viewportWidth - padding) {
          newLeft = Math.max(padding, viewportWidth - realWidth - padding);
        }
      }

      if (
        Math.abs(newTop - menuCoords.top) > 2 ||
        Math.abs(newLeft - menuCoords.left) > 2
      ) {
        setMenuCoords((prev) => ({
          ...prev,
          top: Math.round(newTop),
          left: Math.round(newLeft),
          transformOrigin: `${originY} ${originX}`,
        }));
      }
    }
  }, [showOptions]);

  const handleToggleOptions = (e) => {
    e.stopPropagation();
    if (showOptions) {
      setShowOptions(false);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("whatsapp_close_all_menus", { detail: message._id })
    );

    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 220;
    const estimatedHeight = 420;
    const padding = 10;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top;
    let originY = "top";

    if (spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove) {
      top = rect.bottom + 4;
      originY = "top";
      if (top + estimatedHeight > viewportHeight - padding) {
        top = Math.max(padding, viewportHeight - estimatedHeight - padding);
      }
    } else {
      top = rect.top - estimatedHeight - 4;
      originY = "bottom";
      if (top < padding) {
        top = padding;
      }
    }

    let left;
    let originX = isUserMessage ? "right" : "left";

    if (isUserMessage) {
      left = rect.right - menuWidth;
      if (left < padding) left = padding;
    } else {
      if (rect.right + menuWidth <= viewportWidth - padding) {
        left = rect.left;
        originX = "left";
      } else {
        left = rect.right - menuWidth;
        originX = "right";
      }
      if (left < padding) left = padding;
      if (left + menuWidth > viewportWidth - padding) {
        left = Math.max(padding, viewportWidth - menuWidth - padding);
      }
    }

    setMenuCoords({
      top: Math.round(top),
      left: Math.round(left),
      transformOrigin: `${originY} ${originX}`,
      triggerRect: rect,
    });
    setShowOptions(true);
  };

  const handleContextMenu = (e) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

    e.preventDefault();
    e.stopPropagation();

    window.dispatchEvent(
      new CustomEvent("whatsapp_close_all_menus", { detail: message._id })
    );

    const clientX = e.clientX;
    const clientY = e.clientY;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 220;
    const estimatedHeight = 420;
    const padding = 10;

    let top = clientY + 4;
    let originY = "top";
    if (clientY + estimatedHeight > viewportHeight - padding) {
      top = Math.max(padding, clientY - estimatedHeight - 4);
      originY = "bottom";
    }

    let left = isUserMessage ? clientX - menuWidth : clientX;
    let originX = isUserMessage ? "right" : "left";
    if (left + menuWidth > viewportWidth - padding) {
      left = Math.max(padding, viewportWidth - menuWidth - padding);
      originX = "right";
    }
    if (left < padding) {
      left = padding;
      originX = "left";
    }

    setMenuCoords({
      top: Math.round(top),
      left: Math.round(left),
      transformOrigin: `${originY} ${originX}`,
      triggerRect: { top: clientY, bottom: clientY, left: clientX, right: clientX },
    });
    setShowOptions(true);
  };

  const renderStatusIcon = (isOverlay = false) => {
    if (!isUserMessage) return null;
    const status = message.messageStatus || message.status;
    if (!status || status === "pending" || status === "sending" || message.isPending) {
      return (
        <MdAccessTime
          size={isOverlay ? 11 : 11}
          className={isOverlay ? "text-white/85 shrink-0" : "opacity-60 shrink-0"}
          title="Sending / Offline"
        />
      );
    }

    const activeContact = selectedContact || layoutSelectedContact;
    const conversationObj =
      activeContact?.conversation ||
      currentConversation ||
      (typeof message.conversation === "object" ? message.conversation : null);

    const isGroupChat = Boolean(
      activeContact?.isGroup ||
      activeContact?.isGroupChat ||
      conversationObj?.isGroup ||
      (!message.receiver &&
        (activeContact?.participants?.length > 2 ||
          conversationObj?.participants?.length > 2))
    );

    if (isGroupChat) {
      const rawParticipants =
        activeContact?.participants ||
        conversationObj?.participants ||
        [];

      const otherParticipants = rawParticipants
        .map((p) => (p?._id || p?.userId || p?.id || p)?.toString())
        .filter((pId) => Boolean(pId) && pId !== currentUserId);

      if (otherParticipants.length > 0) {
        const readIds = new Set(
          (message.readBy || []).map((r) =>
            (r?.user?._id || r?.user || r?.userId || r)?.toString()
          )
        );
        const deliveredIds = new Set(
          (message.deliveredTo || []).map((d) =>
            (d?.user?._id || d?.user || d?.userId || d)?.toString()
          )
        );

        const allRead =
          status === "read" ||
          otherParticipants.every((pId) => readIds.has(pId));

        if (allRead) {
          return (
            <FaCheckDouble
              size={isOverlay ? 12 : 11}
              className="text-[#53bdeb] shrink-0"
              title="Read by all"
            />
          );
        }

        const allDelivered =
          status === "delivered" ||
          otherParticipants.every(
            (pId) => deliveredIds.has(pId) || readIds.has(pId)
          );

        if (allDelivered) {
          return (
            <FaCheckDouble
              size={isOverlay ? 12 : 11}
              className={isOverlay ? "text-white/85 shrink-0" : "opacity-60 shrink-0"}
              title="Delivered to all"
            />
          );
        }

        return (
          <FiCheck
            size={isOverlay ? 13 : 13}
            className={isOverlay ? "text-white/85 shrink-0" : "opacity-60 shrink-0"}
            title="Sent"
          />
        );
      }
    }

    if (status === "read") {
      return (
        <FaCheckDouble
          size={isOverlay ? 12 : 11}
          className="text-[#53bdeb] shrink-0"
          title="Read"
        />
      );
    }
    if (status === "delivered") {
      return (
        <FaCheckDouble
          size={isOverlay ? 12 : 11}
          className={isOverlay ? "text-white/85 shrink-0" : "opacity-60 shrink-0"}
          title="Delivered"
        />
      );
    }
    if (status === "send" || status === "sent") {
      return (
        <FiCheck
          size={isOverlay ? 13 : 13}
          className={isOverlay ? "text-white/85 shrink-0" : "opacity-60 shrink-0"}
          title="Sent"
        />
      );
    }
    return (
      <FiCheck
        size={isOverlay ? 13 : 13}
        className={isOverlay ? "text-white/85 shrink-0" : "opacity-60 shrink-0"}
      />
    );
  };

  const renderTimestampAndStatus = (isOverlay = false) => {
    if (isOverlay) {
      return (
        <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-[2px] text-white text-[10.5px] select-none pointer-events-auto shadow-sm z-10">
          {isPinned && (
            <WhatsAppPinIcon className="w-[11px] h-[13px] text-white/80 shrink-0" />
          )}
          {disappearingDuration && disappearingDuration !== "Off" && (
            <WhatsAppDisappearingIcon
              size={11}
              className="text-white/80 shrink-0 cursor-pointer hover:opacity-100"
              title={`Disappearing message: ${disappearingDuration}. Click to change.`}
              onClick={(e) => {
                e.stopPropagation();
                onOpenDisappearing?.();
              }}
            />
          )}
          {isStarred && (
            <FaStar size={10} className="text-white/80 shrink-0" title="Starred message" />
          )}
          {message.edited && (
            <span className="text-[9.5px] italic opacity-90 mr-0.5">Edited</span>
          )}
          <span>{format(new Date(message.createdAt || Date.now()), "HH:mm")}</span>
          {renderStatusIcon(true)}
          {!isSelectMode && (
            <button
              type="button"
              onClick={handleToggleOptions}
              className={`${showOptions ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                } transition-opacity p-0.5 text-white/90 hover:text-white cursor-pointer ml-0.5`}
              title="Menu"
            >
              <FiChevronDown size={13} />
            </button>
          )}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 select-none shrink-0 pointer-events-auto">
        {isPinned && (
          <WhatsAppPinIcon className="w-[11px] h-[13px] opacity-65 shrink-0 text-inherit" />
        )}
        {disappearingDuration && disappearingDuration !== "Off" && (
          <WhatsAppDisappearingIcon
            size={11}
            className="opacity-65 hover:opacity-100 transition-opacity shrink-0 text-inherit cursor-pointer"
            title={`Disappearing message: ${disappearingDuration}. Click to change.`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDisappearing?.();
            }}
          />
        )}
        {isStarred && (
          <FaStar size={10} className="opacity-65 shrink-0 text-inherit" title="Starred message" />
        )}
        {message.edited && (
          <span className="text-[10px] italic opacity-75 mr-0.5">Edited</span>
        )}
        <span className="text-[11px] leading-none opacity-60 font-normal">
          {format(new Date(message.createdAt || Date.now()), "HH:mm")}
        </span>
        {renderStatusIcon(false)}
        {!isSelectMode && message.contentType !== "poll" && message.contentType !== "call" && !message.callData && (
          <button
            type="button"
            onClick={handleToggleOptions}
            className={`${showOptions ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              } transition-opacity p-0.5 opacity-60 hover:opacity-100 cursor-pointer ml-0.5`}
            title="Menu"
          >
            <FiChevronDown size={14} />
          </button>
        )}
      </span>
    );
  };

  if (!message || isDisappearingExpired) return null;
  const msgDOMId = (message?._id?._id || message?._id || message?.temp)?.toString();

  return (
    <div
      id={msgDOMId ? `msg-${msgDOMId}` : undefined}
      onClick={
        isSelectMode
          ? (e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelect?.(message._id?._id || message._id || message.temp);
          }
          : undefined
      }
      className={`w-full relative flex items-center transition-colors duration-150 ${isSelectMode
        ? `cursor-pointer select-none py-0.5 ${isSelected
          ? isDark
            ? "bg-[#111b21]/60"
            : "bg-black/[0.06]"
          : isDark
            ? "hover:bg-[#111b21]/40"
            : "hover:bg-black/[0.03]"
        }`
        : "py-0.5"
        } ${isActive ? "z-10" : ""} ${isFirstInSequence ? "mt-2" : "mt-[2.5px]"}`}
      data-match={dataMatch ? "true" : "false"}
    >
      {isSelectMode && (
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelect?.(message._id?._id || message._id || message.temp);
          }}
          className="shrink-0 pl-6 sm:pl-7 pr-3 flex items-center justify-center select-none cursor-pointer"
        >
          <div
            className={`w-[18px] h-[18px] rounded-[3px] border-[1.5px] flex items-center justify-center transition-all duration-150 ${isSelected
              ? "bg-[#00a884] border-[#00a884] text-white shadow-sm"
              : isDark
                ? "border-[#8696a0]/80 bg-transparent hover:border-[#8696a0]"
                : "border-[#8696a0] bg-transparent hover:border-[#54656f]"
              }`}
          >
            {isSelected && <MessageCheckIcon />}
          </div>
        </div>
      )}

      <div
        className={`flex-1 flex min-w-0 ${isUserMessage
          ? "justify-end pl-10 sm:pl-16 md:pl-24 pr-1 sm:pr-2.5"
          : "justify-start pr-10 sm:pr-16 md:pr-24 pl-1 sm:pl-2.5"
          }`}
      >
        <div
          ref={bubbleRef}
          data-bubble="true"
          onContextMenu={isSelectMode ? undefined : handleContextMenu}
          onDoubleClick={(e) => {
            if (isSelectMode) return;
            e.stopPropagation();
            if (isDeletedForEveryone) return;
            onReply?.(message);
          }}
          style={
            isUserMessage && !isSticker && chatBubbleColor
              ? { backgroundColor: chatBubbleColor }
              : undefined
          }
          className={`${bubbleContentClass} relative group ${isActive
            ? "ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.55)]"
            : ""
            }`}
        >
          {!isSticker && isFirstInSequence && (
            isUserMessage ? (
              <span
                data-icon="tail-out"
                style={chatBubbleColor ? { color: chatBubbleColor } : undefined}
                className={`absolute top-0 -right-[8px] pointer-events-none select-none ${chatBubbleColor ? "" : (isDark ? "text-[#005c4b]" : "text-[#d9fdd3]")
                  }`}
              >
                <TailOutIcon />
              </span>
            ) : (
              <span
                data-icon="tail-in"
                className={`absolute top-0 -left-[8px] pointer-events-none select-none ${isDark ? "text-[#202c33]" : "text-white"
                  }`}
              >
                <TailInIcon />
              </span>
            )
          )}
          {isDeletedForEveryone ? (
            <div className="flex items-center gap-2 select-none py-0.5 px-0.5 min-w-[200px]">
              <ProhibitedIcon
                size={16}
                className={`shrink-0 ${isDark ? "text-white/60" : "text-[#8696a0]"}`}
              />
              <span
                className={`text-[14px] italic font-normal tracking-wide flex-1 min-w-0 select-none ${isDark ? "text-white/70" : "text-[#54656f]"
                  }`}
              >
                {isUserMessage ? "You deleted this message" : "This message was deleted"}
              </span>
              <span
                className={`text-[11px] leading-none ml-2.5 self-end shrink-0 select-none ${isDark ? "text-white/50" : "text-[#8696a0]"
                  }`}
              >
                {format(new Date(message.createdAt || Date.now()), "HH:mm")}
              </span>
              <button
                type="button"
                onClick={handleToggleOptions}
                className={`${showOptions ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  } transition-opacity p-0.5 opacity-60 hover:opacity-100 cursor-pointer ml-0.5 shrink-0`}
                title="Menu"
              >
                <FiChevronDown size={14} />
              </button>
            </div>
          ) : (
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onClick={() => setShowReactions((prev) => !prev)}
              className="relative"
            >
              {isMetaAiMessage && !isUserMessage && (
                <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-black/5 dark:border-white/5 select-none">
                  <MetaAiRing size={15} showInnerIcon={false} />
                  <span className="font-semibold text-xs bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Meta AI
                  </span>
                </div>
              )}
              {(() => {
                let rawReply =
                  message.replyMessage ||
                  (typeof message.replyTo === "object" && message.replyTo !== null
                    ? message.replyTo
                    : null);

                if (typeof rawReply === "string") {
                  try {
                    rawReply = JSON.parse(rawReply);
                  } catch (e) {
                    rawReply = null;
                  }
                }

                if (!rawReply && message.replyTo) {
                  const replyIdStr = (
                    message.replyTo?._id || message.replyTo
                  )?.toString();
                  if (replyIdStr) {
                    const found = useChatStore
                      .getState()
                      .messages?.find(
                        (m) => (m._id?._id || m._id)?.toString() === replyIdStr
                      );
                    if (found) {
                      rawReply = found;
                    }
                  }
                }

                const replyMsg = rawReply;
                if (!replyMsg) return null;

                const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
                const replySenderId = (
                  replyMsg.sender?._id || replyMsg.sender
                )?.toString();
                const isRepliedSenderMe = Boolean(
                  currentUserId && replySenderId && currentUserId === replySenderId
                );
                const replySenderName =
                  replyMsg.sender?.username ||
                  (isRepliedSenderMe
                    ? "You"
                    : (replyMsg.sender && typeof replyMsg.sender === "string" && replyMsg.sender === selectedContact?._id?.toString())
                      ? selectedContact?.username
                      : selectedContact?.username || "Contact");

                let replyPreviewText = replyMsg.content || "";
                if (replyMsg.deletedForEveryone) {
                  replyPreviewText = isRepliedSenderMe
                    ? "You deleted this message"
                    : "This message was deleted";
                } else if (replyMsg.contentType === "image") {
                  replyPreviewText = replyMsg.content ? `📷 ${replyMsg.content}` : "📷 Photo";
                } else if (replyMsg.contentType === "video") {
                  replyPreviewText = replyMsg.content ? `🎥 ${replyMsg.content}` : "🎥 Video";
                } else if (replyMsg.contentType === "audio") {
                  replyPreviewText = "🎵 Voice message";
                } else if (replyMsg.contentType === "document") {
                  replyPreviewText = replyMsg.fileName ? `📄 ${replyMsg.fileName}` : "📄 Document";
                } else if (replyMsg.contentType === "poll") {
                  replyPreviewText = `📊 ${replyMsg.pollData?.question || "Poll"}`;
                } else if (replyMsg.contentType === "event") {
                  replyPreviewText = `📅 ${replyMsg.eventData?.eventName || "Event"}`;
                } else if (replyMsg.contentType === "contact") {
                  replyPreviewText = `👤 ${replyMsg.contactData?.name || "Contact"}`;
                } else if (replyMsg.contentType === "sticker") {
                  replyPreviewText = "💟 Sticker";
                } else if (replyMsg.contentType === "call") {
                  const isVid = replyMsg.callData?.callType === "video" || replyMsg.callType === "video";
                  replyPreviewText = isVid ? "📹 Video call" : "📞 Voice call";
                }

                return (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetId = (
                        replyMsg._id?._id ||
                        replyMsg._id ||
                        message.replyTo?._id ||
                        message.replyTo
                      )?.toString();
                      if (!targetId) return;
                      const el = document.getElementById(`msg-${targetId}`);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        const targetBubble = el.querySelector('[data-bubble="true"]') || el;
                        targetBubble.classList.add(
                          "ring-2",
                          "ring-[#7f66ff]",
                          "shadow-[0_0_20px_rgba(127,102,255,0.7)]",
                          "transition-all",
                          "duration-300",
                          "scale-[1.02]"
                        );
                        setTimeout(() => {
                          targetBubble.classList.remove(
                            "ring-2",
                            "ring-[#7f66ff]",
                            "shadow-[0_0_20px_rgba(127,102,255,0.7)]",
                            "scale-[1.02]"
                          );
                        }, 1800);
                      } else {
                        toast.info("Original message is earlier in chat history");
                      }
                    }}
                    className={`mb-1.5 p-2 rounded-lg border-l-[3.5px] cursor-pointer transition-all hover:brightness-105 active:scale-[0.99] select-none flex items-center justify-between gap-2 overflow-hidden ${isDark
                      ? "bg-black/25 border-[#8b7ff5] text-[#d1d7db]"
                      : "bg-black/[0.05] border-[#7f66ff] text-zinc-900"
                      }`}
                    title="Click to jump to quoted message"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#8b7ff5] truncate">
                        {isRepliedSenderMe ? "You" : replySenderName}
                      </p>
                      <p className="text-xs opacity-75 truncate mt-0.5">
                        {replyPreviewText || "Message"}
                      </p>
                    </div>
                    {replyMsg.imageOrVideoUrl &&
                      ["image", "video", "sticker"].includes(replyMsg.contentType) && (
                        <img
                          src={replyMsg.imageOrVideoUrl}
                          alt="quote thumb"
                          className="w-8 h-8 rounded object-cover shrink-0 ml-2"
                        />
                      )}
                  </div>
                );
              })()}
              {message.statusId && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!onStatusClick || !message.statusId) return;
                    onStatusClick(message.statusId);
                  }}
                  className={`mb-2 w-full text-left overflow-hidden rounded-xl border-l-[3px] cursor-pointer transition-colors duration-150 hover:brightness-105 active:opacity-90 ${isDark
                    ? "bg-white/[0.04] border-purple-400"
                    : "bg-black/[0.03] border-purple-500"
                    }`}
                >
                  <div className="px-3 py-2">
                    <p
                      className={`text-sm font-semibold tracking-tight ${isDark ? "text-purple-300" : "text-purple-600"
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
                            className={`text-[11px] font-medium uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                          >
                            Text status
                          </span>
                        </div>

                        <p
                          className={`text-sm leading-snug line-clamp-2 ${isDark ? "text-white/90" : "text-gray-800"
                            }`}
                        >
                          {message.statusId?.content || "Text status"}
                        </p>
                      </div>
                    )}

                    {message.statusId?.contentType === "image" && (
                      <div
                        className={`mt-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                      >
                        <FaRegImage size={11} />
                        <span>Photo</span>
                      </div>
                    )}

                    {message.statusId?.contentType === "video" && (
                      <div
                        className={`mt-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                      >
                        <FaVideo size={11} />
                        <span>Video</span>
                      </div>
                    )}
                  </div>

                  {message.statusId?.contentType === "image" &&
                    message.statusId?.mediaUrl && (
                      <img
                        src={message.statusId.mediaUrl}
                        alt="Status"
                        className="w-full h-24 object-cover"
                      />
                    )}

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

              <div className="flex flex-col gap-1">
                {(message.contentType === "text" || !message.contentType) && !message.callData && (
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
                          className={`w-full resize-none rounded-xl border px-3 py-2 text-sm leading-relaxed outline-none transition-colors ${isDark
                            ? "border-white/10 bg-[#111b21] text-white focus:border-emerald-400"
                            : "border-black/10 bg-white text-black focus:border-emerald-500"
                            }`}
                        />

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              setEditText(displayContent || message.content || "");
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${isDark
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
                      <div className="text-[14.2px] leading-[19px] select-text">
                        {isWaitingDecryption ? (
                          <span className="inline-flex items-center gap-1.5 text-[13px] opacity-75 italic select-none py-0.5">
                            <FaLock className="shrink-0 text-xs opacity-70" />
                            <span>Waiting for this message. This may take a while.</span>
                          </span>
                        ) : isMetaAiMessage ? (
                          <div className="space-y-1">
                            <MetaAiMarkdown content={displayContent} theme={theme} />
                            <MetaAiFeedbackBar content={displayContent} theme={theme} />
                          </div>
                        ) : (
                          <span className="break-words whitespace-pre-wrap">
                            {searchTerm
                              ? safeHighlight(displayContent, searchTerm)
                              : displayContent}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 float-right translate-y-[3px] ml-2.5 select-none shrink-0 pointer-events-auto">
                          {renderTimestampAndStatus(false)}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {(message.contentType === "ai_image" || (isMetaAiMessage && message.imageOrVideoUrl)) && (
                  <div className="max-w-full">
                    <MetaAiImageCard
                      imageUrl={message.imageOrVideoUrl}
                      prompt={message.metaAiPrompt || message.content}
                      theme={theme}
                      onOpenViewer={(url) => {
                        setViewerModalFile({
                          url,
                          name: "meta-ai-image.jpg",
                          type: "image",
                          size: message.fileSize,
                          sender: message.sender,
                          createdAt: message.createdAt,
                          messageId: message._id,
                          isUserMessage: false,
                        });
                      }}
                    />
                    <div className="flex justify-end mt-1 select-none">
                      {renderTimestampAndStatus(false)}
                    </div>
                  </div>
                )}

                {message.contentType === "image" && !isMetaAiMessage && message.contentType !== "ai_image" && (
                  <div className="max-w-full">
                    <div
                      className="relative group/img cursor-pointer overflow-hidden rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        try {
                          const allMsgs = useChatStore.getState()?.messages || [];
                          const mediaMsgs = allMsgs
                            .filter(
                              (m) =>
                                m &&
                                m.imageOrVideoUrl &&
                                (m.contentType === "image" ||
                                  m.contentType === "video")
                            )
                            .map((m) => {
                              const sId = (m.sender?._id || m.sender?.id || m.sender)?.toString();
                              return {
                                _id: m._id,
                                messageId: m._id,
                                url: m.imageOrVideoUrl,
                                name:
                                  m.fileName ||
                                  (m.contentType === "video"
                                    ? "video.mp4"
                                    : "image.jpg"),
                                type:
                                  m.contentType === "video"
                                    ? "video/mp4"
                                    : "image/jpeg",
                                size: m.fileSize,
                                createdAt: m.createdAt,
                                sender: m.sender,
                                isUserMessage: Boolean(currentUserId && sId && sId === currentUserId),
                              };
                            });

                          let idx = mediaMsgs.findIndex(
                            (m) => String(m._id || m.messageId) === String(message._id)
                          );
                          if (idx === -1) {
                            mediaMsgs.push({
                              _id: message._id,
                              messageId: message._id,
                              url: message.imageOrVideoUrl,
                              name: message.fileName || "image.jpg",
                              type: "image/jpeg",
                              size: message.fileSize,
                              createdAt: message.createdAt,
                              sender: message.sender,
                              isUserMessage: isUserMessage,
                            });
                            idx = mediaMsgs.length - 1;
                          }

                          setViewerModalFile({
                            url: message.imageOrVideoUrl,
                            name: message.fileName || "image.jpg",
                            type: "image",
                            size: message.fileSize,
                            sender: message.sender,
                            createdAt: message.createdAt,
                            messageId: message._id,
                            isUserMessage: isUserMessage,
                            items: mediaMsgs.length > 0 ? mediaMsgs : undefined,
                            initialIndex: idx >= 0 ? idx : 0,
                          });
                        } catch (err) {
                          console.error("Error opening image viewer modal:", err);
                          setViewerModalFile({
                            url: message.imageOrVideoUrl,
                            name: message.fileName || "image.jpg",
                            type: "image",
                            size: message.fileSize,
                            sender: message.sender,
                            createdAt: message.createdAt,
                            messageId: message._id,
                            isUserMessage: isUserMessage,
                          });
                        }
                      }}
                      title="Click to view image"
                    >
                      <img
                        src={message.imageOrVideoUrl}
                        alt="img"
                        className="rounded-xl w-50 max-w-[200px] sm:max-w-xs md:max-w-sm object-cover ring-1 ring-black/[0.06] transition-transform hover:scale-[1.01]"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 rounded-xl flex items-center justify-center transition-opacity">
                        <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium flex items-center gap-1.5 shadow">
                          <FaEye size={12} /> View
                        </span>
                      </div>
                      {!message.content && renderTimestampAndStatus(true)}
                    </div>
                    {message.content && (
                      <div className="mt-1.5 text-[14.2px] leading-[19px] select-text">
                        {isWaitingDecryption ? (
                          <span className="inline-flex items-center gap-1.5 text-[13px] opacity-75 italic select-none py-0.5">
                            <FaLock className="shrink-0 text-xs opacity-70" />
                            <span>Waiting for this message. This may take a while.</span>
                          </span>
                        ) : (
                          <span className="break-words whitespace-pre-wrap">
                            {searchTerm
                              ? safeHighlight(displayContent || "", searchTerm)
                              : displayContent}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 float-right translate-y-[3px] ml-2.5 select-none shrink-0 pointer-events-auto">
                          {renderTimestampAndStatus(false)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {message.contentType === "video" && (
                  <div className="max-w-full">
                    <div className="relative rounded-xl overflow-hidden group/vid">
                      <video
                        src={message.imageOrVideoUrl}
                        controls
                        className="rounded-xl w-full max-w-[280px] sm:max-w-xs md:max-w-sm ring-1 ring-black/[0.06]"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          try {
                            const allMsgs = useChatStore.getState()?.messages || [];
                            const mediaMsgs = allMsgs
                              .filter(
                                (m) =>
                                  m &&
                                  m.imageOrVideoUrl &&
                                  (m.contentType === "image" ||
                                    m.contentType === "video")
                              )
                              .map((m) => {
                                const sId = (m.sender?._id || m.sender?.id || m.sender)?.toString();
                                return {
                                  _id: m._id,
                                  messageId: m._id,
                                  url: m.imageOrVideoUrl,
                                  name: m.fileName || (m.contentType === "video" ? "video.mp4" : "image.jpg"),
                                  type: m.contentType === "video" ? "video/mp4" : "image/jpeg",
                                  size: m.fileSize,
                                  createdAt: m.createdAt,
                                  sender: m.sender,
                                  isUserMessage: Boolean(currentUserId && sId && sId === currentUserId),
                                };
                              });

                            let idx = mediaMsgs.findIndex(
                              (m) => String(m._id || m.messageId) === String(message._id)
                            );
                            if (idx === -1) {
                              mediaMsgs.push({
                                _id: message._id,
                                messageId: message._id,
                                url: message.imageOrVideoUrl,
                                name: message.fileName || "video.mp4",
                                type: "video/mp4",
                                size: message.fileSize,
                                createdAt: message.createdAt,
                                sender: message.sender,
                                isUserMessage: isUserMessage,
                              });
                              idx = mediaMsgs.length - 1;
                            }

                            setViewerModalFile({
                              url: message.imageOrVideoUrl,
                              name: message.fileName || "video.mp4",
                              type: "video",
                              size: message.fileSize,
                              sender: message.sender,
                              createdAt: message.createdAt,
                              messageId: message._id,
                              isUserMessage: isUserMessage,
                              items: mediaMsgs.length > 0 ? mediaMsgs : undefined,
                              initialIndex: idx >= 0 ? idx : 0,
                            });
                          } catch (err) {
                            setViewerModalFile({
                              url: message.imageOrVideoUrl,
                              name: message.fileName || "video.mp4",
                              type: "video",
                              size: message.fileSize,
                              sender: message.sender,
                              createdAt: message.createdAt,
                              messageId: message._id,
                              isUserMessage: isUserMessage,
                            });
                          }
                        }}
                        className="absolute top-2 left-2 z-10 px-2 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white text-[11px] font-medium flex items-center gap-1 shadow opacity-0 group-hover/vid:opacity-100 transition-opacity cursor-pointer"
                        title="Open video in full viewer"
                      >
                        <FaEye size={12} /> Full view
                      </button>
                      {!message.content && (
                        <div className="absolute top-2 right-2 pointer-events-auto">
                          {renderTimestampAndStatus(true)}
                        </div>
                      )}
                    </div>
                    {message.content && (
                      <div className="mt-1.5 text-[14.2px] leading-[19px] select-text">
                        {isWaitingDecryption ? (
                          <span className="inline-flex items-center gap-1.5 text-[13px] opacity-75 italic select-none py-0.5">
                            <FaLock className="shrink-0 text-xs opacity-70" />
                            <span>Waiting for this message. This may take a while.</span>
                          </span>
                        ) : (
                          <span className="break-words whitespace-pre-wrap">
                            {displayContent}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 float-right translate-y-[3px] ml-2.5 select-none shrink-0 pointer-events-auto">
                          {renderTimestampAndStatus(false)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {message.contentType === "document" && (
                  <div className="flex flex-col gap-1 min-w-[230px] max-w-[320px]">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (message.imageOrVideoUrl) {
                          setViewerModalFile({
                            url: message.imageOrVideoUrl,
                            name: message.fileName || message.content || "document.pdf",
                            type: "document",
                            size: message.fileSize,
                          });
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none group/doc ${isDark
                        ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"
                        : "bg-black/[0.03] border-black/5 hover:bg-black/[0.06]"
                        }`}
                      title="Click to view or download"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover/doc:scale-105 transition-transform">
                        <FaFileAlt size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate leading-tight">
                          {message.fileName || message.content || "Document"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[11px] opacity-60">
                            {message.fileSize || "File"}
                          </p>
                          <span className="text-[11px] text-emerald-400 font-medium opacity-0 group-hover/doc:opacity-100 transition-opacity">
                            • View
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {message.imageOrVideoUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewerModalFile({
                                url: message.imageOrVideoUrl,
                                name: message.fileName || message.content || "document.pdf",
                                type: "document",
                                size: message.fileSize,
                              });
                            }}
                            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-emerald-400 transition-colors cursor-pointer"
                            title="View document"
                          >
                            <FaEye size={14} />
                          </button>
                        )}
                        {message.imageOrVideoUrl && (
                          <button
                            type="button"
                            disabled={downloading}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile(
                                e,
                                message.imageOrVideoUrl,
                                message.fileName || "document.pdf"
                              );
                            }}
                            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                            title="Download"
                          >
                            {downloading ? (
                              <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FaDownload size={13} className="opacity-80 hover:opacity-100 text-emerald-500" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    {message.content && message.content !== message.fileName && (
                      <p className="mt-1 break-words text-[14px] leading-relaxed">
                        {message.content}
                      </p>
                    )}
                    <div className="flex items-center justify-end mt-0.5 select-none">
                      {renderTimestampAndStatus(false)}
                    </div>
                  </div>
                )}

                {message.contentType === "audio" && (
                  <div className="flex flex-col gap-1 min-w-[240px] max-w-[320px] py-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FaHeadphones className="text-amber-500 shrink-0" size={14} />
                      <span className="text-xs font-medium opacity-75 truncate">
                        {message.fileName || "Voice / Audio message"}
                      </span>
                    </div>
                    <audio
                      src={message.imageOrVideoUrl}
                      controls
                      className="w-full h-9 rounded-lg"
                    />
                    <div className="flex items-center justify-end mt-0.5 select-none">
                      {renderTimestampAndStatus(false)}
                    </div>
                  </div>
                )}

                {message.contentType === "contact" && (() => {
                  const contactData = typeof message.contactData === "string"
                    ? (() => { try { return JSON.parse(message.contactData); } catch (e) { return {}; } })()
                    : (message.contactData || {});

                  const contactName = contactData?.name || (typeof message.content === "string" ? message.content.replace(/^Contact:\s*/, "") : "Contact");
                  const phone = contactData?.phoneNumber;
                  const email = contactData?.email;
                  const avatar = contactData?.avatar;

                  return (
                    <div className="min-w-[230px] max-w-[300px]">
                      <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? "bg-white/[0.05] border-white/10" : "bg-white/80 border-black/5 shadow-sm"}`}>
                        <div className="w-11 h-11 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center shrink-0 overflow-hidden font-bold">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt="Contact"
                              className="w-full h-full object-fill"
                            />
                          ) : (
                            <RiContactsFill size={24} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold truncate">
                            {contactName}
                          </p>
                          {phone && (
                            <p className="text-xs opacity-75 truncate font-mono">
                              {phone}
                            </p>
                          )}
                          {email && (
                            <p className="text-xs opacity-75 truncate">
                              {email}
                            </p>
                          )}
                          {!phone && !email && (
                            <p className="text-xs opacity-60 italic">
                              No number or email
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-end mt-1 px-1 select-none">
                        {renderTimestampAndStatus(false)}
                      </div>
                    </div>
                  );
                })()}

                {message.contentType === "poll" && (
                  <div className="flex flex-col w-[280px] xs:w-[305px] sm:w-[320px] max-w-full select-none">
                    <div className="flex items-center justify-between pb-1 -mt-0.5">
                      <span className="text-[13px] font-bold text-[#53bdeb] tracking-wide truncate uppercase">
                        {isUserMessage ? "YOU" : (message.sender?.username ? message.sender.username.toUpperCase() : "Name")}
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleOptions}
                        className={`p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${showOptions
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-[#8696a0] hover:text-gray-900 dark:hover:text-white"
                          }`}
                        title="Menu"
                      >
                        <FiChevronDown size={19} />
                      </button>
                    </div>
                    <h3 className={`font-bold text-[15px] leading-snug tracking-tight mb-1 ${isDark ? "text-white" : "text-gray-900"
                      }`}>
                      {message.pollData?.question || message.content}
                    </h3>
                    <div className={`flex items-center gap-1.5 text-[12px] font-normal mb-3 ${isDark ? "text-[#8696a0]" : "text-gray-500"
                      }`}>
                      {message.pollData?.isClosed ? (
                        <MdAccessTime size={13} className={`shrink-0 ${isDark ? "text-[#8696a0]" : "text-gray-500"}`} />
                      ) : message.pollData?.allowMultiple ? (
                        <FaCheckDouble size={12} className={`shrink-0 rounded-full ${isDark ? "text-[#8696a0]" : "text-gray-500"}`} />
                      ) : (
                        <FiCheck size={14} className={`shrink-0 ${isDark ? "text-[#8696a0]" : "text-gray-500"}`} />
                      )}
                      <span>
                        {message.pollData?.isClosed
                          ? "Poll ended"
                          : message.pollData?.allowMultiple
                            ? "Select one or more"
                            : "Select one"}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {message.pollData?.options?.map((option, idx) => {
                        const totalVotes =
                          message.pollData.options.reduce(
                            (sum, o) => sum + (o.votes?.length || 0),
                            0
                          ) || 0;
                        const optionVotes = option.votes?.length || 0;
                        const percentage =
                          totalVotes > 0
                            ? Math.round((optionVotes / totalVotes) * 100)
                            : 0;
                        const hasVoted = option.votes?.some((v) => {
                          const vId = (v?._id || v)?.toString();
                          return vId && currentUserId && vId === currentUserId;
                        });

                        return (
                          <div
                            key={idx}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              votePoll(message._id, idx);
                            }}
                            className="space-y-1.5 cursor-pointer group/opt select-none"
                          >
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {hasVoted ? (
                                  <span className="w-5 h-5 rounded-full bg-[#00a884] text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm">
                                    ✓
                                  </span>
                                ) : (
                                  <span className={`w-5 h-5 rounded-full border-2 shrink-0 ${isDark ? "border-[#8696a0]/80" : "border-gray-400"
                                    }`}></span>
                                )}
                                <span
                                  className={`text-[14.5px] leading-snug break-words ${hasVoted
                                    ? isDark ? "font-semibold text-white" : "font-semibold text-gray-900"
                                    : isDark ? "font-normal text-white/95" : "font-normal text-gray-800"
                                    }`}
                                >
                                  {option.text}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {option.votes && option.votes.length > 0 && (
                                  <div className="flex -space-x-1.5 items-center">
                                    {option.votes.slice(0, 3).map((voter, vIdx) => {
                                      const avatar = voter?.profilePicture;
                                      const name = voter?.username || "User";
                                      return avatar ? (
                                        <img
                                          key={vIdx}
                                          src={avatar}
                                          alt={name}
                                          className={`w-5 h-5 rounded-full border object-cover ${isDark ? "border-[#202c33]" : "border-gray-200"
                                            }`}
                                        />
                                      ) : (
                                        <div
                                          key={vIdx}
                                          className={`w-5 h-5 rounded-full border bg-[#7c3aed] text-[9px] text-white font-bold flex items-center justify-center ${isDark ? "border-[#202c33]" : "border-gray-200"
                                            }`}
                                        >
                                          {name.charAt(0).toUpperCase()}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                <span className={`text-[13px] font-normal tabular-nums ${isDark ? "text-[#8696a0]" : "text-gray-500"
                                  }`}>
                                  {optionVotes}
                                </span>
                              </div>
                            </div>

                            <div className={`w-full h-[6px] rounded-full overflow-hidden ${isDark ? "bg-[#2a3942]" : "bg-black/10"
                              }`}>
                              <div
                                className="h-full bg-[#00a884] rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-end mt-2 mb-0.5 px-1 select-none">
                      {renderTimestampAndStatus(false)}
                    </div>
                    <div className={`border-t -mx-3 -mb-2.5 mt-2 rounded-b-2xl overflow-hidden ${isDark ? "border-[#2a3942]" : "border-black/10"
                      }`}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPollDetails(message);
                        }}
                        title="View poll votes"
                        className={`w-full py-2 text-center text-[14px] font-semibold text-emerald-500 hover:text-emerald-400 active:scale-98 transition-all cursor-pointer ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                          }`}
                      >
                        View votes
                      </button>
                    </div>
                  </div>
                )}

                {message.contentType === "event" && (() => {
                  const goingCount = message.eventData?.responses?.length
                    ? message.eventData.responses.filter((r) => r.status === "going" || r.status === "yes").length || message.eventData.responses.length
                    : 2;
                  const senderAvatar = isUserMessage
                    ? (effectiveUser?.profilePic || effectiveUser?.avatar)
                    : (message?.sender?.profilePic || message?.sender?.avatar);
                  const senderDisplayName = message?.sender?.name || effectiveUser?.name || "U";

                  return (
                    <div className="flex flex-col min-w-[260px] max-w-[310px] w-full select-none">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${isDark
                            ? "bg-[#143d2e] text-[#25d366]"
                            : "bg-emerald-600/15 text-emerald-700"
                            }`}
                        >
                          <MdEventNote size={24} />
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                          <h4
                            className={`text-[16px] font-bold leading-tight break-words ${message.eventData?.isCancelled
                              ? "line-through opacity-60"
                              : ""
                              }`}
                          >
                            {message.eventData?.title || message.content}
                          </h4>

                          <p
                            className={`text-[13px] font-normal mt-1 ${isDark ? "text-white/75" : "text-gray-700"
                              }`}
                          >
                            {formatEventSchedule(message.eventData)}
                          </p>

                          {message.eventData?.description && (
                            <p
                              className={`text-[14px] font-normal mt-1 break-words ${isDark ? "text-white/90" : "text-gray-800"
                                }`}
                            >
                              {message.eventData.description}
                            </p>
                          )}

                          {message.eventData?.hasCallLink && (
                            <p
                              className={`text-[13px] font-normal mt-1 ${isDark ? "text-white/75" : "text-gray-700"
                                }`}
                            >
                              WhatsApp video call
                            </p>
                          )}

                          {message.eventData?.location && (
                            <div className="flex items-center gap-1 text-[13px] opacity-75 mt-1">
                              <MdLocationOn size={14} className="text-red-400 shrink-0" />
                              <span className="truncate">{message.eventData.location}</span>
                            </div>
                          )}

                          {message.eventData?.isCancelled && (
                            <span className="mt-1.5 inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                              Event cancelled
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 text-[12px]">
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-1.5 items-center">
                            {senderAvatar ? (
                              <img
                                src={senderAvatar}
                                alt=""
                                className={`w-5 h-5 rounded-full object-cover border ${isDark ? "border-[#005c4b]" : "border-[#d9fdd3]"
                                  }`}
                              />
                            ) : (
                              <div
                                className={`w-5 h-5 rounded-full bg-emerald-700 border flex items-center justify-center text-[9px] text-white ${isDark ? "border-[#005c4b]" : "border-[#d9fdd3]"
                                  }`}
                              >
                                {senderDisplayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div
                              className={`w-5 h-5 rounded-full bg-[#7a3b2e] border flex items-center justify-center text-white ${isDark ? "border-[#005c4b]" : "border-[#d9fdd3]"
                                }`}
                            >
                              <RiContactsFill size={10} />
                            </div>
                          </div>
                          <span
                            className={`font-normal text-[13px] ${isDark ? "text-white/70" : "text-gray-600"
                              }`}
                          >
                            {goingCount} going
                          </span>
                        </div>

                        <div
                          className={`flex items-center gap-1 text-[11px] ${isDark ? "text-white/60" : "text-gray-500"
                            }`}
                        >
                          {renderTimestampAndStatus(false)}
                        </div>
                      </div>

                      <div
                        className={`border-t -mx-[9px] -mb-[7px] mt-2.5 rounded-b-[7.5px] overflow-hidden ${isDark ? "border-white/10" : "border-black/10"
                          }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditEvent) {
                              onEditEvent(message);
                            }
                          }}
                          title="Edit or cancel event"
                          className={`w-full py-2.5 text-center text-[15px] font-medium text-[#00a884] dark:text-[#25d366] hover:bg-black/5 dark:hover:bg-white/5 active:scale-98 transition-all cursor-pointer`}
                        >
                          Edit event
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {message.contentType === "sticker" && (
                  <div className="relative p-1">
                    <img
                      src={message.imageOrVideoUrl}
                      alt="Sticker"
                      className="w-36 h-36 object-contain select-none filter drop-shadow-md transition-transform hover:scale-105"
                    />
                    <div className="flex items-center justify-end mt-0.5 select-none">
                      {renderTimestampAndStatus(false)}
                    </div>
                  </div>
                )}

                {(message.contentType === "call_link" ||
                  Boolean(message.callLinkData) ||
                  (typeof message.content === "string" &&
                    message.content.includes("call.whatsapp.com"))) &&
                  (() => {
                    const linkData =
                      typeof message.callLinkData === "string"
                        ? (() => {
                          try {
                            return JSON.parse(message.callLinkData);
                          } catch (e) {
                            return {};
                          }
                        })()
                        : message.callLinkData || {};

                    const rawUrl =
                      linkData?.url ||
                      (typeof message.content === "string" &&
                        message.content.includes("call.whatsapp.com")
                        ? message.content.match(
                          /https?:\/\/call\.whatsapp\.com\/[^\s]+/i
                        )?.[0] || message.content
                        : "") ||
                      `https://call.whatsapp.com/video/SUH50LINK`;

                    const isVideo =
                      linkData?.callType === "video" ||
                      rawUrl.includes("/video/");
                    const callType = isVideo ? "video" : "voice";

                    const peer = isUserMessage
                      ? message.receiver || selectedContact
                      : message.sender || selectedContact;
                    const peerId = (peer?._id || peer?.id || peer)?.toString();
                    const peerName = peer?.username || peer?.name || "Contact";
                    const peerAvatar =
                      peer?.profilePicture || peer?.avatar || "";

                    const handleCopyCallUrl = (e) => {
                      e.stopPropagation();
                      navigator.clipboard?.writeText(rawUrl);
                      toast.success("Call link copied to clipboard");
                    };

                    const handleJoinCallLink = (e) => {
                      e.stopPropagation();
                      try {
                        const { initiateCall } = useVideoCallStore.getState();
                        if (typeof initiateCall === "function") {
                          initiateCall(
                            peerId || `link-${Date.now()}`,
                            peerName,
                            peerAvatar,
                            callType === "video" ? "video" : "audio"
                          );
                        } else {
                          toast.success("Connecting to WhatsApp call link...");
                        }
                      } catch (err) {
                        console.warn("Failed to join call link:", err);
                        toast.error("Could not join call");
                      }
                    };

                    return (
                      <div className="flex flex-col min-w-[260px] xs:min-w-[280px] max-w-[340px] select-none">
                        <div className="flex items-start gap-3 p-1">
                          <div className="w-11 h-11 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0 shadow-md">
                            <MdLink className="text-2xl transform -rotate-45" />
                          </div>

                          <div className="min-w-0 flex-1 pt-0.5">
                            <h4
                              className={`text-[15.5px] font-semibold leading-tight tracking-normal truncate ${isDark ? "text-white" : "text-[#111b21]"
                                }`}
                            >
                              {isVideo
                                ? "WhatsApp Video Call Link"
                                : "WhatsApp Voice Call Link"}
                            </h4>
                            <p
                              className={`text-[12.5px] leading-snug mt-1 ${isDark ? "text-[#8696a0]" : "text-[#667781]"
                                }`}
                            >
                              Use this link to join my WhatsApp{" "}
                              {isVideo ? "video" : "voice"} call.
                            </p>
                          </div>
                        </div>

                        <div
                          onClick={handleCopyCallUrl}
                          className={`mt-2 px-3 py-2 rounded-xl flex items-center justify-between gap-2 border transition-all cursor-pointer group ${isUserMessage
                              ? isDark
                                ? "bg-black/20 hover:bg-black/30 border-white/5"
                                : "bg-black/[0.04] hover:bg-black/[0.07] border-black/5"
                              : isDark
                                ? "bg-white/[0.06] hover:bg-white/[0.09] border-white/5"
                                : "bg-black/[0.04] hover:bg-black/[0.07] border-black/5"
                            }`}
                          title="Click to copy link"
                        >
                          <span className="text-[13px] font-mono text-[#00a884] dark:text-[#25d366] font-medium truncate select-all">
                            {rawUrl}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyCallUrl}
                            className="p-1 rounded-md text-[#8696a0] group-hover:text-[#00a884] transition-colors shrink-0 cursor-pointer"
                            title="Copy link"
                          >
                            <MdContentCopy size={15} />
                          </button>
                        </div>

                        <div className="mt-2.5">
                          <button
                            type="button"
                            onClick={handleJoinCallLink}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#00a884] hover:bg-[#029676] active:scale-[0.99] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                            title={`Join ${isVideo ? "video" : "voice"} call now`}
                          >
                            {isVideo ? (
                              <MdVideocam className="text-lg" />
                            ) : (
                              <MdCall className="text-base" />
                            )}
                            <span>Join call</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 dark:border-white/5 px-0.5">
                          <div className="flex items-center gap-1 text-[11px] text-[#8696a0]">
                            <FaLock size={9} className="opacity-75" />
                            <span>End-to-end encrypted</span>
                          </div>
                          <div className="flex items-center select-none pointer-events-auto">
                            {renderTimestampAndStatus(false)}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {(message.contentType === "call" || Boolean(message.callData)) && (() => {
                  const callData =
                    typeof message.callData === "string"
                      ? (() => {
                        try {
                          return JSON.parse(message.callData);
                        } catch (e) {
                          return {};
                        }
                      })()
                      : message.callData || {};

                  const callType =
                    callData?.callType ||
                    message.callType ||
                    (message.content?.toLowerCase()?.includes("video") ? "video" : "audio");
                  const isVideo = callType === "video";

                  const rawDuration =
                    callData?.duration ||
                    message.duration ||
                    (message.content?.match(/(\d+\s*(seconds?|minutes?|secs?|mins?))/i)?.[0]) ||
                    "28 seconds";

                  const status =
                    callData?.status ||
                    message.status ||
                    (rawDuration.toLowerCase().includes("missed")
                      ? "missed"
                      : rawDuration.toLowerCase().includes("declined")
                        ? "declined"
                        : "completed");

                  const direction =
                    callData?.direction ||
                    message.direction ||
                    (isUserMessage ? "outgoing" : "incoming");

                  const isMissed =
                    !isUserMessage &&
                    (status === "missed" ||
                      direction === "missed" ||
                      rawDuration.toLowerCase().includes("missed"));

                  const isCallerNoAnswer =
                    isUserMessage &&
                    (status === "missed" ||
                      direction === "missed" ||
                      rawDuration.toLowerCase().includes("missed"));

                  const isDeclined =
                    status === "declined" || direction === "declined";

                  let title = isVideo ? "Video call" : "Voice call";
                  if (isMissed) {
                    title = isVideo ? "Missed video call" : "Missed voice call";
                  }

                  let durationText = rawDuration;
                  if (isMissed) {
                    durationText = "Missed";
                  } else if (isCallerNoAnswer) {
                    durationText = "No answer";
                  } else if (isDeclined) {
                    durationText = "Declined";
                  }

                  const peer = isUserMessage
                    ? message.receiver || selectedContact
                    : message.sender || selectedContact;
                  const peerId = (peer?._id || peer?.id || peer)?.toString();
                  const peerName = peer?.username || peer?.name || "Contact";
                  const peerAvatar = peer?.profilePicture || peer?.avatar || "";

                  const handleCallBack = (e) => {
                    e.stopPropagation();
                    try {
                      const { initiateCall } = useVideoCallStore.getState();
                      if (peerId && typeof initiateCall === "function") {
                        initiateCall(
                          peerId,
                          peerName,
                          peerAvatar,
                          isVideo ? "video" : "audio"
                        );
                      }
                    } catch (err) {
                      console.warn("Failed to initiate redial:", err);
                    }
                  };

                  return (
                    <div className="flex flex-col min-w-[240px] xs:min-w-[260px] max-w-[310px] select-none">
                      <div
                        onClick={handleCallBack}
                        className={`flex items-start justify-between gap-3 p-2.5 rounded-xl transition-all cursor-pointer group/callcard ${isUserMessage
                            ? isDark
                              ? "bg-black/15 hover:bg-black/25"
                              : "bg-black/[0.04] hover:bg-black/[0.07]"
                            : isDark
                              ? "bg-white/[0.06] hover:bg-white/[0.09]"
                              : "bg-black/[0.04] hover:bg-black/[0.07]"
                          }`}
                        title={`Click to call ${peerName || "contact"}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover/callcard:scale-105 ${isMissed
                                ? isDark
                                  ? "bg-[#ea0038]/20"
                                  : "bg-[#fde8ec]"
                                : isUserMessage
                                  ? isDark
                                    ? "bg-white/10"
                                    : "bg-[#c2ecc3]"
                                  : isDark
                                    ? "bg-[#182229]"
                                    : "bg-black/10"
                              }`}
                          >
                            {isVideo ? (
                              isMissed ? (
                                <div className="relative flex items-center justify-center">
                                  <MdOutlineVideocam size={22} className="text-[#ea0038]" />
                                </div>
                              ) : isUserMessage ? (
                                <div className="relative flex items-center justify-center">
                                  <VideoCallOutgoingIcon
                                    size={22}
                                    color={isDark ? "white" : "#111b21"}
                                  />
                                </div>
                              ) : (
                                <div className="relative flex items-center justify-center">
                                  <VideoCallIncomingIcon
                                    size={22}
                                    color={isDark ? "white" : "#111b21"}
                                  />
                                </div>
                              )
                            ) : isMissed ? (
                              <div className="relative flex items-center justify-center">
                                <MdCallMissed size={22} className="text-[#ea0038]" />
                              </div>
                            ) : !isUserMessage ? (
                              <div className="relative flex items-center justify-center">
                                <MdCallReceived
                                  size={20}
                                  className={isDark ? "text-white" : "text-[#111b21]"}
                                />
                              </div>
                            ) : (
                              <div className="relative flex items-center justify-center">
                                <CallOutgoingIcon
                                  size={22}
                                  color={isDark ? "white" : "#111b21"}
                                />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 pt-0.5">
                            <h4
                              className={`text-[15.5px] font-semibold leading-tight tracking-normal truncate ${isMissed
                                  ? "text-[#ea0038]"
                                  : isDark
                                    ? "text-white"
                                    : "text-[#111b21]"
                                }`}
                            >
                              {title}
                            </h4>
                            <p
                              className={`text-[13px] font-normal mt-1 leading-tight truncate ${isMissed
                                  ? "text-[#ea0038] font-medium"
                                  : isDark
                                    ? "text-[#8696a0]"
                                    : "text-[#667781]"
                                }`}
                            >
                              {durationText}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleToggleOptions}
                          className="p-1 -mr-1 -mt-0.5 text-[#8696a0] hover:text-white dark:hover:text-white transition-colors cursor-pointer shrink-0 opacity-80 hover:opacity-100"
                          title="Message options"
                        >
                          <FiChevronDown size={17} />
                        </button>
                      </div>

                      <div className="flex items-center justify-end mt-1 px-1 select-none pointer-events-auto">
                        {renderTimestampAndStatus(false)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {!isDeletedForEveryone && (
            <div
              className={`absolute ${isUserMessage ? "-left-8" : "-right-8"
                } top-1/2 -translate-y-1/2 flex flex-col items-center z-10`}
            >
              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    ref={reactionsMenuRef}
                    initial={{ opacity: 0, scale: 0.85, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 6 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className={`absolute bottom-full mb-2 flex items-center rounded-full px-2 py-1.5 gap-0.5 shadow-xl border z-50 ${isDark
                      ? "bg-[#233138]/95 border-white/10 backdrop-blur-md"
                      : "bg-white/95 border-black/[0.06] backdrop-blur-md"
                      }`}
                  >
                    {quickReactions.map((emoji, index) => {
                      const isSelected = (message.reactions || []).some(
                        (r) =>
                          String(r.userId?._id || r.userId) === String(currentUserId) &&
                          r.emoji === emoji
                      );
                      return (
                        <button
                          key={index}
                          onClick={() => handleReact(emoji)}
                          className={`text-lg hover:scale-125 transition-transform duration-150 p-1.5 rounded-full cursor-pointer ${isSelected
                            ? "bg-emerald-500/25 ring-1 ring-emerald-500 scale-110"
                            : "hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                            }`}
                          title={isSelected ? "Click to remove" : `React ${emoji}`}
                        >
                          {emoji}
                        </button>
                      );
                    })}

                    <div
                      className={`w-px h-5 mx-1 ${isDark ? "bg-white/15" : "bg-black/10"
                        }`}
                    />

                    <button
                      className={`rounded-full p-1.5 cursor-pointer transition-colors ${isDark
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
                        className={`absolute top-2 right-2 rounded-full p-1.5 shadow-md transition-colors ${isDark
                          ? "bg-[#202c33] text-gray-300 hover:bg-[#2a3942]"
                          : "bg-white text-gray-600 hover:bg-gray-100"
                          }`}
                      >
                        <RxCross2 className="cursor-pointer" size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReactions((prev) => !prev);
                }}
                className={`w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${showReactions
                  ? "opacity-100 bg-black/10 dark:bg-white/10"
                  : "opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                title="React"
              >
                <BsEmojiSmile
                  size={16}
                  className={isDark ? "text-[#8696a0] hover:text-[#e9edef]" : "text-[#54656f] hover:text-[#111b21]"}
                />
              </button>
            </div>
          )}

          {!isDeletedForEveryone && validReactions.length > 0 && (
            <button
              ref={reactionBadgeRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowReactionDetails(true);
              }}
              title="View reactions"
              className={`absolute -bottom-2.5 z-20 flex items-center px-1.5 py-0.5 rounded-full border transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer select-none ${isUserMessage ? "right-2" : "left-2"
                } ${isDark
                  ? "bg-[#202c33] border-[#222e35] shadow-[0_1px_3px_rgba(0,0,0,0.45)] hover:bg-[#26343d]"
                  : "bg-white border-[#e9edef] shadow-[0_1px_3px_rgba(11,20,26,0.18)] hover:bg-[#f5f6f6]"
                }`}
            >
              <div className="flex items-center -space-x-0.5">
                {uniqueReactions.slice(0, 3).map((emoji, index) => (
                  <span
                    key={index}
                    className="text-[13px] leading-none select-none inline-block"
                  >
                    {emoji}
                  </span>
                ))}
              </div>
              {validReactions.length > 1 && (
                <span className="text-[11px] font-medium leading-none ml-1 tabular-nums text-[#667781] dark:text-[#8696a0]">
                  {validReactions.length}
                </span>
              )}
            </button>
          )}

          {typeof document !== "undefined" &&
            createPortal(
              <AnimatePresence>
                {showOptions && menuCoords && (
                  <>
                    <div
                      className="fixed inset-0 z-[9998] bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOptions(false);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowOptions(false);
                      }}
                    />

                    <motion.div
                      ref={optionRef}
                      initial={{ opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.88 }}
                      transition={{ duration: 0.12, ease: "easeOut" }}
                      style={{
                        position: "fixed",
                        top: `${menuCoords.top}px`,
                        left: `${menuCoords.left}px`,
                        transformOrigin: menuCoords.transformOrigin || "top right",
                      }}
                      className={`z-[9999] min-w-[220px] max-w-[260px] max-h-[min(520px,calc(100vh-24px))] overflow-y-auto scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1.5 rounded-xl shadow-2xl border select-none ${isDark
                        ? "bg-[#233138] border-white/10 text-[#d1d7db] shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
                        : "bg-white border-black/10 text-[#111b21] shadow-[0_10px_35px_rgba(11,20,26,0.18)]"
                        }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageMenu
                        message={message}
                        isUserMessage={isUserMessage}
                        isDark={isDark}
                        isPinned={isPinned}
                        isStarred={isStarred}
                        isDeletedForEveryone={isDeletedForEveryone}
                        conversationId={conversationId}
                        secondaryConvId={secondaryConvId}
                        onReply={onReply}
                        setShowOptions={setShowOptions}
                        setSelectedMessageInfo={setSelectedMessageInfo}
                        setShowReactions={setShowReactions}
                        setShowForwardModal={setShowForwardModal}
                        setShowPinModal={setShowPinModal}
                        setEditText={setEditText}
                        setIsEditing={setIsEditing}
                        handleDownloadFile={handleDownloadFile}
                        setShowReportModal={setShowReportModal}
                        setDeleteModal={setDeleteModal}
                        onEnterSelectMode={onEnterSelectMode}
                        isMetaAi={isMetaAi}
                      />

                    </motion.div>
                  </>
                )}
              </AnimatePresence>,
              document.body
            )}

          {typeof document !== "undefined" &&
            createPortal(
              <AnimatePresence>
                {deleteModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`fixed inset-0 z-[10000] flex items-center justify-center px-4 backdrop-blur-xl ${isDark ? "bg-black/70" : "bg-black/30"
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModal(null);
                    }}
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
                      className={`relative w-full max-w-sm overflow-hidden rounded-[28px] border p-6 shadow-2xl backdrop-blur-2xl ${isDark
                        ? "border-white/[0.08] bg-gradient-to-br from-[#202c33]/95 via-[#111b21]/95 to-[#0b141a]/95 shadow-black/50"
                        : "border-white/70 bg-gradient-to-br from-white/95 via-white/90 to-zinc-100/95 shadow-black/10"
                        }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl ${isDark ? "bg-red-500/10" : "bg-red-400/10"
                          }`}
                      />

                      <div
                        className={`pointer-events-none absolute left-8 right-8 top-0 h-px ${isDark
                          ? "bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          : "bg-gradient-to-r from-transparent via-black/10 to-transparent"
                          }`}
                      />

                      <button
                        type="button"
                        aria-label="Close"
                        title="Close"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDeleteModal(null);
                        }}
                        className={`absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 cursor-pointer ${isDark
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
                          className={`relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg ${isDark
                            ? "border-red-400/10 bg-gradient-to-br from-red-500/20 to-red-600/5 text-red-400 shadow-red-500/10"
                            : "border-red-500/10 bg-gradient-to-br from-red-500/10 to-red-500/5 text-red-500 shadow-red-500/10"
                            }`}
                        >
                          <RiDeleteBin6Line size={27} />
                          <div
                            className={`absolute inset-0 -z-10 rounded-2xl blur-xl ${isDark ? "bg-red-500/20" : "bg-red-500/10"
                              }`}
                          />
                        </motion.div>
                        <h2
                          className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-zinc-900"
                            }`}
                        >
                          Delete message?
                        </h2>
                        <p
                          className={`mt-2 max-w-[290px] text-sm leading-6 ${isDark ? "text-zinc-400" : "text-zinc-500"
                            }`}
                        >
                          Choose how you want to delete this message. This action
                          cannot be undone.
                        </p>
                      </div>

                      <div className="relative mt-7 flex flex-col gap-3">
                        {isUserMessage &&
                          !deleteModal?.deletedForEveryone &&
                          deleteModal?.content !== "This message was deleted" &&
                          deleteModal?.content !== "You deleted this message" && (
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.97 }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await deleteMessage(deleteModal._id, "everyone");

                                  toast.success("Message deleted for everyone");
                                } catch (error) {
                                  toast.error("Failed to delete message");
                                } finally {
                                  setDeleteModal(null);
                                }
                              }}
                              className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 font-semibold transition-all duration-300 cursor-pointer ${isDark
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

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await deleteMessage(deleteModal._id, "me");

                              toast.success("Message deleted for me");
                            } catch (error) {
                              toast.error("Failed to delete message");
                            } finally {
                              setDeleteModal(null);
                            }
                          }}
                          className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 font-semibold transition-all duration-300 cursor-pointer ${isDark
                            ? "border-white/[0.08] bg-gradient-to-r from-zinc-800/90 to-zinc-900/90 text-zinc-100 shadow-lg shadow-black/10 hover:border-emerald-400/20 hover:from-zinc-700/90 hover:to-zinc-800/90 hover:text-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5"
                            : "border-black/[0.06] bg-gradient-to-r from-zinc-100 to-white text-zinc-800 shadow-md shadow-black/5 hover:border-emerald-500/20 hover:from-emerald-50 hover:to-white hover:text-emerald-700 hover:shadow-lg"
                            }`}
                        >
                          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                          <span className="relative z-10 flex items-center justify-center gap-2.5">
                            <RiDeleteBin6Line
                              size={17}
                              className="transition-transform duration-300 group-hover:scale-110"
                            />

                            <span>Delete for me</span>
                          </span>
                        </motion.button>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal(null);
                          }}
                          className={`mt-1 w-full rounded-2xl border py-3 text-sm font-medium transition-all duration-300 cursor-pointer ${isDark
                            ? "border-transparent text-zinc-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"
                            : "border-transparent text-zinc-500 hover:border-black/[0.05] hover:bg-black/[0.03] hover:text-zinc-900"
                            }`}
                        >
                          Cancel
                        </motion.button>
                      </div>

                      <div
                        className={`mt-5 text-center text-[11px] ${isDark ? "text-zinc-600" : "text-zinc-400"
                          }`}
                      >
                        Deleted messages cannot be recovered
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body
            )}

          <ReactionDetailsModal
            isOpen={showReactionDetails && validReactions.length > 0}
            onClose={() => setShowReactionDetails(false)}
            message={message}
            currentUser={effectiveUser}
            onRemoveReaction={(id) => {
              if (removeReaction) {
                removeReaction(id);
              } else {
                onReact(id, null);
              }
            }}
            onReact={onReact}
            isDark={isDark}
            anchorRef={reactionBadgeRef}
            bubbleRef={bubbleRef}
            isUserMessage={isUserMessage}
          />

          {viewerModalFile && (
            <FileViewerModal
              isOpen={Boolean(viewerModalFile)}
              onClose={() => setViewerModalFile(null)}
              file={viewerModalFile}
              items={viewerModalFile.items}
              initialIndex={viewerModalFile.initialIndex || 0}
              theme={theme}
            />
          )}

          <ForwardModal
            isOpen={showForwardModal}
            onClose={() => setShowForwardModal(false)}
            message={message}
            theme={theme}
          />

          <PinDurationModal
            isOpen={showPinModal}
            onClose={() => setShowPinModal(false)}
            onPin={(duration) => {
              const recId =
                (layoutSelectedContact?._id ||
                  (message.sender?._id?.toString() === currentUserId
                    ? message.receiver?._id || message.receiver
                    : message.sender?._id || message.sender))?.toString();
              pinMessage(
                conversationId,
                message,
                duration,
                secondaryConvId,
                recId,
                true,
                currentUserId,
              );
              toast.success(`Message pinned for ${duration}`);
            }}
            message={message}
            theme={theme}
          />

          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            onReport={({ block }) => {
              if (block) {
                toast.success("Reported and blocked successfully");
              } else {
                toast.success("Report sent to WhatsApp");
              }
            }}
            contactName={
              message?.sender?.name ||
              layoutSelectedContact?.name ||
              "this person"
            }
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
};

export default MessageBuble;
