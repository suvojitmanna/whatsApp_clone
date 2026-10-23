import React from "react";
import { isToday, isYesterday, format } from "date-fns";
import { isValidate } from "./helpers";
import { getPinActorAndLabel } from "../ChatList";

export const DateSeparatorPill = ({
  date,
  includePinNotification = false,
  activePin,
  user,
  selectedContact,
  handleScrollToPinnedMessage,
  theme,
}) => {
  if (!isValidate(date)) {
    return null;
  }

  let dateString;
  if (isToday(date)) {
    dateString = "Today";
  } else if (isYesterday(date)) {
    dateString = "Yesterday";
  } else {
    dateString = format(date, "EEEE, MMMM d");
  }

  return (
    <div className="flex flex-col items-center justify-center my-2 select-none gap-2">
      <span
        className={`px-3 py-1 text-xs font-normal rounded-lg shadow-sm transition-colors ${theme === "dark"
          ? "bg-[#182229] text-[#8696a0]"
          : "bg-white text-[#54656f] border border-black/5"
          }`}
      >
        {dateString}
      </span>

      {includePinNotification && activePin?.message && (() => {
        const { text: pinNoticeText } = getPinActorAndLabel(
          activePin,
          user?._id || user?.id,
          selectedContact?.username
        );
        return (
          <button
            type="button"
            onClick={() => handleScrollToPinnedMessage(activePin.message?._id)}
            className={`px-3 py-1 text-xs font-normal rounded-lg shadow-sm transition-all duration-200 cursor-pointer active:scale-95 ${theme === "dark"
              ? "bg-[#182229] hover:bg-[#202c33] text-[#8696a0] hover:text-[#d1d7db]"
              : "bg-white hover:bg-gray-50 text-[#54656f] border border-black/5"
              }`}
            title="Click to jump to pinned message"
          >
            {pinNoticeText}
          </button>
        );
      })()}
    </div>
  );
};

export default DateSeparatorPill;
