import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEnvelope, FaHeadset, FaWhatsapp, FaPaperPlane } from "react-icons/fa";
import useThemeStore from "../store/themeStore";
const ContactSupport = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [message, setMessage] = useState("");

  const contactMethods = [
    { name: "Live Chat", icon: <FaWhatsapp />, color: "bg-green-600" },
    { name: "Email", icon: <FaEnvelope />, color: "bg-blue-600" },
    { name: "Phone", icon: <FaHeadset />, color: "bg-purple-600" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`min-h-screen flex flex-col transition-colors duration-500 ${isDark ? "bg-[#0b141a] text-white" : "bg-gray-50 text-gray-900"
        }`}
    >
      <div className={`p-4 flex items-center gap-4 border-b sticky top-0 z-20 transition-colors ${isDark ? "bg-[#111b21] border-gray-800" : "bg-white border-gray-200 shadow-sm"
        }`}>
        <button
          onClick={() => navigate(-1)}
          title="Go back"
          className={`p-2 rounded-full transition-all active:scale-90 ${isDark ? "hover:bg-gray-700 text-white" : "hover:bg-gray-100 text-gray-600"
            } cursor-pointer`}
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <h1 className="text-xl font-semibold">Contact Support</h1>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">How can we help?</h2>
          <p className={isDark ? "text-gray-400" : "text-gray-500"}>
            Our team usually responds within 24 hours.
          </p>
        </div>

        <div className="flex justify-center gap-6 mb-12">
          {contactMethods.map((method, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              title={`Contact via ${method.name}`}
              className="flex flex-col items-center gap-2 cursor-pointer"
            >
              <div className={`${method.color} p-4 rounded-2xl text-white text-2xl shadow-lg transition-transform hover:scale-105 active:scale-95`}>
                {method.icon}
              </div>
              <span className="text-xs font-medium">{method.name}</span>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className={`text-sm font-semibold ml-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Describe your issue
            </label>
            <textarea
              rows="5"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide as much detail as possible..."
              className={`w-full p-4 rounded-2xl border outline-none transition-all duration-200 resize-none ${isDark
                  ? "bg-[#202c33] border-white/10 hover:border-emerald-500/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/50 text-white placeholder-gray-500"
                  : "bg-white border-gray-200 hover:border-emerald-500/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/50 text-gray-900 placeholder-gray-400 shadow-sm"
                }`}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={!message.trim()}
            title="Send Message"
            className={`w-full py-4 rounded-full font-bold flex items-center justify-center gap-3 transition-all ${message.trim()
                ? "bg-green-600 hover:bg-green-500 text-white shadow-lg cursor-pointer active:scale-95"
                : "bg-gray-500 text-gray-200 cursor-not-allowed opacity-50"
              }`}
          >
            <FaPaperPlane className="text-sm" />
            Send Message
          </motion.button>
        </div>

        <div className="mt-12 text-center">
          <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            Prefer to solve it yourself?
          </p>
          <button
            onClick={() => navigate("/help")}
            className="text-green-500 font-bold hover:underline mt-1 cursor-pointer"
          >
            Browse all Help Topics
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ContactSupport;