import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";

export const ReplyPreviewBar = ({
  replyingTo,
  setReplyingTo,
  theme,
  user,
  selectedContact,
  getReplyPreviewText,
}) => {
  return (
    <AnimatePresence>
      {replyingTo && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={`w-full mb-2 px-3 py-2 rounded-xl flex items-center justify-between border shadow-sm transition-colors ${theme === "dark"
            ? "bg-[#1f2c34] border-white/5 text-[#d1d7db]"
            : "bg-white border-black/5 text-[#111b21]"
            }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-[4px] self-stretch rounded-full bg-[#7f66ff] shrink-0" />

            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <span className="text-[13px] font-semibold text-[#8b7ff5] leading-tight truncate">
                {String(replyingTo.sender?._id || replyingTo.sender) === String(user?._id)
                  ? "You"
                  : (replyingTo.sender?.username || selectedContact?.username || "Contact")}
              </span>
              <span className="text-xs text-[#8696a0] leading-tight truncate mt-0.5">
                {getReplyPreviewText(replyingTo)}
              </span>
            </div>
          </div>

          {replyingTo.imageOrVideoUrl &&
            ["image", "video", "sticker"].includes(replyingTo.contentType) && (
              <img
                src={replyingTo.imageOrVideoUrl}
                alt="reply thumb"
                className="w-10 h-10 rounded-lg object-cover shrink-0 ml-2"
              />
            )}

          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer shrink-0 ml-2"
            title="Close reply"
          >
            <RxCross2 className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReplyPreviewBar;
