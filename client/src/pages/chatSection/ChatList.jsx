import React, { useEffect, useRef, useState, useMemo } from "react";
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
} from "react-icons/fa";
import { FaSquarePollHorizontal, FaCheckDouble } from "react-icons/fa6";
import { MdEventNote, MdAccessTime, MdList, MdOutlinePlaylistAdd } from "react-icons/md";
import { FiCheck } from "react-icons/fi";
import { RiEmojiStickerLine, RiContactsFill } from "react-icons/ri";
import { RxCross2 } from "react-icons/rx";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";
import { useChatStore } from "../../store/chatStore";
import { WhatsAppPinIcon, WhatsAppDisappearingIcon } from "./MessageBuble";
import AddToListModal from "../../components/AddToListModal";
import NewListModal from "../../components/NewListModal";
import {
  getAllLists,
  isContactInList,
  getContactListNames,
} from "../../utils/chatListsUtil";

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

  return { type: "message", target: "a message" };
};

export const getPinActorAndLabel = (pin, currentUserId, defaultUsername = "Contact") => {
  if (!pin) return { isMe: false, actor: "You", target: "a message", text: "You pinned a message" };

  const currentUidStr = (currentUserId?._id || currentUserId?.id || currentUserId)?.toString();
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

  const actor = isMe ? "You" : (pin.pinnedBy?.username || defaultUsername || "Contact");

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
    text: `${actor} pinned ${target}`,
  };
};

const getContactPin = (contact, pinnedMessages) => {
  if (!contact) return null;
  const currentUserId = useUserStore.getState()?.user?._id;
  const convId = (contact.conversation?._id || contact.conversation)?.toString();
  const contactId = contact._id?.toString();

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
      if (!isMsgDeleted(rawPin.message)) {
        pin = { ...rawPin };
      }
    }
  }

  if (!pin && pinnedMessages) {
    pin =
      (convId && pinnedMessages[convId]) ||
      (contactId && pinnedMessages[contactId]);

    if (!pin) {
      const allPins = Object.values(pinnedMessages || {});
      pin = allPins.find((p) => {
        if (!p?.message) return false;
        const msgConv = (p.message.conversation?._id || p.message.conversation || p.message.conversationId)?.toString();
        const msgSender = (p.message.sender?._id || p.message.sender)?.toString();
        const msgReceiver = (p.message.receiver?._id || p.message.receiver)?.toString();
        return (
          (convId && msgConv === convId) ||
          (contactId && (msgSender === contactId || msgReceiver === contactId))
        );
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
      (contactId && pinnedMessages?.[contactId]);
    if (storePin?.message && typeof storePin.message === "object" && storePin.message.contentType) {
      pin.message = storePin.message;
    } else {
      const msgId = typeof pin.message === "string" ? pin.message : pin.message?._id;
      if (msgId) {
        const chatMsgs = useChatStore.getState().messages;
        const msgs =
          (convId && chatMsgs?.[convId]) ||
          (contactId && chatMsgs?.[contactId]) ||
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

  const currentUserId = useUserStore.getState()?.user?._id;

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
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          className="inline mr-1 text-[#8696a0] shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
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
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          className="inline mr-1 text-[#8696a0] shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
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

const ChatList = ({ contacts }) => {
  const { user } = useUserStore();
  const { isUserTyping } = useChatStore();
  const pinnedMessages = useChatStore((state) => state.pinnedMessages);
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact,
  );
  const disappearingDurations = useLayoutStore((state) => state.disappearingDurations);
  const chatListScrollTop = useLayoutStore((state) => state.chatListScrollTop);
  const setChatListScrollTop = useLayoutStore(
    (state) => state.setChatListScrollTop,
  );
  const listContainerRef = useRef(null);

  const { theme } = useThemeStore();
  const [searchTerms, setSearchTerms] = useState("");
  const [activeListFilter, setActiveListFilter] = useState("All");
  const [availableLists, setAvailableLists] = useState(() => getAllLists());
  const [listsRevision, setListsRevision] = useState(0);
  const [listModalContact, setListModalContact] = useState(null);
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [showListsDropdown, setShowListsDropdown] = useState(false);
  const listsDropdownRef = useRef(null);

  useEffect(() => {
    const handleListsChanged = () => {
      setAvailableLists(getAllLists());
      setListsRevision((r) => r + 1);
    };
    window.addEventListener("whatsapp_lists_changed", handleListsChanged);
    return () =>
      window.removeEventListener("whatsapp_lists_changed", handleListsChanged);
  }, []);

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
      if (typeof u === "number" && u > 0) {
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
  }, [contacts, availableLists, listsRevision]);

  const dropdownLists = useMemo(() => {
    const base = ["Communities"];
    availableLists.forEach((l) => {
      if (
        l !== "Favorites" &&
        l !== "Favourites" &&
        l !== "All" &&
        l !== "Unread" &&
        l !== "Groups" &&
        !base.includes(l)
      ) {
        base.push(l);
      }
    });
    return base;
  }, [availableLists]);

  const totalUnreadCount = listCounts.Unread;

  const filteredContact = useMemo(() => {
    if (!contacts) return [];
    const term = searchTerms.trim().toLowerCase();
    let list = contacts;

    if (term) {
      list = list.filter((contact) =>
        contact?.username?.toLowerCase().includes(term)
      );
    }

    if (activeListFilter !== "All") {
      list = list.filter((contact) =>
        isContactInList(contact, activeListFilter)
      );
    }

    return [...list].sort((a, b) => {
      const pinA = getContactPin(a, pinnedMessages);
      const pinB = getContactPin(b, pinnedMessages);

      const timeA = Math.max(
        a?.conversation?.lastMessage?.createdAt
          ? new Date(a.conversation.lastMessage.createdAt).getTime()
          : (a?.conversation?.updatedAt ? new Date(a.conversation.updatedAt).getTime() : 0),
        pinA?.pinnedAt ? new Date(pinA.pinnedAt).getTime() : 0,
        a?.conversation?.disappearingUpdatedAt ? new Date(a.conversation.disappearingUpdatedAt).getTime() : 0,
      );

      const timeB = Math.max(
        b?.conversation?.lastMessage?.createdAt
          ? new Date(b.conversation.lastMessage.createdAt).getTime()
          : (b?.conversation?.updatedAt ? new Date(b.conversation.updatedAt).getTime() : 0),
        pinB?.pinnedAt ? new Date(pinB.pinnedAt).getTime() : 0,
        b?.conversation?.disappearingUpdatedAt ? new Date(b.conversation.disappearingUpdatedAt).getTime() : 0,
      );
      return timeB - timeA;
    });
  }, [contacts, searchTerms, pinnedMessages, activeListFilter, listsRevision]);

  useEffect(() => {
    if (listContainerRef.current) {
      if (chatListScrollTop > 0) {
        listContainerRef.current.scrollTop = chatListScrollTop;
      } else if (selectedContact?._id) {
        const el = listContainerRef.current.querySelector(
          `[data-contact-id="${selectedContact._id}"]`,
        );
        if (el) {
          el.scrollIntoView({ block: "nearest" });
        }
      }
    }
  }, [filteredContact.length, selectedContact?._id]);

  return (
    <div
      className={`h-full w-full border-r relative z-10 transition-all duration-300 ${theme === "dark"
        ? "bg-[#111b21] border-gray-700 shadow-[4px_0_15px_rgba(0,0,0,0.5)] text-white"
        : "bg-white border-gray-200 shadow-[4px_0_10px_rgba(0,0,0,0.1)] text-gray-900"
        }`}
    >
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Chats</h2>
        <button
          title="New chat"
          className="p-2 bg-green-500 text-white rounded-full shadow-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-green-600 hover:scale-110 hover:rotate-90 active:scale-90 animate-bounce-slow"
        >
          <FaPlus />
        </button>
      </div>
      <div className="p-2">
        <div className="relative group">
          <FaSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 z-10 transition-colors ${theme === "dark"
              ? "text-gray-400 group-focus-within:text-green-500"
              : "text-gray-500 group-focus-within:text-green-600"
              }`}
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            className={`w-full pl-10 pr-9 py-2 border rounded-lg outline-none transition-all duration-200 ${theme === "dark"
              ? "bg-gray-800 text-white border-gray-700 placeholder-gray-500 hover:border-emerald-500/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
              : "bg-gray-100 text-black border-gray-200 placeholder-gray-400 hover:border-emerald-500/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
              }`}
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
          />
          {searchTerms && (
            <button
              type="button"
              onClick={() => setSearchTerms("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all cursor-pointer"
              title="Clear search"
            >
              <RxCross2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="px-3 pb-2 pt-0.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide select-none border-b border-white/5 relative">
        {/* All */}
        <button
          type="button"
          onClick={() => setActiveListFilter("All")}
          className={`px-3 py-1 rounded-full text-[12.5px] font-medium transition-all shrink-0 cursor-pointer ${activeListFilter === "All"
            ? theme === "dark"
              ? "bg-[#103629] text-[#25d366] font-semibold border border-[#00a884]/30 shadow-xs"
              : "bg-[#00a884] text-white font-semibold shadow-xs"
            : theme === "dark"
              ? "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
              : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            }`}
        >
          All
        </button>

        {/* Favourites */}
        <button
          type="button"
          onClick={() => setActiveListFilter("Favourites")}
          className={`px-3 py-1 rounded-full text-[12.5px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${activeListFilter === "Favourites" || activeListFilter === "Favorites"
            ? theme === "dark"
              ? "bg-[#103629] text-[#25d366] font-semibold border border-[#00a884]/30 shadow-xs"
              : "bg-[#00a884] text-white font-semibold shadow-xs"
            : theme === "dark"
              ? "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
              : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            }`}
        >
          <span>Favourites</span>
          {listCounts.Favourites > 0 && (
            <span className="text-[11px] opacity-80 font-semibold ml-0.5">
              {listCounts.Favourites}
            </span>
          )}
        </button>

        {/* Groups */}
        <button
          type="button"
          onClick={() => setActiveListFilter("Groups")}
          className={`px-3 py-1 rounded-full text-[12.5px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${activeListFilter === "Groups"
            ? theme === "dark"
              ? "bg-[#103629] text-[#25d366] font-semibold border border-[#00a884]/30 shadow-xs"
              : "bg-[#00a884] text-white font-semibold shadow-xs"
            : theme === "dark"
              ? "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
              : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            }`}
        >
          <span>Groups</span>
          {listCounts.Groups > 0 && (
            <span className="text-[11px] opacity-80 font-semibold ml-0.5">
              {listCounts.Groups}
            </span>
          )}
        </button>

        {/* Unread */}
        <button
          type="button"
          onClick={() => setActiveListFilter("Unread")}
          className={`px-3 py-1 rounded-full text-[12.5px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${activeListFilter === "Unread"
            ? theme === "dark"
              ? "bg-[#103629] text-[#25d366] font-semibold border border-[#00a884]/30 shadow-xs"
              : "bg-[#00a884] text-white font-semibold shadow-xs"
            : theme === "dark"
              ? "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
              : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            }`}
        >
          <span>Unread</span>
          {listCounts.Unread > 0 && (
            <span className="text-[11px] opacity-80 font-semibold ml-0.5">
              {listCounts.Unread}
            </span>
          )}
        </button>

        {/* Active dropdown list if selected */}
        {dropdownLists.includes(activeListFilter) && (
          <button
            type="button"
            onClick={() => setActiveListFilter(activeListFilter)}
            className={`px-3 py-1 rounded-full text-[12.5px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${theme === "dark"
              ? "bg-[#103629] text-[#25d366] font-semibold border border-[#00a884]/30 shadow-xs"
              : "bg-[#00a884] text-white font-semibold shadow-xs"
              }`}
          >
            <span>{activeListFilter}</span>
            {listCounts[activeListFilter] > 0 && (
              <span className="text-[11px] opacity-80 font-semibold ml-0.5">
                {listCounts[activeListFilter]}
              </span>
            )}
          </button>
        )}

        {/* Dropdown trigger caret button */}
        <div className="relative shrink-0" ref={listsDropdownRef}>
          <button
            type="button"
            onClick={() => setShowListsDropdown((prev) => !prev)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${showListsDropdown || dropdownLists.includes(activeListFilter)
              ? theme === "dark"
                ? "bg-[#103629] text-[#25d366] border border-[#00a884]/30"
                : "bg-[#00a884] text-white"
              : theme === "dark"
                ? "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
                : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
              }`}
            title="More lists"
          >
            <FaCaretDown
              size={12}
              className={`transition-transform duration-200 ${showListsDropdown ? "rotate-180" : ""
                }`}
            />
          </button>

          {/* WhatsApp Dropdown Menu */}
          <AnimatePresence>
            {showListsDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className={`absolute right-0 top-full mt-1.5 z-50 w-52 rounded-2xl shadow-2xl border p-1.5 select-none ${theme === "dark"
                  ? "bg-[#233138] border-white/10 text-white shadow-black/70"
                  : "bg-white border-gray-200 text-gray-900 shadow-xl"
                  }`}
              >
                {dropdownLists.map((listName) => (
                  <button
                    key={listName}
                    type="button"
                    onClick={() => {
                      setActiveListFilter(listName);
                      setShowListsDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-[13.5px] rounded-xl cursor-pointer transition-colors ${activeListFilter === listName
                      ? "text-[#25d366] bg-emerald-500/10 font-medium"
                      : theme === "dark"
                        ? "text-gray-200 hover:bg-white/5 hover:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                  >
                    <span>{listName}</span>
                    <span
                      className={`text-[12px] font-medium ${activeListFilter === listName
                        ? "text-[#25d366]"
                        : theme === "dark"
                          ? "text-[#8696a0]"
                          : "text-gray-400"
                        }`}
                    >
                      {listCounts[listName] !== undefined
                        ? listCounts[listName]
                        : 0}
                    </span>
                  </button>
                ))}

                <div
                  className={`border-t my-1 mx-2 ${theme === "dark" ? "border-white/10" : "border-gray-100"
                    }`}
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowListsDropdown(false);
                    setIsNewListModalOpen(true);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13.5px] font-medium rounded-xl cursor-pointer transition-colors ${theme === "dark"
                    ? "text-white hover:bg-white/5"
                    : "text-gray-800 hover:bg-gray-100"
                    }`}
                >
                  <FaPlus size={11} className="text-[#00a884]" />
                  <span>New list</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div
        ref={listContainerRef}
        onScroll={(e) => setChatListScrollTop(e.target.scrollTop)}
        className="overflow-y-auto h-[calc(100vh-170px)] custom-scrollbar"
      >
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
                No chats in {activeListFilter}
              </h2>

              <p className="text-xs text-[#8696a0] max-w-[220px] mb-4 leading-relaxed">
                Add chats to this list to easily find and message them here.
              </p>

              <button
                type="button"
                onClick={() => setIsNewListModalOpen(true)}
                className="px-4 py-2 rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Add chats
              </button>
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
            const pinTime = contactPin?.pinnedAt ? new Date(contactPin.pinnedAt).getTime() : 0;
            const disappearingTime = contact?.conversation?.disappearingUpdatedAt
              ? new Date(contact.conversation.disappearingUpdatedAt).getTime()
              : 0;

            const latestTimestamp = Math.max(lastMsgTime, pinTime, disappearingTime);

            return (
              <motion.div
                key={contact._id}
                data-contact-id={contact._id}
                title={`Chat with ${contact?.username || "user"}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setListModalContact(contact);
                }}
                onClick={() => {
                  setSelectedContact(contact);
                  useChatStore.getState().clearUnreadCount(contact._id);
                  if (contact?.conversation?._id) {
                    useChatStore.getState().clearUnreadCount(contact.conversation._id);
                  }
                }}
                className={`p-3 flex items-center cursor-pointer transition-colors relative group ${theme === "dark"
                  ? selectedContact?._id === contact._id
                    ? "bg-gray-700"
                    : "hover:bg-gray-800"
                  : selectedContact?._id === contact._id
                    ? "bg-gray-200"
                    : "hover:bg-gray-100"
                  }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={contact?.profilePicture || "/default-avatar.png"}
                    alt={contact?.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {hasDisappearing && (
                    <span
                      className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border ${theme === "dark" ? "border-[#111b21] bg-[#202c33]" : "border-white bg-[#f0f2f5]"
                        } flex items-center justify-center text-[#8696a0] shadow-sm`}
                      title={`Disappearing messages: ${disappearingDuration}`}
                    >
                      <WhatsAppDisappearingIcon size={10} />
                    </span>
                  )}
                </div>

                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <h2 className="font-semibold truncate">{contact?.username}</h2>
                    {(contact?.conversation || contactPin || hasDisappearing) && (
                      <span
                        className={`text-xs shrink-0 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                      >
                        {formatTimestamp(
                          latestTimestamp || contactPin?.pinnedAt || contact?.conversation?.lastMessage?.createdAt,
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
                          return (
                            <span className="font-medium text-emerald-500 flex-shrink-0">
                              typing...
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
                            ? (isOff ? "You turned off disappearing messages" : "You turned on disappearing messages")
                            : (isOff ? `${contact?.username || "Contact"} turned off disappearing messages` : `${contact?.username || "Contact"} turned on disappearing messages`);

                          return (
                            <span className="flex items-center gap-1.5 truncate text-[#8696a0]">
                              <WhatsAppDisappearingIcon size={12} className="inline shrink-0 text-[#8696a0]" />
                              <span className="truncate">{dispText}</span>
                            </span>
                          );
                        }

                        if (contactPin && (pinTime >= lastMsgTime || !preview)) {
                          const currentUserId = (user?._id || user?.id)?.toString();
                          const { text: pinText } = getPinActorAndLabel(
                            contactPin,
                            currentUserId,
                            contact?.username,
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
                              {isLastMsgFromMe && !preview.isDeleted && (() => {
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
                                if (status === "send" || status === "sent") {
                                  return (
                                    <FiCheck
                                      size={13}
                                      className="inline mr-1 text-[#8696a0] shrink-0"
                                      title="Sent"
                                    />
                                  );
                                }
                                if (status === "delivered") {
                                  return (
                                    <FaCheckDouble
                                      size={12}
                                      className="inline mr-1 text-[#8696a0] shrink-0"
                                      title="Delivered"
                                    />
                                  );
                                }
                                if (status === "read") {
                                  return (
                                    <FaCheckDouble
                                      size={12}
                                      className="inline mr-1 text-[#53bdeb] shrink-0"
                                      title="Read"
                                    />
                                  );
                                }
                                return (
                                  <FiCheck
                                    size={13}
                                    className="inline mr-1 text-[#8696a0] shrink-0"
                                    title="Sent"
                                  />
                                );
                              })()}
                              {preview.icon}
                              <span className={`truncate ${preview.isDeleted ? "italic opacity-80" : ""}`}>
                                {preview.text}
                              </span>
                              {lastMsg?.edited && (
                                <span
                                  className={`flex-shrink-0 text-[11px] italic mt-0.5 ${theme === "dark"
                                    ? "text-gray-500/80"
                                    : "text-gray-400"
                                    }`}
                                >
                                  edited
                                </span>
                              )}
                            </>
                          );
                        }

                        if (contactPin) {
                          const currentUserId = (user?._id || user?.id)?.toString();
                          const { text: pinText } = getPinActorAndLabel(
                            contactPin,
                            currentUserId,
                            contact?.username,
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
                          const dispText = isSetByMe
                            ? "You turned on disappearing messages"
                            : `${contact?.username || "Contact"} turned on disappearing messages`;

                          return (
                            <span className="flex items-center gap-1.5 truncate text-[#8696a0]">
                              <WhatsAppDisappearingIcon size={12} className="inline shrink-0 text-[#8696a0]" />
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
                          setListModalContact(contact);
                        }}
                        className={`p-1.5 rounded-full transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:scale-110 ${theme === "dark"
                          ? "hover:bg-white/10 text-[#8696a0] hover:text-[#00a884]"
                          : "hover:bg-gray-200 text-gray-500 hover:text-[#00a884]"
                          }`}
                        title="Add to list"
                      >
                        <MdOutlinePlaylistAdd size={18} />
                      </button>

                      {getContactListNames(contact).includes("Favorites") && (
                        <FaHeart
                          size={11}
                          className="text-rose-400 shrink-0"
                          title="Favorite"
                        />
                      )}

                      {contactPin && (
                        <WhatsAppPinIcon
                          size={13}
                          className="text-[#8696a0] shrink-0"
                          title="Pinned message in chat"
                        />
                      )}
                      {(() => {
                        const isCurrentOpen = Boolean(
                          selectedContact?._id &&
                          (String(contact?._id) === String(selectedContact._id) ||
                            (contact?.conversation?._id &&
                              selectedContact?.conversation?._id &&
                              String(contact.conversation._id) === String(selectedContact.conversation._id)))
                        );

                        if (isCurrentOpen) {
                          return null;
                        }

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

                        if (isSenderOfLast || !unread || unread <= 0) {
                          return null;
                        }

                        return (
                          <p className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                            {unread}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {listModalContact && (
        <AddToListModal
          isOpen={Boolean(listModalContact)}
          onClose={() => setListModalContact(null)}
          contact={listModalContact}
        />
      )}
      {isNewListModalOpen && (
        <NewListModal
          isOpen={isNewListModalOpen}
          onClose={() => setIsNewListModalOpen(false)}
          contacts={contacts || []}
          onCreated={(name) => setActiveListFilter(name)}
        />
      )}
    </div>
  );
};

export default ChatList;
