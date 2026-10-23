import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FiSearch } from "react-icons/fi";
import { FaPhone, FaVideo, FaUsers, FaCheck } from "react-icons/fa";
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
  groupId,
  groupAvatar = "",
  initialCallType = "audio",
  theme = "dark",
  onStartCall,
}) => {
  const { user: currentUser } = useUserStore();
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const isUserOnline = useChatStore((state) => state.isUserOnline);

  const [callType, setCallType] = useState(initialCallType || "audio");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      setCallType(initialCallType || "audio");
      setSearchQuery("");
      setSelectedMemberIds(new Set());
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
        return onlineUsers.some((u) => (u?._id || u)?.toString() === strId);
      }
      if (onlineUsers && typeof onlineUsers === "object") {
        return Boolean(onlineUsers[strId]?.isOnline || onlineUsers[strId]);
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
      const aSelected = selectedMemberIds.has(aId);
      const bSelected = selectedMemberIds.has(bId);
      if (aSelected !== bSelected) return aSelected ? -1 : 1;

      const aOnline = checkOnlineStatus(aId);
      const bOnline = checkOnlineStatus(bId);
      if (aOnline !== bOnline) return aOnline ? -1 : 1;

      const aName = (a?.username || a?.name || "").toLowerCase();
      const bName = (b?.username || b?.name || "").toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [otherParticipants, searchQuery, checkOnlineStatus, selectedMemberIds]);

  const onlineCount = useMemo(() => {
    return otherParticipants.filter((m) => {
      const mId = (m?._id || m)?.toString();
      return checkOnlineStatus(mId);
    }).length;
  }, [otherParticipants, checkOnlineStatus]);

  const selectedMembers = useMemo(() => {
    return otherParticipants.filter((p) => {
      const pId = (p?._id || p)?.toString();
      return selectedMemberIds.has(pId);
    });
  }, [otherParticipants, selectedMemberIds]);

  const handleToggleMember = (member) => {
    if (!member) return;
    const mId = (member?._id || member?.id || member)?.toString();
    if (!mId) return;
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(mId)) {
        next.delete(mId);
      } else {
        next.add(mId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedMemberIds.size === otherParticipants.length) {
      setSelectedMemberIds(new Set());
    } else {
      const allIds = new Set(
        otherParticipants
          .map((p) => (p?._id || p)?.toString())
          .filter(Boolean)
      );
      setSelectedMemberIds(allIds);
    }
  };

  const handleCallSelected = (selectedType = callType) => {
    const targets = selectedMembers.length > 0 ? selectedMembers : otherParticipants;
    if (targets.length === 0) {
      toast.info("Please select at least one member to call");
      return;
    }

    if (typeof onStartCall === "function") {
      onStartCall(targets, selectedType);
      onClose();
      return;
    }

    const { initiateCall } = useVideoCallStore.getState();
    if (typeof initiateCall !== "function") {
      toast.error("Call service not ready. Please try again.");
      return;
    }

    const otherMemberIds = targets
      .map((p) => (p?._id || p)?.toString())
      .filter(Boolean);

    initiateCall(
      otherMemberIds[0],
      groupName || "Group",
      groupAvatar || "",
      selectedType,
      {
        isGroup: true,
        groupId: groupId,
        groupName: groupName || "Group",
        groupAvatar: groupAvatar || "",
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
          className={`w-full max-w-[440px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] border transition-colors ${isDark
            ? "bg-[#111b21] text-gray-200 border-[#222e35]"
            : "bg-white text-gray-800 border-gray-200"
            }`}
        >
          <div
            className={`flex items-center justify-between px-5 py-3.5 border-b ${isDark ? "border-white/5" : "border-gray-100"
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
                  <FaVideo className="text-base" />
                ) : (
                  <FaPhone className="text-base" />
                )}
              </div>
              <div className="min-w-0">
                <h3
                  className={`text-[16px] font-semibold tracking-tight truncate ${isDark ? "text-white" : "text-gray-900"
                    }`}
                >
                  {callType === "video" ? "Group Video Call" : "Group Voice Call"}
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
            {selectedMembers.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 scrollbar-thin">
                {selectedMembers.map((m) => {
                  const mId = (m?._id || m?.id || m)?.toString();
                  const mName = m?.username || m?.name || "Participant";
                  const mPic = m?.profilePicture;
                  return (
                    <div
                      key={mId}
                      onClick={() => handleToggleMember(m)}
                      className={`flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full text-[12px] font-medium transition-all shrink-0 cursor-pointer ${isDark
                        ? "bg-[#202c33] text-[#e9edef] hover:bg-[#2a3942]"
                        : "bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
                        }`}
                      title={`Remove ${mName}`}
                    >
                      <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                        {mPic && !mPic.includes("default-avatar") ? (
                          <img src={mPic} alt={mName} className="w-full h-full object-cover" />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white text-[9px] font-bold"
                            style={{ backgroundColor: getAvatarColor(mName) }}
                          >
                            {(mName[0] || "U").toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="max-w-[80px] truncate">{mName}</span>
                      <RxCross2 size={13} className="text-gray-400 hover:text-red-400 shrink-0 ml-0.5" />
                    </div>
                  );
                })}
              </div>
            )}

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
                placeholder="Search member to select..."
                className={`w-full bg-transparent text-[13.5px] focus:outline-none ${isDark
                  ? "text-white placeholder-[#8696a0]"
                  : "text-gray-900 placeholder-gray-400"
                  }`}
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
              <div className="flex items-center gap-2">
                <span className={isDark ? "text-[#8696a0]" : "text-gray-500"}>
                  {selectedMembers.length > 0
                    ? `${selectedMembers.length} of ${otherParticipants.length} selected`
                    : "Select members to call"}
                </span>
                {otherParticipants.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[#00a884] font-medium hover:underline cursor-pointer transition ml-1"
                  >
                    {selectedMemberIds.size === otherParticipants.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                )}
              </div>
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
                const isSelected = selectedMemberIds.has(memberId);

                return (
                  <div
                    key={memberId}
                    onClick={() => handleToggleMember(member)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer select-none ${isSelected
                      ? isDark
                        ? "bg-[#202c33] border border-[#00a884]/40"
                        : "bg-emerald-50/80 border border-[#00a884]/30"
                      : isDark
                        ? "hover:bg-[#202c33]/60 active:bg-[#222e35] border border-transparent"
                        : "hover:bg-gray-100/80 active:bg-gray-200 border border-transparent"
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

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${isSelected
                          ? "bg-[#00a884] border-[#00a884] text-white shadow-xs scale-105"
                          : isDark
                            ? "border-[#8696a0]/50 group-hover:border-[#00a884]"
                            : "border-gray-300 group-hover:border-[#00a884]"
                          }`}
                      >
                        {isSelected && <FaCheck size={11} className="text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 pt-3 pb-3 border-t border-black/5 dark:border-white/5 space-y-2">
            <button
              type="button"
              onClick={() => handleCallSelected(callType)}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-[14px] font-semibold bg-[#00a884] hover:bg-[#02906f] active:scale-[0.99] text-white shadow-md transition cursor-pointer"
            >
              {callType === "video" ? <FaVideo size={15} /> : <FaPhone size={14} />}
              <span>
                {selectedMembers.length > 0
                  ? `Start ${callType === "video" ? "Video" : "Voice"} Call (${selectedMembers.length})`
                  : `Call All Members (${otherParticipants.length})`}
              </span>
            </button>
          </div>

          <div
            className={`px-5 py-3 border-t text-[11.5px] flex items-center justify-between font-semibold ${isDark
              ? "border-white/5 bg-[#182229]/50 "
              : "border-gray-100 bg-gray-50"
              }`}
          >
            <span className="text-green-500">End-to-end encrypted calls</span>
            <button
              type="button"
              onClick={onClose}
              className={`hover:underline cursor-pointer text-sm font-semibold ${isDark ? " text-green-500" : " text-emerald-500"
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
