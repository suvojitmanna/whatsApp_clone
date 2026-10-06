import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEyeSlash, FaUserLock, FaMapMarkerAlt, FaFileContract, FaChevronRight } from "react-icons/fa";
import useThemeStore from "../store/themeStore";

const privacySettings = [
  {
    title: "Last Seen & Online",
    desc: "Control who can see when you were last active.",
    icon: <FaEyeSlash />,
    value: "Nobody",
    color: "text-blue-400",
  },
  {
    title: "Profile Photo",
    desc: "Choose who can see your profile picture.",
    icon: <FaUserLock />,
    value: "My Contacts",
    color: "text-green-400",
  },
  {
    title: "Live Location",
    desc: "Manage apps and chats with access to your location.",
    icon: <FaMapMarkerAlt />,
    value: "None",
    color: "text-red-400",
  },
  {
    title: "Blocked Contacts",
    desc: "View and manage the list of people you've blocked.",
    icon: <FaUserLock />,
    value: "12 contacts",
    color: "text-gray-400",
  },
];

const Privacy = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
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
        <h1 className="text-xl font-semibold">Privacy</h1>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {/* Privacy Policy Callout */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className={`mb-8 p-5 rounded-2xl border flex items-center justify-between cursor-pointer ${
            isDark ? "bg-green-500/5 border-green-500/20" : "bg-green-50 border-green-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <FaFileContract className="text-2xl text-green-500" />
            <div>
              <h3 className="font-semibold text-green-500">Privacy Policy</h3>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Read how we protect your data.
              </p>
            </div>
          </div>
          <FaChevronRight className="text-green-500" />
        </motion.div>

        <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 px-2 ${
          isDark ? "text-gray-500" : "text-gray-400"
        }`}>
          Personal Info
        </h3>

        {/* Settings List */}
        <div className="space-y-3">
          {privacySettings.map((setting, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 4 }}
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                isDark 
                  ? "bg-[#202c33] border-gray-800 hover:bg-[#2a3942]" 
                  : "bg-white border-gray-200 hover:bg-gray-50 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`text-xl ${setting.color} p-3 rounded-xl ${
                  isDark ? "bg-gray-900/40" : "bg-gray-100"
                }`}>
                  {setting.icon}
                </div>
                <div>
                  <h4 className="font-medium text-[16px]">{setting.title}</h4>
                  <p className={`text-xs leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {setting.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <span className={`text-sm font-medium ${isDark ? "text-green-400" : "text-green-600"}`}>
                  {setting.value}
                </span>
                <FaChevronRight className="text-[10px] text-gray-500" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer Footer */}
        <p className={`mt-8 px-4 text-xs leading-relaxed text-center ${
          isDark ? "text-gray-500" : "text-gray-400"
        }`}>
          Your status updates and profile data are end-to-end encrypted. 
          Only the people you choose can see your information.
        </p>
      </div>
    </motion.div>
  );
};

export default Privacy;