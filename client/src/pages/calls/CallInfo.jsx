import React from "react";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../../store/themeStore";
import useCallStore from "../../store/useCallStore";
import useLayoutStore from "../../store/layoutStore";
import { useChatStore } from "../../store/chatStore";
import { ContactAvatar } from "./FaviouriteCall";
import { formatCallDate } from "../../utils/formatTime";
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

  const matchedUser = users.find(
    (u) =>
      u._id === call.contactId ||
      u.username?.toLowerCase() === call.contactName?.toLowerCase()
  );

  const contactName = matchedUser?.username || call.contactName || "Unknown";
  const contactAvatar = matchedUser?.profilePicture || call.contactAvatar;
  const contactPhone = matchedUser?.phoneNumber || "+91 98765 43210";
  const contactAbout = matchedUser?.about || "Hey there! I am using WhatsApp";
  const contactId = matchedUser?._id || call.contactId || call.id;

  const isFav = isFavourite(contactId);

  const relatedCalls = callHistory.filter(
    (c) =>
      c.contactName?.toLowerCase() === call.contactName?.toLowerCase() ||
      (c.contactId && c.contactId === call.contactId)
  );

  const displayCalls = relatedCalls.length > 0 ? relatedCalls : [call];

  const handleOpenChat = () => {
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
        about: contactAbout,
      });
    }
  };

  const handleDeleteAllCalls = () => {
    displayCalls.forEach((c) => removeCall(c.id));
    onClose();
  };

  return (
    <div
      className={`h-full w-full flex flex-col overflow-y-auto transition-colors duration-200 select-none ${isDark ? "bg-[#111b21] text-[#e9edef]" : "bg-[#f0f2f5] text-[#111b21]"
        }`}
    >
      <div
        className={`h-16 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10 ${isDark
          ? "bg-[#111b21]"
          : "bg-[#f0f2f5]"
          }`}
      >
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
                ? "hover:bg-[#202c33] text-gray-300"
                : "hover:bg-[#e9edef] text-[#54656f] hover:text-[#111b21]"
                }`}
              title="Back"
            >
              <MdArrowBack className="text-xl" />
            </button>
          )}
          <h2
            className={`text-[18px] sm:text-[19px] font-semibold tracking-normal ${isDark ? "text-white" : "text-[#111b21]"
              }`}
          >
            Call info
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
            ? "hover:bg-[#202c33] text-[#8696a0] hover:text-white"
            : "hover:bg-[#e9edef] text-[#54656f] hover:text-[#111b21]"
            }`}
          title="Close"
        >
          <MdClose className="text-xl" />
        </button>
      </div>

      <div className="px-6 py-2 max-w-6xl w-full flex flex-col gap-4">
        <div
          className={`rounded-2xl overflow-hidden border transition-colors shadow-xs ${isDark
            ? "border-[#222e35]/80"
            : "border-gray-200 shadow-sm"
            }`}
        >
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0 flex-1 pr-2">
              <ContactAvatar
                contact={{
                  username: contactName,
                  profilePicture: contactAvatar,
                }}
                size={48}
              />
              <span
                className={`text-[17px] font-medium truncate tracking-tight ${isDark ? "text-white" : "text-[#111b21]"
                  }`}
              >
                {contactName}
              </span>
            </div>

            <div
              className={`flex items-center gap-5 sm:gap-6 shrink-0 ${isDark ? "text-[#e9edef]" : "text-[#54656f]"
                }`}
            >
              <button
                type="button"
                onClick={handleOpenChat}
                className="hover:text-emerald-500 active:scale-90 transition-all cursor-pointer p-1"
                title="Message"
                aria-label="Message contact"
              >
                <WhatsAppChatsIcon className="text-2xl" />
              </button>

              <button
                type="button"
                onClick={() =>
                  onStartVideoCall
                    ? onStartVideoCall(contactId, contactName, contactAvatar)
                    : null
                }
                className="hover:text-emerald-500 active:scale-90 transition-all cursor-pointer p-1"
                title="Video call"
                aria-label="Video call contact"
              >
                <MdOutlineVideocam className="text-3xl" />
              </button>

              <button
                type="button"
                onClick={() =>
                  onStartAudioCall
                    ? onStartAudioCall(contactId, contactName, contactAvatar)
                    : null
                }
                className="hover:text-emerald-500 active:scale-90 transition-all cursor-pointer p-1"
                title="Voice call"
                aria-label="Voice call contact"
              >
                <MdOutlineCall className="text-2xl" />
              </button>
            </div>
          </div>

          <div
            className={`border-t ${isDark ? "border-[#222e35]/70" : "border-gray-100"
              }`}
          />

          <div className="p-4 sm:p-5 flex flex-col gap-3">
            {displayCalls.map((item, idx) => {
              const isMissed = item.direction === "missed";
              const isIncoming = item.direction === "incoming";
              const dateLabel = formatCallDate(item) || "Today";
              const timeLabel = item.timeFormatted || "04:07";
              const callTypeLabel = item.callType === "video" ? "video" : "voice";
              const directionWord = isMissed
                ? "Missed"
                : isIncoming
                  ? "Incoming"
                  : "Outgoing";

              const statusText =
                isMissed
                  ? "Unanswered"
                  : item.duration && item.duration !== "Connected"
                    ? item.duration
                    : "Unanswered";

              return (
                <div key={item.id || idx} className="flex flex-col">
                  <div
                    className={`text-[13px] font-normal mb-2 ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                      }`}
                  >
                    {dateLabel}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isMissed ? (
                        <MdCallMissed className="text-[#f15c6d] text-lg shrink-0 transform rotate-180" />
                      ) : isIncoming ? (
                        <MdCallReceived className="text-[#00a884] text-lg shrink-0" />
                      ) : (
                        <MdCallMade
                          className={`text-lg shrink-0 ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                            }`}
                        />
                      )}

                      <span
                        className={`text-[14px] truncate ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
                          }`}
                      >
                        {directionWord} {callTypeLabel} call at {timeLabel}
                      </span>
                    </div>

                    <span
                      className={`text-[13px] shrink-0 font-normal ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                        }`}
                    >
                      {statusText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          onClick={handleToggleFav}
          className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all border shadow-xs ${isFav
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
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isFav
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
                className={`text-[15px] font-medium leading-tight ${isDark ? "text-white" : "text-[#111b21]"
                  }`}
              >
                {isFav ? "In Favourites" : "Add to favourites"}
              </div>
              <div
                className={`text-xs mt-0.5 ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                  }`}
              >
                {isFav
                  ? "This contact is in your favourites list"
                  : "Add this contact for quick calling"}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs ${isFav
              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
              : "bg-[#00a884] text-black hover:bg-[#008f6f]"
              }`}
          >
            {isFav ? "Remove" : "Add"}
          </button>
        </div>

        <div className="flex justify-center mt-2">
          <button
            type="button"
            onClick={handleDeleteAllCalls}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${isDark
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
