import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FiSearch, FiCheck } from "react-icons/fi";
import { toast } from "react-toastify";
import axiosInstance from "../services/url.services";
import { useChatStore } from "../store/chatStore";
import useLayoutStore from "../store/layoutStore";
import useUserStore from "../store/useUserStore";
import { META_AI_USER_ID } from "./common/MetaAiIcon";

const WhatsAppSwitch = ({ checked, onChange, disabled = false, className = "" }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={disabled ? undefined : onChange}
    className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${checked
      ? "bg-[#00a884] justify-end"
      : "bg-transparent border-2 border-[#8696a0] justify-start"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
  >
    <div
      className={`w-4 h-4 rounded-full transition-transform ${checked ? "bg-[#111b21] mr-0.5" : "bg-[#8696a0] ml-0.5"
        }`}
    />
  </button>
);

const AddMemberModal = ({
  isOpen,
  onClose,
  onOpenPermissions,
  groupParticipants = [],
  convId,
  theme = "dark",
}) => {
  const { user: currentUser } = useUserStore();
  const storeUsers = useChatStore((state) => state.users) || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [sendMessageHistory, setSendMessageHistory] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery("");
    setSelectedUserIds([]);
    setSendMessageHistory(true);

    axiosInstance
      .get("/auth/users")
      .then(({ data }) => {
        const fetched =
          data?.data || data?.users || (Array.isArray(data) ? data : []);
        if (Array.isArray(fetched) && fetched.length > 0) {
          setAllUsers(fetched);
        } else {
          setAllUsers(storeUsers);
        }
      })
      .catch((err) => {
        console.warn("Error fetching /auth/users:", err);
        setAllUsers(storeUsers);
      });
  }, [isOpen, storeUsers]);

  const existingParticipantIds = useMemo(() => {
    return new Set(
      groupParticipants.map((p) => (p?._id || p)?.toString()).filter(Boolean)
    );
  }, [groupParticipants]);

  const candidateUsers = useMemo(() => {
    const pool = allUsers.length > 0 ? allUsers : storeUsers;
    const myId = currentUser?._id?.toString();
    const q = searchQuery.toLowerCase().trim();

    return pool
      .filter((u) => {
        const uId = (u?._id || u)?.toString();
        if (!uId || uId === myId || u?.isAI || uId === META_AI_USER_ID) {
          return false;
        }
        if (!q) return true;
        const name = (u?.username || u?.name || "").toLowerCase();
        const phone = (u?.phoneNumber || "").toLowerCase();
        return name.includes(q) || phone.includes(q);
      })
      .sort((a, b) => {
        const aInGroup = existingParticipantIds.has(a?._id?.toString());
        const bInGroup = existingParticipantIds.has(b?._id?.toString());
        if (aInGroup !== bInGroup) return aInGroup ? 1 : -1;
        return (a?.username || "").localeCompare(b?.username || "");
      });
  }, [allUsers, storeUsers, currentUser, searchQuery, existingParticipantIds]);

  const selectedUsers = useMemo(() => {
    const idSet = new Set(selectedUserIds);
    const pool = allUsers.length > 0 ? allUsers : storeUsers;
    return pool.filter((u) => idSet.has((u?._id || u)?.toString()));
  }, [selectedUserIds, allUsers, storeUsers]);

  const handleToggleUser = (uId) => {
    if (existingParticipantIds.has(uId)) return;
    setSelectedUserIds((prev) =>
      prev.includes(uId) ? prev.filter((id) => id !== uId) : [...prev, uId]
    );
  };

  const handleRemoveSelected = (uId, e) => {
    e.stopPropagation();
    setSelectedUserIds((prev) => prev.filter((id) => id !== uId));
  };

  const handleAddMember = async () => {
    if (selectedUserIds.length === 0 || !convId) return;
    setIsSubmitting(true);
    try {
      const { data } = await axiosInstance.put(`/chat/group/${convId}`, {
        addParticipants: selectedUserIds,
        sendMessageHistory,
      });
      const updated = data?.data || data;

      useChatStore.getState().updateGroupInfo(convId, updated);
      useLayoutStore.getState().setSelectedContact((prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...prev,
          ...updated,
          conversation: {
            ...prev?.conversation,
            ...updated,
          },
        };
      });

      toast.success(
        `${selectedUserIds.length} ${selectedUserIds.length === 1 ? "member" : "members"
        } added`
      );
      onClose();
    } catch (err) {
      console.error("Error adding members:", err);
      toast.error(err?.response?.data?.message || "Failed to add members");
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
        className="w-full max-w-[420px] bg-[#111b21] text-gray-200 border border-[#222e35] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
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
            Add member
          </h3>
        </div>

        <div className="p-4 pb-2">
          <div className="relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full border border-[#00a884] ring-1 ring-[#00a884] bg-[#202c33]/90 shadow-inner">
            <FiSearch size={18} className="text-gray-400 shrink-0 ml-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, number or @username"
              className="w-full bg-transparent text-[14px] text-white placeholder-gray-400 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 overflow-x-auto scrollbar-thin">
            {selectedUsers.map((u) => {
              const uId = (u?._id || u)?.toString();
              return (
                <div
                  key={uId}
                  className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-white/10 text-white text-[13px] shrink-0 border border-white/10"
                >
                  <img
                    src={u.profilePicture || "/default-avatar.png"}
                    alt={u.username}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="truncate max-w-[120px]">
                    {u.username || u.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveSelected(uId, e)}
                    className="p-0.5 rounded-full hover:bg-white/20 text-gray-300 hover:text-white transition cursor-pointer"
                  >
                    <RxCross2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin">
          {candidateUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No contacts found
            </div>
          ) : (
            candidateUsers.map((u) => {
              const uId = (u?._id || u)?.toString();
              const isAlreadyInGroup = existingParticipantIds.has(uId);
              const isSelected = selectedUserIds.includes(uId);
              const displayName = u.username || u.name || "User";

              return (
                <div
                  key={uId}
                  onClick={() => handleToggleUser(uId)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isAlreadyInGroup
                    ? "opacity-60 cursor-not-allowed bg-transparent"
                    : isSelected
                      ? "bg-white/[0.04] cursor-pointer hover:bg-white/[0.07]"
                      : "cursor-pointer hover:bg-white/5"
                    }`}
                >
                  <div className="shrink-0">
                    {isAlreadyInGroup ? (
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
                    src={u.profilePicture || "/default-avatar.png"}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h5 className="text-[14px] font-medium text-white truncate">
                      {displayName}
                    </h5>
                    <p className="text-[12px] truncate text-gray-400 mt-0.5">
                      {isAlreadyInGroup
                        ? "Already added to group"
                        : u.phoneNumber || u.about || "Available"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between gap-3 bg-[#111b21]">
          <p className="text-[13px] text-gray-200 leading-snug">
            <span className="font-semibold text-white">Message history:</span>{" "}
            Send <span className="text-[#00a884] font-medium">recent messages</span> to the
            selected member.
          </p>
          <WhatsAppSwitch
            checked={sendMessageHistory}
            onChange={() => setSendMessageHistory((prev) => !prev)}
          />
        </div>

        <div className="px-5 pb-2 pt-1">
          <button
            type="button"
            disabled={selectedUserIds.length === 0 || isSubmitting}
            onClick={handleAddMember}
            className={`w-full py-3 rounded-full font-semibold text-[14px] transition-all shadow-lg flex items-center justify-center ${selectedUserIds.length > 0 && !isSubmitting
              ? "bg-[#00a884] hover:bg-[#00a884]/90 text-[#111b21] cursor-pointer"
              : "bg-[#00a884]/40 text-[#111b21]/60 cursor-not-allowed"
              }`}
          >
            {isSubmitting ? "Adding..." : "Add member"}
          </button>
        </div>

        <div className="px-5 pb-4 pt-1 text-center">
          <p className="text-[12px] text-gray-400">
            All members are able to add others to this group.{" "}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (typeof onOpenPermissions === "function") {
                  onOpenPermissions();
                }
              }}
              className="text-[#00a884] font-medium hover:underline cursor-pointer"
            >
              Edit group permissions
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AddMemberModal;
