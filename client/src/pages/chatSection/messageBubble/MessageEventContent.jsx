import React from "react";
import { MdEventNote, MdLocationOn } from "react-icons/md";
import { RiContactsFill } from "react-icons/ri";
import { formatEventSchedule } from "./helpers.js";

export const MessageEventContent = ({
  message,
  isUserMessage,
  effectiveUser,
  isDark,
  onEditEvent,
  renderTimestampAndStatus,
}) => {
  const goingCount = message.eventData?.responses?.length
    ? message.eventData.responses.filter((r) => r.status === "going" || r.status === "yes").length || message.eventData.responses.length
    : 2;
  const senderAvatar = isUserMessage
    ? (effectiveUser?.profilePic || effectiveUser?.avatar)
    : (message?.sender?.profilePic || message?.sender?.avatar);
  const senderDisplayName = message?.sender?.name || effectiveUser?.name || "U";

  return (
    <div className="flex flex-col min-w-[260px] max-w-[310px] w-full select-none">
      <div className="flex items-start gap-3">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${isDark
            ? "bg-[#143d2e] text-[#25d366]"
            : "bg-emerald-600/15 text-emerald-700"
            }`}
        >
          <MdEventNote size={24} />
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <h4
            className={`text-[16px] font-bold leading-tight break-words ${message.eventData?.isCancelled
              ? "line-through opacity-60"
              : ""
              }`}
          >
            {message.eventData?.title || message.content}
          </h4>

          <p
            className={`text-[13px] font-normal mt-1 ${isDark ? "text-white/75" : "text-gray-700"
              }`}
          >
            {formatEventSchedule(message.eventData)}
          </p>

          {message.eventData?.description && (
            <p
              className={`text-[14px] font-normal mt-1 break-words ${isDark ? "text-white/90" : "text-gray-800"
                }`}
            >
              {message.eventData.description}
            </p>
          )}

          {message.eventData?.hasCallLink && (
            <p
              className={`text-[13px] font-normal mt-1 ${isDark ? "text-white/75" : "text-gray-700"
                }`}
            >
              WhatsApp video call
            </p>
          )}

          {message.eventData?.location && (
            <div className="flex items-center gap-1 text-[13px] opacity-75 mt-1">
              <MdLocationOn size={14} className="text-red-400 shrink-0" />
              <span className="truncate">{message.eventData.location}</span>
            </div>
          )}

          {message.eventData?.isCancelled && (
            <span className="mt-1.5 inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-red-500/20 text-red-400">
              Event cancelled
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-[12px]">
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5 items-center">
            {senderAvatar ? (
              <img
                src={senderAvatar}
                alt=""
                className={`w-5 h-5 rounded-full object-cover border ${isDark ? "border-[#005c4b]" : "border-[#d9fdd3]"
                  }`}
              />
            ) : (
              <div
                className={`w-5 h-5 rounded-full bg-emerald-700 border flex items-center justify-center text-[9px] text-white ${isDark ? "border-[#005c4b]" : "border-[#d9fdd3]"
                  }`}
              >
                {senderDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div
              className={`w-5 h-5 rounded-full bg-[#7a3b2e] border flex items-center justify-center text-white ${isDark ? "border-[#005c4b]" : "border-[#d9fdd3]"
                }`}
            >
              <RiContactsFill size={10} />
            </div>
          </div>
          <span
            className={`font-normal text-[13px] ${isDark ? "text-white/70" : "text-gray-600"
              }`}
          >
            {goingCount} going
          </span>
        </div>

        <div
          className={`flex items-center gap-1 text-[11px] ${isDark ? "text-white/60" : "text-gray-500"
            }`}
        >
          {renderTimestampAndStatus(false)}
        </div>
      </div>

      <div
        className={`border-t -mx-[9px] -mb-[7px] mt-2.5 rounded-b-[7.5px] overflow-hidden ${isDark ? "border-white/10" : "border-black/10"
          }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onEditEvent) {
              onEditEvent(message);
            }
          }}
          title="Edit or cancel event"
          className="w-full py-2.5 text-center text-[15px] font-medium text-[#00a884] dark:text-[#25d366] hover:bg-black/5 dark:hover:bg-white/5 active:scale-98 transition-all cursor-pointer"
        >
          Edit event
        </button>
      </div>
    </div>
  );
};

export default MessageEventContent;
