import React from "react";
import { FaEye, FaLock } from "react-icons/fa";
import { useChatStore } from "../../../store/chatStore";

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
