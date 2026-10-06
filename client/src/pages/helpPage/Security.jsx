import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaShieldAlt, FaFingerprint, FaKey, FaHistory } from "react-icons/fa";
import useThemeStore from "../../store/themeStore";

const securityOptions = [
  {
    title: "Two-Step Verification",
    desc: "Add an extra layer of security by requiring a PIN.",
    icon: <FaKey />,
    status: "Enabled",
    color: "text-green-400",
  },
  {
    title: "Biometric Lock",
    desc: "Use Fingerprint or Face ID to open the app.",
    icon: <FaFingerprint />,
    status: "Disabled",
    color: "text-blue-400",
  },
  {
    title: "Login History",
    desc: "Check where and when you have logged in.",
    icon: <FaHistory />,
    status: "Review",
    color: "text-purple-400",
  },
];

const Security = () => {
  const navigate = useNavigate();
  // Call the hook inside the component
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      // Dynamic background and text colors
      className={`min-h-screen flex flex-col transition-colors duration-500 ${
        isDark ? "bg-[#0b141a] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className={`p-4 flex items-center gap-4 border-b sticky top-0 z-20 transition-colors ${
        isDark ? "bg-[#111b21] border-gray-800" : "bg-white border-gray-200 shadow-sm"
      }`}>
        <button
          onClick={() => navigate(-1)}
          className={`p-2 rounded-full transition-all active:scale-90 ${
            isDark ? "hover:bg-gray-700 text-white" : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <FaArrowLeft className="text-xl cursor-pointer" />
        </button>
        <h1 className="text-xl font-semibold">Security Settings</h1>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {/* Security Badge Section */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 border transition-all ${
              isDark 
                ? "bg-green-500/10 border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.1)]" 
                : "bg-green-100 border-green-200 shadow-sm"
            }`}
          >
            <FaShieldAlt className={`text-5xl ${isDark ? "text-green-500" : "text-green-600"}`} />
          </motion.div>
          <h2 className="text-2xl font-bold">Your account is safe</h2>
          <p className={`${isDark ? "text-gray-400" : "text-gray-500"} text-sm mt-1`}>
            Last security check: Today at 12:45 PM
          </p>
        </div>

        {/* Security Options List */}
        <div className="space-y-4">
          {securityOptions.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.02, 
                backgroundColor: isDark ? "#2a3942" : "#f9fafb" 
              }}
              whileTap={{ scale: 0.98 }}
              tabIndex="0"
              className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                isDark 
                  ? "bg-[#202c33] border-gray-800" 
                  : "bg-white border-gray-200 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-5">
                <div className={`text-2xl ${option.color} p-3 rounded-xl ${
                  isDark ? "bg-gray-900/40" : "bg-gray-100"
                }`}>
                  {option.icon}
                </div>
                <div>
                  <h3 className={`font-semibold text-[17px] ${!isDark && "text-gray-800"}`}>
                    {option.title}
                  </h3>
                  <p className={`text-sm max-w-[200px] sm:max-w-xs ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}>
                    {option.desc}
                  </p>
                </div>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider transition-colors ${
                option.status === "Enabled" 
                  ? (isDark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700") 
                  : (isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500")
              }`}>
                {option.status}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Bottom Alert Box */}
        <div className={`mt-8 p-4 border rounded-2xl flex gap-4 transition-colors ${
          isDark 
            ? "bg-yellow-500/5 border-yellow-500/20" 
            : "bg-yellow-50 border-yellow-200"
        }`}>
          <div className="text-yellow-500 mt-1">⚠️</div>
          <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Never share your verification code or PIN with anyone, including staff members.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Security;