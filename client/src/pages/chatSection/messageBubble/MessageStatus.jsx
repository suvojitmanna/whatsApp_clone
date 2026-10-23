import React from "react";
import { format } from "date-fns";
import { FaCheckDouble, FaStar } from "react-icons/fa";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import { MdAccessTime } from "react-icons/md";
import {
  WhatsAppPinIcon,
  WhatsAppDisappearingIcon,
} from "../../../components/common/Icons";

export const MessageStatusIcon = ({
  isUserMessage,
  message,
  isGroupChat,
  activeContact,
  conversationObj,
  currentUserId,
  isOverlay = false,
}) => {
  if (!isUserMessage) return null;
  if (
    message.contentType === "call" ||
    message.contentType === "call_link" ||
    message.isSystemMessage ||
    message.contentType === "system"
  ) {
    return null;
  }

  const status = message.messageStatus || message.status;
  if (!status || status === "pending" || status === "sending" || message.isPending) {
    return (
      <MdAccessTime
        size={11}
        className={isOverlay ? "text-white/85 shrink-0" : "opacity-60 shrink-0"}
        title="Sending / Offline"
      />
    );
  }

  if (isGroupChat) {
    const rawParticipants =
      activeContact?.participants ||
      activeContact?.conversation?.participants ||
      conversationObj?.participants ||
      message.conversation?.participants ||
      [];

    const otherParticipants = rawParticipants
      .map((p) => (p?._id || p?.userId || p?.id || p)?.toString())
      .filter((pId) => Boolean(pId) && pId !== currentUserId);

    if (otherParticipants.length > 0) {
      const readIds = new Set(
        (message.readBy || []).map((r) =>
          (r?.user?._id || r?.user || r?.userId || r)?.toString()
        )
      );
      const deliveredIds = new Set(
        (message.deliveredTo || []).map((d) =>
          (d?.user?._id || d?.user || d?.userId || d)?.toString()
        )
      );

      const allRead =
        otherParticipants.length > 0 &&
        otherParticipants.every((pId) => readIds.has(pId));

      if (allRead) {
        return (
          <FaCheckDouble
            size={isOverlay ? 12 : 11}
            className="text-[#53bdeb] shrink-0"
            title="Read by all"
          />
        );
      }

      const allDelivered =
        (status === "delivered" && otherParticipants.length > 0) ||
        otherParticipants.every(
          (pId) => deliveredIds.has(pId) || readIds.has(pId)
        );

      if (allDelivered) {
        return (
          <FaCheckDouble
            size={isOverlay ? 12 : 11}
            className={isOverlay ? "text-white/85 shrink-0" : "opacity-60 shrink-0"}
            title="Delivered to all"
          />
        );
      }

      return (
        <FiCheck
          size={13}
          className={isOverlay ? "text-white/85 shrink-0" : "opacity-60 shrink-0"}
          title="Sent (waiting for group delivery)"
        />
      );
    }

    return (
      <FiCheck
        size={13}
        className={isOverlay ? "text-white/85 shrink-0" : "opacity-60 shrink-0"}
        title="Sent"
      />
    );
  }

  if (status === "read") {
    return (
      <FaCheckDouble
        size={isOverlay ? 12 : 11}
        className="text-[#53bdeb] shrink-0"
        title="Read"
      />
    );
  }
  if (status === "delivered") {
    return (
      <FaCheckDouble
        size={isOverlay ? 12 : 11}
        className={isOverlay ? "text-white/85 shrink-0" : "opacity-60 shrink-0"}
        title="Delivered"
      />
    );
  }
  if (status === "send" || status === "sent") {
    return (
      <FiCheck
        size={13}
        className={isOverlay ? "text-white/85 shrink-0" : "opacity-60 shrink-0"}
        title="Sent"
      />
    );
  }
  return (
    <FiCheck
      size={13}
      className={isOverlay ? "text-white/85 shrink-0" : "opacity-60 shrink-0"}
    />
  );
};

export const MessageTimestampAndStatus = ({
  message,
  isUserMessage,
  isGroupChat,
  activeContact,
  conversationObj,
  currentUserId,
  isPinned,
  disappearingDuration,
  onOpenDisappearing,
  isStarred,
  isOverlay = false,
  isSelectMode,
  showOptions,
  handleToggleOptions,
  isDark,
}) => {
  if (isOverlay) {
    return (
      <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-[2px] text-white text-[10.5px] select-none pointer-events-auto shadow-sm z-10">
        {isPinned && (
          <WhatsAppPinIcon className="w-[11px] h-[13px] text-white/80 shrink-0" />
        )}
        {disappearingDuration && disappearingDuration !== "Off" && (
          <WhatsAppDisappearingIcon
            size={11}
            className="text-white/80 shrink-0 cursor-pointer hover:opacity-100"
            title={`Disappearing message: ${disappearingDuration}. Click to change.`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDisappearing?.();
            }}
          />
        )}
        {isStarred && (
          <FaStar size={10} className="text-white/80 shrink-0" title="Starred message" />
        )}
        {message.edited && (
          <span className="text-[9.5px] italic opacity-90 mr-0.5">Edited</span>
        )}
        <span>{format(new Date(message.createdAt || Date.now()), "HH:mm")}</span>
        <MessageStatusIcon
          isUserMessage={isUserMessage}
          message={message}
          isGroupChat={isGroupChat}
          activeContact={activeContact}
          conversationObj={conversationObj}
          currentUserId={currentUserId}
          isOverlay={true}
        />
        {!isSelectMode && (
          <button
            type="button"
            onClick={handleToggleOptions}
            className={`${showOptions ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              } transition-opacity p-0.5 text-white/90 hover:text-white cursor-pointer ml-0.5`}
            title="Menu"
          >
            <FiChevronDown size={14} />
          </button>
        )}
      </span>
    );
  }

  return (
    <span
      className={`float-right inline-flex items-center gap-1 text-[11px] select-none ml-2 leading-none self-end shrink-0 relative top-[1px] ${isDark ? "text-white/60" : "text-[#667781]"
        }`}
    >
      {isPinned && (
        <WhatsAppPinIcon
          className={`w-[11px] h-[13px] shrink-0 ${isDark ? "text-[#8696a0]" : "text-[#667781]"
            }`}
        />
      )}
      {disappearingDuration && disappearingDuration !== "Off" && (
        <WhatsAppDisappearingIcon
          size={11}
          className={`shrink-0 cursor-pointer hover:opacity-100 ${isDark ? "text-[#8696a0]" : "text-[#667781]"
            }`}
          title={`Disappearing message: ${disappearingDuration}. Click to change.`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDisappearing?.();
          }}
        />
      )}
      {isStarred && (
        <FaStar
          size={10}
          className={`shrink-0 ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}
          title="Starred message"
        />
      )}
      {message.edited && (
        <span
          className={`text-[9.5px] italic mr-0.5 ${isDark ? "text-white/50" : "text-black/50"
            }`}
        >
          Edited
        </span>
      )}
      <span>{format(new Date(message.createdAt || Date.now()), "HH:mm")}</span>
      <MessageStatusIcon
        isUserMessage={isUserMessage}
        message={message}
        isGroupChat={isGroupChat}
        activeContact={activeContact}
        conversationObj={conversationObj}
        currentUserId={currentUserId}
        isOverlay={false}
      />
      {!isSelectMode && (
        <button
          type="button"
          onClick={handleToggleOptions}
          className={`${showOptions ? "opacity-100 text-current" : "opacity-0 group-hover:opacity-80 hover:opacity-100 text-current"
            } transition-all p-0.5 cursor-pointer ml-0.5 inline-flex items-center justify-center`}
          title="Menu"
        >
          <FiChevronDown size={14} />
        </button>
      )}
    </span>
  );
};

export default MessageTimestampAndStatus;
