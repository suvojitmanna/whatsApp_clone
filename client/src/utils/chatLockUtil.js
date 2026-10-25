export const getChatLockPin = () => {
  try {
    return localStorage.getItem("whatsapp_chat_lock_pin") || "";
  } catch {
    return "";
  }
};

export const isChatLockConfigured = () => {
  return Boolean(getChatLockPin());
};

export const setChatLockPin = (pin) => {
  if (!pin || String(pin).trim().length !== 4) return false;
  try {
    localStorage.setItem("whatsapp_chat_lock_pin", String(pin).trim());
    window.dispatchEvent(new Event("whatsapp_chat_lock_changed"));
    return true;
  } catch {
    return false;
  }
};

export const removeChatLock = () => {
  try {
    localStorage.removeItem("whatsapp_chat_lock_pin");
    window.dispatchEvent(new Event("whatsapp_chat_lock_changed"));
    return true;
  } catch {
    return false;
  }
};

export const verifyChatLockPin = (pin) => {
  const configured = getChatLockPin();
  if (!configured) return false;
  return String(pin).trim() === String(configured).trim();
};

export const isBiometricEnabled = () => {
  try {
    return localStorage.getItem("whatsapp_chat_lock_biometric") !== "false";
  } catch {
    return true;
  }
};

export const setBiometricEnabled = (enabled) => {
  try {
    localStorage.setItem(
      "whatsapp_chat_lock_biometric",
      String(Boolean(enabled)),
    );
    window.dispatchEvent(new Event("whatsapp_chat_lock_changed"));
  } catch {}
};

export default {
  getChatLockPin,
  isChatLockConfigured,
  setChatLockPin,
  removeChatLock,
  verifyChatLockPin,
  isBiometricEnabled,
  setBiometricEnabled,
};
