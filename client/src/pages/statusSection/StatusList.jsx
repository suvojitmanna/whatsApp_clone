import React from "react";
import formatTimestamp from "../../utils/formatTime";

const StatusList = ({ contact, onPreview, theme }) => {
  console.log(contact.statuses);
  return (
  <div>
    <div
      onClick={onPreview}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
    >
      {/* Avatar + Ring */}
      <div className="relative shrink-0">
        {/* Glow */}
        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-sm opacity-60" />

        <img
          src={contact.avatar}
          alt={contact?.name}
          className="h-12 w-12 rounded-full object-cover border border-black/10 dark:border-white/10 relative z-10"
        />

        {/* SVG Ring */}
        {contact?.statuses?.length > 0 && (
          <svg
            className="absolute -top-[3px] -left-[3px] w-[54px] h-[54px] pointer-events-none -rotate-90"
            viewBox="0 0 100 100"
          >
            {contact.statuses.map((_, index) => (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="url(#statusGrad)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ))}

            <defs>
              <linearGradient id="statusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>

      {/* Text Content */}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <p className="text-[15px] font-medium leading-tight truncate">
          {contact?.name}
        </p>

        <p
          className={`text-[13px] mt-[2px] truncate ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
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
