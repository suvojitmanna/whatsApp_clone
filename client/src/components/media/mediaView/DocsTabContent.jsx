import React from "react";
import { format } from "date-fns";
import { FaCheck, FaStar } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import {
  getFileIcon,
  formatDocSize,
  getAttachedMessage,
  getSenderDisplay,
} from "./helpers";

export const DocsTabContent = ({
  items = [],
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
  handleDownloadFile,
}) => {
  return (
    <div className="space-y-1.5">
      {items.map((item, index) => {
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
        const docName = item.docName || item.fileName || "Document";
        const iconInfo = getFileIcon(docName);
        const IconComponent = iconInfo.icon;
        const docUrl = item.docUrl || item.fileUrl || item.url;
        const sizeStr = formatDocSize(item.fileSize);
        const dateDisplay = item.createdAt
          ? format(new Date(item.createdAt), "dd/MM/yyyy")
          : "";
        const attachedMessage = getAttachedMessage(item);
        const senderName = item.sender?.username || getSenderDisplay(item) || "Unknown";

        return (
          <React.Fragment key={itemId}>
            <div
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
                    left: Math.max(10, Math.min(window.innerWidth - 220, e.clientX - 100)),
                    buttonTop: e.clientY,
                  },
                });
              }}
              className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer group select-none border ${isSelected
                ? isDark
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-gray-100 border-gray-300 text-gray-900"
                : isDark
                  ? "bg-transparent hover:bg-[#202c33] border-transparent hover:border-white/15 text-white"
                  : "bg-transparent hover:bg-[#f0f2f5] border-transparent hover:border-gray-200 text-gray-900"
                }`}
            >
              <div className="w-[45%] sm:w-[40%] flex items-center gap-3 min-w-0 pr-3">
                <div
                  className={`shrink-0 transition-opacity duration-150 ${isSelectMode || isSelected
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
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
                        } flex items-center justify-center font-bold shadow-md`}
                    >
                      <FaCheck size={11} className="stroke-[2]" />
                    </div>
                  ) : (
                    <div
                      className={`w-[19px] h-[19px] rounded-[4px] border-[1.8px] ${isDark
                        ? "border-[#8696a0]/70 bg-black/20 group-hover:border-white hover:border-white"
                        : "border-gray-400 bg-white group-hover:border-gray-600 hover:border-gray-600"
                        } transition-colors`}
                    />
                  )}
                </div>

                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconInfo.bg} ${iconInfo.color} shadow-xs`}
                >
                  <IconComponent size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <h4
                    className={`text-[13.5px] sm:text-[14px] font-medium truncate leading-tight ${isDark ? "text-white" : "text-gray-900"
                      }`}
                    title={docName}
                  >
                    {docName}
                  </h4>
                  <div
                    className={`flex items-center gap-2 text-[11.5px] mt-0.5 ${isDark ? "text-[#8696a0]" : "text-gray-500"
                      }`}
                  >
                    {sizeStr && <span>{sizeStr}</span>}
                    {sizeStr && iconInfo.label && (
                      <span className="opacity-40">•</span>
                    )}
                    {iconInfo.label && (
                      <span className="uppercase font-semibold tracking-wider text-[10px]">
                        {iconInfo.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-[20%] sm:w-[35%] hidden sm:flex items-center min-w-0 px-2">
                <span
                  className={`text-[12.5px] truncate ${attachedMessage
                    ? isDark
                      ? "text-[#d1d7db]"
                      : "text-gray-700"
                    : isDark
                      ? "text-[#8696a0]/40"
                      : "text-gray-400"
                    }`}
                  title={attachedMessage || ""}
                >
                  {attachedMessage || "—"}
                </span>
              </div>

              <div className="w-[35%] sm:w-[25%] flex items-center justify-end gap-2 shrink-0">
                <div className="flex flex-col items-end min-w-0 max-w-[120px] sm:max-w-[140px]">
                  <span
                    className={`text-[12.5px] font-medium truncate w-full text-right ${isDark ? "text-[#e9edef]" : "text-gray-800"
                      }`}
                    title={senderName}
                  >
                    {senderName}
                  </span>
                  {dateDisplay && (
                    <div
                      className={`flex items-center gap-1 text-[11px] mt-0.5 ${isDark ? "text-[#8696a0]" : "text-gray-500"
                        }`}
                    >
                      {isStarred && (
                        <FaStar
                          size={10}
                          className={`${isDark ? "text-white/80" : "text-gray-600"
                            } shrink-0`}
                        />
                      )}
                      <span>{dateDisplay}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDownloadFile(e, docUrl, docName)}
                  className={`p-2 rounded-full transition-colors ${isDark
                    ? "hover:bg-white/10 text-[#8696a0] hover:text-white"
                    : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                    }`}
                  title="Download"
                >
                  <FiDownload size={16} />
                </button>

                {!isSelectMode && (
                  <div
                    className={`p-1.5 rounded-full cursor-pointer transition-all ${(activeMenu?.item?.messageId || activeMenu?.item?._id) === itemId
                      ? "opacity-100 bg-black/40 text-white shadow-md scale-105"
                      : isDark
                        ? "opacity-0 group-hover:opacity-100 hover:bg-black/20 text-[#8696a0] hover:text-white"
                        : "opacity-0 group-hover:opacity-100 hover:bg-gray-100 text-gray-500 hover:text-gray-800"
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
              </div>
            </div>
            {index < items.length - 1 && (
              <div
                className={`border-b ${isDark ? "border-[#222d34]" : "border-gray-200"
                  } my-2 mx-1`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default DocsTabContent;
