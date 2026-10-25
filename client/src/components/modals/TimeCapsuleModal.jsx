import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { MdHourglassBottom, MdLockClock, MdLock, MdCheck } from "react-icons/md";
import { toast } from "react-toastify";

export const TimeCapsuleModal = ({
  isOpen = true,
  onClose,
  onSend,
  theme = "dark",
}) => {
  const isDark = theme === "dark";
  const [content, setContent] = useState("");
  const [hint, setHint] = useState("");
  const [unlockPreset, setUnlockPreset] = useState("1h");

  const getLocalNowFormatted = () => {
    const target = new Date(Date.now() + 60 * 60 * 1000);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, "0");
    const day = String(target.getDate()).padStart(2, "0");
    const hours = String(target.getHours()).padStart(2, "0");
    const minutes = String(target.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [customDate, setCustomDate] = useState("");

  const calculateUnlockTime = (preset) => {
    const now = new Date();
    if (preset === "1h") return new Date(now.getTime() + 60 * 60 * 1000);
    if (preset === "24h") return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (preset === "7d") return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (preset === "newyear") {
      const nextYear = now.getFullYear() + 1;
      return new Date(`${nextYear}-01-01T00:00:00`);
    }
    if (preset === "custom" && customDate) {
      return new Date(customDate);
    }
    return new Date(now.getTime() + 60 * 60 * 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter the secret message for the time capsule");
      return;
    }

    const unlockAt = calculateUnlockTime(unlockPreset);
    if (isNaN(unlockAt.getTime()) || unlockAt.getTime() <= Date.now()) {
      toast.error("Unlock time must be in the future");
      return;
    }

    onSend({
      content: content.trim(),
      hint: hint.trim() || "Secret Time Capsule",
      unlockAt: unlockAt.toISOString(),
    });
    onClose();
  };

  if (!isOpen) return null;
  const currentUnlockDate = calculateUnlockTime(unlockPreset);

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-[10000] flex items-center justify-center px-4 backdrop-blur-md ${isDark ? "bg-black/75" : "bg-black/40"}`} onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] ${isDark
            ? "bg-[#111b21] border-white/10 text-white"
            : "bg-white border-black/10 text-gray-900"
            }`}
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-[#00a884] to-teal-500 shrink-0" />
          <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${isDark ? "border-white/10 bg-[#202c33]/50" : "border-black/5 bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0 border border-emerald-500/30 shadow-inner">
                <MdHourglassBottom size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-[17px] leading-tight">
                  Seal a Time Capsule
                </h3>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Locked message that reveals at a future time
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
                ? "hover:bg-white/10 text-gray-400 hover:text-white"
                : "hover:bg-black/10 text-gray-500 hover:text-gray-900"
                }`}
            >
              <RxCross2 size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80 flex items-center gap-1.5">
                <MdLock className="text-emerald-600 dark:text-emerald-400" />
                <span>Confidential / Secret Message</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Write your secret, future prediction, birthday wish, or memory..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all resize-none ${isDark
                  ? "bg-[#202c33] border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-white placeholder-gray-500"
                  : "bg-gray-50 border-black/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-gray-900 placeholder-gray-400"
                  }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                Capsule Hint / Label (Visible while locked)
              </label>
              <input
                type="text"
                placeholder="e.g. Birthday Surprise 🎂, New Year Resolution, Don't open yet!"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all ${isDark
                  ? "bg-[#202c33] border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-white placeholder-gray-500"
                  : "bg-gray-50 border-black/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-gray-900 placeholder-gray-400"
                  }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80 flex items-center gap-1.5">
                <MdLockClock className="text-emerald-600 dark:text-emerald-400" />
                <span>When Should It Unlock?</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "1h", label: "In 1 Hour" },
                  { id: "24h", label: "In 24 Hours" },
                  { id: "7d", label: "In 1 Week" },
                  { id: "newyear", label: "New Year's Day" },
                ].map((p) => {
                  const isSelected = unlockPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setUnlockPreset(p.id)}
                      className={`flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${isSelected
                        ? isDark
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-sm ring-1 ring-emerald-500/30"
                          : "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-500/30"
                        : isDark
                          ? "bg-[#202c33] border-white/10 text-gray-300 hover:border-white/20"
                          : "bg-gray-50 border-black/10 text-gray-700 hover:border-black/20"
                        }`}
                    >
                      <span>{p.label}</span>
                      {isSelected && (
                        <MdCheck className="text-emerald-500 dark:text-emerald-400 shrink-0" size={15} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setUnlockPreset("custom");
                    if (!customDate) {
                      setCustomDate(getLocalNowFormatted());
                    }
                  }}
                  className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${unlockPreset === "custom"
                    ? isDark
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-sm ring-1 ring-emerald-500/30"
                      : "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-500/30"
                    : isDark
                      ? "bg-[#202c33] border-white/10 text-gray-300 hover:border-white/20"
                      : "bg-gray-50 border-black/10 text-gray-700 hover:border-black/20"
                    }`}
                >
                  <span className="w-full text-center">Custom Date & Time</span>
                  {unlockPreset === "custom" && (
                    <MdCheck className="text-emerald-500 dark:text-emerald-400 shrink-0" size={15} />
                  )}
                </button>
                {unlockPreset === "custom" && (
                  <input
                    type="datetime-local"
                    required
                    value={customDate}
                    min={getLocalNowFormatted()}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className={`mt-2 w-full px-3.5 py-2 rounded-xl text-xs border outline-none font-mono transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 ${isDark
                      ? "bg-[#111b21] border-white/10 text-white [color-scheme:dark]"
                      : "bg-white border-black/10 text-gray-900 [color-scheme:light]"
                      }`}
                  />
                )}
              </div>
            </div>

            <div className={`p-3 rounded-xl text-xs border flex items-center justify-between ${isDark
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium">Unlocks on:</span>
              </div>
              <span className="font-bold">
                {currentUnlockDate && !isNaN(currentUnlockDate.getTime()) ? currentUnlockDate.toLocaleString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) : "..."}
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${isDark
                  ? "border-white/10 hover:bg-white/5 text-gray-300"
                  : "border-black/10 hover:bg-black/5 text-gray-600"
                  }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 via-[#00a884] to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shadow-md shadow-emerald-600/30 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MdLock size={16} />
                <span>Seal Capsule</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TimeCapsuleModal;
