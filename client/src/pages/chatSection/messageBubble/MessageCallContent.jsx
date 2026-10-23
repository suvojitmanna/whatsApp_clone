import React from "react";
import { FaLock } from "react-icons/fa";
import { MdLink, MdContentCopy, MdVideocam, MdCall } from "react-icons/md";
import {
  VideoCallOutgoingIcon,
  VideoCallIncomingIcon,
  CallOutgoingIcon,
} from "../../../components/common/Icons";
import { toast } from "react-toastify";
import useVideoCallStore from "../../../store/videoCallStore";

export const MessageCallLinkContent = ({
  message,
  isUserMessage,
  selectedContact,
  isDark,
  renderTimestampAndStatus,
}) => {
  const linkData =
    typeof message.callLinkData === "string"
      ? (() => {
        try {
          return JSON.parse(message.callLinkData);
        } catch (e) {
          return {};
        }
      })()
      : message.callLinkData || {};

  const rawUrl =
    linkData?.url ||
    (typeof message.content === "string" &&
      message.content.includes("call.whatsapp.com")
      ? message.content.match(
        /https?:\/\/call\.whatsapp\.com\/[^\s]+/i
      )?.[0] || message.content
      : "") ||
    `https://call.whatsapp.com/video/SUH50LINK`;

  const isVideo =
    linkData?.callType === "video" ||
    rawUrl.includes("/video/");
  const callType = isVideo ? "video" : "voice";

  const peer = isUserMessage
    ? message.receiver || selectedContact
    : message.sender || selectedContact;
  const peerId = (peer?._id || peer?.id || peer)?.toString();
  const peerName = peer?.username || peer?.name || "Contact";
  const peerAvatar = peer?.profilePicture || peer?.avatar || "";

  const handleCopyCallUrl = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(rawUrl);
    toast.success("Call link copied to clipboard");
  };

  const handleJoinCallLink = (e) => {
    e.stopPropagation();
    try {
      const { initiateCall } = useVideoCallStore.getState();
      if (typeof initiateCall === "function") {
        initiateCall(
          peerId || `link-${Date.now()}`,
          peerName,
          peerAvatar,
          callType === "video" ? "video" : "audio"
        );
      } else {
        toast.success("Connecting to WhatsApp call link...");
      }
    } catch (err) {
      console.warn("Failed to join call link:", err);
      toast.error("Could not join call");
    }
  };

  return (
    <div className="flex flex-col min-w-[260px] xs:min-w-[280px] max-w-[340px] select-none">
      <div className="flex items-start gap-3 p-1">
        <div className="w-11 h-11 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0 shadow-md">
          <MdLink className="text-2xl transform -rotate-45" />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <h4
            className={`text-[15.5px] font-semibold leading-tight tracking-normal truncate ${isDark ? "text-white" : "text-[#111b21]"
              }`}
          >
            {isVideo
              ? "WhatsApp Video Call Link"
              : "WhatsApp Voice Call Link"}
          </h4>
          <p
            className={`text-[12.5px] leading-snug mt-1 ${isDark ? "text-[#8696a0]" : "text-[#667781]"
              }`}
          >
            Use this link to join my WhatsApp{" "}
            {isVideo ? "video" : "voice"} call.
          </p>
        </div>
      </div>

      <div
        onClick={handleCopyCallUrl}
        className={`mt-2 px-3 py-2 rounded-xl flex items-center justify-between gap-2 border transition-all cursor-pointer group ${isUserMessage
          ? isDark
            ? "bg-black/20 hover:bg-black/30 border-white/5"
            : "bg-black/[0.04] hover:bg-black/[0.07] border-black/5"
          : isDark
            ? "bg-white/[0.06] hover:bg-white/[0.09] border-white/5"
            : "bg-black/[0.04] hover:bg-black/[0.07] border-black/5"
          }`}
        title="Click to copy link"
      >
        <span className="text-[13px] font-mono text-[#00a884] dark:text-[#25d366] font-medium truncate select-all">
          {rawUrl}
        </span>
        <button
          type="button"
          onClick={handleCopyCallUrl}
          className="p-1 rounded-md text-[#8696a0] group-hover:text-[#00a884] transition-colors shrink-0 cursor-pointer"
          title="Copy link"
        >
          <MdContentCopy size={15} />
        </button>
      </div>

      <div className="mt-2.5">
        <button
          type="button"
          onClick={handleJoinCallLink}
          className="w-full py-2.5 px-4 rounded-xl bg-[#00a884] hover:bg-[#029676] active:scale-[0.99] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          title={`Join ${isVideo ? "video" : "voice"} call now`}
        >
          {isVideo ? (
            <MdVideocam className="text-lg" />
          ) : (
            <MdCall className="text-base" />
          )}
          <span>Join call</span>
        </button>
      </div>

      <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 dark:border-white/5 px-0.5">
        <div className="flex items-center gap-1 text-[11px] text-[#8696a0]">
          <FaLock size={9} className="opacity-75" />
          <span>End-to-end encrypted</span>
        </div>
        <div className="flex items-center select-none pointer-events-auto">
          {renderTimestampAndStatus(false)}
        </div>
      </div>
    </div>
  );
};

export const MessageCallHistoryContent = ({
  message,
  isUserMessage,
  selectedContact,
  isDark,
  renderTimestampAndStatus,
}) => {
  const callData =
    typeof message.callData === "string"
      ? (() => {
        try {
          return JSON.parse(message.callData);
        } catch (e) {
          return {};
        }
      })()
      : message.callData || {};

  const callType =
    callData?.callType ||
    message.callType ||
    (message.content?.toLowerCase()?.includes("video") ? "video" : "audio");
  const isVideo = callType === "video";

  const rawDuration =
    callData?.duration ||
    message.duration ||
    (message.content?.match(/(\d+\s*(seconds?|minutes?|secs?|mins?))/i)?.[0]) ||
    "28 seconds";

  const status =
    callData?.status ||
    message.status ||
    (rawDuration.toLowerCase().includes("missed")
      ? "missed"
      : rawDuration.toLowerCase().includes("declined")
        ? "declined"
        : "completed");

  const direction =
    callData?.direction ||
    message.direction ||
    (isUserMessage ? "outgoing" : "incoming");

  const isMissed =
    !isUserMessage &&
    (status === "missed" ||
      direction === "missed" ||
      rawDuration.toLowerCase().includes("missed"));

  const isCallerNoAnswer =
    isUserMessage &&
    (status === "missed" ||
      direction === "missed" ||
      rawDuration.toLowerCase().includes("missed"));

  const isDeclined =
    status === "declined" || direction === "declined";

  let title = isVideo ? "Video call" : "Voice call";
  if (isMissed) {
    title = isVideo ? "Missed video call" : "Missed voice call";
  }

  let durationText = rawDuration;
  if (isMissed) {
    durationText = "Missed";
  } else if (isCallerNoAnswer) {
    durationText = "No answer";
  } else if (isDeclined) {
    durationText = "Declined";
  }

  const peer = isUserMessage
    ? message.receiver || selectedContact
    : message.sender || selectedContact;
  const peerId = (peer?._id || peer?.id || peer)?.toString();
  const peerName = peer?.username || peer?.name || "Contact";
  const peerAvatar = peer?.profilePicture || peer?.avatar || "";

  const handleCallBack = (e) => {
    e.stopPropagation();
    try {
      const { initiateCall } = useVideoCallStore.getState();
      if (peerId && typeof initiateCall === "function") {
        initiateCall(
          peerId,
          peerName,
          peerAvatar,
          isVideo ? "video" : "audio"
        );
      }
    } catch (err) {
      console.warn("Failed to initiate call back:", err);
    }
  };

  return (
    <div className="flex flex-col min-w-[210px] max-w-[280px] select-none py-0.5"
      onClick={handleCallBack}>
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isMissed
            ? "bg-red-500/15 text-red-500"
            : isDark
              ? "bg-white/10 text-[#00a884]"
              : "bg-black/5 text-[#00a884]"
            }`}
        >
          {isVideo ? (
            isUserMessage ? (
              <VideoCallOutgoingIcon />
            ) : (
              <VideoCallIncomingIcon />
            )
          ) : (
            <CallOutgoingIcon />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={`text-[14px] font-semibold truncate leading-tight ${isMissed ? "text-red-500" : ""
              }`}
          >
            {title}
          </p>
          <p
            className={`text-[12px] opacity-70 truncate mt-0.5 ${isMissed ? "text-red-400" : ""
              }`}
          >
            {durationText}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end mt-1 px-1">
        {renderTimestampAndStatus(false)}
      </div>
    </div>
  );
};
