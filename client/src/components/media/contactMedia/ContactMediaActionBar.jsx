import React from "react";
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { MdOutlineStarBorderPurple500, MdOutlinePermMedia } from "react-icons/md";
import { TbStarOff } from "react-icons/tb";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoReturnDownForward } from "react-icons/io5";
import { FiDownload } from "react-icons/fi";
import { HiOutlineDocumentText, HiOutlineLink } from "react-icons/hi";

export const ContactMediaTopBar = ({
  isDark,
  selectedItems = [],
  handleCancelSelect,
  handleStarSelected,
  areAllStarred,
  setShowDeleteModal,
  setShowForwardModal,
  handleDownloadSelected,
}) => {
  if (selectedItems.length === 0) return null;

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleCancelSelect}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
            ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
            : "hover:bg-gray-200 text-gray-600"
            }`}
          title="Cancel selection"
        >
          <RxCross2 size={20} />
        </button>
        <span
          className={`text-[15px] font-medium tracking-normal ${isDark ? "text-[#e9edef]" : "text-gray-900"
            }`}
        >
          {selectedItems.length} selected
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={handleStarSelected}
          className={`p-2 rounded-full transition-colors cursor-pointer ${areAllStarred
            ? "text-[#aebac1] hover:text-white hover:bg-white/10"
            : isDark
              ? "text-[#aebac1] hover:text-white hover:bg-white/10"
              : "text-black/60 hover:text-black/80 hover:bg-black/10"
            }`}
          title={areAllStarred ? "Unstar" : "Star"}
        >
          {areAllStarred ? (
            <TbStarOff size={18} />
          ) : (
            <MdOutlineStarBorderPurple500 size={18} />
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
            ? "text-[#aebac1] hover:text-rose-400 hover:bg-rose-500/10"
            : "text-gray-500 hover:text-rose-600 hover:bg-rose-100"
            }`}
          title="Delete"
        >
          <RiDeleteBin6Line size={19} />
        </button>

        <button
          type="button"
          onClick={() => setShowForwardModal(true)}
          className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
            ? "text-[#aebac1] hover:text-white hover:bg-white/10"
            : "text-gray-500 hover:text-gray-900 hover:bg-black/10"
            }`}
          title="Forward"
        >
          <IoReturnDownForward size={19} />
        </button>

        <button
          type="button"
          onClick={handleDownloadSelected}
          className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
            ? "text-[#aebac1] hover:text-white hover:bg-white/10"
            : "text-gray-500 hover:text-gray-900 hover:bg-black/10 "
            }`}
          title="Download"
        >
          <FiDownload size={19} />
        </button>
      </div>
    </div>
  );
};

export const ContactMediaBottomBar = ({
  isDark,
  activeTab,
  openMediaModal,
}) => {
  return (
    <div
      className={`shrink-0 h-[52px] border-t px-4 flex items-center justify-center select-none ${isDark ? "bg-[#111b21] border-[#222d34]" : "bg-white border-gray-200"
        } `}
    >
      <button
        type="button"
        onClick={() => {
          if (openMediaModal) {
            openMediaModal({ initialTab: activeTab, scope: "all" });
          }
        }}
        className="flex items-center gap-2 text-[#00a884] hover:text-[#06cf9c] font-medium text-[14px] transition-colors cursor-pointer group"
      >
        {activeTab === "media" ? (
          <MdOutlinePermMedia
            size={20}
            className="transition-transform group-hover:scale-105"
          />
        ) : activeTab === "docs" ? (
          <HiOutlineDocumentText
            size={20}
            className="transition-transform group-hover:scale-105"
          />
        ) : (
          <HiOutlineLink
            size={20}
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
  );
};

export const ContactMediaDeleteModal = ({
  isOpen,
  onClose,
  isDark,
  canDeleteForEveryone,
  handleExecuteDelete,
  selectedCount,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-4 backdrop-blur-xs bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`relative w-full max-w-[400px] rounded-2xl shadow-2xl p-6 select-none ${isDark
          ? "bg-[#233138] text-[#d1d7db] border border-[#3b4a54]/40"
          : "bg-white text-gray-800 border border-gray-200"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className={`text-[17px] font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"
            }`}
        >
          Delete {selectedCount} message{selectedCount > 1 ? "s" : ""}?
        </h3>
        <p className="text-[13.5px] text-[#8696a0] mb-6 leading-relaxed">
          {canDeleteForEveryone
            ? "You can delete these messages for everyone or just for yourself."
            : "These messages will be deleted for you. Others will still see them."}
        </p>

        <div className="flex flex-col gap-2">
          {canDeleteForEveryone && (
            <button
              type="button"
              onClick={() => handleExecuteDelete("everyone")}
              className="w-full py-2.5 px-4 rounded-xl text-center text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-sm active:scale-98"
            >
              Delete for everyone
            </button>
          )}

          <button
            type="button"
            onClick={() => handleExecuteDelete("me")}
            className={`w-full py-2.5 px-4 rounded-xl text-center text-sm font-semibold transition-colors cursor-pointer active:scale-98 ${canDeleteForEveryone
              ? isDark
                ? "bg-[#182229] hover:bg-[#111b21] text-white border border-white/10"
                : "bg-gray-100 hover:bg-gray-200 text-gray-800"
              : "bg-red-600 hover:bg-red-700 text-white shadow-sm"
              }`}
          >
            Delete for me
          </button>

          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 px-4 rounded-xl text-center text-sm font-medium transition-colors cursor-pointer ${isDark
              ? "hover:bg-white/5 text-[#8696a0]"
              : "hover:bg-gray-100 text-gray-600"
              }`}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
