import React from "react";
import { FaCheck, FaPlay, FaStar } from "react-icons/fa";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";

export const ContactMediaTabContent = ({
  items = [],
  isDark,
  selectedItems = [],
  toggleSelectItem,
  handleOpenViewer,
  activeMenu,
  setActiveMenu,
  isMessageStarred,
  starredMessages,
}) => {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {items.map((item) => {
        const isVideo = item.mediaType === "video";
        const itemId = item.messageId || item._id;
        const isSelected = selectedItems.some(
          (i) => (i.messageId || i._id) === itemId
        );
        const isStarred = Boolean(
          item.isStarred ||
          item.starred ||
          isMessageStarred(itemId) ||
          starredMessages?.[itemId]
        );
        const mediaSrc = item.url || item.imageOrVideoUrl;

        return (
          <div
            key={itemId}
            onClick={() => {
              if (selectedItems.length > 0) {
                toggleSelectItem(item);
              } else {
                handleOpenViewer(item);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveMenu({
                item,
                position: {
                  top: e.clientY + 4,
                  left: e.clientX,
                  buttonTop: e.clientY,
                },
              });
            }}
            className={`relative aspect-square rounded-lg overflow-hidden group cursor-pointer select-none transition-all duration-150 ${isDark ? "bg-[#202c33]" : "bg-gray-200"
              } ${isSelected
                ? "border-2 border-[#00a884] ring-2 ring-[#00a884]/40"
                : "border-2 border-transparent hover:border-[#00a884] hover:brightness-105"
              }`}
          >
            {isSelected ? (
              <div
                className="absolute top-1.5 left-1.5 z-20 w-[18px] h-[18px] rounded-[3px] bg-white text-black flex items-center justify-center shadow-md cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelectItem(item);
                }}
              >
                <FaCheck size={10} className="stroke-[1.5]" />
              </div>
            ) : (
              <div
                className={`absolute top-1.5 left-1.5 z-20 transition-all ${selectedItems.length > 0
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
                  }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelectItem(item);
                }}
              >
                <div className="w-[18px] h-[18px] rounded-[3px] border-[1.5px] border-white/80 bg-black/30 backdrop-blur-xs flex items-center justify-center group-hover:border-white hover:border-white transition-all shadow-sm" />
              </div>
            )}

            {!isSelected && (
              <div
                className={`absolute top-1.5 right-1.5 z-20 flex items-center justify-center rounded-full p-1 cursor-pointer transition-all ${(activeMenu?.item?.messageId || activeMenu?.item?._id) === itemId
                  ? "opacity-100 bg-black/70 text-white shadow-md scale-105"
                  : "opacity-0 group-hover:opacity-100 bg-black/40 hover:bg-black/70 text-white shadow-sm"
                  }`}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setActiveMenu((prev) =>
                    (prev?.item?.messageId || prev?.item?._id) === itemId
                      ? null
                      : {
                        item,
                        position: {
                          top: rect.bottom + 4,
                          left: Math.max(10, rect.right - 210),
                          buttonTop: rect.top,
                        },
                      }
                  );
                }}
                title="Menu"
              >
                <MdOutlineKeyboardArrowDown size={18} />
              </div>
            )}

            {isStarred && (
              <div className="absolute bottom-1.5 right-1.5 z-20 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] pointer-events-none">
                <FaStar size={11} className="text-white fill-white" />
              </div>
            )}

            {isVideo ? (
              <video
                src={mediaSrc}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
            ) : (
              <img
                src={mediaSrc}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}

            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center shadow-lg backdrop-blur-xs">
                  <FaPlay size={10} className="ml-0.5" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ContactMediaTabContent;
