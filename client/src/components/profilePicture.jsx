import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { MetaAiRing } from "./common/MetaAiIcon";

const ProfilePicture = ({ isOpen, onClose, image, username, isMetaAi: propIsMetaAi }) => {
  const isMetaAi = Boolean(
    propIsMetaAi ||
    username === "Meta AI" ||
    (typeof image === "string" && (image.includes("Meta_AI") || image.includes("meta_ai")))
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          onWheel={() => onClose()}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.18,
            ease: "easeInOut",
          }}
          className="fixed inset-0 z-[999] bg-black/75 backdrop-blur-md flex flex-col"
        >
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: 0.2,
              delay: 0.03,
            }}
            className="flex justify-between items-center px-4 md:px-10 py-3"
          >
            <div className="flex items-center gap-3">
              {isMetaAi ? (
                <MetaAiRing size={34} />
              ) : (
                <img
                  layoutId="profile-image"
                  src={image || "/default-avatar.png"}
                  alt={username}
                  className="w-9 h-9 rounded-full object-cover border border-white/10"
                />
              )}

              <h2 className="text-[#e9edef] text-[18px] font-medium flex items-center gap-1.5">
                <span>{username}</span>
                {isMetaAi && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold">
                    ✓
                  </span>
                )}
              </h2>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-full text-[#d1d7db] hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-200 cursor-pointer"
            >
              <RxCross2 size={24} />
            </button>
          </motion.div>

          <div className="flex-1 flex items-center justify-center p-4 md:p-10 overflow-hidden">
            {isMetaAi ? (
              <motion.div
                onClick={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: "spring", stiffness: 140, damping: 22 }}
                className="flex flex-col items-center justify-center gap-6"
              >
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
                  <MetaAiRing
                    size={280}
                    animate
                    className="relative z-10 drop-shadow-[0_20px_60px_rgba(59,130,246,0.45)]"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-white text-2xl font-bold flex items-center justify-center gap-2">
                    Meta AI
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[11px] font-bold">
                      ✓
                    </span>
                  </h3>
                  <p className="text-gray-300 text-sm mt-1">
                    Official AI Assistant • Meta
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.img
                layoutId="profile-image"
                onClick={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                initial={{
                  scale: 0.95,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                exit={{
                  scale: 0.95,
                  opacity: 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 20,
                }}
                src={image || "/default-avatar.png"}
                alt={username}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl select-none transition-transform duration-300"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfilePicture;
