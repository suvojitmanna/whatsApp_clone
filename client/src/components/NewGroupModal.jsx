import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import {
  FiArrowLeft,
  FiSearch,
  FiEdit2,
  FiUserPlus,
  FiLink,
  FiCheck,
  FiImage,
} from "react-icons/fi";
import {FaUser } from "react-icons/fa";
import { MdOutlineChat, MdChevronRight, MdOutlineSchedule } from "react-icons/md";
import { BsEmojiSmile } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-toastify";
import axiosInstance from "../services/url.services";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import useLayoutStore from "../store/layoutStore";
import { useChatStore } from "../store/chatStore";
import { getAvatarBg, getAvatarInitial } from "../pages/chatSection/ChatList";
import { META_AI_USER_ID } from "./common/MetaAiIcon";

const DISAPPEARING_OPTIONS = [
  "Off",
  "After reading",
  "24 hours",
  "7 days",
  "90 days",
];

const WhatsAppSwitch = ({ checked, onChange, className = "" }) => (
  <button
    type="button"
    onClick={onChange}
    className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${checked
        ? "bg-[#25d366] justify-end"
        : "bg-transparent border-2 border-[#8696a0] justify-start"
      } ${className}`}
  >
    <div
      className={`w-4 h-4 rounded-full transition-transform ${checked ? "bg-[#111b21] mr-0.5" : "bg-[#8696a0] ml-0.5"
        }`}
    />
  </button>
);

const NewGroupModal = ({ isOpen, onClose }) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const { user: currentUser } = useUserStore();
  const { setSelectedContact } = useLayoutStore();
  const allUsers = useChatStore((state) => state.users) || [];
  const fetchConversations = useChatStore((state) => state.fetchConversations);

  // Screen navigation: 1 = Add group members, 2 = New group info, 3 = Group permissions
  const [screen, setScreen] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Step 2 Form States
  const [groupName, setGroupName] = useState("");
  const [groupImageFile, setGroupImageFile] = useState(null);
  const [groupImagePreview, setGroupImagePreview] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [disappearingDuration, setDisappearingDuration] = useState("Off");
  const [showDisappearingModal, setShowDisappearingModal] = useState(false);
  const [tempDisappearingDuration, setTempDisappearingDuration] = useState("Off");

  // Step 3 Group Permissions States
  const [permissions, setPermissions] = useState({
    editGroupSettings: true,
    sendMessages: true,
    addMembers: true,
    inviteViaLink: true,
    approveNewMembers: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setScreen(1);
      setSearchQuery("");
      setSelectedUserIds([]);
      setGroupName("");
      setGroupImageFile(null);
      setGroupImagePreview("");
      setShowEmojiPicker(false);
      setDisappearingDuration("Off");
      setShowDisappearingModal(false);
      setPermissions({
        editGroupSettings: true,
        sendMessages: true,
        addMembers: true,
        inviteViaLink: true,
        approveNewMembers: false,
      });
    }
  }, [isOpen]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showEmojiPicker]);

  // Candidate users (excluding self and Meta AI)
  const candidateUsers = useMemo(() => {
    const currentId = currentUser?._id?.toString();
    return allUsers.filter((u) => {
      const uId = u?._id?.toString();
      if (!uId || uId === currentId || uId === META_AI_USER_ID || u?.isAI) {
        return false;
      }
      return true;
    });
  }, [allUsers, currentUser]);

  // Group contacts alphabetically
  const groupedUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = candidateUsers.filter(
      (u) =>
        !q ||
        (u.username || "").toLowerCase().includes(q) ||
        (u.phoneNumber || "").toLowerCase().includes(q)
    );

    const sorted = [...filtered].sort((a, b) =>
      (a.username || "").localeCompare(b.username || "")
    );

    const groups = {};
    sorted.forEach((u) => {
      const firstLetter = (u.username || "?").charAt(0).toUpperCase();
      const key = /[A-Z]/.test(firstLetter) ? firstLetter : "#";
      if (!groups[key]) groups[key] = [];
      groups[key].push(u);
    });

    return groups;
  }, [candidateUsers, searchQuery]);

  const toggleSelectUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setGroupImageFile(file);
      setGroupImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateGroup = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least 1 member");
      return;
    }

    try {
      setIsSubmitting(true);
      const finalName = groupName.trim() || "New Group";
      const formData = new FormData();
      formData.append("name", finalName);
      formData.append("participants", JSON.stringify(selectedUserIds));
      formData.append("disappearingDuration", disappearingDuration);
      formData.append("groupPermissions", JSON.stringify(permissions));

      if (groupImageFile) {
        formData.append("media", groupImageFile);
      }

      const res = await axiosInstance.post("/chat/group", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newGroupConv = res.data?.data || res.data;
      toast.success(`Group "${finalName}" created!`);

      if (typeof fetchConversations === "function") {
        fetchConversations();
      }

      if (newGroupConv) {
        setSelectedContact({
          ...newGroupConv,
          isGroup: true,
          username: newGroupConv.groupName || finalName,
          profilePicture: newGroupConv.groupProfileImage || groupImagePreview || "",
          conversation: newGroupConv,
        });
      }

      onClose();
    } catch (err) {
      console.error("Create group error:", err);
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to create group"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute inset-0 z-50 flex flex-col overflow-hidden select-none h-full w-full ${isDark ? "bg-[#111b21] text-[#e9edef]" : "bg-white text-[#111b21]"
            }`}
        >
          {/* ========================================================= */}
          {/* SCREEN 1: ADD GROUP MEMBERS                                */}
          {/* ========================================================= */}
          {screen === 1 && (
            <div className="flex-1 flex flex-col h-full min-h-0 relative select-none">
              {/* Header */}
              <div
                className={`flex items-center gap-4 px-5 py-4 shrink-0 border-b ${isDark ? "bg-[#111b21] border-[#222d34]" : "bg-[#008069] text-white border-transparent"
                  }`}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
                  title="Back"
                >
                  <FiArrowLeft size={20} />
                </button>
                <h3 className="font-semibold text-base tracking-tight">
                  Add group members
                </h3>
              </div>

              {/* Selected chips bar */}
              {selectedUserIds.length > 0 && (
                <div
                  className={`px-4 py-3 flex items-center gap-2.5 overflow-x-auto scrollbar-hide border-b shrink-0 flex-wrap max-h-32 ${isDark ? "bg-[#111b21] border-[#222d34]" : "bg-gray-50 border-gray-200"
                    }`}
                >
                  {selectedUserIds.map((id) => {
                    const u = candidateUsers.find((user) => user._id === id);
                    if (!u) return null;
                    return (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2 py-1 shrink-0 select-none mr-2.5"
                      >
                        {u.profilePicture ? (
                          <img
                            src={u.profilePicture}
                            alt={u.username}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[#182229] border border-[#202c33] text-[#53bdeb] flex items-center justify-center shrink-0">
                            <FaUser size={12} />
                          </div>
                        )}
                        <span className="truncate max-w-[130px] text-sm text-[#e9edef] font-normal">
                          {u.username}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSelectUser(id)}
                          className="text-[#8696a0] hover:text-white p-0.5 cursor-pointer transition-colors"
                        >
                          <RxCross2 size={16} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Search bar */}
              <div className="px-4 py-2 border-b border-black/5 dark:border-white/5 shrink-0">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${isDark
                      ? "bg-[#202c33] border-transparent text-[#e9edef]"
                      : "bg-gray-100 border-transparent text-gray-800"
                    }`}
                >
                  <FiSearch className="text-gray-400 shrink-0" size={15} />
                  <input
                    type="text"
                    placeholder="Search name or number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-xs placeholder:text-gray-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-gray-400 hover:text-gray-200"
                    >
                      <RxCross2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Grouped Contacts List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-4">
                {Object.keys(groupedUsers).length > 0 ? (
                  Object.keys(groupedUsers).map((letter) => (
                    <div key={letter} className="space-y-1">
                      <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {letter}
                      </div>
                      <div className="space-y-1">
                        {groupedUsers[letter].map((contact) => {
                          const isSelected = selectedUserIds.includes(contact._id);
                          return (
                            <div
                              key={contact._id}
                              onClick={() => toggleSelectUser(contact._id)}
                              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-colors ${isSelected
                                  ? isDark
                                    ? "bg-[#2a3942]"
                                    : "bg-gray-200"
                                  : isDark
                                    ? "hover:bg-white/5"
                                    : "hover:bg-black/5"
                                }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                {contact.profilePicture ? (
                                  <img
                                    src={contact.profilePicture}
                                    alt={contact.username}
                                    className="w-11 h-11 rounded-full object-cover shrink-0 shadow-xs"
                                  />
                                ) : (
                                  <div
                                    style={{
                                      backgroundColor: getAvatarBg(contact.username),
                                    }}
                                    className="w-11 h-11 rounded-full text-white flex items-center justify-center font-semibold text-base shrink-0 shadow-xs"
                                  >
                                    {getAvatarInitial(contact.username)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="text-sm font-semibold truncate leading-snug">
                                    {contact.username}
                                  </h4>
                                  {contact.about && (
                                    <p className="text-xs opacity-60 truncate mt-0.5">
                                      {contact.about}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center opacity-60 text-sm">
                    {searchQuery ? "No contacts found" : "No contacts available"}
                  </div>
                )}
              </div>

              {/* Bottom "Next" Button */}
              <div className="p-4 border-t border-black/5 dark:border-white/5 shrink-0 bg-transparent">
                <button
                  type="button"
                  disabled={selectedUserIds.length === 0}
                  onClick={() => setScreen(2)}
                  className={`w-full py-3.5 rounded-full font-semibold text-sm sm:text-base flex items-center justify-center transition-all cursor-pointer shadow-lg ${selectedUserIds.length > 0
                      ? "bg-[#00a884] hover:bg-[#20ba5c] text-black"
                      : "bg-[#00a884]/40 text-black/50 cursor-not-allowed"
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN 2: NEW GROUP INFO (Step 2)                         */}
          {/* ========================================================= */}
          {screen === 2 && (
            <div className="flex-1 flex flex-col h-full min-h-0 relative select-none">
              {/* Header */}
              <div
                className={`flex items-center gap-4 px-5 py-4 shrink-0 border-b ${isDark ? "bg-[#111b21] border-[#222d34]" : "bg-[#008069] text-white border-transparent"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setScreen(1)}
                  className="p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
                  title="Back"
                >
                  <FiArrowLeft size={20} />
                </button>
                <h3 className="font-semibold text-base tracking-tight">New group</h3>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-7">
                {/* Center Circular Avatar Container */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-36 h-36 rounded-full bg-[#182229] border border-white/5 hover:border-[#00a884]/50 flex items-center justify-center cursor-pointer overflow-hidden group transition-all shadow-inner"
                    title="Add group icon"
                  >
                    {groupImagePreview ? (
                      <img
                        src={groupImagePreview}
                        alt="Group Icon"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl bg-[#374248]/90 text-white shadow-md">
                        <FiImage size={24} className="text-white" />
                        <span className="text-[11px] font-medium text-center leading-tight">
                          Add group<br />icon
                        </span>
                      </div>
                    )}

                    {/* Hover overlay if image already chosen */}
                    {groupImagePreview && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-medium">
                        <FiImage size={24} />
                        <span>Change</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Group subject input with green underline */}
                <div className="relative pt-2">
                  <div className="flex items-center gap-3 border-b-2 border-[#00a884] pb-2">
                    <input
                      type="text"
                      maxLength={100}
                      autoFocus
                      placeholder="Group subject (optional)"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-base placeholder:text-gray-500 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      className="text-gray-400 hover:text-[#00a884] transition p-1 cursor-pointer shrink-0"
                      title="Add emoji"
                    >
                      <BsEmojiSmile size={20} />
                    </button>
                  </div>

                  {/* Emoji Picker Popup */}
                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute right-0 top-12 z-50 shadow-2xl rounded-2xl overflow-hidden"
                    >
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setGroupName((prev) => prev + emojiData.emoji);
                          setShowEmojiPicker(false);
                        }}
                        theme={theme}
                        height={350}
                        width={300}
                      />
                    </div>
                  )}
                </div>

                {/* Settings Rows */}
                <div className="space-y-1 pt-2 divide-y divide-white/5">
                  {/* Disappearing messages */}
                  <div
                    onClick={() => {
                      setTempDisappearingDuration(disappearingDuration);
                      setShowDisappearingModal(true);
                    }}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-white/5 px-2 rounded-xl transition-colors"
                  >
                    <div>
                      <h4 className="text-sm font-medium leading-snug">
                        Disappearing messages
                      </h4>
                      <p className="text-xs opacity-60 mt-0.5">
                        {disappearingDuration}
                      </p>
                    </div>
                    <MdChevronRight size={22} className="text-gray-400 shrink-0" />
                  </div>

                  {/* Group permissions */}
                  <div
                    onClick={() => setScreen(3)}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-white/5 px-2 rounded-xl transition-colors"
                  >
                    <div>
                      <h4 className="text-sm font-medium leading-snug">
                        Group permissions
                      </h4>
                    </div>
                    <MdChevronRight size={22} className="text-gray-400 shrink-0" />
                  </div>
                </div>

                {/* Bottom Circular Green Checkmark Button */}
                <div className="pt-6 flex justify-center pb-2">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    disabled={selectedUserIds.length === 0 || isSubmitting}
                    onClick={handleCreateGroup}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl text-black cursor-pointer transition-all ${selectedUserIds.length > 0 && !isSubmitting
                        ? "bg-[#25d366] hover:bg-[#20ba5c]"
                        : "bg-[#25d366]/40 text-black/50 cursor-not-allowed"
                      }`}
                    title="Create group"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiCheck size={26} className="stroke-[3]" />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN 3: GROUP PERMISSIONS (Image 3)                     */}
          {/* ========================================================= */}
          {screen === 3 && (
            <div className="flex-1 flex flex-col h-full min-h-0 relative select-none">
              {/* Header */}
              <div
                className={`flex items-center gap-4 px-5 py-4 shrink-0 border-b ${isDark ? "bg-[#111b21] border-[#222d34]" : "bg-[#008069] text-white border-transparent"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setScreen(2)}
                  className="p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
                  title="Back"
                >
                  <FiArrowLeft size={20} />
                </button>
                <h3 className="font-semibold text-base tracking-tight">
                  Group permissions
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                {/* Members can section */}
                <div>
                  <h4 className="text-xs font-medium text-gray-400 mb-3">
                    Members can:
                  </h4>
                  <div className="space-y-4">
                    {/* Edit group settings */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <FiEdit2 size={18} className="text-gray-400 shrink-0 mt-1" />
                        <div>
                          <h5 className="text-sm font-medium">Edit group settings</h5>
                          <p className="text-xs opacity-60 leading-relaxed mt-0.5">
                            This includes the name, icon, description, disappearing
                            message timer, and the ability to pin, keep or unkeep messages.
                          </p>
                        </div>
                      </div>
                      <WhatsAppSwitch
                        checked={permissions.editGroupSettings}
                        onChange={() =>
                          setPermissions((p) => ({
                            ...p,
                            editGroupSettings: !p.editGroupSettings,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    {/* Send new messages */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <MdOutlineChat size={18} className="text-gray-400 shrink-0" />
                        <h5 className="text-sm font-medium">Send new messages</h5>
                      </div>
                      <WhatsAppSwitch
                        checked={permissions.sendMessages}
                        onChange={() =>
                          setPermissions((p) => ({
                            ...p,
                            sendMessages: !p.sendMessages,
                          }))
                        }
                      />
                    </div>

                    {/* Add other members */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <FiUserPlus size={18} className="text-gray-400 shrink-0" />
                        <h5 className="text-sm font-medium">Add other members</h5>
                      </div>
                      <WhatsAppSwitch
                        checked={permissions.addMembers}
                        onChange={() =>
                          setPermissions((p) => ({
                            ...p,
                            addMembers: !p.addMembers,
                          }))
                        }
                      />
                    </div>

                    {/* Invite via link */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <FiLink size={18} className="text-gray-400 shrink-0" />
                        <h5 className="text-sm font-medium">Invite via link</h5>
                      </div>
                      <WhatsAppSwitch
                        checked={permissions.inviteViaLink}
                        onChange={() =>
                          setPermissions((p) => ({
                            ...p,
                            inviteViaLink: !p.inviteViaLink,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Admins can section */}
                <div className="pt-2 border-t border-white/5">
                  <h4 className="text-xs font-medium text-gray-400 mb-3">
                    Admins can:
                  </h4>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="relative shrink-0 text-gray-400 mt-1">
                        <FaUser size={15} />
                        <MdOutlineSchedule
                          size={11}
                          className="absolute -bottom-1 -right-1 text-gray-300 bg-[#111b21] rounded-full"
                        />
                      </div>
                      <div>
                        <h5 className="text-sm font-medium">Approve new members</h5>
                        <p className="text-xs opacity-60 leading-relaxed mt-0.5">
                          When turned on, admins must approve anyone who wants to join
                          this group.{" "}
                          <span className="text-[#00a884] font-medium hover:underline cursor-pointer">
                            Learn more
                          </span>
                        </p>
                      </div>
                    </div>
                    <WhatsAppSwitch
                      checked={permissions.approveNewMembers}
                      onChange={() =>
                        setPermissions((p) => ({
                          ...p,
                          approveNewMembers: !p.approveNewMembers,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ========================================================= */}
          {/* SCREEN 4: DISAPPEARING MESSAGES DIALOG (Image 4)          */}
          {/* ========================================================= */}
          {showDisappearingModal && (
            <div
              className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none"
              onClick={() => setShowDisappearingModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }}
                transition={{ duration: 0.14 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${isDark
                    ? "bg-[#202c33] border-white/10 text-[#e9edef]"
                    : "bg-white border-gray-200 text-[#111b21]"
                  }`}
              >
                <h3 className="text-lg font-semibold tracking-tight mb-2">
                  Disappearing messages
                </h3>
                <p className="text-xs opacity-70 leading-relaxed mb-5">
                  All new messages in this chat will disappear after the selected
                  duration.
                </p>

                <div className="space-y-3 mb-6">
                  {DISAPPEARING_OPTIONS.map((opt) => {
                    const isSelected = tempDisappearingDuration === opt;
                    return (
                      <div
                        key={opt}
                        onClick={() => setTempDisappearingDuration(opt)}
                        className="flex items-center gap-3.5 py-1.5 cursor-pointer"
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                              ? "border-[#00a884]"
                              : isDark
                                ? "border-gray-500"
                                : "border-gray-400"
                            }`}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#00a884]" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowDisappearingModal(false)}
                    className="text-sm font-medium text-[#00a884] hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisappearingDuration(tempDisappearingDuration);
                      setShowDisappearingModal(false);
                    }}
                    className="px-6 py-2 rounded-full text-sm font-semibold bg-[#25d366] text-black hover:bg-[#20ba5c] transition-all cursor-pointer shadow-md"
                  >
                    OK
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewGroupModal;
