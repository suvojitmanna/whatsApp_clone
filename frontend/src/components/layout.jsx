import React, { useEffect, useState } from "react";
import useLayoutStore from "../store/layoutStore";
import useThemeStore from "../store/themeStore";
import SideBar from "../components/sideBar";
import { motion, AnimatePresence } from "framer-motion";
import ChatWindow from "../pages/chatSection/ChatWindow";

const Layout = ({
  children,
  isThemeDialogOpen,
  toggleThemeDialoge,
  isStatusPreviewOpen,
  statusPreviewContent,
}) => {
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact,
  );

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`min-h-screen flex ${
        theme === "dark" ? "bg-[#111b21] text-white" : "bg-gray-100 text-black"
      }`}
    >
      {/* Sidebar (FIXED WIDTH) */}
      {!isMobile && (
        <div className="w-20 flex-shrink-0">
          <SideBar />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence initial={false}>
          {/* Chat List */}
          {(!selectedContact || !isMobile) && (
            <motion.div
              key="chatList"
              initial={{ x: isMobile ? "-100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween" }}
              className={`h-full w-full md:w-[25%] ${isMobile ? "pb-16" : ""}`}
            >
              {children}
            </motion.div>
          )}

          {/* Chat Window */}
          {(selectedContact || !isMobile) && (
            <motion.div
              key="chatWindow"
              initial={{ x: isMobile ? "100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween" }}
              className="h-full w-full md:w-[80%]"
            >
              <ChatWindow
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
                isMobile={isMobile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Sidebar */}
      {isMobile && <SideBar />}

      {/* Theme Dialog */}
      {isThemeDialogOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[100]"
          onClick={toggleThemeDialoge} // Closes when clicking background
        >
          <div
            onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside
            className={`relative p-6 rounded-2xl shadow-2xl max-w-[360px] w-full transform transition-all animate-in fade-in zoom-in duration-200 ${
              theme === "dark"
                ? "bg-[#2a3942] text-[#e9edef]"
                : "bg-white text-[#111b21]"
            }`}
          >
            <h2 className="text-xl font-medium mb-6">Choose Theme</h2>

            <div className="space-y-4">
              {/* Light Theme Option */}
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-md">Light</span>
                <input
                  type="radio"
                  name="theme"
                  checked={theme === "light"}
                  onChange={() => setTheme("light")}
                  className="w-5 h-5 accent-[#00a884] cursor-pointer"
                />
              </label>

              {/* Dark Theme Option */}
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-md">Dark</span>
                <input
                  type="radio"
                  name="theme"
                  checked={theme === "dark"}
                  onChange={() => setTheme("dark")}
                  className="w-5 h-5 accent-[#00a884] cursor-pointer"
                />
              </label>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end gap-2">
              <button
                onClick={toggleThemeDialoge}
                className={`px-5 py-2 rounded-full font-medium transition-colors cursor-pointer ${
                  theme === "dark"
                    ? "text-[#00a884] hover:bg-[#202c33]"
                    : "text-[#00a884] hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={toggleThemeDialoge}
                className="px-6 py-2 bg-[#00a884] hover:bg-[#06cf9c] text-white rounded-full font-medium shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
