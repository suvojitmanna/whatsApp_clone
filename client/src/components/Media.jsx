import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSearch,
  FaPlay,
  FaVideo,
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileArchive,
  FaDownload,
  FaRegCopy,
  FaCheck,
  FaStar,
  FaRegStar,
} from "react-icons/fa";
import { FiDownload, FiExternalLink, FiTrash2, FiLink } from "react-icons/fi";
import { HiOutlinePhotograph } from "react-icons/hi";
import { LuSlidersHorizontal } from "react-icons/lu";
import {
  MdOutlinePermMedia,
  MdFilterList,
  MdOutlineCheckBox,
  MdCheck,
  MdOutlineContentCopy,
} from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { IoArrowForward } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "react-toastify";

import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import { useChatStore } from "../store/chatStore";
import axiosInstance from "../services/url.services";
import FileViewerModal from "./FileViewerModal";
import ForwardModal from "./ForwardModal";

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
        bytes = 9 * 1024 * 1024; // 9 MB
      } else if (item.mediaType === "image" || item.contentType === "image") {
        bytes = 1.8 * 1024 * 1024; // ~1.8 MB
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
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-xl border animate-skeleton-shimmer ${isDark
                ? "bg-[#202c33]/70 border-white/5"
                : "bg-white border-gray-200"
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

const FALLBACK_MEDIA = [
  {
    _id: "fb_m1",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1601055283742-8b27e81b5553?w=800&auto=format&fit=crop&q=80",
    content: "Maha Shashthi 2026 Wishes & Blessings",
    createdAt: new Date().toISOString(),
    sender: { phoneNumber: "+91 93304 10256", username: "Debojyoti" },
  },
  {
    _id: "fb_m2",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop&q=80",
    content: "Subho Maha Shashthi to everyone!",
    createdAt: new Date().toISOString(),
    sender: { phoneNumber: "+91 96476 06823", username: "Priyanka" },
  },
  {
    _id: "fb_m3",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80",
    content: "Shashthi Special Pandal Inauguration",
    createdAt: new Date().toISOString(),
    sender: { phoneNumber: "+91 96476 06823", username: "Priyanka" },
  },
  {
    _id: "fb_m4",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&auto=format&fit=crop&q=80",
    content: "Durga Pratima 2026",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    sender: { phoneNumber: "+91 98301 23456", username: "Rohan" },
  },
  {
    _id: "fb_m5",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=800&auto=format&fit=crop&q=80",
    content: "I am Eternal... Team Hall celebration",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    sender: { phoneNumber: "+91 93304 10256", username: "Debojyoti" },
  },
  {
    _id: "fb_m6",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80",
    content: "Team Hall celebration & preparation",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    sender: { phoneNumber: "+91 96476 06823", username: "Priyanka" },
  },
  {
    _id: "fb_m7",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=800&auto=format&fit=crop&q=80",
    content: "Classroom memories & chalkboard art",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    sender: { phoneNumber: "+91 96476 06823", username: "Priyanka" },
  },
  {
    _id: "fb_m8",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80",
    content: "Pandal hopping with friends",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    sender: { phoneNumber: "+91 94321 09876", username: "Aniket" },
  },
  {
    _id: "fb_m9",
    mediaType: "video",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: 18,
    durationStr: "0:18",
    content: "Dhak beats and aarti live video",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    sender: { phoneNumber: "+91 93304 10256", username: "Debojyoti" },
  },
];

const FALLBACK_DOCS = [
  {
    _id: "fb_d1",
    docName: "Durga Puja Event Schedule 2026.pdf",
    fileName: "Durga Puja Event Schedule 2026.pdf",
    fileSize: 1450000,
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    createdAt: new Date().toISOString(),
    sender: { phoneNumber: "+91 93304 10256", username: "Debojyoti" },
  },
  {
    _id: "fb_d2",
    docName: "Budget & Contribution List.xlsx",
    fileName: "Budget & Contribution List.xlsx",
    fileSize: 320000,
    fileUrl: "",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    sender: { phoneNumber: "+91 96476 06823", username: "Priyanka" },
  },
  {
    _id: "fb_d3",
    docName: "Pandal Safety Guidelines.pdf",
    fileName: "Pandal Safety Guidelines.pdf",
    fileSize: 850000,
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    sender: { phoneNumber: "+91 98301 23456", username: "Rohan" },
  },
  {
    _id: "fb_d4",
    docName: "Team Roles & Responsibilities.docx",
    fileName: "Team Roles & Responsibilities.docx",
    fileSize: 480000,
    fileUrl: "",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    sender: { phoneNumber: "+91 94321 09876", username: "Aniket" },
  },
];

const FALLBACK_LINKS = [
  {
    _id: "fb_l1",
    url: "https://durga-puja-live-darshan.org/2026",
    domain: "durga-puja-live-darshan.org",
    title: "Durga Puja 2026 - Live Darshan & Pandal Hopping Guide",
    createdAt: new Date().toISOString(),
    sender: { phoneNumber: "+91 93304 10256", username: "Debojyoti" },
  },
  {
    _id: "fb_l2",
    url: "https://timesofindia.indiatimes.com/city/kolkata/durga-puja",
    domain: "timesofindia.indiatimes.com",
    title: "Kolkata Durga Puja 2026 Mega Guide, Route Maps & Awards",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    sender: { phoneNumber: "+91 96476 06823", username: "Priyanka" },
  },
  {
    _id: "fb_l3",
    url: "https://github.com/suvojitmanna/WhatsApp",
    domain: "github.com",
    title: "WhatsApp MERN Stack Full Clone - GitHub Repository",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    sender: { phoneNumber: "+91 98301 23456", username: "Rohan" },
  },
];

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
  const [activeFilter, setActiveFilter] = useState("all");
  const filterRef = useRef(null);
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

  const isDark = theme === "dark";
  const conversations = useChatStore((state) => state.conversations?.data || []);
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

      setMediaData(resData);
    } catch (error) {
      console.error("Error fetching media, docs and links:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMediaData();
  }, [scope, resolvedConversationId, selectedContactFilter]);

  const effectiveData = useMemo(() => {
    const rawMedia = [...(mediaData?.media || [])];
    const rawDocs = [...(mediaData?.docs || [])];
    const rawLinks = [...(mediaData?.links || [])];

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

    const finalMedia =
      rawMedia.length > 0
        ? rawMedia
        : scope === "all"
          ? FALLBACK_MEDIA
          : [];
    const finalDocs =
      rawDocs.length > 0
        ? rawDocs
        : scope === "all"
          ? FALLBACK_DOCS
          : [];
    const finalLinks =
      rawLinks.length > 0
        ? rawLinks
        : scope === "all"
          ? FALLBACK_LINKS
          : [];

    return {
      media: finalMedia,
      docs: finalDocs,
      links: finalLinks,
    };
  }, [mediaData, storeMessages, user?._id, scope]);

  const filteredItems = useMemo(() => {
    let list = effectiveData[activeTab] || [];

    if (activeFilter !== "all") {
      if (activeTab === "media") {
        if (activeFilter === "photos") {
          list = list.filter((i) => i.mediaType !== "video");
        } else if (activeFilter === "videos") {
          list = list.filter((i) => i.mediaType === "video");
        }
      } else if (activeTab === "docs") {
        if (activeFilter === "pdf") {
          list = list.filter((i) =>
            (i.docName || i.fileName || "").toLowerCase().endsWith(".pdf")
          );
        } else if (activeFilter === "sheets") {
          list = list.filter((i) => {
            const name = (i.docName || i.fileName || "").toLowerCase();
            return (
              name.endsWith(".xls") ||
              name.endsWith(".xlsx") ||
              name.endsWith(".csv")
            );
          });
        }
      }
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
  }, [effectiveData, activeTab, activeFilter, searchQuery]);

  const groupedItems = useMemo(() => {
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

    return Object.values(groups).sort((a, b) => (b.sortKey || 0) - (a.sortKey || 0));
  }, [filteredItems]);

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

    if (activeTab === "media") {
      const isVideo = item.mediaType === "video";
      setViewerFile({
        name: isVideo ? "Video" : "Photo",
        url: item.url || item.imageOrVideoUrl,
        type: isVideo ? "video/mp4" : "image/jpeg",
        createdAt: item.createdAt,
        sender: item.sender,
      });
      setShowViewer(true);
    } else if (activeTab === "docs") {
      setViewerFile({
        name: item.docName || item.fileName || "Document",
        url: item.docUrl || item.fileUrl || item.imageOrVideoUrl,
        type: "pdf",
        createdAt: item.createdAt,
        sender: item.sender,
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
      className={`flex flex-col h-full w-full select-none relative overflow-hidden ${isDark ? "bg-[#111b21] text-[#e9edef]" : "bg-white text-gray-900"
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

          {/* Center: Tabs with WhatsApp Emerald Underline */}
          <div className="flex items-center gap-6 sm:gap-10 h-full">
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
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search Button */}
            <button
              type="button"
              onClick={() => setIsSearching((prev) => !prev)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${isSearching
                ? "text-[#00a884] bg-emerald-500/10"
                : isDark
                  ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              title="Search"
            >
              <FaSearch size={15} />
            </button>

            {/* Filter Menu Button */}
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setShowFilterMenu((prev) => !prev)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${activeFilter !== "all" || showFilterMenu
                  ? "text-[#00a884] bg-emerald-500/10"
                  : isDark
                    ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                title="Filter"
              >
                <LuSlidersHorizontal size={18} />
              </button>

              {/* Filter Dropdown Popover */}
              <AnimatePresence>
                {showFilterMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl border p-1.5 z-50 select-none ${isDark
                      ? "bg-[#233138] border-white/10 text-white shadow-black/60"
                      : "bg-white border-gray-200 text-gray-800 shadow-xl"
                      }`}
                  >
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8696a0]">
                      Filter {activeTab}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveFilter("all");
                        setShowFilterMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[13.5px] rounded-lg cursor-pointer transition-colors ${activeFilter === "all"
                        ? "text-[#00a884] bg-emerald-500/10 font-medium"
                        : isDark
                          ? "hover:bg-white/5"
                          : "hover:bg-gray-100"
                        }`}
                    >
                      <span>All</span>
                      {activeFilter === "all" && <MdCheck size={16} />}
                    </button>

                    {activeTab === "media" && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFilter("photos");
                            setShowFilterMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-[13.5px] rounded-lg cursor-pointer transition-colors ${activeFilter === "photos"
                            ? "text-[#00a884] bg-emerald-500/10 font-medium"
                            : isDark
                              ? "hover:bg-white/5"
                              : "hover:bg-gray-100"
                            }`}
                        >
                          <span>Photos only</span>
                          {activeFilter === "photos" && <MdCheck size={16} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveFilter("videos");
                            setShowFilterMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-[13.5px] rounded-lg cursor-pointer transition-colors ${activeFilter === "videos"
                            ? "text-[#00a884] bg-emerald-500/10 font-medium"
                            : isDark
                              ? "hover:bg-white/5"
                              : "hover:bg-gray-100"
                            }`}
                        >
                          <span>Videos only</span>
                          {activeFilter === "videos" && <MdCheck size={16} />}
                        </button>
                      </>
                    )}

                    {activeTab === "docs" && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFilter("pdf");
                            setShowFilterMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-[13.5px] rounded-lg cursor-pointer transition-colors ${activeFilter === "pdf"
                            ? "text-[#00a884] bg-emerald-500/10 font-medium"
                            : isDark
                              ? "hover:bg-white/5"
                              : "hover:bg-gray-100"
                            }`}
                        >
                          <span>PDFs only</span>
                          {activeFilter === "pdf" && <MdCheck size={16} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveFilter("sheets");
                            setShowFilterMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-[13.5px] rounded-lg cursor-pointer transition-colors ${activeFilter === "sheets"
                            ? "text-[#00a884] bg-emerald-500/10 font-medium"
                            : isDark
                              ? "hover:bg-white/5"
                              : "hover:bg-gray-100"
                            }`}
                        >
                          <span>Spreadsheets (Excel)</span>
                          {activeFilter === "sheets" && <MdCheck size={16} />}
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Select Mode Toggle / Cancel button */}
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

      {/* Smooth Slide-down Search Bar */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`px-4 sm:px-6 py-2 border-b overflow-hidden shrink-0 ${isDark ? "bg-[#111b21] border-[#222d34]" : "bg-gray-50 border-gray-200"
              }`}
          >
            <div className="relative max-w-xl mx-auto">
              <FaSearch
                size={13}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-[#8696a0]" : "text-gray-400"
                  }`}
              />
              <input
                type="text"
                autoFocus
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-8 py-1.5 text-[13.5px] rounded-lg outline-none transition-colors border ${isDark
                  ? "bg-[#202c33] text-white border-transparent focus:border-emerald-500 placeholder-[#8696a0]"
                  : "bg-white text-gray-900 border-gray-200 focus:border-emerald-500 placeholder-gray-400"
                  }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-white"
                >
                  <RxCross2 size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
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
                <HiOutlinePhotograph
                  size={19}
                  className="transition-transform group-hover:scale-110"
                />
                <span>View media from all chats</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedItems.map((group) => {
              const { primary, sub, items } = group;
              return (
                <div key={`${primary}_${sub || ""}`} className="space-y-2">
                  {/* WhatsApp-Style Date Header */}
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

                  {/* MEDIA TAB GRID */}
                  {activeTab === "media" && (
                    <div
                      className={`grid ${mode === "modal"
                          ? "grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3"
                          : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5"
                        } gap-2 sm:gap-2.5`}
                    >
                      {items.map((item) => {
                        const isVideo = item.mediaType === "video";
                        const itemId = item.messageId || item._id;
                        const isSelected = selectedItems.some(
                          (i) => (i.messageId || i._id) === itemId
                        );
                        const senderDisplay = getSenderDisplay(item);

                        return (
                          <div
                            key={itemId}
                            onClick={() => handleOpenViewer(item)}
                            className={`relative aspect-square rounded-lg overflow-hidden group cursor-pointer transition-all duration-200 select-none shadow-xs ${isDark ? "bg-[#202c33]" : "bg-gray-200"
                              } ${isSelected
                                ? "ring-2 ring-emerald-500 brightness-95"
                                : "hover:brightness-105"
                              }`}
                          >
                            {/* Checkbox at Top-Left */}
                            <div
                              className={`absolute top-2 left-2 z-20 transition-all ${isSelectMode
                                ? "opacity-100 scale-100"
                                : "opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isSelectMode) setIsSelectMode(true);
                                toggleSelectItem(item);
                              }}
                            >
                              {isSelected ? (
                                <div className="w-[18px] h-[18px] rounded-[4px] bg-white text-black flex items-center justify-center font-bold shadow-md transition-transform active:scale-90">
                                  <FaCheck size={11} className="stroke-[1.5]" />
                                </div>
                              ) : (
                                <div className="w-[18px] h-[18px] rounded-[4px] border-[1.8px] border-white/85 bg-black/35 backdrop-blur-xs flex items-center justify-center hover:border-white transition-all active:scale-90" />
                              )}
                            </div>

                            {/* Media (Image or Video) */}
                            {isVideo ? (
                              <VideoThumbnail
                                src={item.url || item.imageOrVideoUrl}
                                item={item}
                              />
                            ) : (
                              <img
                                src={item.url || item.imageOrVideoUrl}
                                alt=""
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            )}

                            {/* Center Play Button for Video */}
                            {isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center shadow-lg backdrop-blur-xs group-hover:scale-110 transition-transform">
                                  <FaPlay size={11} className="ml-0.5" />
                                </div>
                              </div>
                            )}

                            {/* Bottom-left Sender Name & Video Badge Gradient */}
                            <div className="absolute inset-x-0 bottom-0 p-2 sm:p-2.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end text-white pointer-events-none">
                              {senderDisplay && (
                                <span className="text-[11.5px] sm:text-[12px] font-medium truncate text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] leading-tight">
                                  {senderDisplay}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* DOCS TAB LIST */}
                  {activeTab === "docs" && (
                    <div className="space-y-1.5">
                      {items.map((item) => {
                        const itemId = item.messageId || item._id;
                        const isSelected = selectedItems.some(
                          (i) => (i.messageId || i._id) === itemId
                        );
                        const docName =
                          item.docName || item.fileName || "Document";
                        const iconInfo = getFileIcon(docName);
                        const docUrl = item.docUrl || item.fileUrl || item.url;
                        const sizeStr = formatDocSize(item.fileSize);

                        return (
                          <div
                            key={itemId}
                            onClick={() => handleOpenViewer(item)}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group select-none ${isSelected
                              ? isDark
                                ? "bg-emerald-500/15 border-emerald-500/40"
                                : "bg-emerald-50 border-emerald-500/30"
                              : isDark
                                ? "bg-[#202c33]/70 hover:bg-[#202c33] border-white/5 hover:border-white/10"
                                : "bg-white hover:bg-gray-50 border-gray-200 shadow-xs"
                              }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-3">
                              {/* Selection Checkbox */}
                              {isSelectMode && (
                                <div
                                  className="shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectItem(item);
                                  }}
                                >
                                  {isSelected ? (
                                    <div className="w-[18px] h-[18px] rounded-[4px] bg-white text-black flex items-center justify-center font-bold shadow-md">
                                      <FaCheck size={11} />
                                    </div>
                                  ) : (
                                    <div className="w-[18px] h-[18px] rounded-[4px] border-[1.8px] border-white/60 bg-black/20" />
                                  )}
                                </div>
                              )}

                              <div
                                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${iconInfo.bg}`}
                              >
                                {iconInfo.icon}
                              </div>

                              <div className="flex flex-col min-w-0">
                                <span className="text-[14px] font-medium truncate leading-tight group-hover:text-emerald-500 transition-colors">
                                  {docName}
                                </span>
                                <div
                                  className={`flex items-center gap-2 text-[11.5px] mt-1 ${isDark ? "text-[#8696a0]" : "text-gray-500"
                                    }`}
                                >
                                  {sizeStr && <span>{sizeStr}</span>}
                                  {sizeStr && <span>•</span>}
                                  <span>{iconInfo.label}</span>
                                  {item.sender?.username && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">
                                        {item.sender.username}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* LINKS TAB LIST */}
                  {activeTab === "links" && (
                    <div className="space-y-2">
                      {items.map((item) => {
                        const itemId = item.messageId || item._id;
                        const isSelected = selectedItems.some(
                          (i) => (i.messageId || i._id) === itemId
                        );

                        return (
                          <div
                            key={itemId}
                            onClick={() => {
                              if (isSelectMode) toggleSelectItem(item);
                            }}
                            className={`p-3 rounded-xl border transition-all group select-none ${isSelected
                              ? isDark
                                ? "bg-emerald-500/15 border-emerald-500/40"
                                : "bg-emerald-50 border-emerald-500/30"
                              : isDark
                                ? "bg-[#202c33]/70 hover:bg-[#202c33] border-white/5 hover:border-white/10"
                                : "bg-white hover:bg-gray-50 border-gray-200 shadow-xs"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                {/* Selection Checkbox */}
                                {isSelectMode && (
                                  <div
                                    className="shrink-0 mt-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSelectItem(item);
                                    }}
                                  >
                                    {isSelected ? (
                                      <div className="w-[18px] h-[18px] rounded-[4px] bg-white text-black flex items-center justify-center font-bold shadow-md">
                                        <FaCheck size={11} />
                                      </div>
                                    ) : (
                                      <div className="w-[18px] h-[18px] rounded-[4px] border-[1.8px] border-white/60 bg-black/20" />
                                    )}
                                  </div>
                                )}

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
                                    className={`text-[13.5px] font-medium break-all mt-0.5 hover:underline transition-colors ${isDark
                                      ? "text-[#53bdeb] hover:text-[#7fd2f5]"
                                      : "text-blue-600 hover:text-blue-800"
                                      }`}
                                  >
                                    {item.url}
                                  </a>

                                  {item.title && item.title !== item.url && (
                                    <p
                                      className={`text-[12px] line-clamp-2 mt-1 leading-relaxed ${isDark
                                        ? "text-[#8696a0]"
                                        : "text-gray-600"
                                        }`}
                                    >
                                      {item.title}
                                    </p>
                                  )}

                                  <div
                                    className={`flex items-center gap-2 text-[11px] mt-2 ${isDark
                                      ? "text-[#8696a0]"
                                      : "text-gray-400"
                                      }`}
                                  >
                                    {item.createdAt && (
                                      <span>
                                        {format(
                                          new Date(item.createdAt),
                                          "MMM d, HH:mm"
                                        )}
                                      </span>
                                    )}
                                    {item.sender?.username && (
                                      <>
                                        <span>•</span>
                                        <span>{item.sender.username}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 pt-1">
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
                              </div>
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

      {/* Floating Bottom Action Toolbar when Items are Selected */}
      <AnimatePresence>
        {isSelectMode && selectedItems.length > 0 && (
          <motion.div
            initial={{ y: 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 70, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className={`fixed bottom-0 inset-x-0 sm:absolute sm:inset-x-0 h-[58px] px-6 border-t flex items-center justify-between z-40 select-none shadow-2xl backdrop-blur-md ${isDark
              ? "bg-[#202c33]/95 border-[#2a3942] text-white"
              : "bg-white/95 border-gray-200 text-gray-900"
              }`}
          >
            {/* Left: Red Trash with Total Size */}
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 text-rose-400 hover:text-rose-300 font-medium text-[14px] transition-colors cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-rose-500/10 active:scale-95"
              title="Delete selected"
            >
              <FiTrash2
                size={18}
                className="text-rose-400 group-hover:scale-110 transition-transform"
              />
              <span className="font-semibold">{selectedTotalSize}</span>
            </button>

            {/* Center: Selected count */}
            <div className="text-[14px] font-medium text-[#e9edef] tracking-wide">
              {selectedItems.length} selected
            </div>

            {/* Right: Star, Download, Green Circle Forward button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStarSelected}
                className={`p-2 rounded-full transition-colors cursor-pointer active:scale-90 ${areAllStarred
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
                onClick={handleDownloadSelected}
                className={`p-2 rounded-full transition-colors cursor-pointer active:scale-90 ${isDark
                  ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                title="Download selected"
              >
                <FiDownload size={19} />
              </button>

              <button
                type="button"
                onClick={handleForwardSelected}
                className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] text-[#111b21] flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95"
                title="Forward selected"
              >
                <IoArrowForward size={19} className="stroke-[1.5]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className={`fixed inset-0 z-[10000] flex items-center justify-center px-4 backdrop-blur-xl ${isDark ? "bg-black/70" : "bg-black/30"
            }`}
          onClick={() => setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className={`relative w-full max-w-sm overflow-hidden rounded-[28px] border p-6 shadow-2xl backdrop-blur-2xl ${isDark
              ? "border-white/[0.08] bg-gradient-to-br from-[#202c33]/95 via-[#111b21]/95 to-[#0b141a]/95 shadow-black/50"
              : "border-white/70 bg-gradient-to-br from-white/95 via-white/90 to-zinc-100/95 shadow-black/10"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              title="Close"
              onClick={() => setShowDeleteModal(false)}
              className={`absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 cursor-pointer ${isDark
                ? "bg-white/[0.06] text-gray-400 hover:bg-white/15 hover:text-white"
                : "bg-black/[0.05] text-gray-500 hover:bg-black/10 hover:text-gray-900"
                }`}
            >
              <RxCross2 size={16} />
            </button>

            <div className="relative flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg ${isDark
                  ? "border-red-400/10 bg-gradient-to-br from-red-500/20 to-red-600/5 text-red-400 shadow-red-500/10"
                  : "border-red-500/10 bg-gradient-to-br from-red-500/10 to-red-500/5 text-red-500 shadow-red-500/10"
                  }`}
              >
                <RiDeleteBin6Line size={27} />
              </motion.div>
              <h2
                className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-zinc-900"
                  }`}
              >
                Delete {selectedItems.length} message
                {selectedItems.length > 1 ? "s" : ""}?
              </h2>
              <p
                className={`mt-2 max-w-[290px] text-sm leading-6 ${isDark ? "text-zinc-400" : "text-zinc-500"
                  }`}
              >
                Choose how you want to delete selected messages. This action
                cannot be undone.
              </p>
            </div>

            <div className="relative mt-7 flex flex-col gap-3">
              {canDeleteForEveryone && (
                <motion.button
                  type="button"
                  disabled={isDeleting}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => executeDeleteSelected("everyone")}
                  className="group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 font-semibold transition-all duration-300 cursor-pointer border-red-500/10 bg-gradient-to-r from-red-500/90 to-rose-600/90 text-white shadow-lg shadow-red-500/10 hover:border-red-300/20 hover:from-red-500 hover:to-rose-500"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2.5">
                    <RiDeleteBin6Line size={17} />
                    <span>
                      {isDeleting ? "Deleting..." : "Delete for everyone"}
                    </span>
                  </span>
                </motion.button>
              )}

              <motion.button
                type="button"
                disabled={isDeleting}
                whileTap={{ scale: 0.97 }}
                onClick={() => executeDeleteSelected("me")}
                className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 font-semibold transition-all duration-300 cursor-pointer ${isDark
                  ? "border-white/[0.08] bg-gradient-to-r from-zinc-800/90 to-zinc-900/90 text-zinc-100 shadow-lg shadow-black/10 hover:border-emerald-400/20 hover:from-zinc-700/90 hover:to-zinc-800/90 hover:text-emerald-300"
                  : "border-black/[0.06] bg-gradient-to-r from-zinc-100 to-white text-zinc-800 shadow-md hover:border-emerald-500/20 hover:from-emerald-50 hover:to-white hover:text-emerald-700"
                  }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  <RiDeleteBin6Line size={17} />
                  <span>{isDeleting ? "Deleting..." : "Delete for me"}</span>
                </span>
              </motion.button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className={`w-full py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer ${isDark
                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                  : "text-gray-600 hover:text-gray-900 hover:bg-black/5"
                  }`}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Forward Modal */}
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

      {/* File Viewer Modal */}
      {showViewer && viewerFile && (
        <FileViewerModal
          isOpen={showViewer}
          onClose={() => {
            setShowViewer(false);
            setViewerFile(null);
          }}
          file={viewerFile}
          theme={theme}
        />
      )}
    </div>
  );
};

export default Media;