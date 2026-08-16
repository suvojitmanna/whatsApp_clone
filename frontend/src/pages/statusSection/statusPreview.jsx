import React, { useEffect, useState, useRef } from "react";
import { animate, AnimatePresence, motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaEye,
  FaPause,
  FaPlay,
  FaTimes,
  FaTrash,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";
import { BsEmojiSmile } from "react-icons/bs";
import { VscFileSubmodule } from "react-icons/vsc";
import { MdSend } from "react-icons/md";
import useOutsideClick from "../../hook/useOutsideClick";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../../store/chatStore";
import { FiHeart } from "react-icons/fi";

const StatusPreview = ({
  contact,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onDelete,
  theme,
  currentUser,
  loading,
}) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [showViewers, setShowViewers] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQuickReactions, setShowQuickReactions] = useState(false);

  const videoRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const replyBoxRef = useRef(null);
  const viewersRef = useRef(null);

  const currentStatus = contact?.statuses?.[currentIndex];
  const isOwner = contact?.id === currentUser?._id;
  const sendMessage = useChatStore((state) => state.sendMessage);

  useEffect(() => {
    setProgress(0);
    setIsPaused(false);
    setShowViewers(false);
  }, [currentIndex]);

  const advancingRef = useRef(false);

  useEffect(() => {
    if (isPaused || showViewers) return;

    if (currentStatus?.contentType === "video") {
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => Math.min(prev + 2, 100));
    }, 100);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, showViewers, currentStatus]);

  useEffect(() => {
    if (
      !isPaused &&
      !showViewers &&
      currentStatus?.contentType !== "video" &&
      progress >= 100 &&
      !advancingRef.current
    ) {
      advancingRef.current = true;
      onNext();
    }
  }, [progress, isPaused, showViewers, currentStatus, onNext]);

  useEffect(() => {
    advancingRef.current = false;
  }, [currentIndex]);

  useEffect(() => {
    if (showViewers) {
      setIsPaused(true);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [showViewers]);

  const handleViewersToggle = () => setShowViewers(!showViewers);

  const handleDeleteStatus = async () => {
    if (!currentStatus?.id || !onDelete) return;

    try {
      await onDelete(currentStatus.id);
    } catch (error) {
      console.error("Failed to delete status:", error);
      return;
    }

    if (contact.statuses.length <= 1) {
      onClose();
    } else if (currentIndex > 0) {
      onPrev();
    } else {
      onNext();
    }
  };

  useOutsideClick(emojiPickerRef, () => {
    if (showEmojiPicker) setShowEmojiPicker(false);
  });

  useOutsideClick(replyBoxRef, () => {
    setShowQuickReactions(false);
  });
  useOutsideClick(viewersRef, () => {
    if (showViewers) {
      setShowViewers(false);
    }
  });
  const pauseStatus = () => {
    setIsPaused(true);

    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  };

  if (!currentStatus) return null;

  const handleSendReply = async (replyText) => {
    const text = replyText?.trim();
    if (!text) return;
    if (!currentUser?._id || !contact?.id) return;
    if (isOwner) return;

    try {
      const formData = new FormData();
      formData.append("senderId", currentUser._id);
      formData.append("receiverId", contact.id);
      formData.append("content", text);
      formData.append("messageStatus", "send");
      formData.append("statusId", currentStatus.id);
      await sendMessage(formData);
      setMessage("");
      setShowEmojiPicker(false);
      setShowQuickReactions(false);
    } catch (error) {
      console.error("Status reply failed:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 h-full w-full z-50 flex items-center justify-center backdrop-blur-sm ${
        theme === "dark" ? "bg-[#0b141a]/95" : "bg-black/80"
      }`}
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-[500px] mx-auto flex flex-col justify-center items-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Status Container */}
        <div className="w-full h-full bg-[#e9edef] dark:bg-[#111b21] relative overflow-hidden transition-colors duration-300 shadow-2xl">
          {/* Top Gradient & Progress Bars */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent pt-2 sm:pt-3 pb-6 sm:pb-8 px-1.5 sm:px-2">
            <div className="flex justify-between gap-1 mb-2 sm:mb-3 px-1.5 sm:px-2">
              {contact?.statuses.map((_, index) => (
                <div
                  className="h-[3px] bg-white/30 flex-1 rounded-full overflow-hidden backdrop-blur-sm"
                  key={index}
                >
                  <div
                    className="h-full bg-white rounded-full"
                    style={{
                      width:
                        index < currentIndex
                          ? "100%"
                          : index === currentIndex
                            ? `${progress}%`
                            : "0%",
                      transition:
                        currentStatus?.contentType === "video"
                          ? "none"
                          : "width 100ms linear",
                    }}
                  ></div>
                </div>
              ))}
            </div>

            {/* Header Info */}
            <div className="flex items-center justify-between px-1.5 sm:px-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={onClose}
                  className="text-white md:hidden p-1 mr-0.5 sm:mr-1 shrink-0"
                >
                  <FaChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 drop-shadow-md" />
                </button>
                <img
                  src={contact?.avatar}
                  alt={contact?.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-white/20 cursor-pointer shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <p className="text-white font-semibold text-[13px] sm:text-[15px] leading-tight drop-shadow-md cursor-pointer truncate">
                    {contact?.name}
                  </p>
                  <p className="text-white/80 text-[11px] sm:text-[13px] mt-0.5 drop-shadow-md">
                    {formatTimestamp(currentStatus.timeStamp)}
                  </p>
                </div>
              </div>

              {/* Top Right Controls */}
              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStatus();
                    }}
                    className="group relative flex items-center justify-center p-2 sm:p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 hover:scale-105 active:scale-95"
                    title="Delete Status"
                  >
                    <FaTrash className="h-3.5 w-3.5 sm:h-4 sm:w-4 drop-shadow-md transition-transform" />
                  </button>
                )}

                {currentStatus?.contentType === "video" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const video = videoRef.current;
                      if (!video) return;
                      video.muted = !video.muted;
                      setIsMuted(video.muted);
                    }}
                    className="flex items-center justify-center p-2 sm:p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:scale-105 active:scale-95"
                  >
                    {isMuted ? (
                      <FaVolumeMute className="h-3.5 w-3.5 sm:h-4 sm:w-4 drop-shadow-md" />
                    ) : (
                      <FaVolumeUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 drop-shadow-md" />
                    )}
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentStatus?.contentType === "video") {
                      const video = videoRef.current;
                      if (!video) return;
                      if (video.paused) {
                        video.play();
                        setIsPaused(false);
                      } else {
                        video.pause();
                        setIsPaused(true);
                      }
                    } else {
                      setIsPaused(!isPaused);
                    }
                  }}
                  className="flex items-center justify-center p-2 sm:p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:scale-105 active:scale-95"
                >
                  {isPaused ? (
                    <FaPlay className="h-3.5 w-3.5 sm:h-4 sm:w-4 drop-shadow-md translate-x-[1px]" />
                  ) : (
                    <FaPause className="h-3.5 w-3.5 sm:h-4 sm:w-4 drop-shadow-md" />
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="hidden md:flex items-center justify-center p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:scale-105 active:scale-95"
                >
                  <FaTimes className="h-[18px] w-[18px] drop-shadow-md" />
                </button>
              </div>
            </div>
          </div>

          {/* Content Display */}
          <div
            className="w-full h-full flex items-center justify-center bg-black cursor-pointer"
            onClick={() => setIsPaused(!isPaused)}
          >
            {currentStatus.contentType === "text" ? (
              <div
                className="w-full h-full flex items-center justify-center text-white p-4 sm:p-6 md:p-8"
                style={{
                  backgroundColor: currentStatus.bgColor || "#54656f",
                }}
              >
                <p
                  className="text-xl sm:text-2xl md:text-3xl font-medium px-2 sm:px-4 leading-relaxed text-center break-words"
                  style={{
                    fontFamily:
                      "Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif",
                  }}
                >
                  {currentStatus.content}
                </p>
              </div>
            ) : currentStatus.contentType === "image" ? (
              <img
                src={currentStatus.media}
                alt="status"
                className="w-full h-full object-contain bg-black"
              />
            ) : currentStatus.contentType === "video" ? (
              <video
                ref={videoRef}
                src={currentStatus.media}
                className="w-full h-full object-contain bg-black"
                autoPlay
                muted={isMuted}
                onPlay={() => setIsPaused(false)}
                onPause={() => setIsPaused(true)}
                onEnded={onNext}
              />
            ) : null}
          </div>

          {/* Desktop Navigation Arrows */}
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="flex absolute top-1/2 left-1 sm:left-0 p-1.5 sm:p-3 rounded-full transition-all duration-300 -translate-y-1/2 z-30 bg-white/30 backdrop-blur-md border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/50 text-white hover:text-gray-900"
            >
              <FaChevronLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </button>
          )}
          {currentIndex < contact.statuses.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="flex absolute top-1/2 right-1 sm:right-0 p-1.5 sm:p-3 rounded-full transition-all duration-300 -translate-y-1/2 z-30 bg-white/30 backdrop-blur-md border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/50 text-white hover:text-gray-900"
            >
              <FaChevronRight className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </button>
          )}

          {/* Bottom Actions */}
          {isOwner ? (
            <div className="absolute bottom-1 left-0 right-0 max-w-sm mx-1 mb-2 p-2 sm:p-4 flex flex-col">
              {!showViewers && (
                <div className="relative flex">
                  <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-white/90 w-fit">
                    <FaEye className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-md" />
                    <span className="text-[13px] sm:text-[15px] font-semibold drop-shadow-md">
                      {currentStatus?.viewers?.length || 0}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleViewersToggle();
                    }}
                    className="fixed left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white drop-shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer"
                  >
                    <FaChevronDown className="h-4 w-4 sm:h-5 sm:w-5 animate-bounce drop-shadow-md" />
                  </button>
                </div>
              )}

              <AnimatePresence>
                {showViewers && (
                  <motion.div
                    ref={viewersRef}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className={`w-[94vw] max-w-[460px] rounded-2xl mt-4 overflow-hidden backdrop-blur-md border border-white/50 dark:border-white/10  z-30 shadow-xl shadow-[#363738]`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewersToggle();
                    }}
                  >
                    <div className="p-3 sm:p-4 border-b border-white/30 dark:border-white/10 bg-transparent cursor-pointer hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between px-2">
                        <div
                          className={` font-medium text-[14px] sm:text-[16px] ite text-gray-900 dark:text-white`}
                        >
                          Viewers
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium flex gap-2 items-center text-sm sm:text-base">
                          <FiHeart className="text-green-600 fill-green-600" />
                          <FaEye className="w-4 h-4 sm:w-5 sm:h-5" />
                          {currentStatus?.viewers?.length || 0}
                        </span>
                      </div>
                    </div>
                    <div className="max-h-[200px] sm:max-h-[250px] overflow-y-auto bg-transparent p-1.5 sm:p-2">
                      {loading ? (
                        <p className="text-gray-800 dark:text-gray-300 text-center py-6 text-sm font-medium">
                          Loading Viewers...
                        </p>
                      ) : currentStatus?.viewers?.length > 0 ? (
                        currentStatus.viewers.map((viewer) => (
                          <div
                            key={viewer?.user?._id || viewer?._id}
                            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-white/40 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                          >
                            <img
                              src={viewer?.user?.profilePicture}
                              alt={viewer?.user?.username || "Viewer"}
                              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border border-white/40 shadow-sm shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-gray-900 dark:text-white font-medium text-[13px] sm:text-[15px] truncate">
                                {viewer?.user?.username || "Unknown"}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-800 dark:text-gray-300 text-center py-6 text-sm">
                          No Viewers Yet
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-30 w-full px-3 sm:px-4 flex flex-col items-center pb-2">
              <AnimatePresence>
                {showQuickReactions && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className=""
                  >
                    <p className="capitalize text-center justify-center items-center sm:mb-0 mb-3 text-sm sm:text-base text-white/90">
                      click to send
                    </p>
                    <div className="flex flex-col items-center backdrop-blur-md sm:mb-2 mb-4 sm:px-6 sm:py-4">
                      <div className="flex items-center gap-1 sm:gap-4 flex-wrap justify-center max-w-full">
                        {["😂", "😍", "😮", "😢", "🙏", "👏", "🎉", "💯"].map(
                          (emoji, index) => (
                            <button
                              key={index}
                              type="button"
                              className="text-2xl sm:text-3xl hover:scale-125 transition-transform origin-bottom cursor-pointer drop-shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendReply(emoji);
                              }}
                            >
                              {emoji}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* WhatsApp Authentic Reply Bar */}
              <div
                ref={replyBoxRef}
                className="flex items-center gap-2 sm:gap-3 w-full max-w-[450px] bg-white dark:bg-[#202c33] rounded-full px-3 sm:px-4 py-2 sm:py-2.5 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Left Icons */}
                <div className="flex items-center text-[#54656f] dark:text-[#aebac1] relative shrink-0">
                  <button
                    type="button"
                    className="focus:outline-none hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <BsEmojiSmile className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                  </button>

                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute bottom-12 left-0 z-50 shadow-2xl rounded-lg overflow-hidden scale-90 sm:scale-100 origin-bottom-left max-w-[90vw]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EmojiPicker
                        theme={theme === "dark" ? "dark" : "light"}
                        onEmojiClick={(emojiObject) => {
                          if (emojiObject?.emoji) {
                            setMessage((prev) => prev + emojiObject.emoji);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={message}
                  onFocus={() => setShowQuickReactions(true)}
                  onClick={() => {
                    setShowQuickReactions(true);
                    pauseStatus();
                  }}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply(message);
                    }
                  }}
                  placeholder="Reply Type..."
                  className="flex-1 min-w-0 bg-transparent outline-none text-[14px] sm:text-[15px] text-[#111b21] dark:text-[#d1d7db] placeholder:text-[#8696a0] px-1"
                />

                {/* Send/Attachment Icon */}
                <div className="flex items-center shrink-0">
                  {!message.trim() ? (
                    <button
                      type="button"
                      className="p-1 text-[#54656f] dark:text-[#aebac1] hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <VscFileSubmodule className="h-[18px] w-[18px] sm:h-5 sm:w-5 transform rotate-[-45deg]" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendReply(message)}
                      className="p-1 text-[#00a884] transition-colors"
                    >
                      <MdSend className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatusPreview;
