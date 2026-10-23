import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FaStar, FaBookmark } from "react-icons/fa";
import { format } from "date-fns";
import { toast } from "react-toastify";

const ContactInfoStarredTab = ({
  contactInfoTab,
  chatId,
  theme,
  user,
  selectedContact,
  starredMessages,
  messages,
  toggleStarMessage,
}) => {
  const isDark = theme === "dark";

  const chatStarredMessages = useMemo(() => {
    if (!starredMessages) return [];
    const allStarred = Object.values(starredMessages);
    const activeMsgs = Array.isArray(messages) ? messages : [];
    const activeMsgIds = new Set(
      activeMsgs.map((m) => (m._id || m.temp)?.toString()).filter(Boolean)
    );

    return allStarred
      .filter((item) => {
        if (!item) return false;
        const msgIdStr = (item.messageId || item.message?._id)?.toString();
        if (msgIdStr && activeMsgIds.has(msgIdStr)) return true;
        const msg = item.message;
        if (!msg) return false;
        const convId = (
          msg.conversation?._id ||
          msg.conversation ||
          msg.conversationId
        )?.toString();
        const sId = (msg.sender?._id || msg.sender)?.toString();
        const rId = (msg.receiver?._id || msg.receiver)?.toString();
        return (
          convId === chatId ||
          sId === chatId ||
          rId === chatId ||
          (selectedContact?._id &&
            (sId === selectedContact._id.toString() ||
              rId === selectedContact._id.toString()))
        );
      })
      .sort((a, b) => (b.starredAt || 0) - (a.starredAt || 0));
  }, [starredMessages, messages, chatId, selectedContact?._id]);

  const [keptMessagesMap, setKeptMessagesMap] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("whatsapp_kept_messages") || "{}"
      );
    } catch {
      return {};
    }
  });

  const chatKeptMessages = useMemo(() => {
    if (!chatId || !keptMessagesMap?.[chatId]) return [];
    return Object.values(keptMessagesMap[chatId]).sort(
      (a, b) => (b.keptAt || 0) - (a.keptAt || 0)
    );
  }, [chatId, keptMessagesMap]);

  const handleUnkeepMessage = (messageId) => {
    if (!chatId || !messageId) return;
    const currentChatKept = { ...(keptMessagesMap[chatId] || {}) };
    delete currentChatKept[messageId];
    const updated = {
      ...keptMessagesMap,
      [chatId]: currentChatKept,
    };
    setKeptMessagesMap(updated);
    try {
      localStorage.setItem("whatsapp_kept_messages", JSON.stringify(updated));
    } catch { }
    toast.info("Message unkept");
  };

  if (contactInfoTab === "starred") {
    return (
      <motion.div
        key="tab-starred"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col flex-1 overflow-y-auto scrollbar-hide p-4 select-none"
      >
        {chatStarredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center mb-4 shadow-lg">
              <FaStar size={26} />
            </div>
            <h3 className={`text-[17px] font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              No starred messages
            </h3>
            <p className="text-[13px] text-[#8696a0] max-w-xs leading-relaxed">
              Tap and hold or hover over any message in this chat and select Star to save it here for quick access.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-8">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[12px] uppercase font-bold tracking-wider text-[#8696a0]">
                {chatStarredMessages.length} Starred {chatStarredMessages.length === 1 ? "Message" : "Messages"}
              </span>
            </div>
            {chatStarredMessages.map((item) => {
              const msg = item.message || item;
              const msgId = item.messageId || msg._id || msg.temp;
              const isMe = String(msg.sender?._id || msg.sender) === String(user?._id);
              const senderName = isMe ? "You" : (selectedContact?.username || "Contact");
              const timeFormatted = msg.createdAt
                ? format(new Date(msg.createdAt), "MMM d, yyyy 'at' p")
                : "";

              return (
                <div
                  key={msgId || Math.random()}
                  className={`p-3.5 rounded-2xl border transition-all ${isDark
                    ? "bg-[#202c33] border-white/5 hover:border-white/10"
                    : "bg-white border-black/5 hover:border-black/10 shadow-sm"
                    }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[12.5px] font-semibold truncate ${isMe ? "text-emerald-400" : isDark ? "text-white" : "text-gray-900"
                          }`}
                      >
                        {senderName}
                      </span>
                      <span className="text-[11px] text-[#8696a0] shrink-0">
                        {timeFormatted}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleStarMessage(msgId, msg)}
                      title="Unstar message"
                      className="w-7 h-7 rounded-full flex items-center justify-center text-amber-400 hover:bg-amber-400/15 transition-colors cursor-pointer shrink-0"
                    >
                      <FaStar size={13} />
                    </button>
                  </div>

                  <div
                    className={`text-[13.5px] leading-relaxed break-words ${isDark ? "text-gray-200" : "text-gray-800"
                      }`}
                  >
                    {msg.content ? (
                      <p>{msg.content}</p>
                    ) : msg.messageType === "image" ? (
                      <span className="text-xs text-emerald-400 font-medium">📷 [Photo]</span>
                    ) : msg.messageType === "video" ? (
                      <span className="text-xs text-emerald-400 font-medium">🎥 [Video]</span>
                    ) : msg.messageType === "audio" ? (
                      <span className="text-xs text-emerald-400 font-medium">🎤 [Voice message]</span>
                    ) : msg.messageType === "document" ? (
                      <span className="text-xs text-emerald-400 font-medium">📄 {msg.fileName || "Document"}</span>
                    ) : msg.poll ? (
                      <span className="text-xs text-emerald-400 font-medium">📊 [Poll: {msg.poll.question}]</span>
                    ) : msg.event ? (
                      <span className="text-xs text-emerald-400 font-medium">📅 [Event: {msg.event.title}]</span>
                    ) : msg.contact ? (
                      <span className="text-xs text-emerald-400 font-medium">👤 [Contact: {msg.contact.name || "Card"}]</span>
                    ) : (
                      <span className="text-xs italic text-[#8696a0]">[Message]</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  if (contactInfoTab === "kept") {
    return (
      <motion.div
        key="tab-kept"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col flex-1 overflow-y-auto scrollbar-hide p-4 select-none"
      >
        {chatKeptMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4 shadow-lg">
              <FaBookmark size={24} />
            </div>
            <h3 className={`text-[17px] font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              No kept messages
            </h3>
            <p className="text-[13px] text-[#8696a0] max-w-xs leading-relaxed">
              Anyone in this chat can keep or unkeep disappearing messages so they don&apos;t disappear for anyone.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-8">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[12px] uppercase font-bold tracking-wider text-[#8696a0]">
                {chatKeptMessages.length} Kept {chatKeptMessages.length === 1 ? "Message" : "Messages"}
              </span>
            </div>
            {chatKeptMessages.map((item) => {
              const msg = item.message || item;
              const msgId = item.messageId || msg._id || msg.temp;
              const isMe = String(msg.sender?._id || msg.sender) === String(user?._id);
              const senderName = isMe ? "You" : (selectedContact?.username || "Contact");
              const timeFormatted = msg.createdAt
                ? format(new Date(msg.createdAt), "MMM d, yyyy 'at' p")
                : "";

              return (
                <div
                  key={msgId || Math.random()}
                  className={`p-3.5 rounded-2xl border transition-all ${isDark
                    ? "bg-[#202c33] border-white/5 hover:border-white/10"
                    : "bg-white border-black/5 hover:border-black/10 shadow-sm"
                    }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[12.5px] font-semibold truncate ${isMe ? "text-emerald-400" : isDark ? "text-white" : "text-gray-900"
                          }`}
                      >
                        {senderName}
                      </span>
                      <span className="text-[11px] text-[#8696a0] shrink-0">
                        {timeFormatted}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnkeepMessage(msgId)}
                      title="Unkeep message"
                      className="w-7 h-7 rounded-full flex items-center justify-center text-emerald-400 hover:bg-emerald-500/15 transition-colors cursor-pointer shrink-0"
                    >
                      <FaBookmark size={13} />
                    </button>
                  </div>

                  <div
                    className={`text-[13.5px] leading-relaxed break-words ${isDark ? "text-gray-200" : "text-gray-800"
                      }`}
                  >
                    {msg.content || <span className="text-xs italic text-[#8696a0]">[Media / Attachment]</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  return null;
};

export default ContactInfoStarredTab;
