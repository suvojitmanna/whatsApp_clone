import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import useThemeStore from "../../store/themeStore";
import { logoutUser } from "../../services/user.services";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import Layout from "../../components/layout/layout";
import {
  FaComment,
  FaMoon,
  FaQuestionCircle,
  FaSearch,
  FaSignInAlt,
  FaSun,
  FaUser,
  FaLock,
  FaKey,
  FaShieldAlt,
  FaArrowLeft,
  FaChevronRight,
  FaFingerprint,
} from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useLoginStore from "../../store/useLoginStore";
import {
  isChatLockConfigured,
  isBiometricEnabled,
  setBiometricEnabled,
  removeChatLock,
} from "../../utils/chatLockUtil";
import SetChatLockPinModal from "../../components/modals/SetChatLockPinModal";
import { toast } from "react-toastify";

const Settings = () => {
  const [isThemeDialogOpen, setIsDialogOpen] = useState(false);
  const [isChatLockModalOpen, setIsChatLockModalOpen] = useState(false);
  const [isSetPinModalOpen, setIsSetPinModalOpen] = useState(false);
  const [chatLockRevision, setChatLockRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef(null);

  const [currentView, setCurrentView] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "privacy" || params.get("tab") === "chatLock") {
        return "privacy";
      }
    } catch { }
    return "main";
  });

  const lockedChatIds = useChatStore((state) => state.lockedChatIds || []);
  const unlockAllChats = useChatStore((state) => state.unlockAllChats);

  useEffect(() => {
    const handleLockChanged = () => setChatLockRevision((r) => r + 1);
    window.addEventListener("whatsapp_chat_lock_changed", handleLockChanged);
    return () =>
      window.removeEventListener("whatsapp_chat_lock_changed", handleLockChanged);
  }, []);

  const isLockConfigured = isChatLockConfigured();
  const biometricEnabled = isBiometricEnabled();

  const menuItems = [
    { icon: FaUser, label: "Account", href: "/user-profile" },
    {
      icon: FaShieldAlt,
      label: "Privacy",
      action: "privacy",
      subtitle: "Chat Lock",
    },
    { icon: FaComment, label: "Chats", href: "/" },
    {
      icon: theme === "dark" ? FaMoon : FaSun,
      label: "Theme",
      action: "theme",
    },
    { icon: FaQuestionCircle, label: "Help", href: "/help" },
  ];

  const allSearchableItems = [
    ...menuItems,
    {
      icon: FaLock,
      label: "Chat Lock",
      action: "chatLock",
      subtitle: "Privacy > Chat Lock",
    },
  ];

  const filteredItems = searchTerm
    ? allSearchableItems.filter(
      (item) =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : menuItems;

  const toggleThemeDialoge = () => {
    setIsDialogOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logoutUser();
      useLoginStore.getState().resetLoginStates();
      useUserStore.getState().setUser(null);
      navigate("/user-login");
    } catch (error) {
      console.error("Failed to logout", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === "main") {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  const Loader = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm"
    >
      <div className="w-10 h-10 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin" />
    </motion.div>
  );

  return (
    <Layout
      isThemeDialogOpen={isThemeDialogOpen}
      toggleThemeDialoge={toggleThemeDialoge}
    >
      <div
        className={`h-full w-full flex flex-col border-r relative z-10 transition-all duration-300 ${theme === "dark"
          ? "bg-[#111b21] border-gray-700 shadow-[4px_0_15px_rgba(0,0,0,0.5)] text-white"
          : "bg-white border-gray-200 shadow-[4px_0_10px_rgba(0,0,0,0.1)] text-gray-900"
          }`}
      >
        {loading && <Loader />}

        <AnimatePresence mode="wait">
          {currentView === "main" ? (
            <motion.div
              key="main-view"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <div className="p-4 md:p-5 pb-2 shrink-0">
                <h1 className="text-xl md:text-2xl font-bold mb-3">Settings</h1>
                <div className="h-[2px] w-full bg-gradient-to-r from-[#00a884] via-blue-500 to-purple-500 rounded-full mb-4" />

                <div className="relative mb-4 group">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00a884] transition-colors" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search settings"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full py-2.5 pl-12 pr-10 outline-none transition-all duration-200 rounded-full border ${theme === "dark"
                      ? "bg-[#202c33] border-white/10 hover:border-emerald-500/50 focus:border-[#00a884] focus:bg-[#2a3942] text-white focus:ring-2 focus:ring-[#00a884]/30"
                      : "bg-gray-100 border-gray-200 hover:border-emerald-500/50 focus:border-[#00a884] focus:bg-gray-200 text-gray-900 focus:ring-2 focus:ring-[#00a884]/30"
                      }`}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-all cursor-pointer"
                      title="Clear search"
                    >
                      <RxCross2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <Link to="/user-profile" title="View Profile">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 ${theme === "dark"
                      ? "hover:bg-white/10 hover:shadow-lg"
                      : "hover:bg-gray-100 hover:shadow-sm"
                      }`}
                  >
                    <img
                      src={user?.profilePicture}
                      alt="profile"
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <h2 className="font-medium text-base md:text-lg truncate">
                        {user?.username}
                      </h2>
                      <p className="text-xs md:text-sm text-gray-400 truncate">
                        {user?.about || "Available"}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 min-h-0">
                {filteredItems.length === 0 && searchTerm ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 rounded-full blur-2xl bg-green-500/20"></div>
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="relative w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-500 shadow-lg animate-bounce"
                      >
                        <FaSearch className="text-white text-xl" />
                      </motion.div>
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-sm font-semibold text-gray-800 dark:text-white tracking-tight">
                        No results found
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[220px] leading-relaxed">
                        Try a different keyword or check spelling.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredItems.map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {item.action === "theme" ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={toggleThemeDialoge}
                          title="Change Theme"
                          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl mt-1 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer ${theme === "dark"
                            ? "hover:bg-gradient-to-r hover:from-[#00a884]/10 hover:to-blue-500/10"
                            : "hover:bg-gray-100"
                            }`}
                        >
                          <div className="text-gray-400 group-hover:text-emerald-500">
                            {theme === "dark" ? <FaMoon /> : <FaSun />}
                          </div>
                          <span className="text-sm md:text-base font-medium">
                            Theme
                          </span>
                          <span className="ml-auto text-xs md:text-sm text-gray-400 capitalize">
                            {theme}
                          </span>
                        </motion.button>
                      ) : item.action === "privacy" ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setCurrentView("privacy");
                            setSearchTerm("");
                          }}
                          title="Privacy Settings"
                          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl mt-1 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group ${theme === "dark"
                            ? "hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-blue-500/10"
                            : "hover:bg-gray-100"
                            }`}
                        >
                          <FaShieldAlt className="text-emerald-500 shrink-0 text-base group-hover:scale-110 transition-transform" />
                          <div className="flex flex-col text-left flex-1 min-w-0">
                            <span className="text-sm md:text-base font-medium leading-snug">
                              Privacy
                            </span>
                            <span className="text-xs text-gray-400 truncate mt-0.5">
                              {item.subtitle}
                            </span>
                          </div>
                          <div className="ml-auto flex items-center gap-2 shrink-0">
                            {isLockConfigured && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Protected
                              </span>
                            )}
                            <FaChevronRight className="text-gray-400 text-xs group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </motion.button>
                      ) : item.action === "chatLock" ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setCurrentView("privacy");
                            setIsChatLockModalOpen(true);
                            setSearchTerm("");
                          }}
                          title="Manage Chat Lock (in Privacy)"
                          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl mt-1 hover:bg-gradient-to-r hover:from-amber-500/10 hover:via-emerald-500/10 hover:to-blue-500/10 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-amber-500/20"
                        >
                          <FaLock className="text-amber-500 shrink-0" />
                          <div className="flex flex-col text-left flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm md:text-base font-medium">
                                Chat Lock
                              </span>
                              <span className="text-[10px] text-gray-400">
                                in Privacy
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400 truncate">
                              Lock & hide secret chats with a PIN
                            </span>
                          </div>
                          <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 shrink-0 bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            {isLockConfigured ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Protected</span>
                              </>
                            ) : (
                              <span>Setup PIN</span>
                            )}
                          </span>
                        </motion.button>
                      ) : (
                        <Link
                          to={item.href}
                          title={item.label}
                          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${theme === "dark"
                            ? "hover:bg-white/10 hover:shadow-md"
                            : "hover:bg-gray-100 hover:shadow-sm"
                            } hover:translate-x-1 active:scale-98`}
                        >
                          <item.icon className="opacity-70 group-hover:text-[#00a884] text-base" />
                          <span className="text-sm md:text-base font-medium">
                            {item.label}
                          </span>
                        </Link>
                      )}
                    </motion.div>
                  ))
                )}
              </div>

              <div
                className={`p-3 md:p-4 border-t mt-auto shrink-0 ${theme === "dark" ? "border-gray-700/60" : "border-gray-200"
                  }`}
              >
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  onClick={handleLogout}
                  disabled={loading}
                  title="Log out of account"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                    } ${theme === "dark"
                      ? "text-red-400 hover:bg-red-500/10"
                      : "text-red-600 hover:bg-red-50"
                    }`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaSignInAlt className="h-5 w-5 shrink-0 text-red-500" />
                  )}
                  <span className="text-sm md:text-base font-medium">
                    {loading ? "Logging out..." : "Logout"}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="privacy-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <div className="p-4 md:p-5 pb-2 shrink-0">
                <div className="flex items-center gap-3 mb-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => setCurrentView("main")}
                    className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-emerald-500 transition-colors cursor-pointer"
                    title="Back to Settings"
                  >
                    <FaArrowLeft className="w-4 h-4" />
                  </motion.button>
                  <h1 className="text-xl md:text-2xl font-bold">Privacy</h1>
                </div>
                <div className="h-[2px] w-full bg-gradient-to-r from-[#00a884] via-blue-500 to-purple-500 rounded-full mb-3" />
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={() => setIsChatLockModalOpen(true)}
                  title="Manage Chat Lock"
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md group ${theme === "dark"
                    ? "bg-[#202c33] hover:bg-[#233138] border-white/10 hover:border-amber-500/30"
                    : "bg-gray-50 hover:bg-emerald-50/40 border-gray-200 hover:border-emerald-500/40"
                    }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 text-xl shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                      <FaLock />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base leading-tight">
                          Chat Lock
                        </h3>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        Lock and hide secret chats on this device
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${isLockConfigured
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isLockConfigured
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-amber-500"
                          }`}
                      />
                      {isLockConfigured ? "Protected" : "Setup PIN"}
                    </span>
                    <FaChevronRight className="text-gray-400 text-xs group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </motion.button>
              </div>

              <div
                className={`p-3 md:p-4 border-t mt-auto shrink-0 ${theme === "dark" ? "border-gray-700/60" : "border-gray-200"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setCurrentView("main")}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  <FaArrowLeft className="w-3.5 h-3.5" /> Back to All Settings
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isChatLockModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[10003] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
            onClick={() => setIsChatLockModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-[400px] max-w-full rounded-2xl p-6 shadow-2xl border flex flex-col relative ${theme === "dark"
                ? "bg-[#233138] border-white/10 text-white shadow-black/80"
                : "bg-white border-gray-100 text-gray-900 shadow-xl"
                }`}
            >
              <button
                type="button"
                onClick={() => setIsChatLockModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full text-gray-400 hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <RxCross2 size={18} />
              </button>

              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 text-2xl shadow-inner">
                  <FaLock />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg leading-tight">Chat Lock</h3>
                  <p className="text-xs text-gray-400">
                    Keep secret chats hidden and secure
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border mb-4 text-left ${theme === "dark"
                  ? "bg-[#111b21] border-white/5"
                  : "bg-gray-50 border-gray-200"
                  }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Lock Status
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 ${isLockConfigured
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isLockConfigured ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                    />
                    {isLockConfigured ? "PIN Active" : "No PIN Set"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {isLockConfigured
                    ? "Your hidden Locked Chats folder is secured with a custom 4-digit PIN."
                    : "No PIN has been configured yet. Set up a 4-digit PIN before locking your chats."}
                </p>
                <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Locked Chats:</span>
                  <span className="font-semibold text-amber-500">
                    {lockedChatIds.length} chat
                    {lockedChatIds.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-left">
                <button
                  type="button"
                  onClick={() => setIsSetPinModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-black/5 dark:border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <FaKey className="text-emerald-500 text-sm" />
                    <div>
                      <div className="text-sm font-medium">
                        {isLockConfigured
                          ? "Change 4-Digit PIN"
                          : "Set Up 4-Digit PIN First"}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {isLockConfigured
                          ? "Update your current lock code"
                          : "Create your personal lock passcode"}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-500 font-semibold group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </button>

                <div className="flex items-center justify-between p-3 rounded-xl border border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-base">👆</span>
                    <div>
                      <div className="text-sm font-medium">
                        Touch ID Simulation
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Quick biometric unlock in modal
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={biometricEnabled}
                    onChange={(e) => setBiometricEnabled(e.target.checked)}
                    className="toggle toggle-success toggle-sm cursor-pointer"
                  />
                </div>
              </div>

              {isLockConfigured && (
                <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  {lockedChatIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Unlock all chats and return them to the main chat list?"
                          )
                        ) {
                          unlockAllChats();
                          toast.success("🔓 All chats unlocked!");
                        }
                      }}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-medium border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer"
                    >
                      Unlock All Chats
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remove Chat Lock PIN? Anyone will be able to view chats until a new PIN is set."
                        )
                      ) {
                        removeChatLock();
                        toast.info("Chat Lock PIN removed");
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                  >
                    Remove Lock
                  </button>
                </div>
              )}
            </motion.div>
          </div>,
          document.body
        )}

      <SetChatLockPinModal
        isOpen={isSetPinModalOpen}
        onClose={() => setIsSetPinModalOpen(false)}
        onSuccess={() => {
          setChatLockRevision((r) => r + 1);
        }}
      />
    </Layout>
  );
};

export default Settings;
