import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEyeSlash,
  FaUserLock,
  FaFileContract,
  FaChevronRight,
  FaLock,
  FaFingerprint,
} from "react-icons/fa";
import { MdOutlineTimer, MdSecurity, MdBlock } from "react-icons/md";
import useThemeStore from "../../store/themeStore";
import { useChatStore } from "../../store/chatStore";
import { isChatLockConfigured, isBiometricEnabled } from "../../utils/chatLockUtil";

const Privacy = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const { blockedContacts = [], lockedChatIds = [] } = useChatStore();
  const isLockActive = isChatLockConfigured();
  const isBioActive = isBiometricEnabled();

  const privacySettings = [
    {
      title: "Secret Locked Chats",
      desc: "Protected chats hidden behind custom 4-digit PIN & Touch ID.",
      icon: <FaLock />,
      value: isLockActive ? `${lockedChatIds.length} locked` : "Not Configured",
      color: "text-amber-400 bg-amber-500/10",
      action: () => navigate("/setting"),
    },
    {
      title: "Disappearing Messages",
      desc: "Start new chats with messages that vanish after a chosen timer.",
      icon: <MdOutlineTimer />,
      value: "Off",
      color: "text-emerald-400 bg-emerald-500/10",
      action: null,
    },
    {
      title: "Last Seen & Online",
      desc: "Control who can see your online status and last active time.",
      icon: <FaEyeSlash />,
      value: "My Contacts",
      color: "text-blue-400 bg-blue-500/10",
      action: null,
    },
    {
      title: "Blocked Contacts",
      desc: "Contacts who are blocked from sending messages or calls to you.",
      icon: <MdBlock />,
      value: `${blockedContacts.length} contacts`,
      color: "text-rose-400 bg-rose-500/10",
      action: () => navigate("/setting"),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 select-none ${isDark ? "bg-[#0c1317] text-[#e9edef]" : "bg-[#f0f2f5] text-[#111b21]"
        }`}
    >
      <div
        className={`p-4 flex items-center justify-between border-b sticky top-0 z-20 backdrop-blur-md transition-colors ${isDark
          ? "bg-[#111b21]/95 border-white/10 text-white"
          : "bg-white/95 border-black/10 text-gray-900 shadow-xs"
          }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-full transition-all active:scale-95 cursor-pointer ${isDark
              ? "hover:bg-white/10 text-gray-200"
              : "hover:bg-black/5 text-gray-700"
              }`}
          >
            <FaArrowLeft className="text-lg" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold">Privacy & Safety</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-semibold border border-purple-500/30">
              Private
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate("/setting")}
          className="text-xs text-[#00a884] font-semibold hover:underline cursor-pointer"
        >
          Manage in Settings
        </button>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div
          className={`mb-6 p-4.5 rounded-2xl border flex items-center justify-between transition-all ${isDark
            ? "bg-[#1f2c34] border-white/5"
            : "bg-white border-black/5 shadow-xs"
            }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#00a884]/15 border border-[#00a884]/30 flex items-center justify-center text-[#00a884] text-xl shrink-0">
              <FaFileContract />
            </div>
            <div>
              <h3 className="font-bold text-sm">WhatsApp Privacy Guarantee</h3>
              <p className="text-xs text-[#8696a0]">
                Your personal calls and messages are strictly end-to-end encrypted.
              </p>
            </div>
          </div>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 px-1 text-[#8696a0]">
          Privacy Controls
        </h3>

        <div className="space-y-3">
          {privacySettings.map((setting, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={setting.action || undefined}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${setting.action ? "cursor-pointer" : ""
                } ${isDark
                  ? "bg-[#1f2c34] border-white/5 hover:border-emerald-500/30"
                  : "bg-white border-black/5 hover:border-emerald-500/30 shadow-xs"
                }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`text-xl ${setting.color} p-3 rounded-2xl shrink-0`}
                >
                  {setting.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight">{setting.title}</h4>
                  <p className="text-xs text-[#8696a0] leading-relaxed">
                    {setting.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4 shrink-0">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${setting.value.includes("locked") || setting.value.includes("contacts")
                    ? isDark
                      ? "bg-white/10 text-gray-200"
                      : "bg-gray-100 text-gray-800"
                    : "text-[#00a884]"
                    }`}
                >
                  {setting.value}
                </span>
                {setting.action && (
                  <FaChevronRight className="text-xs text-[#8696a0]" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div
          className={`mt-8 p-4 rounded-2xl border flex gap-3 text-xs leading-relaxed ${isDark
            ? "bg-[#1f2c34] border-white/5 text-[#8696a0]"
            : "bg-purple-50 border-purple-200 text-purple-900"
            }`}
        >
          <span className="text-base shrink-0">🔒</span>
          <div>
            <span className="font-semibold text-white dark:text-white">Chat Lock Tip: </span>
            You can lock any individual conversation by right-clicking or tapping the 3-dots on a chat and selecting <span className="font-semibold text-[#00a884]">Lock chat</span>.
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Privacy;
