import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaHeart, FaCheck } from "react-icons/fa";
import { MdList } from "react-icons/md";
import { toast } from "react-toastify";

const DEFAULT_LISTS = ["Favorites", "Friends", "Family", "Work"];

const ContactInfoListsTab = ({
  chatId,
  selectedContact,
  theme,
}) => {
  const isDark = theme === "dark";

  const [customLists, setCustomLists] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("whatsapp_all_custom_lists") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [contactLists, setContactLists] = useState(() => {
    try {
      const map = JSON.parse(
        localStorage.getItem("whatsapp_contact_lists") || "{}"
      );
      return (chatId && map[chatId]) || [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("whatsapp_favourite_chats") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    if (!chatId) return;
    try {
      const map = JSON.parse(
        localStorage.getItem("whatsapp_contact_lists") || "{}"
      );
      setContactLists(map[chatId] || []);
    } catch { }
  }, [chatId]);

  useEffect(() => {
    const handleSyncLists = () => {
      try {
        const custom = JSON.parse(
          localStorage.getItem("whatsapp_all_custom_lists") || "[]"
        );
        setCustomLists(custom);
        const map = JSON.parse(
          localStorage.getItem("whatsapp_contact_lists") || "{}"
        );
        if (chatId) setContactLists(map[chatId] || []);
      } catch { }
    };
    window.addEventListener("whatsapp_lists_changed", handleSyncLists);
    return () =>
      window.removeEventListener("whatsapp_lists_changed", handleSyncLists);
  }, [chatId]);

  const handleToggleContactList = (listName) => {
    if (!chatId || !listName) return;
    const isMember = contactLists.includes(listName);
    const updated = isMember
      ? contactLists.filter((l) => l !== listName)
      : [...contactLists, listName];
    setContactLists(updated);
    try {
      const map = JSON.parse(
        localStorage.getItem("whatsapp_contact_lists") || "{}"
      );
      map[chatId] = updated;
      localStorage.setItem("whatsapp_contact_lists", JSON.stringify(map));
    } catch { }

    if (listName === "Favorites") {
      let nextFavs;
      if (isMember) {
        nextFavs = favorites.filter((id) => id !== chatId);
      } else {
        nextFavs = [...favorites, chatId];
      }
      setFavorites(nextFavs);
      try {
        localStorage.setItem(
          "whatsapp_favourite_chats",
          JSON.stringify(nextFavs)
        );
      } catch { }
    }

    window.dispatchEvent(new Event("whatsapp_lists_changed"));

    toast.success(
      isMember ? `Removed from ${listName}` : `Added to ${listName}`
    );
  };

  const handleCreateNewList = (e) => {
    e?.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;
    if (DEFAULT_LISTS.includes(trimmed) || customLists.includes(trimmed)) {
      if (!contactLists.includes(trimmed)) {
        handleToggleContactList(trimmed);
      }
      setNewListName("");
      return;
    }
    const updatedCustom = [...customLists, trimmed];
    setCustomLists(updatedCustom);
    try {
      localStorage.setItem(
        "whatsapp_all_custom_lists",
        JSON.stringify(updatedCustom)
      );
    } catch { }
    window.dispatchEvent(new Event("whatsapp_lists_changed"));
    handleToggleContactList(trimmed);
    setNewListName("");
  };

  return (
    <motion.div
      key="tab-lists"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col flex-1 overflow-y-auto scrollbar-hide p-5 select-none"
    >
      <p className="text-[13.5px] text-[#8696a0] leading-relaxed mb-4">
        Select lists to add <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{selectedContact?.username || "this contact"}</span> to. You can easily filter conversations by list in your chat list.
      </p>

      <div className="flex flex-col gap-2 mb-6">
        {Array.from(new Set([...DEFAULT_LISTS, ...customLists])).map((listName) => {
          const isInList = contactLists.includes(listName);
          return (
            <div
              key={listName}
              onClick={() => handleToggleContactList(listName)}
              className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border ${isDark
                ? "bg-[#202c33] border-white/5 hover:border-white/10"
                : "bg-white border-black/5 hover:border-black/10 shadow-sm"
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${listName === "Favorites"
                    ? "bg-rose-500/10 text-rose-400"
                    : "bg-emerald-500/10 text-emerald-400"
                    }`}
                >
                  {listName === "Favorites" ? <FaHeart size={15} /> : <MdList size={18} />}
                </div>
                <span className={`text-[14.5px] font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                  {listName}
                </span>
              </div>

              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${isInList ? "bg-[#00a884] text-[#111b21]" : "border border-[#8696a0]/40"
                  }`}
              >
                {isInList && <FaCheck size={11} />}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleCreateNewList} className="flex items-center gap-2">
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list name..."
          maxLength={30}
          className={`flex-1 px-4 py-2.5 rounded-xl text-[14px] outline-none transition-all ${isDark
            ? "bg-[#202c33] text-white placeholder-[#8696a0] border border-white/10 focus:border-[#00a884]"
            : "bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-[#00a884]"
            }`}
        />
        <button
          type="submit"
          disabled={!newListName.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#06cf9c] disabled:opacity-40 disabled:cursor-not-allowed text-[#111b21] font-semibold text-[13.5px] transition-all cursor-pointer shadow-sm"
        >
          Add
        </button>
      </form>
    </motion.div>
  );
};

export default ContactInfoListsTab;
