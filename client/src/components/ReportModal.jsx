import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const ReportModal = ({
  isOpen,
  onClose,
  onReport,
  contactName,
  theme = "dark",
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDark = theme === "dark";

  const modalContent = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-[350px] sm:max-w-[370px] rounded-[24px] p-6 sm:p-7 shadow-2xl border select-none ${
            isDark
              ? "bg-[#202c33] border-white/5 text-[#e9edef]"
              : "bg-white border-black/10 text-[#111b21]"
          }`}
        >
          <h2
            className={`text-center text-[22px] font-semibold leading-tight ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Report to WhatsApp
          </h2>

          <p
            className={`text-[13.5px] leading-relaxed mt-4.5 ${
              isDark ? "text-[#8696a0]" : "text-gray-600"
            }`}
          >
            The last 5 messages in this chat will be sent to WhatsApp. This person
            won't know you reported or blocked them.{" "}
            <span
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  "https://faq.whatsapp.com/594991778257077",
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
              className="text-[#00a884] hover:underline cursor-pointer font-normal inline"
            >
              Learn more
            </span>
          </p>

          <p
            className={`text-[13.5px] leading-relaxed mt-3.5 mb-7 ${
              isDark ? "text-[#8696a0]" : "text-gray-600"
            }`}
          >
            If you report and block, this person won't be able to message or call you.
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                onReport?.({ block: true });
                onClose();
              }}
              className={`w-full py-2.5 px-4 rounded-full text-[14.5px] font-medium transition-colors cursor-pointer select-none text-center ${
                isDark
                  ? "bg-[#372327] hover:bg-[#43292e] text-[#ea868f]"
                  : "bg-[#fee2e2] hover:bg-[#fecaca] text-[#dc2626]"
              }`}
            >
              Report and block
            </button>

            <button
              type="button"
              onClick={() => {
                onReport?.({ block: false });
                onClose();
              }}
              className={`w-full py-2.5 px-4 rounded-full text-[14.5px] font-medium transition-colors cursor-pointer select-none text-center border ${
                isDark
                  ? "bg-[#182229] hover:bg-[#202c33] border-white/10 text-[#00a884]"
                  : "bg-white hover:bg-gray-50 border-gray-200 text-[#00a884]"
              }`}
            >
              Report
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-1.5 px-4 rounded-full text-[14.5px] font-medium text-[#00a884] hover:opacity-85 transition-opacity cursor-pointer select-none text-center mt-1"
            >
              Cancel
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

export default ReportModal;
