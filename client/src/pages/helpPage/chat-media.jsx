import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaMagic,
  FaRegClock,
  FaRegComments,
  FaCloudUploadAlt,
  FaChevronRight,
  FaHdd,
} from "react-icons/fa";
import {
  MdRecordVoiceOver,
  MdTranslate,
  MdOutlineTimer,
} from "react-icons/md";
import useThemeStore from "../../store/themeStore";

const featureOptions = [
  {
    title: "AI Magic Rewrite",
    desc: "Polish draft messages to Professional, Friendly, Concise, or Fix Grammar before sending.",
    icon: <FaMagic />,
    badge: "AI Powered",
    color: "text-purple-400 bg-purple-500/10",
  },
  {
    title: "Voice Note Auto-Transcription",
    desc: "Read audio messages as text with 1-click Groq Whisper AI transcription.",
    icon: <MdRecordVoiceOver />,
    badge: "New Feature",
    color: "text-teal-400 bg-teal-500/10",
  },
  {
    title: "Scheduled Messages ('Send Later')",
    desc: "Pick exact dates and times to queue messages for automatic delivery.",
    icon: <FaRegClock />,
    badge: "Productivity",
    color: "text-blue-400 bg-blue-500/10",
  },
  {
    title: "Live Chat Translation",
    desc: "Real-time automatic translation pill for foreign messages and bilingual chats.",
    icon: <MdTranslate />,
    badge: "Global",
    color: "text-emerald-400 bg-emerald-500/10",
  },
  {
    title: "Disappearing Messages",
    desc: "Keep chats tidy with 24 hours, 7 days, or 90 days automatic cleanup timers.",
    icon: <MdOutlineTimer />,
    badge: "Privacy",
    color: "text-amber-400 bg-amber-500/10",
  },
  {
    title: "Storage & Media Usage",
    desc: "Send uncompressed HD media, documents up to 2GB, and manage local storage.",
    icon: <FaHdd />,
    badge: "Cloud & Local",
    color: "text-rose-400 bg-rose-500/10",
  },
];

const ChatMedia = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 select-none ${
        isDark ? "bg-[#0c1317] text-[#e9edef]" : "bg-[#f0f2f5] text-[#111b21]"
      }`}
    >
      <div
        className={`p-4 flex items-center justify-between border-b sticky top-0 z-20 backdrop-blur-md transition-colors ${
          isDark
            ? "bg-[#111b21]/95 border-white/10 text-white"
            : "bg-white/95 border-black/10 text-gray-900 shadow-xs"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-full transition-all active:scale-95 cursor-pointer ${
              isDark
                ? "hover:bg-white/10 text-gray-200"
                : "hover:bg-black/5 text-gray-700"
            }`}
          >
            <FaArrowLeft className="text-lg" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold">Chats & Smart Features</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
              WhatsApp 2026
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="text-xs text-[#00a884] font-semibold hover:underline cursor-pointer"
        >
          Open Chats
        </button>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div
          className={`mb-6 p-5 rounded-2xl border ${
            isDark ? "bg-[#1f2c34] border-white/5" : "bg-white border-black/5 shadow-xs"
          }`}
        >
          <div className="flex justify-between items-end mb-2.5">
            <div>
              <h3 className="font-bold text-sm">Media & Storage Cache</h3>
              <p className="text-xs text-[#8696a0]">Optimized for fast local caching</p>
            </div>
            <span className="text-xs font-semibold text-emerald-400">92% Space Available</span>
          </div>
          <div
            className={`w-full h-2 rounded-full overflow-hidden ${
              isDark ? "bg-white/10" : "bg-gray-200"
            }`}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "8%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-[#00a884] rounded-full"
            />
          </div>
        </div>

        <div className="space-y-3">
          {featureOptions.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              className={`group flex items-center justify-between p-4.5 rounded-2xl border transition-all cursor-pointer ${
                isDark
                  ? "bg-[#1f2c34] border-white/5 hover:border-emerald-500/30"
                  : "bg-white border-black/5 hover:border-emerald-500/30 shadow-xs"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`text-xl ${option.color} p-3 rounded-2xl shrink-0`}
                >
                  {option.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-bold text-sm tracking-tight">{option.title}</h4>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-black/5 dark:bg-white/5 text-[#8696a0] font-medium">
                      {option.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#8696a0] leading-relaxed">
                    {option.desc}
                  </p>
                </div>
              </div>

              <FaChevronRight className="text-xs text-[#8696a0] group-hover:text-[#00a884] group-hover:translate-x-0.5 transition-all ml-2 shrink-0" />
            </motion.div>
          ))}
        </div>

        <div
          className={`mt-8 p-4 rounded-2xl border flex gap-3 text-xs leading-relaxed ${
            isDark
              ? "bg-[#1f2c34] border-white/5 text-[#8696a0]"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
        >
          <span className="text-base shrink-0">💡</span>
          <div>
            <span className="font-semibold text-white dark:text-white">Pro Tip: </span>
            You can type <span className="font-mono text-[#00a884]">/sticker [prompt]</span> or <span className="font-mono text-[#00a884]">/imagine [prompt]</span> in any conversation to create custom AI stickers and images on the fly!
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMedia;
