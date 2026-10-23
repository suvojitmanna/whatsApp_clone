import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { isToday, isYesterday, format } from "date-fns";
import useOutsideClick from "../../hook/useOutsideClick";
import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import { useChatStore } from "../../store/chatStore";
import useUserStore from "../../store/useUserStore";

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const formatVoterTime = (dateStr) => {
  if (!dateStr) return "Today at " + format(new Date(), "HH:mm");
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Today at " + format(new Date(), "HH:mm");
    if (isToday(d)) return `Today at ${format(d, "HH:mm")}`;
    if (isYesterday(d)) return `Yesterday at ${format(d, "HH:mm")}`;
    return format(d, "dd/MM/yyyy 'at' HH:mm");
  } catch {
    return "Today at " + format(new Date(), "HH:mm");
  }
};

const PollDetailsPanel = () => {
  const panelRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const {
    selectedPollMessage,
    selectedPollMessageId,
    setSelectedPollDetails,
    selectedContact,
  } = useLayoutStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const storeMessages = useChatStore((state) => state.messages);
  const user = useUserStore((state) => state.user);
  const currentUserId = (user?._id || user?.id)?.toString();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const liveMessage =
    storeMessages?.find((m) => m._id === selectedPollMessageId) ||
    selectedPollMessage;

  useOutsideClick(panelRef, () => {
    setSelectedPollDetails(null);
  });

  if (!liveMessage || !liveMessage.pollData) return null;

  const totalVotes =
    liveMessage.pollData.options?.reduce(
      (sum, o) => sum + (o.votes?.length || 0),
      0
    ) || 0;

  const totalMembers =
    selectedContact?.participants?.length ||
    (totalVotes > 0 ? totalVotes + 5 : 25);

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "tween", duration: 0.2 }}
        className={`h-full flex flex-col select-none ${isMobile
            ? "fixed inset-0 z-[100]"
            : "relative w-full md:w-[350px] lg:w-[400px] xl:w-[420px] shrink-0 border-l"
          } ${isDark
            ? "bg-[#111b21] border-[#222d34] text-[#e9edef]"
            : "bg-[#f0f2f5] border-gray-200 text-gray-900"
          } shadow-2xl`}
      >
        <div
          className={`h-[60px] px-6 flex items-center gap-6 shrink-0 border-b ${isDark
              ? "bg-[#111b21] border-[#222d34]"
              : "bg-white border-gray-200"
            }`}
        >
          <button
            type="button"
            onClick={() => setSelectedPollDetails(null)}
            className="p-1 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center"
            title="Close"
          >
            <RxCross2 size={21} />
          </button>
          <h2 className="font-semibold text-[16px] text-gray-900 dark:text-white tracking-normal">
            Poll details
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
          <h3 className="text-[17px] font-bold leading-snug tracking-tight text-gray-900 dark:text-white">
            {liveMessage.pollData.question || liveMessage.content}
          </h3>

          <p className="text-[13px] text-gray-500 dark:text-[#8696a0] mt-1.5 mb-6 font-normal">
            {totalVotes} of {totalMembers} members voted
          </p>

          <div className="space-y-6">
            {liveMessage.pollData.options?.map((option, idx) => {
              const optionVotes = option.votes?.length || 0;

              return (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-[#222d34]">
                    <span className="text-[15px] font-normal text-gray-900 dark:text-white/95 truncate">
                      {option.text}
                    </span>
                    <span className="text-[12.5px] font-semibold text-[#00a884] flex items-center gap-1 shrink-0">
                      <span className="tabular-nums">{optionVotes}</span>
                      <span>{optionVotes === 1 ? "vote" : "votes"}</span>
                      {optionVotes > 0 && <span className="text-[10px]">★</span>}
                    </span>
                  </div>

                  {option.votes && option.votes.length > 0 ? (
                    <div className="space-y-3 pt-1">
                      {option.votes.map((voter, vIdx) => {
                        const voterName = voter?.username || "Contact";
                        const isCurrent =
                          (voter?._id || voter)?.toString() === currentUserId;
                        const avatar = voter?.profilePicture;
                        const votedAt = voter?.votedAt || liveMessage.createdAt;

                        return (
                          <div
                            key={vIdx}
                            className="flex items-center gap-3.5 py-1"
                          >
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={voterName}
                                className="w-10 h-10 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#10364a] text-[#53bdeb] font-semibold text-xs flex items-center justify-center shrink-0 border border-[#1f4054]/50">
                                {getInitials(voterName)}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="text-[15px] font-normal text-gray-900 dark:text-white truncate">
                                {isCurrent ? "You" : voterName}
                              </p>
                              <p className="text-[12px] text-gray-500 dark:text-[#8696a0] leading-tight mt-0.5">
                                {formatVoterTime(votedAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-[#8696a0]/60 italic py-1">
                      No votes yet
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PollDetailsPanel;
