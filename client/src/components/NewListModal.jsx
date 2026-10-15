import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaSearch, FaUserPlus } from "react-icons/fa";
import { MdList } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { toast } from "react-toastify";

import useThemeStore from "../store/themeStore";
import { createCustomList, toggleContactList } from "../utils/chatListsUtil";

const NewListModal = ({ isOpen, onClose, contacts = [], onCreated = null }) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [listName, setListName] = useState("");
  const [searchContact, setSearchContact] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState([]);

  if (!isOpen) return null;

  const filteredContacts = useMemo(() => {
    if (!contacts || contacts.length === 0) return [];
    const q = searchContact.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      (c.username || "").toLowerCase().includes(q)
    );
  }, [contacts, searchContact]);

  const toggleSelect = (contactId) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const trimmed = listName.trim();
    if (!trimmed) {
      toast.error("Please enter a list name");
      return;
    }

    const created = createCustomList(trimmed);
    if (!created) {
      toast.error("A list with this name already exists");
      return;
    }
    if (selectedContactIds.length > 0) {
      selectedContactIds.forEach((cId) => {
        const contact = contacts.find((c) => c._id === cId);
        if (contact) {
          toggleContactList(contact, created);
        }
      });
    }

    toast.success(`List "${created}" created with ${selectedContactIds.length} chats`);
    setListName("");
    setSelectedContactIds([]);
    if (onCreated) onCreated(created);
    onClose();
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
          <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <MdList size={22} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-[17px] leading-tight">New list</h3>
                <span className="text-[12px] text-[#8696a0]">
                  Create a custom filter for your chats
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

          <form onSubmit={handleCreate} className="flex flex-col flex-1 min-h-0 pt-4">
            <div className="mb-4">
              <label className="block text-[12.5px] font-semibold text-[#8696a0] uppercase tracking-wider mb-1.5 px-1">
                List Name
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Work, Family, Project, Gym..."
                value={listName}
                maxLength={30}
                onChange={(e) => setListName(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-2xl text-[14px] outline-none transition-all border ${
                  isDark
                    ? "bg-[#202c33] text-white border-white/10 focus:border-[#00a884] placeholder-[#8696a0]"
                    : "bg-gray-100 text-gray-900 border-gray-200 focus:border-[#00a884] placeholder-gray-400"
                }`}
              />
            </div>
            <div className="flex items-center justify-between mb-2 px-1">
              <label className="text-[12.5px] font-semibold text-[#8696a0] uppercase tracking-wider">
                Add chats ({selectedContactIds.length} selected)
              </label>
            </div>

            <div className="relative mb-2.5">
              <FaSearch
                size={12}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDark ? "text-[#8696a0]" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                placeholder="Search chats to add..."
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-[13px] rounded-xl outline-none transition-all border ${
                  isDark
                    ? "bg-[#202c33] text-white border-white/5 focus:border-[#00a884] placeholder-[#8696a0]"
                    : "bg-gray-50 text-gray-900 border-gray-200 focus:border-[#00a884] placeholder-gray-400"
                }`}
              />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 py-1 max-h-[220px]">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-6 text-[13px] text-[#8696a0]">
                  No chats found
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedContactIds.includes(contact._id);
                  return (
                    <div
                      key={contact._id}
                      onClick={() => toggleSelect(contact._id)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                          ? isDark
                            ? "bg-emerald-500/15 border-emerald-500/40 text-white"
                            : "bg-emerald-50 border-emerald-500/30 text-emerald-800"
                          : isDark
                            ? "bg-[#202c33]/40 border-transparent hover:bg-white/5 text-white"
                            : "bg-gray-50 border-transparent hover:bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={contact.profilePicture || "/default-avatar.png"}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10"
                        />
                        <span className="text-[14px] font-medium truncate">
                          {contact.username}
                        </span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[#00a884] text-[#111b21] shadow-sm"
                            : isDark
                              ? "border-2 border-[#8696a0]/40"
                              : "border-2 border-gray-300"
                        }`}
                      >
                        {isSelected && <FaCheck size={11} className="stroke-[1.5]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="pt-4 border-t border-white/10 mt-3 flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-2.5 rounded-full font-medium text-sm transition-all cursor-pointer text-center ${
                  isDark
                    ? "bg-white/10 hover:bg-white/15 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!listName.trim()}
                className="flex-1 py-2.5 rounded-full bg-[#00a884] hover:bg-[#06cf9c] disabled:opacity-40 disabled:cursor-not-allowed text-[#111b21] font-bold text-sm transition-all shadow-md cursor-pointer text-center"
              >
                Create list
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NewListModal;
