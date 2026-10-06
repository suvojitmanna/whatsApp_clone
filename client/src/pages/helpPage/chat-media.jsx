import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, FaRegComments, FaRegImage, 
  FaHdd, FaCloudUploadAlt, FaChevronRight 
} from "react-icons/fa";
import useThemeStore from "../../store/themeStore";

const mediaOptions = [
  {
    title: "Chat Backup",
    desc: "Back up your messages and media to cloud storage.",
    icon: <FaCloudUploadAlt />,
    detail: "Weekly",
    color: "text-blue-400",
  },
  {
    title: "Media Auto-Download",
    desc: "Manage which media files download automatically.",
    icon: <FaRegImage />,
    detail: "Wi-Fi only",
    color: "text-orange-400",
  },
  {
    title: "Storage Usage",
    desc: "View and manage how much space your media is using.",
    icon: <FaHdd />,
    detail: "1.2 GB used",
    color: "text-green-400",
  },
  {
    title: "Chat History",
    desc: "Archive, clear, or delete all chats at once.",
    icon: <FaRegComments />,
    detail: "",
    color: "text-purple-400",
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
        <h1 className="text-xl font-semibold">Chats & Media</h1>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {/* Storage Bar (Visual Polish) */}
        <div className={`mb-8 p-5 rounded-2xl border ${
          isDark ? "bg-[#202c33] border-gray-800" : "bg-white border-gray-200 shadow-sm"
        }`}>
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-semibold">Storage overview</h3>
            <span className="text-xs text-gray-500">85% Free</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "15%" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-green-500" 
            />
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {mediaOptions.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`group flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                isDark 
                  ? "bg-[#202c33] border-gray-800 hover:bg-[#2a3942]" 
                  : "bg-white border-gray-200 hover:bg-gray-50 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`text-xl ${option.color} p-3 rounded-xl ${
                  isDark ? "bg-gray-900/40" : "bg-gray-100"
                }`}>
                  {option.icon}
                </div>
                <div>
                  <h4 className="font-medium">{option.title}</h4>
                  <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {option.desc}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {option.detail && (
                  <span className={`text-[11px] font-medium px-2 py-1 rounded-md ${
                    isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                  }`}>
                    {option.detail}
                  </span>
                )}
                <FaChevronRight className="text-xs text-gray-600 group-hover:text-green-500 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMedia;