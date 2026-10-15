import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import useLayoutStore from "../store/layoutStore";
import { FaWhatsapp, FaUserCircle, FaCog } from "react-icons/fa";
import { MdRadioButtonChecked } from "react-icons/md";
import { motion } from "framer-motion";

const sideBar = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const path = location.pathname.split("/")[1] || "chats";
    setActiveTab(path === "user-profile" ? "profile" : path);
  }, [location, setActiveTab]);

  const isChatRoute = location.pathname === "/";
  if (isMobile && selectedContact && isChatRoute) return null;

  const getIconClass = (tabName) => {
    const isActive = activeTab === tabName;
    return `relative transition-all duration-300 ease-in-out p-3 rounded-2xl flex items-center justify-center cursor-pointer border
      ${
        isActive
          ? theme === "dark"
            ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] border-emerald-500/40 ring-1 ring-emerald-500/30"
            : "bg-emerald-50 text-emerald-600 shadow-sm border-emerald-500/30 ring-1 ring-emerald-500/20"
          : theme === "dark"
            ? "border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 hover:border-gray-600/40"
            : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100 hover:border-gray-300/60"
      }`;
  };

  const sidebarContent = (
    <>
      <div
        className={`${isMobile ? "flex flex-row justify-around w-full" : "flex flex-col gap-6 items-center"}`}
      >
        <Link to="/" title="Chats" aria-label="Chats">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={getIconClass("chats")}
            title="Chats"
          >
            <FaWhatsapp className="h-6 w-6" />
          </motion.div>
        </Link>

        <Link to="/status" title="Status" aria-label="Status">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={getIconClass("status")}
            title="Status"
          >
            <MdRadioButtonChecked className="h-6 w-6" />
          </motion.div>
        </Link>
      </div>

      {!isMobile && <div className="flex-grow" />}

      <div
        className={`${
          isMobile
            ? "flex flex-row justify-between items-center w-full px-6"
            : "flex flex-col gap-6 items-center"
        }`}
      >
        <Link to="/user-profile" title="Profile" aria-label="Profile">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`overflow-hidden rounded-full border-2 transition-all duration-300 cursor-pointer ${activeTab === "profile" ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/30" : "border-transparent hover:border-gray-400/50"}`}
            title="Profile"
          >
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="user"
                className="h-9 w-9 object-cover"
              />
            ) : (
              <FaUserCircle
                className={`h-9 w-9 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
              />
            )}
          </motion.div>
        </Link>

        <Link to="/setting" title="Settings" aria-label="Settings">
          <motion.div
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200 }}
            className={getIconClass("setting")}
            title="Settings"
          >
            <FaCog className="h-6 w-6" />
          </motion.div>
        </Link>
      </div>
    </>
  );
  return (
    <div
      className={`
    ${
      isMobile
        ? "fixed bottom-0 left-0 right-0 h-20 px-4"
        : "w-20 h-screen flex-col py-8"
    } 
    ${
      theme === "dark"
        ? "bg-[#111b21] border-[#222d34]"
        : "bg-[#f0f2f5] border-gray-200"
    } 
    border-t-[1px] md:border-r-[1px] flex items-center z-50 shadow-2xl
  `}
    >
      {sidebarContent}
    </div>
  );
};

export default sideBar;
