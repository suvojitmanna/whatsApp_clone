import React from "react";
import { FaArrowLeft, FaPen } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import { MdRefresh } from "react-icons/md";

const ContactInfoHeader = ({
  contactInfoTab,
  setContactInfoTab,
  previousContactInfoTab,
  setShowContactInfo,
  viewingMember,
  setViewingMember,
  selectedContact,
  isGroup,
  isMetaAi,
  theme,
  stopCamera,
  setScanError,
  handleResetTheme,
  handleResetBubbleColor,
}) => {
  if (contactInfoTab === "media") return null;

  const handleBack = () => {
    stopCamera?.();
    setScanError?.(null);
    if (contactInfoTab === "allThemes") {
      setContactInfoTab("chatTheme");
    } else if (contactInfoTab === "chatBubble") {
      setContactInfoTab("chatTheme");
    } else if (contactInfoTab === "wallpaper") {
      setContactInfoTab("chatTheme");
    } else if (contactInfoTab === "solidColour") {
      setContactInfoTab("wallpaper");
    } else if (contactInfoTab === "chatTheme") {
      if (previousContactInfoTab === "info") {
        setContactInfoTab("info");
      } else {
        setShowContactInfo(false);
      }
    } else if (contactInfoTab === "defaultTimer") {
      setContactInfoTab("disappearing");
    } else if (contactInfoTab === "disappearing") {
      if (previousContactInfoTab === "info") {
        setContactInfoTab("info");
      } else {
        setShowContactInfo(false);
      }
    } else if (contactInfoTab === "privacy") {
      setContactInfoTab("security");
    } else if (contactInfoTab === "memberChanges") {
      setContactInfoTab("info");
    } else {
      setContactInfoTab("info");
    }
  };

  const handleClose = () => {
    stopCamera?.();
    setScanError?.(null);
    setShowContactInfo(false);
  };

  return (
    <div
      className={`h-[60px] px-4 flex items-center justify-between border-b shrink-0 ${theme === "dark"
          ? "bg-[#111b21] border-[#222d34]"
          : "bg-[#f0f2f5] border-gray-200 text-gray-900"
        }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {contactInfoTab === "info" && viewingMember ? (
          <button
            type="button"
            onClick={() => setViewingMember(null)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer"
            title="Back to group info"
          >
            <FaArrowLeft size={18} />
          </button>
        ) : contactInfoTab === "info" ? (
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer"
            title="Close"
          >
            <RxCross2 size={22} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer"
            title="Back"
          >
            <FaArrowLeft size={18} />
          </button>
        )}

        {contactInfoTab === "security" ? (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-[16px] leading-tight truncate">
              Verify security code
            </span>
            <span className="text-[12px] text-[#8696a0] font-normal truncate">
              You, {viewingMember?.username || viewingMember?.name || selectedContact?.username || "Contact"}
            </span>
          </div>
        ) : (
          <h2 className="font-semibold text-[17px] tracking-tight truncate">
            {contactInfoTab === "privacy"
              ? "Your chats and calls are private"
              : contactInfoTab === "media"
                ? "Media, links and docs"
                : contactInfoTab === "disappearing"
                  ? "Disappearing messages"
                  : contactInfoTab === "defaultTimer"
                    ? "Default message timer"
                    : contactInfoTab === "chatTheme"
                      ? "Chat theme"
                      : contactInfoTab === "chatBubble"
                        ? "Chat bubble"
                        : contactInfoTab === "allThemes"
                          ? "Themes"
                          : contactInfoTab === "wallpaper"
                            ? "Wallpaper"
                            : contactInfoTab === "solidColour"
                              ? "Solid colour"
                              : contactInfoTab === "starred"
                                ? "Starred messages"
                                : contactInfoTab === "kept"
                                  ? "Kept messages"
                                  : contactInfoTab === "advancedPrivacy"
                                    ? "Advanced"
                                    : contactInfoTab === "lists"
                                      ? "Add to list"
                                      : contactInfoTab === "groupPermissions"
                                        ? "Group permissions"
                                        : contactInfoTab === "memberChanges"
                                          ? "Member changes"
                                          : isMetaAi
                                            ? "Meta AI info"
                                            : isGroup
                                              ? (viewingMember ? "Contact info" : "Group info")
                                              : "Contact info"}
          </h2>
        )}
      </div>

      {contactInfoTab === "info" && viewingMember ? (
        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer flex items-center justify-center"
          title="Close"
        >
          <RxCross2 size={22} />
        </button>
      ) : contactInfoTab === "info" && !isMetaAi && !isGroup ? (
        <button
          type="button"
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer flex items-center justify-center"
          title="Edit contact"
        >
          <FaPen className="h-4 w-4" />
        </button>
      ) : contactInfoTab === "info" && isGroup ? null : contactInfoTab === "info" && isMetaAi ? (
        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer flex items-center justify-center"
          title="Close"
        >
          <RxCross2 size={22} />
        </button>
      ) : contactInfoTab === "chatTheme" || contactInfoTab === "wallpaper" ? (
        <button
          type="button"
          onClick={handleResetTheme}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer"
          title={contactInfoTab === "wallpaper" ? "Reset wallpaper" : "Reset theme"}
        >
          <MdRefresh size={22} />
        </button>
      ) : contactInfoTab === "chatBubble" ? (
        <button
          type="button"
          onClick={handleResetBubbleColor}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer"
          title="Reset chat bubble"
        >
          <MdRefresh size={22} />
        </button>
      ) : contactInfoTab === "allThemes" || contactInfoTab === "solidColour" ? null : (
        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer"
          title="Close"
        >
          <RxCross2 size={22} />
        </button>
      )}
    </div>
  );
};

export default ContactInfoHeader;
