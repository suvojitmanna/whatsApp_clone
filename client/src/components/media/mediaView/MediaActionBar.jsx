import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FaStar, FaRegStar, FaFileAlt } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoArrowForward } from "react-icons/io5";
import { FiDownload, FiLink } from "react-icons/fi";
import { HiOutlinePhotograph } from "react-icons/hi";

export const MediaActionBar = ({
  scope,
  isSelectMode,
  isDark,
  setScope,
  setSelectedContactFilter,
  activeTab,
  selectedItems = [],
  handleCancelSelect,
  selectedTotalSize,
  handleStarSelected,
  areAllStarred,
  setShowDeleteModal,
  handleForwardSelected,
  handleDownloadSelected,
}) => {
  return (
    <>
      {scope === "chat" && !isSelectMode && (
        <div
          className={`shrink-0 h-[52px] border-t px-4 flex items-center justify-center select-none ${isDark ? "bg-[#111b21] border-[#222d34]" : "bg-white border-gray-200"
            }`}
        >
          <button
            type="button"
            onClick={() => {
              setScope("all");
              setSelectedContactFilter("");
            }}
            className="flex items-center gap-2 text-[#00a884] hover:text-[#06cf9c] font-medium text-[14px] transition-colors cursor-pointer group"
          >
            {activeTab === "media" ? (
              <HiOutlinePhotograph
                size={19}
                className="transition-transform group-hover:scale-105"
              />
            ) : activeTab === "docs" ? (
              <FaFileAlt
                size={16}
                className="transition-transform group-hover:scale-105"
              />
            ) : (
              <FiLink
                size={17}
                className="transition-transform group-hover:scale-105"
              />
            )}
            <span>
              {activeTab === "media"
                ? "View media from all chats"
                : activeTab === "docs"
                  ? "View docs from all chats"
                  : "View links from all chats"}
            </span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {isSelectMode && selectedItems.length > 0 && (
          <motion.div
            initial={{ y: 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 70, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className={`fixed bottom-0 inset-x-0 sm:absolute sm:inset-x-0 h-[60px] px-6 border-t flex items-center justify-between z-40 select-none shadow-2xl backdrop-blur-md ${isDark
              ? "bg-[#202c33] border-[#2a3942] text-white"
              : "bg-white border-gray-200 text-gray-900"
              }`}
          >
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleCancelSelect}
                className={`p-2 rounded-full transition-colors cursor-pointer active:scale-95 ${isDark
                  ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                title="Cancel selection"
              >
                <RxCross2 size={20} />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[14.5px] font-medium tracking-wide">
                  {selectedItems.length} selected
                </span>
                <span
                  className={`text-[12px] px-2 py-0.5 rounded-full ${isDark
                    ? "bg-white/10 text-[#8696a0]"
                    : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {selectedTotalSize}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleStarSelected}
                className={`p-2.5 rounded-full transition-colors cursor-pointer active:scale-90 ${areAllStarred
                  ? "text-amber-400 hover:bg-amber-400/10"
                  : isDark
                    ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                title={areAllStarred ? "Unstar selected" : "Star selected"}
              >
                {areAllStarred ? <FaStar size={18} /> : <FaRegStar size={18} />}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className={`p-2.5 rounded-full transition-colors cursor-pointer active:scale-90 ${isDark
                  ? "text-[#aebac1] hover:text-rose-400 hover:bg-rose-500/10"
                  : "text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                  }`}
                title="Delete selected"
              >
                <RiDeleteBin6Line size={20} />
              </button>

              <button
                type="button"
                onClick={handleForwardSelected}
                className={`p-2.5 rounded-full transition-colors cursor-pointer active:scale-90 ${isDark
                  ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                title="Forward selected"
              >
                <IoArrowForward size={20} />
              </button>

              <button
                type="button"
                onClick={handleDownloadSelected}
                className={`p-2.5 rounded-full transition-colors cursor-pointer active:scale-90 ${isDark
                  ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                title="Download selected"
              >
                <FiDownload size={19} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MediaActionBar;
