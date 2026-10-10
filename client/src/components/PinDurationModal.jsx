import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const PinDurationModal = ({
  isOpen,
  onClose,
  onPin,
  message,
  theme = "dark",
}) => {
  const [duration, setDuration] = useState("7 days");

  useEffect(() => {
    if (!isOpen) return;
    setDuration("7 days");
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDark = theme === "dark";
  const options = ["24 hours", "7 days", "30 days"];

  const modalContent = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-[340px] rounded-[22px] p-6 shadow-2xl border select-none ${isDark
            ? "bg-[#202c33] border-white/5 text-[#e9edef]"
            : "bg-white border-black/10 text-[#111b21]"
            }`}
        >
          <h3
            className={`text-[17px] font-bold tracking-tight leading-snug ${isDark ? "text-white" : "text-gray-900"
              }`}
          >
            Choose how long your pin lasts
          </h3>
          <p
            className={`text-[13.5px] mt-1.5 mb-5 leading-normal ${isDark ? "text-[#8696a0]" : "text-gray-500"
              }`}
          >
            You can unpin at any time.
          </p>
          <div className="space-y-4">
            {options.map((opt) => {
              const isSelected = duration === opt;
              return (
                <div
                  key={opt}
                  onClick={() => setDuration(opt)}
                  className="flex items-center gap-4 cursor-pointer group py-0.5"
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                      ? "border-[#00a884]"
                      : isDark
                        ? "border-[#8696a0]/80 group-hover:border-[#8696a0]"
                        : "border-gray-400 group-hover:border-gray-600"
                      }`}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00a884]" />
                    )}
                  </div>
                  <span
                    className={`text-[15px] font-normal transition-colors ${isSelected
                      ? isDark
                        ? "text-white font-medium"
                        : "text-gray-900 font-medium"
                      : isDark
                        ? "text-[#d1d7db]"
                        : "text-gray-700"
                      }`}
                  >
                    {opt}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-7">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[14px] font-medium text-[#00a884] dark:text-[#25d366] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onPin(duration);
                onClose();
              }}
              className="px-6 py-2 rounded-full bg-[#00a884] hover:bg-[#06cf9c] active:scale-95 text-[#111b21] text-[14px] font-semibold transition-all shadow-sm cursor-pointer"
            >
              Pin
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

export default PinDurationModal;
