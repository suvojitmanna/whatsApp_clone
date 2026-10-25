import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../../store/themeStore";
import { toast } from "react-toastify";
import {
  MdClose,
  MdVideocam,
  MdCall,
  MdCheck,
  MdSearch,
} from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";
import { ContactAvatar } from "./FaviouriteCall";
import { CopyIcon, SendPaperPlaneIcon } from "../../components/common/Icons";

const NewCallLinkModal = ({
  isOpen,
  onClose,
  onStartCall,
  contacts = [],
  onSendToChat,
  activeContact = null,
}) => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [callType, setCallType] = useState("video");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [linkCode, setLinkCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactSearch, setContactSearch] = useState("");

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "SUH50";
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setLinkCode(code);
      setCopied(false);
      setShowContactPicker(false);
      setContactSearch("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsTypeDropdownOpen(false);
      }
    };
    if (isTypeDropdownOpen) {
      window.addEventListener("click", handleOutsideClick);
    }
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [isTypeDropdownOpen]);

  if (!isOpen) return null;

  const callUrl = `https://call.whatsapp.com/${callType}/${linkCode}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(callUrl);
    setCopied(true);
    toast.success("Call link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinCall = () => {
    if (onStartCall) {
      const target = activeContact || {
        _id: `link-${linkCode}`,
        username: `${callType === "video" ? "Video" : "Voice"} Call Link`,
        name: `${callType === "video" ? "Video" : "Voice"} Call Link`,
      };
      onStartCall(target, callType);
    } else {
      toast.success("Joining call link room...");
    }
    onClose();
  };

  const handleSendViaWhatsApp = () => {
    navigator.clipboard?.writeText(callUrl);
    toast.success("Call link copied to clipboard");
    if (activeContact && onSendToChat) {
      onSendToChat(activeContact, callUrl, callType, linkCode);
      toast.success(
        `Link shared with ${activeContact.username || activeContact.name || "chat"}`
      );
      onClose();
      return;
    }
    if (contacts && contacts.length > 0) {
      setShowContactPicker(true);
    }
  };

  const handleSelectContactToSend = (contact) => {
    if (onSendToChat) {
      onSendToChat(contact, callUrl, callType, linkCode);
    }
    toast.success(
      `Link shared with ${contact.username || contact.name || "contact"}`
    );
    setShowContactPicker(false);
    onClose();
  };

  const filteredContacts = contacts.filter((c) => {
    if (!contactSearch.trim()) return true;
    const q = contactSearch.toLowerCase();
    return (
      (c.username || c.name)?.toLowerCase().includes(q) ||
      c.phoneNumber?.includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-[460px] rounded-[22px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border transition-all ${isDark
          ? "bg-[#202428] border-white/[0.08] text-[#e9edef]"
          : "bg-white border-gray-200 text-[#111b21]"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[20px] font-semibold tracking-tight">
            New call link
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
              ? "text-[#aebac1] hover:text-white hover:bg-white/10"
              : "text-[#54656f] hover:text-black hover:bg-black/5"
              }`}
            title="Close"
            aria-label="Close"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {showContactPicker ? (
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Send link to</span>
              <button
                type="button"
                onClick={() => setShowContactPicker(false)}
                className="text-xs text-[#00a884] hover:underline cursor-pointer"
              >
                Back
              </button>
            </div>

            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border mb-3 ${isDark
                ? "bg-[#111b21] border-[#222e35]"
                : "bg-[#f0f2f5] border-gray-200"
                }`}
            >
              <MdSearch className="text-lg opacity-60" />
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search contact..."
                className="w-full bg-transparent text-sm outline-none"
                autoFocus
              />
            </div>

            <div className="max-h-[260px] overflow-y-auto flex flex-col gap-1 pr-1 scrollbar-thin">
              {filteredContacts.length === 0 ? (
                <div className="py-8 text-center text-xs opacity-60">
                  No contacts found
                </div>
              ) : (
                filteredContacts.map((c) => {
                  const id = c._id || c.id || c.contactId;
                  const name = c.username || c.name || "Unknown";
                  return (
                    <div
                      key={id}
                      onClick={() => handleSelectContactToSend(c)}
                      className={`p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${isDark
                        ? "hover:bg-white/[0.06]"
                        : "hover:bg-black/[0.05]"
                        }`}
                    >
                      <ContactAvatar contact={c} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">
                          {name}
                        </div>
                        {c.about && (
                          <div className="text-xs opacity-60 truncate">
                            {c.about}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 mb-5 relative">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTypeDropdownOpen((prev) => !prev);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-[14px] transition-all cursor-pointer ${isDark
                    ? "bg-[#132d24] hover:bg-[#183a2e] text-[#25d366] border border-[#00a884]/25"
                    : "bg-[#e7fce3] hover:bg-[#d8f9d3] text-[#008069] border border-[#00a884]/30"
                    }`}
                  title="Change call type"
                >
                  {callType === "video" ? (
                    <MdVideocam className="text-lg" />
                  ) : (
                    <MdCall className="text-base" />
                  )}
                  <span className="capitalize">{callType}</span>
                  <IoIosArrowDown
                    className={`text-xs transition-transform duration-200 ${isTypeDropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {isTypeDropdownOpen && (
                  <div
                    className={`absolute top-12 left-0 z-30 w-36 py-1.5 rounded-xl shadow-xl border animate-fadeIn ${isDark
                      ? "bg-[#182229] border-white/10 text-[#e9edef]"
                      : "bg-white border-gray-200 text-[#111b21]"
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setCallType("video");
                        setIsTypeDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 flex items-center gap-2.5 text-sm transition-colors text-left cursor-pointer ${callType === "video"
                        ? "text-[#00a884] font-medium"
                        : ""
                        } ${isDark ? "hover:bg-white/[0.06]" : "hover:bg-black/[0.04]"
                        }`}
                    >
                      <MdVideocam className="text-lg text-[#00a884]" />
                      <span>Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCallType("voice");
                        setIsTypeDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 flex items-center gap-2.5 text-sm transition-colors text-left cursor-pointer ${callType === "voice"
                        ? "text-[#00a884] font-medium"
                        : ""
                        } ${isDark ? "hover:bg-white/[0.06]" : "hover:bg-black/[0.04]"
                        }`}
                    >
                      <MdCall className="text-base text-[#00a884]" />
                      <span>Voice</span>
                    </button>
                  </div>
                )}
              </div>

              <div
                className={`flex-1 min-w-0 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border ${isDark
                  ? "bg-[#111b21] border-white/[0.06]"
                  : "bg-[#f0f2f5] border-gray-200"
                  }`}
              >
                <span
                  className={`text-[13.5px] truncate font-normal tracking-tight select-all ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
                    }`}
                  title={callUrl}
                >
                  {callUrl}
                </span>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${copied
                    ? "text-[#00a884]"
                    : isDark
                      ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                      : "text-[#54656f] hover:text-black hover:bg-black/5"
                    }`}
                  title="Copy link"
                  aria-label="Copy link"
                >
                  {copied ? (
                    <MdCheck className="text-lg" />
                  ) : (
                    <CopyIcon size={16} className="stroke-current" />
                  )}
                </button>
              </div>
            </div>

            <p
              className={`text-[13.5px] leading-relaxed mb-5 ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                }`}
            >
              Anyone can use this link to join this call, even if they're not on
              WhatsApp. Only share it with people you trust.{" "}
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  navigate("/help?topic=calls");
                }}
                className="text-[#00a884] hover:text-[#06cf9c] font-medium cursor-pointer hover:underline inline"
              >
                Learn more
              </button>
            </p>

            <div className="flex items-center justify-between gap-4 py-2 mb-6">
              <div className="flex flex-col pr-2">
                <span
                  className={`text-[15px] font-semibold ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
                    }`}
                >
                  Require approval to join
                </span>
                <span
                  className={`text-[13px] leading-tight mt-0.5 ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                    }`}
                >
                  People who don't have WhatsApp will always need approval to
                  join.
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={requireApproval}
                onClick={() => setRequireApproval((prev) => !prev)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 relative flex items-center ${requireApproval
                  ? "bg-[#00a884]"
                  : isDark
                    ? "bg-[#374248]"
                    : "bg-[#d1d7db]"
                  }`}
              >
                <div
                  className={`w-5 h-5 rounded-full transition-transform duration-200 shadow-sm ${requireApproval
                    ? "bg-white translate-x-5"
                    : isDark
                      ? "bg-[#8696a0] translate-x-0"
                      : "bg-white translate-x-0"
                    }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleJoinCall}
                className="text-[#00a884] hover:text-[#06cf9c] font-semibold text-[14.5px] px-3.5 py-2 rounded-full hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
              >
                Join call
              </button>

              <button
                type="button"
                onClick={handleSendViaWhatsApp}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#25d366] hover:bg-[#20bd5a] active:scale-95 text-[#111b21] font-semibold text-[14px] transition-all shadow-md cursor-pointer"
              >
                <SendPaperPlaneIcon size={16} className="w-4 h-4" />
                <span>Send link via WhatsApp</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NewCallLinkModal;
