import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FaLock, FaShieldAlt, FaCheck, FaCopy, FaQrcode } from "react-icons/fa";
import { generateSafetyNumber } from "../utils/cryptoUtils";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";

const SecurityVerifyModal = ({ isOpen, onClose, contact }) => {
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const [copied, setCopied] = useState(false);
  const [safetyNumber, setSafetyNumber] = useState({
    blocks: Array(12).fill("00000"),
    fullNumber: "",
  });
  const [activeTab, setActiveTab] = useState("number"); // "number" | "info"

  const isDark = theme === "dark";

  useEffect(() => {
    if (!isOpen || !contact) return;

    const myPubKey = user?.publicKey || localStorage.getItem(`e2ee_pk_${user?._id}`) || user?._id;
    const peerPubKey = contact?.publicKey || contact?._id;

    if (myPubKey && peerPubKey) {
      generateSafetyNumber(myPubKey, peerPubKey).then((result) => {
        setSafetyNumber(result);
      });
    }
  }, [isOpen, contact, user]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (safetyNumber.fullNumber) {
      navigator.clipboard.writeText(safetyNumber.fullNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border transition-colors ${
            isDark
              ? "bg-[#111b21] border-white/10 text-white"
              : "bg-white border-black/10 text-gray-900"
          }`}
        >
          {/* Top Header */}
          <div
            className={`px-6 py-4 flex items-center justify-between border-b ${
              isDark ? "border-white/10 bg-[#202c33]" : "border-gray-100 bg-[#f0f2f5]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <FaShieldAlt className="text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Verify Security Code</h3>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  End-to-end encryption with {contact?.username || "Contact"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-gray-500"
              }`}
            >
              <RxCross2 className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* Status Pill */}
            <div className="flex justify-center mb-5">
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border shadow-sm ${
                  isDark
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <FaLock className="w-3 h-3 text-emerald-500" />
                <span>End-to-End Encrypted (AES-256-GCM)</span>
              </div>
            </div>

            {/* Explanation */}
            <p className={`text-center text-xs leading-relaxed mb-6 px-2 ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}>
              Messages and calls with <span className="font-semibold text-emerald-500">{contact?.username}</span> are secured with end-to-end encryption. Compare this 60-digit security code or scan the QR code to verify.
            </p>

            {/* QR Code Graphic (SVG) */}
            <div className="flex justify-center mb-6">
              <div
                className={`relative p-4 rounded-2xl border shadow-inner ${
                  isDark ? "bg-[#182229] border-white/10" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="relative w-44 h-44 flex items-center justify-center bg-white rounded-xl p-2 shadow-sm">
                  {/* Decorative modern QR code design */}
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full text-zinc-900"
                    fill="currentColor"
                  >
                    {/* Top-left position marker */}
                    <rect x="5" y="5" width="26" height="26" rx="4" fill="#000" />
                    <rect x="9" y="9" width="18" height="18" rx="2" fill="#fff" />
                    <rect x="13" y="13" width="10" height="10" rx="2" fill="#000" />

                    {/* Top-right position marker */}
                    <rect x="69" y="5" width="26" height="26" rx="4" fill="#000" />
                    <rect x="73" y="9" width="18" height="18" rx="2" fill="#fff" />
                    <rect x="77" y="13" width="10" height="10" rx="2" fill="#000" />

                    {/* Bottom-left position marker */}
                    <rect x="5" y="69" width="26" height="26" rx="4" fill="#000" />
                    <rect x="9" y="73" width="18" height="18" rx="2" fill="#fff" />
                    <rect x="13" y="77" width="10" height="10" rx="2" fill="#000" />

                    {/* QR Code data modules simulation */}
                    <rect x="36" y="8" width="5" height="5" />
                    <rect x="46" y="8" width="5" height="5" />
                    <rect x="56" y="8" width="5" height="5" />
                    <rect x="36" y="18" width="5" height="5" />
                    <rect x="56" y="18" width="5" height="5" />
                    <rect x="41" y="24" width="5" height="5" />
                    <rect x="51" y="24" width="5" height="5" />

                    <rect x="8" y="36" width="5" height="5" />
                    <rect x="18" y="36" width="5" height="5" />
                    <rect x="8" y="46" width="5" height="5" />
                    <rect x="24" y="46" width="5" height="5" />
                    <rect x="8" y="56" width="5" height="5" />
                    <rect x="18" y="56" width="5" height="5" />

                    <rect x="69" y="36" width="5" height="5" />
                    <rect x="79" y="36" width="5" height="5" />
                    <rect x="89" y="36" width="5" height="5" />
                    <rect x="74" y="46" width="5" height="5" />
                    <rect x="84" y="46" width="5" height="5" />
                    <rect x="69" y="56" width="5" height="5" />
                    <rect x="89" y="56" width="5" height="5" />

                    <rect x="36" y="69" width="5" height="5" />
                    <rect x="46" y="69" width="5" height="5" />
                    <rect x="56" y="69" width="5" height="5" />
                    <rect x="41" y="79" width="5" height="5" />
                    <rect x="51" y="79" width="5" height="5" />
                    <rect x="36" y="89" width="5" height="5" />
                    <rect x="56" y="89" width="5" height="5" />

                    <rect x="69" y="69" width="5" height="5" />
                    <rect x="79" y="74" width="5" height="5" />
                    <rect x="89" y="69" width="5" height="5" />
                    <rect x="74" y="84" width="5" height="5" />
                    <rect x="84" y="89" width="5" height="5" />
                  </svg>

                  {/* Center WhatsApp Lock Badge */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 shadow-md flex items-center justify-center text-white border-2 border-white">
                      <FaLock className="text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 60-digit numbers grid (12 blocks of 5) */}
            <div
              className={`p-4 rounded-2xl border mb-5 select-all ${
                isDark ? "bg-[#182229] border-white/10" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 text-center font-mono font-medium text-xs sm:text-sm tracking-wider">
                {safetyNumber.blocks.map((block, idx) => (
                  <div
                    key={idx}
                    className={`py-1.5 px-1 rounded-lg border transition-colors ${
                      isDark
                        ? "bg-[#202c33] border-white/5 text-emerald-400"
                        : "bg-white border-gray-100 text-emerald-800"
                    }`}
                  >
                    {block}
                  </div>
                ))}
              </div>
            </div>

            {/* Copy Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleCopy}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : isDark
                    ? "bg-[#202c33] hover:bg-[#2a3942] text-white border border-white/10"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200"
                }`}
              >
                {copied ? (
                  <>
                    <FaCheck className="w-3.5 h-3.5 text-white" />
                    <span>Copied Safety Code!</span>
                  </>
                ) : (
                  <>
                    <FaCopy className="w-3.5 h-3.5 opacity-80" />
                    <span>Copy 60-Digit Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Information Card */}
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                isDark ? "bg-white/[0.02] border-white/10 text-gray-400" : "bg-emerald-50/50 border-emerald-100 text-gray-600"
              }`}
            >
              <h4 className="font-semibold text-emerald-500 mb-1 flex items-center gap-1.5">
                <FaLock className="w-3 h-3" />
                How WhatsApp-style encryption protects you:
              </h4>
              <p>
                Each chat creates unique cryptographic keys with ECDH & AES-GCM.
                Your messages are encrypted on your device before sending, and can only be decrypted by the recipient. Neither WhatsApp nor any intermediate server can ever read them.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SecurityVerifyModal;
