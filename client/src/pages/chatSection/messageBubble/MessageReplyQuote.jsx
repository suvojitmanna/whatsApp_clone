import React from "react";
import { toast } from "react-toastify";
import { useChatStore } from "../../../store/chatStore";

export const MessageReplyQuote = ({
  message,
  currentUser,
  selectedContact,
  isDark,
}) => {
  let rawReply =
    message.replyMessage ||
    (typeof message.replyTo === "object" && message.replyTo !== null
      ? message.replyTo
      : null);

  if (typeof rawReply === "string") {
    try {
      rawReply = JSON.parse(rawReply);
    } catch (e) {
      rawReply = null;
    }
  }

  if (!rawReply && message.replyTo) {
    const replyIdStr = (
      message.replyTo?._id || message.replyTo
    )?.toString();
    if (replyIdStr) {
      const found = useChatStore
        .getState()
        .messages?.find(
          (m) => (m._id?._id || m._id)?.toString() === replyIdStr
        );
      if (found) {
        rawReply = found;
      }
    }
  }

  const replyMsg = rawReply;
  if (!replyMsg) return null;

  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
  const replySenderId = (
    replyMsg.sender?._id || replyMsg.sender
  )?.toString();
  const isRepliedSenderMe = Boolean(
    currentUserId && replySenderId && currentUserId === replySenderId
  );
  const replySenderName =
    replyMsg.sender?.username ||
    (isRepliedSenderMe
      ? "You"
      : (replyMsg.sender && typeof replyMsg.sender === "string" && replyMsg.sender === selectedContact?._id?.toString())
        ? selectedContact?.username
        : selectedContact?.username || "Contact");

  let replyPreviewText = replyMsg.content || "";
  if (replyMsg.deletedForEveryone) {
    replyPreviewText = isRepliedSenderMe
      ? "You deleted this message"
      : "This message was deleted";
  } else if (replyMsg.contentType === "image") {
    replyPreviewText = replyMsg.content ? `📷 ${replyMsg.content}` : "📷 Photo";
  } else if (replyMsg.contentType === "video") {
    replyPreviewText = replyMsg.content ? `🎥 ${replyMsg.content}` : "🎥 Video";
  } else if (replyMsg.contentType === "audio") {
    replyPreviewText = "🎵 Voice message";
  } else if (replyMsg.contentType === "document") {
    replyPreviewText = replyMsg.fileName ? `📄 ${replyMsg.fileName}` : "📄 Document";
  } else if (replyMsg.contentType === "poll") {
    replyPreviewText = `📊 ${replyMsg.pollData?.question || "Poll"}`;
  } else if (replyMsg.contentType === "event") {
    replyPreviewText = `📅 ${replyMsg.eventData?.eventName || "Event"}`;
  } else if (replyMsg.contentType === "contact") {
    replyPreviewText = `👤 ${replyMsg.contactData?.name || "Contact"}`;
  } else if (replyMsg.contentType === "sticker") {
    replyPreviewText = "💟 Sticker";
  } else if (replyMsg.contentType === "call") {
    const isVid = replyMsg.callData?.callType === "video" || replyMsg.callType === "video";
    replyPreviewText = isVid ? "📹 Video call" : "📞 Voice call";
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        const targetId = (
          replyMsg._id?._id ||
          replyMsg._id ||
          message.replyTo?._id ||
          message.replyTo
        )?.toString();
        if (!targetId) return;
        const el = document.getElementById(`msg-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          const targetBubble = el.querySelector('[data-bubble="true"]') || el;
          targetBubble.classList.add(
            "ring-2",
            "ring-[#7f66ff]",
            "shadow-[0_0_20px_rgba(127,102,255,0.7)]",
            "transition-all",
            "duration-300",
            "scale-[1.02]"
          );
          setTimeout(() => {
            targetBubble.classList.remove(
              "ring-2",
              "ring-[#7f66ff]",
              "shadow-[0_0_20px_rgba(127,102,255,0.7)]",
              "scale-[1.02]"
            );
          }, 1800);
        } else {
          toast.info("Original message is earlier in chat history");
        }
      }}
      className={`mb-1.5 p-2 rounded-lg border-l-[3.5px] cursor-pointer transition-all hover:brightness-105 active:scale-[0.99] select-none flex items-center justify-between gap-2 overflow-hidden ${isDark
        ? "bg-black/25 border-[#8b7ff5] text-[#d1d7db]"
        : "bg-black/[0.05] border-[#7f66ff] text-zinc-900"
        }`}
      title="Click to jump to quoted message"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#8b7ff5] truncate">
          {isRepliedSenderMe ? "You" : replySenderName}
        </p>
        <p className="text-xs opacity-75 truncate mt-0.5">
          {replyPreviewText || "Message"}
        </p>
      </div>
      {replyMsg.imageOrVideoUrl &&
        ["image", "video", "sticker"].includes(replyMsg.contentType) && (
          <img
            src={replyMsg.imageOrVideoUrl}
            alt="quote thumb"
            className="w-8 h-8 rounded object-cover shrink-0 ml-2"
          />
        )}
    </div>
  );
};

export default MessageReplyQuote;
