import React, { useMemo } from "react";
import { LuPhone, LuVideo, LuUsers } from "react-icons/lu";
import { FaPhoneAlt } from "react-icons/fa";
import useVideoCallStore from "../../../store/videoCallStore";
import useUserStore from "../../../store/useUserStore";

const getAvatarBg = (name) => {
  const colors = [
    "from-purple-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-blue-500 to-cyan-600",
    "from-pink-500 to-rose-600",
    "from-amber-500 to-orange-600",
  ];
  if (!name) return colors[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return colors[h % colors.length];
};

const ActiveGroupCallBanner = ({ currentGroupId, theme = "dark" }) => {
  const activeGroupCall = useVideoCallStore((state) => state.activeGroupCall);
  const currentCall = useVideoCallStore((state) => state.currentCall);
  const isCallActive = useVideoCallStore((state) => state.isCallActive);
  const setCallModalOpen = useVideoCallStore((state) => state.setCallModalOpen);
  const { user } = useUserStore();

  const isDark = theme === "dark";

  const isCallForCurrentGroup = useMemo(() => {
    if (!activeGroupCall || !activeGroupCall.isActive || activeGroupCall.status === "ended") return false;
    const gId = (activeGroupCall.groupId?._id || activeGroupCall.groupId)?.toString();
    const currId = currentGroupId?.toString();
    if (!gId || !currId || gId !== currId) return false;

    const participantCount = activeGroupCall.joinedParticipants?.length || 0;
    if (participantCount === 0) return false;
    if (activeGroupCall.status === "ongoing" && participantCount < 2) return false;

    return true;
  }, [activeGroupCall, currentGroupId]);

  const joinedParticipants = useMemo(() => {
    return Array.isArray(activeGroupCall?.joinedParticipants)
      ? activeGroupCall.joinedParticipants
      : [];
  }, [activeGroupCall?.joinedParticipants]);

  const myId = user?._id?.toString();
  const isUserAlreadyInCall = Boolean(
    isCallActive &&
    currentCall?.callId === activeGroupCall?.callId
  );

  const isAudioCall = activeGroupCall?.callType !== "video";

  const namesSummary = useMemo(() => {
    if (joinedParticipants.length === 0) return "Group Call in progress";
    const names = joinedParticipants
      .map((p) => (p.userId === myId ? "You" : p.username || "Member"))
      .filter(Boolean);
    if (names.length === 1) return `${names[0]} is in call`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are in call`;
    return `${names[0]}, ${names[1]} +${names.length - 2} more`;
  }, [joinedParticipants, myId]);

  if (!isCallForCurrentGroup) return null;

  const handleJoin = (e) => {
    e.stopPropagation();
    if (isUserAlreadyInCall) {
      setCallModalOpen(true);
      return;
    }
    const { joinGroupCall } = useVideoCallStore.getState();
    if (typeof joinGroupCall === "function") {
      joinGroupCall(activeGroupCall);
    }
  };

  return (
    <div
      onClick={handleJoin}
      className={`relative z-20 flex items-center justify-between px-3.5 py-2.5 transition-all select-none cursor-pointer border-b ${
        isDark
          ? "bg-[#112320] border-[#00a884]/25 hover:bg-[#142926]"
          : "bg-[#e8f7f3] border-[#00a884]/30 hover:bg-[#ddf2ec]"
      }`}
      title={isUserAlreadyInCall ? "Return to call" : "Click to join group call"}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#00a884]/20 text-[#00a884]">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#00a884] opacity-25 animate-ping" />
          {isAudioCall ? <LuPhone className="h-4 w-4 relative z-10" /> : <LuVideo className="h-4 w-4 relative z-10" />}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[13px] font-semibold tracking-wide ${
                isDark ? "text-[#00a884]" : "text-[#008069]"
              }`}
            >
              {isAudioCall ? "Voice Call" : "Video Call"}
            </span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                isDark ? "bg-[#00a884]/20 text-[#00a884]" : "bg-[#00a884]/20 text-[#008069]"
              }`}
            >
              {joinedParticipants.length} {joinedParticipants.length === 1 ? "person" : "people"}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            {joinedParticipants.length > 0 && (
              <div className="flex -space-x-1.5 shrink-0 overflow-hidden py-0.5">
                {joinedParticipants.slice(0, 4).map((p, idx) => (
                  <div
                    key={p.userId || idx}
                    className="relative inline-block w-4.5 h-4.5 rounded-full ring-1 ring-black/40 overflow-hidden shrink-0"
                    title={p.username || "Participant"}
                  >
                    {p.profilePicture ? (
                      <img
                        src={p.profilePicture}
                        alt={p.username || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-tr ${getAvatarBg(
                          p.username || ""
                        )} text-white flex items-center justify-center text-[9px] font-bold`}
                      >
                        {(p.username || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p
              className={`text-[12px] truncate ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {namesSummary}
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 ml-3">
        {isUserAlreadyInCall ? (
          <button
            type="button"
            onClick={handleJoin}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#00a884]/20 text-[#00a884] hover:bg-[#00a884]/30 border border-[#00a884]/30 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />
            In Call
          </button>
        ) : (
          <button
            type="button"
            onClick={handleJoin}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#00a884] hover:bg-[#02906f] active:bg-[#028062] text-white shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-95"
          >
            <FaPhoneAlt className="h-3 w-3" />
            Join
          </button>
        )}
      </div>
    </div>
  );
};

export default ActiveGroupCallBanner;
