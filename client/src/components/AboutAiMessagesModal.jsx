import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

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
            <svg
              viewBox="0 0 100 100"
              fill="currentColor"
              className="w-16 h-16 text-[#25d366]"
            >
              <circle cx="28" cy="30" r="5.5" />
              <path d="M52 14 C52 13 53 12 54 12 C55 12 56 13 56 14 L56 18 L60 18 C61 18 62 19 62 20 C62 21 61 22 60 22 L56 22 L56 26 C56 27 55 28 54 28 C53 28 52 27 52 26 L52 22 L48 22 C47 22 46 21 46 20 C46 19 47 18 48 18 L52 18 Z" />
              <path d="M72 23 C73 21 75 21 76 22 L83 31 C84 32 83 34 81 35 L71 36 C69 36 68 34 69 33 Z" />
              <path d="M50 26 C50 39 39 50 26 50 C39 50 50 61 50 74 C50 61 61 50 74 50 C61 50 50 39 50 26 Z" />
            </svg>
          </div>

          <h2
            className={`text-center text-[22px] font-bold leading-tight tracking-tight ${isDark ? "text-white" : "text-gray-900"
              }`}
          >
            About AI messages
          </h2>

          <div className="mt-6 space-y-6">
            <div className="flex items-start gap-4">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-[#8696a0] shrink-0 mt-1"
              >
                <path
                  fillRule="evenodd"
                  d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                  clipRule="evenodd"
                />
              </svg>
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
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-[#8696a0] shrink-0 mt-1"
              >
                <path d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z" />
                <circle cx="19" cy="5" r="2" />
                <circle cx="5" cy="19" r="1.5" />
              </svg>
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
