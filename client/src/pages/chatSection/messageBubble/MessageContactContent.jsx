import React from "react";
import { RiContactsFill } from "react-icons/ri";

export const MessageContactContent = ({
  message,
  isDark,
  renderTimestampAndStatus,
}) => {
  const contactData = typeof message.contactData === "string"
    ? (() => { try { return JSON.parse(message.contactData); } catch (e) { return {}; } })()
    : (message.contactData || {});

  const contactName = contactData?.name || (typeof message.content === "string" ? message.content.replace(/^Contact:\s*/, "") : "Contact");
  const phone = contactData?.phoneNumber;
  const email = contactData?.email;
  const avatar = contactData?.avatar;

  return (
    <div className="min-w-[230px] max-w-[300px]">
      <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? "bg-white/[0.05] border-white/10" : "bg-white/80 border-black/5 shadow-sm"}`}>
        <div className="w-11 h-11 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center shrink-0 overflow-hidden font-bold">
          {avatar ? (
            <img
              src={avatar}
              alt="Contact"
              className="w-full h-full object-fill"
            />
          ) : (
            <RiContactsFill size={24} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold truncate">
            {contactName}
          </p>
          {phone && (
            <p className="text-xs opacity-75 truncate font-mono">
              {phone}
            </p>
          )}
          {email && (
            <p className="text-xs opacity-75 truncate">
              {email}
            </p>
          )}
          {!phone && !email && (
            <p className="text-xs opacity-60 italic">
              No number or email
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end mt-1 px-1 select-none">
        {renderTimestampAndStatus(false)}
      </div>
    </div>
  );
};

export default MessageContactContent;
