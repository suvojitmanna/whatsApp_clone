import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiSparkles } from "react-icons/hi2";
import { RxCross2 } from "react-icons/rx";
import { IoSend } from "react-icons/io5";
import { MdEdit } from "react-icons/md";
import axiosInstance from "../../../services/url.services.js";

export const SmartRepliesBar = ({
  lastMessage,
  currentUserId,
  onSendDirect,
  onInsert,
  theme = "dark",
}) => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dismissedMsgId, setDismissedMsgId] = useState(null);
  const cacheRef = useRef(new Map());

  const isDark = theme === "dark";

  const msgSenderId = (
    lastMessage?.sender?._id ||
    lastMessage?.sender?.id ||
    lastMessage?.sender
  )?.toString();
  const currentId = currentUserId?.toString();

  const isFromOther =
    lastMessage &&
    msgSenderId &&
    currentId &&
    msgSenderId !== currentId;

  const isEligible = Boolean(
    isFromOther &&
    !lastMessage.isSystemMessage &&
    !lastMessage.isViewOnce &&
    !lastMessage.deletedForEveryone &&
    lastMessage.contentType !== "call" &&
    lastMessage.content &&
    typeof lastMessage.content === "string" &&
    lastMessage.content.trim().length > 0 &&
    lastMessage._id !== dismissedMsgId,
  );

  useEffect(() => {
    if (!isEligible) {
      setReplies([]);
      setLoading(false);
      return;
    }

    const msgId = (lastMessage._id || lastMessage.id)?.toString();
    const text = lastMessage.content.trim();

    if (cacheRef.current.has(msgId)) {
      setReplies(cacheRef.current.get(msgId));
      return;
    }

    let isMounted = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await axiosInstance.post("/chat/smart-replies", {
          messageText: text,
        });
        if (!isMounted) return;

        const fetchedReplies = res.data?.data?.replies || [];
        if (Array.isArray(fetchedReplies) && fetchedReplies.length > 0) {
          cacheRef.current.set(msgId, fetchedReplies);
          setReplies(fetchedReplies);
        } else {
          setReplies([]);
        }
      } catch (err) {
        if (!isMounted) return;
        const lower = text.toLowerCase();
        let fallbacks = ["Sounds good! 👍", "Got it, thanks!", "Let's catch up soon"];
        if (lower.includes("how are you")) {
          fallbacks = ["I'm doing well, thanks! 😊", "All good here! How about you?", "Great! What's up?"];
        } else if (lower.includes("where") || lower.includes("location")) {
          fallbacks = ["On my way! 🚗", "Almost there, 5 mins!", "Sharing my location now"];
        } else if (lower.includes("thanks")) {
          fallbacks = ["You're welcome! 😊", "Anytime!", "Glad to help! 👍"];
        }
        cacheRef.current.set(msgId, fallbacks);
        setReplies(fallbacks);
      } finally {
        if (isMounted) setLoading(false);
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [lastMessage?._id, isEligible, lastMessage?.content]);

  if (!isEligible || (replies.length === 0 && !loading)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 5, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className={`w-full px-3 py-1.5 mb-1 rounded-xl border flex items-center gap-2 overflow-x-auto no-scrollbar select-none z-10 ${isDark
            ? "bg-[#1f2c34]/90 border-white/[0.08]"
            : "bg-white/95 border-black/[0.08] shadow-xs"
          }`}
      >
        <div className="flex items-center gap-1.5 shrink-0 text-emerald-500 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider pl-0.5">
          <HiSparkles className="text-emerald-500 animate-pulse text-sm" />
          <span className="hidden sm:inline">AI Smart Reply:</span>
        </div>

        <div className="flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar py-0.5">
          {loading ? (
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-7 w-24 rounded-full animate-pulse ${isDark ? "bg-white/10" : "bg-black/10"
                    }`}
                />
              ))}
            </div>
          ) : (
            replies.map((reply, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`group shrink-0 rounded-full text-xs sm:text-[13px] font-medium border transition-all flex items-center shadow-xs overflow-hidden ${isDark
                    ? "bg-[#2a3942] hover:bg-[#005c4b]/30 text-gray-200 hover:text-emerald-300 border-white/10 hover:border-emerald-500/40"
                    : "bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 border-black/10 hover:border-emerald-500/40"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (onSendDirect) onSendDirect(reply);
                    setDismissedMsgId(lastMessage._id);
                  }}
                  title="One-tap send this reply"
                  className="px-3 py-1 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{reply}</span>
                  <IoSend
                    size={11}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 shrink-0"
                  />
                </button>

                {onInsert && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInsert(reply);
                      setDismissedMsgId(lastMessage._id);
                    }}
                    title="Insert to edit before sending"
                    className={`pr-2.5 pl-1 py-1 border-l opacity-50 hover:opacity-100 transition-opacity cursor-pointer ${isDark ? "border-white/10" : "border-black/10"
                      }`}
                  >
                    <MdEdit size={12} />
                  </button>
                )}
              </motion.div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => setDismissedMsgId(lastMessage._id)}
          title="Dismiss smart replies"
          className={`shrink-0 p-1 rounded-full transition-colors cursor-pointer ${isDark
              ? "text-gray-400 hover:text-gray-200 hover:bg-white/10"
              : "text-gray-500 hover:text-gray-800 hover:bg-black/10"
            }`}
        >
          <RxCross2 size={15} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default SmartRepliesBar;
