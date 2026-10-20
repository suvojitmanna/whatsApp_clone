import React from "react";
import { SiMetaai } from "react-icons/si";

export const META_AI_USER_ID = "66f000000000000000000001";
export const META_AI_AVATAR = "https://cdn.simpleicons.org/meta/0081FB";

export const MetaAiRing = ({
  size = 24,
  className = "",
  animate = false,
  showInnerIcon = true,
}) => {
  const gradientId = React.useId();

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 flex items-center justify-center select-none ${
        animate ? "animate-pulse" : ""
      } ${className}`}
    >
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        className="w-full h-full transform transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00c6ff" />
            <stop offset="30%" stopColor="#0072ff" />
            <stop offset="70%" stopColor="#9b51e0" />
            <stop offset="100%" stopColor="#ff007f" />
          </linearGradient>
        </defs>
        <circle
          cx="24"
          cy="24"
          r="21"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle
          cx="24"
          cy="24"
          r="16.5"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.2"
          opacity="0.35"
        />
      </svg>
      {showInnerIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <SiMetaai
            style={{ width: Math.round(size * 0.44), height: Math.round(size * 0.44) }}
            className="text-slate-800 dark:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-colors"
          />
        </div>
      )}
    </div>
  );
};

export const MetaAiBadge = ({ className = "text-[11px]" }) => (
  <span
    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-medium bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-pink-500/15 text-[#00a884] dark:text-[#25d366] border border-emerald-500/20 ${className}`}
  >
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
    <span>AI</span>
  </span>
);

export default MetaAiRing;
