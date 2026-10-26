import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaLock, FaPhone, FaCamera, FaMapMarkerAlt, FaCircle } from "react-icons/fa";
import { MdOutlinePhotoSizeSelectActual } from "react-icons/md";
import { BsStars } from "react-icons/bs";
import { LuUpload } from "react-icons/lu";
import {
  EndToEndEncryptionIllustration,
  AdvancedChatPrivacyIllustration,
} from "../common/Icons";

const ContactInfoPrivacyTab = ({
  contactInfoTab,
  setContactInfoTab,
  chatId,
  theme,
}) => {
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const [advancedPrivacy, setAdvancedPrivacy] = useState({
    enabled: false,
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
        const item = all[chatId];
        const isEnabled = Boolean(
          item.enabled ?? (item.protectIp || item.disableLinkPreviews)
        );
        setAdvancedPrivacy({
          enabled: isEnabled,
          protectIp: Boolean(item.protectIp ?? isEnabled),
          disableLinkPreviews: Boolean(item.disableLinkPreviews ?? isEnabled),
        });
      } else {
        setAdvancedPrivacy({
          enabled: false,
          protectIp: false,
          disableLinkPreviews: false,
        });
      }
    } catch { }
  }, [chatId]);

  const handleToggleAdvancedPrivacy = (key = "enabled") => {
    if (!chatId) return;
    const isNowEnabled = !advancedPrivacy[key];
    const updated = {
      ...advancedPrivacy,
      [key]: isNowEnabled,
      ...(key === "enabled"
        ? {
          enabled: isNowEnabled,
          protectIp: isNowEnabled,
          disableLinkPreviews: isNowEnabled,
        }
        : {}),
    };
    setAdvancedPrivacy(updated);
    try {
      const all = JSON.parse(
        localStorage.getItem("whatsapp_advanced_privacy") || "{}"
      );
      all[chatId] = updated;
      localStorage.setItem("whatsapp_advanced_privacy", JSON.stringify(all));
      window.dispatchEvent(new Event("whatsapp_advanced_privacy_updated"));
    } catch (e) {
      console.log(e)
    }
    toast.success(updated.enabled ? "Advanced chat privacy turned on" : "Advanced chat privacy turned off");
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
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
                }`}
            >
              <FaLock size={14} className="text-[#00a884]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className={`text-[14px] font-medium leading-tight ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Text and voice messages
              </h4>
              <p className="text-[12px] text-[#8696a0]">End-to-end encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
                }`}
            >
              <FaPhone size={13} className="text-[#00a884]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className={`text-[14px] font-medium leading-tight ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Audio and video calls
              </h4>
              <p className="text-[12px] text-[#8696a0]">End-to-end encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
                }`}
            >
              <FaCamera size={13} className="text-[#00a884]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className={`text-[14px] font-medium leading-tight ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Photos, videos and documents
              </h4>
              <p className="text-[12px] text-[#8696a0]">End-to-end encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
                }`}
            >
              <FaMapMarkerAlt size={14} className="text-[#00a884]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className={`text-[14px] font-medium leading-tight ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Location sharing
              </h4>
              <p className="text-[12px] text-[#8696a0]">End-to-end encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
                }`}
            >
              <FaCircle size={13} className="text-[#00a884]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className={`text-[14px] font-medium leading-tight ${isDark ? "text-white" : "text-gray-900"
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
            className={`px-5 py-2 rounded-full font-medium text-[13px] cursor-pointer transition-all ${isDark
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
        className="flex flex-col flex-1 overflow-y-auto scrollbar-hide px-6 py-5 select-none"
      >
        <div className="flex justify-center pt-2 select-none">
          <AdvancedChatPrivacyIllustration
            isDark={isDark}
            width={104}
            height={72}
          />
        </div>

        <h3
          className={`text-[17px] sm:text-[18px] font-semibold leading-snug m-3 text-center sm:text-left ${isDark ? "text-[#e9edef]" : "text-gray-900"
            }`}
        >
          Limit how messages and media from this chat can be shared outside of WhatsApp
        </h3>
        <p className={`text-[13px] leading-relaxed ${isDark ? "text-[#8696a0]" : "text-gray-900"} ml-5 mt-2`}>
          Your personal messages are protected with end-to-end encryption even if you don&apos;t turn on advanced chat privacy. No one outside of the chat, not even WhatsApp or Meta, can read, listen to, or share them.{" "}
          <button
            type="button"
            onClick={() => navigate("/help?topic=privacy-lock")}
            className="text-[#00a884] hover:text-[#06cf9c] hover:underline font-semibold inline cursor-pointer"
          >
            Learn more
          </button>
        </p>
        <p className={`text-[13px] ${isDark ? "text-[#8696a0]" : "text-gray-900"} ml-5 mt-2 mb-3 font-normal`}>
          If you turn this on, people in this chat:
        </p>
        <div className="space-y-4 ml-5 mb-6">
          <div className="flex items-start gap-4">
            <MdOutlinePhotoSizeSelectActual
              size={20}
              className="text-[#8696a0] shrink-0 mt-0.5"
            />
            <p
              className={`text-[13.5px] leading-snug ${isDark ? "text-[#d1d7db]" : "text-gray-800"
                }`}
            >
              Can&apos;t save media to their device gallery automatically
            </p>
          </div>

          <div className="flex items-start gap-4">
            <BsStars
              size={19}
              className="text-[#8696a0] shrink-0 mt-0.5"
            />
            <p
              className={`text-[13.5px] leading-snug ${isDark ? "text-[#d1d7db]" : "text-gray-800"
                }`}
            >
              Can&apos;t use AI features like mentioning @Meta AI or summarising unread messages
            </p>
          </div>

          <div className="flex items-start gap-4">
            <LuUpload
              size={19}
              className="text-[#8696a0] shrink-0 mt-0.5"
            />
            <p
              className={`text-[13.5px] leading-snug ${isDark ? "text-[#d1d7db]" : "text-gray-800"
                }`}
            >
              Can&apos;t export the chat
            </p>
          </div>
        </div>

        <div
          className={`h-px w-full my-5 ${isDark ? "bg-white/10" : "bg-gray-200"
            }`}
        />

        <div
          onClick={() => handleToggleAdvancedPrivacy("enabled")}
          className={`flex items-center justify-between p-3 -mx-2 rounded-xl cursor-pointer transition-colors ${isDark ? "hover:bg-white/[0.04]" : "hover:bg-gray-100/70"
            }`}
        >
          <span
            className={`text-[15px] font-medium ${isDark ? "text-[#e9edef]" : "text-gray-900"
              }`}
          >
            Advanced chat privacy
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={advancedPrivacy.enabled}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleAdvancedPrivacy("enabled");
            }}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${advancedPrivacy.enabled ? "bg-[#00a884]" : "bg-[#374248]"
              }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200 ${advancedPrivacy.enabled
                ? "translate-x-5 bg-white"
                : "translate-x-0 bg-[#8696a0]"
                }`}
            />
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default ContactInfoPrivacyTab;
