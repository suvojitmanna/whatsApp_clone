import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FaCheckDouble, FaLock, FaFileAlt, FaHeadphones } from "react-icons/fa";
import { FiCheck, FiSearch } from "react-icons/fi";
import { RiContactsFill } from "react-icons/ri";
import { format, isToday, isYesterday } from "date-fns";
import useLayoutStore from "../../store/layoutStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import useThemeStore from "../../store/themeStore";

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

const MessageInfoModal = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  message: propMessage,
  theme: propTheme,
  conversation: propConversation,
  participants: propParticipants,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedMessageInfo, setSelectedMessageInfo, selectedContact } =
    useLayoutStore();
  const { theme: storeTheme } = useThemeStore();
  const currentUser = useUserStore((state) => state.user);
  const allUsers = useChatStore((state) => state.users) || [];
  const conversations = useChatStore((state) => state.conversations);
  const currentConversation = useChatStore((state) => state.currentConversation);

  const isOpen = propIsOpen !== undefined ? propIsOpen : Boolean(selectedMessageInfo);
  const handleClose = () => {
    if (propOnClose) propOnClose();
    if (selectedMessageInfo) setSelectedMessageInfo(null);
  };

  const theme = propTheme || storeTheme || "dark";
  const isDark = theme === "dark";

  const liveMsg = useChatStore((state) => {
    const targetId = (
      propMessage?._id?._id ||
      propMessage?._id ||
      selectedMessageInfo?._id?._id ||
      selectedMessageInfo?._id
    )?.toString();
    if (!targetId) return null;
    return state.messages.find(
      (m) => (m._id?._id || m._id)?.toString() === targetId
    );
  });

  const msg = liveMsg || propMessage || selectedMessageInfo;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleOpenMemberContact = (targetUser) => {
    if (!targetUser) return;
    const targetId = (targetUser._id || targetUser.id || targetUser)?.toString();
    const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
    if (targetId && currentUserId && targetId === currentUserId) return;

    const foundInStore = allUsers.find(
      (u) => (u?._id || u?.id)?.toString() === targetId
    );
    const resolved = {
      ...(foundInStore || {}),
      ...(typeof targetUser === "object" ? targetUser : {}),
      _id: targetId,
      id: targetId,
      username: targetUser?.username || foundInStore?.username || "Contact",
      name: targetUser?.name || targetUser?.username || foundInStore?.name || "Contact",
      profilePicture:
        targetUser?.profilePicture ||
        targetUser?.profilePic ||
        targetUser?.avatar ||
        foundInStore?.profilePicture ||
        "",
      phoneNumber: targetUser?.phoneNumber || foundInStore?.phoneNumber || "",
      about: targetUser?.about || foundInStore?.about || "Hey there! I am using WhatsApp.",
      email: targetUser?.email || foundInStore?.email || "",
    };

    handleClose();
    useLayoutStore.getState().openContactInfoWithMember(resolved);
  };

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
      propConversation ||
      selectedContact?.conversation ||
      convFromStore ||
      (typeof msg.conversation === "object" ? msg.conversation : null);

    const rawParticipants = [
      ...(propParticipants || []),
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
  }, [msg, propConversation, propParticipants, selectedContact, allUsers, conversations, currentConversation]);

  if (!isOpen || !msg) return null;

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

  const modalContent = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border flex flex-col max-h-[88vh] ${isDark
            ? "bg-[#111b21] border-[#222d34] text-[#e9edef]"
            : "bg-white border-gray-200 text-[#111b21]"
            }`}
        >
          <div
            className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${isDark ? "bg-[#202c33] border-[#222d34]" : "bg-[#008069] text-white border-transparent"
              }`}
          >
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-base sm:text-lg tracking-tight">
                {isGroup ? "Group Message Info" : "Message info"}
              </h3>
              {isGroup && totalRecipients > 0 && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${isDark ? "bg-white/10 text-emerald-400" : "bg-white/20 text-white"
                    }`}
                >
                  {readByList.length}/{totalRecipients} read
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
                ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                : "hover:bg-black/10 text-white"
                }`}
              title="Close"
            >
              <RxCross2 size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
            <div
              className={`p-3.5 rounded-2xl border shadow-sm ${isDark
                ? "bg-[#005c4b]/30 border-emerald-500/20 text-[#e9edef]"
                : "bg-[#d9fdd3]/70 border-emerald-600/15 text-[#111b21]"
                }`}
            >
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider block mb-2 ${isDark ? "text-emerald-400" : "text-emerald-700"
                  }`}
              >
                Selected Message
              </span>

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
                    className="rounded-xl max-h-56 w-full object-cover"
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
                    className="rounded-xl max-h-56 w-full object-cover"
                  />
                  {msg.content && (
                    <p className="text-[14px] leading-relaxed break-words">{msg.content}</p>
                  )}
                </div>
              )}

              {msg.contentType === "document" && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/10 dark:bg-white/5">
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
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/10 dark:bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <FaHeadphones size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {msg.fileName || "Voice / Audio message"}
                    </p>
                    <p className="text-xs opacity-60">Audio recording</p>
                  </div>
                </div>
              )}

              {msg.contentType === "contact" && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/10 dark:bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <RiContactsFill size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">
                      {msg.content?.replace(/^Contact:\s*/, "") || "Contact card"}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-1.5 text-[11px] opacity-75 mt-2 select-none">
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

            {isGroup && totalRecipients > 4 && (
              <div
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-sm ${isDark
                  ? "bg-[#202c33]/60 border-[#222d34] text-[#e9edef]"
                  : "bg-gray-100 border-gray-200 text-gray-800"
                  }`}
              >
                <FiSearch className="text-gray-400 shrink-0" size={16} />
                <input
                  type="text"
                  placeholder="Search participants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs placeholder:text-gray-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-gray-200 p-0.5"
                  >
                    <RxCross2 size={14} />
                  </button>
                )}
              </div>
            )}

            {isGroup ? (
              <div className="space-y-4">
                <div
                  className={`rounded-xl border overflow-hidden ${isDark ? "bg-[#202c33]/40 border-[#222d34]" : "bg-white border-gray-200"
                    }`}
                >
                  <div
                    className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "bg-[#202c33] border-[#222d34]" : "bg-gray-50 border-gray-200"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FaCheckDouble size={15} className="text-[#53bdeb]" />
                      <h4 className="text-sm font-semibold tracking-tight">Read by</h4>
                    </div>
                    <span className="text-xs font-medium text-[#53bdeb]">
                      {readByList.length} {readByList.length === 1 ? "person" : "people"}
                    </span>
                  </div>

                  <div className="divide-y divide-gray-500/10 max-h-56 overflow-y-auto custom-scrollbar">
                    {filteredReadBy.length > 0 ? (
                      filteredReadBy.map((item, idx) => {
                        const isSelf =
                          currentUser?._id &&
                          item.user?._id &&
                          currentUser._id.toString() === item.user._id.toString();
                        return (
                          <div
                            key={item.user?._id || idx}
                            onClick={() => !isSelf && handleOpenMemberContact(item.user)}
                            className={`flex items-center justify-between p-3.5 transition-colors ${isSelf
                                ? ""
                                : "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                              }`}
                            title={isSelf ? "You" : `View ${item.user?.username || "member"}'s contact info`}
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
                                <p className="text-sm font-medium truncate flex items-center gap-1.5">
                                  <span>{item.user?.username || "Unknown"}</span>
                                  {isSelf && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-normal">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs opacity-60 truncate">
                                  {item.user?.about || item.user?.phoneNumber || "Member"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 pl-3">
                              <span className="text-xs font-medium text-[#53bdeb] tabular-nums block">
                                {formatReceiptTime(item.readAt)}
                              </span>
                              {Boolean(item.readAt && formatReceiptDate(item.readAt)) && (
                                <span className="text-[10px] opacity-60 block">
                                  {formatReceiptDate(item.readAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs opacity-50 p-4 text-center">
                        {searchQuery ? "No matching members in Read list" : "No one has read this message yet"}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={`rounded-xl border overflow-hidden ${isDark ? "bg-[#202c33]/40 border-[#222d34]" : "bg-white border-gray-200"
                    }`}
                >
                  <div
                    className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "bg-[#202c33] border-[#222d34]" : "bg-gray-50 border-gray-200"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FaCheckDouble size={15} className="opacity-70 text-gray-400" />
                      <h4 className="text-sm font-semibold tracking-tight">Delivered to</h4>
                    </div>
                    <span className="text-xs font-medium opacity-70">
                      {deliveredToList.length} {deliveredToList.length === 1 ? "person" : "people"}
                    </span>
                  </div>

                  <div className="divide-y divide-gray-500/10 max-h-56 overflow-y-auto custom-scrollbar">
                    {filteredDeliveredTo.length > 0 ? (
                      filteredDeliveredTo.map((item, idx) => {
                        const isSelf =
                          currentUser?._id &&
                          item.user?._id &&
                          currentUser._id.toString() === item.user._id.toString();
                        return (
                          <div
                            key={item.user?._id || idx}
                            onClick={() => !isSelf && handleOpenMemberContact(item.user)}
                            className={`flex items-center justify-between p-3.5 transition-colors ${isSelf
                                ? ""
                                : "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                              }`}
                            title={isSelf ? "You" : `View ${item.user?.username || "member"}'s contact info`}
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
                                <p className="text-sm font-medium truncate flex items-center gap-1.5">
                                  <span>{item.user?.username || "Unknown"}</span>
                                  {isSelf && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-normal">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs opacity-60 truncate">
                                  {item.user?.about || item.user?.phoneNumber || "Member"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 pl-3">
                              <span className="text-xs font-medium tabular-nums block">
                                {formatReceiptTime(item.deliveredAt)}
                              </span>
                              {Boolean(item.deliveredAt && formatReceiptDate(item.deliveredAt)) && (
                                <span className="text-[10px] opacity-60 block">
                                  {formatReceiptDate(item.deliveredAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs opacity-50 p-4 text-center">
                        {searchQuery
                          ? "No matching members in Delivered list"
                          : deliveredToList.length === 0 && readByList.length > 0
                            ? "All delivered members have already read"
                            : "No pending deliveries"}
                      </p>
                    )}
                  </div>
                </div>

                {remainingList.length > 0 && (
                  <div
                    className={`rounded-xl border overflow-hidden ${isDark ? "bg-[#202c33]/40 border-[#222d34]" : "bg-white border-gray-200"
                      }`}
                  >
                    <div
                      className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "bg-[#202c33] border-[#222d34]" : "bg-gray-50 border-gray-200"
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FiCheck size={16} className="opacity-50 text-gray-400" />
                        <h4 className="text-sm font-semibold tracking-tight">Remaining</h4>
                      </div>
                      <span className="text-xs font-medium opacity-60">
                        {remainingList.length} offline
                      </span>
                    </div>

                    <div className="divide-y divide-gray-500/10 max-h-48 overflow-y-auto custom-scrollbar">
                      {filteredRemaining.map((item, idx) => {
                        const isSelf =
                          currentUser?._id &&
                          item.user?._id &&
                          currentUser._id.toString() === item.user._id.toString();
                        return (
                          <div
                            key={item.user?._id || idx}
                            onClick={() => !isSelf && handleOpenMemberContact(item.user)}
                            className={`flex items-center justify-between p-3.5 transition-colors ${isSelf
                                ? ""
                                : "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                              }`}
                            title={isSelf ? "You" : `View ${item.user?.username || "member"}'s contact info`}
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
                                <p className="text-sm font-medium truncate flex items-center gap-1.5">
                                  <span>{item.user?.username || "Member"}</span>
                                  {isSelf && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-normal">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-amber-500/90 truncate">Pending delivery</p>
                              </div>
                            </div>
                            <span className="text-xs opacity-50 font-medium">—</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`rounded-2xl divide-y border overflow-hidden shadow-sm ${isDark
                  ? "bg-[#202c33]/30 border-[#222d34] divide-[#222d34]"
                  : "bg-white border-gray-200 divide-gray-100"
                  }`}
              >
                <div className="flex items-center justify-between p-4.5">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isRead
                        ? "bg-[#53bdeb]/15 text-[#53bdeb]"
                        : "bg-gray-500/10 text-gray-400/40"
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
                    <span className="text-xs font-medium tabular-nums block">
                      {isRead ? readTime : "—"}
                    </span>
                    {isRead && readDateLabel && (
                      <p className={`text-[11px] ${isDark ? "text-[#8696a0]" : "text-gray-400"}`}>
                        {readDateLabel}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4.5">
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
                    <span className="text-xs font-medium tabular-nums block">
                      {isDelivered ? deliveredTime : "—"}
                    </span>
                    {isDelivered && deliveredDateLabel && (
                      <p className={`text-[11px] ${isDark ? "text-[#8696a0]" : "text-gray-400"}`}>
                        {deliveredDateLabel}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4.5">
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
                    <span className="text-xs font-medium tabular-nums block">{sentTime}</span>
                    {sentDateLabel && (
                      <p className={`text-[11px] ${isDark ? "text-[#8696a0]" : "text-gray-400"}`}>
                        {sentDateLabel}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs">
              <FaLock size={13} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};

export default MessageInfoModal;
