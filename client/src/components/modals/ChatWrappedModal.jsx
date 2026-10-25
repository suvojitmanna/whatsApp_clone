import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { HiSparkles, HiFire } from "react-icons/hi2";
import { MdAccessTime, MdLeaderboard, MdShare, MdEmojiEmotions } from "react-icons/md";
import { toast } from "react-toastify";
import axiosInstance from "../../services/url.services.js";

export const ChatWrappedModal = ({
  isOpen = true,
  onClose,
  conversationId,
  selectedContact,
  theme = "dark",
}) => {
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!isOpen || !conversationId) return;

    let isMounted = true;
    setLoading(true);

    const fetchAnalytics = async () => {
      try {
        const res = await axiosInstance.get(
          `/chat/conversation/${conversationId}/analytics`,
        );
        if (isMounted) {
          setData(res.data?.data || null);
        }
      } catch (err) {
        if (isMounted) {
          toast.error("Could not generate chat analytics");
          onClose();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, [isOpen, conversationId, onClose]);

  const handleCopyShare = () => {
    if (!data) return;
    const text = `📊 WhatsApp Chat Wrapped for ${selectedContact?.username || selectedContact?.name || "Our Chat"}:\n\n` +
      `💬 Total Messages: ${data.totalMessages}\n` +
      `🔥 Longest Streak: ${data.chatStreak} days\n` +
      `⏰ Peak Hour: ${data.peakHour}:00\n` +
      `🎭 AI Relationship Vibe: ${data.aiPersona}\n` +
      `✨ "${data.aiDescription}"`;

    navigator.clipboard.writeText(text);
    toast.success("Chat Wrapped copied to clipboard!");
  };

  if (!isOpen) return null;

  const slides = [
    { title: "Overview", icon: <MdLeaderboard /> },
    { title: "Rhythm", icon: <MdAccessTime /> },
    { title: "Top Emojis", icon: <MdEmojiEmotions /> },
    { title: "Vibe", icon: <HiSparkles /> },
  ];

  return (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center px-4 backdrop-blur-xl ${isDark ? "bg-black/80" : "bg-black/40"}`}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl flex flex-col min-h-[480px] max-h-[90vh] ${isDark
          ? "bg-gradient-to-br from-[#111b21] via-[#0b141a] to-[#121212] border-white/10 text-white"
          : "bg-gradient-to-br from-white via-emerald-50/20 to-zinc-50 border-black/10 text-gray-900"
          }`}
      >
        <div
          className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${isDark ? "border-white/10 bg-[#202c33]/40" : "border-black/5 bg-gray-50/70"
            }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md">
              <HiSparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-[17px] leading-tight flex items-center gap-1.5">
                <span>Chat Wrapped & Insights</span>
              </h3>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {selectedContact?.username || selectedContact?.name || "Conversation Analytics"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
              ? "hover:bg-white/10 text-gray-400 hover:text-white"
              : "hover:bg-black/10 text-gray-500 hover:text-gray-900"
              }`}
          >
            <RxCross2 size={18} />
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <div>
              <h4 className="font-bold text-base">Analyzing Conversation Data...</h4>
              <p className="text-xs opacity-65 mt-1">
                Calculating streaks, message patterns, and sentiment
              </p>
            </div>
          </div>
        )}

        {!loading && data && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-around px-4 pt-3 border-b border-black/5 dark:border-white/5 shrink-0">
              {slides.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${activeSlide === idx
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                >
                  {s.icon}
                  <span>{s.title}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {activeSlide === 0 && (
                  <motion.div
                    key="slide0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 text-center">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                        Total Messages Exchanged
                      </span>
                      <h2 className="text-4xl font-black mt-1 text-emerald-400 font-mono">
                        {data.totalMessages.toLocaleString()}
                      </h2>
                      <p className="text-xs opacity-75 mt-1">
                        Across {data.activeDaysCount || 1} active days of conversation
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
                        Chat Volume Breakdown
                      </h4>
                      <div className="space-y-2">
                        {data.participantStats?.map((p) => {
                          const pct =
                            data.totalMessages > 0
                              ? Math.round((p.messageCount / data.totalMessages) * 100)
                              : 0;
                          return (
                            <div key={p.userId} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-medium">
                                <span>{p.username}</span>
                                <span>
                                  {p.messageCount} msgs ({pct}%)
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSlide === 1 && (
                  <motion.div
                    key="slide1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-center">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">
                        Peak Chatting Hour
                      </span>
                      <h3 className="text-3xl font-extrabold mt-1 text-cyan-300">
                        {data.peakHour % 12 || 12}:00 {data.peakHour >= 12 ? "PM" : "AM"}
                      </h3>
                      <p className="text-xs opacity-75 mt-1">
                        {data.peakHour >= 22 || data.peakHour <= 4
                          ? "🦉 True Night Owls — You talk the most after dark!"
                          : "☀️ Daylight Warriors — Most of your chats happen during daytime!"}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
                        24-Hour Message Activity
                      </h4>
                      <div className="h-28 flex items-end gap-1 p-2 rounded-xl bg-black/20 dark:bg-black/40 border border-white/5">
                        {data.hourlyActivity?.map((count, hr) => {
                          const max = Math.max(...data.hourlyActivity, 1);
                          const hPct = Math.round((count / max) * 100);
                          const isPeak = hr === data.peakHour;
                          return (
                            <div
                              key={hr}
                              title={`${hr}:00 — ${count} messages`}
                              className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                            >
                              <div
                                style={{ height: `${Math.max(hPct, 8)}%` }}
                                className={`w-full rounded-t transition-all ${isPeak
                                  ? "bg-cyan-400 shadow-xs"
                                  : "bg-emerald-500/50 group-hover:bg-emerald-400"
                                  }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[10px] opacity-60 mt-1 font-mono">
                        <span>12 AM</span>
                        <span>6 AM</span>
                        <span>12 PM</span>
                        <span>6 PM</span>
                        <span>11 PM</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSlide === 2 && (
                  <motion.div
                    key="slide2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-3 opacity-80">
                        Top Emojis Used
                      </h4>
                      {data.topEmojis && data.topEmojis.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2.5">
                          {data.topEmojis.map((em, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-2xl border text-center flex flex-col items-center ${isDark
                                ? "bg-white/5 border-white/10"
                                : "bg-gray-50 border-black/10"
                                }`}
                            >
                              <span className="text-3xl">{em.emoji}</span>
                              <span className="text-xs font-bold mt-1 opacity-80">
                                {em.count} times
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs italic opacity-70">
                          No emojis detected in this chat yet. Time to send some! 😄
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
                        Content Exchange
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl border border-white/10 flex justify-between">
                          <span>📸 Photos & Videos:</span>
                          <span className="font-bold">
                            {(data.mediaBreakdown?.image || 0) + (data.mediaBreakdown?.video || 0)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl border border-white/10 flex justify-between">
                          <span>🎙️ Voice Notes:</span>
                          <span className="font-bold">{data.mediaBreakdown?.audio || 0}</span>
                        </div>
                        <div className="p-2.5 rounded-xl border border-white/10 flex justify-between">
                          <span>🧾 Split Bills:</span>
                          <span className="font-bold">{data.mediaBreakdown?.split_bill || 0}</span>
                        </div>
                        <div className="p-2.5 rounded-xl border border-white/10 flex justify-between">
                          <span>📍 Locations:</span>
                          <span className="font-bold">{data.mediaBreakdown?.location || 0}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSlide === 3 && (
                  <motion.div
                    key="slide3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="p-6 rounded-3xl bg-gradient-to-tr from-purple-900/40 via-emerald-950/40 to-teal-900/40 border border-purple-500/40 text-center relative overflow-hidden">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center mx-auto mb-2 text-2xl">
                        👑
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-purple-300">
                        AI Relationship Vibe
                      </span>
                      <h3 className="text-2xl font-black mt-1 text-white">
                        {data.aiPersona}
                      </h3>
                      <p className="text-xs opacity-80 mt-2 max-w-sm mx-auto leading-relaxed">
                        {data.aiDescription}
                      </p>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold">
                        <HiFire size={18} />
                        <span>Longest Chat Streak: {data.chatStreak} Consecutive Days!</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyShare}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs tracking-wide shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MdShare size={16} />
                      <span>Share / Copy Wrapped Card</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between shrink-0">
              <button
                type="button"
                disabled={activeSlide === 0}
                onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold border border-white/10 disabled:opacity-30 cursor-pointer"
              >
                Previous
              </button>
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${activeSlide === i ? "bg-emerald-500 w-5" : "bg-white/20"
                      }`}
                  />
                ))}
              </div>
              <button
                type="button"
                disabled={activeSlide === slides.length - 1}
                onClick={() =>
                  setActiveSlide((prev) => Math.min(slides.length - 1, prev + 1))
                }
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ChatWrappedModal;
