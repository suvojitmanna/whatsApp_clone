import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FiSearch } from "react-icons/fi";
import { FaPhone, FaVideo, FaUser, FaUsers } from "react-icons/fa";
import { toast } from "react-toastify";
import useUserStore from "../store/useUserStore";
import { useChatStore } from "../store/chatStore";
import useVideoCallStore from "../store/videoCallStore";

const getAvatarColor = (name) => {
  const colors = [
    "#7c3aed",
    "#b45309",
    "#047857",
    "#be185d",
    "#0284c7",
    "#9333ea",
    "#b91c1c",
    "#d97706",
    "#059669",
    "#4f46e5",
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const GroupCallModal = ({
  isOpen,
  onClose,
  groupParticipants = [],
  groupAdmins = [],
  groupName = "Group",
  initialCallType = "audio",
  theme = "dark",
  onStartCall,
}) => {
  const { user: currentUser } = useUserStore();
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const isUserOnline = useChatStore((state) => state.isUserOnline);

  const [callType, setCallType] = useState(initialCallType || "audio");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCallType(initialCallType || "audio");
      setSearchQuery("");
    }
  }, [isOpen, initialCallType]);

  const adminIds = useMemo(() => {
    const list = Array.isArray(groupAdmins) ? groupAdmins : [groupAdmins];
    return new Set(
      list
        .filter(Boolean)
        .map((a) => (a?._id || a)?.toString())
        .filter(Boolean)
    );
  }, [groupAdmins]);

  const otherParticipants = useMemo(() => {
    const myId = currentUser?._id?.toString();
    const list = Array.isArray(groupParticipants) ? groupParticipants : [];
    return list.filter((p) => {
      const pId = (p?._id || p)?.toString();
      return pId && pId !== myId;
    });
  }, [groupParticipants, currentUser?._id]);

  const checkOnlineStatus = useCallback(
    (memberId) => {
      if (!memberId) return false;
      const strId = (memberId?._id || memberId)?.toString();
      if (typeof isUserOnline === "function") {
        return Boolean(isUserOnline(strId));
      }
      if (onlineUsers instanceof Map) {
        return Boolean(onlineUsers.get(strId)?.isOnline);
      }
      if (Array.isArray(onlineUsers)) {
        return onlineUsers.includes(strId);
      }
      return false;
    },
    [isUserOnline, onlineUsers]
  );

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let members = otherParticipants;

    if (q) {
      members = members.filter((m) => {
        const name = (m?.username || m?.name || "").toLowerCase();
        const phone = (m?.phoneNumber || "").toLowerCase();
        return name.includes(q) || phone.includes(q);
      });
    }

    return [...members].sort((a, b) => {
      const aId = (a?._id || a)?.toString();
      const bId = (b?._id || b)?.toString();
      const aOnline = checkOnlineStatus(aId);
      const bOnline = checkOnlineStatus(bId);

      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      const aName = (a?.username || a?.name || "").toLowerCase();
      const bName = (b?.username || b?.name || "").toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [otherParticipants, searchQuery, checkOnlineStatus]);

  const onlineCount = useMemo(() => {
    return otherParticipants.filter((m) => {
      const mId = (m?._id || m)?.toString();
      return checkOnlineStatus(mId);
    }).length;
  }, [otherParticipants, checkOnlineStatus]);

  const handleInitiateCall = (member, selectedType) => {
    if (!member) return;
    const mId = (member._id || member.id || member)?.toString();

    if (typeof onStartCall === "function") {
      onStartCall(member, selectedType);
      onClose();
      return;
    }

    const { initiateCall } = useVideoCallStore.getState();
    const avatar = member?.profilePicture;
    const name = member?.username || member?.name || "Participant";

    if (typeof initiateCall === "function") {
      initiateCall(mId, name, avatar, selectedType);
    } else {
      toast.error("Call service not ready. Please try again.");
    }
    onClose();
  };

  const handleCallAll = (selectedType = callType) => {
    if (otherParticipants.length === 0) {
      toast.info("No members in this group to call");
      return;
    }

    const otherMemberIds = otherParticipants
      .map((p) => (p?._id || p)?.toString())
      .filter(Boolean);

    if (typeof onStartCall === "function") {
      onStartCall(otherParticipants, selectedType);
      onClose();
      return;
    }

    const { initiateCall } = useVideoCallStore.getState();
    if (typeof initiateCall !== "function") {
      toast.error("Call service not ready. Please try again.");
      return;
    }

    initiateCall(
      otherMemberIds[0],
      groupName || "Group",
      "",
      selectedType,
      {
        isGroup: true,
        groupName: groupName || "Group",
        participantIds: otherMemberIds,
      }
    );
    onClose();
  };

  if (!isOpen) return null;

  const isDark = theme === "dark";

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-[430px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border transition-colors ${isDark
            ? "bg-[#111b21] text-gray-200 border-[#222e35]"
            : "bg-white text-gray-800 border-gray-200"
            }`}
        >
          <div
            className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-white/5" : "border-gray-100"
              }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${callType === "video"
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "bg-emerald-500/15 text-emerald-500"
                  }`}
              >
                {callType === "video" ? (
                  <FaVideo className="text-lg" />
                ) : (
                  <FaPhone className="text-base" />
                )}
              </div>
              <div className="min-w-0">
                <h3
                  className={`text-[16.5px] font-semibold tracking-tight truncate ${isDark ? "text-white" : "text-gray-900"
                    }`}
                >
                  {callType === "video" ? "Start Video Call" : "Start Voice Call"}
                </h3>
                <p
                  className={`text-[12px] truncate ${isDark ? "text-[#8696a0]" : "text-gray-500"
                    }`}
                >
                  {groupName} • {otherParticipants.length}{" "}
                  {otherParticipants.length === 1 ? "member" : "members"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-full transition cursor-pointer ${isDark
                ? "hover:bg-white/10 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                }`}
              title="Close"
            >
              <RxCross2 size={20} />
            </button>
          </div>

          <div
            className={`px-5 pt-3 pb-2 flex items-center gap-2 border-b ${isDark ? "border-white/5 bg-[#182229]/40" : "border-gray-100 bg-gray-50/60"
              }`}
          >
            <button
              type="button"
              onClick={() => setCallType("audio")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${callType === "audio"
                ? "bg-[#00a884] text-white shadow-xs"
                : isDark
                  ? "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#222e35]"
                  : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
            >
              <FaPhone size={13} />
              <span>Voice Call</span>
            </button>

            <button
              type="button"
              onClick={() => setCallType("video")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${callType === "video"
                ? "bg-[#00a884] text-white shadow-xs"
                : isDark
                  ? "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#222e35]"
                  : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
            >
              <FaVideo size={14} />
              <span>Video Call</span>
            </button>
          </div>

          <div className="p-4 pb-2 space-y-2.5">
            <button
              type="button"
              onClick={() => handleCallAll(callType)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13.5px] font-semibold bg-[#00a884] hover:bg-[#02906f] text-white shadow-md active:scale-[0.99] transition cursor-pointer"
            >
              {callType === "video" ? <FaVideo size={14} /> : <FaPhone size={13} />}
              <span>Call All Members ({otherParticipants.length})</span>
            </button>
            <div
              className={`relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full border transition-all ${isDark
                ? "bg-[#202c33] border-transparent focus-within:border-[#00a884] focus-within:ring-1 focus-within:ring-[#00a884]"
                : "bg-gray-100 border-transparent focus-within:border-[#00897b] focus-within:ring-1 focus-within:ring-[#00897b]"
                }`}
            >
              <FiSearch
                size={17}
                className={isDark ? "text-[#8696a0]" : "text-gray-400"}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member to call..."
                className={`w-full bg-transparent text-[13.5px] focus:outline-none ${isDark
                  ? "text-white placeholder-[#8696a0]"
                  : "text-gray-900 placeholder-gray-400"
                  }`}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-200 transition cursor-pointer"
                >
                  <RxCross2 size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between px-1 text-[12px]">
              <span className={isDark ? "text-[#8696a0]" : "text-gray-500"}>
                Choose a member to connect
              </span>
              <div className="flex items-center gap-1.5 font-medium text-emerald-500">
                <span className="relative flex h-2 w-2">
                  {onlineCount > 0 && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${onlineCount > 0 ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                  ></span>
                </span>
                <span>
                  {onlineCount} {onlineCount === 1 ? "member" : "members"} online
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 scrollbar-thin">
            {filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDark ? "bg-[#202c33] text-gray-400" : "bg-gray-100 text-gray-500"
                    }`}
                >
                  <FaUsers size={22} />
                </div>
                <p
                  className={`text-[14px] font-medium ${isDark ? "text-[#e9edef]" : "text-gray-800"
                    }`}
                >
                  {searchQuery ? "No members match your search" : "No members found"}
                </p>
                <p
                  className={`text-[12px] mt-1 ${isDark ? "text-[#8696a0]" : "text-gray-500"
                    }`}
                >
                  {searchQuery
                    ? "Try searching with a different name or number"
                    : "Add members to this group to start calling"}
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const memberId = (member?._id || member)?.toString();
                const isOnline = checkOnlineStatus(memberId);
                const isAdmin = adminIds.has(memberId);
                const displayName =
                  member?.username || member?.name || "Participant";
                const profilePic = member?.profilePicture;

                return (
                  <div
                    key={memberId}
                    onClick={() => handleInitiateCall(member, callType)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${isDark
                      ? "hover:bg-[#202c33] active:bg-[#222e35]"
                      : "hover:bg-gray-100 active:bg-gray-200"
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center border border-white/10">
                        {profilePic && !profilePic.includes("default-avatar") ? (
                          <img
                            src={profilePic}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white font-semibold text-[15px]"
                            style={{
                              backgroundColor: getAvatarColor(displayName),
                            }}
                          >
                            {(displayName[0] || "U").toUpperCase()}
                          </div>
                        )}

                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[14px] font-medium truncate ${isDark ? "text-[#e9edef]" : "text-gray-900"
                              }`}
                          >
                            {displayName}
                          </span>
                          {isAdmin && (
                            <span
                              className={`text-[10px] font-normal px-1.5 py-0.5 rounded ${isDark
                                ? "bg-[#16312e] text-[#00a884]"
                                : "bg-[#e0f0e9] text-[#00897b]"
                                }`}
                            >
                              Admin
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[12px] truncate ${isOnline
                            ? "text-emerald-500 font-medium"
                            : isDark
                              ? "text-[#8696a0]"
                              : "text-gray-500"
                            }`}
                        >
                          {isOnline ? "Online" : member?.about || "Offline"}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1.5 shrink-0 ml-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleInitiateCall(member, "audio")}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${isOnline
                          ? isDark
                            ? "hover:bg-[#16312e] text-[#00a884] hover:scale-105"
                            : "hover:bg-emerald-50 text-[#00897b] hover:scale-105"
                          : isDark
                            ? "text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]"
                            : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                          }`}
                        title={isOnline ? "Start voice call" : "User is offline"}
                      >
                        <FaPhone size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInitiateCall(member, "video")}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${isOnline
                          ? isDark
                            ? "hover:bg-[#16312e] text-[#00a884] hover:scale-105"
                            : "hover:bg-emerald-50 text-[#00897b] hover:scale-105"
                          : isDark
                            ? "text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]"
                            : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                          }`}
                        title={isOnline ? "Start video call" : "User is offline"}
                      >
                        <FaVideo size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div
            className={`px-5 py-3 border-t text-[11.5px] flex items-center justify-between ${isDark
              ? "border-white/5 bg-[#182229]/50 text-[#8696a0]"
              : "border-gray-100 bg-gray-50 text-gray-500"
              }`}
          >
            <span>End-to-end encrypted calls</span>
            <button
              type="button"
              onClick={onClose}
              className={`hover:underline cursor-pointer ${isDark ? "text-gray-300" : "text-gray-700"
                }`}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GroupCallModal;
