import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import useThemeStore from "../../store/themeStore";

const steps = [
  {
    title: "Create your Account",
    content: "Register using your phone number or email to sync your data across devices.",
  },
  {
    title: "Verify Identity",
    content: "Enable Two-Factor Authentication (2FA) in settings for maximum security.",
  },
  {
    title: "Start Chatting",
    content: "Find your contacts and start a conversation or create a new group.",
  },
];

const GetStarted = () => {
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
      {/* Top Navigation */}
      <div className={`p-4 flex items-center gap-4 border-b sticky top-0 z-20 transition-colors ${
        isDark ? "bg-[#111b21] border-gray-800" : "bg-white border-gray-200 shadow-sm"
      }`}>
        <button
          onClick={() => navigate(-1)}
          className={`p-2 rounded-full transition-colors ${
            isDark ? "hover:bg-gray-700 text-white" : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <FaArrowLeft className="text-xl cursor-pointer" />
        </button>
        <h1 className="text-xl font-semibold">Getting Started</h1>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <header className="mb-8 text-center">
          <div className={`inline-block p-4 rounded-full mb-4 ${
            isDark ? "bg-green-500/10" : "bg-green-100"
          }`}>
            <span className="text-4xl">🚀</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">Welcome!</h2>
          <p className={isDark ? "text-gray-400" : "text-gray-500"}>
            Follow these simple steps to master the app.
          </p>
        </header>

        {/* Progress Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              tabIndex="0"
              className={`flex gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300 ease-out
                focus:outline-none focus:ring-2 focus:ring-green-500/50
                ${isDark 
                  ? "bg-[#202c33] border-gray-800 hover:border-green-500/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)]" 
                  : "bg-white border-gray-200 hover:border-green-400 hover:shadow-xl shadow-sm"}
              `}
            >
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 shrink-0 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                  {index + 1}
                </div>
                {index !== steps.length - 1 && (
                  <div className={`w-0.5 h-full my-2 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                )}
              </div>

              <div className="pb-2">
                <h3 className={`text-lg font-semibold mb-1 transition-colors ${
                  isDark ? "text-green-400 group-hover:text-green-300" : "text-green-600"
                }`}>
                  {step.title}
                </h3>
                <p className={`text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  {step.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Action */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/")}
          className="w-full mt-10 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full shadow-lg transition-all cursor-pointer active:bg-green-700"
        >
          I'm Ready to Go!
        </motion.button>
      </div>
    </motion.div>
  );
};

export default GetStarted;