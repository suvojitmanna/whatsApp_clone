import React from "react";
import { FaCheckDouble } from "react-icons/fa";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import { MdAccessTime } from "react-icons/md";

export const MessagePollContent = ({
  message,
  isUserMessage,
  currentUserId,
  isDark,
  showOptions,
  handleToggleOptions,
  votePoll,
  setSelectedPollDetails,
  renderTimestampAndStatus,
}) => {
  return (
    <div className="flex flex-col w-[280px] xs:w-[305px] sm:w-[320px] max-w-full select-none">
      <div className="flex items-center justify-between pb-1 -mt-0.5">
        <span className="text-[13px] font-bold text-[#53bdeb] tracking-wide truncate uppercase">
          {isUserMessage ? "YOU" : (message.sender?.username ? message.sender.username.toUpperCase() : "Name")}
        </span>
        <button
          type="button"
          onClick={handleToggleOptions}
          className={`p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${showOptions
            ? "text-gray-900 dark:text-white"
            : "text-gray-500 dark:text-[#8696a0] hover:text-gray-900 dark:hover:text-white"
            }`}
          title="Menu"
        >
          <FiChevronDown size={19} />
        </button>
      </div>
      <h3 className={`font-bold text-[15px] leading-snug tracking-tight mb-1 ${isDark ? "text-white" : "text-gray-900"
        }`}>
        {message.pollData?.question || message.content}
      </h3>
      <div className={`flex items-center gap-1.5 text-[12px] font-normal mb-3 ${isDark ? "text-[#8696a0]" : "text-gray-500"
        }`}>
        {message.pollData?.isClosed ? (
          <MdAccessTime size={13} className={`shrink-0 ${isDark ? "text-[#8696a0]" : "text-gray-500"}`} />
        ) : message.pollData?.allowMultiple ? (
          <FaCheckDouble size={12} className={`shrink-0 rounded-full ${isDark ? "text-[#8696a0]" : "text-gray-500"}`} />
        ) : (
          <FiCheck size={14} className={`shrink-0 ${isDark ? "text-[#8696a0]" : "text-gray-500"}`} />
        )}
        <span>
          {message.pollData?.isClosed
            ? "Poll ended"
            : message.pollData?.allowMultiple
              ? "Select one or more"
              : "Select one"}
        </span>
      </div>

      <div className="space-y-3">
        {message.pollData?.options?.map((option, idx) => {
          const totalVotes =
            message.pollData.options.reduce(
              (sum, o) => sum + (o.votes?.length || 0),
              0
            ) || 0;
          const optionVotes = option.votes?.length || 0;
          const percentage =
            totalVotes > 0
              ? Math.round((optionVotes / totalVotes) * 100)
              : 0;
          const hasVoted = option.votes?.some((v) => {
            const vId = (v?._id || v)?.toString();
            return vId && currentUserId && vId === currentUserId;
          });

          return (
            <div
              key={idx}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                votePoll?.(message._id, idx);
              }}
              className="space-y-1.5 cursor-pointer group/opt select-none"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {hasVoted ? (
                    <span className="w-5 h-5 rounded-full bg-[#00a884] text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm">
                      ✓
                    </span>
                  ) : (
                    <span className={`w-5 h-5 rounded-full border-2 shrink-0 ${isDark ? "border-[#8696a0]/80" : "border-gray-400"
                      }`}></span>
                  )}
                  <span
                    className={`text-[14.5px] leading-snug break-words ${hasVoted
                      ? isDark ? "font-semibold text-white" : "font-semibold text-gray-900"
                      : isDark ? "font-normal text-white/95" : "font-normal text-gray-800"
                      }`}
                  >
                    {option.text}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {option.votes && option.votes.length > 0 && (
                    <div className="flex -space-x-1.5 items-center">
                      {option.votes.slice(0, 3).map((voter, vIdx) => {
                        const avatar = voter?.profilePicture;
                        const name = voter?.username || "User";
                        return avatar ? (
                          <img
                            key={vIdx}
                            src={avatar}
                            alt={name}
                            className={`w-5 h-5 rounded-full border object-cover ${isDark ? "border-[#202c33]" : "border-gray-200"
                              }`}
                          />
                        ) : (
                          <div
                            key={vIdx}
                            className={`w-5 h-5 rounded-full border bg-[#7c3aed] text-[9px] text-white font-bold flex items-center justify-center ${isDark ? "border-[#202c33]" : "border-gray-200"
                              }`}
                          >
                            {name.charAt(0).toUpperCase()}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <span className={`text-[13px] font-normal tabular-nums ${isDark ? "text-[#8696a0]" : "text-gray-500"
                    }`}>
                    {optionVotes}
                  </span>
                </div>
              </div>

              <div className={`w-full h-[6px] rounded-full overflow-hidden ${isDark ? "bg-[#2a3942]" : "bg-black/10"
                }`}>
                <div
                  className="h-full bg-[#00a884] rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end mt-2 mb-0.5 px-1 select-none">
        {renderTimestampAndStatus(false)}
      </div>
      <div className={`border-t -mx-3 -mb-2.5 mt-2 rounded-b-2xl overflow-hidden ${isDark ? "border-[#2a3942]" : "border-black/10"
        }`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPollDetails?.(message);
          }}
          title="View poll votes"
          className={`w-full py-2 text-center text-[14px] font-semibold text-emerald-500 hover:text-emerald-400 active:scale-98 transition-all cursor-pointer ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"
            }`}
        >
          View votes
        </button>
      </div>
    </div>
  );
};

export default MessagePollContent;
