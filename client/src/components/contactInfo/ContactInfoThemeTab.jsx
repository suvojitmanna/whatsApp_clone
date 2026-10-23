import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MdChevronLeft,
  MdChevronRight,
  MdCheck,
  MdOutlineChatBubbleOutline,
  MdOutlineWallpaper,
} from "react-icons/md";
import { FaCheck } from "react-icons/fa";
import { LuSparkles } from "react-icons/lu";
import {
  CHAT_THEMES,
  CURATED_THEME_IDS,
  WALLPAPER_THEMES,
  NATURE_WALLPAPERS,
  SOLID_COLOUR_THEMES,
  CHAT_BUBBLE_COLORS,
  getChatTheme,
} from "../../utils/chatThemes";

const ContactInfoThemeTab = ({
  contactInfoTab,
  setContactInfoTab,
  chatId,
  chatThemes,
  chatBubbleColors,
  chatDoodles,
  setChatTheme,
  setChatDoodles,
  setChatBubbleColor,
  updateCursorTooltip,
  hideCursorTooltip,
}) => {
  const [themePageIndex, setThemePageIndex] = useState(0);
  const [wallpaperFilter, setWallpaperFilter] = useState("all");

  const activeChatThemeId = (chatId && chatThemes?.[chatId]) || "default";
  const activeChatTheme = getChatTheme(activeChatThemeId);
  const customBubbleColor = chatId && chatBubbleColors?.[chatId];
  const activeBubbleColor = customBubbleColor || activeChatTheme.bubbleColor;
  const doodlesEnabled = chatId ? chatDoodles?.[chatId] !== false : true;

  const handleSelectTheme = (themeId) => {
    if (!chatId) return;
    setChatTheme(chatId, themeId);
  };

  const handleToggleDoodles = (enabled) => {
    if (!chatId) return;
    setChatDoodles(chatId, enabled);
  };

  const handleSelectBubbleColor = (color) => {
    if (!chatId) return;
    setChatBubbleColor(chatId, color);
  };

  if (contactInfoTab === "chatTheme") {
    return (
      <motion.div
        key="tab-chatTheme"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.15 }}
        onScroll={hideCursorTooltip}
        className="flex flex-col py-3 overflow-y-auto flex-1 scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
      >
        <div className="px-5 mb-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[16px] font-semibold text-white">Themes</h3>
            <button
              type="button"
              onClick={() => setContactInfoTab("allThemes")}
              className="px-3.5 py-1 rounded-full text-xs font-semibold text-[#00a884] bg-[#202c33] hover:bg-[#2a3942] border border-white/5 transition-colors cursor-pointer"
            >
              See all
            </button>
          </div>
          <p className="text-[13px] text-[#8696a0] mb-3.5 leading-snug">
            The chat color and wallpaper will both change.
          </p>

          <div className="relative group">
            {themePageIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  hideCursorTooltip?.();
                  setThemePageIndex((prev) => Math.max(0, prev - 1));
                }}
                onMouseEnter={hideCursorTooltip}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#182229]/90 hover:bg-[#202c33] active:bg-[#2a3942] text-white flex items-center justify-center shadow-xl border border-white/10 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto cursor-pointer hover:scale-105 active:scale-95"
                title="Previous themes"
                aria-label="Previous themes"
              >
                <MdChevronLeft size={20} />
              </button>
            )}
            {themePageIndex < Math.ceil(CURATED_THEME_IDS.length / 6) - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  hideCursorTooltip?.();
                  setThemePageIndex((prev) =>
                    Math.min(Math.ceil(CURATED_THEME_IDS.length / 6) - 1, prev + 1)
                  );
                }}
                onMouseEnter={hideCursorTooltip}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#182229]/90 hover:bg-[#202c33] active:bg-[#2a3942] text-white flex items-center justify-center shadow-xl border border-white/10 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto cursor-pointer hover:scale-105 active:scale-95"
                title="Next themes"
                aria-label="Next themes"
              >
                <MdChevronRight size={20} />
              </button>
            )}

            <div className="grid grid-cols-3 gap-2.5">
              {CURATED_THEME_IDS.slice(themePageIndex * 6, (themePageIndex + 1) * 6).map((id) => {
                const themeItem = getChatTheme(id);
                const isSelected = activeChatThemeId === themeItem.id;
                return (
                  <div
                    key={themeItem.id}
                    onClick={() => handleSelectTheme(themeItem.id)}
                    onMouseEnter={(e) => updateCursorTooltip?.(e, themeItem.name)}
                    onMouseMove={(e) => updateCursorTooltip?.(e, themeItem.name)}
                    onMouseLeave={hideCursorTooltip}
                    className={`relative h-[80px] rounded-[18px] overflow-hidden cursor-pointer transition-all duration-200 select-none ${isSelected
                        ? "border-2 border-white scale-[1.01] shadow-xl"
                        : "border border-white/10 hover:border-white/30 hover:scale-[1.02]"
                      }`}
                    style={{
                      backgroundColor: themeItem.bgColor || "#0b141a",
                      backgroundImage: themeItem.imageUrl
                        ? `url('${themeItem.thumbnailUrl || themeItem.imageUrl}')`
                        : themeItem.gradient || undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    {!themeItem.imageUrl && themeItem.hasDoodles && doodlesEnabled && (
                      <div
                        className="absolute inset-0 opacity-40 pointer-events-none"
                        style={{
                          backgroundImage:
                            "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                          backgroundSize: "120px",
                          backgroundBlendMode: "overlay",
                        }}
                      />
                    )}

                    <div className="absolute top-2.5 left-2.5 w-10 h-3.5 rounded-[4.5px] bg-[#2a3942]/90 shadow-sm pointer-events-none" />

                    <div
                      className="absolute top-5.5 right-2.5 w-11 h-3.5 rounded-[4.5px] shadow-sm pointer-events-none"
                      style={{ backgroundColor: isSelected ? activeBubbleColor : themeItem.bubbleColor }}
                    />

                    {isSelected && (
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5.5 h-5.5 rounded-full bg-white text-[#111b21] flex items-center justify-center shadow-lg pointer-events-none">
                        <FaCheck size={9.5} className="stroke-[1.5]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-3.5 px-5 border-y border-[#202c33]">
          <div className="flex items-center gap-3">
            <LuSparkles size={20} className="text-[#8696a0]" />
            <span className="text-[15px] font-normal text-white">WhatsApp doodles</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={doodlesEnabled}
            onClick={() => handleToggleDoodles(!doodlesEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${doodlesEnabled ? "bg-[#00a884]" : "bg-[#374248]"
              }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200 ${doodlesEnabled
                  ? "translate-x-5 bg-[#111b21]"
                  : "translate-x-0 bg-[#8696a0]"
                }`}
            />
          </button>
        </div>
        <div className="px-5 pt-3.5">
          <h4 className="text-[14.5px] font-semibold text-white mb-2">Customize</h4>
          <div
            className="flex items-center justify-between py-2.5 px-1 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group select-none"
            onClick={() => setContactInfoTab("chatBubble")}
          >
            <div className="flex items-center gap-3.5">
              <MdOutlineChatBubbleOutline size={20} className="text-[#8696a0] group-hover:text-white transition-colors" />
              <span className="text-[15px] font-normal text-white">Chat bubble</span>
            </div>
            <div
              className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: activeBubbleColor }}
            />
          </div>
          <div
            className="flex items-center justify-between py-2.5 px-1 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group select-none mt-1"
            onClick={() => setContactInfoTab("wallpaper")}
          >
            <div className="flex items-center gap-3.5">
              <MdOutlineWallpaper size={20} className="text-[#8696a0] group-hover:text-white transition-colors" />
              <span className="text-[15px] font-normal text-white">Wallpaper</span>
            </div>
            <div
              className="w-8 h-6 rounded-md border border-white/20 overflow-hidden relative shadow-sm"
              style={{
                background: activeChatTheme.imageUrl
                  ? `url('${activeChatTheme.thumbnailUrl || activeChatTheme.imageUrl}') center/cover no-repeat`
                  : activeChatTheme.gradient || activeChatTheme.bgColor,
                backgroundImage:
                  activeChatTheme.imageUrl
                    ? `url('${activeChatTheme.thumbnailUrl || activeChatTheme.imageUrl}')`
                    : activeChatTheme.hasDoodles && doodlesEnabled
                      ? "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')"
                      : undefined,
                backgroundSize: activeChatTheme.imageUrl ? "cover" : "36px",
                backgroundPosition: "center",
              }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  if (contactInfoTab === "chatBubble") {
    return (
      <motion.div
        key="tab-chatBubble"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.15 }}
        onScroll={hideCursorTooltip}
        className="flex flex-col p-6 overflow-y-auto flex-1 scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
      >
        <div className="grid grid-cols-4 gap-y-6 gap-x-4 justify-items-center max-w-[340px] mx-auto pb-10 pt-2">
          {CHAT_BUBBLE_COLORS.map((bubbleItem) => {
            const isSelected =
              activeBubbleColor?.toLowerCase() ===
              bubbleItem.color.toLowerCase();
            return (
              <button
                key={bubbleItem.id}
                type="button"
                onClick={() => handleSelectBubbleColor(bubbleItem.color)}
                onMouseEnter={(e) => updateCursorTooltip?.(e, bubbleItem.name)}
                onMouseMove={(e) => updateCursorTooltip?.(e, bubbleItem.name)}
                onMouseLeave={hideCursorTooltip}
                className={`relative w-[54px] h-[54px] sm:w-[58px] sm:h-[58px] rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center ${isSelected
                    ? "ring-2 ring-white ring-offset-2 ring-offset-[#111b21] scale-100"
                    : "hover:scale-105 active:scale-95"
                  }`}
                style={{ backgroundColor: bubbleItem.color }}
              >
                {isSelected && (
                  <div className="w-5.5 h-5.5 rounded-full bg-white flex items-center justify-center shadow-md pointer-events-none">
                    <MdCheck size={14} className="text-[#111b21] stroke-[1]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  if (contactInfoTab === "allThemes") {
    return (
      <motion.div
        key="tab-allThemes"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.15 }}
        onScroll={hideCursorTooltip}
        className="flex flex-col p-4 overflow-y-auto flex-1 scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
      >
        <div className="grid grid-cols-2 gap-3.5 pb-8">
          {CHAT_THEMES.map((themeItem) => {
            const isSelected = activeChatThemeId === themeItem.id;
            return (
              <div
                key={themeItem.id}
                onClick={() => handleSelectTheme(themeItem.id)}
                onMouseEnter={(e) => updateCursorTooltip?.(e, themeItem.name)}
                onMouseMove={(e) => updateCursorTooltip?.(e, themeItem.name)}
                onMouseLeave={hideCursorTooltip}
                className={`relative h-[105px] rounded-[20px] overflow-hidden cursor-pointer transition-all duration-200 select-none shadow-md ${isSelected
                    ? "border-2 border-white scale-[1.01] shadow-2xl ring-2 ring-white/10"
                    : "border border-white/10 hover:border-white/30 hover:scale-[1.02]"
                  }`}
                style={{
                  background: themeItem.gradient || themeItem.bgColor,
                  backgroundColor: themeItem.bgColor || "#0b141a",
                  backgroundImage:
                    themeItem.hasDoodles && doodlesEnabled
                      ? "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')"
                      : undefined,
                  backgroundSize: "130px",
                  backgroundBlendMode: "overlay",
                }}
              >
                <div className="absolute top-3 left-3 w-11 h-4 rounded-[5px] bg-[#2a3942]/90 shadow-sm pointer-events-none" />
                <div
                  className="absolute top-7.5 right-3 w-12 h-4 rounded-[5px] shadow-sm pointer-events-none"
                  style={{ backgroundColor: isSelected ? activeBubbleColor : themeItem.bubbleColor }}
                />
                {isSelected && (
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-[#111b21] flex items-center justify-center shadow-lg pointer-events-none">
                    <FaCheck size={11} className="stroke-[1.5]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  if (contactInfoTab === "wallpaper") {
    return (
      <motion.div
        key="tab-wallpaper"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.15 }}
        onScroll={hideCursorTooltip}
        className="flex flex-col pt-3 p-4 overflow-y-auto flex-1 scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
      >
        <div
          onClick={() => setContactInfoTab("solidColour")}
          className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl cursor-pointer transition-colors group select-none shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#111b21] flex items-center justify-center border border-white/10 shadow-sm">
              <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-xs" />
            </div>
            <div className="flex flex-col">
              <span className="text-[14.5px] font-medium text-white">Solid colors</span>
              <span className="text-[12px] text-[#8696a0]">27 solid color wallpapers</span>
            </div>
          </div>
          <MdChevronRight size={19} className="text-[#8696a0] group-hover:text-white transition-colors" />
        </div>

        <div className="flex pt-4 items-center gap-2 mb-3.5 overflow-x-auto scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-4">
          {[
            { id: "all", label: `All (${WALLPAPER_THEMES.length})` },
            { id: "nature", label: `Nature (${NATURE_WALLPAPERS.length})` },
            { id: "dark", label: "Dark & Abstract" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setWallpaperFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-[12.5px] font-medium whitespace-nowrap transition-colors cursor-pointer ${wallpaperFilter === tab.id
                  ? "bg-[#00a884] text-[#111b21] font-semibold"
                  : "bg-white/5 hover:bg-white/10 text-[#8696a0] hover:text-white"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 pb-8">
          {WALLPAPER_THEMES.filter((themeItem) => {
            if (wallpaperFilter === "nature") return Boolean(themeItem.isNature || themeItem.imageUrl);
            if (wallpaperFilter === "dark") return !themeItem.isNature && !themeItem.imageUrl;
            return true;
          }).map((themeItem) => {
            const isSelected = activeChatThemeId === themeItem.id;
            return (
              <div
                key={themeItem.id}
                onClick={() => handleSelectTheme(themeItem.id)}
                onMouseEnter={(e) => updateCursorTooltip?.(e, themeItem.name)}
                onMouseMove={(e) => updateCursorTooltip?.(e, themeItem.name)}
                onMouseLeave={hideCursorTooltip}
                className={`relative h-[126px] rounded-[18px] overflow-hidden cursor-pointer transition-all duration-200 select-none shadow-md ${isSelected
                    ? "border-2 border-white scale-[1.01] shadow-2xl ring-2 ring-white/20"
                    : "border border-white/10 hover:border-white/30 hover:scale-[1.02]"
                  }`}
                style={{
                  backgroundColor: themeItem.bgColor || "#111b21",
                  backgroundImage: themeItem.imageUrl
                    ? `url('${themeItem.thumbnailUrl || themeItem.imageUrl}')`
                    : themeItem.gradient || undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                {!themeItem.imageUrl && themeItem.hasDoodles && (
                  <div
                    className="absolute inset-0 opacity-40 pointer-events-none"
                    style={{
                      backgroundImage:
                        "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                      backgroundSize: "130px",
                      backgroundBlendMode: "overlay",
                    }}
                  />
                )}

                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-7 h-7 rounded-full bg-white text-[#111b21] flex items-center justify-center shadow-2xl">
                      <FaCheck size={12} className="stroke-[1.5]" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  if (contactInfoTab === "solidColour") {
    return (
      <motion.div
        key="tab-solidColour"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.15 }}
        onScroll={hideCursorTooltip}
        className="flex flex-col overflow-y-auto flex-1 scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
      >
        <div className="flex items-center justify-between py-3.5 px-5 border-b border-[#202c33]">
          <div className="flex items-center gap-3">
            <LuSparkles size={20} className="text-[#8696a0]" />
            <span className="text-[15px] font-normal text-white">WhatsApp doodles</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={doodlesEnabled}
            onClick={() => handleToggleDoodles(!doodlesEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${doodlesEnabled ? "bg-[#00a884]" : "bg-[#374248]"
              }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200 ${doodlesEnabled
                  ? "translate-x-5 bg-[#111b21]"
                  : "translate-x-0 bg-[#8696a0]"
                }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3.5 p-4 pb-8">
          {SOLID_COLOUR_THEMES.map((themeItem) => {
            const isSelected = activeChatThemeId === themeItem.id;
            return (
              <div
                key={themeItem.id}
                onClick={() => handleSelectTheme(themeItem.id)}
                onMouseEnter={(e) => updateCursorTooltip?.(e, themeItem.name)}
                onMouseMove={(e) => updateCursorTooltip?.(e, themeItem.name)}
                onMouseLeave={hideCursorTooltip}
                className={`relative h-[105px] rounded-[20px] overflow-hidden cursor-pointer transition-all duration-200 select-none ${isSelected
                    ? "border-2 border-white scale-[1.01] shadow-xl"
                    : "border border-white/10 hover:border-white/30 hover:scale-[1.01]"
                  }`}
                style={{
                  backgroundColor: themeItem.bgColor,
                  backgroundImage:
                    doodlesEnabled
                      ? "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')"
                      : undefined,
                  backgroundSize: "130px",
                  backgroundBlendMode: "overlay",
                }}
              >
                {isSelected && (
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-[#111b21] flex items-center justify-center shadow-lg pointer-events-none">
                    <FaCheck size={11} className="stroke-[1.5]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return null;
};

export default ContactInfoThemeTab;
