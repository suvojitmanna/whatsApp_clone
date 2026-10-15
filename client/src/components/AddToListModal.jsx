import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHeart,
  FaCheck,
  FaPlus,
  FaTrash,
  FaBriefcase,
  FaUserFriends,
  FaHome,
  FaTag,
} from "react-icons/fa";
import { MdList } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { toast } from "react-toastify";

import useThemeStore from "../store/themeStore";
import {
  getAllLists,
  createCustomList,
  deleteCustomList,
  getContactListNames,
  toggleContactList,
  DEFAULT_CHAT_LISTS,
} from "../utils/chatListsUtil";

const getListIcon = (name) => {
  switch (name) {
    case "Favorites":
      return {
        icon: <FaHeart size={14} />,
        bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      };
    case "Friends":
      return {
        icon: <FaUserFriends size={14} />,
        bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      };
    case "Family":
      return {
        icon: <FaHome size={14} />,
        bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      };
    case "Work":
      return {
        icon: <FaBriefcase size={14} />,
        bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };
    default:
      return {
        icon: <FaTag size={13} />,
        bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      };
  }
};

const AddToListModal = ({ isOpen, onClose, contact }) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [lists, setLists] = useState(() => getAllLists());
  const [activeLists, setActiveLists] = useState(() =>
    contact ? getContactListNames(contact) : []
  );
  const [newListName, setNewListName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (contact) {
      setActiveLists(getContactListNames(contact));
    }
  }, [contact]);

  useEffect(() => {
    const handleListsChanged = () => {
      setLists(getAllLists());
      if (contact) {
        setActiveLists(getContactListNames(contact));
      }
    };
    window.addEventListener("whatsapp_lists_changed", handleListsChanged);
    return () =>
      window.removeEventListener("whatsapp_lists_changed", handleListsChanged);
  }, [contact]);

  if (!isOpen) return null;

  const handleToggle = (listName) => {
    if (!contact) return;
    const isCurrentlyIn = activeLists.includes(listName);
    const updated = toggleContactList(contact, listName);
    setActiveLists(updated);

    if (isCurrentlyIn) {
      toast.info(`Removed ${contact.username || "chat"} from ${listName}`);
    } else {
      toast.success(`Added ${contact.username || "chat"} to ${listName}`);
    }
  };

  const handleCreateList = (e) => {
    e.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;

    const created = createCustomList(trimmed);
    if (created) {
      // Automatically add this contact to the newly created list
      toggleContactList(contact, created);
      setNewListName("");
      setIsCreating(false);
      toast.success(`Created list "${created}" and added contact`);
    } else {
      toast.error("List already exists or invalid name");
    }
  };

  const handleDeleteList = (e, listName) => {
    e.stopPropagation();
    if (window.confirm(`Delete the list "${listName}"?`)) {
      deleteCustomList(listName);
      toast.info(`Deleted list "${listName}"`);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, type: "spring", damping: 25 }}
          className={`w-full max-w-md rounded-3xl p-5 md:p-6 shadow-2xl border flex flex-col max-h-[85vh] ${
            isDark
              ? "bg-[#1f2c34] border-white/10 text-white"
              : "bg-white border-gray-200 text-gray-900"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {contact?.profilePicture ? (
                <img
                  src={contact.profilePicture}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <MdList size={20} />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-[17px] leading-tight truncate">
                  Add to list
                </h3>
                <span className="text-[12.5px] text-[#8696a0] truncate">
                  {contact?.username
                    ? `Lists for ${contact.username}`
                    : "Select lists for this chat"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isDark
                  ? "hover:bg-white/10 text-[#8696a0] hover:text-white"
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              }`}
            >
              <RxCross2 size={20} />
            </button>
          </div>

          {/* Subtitle / Tip */}
          <div className="py-3 px-1 text-[13px] text-[#8696a0] leading-relaxed">
            Organize your conversations into custom lists. Filter chats by list at the top of your chat list.
          </div>

          {/* Lists Selection */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 py-1 pr-1">
            {lists.map((listName) => {
              const isChecked = activeLists.includes(listName);
              const { icon, bg } = getListIcon(listName);
              const isCustom = !DEFAULT_CHAT_LISTS.includes(listName);

              return (
                <div
                  key={listName}
                  onClick={() => handleToggle(listName)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border group ${
                    isChecked
                      ? isDark
                        ? "bg-[#202c33] border-emerald-500/40 text-white shadow-sm ring-1 ring-emerald-500/20"
                        : "bg-emerald-50/50 border-emerald-500/30 text-gray-900"
                      : isDark
                        ? "bg-[#202c33]/60 border-white/5 hover:border-white/15 text-white"
                        : "bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${bg}`}
                    >
                      {icon}
                    </div>
                    <span className="text-[14.5px] font-semibold truncate">
                      {listName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteList(e, listName)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Delete list"
                      >
                        <FaTrash size={12} />
                      </button>
                    )}

                    {/* WhatsApp Checkbox */}
                    <div
                      className={`w-5.5 h-5.5 rounded-md flex items-center justify-center transition-all ${
                        isChecked
                          ? "bg-[#00a884] text-[#111b21] shadow-sm"
                          : isDark
                            ? "border-2 border-[#8696a0]/50 group-hover:border-[#8696a0]"
                            : "border-2 border-gray-300 group-hover:border-gray-400"
                      }`}
                    >
                      {isChecked && <FaCheck size={12} className="stroke-[1.5]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create New List Accordion / Form */}
          <div className="pt-3 border-t border-white/10 mt-2 shrink-0">
            {isCreating ? (
              <form onSubmit={handleCreateList} className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="New list name (e.g. Project, Gym)..."
                  maxLength={30}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-[13.5px] outline-none transition-all border ${
                    isDark
                      ? "bg-[#202c33] text-white border-white/10 focus:border-[#00a884] placeholder-[#8696a0]"
                      : "bg-gray-100 text-gray-900 border-gray-200 focus:border-[#00a884] placeholder-gray-400"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!newListName.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#06cf9c] disabled:opacity-40 disabled:cursor-not-allowed text-[#111b21] font-semibold text-[13.5px] transition-all cursor-pointer shadow-sm shrink-0"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setNewListName("");
                  }}
                  className={`p-2 rounded-xl transition-colors ${
                    isDark
                      ? "hover:bg-white/10 text-[#8696a0]"
                      : "hover:bg-gray-100 text-gray-500"
                  }`}
                >
                  <RxCross2 size={16} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className={`w-full py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 font-medium text-[14px] transition-all cursor-pointer border border-dashed ${
                  isDark
                    ? "border-white/15 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-emerald-400"
                    : "border-gray-300 hover:border-emerald-500/50 hover:bg-emerald-50 text-emerald-600"
                }`}
              >
                <FaPlus size={12} />
                <span>Create new list</span>
              </button>
            )}
          </div>

          {/* Done Button */}
          <div className="pt-3 mt-1 flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-full bg-[#00a884] hover:bg-[#06cf9c] active:scale-[0.98] text-[#111b21] font-bold text-[14.5px] transition-all cursor-pointer shadow-md text-center"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddToListModal;
