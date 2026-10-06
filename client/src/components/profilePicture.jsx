import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";

const ProfilePicture = ({ isOpen, onClose, image, username }) => {
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
          className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex flex-col "
        >
          {/* Top Navbar */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: 0.2,
              delay: 0.03,
            }}
            className="flex justify-between items-center px-4 md:px-10 py-3 "
          >
            {/* Left */}
            <div className="flex items-center gap-3">
              <img
                layoutId="profile-image"
                src={image}
                alt={username}
                className="w-9 h-9 rounded-full object-cover border border-white/10 "
              />

              <h2 className="text-[#e9edef] text-[18px] font-medium">
                {username}
              </h2>
            </div>

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-full text-[#d1d7db] hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-200 cursor-pointer "
            >
              <RxCross2 size={24} />
            </button>
          </motion.div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-10 overflow-hidden ">
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
              src={image}
              alt={username}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl select-none transition-transform duration-300 "
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfilePicture;
