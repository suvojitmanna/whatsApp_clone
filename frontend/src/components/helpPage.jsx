import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaRocket,
  FaLock,
  FaComments,
  FaUserShield,
  FaSearch,
  FaChevronRight,
  FaArrowLeft,
} from "react-icons/fa";
import useThemeStore from "../store/themeStore";

const helpItems = [
  {
    title: "Get Started",
    desc: "Learn how to set up and begin using the app",
    icon: <FaRocket />,
    path: "/help/get-started",
    color: "text-blue-400",
  },
  {
    title: "Security",
    desc: "Keep your account safe and secure",
    icon: <FaLock />,
    path: "/help/security",
    color: "text-red-400",
  },
  {
    title: "Chats & Media",
    desc: "Manage messages, media, and files",
    icon: <FaComments />,
    path: "/help/chat-media",
    color: "text-green-400",
  },
  {
    title: "Privacy",
    desc: "Control your visibility and data",
    icon: <FaUserShield />,
    path: "/help/privacy",
    color: "text-purple-400",
  },
];

const HelpPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { theme } = useThemeStore();

  const isDark = theme === "dark";

  const filteredItems = helpItems.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300
      ${isDark ? "bg-[#0b141a] text-gray-100" : "bg-gray-100 text-gray-900"}`}
    >
      {/* Header */}
      <header
        className={`p-6 sticky top-0 z-10 border-b shadow-xl transition-colors
        ${isDark ? "bg-[#111b21] border-gray-800" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-full transition-all active:scale-90 ${
              isDark
                ? "hover:bg-gray-700 text-white"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <FaArrowLeft className="text-xl cursor-pointer" />
          </button>

          <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
        </div>

        {/* Search */}
        <div className="relative group">
          <FaSearch
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors
            ${isDark ? "text-gray-500 group-focus-within:text-green-500" : "text-gray-400"}`}
          />
          <input
            type="text"
            placeholder="Search for help..."
            className={`w-full py-3 pl-12 pr-4 rounded-full outline-none transition-all border
            ${
              isDark
                ? "bg-[#202c33] text-white border-transparent focus:ring-2 focus:ring-green-500/50"
                : "bg-gray-200 text-black border-gray-300 focus:ring-2 focus:ring-green-400"
            }`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.title}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className={`group flex items-center justify-between p-5 rounded-full cursor-pointer transition-all shadow-sm border
                ${
                  isDark
                    ? "bg-[#202c33] border-gray-800 hover:bg-[#2a3942]"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-5">
                  <div
                    className={`text-2xl ${item.color} p-3 rounded-full transition-transform group-hover:scale-110
                    ${isDark ? "bg-gray-900/30" : "bg-gray-200"}`}
                  >
                    {item.icon}
                  </div>

                  <div>
                    <h2 className="text-[17px] font-semibold tracking-wide">
                      {item.title}
                    </h2>
                    <p
                      className={`text-sm leading-relaxed
                      ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>

                <FaChevronRight
                  className={`ml-2 transition-colors
                  ${
                    isDark
                      ? "text-gray-600 group-hover:text-green-500"
                      : "text-gray-400 group-hover:text-green-600"
                  }`}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center py-20
              ${isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              No results found for "{search}"
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`p-6 text-center border-t transition-colors
        ${isDark ? "border-gray-800" : "border-gray-200"}`}
      >
        {/* Footer / Quick Help */}
        <footer className="p-6 text-center border-t border-gray-800">
          <button
            onClick={() => navigate("/help/contact-support")}
            className="text-green-500 font-medium hover:underline cursor-pointer transition-all active:opacity-70"
          >
            Contact Support
          </button>
        </footer>
      </footer>
    </div>
  );
};

export default HelpPage;
