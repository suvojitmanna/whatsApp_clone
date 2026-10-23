import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import useThemeStore from "../../store/themeStore";
import { logoutUser } from "../../services/user.services";
import useUserStore from "../../store/useUserStore";
import Layout from "../../components/layout/layout";
import {
  FaComment,
  FaMoon,
  FaQuestionCircle,
  FaSearch,
  FaSignInAlt,
  FaSun,
  FaUser,
} from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { Link, useNavigate } from "react-router-dom";
import useLoginStore from "../../store/useLoginStore";

const Settings = () => {
  const [isThemeDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef(null)

  const menuItems = [
    { icon: FaUser, label: "Account", href: "/user-profile" },
    { icon: FaComment, label: "Chats", href: "/" },
    { icon: FaQuestionCircle, label: "Help", href: "/help" },
    {
      icon: theme === "dark" ? FaMoon : FaSun,
      label: "Theme",
      action: "theme",
    },
  ];
  const filteredItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );
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
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const Loader = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-40 flex items-center justify-center 
      bg-black/20 backdrop-blur-sm"
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
        className={`h-full w-full flex flex-col border-r relative z-10 transition-all duration-300 ${
          theme === "dark"
            ? "bg-[#111b21] border-gray-700 shadow-[4px_0_15px_rgba(0,0,0,0.5)] text-white"
            : "bg-white border-gray-200 shadow-[4px_0_10px_rgba(0,0,0,0.1)] text-gray-900"
        }`}
      >
        {loading && <Loader />}

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
              className={`w-full py-2.5 pl-12 pr-10 outline-none transition-all duration-200 rounded-full border ${
                theme === "dark"
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
              className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                theme === "dark"
                  ? "hover:bg-white/10 hover:shadow-lg"
                  : "hover:bg-gray-100 hover:shadow-sm"
              }`}
            >
              <img
                src={user?.profilePicture}
                alt="profile"
                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
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
                transition={{ delay: i * 0.08 }}
              >
                {item.action === "theme" ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggleThemeDialoge}
                    title="Change Theme"
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl mt-1 bg-gradient-to-r from-[#00a884]/10 to-blue-500/10 hover:from-[#00a884]/20 hover:to-blue-500/20 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                  >
                    {theme === "dark" ? <FaMoon /> : <FaSun />}
                    <span className="text-sm md:text-base">Theme</span>
                    <span className="ml-auto text-xs md:text-sm text-gray-400 capitalize">
                      {theme}
                    </span>
                  </motion.button>
                ) : (
                  <Link
                    to={item.href}
                    title={item.label}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                      theme === "dark"
                        ? "hover:bg-white/10 hover:shadow-md"
                        : "hover:bg-gray-100 hover:shadow-sm"
                    } hover:translate-x-1 active:scale-98`}
                  >
                    <item.icon className="opacity-70 group-hover:text-[#00a884]" />
                    <span className="text-sm md:text-base">
                      {item.label}
                    </span>
                  </Link>
                )}
              </motion.div>
            ))
          )}
        </div>

        <div
          className={`p-3 md:p-4 border-t mt-auto shrink-0 ${
            theme === "dark" ? "border-gray-700/60" : "border-gray-200"
          }`}
        >
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            onClick={handleLogout}
            disabled={loading}
            title="Log out of account"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            } ${
              theme === "dark"
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
      </div>
    </Layout>
  );
};

export default Settings;
