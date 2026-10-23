import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../../store/themeStore";
import useCallStore from "../../store/useCallStore";
import useLayoutStore from "../../store/layoutStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import { ContactAvatar } from "./FaviouriteCall";
import { formatCallDate } from "../../utils/formatTime";
import { toast } from "react-toastify";
import {
  MdClose,
  MdOutlineCall,
  MdOutlineVideocam,
  MdOutlineChatBubbleOutline,
  MdCallMade,
  MdCallReceived,
  MdCallMissed,
  MdDeleteOutline,
  MdStar,
  MdStarBorder,
  MdArrowBack,
  MdOutlineEmail,
  MdOutlineContentCopy,
  MdPeople,
  MdAccessTime,
  MdTimer,
  MdCheckCircle,
} from "react-icons/md";
import { WhatsAppChatsIcon } from "../../components/common/Icons";

export const CallInfo = ({
  call,
  onClose,
  onStartAudioCall,
  onStartVideoCall,
  isMobile = false,
}) => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const { user } = useUserStore();

  const {
    callHistory,
    removeCall,
    addFavourite,
    removeFavourite,
    isFavourite,
  } = useCallStore();

  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
  const users = useChatStore((state) => state.users) || [];

  if (!call) return null;

  const isGroupCall = Boolean(call.isGroup || call.groupName || call.groupId);
  const groupName = call.groupName || (isGroupCall ? call.contactName : null);
  const groupAvatar = call.groupAvatar || (isGroupCall ? call.contactAvatar : null);

  const matchedUser = !isGroupCall
    ? users.find(
        (u) =>
          u._id === call.contactId ||
          u.username?.toLowerCase() === call.contactName?.toLowerCase()
      )
    : null;

  const contactName = isGroupCall
    ? groupName || "Group Call"
    : matchedUser?.username || call.contactName || "Unknown";
  const contactAvatar = isGroupCall
    ? groupAvatar
    : matchedUser?.profilePicture || call.contactAvatar;
  const contactPhone = !isGroupCall ? (matchedUser?.phoneNumber || call.phoneNumber || null) : null;
  const contactEmail = !isGroupCall ? (matchedUser?.email || call.contactEmail || call.email || null) : null;
  const contactAbout = !isGroupCall ? (matchedUser?.about || "Hey there! I am using WhatsApp") : null;
  const contactId = isGroupCall
    ? (call.groupId || call.contactId || call.id)
    : (matchedUser?._id || call.contactId || call.id);

  const isFav = isFavourite(contactId);

  // Group members resolution
  const groupMembers = useMemo(() => {
    if (!isGroupCall) return [];

    const memberMap = new Map();
    const addMember = (raw) => {
      if (!raw) return;
      const rawId = String(raw._id || raw.id || raw);
      let userObj = users.find((u) => String(u._id) === rawId);
      if (!userObj && typeof raw === "object" && (raw.username || raw.name)) {
        userObj = raw;
      }
      if (!userObj && rawId) {
        userObj = { _id: rawId, username: rawId.length > 12 ? `User ${rawId.slice(-4)}` : rawId };
      }
      if (userObj) {
        const idKey = String(userObj._id || rawId);
        if (!memberMap.has(idKey)) {
          memberMap.set(idKey, {
            _id: userObj._id || rawId,
            username: userObj.username || userObj.name || "Member",
            profilePicture: userObj.profilePicture || userObj.avatar || null,
            about: userObj.about || "",
          });
        }
      }
    };

    // 1. From call.participants
    if (Array.isArray(call.participants)) {
      call.participants.forEach(addMember);
    }

    // 2. From call.participantIds
    if (Array.isArray(call.participantIds)) {
      call.participantIds.forEach(addMember);
    }

    // 3. From conversations in chatStore
    const allConvs = useChatStore.getState()?.conversations || [];
    const convList = Array.isArray(allConvs) ? allConvs : (allConvs?.data || []);
    const foundGroup = convList.find(
      (c) =>
        String(c._id) === String(call.groupId) ||
        (call.groupName && (c.groupName === call.groupName || c.name === call.groupName))
    );
    if (foundGroup && Array.isArray(foundGroup.participants)) {
      foundGroup.participants.forEach(addMember);
    }

    // 4. Include caller
    if (call.callerId || call.callerName) {
      addMember({
        _id: call.callerId || "caller",
        username: call.callerName || "Caller",
        profilePicture: call.callerAvatar,
      });
    }

    // 5. Include answeredBy
    if (call.answeredBy || call.answeredByName) {
      addMember({
        _id: call.answeredBy || "answered",
        username: call.answeredByName || "Recipient",
      });
    }

    // 6. Include logged-in user
    if (user && !memberMap.has(String(user._id))) {
      memberMap.set(String(user._id), {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        about: user.about,
      });
    }

    return Array.from(memberMap.values());
  }, [isGroupCall, call, users, user]);

  const dateLabel = formatCallDate(call) || "Today";
  const timeLabel =
    call.callTimeFormatted ||
    call.timeFormatted ||
    (call.timestamp
      ? new Date(call.timestamp).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "Recently");

  const callTypeLabel = call.callType === "video" ? "Video" : "Voice";

  const isMissedCall =
    call.direction === "missed" ||
    call.status === "missed" ||
    call.status === "declined";

  const isIncomingCall = call.direction === "incoming";
  const isOutgoingCall = call.direction === "outgoing";

  const isAnsweredCall = Boolean(
    call.answeredByName ||
    call.answeredBy ||
    (!isMissedCall &&
      (call.speakingTime ||
        (call.duration &&
          call.duration !== "Missed" &&
          call.duration !== "Declined" &&
          call.duration !== "Connected")))
  );

  const speakingDuration =
    call.speakingTime ||
    (call.duration &&
    call.duration !== "Missed" &&
    call.duration !== "Declined" &&
    call.duration !== "Connected"
      ? call.duration
      : isAnsweredCall
        ? "Connected"
        : "0 sec (Unanswered)");

  const relatedCalls = callHistory.filter((c) => {
    if (isGroupCall) {
      return (
        (c.groupId && call.groupId && String(c.groupId) === String(call.groupId)) ||
        (c.groupName && call.groupName && c.groupName.toLowerCase() === call.groupName.toLowerCase()) ||
        c.contactId === call.contactId
      );
    }
    return (
      c.contactName?.toLowerCase() === call.contactName?.toLowerCase() ||
      (c.contactId && c.contactId === call.contactId)
    );
  });

  const displayCalls = relatedCalls.length > 0 ? relatedCalls : [call];

  const handleOpenChat = () => {
    if (isGroupCall) {
      const allConvs = useChatStore.getState()?.conversations || [];
      const convList = Array.isArray(allConvs) ? allConvs : (allConvs?.data || []);
      const foundGroup = convList.find(
        (c) =>
          String(c._id) === String(call.groupId) ||
          (call.groupName && (c.groupName === call.groupName || c.name === call.groupName))
      );

      if (foundGroup) {
        setSelectedContact(foundGroup);
      } else {
        setSelectedContact({
          _id: call.groupId || call.contactId || "group-chat",
          username: contactName,
          name: contactName,
          profilePicture: contactAvatar,
          isGroup: true,
          participants: groupMembers,
        });
      }
      navigate("/");
      return;
    }

    if (matchedUser) {
      setSelectedContact(matchedUser);
    } else {
      setSelectedContact({
        _id: call.contactId || "temp-contact",
        username: call.contactName,
        profilePicture: call.contactAvatar,
        about: contactAbout,
        phoneNumber: contactPhone,
      });
    }
    navigate("/");
  };

  const handleStartAudio = () => {
    if (!onStartAudioCall) return;
    if (isGroupCall) {
      onStartAudioCall(contactId, contactName, contactAvatar, {
        isGroup: true,
        groupId: call.groupId || contactId,
        groupName: contactName,
        groupAvatar: contactAvatar,
        participantIds: groupMembers.map((m) => m._id),
        participants: groupMembers,
      });
    } else {
      onStartAudioCall(contactId, contactName, contactAvatar);
    }
  };

  const handleStartVideo = () => {
    if (!onStartVideoCall) return;
    if (isGroupCall) {
      onStartVideoCall(contactId, contactName, contactAvatar, {
        isGroup: true,
        groupId: call.groupId || contactId,
        groupName: contactName,
        groupAvatar: contactAvatar,
        participantIds: groupMembers.map((m) => m._id),
        participants: groupMembers,
      });
    } else {
      onStartVideoCall(contactId, contactName, contactAvatar);
    }
  };

  const handleToggleFav = () => {
    if (isFav) {
      removeFavourite(contactId);
    } else {
      addFavourite({
        _id: contactId,
        contactId,
        username: contactName,
        name: contactName,
        profilePicture: contactAvatar,
        about: contactAbout || (isGroupCall ? "Group conversation" : "WhatsApp contact"),
        isGroup: isGroupCall,
      });
    }
  };

  const handleDeleteAllCalls = () => {
    displayCalls.forEach((c) => removeCall(c.id));
    onClose();
  };

  return (
    <div
      className={`h-full w-full flex flex-col overflow-y-auto transition-colors duration-200 select-none ${
        isDark ? "bg-[#111b21] text-[#e9edef]" : "bg-[#f0f2f5] text-[#111b21]"
      }`}
    >
      {/* Header bar */}
      <div
        className={`h-16 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10 ${
          isDark ? "bg-[#111b21]" : "bg-[#f0f2f5]"
        }`}
      >
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDark
                  ? "hover:bg-[#202c33] text-gray-300"
                  : "hover:bg-[#e9edef] text-[#54656f] hover:text-[#111b21]"
              }`}
              title="Back"
            >
              <MdArrowBack className="text-xl" />
            </button>
          )}
          <h2
            className={`text-[18px] sm:text-[19px] font-semibold tracking-normal ${
              isDark ? "text-white" : "text-[#111b21]"
            }`}
          >
            Call info
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`p-2 rounded-full transition-colors cursor-pointer ${
            isDark
              ? "hover:bg-[#202c33] text-[#8696a0] hover:text-white"
              : "hover:bg-[#e9edef] text-[#54656f] hover:text-[#111b21]"
          }`}
          title="Close"
        >
          <MdClose className="text-xl" />
        </button>
      </div>

      <div className="px-6 py-2 max-w-6xl w-full flex flex-col gap-4">
        {/* Top Profile Card */}
        <div
          className={`rounded-2xl overflow-hidden border transition-colors shadow-xs ${
            isDark ? "border-[#222e35]/80 bg-[#111b21]" : "border-gray-200 bg-white shadow-sm"
          }`}
        >
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0 flex-1 pr-2">
              <ContactAvatar
                contact={{
                  username: contactName,
                  profilePicture: contactAvatar,
                }}
                size={52}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {isGroupCall && (
                    <MdPeople
                      className="text-emerald-500 text-xl shrink-0"
                      title="Group Call"
                    />
                  )}
                  <span
                    className={`text-[17px] font-semibold truncate tracking-tight ${
                      isDark ? "text-white" : "text-[#111b21]"
                    }`}
                  >
                    {contactName}
                  </span>
                </div>
                <div
                  className={`text-xs mt-0.5 ${
                    isDark ? "text-[#8696a0]" : "text-[#54656f]"
                  }`}
                >
                  {isGroupCall
                    ? `Group call • ${groupMembers.length} ${
                        groupMembers.length === 1 ? "participant" : "participants"
                      }`
                    : contactAbout || "WhatsApp contact"}
                </div>
              </div>
            </div>

            <div
              className={`flex items-center gap-5 sm:gap-6 shrink-0 ${
                isDark ? "text-[#e9edef]" : "text-[#54656f]"
              }`}
            >
              <button
                type="button"
                onClick={handleOpenChat}
                className="hover:text-emerald-500 active:scale-90 transition-all cursor-pointer p-1"
                title={isGroupCall ? "Message group" : "Message contact"}
                aria-label="Message"
              >
                <WhatsAppChatsIcon className="text-2xl" />
              </button>

              <button
                type="button"
                onClick={handleStartVideo}
                className="hover:text-emerald-500 active:scale-90 transition-all cursor-pointer p-1"
                title={isGroupCall ? "Video call group" : "Video call contact"}
                aria-label="Video call"
              >
                <MdOutlineVideocam className="text-3xl" />
              </button>

              <button
                type="button"
                onClick={handleStartAudio}
                className="hover:text-emerald-500 active:scale-90 transition-all cursor-pointer p-1"
                title={isGroupCall ? "Voice call group" : "Voice call contact"}
                aria-label="Voice call"
              >
                <MdOutlineCall className="text-2xl" />
              </button>
            </div>
          </div>

          {(contactPhone || contactEmail) && (
            <div
              className={`border-t px-4 py-3.5 sm:px-5 flex flex-col gap-3 ${
                isDark ? "border-[#222e35]/70 bg-white/[0.02]" : "border-gray-100 bg-gray-50/60"
              }`}
            >
              {contactPhone && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isDark ? "bg-[#202c33] text-[#00c878]" : "bg-[#e7fce3] text-[#008f5a]"
                      }`}
                    >
                      <MdOutlineCall className="text-base" />
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`text-[11px] font-medium uppercase tracking-wider ${
                          isDark ? "text-[#8696a0]" : "text-[#54656f]"
                        }`}
                      >
                        Phone number
                      </div>
                      <div
                        className={`text-[14px] font-medium truncate ${
                          isDark ? "text-[#e9edef]" : "text-[#111b21]"
                        }`}
                      >
                        {contactPhone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(contactPhone);
                        toast.success("Phone number copied to clipboard");
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isDark
                          ? "hover:bg-white/10 text-[#8696a0] hover:text-white"
                          : "hover:bg-black/5 text-[#54656f] hover:text-black"
                      }`}
                      title="Copy phone number"
                      aria-label="Copy phone number"
                    >
                      <MdOutlineContentCopy className="text-base" />
                    </button>
                  </div>
                </div>
              )}

              {contactEmail && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isDark ? "bg-[#202c33] text-[#00c878]" : "bg-[#e7fce3] text-[#008f5a]"
                      }`}
                    >
                      <MdOutlineEmail className="text-base" />
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`text-[11px] font-medium uppercase tracking-wider ${
                          isDark ? "text-[#8696a0]" : "text-[#54656f]"
                        }`}
                      >
                        Email address
                      </div>
                      <div
                        className={`text-[14px] font-medium truncate ${
                          isDark ? "text-[#e9edef]" : "text-[#111b21]"
                        }`}
                      >
                        {contactEmail}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(contactEmail);
                        toast.success("Email copied to clipboard");
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isDark
                          ? "hover:bg-white/10 text-[#8696a0] hover:text-white"
                          : "hover:bg-black/5 text-[#54656f] hover:text-black"
                      }`}
                      title="Copy email"
                      aria-label="Copy email"
                    >
                      <MdOutlineContentCopy className="text-base" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary Call Timing & Received Details Card */}
        <div
          className={`rounded-2xl overflow-hidden border transition-colors shadow-xs ${
            isDark ? "border-[#222e35]/80 bg-[#111b21]" : "border-gray-200 bg-white shadow-sm"
          }`}
        >
          {/* Call Received / Answered Status Banner */}
          <div
            className={`p-4 sm:p-5 border-b flex items-center gap-3.5 ${
              isAnsweredCall
                ? isDark
                  ? "bg-emerald-500/[0.08] border-emerald-500/20"
                  : "bg-emerald-50/70 border-emerald-100"
                : isMissedCall
                  ? isDark
                    ? "bg-red-500/[0.08] border-red-500/20"
                    : "bg-red-50/70 border-red-100"
                  : isDark
                    ? "border-[#222e35]/70"
                    : "border-gray-100"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isAnsweredCall
                  ? "bg-emerald-500/20 text-[#00a884]"
                  : isMissedCall
                    ? "bg-red-500/20 text-[#ea0038]"
                    : isDark
                      ? "bg-[#202c33] text-[#8696a0]"
                      : "bg-[#f0f2f5] text-[#54656f]"
              }`}
            >
              {isMissedCall ? (
                <MdCallMissed className="text-xl transform rotate-180" />
              ) : isIncomingCall ? (
                <MdCallReceived className="text-xl" />
              ) : (
                <MdCallMade className="text-xl" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div
                className={`text-[15px] font-semibold leading-tight ${
                  isMissedCall
                    ? "text-[#ea0038]"
                    : isAnsweredCall
                      ? isDark
                        ? "text-emerald-400"
                        : "text-emerald-700"
                      : isDark
                        ? "text-white"
                        : "text-[#111b21]"
                }`}
              >
                {isGroupCall ? (
                  call.answeredByName ? (
                    `Call received & answered by ${
                      user?._id && String(call.answeredBy) === String(user._id)
                        ? "You"
                        : call.answeredByName
                    }`
                  ) : isMissedCall ? (
                    "Missed call • Not answered by any member"
                  ) : isAnsweredCall ? (
                    "Group call connected"
                  ) : (
                    "Outgoing group call"
                  )
                ) : isMissedCall ? (
                  "Missed call"
                ) : isIncomingCall ? (
                  "Call received and answered"
                ) : (
                  "Outgoing call"
                )}
              </div>

              <div
                className={`text-xs mt-0.5 ${
                  isDark ? "text-[#8696a0]" : "text-[#54656f]"
                }`}
              >
                {callTypeLabel} call •{" "}
                {isGroupCall
                  ? `${groupMembers.length} group participants`
                  : isAnsweredCall
                    ? "Call connected successfully"
                    : "No connection established"}
              </div>
            </div>
          </div>

          {/* Call Time & Speaking Time Metrics */}
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Call Time */}
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                isDark
                  ? "bg-white/[0.02] border-[#222e35]/70"
                  : "bg-gray-50/70 border-gray-100"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  isDark ? "bg-[#202c33] text-emerald-400" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                <MdAccessTime className="text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isDark ? "text-[#8696a0]" : "text-[#54656f]"
                  }`}
                >
                  Call Time
                </div>
                <div
                  className={`text-[14px] font-medium mt-0.5 ${
                    isDark ? "text-white" : "text-[#111b21]"
                  }`}
                >
                  {dateLabel} at {timeLabel}
                </div>
                <div
                  className={`text-[11px] mt-0.5 truncate ${
                    isDark ? "text-[#8696a0]" : "text-[#54656f]"
                  }`}
                >
                  Initiated by {call.callerName || (call.direction === "outgoing" ? "You" : contactName)}
                </div>
              </div>
            </div>

            {/* Speaking Time */}
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                isDark
                  ? "bg-white/[0.02] border-[#222e35]/70"
                  : "bg-gray-50/70 border-gray-100"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  isDark ? "bg-[#202c33] text-blue-400" : "bg-blue-100 text-blue-700"
                }`}
              >
                <MdTimer className="text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isDark ? "text-[#8696a0]" : "text-[#54656f]"
                  }`}
                >
                  Speaking Time
                </div>
                <div
                  className={`text-[14px] font-medium mt-0.5 ${
                    isDark ? "text-white" : "text-[#111b21]"
                  }`}
                >
                  {speakingDuration}
                </div>
                <div
                  className={`text-[11px] mt-0.5 truncate ${
                    isDark ? "text-[#8696a0]" : "text-[#54656f]"
                  }`}
                >
                  {isAnsweredCall ? "Duration of active conversation" : "No conversation duration"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Group Members Section */}
        {isGroupCall && (
          <div
            className={`rounded-2xl overflow-hidden border transition-colors shadow-xs ${
              isDark ? "border-[#222e35]/80 bg-[#111b21]" : "border-gray-200 bg-white shadow-sm"
            }`}
          >
            <div
              className={`px-4 py-3 sm:px-5 flex items-center justify-between border-b ${
                isDark ? "border-[#222e35]/70" : "border-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <MdPeople className="text-emerald-500 text-lg" />
                <span
                  className={`text-[15px] font-semibold ${
                    isDark ? "text-white" : "text-[#111b21]"
                  }`}
                >
                  All Group Members
                </span>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  isDark
                    ? "bg-[#202c33] text-[#8696a0]"
                    : "bg-[#f0f2f5] text-[#54656f]"
                }`}
              >
                {groupMembers.length} {groupMembers.length === 1 ? "member" : "members"}
              </span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-[#222e35]/50">
              {groupMembers.map((member, idx) => {
                const isMemberCaller =
                  (call.callerId && String(member._id) === String(call.callerId)) ||
                  (call.callerName && member.username === call.callerName) ||
                  (call.direction === "outgoing" &&
                    user?._id &&
                    String(member._id) === String(user._id));

                const isMemberAnswered =
                  (call.answeredBy && String(member._id) === String(call.answeredBy)) ||
                  (call.answeredByName && member.username === call.answeredByName) ||
                  (call.direction === "incoming" &&
                    user?._id &&
                    String(member._id) === String(user._id) &&
                    (call.status === "completed" || call.speakingTime));

                const isYou = user?._id && String(member._id) === String(user._id);

                return (
                  <div
                    key={member._id || idx}
                    className={`p-3.5 sm:px-5 flex items-center justify-between gap-3 transition-colors ${
                      isDark ? "hover:bg-[#182229]" : "hover:bg-[#f5f6f6]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <ContactAvatar
                        contact={{
                          username: member.username,
                          profilePicture: member.profilePicture,
                        }}
                        size={40}
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-[14px] font-medium truncate flex items-center gap-1.5 ${
                            isDark ? "text-[#e9edef]" : "text-[#111b21]"
                          }`}
                        >
                          <span className="truncate">{member.username}</span>
                          {isYou && (
                            <span
                              className={`text-[11px] px-1.5 py-0.2 rounded font-normal ${
                                isDark ? "bg-[#202c33] text-[#8696a0]" : "bg-gray-100 text-[#54656f]"
                              }`}
                            >
                              You
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          {isMemberCaller ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                              <MdCallMade className="text-xs" />
                              Caller / Initiator
                            </span>
                          ) : isMemberAnswered ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400">
                              <MdCallReceived className="text-xs" />
                              Received Call {call.speakingTime ? `(${call.speakingTime})` : ""}
                            </span>
                          ) : (
                            <span
                              className={`text-[11px] ${
                                isDark ? "text-[#8696a0]" : "text-[#54656f]"
                              }`}
                            >
                              Rung • Not answered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isMemberAnswered && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          Answered
                        </span>
                      )}

                      {!isYou && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedContact(member);
                            navigate("/");
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark
                              ? "hover:bg-white/10 text-[#8696a0] hover:text-white"
                              : "hover:bg-black/5 text-[#54656f] hover:text-black"
                          }`}
                          title={`Message ${member.username}`}
                        >
                          <WhatsAppChatsIcon className="text-lg" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Call History Entries */}
        <div
          className={`rounded-2xl overflow-hidden border transition-colors shadow-xs ${
            isDark ? "border-[#222e35]/80 bg-[#111b21]" : "border-gray-200 bg-white shadow-sm"
          }`}
        >
          <div
            className={`px-4 py-3 sm:px-5 border-b text-[13px] font-semibold uppercase tracking-wider ${
              isDark
                ? "border-[#222e35]/70 text-[#8696a0]"
                : "border-gray-100 text-[#54656f]"
            }`}
          >
            Call History
          </div>

          <div className="p-4 sm:p-5 flex flex-col gap-3">
            {displayCalls.map((item, idx) => {
              const itemMissed = item.direction === "missed";
              const itemIncoming = item.direction === "incoming";
              const itemDateLabel = formatCallDate(item) || "Today";
              const itemTimeLabel = item.callTimeFormatted || item.timeFormatted || "04:07";
              const itemTypeLabel = item.callType === "video" ? "video" : "voice";
              const itemDirectionWord = itemMissed
                ? "Missed"
                : itemIncoming
                  ? "Incoming"
                  : "Outgoing";

              const itemStatusText =
                itemMissed
                  ? "Unanswered"
                  : item.speakingTime || (item.duration && item.duration !== "Connected" ? item.duration : "Connected");

              return (
                <div key={item.id || idx} className="flex flex-col">
                  <div
                    className={`text-[13px] font-normal mb-1.5 ${
                      isDark ? "text-[#8696a0]" : "text-[#54656f]"
                    }`}
                  >
                    {itemDateLabel}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {itemMissed ? (
                        <MdCallMissed className="text-[#f15c6d] text-lg shrink-0 transform rotate-180" />
                      ) : itemIncoming ? (
                        <MdCallReceived className="text-[#00a884] text-lg shrink-0" />
                      ) : (
                        <MdCallMade
                          className={`text-lg shrink-0 ${
                            isDark ? "text-[#8696a0]" : "text-[#54656f]"
                          }`}
                        />
                      )}

                      <span
                        className={`text-[14px] truncate ${
                          isDark ? "text-[#e9edef]" : "text-[#111b21]"
                        }`}
                      >
                        {itemDirectionWord} {itemTypeLabel} call at {itemTimeLabel}
                      </span>
                    </div>

                    <span
                      className={`text-[13px] shrink-0 font-normal ${
                        isDark ? "text-[#8696a0]" : "text-[#54656f]"
                      }`}
                    >
                      {itemStatusText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Favourites Toggle */}
        <div
          onClick={handleToggleFav}
          className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all border shadow-xs ${
            isFav
              ? isDark
                ? "bg-[#182229] border-emerald-500/40 text-[#e9edef]"
                : "bg-[#e7fce3]/60 border-[#25d366]/40 text-[#111b21] shadow-xs"
              : isDark
                ? "bg-[#182229] border-[#222e35]/80 text-[#e9edef] hover:bg-[#202c33]"
                : "bg-white border-gray-200 text-[#111b21] hover:bg-[#f5f6f6] shadow-sm"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isFav
                  ? "bg-emerald-500/20 text-yellow-500"
                  : isDark
                    ? "bg-[#202c33] text-gray-400"
                    : "bg-[#f0f2f5] text-[#54656f]"
              }`}
            >
              {isFav ? (
                <MdStar className="text-2xl text-yellow-500" />
              ) : (
                <MdStarBorder className="text-2xl" />
              )}
            </div>

            <div>
              <div
                className={`text-[15px] font-medium leading-tight ${
                  isDark ? "text-white" : "text-[#111b21]"
                }`}
              >
                {isFav ? "In Favourites" : "Add to favourites"}
              </div>
              <div
                className={`text-xs mt-0.5 ${
                  isDark ? "text-[#8696a0]" : "text-[#54656f]"
                }`}
              >
                {isFav
                  ? "This conversation is in your favourites list"
                  : "Add for quick calling"}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              isFav
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                : "bg-[#00a884] text-black hover:bg-[#008f6f]"
            }`}
          >
            {isFav ? "Remove" : "Add"}
          </button>
        </div>

        {/* Delete Call History */}
        <div className="flex justify-center mt-2 mb-6">
          <button
            type="button"
            onClick={handleDeleteAllCalls}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              isDark
                ? "hover:bg-red-500/10 text-red-400 hover:text-red-300"
                : "hover:bg-red-50 text-red-600 font-medium"
            }`}
          >
            <MdDeleteOutline className="text-base" />
            <span>Delete call history with {contactName}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallInfo;
