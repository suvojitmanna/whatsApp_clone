import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { RxCross2 } from "react-icons/rx";
import { FaCheck, FaLock, FaExclamationTriangle } from "react-icons/fa";
import { MdShield } from "react-icons/md";
import { MetaAiRing } from "../common/MetaAiIcon";
import { generateSafetyNumber } from "../../utils/cryptoUtils";

const ContactInfoSecurityTab = ({
  isMetaAi,
  theme,
  user,
  selectedContact,
  viewingMember,
  setContactInfoTab,
  showContactInfo,
}) => {
  const navigate = useNavigate();
  const isDark = theme === "dark";
  const [safetyNumber, setSafetyNumber] = useState({
    blocks: Array(12).fill("00000"),
    fullNumber: "",
  });
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [scanError, setScanError] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!showContactInfo || (!selectedContact && !viewingMember)) return;

    const myPubKey =
      user?.publicKey ||
      localStorage.getItem(`e2ee_pk_${user?._id}`) ||
      user?._id;
    const activeContact = viewingMember || selectedContact;
    const peerPubKey = activeContact?.publicKey || activeContact?._id;

    if (myPubKey && peerPubKey) {
      generateSafetyNumber(myPubKey, peerPubKey).then((result) => {
        setSafetyNumber(result);
      });
    }
  }, [showContactInfo, selectedContact, viewingMember, user]);

  useEffect(() => {
    if (!safetyNumber.fullNumber) return;
    const activeContact = viewingMember || selectedContact;

    const payload = JSON.stringify({
      app: "whatsapp-security",
      safetyNumber: safetyNumber.fullNumber,
      participants: [
        user?._id?.toString() || "",
        activeContact?._id?.toString() || "",
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
  }, [safetyNumber.fullNumber, user?._id, selectedContact?._id, viewingMember?._id]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.error("Error stopping camera stream", e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
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
    [safetyNumber.fullNumber, selectedContact?.username, stopCamera]
  );

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!isCameraOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.error("Error stopping camera stream", e);
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
          videoRef.current.play().catch(() => { });
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
            console.error("Error stopping camera stream", e);
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
          console.error("Error checking video frame", e);
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

  if (isMetaAi) {
    return (
      <motion.div
        key="tab-security-ai"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col items-center py-6 px-6 overflow-y-auto flex-1 scrollbar-hide text-center"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl" />
          <MetaAiRing size={110} animate className="relative z-10 drop-shadow-[0_10px_25px_rgba(59,130,246,0.35)]" />
        </div>

        <h3 className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          Meta AI & Your Privacy
        </h3>

        <p className={`text-sm leading-relaxed max-w-sm mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          Your personal messages and calls with friends and family remain <span className="text-emerald-500 font-semibold">end-to-end encrypted</span>. No one else, not even WhatsApp or Meta, can read or listen to them.
        </p>

        <div className={`w-full p-4 rounded-2xl border text-left mb-4 ${theme === "dark" ? "bg-white/[0.03] border-white/10" : "bg-black/[0.02] border-black/5"
          }`}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
              <MdShield size={18} />
            </div>
            <div>
              <h4 className={`text-sm font-semibold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                How Meta AI works
              </h4>
              <p className={`text-xs leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                When you chat with Meta AI, your prompts are processed securely using AI models to provide helpful answers and generate images.
              </p>
            </div>
          </div>
        </div>

        <div className={`w-full p-4 rounded-2xl border text-left mb-6 ${theme === "dark" ? "bg-white/[0.03] border-white/10" : "bg-black/[0.02] border-black/5"
          }`}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <FaLock size={14} />
            </div>
            <div>
              <h4 className={`text-sm font-semibold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                Personal chats stay private
              </h4>
              <p className={`text-xs leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                Meta AI cannot access messages in your other 1-on-1 or group chats unless you explicitly invoke @Meta AI in that chat.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setContactInfoTab("info")}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-medium text-sm shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer"
        >
          Done
        </button>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        key="tab-security"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col items-center py-4 px-4 sm:px-6 overflow-y-auto flex-1 scrollbar-hide select-none"
      >
        <AnimatePresence>
          {scanStatus === "verified" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full mb-4 px-4 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-[13.5px]"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0 font-bold">
                ✓
              </div>
              <span className="font-medium">
                Security code verified. Messages with this contact are end-to-end encrypted.
              </span>
            </motion.div>
          )}

          {scanStatus === "mismatch" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full mb-4 px-4 py-3 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center gap-3 text-red-400 text-[13.5px]"
            >
              <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 font-bold">
                ✕
              </div>
              <span className="font-medium">
                Security code doesn't match. Please make sure you are scanning the correct code.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCameraOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full mb-5 overflow-hidden"
            >
              <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/20">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover"
                />
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-black/80 text-white text-xs z-10">
                    <p className="text-red-400 font-medium mb-1">Camera error</p>
                    <p className="text-gray-400">{cameraError}</p>
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
                        JSON.stringify({ safetyNumber: safetyNumber.fullNumber })
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
                        JSON.stringify({ safetyNumber: "0000000000000000000000000" })
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
            {viewingMember?.username || viewingMember?.name || selectedContact?.username || "this contact"}
          </span>{" "}
          are end-to-end encrypted, scan or upload this code on their device.
          You can also compare the number above instead.{" "}
          <button
            type="button"
            onClick={() => {
              stopCamera();
              navigate("/help?topic=security");
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
    </>
  );
};

export default ContactInfoSecurityTab;
