import React from "react";
import formatTimestamp from "../../utils/formatTime";
import { StatusStoryRing } from "../../components/common/Icons";

const StatusList = ({ contact, onPreview, theme }) => {
  return (
    <div>
      <div
        onClick={onPreview}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
      >
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-full bg-green-500/20 blur-sm opacity-60" />

          <img
            src={contact.avatar}
            alt={contact?.name}
            className="h-12 w-12 rounded-full object-cover border border-black/10 dark:border-white/10 relative z-10"
          />

          {contact?.statuses?.length > 0 && (
            <StatusStoryRing
              count={contact.statuses.length}
              className="absolute -top-[3px] -left-[3px] w-[54px] h-[54px]"
            />
          )}
        </div>

        <div className="flex flex-col justify-center min-w-0 flex-1">
          <p className="text-[15px] font-medium leading-tight truncate">
            {contact?.name}
          </p>

          <p className={`text-[13px] mt-[2px] truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
          >
            {formatTimestamp(
              contact.statuses[contact.statuses.length - 1].timeStamp
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatusList;
