import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoTimeOutline, IoCalendarOutline } from "react-icons/io5";
import { MdOutlineSchedule, MdCalendarToday, MdAccessTime } from "react-icons/md";
import { toast } from "react-toastify";
import { useChatStore } from "../../store/chatStore";

export default function RescheduleModal({
  isOpen,
  onClose,
  message,
  theme = "dark",
}) {
  const [editedText, setEditedText] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [loading, setLoading] = useState(false);

  const isDark = theme === "dark";
  const isScheduled = Boolean(
    message?.isScheduled || message?.messageStatus === "scheduled"
  );

  useEffect(() => {
    if (isOpen && message) {
      setEditedText(message.content || "");
      const baseDate = message.scheduledFor
        ? new Date(message.scheduledFor)
        : message.createdAt
          ? new Date(message.createdAt)
          : new Date(Date.now() + 30 * 60 * 1000);

      const target = isScheduled && baseDate <= new Date()
        ? new Date(Date.now() + 30 * 60 * 1000)
        : baseDate;

      setCustomDate(target.toISOString().split("T")[0]);
      const hh = String(target.getHours()).padStart(2, "0");
      const mm = String(target.getMinutes()).padStart(2, "0");
      setCustomTime(`${hh}:${mm}`);
    }
  }, [isOpen, message, isScheduled]);

  if (!isOpen || !message) return null;

  const currentDisplayTime = message.scheduledFor
    ? new Date(message.scheduledFor).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    }) +
    " at " +
    new Date(message.scheduledFor).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
    : message.createdAt
      ? new Date(message.createdAt).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      }) +
      " at " +
      new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
      : null;

  const applyPreset = (minutesToAdd) => {
    const future = new Date(Date.now() + minutesToAdd * 60 * 1000);
    setCustomDate(future.toISOString().split("T")[0]);
    const hh = String(future.getHours()).padStart(2, "0");
    const mm = String(future.getMinutes()).padStart(2, "0");
    setCustomTime(`${hh}:${mm}`);
  };

  const applyTomorrow = () => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    tom.setHours(9, 0, 0, 0);
    setCustomDate(tom.toISOString().split("T")[0]);
    setCustomTime("09:00");
  };

  const applyTonight = () => {
    const eve = new Date();
    if (eve.getHours() < 19) {
      eve.setHours(20, 0, 0, 0);
    } else {
      eve.setDate(eve.getDate() + 1);
      eve.setHours(20, 0, 0, 0);
    }
    setCustomDate(eve.toISOString().split("T")[0]);
    setCustomTime("20:00");
  };

  const handleSave = async () => {
    if (!customDate || !customTime) {
      toast.info("Please pick both a date and time");
      return;
    }
    const chosenDt = new Date(`${customDate}T${customTime}`);
    if (isNaN(chosenDt.getTime())) {
      toast.error("Invalid date or time selected");
      return;
    }

    if (isScheduled && chosenDt <= new Date()) {
      toast.error("Scheduled delivery time must be in the future!");
      return;
    }

    setLoading(true);
    try {
      if (isScheduled) {
        await useChatStore
          .getState()
          .rescheduleMessage(
            message._id,
            chosenDt.toISOString(),
            editedText.trim() || undefined
          );
      } else {
        await useChatStore
          .getState()
          .editMessage(
            message._id,
            editedText.trim() || message.content,
            null,
            { createdAt: chosenDt.toISOString() }
          );
        toast.success("Message and timestamp updated!");
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async () => {
    setLoading(true);
    try {
      await useChatStore.getState().sendScheduledNow(message._id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${isDark
            ? "bg-[#1f2c34] border-white/10 text-[#e9edef]"
            : "bg-white border-gray-200 text-[#111b21]"
            }`}
        >
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500" />
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <IoTimeOutline className="text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-gray-900 dark:text-white">
                  {isScheduled ? "Edit Scheduled Message & Time" : "Edit Message & Time"}
                </h3>
                <p className="text-[11px] text-gray-400 leading-tight">
                  {isScheduled
                    ? "Update your message content or change delivery time"
                    : "Update message content and adjust timestamp"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              <IoClose className="text-xl" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto custom-scrollbar">
            {currentDisplayTime && (
              <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs">
                <span className="text-amber-700 dark:text-amber-300 font-medium text-[11.5px] truncate flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>Currently {isScheduled ? "delivering" : "set for"}:</span>
                  <strong className="text-amber-900 dark:text-amber-100 font-semibold truncate">
                    {currentDisplayTime}
                  </strong>
                </span>
                {isScheduled && (
                  <button
                    type="button"
                    onClick={handleSendNow}
                    disabled={loading}
                    className="shrink-0 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Send now ↗
                  </button>
                )}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Message Content
              </label>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={3}
                placeholder="Type your message..."
                className={`w-full p-3 rounded-xl text-xs leading-relaxed border outline-none transition-all resize-none ${isDark
                  ? "bg-[#111b21] border-white/10 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  : "bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  }`}
              />
            </div>

            {isScheduled && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Quick Reschedule Presets
                  </span>
                  <span className="text-[10px] text-gray-400">1-click select</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset(15)}
                    className="p-2 rounded-xl text-left border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer text-center"
                  >
                    +15 mins
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(60)}
                    className="p-2 rounded-xl text-left border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer text-center"
                  >
                    +1 hour
                  </button>
                  <button
                    type="button"
                    onClick={applyTonight}
                    className="p-2 rounded-xl text-left border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer text-center"
                  >
                    Tonight
                  </button>
                  <button
                    type="button"
                    onClick={applyTomorrow}
                    className="p-2 rounded-xl text-left border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer text-center"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                <IoCalendarOutline className="text-xs" />
                <span>{isScheduled ? "Target Delivery Date & Time" : "Date & Time"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative flex items-center">
                  <MdCalendarToday className="absolute left-3 text-gray-400 text-xs pointer-events-none" />
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={
                      isScheduled
                        ? new Date().toISOString().split("T")[0]
                        : undefined
                    }
                    className="w-full text-xs py-2 pl-8 pr-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 text-gray-800 dark:text-gray-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer font-medium [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div className="relative flex items-center">
                  <MdAccessTime className="absolute left-3 text-gray-400 text-xs pointer-events-none" />
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full text-xs py-2 pl-8 pr-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 text-gray-800 dark:text-gray-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer font-medium [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-black/20">
            {isScheduled ? (
              <button
                type="button"
                onClick={handleSendNow}
                disabled={loading}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Send this message right now instead of scheduling"
              >
                <span>🚀 Send Now</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || !editedText.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <MdOutlineSchedule className="text-sm" />
                <span>{loading ? "Saving..." : isScheduled ? "Update Schedule" : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
