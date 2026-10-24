import React, { useRef, useState, useMemo, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { FaLock } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import useOutsideClick from "../../hook/useOutsideClick";
import { toast } from "react-toastify";
import { useChatStore, decryptSingleMessage } from "../../store/chatStore";
import { getSocket } from "../../services/chatService";
import { getOrCreateUserKeyPair } from "../../utils/cryptoUtils";
import useUserStore from "../../store/useUserStore";
import useLayoutStore from "../../store/layoutStore";
import { getDisappearingDurationMs } from "../../utils/formatTime";
import ReactionDetailsModal from "../../components/modals/ReactionDetailsModal";
import FileViewerModal from "../../components/modals/FileViewerModal";
import ForwardModal from "../../components/modals/ForwardModal";
import PinDurationModal from "../../components/modals/PinDurationModal";
import ReportModal from "../../components/modals/ReportModal";
import MessageMenu from "./MessageMenu";
import { MetaAiRing, META_AI_USER_ID } from "../../components/common/MetaAiIcon";
import {
  MetaAiMarkdown,
  MetaAiFeedbackBar,
  MetaAiImageCard,
  MetaAiThumbnailGallery,
  MetaAiQuickFollowups,
} from "../../components/common/MetaAiContent";
import {
  WhatsAppPinIcon,
  WhatsAppUnpinIcon,
  WhatsAppDisappearingIcon,
  TailOutIcon,
  TailInIcon,
  ProhibitedIcon,
  MessageCheckIcon,
} from "../../components/common/Icons";
import {
  MessageTimestampAndStatus,
  MessageReplyQuote,
  MessageReactionsHoverPicker,
  MessageReactionBadge,
  MessageImageContent,
  MessageVideoContent,
  MessageStickerContent,
  MessageAudioContent,
  MessageDocumentContent,
  MessageContactContent,
  MessagePollContent,
  MessageEventContent,
  MessageCallLinkContent,
  MessageCallHistoryContent,
  MessageDeleteModal,
} from "./messageBubble/index.js";

export {
  WhatsAppPinIcon,
  WhatsAppUnpinIcon,
  WhatsAppDisappearingIcon,
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
  onEdit,
  onEditEvent,
  isFirstInSequence = true,
  onReply,
  selectedContact,
  isGroupChat: propIsGroupChat,
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
  const isMessageStarred = useChatStore((state) => state.isMessageStarred);
  const layoutSelectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedPollDetails = useLayoutStore((state) => state.setSelectedPollDetails);
  const setSelectedMessageInfo = useLayoutStore((state) => state.setSelectedMessageInfo);
  const setShowContactInfo = useLayoutStore((state) => state.setShowContactInfo);
  const openContactInfoWithMember = useLayoutStore((state) => state.openContactInfoWithMember);
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
  const isMetaAi = Boolean(isMetaAiMessage || isMetaAiChat);
  const isDark = theme === "dark";

  const activeContact = selectedContact || layoutSelectedContact;
  const conversationObj =
    activeContact?.conversation ||
    currentConversation ||
    (typeof message.conversation === "object" ? message.conversation : null);

  const isGroupChat = Boolean(
    propIsGroupChat ?? (
      activeContact?.isGroup ||
      activeContact?.isGroupChat ||
      conversationObj?.isGroup ||
      message?.isGroup ||
      message?.conversation?.isGroup ||
      (typeof activeContact?.groupName === "string" &&
        activeContact.groupName.trim() !== "" &&
        activeContact.groupName !== activeContact?.username) ||
      (typeof conversationObj?.groupName === "string" &&
        conversationObj.groupName.trim() !== "") ||
      (Array.isArray(activeContact?.groupAdmin) &&
        activeContact.groupAdmin.length > 0) ||
      (Array.isArray(conversationObj?.groupAdmin) &&
        conversationObj.groupAdmin.length > 0) ||
      (Array.isArray(activeContact?.participants) &&
        activeContact.participants.length > 2) ||
      (Array.isArray(conversationObj?.participants) &&
        conversationObj.participants.length > 2)
    )
  );

  const senderDisplayName = useMemo(() => {
    if (message?.sender?.username) return message.sender.username;
    if (message?.sender?.name) return message.sender.name;

    const rawParticipants =
      activeContact?.participants ||
      activeContact?.conversation?.participants ||
      conversationObj?.participants ||
      [];
    if (Array.isArray(rawParticipants)) {
      const found = rawParticipants.find(
        (p) => (p?._id || p?.id || p)?.toString() === senderId
      );
      if (found?.username) return found.username;
      if (found?.name) return found.name;
      if (found?.phoneNumber) return found.phoneNumber;
    }

    const allChatUsers = useChatStore.getState()?.users || [];
    if (Array.isArray(allChatUsers)) {
      const foundUser = allChatUsers.find(
        (u) => (u?._id || u?.id)?.toString() === senderId
      );
      if (foundUser?.username) return foundUser.username;
      if (foundUser?.name) return foundUser.name;
      if (foundUser?.phoneNumber) return foundUser.phoneNumber;
    }

    return message?.sender?.phoneNumber || "Participant";
  }, [message?.sender, senderId, activeContact, conversationObj]);

  const senderAvatar = useMemo(() => {
    if (message?.sender?.profilePicture) return message.sender.profilePicture;
    if (message?.sender?.profilePic) return message.sender.profilePic;
    if (message?.sender?.avatar) return message.sender.avatar;

    const rawParticipants =
      activeContact?.participants ||
      activeContact?.conversation?.participants ||
      conversationObj?.participants ||
      [];
    if (Array.isArray(rawParticipants)) {
      const found = rawParticipants.find(
        (p) => (p?._id || p?.id || p)?.toString() === senderId
      );
      if (found?.profilePicture) return found.profilePicture;
      if (found?.profilePic) return found.profilePic;
      if (found?.avatar) return found.avatar;
    }
    return null;
  }, [message?.sender, senderId, activeContact, conversationObj]);

  const senderColor = useMemo(() => {
    const colors = [
      "#25d366", "#53bdeb", "#e542a3", "#f39c12",
      "#9c27b0", "#00bcd4", "#ff7043", "#8bc34a",
      "#ba68c8", "#20c997", "#e91e63", "#d97706",
    ];
    const key = senderId || senderDisplayName || "user";
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, [senderId, senderDisplayName]);

  const isSenderAdmin = useMemo(() => {
    if (!isGroupChat || !senderId) return false;
    const admins =
      activeContact?.groupAdmin ||
      activeContact?.conversation?.groupAdmin ||
      conversationObj?.groupAdmin ||
      [];
    if (!Array.isArray(admins)) return false;
    return admins.some(
      (a) => (a?._id || a?.id || a)?.toString() === senderId
    );
  }, [isGroupChat, senderId, activeContact, conversationObj]);

  const senderTag = useMemo(() => {
    if (!isGroupChat || isUserMessage || !senderId) return "";
    const rawTags =
      activeContact?.memberTags ||
      activeContact?.conversation?.memberTags ||
      conversationObj?.memberTags ||
      [];
    if (Array.isArray(rawTags)) {
      const sIdStr = senderId.toString();
      const found = rawTags.find(
        (mt) => (mt.user?._id || mt.user)?.toString() === sIdStr
      );
      if (found?.tag && found.tag.trim()) {
        return found.tag.trim();
      }
    }
    if (isSenderAdmin) {
      return "Admin";
    }
    return "";
  }, [isGroupChat, isUserMessage, senderId, activeContact, conversationObj, isSenderAdmin]);

  const isSticker = message.contentType === "sticker";

  const handleOpenSenderContactInfo = useCallback(
    (e) => {
      if (isSelectMode) return;
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!senderId || isUserMessage || isMetaAiMessage) return;

      const rawParticipants =
        activeContact?.participants ||
        activeContact?.conversation?.participants ||
        conversationObj?.participants ||
        [];
      let targetMember = null;
      if (Array.isArray(rawParticipants)) {
        targetMember = rawParticipants.find(
          (p) => (p?._id || p?.id || p)?.toString() === senderId
        );
      }

      const allChatUsers = useChatStore.getState()?.users || [];
      const foundInAllUsers = Array.isArray(allChatUsers)
        ? allChatUsers.find((u) => (u?._id || u?.id)?.toString() === senderId)
        : null;

      const senderObj =
        typeof message?.sender === "object" && message?.sender
          ? message.sender
          : null;

      const baseMember =
        targetMember && typeof targetMember === "object"
          ? targetMember
          : {};

      const finalMember = {
        ...baseMember,
        ...(foundInAllUsers || {}),
        ...(senderObj || {}),
        _id: senderId,
        id: senderId,
        username:
          foundInAllUsers?.username ||
          baseMember.username ||
          senderObj?.username ||
          senderDisplayName ||
          "Participant",
        name:
          foundInAllUsers?.name ||
          foundInAllUsers?.username ||
          baseMember.name ||
          baseMember.username ||
          senderObj?.name ||
          senderObj?.username ||
          senderDisplayName ||
          "Participant",
        profilePicture:
          foundInAllUsers?.profilePicture ||
          foundInAllUsers?.profilePic ||
          foundInAllUsers?.avatar ||
          baseMember.profilePicture ||
          baseMember.profilePic ||
          baseMember.avatar ||
          senderObj?.profilePicture ||
          senderObj?.profilePic ||
          senderObj?.avatar ||
          senderAvatar ||
          "",
        phoneNumber:
          foundInAllUsers?.phoneNumber ||
          baseMember.phoneNumber ||
          senderObj?.phoneNumber ||
          "",
        about:
          foundInAllUsers?.about ||
          baseMember.about ||
          senderObj?.about ||
          "",
        aboutUpdatedAt:
          foundInAllUsers?.aboutUpdatedAt ||
          baseMember.aboutUpdatedAt ||
          senderObj?.aboutUpdatedAt ||
          null,
        email:
          foundInAllUsers?.email ||
          baseMember.email ||
          senderObj?.email ||
          "",
        isOnline:
          typeof foundInAllUsers?.isOnline === "boolean"
            ? foundInAllUsers.isOnline
            : baseMember.isOnline,
        lastSeen:
          foundInAllUsers?.lastSeen ||
          baseMember.lastSeen ||
          senderObj?.lastSeen ||
          null,
      };

      const openFn =
        openContactInfoWithMember ||
        useLayoutStore.getState().openContactInfoWithMember;

      if (openFn) {
        openFn(finalMember);
      } else {
        useLayoutStore.getState().setViewingMember?.(finalMember);
        useLayoutStore.getState().setShowContactInfo?.(true);
      }
    },
    [
      isSelectMode,
      senderId,
      isUserMessage,
      isMetaAiMessage,
      activeContact,
      conversationObj,
      senderDisplayName,
      senderAvatar,
      message?.sender,
      openContactInfoWithMember,
      setShowContactInfo,
    ]
  );

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
            } catch (e) {
              console.log(e);
            }
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
    const secConv = (layoutSelectedContact?.conversation?._id || layoutSelectedContact?.conversation)?.toString();
    const selContactId = layoutSelectedContact?._id?.toString();
    const isGroup = Boolean(
      currentConversation?.isGroup ||
      layoutSelectedContact?.isGroup ||
      layoutSelectedContact?.isGroupChat ||
      layoutSelectedContact?.conversation?.isGroup
    );

    let pin =
      (currConv && pinnedMessages?.[currConv]) ||
      (msgConv && pinnedMessages?.[msgConv]) ||
      (secConv && pinnedMessages?.[secConv]) ||
      (!isGroup && selContactId && selContactId !== currentUserId && pinnedMessages?.[selContactId]);

    if (!pin) {
      const allPins = Object.values(pinnedMessages || {});
      const msgIdStr = (message?._id?._id || message?._id)?.toString();
      pin = allPins.find((p) => {
        if (!p?.message) return false;
        const pMsgId = (p.message?._id?._id || p.message?._id)?.toString();
        const pConv = (
          p.message?.conversation?._id ||
          p.message?.conversation ||
          p.message?.conversationId ||
          p.conversationId ||
          p.conversation
        )?._id?.toString() ||
          (p.message?.conversation || p.conversationId || p.conversation)?.toString();

        if (pMsgId === msgIdStr) return true;
        return pConv && (pConv === currConv || pConv === msgConv || pConv === secConv);
      });
    }

    if (!pin) {
      const convPinned =
        currentConversation?.pinnedMessage ||
        selectedContact?.conversation?.pinnedMessage ||
        layoutSelectedContact?.conversation?.pinnedMessage;
      if (convPinned && convPinned.message) {
        const pConv = (
          convPinned.message?.conversation?._id ||
          convPinned.message?.conversation ||
          convPinned.message?.conversationId
        )?.toString();
        if (!pConv || !currConv || pConv === currConv || pConv === msgConv || pConv === secConv) {
          pin = convPinned;
        }
      }
    }

    return pin;
  }, [
    pinnedMessages,
    currentConversation,
    message,
    layoutSelectedContact,
    selectedContact,
    isDeletedForEveryone,
    currentUserId,
  ]);

  const isPinned = useMemo(() => {
    if (!activePin) return false;
    const activeMsgId = (activePin.message?._id?._id || activePin.message?._id || activePin.message)?.toString();
    const currentMsgId = (message?._id?._id || message?._id)?.toString();
    return Boolean(activeMsgId && currentMsgId && activeMsgId === currentMsgId);
  }, [activePin, message]);

  const isStarred = useMemo(() => {
    if (message?.isStarred || message?.starred) return true;
    const msgId = (message?._id?._id || message?._id || message?.temp)?.toString();
    if (!msgId) return false;

    if (typeof isMessageStarred === "function" && isMessageStarred(msgId)) {
      return true;
    }

    if (!starredMessages) return false;

    if (Array.isArray(starredMessages)) {
      return starredMessages.some((item) => {
        if (!item) return false;
        const id = (item?._id || item?.messageId || item)?.toString();
        return id === msgId;
      });
    }

    if (typeof starredMessages === "object") {
      return Boolean(starredMessages[msgId] || starredMessages[String(message?._id)]);
    }

    if (starredMessages instanceof Set) {
      return starredMessages.has(msgId);
    }

    return false;
  }, [starredMessages, isMessageStarred, message?._id, message?.temp, message?.isStarred, message?.starred]);

  const validReactions = (message.reactions || []).filter((r) =>
    Boolean(r && r.emoji)
  );

  const uniqueReactions = [
    ...new Set(validReactions.map((r) => r.emoji).filter(Boolean)),
  ];

  const safeHighlight = useCallback(
    (text, term) => {
      if (!term || !text || typeof text !== "string") return text;
      if (highlightText) return highlightText(text, term);
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      const parts = text.split(regex);
      return parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-amber-300 dark:bg-amber-500/80 text-black dark:text-white rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        )
      );
    },
    [highlightText]
  );

  const renderTextWithLinks = useCallback(
    (plainText, term) => {
      if (!plainText || typeof plainText !== "string") return plainText;

      const linkRegex =
        /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<]+[^<.,:;"')\]\s]|www\.[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+[^<.,:;"')\]\s])/gi;

      const segments = plainText.split(linkRegex);

      return segments.map((seg, sIdx) => {
        if (!seg) return null;

        const mdMatch = seg.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
        if (mdMatch) {
          const href = mdMatch[2];
          const label = mdMatch[1];
          return (
            <a
              key={`link-md-${sIdx}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[#027eb5] hover:text-[#015f8a] dark:text-[#53bdeb] dark:hover:text-[#7ad0f5] underline underline-offset-2 break-all font-medium cursor-pointer transition-colors inline select-text"
              title={href}
            >
              {term ? safeHighlight(label, term) : label}
            </a>
          );
        }

        if (/^https?:\/\//i.test(seg)) {
          return (
            <a
              key={`link-raw-${sIdx}`}
              href={seg}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[#027eb5] hover:text-[#015f8a] dark:text-[#53bdeb] dark:hover:text-[#7ad0f5] underline underline-offset-2 break-all font-medium cursor-pointer transition-colors inline select-text"
              title={seg}
            >
              {term ? safeHighlight(seg, term) : seg}
            </a>
          );
        }

        if (/^www\./i.test(seg)) {
          const href = `https://${seg}`;
          return (
            <a
              key={`link-www-${sIdx}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[#027eb5] hover:text-[#015f8a] dark:text-[#53bdeb] dark:hover:text-[#7ad0f5] underline underline-offset-2 break-all font-medium cursor-pointer transition-colors inline select-text"
              title={href}
            >
              {term ? safeHighlight(seg, term) : seg}
            </a>
          );
        }

        return term ? safeHighlight(seg, term) : seg;
      });
    },
    [safeHighlight]
  );

  const renderContentWithMentions = useCallback(
    (text, term) => {
      if (!text || typeof text !== "string") return text;

      const mentionRegex = /(@all\b|@everyone\b|@Meta AI\b|@[a-zA-Z0-9_\.\-]+)/gi;
      const parts = text.split(mentionRegex);

      return parts.map((part, index) => {
        if (!part) return null;
        if (part.match(mentionRegex)) {
          const lower = part.toLowerCase();
          if (lower === "@all" || lower === "@everyone") {
            return (
              <span
                key={index}
                className={`font-semibold px-1 py-0.5 rounded transition-colors inline-block select-text ${isDark
                  ? "text-[#53bdeb] bg-[#53bdeb]/15 hover:bg-[#53bdeb]/25"
                  : "text-[#027eb5] bg-[#027eb5]/10 hover:bg-[#027eb5]/20"
                  }`}
                title="Mentioned all members in group"
              >
                {part}
              </span>
            );
          }
          if (lower === "@meta ai") {
            return (
              <span
                key={index}
                className="font-semibold text-blue-400 bg-blue-500/15 px-1 py-0.5 rounded inline-block cursor-pointer hover:bg-blue-500/25 transition-colors select-text"
                title="Mentioned Meta AI"
              >
                {part}
              </span>
            );
          }

          const rawUsername = part.slice(1);
          const myUsername = (effectiveUser?.username || effectiveUser?.name || "")?.toLowerCase();
          const isMe = Boolean(myUsername && rawUsername.toLowerCase() === myUsername);

          return (
            <span
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                const rawParticipants =
                  activeContact?.participants ||
                  activeContact?.conversation?.participants ||
                  conversationObj?.participants ||
                  [];
                const found = Array.isArray(rawParticipants)
                  ? rawParticipants.find(
                    (p) =>
                      (p?.username || p?.name || "").toLowerCase() === rawUsername.toLowerCase()
                  )
                  : null;
                if (found) {
                  const openFn =
                    openContactInfoWithMember ||
                    useLayoutStore.getState().openContactInfoWithMember;
                  if (openFn) openFn(found);
                }
              }}
              className={`font-semibold px-1 py-0.5 rounded cursor-pointer transition-colors inline-block select-text ${isMe
                ? "text-[#00a884] dark:text-[#25d366] bg-[#00a884]/20 hover:bg-[#00a884]/30 font-bold"
                : isDark
                  ? "text-[#53bdeb] bg-[#53bdeb]/15 hover:bg-[#53bdeb]/25"
                  : "text-[#027eb5] bg-[#027eb5]/10 hover:bg-[#027eb5]/20"
                }`}
              title={isMe ? "You were mentioned" : `Mentioned @${rawUsername}`}
            >
              {part}
            </span>
          );
        }

        return renderTextWithLinks(part, term);
      });
    },
    [
      isDark,
      effectiveUser?.username,
      effectiveUser?.name,
      activeContact,
      conversationObj,
      openContactInfoWithMember,
      renderTextWithLinks,
    ]
  );

  const bubbleContentClass = useMemo(() => {
    if (isSticker) {
      return "bg-transparent shadow-none border-none p-0";
    }
    const roundedCorners = isFirstInSequence
      ? isUserMessage
        ? "rounded-[7.5px] rounded-tr-none"
        : "rounded-[7.5px] rounded-tl-none"
      : "rounded-[7.5px]";

    const base =
      `max-w-[85%] sm:max-w-[70%] md:max-w-[65%] ${roundedCorners} px-[9px] pt-[6px] pb-[7px] text-[14.2px] leading-[19px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] select-text transition-all duration-150`;
    if (isUserMessage) {
      const bg = chatBubbleColor ? "" : (isDark ? "bg-[#005c4b]" : "bg-[#d9fdd3]");
      const txt = isDark ? "text-[#e9edef]" : "text-[#111b21]";
      return `${base} ${bg} ${txt}`;
    }
    const bg = isDark ? "bg-[#202c33]" : "bg-white";
    const txt = isDark ? "text-[#e9edef]" : "text-[#111b21]";
    return `${base} ${bg} ${txt}`;
  }, [isUserMessage, isDark, chatBubbleColor, isSticker, isFirstInSequence]);

  const handleTouchStart = () => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowReactions(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const handleReact = (emoji) => {
    const myExistingReaction = (message.reactions || []).find(
      (r) => String(r.userId?._id || r.userId) === String(currentUserId)
    );

    if (myExistingReaction && myExistingReaction.emoji === emoji) {
      if (removeReaction) {
        removeReaction(message._id);
      } else {
        onReact?.(message._id, null);
      }
    } else {
      onReact?.(message._id, emoji);
    }
    setShowReactions(false);
    setShowEmojiPicker(false);
  };

  useOutsideClick(reactionsMenuRef, () => {
    setShowReactions(false);
    setShowEmojiPicker(false);
  });
  useOutsideClick(optionRef, () => {
    setShowOptions(false);
  });
  useOutsideClick(editRef, () => {
    setIsEditing(false);
  });

  useLayoutEffect(() => {
    if (!showOptions || !optionRef.current || !menuCoords) return;
    const menuEl = optionRef.current;
    const realWidth = menuEl.offsetWidth || 220;
    const realHeight = menuEl.offsetHeight || 300;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 10;
    const triggerRect = menuCoords.triggerRect;

    if (triggerRect) {
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      let newTop;
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
  }, [showOptions, isUserMessage]);

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
    if (top + estimatedHeight > viewportHeight - padding) {
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

  if (isDisappearingExpired) {
    return null;
  }

  const msgDOMId = (message?._id?._id || message?._id || message?.temp)?.toString();

  return (
    <div
      id={msgDOMId ? `msg-${msgDOMId}` : undefined}
      data-match={dataMatch}
      className={`group relative flex w-full transition-colors select-none ${isSelectMode ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/[0.04]" : ""
        } ${isSelected ? "bg-[#00a884]/10 dark:bg-[#00a884]/15" : ""} ${isFirstInSequence ? "mt-[3px]" : "mt-[2px]"
        }`}
      onClick={
        isSelectMode
          ? (e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelect?.(message._id?._id || message._id || message.temp);
          }
          : undefined
      }
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
          <div className={`w-[18px] h-[18px] rounded-[3px] border-[1.5px] flex items-center justify-center transition-all duration-150 ${isSelected
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

      <div className={`flex-1 flex min-w-0 ${isUserMessage
        ? "justify-end pl-10 sm:pl-16 md:pl-24 pr-1 sm:pr-2.5"
        : "justify-start pr-10 sm:pr-16 md:pr-24 pl-1 sm:pl-2.5"
        }`}
      >
        {isGroupChat && !isUserMessage && (
          <div className="shrink-0 mr-1.5 self-start mt-0.5 select-none">
            {isFirstInSequence ? (
              <div
                onClick={handleOpenSenderContactInfo}
                onMouseDown={(e) => e.stopPropagation()}
                className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                title={`View ${senderDisplayName}'s info`}
              >
                {senderAvatar ? (
                  <img
                    src={senderAvatar}
                    alt={senderDisplayName}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shadow-sm border border-black/10 dark:border-white/10"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-[11px] sm:text-[12px] font-semibold shadow-sm"
                    style={{ backgroundColor: senderColor }}
                  >
                    {(senderDisplayName[0] || "U").toUpperCase()}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-7 sm:w-8" />
            )}
          </div>
        )}

        <div className={`${bubbleContentClass} relative group ${isActive
          ? "ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.55)]"
          : ""
          }`}
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
        >
          {!isSticker && isFirstInSequence && (
            isUserMessage ? (
              <span
                data-icon="tail-out"
                style={chatBubbleColor ? { color: chatBubbleColor } : undefined}
                className={`absolute top-0 -right-[8px] pointer-events-none select-none block w-[8px] h-[13px] ${chatBubbleColor ? "" : (isDark ? "text-[#005c4b]" : "text-[#d9fdd3]")
                  }`}
              >
                <TailOutIcon />
              </span>
            ) : (
              <span
                data-icon="tail-in"
                className={`absolute top-0 -left-[8px] pointer-events-none select-none block w-[8px] h-[13px] ${isDark ? "text-[#202c33]" : "text-white"
                  }`}
              >
                <TailInIcon />
              </span>
            )
          )}

          {isDeletedForEveryone ? (
            <div className="flex items-center gap-2 select-none py-0.5 px-0.5 min-w-[200px]">
              <ProhibitedIcon size={16} className={`shrink-0 ${isDark ? "text-white/60" : "text-[#8696a0]"}`} />
              <span className={`text-[14px] italic font-normal tracking-wide flex-1 min-w-0 select-none ${isDark ? "text-white/70" : "text-[#54656f]"}`} >
                {isUserMessage ? "You deleted this message" : "This message was deleted"}
              </span>
              <span className={`text-[11px] leading-none ml-2.5 self-end shrink-0 select-none ${isDark ? "text-white/50" : "text-[#8696a0]"}`}>
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
              {isGroupChat && !isUserMessage && !isMetaAiMessage && isFirstInSequence && !isSticker && (
                <div className="flex items-center gap-1.5 mb-1 select-none">
                  <span
                    onClick={handleOpenSenderContactInfo}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="text-[12.8px] font-semibold leading-tight truncate hover:underline cursor-pointer"
                    style={{ color: senderColor }}
                    title={`View ${senderDisplayName}'s info`}
                  >
                    {senderDisplayName}
                  </span>
                  {senderTag ? (
                    <span
                      onClick={handleOpenSenderContactInfo}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full border leading-tight shrink-0 cursor-pointer hover:opacity-80 ${isDark ? "bg-white/10 text-white/80 border-white/15" : "bg-black/5 text-gray-700 border-black/10"}`}
                      title={`View ${senderDisplayName}'s info`}
                    >
                      {senderTag}
                    </span>
                  ) : null}
                </div>
              )}

              {isMetaAiMessage && !isUserMessage && (
                <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-black/5 dark:border-white/5 select-none">
                  <MetaAiRing size={15} showInnerIcon={false} />
                  <span className="font-semibold text-xs bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Meta AI
                  </span>
                </div>
              )}

              <MessageReplyQuote
                message={message}
                currentUser={effectiveUser}
                selectedContact={selectedContact}
                isDark={isDark}
              />

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
                                toast.error("Failed to edit message", error);
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
                            <MetaAiMarkdown
                              content={displayContent}
                              theme={theme}
                              messageId={message._id || message.id || message.tempId}
                            />
                            {message.metaAiImages && message.metaAiImages.length > 0 && (
                              <MetaAiThumbnailGallery
                                images={message.metaAiImages}
                                theme={theme}
                                onOpenViewer={(url) => {
                                  setViewerModalFile({
                                    url,
                                    name: "web-image.jpg",
                                    type: "image",
                                    size: message.fileSize,
                                    sender: message.sender,
                                    createdAt: message.createdAt,
                                    messageId: message._id,
                                    isUserMessage: false,
                                  });
                                }}
                              />
                            )}
                            <MetaAiQuickFollowups
                              suggestions={message.metaAiSuggestions}
                              prompt={message.metaAiPrompt || message.content}
                              content={displayContent}
                              theme={theme}
                              onSelect={(followupText) => {
                                const isGroup = isGroupChat || Boolean(activeContact?.isGroup);
                                const finalPrompt =
                                  isGroup && !followupText.toLowerCase().includes("@meta ai")
                                    ? `@Meta AI ${followupText}`
                                    : followupText;
                                window.dispatchEvent(
                                  new CustomEvent("meta_ai_prefill", {
                                    detail: {
                                      text: finalPrompt,
                                      autoSend: true,
                                    },
                                  })
                                );
                              }}
                            />
                            <MetaAiFeedbackBar
                              messageId={message._id || message.id || message.tempId}
                              content={displayContent}
                              theme={theme}
                              persona={message.metaAiPersona}
                              onRegenerate={() => {
                                const promptToRegen = message.metaAiPrompt || message.content;
                                if (promptToRegen) {
                                  window.dispatchEvent(
                                    new CustomEvent("meta_ai_prefill", { detail: promptToRegen })
                                  );
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <span className="break-words whitespace-pre-wrap">
                            {renderContentWithMentions(displayContent, searchTerm)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 float-right translate-y-[3px] ml-2.5 select-none shrink-0 pointer-events-auto">
                          <MessageTimestampAndStatus
                            message={message}
                            isUserMessage={isUserMessage}
                            isGroupChat={isGroupChat}
                            activeContact={activeContact}
                            conversationObj={conversationObj}
                            currentUserId={currentUserId}
                            isPinned={isPinned}
                            disappearingDuration={disappearingDuration}
                            onOpenDisappearing={onOpenDisappearing}
                            isStarred={isStarred}
                            isOverlay={false}
                            isSelectMode={isSelectMode}
                            showOptions={showOptions}
                            handleToggleOptions={handleToggleOptions}
                            isDark={isDark}
                          />
                        </span>
                      </div>
                    )}
                  </>
                )}

                {(message.contentType === "ai_image" || (isMetaAiMessage && message.imageOrVideoUrl && (!message.metaAiImages || message.metaAiImages.length === 0))) && (
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
                      <MessageTimestampAndStatus
                        message={message}
                        isUserMessage={isUserMessage}
                        isGroupChat={isGroupChat}
                        activeContact={activeContact}
                        conversationObj={conversationObj}
                        currentUserId={currentUserId}
                        isPinned={isPinned}
                        disappearingDuration={disappearingDuration}
                        onOpenDisappearing={onOpenDisappearing}
                        isStarred={isStarred}
                        isOverlay={false}
                        isSelectMode={isSelectMode}
                        showOptions={showOptions}
                        handleToggleOptions={handleToggleOptions}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                )}

                {message.contentType === "image" && !isMetaAiMessage && message.contentType !== "ai_image" && (
                  <MessageImageContent
                    message={message}
                    isUserMessage={isUserMessage}
                    currentUserId={currentUserId}
                    setViewerModalFile={setViewerModalFile}
                    renderTimestampAndStatus={(isOverlay) => (
                      <MessageTimestampAndStatus
                        message={message}
                        isUserMessage={isUserMessage}
                        isGroupChat={isGroupChat}
                        activeContact={activeContact}
                        conversationObj={conversationObj}
                        currentUserId={currentUserId}
                        isPinned={isPinned}
                        disappearingDuration={disappearingDuration}
                        onOpenDisappearing={onOpenDisappearing}
                        isStarred={isStarred}
                        isOverlay={isOverlay}
                        isSelectMode={isSelectMode}
                        showOptions={showOptions}
                        handleToggleOptions={handleToggleOptions}
                        isDark={isDark}
                      />
                    )}
                    isWaitingDecryption={isWaitingDecryption}
                    displayContent={displayContent}
                    searchTerm={searchTerm}
                    safeHighlight={safeHighlight}
                    renderContentWithMentions={renderContentWithMentions}
                  />
                )}

                {message.contentType === "video" && (
                  <MessageVideoContent
                    message={message}
                    isUserMessage={isUserMessage}
                    currentUserId={currentUserId}
                    setViewerModalFile={setViewerModalFile}
                    renderTimestampAndStatus={(isOverlay) => (
                      <MessageTimestampAndStatus
                        message={message}
                        isUserMessage={isUserMessage}
                        isGroupChat={isGroupChat}
                        activeContact={activeContact}
                        conversationObj={conversationObj}
                        currentUserId={currentUserId}
                        isPinned={isPinned}
                        disappearingDuration={disappearingDuration}
                        onOpenDisappearing={onOpenDisappearing}
                        isStarred={isStarred}
                        isOverlay={isOverlay}
                        isSelectMode={isSelectMode}
                        showOptions={showOptions}
                        handleToggleOptions={handleToggleOptions}
                        isDark={isDark}
                      />
                    )}
                    isWaitingDecryption={isWaitingDecryption}
                    displayContent={displayContent}
                    searchTerm={searchTerm}
                    safeHighlight={safeHighlight}
                    renderContentWithMentions={renderContentWithMentions}
                  />
                )}

                {message.contentType === "document" && (
                  <MessageDocumentContent
                    message={message}
                    isDark={isDark}
                    setViewerModalFile={setViewerModalFile}
                    downloading={downloading}
                    setDownloading={setDownloading}
                    renderTimestampAndStatus={(isOverlay) => (
                      <MessageTimestampAndStatus
                        message={message}
                        isUserMessage={isUserMessage}
                        isGroupChat={isGroupChat}
                        activeContact={activeContact}
                        conversationObj={conversationObj}
                        currentUserId={currentUserId}
                        isPinned={isPinned}
                        disappearingDuration={disappearingDuration}
                        onOpenDisappearing={onOpenDisappearing}
                        isStarred={isStarred}
                        isOverlay={isOverlay}
                        isSelectMode={isSelectMode}
                        showOptions={showOptions}
                        handleToggleOptions={handleToggleOptions}
                        isDark={isDark}
                      />
                    )}
                  />
                )}

                {message.contentType === "audio" && (
                  <MessageAudioContent
                    message={message}
                    renderTimestampAndStatus={(isOverlay) => (
                      <MessageTimestampAndStatus
                        message={message}
                        isUserMessage={isUserMessage}
                        isGroupChat={isGroupChat}
                        activeContact={activeContact}
                        conversationObj={conversationObj}
                        currentUserId={currentUserId}
                        isPinned={isPinned}
                        disappearingDuration={disappearingDuration}
                        onOpenDisappearing={onOpenDisappearing}
                        isStarred={isStarred}
                        isOverlay={isOverlay}
                        isSelectMode={isSelectMode}
                        showOptions={showOptions}
                        handleToggleOptions={handleToggleOptions}
                        isDark={isDark}
                      />
                    )}
                  />
                )}

                {message.contentType === "contact" && (
                  <MessageContactContent
                    message={message}
                    isDark={isDark}
                    renderTimestampAndStatus={(isOverlay) => (
                      <MessageTimestampAndStatus
                        message={message}
                        isUserMessage={isUserMessage}
                        isGroupChat={isGroupChat}
                        activeContact={activeContact}
                        conversationObj={conversationObj}
                        currentUserId={currentUserId}
                        isPinned={isPinned}
                        disappearingDuration={disappearingDuration}
                        onOpenDisappearing={onOpenDisappearing}
                        isStarred={isStarred}
                        isOverlay={isOverlay}
                        isSelectMode={isSelectMode}
                        showOptions={showOptions}
                        handleToggleOptions={handleToggleOptions}
                        isDark={isDark}
                      />
                    )}
                  />
                )}

                {message.contentType === "poll" && (
                  <MessagePollContent
                    message={message}
                    isUserMessage={isUserMessage}
                    currentUserId={currentUserId}
                    isDark={isDark}
                    showOptions={showOptions}
                    handleToggleOptions={handleToggleOptions}
                    votePoll={votePoll}
                    setSelectedPollDetails={setSelectedPollDetails}
                    renderTimestampAndStatus={(isOverlay) => (
                      <MessageTimestampAndStatus
                        message={message}
                        isUserMessage={isUserMessage}
                        isGroupChat={isGroupChat}
                        activeContact={activeContact}
                        conversationObj={conversationObj}
                        currentUserId={currentUserId}
                        isPinned={isPinned}
                        disappearingDuration={disappearingDuration}
                        onOpenDisappearing={onOpenDisappearing}
                        isStarred={isStarred}
                        isOverlay={isOverlay}
                        isSelectMode={isSelectMode}
                        showOptions={showOptions}
                        handleToggleOptions={handleToggleOptions}
                        isDark={isDark}
                      />
                    )}
                  />
                )}

                {message.contentType === "event" && (
                  <MessageEventContent
                    message={message}
                    isUserMessage={isUserMessage}
                    effectiveUser={effectiveUser}
                    isDark={isDark}
                    onEditEvent={onEditEvent}
                    renderTimestampAndStatus={(isOverlay) => (
                      <MessageTimestampAndStatus
                        message={message}
                        isUserMessage={isUserMessage}
                        isGroupChat={isGroupChat}
                        activeContact={activeContact}
                        conversationObj={conversationObj}
                        currentUserId={currentUserId}
                        isPinned={isPinned}
                        disappearingDuration={disappearingDuration}
                        onOpenDisappearing={onOpenDisappearing}
                        isStarred={isStarred}
                        isOverlay={isOverlay}
                        isSelectMode={isSelectMode}
                        showOptions={showOptions}
                        handleToggleOptions={handleToggleOptions}
                        isDark={isDark}
                      />
                    )}
                  />
                )}

                {message.contentType === "sticker" && (
                  <MessageStickerContent
                    message={message}
                    renderTimestampAndStatus={(isOverlay) => (
                      <MessageTimestampAndStatus
                        message={message}
                        isUserMessage={isUserMessage}
                        isGroupChat={isGroupChat}
                        activeContact={activeContact}
                        conversationObj={conversationObj}
                        currentUserId={currentUserId}
                        isPinned={isPinned}
                        disappearingDuration={disappearingDuration}
                        onOpenDisappearing={onOpenDisappearing}
                        isStarred={isStarred}
                        isOverlay={isOverlay}
                        isSelectMode={isSelectMode}
                        showOptions={showOptions}
                        handleToggleOptions={handleToggleOptions}
                        isDark={isDark}
                      />
                    )}
                  />
                )}

                {(message.contentType === "call_link" ||
                  Boolean(message.callLinkData) ||
                  (typeof message.content === "string" &&
                    message.content.includes("call.whatsapp.com"))) && (
                    <MessageCallLinkContent
                      message={message}
                      isUserMessage={isUserMessage}
                      selectedContact={selectedContact}
                      isDark={isDark}
                      renderTimestampAndStatus={(isOverlay) => (
                        <MessageTimestampAndStatus
                          message={message}
                          isUserMessage={isUserMessage}
                          isGroupChat={isGroupChat}
                          activeContact={activeContact}
                          conversationObj={conversationObj}
                          currentUserId={currentUserId}
                          isPinned={isPinned}
                          disappearingDuration={disappearingDuration}
                          onOpenDisappearing={onOpenDisappearing}
                          isStarred={isStarred}
                          isOverlay={isOverlay}
                          isSelectMode={isSelectMode}
                          showOptions={showOptions}
                          handleToggleOptions={handleToggleOptions}
                          isDark={isDark}
                        />
                      )}
                    />
                  )}

                {(message.contentType === "call" || Boolean(message.callData)) && (
                  <MessageCallHistoryContent
                    message={message}
                    isUserMessage={isUserMessage}
                    selectedContact={selectedContact}
                    isDark={isDark}
                    renderTimestampAndStatus={(isOverlay) => (
                      <MessageTimestampAndStatus
                        message={message}
                        isUserMessage={isUserMessage}
                        isGroupChat={isGroupChat}
                        activeContact={activeContact}
                        conversationObj={conversationObj}
                        currentUserId={currentUserId}
                        isPinned={isPinned}
                        disappearingDuration={disappearingDuration}
                        onOpenDisappearing={onOpenDisappearing}
                        isStarred={isStarred}
                        isOverlay={isOverlay}
                        isSelectMode={isSelectMode}
                        showOptions={showOptions}
                        handleToggleOptions={handleToggleOptions}
                        isDark={isDark}
                      />
                    )}
                  />
                )}
              </div>
            </div>
          )}

          {!isDeletedForEveryone && (
            <MessageReactionsHoverPicker
              isUserMessage={isUserMessage}
              isDark={isDark}
              theme={theme}
              showReactions={showReactions}
              setShowReactions={setShowReactions}
              reactionsMenuRef={reactionsMenuRef}
              message={message}
              currentUserId={currentUserId}
              handleReact={handleReact}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              emojiPickerRef={emojiPickerRef}
            />
          )}

          {!isDeletedForEveryone && (
            <MessageReactionBadge
              reactionBadgeRef={reactionBadgeRef}
              setShowReactionDetails={setShowReactionDetails}
              isUserMessage={isUserMessage}
              isDark={isDark}
              uniqueReactions={uniqueReactions}
              validReactions={validReactions}
            />
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
                        isGroupChat={isGroupChat}
                        senderDisplayName={senderDisplayName}
                        onOpenSenderContactInfo={handleOpenSenderContactInfo}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>,
              document.body
            )}

          <MessageDeleteModal
            deleteModal={deleteModal}
            setDeleteModal={setDeleteModal}
            deleteMessage={deleteMessage}
            isDark={isDark}
          />

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
              toast.success("You pinned a message");
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
