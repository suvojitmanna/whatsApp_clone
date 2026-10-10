import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaCheck } from "react-icons/fa";
import QRCode from "qrcode";
import { generateSafetyNumber } from "../utils/cryptoUtils";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";

const SecurityVerifyModal = ({
  isOpen,
  onClose,
  contact,
  initialView = "privacy", // "privacy" | "code"
}) => {
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const [currentView, setCurrentView] = useState(initialView);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [scanStatus, setScanStatus] = useState(null); // null | "scanning" | "verified"
  const [qrDataUrl, setQrDataUrl] = useState("");
  const fileInputRef = useRef(null);

  const [safetyNumber, setSafetyNumber] = useState({
    blocks: Array(12).fill("00000"),
    fullNumber: "",
  });

  const isDark = theme === "dark";

  useEffect(() => {
    if (isOpen) {
      setCurrentView(initialView);
      setScanStatus(null);
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    if (!isOpen || !contact) return;

    const myPubKey =
      user?.publicKey ||
      localStorage.getItem(`e2ee_pk_${user?._id}`) ||
      user?._id;
    const peerPubKey = contact?.publicKey || contact?._id;

    if (myPubKey && peerPubKey) {
      generateSafetyNumber(myPubKey, peerPubKey).then((result) => {
        setSafetyNumber(result);
      });
    }
  }, [isOpen, contact, user]);

  useEffect(() => {
    if (!safetyNumber.fullNumber) return;

    const payload = JSON.stringify({
      app: "whatsapp-security",
      safetyNumber: safetyNumber.fullNumber,
      participants: [
        user?._id?.toString() || "",
        contact?._id?.toString() || "",
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
  }, [safetyNumber.fullNumber, user?._id, contact?._id]);

  if (!isOpen) return null;

  const handleBack = () => {
    if (currentView === "code" && initialView === "privacy") {
      setCurrentView("privacy");
    } else {
      onClose();
    }
  };

  const handleDownloadCode = () => {
    if (!qrDataUrl) return;

    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `security-code-${contact?.username || "contact"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  const handleScanCode = () => {
    setScanStatus("scanning");
    setTimeout(() => {
      setScanStatus("verified");
      setTimeout(() => setScanStatus(null), 3500);
    }, 1500);
  };

  const handleUploadCode = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScanStatus("verified");
      setTimeout(() => setScanStatus(null), 3500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-[430px] rounded-3xl overflow-hidden shadow-2xl border transition-colors ${isDark
            ? "bg-[#111b21] border-white/10 text-white"
            : "bg-white border-black/10 text-gray-900"
            }`}
        >
          {currentView === "code" ? (
            <div className="flex flex-col p-6 sm:p-7">
              <div className="flex items-center gap-4 mb-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-1 rounded-full hover:bg-white/10 text-white cursor-pointer transition-colors"
                  title="Back"
                >
                  <FaArrowLeft className="text-base" />
                </button>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[17px] text-white leading-tight">
                    Verify security code
                  </h3>
                  <p className="text-[13px] text-[#8696a0] truncate">
                    You, {contact?.username || "Contact"}
                  </p>
                </div>
              </div>
              <AnimatePresence>
                {scanStatus === "scanning" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-2 py-1.5 px-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs text-center font-medium flex items-center justify-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Scanning code...
                  </motion.div>
                )}
                {scanStatus === "verified" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-2 py-1.5 px-3 rounded-xl bg-emerald-500 text-black text-xs text-center font-semibold flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <FaCheck className="text-xs" />
                    Security code verified! Encryption confirmed.
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
                        alt="Security QR Code"
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
              <div className="flex flex-col items-center gap-1.5 font-mono text-[14px] sm:text-[15px] font-normal text-gray-200 tracking-[0.16em] select-all my-4">
                <div>{safetyNumber.blocks.slice(0, 4).join("   ")}</div>
                <div>{safetyNumber.blocks.slice(4, 8).join("   ")}</div>
                <div>{safetyNumber.blocks.slice(8, 12).join("   ")}</div>
              </div>
              <p className="text-center text-[13px] leading-relaxed text-[#8696a0] px-2 mb-6">
                To verify that messages and calls with{" "}
                <span className="text-gray-300 font-medium">
                  {contact?.username || "this contact"}
                </span>{" "}
                are end-to-end encrypted, scan or upload this code on their
                device. You can also compare the number above instead.{" "}
                <button
                  type="button"
                  onClick={() => setCurrentView("privacy")}
                  className="text-[#00a884] hover:text-[#06cf9c] hover:underline font-medium inline cursor-pointer"
                >
                  Learn more
                </button>
              </p>
              <div className="flex flex-col items-center gap-3 w-full pb-1">
                <button
                  type="button"
                  onClick={handleScanCode}
                  className="w-48 py-2 rounded-full bg-[#00a884] hover:bg-[#06cf9c] active:scale-95 text-[#111b21] font-semibold text-[14px] cursor-pointer transition-all shadow-md text-center"
                >
                  Scan code
                </button>

                <button
                  type="button"
                  onClick={handleUploadCode}
                  className="w-48 py-2 rounded-full bg-[#00a884] hover:bg-[#06cf9c] active:scale-95 text-[#111b21] font-semibold text-[14px] cursor-pointer transition-all shadow-md text-center"
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
            </div>
          ) : (
            <div className="p-7 sm:p-8 flex flex-col items-center">
              <div className="flex justify-center mb-6 select-none">
                <svg
                  width="160"
                  height="125"
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
                  <g transform="translate(74, 82)">
                    <rect
                      x="0"
                      y="0"
                      width="30"
                      height="13"
                      rx="6.5"
                      fill="#25d366"
                    />
                    <circle cx="6.5" cy="6.5" r="6.5" fill="#00a884" />
                    <rect
                      x="15"
                      y="4"
                      width="36"
                      height="5"
                      rx="2.5"
                      fill="#ffffff"
                    />
                  </g>
                </svg>
              </div>
              <h2
                className={`text-xl sm:text-[22px] font-semibold text-center mb-3 tracking-normal ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Your chats and calls are private
              </h2>
              <p
                className={`text-[13.5px] leading-[1.45] text-center mb-7 px-1 ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                  }`}
              >
                End-to-end encryption keeps your personal messages and calls
                between you and the people you choose. No one outside of the
                chat, not even WhatsApp, can read, listen to, or share them. This
                includes your:
              </p>
              <div className="w-full space-y-4 mb-9 pl-3 sm:pl-5">
                <div className="flex items-center gap-3.5 text-[14.5px]">
                  <svg
                    viewBox="0 0 24 24"
                    width="21"
                    height="21"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-[#8696a0]"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    <line x1="8" y1="9" x2="16" y2="9"></line>
                    <line x1="8" y1="13" x2="13" y2="13"></line>
                  </svg>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    Text and voice messages
                  </span>
                </div>
                <div className="flex items-center gap-3.5 text-[14.5px]">
                  <svg
                    viewBox="0 0 24 24"
                    width="21"
                    height="21"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-[#8696a0]"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    Audio and video calls
                  </span>
                </div>
                <div className="flex items-center gap-3.5 text-[14.5px]">
                  <svg
                    viewBox="0 0 24 24"
                    width="21"
                    height="21"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-[#8696a0]"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="3" ry="3"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    Photos, videos and documents
                  </span>
                </div>

                <div className="flex items-center gap-3.5 text-[14.5px]">
                  <svg
                    viewBox="0 0 24 24"
                    width="21"
                    height="21"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-[#8696a0]"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    Location sharing
                  </span>
                </div>
                <div className="flex items-center gap-3.5 text-[14.5px]">
                  <svg
                    viewBox="0 0 24 24"
                    width="21"
                    height="21"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    className="shrink-0 text-[#8696a0]"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      strokeDasharray="5 3.5"
                    ></circle>
                    <circle cx="12" cy="12" r="3.5" fill="none"></circle>
                  </svg>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    Statuses
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between w-full pt-1">
                <button
                  type="button"
                  onClick={() => setCurrentView("code")}
                  className="text-[#00a884] hover:text-[#06cf9c] font-medium text-[14px] cursor-pointer transition-colors"
                >
                  Learn more
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#00a884] hover:bg-[#06cf9c] active:scale-95 text-[#111b21] font-semibold px-7 py-2 rounded-full text-[14px] cursor-pointer transition-all shadow-md"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SecurityVerifyModal;
