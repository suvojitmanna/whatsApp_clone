import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useOutsideClick from "../hook/useOutsideClick";
import useLayoutStore from "../store/layoutStore";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import { useChatStore } from "../store/chatStore";
import useVideoCallStore from "../store/videoCallStore";
import { generateSafetyNumber } from "../utils/cryptoUtils";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { RxCross2 } from "react-icons/rx";
import {
  FaPen,
  FaPhone,
  FaSearch,
  FaVideo,
  FaLock,
  FaCheck,
  FaMapMarkerAlt,
  FaCamera,
  FaCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa6";

const ActionButton = ({ icon, label, onClick, disabled, theme }) => (
  <button
    type="button"
    onClick={!disabled ? onClick : undefined}
    className={`flex flex-col items-center gap-2 group transition-all duration-300 ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer active:scale-95"
      }`}
  >
    <div
      className={`relative w-14 h-14 flex items-center justify-center rounded-2xl backdrop-blur-md ${theme === "dark"
        ? "bg-white/5 border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
        : "bg-black/5 border-black/5 shadow-[0_4px_16px_0_rgba(31,38,135,0.05)]"
        } border group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-all duration-500 overflow-hidden`}
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

const ContactInfo = () => {
  const contactInfoRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const {
    selectedContact,
    showContactInfo,
    setShowContactInfo,
    contactInfoTab = "info",
    setContactInfoTab,
  } = useLayoutStore();
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { isUserOnline } = useChatStore();

  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [safetyNumber, setSafetyNumber] = useState({
    blocks: Array(12).fill("00000"),
    fullNumber: "",
  });

  const isDark = theme === "dark";
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

  useEffect(() => {
    if (!showContactInfo || !selectedContact) return;

    const myPubKey =
      user?.publicKey ||
      localStorage.getItem(`e2ee_pk_${user?._id}`) ||
      user?._id;
    const peerPubKey = selectedContact?.publicKey || selectedContact?._id;

    if (myPubKey && peerPubKey) {
      generateSafetyNumber(myPubKey, peerPubKey).then((result) => {
        setSafetyNumber(result);
      });
    }
  }, [showContactInfo, selectedContact, user]);
  useEffect(() => {
    if (!safetyNumber.fullNumber) return;

    const payload = JSON.stringify({
      app: "whatsapp-security",
      safetyNumber: safetyNumber.fullNumber,
      participants: [
        user?._id?.toString() || "",
        selectedContact?._id?.toString() || "",
      ].sort(),
    });

    QRCode.toDataURL(payload, {
      width: 512,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating QR code:", err));
  }, [safetyNumber.fullNumber, user?._id, selectedContact?._id]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.error("Error stopping camera stream", e)
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  }, []);

  const handleScanCode = () => {
    setScanError(null);
    setIsCameraOpen(true);
    setScanStatus("scanning");
  };

  const handleValidateScannedCode = useCallback(
    (scannedRaw) => {
      stopCamera();

      if (!scannedRaw || typeof scannedRaw !== "string" || !scannedRaw.trim()) {
        setScanStatus(null);
        setScanError({
          title: "No QR code found",
          message:
            "Couldn't read a valid QR code. Please make sure the code is clearly visible and try again.",
        });
        return;
      }

      let isMatch = false;

      try {
        const parsed = JSON.parse(scannedRaw);
        if (
          parsed.safetyNumber === safetyNumber.fullNumber ||
          parsed.code === safetyNumber.fullNumber
        ) {
          isMatch = true;
        }
      } catch {
        const cleanScanned = scannedRaw.replace(/\D/g, "");
        const cleanSafety = safetyNumber.fullNumber.replace(/\D/g, "");
        if (
          cleanScanned.length >= 20 &&
          cleanSafety.length >= 20 &&
          (cleanScanned.includes(cleanSafety) || cleanSafety.includes(cleanScanned))
        ) {
          isMatch = true;
        }
      }

      if (isMatch) {
        setScanStatus("verified");
        setScanError(null);
        setTimeout(() => setScanStatus(null), 5000);
      } else {
        setScanStatus("mismatch");
        setScanError({
          title: "Security code doesn't match",
          message: `The security code you scanned doesn't match the code for your chat with ${selectedContact?.username || "this contact"
            }. Please make sure you are scanning the code displayed on their device.`,
        });
      }
    },
    [safetyNumber.fullNumber, selectedContact?.username, stopCamera],
  );

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!isCameraOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
          console.error("Error stopping camera stream", e)
        }
        });
        streamRef.current = null;
      }
      if (videoEl) {
        videoEl.srcObject = null;
      }
      return;
    }

    let isMounted = true;
    const initCamera = async () => {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 } },
          audio: false,
        });
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn("Unable to access camera:", err);
        if (isMounted) {
          setCameraError(err.message || "Camera access denied");
        }
      }
    };

    initCamera();

    return () => {
      isMounted = false;
      const currentStream = streamRef.current;
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
          console.error("Error stopping camera stream", e)
        }
        });
        streamRef.current = null;
      }
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };
  }, [isCameraOpen]);

  useEffect(() => {
    if (!isCameraOpen) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let animId = null;
    let isProcessing = true;

    const checkFrame = () => {
      if (!isProcessing) return;
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            isProcessing = false;
            handleValidateScannedCode(code.data);
            return;
          }
        } catch (e) {
          console.error("Error stopping camera stream", e)
        }
      }
      animId = requestAnimationFrame(checkFrame);
    };

    animId = requestAnimationFrame(checkFrame);

    return () => {
      isProcessing = false;
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isCameraOpen, handleValidateScannedCode]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

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

  const handleDownloadCode = () => {
    if (!qrDataUrl) return;

    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `security-code-${selectedContact?.username || "contact"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  const handleUploadCode = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            handleValidateScannedCode(code.data);
          } else {
            setScanStatus(null);
            setScanError({
              title: "No QR code found",
              message:
                "Couldn't find a valid QR code in this image. Please select an image containing a WhatsApp security QR code.",
            });
          }
        } catch {
          setScanError({
            title: "Error reading image",
            message: "Failed to process the uploaded image. Please try again.",
          });
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

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
            <div className="flex items-center gap-3 min-w-0">
              {contactInfoTab === "info" ? (
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowContactInfo(false)}
                  className="p-2 rounded-full transition-colors flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 cursor-pointer"
                  title="Close"
                >
                  <RxCross2 size={22} />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    stopCamera();
                    setScanError(null);
                    setContactInfoTab(contactInfoTab === "privacy" ? "security" : "info");
                  }}
                  className="p-1 rounded-full transition-colors flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 cursor-pointer"
                  title="Back"
                >
                  <FaArrowLeft size={24} />
                </motion.button>
              )}

              <h2 className="font-semibold text-[17px] tracking-tight truncate">
                {contactInfoTab === "security"
                  ? <div className="pt-8 pb-5">
                    <p className="text-center items-center justify-center text-md">Verify security code</p>
                    <div className="w-full mb-3">
                      <p className="text-[13.5px] text-[#8696a0] font-medium">
                        You, {selectedContact?.username || "Contact"}
                      </p>
                    </div></div>
                  : contactInfoTab === "privacy"
                    ? "Your chats and calls are private"
                    : "Contact Info"}
              </h2>
            </div>

            {contactInfoTab === "info" ? (
              <motion.button
                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                title="Edit contact"
              >
                <FaPen className="h-4 w-4 cursor-pointer" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  stopCamera();
                  setScanError(null);
                  setShowContactInfo(false);
                }}
                className="p-2 rounded-full transition-colors flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 cursor-pointer"
                title="Close"
              >
                <RxCross2 size={22} />
              </motion.button>
            )}
          </div>
          <AnimatePresence mode="wait">
            {contactInfoTab === "info" && (
              <motion.div
                key="tab-info"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center py-4 px-6 overflow-y-auto flex-1 scrollbar-hide"
              >
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
                    className={`text-2xl font-bold tracking-tight mb-1 transition-colors duration-300 ${theme === "dark" ? "text-white/95" : "text-gray-900"
                      }`}
                  >
                    {selectedContact?.username}
                  </h2>

                  <div className="flex flex-col items-center gap-1">
                    {selectedContact?.email && (
                      <p
                        className={`text-[13px] font-medium transition-colors duration-300 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                      >
                        {selectedContact.email}
                      </p>
                    )}

                    {selectedContact?.phoneNumber && (
                      <p
                        className={`text-[13px] font-medium transition-colors duration-300 ${theme === "dark" ? "text-emerald-500/80" : "text-emerald-600"
                          }`}
                      >
                        {selectedContact.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-center gap-8">
                  <ActionButton
                    icon={<FaSearch size={18} />}
                    label="Search"
                    theme={theme}
                  />

                  <ActionButton
                    icon={<FaPhone size={18} />}
                    label="Audio"
                    onClick={handleAudioCall}
                    disabled={!selectedContact?.isOnline}
                    theme={theme}
                  />

                  <ActionButton
                    icon={<FaVideo size={18} />}
                    label="Video"
                    onClick={handleVideoCall}
                    disabled={!selectedContact?.isOnline}
                    theme={theme}
                  />
                </div>

                <div className="w-full space-y-4 pt-4">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                    className={`relative p-3 rounded-2xl overflow-hidden transition-all duration-500 backdrop-blur-2xl border ${theme === "dark"
                      ? "bg-white/[0.03] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                      : "bg-black/[0.02] border-black/5 shadow-[0_8px_32px_rgba(31,38,135,0.05)]"
                      }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />

                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5  bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      <p className="text-[11px] text-emerald-500 font-bold uppercase tracking-[0.15em]">
                        About
                      </p>
                    </div>

                    <p
                      className={`text-[15px] leading-relaxed relative z-10 ${theme === "dark" ? "text-gray-200" : "text-gray-700"
                        }`}
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
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.45, type: "spring", stiffness: 100 }}
                    onClick={() => setContactInfoTab("security")}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-2xl border active:scale-98 ${theme === "dark"
                      ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                      : "bg-black/[0.02] border-black/5 hover:bg-black/[0.04] shadow-[0_8px_32px_rgba(31,38,135,0.05)]"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <FaLock size={16} />
                      </div>



                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold flex items-center gap-1.5">
                          Encryption
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">
                            Active
                          </span>
                        </h4>
                        <p
                          className={`text-[12px] truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                          Messages and calls are end-to-end encrypted. Tap to verify.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {contactInfoTab === "security" && (
              <motion.div
                key="tab-security"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center py-4 px-5 overflow-y-auto flex-1 scrollbar-hide relative"
              >
                <AnimatePresence>
                  {scanStatus === "scanning" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full mb-3 py-1.5 px-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs text-center font-medium flex items-center justify-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Scanning code with camera... Point at contact&apos;s code
                    </motion.div>
                  )}
                  {scanStatus === "verified" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full mb-3 py-2 px-3 rounded-xl bg-emerald-500 text-black text-xs text-center font-semibold flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <FaCheck className="text-xs" />
                      Security code verified! Encryption confirmed.
                    </motion.div>
                  )}
                  {scanStatus === "mismatch" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full mb-3 py-2 px-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-xs text-center font-medium flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <FaExclamationTriangle className="text-xs text-red-400" />
                      Security code didn&apos;t match. Please try again.
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {isCameraOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="w-full relative rounded-2xl overflow-hidden bg-black mb-4 shrink-0 shadow-xl"
                    >
                      <div className="relative w-full h-64 sm:h-72 bg-zinc-900 overflow-hidden flex items-center justify-center">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {cameraError && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/95 text-white p-4 text-center z-10">
                            <FaCamera className="text-3xl text-gray-400 mb-2" />
                            <p className="text-xs text-gray-300 mb-1 font-medium">
                              Camera unavailable or permission denied
                            </p>
                            <p className="text-[11px] text-gray-500 mb-3">
                              Use buttons below to test scanner verification
                            </p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Close camera"
                        >
                          <RxCross2 size={18} />
                        </button>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                          <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-full border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.48)] relative overflow-hidden">
                            <motion.div
                              animate={{ y: [-90, 90, -90] }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                            />
                          </div>
                        </div>

                        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2 z-30 pointer-events-auto">
                          <button
                            type="button"
                            onClick={() =>
                              handleValidateScannedCode(
                                JSON.stringify({ safetyNumber: safetyNumber.fullNumber }),
                              )
                            }
                            className="px-2.5 py-1 rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-black font-semibold text-[11px] backdrop-blur-sm transition-all shadow cursor-pointer active:scale-95"
                            title="Simulate scanning matching QR code"
                          >
                            Simulate Match ✓
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleValidateScannedCode(
                                JSON.stringify({ safetyNumber: "0000000000000000000000000" }),
                              )
                            }
                            className="px-2.5 py-1 rounded-full bg-red-500/90 hover:bg-red-400 text-white font-semibold text-[11px] backdrop-blur-sm transition-all shadow cursor-pointer active:scale-95"
                            title="Simulate scanning wrong QR code"
                          >
                            Simulate Mismatch ✕
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex justify-center my-4 select-none">
                  <div
                    onClick={handleDownloadCode}
                    className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-white flex items-center justify-center shadow-lg group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl"
                    title="Click to download QR code image"
                  >
                    <div className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Original Security QR Code"
                          className="w-full h-full object-contain select-none"
                        />
                      ) : (
                        <div className="w-full h-full animate-pulse bg-gray-200 rounded-lg" />
                      )}
                    </div>

                    <div
                      className={`absolute inset-0 rounded-full flex flex-col items-center justify-center transition-all duration-200 ${downloadSuccess
                        ? "bg-[#717d84]/95 opacity-100"
                        : "bg-[#7c878e]/90 opacity-0 group-hover:opacity-100 backdrop-blur-[1px]"
                        }`}
                    >
                      {downloadSuccess ? (
                        <div className="flex flex-col items-center gap-1.5 text-white font-medium">
                          <FaCheck className="text-2xl text-emerald-400" />
                          <span className="text-[14px]">Saved!</span>
                        </div>
                      ) : (
                        <div className="text-white text-center leading-snug drop-shadow-sm select-none">
                          <p className="text-[16px] sm:text-[17px] font-medium tracking-wide">Download</p>
                          <p className="text-[16px] sm:text-[17px] font-medium tracking-wide">code</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className={`flex flex-col items-center gap-1.5 font-mono text-[14px] sm:text-[15.5px] tracking-[0.16em] sm:tracking-[0.2em] select-all my-4 text-center ${isDark ? "text-gray-200" : "text-gray-800"
                    }`}
                >
                  <div>{safetyNumber.blocks.slice(0, 4).join("   ")}</div>
                  <div>{safetyNumber.blocks.slice(4, 8).join("   ")}</div>
                  <div>{safetyNumber.blocks.slice(8, 12).join("   ")}</div>
                </div>
                <p className="text-center text-[13px] leading-relaxed text-[#8696a0] px-2 mb-6 max-w-sm">
                  To verify that messages and calls with{" "}
                  <span className={isDark ? "text-gray-300 font-medium" : "text-gray-800 font-medium"}>
                    {selectedContact?.username || "this contact"}
                  </span>{" "}
                  are end-to-end encrypted, scan or upload this code on their device.
                  You can also compare the number above instead.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setContactInfoTab("privacy");
                    }}
                    className="text-[#00a884] hover:text-[#06cf9c] hover:underline font-medium inline cursor-pointer"
                  >
                    Learn more
                  </button>
                </p>
                <div className="flex flex-col items-center gap-3 w-full pb-6">
                  <button
                    type="button"
                    onClick={handleScanCode}
                    className="w-52 py-2.5 rounded-full bg-[#00a884] hover:bg-[#06cf9c] active:scale-95 text-[#111b21] font-semibold text-[14.5px] cursor-pointer transition-all shadow-md text-center"
                  >
                    Scan code
                  </button>

                  <button
                    type="button"
                    onClick={handleUploadCode}
                    className="w-52 py-2.5 rounded-full bg-[#00a884] hover:bg-[#06cf9c] active:scale-95 text-[#111b21] font-semibold text-[14.5px] cursor-pointer transition-all shadow-md text-center"
                  >
                    Upload code
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </motion.div>
            )}

            {contactInfoTab === "privacy" && (
              <motion.div
                key="tab-privacy"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center py-5 px-5 overflow-y-auto flex-1 scrollbar-hide"
              >
                <div className="flex justify-center mb-5 select-none">
                  <svg
                    width="150"
                    height="115"
                    viewBox="0 0 160 125"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="overflow-visible"
                  >
                    <g transform="translate(14, 20)">
                      <circle
                        cx="28"
                        cy="28"
                        r="23"
                        fill={isDark ? "#182229" : "#222e35"}
                        stroke="#ffffff"
                        strokeWidth="5"
                      />
                      <line
                        x1="12"
                        y1="44"
                        x2="44"
                        y2="12"
                        stroke="#ffffff"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                    </g>
                    <path
                      d="M62 48V28C62 17.5 70 9 80 9C90 9 98 17.5 98 28V48"
                      stroke="#dcf8c6"
                      strokeWidth="11"
                      strokeLinecap="round"
                    />
                    <rect
                      x="54"
                      y="44"
                      width="52"
                      height="46"
                      rx="14"
                      fill="#dcf8c6"
                    />
                    <circle cx="80" cy="62" r="5" fill="#111b21" />
                    <path d="M77 62L75 76H85L83 62Z" fill="#111b21" />
                    <g transform="translate(86, 20)">
                      <circle cx="34" cy="34" r="28" fill="#00a884" />
                      <circle cx="34" cy="34" r="23" fill="#111b21" />

                      <circle cx="34" cy="16" r="1.5" fill="#ffffff" />
                      <circle cx="44" cy="19" r="1.5" fill="#ffffff" />
                      <circle cx="51" cy="26" r="1.5" fill="#ffffff" />
                      <circle cx="52" cy="35" r="1.5" fill="#ffffff" />
                      <circle cx="17" cy="26" r="1.5" fill="#ffffff" />
                      <circle cx="24" cy="19" r="1.5" fill="#ffffff" />

                      <line
                        x1="34"
                        y1="34"
                        x2="25"
                        y2="23"
                        stroke="#ffffff"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle cx="34" cy="34" r="3" fill="#ffffff" />
                    </g>
                  </svg>
                </div>

                <p className="text-center text-[13px] leading-relaxed text-[#8696a0] px-2 mb-6 max-w-sm">
                  Messages and calls are end-to-end encrypted so only you and the
                  person you're communicating with can read or listen to them. Not
                  even WhatsApp can.
                </p>
                <div className="w-full space-y-4 mb-6">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      <FaLock size={14} className="text-[#00a884]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-[14px] font-medium leading-tight ${isDark ? "text-white" : "text-gray-900"
                          }`}
                      >
                        Text and voice messages
                      </h4>
                      <p className="text-[12px] text-[#8696a0]">End-to-end encrypted</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      <FaPhone size={13} className="text-[#00a884]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-[14px] font-medium leading-tight ${isDark ? "text-white" : "text-gray-900"
                          }`}
                      >
                        Audio and video calls
                      </h4>
                      <p className="text-[12px] text-[#8696a0]">End-to-end encrypted</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      <FaCamera size={13} className="text-[#00a884]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-[14px] font-medium leading-tight ${isDark ? "text-white" : "text-gray-900"
                          }`}
                      >
                        Photos, videos and documents
                      </h4>
                      <p className="text-[12px] text-[#8696a0]">End-to-end encrypted</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      <FaMapMarkerAlt size={14} className="text-[#00a884]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-[14px] font-medium leading-tight ${isDark ? "text-white" : "text-gray-900"
                          }`}
                      >
                        Location sharing
                      </h4>
                      <p className="text-[12px] text-[#8696a0]">End-to-end encrypted</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-[#202c33] text-gray-300" : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      <FaCircle size={13} className="text-[#00a884]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-[14px] font-medium leading-tight ${isDark ? "text-white" : "text-gray-900"
                          }`}
                      >
                        Status updates
                      </h4>
                      <p className="text-[12px] text-[#8696a0]">End-to-end encrypted</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 w-full pb-4">
                  <button
                    type="button"
                    onClick={() => setContactInfoTab("security")}
                    className="px-5 py-2 rounded-full bg-[#00a884] hover:bg-[#06cf9c] active:scale-95 text-[#111b21] font-semibold text-[13px] cursor-pointer transition-all shadow-md"
                  >
                    Verify security code
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactInfoTab("info")}
                    className={`px-5 py-2 rounded-full font-medium text-[13px] cursor-pointer transition-all ${isDark
                      ? "bg-white/10 hover:bg-white/15 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                      }`}
                  >
                    OK
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {scanError && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 12 }}
                  className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${isDark
                    ? "bg-[#1f2c34] border-white/10 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                    }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center mb-4 shadow-sm">
                      <FaExclamationTriangle size={24} />
                    </div>

                    <h3 className="text-lg font-semibold mb-2">
                      {scanError.title}
                    </h3>

                    <p className="text-[13.5px] leading-relaxed text-[#8696a0] mb-6">
                      {scanError.message}
                    </p>

                    <div className="flex items-center gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setScanError(null);
                          handleScanCode();
                        }}
                        className="flex-1 py-2.5 rounded-full bg-[#00a884] hover:bg-[#06cf9c] active:scale-95 text-[#111b21] font-semibold text-sm transition-all shadow cursor-pointer text-center"
                      >
                        Scan again
                      </button>
                      <button
                        type="button"
                        onClick={() => setScanError(null)}
                        className={`flex-1 py-2.5 rounded-full font-medium text-sm transition-all cursor-pointer text-center ${isDark
                          ? "bg-white/10 hover:bg-white/15 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          }`}
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContactInfo;
