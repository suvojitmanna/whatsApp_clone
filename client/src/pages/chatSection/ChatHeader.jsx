import React from "react";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa6";
import { FaLock, FaVideo, FaPhone } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { RxCross2 } from "react-icons/rx";
import { HiDotsVertical } from "react-icons/hi";
import formatTimestamp from "../../utils/formatTime";
import { WhatsAppDisappearingIcon } from "./MessageBuble";
import { ChevronUpIcon, ChevronDownIcon } from "../../components/common/Icons";

const ChatHeader = ({
  handleChatContextMenu,
  theme,
  selectedContact,
  setSelectedContact,
  setCurrentConversation,
  setShowContactInfo,
  online,
  openContactInfoWithTab,
  disappearingDuration,
  isTyping,
  lastSeen,
  searchIconRef,
  isSearchOpen,
  setIsSearchOpen,
  setIsChatSearchOpen,
  inputRef,
  searchTerm,
  setSearchTerm,
  resultCount,
  currentIndex,
  goPrev,
  goNext,
  handleVideoCall,
  handleAudioCall,
  headerMenuBtnRef,
  setHeaderMenuAnchor,
  setShowHeaderMenu,
  onCloseChat,
}) => {
  return (
    <div
      onContextMenu={handleChatContextMenu}
      className={`px-3 py-1.5 sm:px-3 sm:py-1.3 min-h-[58px] border-b shrink-0 z-30 ${theme === "dark"
        ? "bg-[#202c33] border-gray-700/60 text-white"
        : "bg-[#f0f2f5] border-gray-200 text-gray-900"
        } flex items-center`}
    >
      <button
        onClick={() => {
          if (onCloseChat) {
            onCloseChat();
          } else {
            setSelectedContact?.(null);
            setCurrentConversation?.(null);
          }
        }}
        className="mr-1 sm:mr-2 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
        title="Back to chats"
      >
        <FaArrowLeft className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
      </button>

      <div className="relative ml-1 sm:ml-2">
        <motion.img
          layoutId="profile-image"
          src={selectedContact?.profilePicture || "/default-avatar.png"}
          alt={selectedContact?.username}
          onClick={(e) => {
            e.stopPropagation();
            setShowContactInfo(true);
          }}
          title="View contact info"
          className="w-10 h-10 rounded-full cursor-pointer object-cover hover:opacity-90 active:scale-95 transition-all shadow-sm"
        />

        {online && (
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${theme === "dark" ? "border-[#202c33]" : "border-white"
              } bg-emerald-500 shadow-sm`}
            title="Online"
          ></span>
        )}

        {disappearingDuration && disappearingDuration !== "Off" && (
          <span
            className={`absolute bottom-0 ${online ? "left-0" : "right-0"} w-4 h-4 rounded-full border ${theme === "dark" ? "border-[#202c33] bg-[#111b21]" : "border-white bg-[#f0f2f5]"
              } flex items-center justify-center text-[#8696a0] shadow-sm`}
            title={`Disappearing messages: ${disappearingDuration}`}
          >
            <WhatsAppDisappearingIcon size={10} />
          </span>
        )}
      </div>

      <div
        className="ml-3 flex-grow cursor-pointer min-w-0 group"
        onClick={() => setShowContactInfo(true)}
        title="View contact info"
      >
        <div className="flex items-center gap-2">
          <h2
            className={`font-semibold text-start text-base sm:text-lg truncate group-hover:text-emerald-500 transition-colors ${theme === "dark" ? "text-white" : "text-gray-900"
              }`}
          >
            {selectedContact?.username}
          </h2>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openContactInfoWithTab("security");
            }}
            title="End-to-end encrypted chat. Click to verify."
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <FaLock className="w-2.5 h-2.5" />
            <span className="font-medium hidden sm:inline">Encrypted</span>
          </button>

          {disappearingDuration !== "Off" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openContactInfoWithTab("disappearing");
              }}
              title={`Disappearing messages: ${disappearingDuration}. Click to change.`}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <WhatsAppDisappearingIcon size={12} className="shrink-0" />
              <span className="font-medium">{disappearingDuration}</span>
            </button>
          )}
        </div>

        {isTyping ? (
          <div className="text-xs sm:text-sm text-emerald-500 font-medium">Typing...</div>
        ) : (
          <p
            className={`text-xs sm:text-sm truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
          >
            {online
              ? "Online"
              : lastSeen
                ? `Last seen ${formatTimestamp(lastSeen)}`
                : "Offline"}
          </p>
        )}
      </div>

      <div className="px-2 sm:px-4 py-2" ref={searchIconRef}>
        <div className="relative flex items-center justify-end">
          <button
            onClick={() => setIsSearchOpen(true)}
            title="Search in chat"
            className={`${isSearchOpen
              ? "opacity-0 pointer-events-none scale-90"
              : "opacity-100 scale-100"
              } group relative p-2 rounded-xl transition-all duration-300 bg-white/30 dark:bg-zinc-800/30 backdrop-blur-xl before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-60 before:pointer-events-none border border-white/30 dark:border-white/10 hover:border-green-400/40 shadow-[0_2px_15px_rgba(0,0,0,0.06)]
          hover:shadow-[0_8px_30px_rgba(0,255,150,0.15)] active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-600/50`}
          >
            <FiSearch className="h-4 w-4 text-zinc-700 dark:text-zinc-300 group-hover:text-green-500 group-hover:scale-110 transition-all duration-300" />
          </button>

          <div
            className={`absolute right-0 origin-right transition-all duration-300 ${isSearchOpen
              ? "w-60 sm:w-64 scale-100 opacity-100"
              : "w-0 scale-95 opacity-0 pointer-events-none"
              }`}
          >
            <div className="relative flex flex-col">
              <div className="relative w-full rounded-xl overflow-hidden group transition-all duration-300">
                <div
                  className={`absolute inset-0 rounded-xl pointer-events-none bg-gradient-to-br opacity-60 group-focus-within:opacity-80 transition-all duration-300 
                  ${theme === "dark"
                      ? "from-white/10 via-white/5 to-transparent"
                      : "from-white/60 via-white/30 to-transparent"
                    }`}
                />

                <input
                  autoFocus
                  ref={inputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-8 pr-8 py-1.5 rounded-xl outline-none text-xs relative z-10 backdrop-blur-xl border transition-all duration-300
                  ${theme === "dark"
                      ? "bg-zinc-800/70 text-white placeholder:text-gray-500 border-white/10 hover:border-emerald-500/50 focus:border-emerald-400 focus:bg-zinc-800/90"
                      : "bg-white/70 text-gray-900 placeholder:text-gray-400 border-gray-200/80 hover:border-emerald-500/50 focus:border-emerald-400 focus:bg-white/90"
                    } shadow-[0_4px_15px_rgba(0,0,0,0.05)] focus:shadow-[0_6px_20px_rgba(0,255,150,0.2)]`}
                />

                <FiSearch
                  className={`absolute left-2.5 top-1/2 -translate-y-1/2 z-20 h-3.5 w-3.5 transition-all duration-300 ${theme === "dark"
                    ? "text-gray-500 group-focus-within:text-emerald-400"
                    : "text-gray-400 group-focus-within:text-emerald-500"
                    }`}
                />

                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setIsChatSearchOpen(false);
                    setSearchTerm("");
                  }}
                  title="Close search"
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${theme === "dark"
                    ? "text-gray-400 hover:text-emerald-400 hover:bg-white/10"
                    : "text-gray-500 hover:text-emerald-500 hover:bg-black/5"
                    }`}
                >
                  <RxCross2 className="h-3.5 w-3.5 cursor-pointer" />
                </button>
              </div>

              {searchTerm.trim() !== "" && (
                <div className="flex items-center justify-end animate-in fade-in slide-in-from-top-1 duration-300 pt-2">
                  {resultCount > 0 ? (
                    <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                      <span className="px-3 text-[11px] font-semibold tracking-tight text-gray-600 dark:text-zinc-300 tabular-nums">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {currentIndex + 1}
                        </span>
                        <span className="mx-1 opacity-40">/</span>
                        <span className="opacity-80">{resultCount}</span>
                      </span>
                      <div className="h-4 w-px bg-gradient-to-b from-transparent via-gray-300/40 to-transparent dark:via-zinc-700/40" />

                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={goPrev}
                          aria-label="Previous"
                          title="Previous match"
                          className="group p-1.5 rounded-full text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-90 transition-all duration-200 cursor-pointer"
                        >
                          <ChevronUpIcon className="w-3 h-3 group-hover:-translate-y-[1px] transition-transform" />
                        </button>

                        <button
                          onClick={goNext}
                          aria-label="Next"
                          title="Next match"
                          className="group p-1.5 rounded-full text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-90 transition-all duration-200 cursor-pointer"
                        >
                          <ChevronDownIcon className="w-3 h-3 group-hover:translate-y-[1px] transition-transform" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 text-[11px] font-medium text-rose-500/90">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                      </span>
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          className="p-2 rounded-full border border-transparent hover:border-black/10 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
          onClick={handleVideoCall}
          title={online ? "Start video call" : "user is offline"}
        >
          <FaVideo className="h-5 w-5 text-emerald-500 hover:text-emerald-600" />
        </button>

        <button
          className="p-2 rounded-full border border-transparent hover:border-black/10 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
          onClick={handleAudioCall}
          title={online ? "Start audio call" : "user is offline"}
        >
          <FaPhone className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
        </button>

        <button
          ref={headerMenuBtnRef}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setHeaderMenuAnchor({
              x: rect.right,
              y: rect.bottom + 6,
              isContextMenu: false,
            });
            setShowHeaderMenu((prev) => !prev);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setHeaderMenuAnchor({
              x: e.clientX,
              y: e.clientY,
              isContextMenu: true,
            });
            setShowHeaderMenu(true);
          }}
          title="Menu"
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white border border-transparent hover:border-black/10 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
        >
          <HiDotsVertical className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(ChatHeader);
