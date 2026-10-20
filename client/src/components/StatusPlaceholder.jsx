import React from "react";
import useThemeStore from "../store/themeStore";
import { StatusRingPlaceholderIcon } from "./common/Icons";

const StatusPlaceholder = () => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div
      className={`h-full w-full flex flex-col items-center justify-center p-8 select-none transition-colors duration-300 ${
        isDark ? "bg-[#111b21] text-[#e9edef]" : "bg-[#f0f2f5] text-[#111b21]"
      }`}
    >
      <div className="flex flex-col items-center justify-center max-w-md text-center">
        <div className="mb-7 flex items-center justify-center">
          <StatusRingPlaceholderIcon
            size={62}
            className={isDark ? "text-[#8696a0]/50" : "text-[#54656f]/40"}
          />
        </div>

        <h2
          className={`text-[30px] sm:text-[32px] font-normal tracking-tight mb-2.5 ${
            isDark ? "text-[#e9edef]" : "text-[#111b21]"
          }`}
        >
          Share statuses
        </h2>

        <p
          className={`text-[14px] leading-relaxed max-w-[400px] ${
            isDark ? "text-[#8696a0]" : "text-[#54656f]"
          }`}
        >
          Share photos, videos and text that disappear after 24 hours.
        </p>
      </div>
    </div>
  );
};

export default StatusPlaceholder;
