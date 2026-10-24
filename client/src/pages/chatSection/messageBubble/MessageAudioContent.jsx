import React, { useState } from "react";
import { FaHeadphones, FaCopy, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";
import axiosInstance from "../../../services/url.services";

export const MessageAudioContent = ({
  message,
  renderTimestampAndStatus,
}) => {
  const [transcript, setTranscript] = useState(message?.audioTranscript || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showTranscript, setShowTranscript] = useState(Boolean(message?.audioTranscript));
  const [copied, setCopied] = useState(false);

  const handleTranscribe = async () => {
    if (transcript) {
      setShowTranscript((prev) => !prev);
      return;
    }

    if (!message?.imageOrVideoUrl) {
      toast.error("Audio URL not found");
      return;
    }

    setIsLoading(true);
    setShowTranscript(true);
    try {
      const res = await axiosInstance.post("/chat/transcribe-audio", {
        messageId: message._id,
        audioUrl: message.imageOrVideoUrl,
      });

      const text = res?.data?.data?.transcript || res?.data?.transcript || "";
      if (text) {
        setTranscript(text);
      } else {
        setTranscript("Could not transcribe this audio clip.");
      }
    } catch (err) {
      console.warn("Transcription failed:", err);
      toast.error("Transcription service temporarily busy");
      setShowTranscript(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard?.writeText(transcript);
    setCopied(true);
    toast.success("Transcript copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-1 min-w-[240px] max-w-[320px] py-1">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 truncate">
          <FaHeadphones className="text-amber-500 shrink-0" size={13} />
          <span className="text-xs font-medium opacity-75 truncate">
            {message.fileName || "Voice Note"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleTranscribe}
          className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 transition-all cursor-pointer select-none active:scale-95"
          title="Transcribe voice message with AI"
        >
          <span>📝</span>
          <span>
            {isLoading
              ? "Transcribing..."
              : transcript && showTranscript
                ? "Hide"
                : "Read Transcript"}
          </span>
        </button>
      </div>

      <audio
        src={message.imageOrVideoUrl}
        controls
        className="w-full h-9 rounded-lg"
      />

      {showTranscript && (
        <div className="mt-1.5 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs transition-all animate-fadeIn select-text">
          <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 select-none">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span>📝</span>
              <span>Audio Transcript (Whisper AI)</span>
            </span>
            {transcript && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-white p-0.5"
                title="Copy transcript"
              >
                {copied ? <FaCheck size={10} className="text-emerald-400" /> : <FaCopy size={10} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 py-2 text-gray-400 text-xs">
              <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Transcribing voice note...</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200 text-[12px] font-normal">
              "{transcript}"
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-end mt-0.5 select-none">
        {renderTimestampAndStatus(false)}
      </div>
    </div>
  );
};

export default MessageAudioContent;
