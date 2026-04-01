import React, { useEffect, useState } from "react";
import useLayoutStore from "../store/layoutStore";
import useThemeStore from "../store/themeStore";
import SideBar from "../components/sideBar";
import { motion, AnimatePresence } from "framer-motion";
import ChatWindow from "../pages/chatSection/chatWindow";

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
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div
            className={`${
              theme === "dark"
                ? "bg-[#202c33] text-white"
                : "bg-white text-black"
            } p-6 rounded-lg shadow-lg max-w-sm w-full`}
          >
            <h2 className="text-xl font-semibold mb-4">Choose Theme</h2>

            <button
              onClick={() => setTheme("light")}
              className="block w-full mb-2"
            >
              Light
            </button>

            <button onClick={() => setTheme("dark")} className="block w-full">
              Dark
            </button>

            <button
              onClick={toggleThemeDialoge}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
