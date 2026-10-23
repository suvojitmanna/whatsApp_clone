import React from "react";
import { RxCross2 } from "react-icons/rx";
import { FaStar, FaRegStar } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { LuForward } from "react-icons/lu";
import { FiDownload } from "react-icons/fi";

export const MultiSelectActionBar = ({
  theme,
  selectedMessageIds,
  handleExitSelectMode,
  hasDeletedSelected,
  areAllSelectedStarred,
  handleStarSelectedMessages,
  setShowDeleteSelectedModal,
  setShowForwardSelectedModal,
  hasDownloadableSelected,
  handleDownloadSelectedMessages,
}) => {
  return (
    <div
      className={`h-[62px] px-6 sm:px-8 border-t flex items-center justify-between transition-colors z-20 ${theme === "dark"
        ? "bg-[#202c33] border-[#222d34]"
        : "bg-[#f0f2f5] border-gray-200"
        }`}
    >
      <div className="flex items-center gap-6 select-none">
        <button
          type="button"
          onClick={handleExitSelectMode}
          className={`p-1.5 rounded-full border border-transparent transition-all cursor-pointer active:scale-95 ${theme === "dark"
            ? "text-[#aebac1] hover:text-white hover:bg-white/10 hover:border-white/15"
            : "text-gray-600 hover:text-gray-900 hover:bg-black/5 hover:border-black/10"
            }`}
          title="Close"
        >
          <RxCross2 size={21} />
        </button>
        <span
          className={`text-[15px] font-medium tracking-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-800"
            }`}
        >
          {selectedMessageIds.length} selected
        </span>
      </div>

      <div className="flex items-center gap-7 sm:gap-8">
        {!hasDeletedSelected && (
          <button
            type="button"
            onClick={handleStarSelectedMessages}
            disabled={selectedMessageIds.length === 0}
            className={`p-1.5 rounded-full border border-transparent transition-all ${selectedMessageIds.length === 0
              ? "opacity-30 cursor-not-allowed text-[#8696a0]"
              : theme === "dark"
                ? "text-[#aebac1] hover:text-white cursor-pointer active:scale-90 hover:bg-white/10 hover:border-white/15"
                : "text-gray-600 hover:text-gray-900 cursor-pointer active:scale-90 hover:bg-black/5 hover:border-black/10"
              }`}
            title="Star messages"
          >
            {areAllSelectedStarred ? (
              <FaStar size={20} className="text-amber-400" />
            ) : (
              <FaRegStar size={20} />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowDeleteSelectedModal(true)}
          disabled={selectedMessageIds.length === 0}
          className={`p-1.5 rounded-full border border-transparent transition-all ${selectedMessageIds.length === 0
            ? "opacity-30 cursor-not-allowed text-[#8696a0]"
            : theme === "dark"
              ? "text-[#aebac1] hover:text-white cursor-pointer active:scale-90 hover:bg-white/10 hover:border-white/15"
              : "text-gray-600 hover:text-gray-900 cursor-pointer active:scale-90 hover:bg-black/5 hover:border-black/10"
            }`}
          title="Delete messages"
        >
          <RiDeleteBin6Line size={21} />
        </button>

        {!hasDeletedSelected && (
          <button
            type="button"
            onClick={() => setShowForwardSelectedModal(true)}
            disabled={selectedMessageIds.length === 0}
            className={`p-1.5 rounded-full border border-transparent transition-all ${selectedMessageIds.length === 0
              ? "opacity-30 cursor-not-allowed text-[#8696a0]"
              : theme === "dark"
                ? "text-[#aebac1] hover:text-white cursor-pointer active:scale-90 hover:bg-white/10 hover:border-white/15"
                : "text-gray-600 hover:text-gray-900 cursor-pointer active:scale-90 hover:bg-black/5 hover:border-black/10"
              }`}
            title="Forward messages"
          >
            <LuForward size={22} />
          </button>
        )}

        {!hasDeletedSelected && hasDownloadableSelected && (
          <button
            type="button"
            onClick={handleDownloadSelectedMessages}
            disabled={selectedMessageIds.length === 0}
            className={`p-1.5 rounded-full border border-transparent transition-all ${selectedMessageIds.length === 0
              ? "opacity-30 cursor-not-allowed text-[#8696a0]"
              : theme === "dark"
                ? "text-[#aebac1] hover:text-white cursor-pointer active:scale-90 hover:bg-white/10 hover:border-white/15"
                : "text-gray-600 hover:text-gray-900 cursor-pointer active:scale-90 hover:bg-black/5 hover:border-black/10"
              }`}
            title="Download media"
          >
            <FiDownload size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MultiSelectActionBar;
