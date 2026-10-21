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
} from "react-icons/md";
import { CallLaptopIllustration, BackspaceIcon } from "../../components/common/Icons";
import NewCallLinkModal from "./NewCallLinkModal";

const CallPlaceholder = ({
  onNewCall,
  onStartCall,
  onOpenDialpad,
  contacts = [],
  onSendToChat,
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [showCallLinkModal, setShowCallLinkModal] = useState(false);
  const [showDialpad, setShowDialpad] = useState(false);
  const [dialedNumber, setDialedNumber] = useState("");

  const handleDialDigit = (digit) => {
    if (dialedNumber.length < 24) {
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

  const dialpadGrid = [
    { digit: "1", sub: "" },
    { digit: "2", sub: "ABC" },
    { digit: "3", sub: "DEF" },
    { digit: "4", sub: "GHI" },
    { digit: "5", sub: "JKL" },
    { digit: "6", sub: "MNO" },
    { digit: "7", sub: "PQRS" },
    { digit: "8", sub: "TUV" },
    { digit: "9", sub: "WXYZ" },
    { digit: "+", sub: "", isPlus: true },
    { digit: "0", sub: "" },
    { digit: "backspace", isBackspace: true },
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
              onClick={() => setShowCallLinkModal(true)}
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
              onClick={() => {
                if (onOpenDialpad) {
                  onOpenDialpad();
                } else {
                  setShowDialpad(true);
                }
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all duration-200 cursor-pointer ${isDark
                  ? "bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] border border-white/[0.06]"
                  : "bg-[#e9edef] hover:bg-[#dfe5e7] text-[#111b21] border border-gray-300/60"
                }`}
              title="Call a number or email"
              aria-label="Call a number or email"
            >
              <MdDialpad className="text-2xl" />
            </button>
            <span
              className={`text-xs font-medium mt-2.5 text-center ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
                }`}
            >
              Call a number or email
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

      <NewCallLinkModal
        isOpen={showCallLinkModal}
        onClose={() => setShowCallLinkModal(false)}
        onStartCall={onStartCall}
        contacts={contacts}
        onSendToChat={onSendToChat}
      />

      {showDialpad && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setShowDialpad(false)}
        >
          <div
            className={`w-full max-w-[360px] rounded-[24px] p-6 shadow-2xl border flex flex-col items-center ${isDark
                ? "bg-[#202c33] border-[#313d45] text-[#e9edef]"
                : "bg-white border-gray-200 text-[#111b21]"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-base font-semibold">Phone number</span>
              <button
                type="button"
                onClick={() => {
                  setShowDialpad(false);
                  setDialedNumber("");
                }}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <MdClose className="text-xl" />
              </button>
            </div>

            <div className="w-full relative mb-4">
              <input
                type="text"
                value={dialedNumber}
                onChange={(e) => setDialedNumber(e.target.value)}
                placeholder="Phone number"
                className={`w-full px-4 py-3 rounded-2xl text-[16px] outline-none border-2 ${isDark
                    ? "bg-[#161a1d] border-[#00c878] text-white placeholder-[#8696a0]"
                    : "bg-[#f0f2f5] border-[#00a884] text-[#111b21] placeholder-[#54656f]"
                  }`}
                autoFocus
              />
            </div>

            <p className="text-xs text-[#8696a0] mb-5 text-center">
              Enter a phone number to start a call
            </p>

            <div className="grid grid-cols-3 gap-y-5 gap-x-4 w-full mb-6">
              {dialpadGrid.map((item) => {
                if (item.isBackspace) {
                  return (
                    <button
                      key="backspace"
                      type="button"
                      onClick={handleBackspace}
                      className={`h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${isDark
                          ? "hover:bg-white/[0.06] text-[#e9edef]"
                          : "hover:bg-black/[0.05] text-[#111b21]"
                        }`}
                    >
                      <BackspaceIcon size={24} className="w-6 h-6 stroke-current" />
                    </button>
                  );
                }

                if (item.isPlus) {
                  return (
                    <button
                      key="plus"
                      type="button"
                      onClick={() => handleDialDigit("+")}
                      className={`h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${isDark
                          ? "hover:bg-white/[0.06] text-[#e9edef]"
                          : "hover:bg-black/[0.05] text-[#111b21]"
                        }`}
                    >
                      <span className="text-[24px] font-medium leading-none">+</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.digit}
                    type="button"
                    onClick={() => handleDialDigit(item.digit)}
                    className={`h-14 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer ${isDark
                        ? "hover:bg-white/[0.06] text-[#e9edef]"
                        : "hover:bg-black/[0.05] text-[#111b21]"
                      }`}
                  >
                    <span className="text-[22px] font-normal leading-none">
                      {item.digit}
                    </span>
                    {item.sub ? (
                      <span className="text-[9px] font-medium text-[#8696a0] tracking-widest mt-0.5">
                        {item.sub}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => handleStartDialedCall("audio")}
                className="flex-1 py-3 rounded-full bg-[#00a884] hover:bg-[#00c878] active:scale-95 text-[#111b21] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <MdCall className="text-base" />
                <span>Voice Call</span>
              </button>
              <button
                type="button"
                onClick={() => handleStartDialedCall("video")}
                className="flex-1 py-3 rounded-full bg-[#00a884] hover:bg-[#00c878] active:scale-95 text-[#111b21] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
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
