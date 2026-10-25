import React, { useEffect, useRef, useState } from "react";
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
      if (params.get("tab") === "chatLock") {
        return "chatLock";
      }
      if (params.get("tab") === "privacy") {
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
      <div className={`h-full w-full flex flex-col border-r relative z-10 transition-all duration-300 ${theme === "dark"
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
                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 border border-transparent ${theme === "dark"
                      ? "hover:bg-white/10 hover:border-white/10 hover:shadow-lg"
                      : "hover:bg-gray-100 hover:border-gray-200 hover:shadow-sm"
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
                          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl mt-1 transition-all duration-300 hover:shadow-md cursor-pointer group border border-transparent ${theme === "dark"
                            ? "hover:bg-gradient-to-r hover:from-[#00a884]/10 hover:to-blue-500/10 hover:border-emerald-500/20"
                            : "hover:bg-gray-100 hover:border-gray-200"
                            }`}
                        >
                          <div className="text-gray-400 group-hover:text-emerald-500 transition-colors">
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
                          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl mt-1 transition-all duration-300 hover:shadow-md cursor-pointer group border border-transparent ${theme === "dark"
                            ? "hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-blue-500/10 hover:border-emerald-500/20"
                            : "hover:bg-gray-100 hover:border-gray-200"
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
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border border-transparent group-hover:border-emerald-500/30 group-hover:bg-emerald-500/15 text-emerald-400 flex items-center gap-1 transition-all">
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
                            setCurrentView("chatLock");
                            setSearchTerm("");
                          }}
                          title="Manage Chat Lock (in Privacy)"
                          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl mt-1 transition-all duration-300 hover:shadow-md cursor-pointer group border border-transparent ${theme === "dark"
                            ? "hover:bg-gradient-to-r hover:from-amber-500/10 hover:via-emerald-500/10 hover:to-blue-500/10 hover:border-amber-500/20"
                            : "hover:bg-amber-50/50 hover:border-amber-500/30"
                            }`}
                        >
                          <FaLock className="text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
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
                          <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 shrink-0 transition-all border border-transparent group-hover:border-amber-500/30 group-hover:bg-amber-500/15 text-amber-500">
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
                          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group border border-transparent ${theme === "dark"
                            ? "hover:bg-white/10 hover:border-white/10 hover:shadow-md"
                            : "hover:bg-gray-100 hover:border-gray-200 hover:shadow-sm"
                            } hover:translate-x-1 active:scale-98`}
                        >
                          <item.icon className="opacity-70 group-hover:text-[#00a884] text-base transition-colors" />
                          <span className="text-sm md:text-base font-medium">
                            {item.label}
                          </span>
                        </Link>
                      )}
                    </motion.div>
                  ))
                )}
              </div>

              <div className={`p-3 md:p-4 border-t mt-auto shrink-0 ${theme === "dark" ? "border-gray-700/60" : "border-gray-200"
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
          ) : currentView === "privacy" ? (
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
                  onClick={() => setCurrentView("chatLock")}
                  title="Manage Chat Lock"
                  className={`w-full flex items-center justify-between p-3.5 md:p-4 rounded-2xl transition-all duration-200 cursor-pointer hover:shadow-md group border border-transparent ${theme === "dark"
                    ? "hover:bg-[#233138] hover:border-amber-500/30 text-white"
                    : "hover:bg-emerald-50/30 hover:border-emerald-500/30 text-gray-900"
                    }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-3 text-left">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-emerald-500 text-lg md:text-xl shrink-0 group-hover:scale-105 transition-transform">
                      <FaLock />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base leading-snug">
                        Chat Lock
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        Lock and hide secret chats on this device
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[11px] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 transition-all border border-transparent group-hover:border-emerald-500/30 group-hover:bg-emerald-500/15 text-emerald-400"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isLockConfigured
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-emerald-500"
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
          ) : (
            <motion.div
              key="chatlock-view"
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
                    onClick={() => setCurrentView("privacy")}
                    className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-emerald-500 transition-colors cursor-pointer"
                    title="Back to Privacy"
                  >
                    <FaArrowLeft className="w-4 h-4" />
                  </motion.button>
                  <h1 className="text-xl md:text-2xl font-bold">Chat Lock</h1>
                </div>
                <div className="h-[2px] w-full bg-gradient-to-r from-amber-500 via-[#00a884] to-blue-500 rounded-full mb-3" />
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 min-h-0">
                <div className="space-y-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">
                    Passcode & Security
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsSetPinModalOpen(true)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer group text-left border border-transparent ${theme === "dark"
                      ? "hover:bg-[#233138] hover:border-emerald-500/40 text-white"
                      : "hover:bg-emerald-500/10 hover:border-emerald-500/40 text-gray-900"
                      }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-sm shrink-0">
                        <FaKey />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium leading-snug">
                          {isLockConfigured
                            ? "Change 4-Digit PIN"
                            : "Set Up 4-Digit PIN First"}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {isLockConfigured
                            ? "Update your current lock code"
                            : "Create your personal lock passcode"}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-500 font-semibold group-hover:translate-x-0.5 transition-transform shrink-0">
                      →
                    </span>
                  </button>

                  <div
                    className={`flex items-center justify-between p-3.5 rounded-2xl transition-all border border-transparent ${theme === "dark"
                      ? "hover:bg-[#202c33] hover:border-white/10"
                      : "hover:bg-gray-100 hover:border-gray-200"
                      }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-3">
                      <div className="w-9 h-9 rounded-xl hover:bg-blue-500/15 text-blue-400 flex items-center justify-center text-base shrink-0">
                        <FaFingerprint />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="text-sm font-medium leading-snug">
                          Touch ID Simulation
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                          Quick biometric unlock in modal
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={biometricEnabled}
                      onChange={(e) => setBiometricEnabled(e.target.checked)}
                      className="toggle toggle-success toggle-sm cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                {isLockConfigured && (
                  <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">
                      Danger Zone
                    </span>

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
                        className="w-full py-2.5 px-3.5 rounded-xl text-xs font-medium border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer text-left flex items-center justify-between"
                      >
                        <span>Unlock All Locked Chats</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 font-bold">
                          {lockedChatIds.length}
                        </span>
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
                      className="w-full py-2.5 px-3.5 rounded-xl text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer text-center"
                    >
                      Remove Lock PIN
                    </button>
                  </div>
                )}
              </div>

              <div
                className={`p-3 md:p-4 border-t mt-auto shrink-0 ${theme === "dark" ? "border-gray-700/60" : "border-gray-200"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setCurrentView("privacy")}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  <FaArrowLeft className="w-3.5 h-3.5" /> Back to Privacy
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
