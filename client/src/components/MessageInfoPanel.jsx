import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FiArrowLeft, FiCheck, FiSearch } from "react-icons/fi";
import { FaCheckDouble, FaLock, FaFileAlt, FaHeadphones } from "react-icons/fa";
import { RiContactsFill } from "react-icons/ri";
import { format, isToday, isYesterday } from "date-fns";
import useLayoutStore from "../store/layoutStore";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import { useChatStore } from "../store/chatStore";
import useOutsideClick from "../hook/useOutsideClick";

const formatReceiptDate = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return "";
  if (isToday(dateObj)) return "Today";
  if (isYesterday(dateObj)) return "Yesterday";
  return format(dateObj, "dd/MM/yyyy");
};

const formatReceiptTime = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return "—";
  return format(dateObj, "h:mm a");
};

const getAvatarBg = (name = "") => {
  const colors = [
    "from-emerald-500 to-teal-600",
    "from-blue-500 to-cyan-600",
    "from-indigo-500 to-purple-600",
    "from-pink-500 to-rose-600",
    "from-amber-500 to-orange-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const MessageInfoPanel = () => {
  const panelRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedMessageInfo, setSelectedMessageInfo, selectedContact } = useLayoutStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const currentUser = useUserStore((state) => state.user);
  const allUsers = useChatStore((state) => state.users) || [];
  const conversations = useChatStore((state) => state.conversations);
  const currentConversation = useChatStore((state) => state.currentConversation);

  const liveMsg = useChatStore((state) => {
    if (!selectedMessageInfo) return null;
    const targetId = (
      selectedMessageInfo._id?._id || selectedMessageInfo._id
    )?.toString();
    return state.messages.find(
      (m) => (m._id?._id || m._id)?.toString() === targetId
    );
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedMessageInfo(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedMessageInfo]);

  useOutsideClick(panelRef, () => {
    if (!isMobile) {
      setSelectedMessageInfo(null);
    }
  });

  const msg = liveMsg || selectedMessageInfo;

  const { isGroup, readByList, deliveredToList, remainingList } = useMemo(() => {
    if (!msg) {
      return { isGroup: false, readByList: [], deliveredToList: [], remainingList: [] };
    }

    const convId = (
      typeof msg.conversation === "object"
        ? msg.conversation?._id
        : msg.conversation || selectedContact?.conversation?._id || selectedContact?._id
    )?.toString();

    const convFromStore =
      conversations?.data?.find((c) => c._id?.toString() === convId) ||
      (currentConversation?._id?.toString() === convId ? currentConversation : null);

    const conversationObj =
      selectedContact?.conversation ||
      convFromStore ||
      (typeof msg.conversation === "object" ? msg.conversation : null);

    const rawParticipants = [
      ...(conversationObj?.participants || []),
      ...(selectedContact?.participants || []),
      ...(currentConversation?.participants || []),
      ...(convFromStore?.participants || []),
    ];

    const participantMap = new Map();
    rawParticipants.forEach((p) => {
      if (!p) return;
      const id = (p._id || p.userId || p.id || p)?.toString();
      if (!id) return;
      let userObj = typeof p === "object" && p.username ? p : null;
      if (!userObj) {
        userObj = allUsers.find((u) => u._id?.toString() === id) || {
          _id: id,
          username: `Member ${id.slice(-4)}`,
        };
      }
      participantMap.set(id, userObj);
    });

    // Also include any user objects present in readBy or deliveredTo
    if (Array.isArray(msg.readBy)) {
      msg.readBy.forEach((item) => {
        const id = (item.user?._id || item.user || item.userId)?.toString();
        if (id && !participantMap.has(id)) {
          const userObj =
            typeof item.user === "object" && item.user.username
              ? item.user
              : allUsers.find((u) => u._id?.toString() === id) || {
                  _id: id,
                  username: `Member ${id.slice(-4)}`,
                };
          participantMap.set(id, userObj);
        }
      });
    }

    if (Array.isArray(msg.deliveredTo)) {
      msg.deliveredTo.forEach((item) => {
        const id = (item.user?._id || item.user || item.userId)?.toString();
        if (id && !participantMap.has(id)) {
          const userObj =
            typeof item.user === "object" && item.user.username
              ? item.user
              : allUsers.find((u) => u._id?.toString() === id) || {
                  _id: id,
                  username: `Member ${id.slice(-4)}`,
                };
          participantMap.set(id, userObj);
        }
      });
    }

    const isGroupChat = Boolean(
      !msg.receiver ||
      conversationObj?.isGroup ||
      selectedContact?.isGroup ||
      selectedContact?.isGroupChat ||
      selectedContact?.groupName ||
      convFromStore?.isGroup ||
      participantMap.size > 2
    );

    const senderId = (msg.sender?._id || msg.sender)?.toString();

    const readMap = new Map();
    if (Array.isArray(msg.readBy)) {
      msg.readBy.forEach((item) => {
        const uId = (item.user?._id || item.user || item.userId)?.toString();
        if (!uId || uId === senderId) return;
        const userObj =
          typeof item.user === "object" && item.user.username
            ? item.user
            : participantMap.get(uId) ||
              allUsers.find((u) => u._id?.toString() === uId) || {
                _id: uId,
                username: `User ${uId.slice(-4)}`,
              };
        readMap.set(uId, {
          user: userObj,
          readAt: item.readAt ? new Date(item.readAt) : null,
        });
      });
    }

    const deliveredMap = new Map();
    if (Array.isArray(msg.deliveredTo)) {
      msg.deliveredTo.forEach((item) => {
        const uId = (item.user?._id || item.user || item.userId)?.toString();
        if (!uId || uId === senderId) return;
        // Member who has already read belongs strictly in "Read by", never in "Delivered to"
        if (readMap.has(uId)) return;

        const userObj =
          typeof item.user === "object" && item.user.username
            ? item.user
            : participantMap.get(uId) ||
              allUsers.find((u) => u._id?.toString() === uId) || {
                _id: uId,
                username: `User ${uId.slice(-4)}`,
              };
        deliveredMap.set(uId, {
          user: userObj,
          deliveredAt: item.deliveredAt ? new Date(item.deliveredAt) : null,
        });
      });
    }

    const remaining = [];
    if (isGroupChat && participantMap.size > 0) {
      participantMap.forEach((userObj, id) => {
        if (id === senderId) return;
        if (!readMap.has(id) && !deliveredMap.has(id)) {
          remaining.push({ user: userObj });
        }
      });
    }

    return {
      isGroup: isGroupChat,
      readByList: Array.from(readMap.values()),
      deliveredToList: Array.from(deliveredMap.values()),
      remainingList: remaining,
    };
  }, [msg, selectedContact, allUsers, conversations, currentConversation]);

  if (!selectedMessageInfo || !msg) return null;

  const sentDate = msg.createdAt
    ? new Date(msg.createdAt)
    : msg.timestamp
      ? new Date(msg.timestamp)
      : null;
  const sentTime = formatReceiptTime(sentDate);
  const sentDateLabel = formatReceiptDate(sentDate);

  const isDelivered =
    msg.messageStatus === "delivered" || msg.messageStatus === "read";
  const deliveredDate = msg.deliveredAt
    ? new Date(msg.deliveredAt)
    : isDelivered && msg.updatedAt
      ? new Date(msg.updatedAt)
      : null;
  const deliveredTime = isDelivered && deliveredDate ? formatReceiptTime(deliveredDate) : "—";
  const deliveredDateLabel = isDelivered && deliveredDate ? formatReceiptDate(deliveredDate) : "";

  const isRead = msg.messageStatus === "read";
  const readDate = msg.readAt
    ? new Date(msg.readAt)
    : isRead && msg.updatedAt
      ? new Date(msg.updatedAt)
      : null;
  const readTime = isRead && readDate ? formatReceiptTime(readDate) : "—";
  const readDateLabel = isRead && readDate ? formatReceiptDate(readDate) : "";

  const filteredReadBy = readByList.filter((item) =>
    (item.user?.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDeliveredTo = deliveredToList.filter((item) =>
    (item.user?.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredRemaining = remainingList.filter((item) =>
    (item.user?.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRecipients = readByList.length + deliveredToList.length + remainingList.length;

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "tween", duration: 0.2 }}
        className={`h-full flex flex-col select-none ${isMobile
          ? "fixed inset-0 z-[100]"
          : "relative w-full md:w-[360px] lg:w-[410px] xl:w-[430px] shrink-0 border-l"
          } ${isDark
            ? "bg-[#111b21] border-[#222d34] text-[#e9edef]"
            : "bg-[#f0f2f5] border-gray-200 text-gray-900"
          } shadow-2xl`}
      >
        <div
          className={`h-[60px] px-4 flex items-center justify-between border-b shrink-0 ${isDark
            ? "bg-[#202c33] border-[#222d34] text-[#e9edef]"
            : "bg-[#008069] text-white border-transparent"
            }`}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedMessageInfo(null)}
              className={`p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center ${isDark
                ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                : "hover:bg-black/10 text-white"
                }`}
              title="Back"
            >
              <FiArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base tracking-tight">
                {isGroup ? "Group Message info" : "Message info"}
              </h3>
              {isGroup && totalRecipients > 0 && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${isDark ? "bg-white/10 text-emerald-400" : "bg-white/20 text-white"
                    }`}
                >
                  {readByList.length}/{totalRecipients}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedMessageInfo(null)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
              ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
              : "hover:bg-black/10 text-white"
              }`}
            title="Close"
          >
            <RxCross2 size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div
            className={`p-4 border-b ${isDark ? "bg-[#0b141a]/60 border-[#222d34]/80" : "bg-[#e5ddd5]/40 border-black/5"
              }`}
          >
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider block mb-2.5 ${isDark ? "text-emerald-400" : "text-emerald-700"
                }`}
            >
              Message
            </span>

            <div
              className={`p-3 rounded-2xl shadow-sm max-w-full ${isDark ? "bg-[#005c4b] text-[#e9edef]" : "bg-[#d9fdd3] text-[#111b21]"
                }`}
            >
              {msg.contentType === "text" && (
                <p className="text-[14.5px] leading-relaxed break-words whitespace-pre-wrap">
                  {msg.content}
                </p>
              )}

              {msg.contentType === "image" && (
                <div className="space-y-2">
                  <img
                    src={msg.imageOrVideoUrl}
                    alt="preview"
                    className="rounded-xl max-h-48 w-full object-cover"
                  />
                  {msg.content && (
                    <p className="text-[14px] leading-relaxed break-words">{msg.content}</p>
                  )}
                </div>
              )}

              {msg.contentType === "video" && (
                <div className="space-y-2">
                  <video
                    src={msg.imageOrVideoUrl}
                    controls
                    className="rounded-xl max-h-48 w-full object-cover"
                  />
                  {msg.content && (
                    <p className="text-[14px] leading-relaxed break-words">{msg.content}</p>
                  )}
                </div>
              )}

              {msg.contentType === "document" && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/10 dark:bg-white/5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <FaFileAlt size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate leading-tight">
                      {msg.fileName || msg.content || "Document"}
                    </p>
                    <p className="text-xs opacity-70 mt-0.5">{msg.fileSize || "File"}</p>
                  </div>
                </div>
              )}

              {msg.contentType === "audio" && (
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/10 dark:bg-white/5">
                  <FaHeadphones className="text-amber-400 shrink-0" size={16} />
                  <span className="text-xs font-medium truncate">
                    {msg.fileName || "Voice / Audio message"}
                  </span>
                </div>
              )}

              {msg.contentType === "contact" && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/10 dark:bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <RiContactsFill size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">
                      {msg.content?.replace(/^Contact:\s*/, "") || "Contact"}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-1 text-[11px] opacity-75 mt-1 select-none">
                {msg.edited && <span className="italic mr-0.5">Edited</span>}
                <span>{sentTime}</span>
                {isRead ? (
                  <FaCheckDouble size={11} className="text-[#53bdeb]" />
                ) : isDelivered ? (
                  <FaCheckDouble size={11} className="opacity-80" />
                ) : (
                  <FiCheck size={11} className="opacity-80" />
                )}
              </div>
            </div>
          </div>

          {isGroup && totalRecipients > 4 && (
            <div className="p-3 border-b border-black/5 dark:border-white/5">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${isDark
                  ? "bg-[#202c33] border-[#222d34] text-[#e9edef]"
                  : "bg-white border-gray-200 text-gray-800"
                  }`}
              >
                <FiSearch className="text-gray-400 shrink-0" size={14} />
                <input
                  type="text"
                  placeholder="Search participants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-full placeholder:text-gray-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-gray-200"
                  >
                    <RxCross2 size={13} />
                  </button>
                )}
              </div>
            </div>
          )}

          {isGroup ? (
            <div className="mt-2 space-y-3 pb-4">
              <div
                className={`border-y shadow-sm ${isDark ? "bg-[#111b21] border-[#222d34]" : "bg-white border-gray-200"
                  }`}
              >
                <div
                  className={`flex items-center justify-between px-4 py-2.5 border-b ${isDark ? "bg-[#202c33]/70 border-[#222d34]" : "bg-gray-50 border-gray-200"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FaCheckDouble size={14} className="text-[#53bdeb]" />
                    <h4 className="text-[13.5px] font-semibold">Read by</h4>
                  </div>
                  <span className="text-xs font-medium text-[#53bdeb]">
                    {readByList.length} {readByList.length === 1 ? "person" : "people"}
                  </span>
                </div>

                <div className="divide-y divide-black/5 dark:divide-white/5 max-h-56 overflow-y-auto custom-scrollbar">
                  {filteredReadBy.length > 0 ? (
                    filteredReadBy.map((item, idx) => {
                      const isSelf =
                        currentUser?._id &&
                        item.user?._id &&
                        currentUser._id.toString() === item.user._id.toString();
                      return (
                        <div
                          key={item.user?._id || idx}
                          className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.user?.profilePicture ? (
                              <img
                                src={item.user.profilePicture}
                                alt={item.user.username || "User"}
                                className="w-9 h-9 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getAvatarBg(
                                  item.user?.username || ""
                                )} text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-sm`}
                              >
                                {(item.user?.username || "U").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-[14px] font-medium truncate flex items-center gap-1.5">
                                <span>{item.user?.username || "Unknown"}</span>
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-normal">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[11.5px] opacity-60 truncate">
                                {item.user?.about || item.user?.phoneNumber || "Member"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-2">
                            <span className="text-xs font-medium text-[#53bdeb] tabular-nums block">
                              {formatReceiptTime(item.readAt)}
                            </span>
                            <span className="text-[10px] opacity-60 block">
                              {formatReceiptDate(item.readAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs opacity-50 p-3 text-center">
                      {searchQuery ? "No matching members" : "No one has read yet"}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`border-y shadow-sm ${isDark ? "bg-[#111b21] border-[#222d34]" : "bg-white border-gray-200"
                  }`}
              >
                <div
                  className={`flex items-center justify-between px-4 py-2.5 border-b ${isDark ? "bg-[#202c33]/70 border-[#222d34]" : "bg-gray-50 border-gray-200"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FaCheckDouble size={14} className="opacity-70 text-gray-400" />
                    <h4 className="text-[13.5px] font-semibold">Delivered to</h4>
                  </div>
                  <span className="text-xs font-medium opacity-70">
                    {deliveredToList.length} {deliveredToList.length === 1 ? "person" : "people"}
                  </span>
                </div>

                <div className="divide-y divide-black/5 dark:divide-white/5 max-h-56 overflow-y-auto custom-scrollbar">
                  {filteredDeliveredTo.length > 0 ? (
                    filteredDeliveredTo.map((item, idx) => (
                      <div
                        key={item.user?._id || idx}
                        className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.user?.profilePicture ? (
                            <img
                              src={item.user.profilePicture}
                              alt={item.user.username || "User"}
                              className="w-9 h-9 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getAvatarBg(
                                item.user?.username || ""
                              )} text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-sm`}
                            >
                              {(item.user?.username || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[14px] font-medium truncate">
                              {item.user?.username || "Unknown"}
                            </p>
                            <p className="text-[11.5px] opacity-60 truncate">
                              {item.user?.about || item.user?.phoneNumber || "Member"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <span className="text-xs font-medium tabular-nums block">
                            {formatReceiptTime(item.deliveredAt)}
                          </span>
                          <span className="text-[10px] opacity-60 block">
                            {formatReceiptDate(item.deliveredAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs opacity-50 p-3 text-center">
                      {searchQuery
                        ? "No matching members"
                        : deliveredToList.length === 0 && readByList.length > 0
                          ? "All delivered members have read"
                          : "No pending deliveries"}
                    </p>
                  )}
                </div>
              </div>

              {remainingList.length > 0 && (
                <div
                  className={`border-y shadow-sm ${isDark ? "bg-[#111b21] border-[#222d34]" : "bg-white border-gray-200"
                    }`}
                >
                  <div
                    className={`flex items-center justify-between px-4 py-2.5 border-b ${isDark ? "bg-[#202c33]/70 border-[#222d34]" : "bg-gray-50 border-gray-200"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FiCheck size={15} className="opacity-50 text-gray-400" />
                      <h4 className="text-[13.5px] font-semibold">Remaining</h4>
                    </div>
                    <span className="text-xs font-medium opacity-60">
                      {remainingList.length} offline
                    </span>
                  </div>

                  <div className="divide-y divide-black/5 dark:divide-white/5 max-h-48 overflow-y-auto custom-scrollbar">
                    {filteredRemaining.map((item, idx) => (
                      <div
                        key={item.user?._id || idx}
                        className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.user?.profilePicture ? (
                            <img
                              src={item.user.profilePicture}
                              alt={item.user.username || "User"}
                              className="w-9 h-9 rounded-full object-cover shrink-0 grayscale opacity-80"
                            />
                          ) : (
                            <div
                              className={`w-9 h-9 rounded-full bg-gray-600 text-white flex items-center justify-center font-semibold text-xs shrink-0`}
                            >
                              {(item.user?.username || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[14px] font-medium truncate">
                              {item.user?.username || "Member"}
                            </p>
                            <p className="text-xs text-amber-500/90 truncate">Pending delivery</p>
                          </div>
                        </div>
                        <span className="text-xs opacity-50 font-medium">—</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`mt-4 border-y divide-y shadow-sm ${isDark
                ? "bg-[#111b21] border-[#222d34] divide-[#222d34]"
                : "bg-white border-gray-200 divide-gray-100"
                }`}
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isRead ? "bg-[#53bdeb]/15 text-[#53bdeb]" : "bg-gray-500/10 text-gray-400/40"
                      }`}
                  >
                    <FaCheckDouble size={16} />
                  </div>
                  <div>
                    <h4 className="text-[14.5px] font-medium leading-snug">Read</h4>
                    <p className={`text-[12px] ${isDark ? "text-[#8696a0]" : "text-gray-500"}`}>
                      {isRead ? "Recipient has viewed this message" : "Not read yet"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium tabular-nums">{readTime}</span>
                  {isRead && readDateLabel && (
                    <p className={`text-[11px] ${isDark ? "text-[#8696a0]" : "text-gray-400"}`}>
                      {readDateLabel}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDelivered
                      ? isDark
                        ? "bg-white/10 text-gray-300"
                        : "bg-gray-100 text-gray-600"
                      : "bg-gray-500/10 text-gray-400/40"
                      }`}
                  >
                    <FaCheckDouble size={16} />
                  </div>
                  <div>
                    <h4 className="text-[14.5px] font-medium leading-snug">Delivered</h4>
                    <p className={`text-[12px] ${isDark ? "text-[#8696a0]" : "text-gray-500"}`}>
                      {isDelivered ? "Delivered to recipient device" : "Pending delivery"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium tabular-nums">{deliveredTime}</span>
                  {isDelivered && deliveredDateLabel && (
                    <p className={`text-[11px] ${isDark ? "text-[#8696a0]" : "text-gray-400"}`}>
                      {deliveredDateLabel}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    <FiCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-[14.5px] font-medium leading-snug">Sent</h4>
                    <p className={`text-[12px] ${isDark ? "text-[#8696a0]" : "text-gray-500"}`}>
                      Uploaded to server
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium tabular-nums">{sentTime}</span>
                  {sentDateLabel && (
                    <p className={`text-[11px] ${isDark ? "text-[#8696a0]" : "text-gray-400"}`}>
                      {sentDateLabel}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mx-4 mt-6 mb-8 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-start gap-2.5">
            <FaLock size={12} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MessageInfoPanel;
