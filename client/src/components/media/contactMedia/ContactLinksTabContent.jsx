import React from "react";
import { format } from "date-fns";
import { FaCheck, FaStar } from "react-icons/fa";
import { MdOutlineKeyboardArrowDown, MdDoneAll, MdChevronRight } from "react-icons/md";

export const ContactLinksTabContent = ({
  items = [],
  isDark,
  selectedItems = [],
  toggleSelectItem,
  activeMenu,
  setActiveMenu,
  isMessageStarred,
  starredMessages,
  user,
  contact,
}) => {
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
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
        const isOutgoing =
          item.isOutgoing ||
          item.sender?._id === user?._id ||
          item.sender === "You";
        const dateDisplay = item.createdAt
          ? format(new Date(item.createdAt), "dd/MM/yyyy")
          : "04/10/2026";
        const timeDisplay = item.createdAt
          ? format(new Date(item.createdAt), "HH:mm")
          : "17:10";
        const otherPartyName =
          contact?.username || contact?.fullName || "Contact";

        return (
          <React.Fragment key={itemId}>
            <div
              className="select-none group"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveMenu({
                  item,
                  position: {
                    top: e.clientY + 4,
                    left: Math.max(10, Math.min(window.innerWidth - 220, e.clientX - 100)),
                    buttonTop: e.clientY,
                  },
                });
              }}
            >
              <div
                onClick={() => {
                  if (selectedItems.length > 0) {
                    toggleSelectItem(item);
                  }
                }}
                className={`flex items-center justify-between px-1 py-1 text-[12px] cursor-pointer transition-colors ${isDark
                  ? "text-[#8696a0] hover:text-[#e9edef]"
                  : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.sender?.profilePicture ? (
                    <img
                      src={item.sender.profilePicture}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#e53935] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {isOutgoing
                        ? "Y"
                        : item.sender?.username?.[0]?.toUpperCase() || "S"}
                    </div>
                  )}

                  <span
                    className={`text-[13px] font-medium truncate ${isDark ? "text-[#e9edef]" : "text-gray-900"
                      }`}
                  >
                    {isOutgoing
                      ? `You ▸ ${otherPartyName}`
                      : `${item.sender?.username || otherPartyName} ▸ You`}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-[12px]">
                  <span>{dateDisplay}</span>
                  <MdChevronRight size={16} />
                </div>
              </div>

              <div
                onClick={() => {
                  if (selectedItems.length > 0) {
                    toggleSelectItem(item);
                  }
                }}
                className={`w-full rounded-xl p-2.5 transition-all duration-150 relative border select-none ${isSelected
                  ? isDark
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-gray-100 border-gray-300 text-gray-900"
                  : isDark
                    ? "bg-[#202c33]/70 hover:bg-[#202c33] border-transparent hover:border-white/15 text-white"
                    : "bg-white hover:bg-gray-50 border-gray-200 text-gray-900 shadow-xs"
                  }`}
              >
                {!isSelected && (
                  <div
                    className={`absolute top-2 right-2 z-20 flex items-center justify-center rounded-full p-1 cursor-pointer transition-all ${(activeMenu?.item?.messageId || activeMenu?.item?._id) === itemId
                      ? isDark
                        ? "opacity-100 bg-black/40 text-white shadow-md scale-105"
                        : "opacity-100 bg-gray-200 text-gray-900 shadow-md scale-105"
                      : isDark
                        ? "opacity-0 group-hover:opacity-100 hover:bg-white/10 text-[#8696a0] hover:text-white"
                        : "opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-[#54656f] hover:text-[#111b21]"
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

                <div className="flex items-start gap-3">
                  {isSelected ? (
                    <div
                      className="pt-2 cursor-pointer shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(item);
                      }}
                    >
                      <div
                        className={`w-[18px] h-[18px] rounded-[3px] ${isDark ? "bg-white text-black" : "bg-[#111b21] text-white"
                          } flex items-center justify-center shadow-sm`}
                      >
                        <FaCheck size={10} className="stroke-[2]" />
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`pt-2 cursor-pointer shrink-0 transition-opacity duration-150 ${selectedItems.length > 0
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(item);
                      }}
                    >
                      <div
                        className={`w-[18px] h-[18px] rounded-[3px] border-[1.8px] ${isDark
                          ? "border-[#8696a0]/70 bg-black/20 group-hover:border-white hover:border-white"
                          : "border-gray-400 bg-white group-hover:border-gray-600 hover:border-gray-600"
                          } transition-colors`}
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div
                      className={`rounded-lg p-2.5 space-y-1 border ${isDark
                        ? "bg-[#111b21]/80 border-transparent group-hover:border-white/10"
                        : "bg-gray-100/90 border-gray-200/60"
                        }`}
                    >
                      <div
                        className={`text-[13.5px] font-bold truncate ${isDark ? "text-[#e9edef]" : "text-gray-900"
                          }`}
                      >
                        {item.domain || "live-classes.vercel.app"}
                      </div>
                      <div className="text-[12px] text-[#8696a0] line-clamp-2 break-all leading-snug">
                        {item.url}
                      </div>
                      <div className="text-[11px] text-[#8696a0] pt-0.5">
                        {item.domain || "live-classes.vercel.app"}
                      </div>
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (selectedItems.length > 0) e.preventDefault();
                      }}
                      className={`underline text-[13px] break-all block mt-2 font-normal transition-colors ${isDark
                        ? "text-[#53bdeb] hover:text-[#7fd2f5]"
                        : "text-blue-600 hover:text-blue-800"
                        }`}
                    >
                      {item.url}
                    </a>

                    <div className="flex items-center justify-end gap-1 mt-1 text-[11px] text-[#8696a0]">
                      {isStarred && (
                        <FaStar
                          size={10}
                          className={`${isDark ? "text-white/80" : "text-gray-500"
                            } shrink-0`}
                        />
                      )}
                      <span>{timeDisplay}</span>
                      {isOutgoing && (
                        <MdDoneAll size={15} className="text-[#53bdeb] ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {index < items.length - 1 && (
              <div
                className={`border-b ${isDark ? "border-[#222d34]" : "border-gray-200"
                  } my-2.5 mx-1`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ContactLinksTabContent;
