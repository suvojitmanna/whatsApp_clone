import { useRef, useState, useEffect, useCallback, useMemo } from "react";
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
  FaStar,
  FaHeart,
  FaBookmark,
} from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa6";
import { IoMdRemoveCircleOutline } from "react-icons/io";
import { IoTimerOutline, IoColorPaletteOutline } from "react-icons/io5";
import {
  MdChevronRight,
  MdRefresh,
  MdOutlineChatBubbleOutline,
  MdOutlineWallpaper,
  MdCheck,
  MdBlock,
  MdThumbDown,
  MdShield,
  MdList,
} from "react-icons/md";
import { LuSparkles, LuDownload } from "react-icons/lu";
import { format } from "date-fns";
import ReportModal from "./ReportModal";
import BlockModal from "./BlockModal";
import {
  CHAT_THEMES,
  CURATED_THEME_IDS,
  WALLPAPER_THEMES,
  NATURE_WALLPAPERS,
  SOLID_COLOUR_THEMES,
  CHAT_BUBBLE_COLORS,
  getChatTheme,
} from "../utils/chatThemes";
import { toast } from "react-toastify";

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
    previousContactInfoTab,
    setContactInfoTab,
    disappearingDurations = {},
    setDisappearingDuration,
    defaultMessageTimer = "Off",
    setDefaultMessageTimer,
    chatThemes = {},
    setChatTheme,
    chatDoodles = {},
    setChatDoodles,
    chatBubbleColors = {},
    setChatBubbleColor,
    resetChatBubbleColor,
    resetChatTheme,
  } = useLayoutStore();
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { isUserOnline, messages, starredMessages, toggleStarMessage, blockedContacts, blockContact, unblockContact } = useChatStore();
  const setIsChatSearchOpen = useLayoutStore((state) => state.setIsChatSearchOpen);

  const handleExecuteClearChat = () => {
    useChatStore.setState((state) => {
      const nextCache = new Map(state.messagesCache || new Map());
      if (chatId) nextCache.set(String(chatId), []);
      return {
        messages: [],
        messagesCache: nextCache,
      };
    });
    toast.success("Chat cleared");
    setConfirmDialog(null);
    onClose();
  };
  const chatId = (
    selectedContact?.conversation?._id ||
    selectedContact?.conversation ||
    selectedContact?._id ||
    ""
  )?.toString();

  const chatStarredMessages = useMemo(() => {
    if (!starredMessages) return [];
    const allStarred = Object.values(starredMessages);
    const activeMsgs = Array.isArray(messages) ? messages : [];
    const activeMsgIds = new Set(
      activeMsgs.map((m) => (m._id || m.temp)?.toString()).filter(Boolean)
    );

    return allStarred
      .filter((item) => {
        if (!item) return false;
        const msgIdStr = (item.messageId || item.message?._id)?.toString();
        if (msgIdStr && activeMsgIds.has(msgIdStr)) return true;
        const msg = item.message;
        if (!msg) return false;
        const convId = (
          msg.conversation?._id ||
          msg.conversation ||
          msg.conversationId
        )?.toString();
        const sId = (msg.sender?._id || msg.sender)?.toString();
        const rId = (msg.receiver?._id || msg.receiver)?.toString();
        return (
          convId === chatId ||
          sId === chatId ||
          rId === chatId ||
          (selectedContact?._id &&
            (sId === selectedContact._id.toString() ||
              rId === selectedContact._id.toString()))
        );
      })
      .sort((a, b) => (b.starredAt || 0) - (a.starredAt || 0));
  }, [starredMessages, messages, chatId, selectedContact?._id]);
  const [keptMessagesMap, setKeptMessagesMap] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("whatsapp_kept_messages") || "{}"
      );
    } catch {
      return {};
    }
  });

  const chatKeptMessages = useMemo(() => {
    if (!chatId || !keptMessagesMap?.[chatId]) return [];
    return Object.values(keptMessagesMap[chatId]).sort(
      (a, b) => (b.keptAt || 0) - (a.keptAt || 0)
    );
  }, [chatId, keptMessagesMap]);

  const handleUnkeepMessage = (messageId) => {
    if (!chatId || !messageId) return;
    const currentChatKept = { ...(keptMessagesMap[chatId] || {}) };
    delete currentChatKept[messageId];
    const updated = {
      ...keptMessagesMap,
      [chatId]: currentChatKept,
    };
    setKeptMessagesMap(updated);
    try {
      localStorage.setItem("whatsapp_kept_messages", JSON.stringify(updated));
    } catch { }
    toast.info("Message unkept");
  };

  const [advancedPrivacy, setAdvancedPrivacy] = useState(() => {
    try {
      const all = JSON.parse(
        localStorage.getItem("whatsapp_advanced_privacy") || "{}"
      );
      return (
        (chatId && all[chatId]) || {
          protectIp: false,
          disableLinkPreviews: false,
        }
      );
    } catch {
      return { protectIp: false, disableLinkPreviews: false };
    }
  });

  useEffect(() => {
    if (!chatId) return;
    try {
      const all = JSON.parse(
        localStorage.getItem("whatsapp_advanced_privacy") || "{}"
      );
      if (all[chatId]) {
        setAdvancedPrivacy(all[chatId]);
      } else {
        setAdvancedPrivacy({
          protectIp: false,
          disableLinkPreviews: false,
        });
      }
    } catch { }
  }, [chatId]);

  const handleToggleAdvancedPrivacy = (key) => {
    if (!chatId) return;
    const updated = {
      ...advancedPrivacy,
      [key]: !advancedPrivacy[key],
    };
    setAdvancedPrivacy(updated);
    try {
      const all = JSON.parse(
        localStorage.getItem("whatsapp_advanced_privacy") || "{}"
      );
      all[chatId] = updated;
      localStorage.setItem("whatsapp_advanced_privacy", JSON.stringify(all));
    } catch { }
    toast.success(
      key === "protectIp"
        ? updated.protectIp
          ? "Protect IP address in calls enabled"
          : "Protect IP address in calls disabled"
        : updated.disableLinkPreviews
          ? "Link previews disabled"
          : "Link previews enabled"
    );
  };

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("whatsapp_favourite_chats") || "[]"
      );
    } catch {
      return [];
    }
  });

  const isFavorite = useMemo(() => {
    return Boolean(chatId && favorites.includes(chatId));
  }, [chatId, favorites]);

  const handleToggleFavorite = () => {
    if (!chatId) return;
    let next;
    if (isFavorite) {
      next = favorites.filter((id) => id !== chatId);
      toast.info("Removed from favourites");
    } else {
      next = [...favorites, chatId];
      toast.success("Added to favourites");
    }
    setFavorites(next);
    try {
      localStorage.setItem("whatsapp_favourite_chats", JSON.stringify(next));
    } catch { }
  };

  const DEFAULT_LISTS = ["Favorites", "Friends", "Family", "Work"];
  const [customLists, setCustomLists] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("whatsapp_all_custom_lists") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [contactLists, setContactLists] = useState(() => {
    try {
      const map = JSON.parse(
        localStorage.getItem("whatsapp_contact_lists") || "{}"
      );
      return (chatId && map[chatId]) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!chatId) return;
    try {
      const map = JSON.parse(
        localStorage.getItem("whatsapp_contact_lists") || "{}"
      );
      setContactLists(map[chatId] || []);
    } catch { }
  }, [chatId]);

  const [newListName, setNewListName] = useState("");

  const handleToggleContactList = (listName) => {
    if (!chatId || !listName) return;
    const isMember = contactLists.includes(listName);
    const updated = isMember
      ? contactLists.filter((l) => l !== listName)
      : [...contactLists, listName];
    setContactLists(updated);
    try {
      const map = JSON.parse(
        localStorage.getItem("whatsapp_contact_lists") || "{}"
      );
      map[chatId] = updated;
      localStorage.setItem("whatsapp_contact_lists", JSON.stringify(map));
    } catch { }

    if (listName === "Favorites") {
      let nextFavs;
      if (isMember) {
        nextFavs = favorites.filter((id) => id !== chatId);
      } else {
        nextFavs = [...favorites, chatId];
      }
      setFavorites(nextFavs);
      try {
        localStorage.setItem(
          "whatsapp_favourite_chats",
          JSON.stringify(nextFavs)
        );
      } catch { }
    }

    toast.success(
      isMember ? `Removed from ${listName}` : `Added to ${listName}`
    );
  };

  const handleCreateNewList = (e) => {
    e?.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;
    if (DEFAULT_LISTS.includes(trimmed) || customLists.includes(trimmed)) {
      if (!contactLists.includes(trimmed)) {
        handleToggleContactList(trimmed);
      }
      setNewListName("");
      return;
    }
    const updatedCustom = [...customLists, trimmed];
    setCustomLists(updatedCustom);
    try {
      localStorage.setItem(
        "whatsapp_all_custom_lists",
        JSON.stringify(updatedCustom)
      );
    } catch { }
    handleToggleContactList(trimmed);
    setNewListName("");
  };

  const handleExportChat = () => {
    if (!messages || messages.length === 0) {
      toast.info("No messages to export");
      return;
    }

    const contactName = selectedContact?.username || "Contact";
    const myName = user?.username || "You";

    const lines = [
      `WhatsApp Chat with ${contactName}`,
      `Exported: ${new Date().toLocaleString()}`,
      `Total messages: ${messages.length}`,
      "----------------------------------------",
      "",
    ];

    messages.forEach((msg) => {
      const isMe =
        String(msg.sender?._id || msg.sender) === String(user?._id);
      const senderName = isMe ? myName : contactName;
      const timeStr = msg.createdAt
        ? new Date(msg.createdAt).toLocaleString([], {
          dateStyle: "short",
          timeStyle: "short",
        })
        : "Unknown date";

      let body = msg.content || "";
      if (msg.messageType === "image") body = "[Photo]";
      else if (msg.messageType === "video") body = "[Video]";
      else if (msg.messageType === "audio") body = "[Voice message]";
      else if (msg.messageType === "document")
        body = `[Document: ${msg.fileName || "file"}]`;
      else if (msg.poll) body = `[Poll: ${msg.poll.question}]`;
      else if (msg.event) body = `[Event: ${msg.event.title}]`;
      else if (msg.sticker) body = "[Sticker]";
      else if (msg.contact)
        body = `[Contact card: ${msg.contact.name || "Contact"}]`;

      lines.push(`[${timeStr}] ${senderName}: ${body}`);
    });

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `WhatsApp Chat with ${contactName.replace(/[^a-zA-Z0-9_-]/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Chat exported successfully");
  };

  const isBlocked = useMemo(() => {
    if (!blockedContacts || blockedContacts.length === 0) return false;
    const candidates = [
      chatId,
      selectedContact?._id,
      selectedContact?.id,
      selectedContact?.conversation?._id,
      selectedContact?.conversation,
    ].filter(Boolean).map(String);
    return candidates.some((id) => blockedContacts.includes(id));
  }, [chatId, selectedContact, blockedContacts]);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleToggleBlock = () => {
    const targetId = chatId || selectedContact?._id;
    if (!targetId) return;
    if (isBlocked) {
      unblockContact(targetId);
      toast.success(`${selectedContact?.username || "Contact"} unblocked`);
    } else {
      setShowBlockModal(true);
    }
  };

  const handleConfirmBlock = ({ report } = {}) => {
    const targetId = chatId || selectedContact?._id;
    if (!targetId) return;
    blockContact(targetId);
    if (report) {
      toast.success(
        `${selectedContact?.username || "Contact"} reported and blocked`
      );
    } else {
      toast.success(`${selectedContact?.username || "Contact"} blocked`);
    }
    setShowBlockModal(false);
  };

  const handleConfirmReport = ({ block }) => {
    const targetId = chatId || selectedContact?._id;
    if (block && targetId) {
      blockContact(targetId);
      toast.success(
        `${selectedContact?.username || "Contact"} reported and blocked`
      );
    } else {
      toast.success("Report submitted to WhatsApp");
    }
    setShowReportModal(false);
  };

  const disappearingDuration =
    (chatId && disappearingDurations?.[chatId]) ||
    defaultMessageTimer ||
    "Off";

  const activeChatThemeId = (chatId && chatThemes?.[chatId]) || "default";
  const activeChatTheme = getChatTheme(activeChatThemeId);
  const customBubbleColor = chatId && chatBubbleColors?.[chatId];
  const activeBubbleColor = customBubbleColor || activeChatTheme.bubbleColor;
  const doodlesEnabled = chatId ? chatDoodles?.[chatId] !== false : true;

  const handleSelectDisappearing = (duration) => {
    if (chatId) {
      setDisappearingDuration(chatId, duration, user?._id);
      toast.success(
        duration === "Off"
          ? "Disappearing messages turned off"
          : `Disappearing messages set to ${duration}`
      );
    }
  };

  const handleSelectDefaultTimer = (duration) => {
    setDefaultMessageTimer(duration);
    toast.success(
      duration === "Off"
        ? "Default message timer turned off"
        : `Default message timer set to ${duration}`
    );
  };

  const handleSelectTheme = (themeId) => {
    if (chatId) {
      setChatTheme(chatId, themeId);
      const chosen = getChatTheme(themeId);
      toast.success(`Theme set to ${chosen.name}`);
    }
  };

  const handleToggleDoodles = (enabled) => {
    if (chatId) {
      setChatDoodles(chatId, enabled);
      toast.info(enabled ? "WhatsApp doodles enabled" : "WhatsApp doodles disabled");
    }
  };

  const handleResetTheme = () => {
    if (chatId) {
      resetChatTheme(chatId);
      toast.success("Chat theme reset to default");
    }
  };

  const handleSelectBubbleColor = (color) => {
    if (chatId) {
      setChatBubbleColor(chatId, color);
      toast.success("Chat bubble color updated");
    }
  };

  const handleResetBubbleColor = () => {
    if (chatId) {
      resetChatBubbleColor(chatId);
      toast.info("Chat bubble reset to theme default");
    }
  };

  const [wallpaperFilter, setWallpaperFilter] = useState("all");
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cursorTooltipRef = useRef(null);

  const updateCursorTooltip = useCallback((e, text) => {
    if (!cursorTooltipRef.current) return;
    const el = cursorTooltipRef.current;
    if (text !== undefined && text !== null) {
      el.textContent = text;
    }
    el.style.display = "block";

    const cursorOffset = 18;
    const x = e.clientX;
    let y = e.clientY + cursorOffset;
    if (y + 36 > window.innerHeight) {
      y = e.clientY - 30;
    }

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }, []);

  const hideCursorTooltip = useCallback(() => {
    if (!cursorTooltipRef.current) return;
    cursorTooltipRef.current.style.display = "none";
  }, []);

  useEffect(() => {
    hideCursorTooltip();
  }, [contactInfoTab, showContactInfo, hideCursorTooltip]);

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
          className={`min-h-screen h-full flex flex-col select-none ${isMobile
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
                    if (contactInfoTab === "allThemes") {
                      setContactInfoTab("chatTheme");
                    } else if (contactInfoTab === "chatBubble") {
                      setContactInfoTab("chatTheme");
                    } else if (contactInfoTab === "wallpaper") {
                      setContactInfoTab("chatTheme");
                    } else if (contactInfoTab === "solidColour") {
                      setContactInfoTab("wallpaper");
                    } else if (contactInfoTab === "chatTheme") {
                      if (previousContactInfoTab === "info") {
                        setContactInfoTab("info");
                      } else {
                        setShowContactInfo(false);
                      }
                    } else if (contactInfoTab === "defaultTimer") {
                      setContactInfoTab("disappearing");
                    } else if (contactInfoTab === "disappearing") {
                      if (previousContactInfoTab === "info") {
                        setContactInfoTab("info");
                      } else {
                        setShowContactInfo(false);
                      }
                    } else if (contactInfoTab === "privacy") {
                      setContactInfoTab("security");
                    } else {
                      setContactInfoTab("info");
                    }
                  }}
                  className="p-1 rounded-full transition-colors flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 cursor-pointer"
                  title="Back"
                >
                  <FaArrowLeft size={20} />
                </motion.button>
              )}

              {contactInfoTab === "security" ? (
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-[16px] leading-tight truncate">
                    Verify security code
                  </span>
                  <span className="text-[12px] text-[#8696a0] font-normal truncate">
                    You, {selectedContact?.username || "Contact"}
                  </span>
                </div>
              ) : (
                <h2 className="font-semibold text-[17px] tracking-tight truncate">
                  {contactInfoTab === "privacy"
                    ? "Your chats and calls are private"
                    : contactInfoTab === "disappearing"
                      ? "Disappearing messages"
                      : contactInfoTab === "defaultTimer"
                        ? "Default message timer"
                        : contactInfoTab === "chatTheme"
                          ? "Chat theme"
                          : contactInfoTab === "chatBubble"
                            ? "Chat bubble"
                            : contactInfoTab === "allThemes"
                              ? "Themes"
                              : contactInfoTab === "wallpaper"
                                ? "Wallpaper"
                                : contactInfoTab === "solidColour"
                                  ? "Solid colour"
                                  : contactInfoTab === "starred"
                                    ? "Starred messages"
                                    : contactInfoTab === "kept"
                                      ? "Kept messages"
                                      : contactInfoTab === "advancedPrivacy"
                                        ? "Advanced"
                                        : contactInfoTab === "lists"
                                          ? "Add to list"
                                          : "Contact Info"}
                </h2>
              )}
            </div>

            {contactInfoTab === "info" ? (
              <motion.button
                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                title="Edit contact"
              >
                <FaPen className="h-4 w-4 cursor-pointer" />
              </motion.button>
            ) : contactInfoTab === "chatTheme" || contactInfoTab === "wallpaper" ? (
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleResetTheme}
                className="p-2 rounded-full transition-colors flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
                title={contactInfoTab === "wallpaper" ? "Reset wallpaper" : "Reset theme"}
              >
                <MdRefresh size={22} />
              </motion.button>
            ) : contactInfoTab === "chatBubble" ? (
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleResetBubbleColor}
                className="p-2 rounded-full transition-colors flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
                title="Reset chat bubble"
              >
                <MdRefresh size={22} />
              </motion.button>
            ) : contactInfoTab === "allThemes" || contactInfoTab === "solidColour" ? null : (
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
                className="flex flex-col items-center py-3 px-6 overflow-y-auto flex-1 scrollbar-hide"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative"
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
                    onClick={() => setContactInfoTab("starred")}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-2xl ${theme === "dark"
                      ? " hover:bg-white/[0.05] hover:border-white/[0.10]"
                      : " hover:bg-black/8 hover:border-black/10"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                        <FaStar size={17} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold flex items-center gap-1.5">
                          Starred messages
                        </h4>
                        <p
                          className={`text-[12px] truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                          {chatStarredMessages.length > 0
                            ? `${chatStarredMessages.length} starred message${chatStarredMessages.length > 1 ? "s" : ""
                            }`
                            : "None"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {chatStarredMessages.length > 0 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                            {chatStarredMessages.length}
                          </span>
                        )}
                        <MdChevronRight size={18} className="text-[#8696a0]" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.48, type: "spring", stiffness: 100 }}
                    onClick={() => setContactInfoTab("kept")}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-2xl ${theme === "dark"
                      ? " hover:bg-white/[0.05] hover:border-white/[0.10]"
                      : " hover:bg-black/8 hover:border-black/10"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <FaBookmark size={15} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold flex items-center gap-1.5">
                          Kept messages
                        </h4>
                        <p
                          className={`text-[12px] truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                          {chatKeptMessages.length > 0
                            ? `${chatKeptMessages.length} kept message${chatKeptMessages.length > 1 ? "s" : ""
                            }`
                            : "None"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {chatKeptMessages.length > 0 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                            {chatKeptMessages.length}
                          </span>
                        )}
                        <MdChevronRight size={18} className="text-[#8696a0]" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                    onClick={() => setContactInfoTab("disappearing")}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-2xl ${theme === "dark"
                      ? " hover:bg-white/[0.05] hover:border-white/[0.10]"
                      : " hover:bg-black/8 hover:border-black/10"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <IoTimerOutline size={19} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold flex items-center gap-1.5">
                          Disappearing messages
                        </h4>
                        <p
                          className={`text-[12px] truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                          {disappearingDuration}
                        </p>
                      </div>

                      <MdChevronRight size={18} className="text-[#8696a0] shrink-0" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.52, type: "spring", stiffness: 100 }}
                    onClick={() => setContactInfoTab("advancedPrivacy")}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-2xl ${theme === "dark"
                      ? " hover:bg-white/[0.05] hover:border-white/[0.10]"
                      : " hover:bg-black/8 hover:border-black/10"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                        <MdShield size={19} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold flex items-center gap-1.5">
                          Advanced chat privacy
                        </h4>
                        <p
                          className={`text-[12px] truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                          Protect IP address, disable link previews
                        </p>
                      </div>

                      <MdChevronRight size={18} className="text-[#8696a0] shrink-0" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.55, type: "spring", stiffness: 100 }}
                    onClick={() => setContactInfoTab("chatTheme")}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-2xl ${theme === "dark"
                      ? " hover:bg-white/[0.05] hover:border-white/[0.10]"
                      : " hover:bg-black/8 hover:border-black/10"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <IoColorPaletteOutline size={19} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold flex items-center gap-1.5">
                          Chat theme
                        </h4>
                        <p
                          className={`text-[12px] truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                          {activeChatTheme.name}
                        </p>
                      </div>

                      <MdChevronRight size={18} className="text-[#8696a0] shrink-0" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.58, type: "spring", stiffness: 100 }}
                    onClick={() => setContactInfoTab("security")}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-2xl ${theme === "dark"
                      ? " hover:bg-white/[0.05] hover:border-white/[0.10]"
                      : " hover:bg-black/8 hover:border-black/10"
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

                      <MdChevronRight size={18} className="text-[#8696a0] shrink-0" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.61, type: "spring", stiffness: 100 }}
                    onClick={handleToggleFavorite}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-2xl ${theme === "dark"
                      ? " hover:bg-white/[0.05] hover:border-white/[0.10]"
                      : " hover:bg-black/8 hover:border-black/10"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${isFavorite
                          ? "bg-rose-500/15 text-rose-500 border-rose-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                      >
                        <FaHeart size={16} className={isFavorite ? "fill-rose-500" : ""} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold flex items-center gap-1.5">
                          {isFavorite ? "Remove from favourites" : "Add to favourites"}
                        </h4>
                        <p
                          className={`text-[12px] truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                          {isFavorite
                            ? "Saved to your favourites list"
                            : "Add to favourite chats for quick access"}
                        </p>
                      </div>

                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 transition-colors ${isFavorite
                          ? "bg-rose-500/20 text-rose-400 font-semibold"
                          : "text-[#8696a0]"
                          }`}
                      >
                        {isFavorite ? "Favourite" : "Add"}
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.64, type: "spring", stiffness: 100 }}
                    onClick={() => setContactInfoTab("lists")}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-2xl ${theme === "dark"
                      ? " hover:bg-white/[0.05] hover:border-white/[0.10]"
                      : " hover:bg-black/8 hover:border-black/10"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                        <MdList size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold flex items-center gap-1.5">
                          Add to list
                        </h4>
                        <p
                          className={`text-[12px] truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                          {contactLists.length > 0
                            ? contactLists.join(", ")
                            : "Organize into custom lists"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {contactLists.length > 0 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400">
                            {contactLists.length}
                          </span>
                        )}
                        <MdChevronRight size={18} className="text-[#8696a0]" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.67, type: "spring", stiffness: 100 }}
                    onClick={handleExportChat}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-2xl ${theme === "dark"
                      ? " hover:bg-white/[0.05] hover:border-white/[0.10]"
                      : " hover:bg-black/8 hover:border-black/10"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                        <LuDownload size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold flex items-center gap-1.5">
                          Export chat
                        </h4>
                        <p
                          className={`text-[12px] truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                          Download conversation history (.txt)
                        </p>
                      </div>

                      <MdChevronRight size={18} className="text-[#8696a0] shrink-0" />
                    </div>
                  </motion.div>

                  <div className="my-1 border-t border-white/5" />
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
                    onClick={handleExecuteClearChat}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-2xl ${theme === "dark"
                      ? " hover:bg-red-500/10 hover:border-red-500/20"
                      : " hover:bg-red-50 hover:border-red-100"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
                        <IoMdRemoveCircleOutline size={19} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold text-red-500 truncate">
                          Clear Chat
                        </h4>

                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
                    onClick={handleToggleBlock}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-2xl ${theme === "dark"
                      ? " hover:bg-red-500/10 hover:border-red-500/20"
                      : " hover:bg-red-50 hover:border-red-100"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
                        <MdBlock size={19} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold text-red-500 truncate">
                          {isBlocked
                            ? `Unblock ${selectedContact?.username || "contact"}`
                            : `Block ${selectedContact?.username || "contact"}`}
                        </h4>
                        <p
                          className={`text-[12px] truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                          {isBlocked
                            ? "Allow calls and messages from this contact"
                            : "Calls and messages will be blocked"}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.73, type: "spring", stiffness: 100 }}
                    onClick={() => setShowReportModal(true)}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-2xl ${theme === "dark"
                      ? " hover:bg-red-500/10 hover:border-red-500/20"
                      : " hover:bg-red-50 hover:border-red-100"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
                        <MdThumbDown size={19} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold text-red-500 truncate">
                          Report {selectedContact?.username || "contact"}
                        </h4>
                        <p
                          className={`text-[12px] truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                          Send report and last 5 messages to WhatsApp
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

            {contactInfoTab === "disappearing" && (
              <motion.div
                key="tab-disappearing"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col py-2 overflow-y-auto flex-1 scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
              >
                <div className="flex justify-center items-center py-6">
                  <svg
                    width="200"
                    height="125"
                    viewBox="0 0 220 140"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-md select-none"
                  >
                    <path
                      d="M175 35 C175 22 163 12 148 12 C133 12 121 22 121 35 C121 44 126 51 134 55 L130 68 L143 58 C145 58 146 58 148 58 C163 58 175 48 175 35 Z"
                      fill="#fff9e6"
                    />
                    <circle cx="112" cy="70" r="44" fill="#00a884" />
                    <circle cx="112" cy="70" r="37" fill="#25d366" />
                    <circle cx="112" cy="70" r="30" fill="#00a884" />
                    <circle cx="112" cy="37" r="2.2" fill="#ffffff" />
                    <circle cx="128" cy="41" r="2.2" fill="#ffffff" />
                    <circle cx="142" cy="54" r="2.2" fill="#ffffff" />
                    <circle cx="147" cy="70" r="2.2" fill="#ffffff" />
                    <circle cx="142" cy="86" r="2.2" fill="#ffffff" />
                    <circle cx="128" cy="99" r="2.2" fill="#ffffff" />
                    <circle cx="112" cy="103" r="2.2" fill="#ffffff" />
                    <circle cx="96" cy="99" r="2.2" fill="#ffffff" />
                    <circle cx="82" cy="86" r="2.2" fill="#ffffff" />
                    <circle cx="77" cy="69" r="2.2" fill="#ffffff" />
                    <circle cx="81" cy="52" r="2.2" fill="#ffffff" />
                    <circle cx="95" cy="39" r="2.2" fill="#ffffff" />
                    <path
                      d="M110 70 L133 47 C134.5 45.5 136.5 47.5 135 49 L114 72 Z"
                      fill="#111b21"
                    />
                    <circle cx="112" cy="70" r="4.5" fill="#111b21" />
                    <circle cx="72" cy="84" r="19" fill="#b9f5d0" />
                    <circle cx="93" cy="94" r="14" fill="#b9f5d0" />
                    <circle cx="81" cy="98" r="11" fill="#b9f5d0" />
                    <circle cx="66" cy="64" r="6" fill="#b9f5d0" />
                    <circle cx="162" cy="90" r="4.5" fill="#00a884" />
                    <circle cx="170" cy="84" r="3" fill="#00a884" />
                  </svg>
                </div>

                <div className="px-6 mb-6">
                  <h3
                    className={`text-[15px] font-semibold mb-2.5 ${isDark ? "text-[#53bdeb]" : "text-[#027eb5]"
                      }`}
                  >
                    Make messages in this chat disappear
                  </h3>
                  <p className="text-[13.5px] leading-relaxed text-[#8696a0]">
                    For more privacy and storage, all new messages will disappear
                    from this chat for everyone after the selected duration, except
                    when kept. Anyone in the chat can change this setting.{" "}
                    <span
                      onClick={() =>
                        toast.info(
                          "Disappearing messages can be kept or starred depending on chat permissions.",
                          { autoClose: 3000 }
                        )
                      }
                      className="text-[#00a884] hover:underline cursor-pointer font-medium"
                    >
                      Learn more
                    </span>
                  </p>
                </div>

                <div className="px-6 space-y-4 mb-8">
                  {["Off", "24 hours", "7 days", "90 days"].map((option) => {
                    const isSelected = disappearingDuration === option;
                    return (
                      <label
                        key={option}
                        onClick={() => handleSelectDisappearing(option)}
                        className="flex items-center gap-4 cursor-pointer select-none group py-1"
                      >
                        <div className="relative flex items-center justify-center">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                              ? "border-[#00a884]"
                              : isDark
                                ? "border-[#8696a0]/70 group-hover:border-white"
                                : "border-gray-400 group-hover:border-gray-600"
                              }`}
                          >
                            {isSelected && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[#00a884]" />
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-[15px] transition-colors ${isSelected
                            ? isDark
                              ? "text-white font-medium"
                              : "text-gray-900 font-medium"
                            : isDark
                              ? "text-[#d1d7db] group-hover:text-white"
                              : "text-gray-700 group-hover:text-gray-900"
                            }`}
                        >
                          {option}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="px-6 pt-3 pb-6 text-[13.5px] text-[#8696a0]">
                  Update your{" "}
                  <button
                    type="button"
                    onClick={() => setContactInfoTab("defaultTimer")}
                    className="text-[#00a884] hover:underline font-medium cursor-pointer"
                  >
                    default message timer
                  </button>{" "}
                  in Settings
                </div>
              </motion.div>
            )}

            {contactInfoTab === "defaultTimer" && (
              <motion.div
                key="tab-defaultTimer"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col py-4 px-6 overflow-y-auto flex-1 scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
              >
                <h3 className="text-[14.5px] font-semibold text-[#00a884] mb-6">
                  Start new chats with disappearing messages
                </h3>

                <div className="space-y-4 mb-8">
                  {["Off", "24 hours", "7 days", "90 days"].map((option) => {
                    const isSelected = defaultMessageTimer === option;
                    return (
                      <label
                        key={option}
                        onClick={() => handleSelectDefaultTimer(option)}
                        className="flex items-center gap-4 cursor-pointer select-none group py-1"
                      >
                        <div className="relative flex items-center justify-center">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                              ? "border-[#00a884]"
                              : isDark
                                ? "border-[#8696a0]/70 group-hover:border-white"
                                : "border-gray-400 group-hover:border-gray-600"
                              }`}
                          >
                            {isSelected && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[#00a884]" />
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-[15px] transition-colors ${isSelected
                            ? isDark
                              ? "text-white font-medium"
                              : "text-gray-900 font-medium"
                            : isDark
                              ? "text-[#d1d7db] group-hover:text-white"
                              : "text-gray-700 group-hover:text-gray-900"
                            }`}
                        >
                          {option}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <p className="text-[13px] leading-relaxed text-[#8696a0] mb-3">
                  When turned on, all new individual chats will start with
                  disappearing messages set to the duration you select. This
                  setting will not affect your existing chats.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      toast.info(
                        "New individual chats will automatically use this timer.",
                        { autoClose: 3000 }
                      )
                    }
                    className="text-[13px] text-[#00a884] hover:underline font-medium cursor-pointer"
                  >
                    Learn more
                  </button>
                </div>
              </motion.div>
            )}

            {contactInfoTab === "chatTheme" && (
              <motion.div
                key="tab-chatTheme"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                onScroll={hideCursorTooltip}
                className="flex flex-col py-3 overflow-y-auto flex-1 scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
              >
                <div className="px-5 mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[16px] font-semibold text-white">Themes</h3>
                    <button
                      type="button"
                      onClick={() => setContactInfoTab("allThemes")}
                      className="px-3.5 py-1 rounded-full text-xs font-semibold text-[#00a884] bg-[#202c33] hover:bg-[#2a3942] border border-white/5 transition-colors cursor-pointer"
                    >
                      See all
                    </button>
                  </div>
                  <p className="text-[13px] text-[#8696a0] mb-3.5 leading-snug">
                    The chat color and wallpaper will both change.
                  </p>

                  <div className="grid grid-cols-3 gap-2.5">
                    {CURATED_THEME_IDS.map((id) => {
                      const themeItem = getChatTheme(id);
                      const isSelected = activeChatThemeId === themeItem.id;
                      return (
                        <div
                          key={themeItem.id}
                          onClick={() => handleSelectTheme(themeItem.id)}
                          onMouseEnter={(e) => updateCursorTooltip(e, themeItem.name)}
                          onMouseMove={(e) => updateCursorTooltip(e, themeItem.name)}
                          onMouseLeave={hideCursorTooltip}
                          className={`relative h-[80px] rounded-[18px] overflow-hidden cursor-pointer transition-all duration-200 select-none ${isSelected
                            ? "border-2 border-white scale-[1.01] shadow-xl"
                            : "border border-white/10 hover:border-white/30 hover:scale-[1.02]"
                            }`}
                          style={{
                            background: themeItem.gradient || themeItem.bgColor,
                            backgroundColor: themeItem.bgColor || "#0b141a",
                            backgroundImage:
                              themeItem.hasDoodles && doodlesEnabled
                                ? "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')"
                                : undefined,
                            backgroundSize: "120px",
                            backgroundBlendMode: "overlay",
                          }}
                        >
                          <div className="absolute top-2.5 left-2.5 w-10 h-3.5 rounded-[4.5px] bg-[#2a3942]/90 shadow-sm pointer-events-none" />

                          <div
                            className="absolute top-5.5 right-2.5 w-11 h-3.5 rounded-[4.5px] shadow-sm pointer-events-none"
                            style={{ backgroundColor: isSelected ? activeBubbleColor : themeItem.bubbleColor }}
                          />

                          {isSelected && (
                            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5.5 h-5.5 rounded-full bg-white text-[#111b21] flex items-center justify-center shadow-lg pointer-events-none">
                              <FaCheck size={9.5} className="stroke-[1.5]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between py-3.5 px-5 border-y border-[#202c33]">
                  <div className="flex items-center gap-3">
                    <LuSparkles size={20} className="text-[#8696a0]" />
                    <span className="text-[15px] font-normal text-white">WhatsApp doodles</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={doodlesEnabled}
                    onClick={() => handleToggleDoodles(!doodlesEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${doodlesEnabled ? "bg-[#00a884]" : "bg-[#374248]"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200 ${doodlesEnabled
                        ? "translate-x-5 bg-[#111b21]"
                        : "translate-x-0 bg-[#8696a0]"
                        }`}
                    />
                  </button>
                </div>
                <div className="px-5 pt-3.5">
                  <h4 className="text-[14.5px] font-semibold text-white mb-2">Customize</h4>
                  <div
                    className="flex items-center justify-between py-2.5 px-1 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group select-none"
                    onClick={() => setContactInfoTab("chatBubble")}
                  >
                    <div className="flex items-center gap-3.5">
                      <MdOutlineChatBubbleOutline size={20} className="text-[#8696a0] group-hover:text-white transition-colors" />
                      <span className="text-[15px] font-normal text-white">Chat bubble</span>
                    </div>
                    <div
                      className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: activeBubbleColor }}
                    />
                  </div>
                  <div
                    className="flex items-center justify-between py-2.5 px-1 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group select-none mt-1"
                    onClick={() => setContactInfoTab("wallpaper")}
                  >
                    <div className="flex items-center gap-3.5">
                      <MdOutlineWallpaper size={20} className="text-[#8696a0] group-hover:text-white transition-colors" />
                      <span className="text-[15px] font-normal text-white">Wallpaper</span>
                    </div>
                    <div
                      className="w-8 h-6 rounded-md border border-white/20 overflow-hidden relative shadow-sm"
                      style={{
                        background: activeChatTheme.imageUrl
                          ? `url('${activeChatTheme.thumbnailUrl || activeChatTheme.imageUrl}') center/cover no-repeat`
                          : activeChatTheme.gradient || activeChatTheme.bgColor,
                        backgroundImage:
                          activeChatTheme.imageUrl
                            ? `url('${activeChatTheme.thumbnailUrl || activeChatTheme.imageUrl}')`
                            : activeChatTheme.hasDoodles && doodlesEnabled
                              ? "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')"
                              : undefined,
                        backgroundSize: activeChatTheme.imageUrl ? "cover" : "36px",
                        backgroundPosition: "center",
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {contactInfoTab === "chatBubble" && (
              <motion.div
                key="tab-chatBubble"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                onScroll={hideCursorTooltip}
                className="flex flex-col p-6 overflow-y-auto flex-1 scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
              >
                <div className="grid grid-cols-4 gap-y-6 gap-x-4 justify-items-center max-w-[340px] mx-auto pb-10 pt-2">
                  {CHAT_BUBBLE_COLORS.map((bubbleItem) => {
                    const isSelected =
                      activeBubbleColor?.toLowerCase() ===
                      bubbleItem.color.toLowerCase();
                    return (
                      <button
                        key={bubbleItem.id}
                        type="button"
                        onClick={() => handleSelectBubbleColor(bubbleItem.color)}
                        onMouseEnter={(e) => updateCursorTooltip(e, bubbleItem.name)}
                        onMouseMove={(e) => updateCursorTooltip(e, bubbleItem.name)}
                        onMouseLeave={hideCursorTooltip}
                        className={`relative w-[54px] h-[54px] sm:w-[58px] sm:h-[58px] rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center ${isSelected
                          ? "ring-2 ring-white ring-offset-2 ring-offset-[#111b21] scale-100"
                          : "hover:scale-105 active:scale-95"
                          }`}
                        style={{ backgroundColor: bubbleItem.color }}
                      >
                        {isSelected && (
                          <div className="w-5.5 h-5.5 rounded-full bg-white flex items-center justify-center shadow-md pointer-events-none">
                            <MdCheck size={14} className="text-[#111b21] stroke-[1]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {contactInfoTab === "allThemes" && (
              <motion.div
                key="tab-allThemes"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                onScroll={hideCursorTooltip}
                className="flex flex-col p-4 overflow-y-auto flex-1 scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
              >
                <div className="grid grid-cols-2 gap-3.5 pb-8">
                  {CHAT_THEMES.map((themeItem) => {
                    const isSelected = activeChatThemeId === themeItem.id;
                    return (
                      <div
                        key={themeItem.id}
                        onClick={() => handleSelectTheme(themeItem.id)}
                        onMouseEnter={(e) => updateCursorTooltip(e, themeItem.name)}
                        onMouseMove={(e) => updateCursorTooltip(e, themeItem.name)}
                        onMouseLeave={hideCursorTooltip}
                        className={`relative h-[105px] rounded-[20px] overflow-hidden cursor-pointer transition-all duration-200 select-none shadow-md ${isSelected
                          ? "border-2 border-white scale-[1.01] shadow-2xl ring-2 ring-white/10"
                          : "border border-white/10 hover:border-white/30 hover:scale-[1.02]"
                          }`}
                        style={{
                          background: themeItem.gradient || themeItem.bgColor,
                          backgroundColor: themeItem.bgColor || "#0b141a",
                          backgroundImage:
                            themeItem.hasDoodles && doodlesEnabled
                              ? "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')"
                              : undefined,
                          backgroundSize: "130px",
                          backgroundBlendMode: "overlay",
                        }}
                      >
                        <div className="absolute top-3 left-3 w-11 h-4 rounded-[5px] bg-[#2a3942]/90 shadow-sm pointer-events-none" />
                        <div
                          className="absolute top-7.5 right-3 w-12 h-4 rounded-[5px] shadow-sm pointer-events-none"
                          style={{ backgroundColor: isSelected ? activeBubbleColor : themeItem.bubbleColor }}
                        />
                        {isSelected && (
                          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-[#111b21] flex items-center justify-center shadow-lg pointer-events-none">
                            <FaCheck size={11} className="stroke-[1.5]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {contactInfoTab === "wallpaper" && (
              <motion.div
                key="tab-wallpaper"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                onScroll={hideCursorTooltip}
                className="flex flex-col pt-3 p-4 overflow-y-auto flex-1 scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
              >
                <div
                  onClick={() => setContactInfoTab("solidColour")}
                  className="flex items-center justify-between p-3 mb-2.5 rounded-2xl bg-[#202c33] hover:bg-[#2a3942] cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                      <FaPen size={13} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14.5px] font-medium text-white leading-tight">Solid colour</span>
                      <span className="text-[12px] text-[#8696a0]">27 solid color wallpapers</span>
                    </div>
                  </div>
                  <MdChevronRight size={19} className="text-[#8696a0] group-hover:text-white transition-colors" />
                </div>

                <div className="flex pt-4 items-center gap-2 mb-3.5 overflow-x-auto scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-4">
                  {[
                    { id: "all", label: `All (${WALLPAPER_THEMES.length})` },
                    { id: "nature", label: `Nature (${NATURE_WALLPAPERS.length})` },
                    { id: "dark", label: "Dark & Abstract" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setWallpaperFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-full text-[12.5px] font-medium whitespace-nowrap transition-colors cursor-pointer ${wallpaperFilter === tab.id
                        ? "bg-[#00a884] text-[#111b21] font-semibold"
                        : "bg-white/5 hover:bg-white/10 text-[#8696a0] hover:text-white"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pb-8">
                  {WALLPAPER_THEMES.filter((themeItem) => {
                    if (wallpaperFilter === "nature") return Boolean(themeItem.isNature || themeItem.imageUrl);
                    if (wallpaperFilter === "dark") return !themeItem.isNature && !themeItem.imageUrl;
                    return true;
                  }).map((themeItem) => {
                    const isSelected = activeChatThemeId === themeItem.id;
                    return (
                      <div
                        key={themeItem.id}
                        onClick={() => handleSelectTheme(themeItem.id)}
                        onMouseEnter={(e) => updateCursorTooltip(e, themeItem.name)}
                        onMouseMove={(e) => updateCursorTooltip(e, themeItem.name)}
                        onMouseLeave={hideCursorTooltip}
                        className={`relative h-[126px] rounded-[18px] overflow-hidden cursor-pointer transition-all duration-200 select-none shadow-md ${isSelected
                          ? "border-2 border-white scale-[1.01] shadow-2xl ring-2 ring-white/20"
                          : "border border-white/10 hover:border-white/30 hover:scale-[1.02]"
                          }`}
                        style={{
                          backgroundColor: themeItem.bgColor || "#111b21",
                          backgroundImage: themeItem.imageUrl
                            ? `url('${themeItem.thumbnailUrl || themeItem.imageUrl}')`
                            : themeItem.gradient || undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        {!themeItem.imageUrl && themeItem.hasDoodles && (
                          <div
                            className="absolute inset-0 opacity-40 pointer-events-none"
                            style={{
                              backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                              backgroundSize: "130px",
                              backgroundBlendMode: "overlay",
                            }}
                          />
                        )}

                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="w-7 h-7 rounded-full bg-white text-[#111b21] flex items-center justify-center shadow-2xl">
                              <FaCheck size={12} className="stroke-[1.5]" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {contactInfoTab === "solidColour" && (
              <motion.div
                key="tab-solidColour"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                onScroll={hideCursorTooltip}
                className="flex flex-col overflow-y-auto flex-1 scrollbar-hide overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
              >
                <div className="flex items-center justify-between py-3.5 px-5 border-b border-[#202c33]">
                  <div className="flex items-center gap-3">
                    <LuSparkles size={20} className="text-[#8696a0]" />
                    <span className="text-[15px] font-normal text-white">WhatsApp doodles</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={doodlesEnabled}
                    onClick={() => handleToggleDoodles(!doodlesEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${doodlesEnabled ? "bg-[#00a884]" : "bg-[#374248]"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200 ${doodlesEnabled
                        ? "translate-x-5 bg-[#111b21]"
                        : "translate-x-0 bg-[#8696a0]"
                        }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3.5 p-4 pb-8">
                  {SOLID_COLOUR_THEMES.map((themeItem) => {
                    const isSelected = activeChatThemeId === themeItem.id;
                    return (
                      <div
                        key={themeItem.id}
                        onClick={() => handleSelectTheme(themeItem.id)}
                        onMouseEnter={(e) => updateCursorTooltip(e, themeItem.name)}
                        onMouseMove={(e) => updateCursorTooltip(e, themeItem.name)}
                        onMouseLeave={hideCursorTooltip}
                        className={`relative h-[105px] rounded-[20px] overflow-hidden cursor-pointer transition-all duration-200 select-none ${isSelected
                          ? "border-2 border-white scale-[1.01] shadow-xl"
                          : "border border-white/10 hover:border-white/30 hover:scale-[1.01]"
                          }`}
                        style={{
                          backgroundColor: themeItem.bgColor,
                          backgroundImage:
                            doodlesEnabled
                              ? "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')"
                              : undefined,
                          backgroundSize: "130px",
                          backgroundBlendMode: "overlay",
                        }}
                      >
                        {isSelected && (
                          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-[#111b21] flex items-center justify-center shadow-lg pointer-events-none">
                            <FaCheck size={11} className="stroke-[1.5]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {contactInfoTab === "starred" && (
              <motion.div
                key="tab-starred"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col flex-1 overflow-y-auto scrollbar-hide p-4 select-none"
              >
                {chatStarredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-16 text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center mb-4 shadow-lg">
                      <FaStar size={26} />
                    </div>
                    <h3 className={`text-[17px] font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                      No starred messages
                    </h3>
                    <p className="text-[13px] text-[#8696a0] max-w-xs leading-relaxed">
                      Tap and hold or hover over any message in this chat and select Star to save it here for quick access.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pb-8">
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span className="text-[12px] uppercase font-bold tracking-wider text-[#8696a0]">
                        {chatStarredMessages.length} Starred {chatStarredMessages.length === 1 ? "Message" : "Messages"}
                      </span>
                    </div>
                    {chatStarredMessages.map((item) => {
                      const msg = item.message || item;
                      const msgId = item.messageId || msg._id || msg.temp;
                      const isMe = String(msg.sender?._id || msg.sender) === String(user?._id);
                      const senderName = isMe ? "You" : (selectedContact?.username || "Contact");
                      const timeFormatted = msg.createdAt
                        ? format(new Date(msg.createdAt), "MMM d, yyyy 'at' p")
                        : "";

                      return (
                        <div
                          key={msgId || Math.random()}
                          className={`p-3.5 rounded-2xl border transition-all ${isDark
                            ? "bg-[#202c33] border-white/5 hover:border-white/10"
                            : "bg-white border-black/5 hover:border-black/10 shadow-sm"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`text-[12.5px] font-semibold truncate ${isMe ? "text-emerald-400" : isDark ? "text-white" : "text-gray-900"
                                  }`}
                              >
                                {senderName}
                              </span>
                              <span className="text-[11px] text-[#8696a0] shrink-0">
                                {timeFormatted}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleStarMessage(msgId, msg)}
                              title="Unstar message"
                              className="w-7 h-7 rounded-full flex items-center justify-center text-amber-400 hover:bg-amber-400/15 transition-colors cursor-pointer shrink-0"
                            >
                              <FaStar size={13} />
                            </button>
                          </div>

                          <div
                            className={`text-[13.5px] leading-relaxed break-words ${isDark ? "text-gray-200" : "text-gray-800"
                              }`}
                          >
                            {msg.content ? (
                              <p>{msg.content}</p>
                            ) : msg.messageType === "image" ? (
                              <span className="text-xs text-emerald-400 font-medium">📷 [Photo]</span>
                            ) : msg.messageType === "video" ? (
                              <span className="text-xs text-emerald-400 font-medium">🎥 [Video]</span>
                            ) : msg.messageType === "audio" ? (
                              <span className="text-xs text-emerald-400 font-medium">🎤 [Voice message]</span>
                            ) : msg.messageType === "document" ? (
                              <span className="text-xs text-emerald-400 font-medium">📄 {msg.fileName || "Document"}</span>
                            ) : msg.poll ? (
                              <span className="text-xs text-emerald-400 font-medium">📊 [Poll: {msg.poll.question}]</span>
                            ) : msg.event ? (
                              <span className="text-xs text-emerald-400 font-medium">📅 [Event: {msg.event.title}]</span>
                            ) : msg.contact ? (
                              <span className="text-xs text-emerald-400 font-medium">👤 [Contact: {msg.contact.name || "Card"}]</span>
                            ) : (
                              <span className="text-xs italic text-[#8696a0]">[Message]</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {contactInfoTab === "kept" && (
              <motion.div
                key="tab-kept"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col flex-1 overflow-y-auto scrollbar-hide p-4 select-none"
              >
                {chatKeptMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-16 text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4 shadow-lg">
                      <FaBookmark size={24} />
                    </div>
                    <h3 className={`text-[17px] font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                      No kept messages
                    </h3>
                    <p className="text-[13px] text-[#8696a0] max-w-xs leading-relaxed">
                      Anyone in this chat can keep or unkeep disappearing messages so they don&apos;t disappear for anyone.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pb-8">
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span className="text-[12px] uppercase font-bold tracking-wider text-[#8696a0]">
                        {chatKeptMessages.length} Kept {chatKeptMessages.length === 1 ? "Message" : "Messages"}
                      </span>
                    </div>
                    {chatKeptMessages.map((item) => {
                      const msg = item.message || item;
                      const msgId = item.messageId || msg._id || msg.temp;
                      const isMe = String(msg.sender?._id || msg.sender) === String(user?._id);
                      const senderName = isMe ? "You" : (selectedContact?.username || "Contact");
                      const timeFormatted = msg.createdAt
                        ? format(new Date(msg.createdAt), "MMM d, yyyy 'at' p")
                        : "";

                      return (
                        <div
                          key={msgId || Math.random()}
                          className={`p-3.5 rounded-2xl border transition-all ${isDark
                            ? "bg-[#202c33] border-white/5 hover:border-white/10"
                            : "bg-white border-black/5 hover:border-black/10 shadow-sm"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`text-[12.5px] font-semibold truncate ${isMe ? "text-emerald-400" : isDark ? "text-white" : "text-gray-900"
                                  }`}
                              >
                                {senderName}
                              </span>
                              <span className="text-[11px] text-[#8696a0] shrink-0">
                                {timeFormatted}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUnkeepMessage(msgId)}
                              title="Unkeep message"
                              className="w-7 h-7 rounded-full flex items-center justify-center text-emerald-400 hover:bg-emerald-500/15 transition-colors cursor-pointer shrink-0"
                            >
                              <FaBookmark size={13} />
                            </button>
                          </div>

                          <div
                            className={`text-[13.5px] leading-relaxed break-words ${isDark ? "text-gray-200" : "text-gray-800"
                              }`}
                          >
                            {msg.content || <span className="text-xs italic text-[#8696a0]">[Media / Attachment]</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {contactInfoTab === "advancedPrivacy" && (
              <motion.div
                key="tab-advancedPrivacy"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col flex-1 overflow-y-auto scrollbar-hide p-5 select-none"
              >
                <div className="flex flex-col gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className={`text-[15px] font-semibold mb-1.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        Protect IP address in calls
                      </h4>
                      <p className="text-[13px] text-[#8696a0] leading-relaxed">
                        To make it harder for people to infer your location, calls from this device will be securely relayed through WhatsApp servers. This will slightly reduce call quality.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={advancedPrivacy.protectIp}
                      onClick={() => handleToggleAdvancedPrivacy("protectIp")}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${advancedPrivacy.protectIp ? "bg-[#00a884]" : "bg-[#374248]"
                        }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200 ${advancedPrivacy.protectIp
                          ? "translate-x-5 bg-[#111b21]"
                          : "translate-x-0 bg-[#8696a0]"
                          }`}
                      />
                    </button>
                  </div>

                  <div className="h-px bg-white/5 w-full" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className={`text-[15px] font-semibold mb-1.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        Disable link previews
                      </h4>
                      <p className="text-[13px] text-[#8696a0] leading-relaxed">
                        To protect your IP address from being inferred by third-party websites, previews for links you send in this chat won&apos;t be generated.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={advancedPrivacy.disableLinkPreviews}
                      onClick={() => handleToggleAdvancedPrivacy("disableLinkPreviews")}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${advancedPrivacy.disableLinkPreviews ? "bg-[#00a884]" : "bg-[#374248]"
                        }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200 ${advancedPrivacy.disableLinkPreviews
                          ? "translate-x-5 bg-[#111b21]"
                          : "translate-x-0 bg-[#8696a0]"
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {contactInfoTab === "lists" && (
              <motion.div
                key="tab-lists"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col flex-1 overflow-y-auto scrollbar-hide p-5 select-none"
              >
                <p className="text-[13.5px] text-[#8696a0] leading-relaxed mb-4">
                  Select lists to add <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{selectedContact?.username || "this contact"}</span> to. You can easily filter conversations by list in your chat list.
                </p>

                <div className="flex flex-col gap-2 mb-6">
                  {Array.from(new Set([...DEFAULT_LISTS, ...customLists])).map((listName) => {
                    const isInList = contactLists.includes(listName);
                    return (
                      <div
                        key={listName}
                        onClick={() => handleToggleContactList(listName)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border ${isDark
                          ? "bg-[#202c33] border-white/5 hover:border-white/10"
                          : "bg-white border-black/5 hover:border-black/10 shadow-sm"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${listName === "Favorites"
                              ? "bg-rose-500/10 text-rose-400"
                              : "bg-emerald-500/10 text-emerald-400"
                              }`}
                          >
                            {listName === "Favorites" ? <FaHeart size={15} /> : <MdList size={18} />}
                          </div>
                          <span className={`text-[14.5px] font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                            {listName}
                          </span>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${isInList ? "bg-[#00a884] text-[#111b21]" : "border border-[#8696a0]/40"
                            }`}
                        >
                          {isInList && <FaCheck size={11} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleCreateNewList} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="New list name..."
                    maxLength={30}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-[14px] outline-none transition-all ${isDark
                      ? "bg-[#202c33] text-white placeholder-[#8696a0] border border-white/10 focus:border-[#00a884]"
                      : "bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-[#00a884]"
                      }`}
                  />
                  <button
                    type="submit"
                    disabled={!newListName.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#06cf9c] disabled:opacity-40 disabled:cursor-not-allowed text-[#111b21] font-semibold text-[13.5px] transition-all cursor-pointer shadow-sm"
                  >
                    Add
                  </button>
                </form>
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

          <BlockModal
            isOpen={showBlockModal}
            onClose={() => setShowBlockModal(false)}
            onBlock={handleConfirmBlock}
            contactName={selectedContact?.username || "contact"}
            theme={theme}
          />

          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            onReport={handleConfirmReport}
            theme={theme}
          />
          <div
            ref={cursorTooltipRef}
            className="fixed pointer-events-none z-[999999] px-2.5 py-1 rounded-md bg-[#1f2c34] text-white text-[12px] font-medium shadow-2xl border border-white/15 whitespace-nowrap backdrop-blur-md -translate-x-1/2 select-none"
            style={{
              display: "none",
              top: 0,
              left: 0,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContactInfo;
