import React from 'react'
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { MdAddReaction } from "react-icons/md";
import { FaPlus } from "react-icons/fa";

const StickerModal = ({ onClose, onSend, onUploadClick, theme }) => {
  const isDark = theme === "dark";

  const presetStickers = [
    {
      name: "Thumbs Up",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.webp",
    },
    {
      name: "Heart Fire",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp",
    },
    {
      name: "Joy Tears",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp",
    },
    {
      name: "Party Popper",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp",
    },
    {
      name: "Fire",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp",
    },
    {
      name: "Star Struck",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.webp",
    },
    {
      name: "Clapping Hands",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.webp",
    },
    {
      name: "100",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.webp",
    },
    {
      name: "Mind Blown",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.webp",
    },
    {
      name: "Cool Sunglasses",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp",
    },
    {
      name: "Folded Hands",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.webp",
    },
    {
      name: "Rocket",
      url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp",
    },
  ];

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${isDark
          ? "bg-[#111b21] border-white/10 text-white"
          : "bg-white border-gray-200 text-gray-900"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <MdAddReaction className="text-emerald-500" size={22} />
            <h2 className="text-lg font-bold">Stickers</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <RxCross2 size={18} />
          </button>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={onUploadClick}
            className={`w-full py-2.5 px-4 rounded-xl border border-dashed flex items-center justify-center gap-2 font-semibold text-sm transition cursor-pointer ${isDark
              ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              : "border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              }`}
          >
            <FaPlus size={12} /> Upload Custom Sticker (PNG / WebP / Image)
          </button>

          <p className="text-xs font-semibold opacity-60 uppercase tracking-wider mt-5 mb-3">
            Popular Stickers
          </p>

          <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
            {presetStickers.map((s, idx) => (
              <motion.button
                key={idx}
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSend(s.url)}
                className={`p-2 rounded-2xl flex items-center justify-center transition cursor-pointer ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"
                  }`}
                title={s.name}
              >
                <img
                  src={s.url}
                  alt={s.name}
                  className="w-14 h-14 object-contain"
                />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StickerModal