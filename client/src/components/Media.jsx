import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSearch,
  FaPlay,
  FaVideo,
  FaCamera,
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileArchive,
  FaCheck,
  FaStar,
  FaRegStar,
} from "react-icons/fa";
import { VscSearchLarge } from "react-icons/vsc";
import { FiDownload, FiExternalLink, FiLink } from "react-icons/fi";
import { HiOutlinePhotograph } from "react-icons/hi";
import {
  MdOutlineCheckBox,
  MdCheck,
  MdOutlineContentCopy,
  MdOutlineKeyboardArrowDown,
} from "react-icons/md";
import { BsFilterLeft } from "react-icons/bs";
import { RxCross2 } from "react-icons/rx";
import { IoArrowForward } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "react-toastify";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import useLayoutStore from "../store/layoutStore";
import { useChatStore, decryptSingleMessage } from "../store/chatStore";
import axiosInstance from "../services/url.services";
import FileViewerModal from "./FileViewerModal";
import ForwardModal from "./ForwardModal";
import MediaMenu from "./MediaMenu";
import { copyImageToClipboard } from "../utils/clipboardUtils";
import { FALLBACK_DOCS, FALLBACK_LINKS, FALLBACK_MEDIA } from "../assets/rawData";

export const WhatsAppMediaFolderIcon = ({ size = 20, className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="5" width="16" height="13" rx="2.5" opacity="0.6" />
    <rect x="6" y="8" width="16" height="13" rx="2.5" />
    <circle cx="11" cy="13" r="1.5" />
    <path d="m22 17-4.5-4.5-4 4" />
  </svg>
);

const formatDocSize = (bytes) => {
  if (!bytes) return "";
  if (
    typeof bytes === "string" &&
    (bytes.includes("KB") || bytes.includes("MB") || bytes.includes("GB"))
  ) {
    return bytes;
  }
  const num = Number(bytes);
  if (isNaN(num) || num <= 0) return "";
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
};

const formatVideoDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const parseFileSize = (item) => {
  if (!item) return 0;
  const raw = item.fileSize ?? item.size ?? item.bytes;
  if (raw !== undefined && raw !== null && raw !== "") {
    if (typeof raw === "number") return raw;
    if (typeof raw === "string") {
      const clean = raw.trim().toUpperCase();
      const num = parseFloat(clean);
      if (!isNaN(num)) {
        if (clean.endsWith("GB")) return num * 1024 * 1024 * 1024;
        if (clean.endsWith("MB")) return num * 1024 * 1024;
        if (clean.endsWith("KB")) return num * 1024;
        return num;
      }
    }
  }
  if (item.mediaType === "video" || item.contentType === "video") {
    return 5 * 1024 * 1024;
  }
  if (item.mediaType === "image" || item.contentType === "image" || item.imageOrVideoUrl) {
    return 1 * 1024 * 1024;
  }
  return 0;
};

const getFileIcon = (fileName = "") => {
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") {
    return {
      icon: <FaFilePdf size={18} className="text-rose-500" />,
      bg: "bg-rose-500/10 border-rose-500/20 text-rose-500",
      label: "PDF",
    };
  }
  if (["doc", "docx", "txt", "rtf"].includes(ext)) {
    return {
      icon: <FaFileWord size={18} className="text-blue-500" />,
      bg: "bg-blue-500/10 border-blue-500/20 text-blue-500",
      label: ext.toUpperCase(),
    };
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return {
      icon: <FaFileExcel size={18} className="text-emerald-500" />,
      bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
      label: ext.toUpperCase(),
    };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return {
      icon: <FaFileArchive size={18} className="text-amber-500" />,
      bg: "bg-amber-500/10 border-amber-500/20 text-amber-500",
      label: ext.toUpperCase(),
    };
  }
  return {
    icon: <FaFileAlt size={18} className="text-gray-400" />,
    bg: "bg-gray-500/10 border-gray-500/20 text-gray-400",
    label: ext ? ext.toUpperCase() : "DOC",
  };
};

const formatDateGroup = (date) => {
  if (!date) return { primary: "Recent", sub: null, sortKey: 0 };
  const d = new Date(date);
  if (isNaN(d.getTime())) return { primary: "Recent", sub: null, sortKey: 0 };

  if (isToday(d)) {
    return {
      primary: "Today",
      sub: format(d, "d MMMM yyyy"),
      sortKey: d.getTime(),
    };
  }
  if (isYesterday(d)) {
    return {
      primary: "Yesterday",
      sub: format(d, "d MMMM yyyy"),
      sortKey: d.getTime(),
    };
  }
  return {
    primary: format(d, "MMMM yyyy"),
    sub: format(d, "d MMMM yyyy"),
    sortKey: d.getTime(),
  };
};

const calculateTotalSize = (items) => {
  let totalBytes = 0;
  items.forEach((item) => {
    let bytes = 0;
    const rawSize = item.fileSize || item.size;
    if (typeof rawSize === "number" && rawSize > 0) {
      bytes = rawSize;
    } else if (typeof rawSize === "string" && rawSize.trim()) {
      const s = rawSize.trim().toUpperCase();
      const num = parseFloat(s);
      if (!isNaN(num)) {
        if (s.includes("GB")) bytes = num * 1024 * 1024 * 1024;
        else if (s.includes("MB")) bytes = num * 1024 * 1024;
        else if (s.includes("KB")) bytes = num * 1024;
        else bytes = num;
      }
    }

    if (!bytes) {
      if (item.mediaType === "video" || item.contentType === "video") {
        bytes = 9 * 1024 * 1024;
      } else if (item.mediaType === "image" || item.contentType === "image") {
        bytes = 1.8 * 1024 * 1024;
      } else {
        bytes = 2.4 * 1024 * 1024;
      }
    }
    totalBytes += bytes;
  });

  return formatDocSize(totalBytes) || "0 MB";
};

const VideoThumbnail = ({ src, item }) => {
  const [duration, setDuration] = useState(item.duration || null);

  const handleMetadata = (e) => {
    if (e.target.duration && !isNaN(e.target.duration) && isFinite(e.target.duration)) {
      setDuration(Math.round(e.target.duration));
    }
  };

  const durStr = duration ? formatVideoDuration(duration) : item.durationStr || "0:20";

  return (
    <>
      <video
        src={src}
        preload="metadata"
        onLoadedMetadata={handleMetadata}
        className="w-full h-full object-cover pointer-events-none"
        muted
      />
      {durStr && (
        <div className="flex items-center gap-1.5 text-white text-[11px] font-medium drop-shadow-md">
          <FaVideo size={10} className="text-white/90 shrink-0" />
          <span>{durStr}</span>
        </div>
      )}
    </>
  );
};

const MediaSkeletonLoader = ({ activeTab, isDark }) => {
  return (
    <div className="space-y-6 select-none p-1">
      <div className="space-y-1.5 px-1">
        <div
          className={`h-4 w-28 rounded-md animate-skeleton-shimmer ${isDark ? "bg-[#202c33]" : "bg-gray-200"
            }`}
        />
        <div
          className={`h-3 w-36 rounded-md animate-skeleton-shimmer ${isDark ? "bg-[#202c33]/60" : "bg-gray-100"
            }`}
        />
      </div>

      {activeTab === "media" && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
          {Array.from({ length: 15 }).map((_, idx) => (
            <div
              key={idx}
              className={`aspect-square rounded-lg overflow-hidden relative animate-skeleton-shimmer ${isDark ? "bg-[#202c33]" : "bg-gray-200"
                }`}
            >
              <div className="absolute inset-x-0 bottom-0 p-2 flex flex-col gap-1.5 pointer-events-none">
                {idx % 3 === 0 && (
                  <div
                    className={`h-2.5 w-10 rounded ${isDark ? "bg-white/10" : "bg-black/10"
                      }`}
                  />
                )}
                <div
                  className={`h-2.5 w-20 rounded ${isDark ? "bg-white/10" : "bg-black/10"
                    }`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "docs" && (
        <div className="space-y-0">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx}>
              <div
                className={`flex items-center justify-between p-3 rounded-xl animate-skeleton-shimmer ${isDark ? "bg-[#202c33]/70" : "bg-white"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl ${isDark ? "bg-white/10" : "bg-gray-200"
                      }`}
                  />

                  <div className="space-y-1.5">
                    <div
                      className={`h-3.5 w-48 rounded ${isDark ? "bg-white/15" : "bg-gray-300"
                        }`}
                    />

                    <div
                      className={`h-2.5 w-24 rounded ${isDark ? "bg-white/10" : "bg-gray-200"
                        }`}
                    />
                  </div>
                </div>

                <div
                  className={`w-8 h-8 rounded-full ${isDark ? "bg-white/10" : "bg-gray-200"
                    }`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "links" && (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border space-y-2 animate-skeleton-shimmer ${isDark
                ? "bg-[#202c33]/70 border-white/5"
                : "bg-white border-gray-200"
                }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg ${isDark ? "bg-white/10" : "bg-gray-200"
                    }`}
                />
                <div
                  className={`h-3 w-28 rounded ${isDark ? "bg-emerald-500/20" : "bg-emerald-100"
                    }`}
                />
              </div>
              <div
                className={`h-3.5 w-3/4 rounded ${isDark ? "bg-white/15" : "bg-gray-300"
                  }`}
              />
              <div
                className={`h-2.5 w-1/2 rounded ${isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getSenderDisplay = (item) => {
  if (!item) return "";
  const s = item.sender;
  if (!s) return item.senderName || item.senderDisplay || "";
  if (typeof s === "string") return s;
  return (
    s.phoneNumber ||
    s.phoneSuffix ||
    s.username ||
    item.senderName ||
    item.senderDisplay ||
    ""
  );
};

const getAttachedMessage = (item) => {
  if (!item) return "";
  const content = item.content || item.caption || item.text || "";
  if (typeof content !== "string") return "";
  const trimmed = content.trim();
  if (
    !trimmed ||
    trimmed.toLowerCase() === "image" ||
    trimmed.toLowerCase() === "video" ||
    trimmed.toLowerCase() === "photo" ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return "";
  }
  if (item.isEncrypted && !item._isDecrypted) {
    return "";
  }
  return trimmed;
};

const Media = ({
  contact = null,
  chatId = null,
  onClose = null,
  mode = "page",
  scopeProp = null,
  initialTab = "media",
  hideHeader = false,
  isMobile: propIsMobile,
}) => {
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const navigate = useNavigate();

  const [isMobileState, setIsMobileState] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileState(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = propIsMobile !== undefined ? Boolean(propIsMobile) : isMobileState;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [scope, setScope] = useState(
    scopeProp || (contact || chatId ? "chat" : "all")
  );
  const [selectedContactFilter, setSelectedContactFilter] = useState(
    contact?._id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (scopeProp) {
      setScope(scopeProp);
    } else if (chatId || contact) {
      setScope("chat");
      setSelectedContactFilter(contact?._id || "");
    }
  }, [scopeProp, chatId, contact]);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sentByFilter, setSentByFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const filterRef = useRef(null);
  const searchContainerRef = useRef(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [mediaData, setMediaData] = useState({
    media: [],
    docs: [],
    links: [],
    counts: { media: 0, docs: 0, links: 0, total: 0 },
  });

  const [viewerFile, setViewerFile] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const isDark = theme === "dark";
  const storeMessages = useChatStore((state) => state.messages || []);
  const isMessageStarred = useChatStore((state) => state.isMessageStarred);
  const starredMessages = useChatStore((state) => state.starredMessages);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterMenu(false);
      }
    };
    if (showFilterMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterMenu]);

  useEffect(() => {
    if (!isSearching) return;
    const handleClickOutsideSearch = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsSearching(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideSearch);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideSearch);
  }, [isSearching]);

  useEffect(() => {
    if (!isSearching) return;
    const handleSearchEsc = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsSearching(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleSearchEsc, { capture: true });
    return () => window.removeEventListener("keydown", handleSearchEsc, { capture: true });
  }, [isSearching]);

  useEffect(() => {
    if (chatId || contact) {
      setScope("chat");
      setSelectedContactFilter(contact?._id || "");
    }
  }, [chatId, contact]);

  useEffect(() => {
    setSelectedItems([]);
  }, [activeTab]);

  const resolvedConversationId = useMemo(() => {
    if (chatId) return chatId;
    if (contact?.conversation?._id) return contact.conversation._id;
    if (contact?.conversation) return contact.conversation;
    return null;
  }, [chatId, contact]);

  const fetchMediaData = async () => {
    setLoading(true);
    try {
      const targetConv =
        scope === "chat" && (resolvedConversationId || selectedContactFilter)
          ? resolvedConversationId || selectedContactFilter
          : "all";

      const { data } = await axiosInstance.get(`/chat/media`, {
        params: {
          conversationId: targetConv,
        },
      });

      const resData = data?.data || data || {
        media: [],
        docs: [],
        links: [],
        counts: { media: 0, docs: 0, links: 0, total: 0 },
      };

      const currentUserId = user?._id?.toString();
      if (currentUserId) {
        const decryptItemSafe = async (item) => {
          if (!item) return item;
          if (!item.isEncrypted || item._isDecrypted) return item;
          try {
            return await decryptSingleMessage(
              item,
              currentUserId,
              contact,
              useChatStore.getState
            );
          } catch {
            return item;
          }
        };

        const [decMedia, decDocs, decLinks] = await Promise.all([
          Promise.all((resData.media || []).map(decryptItemSafe)),
          Promise.all((resData.docs || []).map(decryptItemSafe)),
          Promise.all((resData.links || []).map(decryptItemSafe)),
        ]);

        setMediaData({
          ...resData,
          media: decMedia,
          docs: decDocs,
          links: decLinks,
        });
      } else {
        setMediaData(resData);
      }
    } catch (error) {
      console.error("Error fetching media, docs and links:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMediaData();
  }, [scope, resolvedConversationId, selectedContactFilter]);

  useEffect(() => {
    const currentUserId = user?._id?.toString();
    if (!currentUserId) return;

    const needsMediaDec = (mediaData?.media || []).some(
      (i) => i?.isEncrypted && !i?._isDecrypted
    );
    const needsDocsDec = (mediaData?.docs || []).some(
      (i) => i?.isEncrypted && !i?._isDecrypted
    );
    const needsLinksDec = (mediaData?.links || []).some(
      (i) => i?.isEncrypted && !i?._isDecrypted
    );

    if (!needsMediaDec && !needsDocsDec && !needsLinksDec) return;

    let isMounted = true;
    const runDecryption = async () => {
      const decryptItemSafe = async (item) => {
        if (!item) return item;
        if (!item.isEncrypted || item._isDecrypted) return item;
        try {
          return await decryptSingleMessage(
            item,
            currentUserId,
            contact,
            useChatStore.getState
          );
        } catch {
          return item;
        }
      };

      const [newMedia, newDocs, newLinks] = await Promise.all([
        Promise.all((mediaData.media || []).map(decryptItemSafe)),
        Promise.all((mediaData.docs || []).map(decryptItemSafe)),
        Promise.all((mediaData.links || []).map(decryptItemSafe)),
      ]);

      if (isMounted) {
        setMediaData((prev) => ({
          ...prev,
          media: newMedia,
          docs: newDocs,
          links: newLinks,
        }));
      }
    };

    runDecryption();
    return () => {
      isMounted = false;
    };
  }, [mediaData, user?._id, contact]);

  const effectiveData = useMemo(() => {
    const rawMedia = [...(mediaData?.media || [])];
    const rawDocs = [...(mediaData?.docs || [])];
    const rawLinks = [...(mediaData?.links || [])];

    const storeMap = new Map();
    if (Array.isArray(storeMessages)) {
      storeMessages.forEach((m) => {
        if (m?._id && m._isDecrypted) {
          storeMap.set(String(m._id), m);
        }
      });
    }

    const messagesCache = useChatStore.getState()?.messagesCache;
    if (messagesCache && typeof messagesCache.forEach === "function") {
      messagesCache.forEach((cacheList) => {
        if (Array.isArray(cacheList)) {
          cacheList.forEach((m) => {
            if (m?._id && m._isDecrypted) {
              storeMap.set(String(m._id), m);
            }
          });
        }
      });
    }

    const syncWithStore = (item) => {
      if (!item) return item;
      const itemId = String(item._id || item.messageId);
      const storeItem = storeMap.get(itemId);
      if (storeItem && storeItem._isDecrypted) {
        return {
          ...item,
          content: storeItem.content,
          caption: storeItem.content,
          _isDecrypted: true,
          isEncrypted: false,
        };
      }
      return item;
    };

    const existingIds = new Set([
      ...rawMedia.map((m) => String(m._id)),
      ...rawDocs.map((d) => String(d._id)),
      ...rawLinks.map((l) => String(l.messageId || l._id)),
    ]);

    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

    if (Array.isArray(storeMessages) && storeMessages.length > 0) {
      storeMessages.forEach((msg) => {
        if (!msg || !msg._id || existingIds.has(String(msg._id))) return;
        if (msg.deletedForEveryone) return;
        const currentUserId = user?._id?.toString();
        if (
          currentUserId &&
          msg.deletedFor &&
          Array.isArray(msg.deletedFor) &&
          msg.deletedFor.some((id) => String(id) === currentUserId)
        ) {
          return;
        }

        const isVideo =
          msg.contentType === "video" ||
          Boolean(
            msg.imageOrVideoUrl &&
            msg.imageOrVideoUrl.match(/\.(mp4|webm|mov|mkv)($|\?)/i)
          );
        const isImage =
          msg.contentType === "image" ||
          Boolean(msg.imageOrVideoUrl && !isVideo);

        if (isImage || isVideo) {
          rawMedia.unshift({
            ...msg,
            mediaType: isVideo ? "video" : "image",
            url: msg.imageOrVideoUrl,
          });
        }

        const isDoc =
          msg.contentType === "document" ||
          Boolean(msg.fileName) ||
          Boolean(msg.fileUrl && !isImage && !isVideo);

        if (isDoc) {
          rawDocs.unshift({
            ...msg,
            docName: msg.fileName || msg.content || "Document",
            docUrl: msg.fileUrl || msg.imageOrVideoUrl,
            fileSize: msg.fileSize || "",
          });
        }

        if (msg.content && typeof msg.content === "string") {
          const matches = msg.content.match(urlRegex);
          if (matches && matches.length > 0) {
            matches.forEach((matchedUrl) => {
              const cleanUrl = matchedUrl.startsWith("http")
                ? matchedUrl
                : `https://${matchedUrl}`;
              let domain = "";
              try {
                domain = new URL(cleanUrl).hostname;
              } catch (e) {
                domain = cleanUrl;
              }
              rawLinks.unshift({
                _id: `${msg._id}_${cleanUrl}`,
                messageId: msg._id,
                url: cleanUrl,
                domain: domain.replace(/^www\./i, ""),
                title: msg.content,
                createdAt: msg.createdAt,
                sender: msg.sender,
                receiver: msg.receiver,
                conversation: msg.conversation,
              });
            });
          }
        }
      });
    }

    const syncedMedia = rawMedia.map(syncWithStore);
    const syncedDocs = rawDocs.map(syncWithStore);
    const syncedLinks = rawLinks.map(syncWithStore);

    const finalMedia =
      syncedMedia.length > 0
        ? syncedMedia
        : scope === "all"
          ? FALLBACK_MEDIA
          : [];
    const finalDocs =
      syncedDocs.length > 0
        ? syncedDocs
        : scope === "all"
          ? FALLBACK_DOCS
          : [];
    const finalLinks =
      syncedLinks.length > 0
        ? syncedLinks
        : scope === "all"
          ? FALLBACK_LINKS
          : [];

    return {
      media: finalMedia,
      docs: finalDocs,
      links: finalLinks,
    };
  }, [mediaData, storeMessages, user?._id, scope]);

  const isFromYou = (item) => {
    if (!item) return false;
    if (item.isOutgoing) return true;
    if (item.sender === "You" || item.sender?.username === "You") return true;

    const currentUserId = String(user?._id || user?.id || "");
    const currentUserPhone = String(user?.phoneNumber || user?.phone || "");
    const currentUsername = String(user?.username || "").toLowerCase();

    const senderId = String(
      item.sender?._id ||
      item.sender?.id ||
      (typeof item.sender === "string" ? item.sender : "") ||
      ""
    );
    if (currentUserId && senderId === currentUserId) return true;

    const senderPhone = String(item.sender?.phoneNumber || item.sender?.phone || "");
    if (currentUserPhone && senderPhone && senderPhone === currentUserPhone) return true;

    const senderName = String(item.sender?.username || (typeof item.sender === "string" ? item.sender : "") || "").toLowerCase();
    if (currentUsername && senderName && senderName === currentUsername) return true;

    return false;
  };

  const filteredItems = useMemo(() => {
    let list = effectiveData[activeTab] || [];

    // Filter by Sent by: All / You / Others
    if (sentByFilter === "you") {
      list = list.filter((item) => isFromYou(item));
    } else if (sentByFilter === "others") {
      list = list.filter((item) => !isFromYou(item));
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    if (activeTab === "media") {
      return list.filter((item) => {
        const senderName = item.sender?.username?.toLowerCase() || "";
        const content = item.content?.toLowerCase() || "";
        return senderName.includes(q) || content.includes(q);
      });
    }
    if (activeTab === "docs") {
      return list.filter((item) => {
        const name = (item.docName || item.fileName || "").toLowerCase();
        const senderName = item.sender?.username?.toLowerCase() || "";
        return name.includes(q) || senderName.includes(q);
      });
    }
    if (activeTab === "links") {
      return list.filter((item) => {
        const url = (item.url || "").toLowerCase();
        const domain = (item.domain || "").toLowerCase();
        const title = (item.title || "").toLowerCase();
        return url.includes(q) || domain.includes(q) || title.includes(q);
      });
    }
    return list;
  }, [effectiveData, activeTab, sentByFilter, searchQuery, user]);

  const groupedItems = useMemo(() => {
    if (sortBy === "largest") {
      const sorted = [...filteredItems].sort((a, b) => {
        const sizeA = parseFileSize(a);
        const sizeB = parseFileSize(b);
        if (sizeB !== sizeA) return sizeB - sizeA;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      return [
        {
          primary: "Largest files",
          sub: `${sorted.length} item${sorted.length === 1 ? "" : "s"}`,
          items: sorted,
        },
      ];
    }

    const groups = {};
    filteredItems.forEach((item) => {
      const { primary, sub, sortKey } = formatDateGroup(item.createdAt);
      const groupKey = `${primary}_${sub || ""}`;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          primary,
          sub,
          sortKey,
          items: [],
        };
      }
      groups[groupKey].items.push(item);
    });

    const groupList = Object.values(groups);
    if (sortBy === "oldest") {
      groupList.sort((a, b) => (a.sortKey || 0) - (b.sortKey || 0));
      groupList.forEach((g) => {
        g.items.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      });
    } else {
      // "newest"
      groupList.sort((a, b) => (b.sortKey || 0) - (a.sortKey || 0));
      groupList.forEach((g) => {
        g.items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      });
    }

    return groupList;
  }, [filteredItems, sortBy]);

  const toggleSelectItem = (item) => {
    setSelectedItems((prev) => {
      const itemId = item.messageId || item._id;
      const exists = prev.some(
        (i) => (i.messageId || i._id) === itemId
      );
      if (exists) {
        return prev.filter(
          (i) => (i.messageId || i._id) !== itemId
        );
      } else {
        return [...prev, item];
      }
    });
  };

  const handleOpenViewer = (item) => {
    if (isSelectMode) {
      toggleSelectItem(item);
      return;
    }

    const attachedMsg = getAttachedMessage(item);

    if (activeTab === "media") {
      const isVideo = item.mediaType === "video";
      const mediaList = mediaData?.media || [];
      const idx = mediaList.findIndex(
        (m) => (m.messageId || m._id) === (item.messageId || item._id)
      );
      setViewerFile({
        name: attachedMsg || (isVideo ? "Video" : "Photo"),
        caption: attachedMsg,
        url: item.url || item.imageOrVideoUrl,
        type: isVideo ? "video/mp4" : "image/jpeg",
        createdAt: item.createdAt,
        sender: item.sender,
        messageId: item.messageId || item._id,
        items: mediaList,
        initialIndex: idx >= 0 ? idx : 0,
      });
      setShowViewer(true);
    } else if (activeTab === "docs") {
      const docName =
        item.docName ||
        item.fileName ||
        (item._isDecrypted ? item.content : "Document");
      const docsList = mediaData?.docs || [];
      const idx = docsList.findIndex(
        (d) => (d.messageId || d._id) === (item.messageId || item._id)
      );
      setViewerFile({
        name: docName,
        caption: attachedMsg,
        url: item.docUrl || item.fileUrl || item.imageOrVideoUrl,
        type: "pdf",
        createdAt: item.createdAt,
        sender: item.sender,
        messageId: item.messageId || item._id,
        items: docsList,
        initialIndex: idx >= 0 ? idx : 0,
      });
      setShowViewer(true);
    }
  };

  const handleCopyLink = (url, id) => {
    if (!url) return;
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadFile = async (e, url, fileName) => {
    if (e) e.stopPropagation();
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const bUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = bUrl;
      a.download = fileName || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(bUrl);
      toast.success("Download started");
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleCopyMedia = async (item) => {
    const url = item?.url || item?.imageOrVideoUrl || item?.docUrl || item?.fileUrl;
    const isVideo =
      item?.mediaType === "video" ||
      item?.contentType === "video" ||
      Boolean(url && url.match(/\.(mp4|webm|mov|mkv)($|\?)/i));

    const isImage =
      !isVideo &&
      (item?.mediaType === "image" ||
        item?.contentType === "image" ||
        Boolean(item?.imageOrVideoUrl) ||
        Boolean(url && url.match(/\.(jpe?g|png|gif|webp|bmp|svg)($|\?)/i)) ||
        activeTab === "media");

    if (isImage && url) {
      try {
        await copyImageToClipboard(url);
        toast.success("Image copied to clipboard");
      } catch (err) {
        console.error("Failed to copy image to clipboard:", err);
        toast.error("Failed to copy image to clipboard");
      }
      return;
    }

    if (item.url && !item.imageOrVideoUrl && !item.docUrl) {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(item.url);
        toast.success("Link copied to clipboard");
        return;
      }
    }

    const attached = getAttachedMessage(item);
    const textToCopy = attached || url || item?.docName || "";
    if (textToCopy && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(textToCopy);
      toast.success(
        attached
          ? "Caption copied to clipboard"
          : isVideo
            ? "Video link copied to clipboard"
            : "Copied to clipboard"
      );
    } else {
      toast.info("Copied");
    }
  };

  const handleMenuCopy = (item) => {
    handleCopyMedia(item);
  };

  const handleMenuSelect = (item) => {
    setIsSelectMode(true);
    toggleSelectItem(item);
  };

  const handleMenuGoToMessage = (item) => {
    const msgId = item.messageId || item._id;
    if (contact) {
      useLayoutStore.getState().setSelectedContact(contact);
    }
    if (onClose) onClose();
    navigate("/");
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("scroll-to-message", { detail: { messageId: msgId } })
      );
    }, 300);
  };

  const handleMenuReply = (item) => {
    if (contact) {
      useLayoutStore.getState().setSelectedContact(contact);
    }
    if (onClose) onClose();
    navigate("/");
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("start-reply-message", { detail: { message: item } })
      );
    }, 300);
  };

  const handleMenuReplyPrivately = (item) => {
    const senderId = (item.sender?._id || item.sender)?.toString();
    const currentUserId = user?._id?.toString();
    const userList = useChatStore.getState()?.users || [];
    const targetPeerId = senderId === currentUserId ? (item.receiver?._id || item.receiver)?.toString() : senderId;
    const peerContact = userList.find((u) => u._id?.toString() === targetPeerId) || contact;

    if (peerContact) {
      useLayoutStore.getState().setSelectedContact(peerContact);
    }
    if (onClose) onClose();
    navigate("/");
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("start-reply-message", { detail: { message: item } })
      );
    }, 300);
  };

  const handleMenuDownload = (item) => {
    const url = item.url || item.imageOrVideoUrl || item.docUrl || item.fileUrl;
    const name =
      item.fileName ||
      item.docName ||
      (item.mediaType === "video" ? "video.mp4" : "image.jpg");
    handleDownloadFile(null, url, name);
  };

  const handleMenuForward = (item) => {
    setSelectedItems([item]);
    setShowForwardModal(true);
  };

  const handleMenuToggleStar = (item) => {
    const id = item.messageId || item._id;
    const { toggleStarMessage } = useChatStore.getState();
    toggleStarMessage(id, item);
    toast.success(isMessageStarred(id) ? "Message unstarred" : "Message starred");
  };

  const handleMenuDelete = (item) => {
    setSelectedItems([item]);
    setShowDeleteModal(true);
  };

  const handleCancelSelect = () => {
    setIsSelectMode(false);
    setSelectedItems([]);
  };

  const areAllStarred = useMemo(() => {
    if (!selectedItems.length) return false;
    return selectedItems.every((item) =>
      isMessageStarred(item.messageId || item._id)
    );
  }, [selectedItems, isMessageStarred, starredMessages]);

  const handleStarSelected = () => {
    const { toggleStarMessage } = useChatStore.getState();
    if (areAllStarred) {
      selectedItems.forEach((item) => {
        const id = item.messageId || item._id;
        if (isMessageStarred(id)) {
          toggleStarMessage(id, item);
        }
      });
      toast.success(
        `Unstarred ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""
        }`
      );
    } else {
      selectedItems.forEach((item) => {
        const id = item.messageId || item._id;
        if (!isMessageStarred(id)) {
          toggleStarMessage(id, item);
        }
      });
      toast.success(
        `Starred ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""
        }`
      );
    }
  };

  const handleDownloadSelected = async () => {
    toast.info(
      `Downloading ${selectedItems.length} file${selectedItems.length > 1 ? "s" : ""
      }...`
    );
    for (const item of selectedItems) {
      const url =
        item.url || item.imageOrVideoUrl || item.docUrl || item.fileUrl;
      const name =
        item.fileName ||
        item.docName ||
        (item.mediaType === "video" ? "video.mp4" : "image.jpg");
      if (url) {
        await handleDownloadFile(null, url, name);
      }
    }
  };

  const handleForwardSelected = () => {
    if (!selectedItems.length) return;
    setShowForwardModal(true);
  };
  const canDeleteForEveryone = useMemo(() => {
    if (!selectedItems.length) return false;
    const currentUserId = String(user?._id || user?.id);
    return selectedItems.every(
      (item) => String(item.sender?._id || item.sender) === currentUserId
    );
  }, [selectedItems, user?._id]);

  const executeDeleteSelected = async (deleteFor) => {
    setIsDeleting(true);
    try {
      const deleteMessage = useChatStore.getState().deleteMessage;
      for (const item of selectedItems) {
        const msgId = item.messageId || item._id;
        if (msgId) {
          await deleteMessage(msgId, deleteFor);
        }
      }

      const deletedIds = new Set(
        selectedItems.map((item) => String(item.messageId || item._id))
      );
      setMediaData((prev) => ({
        ...prev,
        media: (prev?.media || []).filter(
          (m) => !deletedIds.has(String(m._id))
        ),
        docs: (prev?.docs || []).filter(
          (d) => !deletedIds.has(String(d._id))
        ),
        links: (prev?.links || []).filter(
          (l) => !deletedIds.has(String(l.messageId || l._id))
        ),
      }));

      toast.success(
        `Deleted ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""
        }`
      );
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete some items");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setIsSelectMode(false);
      setSelectedItems([]);
    }
  };

  const selectedTotalSize = useMemo(() => {
    return calculateTotalSize(selectedItems);
  }, [selectedItems]);

  const tabs = [
    { id: "media", label: "Media" },
    { id: "docs", label: "Docs" },
    { id: "links", label: "Links" },
  ];

  return (
    <div
      className={`flex flex-col h-full w-full select-none relative overflow-hidden ${isDark ? "bg-[#21292e] text-[#e9edef]" : "bg-white text-gray-900"
        }`}
    >
      {!hideHeader && (
        <div
          className={`h-[60px] px-4 sm:px-6 flex items-center justify-between border-b shrink-0 z-20 ${isDark
            ? "bg-[#202c33] border-[#222d34] text-white"
            : "bg-white border-gray-200 text-gray-800"
            }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {(mode === "drawer" || (isMobile && mode !== "modal")) && (
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  else navigate(-1);
                }}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
                  ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                title="Back"
              >
                <FaArrowLeft size={16} />
              </button>
            )}

            <div className="flex flex-col min-w-0">
              <h2 className="text-[17px] font-semibold tracking-tight truncate leading-tight">
                Media
              </h2>
              <span
                className={`text-[12px] truncate ${isDark ? "text-[#8696a0]" : "text-gray-500"
                  }`}
              >
                {scope === "all"
                  ? "Media from all chats"
                  : contact?.username
                    ? `Media from ${contact.username}`
                    : "Media from this chat"}
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isSearching ? (
              <motion.div
                key="media-search-pill"
                ref={searchContainerRef}
                initial={{ opacity: 0, scale: 0.96, x: 8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.96, x: 8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="flex-1 max-w-[460px] ml-auto mr-2 sm:mr-3"
              >
                <div
                  className={`flex items-center h-[38px] px-3.5 rounded-full border transition-all ${isDark
                    ? "bg-[#111b21] border-[#00a884] text-[#e9edef]"
                    : "bg-white border-[#00a884] text-gray-900 shadow-sm"
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearching(false);
                      setSearchQuery("");
                    }}
                    className={`shrink-0 mr-2.5 transition-colors cursor-pointer ${isDark ? "text-[#8696a0] hover:text-[#00a884]" : "text-gray-400 hover:text-[#00a884]"
                      }`}
                    title="Close search (Esc)"
                  >
                    <FaSearch size={13} />
                  </button>
                  <input
                    type="text"
                    autoFocus
                    placeholder={
                      activeTab === "media"
                        ? "Search by sender or caption"
                        : activeTab === "docs"
                          ? "Search by filename or sender"
                          : "Search by link or sender"
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        setIsSearching(false);
                        setSearchQuery("");
                      }
                    }}
                    className={`bg-transparent text-[13.5px] outline-none border-none w-full ${isDark
                      ? "text-[#e9edef] placeholder-[#8696a0]"
                      : "text-gray-900 placeholder-gray-400"
                      }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="p-0.5 text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer shrink-0 ml-1"
                      title="Clear text"
                    >
                      <RxCross2 size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="media-tabs-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-6 sm:gap-10 h-full"
              >
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`h-full flex items-center justify-center relative px-1 sm:px-2 text-[14.5px] font-medium transition-colors cursor-pointer ${isActive
                        ? "text-[#00a884] font-semibold"
                        : isDark
                          ? "text-[#8696a0] hover:text-[#d1d7db]"
                          : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                      <span>{tab.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="media-active-tab-indicator"
                          className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00a884] rounded-t-full"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {!isSearching && (
              <button
                type="button"
                onClick={() => setIsSearching(true)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
                  ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                title="Search"
              >
                <VscSearchLarge size={15} />
              </button>
            )}

            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setShowFilterMenu((prev) => !prev)}
                className={`p-2 rounded-full transition-colors cursor-pointer relative ${sentByFilter !== "all" || sortBy !== "newest" || showFilterMenu
                  ? "text-[#00a884] bg-emerald-500/10"
                  : isDark
                    ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                title="Filter and Sort"
              >
                <BsFilterLeft size={22} />
                {(sentByFilter !== "all" || sortBy !== "newest") && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00a884] ring-2 ring-[#202c33]" />
                )}
              </button>

              <AnimatePresence>
                {showFilterMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className={`absolute left-[-61px] right-0 top-full mt-2 w-[210px] rounded-2xl shadow-2xl border p-2 z-50 select-none ${isDark
                      ? "bg-[#182229] border-white/10 text-white shadow-black/80"
                      : "bg-white border-gray-200 text-gray-900 shadow-2xl"
                      }`}
                  >
                    <div className="px-3 pt-2 pb-1.5 text-[13px] font-semibold text-[#8696a0]">
                      Sent by
                    </div>

                    <div className="space-y-0.5">
                      {[
                        { id: "all", label: "All" },
                        { id: "you", label: "You" },
                        { id: "others", label: "Others" },
                      ].map((opt) => {
                        const isSelected = sentByFilter === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSentByFilter(opt.id)}
                            className={`w-full flex items-center gap-3.5 px-3 py-2 rounded-xl cursor-pointer transition-colors ${isDark
                              ? "hover:bg-white/5 active:bg-white/10"
                              : "hover:bg-gray-100 active:bg-gray-200"
                              }`}
                          >
                            <div
                              className={`w-[19px] h-[19px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected
                                ? isDark
                                  ? "border-white"
                                  : "border-[#111b21]"
                                : isDark
                                  ? "border-white/80"
                                  : "border-gray-500"
                                }`}
                            >
                              {isSelected && (
                                <div
                                  className={`w-[9px] h-[9px] rounded-full ${isDark ? "bg-white" : "bg-[#111b21]"
                                    }`}
                                />
                              )}
                            </div>
                            <span
                              className={`text-[15px] font-medium leading-none ${isDark ? "text-white" : "text-gray-900"
                                }`}
                            >
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div
                      className={`my-2 border-t ${isDark ? "border-[#2a3942]" : "border-gray-200"
                        }`}
                    />
                    <div className="px-3 pt-1 pb-1.5 text-[13px] font-semibold text-[#8696a0]">
                      Sort by
                    </div>

                    <div className="space-y-0.5">
                      {[
                        { id: "newest", label: "Newest" },
                        { id: "oldest", label: "Oldest" },
                        { id: "largest", label: "Largest" },
                      ].map((opt) => {
                        const isSelected = sortBy === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSortBy(opt.id)}
                            className={`w-full flex items-center gap-3.5 px-3 py-2 rounded-xl cursor-pointer transition-colors ${isDark
                              ? "hover:bg-white/5 active:bg-white/10"
                              : "hover:bg-gray-100 active:bg-gray-200"
                              }`}
                          >
                            <div
                              className={`w-[19px] h-[19px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected
                                ? isDark
                                  ? "border-white"
                                  : "border-[#111b21]"
                                : isDark
                                  ? "border-white/80"
                                  : "border-gray-500"
                                }`}
                            >
                              {isSelected && (
                                <div
                                  className={`w-[9px] h-[9px] rounded-full ${isDark ? "bg-white" : "bg-[#111b21]"
                                    }`}
                                />
                              )}
                            </div>
                            <span
                              className={`text-[15px] font-medium leading-none ${isDark ? "text-white" : "text-gray-900"
                                }`}
                            >
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isSelectMode ? (
              <button
                type="button"
                onClick={handleCancelSelect}
                className="text-[14px] font-medium text-[#00a884] hover:text-[#06cf9c] px-2 py-1 rounded transition-colors cursor-pointer select-none"
              >
                Cancel
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsSelectMode(true)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
                    ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    }`}
                  title="Select"
                >
                  <MdOutlineCheckBox size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onClose) onClose();
                    else navigate(-1);
                  }}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
                    ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    }`}
                  title="Close"
                >
                  <RxCross2 size={19} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {!loading && filteredItems.length > 0 && activeTab === "docs" ? (
        <div
          className={`flex items-center justify-between px-6 sm:px-8 py-2.5 text-[11.5px] font-semibold uppercase tracking-wider border-y select-none shrink-0 transition-colors ${isDark
            ? "bg-[#111b21] border-[#4b555b] text-[#8696a0]"
            : "bg-[#f0f2f5] border-gray-200 text-gray-500"
            }`}
        >
          <div className="w-[45%] sm:w-[40%] flex items-center pl-7 sm:pl-8">
            <span>Doc</span>
          </div>
          <div className="hidden md:flex flex-1 items-center justify-center px-4 text-center">
            <span>Caption</span>
          </div>
          <div className="w-[35%] sm:w-[25%] flex items-center justify-end pr-14 sm:pr-18">
            <span>Sent by</span>
          </div>
        </div>
      ) : !loading && filteredItems.length > 0 && activeTab === "links" ? (
        <div
          className={`flex items-center justify-between px-6 sm:px-8 py-2.5 text-[11.5px] font-semibold uppercase tracking-wider border-b select-none shrink-0 transition-colors ${isDark
            ? "bg-[#111b21] border-[#222d34] text-[#8696a0]"
            : "bg-[#f0f2f5] border-gray-200 text-gray-500"
            }`}
        >
          <div className="w-[45%] sm:w-[40%] flex items-center pl-7 sm:pl-8">
            <span>Link</span>
          </div>
          <div className="hidden md:flex flex-1 items-center justify-center px-4 text-center">
            <span>Message</span>
          </div>
          <div className="w-[35%] sm:w-[25%] flex items-center justify-end pr-16 sm:pr-22">
            <span>Sent by</span>
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 pb-20">
        {loading ? (
          <MediaSkeletonLoader activeTab={activeTab} isDark={isDark} />
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center px-6 select-none">
            <h4
              className={`text-[20px] font-bold mb-1.5 ${isDark ? "text-white" : "text-gray-800"
                }`}
            >
              {searchQuery
                ? `No ${activeTab} found`
                : sentByFilter !== "all"
                  ? `No ${activeTab} sent by ${sentByFilter === "you" ? "you" : "others"}`
                  : activeTab === "media"
                    ? "No media"
                    : activeTab === "docs"
                      ? "No docs"
                      : "No links"}
            </h4>

            <p
              className={`text-[14px] max-w-[280px] leading-relaxed mb-6 ${isDark ? "text-[#8696a0]" : "text-gray-500"
                }`}
            >
              {searchQuery
                ? `No results matching "${searchQuery}"`
                : scope === "chat"
                  ? `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                  } shared in this chat will appear here.`
                  : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                  } shared in your chats will appear here.`}
            </p>

            {scope === "chat" && (
              <button
                type="button"
                onClick={() => {
                  setScope("all");
                  setSelectedContactFilter("");
                }}
                className="flex items-center gap-2 text-[#00a884] hover:text-[#06cf9c] font-medium text-[15px] transition-colors cursor-pointer group hover:underline"
              >
                {activeTab === "media" ? (
                  <HiOutlinePhotograph
                    size={19}
                    className="transition-transform group-hover:scale-110"
                  />
                ) : activeTab === "docs" ? (
                  <FaFileAlt
                    size={16}
                    className="transition-transform group-hover:scale-110"
                  />
                ) : (
                  <FiLink
                    size={17}
                    className="transition-transform group-hover:scale-110"
                  />
                )}
                <span>
                  {activeTab === "media"
                    ? "View media from all chats"
                    : activeTab === "docs"
                      ? "View docs from all chats"
                      : "View links from all chats"}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedItems.map((group) => {
              const { primary, sub, items } = group;
              return (
                <div key={`${primary}_${sub || ""}`} className="space-y-2">
                  <div className="space-y-0.5 mb-2.5 px-0.5">
                    <h4
                      className={`text-[15px] font-semibold leading-tight ${isDark ? "text-[#e9edef]" : "text-gray-900"
                        }`}
                    >
                      {primary}
                    </h4>
                    {sub && (
                      <p
                        className={`text-[12px] leading-tight ${isDark ? "text-[#8696a0]" : "text-gray-500"
                          }`}
                      >
                        {sub}
                      </p>
                    )}
                  </div>

                  {activeTab === "media" && (
                    <div
                      className={`grid ${mode === "modal"
                        ? "grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4"
                        : "grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5"
                        } gap-2 sm:gap-2.5`}
                    >
                      {items.map((item) => {
                        const isVideo = item.mediaType === "video";
                        const itemId = item.messageId || item._id;
                        const isSelected = selectedItems.some(
                          (i) => (i.messageId || i._id) === itemId
                        );
                        const isStarred = Boolean(
                          item.isStarred ||
                          item.starred ||
                          (isMessageStarred && isMessageStarred(itemId)) ||
                          starredMessages?.[itemId]
                        );
                        const senderDisplay = getSenderDisplay(item);
                        const attachedMessage = getAttachedMessage(item);
                        const hoverText = attachedMessage || (isVideo ? "Video" : "Photo");

                        return (
                          <div
                            key={itemId}
                            onClick={() => {
                              if (isSelectMode) {
                                toggleSelectItem(item);
                              } else {
                                handleOpenViewer(item);
                              }
                            }}
                            onContextMenu={(e) => {
                              if (isSelectMode) return;
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveMenu({
                                item,
                                position: {
                                  top: e.clientY + 4,
                                  left: e.clientX,
                                  buttonTop: e.clientY,
                                },
                              });
                            }}
                            title={hoverText}
                            className={`relative aspect-square rounded-lg overflow-hidden group cursor-pointer transition-all duration-200 select-none shadow-xs border-2 ${isDark ? "bg-[#202c33]" : "bg-gray-200"
                              } ${isSelected
                                ? "border-[#00a884] ring-2 ring-[#00a884]/40 brightness-95"
                                : "border-transparent hover:border-[#00a884] hover:brightness-105"
                              }`}
                          >
                            <div
                              className={`absolute top-2 left-2 z-20 transition-all ${isSelectMode || isSelected
                                ? "opacity-100 scale-100"
                                : "opacity-0 group-hover:opacity-100 scale-100"
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isSelectMode) setIsSelectMode(true);
                                toggleSelectItem(item);
                              }}
                            >
                              {isSelected ? (
                                <div className="w-[19px] h-[19px] rounded-[4px] bg-[#00a884] text-[#111b21] flex items-center justify-center font-bold shadow-md transition-transform active:scale-90">
                                  <FaCheck size={11} className="stroke-[2]" />
                                </div>
                              ) : (
                                <div className="w-[19px] h-[19px] rounded-[4px] border-[1.8px] border-white/85 bg-black/35 backdrop-blur-xs flex items-center justify-center group-hover:border-[#00a884] hover:border-[#00a884] transition-all active:scale-90" />
                              )}
                            </div>

                            {!isSelectMode && (
                              <div
                                className={`absolute top-1 right-1 z-20 flex items-center justify-center rounded-full border p-1 cursor-pointer transition-all ${(activeMenu?.item?.messageId || activeMenu?.item?._id) === itemId
                                  ? "opacity-100 bg-black/50 backdrop-blur-xs border-white/25 text-white shadow-md scale-105"
                                  : "opacity-0 group-hover:opacity-100 border-transparent hover:bg-black/30 hover:backdrop-blur-xs hover:border-white/10 text-white"
                                  }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setActiveMenu((prev) =>
                                    (prev?.item?.messageId || prev?.item?._id) === itemId
                                      ? null
                                      : {
                                        item,
                                        position: {
                                          top: rect.bottom + 4,
                                          left: rect.right - 210,
                                          buttonTop: rect.top,
                                        },
                                      }
                                  );
                                }}
                                title="Menu"
                              >
                                <MdOutlineKeyboardArrowDown size={20} />
                              </div>
                            )}

                            {isVideo ? (
                              <VideoThumbnail
                                src={item.url || item.imageOrVideoUrl}
                                item={item}
                              />
                            ) : (
                              <div className="relative w-full h-full overflow-hidden rounded-xl group">
                                <img
                                  src={item.url || item.imageOrVideoUrl}
                                  alt=""
                                  loading="lazy"
                                  className="w-full h-full object-fill transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                  <div
                                    className="absolute inset-y-0 -left-[150%] w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/40 to-transparent backdrop-blur-[2px] opacity-0 transition-all duration-700 ease-in-out group-hover:left-[150%] group-hover:opacity-100"
                                  />
                                </div>
                              </div>
                            )}

                            {isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center shadow-lg backdrop-blur-xs group-hover:scale-110 transition-transform">
                                  <FaPlay size={11} className="ml-0.5" />
                                </div>
                              </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 p-2 sm:p-2.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end text-white pointer-events-none">
                              <div className="flex items-center justify-between w-full min-w-0">
                                {senderDisplay && (
                                  <span className="text-[11.5px] sm:text-[12px] font-medium truncate text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] leading-tight">
                                    {senderDisplay}
                                  </span>
                                )}
                                {isStarred && (
                                  <div className="shrink-0 ml-auto pl-1.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] flex items-center">
                                    <FaStar size={11} className="text-white fill-white" />
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100 transition-all duration-200">
                                <div className="overflow-hidden">
                                  {attachedMessage ? (
                                    <p className="text-[11.5px] sm:text-[12px] font-medium text-white line-clamp-2 leading-tight drop-shadow-md mt-1">
                                      {attachedMessage}
                                    </p>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/90 drop-shadow-md mt-1">
                                      {isVideo ? <FaVideo size={9} /> : <FaCamera size={9} />}
                                      <span>{isVideo ? "Video" : "Photo"}</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeTab === "docs" && (
                    <div className="space-y-1.5">
                      {items.map((item) => {
                        const itemId = item.messageId || item._id;
                        const isSelected = selectedItems.some(
                          (i) => (i.messageId || i._id) === itemId
                        );
                        const isStarred = Boolean(
                          item.isStarred ||
                          item.starred ||
                          (isMessageStarred && isMessageStarred(itemId)) ||
                          starredMessages?.[itemId]
                        );
                        const docName =
                          item.docName || item.fileName || "Document";
                        const iconInfo = getFileIcon(docName);
                        const docUrl = item.docUrl || item.fileUrl || item.url;
                        const sizeStr = formatDocSize(item.fileSize);
                        const dateDisplay = item.createdAt
                          ? format(new Date(item.createdAt), "dd/MM/yyyy")
                          : "";
                        const attachedMessage = getAttachedMessage(item);
                        const senderName = item.sender?.username || getSenderDisplay(item) || "Unknown";

                        return (
                          <div
                            key={itemId}
                            onClick={() => {
                              if (isSelectMode) {
                                toggleSelectItem(item);
                              } else {
                                handleOpenViewer(item);
                              }
                            }}
                            onContextMenu={(e) => {
                              if (isSelectMode) return;
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveMenu({
                                item,
                                position: {
                                  top: e.clientY + 4,
                                  left: Math.max(10, Math.min(window.innerWidth - 220, e.clientX - 100)),
                                  buttonTop: e.clientY,
                                },
                              });
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer group select-none ${isSelected
                              ? isDark
                                ? "bg-emerald-500/15"
                                : "bg-emerald-50"
                              : isDark
                                ? "bg-[#202c33]/70 hover:bg-[#28363e]"
                                : "bg-white hover:bg-[#e0e6ea] shadow-xs"
                              }`}
                          >
                            <div className="w-[45%] sm:w-[40%] flex items-center gap-3 min-w-0 pr-3">
                              <div
                                className={`shrink-0 transition-opacity duration-150 ${isSelectMode || isSelected
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-100"
                                  }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isSelectMode) setIsSelectMode(true);
                                  toggleSelectItem(item);
                                }}
                              >
                                {isSelected ? (
                                  <div className="w-[19px] h-[19px] rounded-[4px] bg-[#00a884] text-[#111b21] flex items-center justify-center font-bold shadow-md">
                                    <FaCheck size={11} className="stroke-[2]" />
                                  </div>
                                ) : (
                                  <div className={`w-[19px] h-[19px] rounded-[4px] border-[1.8px] ${isDark ? "border-[#8696a0]/60 bg-black/20" : "border-gray-400 bg-white"} group-hover:border-[#00a884] hover:border-[#00a884] transition-colors`} />
                                )}
                              </div>

                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${iconInfo.bg}`}
                              >
                                {iconInfo.icon}
                              </div>

                              <div className="flex flex-col min-w-0">
                                <span className="text-[14px] font-medium truncate leading-tight group-hover:text-emerald-500 transition-colors">
                                  {docName}
                                </span>
                                <div
                                  className={`flex items-center gap-1.5 text-[11.5px] mt-1 ${isDark ? "text-[#8696a0]" : "text-gray-500"
                                    }`}
                                >
                                  {sizeStr && <span>{sizeStr}</span>}
                                  {sizeStr && <span>•</span>}
                                  <span>{iconInfo.label}</span>
                                </div>
                              </div>
                            </div>

                            <div className="hidden md:flex flex-1 items-center justify-center px-4 min-w-0">
                              <span
                                className={`text-[13px] truncate text-center max-w-[280px] ${attachedMessage
                                  ? isDark
                                    ? "text-[#d1d7db]"
                                    : "text-gray-700"
                                  : "text-[#8696a0]/40"
                                  }`}
                                title={attachedMessage || ""}
                              >
                                {attachedMessage || "—"}
                              </span>
                            </div>

                            <div className="w-[35%] sm:w-[25%] flex items-center justify-end gap-2 shrink-0">
                              <div className="flex flex-col items-end min-w-0 max-w-[120px] sm:max-w-[140px]">
                                <span className={`text-[12.5px] font-medium truncate w-full text-right ${isDark ? "text-[#e9edef]" : "text-gray-800"}`} title={senderName}>
                                  {senderName}
                                </span>
                                {dateDisplay && (
                                  <div className={`flex items-center gap-1 text-[11px] mt-0.5 ${isDark ? "text-[#8696a0]" : "text-gray-500"}`}>
                                    {isStarred && (
                                      <FaStar size={10} className={`${isDark ? "text-white/80" : "text-gray-600"} shrink-0`} />
                                    )}
                                    <span>{dateDisplay}</span>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={(e) =>
                                  handleDownloadFile(e, docUrl, docName)
                                }
                                className={`p-2 rounded-full transition-colors ${isDark
                                  ? "hover:bg-white/10 text-[#8696a0] hover:text-white"
                                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                                  }`}
                                title="Download"
                              >
                                <FiDownload size={16} />
                              </button>

                              {!isSelectMode && (
                                <div
                                  className={`p-1.5 rounded-full cursor-pointer transition-all ${(activeMenu?.item?.messageId || activeMenu?.item?._id) === itemId
                                    ? "opacity-100 bg-black/40 text-white shadow-md scale-105"
                                    : "opacity-0 group-hover:opacity-100 hover:bg-black/20 text-[#8696a0] hover:text-white"
                                    }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setActiveMenu((prev) =>
                                      (prev?.item?.messageId || prev?.item?._id) === itemId
                                        ? null
                                        : {
                                          item,
                                          position: {
                                            top: rect.bottom + 4,
                                            left: Math.max(10, rect.right - 210),
                                            buttonTop: rect.top,
                                          },
                                        }
                                    );
                                  }}
                                  title="Menu"
                                >
                                  <MdOutlineKeyboardArrowDown size={18} />
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeTab === "links" && (
                    <div className="space-y-1.5">
                      {items.map((item) => {
                        const itemId = item.messageId || item._id;
                        const isSelected = selectedItems.some(
                          (i) => (i.messageId || i._id) === itemId
                        );
                        const isStarred = Boolean(
                          item.isStarred ||
                          item.starred ||
                          (isMessageStarred && isMessageStarred(itemId)) ||
                          starredMessages?.[itemId]
                        );
                        const attachedMessage = getAttachedMessage(item) || item.title || "";
                        const senderName = item.sender?.username || getSenderDisplay(item) || "Unknown";
                        const timeDisplay = item.createdAt
                          ? format(new Date(item.createdAt), "MMM d, HH:mm")
                          : "";

                        return (
                          <div
                            key={itemId}
                            onClick={() => {
                              if (isSelectMode) toggleSelectItem(item);
                            }}
                            onContextMenu={(e) => {
                              if (isSelectMode) return;
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveMenu({
                                item,
                                position: {
                                  top: e.clientY + 4,
                                  left: Math.max(10, Math.min(window.innerWidth - 220, e.clientX - 100)),
                                  buttonTop: e.clientY,
                                },
                              });
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer group select-none border-2 ${isSelected
                              ? isDark
                                ? "bg-emerald-500/15 border-[#00a884] ring-2 ring-[#00a884]/40"
                                : "bg-emerald-50 border-[#00a884] ring-2 ring-[#00a884]/40"
                              : isDark
                                ? "bg-[#202c33]/70 hover:bg-[#28363e] border-transparent"
                                : "bg-white hover:bg-[#e0e6ea] border-transparent shadow-xs"
                              }`}
                          >
                            <div className="w-[45%] sm:w-[40%] flex items-center gap-3 min-w-0 pr-3">
                              <div
                                className={`shrink-0 transition-opacity duration-150 ${isSelectMode || isSelected
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-100"
                                  }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isSelectMode) setIsSelectMode(true);
                                  toggleSelectItem(item);
                                }}
                              >
                                {isSelected ? (
                                  <div className="w-[19px] h-[19px] rounded-[4px] bg-[#00a884] text-[#111b21] flex items-center justify-center font-bold shadow-md">
                                    <FaCheck size={11} className="stroke-[2]" />
                                  </div>
                                ) : (
                                  <div className={`w-[19px] h-[19px] rounded-[4px] border-[1.8px] ${isDark ? "border-[#8696a0]/60 bg-black/20" : "border-gray-400 bg-white"} group-hover:border-[#00a884] hover:border-[#00a884] transition-colors`} />
                                )}
                              </div>

                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isDark
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-600"
                                  }`}
                              >
                                <FiLink size={18} />
                              </div>

                              <div className="flex flex-col min-w-0">
                                <span className="text-[12px] font-semibold text-emerald-500 truncate uppercase tracking-wider">
                                  {item.domain}
                                </span>

                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => {
                                    if (isSelectMode) e.preventDefault();
                                  }}
                                  className={`text-[13.5px] font-medium truncate mt-0.5 hover:underline transition-colors ${isDark
                                    ? "text-[#53bdeb] hover:text-[#7fd2f5]"
                                    : "text-blue-600 hover:text-blue-800"
                                    }`}
                                >
                                  {item.url}
                                </a>
                              </div>
                            </div>

                            <div className="hidden md:flex flex-1 items-center justify-center px-4 min-w-0">
                              <span
                                className={`text-[13px] truncate text-center max-w-[280px] ${attachedMessage
                                  ? isDark
                                    ? "text-[#d1d7db]"
                                    : "text-gray-700"
                                  : isDark
                                    ? "text-[#8696a0]/40"
                                    : "text-gray-400"
                                  }`}
                                title={attachedMessage || ""}
                              >
                                {attachedMessage || "—"}
                              </span>
                            </div>

                            <div className="w-[35%] sm:w-[25%] flex items-center justify-end gap-1.5 shrink-0">
                              <div className="flex flex-col items-end min-w-0 max-w-[120px] sm:max-w-[140px] mr-1">
                                <span className={`text-[12.5px] font-medium truncate w-full text-right ${isDark ? "text-[#e9edef]" : "text-gray-800"}`} title={senderName}>
                                  {senderName}
                                </span>
                                {timeDisplay && (
                                  <div className={`flex items-center gap-1 text-[11px] mt-0.5 ${isDark ? "text-[#8696a0]" : "text-gray-500"}`}>
                                    {isStarred && (
                                      <FaStar size={10} className={`${isDark ? "text-white/80" : "text-gray-600"} shrink-0`} />
                                    )}
                                    <span>{timeDisplay}</span>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyLink(item.url, item._id)
                                }
                                className={`p-1.5 rounded-lg transition-colors ${copiedId === item._id
                                  ? "text-emerald-500 bg-emerald-500/10"
                                  : isDark
                                    ? "text-[#8696a0] hover:text-white hover:bg-white/10"
                                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                  }`}
                                title="Copy link"
                              >
                                {copiedId === item._id ? (
                                  <MdCheck size={16} />
                                ) : (
                                  <MdOutlineContentCopy size={16} />
                                )}
                              </button>

                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-1.5 rounded-lg transition-colors ${isDark
                                  ? "text-[#8696a0] hover:text-white hover:bg-white/10"
                                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                  }`}
                                title="Open link"
                              >
                                <FiExternalLink size={16} />
                              </a>

                              {!isSelectMode && (
                                <div
                                  className={`p-1.5 rounded-full cursor-pointer transition-all ${(activeMenu?.item?.messageId || activeMenu?.item?._id) === itemId
                                    ? isDark
                                      ? "opacity-100 bg-black/40 text-white shadow-md scale-105"
                                      : "opacity-100 bg-gray-200 text-gray-900 shadow-md scale-105"
                                    : isDark
                                      ? "opacity-0 group-hover:opacity-100 hover:bg-black/20 text-[#8696a0] hover:text-white"
                                      : "opacity-0 group-hover:opacity-100 hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                                    }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setActiveMenu((prev) =>
                                      (prev?.item?.messageId || prev?.item?._id) === itemId
                                        ? null
                                        : {
                                          item,
                                          position: {
                                            top: rect.bottom + 4,
                                            left: Math.max(10, rect.right - 210),
                                            buttonTop: rect.top,
                                          },
                                        }
                                    );
                                  }}
                                  title="Menu"
                                >
                                  <MdOutlineKeyboardArrowDown size={18} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {scope === "chat" && !isSelectMode && (
        <div className={`shrink-0 h-[52px] border-t px-4 flex items-center justify-center select-none ${isDark ? "bg-[#111b21] border-[#222d34]" : "bg-white border-gray-200"}`}>
          <button
            type="button"
            onClick={() => {
              setScope("all");
              setSelectedContactFilter("");
            }}
            className="flex items-center gap-2 text-[#00a884] hover:text-[#06cf9c] font-medium text-[14px] transition-colors cursor-pointer group"
          >
            {activeTab === "media" ? (
              <HiOutlinePhotograph size={19} className="transition-transform group-hover:scale-105" />
            ) : activeTab === "docs" ? (
              <FaFileAlt size={16} className="transition-transform group-hover:scale-105" />
            ) : (
              <FiLink size={17} className="transition-transform group-hover:scale-105" />
            )}
            <span>
              {activeTab === "media"
                ? "View media from all chats"
                : activeTab === "docs"
                  ? "View docs from all chats"
                  : "View links from all chats"}
            </span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {isSelectMode && selectedItems.length > 0 && (
          <motion.div
            initial={{ y: 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 70, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className={`fixed bottom-0 inset-x-0 sm:absolute sm:inset-x-0 h-[60px] px-6 border-t flex items-center justify-between z-40 select-none shadow-2xl backdrop-blur-md ${isDark
              ? "bg-[#202c33] border-[#2a3942] text-white"
              : "bg-white border-gray-200 text-gray-900"
              }`}
          >
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleCancelSelect}
                className={`p-2 rounded-full transition-colors cursor-pointer active:scale-95 ${isDark
                  ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                title="Cancel selection"
              >
                <RxCross2 size={20} />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[14.5px] font-medium tracking-wide">
                  {selectedItems.length} selected
                </span>
                <span className={`text-[12px] px-2 py-0.5 rounded-full ${isDark ? "bg-white/10 text-[#8696a0]" : "bg-gray-100 text-gray-600"}`}>
                  {selectedTotalSize}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleStarSelected}
                className={`p-2.5 rounded-full transition-colors cursor-pointer active:scale-90 ${areAllStarred
                  ? "text-amber-400 hover:bg-amber-400/10"
                  : isDark
                    ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                title={areAllStarred ? "Unstar selected" : "Star selected"}
              >
                {areAllStarred ? <FaStar size={18} /> : <FaRegStar size={18} />}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className={`p-2.5 rounded-full transition-colors cursor-pointer active:scale-90 ${isDark
                  ? "text-[#aebac1] hover:text-rose-400 hover:bg-rose-500/10"
                  : "text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                  }`}
                title="Delete selected"
              >
                <RiDeleteBin6Line size={20} />
              </button>

              <button
                type="button"
                onClick={handleForwardSelected}
                className={`p-2.5 rounded-full transition-colors cursor-pointer active:scale-90 ${isDark
                  ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                title="Forward selected"
              >
                <IoArrowForward size={20} />
              </button>

              <button
                type="button"
                onClick={handleDownloadSelected}
                className={`p-2.5 rounded-full transition-colors cursor-pointer active:scale-90 ${isDark
                  ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                title="Download selected"
              >
                <FiDownload size={19} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showDeleteModal && (
        <div
          className={`fixed inset-0 z-[10000] flex items-center justify-center px-4 backdrop-blur-xs ${isDark ? "bg-black/60" : "bg-black/40"
            }`}
          onClick={() => setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`relative w-full max-w-[420px] rounded-2xl shadow-2xl p-6 select-none ${isDark
              ? "bg-[#233138] text-[#d1d7db] border border-[#3b4a54]/40"
              : "bg-white text-gray-800 border border-gray-200"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className={`text-[17px] font-medium leading-snug ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
                }`}
            >
              Delete {selectedItems.length === 1 ? "message" : `${selectedItems.length} messages`}?
            </h2>

            <p
              className={`mt-3 text-[14px] leading-relaxed ${isDark ? "text-[#8696a0]" : "text-gray-500"
                }`}
            >
              {canDeleteForEveryone
                ? "You can delete messages for everyone or just for yourself."
                : selectedItems.length === 1
                  ? "Are you sure you want to delete this message?"
                  : "Are you sure you want to delete these messages?"}
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className={`px-5 py-2 rounded-full border text-[13.5px] font-medium transition-colors cursor-pointer ${isDark
                  ? "border-[#3b4a54] text-[#00a884] hover:bg-white/5 active:bg-white/10"
                  : "border-gray-300 text-[#00a884] hover:bg-gray-50 active:bg-gray-100"
                  }`}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() => executeDeleteSelected("me")}
                className={`px-5 py-2 rounded-full border text-[13.5px] font-medium transition-colors cursor-pointer ${isDark
                  ? "border-[#3b4a54] text-[#00a884] hover:bg-white/5 active:bg-white/10"
                  : "border-gray-300 text-[#00a884] hover:bg-gray-50 active:bg-gray-100"
                  }`}
              >
                {isDeleting ? "Deleting..." : "Delete for me"}
              </button>

              {canDeleteForEveryone && (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => executeDeleteSelected("everyone")}
                  className="px-5 py-2 rounded-full bg-[#00a884] hover:bg-[#02906f] active:bg-[#028062] text-[#111b21] text-[13.5px] font-medium transition-colors shadow-sm cursor-pointer"
                >
                  {isDeleting ? "Deleting..." : "Delete for everyone"}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {showForwardModal && (
        <ForwardModal
          isOpen={showForwardModal}
          onClose={() => {
            setShowForwardModal(false);
            setIsSelectMode(false);
            setSelectedItems([]);
          }}
          messages={selectedItems}
          theme={theme}
        />
      )}

      {showViewer && viewerFile && (
        <FileViewerModal
          isOpen={showViewer}
          onClose={() => {
            setShowViewer(false);
            setViewerFile(null);
          }}
          file={viewerFile}
          items={viewerFile.items}
          initialIndex={viewerFile.initialIndex || 0}
          theme={theme}
        />
      )}

      {activeMenu && (
        <MediaMenu
          isOpen={Boolean(activeMenu)}
          onClose={() => setActiveMenu(null)}
          item={activeMenu.item}
          position={activeMenu.position}
          isStarred={isMessageStarred(activeMenu.item?.messageId || activeMenu.item?._id)}
          canReplyPrivately={Boolean(activeMenu.item?.sender)}
          onOpenLink={(item) => {
            if (item?.url) {
              window.open(item.url, "_blank", "noopener,noreferrer");
            }
          }}
          onSelect={handleMenuSelect}
          onGoToMessage={handleMenuGoToMessage}
          onReply={handleMenuReply}
          onReplyPrivately={handleMenuReplyPrivately}
          onDownload={handleMenuDownload}
          onCopy={handleMenuCopy}
          onForward={handleMenuForward}
          onToggleStar={handleMenuToggleStar}
          onDelete={handleMenuDelete}
          theme={theme}
        />
      )}
    </div>
  );
};

export default Media;