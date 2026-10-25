import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  FaCamera,
  FaFileAlt,
  FaHeadphones,
  FaImage,
  FaMicrophone,
} from "react-icons/fa";
import {
  IoSend,
  IoTimeOutline,
  IoCalendarOutline
} from "react-icons/io5";
import { FaSquarePollHorizontal } from "react-icons/fa6";
import {
  MdEventNote,
  MdBlock,
  MdLink,
  MdAddReaction,
  MdOutlineSchedule,
  MdClose,
  MdCalendarToday,
  MdAccessTime,
  MdReceiptLong,
  MdLocationOn,
  MdHourglassBottom,
} from "react-icons/md";
import { PiEyeLight, PiEyeSlash } from "react-icons/pi";
import { HiSparkles } from "react-icons/hi2";
import { TfiClip } from "react-icons/tfi";
import { RiContactsFill, RiEmojiStickerLine, RiDeleteBin6Line } from "react-icons/ri";
import EmojiPicker from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { MetaAiRing } from "../../../components/common/MetaAiIcon";
import { useChatStore } from "../../../store/chatStore";
import axiosInstance from "../../../services/url.services";
import ReplyPreviewBar from "./ReplyPreviewBar";
import SmartRepliesBar from "./SmartRepliesBar";

const getAvatarColor = (name) => {
  const colors = [
    "#00a884", "#128c7e", "#25d366", "#34b7f1", "#e542a3",
    "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#00bcd4",
    "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b",
    "#ffc107", "#ff9800", "#ff5722", "#795548", "#607d8b"
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const ChatInputBar = ({
  theme,
  isBlocked,
  setShowDeleteConfirm,
  handleUnblockContact,
  replyingTo,
  setReplyingTo,
  user,
  selectedContact,
  getReplyPreviewText,
  fileMenuRef,
  showFileMenu,
  setShowFileMenu,
  fileInputRef,
  documentInputRef,
  audioInputRef,
  stickerInputRef,
  handleFileChange,
  setShowCamera,
  setShowContactModal,
  setShowPollModal,
  setShowEventModal,
  setShowStickerModal,
  setShowCallLinkModal,
  setShowSplitBillModal,
  setShowLocationModal,
  setShowTimeCapsuleModal,
  lastMessage,
  currentUserId,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiPickerRef,
  message,
  setMessage,
  showMentionPopover,
  setShowMentionPopover,
  handleSelectMention,
  messageInputRef,
  isMetaAiChat,
  handleSendMessage,
  isSending,
  selectedFiles = [],
  isGroupChat = false,
  groupParticipants = [],
  groupAdmins = [],
}) => {
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDictating, setIsDictating] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef(null);
  const [showRewriteMenu, setShowRewriteMenu] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [previousDraft, setPreviousDraft] = useState(null);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeString = (d = new Date()) => {
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const [scheduledFor, setScheduledFor] = useState(null);
  const [showScheduleMenu, setShowScheduleMenu] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
  const [customDate, setCustomDate] = useState(() => getLocalDateString());
  const [customTime, setCustomTime] = useState(() => getLocalTimeString());
  const [isTranslatingDraft, setIsTranslatingDraft] = useState(false);
  const rewriteMenuRef = useRef(null);
  const scheduleMenuRef = useRef(null);
  const liveTranslateEnabled = useChatStore((state) => state.liveTranslateEnabled);
  const liveTranslateLang = useChatStore((state) => state.liveTranslateLang);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rewriteMenuRef.current && !rewriteMenuRef.current.contains(e.target)) {
        setShowRewriteMenu(false);
      }
      if (scheduleMenuRef.current && !scheduleMenuRef.current.contains(e.target)) {
        setShowScheduleMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showScheduleMenu) {
      const now = new Date();
      setCustomDate(getLocalDateString(now));
      setCustomTime(getLocalTimeString(now));
    }
  }, [showScheduleMenu]);

  const handleMagicRewrite = async (tone) => {
    if (!message || !message.trim()) {
      toast.error("Please type a message first to polish tone!");
      return;
    }
    if (isRewriting) return;
    setIsRewriting(true);
    try {
      const original = message;
      const res = await axiosInstance.post("/chat/magic-rewrite", {
        text: original,
        tone,
      });
      const rewritten =
        res.data?.data?.rewritten ||
        res.data?.data?.rewrittenText ||
        res.data?.rewritten ||
        res.data?.rewrittenText;
      if (rewritten && rewritten.trim()) {
        setPreviousDraft(original);
        setMessage(rewritten.trim());
        setShowRewriteMenu(false);
        const toneLabels = {
          professional: "💼 Professional",
          friendly: "🤝 Friendly & Warm",
          concise: "⚡ Concise",
          fix_grammar: "✍️ Grammar Fixed",
        };
        toast.success(`✨ Rewritten in ${toneLabels[tone] || tone} style!`);
      } else {
        toast.error("Could not rewrite text. Please try again.");
      }
    } catch (err) {
      console.error("Magic rewrite error:", err);
      const errMsg =
        err.response?.data?.message ||
        "Failed to polish tone. Please try again.";
      toast.error(errMsg);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleTranslateDraft = async () => {
    if (!message.trim() || isTranslatingDraft) return;
    setIsTranslatingDraft(true);
    try {
      const original = message;
      const res = await axiosInstance.post("/chat/translate", {
        text: original,
        targetLang: liveTranslateLang || "en",
      });
      const translated =
        res.data?.data?.translation ||
        res.data?.data?.translatedText ||
        res.data?.translation ||
        res.data?.translatedText;
      if (translated) {
        setPreviousDraft(original);
        setMessage(translated);
        toast.success(`🌐 Translated draft to ${(liveTranslateLang || "en").toUpperCase()}!`);
      }
    } catch (err) {
      toast.error("Failed to translate draft.");
    } finally {
      setIsTranslatingDraft(false);
    }
  };

  const handleExecuteSend = () => {
    const extraOptions = {};
    if (scheduledFor) {
      extraOptions.scheduledFor = scheduledFor.toISOString();
      setScheduledFor(null);
    }
    if (isViewOnce) {
      extraOptions.isViewOnce = true;
      setIsViewOnce(false);
    }
    handleSendMessage(undefined, extraOptions);
  };

  const applySchedule = (dt) => {
    const hasContent = Boolean(message.trim() || (selectedFiles && selectedFiles.length > 0));
    if (hasContent) {
      const scheduleTime = dt.toISOString();
      setScheduledFor(null);
      setShowScheduleMenu(false);
      const extraOptions = { scheduledFor: scheduleTime };
      if (isViewOnce) {
        extraOptions.isViewOnce = true;
        setIsViewOnce(false);
      }
      handleSendMessage(undefined, extraOptions);
      toast.success(
        `⏰ Scheduled message queued for ${dt.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })} at ${dt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      );
    } else {
      setScheduledFor(dt);
      setShowScheduleMenu(false);
      toast.info(
        `⏰ Schedule set for ${dt.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })} at ${dt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}. Type your message and click Send!`
      );
      messageInputRef.current?.focus();
    }
  };

  const toggleVoiceDictation = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.info("Speech recognition is not supported in this browser.");
      return;
    }

    if (isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (interimTranscript) {
        setMessage((prev) => {
          const trimmed = (prev || "").trim();
          return trimmed ? `${trimmed} ${interimTranscript.trim()}` : interimTranscript.trim();
        });
        setInterimTranscript("");
      }
      setIsDictating(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsDictating(true);
        setInterimTranscript("");
        toast.info("Listening... Speak your message", { autoClose: 2000 });
      };

      recognition.onresult = (event) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          setMessage((prev) => {
            const trimmed = (prev || "").trim();
            return trimmed ? `${trimmed} ${final.trim()}` : final.trim();
          });
          setInterimTranscript("");
        } else if (interim) {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (err) => {
        console.warn("Speech recognition error:", err);
        setIsDictating(false);
        setInterimTranscript("");
      };

      recognition.onend = () => {
        setIsDictating(false);
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Speech recognition init failed:", e);
      setIsDictating(false);
      setInterimTranscript("");
    }
  };

  const filteredMentionItems = useMemo(() => {
    if (!showMentionPopover) return [];
    const items = [];
    const q = (mentionQuery || "").trim().toLowerCase();
    if (isGroupChat) {
      if (!q || "all".includes(q) || "everyone".includes(q) || "@all".includes(q)) {
        items.push({
          type: "all",
          id: "all",
          tag: "@all",
          name: "@all",
          badge: "Everyone",
          description: "Notify all members in this group",
        });
      }

      const currentUid = (user?._id || user?.id)?.toString();
      const adminSet = new Set((groupAdmins || []).map(String));

      (groupParticipants || []).forEach((member) => {
        const mId = (member?._id || member?.id || member)?.toString();
        const username =
          member?.username ||
          member?.name ||
          member?.displayName ||
          "Member";
        const isMe = Boolean(currentUid && mId && mId === currentUid);
        const isAdmin = Boolean(mId && adminSet.has(mId));

        const matches =
          !q ||
          username.toLowerCase().includes(q) ||
          (member?.about && member.about.toLowerCase().includes(q)) ||
          (member?.phoneNumber && member.phoneNumber.includes(q));

        if (matches) {
          items.push({
            type: "member",
            id: mId || username,
            tag: `@${username}`,
            name: username,
            isMe,
            isAdmin,
            avatar:
              member?.profilePicture ||
              member?.profilePic ||
              member?.avatar,
            description: member?.about || (isAdmin ? "Group admin" : `@${username}`),
          });
        }
      });
    }

    if (!q || "meta ai".includes(q) || "llama".includes(q) || "@meta".includes(q)) {
      items.push({
        type: "meta_ai",
        id: "meta_ai",
        tag: "@Meta AI",
        name: "Meta AI",
        badge: "AI",
        description: "with Llama • Ask anything or type /imagine",
      });
    }

    return items;
  }, [showMentionPopover, isGroupChat, mentionQuery, groupParticipants, groupAdmins, user]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [mentionQuery, showMentionPopover]);

  if (isBlocked) {
    return (
      <div className={`p-3 sm:p-4 select-none flex items-center justify-center gap-3.5 sm:gap-4 border-t transition-colors ${theme === "dark"
        ? "bg-[#202c33] border-[#222d34]"
        : "bg-[#f0f2f5] border-gray-200"
        }`}
      >
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2 rounded-full border border-gray-300 dark:border-white/15 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer select-none"
        >
          <RiDeleteBin6Line className="text-[17px] text-[#ea868f] shrink-0" />
          <span className="text-[#ea868f] font-medium text-[14px] sm:text-[14.5px]">
            Delete chat
          </span>
        </button>

        <button
          type="button"
          onClick={handleUnblockContact}
          className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2 rounded-full border border-gray-300 dark:border-white/15 hover:bg-[#00a884]/10 active:scale-95 transition-all cursor-pointer select-none"
        >
          <MdBlock className="text-[17px] text-[#00a884] shrink-0" />
          <span className="text-[#00a884] font-medium text-[14px] sm:text-[14.5px]">
            Unblock
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={`p-2.5 sm:p-3 border-t flex flex-col relative transition-colors ${theme === "dark"
      ? "bg-[#202c33] border-[#222d34]"
      : "bg-[#f0f2f5] border-gray-200"
      }`}
    >
      <ReplyPreviewBar
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        theme={theme}
        user={user}
        selectedContact={selectedContact}
        getReplyPreviewText={getReplyPreviewText}
      />

      {!message && !isDictating && (
        <SmartRepliesBar
          lastMessage={lastMessage}
          currentUserId={user?._id || currentUserId}
          onSendDirect={(reply) => handleSendMessage(reply)}
          onInsert={(reply) => {
            setMessage(reply);
            messageInputRef.current?.focus();
          }}
          theme={theme}
        />
      )}

      {isDictating && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-1.5 rounded-xl bg-gradient-to-r from-red-500/15 via-emerald-500/15 to-transparent border border-red-500/30 text-xs shadow-xs select-none animate-fadeIn">
          <div className="flex items-center gap-2 truncate">
            <span className="flex items-center gap-0.5 h-3">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            </span>
            <span className="font-bold text-[11px] text-red-500 shrink-0">
              Listening...
            </span>
            <span className="truncate italic text-gray-700 dark:text-gray-200">
              {interimTranscript ? (
                <span className="bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md font-semibold ring-1 ring-emerald-500/40">
                  "{interimTranscript}"
                </span>
              ) : (
                "Speak now, transcribing voice..."
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleVoiceDictation}
            className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            Done
          </button>
        </div>
      )}

      {previousDraft && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 text-xs select-none animate-fadeIn shadow-sm">
          <span className="text-emerald-700 dark:text-emerald-300 text-[11.5px] truncate flex items-center gap-1.5 font-medium">
            <HiSparkles className="text-xs shrink-0 text-emerald-500" />
            <span>AI Magic Rewrite applied</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setMessage(previousDraft);
              setPreviousDraft(null);
            }}
            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline cursor-pointer shrink-0"
          >
            ↩ Revert to original
          </button>
        </div>
      )}

      {liveTranslateEnabled && (
        <div className="flex items-center justify-between gap-2 px-3 py-1 mb-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs select-none">
          <span className={`${theme === "dark" ? "text-blue-200" : "text-blue-600"} dark:text-blue-300 text-[11px] truncate flex items-center gap-1`}>
            <span>🌐</span>
            <span>Live Translate active ({(liveTranslateLang || "en").toUpperCase()})</span>
          </span>
          {message && message.trim() && (
            <button
              type="button"
              onClick={handleTranslateDraft}
              disabled={isTranslatingDraft}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
            >
              {isTranslatingDraft ? "Translating..." : `Translate input to ${(liveTranslateLang || "en").toUpperCase()} ↗`}
            </button>
          )}
        </div>
      )}

      {message && message.trim().startsWith("/s") && !message.trim().includes(" ") && (
        <div
          onClick={() => {
            setMessage("/sticker cute baby panda wearing sunglasses");
            messageInputRef.current?.focus();
          }}
          className="flex items-center gap-2 px-3 py-1.5 mb-1.5 rounded-xl bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-transparent border border-pink-500/30 text-xs cursor-pointer hover:border-pink-500/50 transition-all select-none animate-fadeIn"
        >
          <span className="text-sm">🎨</span>
          <span className="text-pink-600 dark:text-pink-400 font-semibold text-[11.5px] shrink-0">
            AI Sticker Maker:
          </span>
          <span className="text-gray-600 dark:text-gray-300 text-[11px] truncate">
            Type <strong>/sticker &lt;prompt&gt;</strong> (e.g. click here to try <em>/sticker cute baby panda</em>)
          </span>
        </div>
      )}

      {scheduledFor && (
        <div className={`flex items-center justify-between gap-2 sm:gap-3 px-3 py-2 mb-2 rounded-2xl border shadow-md backdrop-blur-xl select-none transition-all duration-200 animate-fadeIn ${theme === "dark"
          ? "bg-[#182229]/95 border-emerald-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
          : "bg-emerald-50/90 border-emerald-300/80 shadow-[0_4px_16px_rgba(16,185,129,0.12)]"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-sm">
              <IoTimeOutline className="text-base" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Scheduled Delivery
                </span>
                <span className="hidden sm:inline text-gray-300 dark:text-gray-600 text-[10px]">•</span>
                <span className="hidden sm:inline text-[11px] text-gray-500 dark:text-gray-400">
                  Auto-send queued
                </span>
              </div>
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                {new Date(scheduledFor).toLocaleDateString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}{" "}
                at{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {new Date(scheduledFor).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExecuteSend}
              className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              title="Schedule this message for delivery at the chosen time"
            >
              <MdOutlineSchedule className="text-xs" />
              <span>Schedule Send</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleSendMessage();
                setScheduledFor(null);
                toast.success("Message sent immediately!");
              }}
              className="px-2 py-1 rounded-xl text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition-all cursor-pointer"
              title="Send message right now without scheduling"
            >
              Send now
            </button>
            <button
              type="button"
              onClick={() => setShowScheduleMenu(true)}
              className="px-2 py-1 rounded-xl text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
              title="Change scheduled date or time"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setScheduledFor(null);
                toast.info("Schedule cancelled");
              }}
              className="p-1 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Cancel schedule"
            >
              <MdClose className="text-base" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-2.5 w-full">
        <div className={`relative flex-1 min-w-0 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 min-h-[46px] sm:min-h-[48px] rounded-[24px] sm:rounded-full transition-all duration-200 border shadow-2xs ${isDictating
          ? "border-red-500/60 ring-2 ring-red-500/20 bg-red-500/5"
          : theme === "dark"
            ? "bg-[#2a3942] border-white/10 hover:border-emerald-500/40 hover:bg-[#303f49] focus-within:border-emerald-500/70 focus-within:ring-2 focus-within:ring-emerald-500/20"
            : "bg-white border-gray-200/90 hover:border-emerald-500/40 hover:bg-gray-50/80 focus-within:border-emerald-500/70 focus-within:ring-2 focus-within:ring-emerald-500/20"
          }`}
        >
          <div className="relative shrink-0" ref={fileMenuRef}>
            <button
              type="button"
              className={`w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center border border-transparent transition-all duration-150 cursor-pointer active:scale-92 ${showFileMenu
                ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30 scale-105"
                : "text-gray-500 dark:text-[#8696a0] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              onClick={() => setShowFileMenu(!showFileMenu)}
              title="Attach files, media, contacts & more"
            >
              <TfiClip
                className={`h-5 w-5 transform transition-transform duration-200 ${showFileMenu ? "rotate-45" : ""}`}
              />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e, "media")}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />

            <input
              type="file"
              ref={documentInputRef}
              onChange={(e) => handleFileChange(e, "document")}
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv,application/*"
              multiple
              className="hidden"
            />

            <input
              type="file"
              ref={audioInputRef}
              onChange={(e) => handleFileChange(e, "audio")}
              accept="audio/*"
              multiple
              className="hidden"
            />

            <input
              type="file"
              ref={stickerInputRef}
              onChange={(e) => handleFileChange(e, "sticker")}
              accept="image/png,image/webp,image/gif,image/jpeg"
              className="hidden"
            />

            <AnimatePresence>
              {showFileMenu && (
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.85,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.85,
                    y: 15,
                  }}
                  transition={{
                    duration: 0.16,
                    ease: "easeOut",
                  }}
                  className={`absolute bottom-full left-0 sm:-left-6 mb-4 sm:mb-7 w-[230px] sm:w-56 max-h-[380px] sm:max-h-[420px] overflow-y-auto scrollbar-thin [scrollbar-width:thin] overscroll-contain rounded-2xl p-2 z-50 border shadow-2xl backdrop-blur-xl ${theme === "dark"
                    ? "bg-[#233138] border-white/10 text-[#e9edef] shadow-black/70"
                    : "bg-white border-gray-100 text-[#3b4a54] shadow-black/15"
                    }`}
                >
                  <div className="flex flex-col space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowFileMenu(false);
                        documentInputRef.current?.click();
                      }}
                      title="Send document"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#7f66ff] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                        <FaFileAlt className="text-white text-[16px]" />
                      </div>
                      <span className="text-[14px] font-medium tracking-tight">
                        Document
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowFileMenu(false);
                        fileInputRef.current?.click();
                      }}
                      title="Send photos & videos"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#007bfc] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                        <FaImage className="text-white text-[16px]" />
                      </div>
                      <span className="text-[14px] font-medium tracking-tight">
                        Photos & videos
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowFileMenu(false);
                        setShowCamera(true);
                      }}
                      title="Take photo with camera"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#ff2e74] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                        <FaCamera className="text-white text-[16px]" />
                      </div>
                      <span className="text-[14px] font-medium tracking-tight">
                        Camera
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowFileMenu(false);
                        audioInputRef.current?.click();
                      }}
                      title="Send audio"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#f2790f] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                        <FaHeadphones className="text-white text-[16px]" />
                      </div>
                      <span className="text-[14px] font-medium tracking-tight">
                        Audio
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowFileMenu(false);
                        setShowContactModal(true);
                      }}
                      title="Share contact"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#009de2] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                        <RiContactsFill className="text-white text-[17px]" />
                      </div>
                      <span className="text-[14px] font-medium tracking-tight">
                        Contact
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowFileMenu(false);
                        setShowPollModal(true);
                      }}
                      title="Create poll"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#ffb703] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                        <FaSquarePollHorizontal className="text-white text-[17px]" />
                      </div>
                      <span className="text-[14px] font-medium tracking-tight">
                        Poll
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowFileMenu(false);
                        setShowEventModal(true);
                      }}
                      title="Create event"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#a855f7] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                        <MdEventNote className="text-white text-[17px]" />
                      </div>
                      <span className="text-[14px] font-medium tracking-tight">
                        Event
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowFileMenu(false);
                        setShowStickerModal(true);
                      }}
                      title="Send sticker"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#02b875] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                        <MdAddReaction className="text-white text-[17px]" />
                      </div>
                      <span className="text-[14px] font-medium tracking-tight">
                        New sticker
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowFileMenu(false);
                        setShowCallLinkModal(true);
                      }}
                      title="Share call link"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                        <MdLink className="text-white text-[19px] transform -rotate-45" />
                      </div>
                      <span className="text-[14px] font-medium tracking-tight">
                        Call link
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowFileMenu(false);
                        if (setShowSplitBillModal) setShowSplitBillModal(true);
                      }}
                      title="Split a bill"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#06b6d4] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                        <MdReceiptLong className="text-white text-[19px]" />
                      </div>
                      <span className="text-[14px] font-medium tracking-tight">
                        Split bill
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowFileMenu(false);
                        if (setShowLocationModal) setShowLocationModal(true);
                      }}
                      title="Share location"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#ef4444] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                        <MdLocationOn className="text-white text-[19px]" />
                      </div>
                      <span className="text-[14px] font-medium tracking-tight">
                        Location
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowFileMenu(false);
                        if (setShowTimeCapsuleModal) setShowTimeCapsuleModal(true);
                      }}
                      title="Seal a time capsule"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/15 cursor-pointer transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 active:scale-95 transition-transform duration-200">
                        <MdHourglassBottom className="text-white text-[19px]" />
                      </div>
                      <span className="text-[14px] font-medium tracking-tight">
                        Time capsule
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              className={`w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center border border-transparent transition-all duration-150 cursor-pointer active:scale-92 ${showEmojiPicker
                ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30 scale-105"
                : "text-gray-500 dark:text-[#8696a0] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Emoji and stickers"
            >
              <RiEmojiStickerLine className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
            </button>

            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute left-0 sm:left-4 bottom-14 sm:bottom-16 z-50 shadow-2xl"
              >
                <EmojiPicker
                  onEmojiClick={(emojiObject) => {
                    if (emojiObject?.emoji) {
                      setMessage((prev) => prev + emojiObject.emoji);
                    }
                    setShowEmojiPicker(false);
                  }}
                  theme={theme}
                />
              </div>
            )}
          </div>

          {showMentionPopover && filteredMentionItems.length > 0 && (
            <div className={`absolute left-2 sm:left-4 bottom-full mb-3 w-[300px] sm:w-[350px] max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl border overflow-hidden z-50 animate-fade-in ${theme === "dark"
              ? "bg-[#202c33] border-white/10 text-white shadow-[0_12px_28px_rgba(0,0,0,0.55)]"
              : "bg-white border-black/10 text-gray-900 shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
              }`}
            >
              <div className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 border-b border-black/5 dark:border-white/5 select-none flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a884]" />
                  {isGroupChat ? "Group Mentions" : "Mention"}
                </span>
                <span className="text-[10px] text-gray-400 normal-case">
                  ↑↓ to navigate • Tab/Enter to tag
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto custom-scrollbar p-1 select-none">
                {filteredMentionItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleSelectMention(item.tag)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${isSelected
                        ? theme === "dark"
                          ? "bg-white/10"
                          : "bg-black/5"
                        : theme === "dark"
                          ? "hover:bg-white/5"
                          : "hover:bg-black/[0.03]"
                        }`}
                    >
                      {item.type === "all" ? (
                        <div className="w-9 h-9 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center font-bold text-base shrink-0">
                          @
                        </div>
                      ) : item.type === "meta_ai" ? (
                        <div className="shrink-0">
                          <MetaAiRing size={32} />
                        </div>
                      ) : item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                          style={{ backgroundColor: getAvatarColor(item.name) }}
                        >
                          {(item.name[0] || "U").toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[13.5px] truncate">
                            {item.name}
                          </span>
                          {item.isMe && (
                            <span className="text-[11px] text-gray-400 font-normal">
                              (You)
                            </span>
                          )}
                          {item.badge && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-[#00a884]/20 text-[#00a884]">
                              {item.badge}
                            </span>
                          )}
                          {item.isAdmin && (
                            <span
                              className={`text-[10.5px] font-medium px-1.5 py-0.2 rounded ${theme === "dark"
                                ? "bg-[#16312e] text-[#00a884]"
                                : "bg-[#e0f0e9] text-[#00897b]"
                                }`}
                            >
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-gray-400 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>

                      <span className="text-[11px] font-mono text-gray-400 opacity-60 shrink-0">
                        {item.tag}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <input
            ref={messageInputRef}
            type="text"
            value={message}
            onChange={(e) => {
              const val = e.target.value;
              setMessage(val);
              const cursor = e.target.selectionStart ?? val.length;
              const textBefore = val.slice(0, cursor);
              const lastToken = textBefore.split(/\s/).pop() || "";
              if (lastToken.startsWith("@") && !isMetaAiChat) {
                setMentionQuery(lastToken.slice(1));
                setShowMentionPopover(true);
              } else {
                setShowMentionPopover(false);
                setMentionQuery("");
              }
            }}
            onKeyDown={(e) => {
              if (showMentionPopover && filteredMentionItems.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedIndex((prev) => (prev + 1) % filteredMentionItems.length);
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedIndex((prev) => (prev - 1 + filteredMentionItems.length) % filteredMentionItems.length);
                  return;
                }
                if (e.key === "Tab" || e.key === "Enter") {
                  e.preventDefault();
                  const selected = filteredMentionItems[selectedIndex] || filteredMentionItems[0];
                  if (selected) {
                    handleSelectMention(selected.tag);
                  }
                  return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleExecuteSend();
              } else if (e.key === "Escape") {
                if (showMentionPopover) {
                  setShowMentionPopover(false);
                } else if (showRewriteMenu) {
                  setShowRewriteMenu(false);
                } else if (showScheduleMenu) {
                  setShowScheduleMenu(false);
                } else if (replyingTo) {
                  setReplyingTo(null);
                }
              }
            }}
            placeholder={
              isMetaAiChat
                ? "Ask Meta AI or type /imagine..."
                : isGroupChat
                  ? "Type a message or @ to tag..."
                  : "Type a message or @Meta AI"
            }
            className={`flex-1 min-w-0 w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm sm:text-[15px] px-1 sm:px-2 py-1 leading-relaxed transition-colors ${theme === "dark"
              ? "text-white placeholder-gray-400/90"
              : "text-gray-900 placeholder-gray-500"
              }`}
          />

          {message && message.trim().length > 0 && (
            <div className="relative shrink-0" ref={rewriteMenuRef}>
              <button
                type="button"
                onClick={() => setShowRewriteMenu((prev) => !prev)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all duration-150 cursor-pointer active:scale-92 ${showRewriteMenu
                  ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/40 scale-105 shadow-sm shadow-emerald-500/10"
                  : "border-transparent text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/25 hover:scale-105"
                  }`}
                title="AI Magic Rewrite (Polish tone)"
              >
                {isRewriting ? (
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <HiSparkles className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-emerald-500 dark:text-emerald-400" />
                )}
              </button>

              <AnimatePresence>
                {showRewriteMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={`absolute bottom-full right-0 mb-3.5 w-72 sm:w-76 rounded-2xl p-3 z-50 border shadow-2xl backdrop-blur-2xl ${theme === "dark"
                      ? "bg-[#1c282f]/98 border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
                      : "bg-white/98 border-gray-200/90 text-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                      }`}
                  >
                    <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500 rounded-full mb-2.5 opacity-90 shadow-sm" />

                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/25 shadow-sm">
                          <HiSparkles className="text-sm" />
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight tracking-tight text-gray-900 dark:text-white">AI Magic Rewrite</div>
                          <div className="text-[10px] text-gray-400 leading-tight">Instant 1-click tone polisher</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRewriteMenu(false)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Close"
                      >
                        <MdClose className="text-sm" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5 p-0.5">
                      <button
                        type="button"
                        onClick={() => handleMagicRewrite("professional")}
                        disabled={isRewriting}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left border border-transparent hover:border-emerald-500/20 hover:bg-emerald-500/10 active:scale-[0.98] cursor-pointer transition-all group"
                      >
                        <span className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                          💼
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                            Professional
                          </div>
                          <div className="text-[10.5px] text-gray-400 truncate">
                            Formal & refined for clients/work
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMagicRewrite("friendly")}
                        disabled={isRewriting}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left border border-transparent hover:border-emerald-500/20 hover:bg-emerald-500/10 active:scale-[0.98] cursor-pointer transition-all group"
                      >
                        <span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                          🤝
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                            Friendly & Warm
                          </div>
                          <div className="text-[10.5px] text-gray-400 truncate">
                            Softer, casual & welcoming
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMagicRewrite("concise")}
                        disabled={isRewriting}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left border border-transparent hover:border-emerald-500/20 hover:bg-emerald-500/10 active:scale-[0.98] cursor-pointer transition-all group"
                      >
                        <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                          ⚡
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                            Concise
                          </div>
                          <div className="text-[10.5px] text-gray-400 truncate">
                            Shorten & cut out fluff
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMagicRewrite("fix_grammar")}
                        disabled={isRewriting}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left border border-transparent hover:border-emerald-500/20 hover:bg-emerald-500/10 active:scale-[0.98] cursor-pointer transition-all group"
                      >
                        <span className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-500 flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                          ✍️
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                            Fix Grammar
                          </div>
                          <div className="text-[10.5px] text-gray-400 truncate">
                            Fix typos, spelling & clarity
                          </div>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {(message.trim() || (selectedFiles && selectedFiles.length > 0)) && (
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <div className="relative shrink-0" ref={scheduleMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowScheduleMenu((prev) => !prev)}
                  className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all duration-150 cursor-pointer active:scale-92 ${scheduledFor
                    ? "bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-sm"
                    : showScheduleMenu
                      ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30 scale-105"
                      : "border-transparent text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  title={scheduledFor ? `Scheduled for ${new Date(scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Schedule message (Send later)"}
                >
                  <IoTimeOutline className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-emerald-500 dark:text-emerald-400" />
                  {scheduledFor && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showScheduleMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className={`absolute bottom-full right-0 mb-3.5 w-84 sm:w-88 max-w-[calc(100vw-24px)] rounded-2xl p-3.5 z-50 border shadow-2xl backdrop-blur-2xl ${theme === "dark"
                        ? "bg-[#1c282f]/98 border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
                        : "bg-white/98 border-gray-200/90 text-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                        }`}
                    >
                      <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 rounded-full mb-3 opacity-90 shadow-sm" />

                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-black/5 dark:border-white/10">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                            <MdOutlineSchedule className="text-lg" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight tracking-tight text-gray-900 dark:text-white">Schedule Message</div>
                            <div className="text-[10px] text-gray-400 leading-tight">Choose when to automatically send</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowScheduleMenu(false)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          title="Close"
                        >
                          <MdClose className="text-base" />
                        </button>
                      </div>

                      {scheduledFor && (
                        <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs animate-fadeIn">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <div className="min-w-0">
                              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-500 leading-tight">Currently Set</div>
                              <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                                {new Date(scheduledFor).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(scheduledFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setScheduledFor(null);
                              setShowScheduleMenu(false);
                              toast.info("Schedule cleared");
                            }}
                            className="px-2 py-1 text-[11px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold transition-colors cursor-pointer shrink-0"
                          >
                            Clear
                          </button>
                        </div>
                      )}

                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-0.5 flex items-center justify-between">
                        <span>Quick Presets</span>
                        <span className="text-[10px] font-normal lowercase text-gray-400">1-click select</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => {
                            const dt = new Date(Date.now() + 15 * 60 * 1000);
                            applySchedule(dt);
                          }}
                          className="flex flex-col items-start p-2.5 rounded-xl border border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-[0.98] transition-all cursor-pointer group text-left"
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center text-xs">⚡</span>
                            <span className="text-[10px] font-mono text-gray-400 group-hover:text-emerald-500 transition-colors">
                              {new Date(currentDateTime.getTime() + 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">In 15 mins</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const dt = new Date(Date.now() + 60 * 60 * 1000);
                            applySchedule(dt);
                          }}
                          className="flex flex-col items-start p-2.5 rounded-xl border border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-[0.98] transition-all cursor-pointer group text-left"
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center text-xs">🕒</span>
                            <span className="text-[10px] font-mono text-gray-400 group-hover:text-emerald-500 transition-colors">
                              {new Date(currentDateTime.getTime() + 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">In 1 hour</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const tom = new Date();
                            tom.setDate(tom.getDate() + 1);
                            tom.setHours(9, 0, 0, 0);
                            applySchedule(tom);
                          }}
                          className="flex flex-col items-start p-2.5 rounded-xl border border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-[0.98] transition-all cursor-pointer group text-left"
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="w-6 h-6 rounded-lg bg-orange-500/15 text-orange-500 flex items-center justify-center text-xs">🌅</span>
                            <span className="text-[10px] font-mono text-gray-400 group-hover:text-emerald-500 transition-colors">
                              9:00 AM
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Tomorrow</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const eve = new Date();
                            if (eve.getHours() < 19) {
                              eve.setHours(20, 0, 0, 0);
                            } else {
                              eve.setDate(eve.getDate() + 1);
                              eve.setHours(20, 0, 0, 0);
                            }
                            applySchedule(eve);
                          }}
                          className="flex flex-col items-start p-2.5 rounded-xl border border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-[0.98] transition-all cursor-pointer group text-left"
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center text-xs">🌙</span>
                            <span className="text-[10px] font-mono text-gray-400 group-hover:text-emerald-500 transition-colors">
                              8:00 PM
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {currentDateTime.getHours() < 19 ? "Tonight" : "Tomorrow Night"}
                          </span>
                        </button>
                      </div>

                      <div className="pt-2.5 border-t border-black/5 dark:border-white/10">
                        <div className="flex items-center justify-between mb-2 px-0.5">
                          <div className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 shrink-0">
                            <IoCalendarOutline className="text-xs" />
                            <span>Custom Date & Time</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] sm:text-[10.5px] text-emerald-600 dark:text-emerald-400 font-mono font-medium" title="Live Local Clock">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                            <span>LIVE CLOCK</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 mb-2.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-200">
                            <MdAccessTime className="text-emerald-600 dark:text-emerald-400 text-xs shrink-0" />
                            <span>Current:</span>
                          </div>
                          <div className="text-[11px] font-bold font-mono text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                            <span>{currentDateTime.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>
                            <span>•</span>
                            <span>{currentDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 px-1">
                              <span>Date</span>
                              <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-mono">Today</span>
                            </div>
                            <div className="relative flex items-center">
                              <MdCalendarToday className="absolute left-2.5 text-gray-400 text-xs pointer-events-none" />
                              <input
                                type="date"
                                value={customDate || getLocalDateString()}
                                onChange={(e) => setCustomDate(e.target.value || getLocalDateString())}
                                min={getLocalDateString()}
                                className="w-full text-xs py-2 pl-7 pr-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 text-gray-800 dark:text-gray-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer font-medium [color-scheme:light] dark:[color-scheme:dark]"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 px-1">
                              <span>Time</span>
                              <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-mono">
                                {currentDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="relative flex items-center">
                              <MdAccessTime className="absolute left-2.5 text-gray-400 text-xs pointer-events-none" />
                              <input
                                type="time"
                                value={customTime || getLocalTimeString()}
                                onChange={(e) => setCustomTime(e.target.value || getLocalTimeString())}
                                className="w-full text-xs py-2 pl-7 pr-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 text-gray-800 dark:text-gray-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer font-medium [color-scheme:light] dark:[color-scheme:dark]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto custom-scrollbar pb-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              setCustomDate(getLocalDateString(now));
                              setCustomTime(getLocalTimeString(now));
                            }}
                            className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:text-emerald-500 hover:border-emerald-500/30 active:scale-95 transition-all cursor-pointer shrink-0"
                            title="Reset to current local date and time"
                          >
                            Now
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const future = new Date(Date.now() + 5 * 60 * 1000);
                              setCustomDate(getLocalDateString(future));
                              setCustomTime(getLocalTimeString(future));
                            }}
                            className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
                          >
                            +5m
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const future = new Date(Date.now() + 15 * 60 * 1000);
                              setCustomDate(getLocalDateString(future));
                              setCustomTime(getLocalTimeString(future));
                            }}
                            className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
                          >
                            +15m
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const future = new Date(Date.now() + 30 * 60 * 1000);
                              setCustomDate(getLocalDateString(future));
                              setCustomTime(getLocalTimeString(future));
                            }}
                            className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
                          >
                            +30m
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const future = new Date(Date.now() + 60 * 60 * 1000);
                              setCustomDate(getLocalDateString(future));
                              setCustomTime(getLocalTimeString(future));
                            }}
                            className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
                          >
                            +1h
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const chosenDate = customDate || getLocalDateString();
                            const chosenTime = customTime || getLocalTimeString();
                            if (chosenDate && chosenTime) {
                              const dt = new Date(`${chosenDate}T${chosenTime}`);
                              if (dt > new Date()) {
                                applySchedule(dt);
                              } else {
                                toast.error("Please pick a future time!");
                              }
                            } else {
                              toast.info("Please select both date and time");
                            }
                          }}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-xs cursor-pointer shadow-md shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                        >
                          <MdOutlineSchedule className="text-sm" />
                          <span>Set Custom Schedule</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsViewOnce((prev) => {
                    const next = !prev;

                    if (next) {
                      toast.info(
                        "1 View-once message enabled. Disappears after viewing!"
                      );
                    }

                    return next;
                  });
                }}
                className={`shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border transition-all duration-200 cursor-pointer active:scale-90 ${isViewOnce
                  ? "bg-emerald-500/20 text-white border-emerald-400/10 shadow-md shadow-emerald-500/30 scale-105"
                  : "border-transparent text-gray-500 dark:text-[#8696a0] hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                title={
                  isViewOnce
                    ? "View-once message active (disappears after viewing)"
                    : "Set as View-Once message"
                }
                aria-label={
                  isViewOnce
                    ? "Disable view once"
                    : "Enable view once"
                }
                aria-pressed={isViewOnce}
              >
                <span className="flex items-center justify-center text-[20px] leading-none">
                  {isViewOnce ? (
                    <PiEyeLight className="text-green-500" />
                  ) : (
                    <PiEyeSlash className="text-green-500" />
                  )}
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-center">
          {message.trim() || (selectedFiles && selectedFiles.length > 0) ? (
            <button
              type="button"
              onClick={handleExecuteSend}
              disabled={isSending}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-90 disabled:opacity-50 ${scheduledFor
                ? "bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30"
                : "bg-gradient-to-tr from-emerald-600 via-[#00a884] to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-500/30 hover:scale-105"
                }`}
              title={
                isSending
                  ? "Sending..."
                  : scheduledFor
                    ? `Send scheduled message for ${new Date(scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : "Send message (Enter)"
              }
            >
              {isSending ? (
                <div className="h-4.5 w-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : scheduledFor ? (
                <MdOutlineSchedule className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
              ) : (
                <IoSend className="h-5 w-5 sm:h-5.5 sm:w-5.5 ml-0.5" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleVoiceDictation}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 shadow-md hover:shadow-lg ${isDictating
                ? "bg-red-500 text-white animate-pulse shadow-red-500/40 ring-4 ring-red-500/25"
                : "bg-gradient-to-tr from-emerald-600 via-[#00a884] to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/30 hover:scale-105"
                }`}
              title={isDictating ? "Stop voice dictation" : "Voice dictation (Speech to text)"}
            >
              <FaMicrophone className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${isDictating ? "animate-bounce" : ""}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInputBar;
