import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdClose, MdLockOutline, MdTimer, MdSecurity } from "react-icons/md";
import { useChatStore } from "../../store/chatStore";

export const ViewOnceRevealModal = ({
  isOpen,
  onClose,
  message,
  onOpened,
}) => {
  const [timeLeft, setTimeLeft] = useState(5);
  const [isExpiring, setIsExpiring] = useState(false);
  const timerRef = useRef(null);
  const hasTriggeredOpenRef = useRef(false);

  const openViewOnceMessage = useChatStore((state) => state.openViewOnceMessage);

  useEffect(() => {
    if (isOpen && message?._id && !hasTriggeredOpenRef.current) {
      hasTriggeredOpenRef.current = true;
      openViewOnceMessage?.(message._id)
        ?.catch((err) => console.error("Error marking view once opened:", err));
      onOpened?.(message._id);
    }
  }, [isOpen, message?._id]);

  const handleFinishAndExpire = () => {
    setIsExpiring(true);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(5);
      setIsExpiring(false);
      return;
    }

    setTimeLeft(5);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinishAndExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  if (!isOpen || !message) return null;

  const isText = message.contentType === "text" || (!message.contentType && message.content);
  const isImage = message.contentType === "image" || (message.imageOrVideoUrl && !message.imageOrVideoUrl.match(/\.(mp4|webm|mov|mkv)($|\?)/i) && message.contentType !== "video");
  const isVideo = message.contentType === "video" || (message.imageOrVideoUrl && message.imageOrVideoUrl.match(/\.(mp4|webm|mov|mkv)($|\?)/i));
  const isAudio = message.contentType === "audio";

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[999999] flex flex-col items-center justify-between bg-black/95 backdrop-blur-md select-none p-4 sm:p-6"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
      >
        <div className="w-full max-w-xl mx-auto flex flex-col gap-3">
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
            />
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                1
              </span>
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <span>View Once</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-emerald-400 font-normal">
                    Self-destructing
                  </span>
                </h4>
                <p className="text-[11px] text-gray-400">
                  {message.sender?.username || "Contact"} • Screenshot protected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-mono font-bold">
                <MdTimer size={14} />
                <span>{timeLeft}s</span>
              </div>

              <button
                type="button"
                onClick={handleFinishAndExpire}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 transition-colors cursor-pointer"
                title="Close and expire"
              >
                <MdClose size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-2xl flex items-center justify-center my-4 overflow-hidden">
          {isText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#1f2c34] to-[#121b22] border border-white/15 text-white shadow-2xl relative overflow-hidden"
            >
              <MdSecurity className="absolute -right-8 -bottom-8 text-white/[0.03] text-9xl pointer-events-none" />

              <div className="flex items-center gap-2.5 text-emerald-400 mb-4 pb-3 border-b border-white/10">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <MdLockOutline size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Confidential Message
                  </span>
                  <p className="text-[11px] text-gray-400">
                    Will be permanently deleted when closed
                  </p>
                </div>
              </div>

              <div className="text-base sm:text-lg leading-relaxed text-[#e9edef] font-medium break-words py-2 select-none">
                {message.content}
              </div>

              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                <span>Sender: {message.sender?.username || "Private"}</span>
                <span className="text-emerald-400 font-mono">Disappears in {timeLeft}s</span>
              </div>
            </motion.div>
          )}

          {isImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-full max-h-[75vh] flex items-center justify-center rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            >
              <img
                src={message.imageOrVideoUrl}
                alt="View Once Photo"
                className="max-w-full max-h-[75vh] object-contain pointer-events-none select-none"
                draggable={false}
              />
            </motion.div>
          )}

          {isVideo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-full max-h-[75vh] flex items-center justify-center rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            >
              <video
                src={message.imageOrVideoUrl}
                autoPlay
                controls
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                className="max-w-full max-h-[75vh] rounded-xl object-contain select-none"
              />
            </motion.div>
          )}

          {isAudio && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#1f2c34] border border-white/15 text-white shadow-2xl flex flex-col gap-4 text-center items-center"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl">
                🎙️
              </div>
              <div>
                <h4 className="font-semibold text-base">View-Once Voice Note</h4>
                <p className="text-xs text-gray-400">Play once before it expires</p>
              </div>
              <audio
                src={message.imageOrVideoUrl}
                controls
                autoPlay
                className="w-full mt-2"
              />
            </motion.div>
          )}
        </div>

        <div className="text-center text-xs text-gray-500 select-none pb-2">
          🔒 For added privacy, this message will disappear once opened.
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ViewOnceRevealModal;
