import React, { useState, useEffect } from "react";
import { MdLock, MdLockOpen } from "react-icons/md";
import { HiSparkles } from "react-icons/hi2";

export const MessageTimeCapsuleContent = ({
  message,
  isUserMessage,
  isDark,
  renderTimestampAndStatus,
}) => {
  const unlockDate = message.timeCapsuleUnlockAt
    ? new Date(message.timeCapsuleUnlockAt)
    : null;

  const [timeLeft, setTimeLeft] = useState(() => {
    if (!unlockDate) return 0;
    return Math.max(0, Math.floor((unlockDate.getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((unlockDate.getTime() - Date.now()) / 1000),
      );
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [unlockDate, timeLeft]);

  const isLocked = timeLeft > 0;

  const formatCountdown = (totalSec) => {
    const days = Math.floor(totalSec / (24 * 3600));
    const hours = Math.floor((totalSec % (24 * 3600)) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (days > 0) {
      return `${days}d ${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
    }
    return `${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  };

  const senderName = isUserMessage
    ? "You"
    : message.sender?.username || message.sender?.name || "Friend";

  return (
    <div className="flex flex-col min-w-[270px] max-w-[325px] w-full select-none">
      {isLocked ? (
        <div className={`p-3.5 rounded-2xl border flex flex-col gap-2.5 transition-all relative overflow-hidden ${isDark
          ? "bg-gradient-to-br from-[#2a2415] via-[#1a160d] to-[#121212] border-amber-500/30 text-white shadow-lg shadow-amber-950/20"
          : "bg-gradient-to-br from-amber-50 via-amber-100/40 to-white border-amber-300 text-gray-900 shadow-sm"
          }`}
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-inner">
              <MdLock size={20} className="animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 inline-block">
                Time Capsule Locked
              </span>
              <h4 className="text-[14px] font-bold leading-tight mt-0.5 truncate">
                {message.timeCapsuleHint || "Confidential Surprise"}
              </h4>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center ${isDark
            ? "bg-black/40 border-amber-500/20"
            : "bg-white/80 border-amber-200"
            }`}
          >
            <span className="text-[10px] font-medium opacity-70 uppercase tracking-widest mb-0.5">
              Unlocks In
            </span>
            <span className="font-mono text-[16px] font-black tracking-wider text-amber-400">
              ⏳ {formatCountdown(timeLeft)}
            </span>
          </div>

          <div className="text-[11px] opacity-70 leading-relaxed">
            Sealed by <span className="font-semibold">{senderName}</span>. Content is cryptographically locked until{" "}
            {unlockDate ? unlockDate.toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }) : "the countdown ends"}.
          </div>
        </div>
      ) : (
        <div className={`p-3.5 rounded-2xl border flex flex-col gap-2 transition-all ${isDark
          ? "bg-gradient-to-br from-[#12281e] via-[#101b16] to-[#121212] border-emerald-500/40 text-white"
          : "bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 border-emerald-300 text-gray-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <MdLockOpen size={17} />
              <span>Time Capsule Unlocked!</span>
            </div>
            <HiSparkles className="text-amber-400 animate-spin" size={16} />
          </div>

          {message.timeCapsuleHint && (
            <div className="text-xs font-semibold opacity-70">
              🏷️ {message.timeCapsuleHint}
            </div>
          )}

          <div className={`p-3 rounded-xl border text-[14px] font-medium leading-relaxed break-words ${isDark
            ? "bg-black/30 border-emerald-500/20 text-emerald-100"
            : "bg-emerald-100/50 border-emerald-200 text-emerald-950"
            }`}
          >
            {message.content}
          </div>

          <div className="text-[10px] opacity-65 flex items-center justify-between pt-1">
            <span>Sealed by {senderName}</span>
            <span>Unlocked</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end mt-1.5 pt-0.5 text-[11px] opacity-75">
        {renderTimestampAndStatus(false)}
      </div>
    </div>
  );
};

export default MessageTimeCapsuleContent;
