import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useOutsideClick from "../hook/useOutsideClick";
import useLayoutStore from "../store/layoutStore";
import { RxCross2 } from "react-icons/rx";
import useThemeStore from "../store/themeStore";
import { useChatStore } from "../store/chatStore";
import { FaPen, FaPhone, FaSearch, FaVideo } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import useVideoCallStore from "../store/videoCallStore";

const ContactInfo = () => {
  const contactInfoRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { selectedContact, showContactInfo, setShowContactInfo } =
    useLayoutStore();
  const { theme } = useThemeStore();
  const { isUserOnline } = useChatStore();

  const online = isUserOnline(selectedContact?._id);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useOutsideClick(contactInfoRef, () => {
    setShowContactInfo(false);
  });
  const setShowProfilePicture = useLayoutStore(
    (state) => state.setShowProfilePicture,
  );

  const handleVideoCall = () => {
    if (selectedContact && online) {
      const { initiateCall } = useVideoCallStore.getState();

      const avatar = selectedContact?.profilePicture;

      initiateCall(
        selectedContact?._id,
        selectedContact?.username,
        avatar,
        "video",
      );
    } else {
      alert("User is offline. Cannot initiate the call");
    }
  };

  const handleAudioCall = () => {
    if (selectedContact && online) {
      const { initiateCall } = useVideoCallStore.getState();

      const avatar = selectedContact?.profilePicture;

      initiateCall(
        selectedContact?._id,
        selectedContact?.username,
        avatar,
        "audio",
      );
    } else {
      alert("User is offline. Cannot initiate the call");
    }
  };

  const ActionButton = ({ icon, label, onClick, disabled, theme }) => (
    <button
      onClick={!disabled ? onClick : undefined}
      className={`flex flex-col items-center gap-2 group transition-all duration-300 ${disabled
        ? "opacity-30 cursor-not-allowed"
        : "cursor-pointer active:scale-95"
        }`}
    >
      <div
        className={`relative w-14 h-14 flex items-center justify-center rounded-2xl 

      backdrop-blur-md 
      ${theme === "dark"
            ? "bg-white/5 border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
            : "bg-black/5 border-black/5 shadow-[0_4px_16px_0_rgba(31,38,135,0.05)]"
          }
      border
      group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10
      transition-all duration-500 overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="text-emerald-500 group-hover:text-emerald-400 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all">
          {icon}
        </div>
      </div>

      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 group-hover:text-emerald-500 transition-colors">
        {label}
      </span>
    </button>
  );
  return (
    <AnimatePresence>
      {showContactInfo && (
        <motion.div
          ref={contactInfoRef}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "tween", duration: 0.2 }}
          className={`h-full flex flex-col select-none ${isMobile
            ? "fixed inset-0 z-[100]"
            : "relative w-full md:w-[350px] lg:w-[400px] xl:w-[420px] shrink-0 border-l"
            } ${theme === "dark"
              ? "bg-[#111b21] border-[#222d34] text-white"
              : "bg-white border-gray-200 text-gray-800"
            } shadow-2xl`}
        >
          <div
            className={`h-[60px] px-4 flex items-center justify-between border-b shrink-0 ${theme === "dark" ? "bg-[#111b21] border-[#222d34]" : "bg-white border-gray-200"
              }`}
          >
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{
                  scale: 1.1,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                }}
                whileTap={{ scale: 1 }}
                onClick={() => setShowContactInfo(false)}
                className="p-2 rounded-full transition-colors flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 cursor-pointer"
              >
                <RxCross2 size={24} />
              </motion.button>

              <h2 className="font-semibold text-[17px] tracking-tight">
                Contact Info
              </h2>
            </div>

            <motion.button
              whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
            >
              <FaPen className="h-5 w-5 cursor-pointer" />
            </motion.button>
          </div>

          <div className="flex flex-col items-center py-4 px-6 overflow-y-auto flex-1 scrollbar-hide">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative mb-6"
            >
              <img
                src={selectedContact?.profilePicture || "/default-avatar.png"}
                alt={selectedContact?.username}
                onClick={() => setShowProfilePicture(true)}
                className="w-40 h-40 rounded-full object-cover border-4 border-white/10 shadow-[0_20px_50px_rgba(16,185,129,0.3)] cursor-pointer"
              />
              {online && (
                <span className="absolute bottom-3 right-3 w-5 h-5 bg-emerald-500 border-4 border-[#111b21] rounded-full shadow-lg"></span>
              )}
            </motion.div>

            <div className="text-center mb-6">
              <h2
                className={`text-2xl font-bold tracking-tight mb-1 transition-colors duration-300${theme === "dark" ? "text-white/95" : "text-gray-900"}`}
              >
                {selectedContact?.username}
              </h2>

              <div className="flex flex-col items-center gap-1">
                {selectedContact?.email && (
                  <p
                    className={`text-[13px] font-medium transition-colors duration-300
                    ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {selectedContact.email}
                  </p>
                )}

                {selectedContact?.phoneNumber && (
                  <p
                    className={`text-[13px] font-medium transition-colors duration-300
                    ${theme === "dark" ? "text-emerald-500/80" : "text-emerald-600"}`}
                  >
                    {selectedContact.phoneNumber}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-8">
              <ActionButton icon={<FaSearch size={18} />} label="Search" />

              <ActionButton
                icon={<FaPhone size={18} />}
                label="Audio"
                onClick={handleAudioCall}
                disabled={!selectedContact?.isOnline}
              />

              <ActionButton
                icon={<FaVideo size={18} />}
                label="Video"
                onClick={handleVideoCall}
                disabled={!selectedContact?.isOnline}
              />
            </div>

            <div className="w-full space-y-4 pt-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                className={`relative p-3 rounded-[28px] overflow-hidden transition-all duration-500 backdrop-blur-2xl border${theme === "dark" ? "bg-white/[0.03] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" : "bg-black/[0.02] border-black/5 shadow-[0_8px_32px_rgba(31,38,135,0.05)]"}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />

                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <p className="text-[11px] text-emerald-500 font-bold uppercase tracking-[0.15em]">
                    About
                  </p>
                </div>

                <p
                  className={`text-[15px] leading-relaxed relative z-10${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}
                >
                  {selectedContact?.about || "Hey there! I am using WhatsApp."}
                </p>

                <p
                  className={`text-[10px] mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-400"
                    }`}
                >
                  {selectedContact?.aboutUpdatedAt
                    ? `Updated ${new Date(
                      selectedContact.aboutUpdatedAt,
                    ).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}`
                    : ""}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContactInfo;
