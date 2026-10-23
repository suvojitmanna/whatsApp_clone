import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FiSearch } from "react-icons/fi";
import { IoSend } from "react-icons/io5";
import { useChatStore } from "../../store/chatStore";
import useUserStore from "../../store/useUserStore";
import useStatusStore from "../../store/statusStore";
import { toast } from "react-toastify";
import { HiOutlineDotsHorizontal } from "react-icons/hi";

const ForwardModal = ({ isOpen, onClose, message, messages, theme = "dark" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const { conversations, sendMessage, users } = useChatStore();
  const { user } = useUserStore();

  useEffect(() => {
    if (!isOpen) {
      setSelectedContacts([]);
      setSearchTerm("");
    }
  }, [isOpen]);

  const messageList = messages && messages.length > 0 ? messages : (message ? [message] : []);
  if (!isOpen || messageList.length === 0) return null;

  const isDark = theme === "dark";
  const contactList = [];
  const seenIds = new Set();

  (conversations?.data || []).forEach((conv) => {
    if (conv.isGroup) {
      const gId = (conv._id || conv.id)?.toString();
      if (gId && !seenIds.has(gId)) {
        seenIds.add(gId);
        contactList.push({
          _id: gId,
          username: conv.groupName || "Group",
          profilePicture: conv.groupProfileImage || conv.profilePicture || "",
          isGroup: true,
          conversation: conv,
        });
      }
    } else {
      const peer = conv.participants?.find(
        (p) => String(p._id || p.id) !== String(user?._id || user?.id)
      );
      if (peer && !seenIds.has(peer._id)) {
        seenIds.add(peer._id);
        contactList.push(peer);
      }
    }
  });

  (users || []).forEach((u) => {
    if (String(u._id || u.id) !== String(user?._id || user?.id) && !seenIds.has(u._id)) {
      seenIds.add(u._id);
      contactList.push(u);
    }
  });

  const filteredContacts = contactList.filter((c) =>
    (c.username || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleForward = async () => {
    if (!selectedContacts.length || isForwarding) return;
    setIsForwarding(true);

    try {
      for (const targetId of selectedContacts) {
        if (targetId === "status") {
          for (const msg of messageList) {
            try {
              await useStatusStore.getState().createStatus({
                content: msg.content || "",
                media: msg.imageOrVideoUrl || null,
              });
            } catch (statusErr) {
              console.error("Status forward error:", statusErr);
            }
          }
          continue;
        }

        const targetConv = (conversations?.data || []).find(
          (c) =>
            String(c._id || c.id) === String(targetId) ||
            (c.isGroup && String(c._id) === String(targetId))
        );
        const isGroupTarget = Boolean(targetConv?.isGroup);

        for (const msg of messageList) {
          const formData = new FormData();
          formData.append("senderId", user?._id || user?.id);
          formData.append("receiverId", targetId);
          if (isGroupTarget) {
            formData.append("conversationId", targetId);
            formData.append("isGroup", "true");
          }
          formData.append("messageStatus", "send");
          formData.append("contentType", msg.contentType || "text");
          formData.append("content", msg.content || "");

          if (msg.imageOrVideoUrl) {
            formData.append("imageOrVideoUrl", msg.imageOrVideoUrl);
          }
          if (msg.fileName) {
            formData.append("fileName", msg.fileName);
          }
          if (msg.fileSize) {
            formData.append("fileSize", msg.fileSize);
          }
          if (msg.pollData) {
            formData.append(
              "pollData",
              typeof msg.pollData === "string"
                ? msg.pollData
                : JSON.stringify(msg.pollData)
            );
          }
          if (msg.eventData) {
            formData.append(
              "eventData",
              typeof msg.eventData === "string"
                ? msg.eventData
                : JSON.stringify(msg.eventData)
            );
          }
          if (msg.contactData) {
            formData.append(
              "contactData",
              typeof msg.contactData === "string"
                ? msg.contactData
                : JSON.stringify(msg.contactData)
            );
          }

          await sendMessage(formData);
        }
      }

      toast.success(
        `Forwarded to ${selectedContacts.length} chat${selectedContacts.length > 1 ? "s" : ""
        }`
      );
      onClose();
    } catch (err) {
      console.error("Forwarding failed:", err);
      toast.error("Failed to forward message");
    } finally {
      setIsForwarding(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border flex flex-col max-h-[85vh] ${isDark
            ? "bg-[#111b21] border-white/10 text-[#e9edef]"
            : "bg-white border-black/10 text-[#111b21]"
            }`}
        >
          <div
            className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "bg-[#202c33] border-white/10" : "bg-[#f0f2f5] border-black/10"
              }`}
          >
            <h3 className="font-semibold text-base">Forward message to</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full border border-transparent hover:border-black/10 dark:hover:border-white/20 hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition cursor-pointer"
            >
              <RxCross2 size={19} />
            </button>
          </div>

          <div className="p-3">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark
                ? "bg-[#202c33] border-white/10 text-white"
                : "bg-gray-100 border-gray-200 text-gray-800"
                }`}
            >
              <FiSearch size={16} className="opacity-60 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or contact"
                className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-400"
              />
            </div>
          </div>

          {(!searchTerm || "my status".includes(searchTerm.toLowerCase())) && (
            <div
              onClick={() => toggleSelect("status")}
              className={`mx-3 my-1 flex items-center gap-3.5 px-4 py-2.5 rounded-3xl border cursor-pointer transition-all ${selectedContacts.includes("status")
                ? isDark
                  ? "bg-emerald-500/15 border-emerald-500/50"
                  : "bg-emerald-50 border-emerald-500/40"
                : isDark
                  ? "border-transparent hover:border-gray-500/40 hover:bg-[#202c33]"
                  : "border-transparent hover:border-gray-400/40 hover:bg-gray-100"
                }`}
            >
              <input
                type="checkbox"
                checked={selectedContacts.includes("status")}
                onChange={() => { }}
                className="checkbox checkbox-sm checkbox-success rounded-md cursor-pointer shrink-0"
              />

              <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm shrink-0">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (user?.username?.[0] || "U").toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">My Status</div>
                <div className="text-xs text-gray-500 truncate">
                  Tap to add status update
                </div>
              </div>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                }}
                title="Status options"
                className={`text-lg p-1.5 rounded-full border border-transparent transition-all cursor-pointer ${isDark
                  ? "text-gray-400 hover:text-white hover:border-gray-500/40 hover:bg-white/10"
                  : "text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-black/5"
                  }`}
              >
                <HiOutlineDotsHorizontal />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 px-5 py-2 text-xs font-medium opacity-65 select-none">
            <div
              className={`h-px w-[8%] ${isDark ? "bg-white/10" : "bg-black/10"
                }`}
            />
            <span className="whitespace-nowrap uppercase tracking-wider text-[11.5px]">
              Recent chat
            </span>
            <div
              className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"
                }`}
            />
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-sm opacity-60">
                No contacts found
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContacts.includes(contact._id);
                return (
                  <div
                    key={contact._id}
                    onClick={() => toggleSelect(contact._id)}
                    className={`mx-3 my-1 flex items-center gap-3.5 px-4 py-2.5 rounded-3xl border cursor-pointer transition-all ${isSelected
                      ? isDark
                        ? "bg-emerald-500/15 border-emerald-500/50"
                        : "bg-emerald-50 border-emerald-500/40"
                      : isDark
                        ? "border-transparent hover:border-gray-500/40 hover:bg-[#202c33]"
                        : "border-transparent hover:border-gray-400/40 hover:bg-gray-100"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { }}
                      className="checkbox checkbox-sm checkbox-success rounded-md cursor-pointer shrink-0"
                    />

                    <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm shrink-0">
                      {contact.profilePicture ? (
                        <img
                          src={contact.profilePicture}
                          alt={contact.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (contact.username?.[0] || "U").toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {contact.username}
                      </p>
                      <p className="text-xs opacity-60 truncate">
                        {contact.about || "Hey there! I am using WhatsApp."}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selectedContacts.length > 0 &&
            <div
              className={`p-4 border-t flex items-center justify-between ${isDark ? "bg-[#202c33]/50 border-white/10" : "bg-gray-50 border-black/10"
                }`}
            >
              <span className="text-xs opacity-75">
                {selectedContacts.length} {selectedContacts.length === 1 ? "chat" : "chats"} selected
              </span>

              <button
                type="button"
                disabled={selectedContacts.length === 0 || isForwarding}
                onClick={handleForward}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-medium text-sm transition-all shadow-md shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isForwarding ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <IoSend size={15} />
                )}
                <span>Forward</span>
              </button>
            </div>}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};

export default ForwardModal;
