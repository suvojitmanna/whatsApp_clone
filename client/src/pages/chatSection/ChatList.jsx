import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import useThemeStore from "../../store/themeStore";
import useLayoutStore from "../../store/layoutStore";
import useUserStore from "../../store/useUserStore";
import {
  FaPlus,
  FaSearch,
  FaLock,
  FaCamera,
  FaVideo,
  FaHeadphones,
  FaFileAlt,
  FaHeart,
  FaCaretDown,
  FaUsers,
} from "react-icons/fa";
import { FaSquarePollHorizontal, FaCheckDouble } from "react-icons/fa6";
import { MdEventNote, MdAccessTime, MdList, MdOutlineChat, MdOutlineKeyboardArrowDown, MdEdit, MdOutlineCall, MdOutlineVideocam, MdLink } from "react-icons/md";
import { FiCheck } from "react-icons/fi";
import { RiEmojiStickerLine, RiContactsFill, RiDeleteBin6Line } from "react-icons/ri";
import { RxCross2 } from "react-icons/rx";
import { HiDotsVertical } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import formatTimestamp, { getDisappearingDurationMs } from "../../utils/formatTime";
import { useChatStore } from "../../store/chatStore";
import { isGroupSystemMessage, getFormattedGroupSystemText } from "../../utils/systemMessageUtils";
import { WhatsAppPinIcon, WhatsAppDisappearingIcon } from "./MessageBuble";
import {
  ProhibitedIcon,
  ArrowLeftIcon,
  ArchivedBoxIcon,
  MutedBellIcon,
} from "../../components/common/Icons";
import AddToListModal from "../../components/modals/AddToListModal";
import NewGroupModal from "../../components/modals/NewGroupModal";
import ListPanelOverChatList from "../../components/panels/ListPanelOverChatList";
import ChatlistMenu from "./ChatlistMenu";
import ChatHoverPreview from "./ChatHoverPreview";
import {
  getAllLists,
  isContactInList,
  getContactListNames,
  deleteCustomList,
} from "../../utils/chatListsUtil";
import { AVATAR_BG_COLORS } from "../../assets/rawData";
import { MetaAiRing, META_AI_USER_ID, META_AI_AVATAR } from "../../components/common/MetaAiIcon";

export const getAvatarBg = (name) => {
  if (!name) return AVATAR_BG_COLORS[0];
  const firstLetter = name.trim().charAt(0).toUpperCase();
  if (firstLetter === "B") return AVATAR_BG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_BG_COLORS.length;
  return AVATAR_BG_COLORS[index];
};

export const getAvatarInitial = (name) => {
  if (!name) return "?";
  const clean = name.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    ""
  ).trim();
  return (clean[0] || name.trim()[0] || "?").toUpperCase();
};

const ContactAvatar = ({ contact }) => {
  const [hasError, setHasError] = useState(false);
  const pic =
    contact?.profilePicture ||
    contact?.groupProfileImage ||
    contact?.conversation?.groupProfileImage;
  const username =
    contact?.username ||
    contact?.name ||
    contact?.groupName ||
    contact?.conversation?.groupName ||
    "User";

  const isGroup = Boolean(
    contact?.isGroup ||
    contact?.isGroupChat ||
    contact?.conversation?.isGroup ||
    (contact?.conversation?.participants && contact.conversation.participants.length > 2)
  );
  if (contact?.isAI || username === "Meta AI" || String(contact?._id) === META_AI_USER_ID) {
    return <MetaAiRing size={48} className="shadow-xs" />;
  }
  const showLetter = !pic || pic === "/default-avatar.png" || hasError;
  if (showLetter) {
    if (isGroup) {
      return (
        <div className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center bg-[#00a884]/20 text-[#00a884] dark:bg-emerald-500/20 dark:text-emerald-400 select-none shadow-xs border border-emerald-500/30">
          <FaUsers size={22} />
        </div>
      );
    }
    const bg = getAvatarBg(username);
    const initial = getAvatarInitial(username);
    return (
      <div
        style={{ backgroundColor: bg }}
        className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-white font-medium text-lg select-none shadow-xs"
      >
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={pic}
      alt={username}
      onError={() => setHasError(true)}
      className="w-12 h-12 rounded-full object-cover shrink-0 select-none shadow-xs"
    />
  );
};

export const getPinnedItemTypeAndLabel = (msg) => {
  if (!msg) return { type: "message", target: "a message" };
  const contentType = msg.contentType;
  const content = typeof msg.content === "string" ? msg.content : "";
  if (
    contentType === "poll" ||
    msg.pollData ||
    msg.poll ||
    content.startsWith("Poll:")
  ) {
    return { type: "poll", target: "a poll" };
  }
  if (
    contentType === "image" ||
    contentType === "photo" ||
    content === "Photo" ||
    content.startsWith("Photo:") ||
    (!contentType && msg.imageOrVideoUrl && !msg.imageOrVideoUrl.match(/\.(mp4|webm|mov|mkv)($|\?)/i))
  ) {
    return { type: "photo", target: "a photo" };
  }
  if (
    contentType === "video" ||
    content === "Video" ||
    content.startsWith("Video:") ||
    (!contentType && msg.imageOrVideoUrl && msg.imageOrVideoUrl.match(/\.(mp4|webm|mov|mkv)($|\?)/i))
  ) {
    return { type: "video", target: "a video" };
  }
  if (
    contentType === "audio" ||
    msg.audioUrl ||
    content === "Voice message" ||
    content.startsWith("Audio:")
  ) {
    return { type: "audio", target: "an audio" };
  }
  if (
    contentType === "document" ||
    contentType === "file" ||
    msg.fileName ||
    msg.fileUrl ||
    content.startsWith("Document:")
  ) {
    let docName = msg.fileName;
    if (!docName && content.startsWith("Document:")) {
      docName = content.replace(/^Document:\s*/, "");
    }
    if (docName) {
      const clean = docName.replace(/^Document:\s*/i, "").trim();
      const display = clean.length > 25 ? clean.slice(0, 22) + "..." : clean;
      return { type: "document", target: display || "a document" };
    }
    return { type: "document", target: "a document" };
  }
  if (contentType === "sticker" || content === "Sticker") {
    return { type: "sticker", target: "a sticker" };
  }
  if (contentType === "contact" || msg.contactData || content.startsWith("Contact:")) {
    return { type: "contact", target: "a contact" };
  }
  if (
    contentType === "event" ||
    (msg.eventData && Object.keys(msg.eventData).length > 0) ||
    content.startsWith("Event:")
  ) {
    return { type: "event", target: "an event" };
  }
  if (contentType === "location" || msg.locationData || content.startsWith("Location:")) {
    return { type: "location", target: "a location" };
  }
  if (contentType === "call") {
    const isVid = msg.callData?.callType === "video" || msg.callType === "video";
    return { type: isVid ? "video call" : "voice call", target: isVid ? "a video call" : "a voice call" };
  }
  return { type: "message", target: "a message" };
};

export const getPinActorAndLabel = (
  pin,
  currentUserId,
  defaultUsername = "Contact",
  participants = [],
) => {
  if (!pin)
    return {
      isMe: false,
      actor: "You",
      target: "a message",
      text: "You pinned a message",
    };

  const currentUidStr = (
    currentUserId?._id ||
    currentUserId?.id ||
    currentUserId
  )?.toString();
  const pinnedById = (
    pin.pinnedBy?._id ||
    pin.pinnedBy?.id ||
    pin.pinnedBy
  )?.toString();

  let isMe = false;
  if (pinnedById && currentUidStr) {
    isMe = pinnedById === currentUidStr;
  } else if (pin.message) {
    const msgSender = (
      pin.message?.sender?._id || pin.message?.sender
    )?.toString();
    isMe = Boolean(msgSender && currentUidStr && msgSender === currentUidStr);
  }

  let actor = "You";
  if (!isMe) {
    let resolvedName = pin.pinnedBy?.username || pin.pinnedBy?.name;

    if (!resolvedName && pinnedById) {
      if (Array.isArray(participants) && participants.length > 0) {
        const foundParticipant = participants.find((p) => {
          const pId = (p?._id || p?.id || p)?.toString();
          return pId === pinnedById;
        });
        if (foundParticipant) {
          resolvedName =
            foundParticipant.username ||
            foundParticipant.name ||
            foundParticipant.displayName;
        }
      }

      if (!resolvedName) {
        const storeUsers = useChatStore.getState().users || [];
        const foundStoreUser = storeUsers.find((u) => {
          const uId = (u?._id || u?.id)?.toString();
          return uId === pinnedById;
        });
        if (foundStoreUser) {
          resolvedName =
            foundStoreUser.username ||
            foundStoreUser.name ||
            foundStoreUser.displayName;
        }
      }

      if (!resolvedName && pin.message) {
        const senderId = (
          pin.message.sender?._id ||
          pin.message.sender?.id ||
          pin.message.sender
        )?.toString();
        if (senderId === pinnedById) {
          resolvedName =
            pin.message.sender?.username ||
            pin.message.sender?.name;
        }
      }
    }

    if (!resolvedName) {
      resolvedName =
        defaultUsername && defaultUsername !== "Someone"
          ? defaultUsername
          : "User";
    }

    actor = resolvedName || "Contact";
  }

  let msg = pin.message;
  if (!msg || typeof msg === "string" || !msg.contentType) {
    const msgId = typeof msg === "string" ? msg : msg?._id;
    if (msgId) {
      const chatMsgs = useChatStore.getState().messages || {};
      for (const mList of Object.values(chatMsgs)) {
        if (Array.isArray(mList)) {
          const match = mList.find((m) => String(m._id || m.id) === String(msgId));
          if (match) {
            msg = match;
            break;
          }
        }
      }
    }
  }

  const { target } = getPinnedItemTypeAndLabel(msg);

  return {
    isMe,
    actor,
    target,
    text: isMe ? "You pinned a message" : `${actor} pinned a message`,
  };
};

const getContactPin = (contact, pinnedMessages) => {
  if (!contact) return null;
  const currentUserId = useUserStore.getState()?.user?._id?.toString();
  const convId = (contact.conversation?._id || contact.conversation)?.toString();
  const contactId = contact._id?.toString();
  const isGroup = Boolean(
    contact?.isGroup ||
    contact?.isGroupChat ||
    contact?.conversation?.isGroup ||
    (contact?.conversation?.participants && contact.conversation.participants.length > 2)
  );
  const isMsgDeleted = (msg) => {
    if (!msg) return true;
    if (msg.deletedForEveryone) return true;
    if (
      msg.content === "This message was deleted" ||
      msg.content === "You deleted this message"
    ) {
      return true;
    }
    if (
      currentUserId &&
      msg.deletedFor &&
      Array.isArray(msg.deletedFor) &&
      msg.deletedFor.some((id) => String(id) === String(currentUserId))
    ) {
      return true;
    }
    return false;
  };

  let pin = null;
  if (contact.conversation?.pinnedMessage && contact.conversation.pinnedMessage.message) {
    const rawPin = contact.conversation.pinnedMessage;
    const expires = rawPin.expiresAt
      ? new Date(rawPin.expiresAt).getTime()
      : null;
    if (!expires || expires > Date.now()) {
      const rawMsg = rawPin.message;
      const rawMsgConv = (
        rawMsg?.conversation?._id ||
        rawMsg?.conversation ||
        rawMsg?.conversationId
      )?.toString();
      const belongsToThisConv = !rawMsgConv || !convId || rawMsgConv === convId;
      if (belongsToThisConv && !isMsgDeleted(rawPin.message)) {
        pin = { ...rawPin };
      }
    }
  }

  if (!pin && pinnedMessages) {
    pin =
      (convId && pinnedMessages[convId]) ||
      (!isGroup && contactId && contactId !== currentUserId && pinnedMessages[contactId]);

    if (!pin && convId) {
      const allPins = Object.values(pinnedMessages || {});
      pin = allPins.find((p) => {
        if (!p?.message) return false;
        const msgConv = (
          p.message.conversation?._id ||
          p.message.conversation ||
          p.message.conversationId
        )?.toString();
        return msgConv && msgConv === convId;
      });
    }
    if (pin) {
      pin = { ...pin };
    }
  }

  if (!pin || !pin.message) return null;
  if (isMsgDeleted(pin.message)) return null;
  if (pin.expiresAt && new Date(pin.expiresAt).getTime() <= Date.now()) return null;
  if (typeof pin.message === "string" || !pin.message?.contentType) {
    const storePin =
      (convId && pinnedMessages?.[convId]) ||
      (!isGroup && contactId && contactId !== currentUserId && pinnedMessages?.[contactId]);
    if (storePin?.message && typeof storePin.message === "object" && storePin.message.contentType) {
      pin.message = storePin.message;
    } else {
      const msgId = typeof pin.message === "string" ? pin.message : pin.message?._id;
      if (msgId) {
        const chatMsgs = useChatStore.getState().messages;
        const msgs =
          (convId && chatMsgs?.[convId]) ||
          (!isGroup && contactId && chatMsgs?.[contactId]) ||
          [];
        const found = msgs.find((m) => String(m._id || m.id) === String(msgId));
        if (found) {
          pin.message = found;
        }
      }
    }
  }

  return pin;
};

const getLastMessagePreview = (lastMessage) => {
  if (!lastMessage) return null;
  if (lastMessage.isDisappearing && !lastMessage.isKept && !lastMessage.deletedForEveryone) {
    const durMs = getDisappearingDurationMs(lastMessage.disappearingDuration);
    const expTime = lastMessage.disappearingExpiresAt
      ? new Date(lastMessage.disappearingExpiresAt).getTime()
      : (lastMessage.createdAt && durMs ? new Date(lastMessage.createdAt).getTime() + durMs : null);
    if (expTime && Date.now() >= expTime) {
      return null;
    }
  }
  const currentUser = useUserStore.getState()?.user;
  const currentUserId = currentUser?._id;
  const currentUserName = currentUser?.username;
  if (isGroupSystemMessage(lastMessage)) {
    const formatted =
      getFormattedGroupSystemText(
        lastMessage,
        currentUserId,
        currentUserName
      ) ||
      lastMessage.content ||
      "";
    return {
      icon: null,
      text: formatted,
      isDeleted: false,
      isEncrypted: false,
      isSystem: true,
    };
  }

  const isDeletedForEveryone = Boolean(
    lastMessage.deletedForEveryone ||
    lastMessage.content === "This message was deleted" ||
    lastMessage.content === "You deleted this message"
  );

  if (isDeletedForEveryone) {
    const isMe =
      currentUserId &&
      String(lastMessage.sender?._id || lastMessage.sender) === String(currentUserId);
    return {
      icon: (
        <ProhibitedIcon size={13} className="inline mr-1 text-[#8696a0] shrink-0" />
      ),
      text: isMe ? "You deleted this message" : "This message was deleted",
      isDeleted: true,
      isEncrypted: false,
    };
  }

  if (
    currentUserId &&
    lastMessage?.deletedFor &&
    Array.isArray(lastMessage.deletedFor) &&
    lastMessage.deletedFor.some((id) => String(id) === String(currentUserId))
  ) {
    return {
      icon: (
        <ProhibitedIcon size={13} className="inline mr-1 text-[#8696a0] shrink-0" />
      ),
      text: "You deleted this message",
      isDeleted: true,
      isEncrypted: false,
    };
  }

  const contentType = lastMessage.contentType;
  let pollData = lastMessage.pollData;
  if (typeof pollData === "string") {
    try {
      pollData = JSON.parse(pollData);
    } catch (e) {
      pollData = null;
    }
  }

  let eventData = lastMessage.eventData;
  if (typeof eventData === "string") {
    try {
      eventData = JSON.parse(eventData);
    } catch (e) {
      eventData = null;
    }
  }

  let contactData = lastMessage.contactData;
  if (typeof contactData === "string") {
    try {
      contactData = JSON.parse(contactData);
    } catch (e) {
      contactData = null;
    }
  }
  const imageOrVideoUrl = lastMessage.imageOrVideoUrl;
  const isEncrypted = Boolean(lastMessage.isEncrypted && !lastMessage._isDecrypted);

  if (isEncrypted) {
    return {
      icon: <FaLock className="inline mr-1 text-gray-500 dark:text-gray-400 shrink-0" size={11} />,
      text: "Encrypted message",
      isEncrypted: true,
    };
  }

  if (contentType === "poll") {
    let question =
      pollData?.question ||
      lastMessage.content ||
      "Poll";
    if (typeof question === "string" && question.startsWith("Poll:")) {
      question = question.replace(/^Poll:\s*/, "");
    }
    return {
      icon: <FaSquarePollHorizontal className="inline mr-1 text-emerald-500 shrink-0" size={13} />,
      text: `Poll: ${question}`,
      isEncrypted: false,
    };
  }
  if (contentType === "sticker") {
    return {
      icon: <RiEmojiStickerLine className="inline mr-1 text-emerald-500 shrink-0" size={14} />,
      text: "Sticker",
      isEncrypted: false,
    };
  }
  if (contentType === "image") {
    const caption = lastMessage.content && lastMessage.content !== "Photo"
      ? (lastMessage.content.startsWith("Photo:") ? lastMessage.content : `Photo: ${lastMessage.content}`)
      : "Photo";
    return {
      icon: <FaCamera className="inline mr-1 text-gray-500 dark:text-gray-400 shrink-0" size={12} />,
      text: caption,
      isEncrypted: false,
    };
  }
  if (contentType === "video") {
    const caption = lastMessage.content && lastMessage.content !== "Video"
      ? (lastMessage.content.startsWith("Video:") ? lastMessage.content : `Video: ${lastMessage.content}`)
      : "Video";
    return {
      icon: <FaVideo className="inline mr-1 text-gray-500 dark:text-gray-400 shrink-0" size={12} />,
      text: caption,
      isEncrypted: false,
    };
  }
  if (contentType === "audio") {
    return {
      icon: <FaHeadphones className="inline mr-1 text-gray-500 dark:text-gray-400 shrink-0" size={12} />,
      text: "Voice message",
      isEncrypted: false,
    };
  }
  if (contentType === "document") {
    const docName = lastMessage.fileName || lastMessage.content || "Document";
    const text = docName.startsWith("Document:") ? docName : `Document: ${docName}`;
    return {
      icon: <FaFileAlt className="inline mr-1 text-gray-500 dark:text-gray-400 shrink-0" size={12} />,
      text,
      isEncrypted: false,
    };
  }
  if (contentType === "event") {
    const isCancelled = eventData?.isCancelled || (typeof lastMessage.content === "string" && lastMessage.content.startsWith("Cancelled event:"));
    let title = eventData?.title || eventData?.name || lastMessage.content || "Event";
    if (typeof title === "string") {
      title = title.replace(/^(Cancelled event|Event):\s*/, "");
    }
    return {
      icon: <MdEventNote className="inline mr-1 text-emerald-500 shrink-0" size={13} />,
      text: isCancelled ? `Cancelled event: ${title}` : `Event: ${title}`,
      isEncrypted: false,
    };
  }
  if (contentType === "contact") {
    let name = contactData?.name || lastMessage.content || "Contact";
    if (typeof name === "string" && name.startsWith("Contact:")) {
      name = name.replace(/^Contact:\s*/, "");
    }
    return {
      icon: <RiContactsFill className="inline mr-1 text-emerald-500 shrink-0" size={13} />,
      text: `Contact: ${name}`,
      isEncrypted: false,
    };
  }

  if (contentType === "call") {
    const isVideo = lastMessage.callData?.callType === "video" || lastMessage.callType === "video";
    const duration = lastMessage.callData?.duration || lastMessage.duration || "Voice call";
    const isMissed = lastMessage.callData?.direction === "missed" || lastMessage.callData?.status === "missed" || lastMessage.status === "missed";
    return {
      icon: isVideo ? (
        <MdOutlineVideocam className={`inline mr-1 shrink-0 ${isMissed ? "text-red-500" : "text-emerald-500"}`} size={14} />
      ) : (
        <MdOutlineCall className={`inline mr-1 shrink-0 ${isMissed ? "text-red-500" : "text-emerald-500"}`} size={14} />
      ),
      text: isVideo ? `Video call (${duration})` : `Voice call (${duration})`,
      isEncrypted: false,
    };
  }

  if (
    contentType === "call_link" ||
    Boolean(lastMessage.callLinkData) ||
    (typeof lastMessage.content === "string" &&
      lastMessage.content.includes("call.whatsapp.com"))
  ) {
    const isVideo =
      lastMessage.callLinkData?.callType === "video" ||
      (typeof lastMessage.content === "string" &&
        lastMessage.content.includes("/video/"));
    return {
      icon: (
        <MdLink className="inline mr-1 text-[#00a884] shrink-0 transform -rotate-45" size={14} />
      ),
      text: isVideo ? "WhatsApp Video call link" : "WhatsApp Voice call link",
      isEncrypted: false,
    };
  }

  if (imageOrVideoUrl) {
    const isVid = imageOrVideoUrl.match(/\.(mp4|webm|mov|mkv)($|\?)/i);
    const isAud = imageOrVideoUrl.match(/\.(mp3|wav|ogg|m4a|aac)($|\?)/i);
    const isDoc = imageOrVideoUrl.match(/\.(pdf|docx?|xlsx?|pptx?|txt|zip)($|\?)/i);
    const isStk = imageOrVideoUrl.includes("stickers");

    if (isVid) {
      const caption = lastMessage.content && lastMessage.content !== "Video"
        ? (lastMessage.content.startsWith("Video:") ? lastMessage.content : `Video: ${lastMessage.content}`)
        : "Video";
      return {
        icon: <FaVideo className="inline mr-1 text-gray-500 dark:text-gray-400 shrink-0" size={12} />,
        text: caption,
        isEncrypted: false,
      };
    }

    if (isAud) {
      return {
        icon: <FaHeadphones className="inline mr-1 text-gray-500 dark:text-gray-400 shrink-0" size={12} />,
        text: "Voice message",
        isEncrypted: false,
      };
    }

    if (isDoc) {
      const docName = lastMessage.fileName || lastMessage.content || "Document";
      return {
        icon: <FaFileAlt className="inline mr-1 text-gray-500 dark:text-gray-400 shrink-0" size={12} />,
        text: docName.startsWith("Document:") ? docName : `Document: ${docName}`,
        isEncrypted: false,
      };
    }

    if (isStk) {
      return {
        icon: <RiEmojiStickerLine className="inline mr-1 text-emerald-500 shrink-0" size={14} />,
        text: "Sticker",
        isEncrypted: false,
      };
    }

    const caption = lastMessage.content && lastMessage.content !== "Photo"
      ? (lastMessage.content.startsWith("Photo:") ? lastMessage.content : `Photo: ${lastMessage.content}`)
      : "Photo";
    return {
      icon: <FaCamera className="inline mr-1 text-gray-500 dark:text-gray-400 shrink-0" size={12} />,
      text: caption,
      isEncrypted: false,
    };
  }
  if (lastMessage.fileName) {
    const text = lastMessage.fileName.startsWith("Document:")
      ? lastMessage.fileName
      : `Document: ${lastMessage.fileName}`;
    return {
      icon: <FaFileAlt className="inline mr-1 text-gray-500 dark:text-gray-400 shrink-0" size={12} />,
      text,
      isEncrypted: false,
    };
  }
  if (lastMessage.content) {
    return {
      icon: null,
      text: lastMessage.content,
      isEncrypted: false,
    };
  }

  return null;
};

export const getFullMessageTooltip = (lastMsg) => {
  if (!lastMsg) return "";
  if (lastMsg.deletedForEveryone) return "This message was deleted";
  if (isGroupSystemMessage(lastMsg)) {
    const currentUser = useUserStore.getState()?.user;
    return (
      getFormattedGroupSystemText(
        lastMsg,
        currentUser?._id,
        currentUser?.username
      ) ||
      lastMsg.content ||
      ""
    );
  }
  if (lastMsg.contentType === "poll" || lastMsg.pollData) {
    let pData = lastMsg.pollData;
    if (typeof pData === "string") {
      try {
        pData = JSON.parse(pData);
      } catch { }
    }
    const q = pData?.question || lastMsg.content || "Poll";
    const opts =
      pData?.options
        ?.map(
          (o, idx) =>
            `${idx + 1}. ${typeof o === "string" ? o : o?.text || ""}`
        )
        .join("\n") || "";
    return opts ? `Poll: ${q}\n${opts}` : `Poll: ${q}`;
  }
  if (lastMsg.contentType === "image" || lastMsg.contentType === "photo") {
    const caption =
      lastMsg.content && lastMsg.content !== "Photo"
        ? `Photo: ${lastMsg.content}`
        : "Photo";
    return caption;
  }
  if (lastMsg.contentType === "video") {
    const caption =
      lastMsg.content && lastMsg.content !== "Video"
        ? `Video: ${lastMsg.content}`
        : "Video";
    return caption;
  }
  if (lastMsg.contentType === "document" || lastMsg.fileName) {
    return `Document: ${lastMsg.fileName || lastMsg.content || "File"}`;
  }
  if (lastMsg.contentType === "audio") {
    return "Voice message";
  }
  if (lastMsg.contentType === "sticker") {
    return "Sticker";
  }
  if (lastMsg.contentType === "contact") {
    return `Contact: ${lastMsg.contactData?.name || lastMsg.content || ""}`;
  }
  if (lastMsg.contentType === "event") {
    return `Event: ${lastMsg.eventData?.title || lastMsg.content || ""}`;
  }
  if (
    lastMsg.contentType === "call_link" ||
    Boolean(lastMsg.callLinkData) ||
    (typeof lastMsg.content === "string" &&
      lastMsg.content.includes("call.whatsapp.com"))
  ) {
    return lastMsg.content || "WhatsApp call link";
  }
  return typeof lastMsg.content === "string" ? lastMsg.content : "";
};

export const isChatPinned = (contact, pinnedList) => {
  if (!contact || !pinnedList || pinnedList.length === 0) return false;
  const candidates = [
    contact._id,
    contact.id,
    contact.conversation?._id,
    contact.conversation,
  ].filter(Boolean).map(String);
  return candidates.some((id) => pinnedList.map(String).includes(id));
};

export const isChatArchived = (contact, archivedList) => {
  if (!contact || !archivedList || archivedList.length === 0) return false;
  const candidates = [
    contact._id,
    contact.id,
    contact.conversation?._id,
    contact.conversation,
  ].filter(Boolean).map(String);
  return candidates.some((id) => archivedList.map(String).includes(id));
};

export const isChatMuted = (contact, mutedMap) => {
  if (!contact || !mutedMap) return false;
  const candidates = [
    contact._id,
    contact.id,
    contact.conversation?._id,
    contact.conversation,
  ].filter(Boolean).map(String);
  return candidates.some((id) => {
    const val = mutedMap[id];
    if (!val) return false;
    if (val === "always") return true;
    return typeof val === "number" && val > Date.now();
  });
};

export const isChatMarkedUnread = (contact, unreadList) => {
  if (!contact || !unreadList || unreadList.length === 0) return false;
  const candidates = [
    contact._id,
    contact.id,
    contact.conversation?._id,
    contact.conversation,
  ].filter(Boolean).map(String);
  return candidates.some((id) => unreadList.map(String).includes(id));
};

const ChatList = ({ contacts }) => {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const { isUserTyping } = useChatStore();
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const isUserOnline = useChatStore((state) => state.isUserOnline);
  const getGroupOnlineCount = useChatStore((state) => state.getGroupOnlineCount);
  const pinnedMessages = useChatStore((state) => state.pinnedMessages);
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact,);
  const disappearingDurations = useLayoutStore((state) => state.disappearingDurations);
  const chatListScrollTop = useLayoutStore((state) => state.chatListScrollTop);
  const setChatListScrollTop = useLayoutStore((state) => state.setChatListScrollTop,);
  const listContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const { theme } = useThemeStore();
  const [searchTerms, setSearchTerms] = useState("");
  const [activeListFilter, setActiveListFilter] = useState("All");
  const [availableLists, setAvailableLists] = useState(() => getAllLists());
  const [listsRevision, setListsRevision] = useState(0);
  const [listModalContact, setListModalContact] = useState(null);
  const [listPanel, setListPanel] = useState({
    isOpen: false,
    mode: "create",
    listName: "",
  });
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const threeDotsMenuRef = useRef(null);

  const lockedChatIds = useChatStore((state) => state.lockedChatIds || []);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [viewingLockedFolder, setViewingLockedFolder] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [biometricSimulating, setBiometricSimulating] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        threeDotsMenuRef.current &&
        !threeDotsMenuRef.current.contains(e.target)
      ) {
        setShowThreeDotsMenu(false);
      }
    };
    if (showThreeDotsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showThreeDotsMenu]);
  const openNewListPanel = () => {
    setListPanel({ isOpen: true, mode: "create", listName: "" });
  };
  const openEditListPanel = (name) => {
    setListPanel({ isOpen: true, mode: "edit", listName: name });
  };
  const closeListPanel = () => {
    setListPanel((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSelectMetaAi = (initialPrompt = "") => {
    let metaAiUser = contacts?.find(
      (c) => c?.isAI || c?.username === "Meta AI" || String(c?._id) === META_AI_USER_ID
    );
    if (!metaAiUser) {
      metaAiUser = {
        _id: META_AI_USER_ID,
        username: "Meta AI",
        about: "Responses are generated by AI. Some may be inaccurate or inappropriate,including for some teens.",
        isVerified: true,
        isAI: true,
        isOnline: true,
        profilePicture: META_AI_AVATAR,
      };
    }
    setSelectedContact(metaAiUser);
    if (initialPrompt && initialPrompt.trim()) {
      setTimeout(() => {
        useChatStore.getState().sendMessage({
          receiverId: metaAiUser._id,
          content: initialPrompt.trim(),
        });
      }, 150);
    }
    setSearchTerms("");
  };

  const [showListsDropdown, setShowListsDropdown] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);
  const listsDropdownRef = useRef(null);
  const [chatlistMenu, setChatlistMenu] = useState(null);
  const [pinnedChats, setPinnedChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("whatsapp_pinned_chats") || "[]");
    } catch {
      return [];
    }
  });
  const [archivedChats, setArchivedChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("whatsapp_archived_chats") || "[]");
    } catch {
      return [];
    }
  });
  const [markedUnreadChats, setMarkedUnreadChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("whatsapp_marked_unread_chats") || "[]");
    } catch {
      return [];
    }
  });
  const [mutedChats, setMutedChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("whatsapp_muted_chats") || "{}");
    } catch {
      return {};
    }
  });
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  const [hoveredPreviewData, setHoveredPreviewData] = useState(null);
  const hoverTimerRef = useRef(null);

  const handleChatMouseEnter = (contact, lastMsg, e) => {
    if (!lastMsg) return;
    const el = e.currentTarget;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    hoverTimerRef.current = setTimeout(() => {
      const tooltipMaxWidth = 580;
      const padding = 12;
      let left = rect.left + 64;
      let top = rect.top + 26;

      if (left + tooltipMaxWidth > window.innerWidth - padding) {
        left = Math.max(padding, window.innerWidth - tooltipMaxWidth - padding);
      }

      if (top + 260 > window.innerHeight - padding) {
        top = Math.max(padding, window.innerHeight - 280);
      }

      setHoveredPreviewData({
        contact,
        lastMsg,
        coords: { left, top },
      });
    }, 180);
  };

  const handleChatMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredPreviewData(null);
  };

  useEffect(() => {
    const handlePinnedChanged = () => {
      try {
        setPinnedChats(JSON.parse(localStorage.getItem("whatsapp_pinned_chats") || "[]"));
      } catch { }
    };
    const handleArchivedChanged = () => {
      try {
        setArchivedChats(JSON.parse(localStorage.getItem("whatsapp_archived_chats") || "[]"));
      } catch { }
    };
    const handleUnreadChanged = () => {
      try {
        setMarkedUnreadChats(JSON.parse(localStorage.getItem("whatsapp_marked_unread_chats") || "[]"));
      } catch { }
    };
    const handleMutedChanged = () => {
      try {
        setMutedChats(JSON.parse(localStorage.getItem("whatsapp_muted_chats") || "{}"));
      } catch { }
    };

    window.addEventListener("whatsapp_pinned_changed", handlePinnedChanged);
    window.addEventListener("whatsapp_archived_changed", handleArchivedChanged);
    window.addEventListener("whatsapp_unread_changed", handleUnreadChanged);
    window.addEventListener("whatsapp_muted_changed", handleMutedChanged);

    return () => {
      window.removeEventListener("whatsapp_pinned_changed", handlePinnedChanged);
      window.removeEventListener("whatsapp_archived_changed", handleArchivedChanged);
      window.removeEventListener("whatsapp_unread_changed", handleUnreadChanged);
      window.removeEventListener("whatsapp_muted_changed", handleMutedChanged);
    };
  }, []);

  const [dispTick, setDispTick] = useState(0);
  useEffect(() => {
    const hasAnyDisappearing = contacts?.some((c) => {
      const lastMsg = c?.conversation?.lastMessage;
      return (
        (lastMsg?.isDisappearing && !lastMsg?.isKept) ||
        (c?.conversation?.disappearingDuration && c.conversation.disappearingDuration !== "Off")
      );
    });
    if (!hasAnyDisappearing) return;
    const interval = setInterval(() => {
      setDispTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [contacts]);

  useEffect(() => {
    const handleListsChanged = () => {
      const lists = getAllLists();
      setAvailableLists(lists);
      setListsRevision((r) => r + 1);
      setActiveListFilter((current) => {
        if (
          current === "All" ||
          current === "Unread" ||
          current === "Favourites" ||
          current === "Favorites" ||
          current === "Groups"
        ) {
          return current;
        }
        return lists.includes(current) ? current : "All";
      });
    };
    window.addEventListener("whatsapp_lists_changed", handleListsChanged);
    return () =>
      window.removeEventListener("whatsapp_lists_changed", handleListsChanged);
  }, []);

  const handleConfirmDeleteList = () => {
    if (!listToDelete) return;
    const target = listToDelete;
    const success = deleteCustomList(target);
    if (success) {
      toast.success(`List "${target}" deleted`);
      if (activeListFilter === target) {
        setActiveListFilter("All");
      }
    } else {
      toast.error("Failed to delete list");
    }
    setListToDelete(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        listsDropdownRef.current &&
        !listsDropdownRef.current.contains(e.target)
      ) {
        setShowListsDropdown(false);
      }
    };
    if (showListsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showListsDropdown]);

  const archivedCount = useMemo(() => {
    if (!contacts) return 0;
    return contacts.filter((c) => isChatArchived(c, archivedChats)).length;
  }, [contacts, archivedChats]);

  useEffect(() => {
    if (showArchivedOnly && archivedCount === 0) {
      setShowArchivedOnly(false);
    }
  }, [archivedCount, showArchivedOnly]);

  const listCounts = useMemo(() => {
    const counts = {
      All: contacts?.length || 0,
      Favourites: 0,
      Groups: 0,
      Unread: 0,
      Communities: 0,
    };
    if (!contacts) return counts;

    contacts.forEach((c) => {
      const u = c?.conversation?.unreadCount;
      const isMarked = isChatMarkedUnread(c, markedUnreadChats);
      if ((typeof u === "number" && u > 0) || isMarked) {
        counts.Unread += 1;
      }
      if (isContactInList(c, "Groups")) {
        counts.Groups += 1;
      }
      if (isContactInList(c, "Favourites") || isContactInList(c, "Favorites")) {
        counts.Favourites += 1;
      }
      if (isContactInList(c, "Communities")) {
        counts.Communities += 1;
      }
    });

    availableLists.forEach((l) => {
      if (counts[l] === undefined) {
        counts[l] = contacts.filter((c) => isContactInList(c, l)).length;
      }
    });

    return counts;
  }, [contacts, availableLists, listsRevision, markedUnreadChats]);

  const dropdownLists = useMemo(() => {
    const list = ["Communities"];
    availableLists.forEach((l) => {
      if (
        l !== "Favorites" &&
        l !== "Favourites" &&
        l !== "All" &&
        l !== "Unread" &&
        l !== "Groups" &&
        l !== "Communities" &&
        l !== "Friends" &&
        l !== "Family" &&
        l !== "Work" &&
        !list.includes(l)
      ) {
        list.push(l);
      }
    });
    return list;
  }, [availableLists]);

  const totalUnreadCount = listCounts.Unread;

  const filteredContact = useMemo(() => {
    if (!contacts) return [];
    const term = searchTerms.trim().toLowerCase();
    let list = contacts;

    const isContactLocked = (c) => {
      if (!lockedChatIds || lockedChatIds.length === 0) return false;
      const ids = [c?._id, c?.id, c?.conversation?._id, c?.conversation]
        .filter(Boolean)
        .map(String);
      return ids.some((id) => lockedChatIds.includes(id));
    };

    if (viewingLockedFolder) {
      list = list.filter(isContactLocked);
    } else {
      list = list.filter((c) => !isContactLocked(c));
    }

    if (term) {
      list = list.filter((contact) =>
        contact?.username?.toLowerCase().includes(term)
      );
    } else if (showArchivedOnly) {
      list = list.filter((contact) => isChatArchived(contact, archivedChats));
    } else {
      list = list.filter((contact) => !isChatArchived(contact, archivedChats));
    }

    if (activeListFilter !== "All") {
      if (activeListFilter === "Unread") {
        list = list.filter((contact) => {
          const u = contact?.conversation?.unreadCount;
          return (
            (typeof u === "number" && u > 0) ||
            isChatMarkedUnread(contact, markedUnreadChats)
          );
        });
      } else {
        list = list.filter((contact) =>
          isContactInList(contact, activeListFilter)
        );
      }
    }

    return [...list].sort((a, b) => {
      const isPinnedA = isChatPinned(a, pinnedChats);
      const isPinnedB = isChatPinned(b, pinnedChats);
      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;
      const pinA = getContactPin(a, pinnedMessages);
      const pinB = getContactPin(b, pinnedMessages);
      const timePinA = pinA?.pinnedAt
        ? new Date(pinA.pinnedAt).getTime()
        : pinA
          ? (a?.conversation?.updatedAt ? new Date(a.conversation.updatedAt).getTime() : 0)
          : 0;
      const timePinB = pinB?.pinnedAt
        ? new Date(pinB.pinnedAt).getTime()
        : pinB
          ? (b?.conversation?.updatedAt ? new Date(b.conversation.updatedAt).getTime() : 0)
          : 0;

      const timeA = Math.max(
        a?.conversation?.lastMessage?.createdAt
          ? new Date(a.conversation.lastMessage.createdAt).getTime()
          : (a?.conversation?.updatedAt ? new Date(a.conversation.updatedAt).getTime() : 0),
        timePinA,
        a?.conversation?.disappearingUpdatedAt ? new Date(a.conversation.disappearingUpdatedAt).getTime() : 0,
      );

      const timeB = Math.max(
        b?.conversation?.lastMessage?.createdAt
          ? new Date(b.conversation.lastMessage.createdAt).getTime()
          : (b?.conversation?.updatedAt ? new Date(b.conversation.updatedAt).getTime() : 0),
        timePinB,
        b?.conversation?.disappearingUpdatedAt ? new Date(b.conversation.disappearingUpdatedAt).getTime() : 0,
      );
      return timeB - timeA;
    });
  }, [
    contacts,
    searchTerms,
    pinnedMessages,
    activeListFilter,
    listsRevision,
    dispTick,
    pinnedChats,
    archivedChats,
    markedUnreadChats,
    showArchivedOnly,
    lockedChatIds,
    viewingLockedFolder,
  ]);

  useEffect(() => {
    if (listContainerRef.current) {
      if (chatListScrollTop > 0) {
        listContainerRef.current.scrollTop = chatListScrollTop;
      }
    }
  }, [filteredContact.length, selectedContact?._id]);

  return (
    <div
      className={`h-full w-full border-r relative overflow-hidden z-10 transition-all duration-300 flex flex-col ${theme === "dark"
        ? "bg-[#111b21] border-[#222e35] text-white"
        : "bg-white border-gray-200 text-gray-900"
        }`}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <h1 className={`text-xl font-bold tracking-tight ${theme === "dark" ? "text-[#e9edef]" : "text-[#111b21]"}`}>
          Chats
        </h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleSelectMetaAi()}
            title="Meta AI"
            className={`p-2 rounded-full transition-all cursor-pointer hover:scale-110 active:scale-95 ${theme === "dark"
              ? "hover:bg-white/10"
              : "hover:bg-black/5"
              }`}
          >
            <MetaAiRing size={20} />
          </button>
          <button
            type="button"
            onClick={() => setShowNewGroupModal(true)}
            title="New group"
            className={`p-2 rounded-full transition-colors cursor-pointer ${theme === "dark"
              ? "text-[#aebac1] hover:text-[#e9edef] hover:bg-white/10"
              : "text-[#54656f] hover:text-[#111b21] hover:bg-black/5"
              }`}
          >
            <MdOutlineChat size={20} />
          </button>
          <div className="relative" ref={threeDotsMenuRef}>
            <button
              type="button"
              onClick={() => setShowThreeDotsMenu((prev) => !prev)}
              title="Menu"
              className={`p-2 rounded-full transition-colors cursor-pointer ${showThreeDotsMenu
                ? theme === "dark"
                  ? "bg-white/10 text-[#e9edef]"
                  : "bg-black/10 text-[#111b21]"
                : theme === "dark"
                  ? "text-[#aebac1] hover:text-[#e9edef] hover:bg-white/10"
                  : "text-[#54656f] hover:text-[#111b21] hover:bg-black/5"
                }`}
            >
              <HiDotsVertical size={19} />
            </button>

            <AnimatePresence>
              {showThreeDotsMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className={`absolute right-0 top-full mt-2 z-50 min-w-[190px] rounded-2xl shadow-2xl border p-1.5 select-none ${theme === "dark"
                    ? "bg-[#233138] border-white/10 text-[#e9edef] shadow-black/80"
                    : "bg-white border-gray-200 text-gray-900 shadow-xl"
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowThreeDotsMenu(false);
                      setShowNewGroupModal(true);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl cursor-pointer transition-colors ${theme === "dark"
                      ? "hover:bg-[#182229] text-[#e9edef]"
                      : "hover:bg-gray-100 text-gray-800"
                      }`}
                  >
                    <FaUsers size={16} className="text-[#00a884] shrink-0" />
                    <span className="font-medium">New group</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowThreeDotsMenu(false);
                      openNewListPanel();
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl cursor-pointer transition-colors ${theme === "dark"
                      ? "hover:bg-[#182229] text-[#e9edef]"
                      : "hover:bg-gray-100 text-gray-800"
                      }`}
                  >
                    <MdList size={18} className="text-[#00a884] shrink-0" />
                    <span>New list</span>
                  </button>

                  {lockedChatIds && lockedChatIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowThreeDotsMenu(false);
                        setShowLockedModal(true);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl cursor-pointer transition-colors ${theme === "dark"
                        ? "hover:bg-[#182229] text-[#e9edef]"
                        : "hover:bg-gray-100 text-gray-800"
                        }`}
                    >
                      <FaLock size={14} className="text-amber-500 shrink-0" />
                      <span>Locked chats</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowThreeDotsMenu(false);
                      navigate("/setting");
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl cursor-pointer transition-colors ${theme === "dark"
                      ? "hover:bg-[#182229] text-[#e9edef]"
                      : "hover:bg-gray-100 text-gray-800"
                      }`}
                  >
                    <span className="text-gray-400 font-bold shrink-0 text-sm">⚙️</span>
                    <span>Settings</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="px-3 pt-1 pb-2 relative z-30">
        <div
          className={`flex items-center gap-3 px-4 py-2 rounded-full border-2 transition-all duration-200 ${theme === "dark"
            ? "bg-[#161a1d] text-[#e9edef] border-[#00c878]"
            : "bg-[#f0f2f5] text-[#111b21] border-[#00a884]"
            }`}
        >
          <FaSearch className={`shrink-0 ${theme === "dark" ? "text-[#aebac1]" : "text-[#54656f]"
            }`}
            size={16}
          />

          <input
            ref={searchInputRef}
            type="text"
            placeholder="Ask Meta AI or Search"
            className={`w-full bg-transparent text-[14px] outline-none border-none ${theme === "dark"
              ? "text-[#e9edef] placeholder:text-[#aebac1]"
              : "text-[#111b21] placeholder:text-[#54656f]"
              }`}
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchTerms.trim()) {
                e.preventDefault();
                handleSelectMetaAi(searchTerms);
              }
            }}
          />

          {searchTerms ? (
            <button
              type="button"
              onClick={() => setSearchTerms("")}
              className={`p-1 rounded-full transition-colors cursor-pointer ${theme === "dark"
                ? "text-[#8696a0] hover:bg-white/10 hover:text-white"
                : "text-[#54656f] hover:bg-black/10 hover:text-[#111b21]"
                }`}
              title="Clear search"
            >
              <RxCross2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSelectMetaAi()}
              title="Ask Meta AI"
              className="p-1 rounded-full hover:scale-110 active:scale-95 transition-transform cursor-pointer shrink-0"
            >
              <MetaAiRing size={19} />
            </button>
          )}
        </div>

        {searchTerms.trim() && (
          <div
            className={`absolute left-3 right-3 top-[48px] rounded-2xl shadow-2xl border p-2 z-50 flex flex-col gap-1 backdrop-blur-md animate-in fade-in duration-150 ${theme === "dark"
              ? "bg-[#202c33]/98 border-gray-700/80 text-white"
              : "bg-white/98 border-gray-200 text-gray-900"
              }`}
          >
            <button
              type="button"
              onClick={() => handleSelectMetaAi(searchTerms)}
              className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <MetaAiRing size={22} />
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-semibold text-[#00a884] dark:text-[#25d366] block">
                  Ask Meta AI
                </span>
                <span className="text-[12px] opacity-80 truncate block">
                  "{searchTerms}"
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMetaAi(`/imagine ${searchTerms}`)}
              className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-[12px] font-bold shadow-xs">
                🎨
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-semibold text-purple-400 block">
                  Imagine with Meta AI
                </span>
                <span className="text-[12px] opacity-80 truncate block">
                  "/imagine {searchTerms}"
                </span>
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="px-3 pb-2 pt-0.5 flex items-center justify-between gap-1.5 select-none border-b border-black/[0.06] dark:border-white/5 relative z-20">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setActiveListFilter("All")}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all shrink-0 cursor-pointer ${activeListFilter === "All"
              ? theme === "dark"
                ? "bg-[#0a332c] text-[#00a884] font-medium border border-[#00a884]/25 shadow-xs"
                : "bg-[#008069] text-white font-medium shadow-xs"
              : theme === "dark"
                ? "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
                : "bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21] hover:bg-[#e9edef]"
              }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setActiveListFilter("Favourites")}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${activeListFilter === "Favourites" || activeListFilter === "Favorites"
              ? theme === "dark"
                ? "bg-[#0a332c] text-[#00a884] font-medium border border-[#00a884]/25 shadow-xs"
                : "bg-[#008069] text-white font-medium shadow-xs"
              : theme === "dark"
                ? "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
                : "bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21] hover:bg-[#e9edef]"
              }`}
          >
            <span>Favourites</span>
            {listCounts.Favourites > 0 && (
              <span className="text-[13px] font-normal">{listCounts.Favourites}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveListFilter("Groups")}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${activeListFilter === "Groups"
              ? theme === "dark"
                ? "bg-[#0a332c] text-[#00a884] font-medium border border-[#00a884]/25 shadow-xs"
                : "bg-[#008069] text-white font-medium shadow-xs"
              : theme === "dark"
                ? "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
                : "bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21] hover:bg-[#e9edef]"
              }`}
          >
            <span>Groups</span>
            {listCounts.Groups > 0 && (
              <span className="text-[13px] font-normal">{listCounts.Groups}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveListFilter("Unread")}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${activeListFilter === "Unread"
              ? theme === "dark"
                ? "bg-[#0a332c] text-[#00a884] font-medium border border-[#00a884]/25 shadow-xs"
                : "bg-[#008069] text-white font-medium shadow-xs"
              : theme === "dark"
                ? "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
                : "bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21] hover:bg-[#e9edef]"
              }`}
          >
            <span>Unread</span>
            {listCounts.Unread > 0 && (
              <span className="text-[13px] font-normal">{listCounts.Unread}</span>
            )}
          </button>

          {dropdownLists.includes(activeListFilter) && (
            <div
              className={`pl-3.5 pr-2 py-1 rounded-full text-[13px] font-medium transition-all shrink-0 flex items-center gap-1.5 ${theme === "dark"
                ? "bg-[#0a332c] text-[#00a884] font-medium border border-[#00a884]/25 shadow-xs"
                : "bg-[#008069] text-white font-medium shadow-xs"
                }`}
            >
              <span>{activeListFilter}</span>
              {listCounts[activeListFilter] > 0 && (
                <span className="text-[13px] font-normal">
                  {listCounts[activeListFilter]}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditListPanel(activeListFilter);
                }}
                className={`p-1 rounded-full transition-colors cursor-pointer ${theme === "dark"
                  ? "hover:bg-[#00a884]/20 text-[#00a884]/80 hover:text-white"
                  : "hover:bg-white/20 text-white/80 hover:text-white"
                  }`}
                title={`Edit list "${activeListFilter}"`}
              >
                <MdEdit size={12} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setListToDelete(activeListFilter);
                }}
                className={`p-1 rounded-full transition-colors cursor-pointer ${theme === "dark"
                  ? "hover:bg-[#00a884]/20 text-[#00a884]/80 hover:text-red-400"
                  : "hover:bg-white/20 text-white/80 hover:text-red-200"
                  }`}
                title={`Delete list "${activeListFilter}"`}
              >
                <RiDeleteBin6Line size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="relative shrink-0 flex items-center" ref={listsDropdownRef}>
          <button
            type="button"
            onClick={() => setShowListsDropdown((prev) => !prev)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${showListsDropdown || dropdownLists.includes(activeListFilter)
              ? theme === "dark"
                ? "bg-[#2a3942] text-[#e9edef]"
                : "bg-[#e9edef] text-[#111b21]"
              : theme === "dark"
                ? "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
                : "bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21] hover:bg-[#e9edef]"
              }`}
            title="More lists"
          >
            <FaCaretDown
              size={11}
              className={`transition-transform duration-200 ${showListsDropdown ? "rotate-180" : ""
                }`}
            />
          </button>

          <AnimatePresence>
            {showListsDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className={`absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-2xl shadow-2xl border p-1.5 select-none ${theme === "dark"
                  ? "bg-[#233138] border-white/10 text-[#e9edef] shadow-black/80"
                  : "bg-white border-gray-200 text-gray-900 shadow-xl"
                  }`}
              >
                {dropdownLists.map((listName) => {
                  const count = listCounts[listName] !== undefined ? listCounts[listName] : 0;
                  const isCustom = listName !== "Communities";
                  const isActive = activeListFilter === listName;

                  return (
                    <div
                      key={listName}
                      onClick={() => {
                        setActiveListFilter(listName);
                        setShowListsDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-[14px] rounded-xl cursor-pointer transition-colors group ${isActive
                        ? "text-[#00a884] bg-[#0a332c]/50 font-medium"
                        : theme === "dark"
                          ? "text-[#e9edef] hover:bg-[#182229]"
                          : "text-gray-800 hover:bg-gray-100"
                        }`}
                    >
                      <span className="truncate pr-3 font-normal">{listName}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {count > 0 && (
                          <span className={`text-[13px] font-normal ${theme === "dark" ? "text-[#e9edef]" : "text-gray-600"}`}>
                            {count}
                          </span>
                        )}
                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setListToDelete(listName);
                              setShowListsDropdown(false);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 -mr-1 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                            title={`Delete list "${listName}"`}
                          >
                            <RiDeleteBin6Line size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div
                  className={`border-t my-1 mx-2 ${theme === "dark" ? "border-white/10" : "border-gray-200"
                    }`}
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowListsDropdown(false);
                    openNewListPanel();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 text-[14px] rounded-xl cursor-pointer transition-colors ${theme === "dark"
                    ? "text-[#e9edef] hover:bg-[#182229]"
                    : "text-gray-800 hover:bg-gray-100"
                    }`}
                >
                  <FaPlus size={12} className={theme === "dark" ? "text-[#e9edef]" : "text-gray-700"} />
                  <span className="font-normal">New list</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div
        ref={listContainerRef}
        onScroll={(e) => {
          setChatListScrollTop(e.target.scrollTop);
          if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
          }
          if (hoveredPreviewData) setHoveredPreviewData(null);
        }}
        className="overflow-y-auto flex-1 custom-scrollbar"
      >
        {viewingLockedFolder ? (
          <div
            onClick={() => setViewingLockedFolder(false)}
            className={`mx-2 my-1.5 px-3 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${theme === "dark"
              ? "bg-[#202c33] text-[#e9edef] border border-amber-500/30"
              : "bg-amber-50 text-[#111b21] border border-amber-200"
              }`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewingLockedFolder(false)}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full cursor-pointer text-amber-500"
                title="Back to all chats"
              >
                <ArrowLeftIcon size={18} />
              </button>
              <span className="font-semibold text-[15px] flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <FaLock size={14} />
                <span>Locked Chats ({lockedChatIds.length})</span>
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewingLockedFolder(false);
              }}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Lock folder 🔒
            </button>
          </div>
        ) : (
          lockedChatIds && lockedChatIds.length > 0 && !searchTerms && activeListFilter === "All" && !showArchivedOnly && (
            <div
              onClick={() => setShowLockedModal(true)}
              className={`mx-2 my-1 px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all border border-transparent hover:border-amber-500/30 group ${theme === "dark"
                ? "hover:bg-[#202c33] text-[#e9edef]"
                : "hover:bg-[#f5f6f6] text-[#111b21]"
                }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0 group-hover:scale-105 transition-transform">
                  <FaLock size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-[15px] flex items-center gap-1.5">
                    <span>Locked chats</span>
                  </span>
                  <span className="text-[11px] text-gray-400">PIN or Fingerprint to unlock</span>
                </div>
              </div>
              <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                {lockedChatIds.length}
              </span>
            </div>
          )
        )}

        {archivedCount > 0 && !searchTerms && activeListFilter === "All" && (
          showArchivedOnly ? (
            <div
              onClick={() => setShowArchivedOnly(false)}
              className={`mx-2 my-1 px-3 py-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${theme === "dark"
                ? "hover:bg-[#202c33] text-[#e9edef]"
                : "hover:bg-[#f5f6f6] text-[#111b21]"
                }`}
            >
              <button
                type="button"
                onClick={() => setShowArchivedOnly(false)}
                className="p-1 hover:bg-white/10 rounded-full cursor-pointer"
                title="Back to all chats"
              >
                <ArrowLeftIcon size={18} />
              </button>
              <span className="font-semibold text-[15px]">
                Archived ({archivedCount})
              </span>
            </div>
          ) : (
            <div
              onClick={() => setShowArchivedOnly(true)}
              className={`mx-2 my-1 px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${theme === "dark"
                ? "hover:bg-[#202c33] text-[#e9edef]"
                : "hover:bg-[#f5f6f6] text-[#111b21]"
                }`}
            >
              <div className="flex items-center gap-3.5">
                <ArchivedBoxIcon size={19} className="text-[#00a884] shrink-0" />
                <span className="font-medium text-[15px]">Archived</span>
              </div>
              <span className="text-xs text-[#00a884] font-semibold">{archivedCount}</span>
            </div>
          )
        )}

        {filteredContact.length === 0 ? (
          activeListFilter !== "All" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-full text-center px-6 py-12 select-none"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/20 shadow-md">
                <MdList size={30} />
              </div>

              <h2 className={`text-lg font-semibold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {activeListFilter === "Unread"
                  ? "No unread chats"
                  : `No chats in ${activeListFilter}`}
              </h2>

              <p className="text-xs text-[#8696a0] max-w-[220px] mb-4 leading-relaxed">
                {activeListFilter === "Unread"
                  ? "You don't have any unread messages."
                  : "Add chats to this list to easily find and message them here."}
              </p>

              {activeListFilter !== "Unread" && activeListFilter !== "Groups" && (
                <button
                  type="button"
                  onClick={() => openEditListPanel(activeListFilter)}
                  className="px-4 py-2 rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Add chats
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-full text-center px-6"
            >
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-full blur-xl bg-green-500/20"></div>
                <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-500 shadow-lg animate-pulse">
                  <FaSearch className="text-white text-xl" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                No chats found
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[220px] leading-relaxed">
                Try searching with a different name or start a new conversation.
              </p>
            </motion.div>
          )
        ) : (
          filteredContact.map((contact) => {
            const conversationId = contact?.conversation?._id;
            const isTyping = isUserTyping(conversationId, contact?._id);
            const contactPin = getContactPin(contact, pinnedMessages);
            const isGroup = Boolean(
              contact?.isGroup ||
              contact?.isGroupChat ||
              contact?.conversation?.isGroup ||
              (contact?.conversation?.participants && contact.conversation.participants.length > 2)
            );
            const isMetaAi = Boolean(
              contact?.isAI ||
              contact?.username === "Meta AI" ||
              String(contact?._id) === META_AI_USER_ID
            );
            let isContactOnline = false;
            let groupOnlineCount = 0;
            if (isGroup) {
              const participants =
                contact?.participants ||
                contact?.conversation?.participants ||
                [];
              groupOnlineCount = getGroupOnlineCount ? getGroupOnlineCount(participants, user?._id) : 0;
              isContactOnline = groupOnlineCount > 0;
            } else if (!isMetaAi) {
              isContactOnline = isUserOnline ? isUserOnline(contact?._id) : false;
            }
            const convId = (contact?.conversation?._id || contact?.conversation)?.toString();
            const contactId = contact?._id?.toString();
            const disappearingDuration =
              (convId && disappearingDurations?.[convId]) ||
              (contactId && disappearingDurations?.[contactId]) ||
              contact?.conversation?.disappearingDuration ||
              "Off";
            const hasDisappearing = disappearingDuration && disappearingDuration !== "Off";
            const lastMsg = contact?.conversation?.lastMessage;
            const preview = getLastMessagePreview(lastMsg);
            const lastMsgTime = lastMsg?.createdAt
              ? new Date(lastMsg.createdAt).getTime()
              : (contact?.conversation?.updatedAt ? new Date(contact.conversation.updatedAt).getTime() : 0);
            const pinTime = contactPin?.pinnedAt
              ? new Date(contactPin.pinnedAt).getTime()
              : contactPin
                ? (contact?.conversation?.updatedAt ? new Date(contact.conversation.updatedAt).getTime() : Date.now())
                : 0;
            const disappearingTime = contact?.conversation?.disappearingUpdatedAt
              ? new Date(contact.conversation.disappearingUpdatedAt).getTime()
              : 0;
            const latestTimestamp = Math.max(lastMsgTime, pinTime, disappearingTime);
            return (
              <motion.div
                key={contact._id}
                data-contact-id={contact._id}
                onMouseEnter={(e) => handleChatMouseEnter(contact, lastMsg, e)}
                onMouseLeave={handleChatMouseLeave}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setChatlistMenu({
                    contact,
                    coords: {
                      x: e.clientX,
                      y: e.clientY,
                      isContextMenu: true,
                    },
                  });
                }}
                onClick={() => {
                  setSelectedContact(contact);
                  useChatStore.getState().clearUnreadCount(contact._id);
                  if (contact?.conversation?._id) {
                    useChatStore.getState().clearUnreadCount(contact.conversation._id);
                  }
                  try {
                    const key = (contact.conversation?._id || contact._id)?.toString();
                    const marked = JSON.parse(
                      localStorage.getItem("whatsapp_marked_unread_chats") || "[]"
                    );
                    if (marked.includes(key) || marked.includes(String(contact._id))) {
                      const next = marked.filter(
                        (id) => id !== key && id !== String(contact._id)
                      );
                      localStorage.setItem(
                        "whatsapp_marked_unread_chats",
                        JSON.stringify(next)
                      );
                      window.dispatchEvent(new Event("whatsapp_unread_changed"));
                    }
                  } catch { }
                }}
                className={`mx-2 my-0.5 p-2.5 rounded-xl flex items-center cursor-pointer transition-colors relative group ${chatlistMenu?.contact?._id === contact._id
                  ? theme === "dark"
                    ? "bg-[#202c33]"
                    : "bg-[#f5f6f6]"
                  : theme === "dark"
                    ? selectedContact?._id === contact._id
                      ? "bg-[#2a3942]"
                      : "hover:bg-[#202c33]"
                    : selectedContact?._id === contact._id
                      ? "bg-[#e9edef]"
                      : "hover:bg-[#f5f6f6]"
                  }`}
              >
                <div className="relative shrink-0">
                  <ContactAvatar contact={contact} />
                  {isContactOnline && !isMetaAi && (
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 ${theme === "dark" ? "border-[#111b21]" : "border-white"
                        } bg-emerald-500 shadow-sm`}
                      title={isGroup ? `${groupOnlineCount} online` : "Online"}
                    />
                  )}
                  {hasDisappearing && disappearingDuration !== "Off" && (
                    <span
                      className={`absolute bottom-0 ${isContactOnline && !isMetaAi ? "left-0" : "right-0"} w-4 h-4 rounded-full border ${theme === "dark" ? "border-[#111b21] bg-[#202c33]" : "border-white bg-[#f0f2f5]"
                        } flex items-center justify-center text-[#8696a0] shadow-sm`}
                      title={`Disappearing messages: ${disappearingDuration}`}
                    >
                      <WhatsAppDisappearingIcon size={10} />
                    </span>
                  )}
                </div>

                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h2
                        title={`Chat with ${contact?.username || "user"}`}
                        className={`font-medium text-[16px] truncate ${theme === "dark" ? "text-[#e9edef]" : "text-[#111b21]"}`}
                      >
                        {contact?.username}
                      </h2>
                    </div>
                    {(contact?.conversation || contactPin || hasDisappearing) && (
                      <span
                        className={`text-[12px] shrink-0 ${theme === "dark" ? "text-[#8696a0]" : "text-[#667781]"}`}
                      >
                        {formatTimestamp(
                          latestTimestamp ||
                          contactPin?.pinnedAt ||
                          contact?.conversation?.lastMessage?.scheduledFor ||
                          contact?.conversation?.lastMessage?.createdAt,
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <div
                      className={`text-sm flex items-center gap-1.5 min-w-0 flex-1 truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                    >
                      {(() => {
                        if (isTyping) {
                          const isAi = contact?.isAI || contact?.username === "Meta AI" || String(contact?._id) === META_AI_USER_ID;
                          return (
                            <span className="font-medium text-emerald-500 flex-shrink-0">
                              {isAi ? "Meta AI is thinking..." : "typing..."}
                            </span>
                          );
                        }

                        if (!lastMsg && (contact?.isAI || contact?.username === "Meta AI" || String(contact?._id) === META_AI_USER_ID)) {
                          return (
                            <span className="text-[13px] opacity-75 truncate">
                              Ask me anything, imagine images...
                            </span>
                          );
                        }

                        if (
                          disappearingTime > 0 &&
                          disappearingTime > lastMsgTime &&
                          disappearingTime >= pinTime
                        ) {
                          const currentUserId = (user?._id || user?.id)?.toString();
                          const setById = (
                            contact?.conversation?.disappearingSetBy?._id ||
                            contact?.conversation?.disappearingSetBy
                          )?.toString();
                          const isSetByMe = Boolean(currentUserId && setById && setById === currentUserId);
                          const isOff = disappearingDuration === "Off";
                          const dispText = isSetByMe
                            ? (isOff ? "You turned off disappearing messages. Tap to change." : "You turned on disappearing messages. Tap to change.")
                            : (isOff ? `${contact?.username || "Contact"} turned off disappearing messages. Tap to change.` : `${contact?.username || "Contact"} turned on disappearing messages. Tap to change.`);

                          return (
                            <span className="flex items-center gap-1.5 truncate text-[#8696a0]">
                              {isOff ? null : (
                                <WhatsAppDisappearingIcon size={12} className="inline shrink-0 text-[#8696a0]" />
                              )}
                              <span className="truncate">{dispText}</span>
                            </span>
                          );
                        }

                        if (contactPin && (pinTime >= lastMsgTime || !preview)) {
                          const currentUserId = (user?._id || user?.id)?.toString();
                          const participants =
                            contact?.participants ||
                            contact?.conversation?.participants ||
                            [];
                          const isGroup = Boolean(
                            contact?.isGroup ||
                            contact?.isGroupChat ||
                            contact?.conversation?.isGroup ||
                            (contact?.conversation?.participants && contact.conversation.participants.length > 2)
                          );
                          const { text: pinText } = getPinActorAndLabel(
                            contactPin,
                            currentUserId,
                            isGroup ? "Someone" : contact?.username,
                            participants,
                          );

                          return (
                            <span className="flex items-center gap-1.5 truncate text-[#8696a0]">
                              <WhatsAppPinIcon size={12} className="inline shrink-0 text-[#8696a0]" />
                              <span className="truncate">{pinText}</span>
                            </span>
                          );
                        }

                        if (preview && (preview.text || preview.icon)) {
                          const currentUserId = (user?._id || user?.id)?.toString();
                          const lastMsgSenderId = (
                            lastMsg?.sender?._id ||
                            lastMsg?.sender
                          )?.toString();
                          const isLastMsgFromMe = Boolean(
                            currentUserId &&
                            lastMsgSenderId &&
                            lastMsgSenderId === currentUserId
                          );

                          return (
                            <>
                              {hasDisappearing && (
                                <WhatsAppDisappearingIcon
                                  size={12}
                                  className="inline mr-1 text-[#8696a0] shrink-0"
                                  title={`Disappearing messages: ${disappearingDuration}`}
                                />
                              )}
                              {isLastMsgFromMe &&
                                !preview.isDeleted &&
                                !preview.isSystem &&
                                !isGroupSystemMessage(lastMsg) &&
                                (() => {
                                  const status = lastMsg?.messageStatus || lastMsg?.status;
                                  if (!status || status === "pending" || status === "sending" || lastMsg?.isPending) {
                                    return (
                                      <MdAccessTime
                                        size={11}
                                        className="inline mr-1 text-[#8696a0] shrink-0"
                                        title="Sending"
                                      />
                                    );
                                  }

                                  const isGroupChat = Boolean(
                                    contact?.isGroup ||
                                    contact?.isGroupChat ||
                                    contact?.conversation?.isGroup ||
                                    (!lastMsg?.receiver &&
                                      (contact?.participants?.length > 2 ||
                                        contact?.conversation?.participants?.length > 2))
                                  );

                                  if (isGroupChat) {
                                    const rawParticipants =
                                      contact?.participants ||
                                      contact?.conversation?.participants ||
                                      [];
                                    const otherParticipants = rawParticipants
                                      .map((p) => (p?._id || p?.userId || p?.id || p)?.toString())
                                      .filter((pId) => Boolean(pId) && pId !== currentUserId);

                                    if (otherParticipants.length > 0) {
                                      const readIds = new Set(
                                        (lastMsg?.readBy || []).map((r) =>
                                          (r?.user?._id || r?.user || r?.userId || r)?.toString()
                                        )
                                      );
                                      const deliveredIds = new Set(
                                        (lastMsg?.deliveredTo || []).map((d) =>
                                          (d?.user?._id || d?.user || d?.userId || d)?.toString()
                                        )
                                      );

                                      const allRead =
                                        otherParticipants.length > 0 &&
                                        otherParticipants.every((pId) => readIds.has(pId));

                                      if (allRead) {
                                        return (
                                          <FaCheckDouble
                                            size={12}
                                            className="inline mr-1 text-[#53bdeb] shrink-0"
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
                                          <FaCheckDouble size={12} className="inline mr-1 text-[#8696a0] shrink-0" title="Delivered to all" />
                                        );
                                      }
                                      return (
                                        <FiCheck size={13} className="inline mr-1 text-[#8696a0] shrink-0" title="Sent" />
                                      );
                                    }

                                    return (
                                      <FiCheck size={13} className="inline mr-1 text-[#8696a0] shrink-0" title="Sent" />
                                    );
                                  }
                                  if (status === "read") {
                                    return (
                                      <FaCheckDouble size={12} className="inline mr-1 text-[#53bdeb] shrink-0" title="Read" />
                                    );
                                  }
                                  if (status === "delivered") {
                                    return (
                                      <FaCheckDouble size={12} className="inline mr-1 text-[#8696a0] shrink-0" title="Delivered" />
                                    );
                                  }
                                  if (status === "send" || status === "sent") {
                                    return (
                                      <FiCheck size={13} className="inline mr-1 text-[#8696a0] shrink-0" title="Sent" />
                                    );
                                  }
                                  return (
                                    <FiCheck size={13} className="inline mr-1 text-[#8696a0] shrink-0" title="Sent" />
                                  );
                                })()}
                              {preview.icon}
                              <span
                                className={`truncate ${preview.isDeleted ? "italic opacity-80" : ""}`}
                              >
                                {!isLastMsgFromMe &&
                                  !preview.isSystem &&
                                  !isGroupSystemMessage(lastMsg) &&
                                  (contact.isGroup || contact.isGroupChat || contact.conversation?.isGroup) &&
                                  lastMsg?.sender?.username ? (
                                  <span className="font-medium text-[#111b21] dark:text-[#e9edef] mr-1">
                                    {lastMsg.sender.username}:
                                  </span>
                                ) : null}
                                {preview.text}
                              </span>
                              {lastMsg?.edited && (
                                <span className={`flex-shrink-0 text-[11px] italic mt-0.5 ${theme === "dark" ? "text-gray-500/80" : "text-gray-400"}`}>
                                  edited
                                </span>
                              )}
                            </>
                          );
                        }

                        if (contactPin) {
                          const currentUserId = (user?._id || user?.id)?.toString();
                          const participants =
                            contact?.participants ||
                            contact?.conversation?.participants ||
                            [];
                          const isGroup = Boolean(
                            contact?.isGroup ||
                            contact?.isGroupChat ||
                            contact?.conversation?.isGroup ||
                            (contact?.conversation?.participants && contact.conversation.participants.length > 2)
                          );
                          const { text: pinText } = getPinActorAndLabel(
                            contactPin,
                            currentUserId,
                            isGroup ? "Someone" : contact?.username,
                            participants,
                          );

                          return (
                            <span className="flex items-center gap-1.5 truncate text-[#8696a0]">
                              <WhatsAppPinIcon size={12} className="inline shrink-0 text-[#8696a0]" />
                              <span className="truncate">{pinText}</span>
                            </span>
                          );
                        }

                        if (hasDisappearing) {
                          const currentUserId = (user?._id || user?.id)?.toString();
                          const setById = (
                            contact?.conversation?.disappearingSetBy?._id ||
                            contact?.conversation?.disappearingSetBy
                          )?.toString();
                          const isSetByMe = Boolean(currentUserId && setById && setById === currentUserId);
                          const isOff = disappearingDuration === "Off";
                          const dispText = isSetByMe
                            ? (isOff ? "You turned off disappearing messages. Tap to change." : "You turned on disappearing messages. Tap to change.")
                            : (isOff ? `${contact?.username || "Contact"} turned off disappearing messages. Tap to change.` : `${contact?.username || "Contact"} turned on disappearing messages. Tap to change.`);

                          return (
                            <span className="flex items-center gap-1.5 truncate text-[#8696a0]">
                              {isOff ? null : (
                                <WhatsAppDisappearingIcon size={12} className="inline shrink-0 text-[#8696a0]" />
                              )}
                              <span className="truncate">{dispText}</span>
                            </span>
                          );
                        }

                        return (
                          <span className="italic opacity-70">
                            No messages yet
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setChatlistMenu({
                            contact,
                            coords: {
                              x: rect.right,
                              y: rect.bottom + 4,
                              isContextMenu: false,
                            },
                          });
                        }}
                        className={`p-1.5 rounded-full transition-all cursor-pointer ${chatlistMenu?.contact?._id === contact._id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                          } hover:scale-110 ${theme === "dark"
                            ? "hover:bg-white/10 text-[#8696a0] hover:text-[#00a884]"
                            : "hover:bg-gray-200 text-gray-500 hover:text-[#00a884]"
                          }`}
                        title="Menu"
                      >
                        <MdOutlineKeyboardArrowDown size={18} />
                      </button>

                      {getContactListNames(contact).includes("Favorites") && (
                        <FaHeart size={11} className="text-rose-400 shrink-0" title="Favorite" />
                      )}
                      {isChatMuted(contact, mutedChats) && (
                        <MutedBellIcon size={13} className="text-[#8696a0] shrink-0" title="Notifications muted" />
                      )}
                      {(isChatPinned(contact, pinnedChats) || contactPin) && (
                        <WhatsAppPinIcon size={13} className="text-[#8696a0] shrink-0" title="Pinned" />
                      )}
                      {(() => {
                        const isCurrentOpen = Boolean(
                          selectedContact?._id &&
                          (String(contact?._id) === String(selectedContact._id) ||
                            (contact?.conversation?._id &&
                              selectedContact?.conversation?._id &&
                              String(contact.conversation._id) === String(selectedContact.conversation._id)) ||
                            (contact?.isGroup &&
                              selectedContact?.isGroup &&
                              String(contact.conversation?._id || contact._id) ===
                              String(selectedContact.conversation?._id || selectedContact._id)))
                        );

                        if (isCurrentOpen) {
                          return null;
                        }

                        const isMarked = isChatMarkedUnread(contact, markedUnreadChats);
                        const unread = contact?.conversation?.unreadCount;
                        const currentUserId = user?._id?.toString();
                        const lastMsgSenderId = (
                          contact?.conversation?.lastMessage?.sender?._id ||
                          contact?.conversation?.lastMessage?.sender
                        )?.toString();
                        const isSenderOfLast = Boolean(
                          currentUserId &&
                          lastMsgSenderId &&
                          lastMsgSenderId === currentUserId
                        );

                        const hasMentionInChat = (() => {
                          const isGroup = Boolean(
                            contact?.isGroup ||
                            contact?.isGroupChat ||
                            contact?.conversation?.isGroup ||
                            (contact?.conversation?.participants && contact.conversation.participants.length > 2)
                          );
                          if (!isGroup) return false;
                          const myUsername = (user?.username || user?.name || "")?.toLowerCase();
                          const lastContent = (contact?.conversation?.lastMessage?.content || "").toLowerCase();
                          return Boolean(
                            lastContent.includes("@all") ||
                            lastContent.includes("@everyone") ||
                            (myUsername && lastContent.includes(`@${myUsername}`))
                          );
                        })();

                        if (!isSenderOfLast && unread && unread > 0) {
                          return (
                            <div className="flex items-center gap-1 shrink-0">
                              {hasMentionInChat && (
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-bold ${theme === "dark"
                                    ? "bg-[#00a884]/20 text-[#00a884]"
                                    : "bg-[#00a884]/15 text-[#00897b]"
                                    }`}
                                  title="You or everyone were mentioned"
                                >
                                  @
                                </span>
                              )}
                              <p className="w-5 h-5 rounded-full bg-[#25d366] flex items-center justify-center text-[11px] font-bold text-[#111b21] shrink-0">
                                {unread}
                              </p>
                            </div>
                          );
                        }

                        if (!isSenderOfLast && hasMentionInChat) {
                          return (
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${theme === "dark"
                                ? "bg-[#00a884]/20 text-[#00a884]"
                                : "bg-[#00a884]/15 text-[#00897b]"
                                }`}
                              title="You or everyone were mentioned"
                            >
                              @
                            </span>
                          );
                        }

                        if (isMarked) {
                          return (
                            <span
                              className="w-2.5 h-2.5 rounded-full bg-[#25d366] shrink-0 inline-block shadow-xs"
                              title="Unread"
                            />
                          );
                        }

                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {chatlistMenu && (
        <ChatlistMenu
          isOpen={Boolean(chatlistMenu)}
          onClose={() => setChatlistMenu(null)}
          contact={chatlistMenu.contact}
          anchorCoords={chatlistMenu.coords}
          onOpenAddToList={() => setListModalContact(chatlistMenu.contact)}
          onOpenNewList={openNewListPanel}
        />
      )}

      {listModalContact && (
        <AddToListModal
          isOpen={Boolean(listModalContact)}
          onClose={() => setListModalContact(null)}
          contact={listModalContact}
        />
      )}

      <ListPanelOverChatList
        isOpen={listPanel.isOpen}
        mode={listPanel.mode}
        initialListName={listPanel.listName}
        contacts={contacts || []}
        onClose={closeListPanel}
        onSaved={(name) => setActiveListFilter(name)}
        theme={theme}
      />

      <AnimatePresence>
        {listToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl border ${theme === "dark"
                ? "bg-[#222e35] border-white/10 text-[#e9edef]"
                : "bg-white border-gray-200 text-[#111b21]"
                }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
                  <RiDeleteBin6Line size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold">Delete list?</h3>
                  <p className="text-[13px] text-[#8696a0]">
                    "{listToDelete}"
                  </p>
                </div>
              </div>
              <p className={`text-[13.5px] mb-5 leading-relaxed ${theme === "dark" ? "text-[#8696a0]" : "text-gray-600"
                }`}
              >
                Chats in this list won't be deleted, only the list filter will be removed.
              </p>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setListToDelete(null)}
                  className={`px-4 py-2 rounded-full text-[13.5px] font-medium transition-colors cursor-pointer ${theme === "dark"
                    ? "bg-white/5 hover:bg-white/10 text-[#e9edef]"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteList}
                  className="px-4 py-2 rounded-full text-[13.5px] font-medium bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {hoveredPreviewData && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <ChatHoverPreview
            contact={hoveredPreviewData.contact}
            lastMsg={hoveredPreviewData.lastMsg}
            coords={hoveredPreviewData.coords}
            theme={theme}
            currentUserId={user?._id || user?.id}
          />
        </AnimatePresence>,
        document.body
      )}

      {showLockedModal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
          onClick={() => {
            setShowLockedModal(false);
            setPinInput("");
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-[340px] max-w-full rounded-2xl p-6 shadow-2xl border flex flex-col items-center text-center ${theme === "dark"
              ? "bg-[#233138] border-white/10 text-white"
              : "bg-white border-gray-100 text-gray-900"
              }`}
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 text-2xl mb-3 shadow-inner">
              <FaLock />
            </div>

            <h3 className="font-bold text-lg mb-1">Locked Chats</h3>
            <p className="text-xs text-gray-400 mb-5">
              Enter your 4-digit PIN (default: <strong>1234</strong>) or use Touch ID to unlock.
            </p>

            <div className="flex items-center gap-3 mb-6">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${pinInput.length > idx
                    ? "bg-amber-500 border-amber-500 scale-110"
                    : "border-gray-400/50"
                    } ${pinError ? "border-red-500" : ""}`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5 w-full mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (pinInput.length < 4) {
                      const next = pinInput + num;
                      setPinInput(next);
                      if (next.length === 4) {
                        if (next === "1234") {
                          setViewingLockedFolder(true);
                          setShowLockedModal(false);
                          setPinInput("");
                          toast.success("🔓 Chats unlocked!");
                        } else {
                          setPinError(true);
                          setTimeout(() => {
                            setPinError(false);
                            setPinInput("");
                          }, 600);
                        }
                      }
                    }
                  }}
                  className="h-12 rounded-xl text-base font-semibold border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setBiometricSimulating(true);
                  setTimeout(() => {
                    setBiometricSimulating(false);
                    setViewingLockedFolder(true);
                    setShowLockedModal(false);
                    setPinInput("");
                    toast.success("✨ Touch ID verified: Chats unlocked!");
                  }, 700);
                }}
                className="h-12 rounded-xl text-xs font-semibold text-amber-500 border border-amber-500/20 hover:bg-amber-500/10 active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                title="Simulate Fingerprint Authentication"
              >
                {biometricSimulating ? (
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-base">👆</span>
                    <span className="text-[9px]">Touch ID</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pinInput.length < 4) {
                    const next = pinInput + "0";
                    setPinInput(next);
                    if (next.length === 4) {
                      if (next === "1234") {
                        setViewingLockedFolder(true);
                        setShowLockedModal(false);
                        setPinInput("");
                        toast.success("🔓 Chats unlocked!");
                      } else {
                        setPinError(true);
                        setTimeout(() => {
                          setPinError(false);
                          setPinInput("");
                        }, 600);
                      }
                    }
                  }
                }}
                className="h-12 rounded-xl text-base font-semibold border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPinInput((prev) => prev.slice(0, -1))}
                className="h-12 rounded-xl text-xs font-semibold text-gray-400 hover:text-white border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              >
                ⌫
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowLockedModal(false);
                setPinInput("");
              }}
              className="text-xs text-gray-400 hover:text-gray-200 cursor-pointer pt-1"
            >
              Cancel
            </button>
          </motion.div>
        </div>,
        document.body
      )}

      <NewGroupModal
        isOpen={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
      />
    </div>
  );
};

export default ChatList;
