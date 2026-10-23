import React from "react";
import { FaFileAlt, FaEye, FaDownload } from "react-icons/fa";
import { handleDownloadFile } from "./helpers.js";

export const MessageDocumentContent = ({
  message,
  isDark,
  setViewerModalFile,
  downloading,
  setDownloading,
  renderTimestampAndStatus,
}) => {
  return (
    <div className="flex flex-col gap-1 min-w-[230px] max-w-[320px]">
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (message.imageOrVideoUrl) {
            setViewerModalFile({
              url: message.imageOrVideoUrl,
              name: message.fileName || message.content || "document.pdf",
              type: "document",
              size: message.fileSize,
            });
          }
        }}
        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none group/doc ${isDark
          ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"
          : "bg-black/[0.03] border-black/5 hover:bg-black/[0.06]"
          }`}
        title="Click to view or download"
      >
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover/doc:scale-105 transition-transform">
          <FaFileAlt size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate leading-tight">
            {message.fileName || message.content || "Document"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[11px] opacity-60">
              {message.fileSize || "File"}
            </p>
            <span className="text-[11px] text-emerald-400 font-medium opacity-0 group-hover/doc:opacity-100 transition-opacity">
              • View
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {message.imageOrVideoUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewerModalFile({
                  url: message.imageOrVideoUrl,
                  name: message.fileName || message.content || "document.pdf",
                  type: "document",
                  size: message.fileSize,
                });
              }}
              className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-emerald-400 transition-colors cursor-pointer"
              title="View document"
            >
              <FaEye size={14} />
            </button>
          )}
          {message.imageOrVideoUrl && (
            <button
              type="button"
              disabled={downloading}
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadFile(
                  e,
                  message.imageOrVideoUrl,
                  message.fileName || "document.pdf",
                  setDownloading
                );
              }}
              className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              title="Download"
            >
              {downloading ? (
                <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaDownload size={13} className="opacity-80 hover:opacity-100 text-emerald-500" />
              )}
            </button>
          )}
        </div>
      </div>
      {message.content && message.content !== message.fileName && (
        <p className="mt-1 break-words text-[14px] leading-relaxed">
          {message.content}
        </p>
      )}
      <div className="flex items-center justify-end mt-0.5 select-none">
        {renderTimestampAndStatus(false)}
      </div>
    </div>
  );
};

export default MessageDocumentContent;
