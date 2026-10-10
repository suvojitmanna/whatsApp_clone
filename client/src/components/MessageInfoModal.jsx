import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FaCheckDouble, FaLock, FaFileAlt } from "react-icons/fa";
import { FiCheck } from "react-icons/fi";
import { format } from "date-fns";

const MessageInfoModal = ({ isOpen, onClose, message, theme = "dark" }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !message) return null;

  const isDark = theme === "dark";
  const createdDate = new Date(message.createdAt || message.timestamp || Date.now());
  const formattedTime = format(createdDate, "HH:mm");
  const formattedDate = format(createdDate, "dd/MM/yyyy");

  const modalContent = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border ${
            isDark
              ? "bg-[#111b21] border-white/10 text-[#e9edef]"
              : "bg-white border-black/10 text-[#111b21]"
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-5 py-4 border-b ${
              isDark ? "bg-[#202c33] border-white/10" : "bg-[#f0f2f5] border-black/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-base">Message info</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition cursor-pointer"
            >
              <RxCross2 size={19} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
            {/* Message preview snippet */}
            <div
              className={`p-3.5 rounded-xl border ${
                isDark
                  ? "bg-[#202c33]/60 border-white/5"
                  : "bg-gray-50 border-black/5"
              }`}
            >
              <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider block mb-1">
                Selected Message
              </span>
              {message.contentType === "text" && (
                <p className="text-sm break-words whitespace-pre-wrap leading-relaxed opacity-90">
                  {message.content}
                </p>
              )}
              {message.contentType === "image" && (
                <div className="flex items-center gap-3">
                  <img
                    src={message.imageOrVideoUrl}
                    alt="preview"
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {message.fileName || "Photo"}
                    </p>
                    {message.content && (
                      <p className="text-xs opacity-70 truncate">{message.content}</p>
                    )}
                  </div>
                </div>
              )}
              {message.contentType === "document" && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <FaFileAlt size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {message.fileName || message.content || "Document"}
                    </p>
                    <p className="text-xs opacity-60">{message.fileSize || "File"}</p>
                  </div>
                </div>
              )}
              {message.contentType === "video" && (
                <div className="flex items-center gap-3">
                  <video
                    src={message.imageOrVideoUrl}
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                  <p className="text-sm font-medium">Video message</p>
                </div>
              )}
              {message.contentType === "audio" && (
                <p className="text-sm">Voice / Audio message</p>
              )}
            </div>

            {/* Status Receipts List */}
            <div
              className={`rounded-xl divide-y border overflow-hidden ${
                isDark ? "bg-[#202c33]/30 border-white/10 divide-white/5" : "bg-white border-black/5 divide-black/5"
              }`}
            >
              {/* Read Receipt */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#53bdeb]/15 flex items-center justify-center shrink-0">
                    <FaCheckDouble size={14} className="text-[#53bdeb]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Read</h4>
                    <p className="text-xs opacity-60">
                      {message.messageStatus === "read"
                        ? "Recipient has viewed this message"
                        : "Not read yet"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium">
                    {message.messageStatus === "read" ? formattedTime : "—"}
                  </span>
                  {message.messageStatus === "read" && (
                    <p className="text-[10px] opacity-60">{formattedDate}</p>
                  )}
                </div>
              </div>

              {/* Delivered Receipt */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-gray-500/15 flex items-center justify-center shrink-0">
                    <FaCheckDouble
                      size={14}
                      className={
                        message.messageStatus === "delivered" || message.messageStatus === "read"
                          ? "opacity-80"
                          : "opacity-30"
                      }
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Delivered</h4>
                    <p className="text-xs opacity-60">
                      {message.messageStatus === "delivered" || message.messageStatus === "read"
                        ? "Delivered to device"
                        : "Pending delivery"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium">
                    {message.messageStatus === "delivered" || message.messageStatus === "read"
                      ? formattedTime
                      : "—"}
                  </span>
                  {(message.messageStatus === "delivered" || message.messageStatus === "read") && (
                    <p className="text-[10px] opacity-60">{formattedDate}</p>
                  )}
                </div>
              </div>

              {/* Sent Receipt */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-gray-500/15 flex items-center justify-center shrink-0">
                    <FiCheck size={16} className="opacity-80" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Sent</h4>
                    <p className="text-xs opacity-60">Uploaded to server</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium">{formattedTime}</span>
                  <p className="text-[10px] opacity-60">{formattedDate}</p>
                </div>
              </div>
            </div>

            {/* End-to-end encryption note */}
            <div className="flex items-start gap-2.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs">
              <FaLock size={12} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};

export default MessageInfoModal;
