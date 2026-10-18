import React from "react";
import useThemeStore from "../../store/themeStore";
import { MdAddIcCall, MdLock } from "react-icons/md";
import { FaPhoneAlt, FaVideo } from "react-icons/fa";

const CallPlaceholder = ({ onNewCall }) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div
      className={`h-full w-full flex flex-col items-center justify-center p-8 select-none transition-colors duration-300 relative ${
        isDark ? "bg-[#111b21] text-[#e9edef]" : "bg-[#f0f2f5] text-[#111b21]"
      }`}
    >
      <div className="flex flex-col items-center justify-center max-w-md text-center">
        {/* Call Illustration Icon */}
        <div className="relative mb-8 flex items-center justify-center">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-transform hover:scale-105 duration-300 shadow-xl ${
              isDark
                ? "bg-[#202c33] border border-[#2a3942] text-[#00a884]"
                : "bg-white border border-gray-200 text-[#00a884] shadow-sm"
            }`}
          >
            <div className="relative">
              <FaPhoneAlt className="text-4xl transform -rotate-12" />
              <div
                className={`absolute -bottom-2 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs text-white ${
                  isDark ? "bg-[#00a884]" : "bg-[#00a884]"
                } ring-2 ${isDark ? "ring-[#111b21]" : "ring-[#f0f2f5]"}`}
              >
                <FaVideo className="text-[12px]" />
              </div>
            </div>
          </div>
        </div>

        <h2
          className={`text-[28px] sm:text-[32px] font-normal tracking-tight mb-3 ${
            isDark ? "text-[#e9edef]" : "text-[#111b21]"
          }`}
        >
          Make calls from your computer
        </h2>

        <p
          className={`text-[14px] leading-relaxed max-w-[380px] mb-8 ${
            isDark ? "text-[#8696a0]" : "text-[#54656f]"
          }`}
        >
          Connect with friends and family with high quality audio and video
          calls. Stay in touch anytime, anywhere.
        </p>

        {onNewCall && (
          <button
            type="button"
            onClick={onNewCall}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-black font-semibold text-sm transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
          >
            <MdAddIcCall className="text-lg" />
            <span>Start a call</span>
          </button>
        )}
      </div>

      {/* End-to-end encrypted footer */}
      <div
        className={`absolute bottom-8 flex items-center gap-1.5 text-xs select-none ${
          isDark ? "text-[#8696a0]" : "text-[#54656f]"
        }`}
      >
        <MdLock className="text-sm opacity-70" />
        <span>End-to-end encrypted</span>
      </div>
    </div>
  );
};

export default CallPlaceholder;
