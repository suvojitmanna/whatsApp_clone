import React, { useState } from "react";
import useThemeStore from "../../store/themeStore";
import { toast } from "react-toastify";
import {
  MdVideoCall,
  MdLink,
  MdDialpad,
  MdLockOutline,
  MdClose,
  MdCall,
  MdVideocam,
  MdBackspace,
  MdContentCopy,
} from "react-icons/md";
import { CallLaptopIllustration } from "../../components/common/Icons";

const CallPlaceholder = ({ onNewCall, onStartCall }) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [showCallLinkModal, setShowCallLinkModal] = useState(false);
  const [callLinkUrl, setCallLinkUrl] = useState("");
  const [callLinkType, setCallLinkType] = useState("video");

  const [showDialpad, setShowDialpad] = useState(false);
  const [dialedNumber, setDialedNumber] = useState("");

  const handleCreateCallLink = () => {
    const randomCode = Math.random().toString(36).substring(2, 10);
    const link = `https://call.whatsapp.com/${callLinkType}/${randomCode}`;
    setCallLinkUrl(link);
    setShowCallLinkModal(true);
    navigator.clipboard?.writeText(link);
    toast.success("Call link copied to clipboard");
  };

  const handleDialDigit = (digit) => {
    if (dialedNumber.length < 18) {
      setDialedNumber((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const handleStartDialedCall = (type = "audio") => {
    if (!dialedNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }
    const targetContact = {
      _id: `dial-${Date.now()}`,
      username: dialedNumber.trim(),
      name: dialedNumber.trim(),
      phoneNumber: dialedNumber.trim(),
    };
    setShowDialpad(false);
    if (onStartCall) {
      onStartCall(targetContact, type);
    } else {
      toast.success(`Calling ${dialedNumber}...`);
    }
    setDialedNumber("");
  };

  const dialpadKeys = [
    { key: "1", sub: "" },
    { key: "2", sub: "ABC" },
    { key: "3", sub: "DEF" },
    { key: "4", sub: "GHI" },
    { key: "5", sub: "JKL" },
    { key: "6", sub: "MNO" },
    { key: "7", sub: "PQRS" },
    { key: "8", sub: "TUV" },
    { key: "9", sub: "WXYZ" },
    { key: "*", sub: "" },
    { key: "0", sub: "+" },
    { key: "#", sub: "" },
  ];

  return (
    <div
      className={`h-full w-full flex flex-col items-center justify-between p-6 sm:p-8 select-none transition-colors duration-300 relative overflow-y-auto ${isDark ? "bg-[#111b21] text-[#e9edef]" : "bg-[#f0f2f5] text-[#111b21]"
        }`}
    >
      <div className="my-auto flex flex-col items-center justify-center w-full max-w-lg">
        <div
          className={`w-full max-w-[440px] rounded-[28px] p-8 sm:px-10 sm:py-9 flex flex-col items-center text-center transition-all ${isDark
            ? "bg-[#182229] border border-white/[0.05] shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
            : "bg-white border border-gray-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
            }`}
        >
          <CallLaptopIllustration />

          <h2
            className={`text-[22px] sm:text-[23px] font-semibold tracking-tight mt-6 mb-2.5 ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
              }`}
          >
            Voice and video calling
          </h2>

          <p
            className={`text-[13.5px] sm:text-[14px] leading-relaxed max-w-[320px] ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
              }`}
          >
            Share your screen, react with emoji and more, with up to 32 people.
          </p>
        </div>

        <div className="flex items-center justify-center gap-7 sm:gap-9 mt-8 mb-6">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={onNewCall}
              className="w-14 h-14 rounded-full bg-[#00a884] hover:bg-[#00b87c] text-black flex items-center justify-center shadow-lg hover:shadow-emerald-900/40 active:scale-95 transition-all duration-200 cursor-pointer"
              title="Start call"
              aria-label="Start call"
            >
              <MdVideoCall className="text-3xl text-[#111b21]" />
            </button>
            <span
              className={`text-xs font-medium mt-2.5 text-center ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
                }`}
            >
              Start call
            </span>
          </div>

          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleCreateCallLink}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all duration-200 cursor-pointer ${isDark
                ? "bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] border border-white/[0.06]"
                : "bg-[#e9edef] hover:bg-[#dfe5e7] text-[#111b21] border border-gray-300/60"
                }`}
              title="New call link"
              aria-label="New call link"
            >
              <MdLink className="text-2xl" />
            </button>
            <span
              className={`text-xs font-medium mt-2.5 text-center ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
                }`}
            >
              New call link
            </span>
          </div>

          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowDialpad(true)}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all duration-200 cursor-pointer ${isDark
                ? "bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] border border-white/[0.06]"
                : "bg-[#e9edef] hover:bg-[#dfe5e7] text-[#111b21] border border-gray-300/60"
                }`}
              title="Call a number"
              aria-label="Call a number"
            >
              <MdDialpad className="text-2xl" />
            </button>
            <span
              className={`text-xs font-medium mt-2.5 text-center ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
                }`}
            >
              Call a number
            </span>
          </div>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 text-xs select-none pt-4 pb-2 ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
          }`}
      >
        <MdLockOutline className="text-sm opacity-80" />
        <span>Your personal calls are end-to-end encrypted</span>
      </div>

      {showCallLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${isDark
              ? "bg-[#202c33] border-[#313d45] text-[#e9edef]"
              : "bg-white border-gray-200 text-[#111b21]"
              }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New call link</h3>
              <button
                type="button"
                onClick={() => setShowCallLinkModal(false)}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <MdClose className="text-xl" />
              </button>
            </div>

            <p
              className={`text-xs leading-relaxed mb-4 ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                }`}
            >
              Anyone with WhatsApp can use this link to join this call. Only share it with people you trust.
            </p>

            <div
              className={`p-3 rounded-xl flex items-center justify-between gap-3 mb-5 border ${isDark
                ? "bg-[#111b21] border-[#222e35]"
                : "bg-[#f0f2f5] border-gray-200"
                }`}
            >
              <span className="text-xs font-mono truncate text-[#00a884]">
                {callLinkUrl}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(callLinkUrl);
                  toast.success("Link copied!");
                }}
                className="p-1.5 rounded-lg bg-[#00a884] hover:bg-[#008f6f] text-black shrink-0 transition-colors cursor-pointer"
                title="Copy link"
              >
                <MdContentCopy className="text-sm" />
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCallLinkModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-[#00a884] text-black hover:bg-[#008f6f] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showDialpad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            className={`w-full max-w-[340px] rounded-3xl p-6 shadow-2xl border flex flex-col items-center ${isDark
              ? "bg-[#202c33] border-[#313d45] text-[#e9edef]"
              : "bg-white border-gray-200 text-[#111b21]"
              }`}
          >
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-sm font-semibold">Call a number</span>
              <button
                type="button"
                onClick={() => {
                  setShowDialpad(false);
                  setDialedNumber("");
                }}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <MdClose className="text-xl" />
              </button>
            </div>

            <div className="w-full min-h-[48px] px-3 py-2 flex items-center justify-between mb-4 border-b border-gray-500/20">
              <span className="text-xl font-medium tracking-wider truncate">
                {dialedNumber || (
                  <span className="text-sm font-normal text-gray-500">
                    Enter phone number...
                  </span>
                )}
              </span>
              {dialedNumber && (
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="p-1.5 hover:text-red-400 transition-colors cursor-pointer"
                  title="Backspace"
                >
                  <MdBackspace className="text-lg" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 w-full mb-6">
              {dialpadKeys.map(({ key, sub }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDialDigit(key)}
                  className={`h-14 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer ${isDark
                    ? "bg-[#111b21] hover:bg-[#2a3942] text-white"
                    : "bg-[#f0f2f5] hover:bg-[#e9edef] text-[#111b21]"
                    }`}
                >
                  <span className="text-lg font-semibold leading-none">{key}</span>
                  {sub && (
                    <span className="text-[9px] font-medium opacity-60 mt-0.5 tracking-widest">
                      {sub}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 w-full">
              <button
                type="button"
                onClick={() => handleStartDialedCall("audio")}
                className="flex-1 py-3 rounded-full bg-[#00a884] hover:bg-[#008f6f] active:scale-95 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <MdCall className="text-base" />
                <span>Voice Call</span>
              </button>
              <button
                type="button"
                onClick={() => handleStartDialedCall("video")}
                className="flex-1 py-3 rounded-full bg-[#00a884] hover:bg-[#008f6f] active:scale-95 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <MdVideocam className="text-base" />
                <span>Video Call</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallPlaceholder;
