import React, { useState } from "react";
import { motion } from "framer-motion";
import useThemeStore from "../../store/themeStore";
import { logoutUser } from "../../services/user.services";
import useUserStore from "../../store/useUserStore";
import Layout from "../../components/layout";
import {
  FaComment,
  FaMoon,
  FaQuestionCircle,
  FaSearch,
  FaSignInAlt,
  FaSun,
  FaUser,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import useLoginStore from "../../store/useLoginStore";

const Settings = () => {
  const [isThemeDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const menuItems = [
    { icon: FaUser, label: "Account", href: "/user-profile" },
    { icon: FaComment, label: "Chats", href: "/" },
    { icon: FaQuestionCircle, label: "Help", href: "/help" },
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

  // Shadow Loader (chat style)
  const Loader = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-40 flex items-center justify-center 
      bg-black/20 backdrop-blur-sm rounded-2xl"
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
        className={`flex flex-col md:flex-row min-h-screen ${
          theme === "dark"
            ? "bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] text-white"
            : "bg-gray-100 text-black"
        }`}
      >
        {/* IMPORTANT: relative added */}
        <div className="relative max-w-[1400px] mx-auto w-full flex flex-col md:flex-row my-2 md:my-4 rounded-2xl overflow-hidden shadow-2xl">
          {/* Loader inside card */}
          {loading && <Loader />}

          {/* SIDEBAR */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className={`w-full md:w-[400px] flex flex-col backdrop-blur-xl border-r ${
              theme === "dark"
                ? "bg-white/5 border-white/10"
                : "bg-white border-gray-200"
            }`}
          >
            {/* HEADER */}
            <div className="p-4 md:p-6 pb-2">
              <h1 className="text-xl md:text-2xl font-bold mb-3">Settings</h1>

              <div className="h-[2px] w-full bg-gradient-to-r from-[#00a884] via-blue-500 to-purple-500 rounded-full mb-4" />

              {/* SEARCH */}
              <div className="relative mb-6 group">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00a884] transition-colors" />

                <input
                  type="text"
                  placeholder="Search settings"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full py-2.5 pl-12 pr-4 outline-none transition-all rounded-full ${
                    theme === "dark"
                      ? "bg-[#202c33] focus:bg-[#2a3942] text-white"
                      : "bg-gray-100 focus:bg-gray-200 text-gray-900"
                  }`}
                />
              </div>

              {/* PROFILE */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-4 p-3 rounded-xl cursor-pointer 
                hover:bg-white/10 hover:shadow-lg transition-all duration-300"
              >
                <img
                  src={user?.profilePicture}
                  alt="profile"
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h2 className="font-medium text-base md:text-lg">
                    {user?.username}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-400">
                    {user?.about || "Available"}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* MENU */}
            <div className="flex flex-col flex-1 px-2 min-h-0">
              <div className="space-y-1">
                {filteredItems.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link
                      to={item.href}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl 
                      hover:bg-white/10 hover:shadow-md hover:translate-x-1 
                      transition-all duration-300 group"
                    >
                      <item.icon className="opacity-70 group-hover:text-[#00a884] transition" />
                      <span className="text-sm md:text-base">{item.label}</span>
                    </Link>
                  </motion.div>
                ))}

                {/* THEME */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={toggleThemeDialoge}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl mt-2 bg-gradient-to-r from-[#00a884]/10 to-blue-500/10 hover:from-[#00a884]/20 hover:to-blue-500/20 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                >
                  {theme === "dark" ? <FaMoon /> : <FaSun />}
                  <span className="text-sm md:text-base">Theme</span>
                  <span className="ml-auto text-xs md:text-sm text-gray-400 capitalize">
                    {theme}
                  </span>
                </motion.button>
              </div>

              {/* LOGOUT */}
              <div className="mt-auto pt-2 border-t border-gray-200 dark:border-[#2a3942] flex justify-start">
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.05 }}
                  whileTap={{ scale: loading ? 1 : 0.95 }}
                  onClick={handleLogout}
                  disabled={loading}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                  } ${
                    theme === "dark"
                      ? "text-white hover:bg-[#202c33]"
                      : "text-black hover:bg-gray-100"
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
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
