import React from "react";
import { motion } from "framer-motion";
import {
  FaCamera,
  FaVideo,
  FaHeadphones,
  FaFileAlt,
} from "react-icons/fa";
import { FaSquarePollHorizontal } from "react-icons/fa6";
import { RiContactsFill } from "react-icons/ri";
import {
  MdEventNote,
  MdOutlineCall,
  MdOutlineVideocam,
} from "react-icons/md";
import { ProhibitedIcon } from "../../components/common/Icons";

export const renderFormattedWhatsAppText = (text) => {
  if (!text || typeof text !== "string") return text;
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const regex = /(```[^`]+```|\*[^*]+\*|_[^_]+_|~[^~]+~)/g;
    const parts = line.split(regex);

    return (
      <React.Fragment key={lineIdx}>
        {parts.map((part, partIdx) => {
          if (!part) return null;
          if (part.startsWith("```") && part.endsWith("```") && part.length >= 6) {
            return (
              <code
                key={partIdx}
                className="font-mono text-[12px] bg-black/20 dark:bg-white/10 px-1 py-0.5 rounded"
              >
                {part.slice(3, -3)}
              </code>
            );
          }
          if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
            return (
              <strong
                key={partIdx}
                className="font-semibold text-white dark:text-white"
              >
                {part.slice(1, -1)}
              </strong>
            );
          }
          if (part.startsWith("_") && part.endsWith("_") && part.length >= 2) {
            return (
              <em key={partIdx} className="italic opacity-90">
                {part.slice(1, -1)}
              </em>
            );
          }
          if (part.startsWith("~") && part.endsWith("~") && part.length >= 2) {
            return (
              <del key={partIdx} className="line-through opacity-70">
                {part.slice(1, -1)}
              </del>
            );
          }
          return <span key={partIdx}>{part}</span>;
        })}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

export const ChatHoverPreview = ({
  contact,
  lastMsg,
  coords,
  theme,
  currentUserId,
}) => {
  if (!contact || !coords || !lastMsg) return null;

  const isDark = theme === "dark";
  let pollData = lastMsg?.pollData;
  if (typeof pollData === "string") {
    try {
      pollData = JSON.parse(pollData);
    } catch {
      pollData = null;
    }
  }
  const hasRealPollData = Boolean(
    pollData &&
    (pollData.question || (Array.isArray(pollData.options) && pollData.options.length > 0))
  );

  let eventData = lastMsg?.eventData;
  if (typeof eventData === "string") {
    try {
      eventData = JSON.parse(eventData);
    } catch {
      eventData = null;
    }
  }
  const hasRealEventData = Boolean(
    eventData &&
    (eventData.title || eventData.name || eventData.startDate || eventData.location)
  );

  let contactData = lastMsg?.contactData;
  if (typeof contactData === "string") {
    try {
      contactData = JSON.parse(contactData);
    } catch {
      contactData = null;
    }
  }
  const hasRealContactData = Boolean(
    contactData &&
    (contactData.name || contactData.phoneNumber || contactData.email)
  );

  let callData = lastMsg?.callData;
  if (typeof callData === "string") {
    try {
      callData = JSON.parse(callData);
    } catch {
      callData = null;
    }
  }
  const hasRealCallData = Boolean(
    callData &&
    (callData.callType || callData.duration || callData.status || callData.direction)
  );

  const isDeleted = Boolean(
    lastMsg?.deletedForEveryone ||
    (currentUserId &&
      Array.isArray(lastMsg?.deletedFor) &&
      lastMsg.deletedFor.some((id) => String(id) === String(currentUserId))) ||
    lastMsg?.content === "This message was deleted" ||
    lastMsg?.content === "You deleted this message"
  );

  const isLastMsgFromMe = Boolean(
    currentUserId &&
    (lastMsg?.sender?._id || lastMsg?.sender) &&
    String(lastMsg?.sender?._id || lastMsg?.sender) === String(currentUserId)
  );

  const isPoll = Boolean(
    lastMsg?.contentType === "poll" ||
    hasRealPollData ||
    lastMsg?.poll ||
    (typeof lastMsg?.content === "string" && lastMsg.content.startsWith("Poll:"))
  );

  const isImage = Boolean(
    !isPoll &&
    (lastMsg?.contentType === "image" ||
      lastMsg?.contentType === "photo" ||
      lastMsg?.content === "Photo" ||
      (typeof lastMsg?.content === "string" &&
        lastMsg.content.startsWith("Photo:")) ||
      (!lastMsg?.contentType &&
        lastMsg?.imageOrVideoUrl &&
        !lastMsg.imageOrVideoUrl.match(
          /\.(mp4|webm|mov|mkv|mp3|wav|ogg|m4a|aac|pdf|docx?|xlsx?|pptx?|txt|zip)($|\?)/i
        ) &&
        !lastMsg.imageOrVideoUrl.includes("stickers")))
  );

  const isVideo = Boolean(
    !isPoll &&
    (lastMsg?.contentType === "video" ||
      lastMsg?.content === "Video" ||
      (typeof lastMsg?.content === "string" &&
        lastMsg.content.startsWith("Video:")) ||
      (!lastMsg?.contentType &&
        lastMsg?.imageOrVideoUrl &&
        lastMsg.imageOrVideoUrl.match(/\.(mp4|webm|mov|mkv)($|\?)/i)))
  );

  const isSticker = Boolean(
    !isPoll &&
    (lastMsg?.contentType === "sticker" ||
      lastMsg?.stickerUrl ||
      (lastMsg?.imageOrVideoUrl &&
        lastMsg.imageOrVideoUrl.includes("stickers")))
  );

  const isAudio = Boolean(
    !isPoll &&
    (lastMsg?.contentType === "audio" ||
      lastMsg?.audioUrl ||
      lastMsg?.content === "Voice message" ||
      (typeof lastMsg?.content === "string" &&
        lastMsg.content.startsWith("Audio:")) ||
      (!lastMsg?.contentType &&
        lastMsg?.imageOrVideoUrl &&
        lastMsg.imageOrVideoUrl.match(/\.(mp3|wav|ogg|m4a|aac)($|\?)/i)))
  );

  const isDoc = Boolean(
    !isPoll &&
    (lastMsg?.contentType === "document" ||
      lastMsg?.contentType === "file" ||
      lastMsg?.fileName ||
      lastMsg?.fileUrl ||
      (typeof lastMsg?.content === "string" &&
        lastMsg.content.startsWith("Document:")) ||
      (!lastMsg?.contentType &&
        lastMsg?.imageOrVideoUrl &&
        lastMsg.imageOrVideoUrl.match(
          /\.(pdf|docx?|xlsx?|pptx?|txt|zip)($|\?)/i
        )))
  );

  const isEvent = Boolean(
    !isPoll &&
    (lastMsg?.contentType === "event" ||
      hasRealEventData ||
      (typeof lastMsg?.content === "string" &&
        (lastMsg.content.startsWith("Event:") ||
          lastMsg.content.startsWith("Cancelled event:"))))
  );

  const isContact = Boolean(
    !isPoll &&
    (lastMsg?.contentType === "contact" ||
      hasRealContactData ||
      (typeof lastMsg?.content === "string" &&
        lastMsg.content.startsWith("Contact:")))
  );

  const isCall = Boolean(
    !isPoll &&
    (lastMsg?.contentType === "call" ||
      hasRealCallData ||
      (typeof lastMsg?.content === "string" &&
        (lastMsg.content.startsWith("Voice call") ||
          lastMsg.content.startsWith("Video call"))))
  );

  const photoUrl =
    lastMsg?.imageOrVideoUrl ||
    lastMsg?.imageUrl ||
    lastMsg?.mediaUrl ||
    lastMsg?.url;

  const videoUrl =
    lastMsg?.imageOrVideoUrl ||
    lastMsg?.videoUrl ||
    lastMsg?.mediaUrl ||
    lastMsg?.url;

  const stickerUrl =
    lastMsg?.imageOrVideoUrl ||
    lastMsg?.stickerUrl ||
    lastMsg?.url;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      style={{
        position: "fixed",
        left: `${coords.left}px`,
        top: `${coords.top}px`,
        maxWidth: "min(580px, calc(100vw - 32px))",
        minWidth: "",
        zIndex: 99999,
        pointerEvents: "none",
      }}
      className={`rounded-xl border p-3 shadow-2xl transition-colors select-none text-[13px] leading-[18.5px] break-words ${isDark
        ? "bg-[#182229] text-[#e9edef] border-[#3b4a54] shadow-[0_8px_32px_rgba(0,0,0,0.65)]"
        : "bg-white text-[#111b21] border-[#d1d7db] shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
        }`}
    >
      {(() => {
        if (isDeleted) {
          return (
            <div className="flex items-center gap-2 text-xs italic opacity-80">
              <ProhibitedIcon size={14} className="shrink-0" />
              <span>
                {isLastMsgFromMe
                  ? "You deleted this message"
                  : "This message was deleted"}
              </span>
            </div>
          );
        }

        if (lastMsg?.isViewOnce) {
          return (
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full border border-emerald-400 text-[11px] font-bold text-emerald-400 shrink-0">
                1
              </span>
              <span className="font-semibold text-emerald-400">View once message</span>
            </div>
          );
        }

        if (isPoll) {
          const pollQuestion =
            pollData?.question ||
            (typeof lastMsg.content === "string"
              ? lastMsg.content.replace(/^Poll:\s*/, "")
              : "Poll");
          const pollOptions = pollData?.options || [];
          const allowMultiple = Boolean(pollData?.allowMultiple);
          const totalVotes = pollOptions.reduce(
            (acc, o) => acc + (Array.isArray(o?.votes) ? o.votes.length : 0),
            0
          );

          return (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <FaSquarePollHorizontal size={14} />
                <span>Poll: {pollQuestion}</span>
              </div>
              <div className="space-y-1 pl-2 pt-0.5">
                {pollOptions.map((opt, idx) => {
                  const text =
                    typeof opt === "string"
                      ? opt
                      : opt?.text || `Option ${idx + 1}`;
                  const votes = Array.isArray(opt?.votes)
                    ? opt.votes.length
                    : 0;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 text-xs opacity-90"
                    >
                      <span className="truncate">• {text}</span>
                      {votes > 0 && (
                        <span className="text-[11px] font-semibold text-emerald-400 shrink-0">
                          {votes} vote{votes === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] opacity-70 pt-0.5">
                {totalVotes} vote{totalVotes === 1 ? "" : "s"} total •{" "}
                {allowMultiple ? "Multiple answers" : "Single answer"}
              </div>
            </div>
          );
        }

        if (isImage) {
          const caption =
            lastMsg.content &&
              lastMsg.content !== "Photo" &&
              !lastMsg.content.startsWith("http")
              ? lastMsg.content.replace(/^Photo:\s*/, "")
              : "";

          return (
            <div className="space-y-2">
              {photoUrl && (
                <div className="rounded-md overflow-hidden max-h-[220px] bg-black/20 flex items-center justify-center border border-white/10">
                  <img
                    src={photoUrl}
                    alt="Photo preview"
                    className="w-full h-auto max-h-[220px] object-cover rounded-md"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
              {caption ? (
                <div className="whitespace-pre-wrap select-text">
                  {renderFormattedWhatsAppText(caption)}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 font-medium opacity-90">
                  <FaCamera size={13} />
                  <span>Photo</span>
                </div>
              )}
            </div>
          );
        }

        if (isVideo) {
          const caption =
            lastMsg.content &&
              lastMsg.content !== "Video" &&
              !lastMsg.content.startsWith("http")
              ? lastMsg.content.replace(/^Video:\s*/, "")
              : "";

          return (
            <div className="space-y-2">
              {videoUrl && (
                <div className="rounded-md overflow-hidden max-h-[200px] bg-black/30 flex items-center justify-center border border-white/10">
                  <video
                    src={videoUrl}
                    className="w-full h-auto max-h-[200px] object-cover rounded-md pointer-events-none"
                    muted
                    preload="metadata"
                  />
                </div>
              )}
              {caption ? (
                <div className="whitespace-pre-wrap select-text">
                  {renderFormattedWhatsAppText(caption)}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 font-medium opacity-90">
                  <FaVideo size={13} />
                  <span>Video</span>
                </div>
              )}
            </div>
          );
        }

        if (isSticker) {
          return (
            <div className="flex items-center gap-2">
              {stickerUrl && (
                <img
                  src={stickerUrl}
                  alt="Sticker"
                  className="w-16 h-16 object-contain"
                />
              )}
              <span className="opacity-90 font-medium">Sticker</span>
            </div>
          );
        }

        if (isAudio) {
          return (
            <div className="flex items-center gap-2">
              <FaHeadphones size={14} className="text-emerald-400 shrink-0" />
              <span className="font-medium">Voice message</span>
            </div>
          );
        }

        if (isDoc) {
          const docName =
            lastMsg.fileName ||
            (typeof lastMsg.content === "string" &&
              lastMsg.content.startsWith("Document:")
              ? lastMsg.content.replace(/^Document:\s*/, "")
              : lastMsg.content) ||
            "Document";

          return (
            <div className="flex items-center gap-2">
              <FaFileAlt size={14} className="text-indigo-400 shrink-0" />
              <span className="font-medium truncate">{docName}</span>
            </div>
          );
        }

        if (isContact) {
          const name =
            contactData?.name ||
            (typeof lastMsg.content === "string"
              ? lastMsg.content.replace(/^Contact:\s*/, "")
              : "Contact");

          return (
            <div className="flex items-center gap-2.5">
              <RiContactsFill size={16} className="text-cyan-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold">{name}</span>
                {contactData?.phoneNumber && (
                  <span className="block text-xs opacity-75 mt-0.5">
                    {contactData.phoneNumber}
                  </span>
                )}
              </div>
            </div>
          );
        }

        if (isEvent) {
          const isCancelled =
            eventData?.isCancelled ||
            (typeof lastMsg.content === "string" &&
              lastMsg.content.startsWith("Cancelled event:"));
          let title =
            eventData?.title ||
            eventData?.name ||
            lastMsg.content ||
            "Event";
          if (typeof title === "string") {
            title = title.replace(/^(Cancelled event|Event):\s*/, "");
          }

          return (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <MdEventNote size={15} />
                <span>{isCancelled ? `Cancelled event: ${title}` : `Event: ${title}`}</span>
              </div>
              {eventData?.startDate && (
                <div className="text-xs opacity-75">
                  📅 {new Date(eventData.startDate).toLocaleString()}
                </div>
              )}
              {eventData?.location && (
                <div className="text-xs opacity-75">
                  📍 {eventData.location}
                </div>
              )}
            </div>
          );
        }

        if (isCall) {
          const isVideoCall =
            callData?.callType === "video" ||
            lastMsg?.callType === "video" ||
            (typeof lastMsg?.content === "string" &&
              lastMsg.content.startsWith("Video call"));
          const duration =
            callData?.duration || lastMsg?.duration || "Voice call";
          const direction =
            callData?.direction ||
            lastMsg?.direction ||
            (isLastMsgFromMe ? "outgoing" : "incoming");
          const isMissed =
            direction === "missed" ||
            callData?.status === "missed" ||
            lastMsg?.status === "missed";
          const isDeclined =
            callData?.status === "declined" || lastMsg?.status === "declined";

          return (
            <div className="flex items-center gap-2">
              {isVideoCall ? (
                <MdOutlineVideocam
                  size={16}
                  className={isMissed ? "text-red-400" : "text-emerald-400"}
                />
              ) : (
                <MdOutlineCall
                  size={15}
                  className={isMissed ? "text-red-400" : "text-emerald-400"}
                />
              )}
              <span className="font-semibold">
                {isVideoCall ? "Video call" : "Voice call"}
              </span>
              <span
                className={`text-xs ${isMissed ? "text-red-400 font-medium" : "opacity-75"
                  }`}
              >
                • {isMissed ? "Missed" : isDeclined ? "Declined" : duration}
              </span>
            </div>
          );
        }

        const textContent =
          typeof lastMsg.content === "string"
            ? lastMsg.content
            : JSON.stringify(lastMsg.content || "");

        return (
          <div className="whitespace-pre-wrap select-text">
            {renderFormattedWhatsAppText(textContent || "No text content")}
          </div>
        );
      })()}
    </motion.div>
  );
};

export default ChatHoverPreview;
