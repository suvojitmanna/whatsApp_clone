import React from "react";
import { FaCheck, FaPlay, FaStar, FaVideo, FaCamera } from "react-icons/fa";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import VideoThumbnail from "./VideoThumbnail";
import { getSenderDisplay, getAttachedMessage } from "./helpers";

export const MediaTabContent = ({
  items = [],
  mode,
  isDark,
  selectedItems = [],
  isSelectMode,
  setIsSelectMode,
  toggleSelectItem,
  handleOpenViewer,
  activeMenu,
  setActiveMenu,
  isMessageStarred,
  starredMessages,
}) => {
  return (
    <div
      className={`grid ${mode === "modal"
        ? "grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4"
        : "grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5"
        } gap-2 sm:gap-2.5`}
    >
      {items.map((item) => {
        const isVideo = item.mediaType === "video";
        const itemId = item.messageId || item._id;
        const isSelected = selectedItems.some(
          (i) => (i.messageId || i._id) === itemId
        );
        const isStarred = Boolean(
          item.isStarred ||
          item.starred ||
          (isMessageStarred && isMessageStarred(itemId)) ||
          starredMessages?.[itemId]
        );
        const senderDisplay = getSenderDisplay(item);
        const attachedMessage = getAttachedMessage(item);
        const hoverText = attachedMessage || (isVideo ? "Video" : "Photo");

        return (
          <div
            key={itemId}
            onClick={() => {
              if (isSelectMode) {
                toggleSelectItem(item);
              } else {
                handleOpenViewer(item);
              }
            }}
            onContextMenu={(e) => {
              if (isSelectMode) return;
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
            title={hoverText}
            className={`relative aspect-square rounded-lg overflow-hidden group cursor-pointer transition-all duration-200 select-none shadow-xs border-2 ${isDark ? "bg-[#202c33]" : "bg-gray-200"
              } ${isSelected
                ? "border-[#00a884] ring-2 ring-[#00a884]/40 brightness-95"
                : "border-transparent hover:border-[#00a884] hover:brightness-105"
              }`}
          >
            <div
              className={`absolute top-2 left-2 z-20 transition-all ${isSelectMode || isSelected
                ? "opacity-100 scale-100"
                : "opacity-0 group-hover:opacity-100 scale-100"
                }`}
              onClick={(e) => {
                e.stopPropagation();
                if (!isSelectMode) setIsSelectMode(true);
                toggleSelectItem(item);
              }}
            >
              {isSelected ? (
                <div
                  className={`w-[19px] h-[19px] rounded-[4px] ${isDark ? "bg-white text-black" : "bg-[#111b21] text-white"
                    } flex items-center justify-center font-bold shadow-md transition-transform active:scale-90`}
                >
                  <FaCheck size={11} className="stroke-[2]" />
                </div>
              ) : (
                <div className="w-[19px] h-[19px] rounded-[4px] border-[1.8px] border-white/85 bg-black/35 backdrop-blur-xs flex items-center justify-center group-hover:border-white hover:border-white transition-all active:scale-90" />
              )}
            </div>

            {!isSelectMode && (
              <div
                className={`absolute top-1 right-1 z-20 flex items-center justify-center rounded-full border p-1 cursor-pointer transition-all ${(activeMenu?.item?.messageId || activeMenu?.item?._id) === itemId
                  ? "opacity-100 bg-black/50 backdrop-blur-xs border-white/25 text-white shadow-md scale-105"
                  : "opacity-0 group-hover:opacity-100 border-transparent hover:bg-black/30 hover:backdrop-blur-xs hover:border-white/10 text-white"
                  }`}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setActiveMenu(
                    (activeMenu?.item?.messageId || activeMenu?.item?._id) === itemId
                      ? null
                      : {
                        item,
                        position: {
                          top: rect.bottom + 4,
                          left: rect.right - 210,
                          buttonTop: rect.top,
                        },
                      }
                  );
                }}
                title="Menu"
              >
                <MdOutlineKeyboardArrowDown size={20} />
              </div>
            )}

            {isVideo ? (
              <VideoThumbnail
                src={item.url || item.imageOrVideoUrl}
                item={item}
              />
            ) : (
              <div className="relative w-full h-full overflow-hidden rounded-xl group">
                <img
                  src={item.url || item.imageOrVideoUrl}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-fill transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute inset-y-0 -left-[150%] w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/40 to-transparent backdrop-blur-[2px] opacity-0 transition-all duration-700 ease-in-out group-hover:left-[150%] group-hover:opacity-100" />
                </div>
              </div>
            )}

            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center shadow-lg backdrop-blur-xs group-hover:scale-110 transition-transform">
                  <FaPlay size={11} className="ml-0.5" />
                </div>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 p-2 sm:p-2.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end text-white pointer-events-none">
              <div className="flex items-center justify-between w-full min-w-0">
                {senderDisplay && (
                  <span className="text-[11.5px] sm:text-[12px] font-medium truncate text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] leading-tight">
                    {senderDisplay}
                  </span>
                )}
                {isStarred && (
                  <div className="shrink-0 ml-auto pl-1.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] flex items-center">
                    <FaStar size={11} className="text-white fill-white" />
                  </div>
                )}
              </div>

              <div className="grid grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100 transition-all duration-200">
                <div className="overflow-hidden">
                  {attachedMessage ? (
                    <p className="text-[11.5px] sm:text-[12px] font-medium text-white line-clamp-2 leading-tight drop-shadow-md mt-1">
                      {attachedMessage}
                    </p>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/90 drop-shadow-md mt-1">
                      {isVideo ? <FaVideo size={9} /> : <FaCamera size={9} />}
                      <span>{isVideo ? "Video" : "Photo"}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MediaTabContent;
