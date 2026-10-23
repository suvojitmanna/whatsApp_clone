import React from "react";
import { format } from "date-fns";
import { FaCheck, FaStar, FaFilePdf } from "react-icons/fa";
import { MdOutlineKeyboardArrowDown, MdDoneAll } from "react-icons/md";
import { LuForward } from "react-icons/lu";
import { formatDocSize } from "../mediaView/helpers";

export const ContactDocsTabContent = ({
  items = [],
  isDark,
  selectedItems = [],
  toggleSelectItem,
  handleOpenViewer,
  activeMenu,
  setActiveMenu,
  isMessageStarred,
  starredMessages,
  user,
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
        const docName = item.docName || item.fileName || "Document.pdf";
        const sizeStr = formatDocSize(item.fileSize);
        const isForwarded = item.isForwarded || item.forwarded;
        const dateDisplay = item.createdAt
          ? format(new Date(item.createdAt), "dd/MM/yyyy")
          : "";

        return (
          <React.Fragment key={itemId}>
            <div
              onClick={() => {
                if (selectedItems.length > 0) {
                  toggleSelectItem(item);
                } else {
                  handleOpenViewer(item);
                }
              }}
              onContextMenu={(e) => {
                if (selectedItems.length > 0) return;
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
              className={`w-full rounded-xl p-2.5 transition-all duration-150 cursor-pointer relative select-none border group ${isSelected
                ? isDark
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-gray-100 border-gray-300 text-gray-900"
                : isDark
                  ? "bg-transparent hover:bg-[#202c33] border-transparent hover:border-white/15 text-white"
                  : "bg-transparent hover:bg-[#f0f2f5] border-transparent hover:border-gray-200 text-gray-900"
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

              {isForwarded && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#8696a0] italic mb-1.5 px-0.5">
                  <LuForward size={13} className="text-[#8696a0]" />
                  <span>Forwarded</span>
                </div>
              )}

              {item.hasPreview ? (
                <div
                  className={`w-full h-24 rounded-lg mb-2 p-2.5 flex flex-col justify-between border ${isDark
                    ? "bg-[#182229] border-white/5"
                    : "bg-gray-50 border-gray-200"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold tracking-wider uppercase text-red-500">
                      PDF
                    </span>
                    <span className="text-[9px] text-[#8696a0]">
                      {item.pageCount || 1} of {item.pageCount || 1}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 mx-auto my-0.5 rounded-full border flex items-center justify-center text-[7px] font-serif font-bold ${isDark ? "border-white/20 text-[#8696a0]" : "border-gray-400 text-gray-500"
                      }`}
                  >
                    ★
                  </div>
                  <div
                    className={`text-[8.5px] font-medium tracking-tight ${isDark ? "text-[#8696a0]" : "text-gray-600"
                      }`}
                  >
                    {docName.replace(/\.pdf$/i, "")}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                {isSelected ? (
                  <div
                    className="cursor-pointer shrink-0"
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
                    className={`cursor-pointer shrink-0 transition-opacity duration-150 ${selectedItems.length > 0
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

                <div className="w-8 h-9 rounded-[3px] bg-[#e53935] text-white flex flex-col items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                  <FaFilePdf size={15} />
                  <span className="text-[7px] font-black tracking-tight mt-0.5">
                    PDF
                  </span>
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <span
                    className={`text-[14px] font-medium truncate leading-snug ${isDark ? "text-white" : "text-gray-900"
                      }`}
                  >
                    {docName}
                  </span>
                  <span className="text-[12px] text-[#8696a0] mt-0.5 truncate">
                    {item.pageCount || item.pages
                      ? `${item.pageCount || item.pages} pages • `
                      : ""}
                    PDF • {sizeStr || "810 kB"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 mt-1 text-[11px] text-[#8696a0]">
                {isStarred && (
                  <FaStar
                    size={10}
                    className={`${isDark ? "text-white/80" : "text-gray-500"} shrink-0`}
                  />
                )}
                <span>{dateDisplay}</span>
                {isOutgoing && (
                  <MdDoneAll size={15} className="text-[#53bdeb] ml-0.5" />
                )}
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

export default ContactDocsTabContent;
