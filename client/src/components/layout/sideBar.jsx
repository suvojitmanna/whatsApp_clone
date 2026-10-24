import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import useLayoutStore from "../../store/layoutStore";
import useStatusStore from "../../store/statusStore";
import { useChatStore } from "../../store/chatStore";
import { FaWhatsapp, FaUserCircle, FaCog } from "react-icons/fa";
import { MdOutlineCall, MdRadioButtonChecked } from "react-icons/md";
import { motion } from "framer-motion";
import { WhatsAppMediaFolderIcon } from "../media/Media";
import { MetaAiRing, META_AI_USER_ID, META_AI_AVATAR } from "../common/MetaAiIcon";

const sideBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { activeTab, setActiveTab, selectedContact, setSelectedContact, isMediaModalOpen, openMediaModal } = useLayoutStore();
  const { statuses, fetchStatuses, initializeSocket, cleanupSocket } = useStatusStore();
  const isDark = theme === "dark";

  useEffect(() => {
    if (user?._id) {
      fetchStatuses();
      initializeSocket();
    }
    return () => {
      cleanupSocket();
    };
  }, [user?._id, fetchStatuses, initializeSocket, cleanupSocket]);

  const hasUnreadStatus = useMemo(() => {
    if (!user?._id || !Array.isArray(statuses) || statuses.length === 0) return false;
    const currentUserId = user._id.toString();
    const now = new Date();

    return statuses.some((status) => {
      const statusUserId = (status.user?._id || status.user)?.toString();
      if (!statusUserId || statusUserId === currentUserId) return false;
      if (status.expireAt && new Date(status.expireAt) <= now) return false;
      const isViewed =
        Array.isArray(status.viewers) &&
        status.viewers.some((viewer) => {
          const vId = (viewer.user?._id || viewer.user || viewer)?.toString();
          return vId === currentUserId;
        });

      return !isViewed;
    });
  }, [statuses, user?._id]);

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
    const isActive =
      activeTab === tabName || (tabName === "media" && isMediaModalOpen);
    const isStatusTab = tabName === "status";
    const highlightStatus = isStatusTab && hasUnreadStatus && !isActive;

    return `relative transition-all duration-300 ease-in-out p-3 rounded-2xl flex items-center justify-center cursor-pointer border
      ${isActive
        ? theme === "dark"
          ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] border-emerald-500/40 ring-1 ring-emerald-500/30"
          : "bg-emerald-50 text-emerald-600 shadow-sm border-emerald-500/30 ring-1 ring-emerald-500/20"
        : highlightStatus
          ? theme === "dark"
            ? "border-emerald-500/40 text-[#25d366] bg-emerald-500/10 shadow-[0_0_12px_rgba(37,211,102,0.25)] hover:bg-emerald-500/20"
            : "border-emerald-500/30 text-[#25d366] bg-emerald-50 shadow-xs hover:bg-emerald-100/60"
          : theme === "dark"
            ? "border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 hover:border-gray-600/40"
            : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100 hover:border-gray-300/60"
      }`;
  };

  const sidebarContent = (
    <>
      <div
        className={`${isMobile ? "flex flex-row justify-around w-full" : "flex flex-col gap-3 items-center"}`}
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

        <Link to="/calls" title="Calls" aria-label="Calls">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={getIconClass("calls")}
            title="Calls"
          >
            <MdOutlineCall className="h-6 w-6" />
          </motion.div>
        </Link>

        <Link to="/status" title="Status" aria-label="Status" className="relative group">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={getIconClass("status")}
            title="Status"
          >
            <MdRadioButtonChecked
              className={`h-6 w-6 transition-colors duration-200 ${hasUnreadStatus && activeTab !== "status" ? "text-[#25d366]" : ""
                }`}
            />
            {hasUnreadStatus && (
              <span
                className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#25d366] ring-2 ring-[#f0f2f5] dark:ring-[#111b21] shadow-xs"
                title="New status update"
              />
            )}
          </motion.div>
        </Link>

        <div
          className={`h-px w-12 self-center ${isDark ? "bg-white/15" : "bg-black/15"
            }`}
        />


        <button
          type="button"
          onClick={() => {
            const users = useChatStore.getState()?.users || [];
            const metaAiUser = users.find(
              (u) => u?.isAI || u?.username === "Meta AI" || String(u?._id) === META_AI_USER_ID
            ) || {
              _id: META_AI_USER_ID,
              username: "Meta AI",
              isAI: true,
              isVerified: true,
              isOnline: true,
              profilePicture: META_AI_AVATAR,
              about: "Ask me anything, imagine images, and explore new ideas.",
            };
            setSelectedContact(metaAiUser);
            if (location.pathname !== "/") {
              navigate("/");
            }
          }}
          title="Meta AI"
          aria-label="Meta AI"
          className="outline-none focus:outline-none cursor-pointer"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`relative transition-all duration-300 ease-in-out p-2 rounded-2xl flex items-center justify-center cursor-pointer border ${selectedContact?.isAI || selectedContact?.username === "Meta AI" || String(selectedContact?._id) === META_AI_USER_ID
              ? "bg-gradient-to-tr from-[#00c6ff]/20 via-[#0072ff]/20 to-[#a855f7]/20 border-cyan-500/40 ring-1 ring-cyan-500/30"
              : "border-transparent hover:bg-black/5 dark:hover:bg-white/10"
              }`}
          >
            <MetaAiRing size={24} />
          </motion.div>
        </button>
      </div>

      {!isMobile && <div className="flex-grow" />}

      <div
        className={`${isMobile
          ? "flex flex-row justify-between items-center w-full px-6"
          : "flex flex-col gap-3 items-center"
          }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            openMediaModal({ scope: "all" });
          }}
          title="Media, links and docs"
          aria-label="Media, links and docs"
          className="outline-none focus:outline-none cursor-pointer"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={getIconClass("media")}
            title="Media, links and docs"
          >
            <WhatsAppMediaFolderIcon size={23} />
          </motion.div>
        </button>
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
    ${isMobile
          ? "fixed bottom-0 left-0 right-0 h-20 px-4"
          : "w-20 h-screen flex-col py-8"
        } 
    ${theme === "dark"
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
