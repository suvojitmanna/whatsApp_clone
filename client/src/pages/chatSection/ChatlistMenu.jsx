import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FiHeart } from "react-icons/fi";
import { MdArrowRight, MdBlock } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { BsPinAngle } from "react-icons/bs";
import { FaCheck, FaPlus, FaLock } from "react-icons/fa";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import useLayoutStore from "../../store/layoutStore";
import { useChatStore, getTargetUserId } from "../../store/chatStore";
import BlockModal from "../../components/modals/BlockModal";
import {
  getAllLists,
  isContactInList,
  getContactListNames,
  toggleContactList,
} from "../../utils/chatListsUtil";
import { isChatLockConfigured } from "../../utils/chatLockUtil";
import {
  MutedBellIcon,
  ArchivedBoxIcon,
  MarkUnreadIcon,
  AddToListIcon,
  MinusCircleIcon,
} from "../../components/common/Icons";

const ChatlistMenu = ({
  isOpen,
  onClose,
  contact,
  anchorCoords,
  onOpenNewList,
  onOpenSetPin,
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const { user } = useUserStore();
  const currentUserId = user?._id;
  const {
    blockedContacts,
    blockContact,
    unblockContact,
    clearChat,
    deleteChat,
    clearUnreadCount,
    lockedChatIds = [],
    toggleLockChat,
  } = useChatStore();
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [listsTick, setListsTick] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (activeSubmenu) {
          setActiveSubmenu(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeSubmenu, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setActiveSubmenu(null);
    }
  }, [isOpen, contact?._id]);

  const targetId = useMemo(() => {
    return getTargetUserId(contact, currentUserId);
  }, [contact, currentUserId]);

  const chatId = useMemo(() => {
    return (
      contact?.conversation?._id ||
      contact?.conversation ||
      contact?._id ||
      contact?.id
    )?.toString();
  }, [contact]);

  const contactName = contact?.username || contact?.name || "Chat";

  const isLocked = useMemo(() => {
    const list = lockedChatIds || [];
    const candidates = [chatId, contact?._id, contact?.id, targetId]
      .filter(Boolean)
      .map(String);
    return candidates.some((id) => list.includes(id));
  }, [lockedChatIds, chatId, contact, targetId]);

  const handleToggleLock = () => {
    const target = chatId || contact?._id;
    if (!target) return;
    if (!isChatLockConfigured()) {
      if (onOpenSetPin) {
        onOpenSetPin(contact);
      } else {
        toast.info("Please set up a Chat Lock PIN in Settings first.");
      }
      onClose();
      return;
    }
    if (toggleLockChat) {
      const isNowLocked = toggleLockChat(target);
      toast.success(
        isNowLocked
          ? "🔒 Chat locked and moved to Locked Chats folder"
          : "🔓 Chat unlocked"
      );
    }
    onClose();
  };

  const isBlocked = useMemo(() => {
    if (!blockedContacts || blockedContacts.length === 0) return false;
    const candidates = [targetId, chatId, contact?._id, contact?.id]
      .filter(Boolean)
      .map(String);
    return candidates.some((id) => blockedContacts.map(String).includes(id));
  }, [chatId, contact, blockedContacts, targetId]);

  const isMuted = useMemo(() => {
    try {
      const muted = JSON.parse(
        localStorage.getItem("whatsapp_muted_chats") || "{}"
      );
      const val = (chatId && muted[chatId]) || (targetId && muted[targetId]);
      if (!val) return false;
      if (val === "always") return true;
      return typeof val === "number" && val > Date.now();
    } catch {
      return false;
    }
  }, [chatId, targetId]);

  const isPinned = useMemo(() => {
    try {
      const pinned = JSON.parse(
        localStorage.getItem("whatsapp_pinned_chats") || "[]"
      );
      return Boolean(
        (chatId && pinned.includes(chatId)) ||
        (targetId && pinned.includes(targetId)) ||
        (contact?._id && pinned.includes(String(contact._id)))
      );
    } catch {
      return false;
    }
  }, [chatId, targetId, contact]);

  const isUnread = useMemo(() => {
    try {
      const marked = JSON.parse(
        localStorage.getItem("whatsapp_marked_unread_chats") || "[]"
      );
      if (
        (chatId && marked.includes(chatId)) ||
        (targetId && marked.includes(targetId)) ||
        (contact?._id && marked.includes(String(contact._id)))
      ) {
        return true;
      }
    } catch { }
    const unread = contact?.conversation?.unreadCount;
    return typeof unread === "number" && unread > 0;
  }, [chatId, targetId, contact]);

  const isFavorite = useMemo(() => {
    const listNames = getContactListNames(contact);
    return (
      listNames.includes("Favourites") || listNames.includes("Favorites")
    );
  }, [contact, listsTick]);

  const isArchived = useMemo(() => {
    try {
      const archived = JSON.parse(
        localStorage.getItem("whatsapp_archived_chats") || "[]"
      );
      return Boolean(
        (chatId && archived.includes(chatId)) ||
        (targetId && archived.includes(targetId)) ||
        (contact?._id && archived.includes(String(contact._id)))
      );
    } catch {
      return false;
    }
  }, [chatId, targetId, contact]);

  const coords = useMemo(() => {
    const menuWidth = 236;
    const menuHeight = 368;
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
    const padding = 12;
    const clickX = anchorCoords?.x ?? 200;
    const clickY = anchorCoords?.y ?? 200;
    let left = clickX;
    let top = clickY;

    if (clickX + menuWidth > viewportWidth - padding) {
      left = Math.max(padding, clickX - menuWidth);
    } else {
      left = Math.max(padding, clickX);
    }

    if (clickY + menuHeight > viewportHeight - padding) {
      top = Math.max(padding, clickY - menuHeight);
    } else {
      top = Math.max(padding, clickY);
    }
    const isSubmenuLeft = left + menuWidth + 200 > viewportWidth - padding;

    return { left, top, isSubmenuLeft };
  }, [anchorCoords]);

  const handleToggleArchive = () => {
    const key = chatId || targetId;
    if (!key) return;
    try {
      const archived = JSON.parse(
        localStorage.getItem("whatsapp_archived_chats") || "[]"
      );
      let next;
      if (isArchived) {
        next = archived.filter(
          (id) => id !== key && id !== chatId && id !== targetId
        );
        toast.info("Chat unarchived");
      } else {
        next = [...archived, key];
        toast.success("Chat archived");
      }
      localStorage.setItem("whatsapp_archived_chats", JSON.stringify(next));
      window.dispatchEvent(new Event("whatsapp_archived_changed"));
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  const handleMute = (duration) => {
    const key = chatId || targetId;
    if (!key) return;
    const now = Date.now();
    let val = "always";
    if (duration === "8 hours") val = now + 8 * 3600 * 1000;
    else if (duration === "1 week") val = now + 7 * 86400 * 1000;

    try {
      const muted = JSON.parse(
        localStorage.getItem("whatsapp_muted_chats") || "{}"
      );
      const next = { ...muted, [key]: val };
      if (chatId) next[chatId] = val;
      if (targetId) next[targetId] = val;
      localStorage.setItem("whatsapp_muted_chats", JSON.stringify(next));
      window.dispatchEvent(new Event("whatsapp_muted_changed"));
      toast.success(`Notifications muted for ${duration}`);
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  const handleUnmute = () => {
    const key = chatId || targetId;
    if (!key) return;
    try {
      const muted = JSON.parse(
        localStorage.getItem("whatsapp_muted_chats") || "{}"
      );
      delete muted[key];
      if (chatId) delete muted[chatId];
      if (targetId) delete muted[targetId];
      localStorage.setItem("whatsapp_muted_chats", JSON.stringify(muted));
      window.dispatchEvent(new Event("whatsapp_muted_changed"));
      toast.info("Notifications unmuted");
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  const handleTogglePin = () => {
    const key = chatId || targetId;
    if (!key) return;
    try {
      const pinned = JSON.parse(
        localStorage.getItem("whatsapp_pinned_chats") || "[]"
      );
      let next;
      if (isPinned) {
        next = pinned.filter(
          (id) => id !== key && id !== chatId && id !== targetId
        );
        toast.info("Chat unpinned");
      } else {
        next = [...pinned, key];
        toast.success("Chat pinned");
      }
      localStorage.setItem("whatsapp_pinned_chats", JSON.stringify(next));
      window.dispatchEvent(new Event("whatsapp_pinned_changed"));
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  const handleToggleUnread = () => {
    const key = chatId || targetId;
    if (!key) return;
    try {
      const marked = JSON.parse(
        localStorage.getItem("whatsapp_marked_unread_chats") || "[]"
      );
      let next;
      if (isUnread) {
        next = marked.filter(
          (id) => id !== key && id !== chatId && id !== targetId
        );
        clearUnreadCount(key);
        if (targetId) clearUnreadCount(targetId);
        if (chatId) clearUnreadCount(chatId);
        toast.info("Marked as read");
      } else {
        next = [...marked, key];
        toast.success("Marked as unread");
      }
      localStorage.setItem("whatsapp_marked_unread_chats", JSON.stringify(next));
      window.dispatchEvent(new Event("whatsapp_unread_changed"));
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  const handleToggleFavorite = () => {
    toggleContactList(contact, "Favourites");
    setListsTick((t) => t + 1);
    if (isFavorite) {
      toast.info("Removed from favourites");
    } else {
      toast.success("Added to favourites");
    }
    onClose();
  };

  const handleToggleList = (listName) => {
    toggleContactList(contact, listName);
    setListsTick((t) => t + 1);
    toast.success(`Updated ${listName} list`);
  };

  const handleToggleBlock = () => {
    const target = targetId || chatId || contact?._id;
    if (!target) return;
    if (isBlocked) {
      unblockContact(target, chatId);
      toast.success("Contact unblocked");
      onClose();
    } else {
      setShowBlockModal(true);
    }
  };

  const handleConfirmBlock = ({ report } = {}) => {
    const target = targetId || chatId || contact?._id;
    if (!target) return;
    blockContact(target);
    if (report) {
      toast.success("Reported and blocked successfully");
    } else {
      toast.success("Contact blocked");
    }
    setShowBlockModal(false);
    onClose();
  };

  const handleExecuteClearChat = async () => {
    const target = targetId || contact?._id;
    await clearChat(chatId, target);
    toast.success("Chat cleared");
    setConfirmDialog(null);
    onClose();
  };

  const handleExecuteDeleteChat = async () => {
    const target = targetId || contact?._id;
    await deleteChat(chatId, target);
    const selected = useLayoutStore.getState().selectedContact;
    if (
      selected?._id === contact?._id ||
      selected?.conversation?._id === chatId ||
      selected?._id === target
    ) {
      useLayoutStore.getState().setSelectedContact(null);
    }
    toast.success("Chat deleted");
    setConfirmDialog(null);
    onClose();
  };

  if (!isOpen || !contact) return null;

  const itemClass = `w-full mx-1 px-4 py-2.5 flex items-center gap-3.5 text-[14.5px] cursor-pointer text-left transition-all duration-200 relative group select-none rounded-xl border border-transparent ${isDark
    ? "hover:bg-[#202c33] hover:border-white/10 text-[#d1d7db] hover:text-white"
    : "hover:bg-[#f5f6f6] hover:border-black/5 text-[#111b21]"
    }`;

  const availableLists = getAllLists();

  return (
    <>
      {typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.12 }}
              style={{
                top: `${coords.top}px`,
                left: `${coords.left}px`,
              }}
              onClick={(e) => e.stopPropagation()}
              className={`fixed z-[9999] pr-2 py-2 rounded-2xl shadow-2xl border select-none ${isDark
                ? "bg-[#182229] border-[#313d45]/70 text-[#d1d7db]"
                : "bg-white border-gray-200 text-[#111b21]"
                } w-[236px]`}
            >
              <button
                type="button"
                onClick={handleToggleArchive}
                className={itemClass}
              >
                <ArchivedBoxIcon />
                <span className="truncate">
                  {isArchived ? "Unarchive chat" : "Archive chat"}
                </span>
              </button>

              <div className="relative"
                onMouseEnter={() => !isMuted && setActiveSubmenu("mute")}
                onMouseLeave={() => activeSubmenu === "mute" && setActiveSubmenu(null)}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isMuted) {
                      handleUnmute();
                    } else {
                      setActiveSubmenu(activeSubmenu === "mute" ? null : "mute");
                    }
                  }}
                  className={itemClass}
                >
                  <MutedBellIcon />

                  <span className="truncate">
                    {isMuted ? "Unmute notifications" : "Mute notifications"}
                  </span>

                  {!isMuted && (
                    <span className="ml-auto text-[9px] opacity-70"><MdArrowRight size={25} /></span>
                  )}
                </button>

                {activeSubmenu === "mute" && !isMuted && (
                  <div className={`absolute top-0 py-1.5 rounded-2xl shadow-2xl border z-20 w-[160px] ${coords.isSubmenuLeft ? "right-full mr-1.5" : "left-full ml-1.5"} ${isDark ? "bg-[#182229] border-[#313d45]/70 text-[#d1d7db]" : "bg-white border-gray-200 text-[#111b21]"}`}>
                    {["8 hours", "1 week", "Always"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleMute(opt)}
                        className={`w-full px-4 py-2.5 text-left text-[14px] cursor-pointer transition-colors ${isDark ? "hover:bg-[#202c33] text-[#d1d7db] hover:text-white" : "hover:bg-[#f5f6f6] text-[#111b21]"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleTogglePin}
                className={itemClass}
              >
                <BsPinAngle size={19} className="shrink-0" />
                <span className="truncate">
                  {isPinned ? "Unpin chat" : "Pin chat"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleToggleUnread}
                className={itemClass}
              >
                <MarkUnreadIcon />
                <span className="truncate">
                  {isUnread ? "Mark as read" : "Mark as unread"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleToggleFavorite}
                className={itemClass}
              >
                <FiHeart size={19} className="shrink-0" />
                <span className="truncate">
                  {isFavorite ? "Remove from favourites" : "Add to favourites"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleToggleLock}
                className={itemClass}
              >
                <FaLock size={17} className="shrink-0 text-amber-500" />
                <span className="truncate">
                  {isLocked ? "Unlock chat" : "Lock chat 🔒"}
                </span>
              </button>

              <div className="relative"
                onMouseEnter={() => setActiveSubmenu("list")}
                onMouseLeave={() => activeSubmenu === "list" && setActiveSubmenu(null)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubmenu(activeSubmenu === "list" ? null : "list");
                  }}
                  className={itemClass}
                >
                  <AddToListIcon />
                  <span className="truncate">Add to list</span>
                  <span className="ml-auto text-[9px] opacity-70"><MdArrowRight size={25} /></span>
                </button>

                {activeSubmenu === "list" && (
                  <div className={`absolute top-0 py-1.5 rounded-2xl shadow-2xl border z-20 w-[190px] max-h-[300px] overflow-y-auto ${coords.isSubmenuLeft
                    ? "right-full mr-1.5"
                    : "left-full ml-1.5"
                    } ${isDark
                      ? "bg-[#182229] border-[#313d45]/70 text-[#d1d7db]"
                      : "bg-white border-gray-200 text-[#111b21]"
                    }`}
                  >
                    {availableLists.map((listName) => {
                      const inList = isContactInList(contact, listName);
                      return (
                        <button
                          key={listName}
                          type="button"
                          onClick={() => handleToggleList(listName)}
                          className={`w-full px-4 py-2 flex items-center justify-between text-left text-[14px] cursor-pointer transition-colors ${isDark
                            ? "hover:bg-[#202c33] text-[#d1d7db] hover:text-white"
                            : "hover:bg-[#f5f6f6] text-[#111b21]"
                            }`}
                        >
                          <span className="truncate">{listName}</span>
                          {inList && (
                            <FaCheck size={12} className="text-[#00a884] shrink-0" />
                          )}
                        </button>
                      );
                    })}

                    <div className={`my-1 border-t ${isDark ? "border-[#313d45]/70" : "border-gray-200"}`} />
                    <button type="button" onClick={() => {
                      onClose();
                      onOpenNewList?.();
                    }}
                      className={`w-full px-4 py-2 flex items-center gap-2.5 text-left text-[13.5px] cursor-pointer transition-colors ${isDark
                        ? "hover:bg-[#202c33] text-[#00a884]"
                        : "hover:bg-[#f5f6f6] text-[#00a884]"
                        }`}
                    >
                      <FaPlus size={11} className="shrink-0" />
                      <span>New list</span>
                    </button>
                  </div>
                )}
              </div>
              <div
                className={`my-1.5 border-t ${isDark ? "border-[#313d45]/70" : "border-gray-200"
                  }`}
              />
              <button
                type="button"
                onClick={handleToggleBlock}
                className={`${itemClass} ${isDark
                  ? "hover:!bg-red-500/10 hover:!border-red-500/20 hover:!text-red-400"
                  : "hover:!bg-red-50 hover:!border-red-200 hover:!text-red-600"
                  }`}
              >
                <MdBlock size={19} className="shrink-0" />
                <span className="truncate">
                  {isBlocked ? "Unblock" : "Block"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmDialog({ type: "clear" })}
                className={`${itemClass} ${isDark
                  ? "hover:!bg-red-500/10 hover:!border-red-500/20 hover:!text-red-400"
                  : "hover:!bg-red-50 hover:!border-red-200 hover:!text-red-600"
                  }`}
              >
                <MinusCircleIcon />
                <span className="truncate">Clear chat</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmDialog({ type: "delete" })}
                className={`${itemClass} ${isDark
                  ? "hover:!bg-red-500/10 hover:!border-red-500/20 hover:!text-red-400"
                  : "hover:!bg-red-50 hover:!border-red-200 hover:!text-red-600"
                  }`}
              >
                <RiDeleteBin6Line size={19} className="shrink-0" />
                <span className="truncate">Delete chat</span>
              </button>
            </motion.div>
          </>,
          document.body
        )}

      {confirmDialog &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDialog(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-[360px] rounded-[24px] p-6 shadow-2xl border select-none ${isDark
                ? "bg-[#202c33] border-white/10 text-white"
                : "bg-white border-black/10 text-gray-900"
                }`}
            >
              <h3 className="text-[18px] font-bold tracking-tight mb-2">
                {confirmDialog.type === "clear"
                  ? "Clear this chat?"
                  : "Delete this chat?"}
              </h3>
              <p className={`text-[13.5px] leading-relaxed mb-6 ${isDark ? "text-[#8696a0]" : "text-gray-500"}`}>
                {confirmDialog.type === "clear"
                  ? "Messages will be cleared from this device. Media in this chat may also be removed."
                  : "Messages and media from this chat will be permanently deleted from your account."}
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${isDark
                    ? "hover:bg-white/10 text-gray-300"
                    : "hover:bg-black/5 text-gray-600"
                    }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDialog.type === "clear") {
                      handleExecuteClearChat();
                    } else if (confirmDialog.type === "delete") {
                      handleExecuteDeleteChat();
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-sm active:scale-95"
                >
                  {confirmDialog.type === "clear" ? "Clear chat" : "Delete chat"}
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

      <BlockModal
        isOpen={showBlockModal}
        onClose={() => {
          setShowBlockModal(false);
          onClose();
        }}
        onBlock={handleConfirmBlock}
        contactName={contactName}
        theme={theme}
      />
    </>
  );
};

export default ChatlistMenu;