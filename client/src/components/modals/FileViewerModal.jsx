import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoClose,
  IoStarOutline,
  IoStar,
  IoChevronBack,
  IoChevronForward,
} from "react-icons/io5";
import {
  BsThreeDotsVertical,
  BsReply,
  BsEmojiSmile,
  BsPin,
  BsPinFill,
} from "react-icons/bs";
import { MdOutlineFileDownload, MdZoomIn, MdZoomOut } from "react-icons/md";
import { BiMessageRoundedDetail } from "react-icons/bi";
import { RiShareForwardLine, RiDeleteBin6Line } from "react-icons/ri";
import { FaUser } from "react-icons/fa";
import { format } from "date-fns";
import { toast } from "react-toastify";
import useChatStore from "../../store/chatStore";
import useUserStore from "../../store/useUserStore";
import useLayoutStore from "../../store/layoutStore";
import ForwardModal from "./ForwardModal";
import PinDurationModal from "./PinDurationModal";

const FileViewerModal = ({
  isOpen,
  onClose,
  file,
  items = [],
  initialIndex = 0,
  theme = "dark",
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const moreMenuRef = useRef(null);
  const reactionPickerRef = useRef(null);

  const currentUser = useUserStore((s) => s.user);
  const currentUserId = String(currentUser?._id || currentUser?.id || "");

  const isMessageStarred = useChatStore((s) => s.isMessageStarred);
  const toggleStarMessage = useChatStore((s) => s.toggleStarMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const pinnedMessages = useChatStore((s) => s.pinnedMessages);
  const pinMessage = useChatStore((s) => s.pinMessage);
  const unpinMessage = useChatStore((s) => s.unpinMessage);
  const addReaction = useChatStore((s) => s.addReaction);
  const removeReaction = useChatStore((s) => s.removeReaction);
  const currentConversation = useChatStore((s) => s.currentConversation);
  const messages = useChatStore((s) => s.messages);
  const selectedContact = useLayoutStore((s) => s.selectedContact);

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const mediaList = useMemo(() => {
    if (Array.isArray(items) && items.length > 0) {
      return items;
    }
    if (file) {
      if (Array.isArray(file.items) && file.items.length > 0) {
        return file.items;
      }
      return [file];
    }
    return [];
  }, [items, file]);

  useEffect(() => {
    if (file && mediaList.length > 0) {
      const targetUrl = file.url || file.imageOrVideoUrl || file.docUrl;
      const foundIdx = mediaList.findIndex((m) => {
        const u = m.url || m.imageOrVideoUrl || m.docUrl;
        return (
          (u && targetUrl && u === targetUrl) ||
          (m._id && file._id && String(m._id) === String(file._id)) ||
          (m.messageId &&
            file.messageId &&
            String(m.messageId) === String(file.messageId))
        );
      });
      if (foundIdx !== -1) {
        setCurrentIndex(foundIdx);
        return;
      }
    }
    if (typeof initialIndex === "number") {
      setCurrentIndex(initialIndex);
    }
  }, [file, initialIndex, mediaList]);
  useEffect(() => {
    setZoomLevel(1);
    setShowMoreMenu(false);
    setShowReactionPicker(false);
    setShowDeleteModal(false);
    setShowPinModal(false);
  }, [currentIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showDeleteModal) {
          setShowDeleteModal(false);
        } else if (showPinModal) {
          setShowPinModal(false);
        } else if (showReactionPicker) {
          setShowReactionPicker(false);
        } else if (showMoreMenu) {
          setShowMoreMenu(false);
        } else {
          onClose?.();
        }
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        toggleZoom();
      } else if (e.key === "-") {
        setZoomLevel(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    currentIndex,
    mediaList.length,
    showDeleteModal,
    showPinModal,
    showReactionPicker,
    showMoreMenu,
  ]);

  useEffect(() => {
    if (!showMoreMenu && !showReactionPicker) return;
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
      if (
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(e.target)
      ) {
        setShowReactionPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreMenu, showReactionPicker]);

  const currentItem = mediaList[currentIndex] || mediaList[0] || file;
  const currentUrl =
    currentItem?.url ||
    currentItem?.imageOrVideoUrl ||
    currentItem?.docUrl ||
    currentItem?.fileUrl ||
    "";
  const currentName =
    currentItem?.name ||
    currentItem?.fileName ||
    currentItem?.docName ||
    "Media";
  const isVideo =
    currentItem?.type === "video" ||
    currentItem?.type === "video/mp4" ||
    currentItem?.mediaType === "video" ||
    /\.(mp4|webm|mov|mkv)($|\?)/i.test(currentUrl);

  const isPdf =
    currentItem?.type === "pdf" ||
    currentItem?.type === "application/pdf" ||
    currentName.toLowerCase().endsWith(".pdf") ||
    currentUrl.toLowerCase().includes(".pdf");

  const formattedDate = (() => {
    try {
      const d = currentItem?.createdAt
        ? new Date(currentItem.createdAt)
        : new Date();
      return format(d, "dd/MM/yyyy 'at' HH:mm");
    } catch (e) {
      return format(new Date(), "dd/MM/yyyy 'at' HH:mm");
    }
  })();

  const isOutgoing = (() => {
    if (currentItem?.isOutgoing !== undefined) {
      return Boolean(currentItem.isOutgoing);
    }
    if (currentItem?.isUserMessage !== undefined) {
      return Boolean(currentItem.isUserMessage);
    }
    const currentUserId = String(currentUser?._id || currentUser?.id || "");
    const senderId = String(
      currentItem?.sender?._id || currentItem?.sender?.id || currentItem?.sender || ""
    );
    return Boolean(
      currentUserId && senderId && currentUserId === senderId
    );
  })();

  const senderName = isOutgoing
    ? "You"
    : currentItem?.sender?.username ||
    currentItem?.senderName ||
    currentItem?.sender?.phoneNumber ||
    "Contact";

  const senderAvatar = isOutgoing
    ? currentUser?.profilePicture || currentUser?.profilePic
    : currentItem?.sender?.profilePicture ||
    currentItem?.sender?.profilePic ||
    currentItem?.avatar;

  const messageId =
    currentItem?.messageId || currentItem?._id || currentItem?.message?._id;
  const isStarred = messageId ? isMessageStarred(messageId) : false;

  const targetMsg = useMemo(() => {
    if (!messageId) return currentItem;
    return (
      (messages || []).find((m) => String(m._id) === String(messageId)) ||
      currentItem
    );
  }, [messages, messageId, currentItem]);

  const isPinned = useMemo(() => {
    if (!messageId) return false;
    const allPins = Object.values(pinnedMessages || {});
    return allPins.some((p) => {
      if (!p?.message) return false;
      const pMsgId = (
        p.message?._id?._id ||
        p.message?._id ||
        p.message
      )?.toString();
      const curId = String(messageId);
      return Boolean(
        pMsgId &&
          curId &&
          pMsgId === curId &&
          (!p.expiresAt || p.expiresAt > Date.now())
      );
    });
  }, [pinnedMessages, messageId]);

  const myReaction = useMemo(() => {
    const rList = targetMsg?.reactions || currentItem?.reactions || [];
    return rList.find(
      (r) => String(r.userId?._id || r.userId) === currentUserId && r.emoji
    );
  }, [targetMsg?.reactions, currentItem?.reactions, currentUserId]);

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (mediaList.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (mediaList.length <= 1) return;
    setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
  };

  const toggleZoom = () => {
    setZoomLevel((prev) => {
      if (prev === 1) return 1.75;
      if (prev === 1.75) return 2.5;
      return 1;
    });
  };

  const handleDownload = async () => {
    if (!currentUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(currentUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = currentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download completed");
    } catch (err) {
      let downloadUrl = currentUrl;
      if (currentUrl.includes("/upload/")) {
        downloadUrl = currentUrl.replace("/upload/", "/upload/fl_attachment/");
      }
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("download", currentName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(false);
    }
  };

  const handleStarToggle = () => {
    if (!messageId) return;
    toggleStarMessage(messageId, currentItem);
    toast.success(isStarred ? "Message unstarred" : "Message starred");
  };

  const handlePinToggle = () => {
    if (!messageId) return;
    if (isPinned) {
      const convId =
        currentConversation?._id ||
        targetMsg?.conversation?._id ||
        targetMsg?.conversation;
      const secConvId = selectedContact?._id;
      const recId = (
        selectedContact?._id ||
        (targetMsg?.sender?._id?.toString() === currentUserId
          ? targetMsg?.receiver?._id || targetMsg?.receiver
          : targetMsg?.sender?._id || targetMsg?.sender)
      )?.toString();

      unpinMessage(convId, secConvId, recId, true, currentUserId);
      toast.success("Message unpinned");
    } else {
      setShowPinModal(true);
    }
  };

  const handleConfirmPin = (duration) => {
    const convId =
      currentConversation?._id ||
      targetMsg?.conversation?._id ||
      targetMsg?.conversation;
    const secConvId = selectedContact?._id;
    const recId = (
      selectedContact?._id ||
      (targetMsg?.sender?._id?.toString() === currentUserId
        ? targetMsg?.receiver?._id || targetMsg?.receiver
        : targetMsg?.sender?._id || targetMsg?.sender)
    )?.toString();

    pinMessage(
      convId,
      targetMsg,
      duration,
      secConvId,
      recId,
      true,
      currentUserId
    );
    setShowPinModal(false);
    toast.success("You pinned a message");
  };

  const handleSelectReaction = async (emoji) => {
    if (!messageId) return;
    try {
      if (myReaction?.emoji === emoji) {
        await removeReaction(messageId);
        toast.success("Reaction removed");
      } else {
        await addReaction(messageId, emoji);
        toast.success(`Reacted with ${emoji}`);
      }
    } catch (e) {
      console.error("Reaction error:", e);
    } finally {
      setShowReactionPicker(false);
    }
  };

  const handleShowInChat = () => {
    if (messageId) {
      onClose?.();
      window.dispatchEvent(
        new CustomEvent("scroll-to-message", { detail: { messageId } })
      );
    }
  };

  const handleReply = () => {
    onClose?.();
    window.dispatchEvent(
      new CustomEvent("start-reply-message", {
        detail: { message: currentItem },
      })
    );
  };

  const handleCopy = async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast.success("Media URL copied");
      setShowMoreMenu(false);
    } catch (e) {
      toast.info("Failed to copy URL");
    }
  };

  const handleDeleteConfirm = async (deleteFor) => {
    if (!messageId) return;
    try {
      setShowDeleteModal(false);
      await deleteMessage(messageId, deleteFor, {
        deleteMedia: true,
      });
      toast.success(
        deleteFor === "everyone"
          ? "Media deleted for everyone"
          : "Media deleted for me"
      );
      if (mediaList.length <= 1) {
        onClose?.();
      } else {
        handleNext();
      }
    } catch (e) {
      toast.error("Failed to delete media");
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex flex-col bg-[#0b141a] text-[#d1d7db] select-none overflow-hidden">
        <div className="h-[60px] px-4 sm:px-6 flex items-center justify-between bg-[#111b21] border-b border-[#222e35] shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#533f28] flex items-center justify-center shrink-0 border border-white/5">
              {senderAvatar ? (
                <img
                  src={senderAvatar}
                  alt={senderName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUser size={18} className="text-[#d89758] mt-1" />
              )}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <span className="text-[14.5px] font-medium text-white truncate leading-snug">
                {senderName}
              </span>
              <span className="text-[12px] text-[#8696a0] leading-tight truncate">
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 text-[#aebac1]">
            <button
              type="button"
              onClick={toggleZoom}
              title={zoomLevel > 1 ? "Reset zoom" : "Zoom in"}
              className={`p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer ${zoomLevel > 1 ? "text-[#00a884]" : ""
                }`}
            >
              {zoomLevel > 1 ? <MdZoomOut size={20} /> : <MdZoomIn size={20} />}
            </button>
            <button
              type="button"
              onClick={handleShowInChat}
              title="Show in chat"
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <BiMessageRoundedDetail size={20} />
            </button>
            <button
              type="button"
              onClick={handleReply}
              title="Reply"
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <BsReply size={20} />
            </button>

            <button
              type="button"
              onClick={handleStarToggle}
              title={isStarred ? "Unstar" : "Star"}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${isStarred ? "text-[#00a884]" : "hover:text-white"
                }`}
            >
              {isStarred ? <IoStar size={19} /> : <IoStarOutline size={19} />}
            </button>

            <button
              type="button"
              onClick={handlePinToggle}
              title={isPinned ? "Unpin" : "Pin"}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${
                isPinned ? "text-[#00a884]" : "hover:text-white"
              }`}
            >
              {isPinned ? <BsPinFill size={18} /> : <BsPin size={18} />}
            </button>

            <div className="relative" ref={reactionPickerRef}>
              <button
                type="button"
                onClick={() => setShowReactionPicker((prev) => !prev)}
                title={myReaction ? `Reacted ${myReaction.emoji}` : "React"}
                className={`p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${
                  myReaction ? "text-[#00a884]" : "hover:text-white"
                }`}
              >
                {myReaction?.emoji ? (
                  <span className="text-[17px] leading-none select-none">
                    {myReaction.emoji}
                  </span>
                ) : (
                  <BsEmojiSmile size={18} />
                )}
              </button>

              <AnimatePresence>
                {showReactionPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 z-50 flex items-center gap-1.5 p-1.5 bg-[#202c33] border border-[#313d45] rounded-full shadow-2xl backdrop-blur-md"
                  >
                    {quickReactions.map((emoji) => {
                      const isSelected = myReaction?.emoji === emoji;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleSelectReaction(emoji)}
                          className={`w-9 h-9 flex items-center justify-center text-xl rounded-full transition-transform hover:scale-125 cursor-pointer ${
                            isSelected
                              ? "bg-white/20 scale-110 ring-1 ring-[#00a884]"
                              : "hover:bg-white/10"
                          }`}
                          title={
                            isSelected ? "Remove reaction" : `React with ${emoji}`
                          }
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setShowForward(true)}
              title="Forward"
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <RiShareForwardLine size={20} />
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              title="Download"
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <MdOutlineFileDownload size={21} />
            </button>

            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setShowMoreMenu((prev) => !prev)}
                title="Menu"
                className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <BsThreeDotsVertical size={18} />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-48 py-1.5 bg-[#233138] border border-[#313d45] rounded-xl shadow-2xl z-50 text-[14px] text-[#d1d7db]">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full text-left px-4 py-2 hover:bg-[#182229] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    Copy media link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#182229] text-[#ea4335] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <RiDeleteBin6Line size={16} />
                    Delete media
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <IoClose size={22} />
            </button>
          </div>
        </div>

        <div className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-6 overflow-hidden">
          {mediaList.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              title="Previous media"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white/70 hover:text-white flex items-center justify-center transition-all backdrop-blur-xs cursor-pointer shadow-lg"
            >
              <IoChevronBack size={24} />
            </button>
          )}

          {mediaList.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              title="Next media"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white/70 hover:text-white flex items-center justify-center transition-all backdrop-blur-xs cursor-pointer shadow-lg"
            >
              <IoChevronForward size={24} />
            </button>
          )}

          <div
            className="w-full h-full max-w-[85vw] max-h-[74vh] flex items-center justify-center overflow-hidden"
            onClick={toggleZoom}
          >
            {isVideo ? (
              <video
                key={currentUrl}
                src={currentUrl}
                controls
                autoPlay
                className="max-h-[74vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
              />
            ) : isPdf ? (
              <iframe
                key={currentUrl}
                src={currentUrl}
                title={currentName}
                className="w-full h-full max-h-[74vh] max-w-[85vw] rounded-lg shadow-2xl border-none bg-white"
              />
            ) : (
              <motion.img
                key={currentUrl}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{
                  opacity: 1,
                  scale: zoomLevel,
                }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                src={currentUrl}
                alt={currentName}
                className={`max-h-[74vh] max-w-[85vw] object-contain rounded-lg shadow-2xl transition-transform ${zoomLevel > 1 ? "cursor-zoom-out" : "cursor-zoom-in"
                  }`}
              />
            )}
          </div>
        </div>

        {mediaList.length > 0 && (
          <div className="h-[72px] bg-[#111b21]/80 backdrop-blur-sm border-t border-[#222e35] px-4 flex items-center justify-center shrink-0 z-20">
            <div className="flex items-center gap-2.5 overflow-x-auto py-1 max-w-full no-scrollbar">
              {mediaList.map((item, idx) => {
                const thumbUrl =
                  item.url ||
                  item.imageOrVideoUrl ||
                  item.docUrl ||
                  item.fileUrl;
                const isActive = idx === currentIndex;
                const isItemVideo =
                  item.type === "video" ||
                  item.mediaType === "video" ||
                  /\.(mp4|webm)($|\?)/i.test(thumbUrl || "");

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative w-12 h-12 rounded-sm overflow-hidden shrink-0 transition-all cursor-pointer ${isActive
                        ? "border-[2.5px] border-[#00a884] ring-1 ring-[#00a884]/40 scale-105 z-10 opacity-100"
                        : "opacity-60 hover:opacity-100 border border-white/10"
                      }`}
                  >
                    {isItemVideo ? (
                      <video
                        src={thumbUrl}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <img
                        src={thumbUrl}
                        alt=""
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showForward && currentItem && (
          <ForwardModal
            isOpen={showForward}
            onClose={() => setShowForward(false)}
            messages={[currentItem]}
            theme={theme}
          />
        )}

        {showPinModal && (
          <PinDurationModal
            isOpen={showPinModal}
            onClose={() => setShowPinModal(false)}
            onPin={handleConfirmPin}
            message={targetMsg}
            theme={theme}
          />
        )}

        <AnimatePresence>
          {showDeleteModal && (
            <div
              className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 16 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm rounded-[24px] border border-white/10 bg-[#1f2c34] p-6 shadow-2xl text-center select-none"
              >
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close"
                >
                  <IoClose size={18} />
                </button>

                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/10">
                  <RiDeleteBin6Line size={26} />
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight">
                  Delete media?
                </h3>
                <p className="mt-2 text-sm text-[#8696a0] leading-relaxed">
                  Choose how you want to delete this media message. This action cannot be undone.
                </p>

                <div className="mt-6 flex flex-col gap-2.5">
                  {isOutgoing && (
                    <button
                      type="button"
                      onClick={() => handleDeleteConfirm("everyone")}
                      className="w-full py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20 hover:from-red-600 hover:to-rose-500 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <RiDeleteBin6Line size={17} />
                      <span>Delete for everyone</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteConfirm("me")}
                    className="w-full py-3 px-4 rounded-xl font-semibold bg-[#2a3942] hover:bg-[#32424b] text-[#e9edef] border border-white/5 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RiDeleteBin6Line size={17} />
                    <span>Delete for me</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full py-2.5 text-sm font-medium text-[#8696a0] hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );

  if (!isOpen || mediaList.length === 0) return null;

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

export default FileViewerModal;
