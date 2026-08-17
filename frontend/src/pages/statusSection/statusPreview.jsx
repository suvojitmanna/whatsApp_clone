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
import { BiSolidMessageRoundedDetail } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import useLayoutStore from "../../store/layoutStore";

const StatusPreview = ({
  contact,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onDelete,
  onReact,
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
  const [likeBusy, setLikeBusy] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);

  const videoRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const replyBoxRef = useRef(null);
  const viewersRef = useRef(null);
  const containerRef = useRef(null);
  const likeBtnRef = useRef(null);
  const ownerBadgeRef = useRef(null);
  const prevLikeCountRef = useRef(0);
  const hasMountedLikeEffectRef = useRef(false);

  const navigate = useNavigate();
  const { setSelectedContact } = useLayoutStore();

  const isDark = theme === "dark";
  const currentStatus = contact?.statuses?.[currentIndex];
  const isOwner = String(contact?.id) === String(currentUser?._id);

  const sendMessage = useChatStore((state) => state.sendMessage);

  useEffect(() => {
    setProgress(0);
    setIsPaused(false);
    setShowViewers(false);
    hasMountedLikeEffectRef.current = false;
  }, [currentIndex]);

  const advancingRef = useRef(false);

  useEffect(() => {
    if (currentStatus?.contentType !== "video" || isPaused || showViewers) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;
    const updateProgress = () => {
      if (video.duration && !isNaN(video.duration)) {
        setProgress((video.currentTime / video.duration) * 100);
      }
      if (!video.paused && !video.ended) {
        requestId = requestAnimationFrame(updateProgress);
      }
    };

    let requestId = requestAnimationFrame(updateProgress);
    return () => {
      cancelAnimationFrame(requestId);
    };
  }, [currentIndex, currentStatus, isPaused, showViewers]);

  useEffect(() => {
    if (currentStatus?.contentType !== "video") return;
    const video = videoRef.current;
    if (!video) return;
    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("timeupdate", updateProgress);
    return () => {
      video.removeEventListener("timeupdate", updateProgress);
    };
  }, [currentIndex, currentStatus]);

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

  const handleMessageViewer = (viewer) => {
    const user = viewer?.user;

    if (!user?._id) {
      console.log("❌ No viewer user:", viewer);
      return;
    }

    const selectedUser = {
      ...user,
      id: user._id,
    };
    setSelectedContact(selectedUser);
    setShowViewers(false);
    onClose();
  };

  const currentReaction = currentStatus?.reactions?.find(
    (reaction) =>
      String(reaction.user?._id || reaction.user) === String(currentUser?._id),
  );

  const isLiked = currentReaction?.like === true;
  const likeCount =
    currentStatus?.reactions?.filter((reaction) => reaction.like === true)
      .length || 0;

  const spawnHeartBurst = (originX, originY) => {
    const burst = Array.from({ length: 10 }).map((_, i) => ({
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      x: originX + (Math.random() * 40 - 20),
      y: originY,
      delay: i * 0.12,
      drift: Math.random() * 36 - 18,
      size: 16 + Math.random() * 10,
    }));
    setFloatingHearts((prev) => [...prev, ...burst]);
  };

  const removeFloatingHeart = (id) => {
    setFloatingHearts((prev) => prev.filter((heart) => heart.id !== id));
  };

  useEffect(() => {
    if (
      likeCount > prevLikeCountRef.current &&
      ownerBadgeRef.current &&
      containerRef.current
    ) {
      const badgeRect = ownerBadgeRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const originX = badgeRect.left + badgeRect.width / 2 - containerRect.left;
      const originY = badgeRect.top - containerRect.top;

      spawnHeartBurst(originX, originY);
    }

    if (!hasMountedLikeEffectRef.current) {
      hasMountedLikeEffectRef.current = true;
      prevLikeCountRef.current = likeCount;
      return;
    }

    if (
      likeCount > prevLikeCountRef.current &&
      ownerBadgeRef.current &&
      containerRef.current
    ) {
      const badgeRect = ownerBadgeRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const originX = badgeRect.left + badgeRect.width / 2 - containerRect.left;
      const originY = badgeRect.top - containerRect.top;
      spawnHeartBurst(originX, originY);
    }

    prevLikeCountRef.current = likeCount;
  }, [likeCount, isOwner]);

  const handleToggleLike = async (e) => {
    e.stopPropagation();
    if (isOwner || !currentStatus?.id || likeBusy) return;
    const wasLiked = isLiked;

    if (!wasLiked && likeBtnRef.current && containerRef.current) {
      const btnRect = likeBtnRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const originX = btnRect.left + btnRect.width / 2 - containerRect.left;
      const originY = btnRect.top - containerRect.top;
      spawnHeartBurst(originX, originY);
    }

    setLikeBusy(true);
    try {
      if (onReact) {
        await onReact(currentStatus.id, !wasLiked);
      }
    } catch (error) {
      console.error("Status like failed:", error);
    } finally {
      setLikeBusy(false);
    }
  };

  const handleContentDoubleClick = (e) => {
    if (isOwner) return;
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      spawnHeartBurst(
        e.clientX - containerRect.left,
        e.clientY - containerRect.top,
      );
    }

    if (!isLiked) {
      handleToggleLikeSilently();
    }
  };

  const handleToggleLikeSilently = async () => {
    if (isOwner || !currentStatus?.id || likeBusy || isLiked) return;
    setLikeBusy(true);
    try {
      if (onReact) {
        await onReact(currentStatus.id, true);
      }
    } catch (error) {
      console.error("Status like failed:", error);
    } finally {
      setLikeBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 h-full w-full z-50 flex items-center justify-center backdrop-blur-sm ${
        isDark ? "bg-[#0b141a]/95" : "bg-black/80"
      }`}
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-[500px] mx-auto flex flex-col justify-center items-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={containerRef}
          className="w-full h-full bg-[#e9edef] dark:bg-[#111b21] relative overflow-hidden transition-colors duration-300 shadow-2xl"
        >
          <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
            <AnimatePresence>
              {floatingHearts.map((heart) => (
                <motion.div
                  key={heart.id}
                  initial={{
                    opacity: 0,
                    x: isOwner ? heart.x - 120 : heart.x + 120,
                    y: heart.y + 300,
                    scale: 0.5,
                  }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    x: isOwner ? heart.x + 120 : heart.x - 120,
                    y: heart.y - 300,
                    scale: [0.5, 1.15, 1, 0.9],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.4,
                    delay: heart.delay,
                    ease: "easeOut",
                  }}
                  onAnimationComplete={() => removeFloatingHeart(heart.id)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                >
                  <FiHeart
                    className="text-green-500 fill-green-500 drop-shadow-lg"
                    style={{
                      width: heart.size,
                      height: heart.size,
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

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
                    className="group relative flex items-center justify-center p-2 sm:p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-green-500/20 hover:border-green-500/30 hover:text-green-400 hover:scale-105 active:scale-95"
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
            onDoubleClick={handleContentDoubleClick}
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

          {/* Navigation Arrows */}
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
                <div className="relative flex items-center gap-2">
                  <div
                    ref={ownerBadgeRef}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-white/90 w-fit"
                  >
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
                  {likeCount > 0 && (
                    <div className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-white/90 w-fit">
                      <FiHeart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 fill-green-500 drop-shadow-md" />
                      <span className="text-[13px] sm:text-[15px] font-semibold drop-shadow-md">
                        {likeCount}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <AnimatePresence>
                {showViewers && (
                  <motion.div
                    ref={viewersRef}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="w-[94vw] max-w-[460px] rounded-2xl mt-4 overflow-hidden backdrop-blur-md bg-white/90 dark:bg-[#111b21]/95 border border-white/50 dark:border-white/10 z-30 shadow-xl shadow-black/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewersToggle();
                    }}
                  >
                    <div className="p-3 sm:p-4 border-b border-black/10 dark:border-white/10 bg-transparent cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between px-2">
                        <div className="font-medium text-[14px] sm:text-[16px] text-gray-900 dark:text-white">
                          Viewers
                        </div>
                        <div className="flex items-center gap-3">
                          {likeCount > 0 && (
                            <span className="text-gray-900 dark:text-white font-medium flex gap-1.5 items-center text-sm sm:text-base">
                              <FiHeart className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-green-500 fill-green-500" />
                              {likeCount}
                            </span>
                          )}
                          <span className="text-gray-900 dark:text-white font-medium flex gap-2 items-center text-sm sm:text-base">
                            <FaEye className="w-4 h-4 sm:w-5 sm:h-5" />
                            {currentStatus?.viewers?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="max-h-[200px] sm:max-h-[250px] overflow-y-auto bg-transparent p-1.5 sm:p-2">
                      {loading ? (
                        <p className="text-gray-800 dark:text-gray-300 text-center py-6 text-sm font-medium">
                          Loading Viewers...
                        </p>
                      ) : currentStatus?.viewers?.length > 0 ? (
                        currentStatus.viewers.map((viewer) => {
                          const viewerLiked = currentStatus?.reactions?.some(
                            (r) =>
                              String(r.user?._id || r.user) ===
                                String(viewer?.user?._id || viewer?._id) &&
                              r.like === true,
                          );
                          return (
                            <div
                              key={viewer?.user?._id || viewer?._id}
                              className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <img
                                  src={viewer?.user?.profilePicture}
                                  alt={viewer?.user?.username || "Viewer"}
                                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border border-black/10 dark:border-white/40 shadow-sm shrink-0"
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-gray-900 dark:text-white font-medium text-[13px] sm:text-[15px] truncate">
                                    {viewer?.user?.username || "Unknown"}
                                  </span>

                                  {viewer?.viewedAt && (
                                    <span className="text-gray-500 dark:text-[#8696a0] text-[11px] sm:text-[13px] mt-0.5 truncate">
                                      {formatTimestamp(viewer.viewedAt)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-row items-center gap-2">
                                {/* Message */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMessageViewer(viewer);
                                  }}
                                  className="
      w-9 h-9
      rounded-full
      flex items-center justify-center
      bg-green-500
      text-white
      shadow-sm
      transition-all duration-200
      hover:bg-green-600
      hover:scale-105
      active:scale-90
    "
                                  aria-label={`Message ${viewer?.user?.username || "viewer"}`}
                                >
                                  <BiSolidMessageRoundedDetail size={20} />
                                </button>

                                {/* Like */}
                                {viewerLiked && (
                                  <div
                                    className="
        w-9 h-9
        rounded-full
        flex items-center justify-center
        bg-green-500/10
      "
                                    aria-label="Liked"
                                  >
                                    <FiHeart
                                      className="
          w-[20px] h-[20px]
          text-green-500
          fill-green-500
        "
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
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

              <div className="flex items-center gap-2 sm:gap-3 w-full max-w-[450px]">
                <div
                  ref={replyBoxRef}
                  className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 bg-white dark:bg-[#202c33] rounded-full px-3 sm:px-4 py-2 sm:py-2.5 shadow-lg"
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
                          theme={isDark ? "dark" : "light"}
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

                <button
                  ref={likeBtnRef}
                  type="button"
                  onClick={handleToggleLike}
                  disabled={likeBusy}
                  aria-pressed={isLiked}
                  aria-label={isLiked ? "Unlike status" : "Like status"}
                  className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full shrink-0 shadow-lg transition-all duration-200 active:scale-90 cursor-pointer ${
                    isLiked
                      ? "bg-green-50 dark:bg-green-500/15"
                      : "bg-white dark:bg-[#202c33]"
                  } ${likeBusy ? "opacity-60" : ""}`}
                >
                  <FiHeart
                    className={`h-5 w-5 sm:h-[22px] sm:w-[22px] transition-transform duration-200 ${
                      isLiked
                        ? "text-green-500 fill-green-500 scale-110"
                        : "text-[#54656f] dark:text-[#aebac1]"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatusPreview;
