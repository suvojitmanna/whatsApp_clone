import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { DisappearingMessagesIllustration } from "../common/Icons";

const ContactInfoDisappearingTab = ({
  contactInfoTab,
  setContactInfoTab,
  chatId,
  disappearingDurations = {},
  setDisappearingDuration,
  defaultMessageTimer = "Off",
  setDefaultMessageTimer,
  theme,
}) => {
  const navigate = useNavigate();
  const isDark = theme === "dark";
  const disappearingDuration = (chatId && disappearingDurations?.[chatId]) || "Off";

  const handleSelectDisappearing = (duration) => {
    if (!chatId) return;
    setDisappearingDuration(chatId, duration);
    toast.success(
      duration === "Off"
        ? "Disappearing messages turned off"
        : `Disappearing messages set to ${duration}`
    );
  };

  const handleSelectDefaultTimer = (duration) => {
    setDefaultMessageTimer(duration);
    toast.success(
      duration === "Off"
        ? "Default timer turned off"
        : `Default timer set to ${duration}`
    );
  };

  if (contactInfoTab === "disappearing") {
    return (
      <motion.div
        key="tab-disappearing"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col py-2 overflow-y-auto flex-1 scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
      >
        <div className="flex justify-center items-center py-6">
          <DisappearingMessagesIllustration width={200} height={125} />
        </div>

        <div className="px-6 mb-6">
          <h3
            className={`text-[15px] font-semibold mb-2.5 ${isDark ? "text-[#53bdeb]" : "text-[#027eb5]"
              }`}
          >
            Make messages in this chat disappear
          </h3>
          <p className="text-[13.5px] leading-relaxed text-[#8696a0]">
            For more privacy and storage, all new messages will disappear
            from this chat for everyone after the selected duration, except
            when kept. Anyone in the chat can change this setting.{" "}
            <span
              onClick={() => navigate("/help?topic=privacy-lock")}
              className="text-[#00a884] hover:underline cursor-pointer font-medium"
            >
              Learn more
            </span>
          </p>
        </div>

        <div className="px-6 space-y-4 mb-8">
          {["Off", "24 hours", "7 days", "90 days"].map((option) => {
            const isSelected = disappearingDuration === option;
            return (
              <label
                key={option}
                onClick={() => handleSelectDisappearing(option)}
                className="flex items-center gap-4 cursor-pointer select-none group py-1"
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                      ? "border-[#00a884]"
                      : isDark
                        ? "border-[#8696a0]/70 group-hover:border-white"
                        : "border-gray-400 group-hover:border-gray-600"
                      }`}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00a884]" />
                    )}
                  </div>
                </div>
                <span
                  className={`text-[15px] transition-colors ${isSelected
                    ? isDark
                      ? "text-white font-medium"
                      : "text-gray-900 font-medium"
                    : isDark
                      ? "text-[#d1d7db] group-hover:text-white"
                      : "text-gray-700 group-hover:text-gray-900"
                    }`}
                >
                  {option}
                </span>
              </label>
            );
          })}
        </div>

        <div className="px-6 pt-3 pb-6 text-[13.5px] text-[#8696a0]">
          Update your{" "}
          <button
            type="button"
            onClick={() => setContactInfoTab("defaultTimer")}
            className="text-[#00a884] hover:underline font-medium cursor-pointer"
          >
            default message timer
          </button>{" "}
          in Settings
        </div>
      </motion.div>
    );
  }

  if (contactInfoTab === "defaultTimer") {
    return (
      <motion.div
        key="tab-defaultTimer"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col py-4 px-6 overflow-y-auto flex-1 scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
      >
        <h3 className="text-[14.5px] font-semibold text-[#00a884] mb-6">
          Start new chats with disappearing messages
        </h3>

        <div className="space-y-4 mb-8">
          {["Off", "24 hours", "7 days", "90 days"].map((option) => {
            const isSelected = defaultMessageTimer === option;
            return (
              <label
                key={option}
                onClick={() => handleSelectDefaultTimer(option)}
                className="flex items-center gap-4 cursor-pointer select-none group py-1"
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                      ? "border-[#00a884]"
                      : isDark
                        ? "border-[#8696a0]/70 group-hover:border-white"
                        : "border-gray-400 group-hover:border-gray-600"
                      }`}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00a884]" />
                    )}
                  </div>
                </div>
                <span
                  className={`text-[15px] transition-colors ${isSelected
                    ? isDark
                      ? "text-white font-medium"
                      : "text-gray-900 font-medium"
                    : isDark
                      ? "text-[#d1d7db] group-hover:text-white"
                      : "text-gray-700 group-hover:text-gray-900"
                    }`}
                >
                  {option}
                </span>
              </label>
            );
          })}
        </div>

        <p className="text-[13px] leading-relaxed text-[#8696a0] mb-3">
          When turned on, all new individual chats will start with
          disappearing messages set to the duration you select. This
          setting will not affect your existing chats.
        </p>
        <div>
          <button
            type="button"
            onClick={() => navigate("/help?topic=privacy-lock")}
            className="text-[13px] text-[#00a884] hover:underline font-medium cursor-pointer"
          >
            Learn more
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default ContactInfoDisappearingTab;
