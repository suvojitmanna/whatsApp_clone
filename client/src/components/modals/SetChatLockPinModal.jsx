import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FaLock } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { toast } from "react-toastify";
import useThemeStore from "../../store/themeStore";
import {
  getChatLockPin,
  isChatLockConfigured,
  setChatLockPin,
} from "../../utils/chatLockUtil";

const SetChatLockPinModal = ({ isOpen, onClose, onSuccess }) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const isConfigured = isChatLockConfigured();
  const [step, setStep] = useState(isConfigured ? "current" : "new");
  const [currentInput, setCurrentInput] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(isConfigured ? "current" : "new");
      setCurrentInput("");
      setNewPin("");
      setConfirmPin("");
      setPinError(false);
    }
  }, [isOpen, isConfigured]);

  if (!isOpen || typeof document === "undefined") return null;

  const activeValue =
    step === "current"
      ? currentInput
      : step === "new"
        ? newPin
        : confirmPin;

  const handleDigit = (digit) => {
    if (activeValue.length >= 4) return;
    const next = activeValue + digit;

    if (step === "current") {
      setCurrentInput(next);
      if (next.length === 4) {
        const stored = getChatLockPin();
        if (next === stored) {
          setStep("new");
        } else {
          setPinError(true);
          toast.error("Incorrect current PIN");
          setTimeout(() => {
            setPinError(false);
            setCurrentInput("");
          }, 600);
        }
      }
    } else if (step === "new") {
      setNewPin(next);
      if (next.length === 4) {
        setStep("confirm");
      }
    } else if (step === "confirm") {
      setConfirmPin(next);
      if (next.length === 4) {
        if (next === newPin) {
          setChatLockPin(newPin);
          toast.success("🔒 Chat Lock PIN successfully configured!");
          onSuccess?.(newPin);
          onClose();
        } else {
          setPinError(true);
          toast.error("PINs do not match. Please try again.");
          setTimeout(() => {
            setPinError(false);
            setConfirmPin("");
            setStep("new");
            setNewPin("");
          }, 700);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (step === "current") setCurrentInput((prev) => prev.slice(0, -1));
    else if (step === "new") setNewPin((prev) => prev.slice(0, -1));
    else if (step === "confirm") setConfirmPin((prev) => prev.slice(0, -1));
  };

  const stepTitle =
    step === "current"
      ? "Enter Current PIN"
      : step === "new"
        ? isConfigured
          ? "Enter New 4-Digit PIN"
          : "Create a 4-Digit PIN"
        : "Confirm Your PIN";

  const stepDescription =
    step === "current"
      ? "Please verify your existing PIN before changing it."
      : step === "new"
        ? "This PIN will protect your hidden Locked Chats folder."
        : "Enter the same 4 digits again to confirm.";

  return createPortal(
    <div
      className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-[340px] max-w-full rounded-2xl p-6 shadow-2xl border flex flex-col items-center text-center relative ${isDark
          ? "bg-[#233138] border-white/10 text-white shadow-black/80"
          : "bg-white border-gray-100 text-gray-900 shadow-xl"
          }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-gray-400 hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Close"
        >
          <RxCross2 size={18} />
        </button>

        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 text-2xl mb-3 shadow-inner">
          <FaLock />
        </div>

        <h3 className="font-bold text-lg mb-1">{stepTitle}</h3>
        <p className="text-xs text-gray-400 mb-5 max-w-[260px] leading-relaxed">
          {stepDescription}
        </p>

        <div className="flex items-center gap-3.5 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${activeValue.length > idx
                ? "bg-emerald-500 border-emerald-500 scale-110 shadow-sm"
                : "border-gray-400/50"
                } ${pinError ? "border-red-500 bg-red-500/20 animate-shake" : ""}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2.5 w-full mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(String(num))}
              className={`h-11 rounded-xl text-base font-semibold border transition-all active:scale-95 cursor-pointer ${isDark
                ? "border-white/10 hover:bg-white/10 text-white"
                : "border-black/5 hover:bg-black/5 text-gray-800"
                }`}
            >
              {num}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleDigit("0")}
            className={`h-11 rounded-xl text-base font-semibold border transition-all active:scale-95 cursor-pointer ${isDark
              ? "border-white/10 hover:bg-white/10 text-white"
              : "border-black/5 hover:bg-black/5 text-gray-800"
              }`}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className={`h-11 rounded-xl text-xs font-semibold border transition-all active:scale-95 cursor-pointer flex items-center justify-center ${isDark
              ? "border-white/10 hover:bg-white/10 text-gray-300 hover:text-white"
              : "border-black/5 hover:bg-black/5 text-gray-600 hover:text-black"
              }`}
          >
            ⌫
          </button>
        </div>

        {step === "confirm" && (
          <button
            type="button"
            onClick={() => {
              setStep("new");
              setConfirmPin("");
              setNewPin("");
            }}
            className="text-xs text-emerald-500 hover:underline cursor-pointer pt-1"
          >
            ← Re-enter new PIN
          </button>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

export default SetChatLockPinModal;
