import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FaDownload, FaFileAlt, FaExternalLinkAlt } from "react-icons/fa";
import { toast } from "react-toastify";

const FileViewerModal = ({ isOpen, onClose, file, theme = "dark" }) => {
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const isDark = theme === "dark";
  const fileName = file.name || "File";
  const fileUrl = file.url || file.previewUrl || "";
  const isPdf =
    file.type === "pdf" ||
    file.type === "application/pdf" ||
    fileName.toLowerCase().endsWith(".pdf") ||
    fileUrl.toLowerCase().includes(".pdf");
  const isImage =
    file.type === "image" ||
    (typeof file.type === "string" && file.type.startsWith("image/")) ||
    /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(fileName || fileUrl);
  const isVideo =
    file.type === "video" ||
    (typeof file.type === "string" && file.type.startsWith("video/")) ||
    /\.(mp4|webm|mov|mkv)($|\?)/i.test(fileName || fileUrl);
  const isAudio =
    file.type === "audio" ||
    (typeof file.type === "string" && file.type.startsWith("audio/")) ||
    /\.(mp3|wav|ogg|m4a)($|\?)/i.test(fileName || fileUrl);

  const handleDownload = async () => {
    if (!fileUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          throw new Error("CLOUDINARY_RESTRICTED");
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download started");
    } catch (err) {
      console.warn("Direct blob download failed:", err);
      if (err.message === "CLOUDINARY_RESTRICTED") {
        toast.error(
          "Cloudinary is blocking PDF delivery. Please enable 'Allow delivery of PDF and ZIP files' in your Cloudinary Security Settings."
        );
      }
      let downloadUrl = fileUrl;
      if (fileUrl.includes("/upload/")) {
        downloadUrl = fileUrl.replace("/upload/", "/upload/fl_attachment/");
      }
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex flex-col bg-black/90 backdrop-blur-md">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 text-white z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <FaFileAlt size={16} className="text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold truncate leading-tight">
                {fileName}
              </h3>
              {file.size && (
                <p className="text-xs text-white/60 mt-0.5">{file.size}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in new tab"
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <FaExternalLinkAlt size={14} />
              </a>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              title="Download file"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-medium transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {downloading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaDownload size={13} />
              )}
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <RxCross2 size={20} />
            </button>
          </div>
        </div>

        {/* Content viewer body */}
        <div
          className="flex-1 w-full p-2 sm:p-6 flex items-center justify-center overflow-auto"
          onClick={onClose}
        >
          <div
            className="w-full h-full max-w-5xl flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isImage ? (
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={fileUrl}
                alt={fileName}
                className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
              />
            ) : isPdf ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-[82vh] rounded-xl overflow-hidden shadow-2xl bg-white border border-white/10 flex flex-col"
              >
                <iframe
                  src={fileUrl}
                  title={fileName}
                  className="w-full h-full border-none"
                />
              </motion.div>
            ) : isVideo ? (
              <motion.video
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={fileUrl}
                controls
                autoPlay
                className="max-h-[82vh] max-w-full rounded-xl shadow-2xl ring-1 ring-white/10"
              />
            ) : isAudio ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-2xl bg-[#202c33] border border-white/10 text-center max-w-md w-full shadow-2xl"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FaFileAlt size={32} />
                </div>
                <h4 className="text-white font-semibold text-lg mb-2 truncate">
                  {fileName}
                </h4>
                <p className="text-white/60 text-xs mb-6">{file.size}</p>
                <audio src={fileUrl} controls className="w-full" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 sm:p-12 rounded-2xl bg-[#202c33] border border-white/10 text-center max-w-md w-full shadow-2xl"
              >
                <div className="w-24 h-24 mx-auto mb-5 rounded-2xl bg-[#7f66ff]/20 text-[#7f66ff] flex items-center justify-center">
                  <FaFileAlt size={44} />
                </div>
                <h4 className="text-white font-bold text-lg mb-1 truncate">
                  {fileName}
                </h4>
                <p className="text-white/60 text-sm mb-6">{file.size || "Document"}</p>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98 cursor-pointer"
                >
                  <FaDownload size={15} />
                  <span>Download Document</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

export default FileViewerModal;
