import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const BlockModal = ({
  isOpen,
  onClose,
  onBlock,
  contactName = "contact",
  theme = "dark",
}) => {
  const [reportToWhatsApp, setReportToWhatsApp] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setReportToWhatsApp(false);
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
          className={`w-full max-w-[360px] sm:max-w-[380px] rounded-[24px] p-6 sm:p-7 shadow-2xl border select-none ${isDark
            ? "bg-[#202c33] border-white/5 text-[#e9edef]"
            : "bg-white border-black/10 text-[#111b21]"
            }`}
        >
          <h2
            className={`text-center text-[21px] sm:text-[22px] font-semibold leading-snug mb-3.5 break-words ${isDark ? "text-white" : "text-gray-900"
              }`}
          >
            Block {contactName}?
          </h2>

          <p
            className={`text-left text-[14px] leading-relaxed mb-6 ${isDark ? "text-[#8696a0]" : "text-gray-600"
              }`}
          >
            This person won't be able to message or call you. They won't know
            you blocked or reported them.
          </p>

          <label
            className="flex items-start gap-3.5 mb-7 cursor-pointer select-none group"
            onClick={() => setReportToWhatsApp((prev) => !prev)}
          >
            <div
              className={`w-5 h-5 rounded-[4px] border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${reportToWhatsApp
                ? "bg-[#00a884] border-[#00a884] text-white"
                : isDark
                  ? "border-[#8696a0]/60 group-hover:border-[#8696a0] bg-transparent"
                  : "border-gray-400 group-hover:border-gray-600 bg-transparent"
                }`}
            >
              {reportToWhatsApp && (
                <svg
                  className="w-3.5 h-3.5 fill-current stroke-current"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>

            <div className="flex-1 text-[13.5px] leading-snug">
              <span
                className={`font-semibold block mb-1 ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Report to WhatsApp
              </span>
              <span
                className={`text-[13px] leading-normal ${isDark ? "text-[#8696a0]" : "text-gray-500"
                  }`}
              >
                The last 5 messages from this user will be sent to WhatsApp.{" "}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      "https://faq.whatsapp.com/594991778257077",
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="text-[#00a884] hover:underline cursor-pointer font-medium"
                >
                  Learn more
                </span>
              </span>
            </div>
          </label>

          <div className="flex flex-col gap-2.5 w-full">
            <button
              type="button"
              onClick={() => {
                onBlock?.({ report: reportToWhatsApp });
                onClose();
              }}
              className={`w-full py-2.5 px-4 rounded-full text-[15px] font-semibold transition-all duration-150 cursor-pointer select-none text-center active:scale-[0.98] border border-transparent shadow-sm ${isDark
                ? "bg-white/10 hover:bg-red-200 text-red-500"
                : "bg-gray-200 hover:bg-red-200 text-red-500"
                }`}
            >
              Block
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`w-full py-2 px-4 rounded-full text-[15px] font-medium text-[#00a884] hover:bg-[#00a884]/10 active:bg-[#00a884]/20 transition-all duration-150 cursor-pointer select-none text-center active:scale-[0.98] ${isDark ? "hover:text-[#06cf9c]" : "hover:text-[#008f6f]"
                }`}
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

export default BlockModal;
