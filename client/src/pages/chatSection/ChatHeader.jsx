import React from "react";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa6";
import { FaLock, FaUsers } from "react-icons/fa";
import { FaCaretDown } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { RxCross2 } from "react-icons/rx";
import { HiDotsVertical } from "react-icons/hi";
import { LuVideo, LuPhone, LuUserCheck, LuLink } from "react-icons/lu";
import { toast } from "react-toastify";
import formatTimestamp from "../../utils/formatTime";
import { WhatsAppDisappearingIcon } from "./MessageBuble";
import { ChevronUpIcon, ChevronDownIcon } from "../../components/common/Icons";
import { MetaAiRing, META_AI_USER_ID } from "../../components/common/MetaAiIcon";
import MetaAiPersonaSelector from "../../components/common/MetaAiPersonaSelector";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import useVideoCallStore from "../../store/videoCallStore";
import GroupCallModal from "../../components/modals/GroupCallModal";

const ChatHeader = ({
  handleChatContextMenu,
  theme,
  selectedContact,
  setSelectedContact,
  setCurrentConversation,
  setShowContactInfo,
  online,
  openContactInfoWithTab,
  disappearingDuration,
  isTyping,
  lastSeen,
  searchIconRef,
  isSearchOpen,
  setIsSearchOpen,
  setIsChatSearchOpen,
  inputRef,
  searchTerm,
  setSearchTerm,
  resultCount,
  currentIndex,
  goPrev,
  goNext,
  handleVideoCall,
  handleAudioCall,
  headerMenuBtnRef,
  setHeaderMenuAnchor,
  setShowHeaderMenu,
  onCloseChat,
  handleOpenSummarize,
}) => {
  const { user } = useUserStore();
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const isUserOnline = useChatStore((state) => state.isUserOnline);
  const getGroupOnlineCount = useChatStore((state) => state.getGroupOnlineCount);
  const checkUserStatus = useChatStore((state) => state.checkUserStatus);
  const sendCallLinkMessage = useChatStore((state) => state.sendCallLinkMessage);
  const liveTranslateEnabled = useChatStore((state) => state.liveTranslateEnabled);
  const liveTranslateLang = useChatStore((state) => state.liveTranslateLang);
  const toggleLiveTranslate = useChatStore((state) => state.toggleLiveTranslate);
  const setLiveTranslate = useChatStore((state) => state.setLiveTranslate);

  const activeGroupCall = useVideoCallStore((state) => state.activeGroupCall);
  const currentCall = useVideoCallStore((state) => state.currentCall);
  const isCallModalOpen = useVideoCallStore((state) => state.isCallModalOpen);
  const joinGroupCall = useVideoCallStore((state) => state.joinGroupCall);

  const [isCallDropdownOpen, setIsCallDropdownOpen] = React.useState(false);
  const [showSelectPeopleModal, setShowSelectPeopleModal] = React.useState(false);
  const callDropdownRef = React.useRef(null);

  React.useEffect(() => {
    if (!isCallDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (callDropdownRef.current && !callDropdownRef.current.contains(e.target)) {
        setIsCallDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCallDropdownOpen]);

  const isMetaAi =
    selectedContact?.isAI ||
    selectedContact?.username === "Meta AI" ||
    String(selectedContact?._id) === META_AI_USER_ID;

  const isGroup = Boolean(
    selectedContact?.isGroup ||
    selectedContact?.isGroupChat ||
    selectedContact?.conversation?.isGroup
  );

  const participants = React.useMemo(() => {
    return (
      selectedContact?.participants ||
      selectedContact?.conversation?.participants ||
      []
    );
  }, [selectedContact]);

  React.useEffect(() => {
    if (isGroup && participants.length > 0 && typeof checkUserStatus === "function") {
      const myIdStr = user?._id?.toString();
      participants.forEach((p) => {
        const pId = (p?._id || p)?.toString();
        if (pId && pId !== myIdStr) {
          checkUserStatus(pId);
        }
      });
    }
  }, [isGroup, participants, user?._id, checkUserStatus]);

  const groupOnlineCount = React.useMemo(() => {
    if (!isGroup) return 0;
    return getGroupOnlineCount ? getGroupOnlineCount(participants, user?._id) : 0;
  }, [isGroup, participants, user?._id, onlineUsers, getGroupOnlineCount]);

  const isGroupOnline = isGroup && groupOnlineCount > 0;

  const onlineMemberNames = React.useMemo(() => {
    if (!isGroup || !isUserOnline) return "";
    const myIdStr = user?._id?.toString();
    return participants
      .filter((p) => {
        const pId = (p?._id || p)?.toString();
        return pId && pId !== myIdStr && isUserOnline(pId);
      })
      .map((p) => p?.username || p?.name || "Member")
      .join(", ");
  }, [isGroup, participants, user?._id, onlineUsers, isUserOnline]);

  const groupSubtitle = React.useMemo(() => {
    if (!isGroup) return "";
    const currentUserId = user?._id?.toString();
    const names = participants.map((p) => {
      const pId = (p?._id || p)?.toString();
      if (pId === currentUserId) return "You";
      return p?.username || p?.name || "Member";
    });
    return names.length > 0 ? names.join(", ") : "Group members";
  }, [isGroup, participants, user?._id]);

  const [showInitialInfo, setShowInitialInfo] = React.useState(true);

  React.useEffect(() => {
    setShowInitialInfo(true);
    const timer = setTimeout(() => {
      setShowInitialInfo(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [selectedContact?._id, selectedContact?.conversation?._id]);

  const currentGroupId = React.useMemo(() => {
    return (selectedContact?._id || selectedContact?.conversation?._id)?.toString();
  }, [selectedContact]);

  const isCurrentGroupCallActive = React.useMemo(() => {
    if (!isGroup || !activeGroupCall || !activeGroupCall.isActive) return false;
    const gId = (activeGroupCall.groupId?._id || activeGroupCall.groupId)?.toString();
    if (!gId || !currentGroupId || gId !== currentGroupId) return false;
    if (activeGroupCall.status === "ended") return false;

    const participantCount = activeGroupCall.joinedParticipants?.length || 0;
    if (participantCount === 0) return false;
    if (activeGroupCall.status === "ongoing" && participantCount < 2) return false;

    return true;
  }, [isGroup, activeGroupCall, currentGroupId]);

  const isUserInCurrentCall = React.useMemo(() => {
    if (!isCurrentGroupCallActive) return false;
    const myId = user?._id?.toString();
    const inActiveCallStore = currentCall && currentCall.groupId === currentGroupId && isCallModalOpen;
    const inJoinedParticipants = activeGroupCall?.joinedParticipants?.some(
      (p) => (p.userId || p._id || p)?.toString() === myId
    );
    return Boolean(inActiveCallStore || inJoinedParticipants);
  }, [isCurrentGroupCallActive, currentCall, currentGroupId, isCallModalOpen, activeGroupCall, user?._id]);

  return (
    <div
      onContextMenu={handleChatContextMenu}
      className={`px-3 py-1.5 sm:px-3 sm:py-1.3 min-h-[58px] border-b shrink-0 z-30 ${theme === "dark"
        ? "bg-[#202c33] border-gray-700/60 text-white"
        : "bg-[#f0f2f5] border-gray-200 text-gray-900"
        } flex items-center`}
    >
      <button
        onClick={() => {
          if (onCloseChat) {
            onCloseChat();
          } else {
            setSelectedContact?.(null);
            setCurrentConversation?.(null);
          }
        }}
        className="mr-1 sm:mr-2 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
        title="Back to chats"
      >
        <FaArrowLeft className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
      </button>

      <div className="relative ml-1 sm:ml-2">
        {isMetaAi ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowContactInfo(true);
            }}
            title="View Meta AI info"
            className="cursor-pointer active:scale-95 transition-transform"
          >
            <MetaAiRing size={40} className="shadow-sm" />
          </div>
        ) : isGroup ? (
          selectedContact?.profilePicture ? (
            <img
              src={selectedContact.profilePicture}
              alt={selectedContact.username}
              onClick={(e) => {
                e.stopPropagation();
                setShowContactInfo(true);
              }}
              title="View group info"
              className="w-10 h-10 rounded-full cursor-pointer object-cover hover:opacity-90 active:scale-95 transition-all shadow-sm"
            />
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowContactInfo(true);
              }}
              title="View group info"
              className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-[#00a884]/20 text-[#00a884] dark:bg-emerald-500/20 dark:text-emerald-400 select-none shadow-sm border border-emerald-500/30 cursor-pointer"
            >
              <FaUsers size={20} />
            </div>
          )
        ) : (
          <motion.img
            layoutId="profile-image"
            src={selectedContact?.profilePicture || "/default-avatar.png"}
            alt={selectedContact?.username}
            onClick={(e) => {
              e.stopPropagation();
              setShowContactInfo(true);
            }}
            title="View contact info"
            className="w-10 h-10 rounded-full cursor-pointer object-cover hover:opacity-90 active:scale-95 transition-all shadow-sm"
          />
        )}

        {((isGroup ? isGroupOnline : online) && !isMetaAi) && (
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${theme === "dark" ? "border-[#202c33]" : "border-white"
            } bg-emerald-500 shadow-sm`}
            title={isGroup ? `${groupOnlineCount} online` : "Online"}
          ></span>
        )}

        {disappearingDuration && disappearingDuration !== "Off" && (
          <span className={`absolute bottom-0 ${(isGroup ? isGroupOnline : online) && !isMetaAi ? "left-0" : "right-0"} w-4 h-4 rounded-full border ${theme === "dark" ? "border-[#202c33] bg-[#111b21]" : "border-white bg-[#f0f2f5]"
            } flex items-center justify-center text-[#8696a0] shadow-sm`}
            title={`Disappearing messages: ${disappearingDuration}`}
          >
            <WhatsAppDisappearingIcon size={10} />
          </span>
        )}
      </div>

      <div className="ml-3 flex-grow cursor-pointer min-w-0 group"
        onClick={() => setShowContactInfo(true)}
        title="View contact info"
      >
        <div className="flex items-center gap-2">
          <h2 className={`font-semibold text-start text-base sm:text-lg truncate group-hover:text-emerald-500 transition-colors ${theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {selectedContact?.username}
          </h2>
          {isMetaAi ? (
            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
              <MetaAiPersonaSelector theme={theme} />
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openContactInfoWithTab("security");
              }}
              title="End-to-end encrypted chat. Click to verify."
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <FaLock className="w-2.5 h-2.5" />
              <span className="font-medium hidden sm:inline">Encrypted</span>
            </button>
          )}

          {disappearingDuration !== "Off" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openContactInfoWithTab("disappearing");
              }}
              title={`Disappearing messages: ${disappearingDuration}. Click to change.`}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <WhatsAppDisappearingIcon size={12} className="shrink-0" />
              <span className="font-medium">{disappearingDuration}</span>
            </button>
          )}
        </div>

        {isTyping ? (
          <div className="text-xs sm:text-sm text-emerald-500 font-medium">
            {isMetaAi ? "thinking..." : "Typing..."}
          </div>
        ) : isMetaAi ? (
          < >
          </>
        ) : isGroup ? (
          isGroupOnline ? (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-500 dark:text-emerald-400 font-medium truncate"
              title={onlineMemberNames ? `Online: ${onlineMemberNames}` : `${groupOnlineCount} online`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
              <span>
                {groupOnlineCount} {groupOnlineCount === 1 ? "member" : "members"} online
              </span>
            </div>
          ) : showInitialInfo ? (
            <p
              onClick={(e) => {
                e.stopPropagation();
                setShowContactInfo(true);
              }}
              className={`text-xs sm:text-sm truncate cursor-pointer hover:underline ${theme === "dark"
                ? "text-gray-400 hover:text-emerald-400"
                : "text-gray-500 hover:text-emerald-600"
                } transition-colors`}
              title="Click here for group info"
            >
              click here for group info
            </p>
          ) : (
            <p className={`text-xs sm:text-sm truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
              title={groupSubtitle}
            >
              {groupSubtitle}
            </p>
          )
        ) : (
          <p className={`text-xs sm:text-sm truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {online
              ? "Online"
              : lastSeen
                ? `Last seen ${formatTimestamp(lastSeen)}`
                : "Offline"}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0 relative">
        {!isMetaAi && (
          isGroup ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {isCurrentGroupCallActive && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isUserInCurrentCall && joinGroupCall) {
                      joinGroupCall(activeGroupCall);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all cursor-pointer select-none ${isUserInCurrentCall
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-[#00a884] hover:bg-[#02906f] text-white active:scale-95 shadow-[#00a884]/30"
                    }`}
                  title={isUserInCurrentCall ? "You are in this call" : "Join ongoing group call"}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${isUserInCurrentCall ? "bg-emerald-400" : "bg-white animate-ping"
                      }`}
                  />
                  <span>
                    {isUserInCurrentCall
                      ? "In Call"
                      : `Join (${activeGroupCall?.joinedParticipants?.length || 1})`}
                  </span>
                </button>
              )}

              <div className="relative" ref={callDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCallDropdownOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all cursor-pointer ${isCallDropdownOpen
                    ? theme === "dark"
                      ? "bg-[#2a3942] border-[#374248] text-white"
                      : "bg-gray-200 border-gray-300 text-gray-900"
                    : theme === "dark"
                      ? "border-transparent text-[#aebac1] hover:text-white hover:bg-white/10"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-black/5"
                    }`}
                  title="Call group"
                >
                  <LuVideo size={25} />
                  <FaCaretDown className={`h-2.5 w-2.5 transition-transform duration-200 ${isCallDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isCallDropdownOpen && (
                  <div className={`absolute right-0 top-full mt-2 w-52 sm:w-56 rounded-2xl py-2 shadow-2xl z-50 border transition-all animate-in fade-in zoom-in-95 duration-150 ${theme === "dark"
                    ? "bg-[#233138] border-[#374248] text-[#e9edef]"
                    : "bg-white border-gray-100 text-[#111b21] shadow-[0_10px_35px_rgba(0,0,0,0.12)]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsCallDropdownOpen(false);
                        handleAudioCall?.();
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-left text-[14.5px] transition-colors cursor-pointer ${theme === "dark"
                        ? "hover:bg-[#182229] text-[#e9edef]"
                        : "hover:bg-[#f5f6f6] text-[#111b21]"
                        }`}
                    >
                      <LuPhone className="h-[18px] w-[18px] text-[#aebac1]" />
                      <span className="font-normal">Voice call</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCallDropdownOpen(false);
                        handleVideoCall?.();
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-left text-[14.5px] transition-colors cursor-pointer ${theme === "dark"
                        ? "hover:bg-[#182229] text-[#e9edef]"
                        : "hover:bg-[#f5f6f6] text-[#111b21]"
                        }`}
                    >
                      <LuVideo className="h-[18px] w-[18px] text-[#aebac1]" />
                      <span className="font-normal">Video call</span>
                    </button>

                    <div className={`my-1 border-t ${theme === "dark" ? "border-white/10" : "border-gray-200/80"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setIsCallDropdownOpen(false);
                        setShowSelectPeopleModal(true);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-left text-[14.5px] transition-colors cursor-pointer ${theme === "dark"
                        ? "hover:bg-[#182229] text-[#e9edef]"
                        : "hover:bg-[#f5f6f6] text-[#111b21]"
                        }`}
                    >
                      <LuUserCheck className="h-[18px] w-[18px] text-[#aebac1]" />
                      <span className="font-normal">Select people</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setIsCallDropdownOpen(false);
                        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
                        const callUrl = `https://call.whatsapp.com/video/${code}`;
                        const gId = (selectedContact?._id || selectedContact?.conversation?._id)?.toString();
                        try {
                          if (typeof sendCallLinkMessage === "function") {
                            await sendCallLinkMessage({
                              receiverId: gId,
                              conversationId: selectedContact?.conversation?._id || gId,
                              callType: "video",
                              linkCode: code,
                              url: callUrl,
                              isGroup: true,
                              groupId: gId,
                            });
                          }
                          if (navigator?.clipboard?.writeText) {
                            await navigator.clipboard.writeText(callUrl);
                            toast.success("Call link copied to clipboard and sent to group");
                          } else {
                            toast.success("Call link sent to group");
                          }
                        } catch (err) {
                          console.error("Error sending call link:", err);
                          toast.error("Failed to send call link");
                        }
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-left text-[14.5px] transition-colors cursor-pointer ${theme === "dark"
                        ? "hover:bg-[#182229] text-[#e9edef]"
                        : "hover:bg-[#f5f6f6] text-[#111b21]"
                        }`}
                    >
                      <LuLink className="h-[18px] w-[18px] text-[#aebac1]" />
                      <span className="font-normal">Send call link</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button className="p-2 rounded-full border border-transparent hover:border-black/10 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer text-gray-600 dark:text-[#aebac1] hover:text-emerald-500"
                onClick={handleVideoCall}
                title={online ? "Start video call" : "user is offline"}
              >
                <LuVideo className="h-5 w-5" />
              </button>

              <button className="p-2 rounded-full border border-transparent hover:border-black/10 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer text-gray-600 dark:text-[#aebac1] hover:text-emerald-500"
                onClick={handleAudioCall}
                title={online ? "Start audio call" : "user is offline"}
              >
                <LuPhone className="h-4.5 w-4.5" />
              </button>
            </div>
          )
        )}

        {!isMetaAi && handleOpenSummarize && (
          <button
            type="button"
            onClick={handleOpenSummarize}
            className="p-2 rounded-full border border-transparent hover:border-cyan-500/30 hover:bg-cyan-500/10 active:scale-95 transition-all cursor-pointer text-cyan-500"
            title="Summarize conversation with Meta AI"
          >
            <span className="text-base leading-none">✨</span>
          </button>
        )}

        {!isMetaAi && (
          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                toggleLiveTranslate();
                toast.info(
                  !liveTranslateEnabled
                    ? `🌐 Live Chat Translation ON (${(liveTranslateLang || "en").toUpperCase()})`
                    : "Live Chat Translation OFF"
                );
              }}
              className={`p-2 rounded-full border transition-all cursor-pointer ${liveTranslateEnabled
                  ? "bg-blue-500/20 text-blue-500 border-blue-500/40 shadow-xs scale-105"
                  : "border-transparent text-gray-600 dark:text-[#aebac1] hover:text-blue-500 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              title={
                liveTranslateEnabled
                  ? `Live translation active (${(liveTranslateLang || "en").toUpperCase()}) - Click to turn off`
                  : "Enable real-time chat translation"
              }
            >
              <span className="text-base leading-none">🌐</span>
            </button>

            {liveTranslateEnabled && (
              <select
                value={liveTranslateLang || "en"}
                onChange={(e) => {
                  setLiveTranslate(true, e.target.value);
                  toast.success(`Language set to ${e.target.value.toUpperCase()}`);
                }}
                className={`text-[11px] font-semibold uppercase px-1.5 py-1 rounded-lg border outline-none cursor-pointer transition-colors ${theme === "dark"
                    ? "bg-[#202c33] border-blue-500/40 text-blue-400"
                    : "bg-blue-50 border-blue-300 text-blue-600"
                  }`}
                title="Select target translation language"
              >
                <option value="en">EN (English)</option>
                <option value="hi">HI (हिंदी)</option>
                <option value="es">ES (Español)</option>
                <option value="bn">BN (বাংলা)</option>
                <option value="fr">FR (Français)</option>
                <option value="de">DE (Deutsch)</option>
                <option value="ar">AR (العربية)</option>
                <option value="ja">JA (日本語)</option>
                <option value="ru">RU (Русский)</option>
                <option value="zh">ZH (中文)</option>
                <option value="it">IT (Italiano)</option>
                <option value="pt">PT (Português)</option>
                <option value="ko">KO (한국어)</option>
              </select>
            )}
          </div>
        )}

        {!isMetaAi && (
          <div
            className={`h-5 w-[1px] mx-0.5 sm:mx-1 ${theme === "dark" ? "bg-white/15" : "bg-gray-300"
              }`}
          />
        )}

        <div className="relative" ref={searchIconRef}>
          <button
            onClick={() => setIsSearchOpen(true)}
            title="Search in chat"
            className={`${isSearchOpen
              ? "opacity-0 pointer-events-none scale-90"
              : "opacity-100 scale-100"
              } p-2 rounded-full border border-transparent hover:border-black/10 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer text-gray-600 dark:text-[#aebac1] hover:text-emerald-500`}
          >
            <FiSearch className="h-4.5 w-4.5" />
          </button>

          <div className={`absolute right-0 top-1/2 -translate-y-1/2 origin-right transition-all duration-300 z-40 ${isSearchOpen
            ? "w-60 sm:w-64 scale-100 opacity-100"
            : "w-0 scale-95 opacity-0 pointer-events-none"
            }`}
          >
            <div className="relative flex flex-col">
              <div className="relative w-full rounded-xl overflow-hidden group transition-all duration-300">
                <div className={`absolute inset-0 rounded-xl pointer-events-none bg-gradient-to-br opacity-60 group-focus-within:opacity-80 transition-all duration-300 
                  ${theme === "dark"
                    ? "from-white/10 via-white/5 to-transparent"
                    : "from-white/60 via-white/30 to-transparent"
                  }`}
                />

                <input
                  autoFocus
                  ref={inputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-8 pr-8 py-1.5 rounded-xl outline-none text-xs relative z-10 backdrop-blur-xl border transition-all duration-300
                  ${theme === "dark"
                      ? "bg-zinc-800/90 text-white placeholder:text-gray-500 border-white/10 hover:border-emerald-500/50 focus:border-emerald-400"
                      : "bg-white/95 text-gray-900 placeholder:text-gray-400 border-gray-200/80 hover:border-emerald-500/50 focus:border-emerald-400"
                    } shadow-[0_4px_15px_rgba(0,0,0,0.1)] focus:shadow-[0_6px_20px_rgba(0,255,150,0.2)]`}
                />

                <FiSearch className={`absolute left-2.5 top-1/2 -translate-y-1/2 z-20 h-3.5 w-3.5 transition-all duration-300 ${theme === "dark"
                  ? "text-gray-500 group-focus-within:text-emerald-400"
                  : "text-gray-400 group-focus-within:text-emerald-500"
                  }`}
                />

                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setIsChatSearchOpen(false);
                    setSearchTerm("");
                  }}
                  title="Close search"
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${theme === "dark"
                    ? "text-gray-400 hover:text-emerald-400 hover:bg-white/10"
                    : "text-gray-500 hover:text-emerald-500 hover:bg-black/5"
                    }`}
                >
                  <RxCross2 className="h-3.5 w-3.5 cursor-pointer" />
                </button>
              </div>

              {searchTerm.trim() !== "" && (
                <div className="flex items-center justify-end animate-in fade-in slide-in-from-top-1 duration-300 pt-2">
                  {resultCount > 0 ? (
                    <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                      <span className="px-3 text-[11px] font-semibold tracking-tight text-gray-600 dark:text-zinc-300 tabular-nums">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {currentIndex + 1}
                        </span>
                        <span className="mx-1 opacity-40">/</span>
                        <span className="opacity-80">{resultCount}</span>
                      </span>
                      <div className="h-4 w-px bg-gradient-to-b from-transparent via-gray-300/40 to-transparent dark:via-zinc-700/40" />

                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={goPrev}
                          aria-label="Previous"
                          title="Previous match"
                          className="group p-1.5 rounded-full text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-90 transition-all duration-200 cursor-pointer"
                        >
                          <ChevronUpIcon className="w-3 h-3 group-hover:-translate-y-[1px] transition-transform" />
                        </button>

                        <button
                          onClick={goNext}
                          aria-label="Next"
                          title="Next match"
                          className="group p-1.5 rounded-full text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-90 transition-all duration-200 cursor-pointer"
                        >
                          <ChevronDownIcon className="w-3 h-3 group-hover:translate-y-[1px] transition-transform" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 text-[11px] font-medium text-rose-500/90">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                      </span>
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          ref={headerMenuBtnRef}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setHeaderMenuAnchor({
              x: rect.right,
              y: rect.bottom + 6,
              isContextMenu: false,
            });
            setShowHeaderMenu((prev) => !prev);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setHeaderMenuAnchor({
              x: e.clientX,
              y: e.clientY,
              isContextMenu: true,
            });
            setShowHeaderMenu(true);
          }}
          title="Menu"
          className="p-2 rounded-full text-gray-500 dark:text-[#aebac1] hover:text-gray-800 dark:hover:text-white border border-transparent hover:border-black/10 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
        >
          <HiDotsVertical className="h-5 w-5" />
        </button>
      </div>

      {showSelectPeopleModal && (
        <GroupCallModal
          isOpen={showSelectPeopleModal}
          onClose={() => setShowSelectPeopleModal(false)}
          groupParticipants={participants}
          groupAdmins={selectedContact?.groupAdmin || selectedContact?.admins || []}
          groupName={selectedContact?.groupName || selectedContact?.username || "Group"}
          theme={theme}
          onStartCall={(target, callType) => {
            setShowSelectPeopleModal(false);
            const { initiateCall } = useVideoCallStore.getState();
            if (typeof initiateCall !== "function") {
              toast.error("Call service not ready. Please try again.");
              return;
            }

            const avatar =
              selectedContact?.profilePicture ||
              selectedContact?.groupProfileImage ||
              "";
            const displayName =
              selectedContact?.groupName ||
              selectedContact?.name ||
              selectedContact?.username ||
              "Group";
            const gId = (selectedContact?._id || selectedContact?.id)?.toString();

            if (Array.isArray(target)) {
              const otherMemberIds = target
                .map((p) => (p?._id || p)?.toString())
                .filter(Boolean);
              initiateCall(
                otherMemberIds[0],
                displayName,
                avatar,
                callType || "audio",
                {
                  isGroup: true,
                  groupId: gId,
                  groupName: displayName,
                  groupAvatar: avatar,
                  participantIds: otherMemberIds,
                }
              );
            } else if (target) {
              const mId = (target?._id || target?.id || target)?.toString();
              const mName = target?.username || target?.name || "Participant";
              const mAvatar = target?.profilePicture || "";
              initiateCall(mId, mName, mAvatar, callType || "audio");
            }
          }}
        />
      )}
    </div>
  );
};

export default React.memo(ChatHeader);
