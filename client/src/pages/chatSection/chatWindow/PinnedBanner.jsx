import React from "react";
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from "react-icons/md";
import { TiArrowRight } from "react-icons/ti";
import { motion, AnimatePresence } from "framer-motion";
import {
  WhatsAppPinIcon,
  WhatsAppUnpinIcon,
} from "../../../components/common/Icons";

export const PinnedBanner = ({
  activePin,
  theme,
  handleScrollToPinnedMessage,
  decryptedPinnedText,
  getPinnedPreviewText,
  pinnedMenuRef,
  showPinnedMenu,
  setShowPinnedMenu,
  handleUnpinFromBanner,
}) => {
  if (!activePin) return null;

  return (
    <div
      onClick={() => handleScrollToPinnedMessage(activePin.message?._id)}
      className={`h-[42px] px-4 flex items-center justify-between border-b cursor-pointer transition-colors duration-150 select-none z-20 shrink-0 relative group ${theme === "dark"
        ? "bg-[#111b21] hover:bg-[#182229] border-[#222d34] text-[#e9edef]"
        : "bg-[#f0f2f5] hover:bg-[#eaecef] border-[#e9edef] text-[#111b21]"
        }`}
      title="Click to jump to pinned message"
    >
      <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-2">
        <WhatsAppPinIcon
          size={13}
          className={`shrink-0 ${theme === "dark" ? "text-[#8696a0]" : "text-gray-500"
            }`}
        />
        <span
          className={`text-[13.5px] truncate font-normal ${theme === "dark" ? "text-[#d1d7db]" : "text-gray-800"
            }`}
        >
          {decryptedPinnedText || getPinnedPreviewText(activePin.message)}
        </span>
      </div>

      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowPinnedMenu((prev) => !prev);
          }}
          className={`p-1 rounded-full text-[#8696a0] ${theme === "dark" ? "hover:text-white" : "hover:text-black"} ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/10"} transition-all cursor-pointer ${showPinnedMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          title="Options"
        >
          {showPinnedMenu ? (
            <MdKeyboardArrowUp size={24} />
          ) : (
            <MdKeyboardArrowDown size={24} />
          )}
        </button>
      </div>

      <AnimatePresence>
        {showPinnedMenu && (
          <motion.div
            ref={pinnedMenuRef}
            initial={{ opacity: 0, scale: 0.95, y: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -2 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => e.stopPropagation()}
            className={`absolute right-3 top-[43px] z-50 min-w-[175px] rounded-xl shadow-2xl py-1.5 border select-none ${theme === "dark"
              ? "bg-[#233138] border-white/10 text-[#d1d7db]"
              : "bg-white border-black/10 text-[#111b21]"
              }`}
          >
            <button
              type="button"
              onClick={(e) => {
                setShowPinnedMenu(false);
                handleUnpinFromBanner(e);
              }}
              className={`group w-full px-4 py-2.5 text-left text-[14px] flex items-center gap-3 transition-colors cursor-pointer ${theme === "dark"
                ? "hover:bg-[#182229] hover:text-white"
                : "hover:bg-[#f5f6f6] text-[#111b21]"
                }`}
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0 text-[#8696a0] group-hover:text-inherit">
                <WhatsAppUnpinIcon size={18} />
              </span>
              <span>Unpin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowPinnedMenu(false);
                handleScrollToPinnedMessage(activePin.message?._id);
              }}
              className={`group w-full px-4 py-2.5 text-left text-[14px] flex items-center gap-3 transition-colors cursor-pointer ${theme === "dark"
                ? "hover:bg-[#182229] hover:text-white"
                : "hover:bg-[#f5f6f6] text-[#111b21]"
                }`}
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0 text-[#8696a0] group-hover:text-inherit">
                <TiArrowRight size={20} />
              </span>
              <span>Go to message</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PinnedBanner;
