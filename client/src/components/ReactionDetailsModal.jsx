import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BsEmojiSmile } from "react-icons/bs";
import { FaPlus, FaArrowLeft } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import EmojiPicker from "emoji-picker-react";
import useOutsideClick from "../hook/useOutsideClick";

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const ReactionDetailsModal = ({
  isOpen,
  onClose,
  message,
  currentUser,
  onRemoveReaction,
  onReact,
  isDark,
  anchorRef,
  bubbleRef,
  isUserMessage,
}) => {
  const modalRef = useRef(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [coords, setCoords] = useState(null);

  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
  const reactions = message?.reactions || [];

  useEffect(() => {
    if (!isOpen) {
      setShowEmojiPicker(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const anchor = anchorRef?.current || bubbleRef?.current;
      if (!anchor) {
        setCoords(null);
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const popoverWidth = Math.min(360, window.innerWidth - 24);
      const estimatedHeight = showEmojiPicker
        ? 420
        : Math.min(300, 130 + reactions.length * 56);

      const spaceBelow = window.innerHeight - rect.bottom;
      let top = rect.bottom + 6;

      if (spaceBelow < (showEmojiPicker ? 360 : 180) && rect.top > (showEmojiPicker ? 360 : 200)) {
        top = Math.max(12, rect.top - estimatedHeight - 6);
      } else {
        if (top + estimatedHeight > window.innerHeight - 12) {
          top = Math.max(12, window.innerHeight - estimatedHeight - 12);
        }
      }

      let left;
      if (isUserMessage) {
        left = rect.right - popoverWidth;
        if (left + popoverWidth > window.innerWidth - 12) {
          left = window.innerWidth - popoverWidth - 12;
        }
        if (left < 12) left = 12;
      } else {
        left = rect.left;
        if (left + popoverWidth > window.innerWidth - 12) {
          left = window.innerWidth - popoverWidth - 12;
        }
        if (left < 12) left = 12;
      }

      setCoords({ top, left, width: popoverWidth });
    };

    updatePosition();

    const handleDismiss = (e) => {
      if (e?.type === "scroll" && e?.target) {
        if (modalRef.current && (modalRef.current === e.target || modalRef.current.contains(e.target))) {
          return;
        }
      }
      onClose();
    };
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);

    return () => {
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [isOpen, anchorRef, bubbleRef, isUserMessage, reactions.length, showEmojiPicker, onClose]);

  useOutsideClick(modalRef, () => {
    if (isOpen) {
      onClose();
    }
  });
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
  useEffect(() => {
    if (isOpen && reactions.length === 0 && !showEmojiPicker) {
      onClose();
    }
  }, [isOpen, reactions.length, showEmojiPicker, onClose]);

  const emojiGroups = useMemo(() => {
    const map = {};
    reactions.forEach((r) => {
      if (r.emoji) {
        map[r.emoji] = (map[r.emoji] || 0) + 1;
      }
    });
    return Object.entries(map).map(([emoji, count]) => ({ emoji, count }));
  }, [reactions]);

  useEffect(() => {
    if (activeTab !== "all" && !emojiGroups.some((g) => g.emoji === activeTab)) {
      setActiveTab("all");
    }
  }, [emojiGroups, activeTab]);

  const displayedReactions = useMemo(() => {
    if (activeTab === "all") return reactions;
    return reactions.filter((r) => r.emoji === activeTab);
  }, [reactions, activeTab]);

  const handleRowClick = (reaction) => {
    const rUserId = String(reaction.userId?._id || reaction.userId);
    const isMe = rUserId === String(currentUserId);
    if (isMe) {
      onRemoveReaction(message._id);
      if (reactions.length <= 1) {
        onClose();
      }
    }
  };

  const handleSelectNewEmoji = (emoji) => {
    if (onReact) {
      onReact(message._id, emoji);
    }
    setShowEmojiPicker(false);
    onClose();
  };

  if (!isOpen) return null;

  const reactionCountLabel =
    reactions.length === 1 ? "1 reaction" : `${reactions.length} reactions`;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 bg-transparent"
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={
            coords
              ? {
                  position: "fixed",
                  top: `${coords.top}px`,
                  left: `${coords.left}px`,
                  width: `${coords.width}px`,
                }
              : {
                  position: "fixed",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "360px",
                }
          }
          onClick={(e) => e.stopPropagation()}
          className={`rounded-[18px] p-3.5 shadow-2xl flex flex-col relative select-none ${
            isDark
              ? "bg-[#1f2c34] text-[#e9edef] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
              : "bg-white text-[#111b21] border border-black/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
          }`}
        >
          {showEmojiPicker ? (
            /* Emoji Picker View replacing reaction details */
            <div className="flex flex-col">
              {/* Header with Back button and Close */}
              <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-white/[0.08] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer py-1 px-2 rounded-lg ${
                    isDark
                      ? "text-[#8696a0] hover:text-[#e9edef] hover:bg-white/[0.06]"
                      : "text-[#54656f] hover:text-[#111b21] hover:bg-black/[0.05]"
                  }`}
                  title="Back to reactions"
                >
                  <FaArrowLeft size={11} />
                  <span>Reactions</span>
                </button>

                <span className={`text-xs font-semibold select-none ${
                  isDark ? "text-[#8696a0]" : "text-[#54656f]"
                }`}>
                  Choose a reaction
                </span>

                <button
                  type="button"
                  onClick={onClose}
                  className={`p-1 rounded-lg cursor-pointer transition-colors ${
                    isDark
                      ? "text-[#8696a0] hover:text-[#e9edef] hover:bg-white/[0.06]"
                      : "text-[#54656f] hover:text-[#111b21] hover:bg-black/[0.05]"
                  }`}
                  title="Close"
                >
                  <RxCross2 size={15} />
                </button>
              </div>

              {/* Embedded Emoji Picker */}
              <div className="rounded-xl overflow-hidden">
                <EmojiPicker
                  onEmojiClick={(emojiObj) =>
                    handleSelectNewEmoji(emojiObj.emoji)
                  }
                  theme={isDark ? "dark" : "light"}
                  lazyLoadEmojis={true}
                  skinTonesDisabled
                  searchDisabled={false}
                  width="100%"
                  height={350}
                />
              </div>
            </div>
          ) : (
            /* Reaction Details View */
            <>
              {/* Header Title: "1 reaction" / "{N} reactions" */}
              <div className={`text-[15px] font-semibold tracking-tight mb-2.5 select-none ${
                isDark ? "text-[#e9edef]" : "text-[#111b21]"
              }`}>
                {reactionCountLabel}
              </div>

              {/* Filter Pills Bar: Smiley Plus button + Emoji pills [✨ 1] */}
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar scrollbar-none pb-0.5 mb-2.5">
                {/* Add / React Smiley Button -> switches to EmojiPicker */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(true)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-all duration-150 cursor-pointer ${
                    isDark
                      ? "bg-transparent hover:bg-white/[0.06] border-white/10 text-gray-300 hover:text-white"
                      : "bg-transparent hover:bg-black/[0.04] border-black/10 text-gray-600 hover:text-black"
                  }`}
                  title="Choose reaction emoji"
                >
                  <div className="relative flex items-center justify-center">
                    <BsEmojiSmile size={16} />
                    <FaPlus size={7} className="absolute -top-1 -right-1 font-bold" />
                  </div>
                </button>

                {/* Emoji Filter Pills (e.g. [✨ 1]) */}
                {emojiGroups.map(({ emoji, count }) => {
                  const isSelected = activeTab === emoji;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setActiveTab(isSelected ? "all" : emoji)}
                      className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-medium border shrink-0 transition-all duration-150 cursor-pointer select-none ${
                        isSelected
                          ? isDark
                            ? "bg-[#2a3942] text-white border-white/20 ring-1 ring-white/10 shadow-sm"
                            : "bg-gray-200 text-[#111b21] border-gray-300 ring-1 ring-black/5 shadow-sm"
                          : isDark
                          ? "bg-[#2a3942]/60 text-gray-200 border-white/10 hover:bg-[#2a3942]"
                          : "bg-gray-100 text-[#111b21] border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      <span className="text-[16px] leading-none">{emoji}</span>
                      <span className={`text-xs font-semibold tabular-nums ${
                        isSelected
                          ? isDark ? "text-white" : "text-[#111b21]"
                          : isDark ? "text-gray-200" : "text-gray-700"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Divider Line */}
              <div className={`border-t my-2 ${
                isDark ? "border-white/[0.08]" : "border-black/[0.08]"
              }`} />

              {/* User Reactions List */}
              <div className="overflow-y-auto custom-scrollbar max-h-[260px] space-y-1.5 pt-0.5">
                {displayedReactions.map((reaction, index) => {
                  const userObj = reaction.userId;
                  const rUserId = String(userObj?._id || userObj);
                  const isMe = rUserId === String(currentUserId);

                  let username = "User";
                  let avatar = null;

                  if (isMe) {
                    username = "You";
                    avatar = currentUser?.profilePicture;
                  } else if (userObj && typeof userObj === "object" && (userObj.username || userObj.name)) {
                    username = userObj.username || userObj.name;
                    avatar = userObj.profilePicture;
                  } else {
                    const senderId = String(message?.sender?._id || message?.sender);
                    const receiverId = String(message?.receiver?._id || message?.receiver);
                    if (rUserId === senderId && typeof message?.sender === "object") {
                      username = message.sender.username || message.sender.name || "User";
                      avatar = message.sender.profilePicture;
                    } else if (rUserId === receiverId && typeof message?.receiver === "object") {
                      username = message.receiver.username || message.receiver.name || "User";
                      avatar = message.receiver.profilePicture;
                    } else {
                      username = "Rahul Sahana";
                    }
                  }

                  return (
                    <div
                      key={index}
                      onClick={() => handleRowClick(reaction)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-[14px] transition-all duration-150 ${
                        isDark
                          ? "bg-[#111b21]/40 hover:bg-[#111b21]/65 text-[#e9edef]"
                          : "bg-gray-50 hover:bg-gray-100 border border-black/[0.04] text-[#111b21]"
                      } ${isMe ? "cursor-pointer group" : "cursor-default"}`}
                      title={isMe ? "Click to remove your reaction" : undefined}
                    >
                      {/* Left: Avatar + Username */}
                      <div className="flex items-center gap-3 min-w-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={username}
                            className={`w-10 h-10 rounded-full object-cover shrink-0 select-none border ${
                              isDark ? "border-white/10" : "border-black/10"
                            }`}
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 select-none border ${
                            isDark
                              ? "bg-black/40 text-gray-200 border-white/10"
                              : "bg-gray-200 text-gray-700 border-black/10"
                          }`}>
                            {getInitials(username)}
                          </div>
                        )}

                        <div className="min-w-0 flex flex-col justify-center">
                          <span className={`text-[15px] font-medium truncate ${
                            isDark ? "text-white/95" : "text-[#111b21]"
                          }`}>
                            {username}
                          </span>
                          {isMe && (
                            <span className="text-[11px] text-gray-500 font-medium leading-none mt-0.5">
                              Click to remove
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 pl-3 select-none">
                        <span className="text-xl leading-none">
                          {reaction.emoji}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReactionDetailsModal;
