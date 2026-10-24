import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaShieldAlt,
  FaFingerprint,
  FaKey,
  FaLock,
  FaWhatsapp,
  FaCheckCircle,
} from "react-icons/fa";
import { MdSecurity, MdPassword, MdLockOutline } from "react-icons/md";
import useThemeStore from "../../store/themeStore";
import { isChatLockConfigured, isBiometricEnabled } from "../../utils/chatLockUtil";

const Security = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const isLockActive = isChatLockConfigured();
  const isBioActive = isBiometricEnabled();

  const securityOptions = [
    {
      title: "End-to-End Encryption",
      desc: "Messages and calls are secured with private cryptographic keys.",
      icon: <FaLock />,
      status: "Always On",
      color: "text-emerald-400",
      action: null,
    },
    {
      title: "Chat Lock 4-Digit PIN",
      desc: "Protect confidential chats inside a hidden Locked folder.",
      icon: <MdLockOutline />,
      status: isLockActive ? "Active" : "Set Up",
      color: "text-amber-400",
      action: () => navigate("/setting"),
    },
    {
      title: "Biometric Touch ID Lock",
      desc: "Quickly unlock secret chats with fingerprint simulation.",
      icon: <FaFingerprint />,
      status: isBioActive ? "Enabled" : "Disabled",
      color: "text-blue-400",
      action: () => navigate("/setting"),
    },
    {
      title: "Two-Step Verification",
      desc: "Require an extra security code when logging into new devices.",
      icon: <FaKey />,
      status: "Protected",
      color: "text-purple-400",
      action: null,
    },
  ];

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
            <h1 className="text-base font-bold">Security & Encryption</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
              Encrypted
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
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 border transition-all ${
              isDark
                ? "bg-emerald-500/10 border-emerald-500/25 shadow-[0_0_40px_rgba(34,197,94,0.15)] text-[#00a884]"
                : "bg-emerald-50 border-emerald-200 shadow-sm text-emerald-600"
            }`}
          >
            <FaShieldAlt className="text-4xl" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-1">Your Chats Are Protected</h2>
          <p className="text-xs sm:text-sm text-[#8696a0] max-w-md">
            Messages and calls stay between you and the people you choose. Nobody outside of this chat, not even WhatsApp, can read or listen to them.
          </p>
        </div>

        <div className="space-y-3">
          {securityOptions.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={option.action || undefined}
              className={`flex items-center justify-between p-4.5 rounded-2xl border transition-all shadow-xs ${
                option.action ? "cursor-pointer" : ""
              } ${
                isDark
                  ? "bg-[#1f2c34] border-white/5 hover:border-emerald-500/30"
                  : "bg-white border-black/5 hover:border-emerald-500/30"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`text-xl ${option.color} p-3 rounded-2xl ${
                    isDark ? "bg-white/5" : "bg-gray-100"
                  }`}
                >
                  {option.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">
                    {option.title}
                  </h3>
                  <p className="text-xs text-[#8696a0] line-clamp-1 max-w-[200px] sm:max-w-xs">
                    {option.desc}
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                  option.status === "Always On" || option.status === "Active" || option.status === "Protected" || option.status === "Enabled"
                    ? isDark
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : isDark
                    ? "bg-white/10 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {option.status}
              </span>
            </motion.div>
          ))}
        </div>

        <div
          className={`mt-8 p-4 rounded-2xl border flex gap-3 text-xs leading-relaxed ${
            isDark
              ? "bg-[#1f2c34] border-white/5 text-[#8696a0]"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <span className="text-base shrink-0">💡</span>
          <div>
            <span className="font-semibold text-white dark:text-white">Security Tip: </span>
            Never share your 4-digit Chat Lock PIN or verification codes with anyone. WhatsApp staff will never ask for your passcodes or security credentials.
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Security;
