import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEnvelope,
  FaHeadset,
  FaWhatsapp,
  FaPaperPlane,
  FaCheckCircle,
} from "react-icons/fa";
import { MdChat, MdCheck, MdOutlineAutoAwesome } from "react-icons/md";
import { toast } from "react-toastify";
import useThemeStore from "../../store/themeStore";

const ContactSupport = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const ticketId = "WA-" + Math.floor(100000 + Math.random() * 900000);
      setSubmittedTicket(ticketId);
      setIsSubmitting(false);
      toast.success(`Support ticket ${ticketId} created!`);
    }, 1200);
  };

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
            title="Go back"
            className={`p-2 rounded-full transition-all active:scale-95 cursor-pointer ${isDark
                ? "hover:bg-white/10 text-gray-200"
                : "hover:bg-black/5 text-gray-700"
              }`}
          >
            <FaArrowLeft className="text-lg" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold">Contact Support</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
              24/7 Available
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate("/help")}
          className="text-xs text-[#00a884] font-semibold hover:underline cursor-pointer"
        >
          All Topics
        </button>
      </div>

      <div className="flex-1 p-6 max-w-xl mx-auto w-full">
        {submittedTicket ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-8 rounded-3xl border text-center my-6 ${isDark ? "bg-[#1f2c34] border-white/5" : "bg-white border-black/5 shadow-sm"
              }`}
          >
            <div className="w-16 h-16 rounded-full bg-[#00a884]/15 border border-[#00a884]/30 flex items-center justify-center text-[#00a884] text-3xl mx-auto mb-4">
              <FaCheckCircle />
            </div>
            <h2 className="text-xl font-bold mb-1">Ticket Submitted!</h2>
            <p className="text-xs text-[#8696a0] mb-4">
              Your issue has been received. Our team typically responds within a few hours.
            </p>

            <div
              className={`p-4 rounded-2xl mb-6 inline-flex items-center gap-2 text-xs font-mono font-bold ${isDark ? "bg-black/20 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                }`}
            >
              <span>Ticket ID:</span>
              <span className="text-sm">{submittedTicket}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmittedTicket(null);
                  setMessage("");
                }}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${isDark
                    ? "border-white/10 hover:bg-white/5 text-gray-200"
                    : "border-black/10 hover:bg-black/5 text-gray-700"
                  }`}
              >
                Submit Another Issue
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-bold bg-[#00a884] hover:bg-[#02906f] text-white shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Return to Chats
              </button>
            </div>
          </motion.div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00a884] to-[#25d366] flex items-center justify-center text-white text-2xl mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                <FaHeadset />
              </div>
              <h2 className="text-xl font-bold mb-1">How can we assist you?</h2>
              <p className="text-xs text-[#8696a0]">
                Tell us about your issue and our team or AI assistant will help you right away.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8696a0] mb-2 block">
                  Select Issue Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "general", label: "💬 Chats & Media" },
                    { id: "security", label: "🔒 Chat Lock & PIN" },
                    { id: "account", label: "📱 Web & Sync" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTopic(t.id)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${topic === t.id
                          ? "bg-[#00a884]/15 border-[#00a884] text-[#00a884]"
                          : isDark
                            ? "bg-[#1f2c34] border-white/5 text-gray-300 hover:bg-white/5"
                            : "bg-white border-black/10 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8696a0] mb-2 block">
                  Describe the Issue
                </label>
                <textarea
                  rows="5"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what's happening, steps to reproduce, or what feature you need help with..."
                  className={`w-full p-4 rounded-2xl border text-xs sm:text-sm outline-none transition-all duration-200 resize-none ${isDark
                      ? "bg-[#1f2c34] border-white/10 hover:border-emerald-500/40 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 text-white placeholder-gray-500"
                      : "bg-white border-black/10 hover:border-emerald-500/40 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 text-gray-900 placeholder-gray-400 shadow-2xs"
                    }`}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!message.trim() || isSubmitting}
                className={`w-full py-3.5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-md ${message.trim() && !isSubmitting
                    ? "bg-[#00a884] hover:bg-[#02906f] text-white cursor-pointer active:scale-95"
                    : "bg-gray-600 text-gray-300 cursor-not-allowed opacity-50"
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Ticket...</span>
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="text-xs" />
                    <span>Submit Support Request</span>
                  </>
                )}
              </motion.button>
            </div>

            <div
              onClick={() => navigate("/")}
              className={`mt-6 p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isDark
                  ? "bg-[#1f2c34] border-white/5 hover:border-emerald-500/30"
                  : "bg-white border-black/5 hover:border-emerald-500/30 shadow-xs"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center text-sm">
                  <MdOutlineAutoAwesome />
                </div>
                <div>
                  <div className="text-xs font-bold">Ask Meta AI in Chat</div>
                  <div className="text-[11px] text-[#8696a0]">Get instant troubleshooting answers</div>
                </div>
              </div>
              <span className="text-xs text-[#00a884] font-semibold">Open →</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ContactSupport;
