import React, { useRef, useState, useMemo, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheckDouble,
  FaPlus,
  FaRegCopy,
  FaRegImage,
  FaVideo,
  FaDownload,
  FaHeadphones,
  FaFileAlt,
  FaRegStar,
  FaLock,
} from "react-icons/fa";
import { RiDeleteBin6Line, RiEditLine, RiContactsFill } from "react-icons/ri";
import { FiCheck, FiChevronDown, FiThumbsDown } from "react-icons/fi";
import {
  MdEventNote,
  MdLocationOn,
  MdAccessTime,
  MdReply,
  MdOutlineReplyAll,
} from "react-icons/md";
import { BsChatSquareText, BsEmojiSmile } from "react-icons/bs";
import { TbPin } from "react-icons/tb";
import { RxCross2 } from "react-icons/rx";
import useOutsideClick from "../../hook/useOutsideClick";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-toastify";
import { useChatStore } from "../../store/chatStore";
import useUserStore from "../../store/useUserStore";
import useLayoutStore from "../../store/layoutStore";
import ReactionDetailsModal from "../../components/ReactionDetailsModal";

const formatEventSchedule = (eventData) => {
  if (!eventData?.eventDate) return "Date TBD";
  try {
    const parts = eventData.eventDate.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const targetDate = new Date(year, month, day);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let dayStr = "";
      if (targetDate.getTime() === today.getTime()) {
        dayStr = "Today";
      } else if (targetDate.getTime() === tomorrow.getTime()) {
        dayStr = "Tomorrow";
      } else {
        dayStr = format(targetDate, "EEE, d MMM");
      }

      let timeStr = "";
      if (eventData.eventTime) {
        timeStr = `, ${eventData.eventTime}`;
        if (eventData.endTime) {
          timeStr += ` - ${eventData.endTime}`;
        }
      }

      return `${dayStr}${timeStr}`;
    }
    return eventData.eventDate;
  } catch (e) {
    return eventData.eventDate;
  }
};

const MessageBuble = ({
  message,
  theme,
  onReact,
  currentUser,
  deleteMessage,
  searchTerm,
  highlightText,
  dataMatch,
  isActive,
  onStatusClick,
  onEdit,
  onEditEvent,
  isFirstInSequence = true,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [menuCoords, setMenuCoords] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message?.content || "");

  const emojiPickerRef = useRef(null);
  const reactionsMenuRef = useRef(null);
  const optionRef = useRef(null);
  const pressTimer = useRef(null);
  const isLongPress = useRef(false);
  const editRef = useRef(null);
  const bubbleRef = useRef(null);
  const reactionBadgeRef = useRef(null);

  const [showReactionDetails, setShowReactionDetails] = useState(false);
  const votePoll = useChatStore((state) => state.votePoll);
  const removeReaction = useChatStore((state) => state.removeReaction);
  const setSelectedPollDetails = useLayoutStore(
    (state) => state.setSelectedPollDetails
  );
  const storeUser = useUserStore((state) => state.user);
  const effectiveUser = currentUser || storeUser;
  const currentUserId = (effectiveUser?._id || effectiveUser?.id)?.toString();
  const senderId = (
    message?.sender?._id ||
    message?.sender?.id ||
    message?.sender
  )?.toString();
  const isUserMessage = Boolean(
    currentUserId && senderId && currentUserId === senderId
  );
  const isDark = theme === "dark";
  const isSticker = message.contentType === "sticker";

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const validReactions = useMemo(() => {
    return (message.reactions || []).filter((r) => Boolean(r && r.emoji));
  }, [message.reactions]);

  const uniqueReactions = useMemo(() => {
    const list = [];
    const seen = new Set();
    validReactions.forEach((r) => {
      if (r.emoji && !seen.has(r.emoji)) {
        seen.add(r.emoji);
        list.push(r.emoji);
      }
    });
    return list;
  }, [validReactions]);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const bubbleContentClass = isSticker
    ? "relative group !p-1 bg-transparent shadow-none"
    : isUserMessage
      ? `relative group max-w-[85%] sm:max-w-[75%] md:max-w-[65%] min-w-[75px] rounded-[7.5px] pt-[6px] pb-[7px] px-[9px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${isFirstInSequence ? "rounded-tr-none" : ""
      } ${theme === "dark"
        ? "bg-[#005c4b] text-[#e9edef]"
        : "bg-[#d9fdd3] text-[#111b21]"
      }`
      : `relative group max-w-[85%] sm:max-w-[75%] md:max-w-[65%] min-w-[75px] rounded-[7.5px] pt-[6px] pb-[7px] px-[9px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${isFirstInSequence ? "rounded-tl-none" : ""
      } ${theme === "dark"
        ? "bg-[#202c33] text-[#e9edef]"
        : "bg-white text-[#111b21]"
      }`;

  const handleTouchStart = () => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowReactions(true);
    }, 400);
  };
  const handleTouchEnd = () => {
    clearTimeout(pressTimer.current);
  };

  const safeHighlight =
    typeof highlightText === "function" ? highlightText : (text) => text;

  const handleReact = (emoji) => {
    const myExistingReaction = (message.reactions || []).find(
      (r) => String(r.userId?._id || r.userId) === String(currentUserId)
    );
    if (myExistingReaction && myExistingReaction.emoji === emoji) {
      if (removeReaction) {
        removeReaction(message._id);
      } else {
        onReact(message._id, null);
      }
      setShowReactionDetails(false);
    } else {
      onReact(message._id, emoji);
    }
    setShowEmojiPicker(false);
    setShowReactions(false);
  };

  useOutsideClick(emojiPickerRef, () => {
    if (showEmojiPicker) setShowEmojiPicker(false);
  });

  useOutsideClick(reactionsMenuRef, () => {
    if (showReactions) setShowReactions(false);
  });

  useOutsideClick(optionRef, () => {
    if (showOptions) setShowOptions(false);
  });

  useOutsideClick(editRef, () => {
    if (isEditing) {
      setIsEditing(false);
      setEditText(message.content || "");
    }
  });

  // Ensure only one message context menu is open at a time across the entire chat
  useEffect(() => {
    const handleCloseOthers = (e) => {
      if (e.detail !== message._id) {
        setShowOptions(false);
      }
    };
    window.addEventListener("whatsapp_close_all_menus", handleCloseOthers);
    return () => {
      window.removeEventListener("whatsapp_close_all_menus", handleCloseOthers);
    };
  }, [message._id]);

  // Close context menu dynamically when user scrolls, resizes window, or presses Escape
  useEffect(() => {
    if (!showOptions) return;

    const handleDismiss = () => {
      setShowOptions(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowOptions(false);
      }
    };

    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showOptions]);

  // Dynamically re-adjust position once menu is rendered to ensure it never overflows any edge
  useLayoutEffect(() => {
    if (showOptions && optionRef.current && menuCoords?.triggerRect) {
      const el = optionRef.current;
      const realHeight = el.offsetHeight;
      const realWidth = el.offsetWidth;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const padding = 10;
      const triggerRect = menuCoords.triggerRect;

      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      let newTop = menuCoords.top;
      let originY = "top";

      if (spaceBelow >= realHeight || spaceBelow >= spaceAbove) {
        newTop = triggerRect.bottom + 4;
        originY = "top";
        if (newTop + realHeight > viewportHeight - padding) {
          newTop = Math.max(padding, viewportHeight - realHeight - padding);
        }
      } else {
        newTop = triggerRect.top - realHeight - 4;
        originY = "bottom";
        if (newTop < padding) {
          newTop = padding;
        }
      }

      let newLeft = menuCoords.left;
      let originX = isUserMessage ? "right" : "left";
      if (isUserMessage) {
        newLeft = triggerRect.right - realWidth;
        if (newLeft < padding) newLeft = padding;
      } else {
        if (triggerRect.right + realWidth <= viewportWidth - padding) {
          newLeft = triggerRect.left;
          originX = "left";
        } else {
          newLeft = triggerRect.right - realWidth;
          originX = "right";
        }
        if (newLeft < padding) newLeft = padding;
        if (newLeft + realWidth > viewportWidth - padding) {
          newLeft = Math.max(padding, viewportWidth - realWidth - padding);
        }
      }

      if (
        Math.abs(newTop - menuCoords.top) > 2 ||
        Math.abs(newLeft - menuCoords.left) > 2
      ) {
        setMenuCoords((prev) => ({
          ...prev,
          top: Math.round(newTop),
          left: Math.round(newLeft),
          transformOrigin: `${originY} ${originX}`,
        }));
      }
    }
  }, [showOptions]);

  // Open context menu dynamically at trigger chevron button
  const handleToggleOptions = (e) => {
    e.stopPropagation();
    if (showOptions) {
      setShowOptions(false);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("whatsapp_close_all_menus", { detail: message._id })
    );

    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 220;
    const estimatedHeight = 420;
    const padding = 10;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top;
    let originY = "top";

    if (spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove) {
      top = rect.bottom + 4;
      originY = "top";
      if (top + estimatedHeight > viewportHeight - padding) {
        top = Math.max(padding, viewportHeight - estimatedHeight - padding);
      }
    } else {
      top = rect.top - estimatedHeight - 4;
      originY = "bottom";
      if (top < padding) {
        top = padding;
      }
    }

    let left;
    let originX = isUserMessage ? "right" : "left";

    if (isUserMessage) {
      left = rect.right - menuWidth;
      if (left < padding) left = padding;
    } else {
      if (rect.right + menuWidth <= viewportWidth - padding) {
        left = rect.left;
        originX = "left";
      } else {
        left = rect.right - menuWidth;
        originX = "right";
      }
      if (left < padding) left = padding;
      if (left + menuWidth > viewportWidth - padding) {
        left = Math.max(padding, viewportWidth - menuWidth - padding);
      }
    }

    setMenuCoords({
      top: Math.round(top),
      left: Math.round(left),
      transformOrigin: `${originY} ${originX}`,
      triggerRect: rect,
    });
    setShowOptions(true);
  };

  // WhatsApp-style right-click context menu on message bubble
  const handleContextMenu = (e) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

    e.preventDefault();
    e.stopPropagation();

    window.dispatchEvent(
      new CustomEvent("whatsapp_close_all_menus", { detail: message._id })
    );

    const clientX = e.clientX;
    const clientY = e.clientY;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 220;
    const estimatedHeight = 420;
    const padding = 10;

    let top = clientY + 4;
    let originY = "top";
    if (clientY + estimatedHeight > viewportHeight - padding) {
      top = Math.max(padding, clientY - estimatedHeight - 4);
      originY = "bottom";
    }

    let left = isUserMessage ? clientX - menuWidth : clientX;
    let originX = isUserMessage ? "right" : "left";
    if (left + menuWidth > viewportWidth - padding) {
      left = Math.max(padding, viewportWidth - menuWidth - padding);
      originX = "right";
    }
    if (left < padding) {
      left = padding;
      originX = "left";
    }

    setMenuCoords({
      top: Math.round(top),
      left: Math.round(left),
      transformOrigin: `${originY} ${originX}`,
      triggerRect: { top: clientY, bottom: clientY, left: clientX, right: clientX },
    });
    setShowOptions(true);
  };

  if (!message) return null;
  return (
    <div
      className={`w-full flex ${isUserMessage
        ? "justify-end pl-10 sm:pl-16 md:pl-24 pr-1 sm:pr-2.5"
        : "justify-start pr-10 sm:pr-16 md:pr-24 pl-1 sm:pl-2.5"
        } ${isActive ? "z-10" : ""} !py-0 ${isFirstInSequence ? "mt-2" : "mt-[2.5px]"
        }`}
      data-match={dataMatch ? "true" : "false"}
    >
      <div
        ref={bubbleRef}
        onContextMenu={handleContextMenu}
        className={`${bubbleContentClass} relative group ${isActive
          ? "ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.55)]"
          : ""
          }`}
      >
        {!isSticker && isFirstInSequence && (
          isUserMessage ? (
            <span
              data-icon="tail-out"
              className={`absolute top-0 -right-[8px] pointer-events-none select-none ${isDark ? "text-[#005c4b]" : "text-[#d9fdd3]"
                }`}
            >
              <svg viewBox="0 0 8 13" height="13" width="8" className="fill-current">
                <path opacity="0.13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
                <path d="M5.188 0H0v12.193l6.467-8.625C7.526 2.156 6.958 0 5.188 0z" />
              </svg>
            </span>
          ) : (
            <span
              data-icon="tail-in"
              className={`absolute top-0 -left-[8px] pointer-events-none select-none ${isDark ? "text-[#202c33]" : "text-white"
                }`}
            >
              <svg viewBox="0 0 8 13" height="13" width="8" className="fill-current">
                <path opacity="0.13" d="M1.533 4.568 8 13.193V1H2.812C1.042 1 .474 3.156 1.533 4.568z" />
                <path d="M1.533 3.568 8 12.193V0H2.812C1.042 0 .474 2.156 1.533 3.568z" />
              </svg>
            </span>
          )
        )}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onClick={() => setShowReactions((prev) => !prev)}
          className="relative"
        >
          {message.statusId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!onStatusClick || !message.statusId) return;
                onStatusClick(message.statusId);
              }}
              className={`mb-2 w-full text-left overflow-hidden rounded-xl border-l-[3px] cursor-pointer transition-colors duration-150 hover:brightness-105 active:opacity-90 ${isDark
                ? "bg-white/[0.04] border-purple-400"
                : "bg-black/[0.03] border-purple-500"
                }`}
            >
              <div className="px-3 py-2">
                <p
                  className={`text-sm font-semibold tracking-tight ${isDark ? "text-purple-300" : "text-purple-600"
                    }`}
                >
                  {message.statusId?.user?.username || "Status"}
                </p>
                {message.statusId?.contentType === "text" && (
                  <div className="pt-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FaRegFileAlt
                        size={11}
                        className={isDark ? "text-gray-400" : "text-gray-500"}
                      />
                      <span
                        className={`text-[11px] font-medium uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                      >
                        Text status
                      </span>
                    </div>

                    <p
                      className={`text-sm leading-snug line-clamp-2 ${isDark ? "text-white/90" : "text-gray-800"
                        }`}
                    >
                      {message.statusId?.content || "Text status"}
                    </p>
                  </div>
                )}

                {message.statusId?.contentType === "image" && (
                  <div
                    className={`mt-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                  >
                    <FaRegImage size={11} />
                    <span>Photo</span>
                  </div>
                )}

                {message.statusId?.contentType === "video" && (
                  <div
                    className={`mt-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                  >
                    <FaVideo size={11} />
                    <span>Video</span>
                  </div>
                )}
              </div>

              {message.statusId?.contentType === "image" &&
                message.statusId?.mediaUrl && (
                  <img
                    src={message.statusId.mediaUrl}
                    alt="Status"
                    className="w-full h-24 object-cover"
                  />
                )}

              {message.statusId?.contentType === "video" &&
                message.statusId?.mediaUrl && (
                  <div className="relative h-24 w-full">
                    <video
                      src={message.statusId.mediaUrl}
                      muted
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <FaVideo className="text-white" />
                    </div>
                  </div>
                )}
            </button>
          )}

          <div className="flex flex-col gap-1">
            {message.contentType === "text" && (
              <>
                {isEditing ? (
                  <div
                    ref={editRef}
                    className="flex w-full min-w-[220px] flex-col gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                      rows={2}
                      className={`w-full resize-none rounded-xl border px-3 py-2 text-sm leading-relaxed outline-none transition-colors ${isDark
                        ? "border-white/10 bg-[#111b21] text-white focus:border-emerald-400"
                        : "border-black/10 bg-white text-black focus:border-emerald-500"
                        }`}
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditText(message.content || "");
                        }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${isDark
                          ? "text-gray-300 hover:bg-white/10"
                          : "text-gray-500 hover:bg-black/5"
                          }`}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={!editText.trim()}
                        onClick={async () => {
                          try {
                            await onEdit(message._id, editText.trim());

                            setIsEditing(false);

                            toast.success("Message edited");
                          } catch (error) {
                            toast.error("Failed to edit message");
                          }
                        }}
                        className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-500/30 transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[14.2px] leading-[19px] select-text">
                    <span className="break-words whitespace-pre-wrap">
                      {searchTerm
                        ? safeHighlight(message.content || "", searchTerm)
                        : message.content}
                    </span>
                    <span className="inline-flex items-center gap-1 float-right translate-y-[3px] ml-2.5 select-none shrink-0 pointer-events-auto">

                      {message.edited && (
                        <span className="text-[10px] italic opacity-75 mr-0.5">
                          Edited
                        </span>
                      )}
                      <span className="text-[11px] leading-none opacity-60 font-normal">
                        {format(new Date(message.createdAt), "HH:mm")}
                      </span>
                      {isUserMessage && (
                        <span className="inline-flex items-center ml-0.5">
                          {message.messageStatus === "send" && (
                            <FiCheck size={14} className="opacity-60" />
                          )}
                          {message.messageStatus === "delivered" && (
                            <FaCheckDouble size={12} className="opacity-60" />
                          )}
                          {message.messageStatus === "read" && (
                            <FaCheckDouble size={12} className="text-[#53bdeb]" />
                          )}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleToggleOptions}
                        className={`${showOptions ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          } transition-opacity p-0.5 opacity-60 hover:opacity-100 cursor-pointer ml-0.5`}
                        title="Menu"
                      >
                        <FiChevronDown size={14} />
                      </button>
                    </span>
                  </div>
                )}
              </>
            )}

            {message.contentType === "image" && (
              <div className="max-w-full">
                <img
                  src={message.imageOrVideoUrl}
                  alt="img"
                  className="rounded-xl w-full max-w-[280px] sm:max-w-xs md:max-w-sm object-cover ring-1 ring-black/[0.06]"
                />
                {message.content && (
                  <p className="mt-1.5 break-words text-[14.5px] leading-relaxed">
                    {searchTerm
                      ? safeHighlight(message.content || "", searchTerm)
                      : message.content}
                  </p>
                )}
              </div>
            )}

            {message.contentType === "video" && (
              <div className="max-w-full">
                <video
                  src={message.imageOrVideoUrl}
                  controls
                  className="rounded-xl w-full max-w-[280px] sm:max-w-xs md:max-w-sm ring-1 ring-black/[0.06]"
                />
                {message.content && (
                  <p className="mt-1.5 break-words text-[14.5px] leading-relaxed">
                    {message.content}
                  </p>
                )}
              </div>
            )}
            {message.contentType === "document" && (
              <div className="flex flex-col gap-1 min-w-[220px] max-w-[320px]">
                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isDark ? "bg-white/[0.04] border-white/10" : "bg-black/[0.03] border-black/5"
                  }`}>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <FaFileAlt size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">
                      {message.fileName || message.content || "Document"}
                    </p>
                    <p className="text-[11px] opacity-60 mt-0.5">
                      {message.fileSize || "File"}
                    </p>
                  </div>
                  {message.imageOrVideoUrl && (
                    <a
                      href={message.imageOrVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={message.fileName || "document"}
                      className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                      title="Download"
                    >
                      <FaDownload size={14} className="opacity-80" />
                    </a>
                  )}
                </div>
                {message.content && message.content !== message.fileName && (
                  <p className="mt-1 break-words text-[14px] leading-relaxed">
                    {message.content}
                  </p>
                )}
              </div>
            )}

            {message.contentType === "audio" && (
              <div className="flex flex-col gap-1 min-w-[240px] max-w-[320px] py-1">
                <div className="flex items-center gap-2 mb-1">
                  <FaHeadphones className="text-amber-500 shrink-0" size={14} />
                  <span className="text-xs font-medium opacity-75 truncate">
                    {message.fileName || "Voice / Audio message"}
                  </span>
                </div>
                <audio
                  src={message.imageOrVideoUrl}
                  controls
                  className="w-full h-9 rounded-lg"
                />
              </div>
            )}

            {message.contentType === "contact" && (() => {
              const contactData = typeof message.contactData === "string"
                ? (() => { try { return JSON.parse(message.contactData); } catch (e) { return {}; } })()
                : (message.contactData || {});

              const contactName = contactData?.name || (typeof message.content === "string" ? message.content.replace(/^Contact:\s*/, "") : "Contact");
              const phone = contactData?.phoneNumber;
              const email = contactData?.email;
              const avatar = contactData?.avatar;

              return (
                <div className="min-w-[230px] max-w-[300px]">
                  <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? "bg-white/[0.05] border-white/10" : "bg-white/80 border-black/5 shadow-sm"}`}>
                    <div className="w-11 h-11 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center shrink-0 overflow-hidden font-bold">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt="Contact"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <RiContactsFill size={24} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold truncate">
                        {contactName}
                      </p>
                      {phone && (
                        <p className="text-xs opacity-75 truncate font-mono">
                          {phone}
                        </p>
                      )}
                      {email && (
                        <p className="text-xs opacity-75 truncate">
                          {email}
                        </p>
                      )}
                      {!phone && !email && (
                        <p className="text-xs opacity-60 italic">
                          No number or email
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {message.contentType === "poll" && (
              <div className="flex flex-col w-[280px] xs:w-[305px] sm:w-[320px] max-w-full select-none">
                <div className="flex items-center justify-between pb-1 -mt-0.5">
                  <span className="text-[13px] font-bold text-[#53bdeb] tracking-wide truncate uppercase">
                    {isUserMessage ? "YOU" : (message.sender?.username ? message.sender.username.toUpperCase() : "RUPAK MONDAL")}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleOptions}
                    className={`p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${showOptions
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-[#8696a0] hover:text-gray-900 dark:hover:text-white"
                      }`}
                    title="Menu"
                  >
                    <FiChevronDown size={19} />
                  </button>
                </div>
                <h3 className={`font-bold text-[15px] leading-snug tracking-tight mb-1 ${isDark ? "text-white" : "text-gray-900"
                  }`}>
                  {message.pollData?.question || message.content}
                </h3>
                <div className={`flex items-center gap-1.5 text-[12px] font-normal mb-3 ${isDark ? "text-[#8696a0]" : "text-gray-500"
                  }`}>
                  {message.pollData?.isClosed ? (
                    <MdAccessTime size={13} className={`shrink-0 ${isDark ? "text-[#8696a0]" : "text-gray-500"}`} />
                  ) : message.pollData?.allowMultiple ? (
                    <FaCheckDouble size={12} className={`shrink-0 rounded-full ${isDark ? "text-[#8696a0]" : "text-gray-500"}`} />
                  ) : (
                    <FiCheck size={14} className={`shrink-0 ${isDark ? "text-[#8696a0]" : "text-gray-500"}`} />
                  )}
                  <span>
                    {message.pollData?.isClosed
                      ? "Poll ended"
                      : message.pollData?.allowMultiple
                        ? "Select one or more"
                        : "Select one"}
                  </span>
                </div>

                <div className="space-y-3">
                  {message.pollData?.options?.map((option, idx) => {
                    const totalVotes =
                      message.pollData.options.reduce(
                        (sum, o) => sum + (o.votes?.length || 0),
                        0
                      ) || 0;
                    const optionVotes = option.votes?.length || 0;
                    const percentage =
                      totalVotes > 0
                        ? Math.round((optionVotes / totalVotes) * 100)
                        : 0;
                    const hasVoted = option.votes?.some((v) => {
                      const vId = (v?._id || v)?.toString();
                      return vId && currentUserId && vId === currentUserId;
                    });

                    return (
                      <div
                        key={idx}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          votePoll(message._id, idx);
                        }}
                        className="space-y-1.5 cursor-pointer group/opt select-none"
                      >
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {hasVoted ? (
                              <span className="w-5 h-5 rounded-full bg-[#00a884] text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm">
                                ✓
                              </span>
                            ) : (
                              <span className={`w-5 h-5 rounded-full border-2 shrink-0 ${isDark ? "border-[#8696a0]/80" : "border-gray-400"
                                }`}></span>
                            )}
                            <span
                              className={`text-[14.5px] leading-snug break-words ${hasVoted
                                ? isDark ? "font-semibold text-white" : "font-semibold text-gray-900"
                                : isDark ? "font-normal text-white/95" : "font-normal text-gray-800"
                                }`}
                            >
                              {option.text}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {option.votes && option.votes.length > 0 && (
                              <div className="flex -space-x-1.5 items-center">
                                {option.votes.slice(0, 3).map((voter, vIdx) => {
                                  const avatar = voter?.profilePicture;
                                  const name = voter?.username || "User";
                                  return avatar ? (
                                    <img
                                      key={vIdx}
                                      src={avatar}
                                      alt={name}
                                      className={`w-5 h-5 rounded-full border object-cover ${isDark ? "border-[#202c33]" : "border-gray-200"
                                        }`}
                                    />
                                  ) : (
                                    <div
                                      key={vIdx}
                                      className={`w-5 h-5 rounded-full border bg-[#7c3aed] text-[9px] text-white font-bold flex items-center justify-center ${isDark ? "border-[#202c33]" : "border-gray-200"
                                        }`}
                                    >
                                      {name.charAt(0).toUpperCase()}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <span className={`text-[13px] font-normal tabular-nums ${isDark ? "text-[#8696a0]" : "text-gray-500"
                              }`}>
                              {optionVotes}
                            </span>
                          </div>
                        </div>

                        <div className={`w-full h-[6px] rounded-full overflow-hidden ${isDark ? "bg-[#2a3942]" : "bg-black/10"
                          }`}>
                          <div
                            className="h-full bg-[#00a884] rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={`flex justify-end text-[11px] mt-2 mb-0.5 ${isDark ? "text-[#8696a0]" : "text-[#667781]"
                  }`}>
                  <span>{format(new Date(message.createdAt), "HH:mm")}</span>
                </div>
                <div className={`border-t -mx-3 -mb-2.5 mt-2 rounded-b-2xl overflow-hidden ${isDark ? "border-[#2a3942]" : "border-black/10"
                  }`}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPollDetails(message);
                    }}
                    title="View poll votes"
                    className={`w-full py-2 text-center text-[14px] font-semibold text-emerald-500 hover:text-emerald-400 active:scale-98 transition-all cursor-pointer ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                      }`}
                  >
                    View votes
                  </button>
                </div>
              </div>
            )}

            {message.contentType === "event" && (() => {
              const goingCount = message.eventData?.responses?.length
                ? message.eventData.responses.filter((r) => r.status === "going" || r.status === "yes").length || message.eventData.responses.length
                : 2;
              const senderAvatar = isUserMessage
                ? (effectiveUser?.profilePic || effectiveUser?.avatar)
                : (message?.sender?.profilePic || message?.sender?.avatar);
              const senderDisplayName = message?.sender?.name || effectiveUser?.name || "U";

              return (
                <div className="flex flex-col min-w-[260px] max-w-[310px] w-full select-none">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${isDark
                        ? "bg-[#143d2e] text-[#25d366]"
                        : "bg-emerald-600/15 text-emerald-700"
                        }`}
                    >
                      <MdEventNote size={24} />
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <h4
                        className={`text-[16px] font-bold leading-tight break-words ${message.eventData?.isCancelled
                          ? "line-through opacity-60"
                          : ""
                          }`}
                      >
                        {message.eventData?.title || message.content}
                      </h4>

                      <p
                        className={`text-[13px] font-normal mt-1 ${isDark ? "text-white/75" : "text-gray-700"
                          }`}
                      >
                        {formatEventSchedule(message.eventData)}
                      </p>

                      {message.eventData?.description && (
                        <p
                          className={`text-[14px] font-normal mt-1 break-words ${isDark ? "text-white/90" : "text-gray-800"
                            }`}
                        >
                          {message.eventData.description}
                        </p>
                      )}

                      {message.eventData?.hasCallLink && (
                        <p
                          className={`text-[13px] font-normal mt-1 ${isDark ? "text-white/75" : "text-gray-700"
                            }`}
                        >
                          WhatsApp video call
                        </p>
                      )}

                      {message.eventData?.location && (
                        <div className="flex items-center gap-1 text-[13px] opacity-75 mt-1">
                          <MdLocationOn size={14} className="text-red-400 shrink-0" />
                          <span className="truncate">{message.eventData.location}</span>
                        </div>
                      )}

                      {message.eventData?.isCancelled && (
                        <span className="mt-1.5 inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                          Event cancelled
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-[12px]">
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5 items-center">
                        {senderAvatar ? (
                          <img
                            src={senderAvatar}
                            alt=""
                            className={`w-5 h-5 rounded-full object-cover border ${isDark ? "border-[#005c4b]" : "border-[#d9fdd3]"
                              }`}
                          />
                        ) : (
                          <div
                            className={`w-5 h-5 rounded-full bg-emerald-700 border flex items-center justify-center text-[9px] text-white ${isDark ? "border-[#005c4b]" : "border-[#d9fdd3]"
                              }`}
                          >
                            {senderDisplayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div
                          className={`w-5 h-5 rounded-full bg-[#7a3b2e] border flex items-center justify-center text-white ${isDark ? "border-[#005c4b]" : "border-[#d9fdd3]"
                            }`}
                        >
                          <RiContactsFill size={10} />
                        </div>
                      </div>
                      <span
                        className={`font-normal text-[13px] ${isDark ? "text-white/70" : "text-gray-600"
                          }`}
                      >
                        {goingCount} going
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-1 text-[11px] ${isDark ? "text-white/60" : "text-gray-500"
                        }`}
                    >
                      {message.edited && (
                        <span className="italic mr-0.5">Edited</span>
                      )}
                      <span>{format(new Date(message.createdAt), "HH:mm")}</span>
                      {isUserMessage && (
                        <>
                          {message.messageStatus === "send" && (
                            <FiCheck size={14} />
                          )}
                          {message.messageStatus === "delivered" && (
                            <FaCheckDouble size={12} />
                          )}
                          {message.messageStatus === "read" && (
                            <FaCheckDouble size={12} className="text-[#53bdeb]" />
                          )}
                        </>
                      )}
                      <button
                        type="button"
                        onClick={handleToggleOptions}
                        className={`${showOptions ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          } transition-opacity p-0.5 opacity-60 hover:opacity-100 cursor-pointer ml-0.5`}
                        title="Menu"
                      >
                        <FiChevronDown size={14} />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`border-t -mx-[9px] -mb-[7px] mt-2.5 rounded-b-[7.5px] overflow-hidden ${isDark ? "border-white/10" : "border-black/10"
                      }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEditEvent) {
                          onEditEvent(message);
                        }
                      }}
                      title="Edit or cancel event"
                      className={`w-full py-2.5 text-center text-[15px] font-medium text-[#00a884] dark:text-[#25d366] hover:bg-black/5 dark:hover:bg-white/5 active:scale-98 transition-all cursor-pointer`}
                    >
                      Edit event
                    </button>
                  </div>
                </div>
              );
            })()}

            {message.contentType === "sticker" && (
              <div className="relative p-1">
                <img
                  src={message.imageOrVideoUrl}
                  alt="Sticker"
                  className="w-36 h-36 object-contain select-none filter drop-shadow-md transition-transform hover:scale-105"
                />
              </div>
            )}
          </div>
        </div>

        {message.contentType !== "text" && message.contentType !== "poll" && message.contentType !== "event" && (
          <div className="flex items-center justify-end gap-1.5 text-[11px] opacity-60 mt-1 select-none">
            {message.isEncrypted && (
              <FaLock
                size={9}
                className="opacity-70 text-emerald-500 mr-0.5 inline-block shrink-0"
                title="End-to-end encrypted"
              />
            )}
            {message.edited && (
              <span className="italic opacity-80 mr-0.5">Edited</span>
            )}
            <span>{format(new Date(message.createdAt), "HH:mm")}</span>
            {isUserMessage && (
              <>
                {message.messageStatus === "send" && <FiCheck size={14} />}
                {message.messageStatus === "delivered" && (
                  <FaCheckDouble size={12} />
                )}
                {message.messageStatus === "read" && (
                  <FaCheckDouble size={12} className="text-[#53bdeb]" />
                )}
              </>
            )}
            <button
              type="button"
              onClick={handleToggleOptions}
              className={`${showOptions ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                } transition-opacity p-0.5 opacity-60 hover:opacity-100 cursor-pointer ml-0.5`}
              title="Menu"
            >
              <FiChevronDown size={14} />
            </button>
          </div>
        )}

        <div
          className={`absolute ${isUserMessage ? "-left-8" : "-right-8"
            } top-1/2 -translate-y-1/2 flex flex-col items-center z-10`}
        >
          <AnimatePresence>
            {showReactions && (
              <motion.div
                ref={reactionsMenuRef}
                initial={{ opacity: 0, scale: 0.85, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 6 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className={`absolute bottom-full mb-2 flex items-center rounded-full px-2 py-1.5 gap-0.5 shadow-xl border z-50 ${isDark
                  ? "bg-[#233138]/95 border-white/10 backdrop-blur-md"
                  : "bg-white/95 border-black/[0.06] backdrop-blur-md"
                  }`}
              >
                {quickReactions.map((emoji, index) => {
                  const isSelected = (message.reactions || []).some(
                    (r) =>
                      String(r.userId?._id || r.userId) === String(currentUserId) &&
                      r.emoji === emoji
                  );
                  return (
                    <button
                      key={index}
                      onClick={() => handleReact(emoji)}
                      className={`text-lg hover:scale-125 transition-transform duration-150 p-1.5 rounded-full cursor-pointer ${isSelected
                        ? "bg-emerald-500/25 ring-1 ring-emerald-500 scale-110"
                        : "hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                        }`}
                      title={isSelected ? "Click to remove" : `React ${emoji}`}
                    >
                      {emoji}
                    </button>
                  );
                })}

                <div
                  className={`w-px h-5 mx-1 ${isDark ? "bg-white/15" : "bg-black/10"
                    }`}
                />

                <button
                  className={`rounded-full p-1.5 cursor-pointer transition-colors ${isDark
                    ? "hover:bg-white/10 text-gray-300"
                    : "hover:bg-black/[0.06] text-gray-600"
                    }`}
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                >
                  <FaPlus className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                ref={emojiPickerRef}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[9999]"
                style={{
                  bottom: "80px",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <EmojiPicker
                    onEmojiClick={(emojiObject) =>
                      handleReact(emojiObject.emoji)
                    }
                    theme={theme}
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEmojiPicker(false);
                    }}
                    className={`absolute top-2 right-2 rounded-full p-1.5 shadow-md transition-colors ${isDark
                      ? "bg-[#202c33] text-gray-300 hover:bg-[#2a3942]"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    <RxCross2 className="cursor-pointer" size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowReactions((prev) => !prev);
            }}
            className={`w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${showReactions
              ? "opacity-100 bg-black/10 dark:bg-white/10"
              : "opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
              }`}
            title="React"
          >
            <BsEmojiSmile
              size={16}
              className={isDark ? "text-[#8696a0] hover:text-[#e9edef]" : "text-[#54656f] hover:text-[#111b21]"}
            />
          </button>
        </div>

        {validReactions.length > 0 && (
          <button
            ref={reactionBadgeRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowReactionDetails(true);
            }}
            title="View reactions"
            className={`absolute -bottom-2.5 z-20 flex items-center px-1.5 py-0.5 rounded-full border transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer select-none ${isUserMessage ? "right-2" : "left-2"
              } ${isDark
                ? "bg-[#202c33] border-[#222e35] shadow-[0_1px_3px_rgba(0,0,0,0.45)] hover:bg-[#26343d]"
                : "bg-white border-[#e9edef] shadow-[0_1px_3px_rgba(11,20,26,0.18)] hover:bg-[#f5f6f6]"
              }`}
          >
            <div className="flex items-center -space-x-0.5">
              {uniqueReactions.slice(0, 3).map((emoji, index) => (
                <span
                  key={index}
                  className="text-[13px] leading-none select-none inline-block"
                >
                  {emoji}
                </span>
              ))}
            </div>
            {validReactions.length > 1 && (
              <span className="text-[11px] font-medium leading-none ml-1 tabular-nums text-[#667781] dark:text-[#8696a0]">
                {validReactions.length}
              </span>
            )}
          </button>
        )}

        {typeof document !== "undefined" &&
          createPortal(
            <AnimatePresence>
              {showOptions && menuCoords && (
                <>
                  {/* Invisible backdrop to capture outside clicks and prevent accidental underlying actions */}
                  <div
                    className="fixed inset-0 z-[9998] bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptions(false);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowOptions(false);
                    }}
                  />

                  <motion.div
                    ref={optionRef}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                    style={{
                      position: "fixed",
                      top: `${menuCoords.top}px`,
                      left: `${menuCoords.left}px`,
                      transformOrigin: menuCoords.transformOrigin || "top right",
                    }}
                    className={`z-[9999] min-w-[215px] py-1.5 overflow-hidden rounded-xl shadow-[0_6px_28px_rgba(0,0,0,0.5)] border select-none ${isDark
                      ? "bg-[#233138] border-[#2a3942]/90 text-[#d1d7db]"
                      : "bg-white border-black/10 text-gray-800 shadow-[0_6px_24px_rgba(11,20,26,0.18)]"
                      }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className={`flex items-center px-4 py-2 gap-2 text-xs font-medium border-b select-none mb-1 ${isDark
                        ? "border-white/10 text-emerald-400 bg-white/[0.03]"
                        : "border-black/5 text-emerald-700 bg-emerald-50/60"
                        }`}
                    >
                      <FaLock size={11} className="shrink-0 text-emerald-500" />
                      <span>End-to-end encrypted</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowOptions(false);
                        toast.info("Reply to message");
                      }}
                      className={`flex w-full items-center px-4 py-2 gap-3.5 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-gray-100"
                        }`}
                    >
                      <MdReply size={18} className="opacity-80 shrink-0" />
                      <span className="font-normal text-[14px]">Reply</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowOptions(false);
                        toast.info("Reply privately");
                      }}
                      className={`flex w-full items-center px-4 py-2 gap-3.5 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-gray-100"
                        }`}
                    >
                      <MdOutlineReplyAll size={18} className="opacity-80 shrink-0" />
                      <span className="font-normal text-[14px]">Reply privately</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowOptions(false);
                        const senderName = message.sender?.username || "Contact";
                        toast.info(`Message ${senderName}`);
                      }}
                      className={`flex w-full items-center px-4 py-2 gap-3.5 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-gray-100"
                        }`}
                    >
                      <BsChatSquareText size={16} className="opacity-80 shrink-0" />
                      <span className="font-normal text-[14px] truncate">
                        Message {message.sender?.username ? message.sender.username.toUpperCase() : "CONTACT"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowOptions(false);
                        setShowReactions(true);
                      }}
                      className={`flex w-full items-center px-4 py-2 gap-3.5 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-gray-100"
                        }`}
                    >
                      <BsEmojiSmile size={17} className="opacity-80 shrink-0" />
                      <span className="font-normal text-[14px]">React</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowOptions(false);
                        toast.success("Message pinned");
                      }}
                      className={`flex w-full items-center px-4 py-2 gap-3.5 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-gray-100"
                        }`}
                    >
                      <TbPin size={18} className="opacity-80 shrink-0" />
                      <span className="font-normal text-[14px]">Pin</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowOptions(false);
                        toast.success("Message starred");
                      }}
                      className={`flex w-full items-center px-4 py-2 gap-3.5 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-gray-100"
                        }`}
                    >
                      <FaRegStar size={16} className="opacity-80 shrink-0" />
                      <span className="font-normal text-[14px]">Star</span>
                    </button>

                    {message.contentType === "text" && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(message.content || "");
                          toast.success("Copied");
                          setShowOptions(false);
                        }}
                        className={`flex w-full items-center px-4 py-2 gap-3.5 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-gray-100"
                          }`}
                      >
                        <FaRegCopy size={15} className="opacity-80 shrink-0" />
                        <span className="font-normal text-[14px]">Copy</span>
                      </button>
                    )}

                    {isUserMessage && message.contentType === "text" && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditText(message.content || "");
                          setIsEditing(true);
                          setShowOptions(false);
                        }}
                        className={`flex w-full items-center px-4 py-2 gap-3.5 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-gray-100"
                          }`}
                      >
                        <RiEditLine size={16} className="opacity-80 shrink-0" />
                        <span className="font-normal text-[14px]">Edit</span>
                      </button>
                    )}

                    <div
                      className={`my-1 border-t ${isDark ? "border-[#313d45]" : "border-black/10"
                        }`}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setShowOptions(false);
                        toast.info("Report submitted");
                      }}
                      className={`flex w-full items-center px-4 py-2 gap-3.5 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-gray-100"
                        }`}
                    >
                      <FiThumbsDown size={17} className="opacity-80 shrink-0" />
                      <span className="font-normal text-[14px]">Report</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteModal(message);
                        setShowOptions(false);
                      }}
                      className={`flex w-full items-center px-4 py-2 gap-3.5 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-gray-100"
                        }`}
                    >
                      <RiDeleteBin6Line size={17} className="opacity-80 shrink-0" />
                      <span className="font-normal text-[14px]">Delete</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body
          )}

        <AnimatePresence>
          {deleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`fixed inset-0 z-[1000] flex items-center justify-center px-4 backdrop-blur-xl ${isDark ? "bg-black/70" : "bg-black/30"
                }`}
              onClick={() => setDeleteModal(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 22,
                }}
                className={`relative w-full max-w-sm overflow-hidden rounded-[28px] border p-6 shadow-2xl backdrop-blur-2xl ${isDark
                  ? "border-white/[0.08] bg-gradient-to-br from-[#202c33]/95 via-[#111b21]/95 to-[#0b141a]/95 shadow-black/50"
                  : "border-white/70 bg-gradient-to-br from-white/95 via-white/90 to-zinc-100/95 shadow-black/10"
                  }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl ${isDark ? "bg-red-500/10" : "bg-red-400/10"
                    }`}
                />

                <div
                  className={`pointer-events-none absolute left-8 right-8 top-0 h-px ${isDark
                    ? "bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    : "bg-gradient-to-r from-transparent via-black/10 to-transparent"
                    }`}
                />

                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:rotate-90 cursor-pointer ${isDark
                    ? "bg-white/[0.05] text-gray-400 hover:bg-white/10 hover:text-white"
                    : "bg-black/[0.04] text-gray-500 hover:bg-black/[0.08] hover:text-gray-900"
                    }`}
                >
                  <RxCross2 className="cursor-pointer" size={16} />
                </button>

                <div className="relative flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.1,
                      type: "spring",
                      stiffness: 300,
                    }}
                    className={`relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg ${isDark
                      ? "border-red-400/10 bg-gradient-to-br from-red-500/20 to-red-600/5 text-red-400 shadow-red-500/10"
                      : "border-red-500/10 bg-gradient-to-br from-red-500/10 to-red-500/5 text-red-500 shadow-red-500/10"
                      }`}
                  >
                    <RiDeleteBin6Line size={27} />
                    <div
                      className={`absolute inset-0 -z-10 rounded-2xl blur-xl ${isDark ? "bg-red-500/20" : "bg-red-500/10"
                        }`}
                    />
                  </motion.div>
                  <h2
                    className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-zinc-900"
                      }`}
                  >
                    Delete message?
                  </h2>
                  <p
                    className={`mt-2 max-w-[290px] text-sm leading-6 ${isDark ? "text-zinc-400" : "text-zinc-500"
                      }`}
                  >
                    Choose how you want to delete this message. This action
                    cannot be undone.
                  </p>
                </div>

                <div className="relative mt-7 flex flex-col gap-3">
                  {isUserMessage && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={async () => {
                        try {
                          await deleteMessage(deleteModal._id, "everyone");

                          toast.success("Message deleted for everyone");
                        } catch (error) {
                          toast.error("Failed to delete message");
                        } finally {
                          setDeleteModal(null);
                        }
                      }}
                      className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 font-semibold transition-all duration-300 cursor-pointer ${isDark
                        ? "border-red-400/10 bg-gradient-to-r from-red-500/90 to-rose-600/90 text-white shadow-lg shadow-red-500/10 hover:border-red-300/20 hover:from-red-500 hover:to-rose-500 hover:shadow-xl hover:shadow-red-500/20"
                        : "border-red-500/10 bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20 hover:from-red-600 hover:to-rose-500 hover:shadow-xl hover:shadow-red-500/25"
                        }`}
                    >
                      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                      <span className="relative z-10 flex items-center justify-center gap-2.5">
                        <RiDeleteBin6Line size={17} />

                        <span>Delete for everyone</span>
                      </span>
                    </motion.button>
                  )}

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={async () => {
                      try {
                        await deleteMessage(deleteModal._id, "me");

                        toast.success("Message deleted for me");
                      } catch (error) {
                        toast.error("Failed to delete message");
                      } finally {
                        setDeleteModal(null);
                      }
                    }}
                    className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 font-semibold transition-all duration-300 cursor-pointer ${isDark
                      ? "border-white/[0.08] bg-gradient-to-r from-zinc-800/90 to-zinc-900/90 text-zinc-100 shadow-lg shadow-black/10 hover:border-emerald-400/20 hover:from-zinc-700/90 hover:to-zinc-800/90 hover:text-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5"
                      : "border-black/[0.06] bg-gradient-to-r from-zinc-100 to-white text-zinc-800 shadow-md shadow-black/5 hover:border-emerald-500/20 hover:from-emerald-50 hover:to-white hover:text-emerald-700 hover:shadow-lg"
                      }`}
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                    <span className="relative z-10 flex items-center justify-center gap-2.5">
                      <RiDeleteBin6Line
                        size={17}
                        className="transition-transform duration-300 group-hover:scale-110"
                      />

                      <span>Delete for me</span>
                    </span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setDeleteModal(null)}
                    className={`mt-1 w-full rounded-2xl border py-3 text-sm font-medium transition-all duration-300 cursor-pointer ${isDark
                      ? "border-transparent text-zinc-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"
                      : "border-transparent text-zinc-500 hover:border-black/[0.05] hover:bg-black/[0.03] hover:text-zinc-900"
                      }`}
                  >
                    Cancel
                  </motion.button>
                </div>

                <div
                  className={`mt-5 text-center text-[11px] ${isDark ? "text-zinc-600" : "text-zinc-400"
                    }`}
                >
                  Deleted messages cannot be recovered
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ReactionDetailsModal
          isOpen={showReactionDetails && validReactions.length > 0}
          onClose={() => setShowReactionDetails(false)}
          message={message}
          currentUser={effectiveUser}
          onRemoveReaction={(id) => {
            if (removeReaction) {
              removeReaction(id);
            } else {
              onReact(id, null);
            }
          }}
          onReact={onReact}
          isDark={isDark}
          anchorRef={reactionBadgeRef}
          bubbleRef={bubbleRef}
          isUserMessage={isUserMessage}
        />
      </div>
    </div>
  );
};

export default MessageBuble;
