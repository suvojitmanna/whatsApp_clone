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
} from "react-icons/fa";
import { FaSquarePollHorizontal } from "react-icons/fa6";
import { MdEventNote } from "react-icons/md";
import { RiEmojiStickerLine, RiContactsFill } from "react-icons/ri";
import { RxCross2 } from "react-icons/rx";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";
import { useChatStore } from "../../store/chatStore";
import { WhatsAppPinIcon } from "./MessageBuble";

const getContactPin = (contact, pinnedMessages) => {
  if (!contact) return null;
  const convId = (contact.conversation?._id || contact.conversation)?.toString();
  const contactId = contact._id?.toString();

  if (contact.conversation?.pinnedMessage && contact.conversation.pinnedMessage.message) {
    const expires = contact.conversation.pinnedMessage.expiresAt
      ? new Date(contact.conversation.pinnedMessage.expiresAt).getTime()
      : null;
    if (!expires || expires > Date.now()) {
      return contact.conversation.pinnedMessage;
    }
  }

  if (!pinnedMessages) return null;

  let pin =
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

  if (!pin || !pin.message) return null;
  if (pin.expiresAt && new Date(pin.expiresAt).getTime() <= Date.now()) return null;
  return pin;
};

const getLastMessagePreview = (lastMessage) => {
  if (!lastMessage) return null;

  const currentUserId = useUserStore.getState()?.user?._id;
  if (
    currentUserId &&
    lastMessage?.deletedFor &&
    Array.isArray(lastMessage.deletedFor) &&
    lastMessage.deletedFor.some((id) => String(id) === String(currentUserId))
  ) {
    return {
      icon: null,
      text: "You deleted this message",
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
  const chatListScrollTop = useLayoutStore((state) => state.chatListScrollTop);
  const setChatListScrollTop = useLayoutStore(
    (state) => state.setChatListScrollTop,
  );
  const listContainerRef = useRef(null);

  const { theme } = useThemeStore();
  const [searchTerms, setSearchTerms] = useState("");
  const filteredContact = useMemo(() => {
    if (!contacts) return [];
    const term = searchTerms.trim().toLowerCase();
    const list = term
      ? contacts.filter((contact) =>
        contact?.username?.toLowerCase().includes(term),
      )
      : contacts;

    return [...list].sort((a, b) => {
      const pinA = getContactPin(a, pinnedMessages);
      const pinB = getContactPin(b, pinnedMessages);

      const timeA = Math.max(
        a?.conversation?.lastMessage?.createdAt
          ? new Date(a.conversation.lastMessage.createdAt).getTime()
          : (a?.conversation?.updatedAt ? new Date(a.conversation.updatedAt).getTime() : 0),
        pinA?.pinnedAt ? new Date(pinA.pinnedAt).getTime() : 0,
      );

      const timeB = Math.max(
        b?.conversation?.lastMessage?.createdAt
          ? new Date(b.conversation.lastMessage.createdAt).getTime()
          : (b?.conversation?.updatedAt ? new Date(b.conversation.updatedAt).getTime() : 0),
        pinB?.pinnedAt ? new Date(pinB.pinnedAt).getTime() : 0,
      );
      return timeB - timeA;
    });
  }, [contacts, searchTerms, pinnedMessages]);

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
      <div
        ref={listContainerRef}
        onScroll={(e) => setChatListScrollTop(e.target.scrollTop)}
        className="overflow-y-auto h-[calc(100vh-120px)] custom-scrollbar"
      >
        {filteredContact.length === 0 ? (
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
        ) : (
          filteredContact.map((contact) => {
            const conversationId = contact?.conversation?._id;
            const isTyping = isUserTyping(conversationId, contact?._id);
            const contactPin = getContactPin(contact, pinnedMessages);

            return (
              <motion.div
                key={contact._id}
                data-contact-id={contact._id}
                title={`Chat with ${contact?.username || "user"}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedContact(contact)}
                className={`p-3 flex items-center cursor-pointer transition-colors ${theme === "dark"
                  ? selectedContact?._id === contact._id
                    ? "bg-gray-700"
                    : "hover:bg-gray-800"
                  : selectedContact?._id === contact._id
                    ? "bg-gray-200"
                    : "hover:bg-gray-100"
                  }`}
              >
                <img
                  src={contact?.profilePicture}
                  alt={contact?.username}
                  className="w-12 h-12 rounded-full"
                />

                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <h2 className="font-semibold truncate">{contact?.username}</h2>
                    {(contact?.conversation || contactPin) && (
                      <span
                        className={`text-xs shrink-0 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                      >
                        {formatTimestamp(
                          contactPin?.pinnedAt &&
                            (!contact?.conversation?.lastMessage?.createdAt ||
                              new Date(contactPin.pinnedAt).getTime() >
                              new Date(contact.conversation.lastMessage.createdAt).getTime())
                            ? contactPin.pinnedAt
                            : contact?.conversation?.lastMessage?.createdAt,
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
                        const lastMsg = contact?.conversation?.lastMessage;
                        const preview = getLastMessagePreview(lastMsg);

                        if (isTyping) {
                          return (
                            <span className="font-medium text-emerald-500 flex-shrink-0">
                              typing...
                            </span>
                          );
                        }

                        const pinTime = contactPin?.pinnedAt ? new Date(contactPin.pinnedAt).getTime() : 0;
                        const msgTime = lastMsg?.createdAt ? new Date(lastMsg.createdAt).getTime() : 0;
                        const isPinLatest = Boolean(contactPin && (!lastMsg || pinTime >= msgTime));

                        if (isPinLatest) {
                          const isPinnedByMe =
                            !contactPin.pinnedBy ||
                            String(contactPin.pinnedBy?._id || contactPin.pinnedBy) === String(user?._id);
                          return (
                            <span className="flex items-center gap-1.5 truncate text-[#8696a0]">
                              <WhatsAppPinIcon size={12} className="inline shrink-0 text-[#8696a0]" />
                              <span className="truncate">
                                {isPinnedByMe ? "You pinned a message" : `${contact.username} pinned a message`}
                              </span>
                            </span>
                          );
                        }

                        if (preview && (preview.text || preview.icon)) {
                          return (
                            <>
                              {preview.icon}
                              <span className="truncate">
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

                        return (
                          <span className="italic opacity-70">
                            No messages yet
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {contactPin && (
                        <WhatsAppPinIcon
                          size={13}
                          className="text-[#8696a0] shrink-0"
                          title="Pinned message in chat"
                        />
                      )}
                      {(() => {
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
    </div>
  );
};

export default ChatList;
