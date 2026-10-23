import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useThemeStore from "../../store/themeStore";
import Media from "../Media";

const MediaModal = ({
  isOpen = false,
  onClose,
  scope = "all",
  contact = null,
  chatId = null,
  initialTab = "media",
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 md:p-8 select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose?.();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className={`relative w-full max-w-[960px] h-[86vh] max-h-[740px] rounded-2xl overflow-hidden shadow-2xl flex flex-col border ${isDark
              ? "bg-[#111b21] border-white/10 text-[#e9edef] shadow-black/80"
              : "bg-white border-gray-200 text-gray-900 shadow-2xl"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Media
            mode="modal"
            scopeProp={scope}
            contact={contact}
            chatId={chatId}
            initialTab={initialTab}
            onClose={onClose}
            onCloseDrawer={onClose}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MediaModal;
