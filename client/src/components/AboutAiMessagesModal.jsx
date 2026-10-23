import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  WhatsAppAiSparklesLargeIcon,
  AiLockQualityIcon,
  GenerativeAiSparkleIcon,
} from "./common/Icons";

const AboutAiMessagesModal = ({ isOpen, onClose, theme = "dark" }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDark = theme === "dark";

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px]"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.stopPropagation();
            onClose?.();
          }
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) e.stopPropagation();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-[430px] rounded-[28px] p-6 sm:p-7 shadow-2xl select-none transition-colors ${isDark
            ? "bg-[#1f2c34] text-white border border-white/5"
            : "bg-white text-[#111b21] border border-gray-200"
            }`}
        >
          <div className="flex justify-center mb-5">
            <WhatsAppAiSparklesLargeIcon size={64} className="text-[#25d366]" />
          </div>

          <h2
            className={`text-center text-[22px] font-bold leading-tight tracking-tight ${isDark ? "text-white" : "text-gray-900"
              }`}
          >
            About AI messages
          </h2>

          <div className="mt-6 space-y-6">
            <div className="flex items-start gap-4">
              <AiLockQualityIcon size={20} className="text-[#8696a0] shrink-0 mt-1" />
              <div>
                <h3
                  className={`text-[15px] font-semibold leading-snug ${isDark ? "text-[#e9edef]" : "text-gray-900"
                    }`}
                >
                  Improving AI quality
                </h3>
                <p
                  className={`text-[13.5px] leading-relaxed mt-1 ${isDark ? "text-[#8696a0]" : "text-gray-600"
                    }`}
                >
                  Meta may use your AI messages to improve AI quality. But your
                  personal messages are never sent to Meta. They can't be read
                  and remain end-to-end encrypted.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <GenerativeAiSparkleIcon size={20} className="text-[#8696a0] shrink-0 mt-1" />
              <div>
                <h3
                  className={`text-[15px] font-semibold leading-snug ${isDark ? "text-[#e9edef]" : "text-gray-900"
                    }`}
                >
                  What is generative AI?
                </h3>
                <p
                  className={`text-[13.5px] leading-relaxed mt-1 ${isDark ? "text-[#8696a0]" : "text-gray-600"
                    }`}
                >
                  Generative AI is a computer model that has learnt data
                  patterns, so people can use it to create something new like
                  text or images.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2 rounded-full font-medium text-[14px] transition cursor-pointer ${isDark
                ? "text-[#25d366] hover:bg-white/5 active:bg-white/10"
                : "text-[#00a884] hover:bg-black/5 active:bg-black/10"
                }`}
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                window.open(
                  "https://faq.whatsapp.com/1297594957591605",
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
              className="px-6 py-2 rounded-full font-medium text-[14px] bg-[#25d366] text-[#111b21] hover:bg-[#20ba5a] active:scale-95 transition shadow-md cursor-pointer"
            >
              Learn more
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default AboutAiMessagesModal;
