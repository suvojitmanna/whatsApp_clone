import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Layout from "../layout/layout";
import {
  FaRocket,
  FaLock,
  FaComments,
  FaUserShield,
  FaSearch,
  FaChevronRight,
  FaChevronDown,
  FaArrowLeft,
  FaPhoneAlt,
  FaCloudUploadAlt,
  FaWhatsapp,
  FaShieldAlt,
  FaMagic,
  FaRegClock,
  FaThumbsUp,
  FaThumbsDown,
  FaHeadset,
  FaExternalLinkAlt,
  FaPaperPlane,
  FaCheckCircle,
} from "react-icons/fa";
import {
  MdTranslate,
  MdAutoAwesome,
  MdRecordVoiceOver,
  MdHelpOutline,
  MdArrowBack,
  MdOutlineTimer,
} from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { toast } from "react-toastify";
import useThemeStore from "../../store/themeStore";

const TOPICS = [
  {
    id: "overview",
    title: "Help Center Overview",
    desc: "Feature spotlights, top FAQs, and latest WhatsApp tools",
    icon: <MdAutoAwesome />,
    badge: "Featured",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "chats-ai",
    title: "Chats & AI Tools",
    desc: "Magic rewrite, voice transcription, translate, and scheduled texts",
    icon: <FaComments />,
    badge: "Smart Features",
    path: "/help/chat-media",
    color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30",
    highlights: [
      {
        title: "AI Magic Rewrite (Message Input Bar)",
        desc: "Type any draft and click the 🪄 wand to polish your message in one click: 💼 Professional, 🤝 Friendly, ⚡ Concise, or ✍️ Fix Grammar.",
      },
      {
        title: "Voice Note Auto-Transcription",
        desc: "Click '📝 Read Transcript' below any audio message to read it instantly using Groq Whisper AI without playing sound in public.",
      },
      {
        title: "Scheduled Messages ('Send Later')",
        desc: "Click the ⏰ clock beside Send to pick an exact future date & time. WhatsApp automatically queues and sends your message.",
      },
      {
        title: "Real-Time Live Chat Translation",
        desc: "Toggle 🌐 Translate in the chat header to auto-translate incoming foreign languages and translate outgoing drafts before sending.",
      },
    ],
  },
  {
    id: "privacy-lock",
    title: "Privacy & Locked Chats",
    desc: "Secret PIN lock, last seen, disappear timers, and blocked contacts",
    icon: <FaUserShield />,
    badge: "High Privacy",
    path: "/help/privacy",
    color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30",
    highlights: [
      {
        title: "Secret Locked Chats (4-Digit PIN)",
        desc: "Right-click or tap the 3-dots on any chat to 'Lock chat'. If you haven't set a PIN yet, you will be prompted to create your 4-digit code first.",
      },
      {
        title: "Protected Locked Chats Folder",
        desc: "Locked chats are hidden from the main list inside the top 'Locked Chats 🔒' folder. Access requires your custom PIN or Touch ID.",
      },
      {
        title: "Disappearing Messages Timers",
        desc: "Set conversations to auto-delete after 24 hours, 7 days, or 90 days from the contact info panel.",
      },
      {
        title: "Manage Lock in Settings",
        desc: "Open Settings > Chat Lock to view lock status, change PIN, toggle Touch ID simulation, or unlock all chats.",
      },
    ],
  },
  {
    id: "security",
    title: "Security & Encryption",
    desc: "End-to-end encryption protocols and keeping your chats safe",
    icon: <FaLock />,
    badge: "Encrypted",
    path: "/help/security",
    color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    highlights: [
      {
        title: "End-to-End Encryption Protocol",
        desc: "Every personal text, photo, audio note, document, and call is encrypted with private keys. Only you and the recipient can access them.",
      },
      {
        title: "Security Notifications",
        desc: "Get notified if a contact's security code changes due to a new phone or re-installation.",
      },
      {
        title: "Protection Against Phishing",
        desc: "WhatsApp never sends messages asking for verification codes, passwords, or personal credentials.",
      },
    ],
  },
  {
    id: "get-started",
    title: "Getting Started",
    desc: "Set up WhatsApp, verify your account, and sync devices",
    icon: <FaRocket />,
    badge: "Basics",
    path: "/help/get-started",
    color: "from-teal-500/20 to-emerald-500/20 text-teal-400 border-teal-500/30",
    highlights: [
      {
        title: "Account Creation & Profile",
        desc: "Register, choose your profile photo, and write your About status in User Details.",
      },
      {
        title: "Syncing Contacts & Multi-Device",
        desc: "Stay connected across desktop, web, and mobile simultaneously with multi-device sync.",
      },
      {
        title: "Meta AI Assistant",
        desc: "Chat directly with Meta AI or type /imagine <prompt> in chats to generate images.",
      },
    ],
  },
  {
    id: "calls",
    title: "Voice & Video Calls",
    desc: "High-definition 1-on-1 calls, group calls, and shareable links",
    icon: <FaPhoneAlt />,
    badge: "HD Calling",
    path: "/calls",
    color: "from-cyan-500/20 to-sky-500/20 text-cyan-400 border-cyan-500/30",
    highlights: [
      {
        title: "HD Voice & Video Calls",
        desc: "Crystal-clear calling with adaptive bitrate and background noise reduction.",
      },
      {
        title: "Shareable Call Links",
        desc: "Create and share meeting call links directly in chats for one-click join access.",
      },
      {
        title: "Group Calling Controls",
        desc: "Manage participants, mute or add members during active group calls.",
      },
    ],
  },
  {
    id: "media-storage",
    title: "Media, Files & Storage",
    desc: "Sending documents up to 2GB, HD photos, and managing storage",
    icon: <FaCloudUploadAlt />,
    badge: "Storage",
    path: "/media",
    color: "from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30",
    highlights: [
      {
        title: "Uncompressed HD Photos & Videos",
        desc: "Send full quality pictures and clips without heavy downscaling compression.",
      },
      {
        title: "Documents up to 2 GB",
        desc: "Transfer PDFs, presentations, zip archives, and large media files seamlessly.",
      },
      {
        title: "Media Browser & Search",
        desc: "Filter and inspect all shared media, links, and documents from the Media panel.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact 24/7 Support",
    desc: "Submit a support ticket or get direct help from our team",
    icon: <FaHeadset />,
    badge: "24/7 Live",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
  },
];

const FAQS = [
  {
    id: "faq-lock",
    category: "privacy-lock",
    question: "How do Secret Locked Chats and the 4-digit PIN work?",
    answer:
      "Right-click or tap the 3-dots on any chat and choose 'Lock chat'. If you haven't configured a lock PIN yet, WhatsApp prompts you to set up and confirm a 4-digit PIN first. The chat is instantly moved into the protected 'Locked Chats 🔒' folder at the top of your list. You can unlock the folder using your PIN or simulated Touch ID. Manage or reset PIN in Settings > Chat Lock.",
    tags: ["lock", "pin", "secret", "touch id"],
  },
  {
    id: "faq-magic-rewrite",
    category: "chats-ai",
    question: "How does AI 'Magic Rewrite' work in the message bar?",
    answer:
      "When drafting a message in the chat input bar, click the magic wand icon (🪄). Choose from 4 smart tones: 💼 Professional (for formal polish), 🤝 Friendly & Warm (softens tone), ⚡ Concise (trims wordy drafts), or ✍️ Fix Grammar & Spelling. The AI updates your draft instantly.",
    tags: ["magic", "rewrite", "ai", "tone", "grammar"],
  },
  {
    id: "faq-audio-transcription",
    category: "chats-ai",
    question: "Can I transcribe voice notes into readable text?",
    answer:
      "Yes! Whenever an audio message is received, click the '📝 Read Transcript' badge below the waveform player. Powered by Groq Whisper AI, WhatsApp transcribes the voice note in under ~400ms so you can read it discreetly without audio playback.",
    tags: ["voice", "audio", "transcript", "whisper"],
  },
  {
    id: "faq-scheduled-msg",
    category: "chats-ai",
    question: "How do I schedule a message to send later?",
    answer:
      "Click the ⏰ clock icon beside the Send button in any chat. Pick your target date and time. WhatsApp safely queues the message and delivers it automatically at the scheduled moment.",
    tags: ["schedule", "send later", "queue", "clock"],
  },
  {
    id: "faq-translation",
    category: "chats-ai",
    question: "How does Real-Time Live Chat Translation work?",
    answer:
      "Click the 🌐 Translate icon in the chat header to activate Live Translation. Messages received in other languages will show an automatic translation pill underneath. You can also translate outgoing messages before sending.",
    tags: ["translate", "language", "foreign", "live"],
  },
  {
    id: "faq-encryption",
    category: "security",
    question: "Are my messages and calls end-to-end encrypted?",
    answer:
      "Yes. Every personal message, photo, video, voice note, document, and call is secured with End-to-End Encryption. Only you and the recipient hold the cryptographic keys to read or listen. No one in between—not even WhatsApp or Meta—can access them.",
    tags: ["encryption", "security", "privacy", "keys"],
  },
  {
    id: "faq-meta-ai",
    category: "chats-ai",
    question: "What can I do with Meta AI in WhatsApp?",
    answer:
      "Meta AI provides instant answers, writing assistance, coding help, and explanations. You can also type '/imagine <prompt>' or '/sticker <prompt>' in any chat to generate custom AI artwork and stickers on demand.",
    tags: ["meta ai", "imagine", "sticker", "assistant"],
  },
  {
    id: "faq-disappearing",
    category: "privacy-lock",
    question: "How do Disappearing Messages work?",
    answer:
      "Open any contact's info panel and select 'Disappearing Messages'. Pick a timer: 24 hours, 7 days, or 90 days. Once enabled, new messages sent in that chat will automatically vanish after the selected time.",
    tags: ["disappearing", "timer", "vanish", "cleanup"],
  },
];

const HelpPage = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [selectedTopicId, setSelectedTopicId] = useState("overview");
  const [search, setSearch] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const [supportTopic, setSupportTopic] = useState("general");
  const [supportMessage, setSupportMessage] = useState("");
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportTicketId, setSupportTicketId] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeTopic = useMemo(() => {
    return TOPICS.find((t) => t.id === selectedTopicId) || TOPICS[0];
  }, [selectedTopicId]);

  const filteredTopics = useMemo(() => {
    if (!search.trim()) return TOPICS;
    const q = search.toLowerCase();
    return TOPICS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        (t.highlights &&
          t.highlights.some(
            (h) =>
              h.title.toLowerCase().includes(q) ||
              h.desc.toLowerCase().includes(q)
          ))
    );
  }, [search]);

  const filteredFaqs = useMemo(() => {
    let list = FAQS;
    if (selectedTopicId !== "overview" && selectedTopicId !== "contact") {
      list = FAQS.filter((f) => f.category === selectedTopicId);
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [selectedTopicId, search]);

  const toggleFaq = (id) => {
    setExpandedFaq((prev) => (prev === id ? null : id));
  };

  const handleFeedback = (isPositive) => {
    setFeedbackGiven(isPositive ? "yes" : "no");
    toast.success(
      isPositive
        ? "Thank you for your feedback!"
        : "Thank you for letting us know."
    );
  };

  const handleSupportSubmit = (e) => {
    e?.preventDefault();
    if (!supportMessage.trim() || isSubmittingSupport) return;
    setIsSubmittingSupport(true);
    setTimeout(() => {
      const tid = "WA-" + Math.floor(100000 + Math.random() * 900000);
      setSupportTicketId(tid);
      setIsSubmittingSupport(false);
      toast.success(`Support ticket ${tid} created!`);
    }, 1000);
  };

  const leftPanel = (
    <div
      className={`h-full w-full flex flex-col border-r select-none transition-colors duration-200 ${isDark
        ? "bg-[#111b21] border-gray-700/60 text-white"
        : "bg-white border-gray-200 text-gray-900"
        }`}
    >
      <div className="p-4 md:p-5 pb-3 shrink-0 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => navigate("/setting")}
            title="Back to Settings"
            className={`p-2 rounded-full transition-all active:scale-95 cursor-pointer ${isDark
              ? "hover:bg-white/10 text-gray-200"
              : "hover:bg-black/5 text-gray-700"
              }`}
          >
            <FaArrowLeft className="text-base" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Help</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/30">
              Center
            </span>
          </div>
        </div>

        <div className="relative group">
          <FaSearch
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs transition-colors ${isDark
              ? "text-gray-400 group-focus-within:text-[#00a884]"
              : "text-gray-400 group-focus-within:text-[#00a884]"
              }`}
          />
          <input
            type="text"
            placeholder="Search help topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full py-2 pl-9 pr-8 text-xs sm:text-sm outline-none transition-all duration-200 rounded-xl border ${isDark
              ? "bg-[#202c33] border-white/10 hover:border-emerald-500/50 focus:border-[#00a884] text-white"
              : "bg-gray-100 border-gray-200 hover:border-emerald-500/50 focus:border-[#00a884] text-gray-900"
              }`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              <RxCross2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin">
        {filteredTopics.map((topic) => {
          const isSelected = selectedTopicId === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => {
                setSelectedTopicId(topic.id);
                if (isMobile) setMobileDetailOpen(true);
              }}
              className={`w-full text-left p-3 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer border ${isSelected
                ? isDark
                  ? "bg-[#202c33] border-emerald-500/40 text-white shadow-xs"
                  : "bg-emerald-50/80 border-emerald-500/40 text-gray-900 shadow-xs"
                : isDark
                  ? "border-transparent hover:bg-white/5 text-gray-300"
                  : "border-transparent hover:bg-gray-100 text-gray-700"
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 bg-gradient-to-br ${topic.color} border`}
                >
                  {topic.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs sm:text-sm truncate">
                      {topic.title}
                    </span>
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/10 text-gray-400 shrink-0">
                      {topic.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8696a0] truncate mt-0.5">
                    {topic.desc}
                  </p>
                </div>
              </div>

              <FaChevronRight
                className={`text-[10px] shrink-0 transition-transform ${isSelected
                  ? "text-[#00a884] translate-x-0.5"
                  : "text-gray-500"
                  }`}
              />
            </button>
          );
        })}

        {filteredTopics.length === 0 && (
          <div className="text-center py-10 px-4 text-xs text-[#8696a0]">
            No matching topics for "{search}"
          </div>
        )}
      </div>

      <div className="p-3 border-t border-black/5 dark:border-white/5 shrink-0 space-y-2">
        <button
          type="button"
          onClick={() => {
            setSelectedTopicId("contact");
            if (isMobile) setMobileDetailOpen(true);
          }}
          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-[#00a884] hover:bg-[#02906f] text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <FaHeadset className="text-xs" />
          <span>Contact 24/7 Support</span>
        </button>

        <div className="flex items-center justify-between text-[11px] text-[#8696a0] px-1 pt-1">
          <span
            onClick={() => {
              setSelectedTopicId("privacy-lock");
              if (isMobile) setMobileDetailOpen(true);
            }}
            className="hover:underline cursor-pointer"
          >
            Privacy Policy
          </span>
          <span>•</span>
          <span
            onClick={() => {
              setSelectedTopicId("security");
              if (isMobile) setMobileDetailOpen(true);
            }}
            className="hover:underline cursor-pointer"
          >
            Security
          </span>
          <span>•</span>
          <span>v2.26.4</span>
        </div>
      </div>
    </div>
  );

  const rightContent = (
    <div
      className={`h-full w-full flex flex-col font-sans overflow-hidden select-none transition-colors duration-200 ${isDark ? "bg-[#0c1317] text-[#e9edef]" : "bg-[#f0f2f5] text-[#111b21]"
        }`}
    >
      <header
        className={`h-[60px] px-6 flex items-center justify-between border-b shrink-0 backdrop-blur-md transition-colors ${isDark
          ? "bg-[#111b21]/95 border-white/10 text-white"
          : "bg-white/95 border-black/10 text-gray-900 shadow-xs"
          }`}
      >
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={() => setMobileDetailOpen(false)}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-300 mr-1 cursor-pointer"
            >
              <MdArrowBack size={20} />
            </button>
          )}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00a884] to-[#25d366] flex items-center justify-center text-white shadow-sm">
            <FaWhatsapp className="text-base" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold">
                {activeTopic.title}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                {activeTopic.badge}
              </span>
            </div>
            <p className="text-[11px] text-[#8696a0] hidden sm:block">
              {activeTopic.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTopic.path && (
            <button
              type="button"
              onClick={() => navigate(activeTopic.path)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${isDark
                ? "border-white/10 hover:bg-white/10 text-gray-200"
                : "border-black/10 hover:bg-black/5 text-gray-700"
                }`}
            >
              <span>Full Page</span>
              <FaExternalLinkAlt className="text-[10px]" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setSelectedTopicId("contact")}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#00a884] hover:bg-[#02906f] text-white transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
          >
            <FaHeadset className="text-xs" />
            <span className="hidden sm:inline">Get Support</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scrollbar-thin">
        {selectedTopicId === "overview" && (
          <>
            <div
              className={`p-6 rounded-3xl border relative overflow-hidden transition-all ${isDark
                ? "bg-gradient-to-br from-[#182229] via-[#1f2c34] to-[#182229] border-white/10"
                : "bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-emerald-500/20 shadow-sm"
                }`}
            >
              <div className="max-w-xl relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/30">
                  <MdAutoAwesome className="text-sm animate-pulse" />
                  <span>WhatsApp 2026 Help & Documentation</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">
                  Welcome to WhatsApp Help Center
                </h3>
                <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed mb-4">
                  Explore tutorials on newly released features like AI Magic Rewrite, Secret Locked Chats, Voice Transcriptions, and Scheduled Messages.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTopicId("privacy-lock")}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00a884] hover:bg-[#02906f] text-white transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    Explore Chat Lock 🔒
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTopicId("chats-ai")}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isDark
                      ? "border-white/10 hover:bg-white/5 text-gray-200"
                      : "border-black/10 hover:bg-black/5 text-gray-700"
                      }`}
                  >
                    Explore AI Rewrite 🪄
                  </button>
                </div>
              </div>
            </div>

            <section>
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <h4 className="font-bold text-sm sm:text-base tracking-tight">
                    Flagship Features
                  </h4>
                </div>
                <span className="text-xs text-[#00a884] font-semibold">
                  Latest Update
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div
                  onClick={() => setSelectedTopicId("chats-ai")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-purple-500/40 ${isDark ? "bg-[#1f2c34] border-white/5" : "bg-white border-black/5 shadow-2xs"
                    }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center text-lg mb-2.5">
                    <FaMagic />
                  </div>
                  <h5 className="font-bold text-sm mb-1">AI Magic Rewrite</h5>
                  <p className="text-xs text-[#8696a0] leading-relaxed">
                    Polish any message in the input bar to Professional, Friendly, Concise, or Grammar fix in one tap.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedTopicId("privacy-lock")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-amber-500/40 ${isDark ? "bg-[#1f2c34] border-white/5" : "bg-white border-black/5 shadow-2xs"
                    }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-lg mb-2.5">
                    <FaLock />
                  </div>
                  <h5 className="font-bold text-sm mb-1">Secret Locked Chats</h5>
                  <p className="text-xs text-[#8696a0] leading-relaxed">
                    Protect private chats behind a custom 4-digit PIN and simulated Touch ID inside the Locked Chats folder.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedTopicId("chats-ai")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-teal-500/40 ${isDark ? "bg-[#1f2c34] border-white/5" : "bg-white border-black/5 shadow-2xs"
                    }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center text-lg mb-2.5">
                    <MdRecordVoiceOver />
                  </div>
                  <h5 className="font-bold text-sm mb-1">Voice Auto-Transcription</h5>
                  <p className="text-xs text-[#8696a0] leading-relaxed">
                    Read voice notes instantly in noisy environments or meetings via fast Whisper AI speech recognition.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedTopicId("chats-ai")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-blue-500/40 ${isDark ? "bg-[#1f2c34] border-white/5" : "bg-white border-black/5 shadow-2xs"
                    }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center text-lg mb-2.5">
                    <FaRegClock />
                  </div>
                  <h5 className="font-bold text-sm mb-1">Scheduled Messages</h5>
                  <p className="text-xs text-[#8696a0] leading-relaxed">
                    Schedule texts to send automatically tomorrow, in 1 hour, or at any specific date and time.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {selectedTopicId === "contact" && (
          <div className="max-w-xl mx-auto py-2">
            {supportTicketId ? (
              <div
                className={`p-8 rounded-3xl border text-center ${isDark ? "bg-[#1f2c34] border-white/5" : "bg-white border-black/5 shadow-sm"
                  }`}
              >
                <div className="w-16 h-16 rounded-full bg-[#00a884]/15 border border-[#00a884]/30 flex items-center justify-center text-[#00a884] text-3xl mx-auto mb-4">
                  <FaCheckCircle />
                </div>
                <h3 className="text-xl font-bold mb-1">Support Request Created!</h3>
                <p className="text-xs text-[#8696a0] mb-4">
                  Our team has received your ticket and will follow up shortly.
                </p>
                <div
                  className={`p-3.5 rounded-2xl mb-6 inline-flex items-center gap-2 text-xs font-mono font-bold ${isDark ? "bg-black/25 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                    }`}
                >
                  <span>Ticket ID:</span>
                  <span className="text-sm">{supportTicketId}</span>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setSupportTicketId(null);
                      setSupportMessage("");
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#00a884] text-white cursor-pointer"
                  >
                    Submit Another Ticket
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`p-6 rounded-3xl border ${isDark ? "bg-[#1f2c34] border-white/5" : "bg-white border-black/5 shadow-sm"
                  }`}
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00a884] to-[#25d366] flex items-center justify-center text-white text-xl mx-auto mb-2.5 shadow-md">
                    <FaHeadset />
                  </div>
                  <h3 className="text-lg font-bold">Contact WhatsApp Support</h3>
                  <p className="text-xs text-[#8696a0]">
                    24/7 dedicated assistance for your messaging & privacy questions
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#8696a0] mb-2 block">
                      Category
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "general", label: "💬 Chats & AI" },
                        { id: "security", label: "🔒 Chat Lock" },
                        { id: "account", label: "📱 Sync & Web" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSupportTopic(t.id)}
                          className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${supportTopic === t.id
                            ? "bg-[#00a884]/15 border-[#00a884] text-[#00a884]"
                            : isDark
                              ? "bg-black/20 border-white/5 text-gray-300 hover:bg-white/5"
                              : "bg-gray-100 border-black/10 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8696a0] mb-2 block">
                      Message
                    </label>
                    <textarea
                      rows="4"
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Please explain what you need assistance with..."
                      className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm outline-none transition-all duration-200 resize-none ${isDark
                        ? "bg-black/25 border-white/10 hover:border-emerald-500/40 focus:border-[#00a884] text-white placeholder-gray-500"
                        : "bg-gray-50 border-black/10 hover:border-emerald-500/40 focus:border-[#00a884] text-gray-900 placeholder-gray-400"
                        }`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSupportSubmit}
                    disabled={!supportMessage.trim() || isSubmittingSupport}
                    className={`w-full py-3 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${supportMessage.trim() && !isSubmittingSupport
                      ? "bg-[#00a884] hover:bg-[#02906f] text-white cursor-pointer active:scale-95"
                      : "bg-gray-600 text-gray-300 cursor-not-allowed opacity-50"
                      }`}
                  >
                    {isSubmittingSupport ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <FaPaperPlane className="text-xs" />
                        <span>Send Support Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTopicId !== "overview" && selectedTopicId !== "contact" && activeTopic.highlights && (
          <section className="space-y-4">
            <div
              className={`p-5 rounded-2xl border ${isDark ? "bg-[#1f2c34] border-white/5" : "bg-white border-black/5 shadow-xs"
                }`}
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${activeTopic.color} border`}
                >
                  {activeTopic.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base">{activeTopic.title}</h3>
                  <p className="text-xs text-[#8696a0]">{activeTopic.desc}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {activeTopic.highlights.map((h, hIdx) => (
                  <div
                    key={hIdx}
                    className={`p-4 rounded-xl border ${isDark
                      ? "bg-black/20 border-white/5"
                      : "bg-gray-50/70 border-black/5"
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <h4 className="font-bold text-xs sm:text-sm">{h.title}</h4>
                    </div>
                    <p className="text-xs text-[#8696a0] leading-relaxed">
                      {h.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {selectedTopicId !== "contact" && (
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MdHelpOutline className="text-lg text-[#00a884]" />
                <h4 className="font-bold text-sm sm:text-base tracking-tight">
                  Frequently Asked Questions
                </h4>
              </div>
              <span className="text-xs text-[#8696a0]">
                {filteredFaqs.length} question
                {filteredFaqs.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2">
              {filteredFaqs.map((faq) => {
                const isExpanded = expandedFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${isDark
                      ? "bg-[#1f2c34] border-white/5"
                      : "bg-white border-black/5 shadow-2xs"
                      } ${isExpanded ? "border-emerald-500/40" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-semibold tracking-tight">
                        {faq.question}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[#8696a0] shrink-0"
                      >
                        <FaChevronDown className="text-xs" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-4 pb-4 text-xs sm:text-[13px] leading-relaxed text-[#8696a0] border-t border-black/5 dark:border-white/5 pt-3"
                        >
                          <p className="mb-2.5 text-gray-200 dark:text-gray-200">
                            {faq.answer}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-500 font-medium">
                              Tags:
                            </span>
                            {faq.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-gray-400 font-mono"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {filteredFaqs.length === 0 && (
                <div className="text-center py-8 text-xs text-[#8696a0]">
                  No FAQs matching current filter
                </div>
              )}
            </div>
          </section>
        )}

        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${isDark
            ? "bg-[#182229] border-white/5"
            : "bg-white border-black/5 shadow-2xs"
            }`}
        >
          <div className="text-center sm:text-left">
            <h5 className="font-bold text-xs sm:text-sm mb-0.5">
              Was this information helpful?
            </h5>
            <p className="text-[11px] text-[#8696a0]">
              Your feedback helps us continuously improve our guides and support.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFeedback(true)}
              disabled={Boolean(feedbackGiven)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${feedbackGiven === "yes"
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : isDark
                  ? "border-white/10 hover:bg-white/5 text-gray-300"
                  : "border-black/10 hover:bg-gray-100 text-gray-700"
                }`}
            >
              <FaThumbsUp className="text-xs" />
              <span>Yes</span>
            </button>
            <button
              type="button"
              onClick={() => handleFeedback(false)}
              disabled={Boolean(feedbackGiven)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${feedbackGiven === "no"
                ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                : isDark
                  ? "border-white/10 hover:bg-white/5 text-gray-300"
                  : "border-black/10 hover:bg-gray-100 text-gray-700"
                }`}
            >
              <FaThumbsDown className="text-xs" />
              <span>No</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout
      rightContent={!isMobile ? rightContent : null}
    >
      {isMobile && mobileDetailOpen ? rightContent : leftPanel}
    </Layout>
  );
};

export default HelpPage;
