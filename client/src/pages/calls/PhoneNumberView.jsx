import React, { useState, useRef, useEffect, useMemo } from "react";
import useThemeStore from "../../store/themeStore";
import { toast } from "react-toastify";
import {
  MdArrowBack,
  MdCall,
  MdVideocam,
  MdClear,
  MdOutlineEmail,
} from "react-icons/md";
import { ContactAvatar } from "./FaviouriteCall";

const PhoneNumberView = ({ onBack, onStartCall, contacts = [] }) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [activeMode, setActiveMode] = useState("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");

  const phoneInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const backspaceTimerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeMode === "phone") {
        phoneInputRef.current?.focus();
      } else {
        emailInputRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeMode]);

  const handleAppendDigit = (char) => {
    if (phoneNumber.length < 24) {
      setPhoneNumber((prev) => prev + char);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleBackspaceMouseDown = () => {
    handleBackspace();
    backspaceTimerRef.current = setTimeout(() => {
      setPhoneNumber("");
      toast.info("Cleared");
    }, 700);
  };

  const handleBackspaceMouseUp = () => {
    if (backspaceTimerRef.current) {
      clearTimeout(backspaceTimerRef.current);
      backspaceTimerRef.current = null;
    }
  };

  const handleCall = (callType = "audio") => {
    if (activeMode === "phone") {
      if (!phoneNumber.trim()) {
        toast.error("Please enter a phone number");
        return;
      }

      const cleanNumber = phoneNumber.trim();
      const matchedContact = contacts.find(
        (c) =>
          c.phoneNumber?.replace(/\D/g, "") === cleanNumber.replace(/\D/g, "")
      );

      if (onStartCall) {
        onStartCall(
          matchedContact || {
            _id: `phone-${Date.now()}`,
            username: cleanNumber,
            name: cleanNumber,
            phoneNumber: cleanNumber,
            about: "Hey there! I am using WhatsApp",
          },
          callType
        );
      } else {
        toast.success(`Calling ${cleanNumber}...`);
      }
    } else {
      if (!emailAddress.trim()) {
        toast.error("Please enter an email address");
        return;
      }

      const cleanEmail = emailAddress.trim().toLowerCase();
      const matchedContact = contacts.find(
        (c) =>
          c.email?.toLowerCase() === cleanEmail ||
          c.username?.toLowerCase() === cleanEmail
      );

      if (onStartCall) {
        onStartCall(
          matchedContact || {
            _id: `email-${Date.now()}`,
            username: cleanEmail,
            name: cleanEmail,
            email: cleanEmail,
            about: "Hey there! I am using WhatsApp",
          },
          callType
        );
      } else {
        toast.success(`Calling ${cleanEmail}...`);
      }
    }
  };

  const matchingEmailContacts = useMemo(() => {
    if (!emailAddress.trim()) return [];
    const q = emailAddress.toLowerCase();
    return contacts
      .filter((c) => {
        const email = c.email?.toLowerCase() || "";
        const name = (c.username || c.name || "").toLowerCase();
        return email.includes(q) || name.includes(q);
      })
      .slice(0, 4);
  }, [contacts, emailAddress]);

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

  const emailDomainChips = [
    "@gmail.com",
    "@outlook.com",
    "@yahoo.com",
    "@icloud.com",
  ];

  return (
    <div
      className={`h-full w-full flex flex-col select-none border-r transition-colors duration-200 overflow-y-auto ${
        isDark
          ? "bg-[#111b21] border-[#222e35] text-[#e9edef]"
          : "bg-white border-gray-200 text-[#111b21]"
      }`}
    >
      <div className="h-16 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className={`p-2 -ml-2 rounded-full transition-colors cursor-pointer active:scale-95 ${
              isDark
                ? "text-[#e9edef] hover:bg-white/10"
                : "text-[#111b21] hover:bg-black/5"
            }`}
            title="Back"
            aria-label="Back"
          >
            <MdArrowBack className="text-xl" />
          </button>

          <h1 className="text-[19px] font-semibold tracking-tight">
            {activeMode === "phone" ? "Phone number" : "Email address"}
          </h1>
        </div>
      </div>

      <div className="px-4 pb-3 shrink-0">
        <div
          className={`p-1 rounded-xl flex items-center gap-1 ${
            isDark ? "bg-[#182229]" : "bg-[#f0f2f5]"
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveMode("phone")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === "phone"
                ? isDark
                  ? "bg-[#202c33] text-[#00c878] shadow-sm"
                  : "bg-white text-[#008f5a] shadow-sm"
                : isDark
                ? "text-[#8696a0] hover:text-[#e9edef]"
                : "text-[#54656f] hover:text-[#111b21]"
            }`}
          >
            <MdCall className="text-sm" />
            <span>Phone number</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("email")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === "email"
                ? isDark
                  ? "bg-[#202c33] text-[#00c878] shadow-sm"
                  : "bg-white text-[#008f5a] shadow-sm"
                : isDark
                ? "text-[#8696a0] hover:text-[#e9edef]"
                : "text-[#54656f] hover:text-[#111b21]"
            }`}
          >
            <MdOutlineEmail className="text-sm" />
            <span>Email</span>
          </button>
        </div>
      </div>

      {activeMode === "phone" ? (
        <>
          <div className="px-4 pt-1 pb-1 shrink-0">
            <div className="relative w-full">
              <input
                ref={phoneInputRef}
                type="text"
                value={phoneNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9+\s\-*#()]/g, "");
                  setPhoneNumber(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCall("audio");
                  }
                }}
                placeholder="Phone number"
                className={`w-full px-4 py-3.5 rounded-2xl text-[16px] font-normal tracking-wide outline-none border-2 transition-all ${
                  isDark
                    ? "bg-[#161a1d] border-[#00c878] text-[#e9edef] placeholder-[#8696a0]"
                    : "bg-[#f0f2f5] border-[#00a884] text-[#111b21] placeholder-[#54656f]"
                }`}
              />

              {phoneNumber && (
                <button
                  type="button"
                  onClick={() => setPhoneNumber("")}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors cursor-pointer ${
                    isDark
                      ? "text-[#8696a0] hover:text-white hover:bg-white/10"
                      : "text-[#54656f] hover:text-black hover:bg-black/10"
                  }`}
                  title="Clear"
                >
                  <MdClear className="text-lg" />
                </button>
              )}
            </div>
          </div>

          <p
            className={`text-center text-[13.5px] mt-6 mb-7 px-4 font-normal ${
              isDark ? "text-[#8696a0]" : "text-[#54656f]"
            }`}
          >
            Enter a phone number to start a call
          </p>

          <div className="w-full max-w-[340px] mx-auto px-4 grid grid-cols-3 gap-y-7 gap-x-6 sm:gap-x-8 select-none">
            {dialpadGrid.map((item) => {
              if (item.isBackspace) {
                return (
                  <button
                    key="backspace"
                    type="button"
                    onClick={handleBackspace}
                    onMouseDown={handleBackspaceMouseDown}
                    onMouseUp={handleBackspaceMouseUp}
                    onMouseLeave={handleBackspaceMouseUp}
                    onTouchStart={handleBackspaceMouseDown}
                    onTouchEnd={handleBackspaceMouseUp}
                    className={`h-16 w-full flex items-center justify-center rounded-2xl active:scale-95 transition-all cursor-pointer ${
                      isDark
                        ? "hover:bg-white/[0.06] active:bg-white/[0.12] text-[#e9edef]"
                        : "hover:bg-black/[0.05] active:bg-black/[0.1] text-[#111b21]"
                    }`}
                    title="Backspace (Hold to clear)"
                    aria-label="Backspace"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6 stroke-current"
                      fill="none"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                      <line x1="18" y1="9" x2="12" y2="15" />
                      <line x1="12" y1="9" x2="18" y2="15" />
                    </svg>
                  </button>
                );
              }

              if (item.isPlus) {
                return (
                  <button
                    key="plus"
                    type="button"
                    onClick={() => handleAppendDigit("+")}
                    className={`h-16 w-full flex items-center justify-center rounded-2xl active:scale-95 transition-all cursor-pointer ${
                      isDark
                        ? "hover:bg-white/[0.06] active:bg-white/[0.12] text-[#e9edef]"
                        : "hover:bg-black/[0.05] active:bg-black/[0.1] text-[#111b21]"
                    }`}
                    aria-label="Plus"
                  >
                    <span className="text-[26px] font-medium leading-none">
                      +
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={item.digit}
                  type="button"
                  onClick={() => handleAppendDigit(item.digit)}
                  className={`h-16 w-full flex flex-col items-center justify-center rounded-2xl active:scale-95 transition-all cursor-pointer ${
                    isDark
                      ? "hover:bg-white/[0.06] active:bg-white/[0.12] text-[#e9edef]"
                      : "hover:bg-black/[0.05] active:bg-black/[0.1] text-[#111b21]"
                  }`}
                >
                  <span className="text-[26px] font-normal leading-none">
                    {item.digit}
                  </span>
                  {item.sub ? (
                    <span
                      className={`text-[11px] font-medium tracking-widest mt-1 ${
                        isDark ? "text-[#8696a0]" : "text-[#54656f]"
                      }`}
                    >
                      {item.sub}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {phoneNumber.trim().length > 0 && (
            <div className="mt-8 mb-6 px-6 flex items-center justify-center gap-3.5 animate-fadeIn">
              <button
                type="button"
                onClick={() => handleCall("audio")}
                className="flex-1 py-3 px-4 rounded-full bg-[#00a884] hover:bg-[#00c878] active:scale-95 text-[#111b21] font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <MdCall className="text-lg" />
                <span>Voice</span>
              </button>

              <button
                type="button"
                onClick={() => handleCall("video")}
                className="flex-1 py-3 px-4 rounded-full bg-[#00a884] hover:bg-[#00c878] active:scale-95 text-[#111b21] font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <MdVideocam className="text-lg" />
                <span>Video</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="px-4 pt-1 pb-1 shrink-0">
            <div className="relative w-full">
              <input
                ref={emailInputRef}
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCall("audio");
                  }
                }}
                placeholder="Email address (e.g. name@gmail.com)"
                className={`w-full px-4 py-3.5 rounded-2xl text-[15px] font-normal tracking-normal outline-none border-2 transition-all ${
                  isDark
                    ? "bg-[#161a1d] border-[#00c878] text-[#e9edef] placeholder-[#8696a0]"
                    : "bg-[#f0f2f5] border-[#00a884] text-[#111b21] placeholder-[#54656f]"
                }`}
              />

              {emailAddress && (
                <button
                  type="button"
                  onClick={() => setEmailAddress("")}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors cursor-pointer ${
                    isDark
                      ? "text-[#8696a0] hover:text-white hover:bg-white/10"
                      : "text-[#54656f] hover:text-black hover:bg-black/10"
                  }`}
                  title="Clear"
                >
                  <MdClear className="text-lg" />
                </button>
              )}
            </div>
          </div>

          <p
            className={`text-center text-[13.5px] mt-4 mb-5 px-4 font-normal ${
              isDark ? "text-[#8696a0]" : "text-[#54656f]"
            }`}
          >
            Enter an email address to start a call
          </p>

          <div className="px-4 flex flex-wrap gap-2 justify-center mb-6">
            {emailDomainChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  if (!emailAddress.includes("@")) {
                    setEmailAddress((prev) => prev + chip);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  isDark
                    ? "bg-[#182229] border-white/10 text-[#8696a0] hover:text-[#00c878] hover:border-[#00c878]/50"
                    : "bg-[#f0f2f5] border-gray-200 text-[#54656f] hover:text-[#008f5a] hover:border-[#008f5a]/50"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          {matchingEmailContacts.length > 0 && (
            <div className="px-4 mb-4 flex flex-col gap-1.5">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider px-1 ${
                  isDark ? "text-[#8696a0]" : "text-[#54656f]"
                }`}
              >
                Suggested Contacts
              </span>
              {matchingEmailContacts.map((c) => {
                const name = c.username || c.name || "User";
                const email = c.email || `${name.toLowerCase()}@gmail.com`;
                return (
                  <div
                    key={c._id || c.id}
                    onClick={() => {
                      setEmailAddress(email);
                    }}
                    className={`p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                      isDark ? "hover:bg-white/[0.06]" : "hover:bg-black/[0.05]"
                    }`}
                  >
                    <ContactAvatar contact={c} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{name}</div>
                      <div
                        className={`text-xs truncate ${
                          isDark ? "text-[#8696a0]" : "text-[#54656f]"
                        }`}
                      >
                        {email}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {emailAddress.trim().length > 0 && (
            <div className="mt-4 mb-6 px-6 flex items-center justify-center gap-3.5 animate-fadeIn">
              <button
                type="button"
                onClick={() => handleCall("audio")}
                className="flex-1 py-3 px-4 rounded-full bg-[#00a884] hover:bg-[#00c878] active:scale-95 text-[#111b21] font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <MdCall className="text-lg" />
                <span>Voice</span>
              </button>

              <button
                type="button"
                onClick={() => handleCall("video")}
                className="flex-1 py-3 px-4 rounded-full bg-[#00a884] hover:bg-[#00c878] active:scale-95 text-[#111b21] font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <MdVideocam className="text-lg" />
                <span>Video</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PhoneNumberView;
