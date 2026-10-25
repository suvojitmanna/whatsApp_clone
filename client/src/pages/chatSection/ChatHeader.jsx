import React from "react";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa6";
import { FaLock, FaUsers, FaCaretDown } from "react-icons/fa";
import { FiSearch, FiCheck } from "react-icons/fi";
import { RxCross2 } from "react-icons/rx";
import { HiDotsVertical } from "react-icons/hi";
import { HiSparkles } from "react-icons/hi2";
import { IoStatsChart } from "react-icons/io5";
import { LuVideo, LuPhone, LuUserCheck, LuLink, LuLanguages } from "react-icons/lu";
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

const TRANSLATE_LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "ko", name: "Korean", native: "한국어" },
];

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
  handleOpenChatWrapped,
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
  const [isTranslateDropdownOpen, setIsTranslateDropdownOpen] = React.useState(false);
  const [showSelectPeopleModal, setShowSelectPeopleModal] = React.useState(false);
  const callDropdownRef = React.useRef(null);
  const translateDropdownRef = React.useRef(null);

  React.useEffect(() => {
    if (!isCallDropdownOpen && !isTranslateDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (callDropdownRef.current && !callDropdownRef.current.contains(e.target)) {
        setIsCallDropdownOpen(false);
      }
      if (translateDropdownRef.current && !translateDropdownRef.current.contains(e.target)) {
        setIsTranslateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCallDropdownOpen, isTranslateDropdownOpen]);

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
      className={`px-2.5 sm:px-4 h-[60px] min-h-[60px] border-b shrink-0 z-30 select-none relative ${theme === "dark"
        ? "bg-[#202c33] border-[#313d45] text-[#e9edef]"
        : "bg-[#f0f2f5] border-[#e9edef] text-[#111b21]"
        } flex items-center justify-between gap-1 sm:gap-2`}
    >
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 mr-1">
        <button
          onClick={() => {
            if (onCloseChat) {
              onCloseChat();
            } else {
              setSelectedContact?.(null);
              setCurrentConversation?.(null);
            }
          }}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-[#e9edef] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
          title="Back to chats"
        >
          <FaArrowLeft className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
        </button>

        <div className="relative shrink-0">
          {isMetaAi ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowContactInfo(true);
              }}
              title="View Meta AI info"
              className="cursor-pointer active:scale-95 transition-transform"
            >
              <MetaAiRing size={38} className="sm:w-10 sm:h-10 shadow-xs" />
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
                className="w-[38px] h-[38px] sm:w-10 sm:h-10 rounded-full cursor-pointer object-cover hover:opacity-90 active:scale-95 transition-all shadow-xs"
              />
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContactInfo(true);
                }}
                title="View group info"
                className="w-[38px] h-[38px] sm:w-10 sm:h-10 rounded-full shrink-0 flex items-center justify-center bg-[#00a884]/20 text-[#00a884] dark:bg-emerald-500/20 dark:text-emerald-400 select-none shadow-xs border border-emerald-500/30 cursor-pointer"
              >
                <FaUsers className="w-4 h-4 sm:w-[19px] sm:h-[19px]" />
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
              className="w-[38px] h-[38px] sm:w-10 sm:h-10 rounded-full cursor-pointer object-cover hover:opacity-90 active:scale-95 transition-all shadow-xs"
            />
          )}

          {((isGroup ? isGroupOnline : online) && !isMetaAi) && (
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 ${theme === "dark" ? "border-[#202c33]" : "border-[#f0f2f5]"
              } bg-emerald-500 shadow-xs`}
              title={isGroup ? `${groupOnlineCount} online` : "Online"}
            />
          )}

          {disappearingDuration && disappearingDuration !== "Off" && (
            <span className={`absolute bottom-0 ${(isGroup ? isGroupOnline : online) && !isMetaAi ? "left-0" : "right-0"
              } w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border ${theme === "dark" ? "border-[#202c33] bg-[#111b21]" : "border-white bg-[#f0f2f5]"
              } flex items-center justify-center text-[#8696a0] shadow-xs`}
              title={`Disappearing messages: ${disappearingDuration}`}
            >
              <WhatsAppDisappearingIcon size={9} />
            </span>
          )}
        </div>

        <div className="flex-grow cursor-pointer min-w-0 group select-none"
          onClick={() => setShowContactInfo(true)}
          title="View contact info"
        >
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <h2 className={`font-semibold text-start text-[14.5px] sm:text-[16px] leading-tight truncate group-hover:text-emerald-500 transition-colors ${theme === "dark" ? "text-[#e9edef]" : "text-[#111b21]"}`}>
              {selectedContact?.username || selectedContact?.name || "Chat"}
            </h2>

            {isMetaAi ? (
              <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
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
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <FaLock className="w-2.5 h-2.5" />
                <span className="font-medium hidden md:inline">Encrypted</span>
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
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <WhatsAppDisappearingIcon size={10} className="shrink-0" />
                <span className="font-medium hidden sm:inline">{disappearingDuration}</span>
              </button>
            )}
          </div>

          <div className="pt-0.5 min-w-0">
            {isTyping ? (
              <div className="text-[11px] sm:text-xs text-emerald-500 dark:text-emerald-400 font-medium flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">{isMetaAi ? "Meta AI is thinking..." : "Typing..."}</span>
              </div>
            ) : isMetaAi ? null : isGroup ? (
              isGroupOnline ? (
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-500 dark:text-emerald-400 font-medium truncate"
                  title={onlineMemberNames ? `Online: ${onlineMemberNames}` : `${groupOnlineCount} online`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
                  <span className="truncate">
                    {groupOnlineCount} {groupOnlineCount === 1 ? "member" : "members"} online
                  </span>
                </div>
              ) : showInitialInfo ? (
                <p
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowContactInfo(true);
                  }}
                  className="text-[11px] sm:text-xs text-[#54656f] dark:text-[#8696a0] hover:text-emerald-500 dark:hover:text-emerald-400 truncate cursor-pointer transition-colors"
                  title="Click here for group info"
                >
                  click here for group info
                </p>
              ) : (
                <p className="text-[11px] sm:text-xs text-[#54656f] dark:text-[#8696a0] truncate"
                  title={groupSubtitle}
                >
                  {groupSubtitle}
                </p>
              )
            ) : (
              <p className="text-[11px] sm:text-xs text-[#54656f] dark:text-[#8696a0] truncate">
                {online
                  ? "Online"
                  : lastSeen
                    ? `Last seen ${formatTimestamp(lastSeen)}`
                    : "Offline"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        {!isMetaAi && (
          isGroup ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              {isCurrentGroupCallActive && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isUserInCurrentCall && joinGroupCall) {
                      joinGroupCall(activeGroupCall);
                    }
                  }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold shadow-xs transition-all cursor-pointer select-none ${isUserInCurrentCall
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-[#00a884] hover:bg-[#02906f] text-white active:scale-95 shadow-[#00a884]/30"
                    }`}
                  title={isUserInCurrentCall ? "You are in this call" : "Join ongoing group call"}
                >
                  <span
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isUserInCurrentCall ? "bg-emerald-400" : "bg-white animate-ping"
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
                  className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-full flex items-center gap-1 border transition-all cursor-pointer ${isCallDropdownOpen
                    ? theme === "dark"
                      ? "bg-[#2a3942] border-[#374248] text-white"
                      : "bg-gray-200 border-gray-300 text-gray-900"
                    : theme === "dark"
                      ? "border-transparent text-[#aebac1] hover:text-white hover:bg-white/10"
                      : "border-transparent text-[#54656f] hover:text-[#111b21] hover:bg-black/5"
                    }`}
                  title="Call group"
                >
                  <LuVideo className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  <FaCaretDown
                    className={`h-2.5 w-2.5 transition-transform duration-200 ${isCallDropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {isCallDropdownOpen && (
                  <div className={`absolute right-0 top-full mt-2 w-52 sm:w-56 max-w-[calc(100vw-24px)] rounded-2xl py-2 shadow-2xl z-50 border transition-all animate-in fade-in zoom-in-95 duration-150 ${theme === "dark"
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
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-left text-[14px] transition-colors cursor-pointer ${theme === "dark"
                        ? "hover:bg-[#182229] text-[#e9edef]"
                        : "hover:bg-[#f5f6f6] text-[#111b21]"
                        }`}
                    >
                      <LuPhone className="h-[18px] w-[18px] text-[#aebac1]" />
                      <span>Voice call</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCallDropdownOpen(false);
                        handleVideoCall?.();
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-left text-[14px] transition-colors cursor-pointer ${theme === "dark"
                        ? "hover:bg-[#182229] text-[#e9edef]"
                        : "hover:bg-[#f5f6f6] text-[#111b21]"
                        }`}
                    >
                      <LuVideo className="h-[18px] w-[18px] text-[#aebac1]" />
                      <span>Video call</span>
                    </button>

                    <div className={`my-1 border-t ${theme === "dark" ? "border-white/10" : "border-gray-200/80"}`} />

                    <button
                      type="button"
                      onClick={() => {
                        setIsCallDropdownOpen(false);
                        setShowSelectPeopleModal(true);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-left text-[14px] transition-colors cursor-pointer ${theme === "dark"
                        ? "hover:bg-[#182229] text-[#e9edef]"
                        : "hover:bg-[#f5f6f6] text-[#111b21]"
                        }`}
                    >
                      <LuUserCheck className="h-[18px] w-[18px] text-[#aebac1]" />
                      <span>Select people</span>
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
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-left text-[14px] transition-colors cursor-pointer ${theme === "dark"
                        ? "hover:bg-[#182229] text-[#e9edef]"
                        : "hover:bg-[#f5f6f6] text-[#111b21]"
                        }`}
                    >
                      <LuLink className="h-[18px] w-[18px] text-[#aebac1]" />
                      <span>Send call link</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-0.5">
              <button
                type="button"
                className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-[#e9edef] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                onClick={handleVideoCall}
                title={online ? "Start video call" : "User is offline"}
              >
                <LuVideo className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-[#e9edef] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                onClick={handleAudioCall}
                title={online ? "Start audio call" : "User is offline"}
              >
                <LuPhone className="w-4 h-4 sm:w-4.5 sm:h-4.5 sm:w-5 sm:h-5" />
              </button>
            </div>
          )
        )}

        {!isMetaAi && handleOpenSummarize && (
          <button
            type="button"
            onClick={handleOpenSummarize}
            className="hidden md:flex w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full items-center justify-center text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 active:scale-95 transition-all cursor-pointer"
            title="Summarize conversation with Meta AI"
          >
            <HiSparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>
        )}

        {!isMetaAi && handleOpenChatWrapped && (
          <button
            type="button"
            onClick={handleOpenChatWrapped}
            className="hidden lg:flex w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full items-center justify-center text-emerald-500/80 dark:text-emerald-400/80 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95 transition-all cursor-pointer"
            title="Chat Wrapped & Insights"
          >
            <IoStatsChart className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>
        )}

        {!isMetaAi && (
          <div className="relative" ref={translateDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTranslateDropdownOpen((prev) => !prev)}
              className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-full items-center gap-1 border transition-all cursor-pointer ${
                liveTranslateEnabled ? "flex" : "hidden sm:flex"
              } ${liveTranslateEnabled
                ? "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400"
                : isTranslateDropdownOpen
                  ? theme === "dark"
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-black/5 border-black/15 text-gray-900"
                  : "border-transparent text-[#54656f] dark:text-[#aebac1] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              title={
                liveTranslateEnabled
                  ? `Live translation active (${(liveTranslateLang || "en").toUpperCase()}) - Click to configure`
                  : "Live Chat Translation"
              }
            >
              <LuLanguages className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              {liveTranslateEnabled && (
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-tight">
                  {(liveTranslateLang || "en").toUpperCase()}
                </span>
              )}
            </button>

            {isTranslateDropdownOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-60 max-w-[calc(100vw-24px)] rounded-2xl p-2.5 shadow-2xl z-50 border transition-all animate-in fade-in zoom-in-95 duration-150 ${theme === "dark"
                  ? "bg-[#233138] border-[#374248] text-[#e9edef]"
                  : "bg-white border-gray-100 text-[#111b21] shadow-[0_10px_35px_rgba(0,0,0,0.12)]"
                  }`}
              >
                <div className="flex items-center justify-between px-2 py-1.5 pb-2.5 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <LuLanguages className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold">Live Translation</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      toggleLiveTranslate();
                      toast.info(
                        !liveTranslateEnabled
                          ? `🌐 Live Translation ON (${(liveTranslateLang || "en").toUpperCase()})`
                          : "Live Translation OFF"
                      );
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${liveTranslateEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${liveTranslateEnabled ? "translate-x-4" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>

                <div className="px-2 pt-2 pb-1 text-[11px] font-medium text-[#54656f] dark:text-[#8696a0]">
                  Translate messages to:
                </div>

                <div className="max-h-52 overflow-y-auto scrollbar-thin space-y-0.5">
                  {TRANSLATE_LANGUAGES.map((lang) => {
                    const isSelected = (liveTranslateLang || "en").toLowerCase() === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLiveTranslate(true, lang.code);
                          toast.success(`Language set to ${lang.name} (${lang.code.toUpperCase()})`);
                          setIsTranslateDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${isSelected
                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold"
                          : theme === "dark"
                            ? "hover:bg-white/10 text-[#d1d7db]"
                            : "hover:bg-black/5 text-[#111b21]"
                          }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="uppercase text-[10px] font-bold tracking-wider px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">
                            {lang.code}
                          </span>
                          <span className="truncate">{lang.name}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            ({lang.native})
                          </span>
                        </div>
                        {isSelected && <FiCheck className="w-3.5 h-3.5 text-blue-500 shrink-0 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!isMetaAi && (
          <div className={`hidden md:block h-5 w-[1px] mx-0.5 sm:mx-1 ${theme === "dark" ? "bg-white/15" : "bg-gray-300"}`} />
        )}

        <div className="static sm:relative" ref={searchIconRef}>
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            title="Search in chat"
            className={`${isSearchOpen ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"
              } w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-[#e9edef] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer`}
          >
            <FiSearch className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>

          <div className={`transition-all duration-200 z-40 ${isSearchOpen
            ? "absolute inset-x-2 sm:inset-x-auto sm:right-0 top-1/2 -translate-y-1/2 w-auto sm:w-72 md:w-80 scale-100 opacity-100"
            : "absolute right-0 top-1/2 -translate-y-1/2 w-0 scale-95 opacity-0 pointer-events-none"}`}
          >
            <div className="relative flex items-center w-full">
              <div className={`relative flex items-center w-full h-9 rounded-full px-3 border shadow-md transition-all ${theme === "dark" ? "bg-[#111b21] border-[#313d45] text-white focus-within:border-emerald-500/60" : "bg-white border-gray-300 text-gray-900 focus-within:border-emerald-500/60"}`}
              >
                <FiSearch className="w-4 h-4 text-[#54656f] dark:text-[#8696a0] shrink-0 mr-2" />
                <input
                  autoFocus
                  ref={inputRef}
                  type="text"
                  placeholder="Search in chat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm outline-none placeholder:text-[#54656f] dark:placeholder:text-[#8696a0] pr-1"
                />

                {searchTerm.trim() !== "" && (
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {resultCount > 0 ? (
                      <div className="flex items-center gap-0.5 sm:gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        <span>
                          {currentIndex + 1}/{resultCount}
                        </span>
                        <button
                          type="button"
                          onClick={goPrev}
                          title="Previous match"
                          className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 text-[#54656f] dark:text-[#8696a0] hover:text-emerald-500 cursor-pointer"
                        >
                          <ChevronUpIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={goNext}
                          title="Next match"
                          className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 text-[#54656f] dark:text-[#8696a0] hover:text-emerald-500 cursor-pointer"
                        >
                          <ChevronDownIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-rose-500 font-medium px-1">
                        0 results
                      </span>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setIsChatSearchOpen(false);
                    setSearchTerm("");
                  }}
                  title="Close search"
                  className="p-1 ml-1 rounded-full text-[#54656f] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-[#e9edef] hover:bg-black/5 dark:hover:bg-white/10 transition-all shrink-0 cursor-pointer"
                >
                  <RxCross2 className="w-3.5 h-3.5" />
                </button>
              </div>
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
          className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-[#e9edef] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
        >
          <HiDotsVertical className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
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
