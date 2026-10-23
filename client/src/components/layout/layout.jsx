import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import SideBar from "../../components/sideBar";
import { motion, AnimatePresence } from "framer-motion";
import ChatWindow from "../../pages/chatSection/ChatWindow";
import ContactInfo from "../../components/ContactInfo";
import ProfilePicture from "../../components/profilePicture";
import PollDetailsPanel from "../../components/PollDetailsPanel";
import MessageInfoPanel from "../../components/MessageInfoPanel";
import StatusPlaceholder from "../info/StatusPlaceholder";
import MediaModal from "../modals/MediaModal";
import VideoCallManager from "../../pages/videoCall/videoCallManager";
import { META_AI_USER_ID } from "../common/MetaAiIcon";

const Layout = ({
  children,
  isThemeDialogOpen,
  toggleThemeDialoge,
  isStatusPreviewOpen,
  statusPreviewContent,
  handleStatusClick,
  rightContent,
}) => {
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact,
  );

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme, setTheme } = useThemeStore();
  const showContactInfo = useLayoutStore((state) => state.showContactInfo);
  const selectedPollMessage = useLayoutStore((state) => state.selectedPollMessage);
  const selectedMessageInfo = useLayoutStore((state) => state.selectedMessageInfo);
  const showProfilePicture = useLayoutStore(
    (state) => state.showProfilePicture,
  );
  const profilePictureData = useLayoutStore(
    (state) => state.profilePictureData,
  );

  const setShowProfilePicture = useLayoutStore(
    (state) => state.setShowProfilePicture,
  );

  const isMediaModalOpen = useLayoutStore((state) => state.isMediaModalOpen);
  const mediaModalScope = useLayoutStore((state) => state.mediaModalScope);
  const mediaModalContact = useLayoutStore((state) => state.mediaModalContact);
  const mediaModalChatId = useLayoutStore((state) => state.mediaModalChatId);
  const mediaModalInitialTab = useLayoutStore((state) => state.mediaModalInitialTab);
  const closeMediaModal = useLayoutStore((state) => state.closeMediaModal);

  const location = useLocation();
  const isChatPage = location.pathname === "/";
  const isStatusPage = location.pathname.startsWith("/status");
  const effectiveSelectedContact = isChatPage ? selectedContact : null;
  const effectiveRightContent =
    rightContent || (isStatusPage ? <StatusPlaceholder /> : null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`h-screen h-[100dvh] w-full flex overflow-hidden ${theme === "dark" ? "bg-[#111b21] text-white" : "bg-gray-100 text-gray-900"
        }`}
    >
      {!isMobile && (
        <div className="w-20 flex-shrink-0 h-full">
          <SideBar />
        </div>
      )}

      <div className="flex-1 flex h-full overflow-hidden relative">
        <AnimatePresence initial={false}>
          {(!effectiveSelectedContact || !isMobile) && (
            <motion.div
              key={location.pathname.split("/")[1] || "chatList"}
              initial={{ x: isMobile ? "-100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween" }}
              className={`h-full w-full md:w-[30%] lg:w-[25%] md:min-w-[320px] md:max-w-[420px] shrink-0 ${isMobile ? "pb-16" : ""}`}
            >
              {children}
            </motion.div>
          )}

          {(!isMobile || effectiveSelectedContact) && (
            <div className="h-full flex-1 min-w-0 relative">
              {effectiveRightContent ? (
                <div className="h-full w-full">
                  {effectiveRightContent}
                </div>
              ) : null}
              <div
                className={`h-full w-full ${effectiveRightContent ? "hidden" : "block"
                  }`}
              >
                <ChatWindow
                  selectedContact={effectiveSelectedContact}
                  setSelectedContact={setSelectedContact}
                  onStatusClick={handleStatusClick}
                  isMobile={isMobile}
                />
              </div>
            </div>
          )}
        </AnimatePresence>

        {isChatPage && showContactInfo && <ContactInfo />}
        {isChatPage && selectedPollMessage && <PollDetailsPanel />}
        {isChatPage && selectedMessageInfo && <MessageInfoPanel />}
        {isChatPage && showProfilePicture && (
          <ProfilePicture
            isOpen={showProfilePicture}
            onClose={() => setShowProfilePicture(false)}
            image={
              profilePictureData?.image ??
              (selectedContact?.groupProfileImage || selectedContact?.profilePicture)
            }
            username={
              profilePictureData?.username ??
              (selectedContact?.groupName || selectedContact?.username)
            }
            isMetaAi={Boolean(
              profilePictureData?.isMetaAi ??
              (selectedContact?.isAI ||
                selectedContact?.username === "Meta AI" ||
                String(selectedContact?._id) === META_AI_USER_ID ||
                String(selectedContact?.id) === META_AI_USER_ID ||
                (Array.isArray(selectedContact?.participants) &&
                  selectedContact.participants.some(
                    (p) =>
                      p?.isAI ||
                      p?.username === "Meta AI" ||
                      String(p?._id || p) === META_AI_USER_ID
                  )))
            )}
          />
        )}

        <MediaModal
          isOpen={isMediaModalOpen}
          scope={mediaModalScope}
          contact={mediaModalContact}
          chatId={mediaModalChatId}
          initialTab={mediaModalInitialTab}
          onClose={closeMediaModal}
        />
        <VideoCallManager />
      </div>

      <AnimatePresence>
        {isStatusPreviewOpen && statusPreviewContent}
      </AnimatePresence>

      {isMobile && !isStatusPreviewOpen && <SideBar />}
      {isThemeDialogOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[100]"
          onClick={toggleThemeDialoge}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative p-6 rounded-2xl shadow-2xl max-w-[360px] w-full transform transition-all animate-in fade-in zoom-in duration-200 ${theme === "dark"
              ? "bg-[#2a3942] text-[#e9edef]"
              : "bg-white text-[#111b21]"
              }`}
          >
            <h2 className="text-xl font-medium mb-6">Choose Theme</h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <span className="text-md">Light</span>
                <input
                  type="radio"
                  name="theme"
                  checked={theme === "light"}
                  onChange={() => setTheme("light")}
                  title="Select light theme"
                  className="w-5 h-5 accent-[#00a884] cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <span className="text-md">Dark</span>
                <input
                  type="radio"
                  name="theme"
                  checked={theme === "dark"}
                  onChange={() => setTheme("dark")}
                  title="Select dark theme"
                  className="w-5 h-5 accent-[#00a884] cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                />
              </label>
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <button
                onClick={toggleThemeDialoge}
                className={`px-5 py-2 rounded-full font-medium transition-colors cursor-pointer ${theme === "dark"
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
