import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaCheck, FaSearch } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { toast } from "react-toastify";
import {
  createCustomList,
  renameCustomList,
  updateListContacts,
  isContactInList,
} from "../utils/chatListsUtil";

const ListPanelOverChatList = ({
  isOpen,
  mode = "create",
  initialListName = "",
  contacts = [],
  onClose,
  onSaved,
  theme = "dark",
}) => {
  const isDark = theme === "dark";
  const [listName, setListName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const isProtectedDefault = mode === "edit" && ["Favourites", "Favorites", "Communities"].includes(initialListName);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialListName) {
        setListName(initialListName);
        const preselected = (contacts || [])
          .filter((c) => isContactInList(c, initialListName))
          .map((c) => String(c._id || c.id));
        setSelectedContactIds(preselected);
      } else {
        setListName("");
        setSelectedContactIds([]);
      }
      setSearchQuery("");
    }
  }, [isOpen, mode, initialListName, contacts]);

  const filteredContacts = useMemo(() => {
    if (!contacts || contacts.length === 0) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        (c.username || "").toLowerCase().includes(q) ||
        (c.phoneNumber || "").toLowerCase().includes(q) ||
        (c.about || "").toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const toggleSelect = (id) => {
    const sId = String(id);
    setSelectedContactIds((prev) =>
      prev.includes(sId) ? prev.filter((item) => item !== sId) : [...prev, sId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedContactIds.length === contacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(contacts.map((c) => String(c._id || c.id)));
    }
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    const trimmed = listName.trim();
    if (!trimmed) {
      toast.error("Please enter a list name");
      return;
    }

    if (mode === "create") {
      const created = createCustomList(trimmed);
      if (!created) {
        toast.error("A list with this name already exists");
        return;
      }
      updateListContacts(created, selectedContactIds, contacts);
      toast.success(
        `List "${created}" created with ${selectedContactIds.length} chat${selectedContactIds.length !== 1 ? "s" : ""
        }`
      );
      if (onSaved) onSaved(created);
    } else {
      if (initialListName && trimmed !== initialListName && !isProtectedDefault) {
        renameCustomList(initialListName, trimmed);
      }
      updateListContacts(trimmed, selectedContactIds, contacts);
      toast.success(
        `List "${trimmed}" updated with ${selectedContactIds.length} chat${selectedContactIds.length !== 1 ? "s" : ""
        }`
      );
      if (onSaved) onSaved(trimmed);
    }

    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute inset-0 z-40 flex flex-col overflow-hidden select-none ${isDark ? "bg-[#111b21] text-[#e9edef]" : "bg-white text-[#111b21]"
            }`}
        >
          <div
            className={`pt-10 pb-4 px-5 flex items-end gap-6 shrink-0 shadow-xs ${isDark ? "bg-[#202c33] text-[#e9edef]" : "bg-[#008069] text-white"
              }`}
          >
            <button
              type="button"
              onClick={onClose}
              className="p-1 -ml-1 rounded-full hover:bg-black/15 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Back"
            >
              <FaArrowLeft size={18} />
            </button>
            <h2 className="text-[19px] font-medium tracking-wide leading-tight">
              {mode === "edit" ? "Edit list" : "New list"}
            </h2>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div
              className={`p-4 border-b shrink-0 ${isDark
                ? "border-white/5 bg-[#111b21]"
                : "border-black/5 bg-[#f0f2f5]/40"
                }`}
            >
              <label
                className={`block text-[11.5px] font-semibold mb-1.5 uppercase tracking-wider ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                  }`}
              >
                List name
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Work, Family, Friends..."
                  maxLength={25}
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                  className={`w-full py-2 pl-3.5 pr-8 text-[14.5px] rounded-xl outline-none transition-all border ${isDark
                    ? "bg-[#202c33] text-white border-white/10 focus:border-[#00a884] placeholder-[#8696a0]"
                    : "bg-white text-gray-900 border-gray-300 focus:border-[#008069] placeholder-gray-400"
                    }`}
                />
                {listName && (
                  <button
                    type="button"
                    onClick={() => setListName("")}
                    className="absolute right-2.5 p-1 rounded-full text-[#8696a0] hover:text-[#e9edef] cursor-pointer"
                    title="Clear"
                  >
                    <RxCross2 size={14} />
                  </button>
                )}
              </div>
              <div className="flex justify-between items-center mt-1.5 px-1">
                <span
                  className={`text-[11px] ${isDark ? "text-[#8696a0]" : "text-gray-500"
                    }`}
                >
                  {listName.trim()
                    ? "Filters chats by this custom list"
                    : "Enter a name for this list"}
                </span>
                <span
                  className={`text-[11px] font-mono ${isDark ? "text-[#8696a0]" : "text-gray-500"
                    }`}
                >
                  {listName.length}/25
                </span>
              </div>
            </div>

            <div className="px-3 pt-3 pb-2 shrink-0">
              <div
                className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 group border border-transparent focus-within:border-[#00a884] ring-1 ring-[#00a884]/40 focus-within:ring-2 focus-within:ring-[#00a884] ${isDark
                  ? "bg-[#202c33] text-[#e9edef]"
                  : "bg-[#f0f2f5] text-[#111b21]"
                  }`}
              >
                <FaSearch
                  className={`shrink-0 transition-colors group-focus-within:text-[#00a884] ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                    }`}
                  size={13}
                />
                <input
                  type="text"
                  placeholder="Search chats to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-[13.5px] placeholder:text-[#8696a0] truncate"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 rounded-full text-[#8696a0] hover:text-[#e9edef] cursor-pointer"
                  >
                    <RxCross2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {selectedContactIds.length > 0 && (
              <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
                {selectedContactIds.map((cId) => {
                  const contact = contacts.find(
                    (c) => String(c._id || c.id) === String(cId)
                  );
                  if (!contact) return null;
                  return (
                    <div
                      key={cId}
                      className={`flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full text-[12px] shrink-0 border ${isDark
                        ? "bg-[#202c33] border-white/10 text-white"
                        : "bg-[#f0f2f5] border-gray-200 text-gray-800"
                        }`}
                    >
                      <img
                        src={contact.profilePicture || "/default-avatar.png"}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="max-w-[85px] truncate">
                        {contact.username}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSelect(cId)}
                        className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-red-400 cursor-pointer"
                      >
                        <RxCross2 size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="px-4 py-2 flex items-center justify-between shrink-0 border-t border-black/[0.04] dark:border-white/[0.04]">
              <span
                className={`text-[12px] font-semibold uppercase tracking-wider ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                  }`}
              >
                Add chats{" "}
                {selectedContactIds.length > 0
                  ? `(${selectedContactIds.length})`
                  : ""}
              </span>
              {contacts.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[12px] font-medium text-[#00a884] hover:underline cursor-pointer"
                >
                  {selectedContactIds.length === contacts.length
                    ? "Deselect all"
                    : "Select all"}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12 text-[13px] text-[#8696a0]">
                  No chats found
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const cId = String(contact._id || contact.id);
                  const isSelected = selectedContactIds.includes(cId);

                  return (
                    <div
                      key={cId}
                      onClick={() => toggleSelect(cId)}
                      className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${isDark
                        ? "hover:bg-[#202c33]/70"
                        : "hover:bg-[#f5f6f6]"
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <img
                          src={contact.profilePicture || "/default-avatar.png"}
                          alt=""
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-white/5"
                        />
                        <div className="min-w-0 flex flex-col">
                          <span className="text-[14.5px] font-medium truncate leading-snug">
                            {contact.username}
                          </span>
                          <span
                            className={`text-[12.5px] truncate ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                              }`}
                          >
                            {contact.about ||
                              contact.phoneNumber ||
                              "Hey there! I am using WhatsApp."}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${isSelected
                          ? "bg-[#00a884] text-[#111b21] shadow-xs"
                          : isDark
                            ? "border-2 border-[#8696a0]/40"
                            : "border-2 border-gray-300"
                          }`}
                      >
                        {isSelected && (
                          <FaCheck size={11} className="stroke-[1.5]" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleSave}
              disabled={!listName.trim()}
              className={`absolute bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer z-30 ${listName.trim()
                ? "bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] shadow-emerald-500/30"
                : "bg-gray-400 dark:bg-gray-700 text-gray-200 cursor-not-allowed opacity-50"
                }`}
              title={mode === "edit" ? "Save list" : "Create list"}
            >
              <FaCheck size={20} className="stroke-[1]" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ListPanelOverChatList;
