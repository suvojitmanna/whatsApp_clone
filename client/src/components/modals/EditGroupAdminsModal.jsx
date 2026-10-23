import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FiSearch, FiCheck } from "react-icons/fi";
import { toast } from "react-toastify";
import axiosInstance from "../../services/url.services";
import { useChatStore } from "../../store/chatStore";
import useLayoutStore from "../../store/layoutStore";

const EditGroupAdminsModal = ({
  isOpen,
  onClose,
  groupParticipants = [],
  groupAdmins = [],
  currentUserId,
  convId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdminIds, setSelectedAdminIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery("");
    const initialAdmins = groupAdmins.map((a) => (a?._id || a)?.toString()).filter(Boolean);
    setSelectedAdminIds(initialAdmins);
  }, [isOpen, groupAdmins]);

  const filteredParticipants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return groupParticipants.filter((p) => {
      if (!q) return true;
      const name = (p?.username || p?.name || "").toLowerCase();
      const phone = (p?.phoneNumber || "").toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [groupParticipants, searchQuery]);

  const selectedAdminObjects = useMemo(() => {
    const adminSet = new Set(selectedAdminIds);
    return groupParticipants.filter((p) =>
      adminSet.has((p?._id || p)?.toString())
    );
  }, [selectedAdminIds, groupParticipants]);

  const handleToggleAdmin = (pId) => {
    const myIdStr = currentUserId?.toString();
    if (pId === myIdStr) {
      return;
    }
    setSelectedAdminIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  const handleRemoveAdmin = (pId, e) => {
    e.stopPropagation();
    const myIdStr = currentUserId?.toString();
    if (pId === myIdStr) return;
    setSelectedAdminIds((prev) => prev.filter((id) => id !== pId));
  };

  const handleSave = async () => {
    if (!convId || isSubmitting) return;
    if (selectedAdminIds.length === 0) {
      toast.error("Group must have at least one admin");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = await axiosInstance.put(`/chat/group/${convId}`, {
        groupAdmin: selectedAdminIds,
      });
      const updated = data?.data || data;

      useChatStore.getState().updateGroupInfo(convId, {
        groupAdmin: selectedAdminIds,
      });
      useLayoutStore.getState().setSelectedContact((prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...prev,
          ...updated,
          groupAdmin: selectedAdminIds,
          conversation: {
            ...prev?.conversation,
            ...updated,
            groupAdmin: selectedAdminIds,
          },
        };
      });

      toast.success("Group admins updated");
      onClose();
    } catch (err) {
      console.error("Error updating group admins:", err);
      toast.error(err?.response?.data?.message || "Failed to update group admins");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-[420px] bg-[#111b21] text-gray-200 border border-[#222e35] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[88vh]"
      >
        <div className="flex items-center gap-4 px-5 py-4 border-b border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
          >
            <RxCross2 size={20} />
          </button>
          <h3 className="text-[17px] font-semibold text-white tracking-tight">
            Edit group admins
          </h3>
        </div>

        <div className="p-4 pb-2">
          <div className="relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full border border-[#00a884] ring-1 ring-[#00a884] bg-[#202c33]/90 shadow-inner">
            <FiSearch size={18} className="text-gray-400 shrink-0 ml-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or number"
              className="w-full bg-transparent text-[14px] text-white placeholder-gray-400 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {selectedAdminObjects.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 overflow-x-auto scrollbar-thin">
            {selectedAdminObjects.map((member) => {
              const mId = (member?._id || member)?.toString();
              const isMe = mId === currentUserId?.toString();
              const displayName = isMe ? "You" : member?.username || member?.name || "Member";

              return (
                <div
                  key={mId}
                  className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-white/10 text-white text-[13px] shrink-0 border border-white/10"
                >
                  <img
                    src={member?.profilePicture || "/default-avatar.png"}
                    alt={displayName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="truncate max-w-[120px]">{displayName}</span>
                  {!isMe && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveAdmin(mId, e)}
                      className="p-0.5 rounded-full hover:bg-white/20 text-gray-300 hover:text-white transition cursor-pointer"
                    >
                      <RxCross2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="px-5 pt-3 pb-1">
          <h4 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
            Contacts
          </h4>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 scrollbar-thin pb-20">
          {filteredParticipants.map((member) => {
            const mId = (member?._id || member)?.toString();
            const isMe = mId === currentUserId?.toString();
            const isSelected = selectedAdminIds.includes(mId);
            const displayName = isMe
              ? `${member?.phoneNumber ? member.phoneNumber + " " : ""}(You)`
              : member?.username || member?.name || "Participant";

            return (
              <div
                key={mId}
                onClick={() => handleToggleAdmin(mId)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isMe
                  ? "cursor-default opacity-80"
                  : isSelected
                    ? "bg-white/[0.04] cursor-pointer hover:bg-white/[0.07]"
                    : "cursor-pointer hover:bg-white/5"
                  }`}
              >
                <div className="shrink-0">
                  {isMe ? (
                    <div className="w-5 h-5 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-gray-400">
                      <FiCheck size={14} />
                    </div>
                  ) : isSelected ? (
                    <div className="w-5 h-5 rounded-md bg-[#00a884] border border-[#00a884] flex items-center justify-center text-[#111b21]">
                      <FiCheck size={14} className="stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-md border-2 border-gray-500/70 hover:border-gray-400" />
                  )}
                </div>

                <img
                  src={member?.profilePicture || "/default-avatar.png"}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h5 className="text-[14px] font-medium text-white truncate">
                    {displayName}
                  </h5>
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-5 right-5 z-20">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="w-14 h-14 bg-[#00a884] hover:bg-[#00a884]/90 rounded-full flex items-center justify-center text-[#111b21] shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            title="Save group admins"
          >
            <FiCheck size={24} className="stroke-[3]" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditGroupAdminsModal;
