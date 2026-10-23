import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaLock, FaPhone, FaCamera, FaMapMarkerAlt, FaCircle } from "react-icons/fa";
import { EndToEndEncryptionIllustration } from "../common/Icons";

const ContactInfoPrivacyTab = ({
  contactInfoTab,
  setContactInfoTab,
  chatId,
  theme,
}) => {
  const isDark = theme === "dark";

  const [advancedPrivacy, setAdvancedPrivacy] = useState({
    protectIp: false,
    disableLinkPreviews: false,
  });

  useEffect(() => {
    if (!chatId) return;
    try {
      const all = JSON.parse(
        localStorage.getItem("whatsapp_advanced_privacy") || "{}"
      );
      if (all[chatId]) {
        setAdvancedPrivacy(all[chatId]);
      } else {
        setAdvancedPrivacy({
          protectIp: false,
          disableLinkPreviews: false,
        });
      }
    } catch {}
  }, [chatId]);

  const handleToggleAdvancedPrivacy = (key) => {
    if (!chatId) return;
    const updated = {
      ...advancedPrivacy,
      [key]: !advancedPrivacy[key],
    };
    setAdvancedPrivacy(updated);
    try {
      const all = JSON.parse(
        localStorage.getItem("whatsapp_advanced_privacy") || "{}"
      );
      all[chatId] = updated;
      localStorage.setItem("whatsapp_advanced_privacy", JSON.stringify(all));
    } catch {}
    toast.success(
      key === "protectIp"
        ? updated.protectIp
          ? "Protect IP address in calls enabled"
          : "Protect IP address in calls disabled"
        : updated.disableLinkPreviews
          ? "Link previews disabled"
          : "Link previews enabled"
    );
  };

  if (contactInfoTab === "privacy") {
    return (
      <motion.div
        key="tab-privacy"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col items-center py-5 px-5 overflow-y-auto flex-1 scrollbar-hide select-none"
      >
        <div className="flex justify-center mb-5 select-none">
          <EndToEndEncryptionIllustration
            isDark={isDark}
            width={150}
            height={115}
          />
        </div>

        <p className="text-center text-[13px] leading-relaxed text-[#8696a0] px-2 mb-6 max-w-sm">
          Messages and calls are end-to-end encrypted so only you and the
          person you're communicating with can read or listen to them. Not
          even WhatsApp can.
        </p>
        <div className="w-full space-y-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
              }`}
            >
              <FaLock size={14} className="text-[#00a884]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className={`text-[14px] font-medium leading-tight ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Text and voice messages
              </h4>
              <p className="text-[12px] text-[#8696a0]">End-to-end encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
              }`}
            >
              <FaPhone size={13} className="text-[#00a884]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className={`text-[14px] font-medium leading-tight ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Audio and video calls
              </h4>
              <p className="text-[12px] text-[#8696a0]">End-to-end encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
              }`}
            >
              <FaCamera size={13} className="text-[#00a884]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className={`text-[14px] font-medium leading-tight ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Photos, videos and documents
              </h4>
              <p className="text-[12px] text-[#8696a0]">End-to-end encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
              }`}
            >
              <FaMapMarkerAlt size={14} className="text-[#00a884]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className={`text-[14px] font-medium leading-tight ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Location sharing
              </h4>
              <p className="text-[12px] text-[#8696a0]">End-to-end encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
              }`}
            >
              <FaCircle size={13} className="text-[#00a884]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className={`text-[14px] font-medium leading-tight ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Status updates
              </h4>
              <p className="text-[12px] text-[#8696a0]">End-to-end encrypted</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 w-full pb-4">
          <button
            type="button"
            onClick={() => setContactInfoTab("security")}
            className="px-5 py-2 rounded-full bg-[#00a884] hover:bg-[#06cf9c] active:scale-95 text-[#111b21] font-semibold text-[13px] cursor-pointer transition-all shadow-md"
          >
            Verify security code
          </button>
          <button
            type="button"
            onClick={() => setContactInfoTab("info")}
            className={`px-5 py-2 rounded-full font-medium text-[13px] cursor-pointer transition-all ${
              isDark
                ? "bg-white/10 hover:bg-white/15 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            OK
          </button>
        </div>
      </motion.div>
    );
  }

  if (contactInfoTab === "advancedPrivacy") {
    return (
      <motion.div
        key="tab-advancedPrivacy"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col flex-1 overflow-y-auto scrollbar-hide p-5 select-none"
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className={`text-[15px] font-semibold mb-1.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                Protect IP address in calls
              </h4>
              <p className="text-[13px] text-[#8696a0] leading-relaxed">
                To make it harder for people to infer your location, calls from this device will be securely relayed through WhatsApp servers. This will slightly reduce call quality.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={advancedPrivacy.protectIp}
              onClick={() => handleToggleAdvancedPrivacy("protectIp")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
                advancedPrivacy.protectIp ? "bg-[#00a884]" : "bg-[#374248]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200 ${
                  advancedPrivacy.protectIp
                    ? "translate-x-5 bg-[#111b21]"
                    : "translate-x-0 bg-[#8696a0]"
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-white/5 w-full" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className={`text-[15px] font-semibold mb-1.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                Disable link previews
              </h4>
              <p className="text-[13px] text-[#8696a0] leading-relaxed">
                To protect your IP address from being inferred by third-party websites, previews for links you send in this chat won&apos;t be generated.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={advancedPrivacy.disableLinkPreviews}
              onClick={() => handleToggleAdvancedPrivacy("disableLinkPreviews")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
                advancedPrivacy.disableLinkPreviews ? "bg-[#00a884]" : "bg-[#374248]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200 ${
                  advancedPrivacy.disableLinkPreviews
                    ? "translate-x-5 bg-[#111b21]"
                    : "translate-x-0 bg-[#8696a0]"
                }`}
              />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default ContactInfoPrivacyTab;
