import React from "react";
import { FaFileAlt, FaHeadphones, FaVideo, FaEye, FaPlus } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";

const AttachInput = ({
    selectedFiles = [],
    activeFileIndex = 0,
    setActiveFileIndex,
    theme = "dark",
    isStickerMode = false,
    setPreviewModalFile,
    handleClearAllFiles,
    handleRemoveFile,
    fileInputRef,
}) => {
    if (!selectedFiles || selectedFiles.length === 0) return null;

    const activeFile = selectedFiles[activeFileIndex] || selectedFiles[0];
    if (!activeFile) return null;

    return (
        <div
            className={`p-3 border-t flex flex-col gap-2.5 transition-colors ${theme === "dark"
                    ? "bg-[#1f2c33] border-white/10 text-white"
                    : "bg-gray-100 border-gray-200 text-gray-800"
                }`}
        >
            <div className="flex items-center justify-between gap-3">
                <div
                    onClick={() => {
                        if (activeFile) {
                            setPreviewModalFile?.({
                                url: activeFile.previewUrl,
                                name: activeFile.name,
                                type: activeFile.type,
                                size: activeFile.size,
                            });
                        }
                    }}
                    className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                    title="Click to view/open full preview"
                >
                    {activeFile.type === "document" ? (
                        <div className="w-12 h-12 rounded-xl bg-[#7f66ff]/20 text-[#7f66ff] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FaFileAlt size={22} />
                        </div>
                    ) : activeFile.type === "audio" ? (
                        <div className="w-12 h-12 rounded-xl bg-[#f2790f]/20 text-[#f2790f] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FaHeadphones size={22} />
                        </div>
                    ) : activeFile.type === "video" ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                            <video
                                src={activeFile.previewUrl}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <FaVideo className="text-white text-xs" />
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-1 ring-black/10">
                            <img
                                src={activeFile.previewUrl}
                                alt="preview"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {isStickerMode && (
                                <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 rounded text-[8px] font-bold bg-[#02b875] text-white">
                                    Sticker
                                </span>
                            )}
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate max-w-xs sm:max-w-md">
                                {activeFile.name}
                            </p>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
                                {activeFile.type}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs opacity-60 mt-0.5">
                            <span>{activeFile.size}</span>
                            <span>•</span>
                            <span className="text-emerald-500 font-medium group-hover:underline flex items-center gap-1">
                                <FaEye size={11} /> Open preview
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            if (activeFile) {
                                setPreviewModalFile?.({
                                    url: activeFile.previewUrl,
                                    name: activeFile.name,
                                    type: activeFile.type,
                                    size: activeFile.size,
                                });
                            }
                        }}
                        className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-emerald-500 cursor-pointer transition-colors"
                        title="Open full preview"
                    >
                        <FaEye size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={handleClearAllFiles}
                        className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-red-500 cursor-pointer transition-colors"
                        title="Remove all files"
                    >
                        <RxCross2 size={18} />
                    </button>
                </div>
            </div>

            {selectedFiles.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 border-t border-black/5 dark:border-white/5">
                    {selectedFiles.map((item, idx) => (
                        <div
                            key={item.id}
                            onClick={() => setActiveFileIndex?.(idx)}
                            className={`relative group/thumb shrink-0 w-12 h-12 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${activeFileIndex === idx
                                    ? "border-emerald-500 scale-105 shadow-md"
                                    : "border-transparent opacity-70 hover:opacity-100"
                                }`}
                        >
                            {item.type === "image" ? (
                                <img
                                    src={item.previewUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : item.type === "video" ? (
                                <div className="w-full h-full bg-black/40 flex items-center justify-center">
                                    <FaVideo className="text-white text-xs" />
                                </div>
                            ) : item.type === "audio" ? (
                                <div className="w-full h-full bg-[#f2790f]/30 flex items-center justify-center text-[#f2790f]">
                                    <FaHeadphones size={14} />
                                </div>
                            ) : (
                                <div className="w-full h-full bg-[#7f66ff]/30 flex items-center justify-center text-[#7f66ff]">
                                    <FaFileAlt size={16} />
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFile?.(item.id);
                                }}
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow"
                                title="Remove file"
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => fileInputRef?.current?.click()}
                        className="shrink-0 w-12 h-12 rounded-xl border border-dashed border-gray-400 dark:border-white/20 flex flex-col items-center justify-center gap-0.5 hover:border-emerald-500 hover:text-emerald-500 transition-colors cursor-pointer text-xs"
                        title="Add more files"
                    >
                        <FaPlus size={11} />
                        <span className="text-[8px] font-medium">Add</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default AttachInput;