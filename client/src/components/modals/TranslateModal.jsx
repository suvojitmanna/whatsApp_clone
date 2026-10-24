import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { FaCopy, FaCheck, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { HiLanguage } from "react-icons/hi2";
import axiosInstance from "../../services/url.services";

const LANGUAGES = [
  { code: "hi", name: "Hindi (हिंदी)" },
  { code: "es", name: "Spanish (Español)" },
  { code: "bn", name: "Bengali (বাংলা)" },
  { code: "fr", name: "French (Français)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "ar", name: "Arabic (العربية)" },
  { code: "ja", name: "Japanese (日本語)" },
  { code: "ko", name: "Korean (한국어)" },
  { code: "pt", name: "Portuguese (Português)" },
  { code: "ru", name: "Russian (Русский)" },
  { code: "zh", name: "Chinese (中文)" },
  { code: "it", name: "Italian (Italiano)" },
  { code: "en", name: "English" },
];

export default function TranslateModal({
  isOpen,
  onClose,
  initialText = "",
  theme = "dark",
  onSendAsReply,
}) {
  const [targetLang, setTargetLang] = useState("Hindi (हिंदी)");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (isOpen && initialText) {
      handleTranslate(targetLang);
    } else {
      setTranslation("");
      setIsSpeaking(false);
      window.speechSynthesis?.cancel();
    }
  }, [isOpen, initialText]);

  const handleTranslate = async (lang) => {
    if (!initialText?.trim()) return;
    setLoading(true);
    setTranslation("");
    try {
      const res = await axiosInstance.post("/api/chat/translate", {
        text: initialText,
        targetLang: lang,
      });
      if (res?.data?.data?.translation) {
        setTranslation(res.data.data.translation);
      } else {
        setTranslation(res?.data?.message || "Translation unavailable");
      }
    } catch (err) {
      console.warn("Translation failed:", err);
      toast.error("Translation service temporarily busy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLangChange = (langName) => {
    setTargetLang(langName);
    handleTranslate(langName);
  };

  const handleCopy = () => {
    if (!translation) return;
    navigator.clipboard?.writeText(translation);
    setCopied(true);
    toast.success("Translation copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!translation || typeof window === "undefined" || !window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(translation);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleUseAsReply = () => {
    if (!translation) return;
    onSendAsReply?.(translation);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${theme === "dark"
            ? "bg-[#202c33] border-white/10 text-white"
            : "bg-white border-black/10 text-gray-900"
            }`}
        >
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-black/10 dark:border-white/10 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-cyan-500/15 text-cyan-500 flex items-center justify-center">
                <HiLanguage size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base leading-tight">
                  Translate with Meta AI
                </h3>
                <p className="text-[11px] text-gray-400">
                  Instant neural translation in 12+ languages
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <IoClose size={18} />
            </button>
          </div>

          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 select-none">
                Translate to:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {LANGUAGES.map((lang) => {
                  const isSelected = targetLang === lang.name;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLangChange(lang.name)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${isSelected
                        ? "bg-cyan-500 text-white border-cyan-500 shadow-sm"
                        : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-cyan-500/40 text-gray-700 dark:text-gray-300"
                        }`}
                    >
                      {lang.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 select-none">
                Original Message:
              </span>
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                {initialText}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 select-none">
                <span className="text-[11px] font-semibold text-cyan-500 uppercase tracking-wider flex items-center gap-1">
                  <span>✨ Translation ({targetLang}):</span>
                </span>
                {translation && !loading && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSpeak}
                      className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors"
                      title={isSpeaking ? "Stop speaking" : "Listen to translation"}
                    >
                      {isSpeaking ? <FaVolumeMute size={12} className="text-cyan-400" /> : <FaVolumeUp size={12} />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                      title="Copy translation"
                    >
                      {copied ? <FaCheck size={11} className="text-emerald-400" /> : <FaCopy size={11} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 border border-cyan-500/25 min-h-[90px] max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text font-medium text-gray-800 dark:text-gray-100 text-xs sm:text-sm">
                {loading ? (
                  <div className="flex items-center gap-2.5 text-cyan-500 py-3">
                    <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <span>Translating message with AI...</span>
                  </div>
                ) : translation ? (
                  translation
                ) : (
                  <span className="text-gray-400 italic">Select a language to translate...</span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-2 select-none">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-gray-400 hover:text-white"
            >
              Close
            </button>
            <div className="flex items-center gap-2">
              {translation && onSendAsReply && (
                <button
                  type="button"
                  onClick={handleUseAsReply}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Reply with this</span>
                  <span>↗</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
