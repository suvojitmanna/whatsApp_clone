import React from "react";
import { WhatsAppDisappearingIcon } from "../../../components/common/Icons";
import { getFormattedGroupSystemText } from "../../../utils/systemMessageUtils";

export const DisappearingSystemNotice = ({
  eventData,
  disappearingDuration,
  user,
  selectedContact,
  openContactInfoWithTab,
  theme,
}) => {
  const isEvent = Boolean(eventData && eventData.isDisappearingSystemEvent);
  const action = isEvent
    ? eventData.action
    : disappearingDuration === "Off"
      ? "turned_off"
      : "turned_on";
  const duration = isEvent ? eventData.duration : disappearingDuration;
  const isOff = duration === "Off" || action === "turned_off";
  const currentUserId = (user?._id || user?.id)?.toString();
  const setById = (
    eventData?.setBy?._id ||
    eventData?.setBy?.id ||
    eventData?.setBy ||
    selectedContact?.conversation?.disappearingSetBy?._id ||
    selectedContact?.conversation?.disappearingSetBy
  )?.toString();
  const isByMe = Boolean(setById && currentUserId && setById === currentUserId);
  const actor = isByMe ? "You" : (selectedContact?.username || "Contact");

  let text;
  if (isOff) {
    text = isByMe
      ? "You turned off disappearing messages."
      : `${actor} turned off disappearing messages.`;
  } else if (action === "updated") {
    text = isByMe
      ? `You updated the message timer. New messages will disappear from this chat ${duration} after they're sent, except when kept.`
      : `${actor} updated the message timer. New messages will disappear from this chat ${duration} after they're sent, except when kept.`;
  } else {
    text = isByMe
      ? `You turned on disappearing messages. New messages will disappear from this chat ${duration} after they're sent, except when kept.`
      : `${actor} turned on disappearing messages. New messages will disappear from this chat ${duration} after they're sent, except when kept.`;
  }

  return (
    <div className="flex justify-center my-2 select-none px-4">
      <div
        onClick={() => openContactInfoWithTab?.("disappearing")}
        className={`max-w-[620px] px-3.5 py-1.5 rounded-lg text-[12.5px] leading-[19px] shadow-sm text-center cursor-pointer transition-all duration-150 active:scale-[0.99] border ${theme === "dark"
          ? "bg-[#182229] border-[#222d34]/60 text-[#8696a0] hover:bg-[#202c33]"
          : "bg-white border-black/5 text-[#54656f] hover:bg-gray-50"
          }`}
        title="Click to change disappearing messages timer"
      >
        <span className="inline-flex items-center align-baseline mr-1.5 -mb-0.5 text-[#8696a0]">
          <WhatsAppDisappearingIcon size={14} className="shrink-0" />
        </span>
        <span>{text} </span>
        <span
          onClick={(e) => {
            e.stopPropagation();
            openContactInfoWithTab?.("disappearing");
          }}
          className={`font-semibold hover:underline cursor-pointer ${theme === "dark" ? "text-[#e9edef]" : "text-[#111b21]"
            }`}
        >
          Change timer.
        </span>
      </div>
    </div>
  );
};

export const GroupSystemNotice = ({
  msg,
  user,
  theme,
}) => {
  const currentUserId = (user?._id || user?.id)?.toString();
  const currentUserName = user?.username || user?.name;
  const text = getFormattedGroupSystemText(msg, currentUserId, currentUserName);

  return (
    <div className="flex justify-center my-2 select-none px-4">
      <div
        className={`max-w-[520px] px-3.5 py-1.5 rounded-lg text-xs font-normal leading-[18px] shadow-sm text-center inline-flex items-center justify-center gap-1.5 transition-colors border select-none ${theme === "dark"
          ? "bg-[#182229] border-[#222d34]/60 text-[#8696a0]"
          : "bg-white border-black/5 text-[#54656f]"
          }`}
      >
        <span>{text}</span>
      </div>
    </div>
  );
};

export default GroupSystemNotice;
