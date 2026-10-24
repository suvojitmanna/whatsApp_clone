import React from "react";

export const WhatsAppSwitch = ({ checked, onChange, disabled = false, className = "" }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={(e) => {
      e?.stopPropagation?.();
      if (!disabled && onChange) onChange(e);
    }}
    className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${checked
      ? "bg-[#00a884] justify-end"
      : "bg-transparent border-2 border-[#8696a0] justify-start"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
  >
    <div
      className={`w-4 h-4 rounded-full transition-transform ${checked ? "bg-[#111b21] mr-0.5" : "bg-[#8696a0] ml-0.5"
        }`}
    />
  </button>
);

export const formatMemberChangeDate = (dateVal) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} at ${hours}:${minutes}`;
};

export const ActionButton = ({ icon, label, onClick, disabled, theme, title, ...props }) => (
  <button
    type="button"
    title={title}
    onClick={!disabled ? onClick : undefined}
    className={`flex flex-col items-center gap-1.5 group transition-all duration-200 ${disabled ? "opacity-35 cursor-not-allowed" : "cursor-pointer active:scale-95"
      }`}
    {...props}
  >
    <div
      className={`w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-200 ${theme === "dark"
        ? "bg-white/5 border-transparent text-[#00a884] group-hover:bg-white/10 group-hover:border-[#00a884]/40"
        : "bg-white border-gray-200 text-[#00a884] group-hover:bg-gray-100 group-hover:border-[#00897b]/40"
        } shadow-xs`}
    >
      {icon}
    </div>
    <span
      className={`text-[12px] font-normal tracking-tight transition-colors ${theme === "dark"
        ? "text-[#00a884] group-hover:text-[#02906f]"
        : "text-[#00897b] group-hover:text-[#00796b]"
        }`}
    >
      {label}
    </span>
  </button>
);

export const AVATAR_BG_COLORS = [
  "#00a884",
  "#008069",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#f59e0b",
  "#ef4444",
  "#202c33",
];
