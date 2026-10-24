import React, { useState } from "react";
import { FaEye, FaLock } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { FiCopy, FiCheck } from "react-icons/fi";
import { toast } from "react-toastify";
import { useChatStore } from "../../../store/chatStore";
import axiosInstance from "../../../services/url.services";

export const MessageImageContent = ({
  message,
  isUserMessage,
  currentUserId,
  setViewerModalFile,
  renderTimestampAndStatus,
  isWaitingDecryption,
  displayContent,
  searchTerm,
  safeHighlight,
  renderContentWithMentions,
}) => {
  const [aiAnalysis, setAiAnalysis] = useState(message.visionAnalysis || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedAnalysis, setCopiedAnalysis] = useState(false);

  const handleAskMetaAi = async (e) => {
    e.stopPropagation();
    if (aiAnalysis) return;
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const res = await axiosInstance.post("/chat/analyze-image", {
        imageUrl: message.imageOrVideoUrl,
        prompt:
          "Analyze this image thoroughly: identify objects, extract any text/code/tables (OCR), and provide an intelligent explanation.",
      });
      const analysis = res.data?.data?.analysis || res.data?.analysis;
      if (analysis) {
        setAiAnalysis(analysis);
        toast.success("✨ Meta AI finished analyzing image!");
      }
    } catch (err) {
      toast.error("Failed to analyze image with Meta AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenViewer = () => {
    try {
      const allMsgs = useChatStore.getState()?.messages || [];
      const mediaMsgs = allMsgs
        .filter(
          (m) =>
            m &&
            m.imageOrVideoUrl &&
            (m.contentType === "image" || m.contentType === "video")
        )
        .map((m) => {
          const sId = (m.sender?._id || m.sender?.id || m.sender)?.toString();
          return {
            _id: m._id,
            messageId: m._id,
            url: m.imageOrVideoUrl,
            name: m.fileName || (m.contentType === "video" ? "video.mp4" : "image.jpg"),
            type: m.contentType === "video" ? "video/mp4" : "image/jpeg",
            size: m.fileSize,
            createdAt: m.createdAt,
            sender: m.sender,
            isUserMessage: Boolean(currentUserId && sId && sId === currentUserId),
          };
        });

      let idx = mediaMsgs.findIndex(
        (m) => String(m._id || m.messageId) === String(message._id)
      );
      if (idx === -1) {
        mediaMsgs.push({
          _id: message._id,
          messageId: message._id,
          url: message.imageOrVideoUrl,
          name: message.fileName || "image.jpg",
          type: "image/jpeg",
          size: message.fileSize,
          createdAt: message.createdAt,
          sender: message.sender,
          isUserMessage: isUserMessage,
        });
        idx = mediaMsgs.length - 1;
      }

      setViewerModalFile({
        url: message.imageOrVideoUrl,
        name: message.fileName || "image.jpg",
        type: "image",
        size: message.fileSize,
        sender: message.sender,
        createdAt: message.createdAt,
        messageId: message._id,
        isUserMessage: isUserMessage,
        items: mediaMsgs.length > 0 ? mediaMsgs : undefined,
        initialIndex: idx >= 0 ? idx : 0,
      });
    } catch (err) {
      console.error("Error opening image viewer modal:", err);
      setViewerModalFile({
        url: message.imageOrVideoUrl,
        name: message.fileName || "image.jpg",
        type: "image",
        size: message.fileSize,
        sender: message.sender,
        createdAt: message.createdAt,
        messageId: message._id,
        isUserMessage: isUserMessage,
      });
    }
  };

  return (
    <div className="max-w-full">
      <div
        className="relative group/img cursor-pointer inline-block"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenViewer();
        }}
        title="Click to view image"
      >
        <img
          src={message.imageOrVideoUrl}
          alt="img"
          className="rounded-xl w-50 max-w-[200px] sm:max-w-xs md:max-w-sm object-cover ring-1 ring-black/[0.06] transition-transform hover:scale-[1.01]"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 rounded-xl flex items-center justify-center transition-opacity">
          <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium flex items-center gap-1.5 shadow">
            <FaEye size={12} /> View
          </span>
        </div>
        {!message.content && renderTimestampAndStatus(true)}
      </div>
      {message.content && (
        <div className="mt-1.5 text-[14.2px] leading-[19px] select-text">
          {isWaitingDecryption ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] opacity-75 italic select-none py-0.5">
              <FaLock className="shrink-0 text-xs opacity-70" />
              <span>Waiting for this message. This may take a while.</span>
            </span>
          ) : (
            <span className="break-words whitespace-pre-wrap">
              {renderContentWithMentions
                ? renderContentWithMentions(displayContent, searchTerm)
                : (searchTerm
                  ? safeHighlight(displayContent || "", searchTerm)
                  : displayContent)}
            </span>
          )}
          <span className="inline-flex items-center gap-1 float-right translate-y-[3px] ml-2.5 select-none shrink-0 pointer-events-auto">
            {renderTimestampAndStatus(false)}
          </span>
        </div>
      )}
      <div
        className="mt-2 flex flex-col gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {!aiAnalysis ? (
          <button
            type="button"
            onClick={handleAskMetaAi}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 hover:from-cyan-500/25 hover:to-purple-500/25 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-medium transition-all cursor-pointer shadow-2xs group active:scale-95 disabled:opacity-50"
            title="Analyze with Gemini Vision: OCR, explain, or answer questions"
          >
            {isAnalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <span>Meta AI analyzing image...</span>
              </>
            ) : (
              <>
                <HiSparkles className="text-sm text-cyan-500 group-hover:scale-110 transition-transform" />
                <span>✨ Ask Meta AI About This Image</span>
              </>
            )}
          </button>
        ) : (
          <div className="rounded-xl p-2.5 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 border border-cyan-500/30 text-xs shadow-xs space-y-1.5">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1">
              <span className="flex items-center gap-1.5 font-bold text-cyan-600 dark:text-cyan-400 text-[11px] uppercase tracking-wide">
                <HiSparkles className="text-sm" />
                <span>Meta AI Vision Insights</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(aiAnalysis);
                  setCopiedAnalysis(true);
                  setTimeout(() => setCopiedAnalysis(false), 2000);
                  toast.success("Copied analysis to clipboard");
                }}
                className="flex items-center gap-1 text-[10.5px] text-gray-500 dark:text-gray-400 hover:text-cyan-500 cursor-pointer"
              >
                {copiedAnalysis ? (
                  <FiCheck className="text-emerald-500" />
                ) : (
                  <FiCopy />
                )}
                <span>{copiedAnalysis ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <div className="text-[12.5px] leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap select-text max-h-56 overflow-y-auto custom-scrollbar">
              {aiAnalysis}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const MessageVideoContent = ({
  message,
  isUserMessage,
  currentUserId,
  setViewerModalFile,
  renderTimestampAndStatus,
  isWaitingDecryption,
  displayContent,
  searchTerm,
  safeHighlight,
  renderContentWithMentions,
}) => {
  const handleOpenViewer = () => {
    try {
      const allMsgs = useChatStore.getState()?.messages || [];
      const mediaMsgs = allMsgs
        .filter(
          (m) =>
            m &&
            m.imageOrVideoUrl &&
            (m.contentType === "image" || m.contentType === "video")
        )
        .map((m) => {
          const sId = (m.sender?._id || m.sender?.id || m.sender)?.toString();
          return {
            _id: m._id,
            messageId: m._id,
            url: m.imageOrVideoUrl,
            name: m.fileName || (m.contentType === "video" ? "video.mp4" : "image.jpg"),
            type: m.contentType === "video" ? "video/mp4" : "image/jpeg",
            size: m.fileSize,
            createdAt: m.createdAt,
            sender: m.sender,
            isUserMessage: Boolean(currentUserId && sId && sId === currentUserId),
          };
        });

      let idx = mediaMsgs.findIndex(
        (m) => String(m._id || m.messageId) === String(message._id)
      );
      if (idx === -1) {
        mediaMsgs.push({
          _id: message._id,
          messageId: message._id,
          url: message.imageOrVideoUrl,
          name: message.fileName || "video.mp4",
          type: "video/mp4",
          size: message.fileSize,
          createdAt: message.createdAt,
          sender: message.sender,
          isUserMessage: isUserMessage,
        });
        idx = mediaMsgs.length - 1;
      }

      setViewerModalFile({
        url: message.imageOrVideoUrl,
        name: message.fileName || "video.mp4",
        type: "video",
        size: message.fileSize,
        sender: message.sender,
        createdAt: message.createdAt,
        messageId: message._id,
        isUserMessage: isUserMessage,
        items: mediaMsgs.length > 0 ? mediaMsgs : undefined,
        initialIndex: idx >= 0 ? idx : 0,
      });
    } catch (err) {
      setViewerModalFile({
        url: message.imageOrVideoUrl,
        name: message.fileName || "video.mp4",
        type: "video",
        size: message.fileSize,
        sender: message.sender,
        createdAt: message.createdAt,
        messageId: message._id,
        isUserMessage: isUserMessage,
      });
    }
  };

  return (
    <div className="max-w-full">
      <div className="relative rounded-xl overflow-hidden group/vid">
        <video
          src={message.imageOrVideoUrl}
          controls
          className="rounded-xl w-full max-w-[280px] sm:max-w-xs md:max-w-sm ring-1 ring-black/[0.06]"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenViewer();
          }}
          className="absolute top-2 left-2 z-10 px-2 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white text-[11px] font-medium flex items-center gap-1 shadow opacity-0 group-hover/vid:opacity-100 transition-opacity cursor-pointer"
          title="Open video in full viewer"
        >
          <FaEye size={12} /> Full view
        </button>
        {!message.content && (
          <div className="absolute top-2 right-2 pointer-events-auto">
            {renderTimestampAndStatus(true)}
          </div>
        )}
      </div>
      {message.content && (
        <div className="mt-1.5 text-[14.2px] leading-[19px] select-text">
          {isWaitingDecryption ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] opacity-75 italic select-none py-0.5">
              <FaLock className="shrink-0 text-xs opacity-70" />
              <span>Waiting for this message. This may take a while.</span>
            </span>
          ) : (
            <span className="break-words whitespace-pre-wrap">
              {renderContentWithMentions
                ? renderContentWithMentions(displayContent, searchTerm)
                : (searchTerm
                  ? safeHighlight(displayContent || "", searchTerm)
                  : displayContent)}
            </span>
          )}
          <span className="inline-flex items-center gap-1 float-right translate-y-[3px] ml-2.5 select-none shrink-0 pointer-events-auto">
            {renderTimestampAndStatus(false)}
          </span>
        </div>
      )}
    </div>
  );
};

export const MessageStickerContent = ({
  message,
  renderTimestampAndStatus,
}) => {
  return (
    <div className="relative inline-block select-none py-1">
      <img
        src={message.imageOrVideoUrl}
        alt="sticker"
        className="w-32 h-32 sm:w-36 sm:h-36 object-contain pointer-events-none drop-shadow-md"
      />
      <div className="absolute bottom-0 right-0 pointer-events-auto">
        {renderTimestampAndStatus(true)}
      </div>
    </div>
  );
};
