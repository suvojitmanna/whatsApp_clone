import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdOutlineAlarm, MdClose, MdAccessTime, MdToday, MdCheck } from "react-icons/md";
import { toast } from "react-toastify";
import useThemeStore from "../../store/themeStore";
import useReminderStore from "../../store/useReminderStore";

const PRESETS = [
  { label: "In 10 minutes", getMinutes: () => 10, icon: "⚡" },
  { label: "In 1 hour", getMinutes: () => 60, icon: "⏱️" },
  {
    label: "Tonight (8:00 PM)",
    getDate: () => {
      const d = new Date();
      d.setHours(20, 0, 0, 0);
      if (d.getTime() <= Date.now()) {
        d.setDate(d.getDate() + 1);
      }
      return d;
    },
    icon: "🌙",
  },
  {
    label: "Tomorrow morning (9:00 AM)",
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    },
    icon: "☀️",
  },
];

const getLocalNowFormatted = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const RemindMeModal = ({
  isOpen,
  onClose,
  message,
  contactName,
  conversationId,
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const addReminder = useReminderStore((state) => state.addReminder);

  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [isCustom, setIsCustom] = useState(false);
  const [customDate, setCustomDate] = useState(() => getLocalNowFormatted());
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCustomDate(getLocalNowFormatted());
    }
  }, [isOpen]);

  if (!isOpen || !message) return null;

  const handleSaveReminder = () => {
    let remindDate;
    if (isCustom) {
      if (!customDate) {
        toast.error("Please pick a date and time");
        return;
      }
      remindDate = new Date(customDate);
      if (isNaN(remindDate.getTime())) {
        toast.error("Please pick a valid date and time");
        return;
      }
      if (remindDate.getTime() < Date.now() - 60000) {
        toast.error("Please pick a current or future time");
        return;
      }
    } else {
      const preset = PRESETS[selectedPresetIndex];
      if (preset.getMinutes) {
        remindDate = new Date(Date.now() + preset.getMinutes() * 60 * 1000);
      } else {
        remindDate = preset.getDate();
      }
    }

    addReminder({
      message,
      remindAt: remindDate,
      note,
      contactName,
      conversationId,
    });

    const timeStr = remindDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = remindDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });

    toast.success(`⏰ Reminder set for ${dateStr} at ${timeStr}`);
    onClose();
  };

  const snippet = message.content
    ? message.content.length > 90
      ? message.content.substring(0, 90) + "..."
      : message.content
    : `[${message.contentType || "Media Attachment"}]`;

  const getSelectedTargetDate = () => {
    if (isCustom) {
      const d = new Date(customDate);
      return isNaN(d.getTime()) ? null : d;
    }
    const preset = PRESETS[selectedPresetIndex];
    if (preset.getMinutes) {
      return new Date(Date.now() + preset.getMinutes() * 60 * 1000);
    }
    return preset.getDate();
  };

  const targetDate = getSelectedTargetDate();
  const formattedTargetTime = targetDate
    ? `${targetDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} at ${targetDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.18 }}
          className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${isDark
            ? "bg-[#1f2c34] border-white/10 text-[#e9edef]"
            : "bg-white border-black/10 text-[#111b21]"
            }`}
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-[#00a884] to-teal-500" />
          <div
            className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-white/10 bg-[#182229]" : "border-black/5 bg-[#f0f2f5]"
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0 border border-emerald-500/30">
                <MdOutlineAlarm />
              </div>
              <div>
                <h3 className="font-bold text-[15px] leading-tight">Set Message Reminder</h3>
                <p className="text-[11.5px] opacity-70">
                  Get notified to follow up on this message
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-gray-500"
                }`}
            >
              <MdClose size={19} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${isDark
              ? "bg-[#111b21] border-emerald-500/20 text-[#8696a0]"
              : "bg-emerald-50/50 border-emerald-500/20 text-[#54656f]"
              }`}>
              <div className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center justify-between">
                <span>{contactName || message.sender?.username || "Contact"}</span>
                <span className="opacity-60 text-[10px]">Quote snippet</span>
              </div>
              <p className="line-clamp-2 italic text-[13px] text-inherit font-normal">
                "{snippet}"
              </p>
            </div>

            {formattedTargetTime && (
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs border ${isDark
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="truncate">
                  Alert at: <strong className="font-semibold">{formattedTargetTime}</strong>
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
                Remind Me
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset, idx) => {
                  const isSelected = !isCustom && selectedPresetIndex === idx;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setIsCustom(false);
                        setSelectedPresetIndex(idx);
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${isSelected
                        ? isDark
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-sm ring-1 ring-emerald-500/30 font-semibold"
                          : "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-500/30 font-semibold"
                        : isDark
                          ? "border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 hover:border-white/10"
                          : "border-black/5 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:border-black/10"
                        }`}
                    >
                      <span className="text-sm shrink-0">{preset.icon}</span>
                      <span className="truncate">{preset.label}</span>
                      {isSelected && <MdCheck className="ml-auto shrink-0 text-emerald-500 dark:text-emerald-400" size={16} />}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCustom(true);
                  if (!customDate) {
                    setCustomDate(getLocalNowFormatted());
                  }
                }}
                className={`mt-2 w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${isCustom
                  ? isDark
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-sm ring-1 ring-emerald-500/30 font-semibold"
                    : "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-500/30 font-semibold"
                  : isDark
                    ? "border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 hover:border-white/10"
                    : "border-black/5 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:border-black/10"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">📅</span>
                  <span>Custom Date & Time</span>
                </div>
                {isCustom && <MdCheck className="text-emerald-500 dark:text-emerald-400" size={16} />}
              </button>

              {isCustom && (
                <div className="mt-2.5 animate-fadeIn">
                  <input
                    type="datetime-local"
                    value={customDate}
                    min={getLocalNowFormatted()}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-colors ${isDark
                      ? "bg-[#111b21] border-white/15 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 [color-scheme:dark]"
                      : "bg-white border-black/15 text-black focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 [color-scheme:light]"
                      }`}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-75">
                Note (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Follow up on proposal..."
                maxLength={100}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none transition-colors ${isDark
                  ? "bg-[#111b21] border-white/10 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  : "bg-gray-50 border-black/10 text-black placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  }`}
              />
            </div>
          </div>

          <div className={`flex items-center justify-end gap-2.5 px-5 py-3.5 border-t ${isDark ? "border-white/10 bg-[#182229]" : "border-black/5 bg-[#f0f2f5]"}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${isDark ? "hover:bg-white/10 text-gray-300" : "hover:bg-black/5 text-gray-600"
                }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveReminder}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-emerald-600 via-[#00a884] to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <MdOutlineAlarm size={16} />
              <span>Set Reminder</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RemindMeModal;
