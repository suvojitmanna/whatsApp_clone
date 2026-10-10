import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiInfo,
  FiSearch,
  FiCheckSquare,
  FiBellOff,
  FiBell,
  FiHeart,
  FiDownload,
  FiLink,
  FiUserPlus,
  FiThumbsDown,
  FiMinusCircle,
} from "react-icons/fi";
import { IoColorPaletteOutline, IoTimerOutline } from "react-icons/io5";
import {
  MdBlock,
  MdOutlinePlaylistAdd,
  MdChevronRight,
  MdCheck,
} from "react-icons/md";
import { RxCrossCircled } from "react-icons/rx";
import { toast } from "react-toastify";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import ReportModal from "../../components/ReportModal";

const ChatHeaderMenu = ({
  isOpen,
  onClose,
  onReopenAt,
  anchorCoords,
  selectedContact,
  setSelectedContact,
  theme = "dark",
  messages = [],
  onSearchClick,
  onSelectMessages,
  onStartCall,
  onOpenContactInfo,
}) => {
  const isDark = theme === "dark";
  const { setTheme } = useThemeStore();
  const { user } = useUserStore();
  const { clearMessages, deleteConversation, setCurrentConversation } =
    useChatStore();

  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const menuRef = useRef(null);
  const submenuRef = useRef(null);

  const chatId =
    (selectedContact?.conversation?._id ||
      selectedContact?.conversation ||
      selectedContact?._id ||
      "")?.toString();

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("whatsapp_favourite_chats") || "[]"
      );
    } catch {
      return [];
    }
  });

  const isFavorite = useMemo(() => {
    return Boolean(chatId && favorites.includes(chatId));
  }, [chatId, favorites]);

  const [mutedChats, setMutedChats] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("whatsapp_muted_chats") || "{}"
      );
    } catch {
      return {};
    }
  });

  const isMuted = useMemo(() => {
    if (!chatId || !mutedChats[chatId]) return false;
    const val = mutedChats[chatId];
    if (val === "always") return true;
    return typeof val === "number" && val > Date.now();
  }, [chatId, mutedChats]);

  const [blockedContacts, setBlockedContacts] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("whatsapp_blocked_contacts") || "[]"
      );
    } catch {
      return [];
    }
  });

  const isBlocked = useMemo(() => {
    return Boolean(chatId && blockedContacts.includes(chatId));
  }, [chatId, blockedContacts]);

  const [disappearingSettings, setDisappearingSettings] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("whatsapp_disappearing_messages") || "{}"
      );
    } catch {
      return {};
    }
  });

  const disappearingDuration = disappearingSettings[chatId] || "Off";

  useEffect(() => {
    if (!isOpen) {
      setActiveSubmenu(null);
      return;
    }

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

  const handleToggleFavorite = () => {
    if (!chatId) return;
    let next;
    if (isFavorite) {
      next = favorites.filter((id) => id !== chatId);
      toast.info("Removed from favourites");
    } else {
      next = [...favorites, chatId];
      toast.success("Added to favourites");
    }
    setFavorites(next);
    localStorage.setItem("whatsapp_favourite_chats", JSON.stringify(next));
    onClose();
  };

  const handleMute = (duration) => {
    if (!chatId) return;
    const now = Date.now();
    let val = "always";
    if (duration === "8 hours") val = now + 8 * 3600 * 1000;
    else if (duration === "1 week") val = now + 7 * 86400 * 1000;

    const next = { ...mutedChats, [chatId]: val };
    setMutedChats(next);
    localStorage.setItem("whatsapp_muted_chats", JSON.stringify(next));
    toast.success(`Notifications muted for ${duration}`);
    onClose();
  };

  const handleUnmute = () => {
    if (!chatId) return;
    const next = { ...mutedChats };
    delete next[chatId];
    setMutedChats(next);
    localStorage.setItem("whatsapp_muted_chats", JSON.stringify(next));
    toast.info("Notifications unmuted");
    onClose();
  };

  const handleSetDisappearing = (duration) => {
    if (!chatId) return;
    const next = { ...disappearingSettings, [chatId]: duration };
    setDisappearingSettings(next);
    localStorage.setItem(
      "whatsapp_disappearing_messages",
      JSON.stringify(next)
    );
    toast.success(
      duration === "Off"
        ? "Disappearing messages turned off"
        : `Disappearing messages set to ${duration}`
    );
    onClose();
  };

  const handleExportChat = () => {
    const contactName =
      selectedContact?.username || selectedContact?.name || "Chat";
    if (!messages || messages.length === 0) {
      toast.info("No messages to export");
      onClose();
      return;
    }

    const lines = [
      `==================================================`,
      `WhatsApp Chat with ${contactName}`,
      `Exported: ${new Date().toLocaleString()}`,
      `Total Messages: ${messages.length}`,
      `==================================================\n`,
    ];

    const currentUserId = (user?._id || user?.id)?.toString();

    messages.forEach((msg) => {
      const time = msg.createdAt
        ? new Date(msg.createdAt).toLocaleString()
        : "";
      const isMe =
        (msg.sender?._id || msg.sender)?.toString() === currentUserId;
      const sender = isMe ? "You" : msg.sender?.username || contactName;

      let content = msg.content || "";
      if (msg.contentType === "image") content = `📷 [Photo] ${content}`;
      else if (msg.contentType === "video") content = `🎥 [Video] ${content}`;
      else if (msg.contentType === "audio")
        content = `🎵 [Voice message] ${content}`;
      else if (msg.contentType === "document")
        content = `📄 [Document: ${msg.fileName || "File"}] ${content}`;
      else if (msg.contentType === "poll")
        content = `📊 [Poll: ${msg.pollData?.question || "Poll"}]`;
      else if (msg.contentType === "event")
        content = `📅 [Event: ${msg.eventData?.eventName || "Event"}]`;

      lines.push(`[${time}] ${sender}: ${content}`);
    });

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WhatsApp_Chat_${contactName.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Chat exported successfully");
    onClose();
  };

  const handleSendCallLink = () => {
    const randomCode = Math.random().toString(36).substring(2, 9);
    const callLink = `https://call.whatsapp.com/video/${randomCode}`;
    navigator.clipboard?.writeText(callLink);
    toast.success("Call link copied to clipboard");
    onClose();
  };

  const handleCloseChat = () => {
    setSelectedContact?.(null);
    setCurrentConversation?.(null);
    onClose();
  };

  const handleToggleBlock = () => {
    if (!chatId) return;
    if (isBlocked) {
      const next = blockedContacts.filter((id) => id !== chatId);
      setBlockedContacts(next);
      localStorage.setItem("whatsapp_blocked_contacts", JSON.stringify(next));
      toast.success("Contact unblocked");
      onClose();
    } else {
      setConfirmDialog({ type: "block" });
    }
  };

  const handleExecuteClearChat = () => {
    useChatStore.setState((state) => {
      const nextCache = new Map(state.messagesCache || new Map());
      if (chatId) nextCache.set(String(chatId), []);
      return {
        messages: [],
        messagesCache: nextCache,
      };
    });
    toast.success("Chat cleared");
    setConfirmDialog(null);
    onClose();
  };

  const handleExecuteDeleteChat = () => {
    useChatStore.setState((state) => {
      const nextCache = new Map(state.messagesCache || new Map());
      if (chatId) nextCache.delete(String(chatId));
      return {
        messages: [],
        messagesCache: nextCache,
        conversations: {
          ...state.conversations,
          data: (state.conversations?.data || []).filter(
            (c) => c._id?.toString() !== chatId
          ),
        },
      };
    });
    setSelectedContact?.(null);
    setCurrentConversation?.(null);
    toast.success("Chat deleted");
    setConfirmDialog(null);
    onClose();
  };

  const handleExecuteBlock = () => {
    if (!chatId) return;
    const next = [...blockedContacts, chatId];
    setBlockedContacts(next);
    localStorage.setItem("whatsapp_blocked_contacts", JSON.stringify(next));
    toast.success("Contact blocked");
    setConfirmDialog(null);
    onClose();
  };

  const coords = useMemo(() => {
    const menuWidth = 242;
    const estimatedHeight = 500;
    const isRightClick = Boolean(anchorCoords?.isContextMenu);
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
    const padding = 10;

    const clickX = anchorCoords?.x ?? (viewportWidth - menuWidth - 20);
    const clickY = anchorCoords?.y ?? 60;

    let left = clickX;
    let top = clickY;
    let originX = "left";
    let originY = "top";

    if (isRightClick) {
      if (clickX + menuWidth > viewportWidth - padding) {
        left = Math.max(padding, clickX - menuWidth);
        originX = "right";
      } else {
        left = Math.max(padding, clickX);
        originX = "left";
      }
      if (clickY + estimatedHeight > viewportHeight - padding) {
        if (clickY - estimatedHeight >= padding) {
          top = clickY - estimatedHeight;
          originY = "bottom";
        } else {
          top = Math.max(padding, viewportHeight - estimatedHeight - padding);
          originY = clickY > viewportHeight / 2 ? "bottom" : "top";
        }
      } else {
        top = Math.max(padding, clickY);
        originY = "top";
      }
    } else {
      left = Math.max(padding, clickX - menuWidth);
      originX = "right";
      if (clickY + estimatedHeight > viewportHeight - padding) {
        top = Math.max(padding, viewportHeight - estimatedHeight - padding);
        originY = "bottom";
      } else {
        top = Math.max(padding, clickY);
        originY = "top";
      }
    }

    return {
      top: Math.round(top),
      left: Math.round(left),
      originX,
      originY,
      openSubmenuToLeft: left >= 170,
      submenuAlignBottom: originY === "bottom" || top > viewportHeight - 280,
    };
  }, [anchorCoords]);

  useEffect(() => {
    if (!isOpen) return;
    const handleDismiss = () => onClose();
    window.addEventListener("resize", handleDismiss);
    return () => {
      window.removeEventListener("resize", handleDismiss);
    };
  }, [isOpen, onClose]);

  const contactName =
    selectedContact?.username || selectedContact?.name || "this contact";

  const itemClass = `flex w-full items-center px-4 py-[7px] gap-3.5 cursor-pointer transition-colors text-left font-normal text-[14px] ${isDark
    ? "hover:bg-[#182229] hover:text-white"
    : "hover:bg-[#f5f6f6] hover:text-black"
    }`;

  const submenuItemClass = `w-full flex items-center justify-between px-4 py-2 text-[13.5px] cursor-pointer transition-colors ${isDark
    ? "hover:bg-[#182229] hover:text-white"
    : "hover:bg-[#f5f6f6] hover:text-black"
    }`;

  return (
    <>
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998] bg-transparent"
              onClick={onClose}
              onContextMenu={(e) => {
                e.preventDefault();
                if (onReopenAt) {
                  onReopenAt({
                    x: e.clientX,
                    y: e.clientY,
                    isContextMenu: true,
                  });
                } else {
                  onClose();
                }
              }}
            />

            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                transformOrigin: `${coords.originY} ${coords.originX}`,
              }}
              className={`z-[9999] w-[242px] max-h-[calc(100vh-20px)] overflow-y-auto custom-scrollbar py-1.5 rounded-xl shadow-2xl border select-none ${isDark
                ? "bg-[#233138] border-white/10 text-[#d1d7db] shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
                : "bg-white border-black/10 text-[#111b21] shadow-[0_10px_35px_rgba(11,20,26,0.18)]"
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenContactInfo?.();
                }}
                className={itemClass}
              >
                <FiInfo size={18} className="text-[#8696a0] shrink-0" />
                <span className="truncate">
                  {selectedContact?.isGroup ? "Group info" : "Contact info"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSearchClick?.();
                }}
                className={itemClass}
              >
                <FiSearch size={18} className="text-[#8696a0] shrink-0" />
                <span>Search</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectMessages?.();
                }}
                className={itemClass}
              >
                <FiCheckSquare size={18} className="text-[#8696a0] shrink-0" />
                <span>Select messages</span>
              </button>

              <div
                className="relative"
                onMouseEnter={() => !isMuted && setActiveSubmenu("mute")}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isMuted) {
                      handleUnmute();
                    } else {
                      setActiveSubmenu(
                        activeSubmenu === "mute" ? null : "mute"
                      );
                    }
                  }}
                  className={itemClass}
                >
                  {isMuted ? (
                    <FiBell size={18} className="text-emerald-500 shrink-0" />
                  ) : (
                    <FiBellOff size={18} className="text-[#8696a0] shrink-0" />
                  )}
                  <span className="truncate">
                    {isMuted ? "Unmute notifications" : "Mute notifications"}
                  </span>
                  {!isMuted && (
                    <MdChevronRight
                      size={16}
                      className="text-[#8696a0] ml-auto shrink-0"
                    />
                  )}
                </button>

                <AnimatePresence>
                  {activeSubmenu === "mute" && !isMuted && (
                    <motion.div
                      ref={submenuRef}
                      initial={{ opacity: 0, x: coords.openSubmenuToLeft ? 6 : -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: coords.openSubmenuToLeft ? 6 : -6 }}
                      transition={{ duration: 0.1 }}
                      className={`absolute ${coords.openSubmenuToLeft ? "right-[99%] mr-1" : "left-[99%] ml-1"
                        } ${coords.submenuAlignBottom ? "bottom-0" : "top-0"
                        } min-w-[155px] py-1.5 rounded-xl border shadow-xl z-50 select-none ${isDark
                          ? "bg-[#233138] border-white/10 text-[#d1d7db] shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                          : "bg-white border-black/10 text-gray-800 shadow-[0_10px_25px_rgba(0,0,0,0.15)]"
                        }`}
                    >
                      {["8 hours", "1 week", "Always"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleMute(opt)}
                          className={submenuItemClass}
                        >
                          <span>{opt}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div
                className="relative"
                onMouseEnter={() => setActiveSubmenu("disappearing")}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <button
                  type="button"
                  onClick={() =>
                    setActiveSubmenu(
                      activeSubmenu === "disappearing" ? null : "disappearing"
                    )
                  }
                  className={itemClass}
                >
                  <IoTimerOutline
                    size={18}
                    className="text-[#8696a0] shrink-0"
                  />
                  <span className="truncate">
                    Disappearing messages
                  </span>
                  <MdChevronRight
                    size={16}
                    className="text-[#8696a0] ml-auto shrink-0"
                  />
                </button>

                <AnimatePresence>
                  {activeSubmenu === "disappearing" && (
                    <motion.div
                      initial={{ opacity: 0, x: coords.openSubmenuToLeft ? 6 : -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: coords.openSubmenuToLeft ? 6 : -6 }}
                      transition={{ duration: 0.1 }}
                      className={`absolute ${coords.openSubmenuToLeft ? "right-[99%] mr-1" : "left-[99%] ml-1"
                        } ${coords.submenuAlignBottom ? "bottom-0" : "top-0"
                        } min-w-[155px] py-1.5 rounded-xl border shadow-xl z-50 select-none ${isDark
                          ? "bg-[#233138] border-white/10 text-[#d1d7db] shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                          : "bg-white border-black/10 text-gray-800 shadow-[0_10px_25px_rgba(0,0,0,0.15)]"
                        }`}
                    >
                      {["24 hours", "7 days", "90 days", "Off"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSetDisappearing(opt)}
                          className={submenuItemClass}
                        >
                          <span>{opt}</span>
                          {disappearingDuration === opt && (
                            <MdCheck
                              size={16}
                              className="text-emerald-500 shrink-0"
                            />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div
                className="relative"
                onMouseEnter={() => setActiveSubmenu("theme")}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <button
                  type="button"
                  onClick={() =>
                    setActiveSubmenu(
                      activeSubmenu === "theme" ? null : "theme"
                    )
                  }
                  className={itemClass}
                >
                  <IoColorPaletteOutline
                    size={18}
                    className="text-[#8696a0] shrink-0"
                  />
                  <span>Chat theme</span>
                  <MdChevronRight
                    size={16}
                    className="text-[#8696a0] ml-auto shrink-0"
                  />
                </button>

                <AnimatePresence>
                  {activeSubmenu === "theme" && (
                    <motion.div
                      initial={{ opacity: 0, x: coords.openSubmenuToLeft ? 6 : -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: coords.openSubmenuToLeft ? 6 : -6 }}
                      transition={{ duration: 0.1 }}
                      className={`absolute ${coords.openSubmenuToLeft ? "right-[99%] mr-1" : "left-[99%] ml-1"
                        } ${coords.submenuAlignBottom ? "bottom-0" : "top-0"
                        } min-w-[155px] py-1.5 rounded-xl border shadow-xl z-50 select-none ${isDark
                          ? "bg-[#233138] border-white/10 text-[#d1d7db] shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                          : "bg-white border-black/10 text-gray-800 shadow-[0_10px_25px_rgba(0,0,0,0.15)]"
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setTheme("dark");
                          toast.success("Switched to Dark theme");
                          onClose();
                        }}
                        className={submenuItemClass}
                      >
                        <span>Dark mode</span>
                        {isDark && (
                          <MdCheck
                            size={16}
                            className="text-emerald-500 shrink-0"
                          />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTheme("light");
                          toast.success("Switched to Light theme");
                          onClose();
                        }}
                        className={submenuItemClass}
                      >
                        <span>Light mode</span>
                        {!isDark && (
                          <MdCheck
                            size={16}
                            className="text-emerald-500 shrink-0"
                          />
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={handleToggleFavorite}
                className={itemClass}
              >
                <FiHeart
                  size={18}
                  className={`shrink-0 ${isFavorite
                    ? "text-rose-500 fill-rose-500"
                    : "text-[#8696a0]"
                    }`}
                />
                <span className="truncate">
                  {isFavorite ? "Remove from favourites" : "Add to favourites"}
                </span>
              </button>

              <div
                className="relative"
                onMouseEnter={() => setActiveSubmenu("list")}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <button
                  type="button"
                  onClick={() =>
                    setActiveSubmenu(
                      activeSubmenu === "list" ? null : "list"
                    )
                  }
                  className={itemClass}
                >
                  <MdOutlinePlaylistAdd
                    size={19}
                    className="text-[#8696a0] shrink-0"
                  />
                  <span>Add to list</span>
                  <MdChevronRight
                    size={16}
                    className="text-[#8696a0] ml-auto shrink-0"
                  />
                </button>

                <AnimatePresence>
                  {activeSubmenu === "list" && (
                    <motion.div
                      initial={{ opacity: 0, x: coords.openSubmenuToLeft ? 6 : -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: coords.openSubmenuToLeft ? 6 : -6 }}
                      transition={{ duration: 0.1 }}
                      className={`absolute ${coords.openSubmenuToLeft ? "right-[99%] mr-1" : "left-[99%] ml-1"
                        } ${coords.submenuAlignBottom ? "bottom-0" : "top-0"
                        } min-w-[155px] py-1.5 rounded-xl border shadow-xl z-50 select-none ${isDark
                          ? "bg-[#233138] border-white/10 text-[#d1d7db] shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                          : "bg-white border-black/10 text-gray-800 shadow-[0_10px_25px_rgba(0,0,0,0.15)]"
                        }`}
                    >
                      {["Favourites", "Work", "Personal", "New list..."].map(
                        (tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              toast.success(`Chat added to ${tag}`);
                              onClose();
                            }}
                            className={submenuItemClass}
                          >
                            <span>{tag}</span>
                          </button>
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={handleExportChat}
                className={itemClass}
              >
                <FiDownload size={18} className="text-[#8696a0] shrink-0" />
                <span>Export chat</span>
              </button>

              <button
                type="button"
                onClick={handleCloseChat}
                className={itemClass}
              >
                <RxCrossCircled
                  size={18}
                  className="text-[#8696a0] shrink-0"
                />
                <span>Close chat</span>
              </button>

              <div
                className={`my-1 border-t ${isDark ? "border-[#2a3942]/80" : "border-black/10"
                  }`}
              />
              <button
                type="button"
                onClick={handleSendCallLink}
                className={itemClass}
              >
                <FiLink size={18} className="text-[#8696a0] shrink-0" />
                <span>Send call link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartCall?.();
                }}
                className={itemClass}
              >
                <FiUserPlus size={18} className="text-[#8696a0] shrink-0" />
                <span>New group call</span>
              </button>

              <div
                className={`my-1 border-t ${isDark ? "border-[#2a3942]/80" : "border-black/10"
                  }`}
              />

              <button
                type="button"
                onClick={() => {
                  onClose();
                  setShowReportModal(true);
                }}
                className={itemClass}
              >
                <FiThumbsDown size={18} className="text-[#8696a0] shrink-0" />
                <span>Report</span>
              </button>

              <button
                type="button"
                onClick={handleToggleBlock}
                className={itemClass}
              >
                <MdBlock size={18} className="text-[#8696a0] shrink-0" />
                <span>
                  {isBlocked ? "Unblock" : "Block"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmDialog({ type: "clear" })}
                className={itemClass}
              >
                <FiMinusCircle
                  size={18}
                  className="text-[#8696a0] shrink-0"
                />
                <span>Clear chat</span>
              </button>
            </motion.div>
          </>,
          document.body
        )}

      {confirmDialog &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setConfirmDialog(null)}
          >
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
                  : confirmDialog.type === "delete"
                    ? "Delete this chat?"
                    : `Block ${contactName}?`}
              </h3>
              <p
                className={`text-[13.5px] leading-relaxed mb-6 ${isDark ? "text-[#8696a0]" : "text-gray-500"
                  }`}
              >
                {confirmDialog.type === "clear"
                  ? "Messages will be cleared from this device. Media in this chat may also be removed."
                  : confirmDialog.type === "delete"
                    ? "Messages and media from this chat will be permanently deleted from your account."
                    : "Blocked contacts will no longer be able to call you or send you messages."}
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
                    } else if (confirmDialog.type === "block") {
                      handleExecuteBlock();
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-sm active:scale-95"
                >
                  {confirmDialog.type === "clear"
                    ? "Clear chat"
                    : confirmDialog.type === "delete"
                      ? "Delete chat"
                      : "Block"}
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReport={({ block }) => {
          if (block && chatId) {
            const next = [...blockedContacts, chatId];
            setBlockedContacts(next);
            localStorage.setItem(
              "whatsapp_blocked_contacts",
              JSON.stringify(next)
            );
            toast.success("Reported and blocked successfully");
          } else {
            toast.success("Report submitted to WhatsApp");
          }
        }}
        contactName={contactName}
        theme={theme}
      />
    </>
  );
};

export default ChatHeaderMenu;
