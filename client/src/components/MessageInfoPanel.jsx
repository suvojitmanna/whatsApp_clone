import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import { FaCheckDouble, FaLock, FaFileAlt, FaHeadphones } from "react-icons/fa";
import { RiContactsFill } from "react-icons/ri";
import { format, isToday, isYesterday } from "date-fns";
import useLayoutStore from "../store/layoutStore";
import useThemeStore from "../store/themeStore";
import { useChatStore } from "../store/chatStore";
import useOutsideClick from "../hook/useOutsideClick";

const formatReceiptDate = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return "";
  if (isToday(dateObj)) return "Today";
  if (isYesterday(dateObj)) return "Yesterday";
  return format(dateObj, "dd/MM/yyyy");
};

const MessageInfoPanel = () => {
  const panelRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { selectedMessageInfo, setSelectedMessageInfo } = useLayoutStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const liveMsg = useChatStore((state) => {
    if (!selectedMessageInfo) return null;
    const targetId = (
      selectedMessageInfo._id?._id || selectedMessageInfo._id
    )?.toString();
    return state.messages.find(
      (m) => (m._id?._id || m._id)?.toString() === targetId
    );
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedMessageInfo(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedMessageInfo]);

  useOutsideClick(panelRef, () => {
    if (!isMobile) {
      setSelectedMessageInfo(null);
    }
  });

  if (!selectedMessageInfo) return null;

  const msg = liveMsg || selectedMessageInfo;
  const sentDate = msg.createdAt
    ? new Date(msg.createdAt)
    : new Date(msg.timestamp || Date.now());
  const sentTime =
    !isNaN(sentDate.getTime()) ? format(sentDate, "HH:mm") : "—";
  const sentDateLabel =
    !isNaN(sentDate.getTime()) ? formatReceiptDate(sentDate) : "";

  const isDelivered =
    msg.messageStatus === "delivered" || msg.messageStatus === "read";
  const deliveredDate = msg.deliveredAt
    ? new Date(msg.deliveredAt)
    : isDelivered
      ? msg.updatedAt && new Date(msg.updatedAt) > sentDate
        ? new Date(msg.updatedAt)
        : sentDate
      : null;
  const deliveredTime =
    isDelivered && deliveredDate && !isNaN(deliveredDate.getTime())
      ? format(deliveredDate, "HH:mm")
      : "—";
  const deliveredDateLabel =
    isDelivered && deliveredDate && !isNaN(deliveredDate.getTime())
      ? formatReceiptDate(deliveredDate)
      : "";

  const isRead = msg.messageStatus === "read";
  const readDate = msg.readAt
    ? new Date(msg.readAt)
    : isRead
      ? msg.updatedAt && new Date(msg.updatedAt) > (deliveredDate || sentDate)
        ? new Date(msg.updatedAt)
        : deliveredDate || sentDate
      : null;
  const readTime =
    isRead && readDate && !isNaN(readDate.getTime())
      ? format(readDate, "HH:mm")
      : "—";
  const readDateLabel =
    isRead && readDate && !isNaN(readDate.getTime())
      ? formatReceiptDate(readDate)
      : "";

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "tween", duration: 0.2 }}
        className={`h-full flex flex-col select-none ${isMobile
          ? "fixed inset-0 z-[100]"
          : "relative w-full md:w-[350px] lg:w-[400px] xl:w-[420px] shrink-0 border-l"
          } ${isDark
            ? "bg-[#111b21] border-[#222d34] text-[#e9edef]"
            : "bg-[#f0f2f5] border-gray-200 text-gray-900"
          } shadow-2xl`}
      >
        <div
          className={`h-[60px] px-4 flex items-center justify-between border-b shrink-0 ${isDark
            ? "bg-[#202c33] border-[#222d34] text-[#e9edef]"
            : "bg-[#008069] text-white border-transparent"
            }`}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedMessageInfo(null)}
              className={`p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center ${isDark
                ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                : "hover:bg-black/10 text-white"
                }`}
              title="Back"
            >
              <FiArrowLeft size={20} />
            </button>
            <h3 className="font-semibold text-base tracking-tight">Message info</h3>
          </div>
          <button
            type="button"
            onClick={() => setSelectedMessageInfo(null)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
              ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
              : "hover:bg-black/10 text-white"
              }`}
            title="Close"
          >
            <RxCross2 size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div
            className={`p-4 border-b ${isDark
              ? "bg-[#0b141a]/60 border-[#222d34]/80"
              : "bg-[#e5ddd5]/40 border-black/5"
              }`}
          >
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider block mb-2.5 ${isDark ? "text-emerald-400" : "text-emerald-700"
                }`}
            >
              Message
            </span>

            <div
              className={`p-3 rounded-2xl shadow-sm max-w-full ${isDark
                ? "bg-[#005c4b] text-[#e9edef]"
                : "bg-[#d9fdd3] text-[#111b21]"
                }`}
            >
              {msg.contentType === "text" && (
                <p className="text-[14.5px] leading-relaxed break-words whitespace-pre-wrap">
                  {msg.content}
                </p>
              )}

              {msg.contentType === "image" && (
                <div className="space-y-2">
                  <img
                    src={msg.imageOrVideoUrl}
                    alt="preview"
                    className="rounded-xl max-h-48 w-full object-cover"
                  />
                  {msg.content && (
                    <p className="text-[14px] leading-relaxed break-words">
                      {msg.content}
                    </p>
                  )}
                </div>
              )}

              {msg.contentType === "video" && (
                <div className="space-y-2">
                  <video
                    src={msg.imageOrVideoUrl}
                    className="rounded-xl max-h-48 w-full object-cover"
                  />
                  {msg.content && (
                    <p className="text-[14px] leading-relaxed break-words">
                      {msg.content}
                    </p>
                  )}
                </div>
              )}

              {msg.contentType === "document" && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/10 dark:bg-white/5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <FaFileAlt size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate leading-tight">
                      {msg.fileName || msg.content || "Document"}
                    </p>
                    <p className="text-xs opacity-70 mt-0.5">
                      {msg.fileSize || "File"}
                    </p>
                  </div>
                </div>
              )}

              {msg.contentType === "audio" && (
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/10 dark:bg-white/5">
                  <FaHeadphones className="text-amber-400 shrink-0" size={16} />
                  <span className="text-xs font-medium truncate">
                    {msg.fileName || "Voice / Audio message"}
                  </span>
                </div>
              )}

              {msg.contentType === "sticker" && (
                <div className="flex justify-center p-1">
                  <img
                    src={msg.imageOrVideoUrl}
                    alt="Sticker"
                    className="w-28 h-28 object-contain"
                  />
                </div>
              )}

              {msg.contentType === "contact" && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/10 dark:bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <RiContactsFill size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">
                      {msg.content?.replace(/^Contact:\s*/, "") || "Contact"}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-1 text-[11px] opacity-75 mt-1 select-none">
                {msg.edited && <span className="italic mr-0.5">Edited</span>}
                <span>{sentTime}</span>
                {isRead ? (
                  <FaCheckDouble size={11} className="text-[#53bdeb]" />
                ) : isDelivered ? (
                  <FaCheckDouble size={11} className="opacity-80" />
                ) : (
                  <FiCheck size={11} className="opacity-80" />
                )}
              </div>
            </div>
          </div>

          <div
            className={`mt-4 border-y divide-y shadow-sm ${isDark
              ? "bg-[#111b21] border-[#222d34] divide-[#222d34]"
              : "bg-white border-gray-200 divide-gray-100"
              }`}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isRead
                    ? "bg-[#53bdeb]/15 text-[#53bdeb]"
                    : "bg-gray-500/10 text-gray-400/40"
                    }`}
                >
                  <FaCheckDouble size={16} />
                </div>
                <div>
                  <h4 className="text-[14.5px] font-medium leading-snug">Read</h4>
                  <p
                    className={`text-[12px] ${isDark ? "text-[#8696a0]" : "text-gray-500"
                      }`}
                  >
                    {isRead
                      ? "Recipient has viewed this message"
                      : "Not read yet"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium tabular-nums">
                  {readTime}
                </span>
                {isRead && readDateLabel && (
                  <p
                    className={`text-[11px] ${isDark ? "text-[#8696a0]" : "text-gray-400"
                      }`}
                  >
                    {readDateLabel}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDelivered
                    ? isDark
                      ? "bg-white/10 text-gray-300"
                      : "bg-gray-100 text-gray-600"
                    : "bg-gray-500/10 text-gray-400/40"
                    }`}
                >
                  <FaCheckDouble size={16} />
                </div>
                <div>
                  <h4 className="text-[14.5px] font-medium leading-snug">
                    Delivered
                  </h4>
                  <p
                    className={`text-[12px] ${isDark ? "text-[#8696a0]" : "text-gray-500"
                      }`}
                  >
                    {isDelivered
                      ? "Delivered to recipient device"
                      : "Pending delivery"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium tabular-nums">
                  {deliveredTime}
                </span>
                {isDelivered && deliveredDateLabel && (
                  <p
                    className={`text-[11px] ${isDark ? "text-[#8696a0]" : "text-gray-400"
                      }`}
                  >
                    {deliveredDateLabel}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDark
                    ? "bg-white/10 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                    }`}
                >
                  <FiCheck size={18} />
                </div>
                <div>
                  <h4 className="text-[14.5px] font-medium leading-snug">Sent</h4>
                  <p
                    className={`text-[12px] ${isDark ? "text-[#8696a0]" : "text-gray-500"
                      }`}
                  >
                    Uploaded to server
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium tabular-nums">
                  {sentTime}
                </span>
                {sentDateLabel && (
                  <p
                    className={`text-[11px] ${isDark ? "text-[#8696a0]" : "text-gray-400"
                      }`}
                  >
                    {sentDateLabel}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mx-4 mt-6 mb-8 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-start gap-2.5">
            <FaLock size={12} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MessageInfoPanel;
