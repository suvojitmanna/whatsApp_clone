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
  FaExternalLinkAlt,
  FaRegCopy,
  FaCheck,
  FaPhotoVideo,
} from "react-icons/fa";
import { FiDownload, FiExternalLink, FiShare2, FiLink } from "react-icons/fi";
import { HiOutlinePhotograph } from "react-icons/hi";
import {
  MdOutlinePermMedia,
  MdOutlineArticle,
  MdChevronRight,
  MdCheck,
  MdOutlineContentCopy,
} from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";

import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import { useChatStore } from "../store/chatStore";
import useLayoutStore from "../store/layoutStore";
import axiosInstance from "../services/url.services";
import FileViewerModal from "./FileViewerModal";

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
  if (typeof bytes === "string" && (bytes.includes("KB") || bytes.includes("MB") || bytes.includes("GB"))) {
    return bytes;
  }
  const num = Number(bytes);
  if (isNaN(num) || num <= 0) return "";
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
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

const formatGroupDate = (date) => {
  if (!date) return "Recent";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Recent";
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM yyyy");
};

const Media = ({
  contact = null,
  chatId = null,
  onClose = null,
  mode = "drawer", // "drawer" (in ContactInfo) or "page" (full /media page)
  initialTab = "media", // "media" | "docs" | "links"
  hideHeader = false,
}) => {
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(initialTab); // "media" | "docs" | "links"
  const [scope, setScope] = useState(contact || chatId ? "chat" : "all"); // "chat" | "all"
  const [selectedContactFilter, setSelectedContactFilter] = useState(
    contact?._id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chatId || contact) {
      setScope("chat");
      setSelectedContactFilter(contact?._id || "");
    }
  }, [chatId, contact]);

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

  // Conversations from store for contact filtering
  const conversations = useChatStore((state) => state.conversations?.data || []);
  const storeMessages = useChatStore((state) => state.messages || []);

  const resolvedConversationId = useMemo(() => {
    if (chatId) return chatId;
    if (contact?.conversation?._id) return contact.conversation._id;
    if (contact?.conversation) return contact.conversation;
    return null;
  }, [chatId, contact]);

  // Fetch media from server API
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

  // Combine fetched items with any live in-memory messages for current chat
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

    return {
      media: rawMedia,
      docs: rawDocs,
      links: rawLinks,
    };
  }, [mediaData, storeMessages, user?._id]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = effectiveData[activeTab] || [];
    if (!q) return list;

    if (activeTab === "media") {
      return list.filter((item) => {
        const senderName =
          item.sender?.username?.toLowerCase() || "";
        const content = item.content?.toLowerCase() || "";
        return senderName.includes(q) || content.includes(q);
      });
    }
    if (activeTab === "docs") {
      return list.filter((item) => {
        const name = (item.docName || item.fileName || "").toLowerCase();
        const senderName =
          item.sender?.username?.toLowerCase() || "";
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
  }, [effectiveData, activeTab, searchQuery]);

  // Group items by date for chronological layout
  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach((item) => {
      const dateKey = formatGroupDate(item.createdAt);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return Object.entries(groups);
  }, [filteredItems]);

  const handleOpenViewer = (item) => {
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
    e.stopPropagation();
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

  const counts = {
    media: effectiveData.media.length,
    docs: effectiveData.docs.length,
    links: effectiveData.links.length,
  };

  return (
    <div
      className={`flex flex-col h-full w-full select-none ${mode === "page"
        ? isDark
          ? "bg-[#111b21] text-[#e9edef]"
          : "bg-white text-gray-900"
        : isDark
          ? "bg-[#111b21] text-[#e9edef]"
          : "bg-[#f0f2f5] text-gray-900"
        }`}
    >
      {!hideHeader && (
        <div
          className={`flex items-center justify-between px-4 py-3 shrink-0 border-b ${isDark
            ? "bg-[#202c33] border-[#222d34] text-white"
            : "bg-white border-gray-200 text-gray-800"
            }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (onClose) {
                  onClose();
                } else {
                  navigate(-1);
                }
              }}
              className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
                ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              title="Back"
            >
              <FaArrowLeft size={16} />
            </button>

            <div className="flex flex-col min-w-0">
              <h3 className="font-semibold text-[16px] truncate leading-tight">
                {scope === "all"
                  ? "Media, links and docs"
                  : contact?.username
                    ? `${contact.username}'s media`
                    : "Media, links and docs"}
              </h3>
              <span
                className={`text-[12px] truncate ${isDark ? "text-[#8696a0]" : "text-gray-500"
                  }`}
              >
                {scope === "all"
                  ? "All chats"
                  : contact?.username
                    ? `Shared in this chat`
                    : "This chat"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsSearching((prev) => !prev)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${isSearching
                ? "text-emerald-500 bg-emerald-500/10"
                : isDark
                  ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              title="Search"
            >
              <FaSearch size={15} />
            </button>
            {mode === "drawer" && (
              <button
                type="button"
                onClick={() => setScope((s) => (s === "chat" ? "all" : "chat"))}
                className={`text-[12px] font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer ${scope === "all"
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                  : isDark
                    ? "bg-[#111b21] hover:bg-white/10 text-[#8696a0] border-white/10"
                    : "bg-white hover:bg-gray-50 text-gray-600 border-gray-300"
                  }`}
                title={
                  scope === "all"
                    ? "Switch to this chat"
                    : "View media from all chats"
                }
              >
                {scope === "all" ? "All chats" : "This chat"}
              </button>
            )}
          </div>
        </div>
      )}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`px-4 py-2 border-b overflow-hidden ${isDark ? "bg-[#111b21] border-[#222d34]" : "bg-gray-50 border-gray-200"
              }`}
          >
            <div className="relative">
              <FaSearch
                size={13}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#8696a0]" : "text-gray-400"
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
      {mode === "page" && (
        <div
          className={`flex items-center gap-2 px-4 py-2 border-b overflow-x-auto scrollbar-hide text-xs ${isDark ? "bg-[#111b21] border-[#222d34]" : "bg-gray-50 border-gray-200"
            }`}
        >
          <button
            type="button"
            onClick={() => {
              setScope("all");
              setSelectedContactFilter("");
            }}
            className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors cursor-pointer ${scope === "all"
              ? "bg-emerald-500 text-white"
              : isDark
                ? "bg-[#202c33] text-[#8696a0] hover:text-white"
                : "bg-white text-gray-600 border border-gray-200"
              }`}
          >
            All chats
          </button>

          {conversations.slice(0, 8).map((conv) => {
            const peer = conv.participants?.find(
              (p) => p._id !== user?._id && p !== user?._id
            );
            if (!peer) return null;
            const peerId = peer._id || peer;
            const isSelected =
              scope === "chat" && selectedContactFilter === peerId;

            return (
              <button
                key={conv._id}
                type="button"
                onClick={() => {
                  setScope("chat");
                  setSelectedContactFilter(peerId);
                }}
                className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${isSelected
                  ? "bg-emerald-500 text-white"
                  : isDark
                    ? "bg-[#202c33] text-[#8696a0] hover:text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                  }`}
              >
                {peer.profilePicture && (
                  <img
                    src={peer.profilePicture}
                    alt=""
                    className="w-3.5 h-3.5 rounded-full object-cover"
                  />
                )}
                <span>{peer.username || "Chat"}</span>
              </button>
            );
          })}
        </div>
      )}
      <div
        className={`flex border-b shrink-0 ${isDark
          ? "bg-[#111b21] border-[#222d34]"
          : "bg-white border-gray-200"
          }`}
      >
        {[
          { id: "media", label: "Media", count: counts.media },
          { id: "docs", label: "Docs", count: counts.docs },
          { id: "links", label: "Links", count: counts.links },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center text-[14px] font-medium transition-colors relative cursor-pointer flex items-center justify-center gap-1.5 ${isActive
                ? isDark
                  ? "text-[#00a884]"
                  : "text-[#00a884] font-semibold"
                : isDark
                  ? "text-[#8696a0] hover:text-[#d1d7db]"
                  : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${isActive
                    ? "bg-emerald-500/20 text-emerald-400 font-semibold"
                    : isDark
                      ? "bg-white/10 text-[#8696a0]"
                      : "bg-gray-100 text-gray-500"
                    }`}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="media-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#00a884]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
        {hideHeader && (
          <button
            type="button"
            onClick={() => setIsSearching((prev) => !prev)}
            className={`px-3 py-3 transition-colors cursor-pointer flex items-center justify-center ${
              isSearching
                ? "text-[#00a884]"
                : isDark
                  ? "text-[#8696a0] hover:text-white"
                  : "text-gray-500 hover:text-gray-900"
            }`}
            title="Search"
          >
            <FaSearch size={14} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#8696a0]">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <span className="text-sm">Loading {activeTab}...</span>
          </div>
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
                  if (mode === "drawer") {
                    navigate("/media");
                  } else {
                    setScope("all");
                    setSelectedContactFilter("");
                  }
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

            {scope === "all" && mode === "drawer" && contact && (
              <button
                type="button"
                onClick={() => setScope("chat")}
                className="flex items-center gap-2 text-[#00a884] hover:text-[#06cf9c] font-medium text-[14px] transition-colors cursor-pointer"
              >
                <FaArrowLeft size={13} />
                <span>Back to this chat's media</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {groupedItems.map(([dateGroup, items]) => (
              <div key={dateGroup} className="space-y-2.5">
                <h5
                  className={`text-[12px] font-semibold tracking-wider uppercase px-1 ${isDark ? "text-[#8696a0]" : "text-gray-500"
                    }`}
                >
                  {dateGroup}
                </h5>
                {activeTab === "media" && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                    {items.map((item) => {
                      const isVideo = item.mediaType === "video";
                      return (
                        <div
                          key={item._id}
                          onClick={() => handleOpenViewer(item)}
                          className={`relative aspect-square rounded-lg overflow-hidden group cursor-pointer transition-transform duration-200 hover:scale-[1.02] shadow-sm ${isDark ? "bg-[#202c33]" : "bg-gray-200"
                            }`}
                        >
                          {isVideo ? (
                            <video
                              src={item.url}
                              className="w-full h-full object-cover pointer-events-none"
                              muted
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={item.url}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          )}

                          {isVideo && (
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                              <div className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center shadow-lg backdrop-blur-xs">
                                <FaPlay size={11} className="ml-0.5" />
                              </div>
                            </div>
                          )}

                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between text-white text-[10.5px]">
                            <span className="truncate max-w-[70%] font-medium">
                              {item.sender?.username || "Photo"}
                            </span>
                            <span className="opacity-80 shrink-0">
                              {item.createdAt
                                ? format(new Date(item.createdAt), "HH:mm")
                                : ""}
                            </span>
                          </div>
                          {scope === "all" && item.sender?.username && (
                            <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-[10px] text-white px-1.5 py-0.5 rounded-md truncate max-w-[85%] font-medium pointer-events-none">
                              {item.sender.username}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {activeTab === "docs" && (
                  <div className="space-y-1.5">
                    {items.map((item) => {
                      const docName =
                        item.docName || item.fileName || "Document";
                      const iconInfo = getFileIcon(docName);
                      const docUrl = item.docUrl || item.fileUrl || item.url;
                      const sizeStr = formatDocSize(item.fileSize);

                      return (
                        <div
                          key={item._id}
                          onClick={() => handleOpenViewer(item)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group ${isDark
                            ? "bg-[#202c33]/70 hover:bg-[#202c33] border-white/5 hover:border-white/10"
                            : "bg-white hover:bg-gray-50 border-gray-200 shadow-xs"
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-3">
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
                                {item.sender?.username && scope === "all" && (
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
                {activeTab === "links" && (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item._id}
                        className={`p-3 rounded-xl border transition-all group ${isDark
                          ? "bg-[#202c33]/70 hover:bg-[#202c33] border-white/5 hover:border-white/10"
                          : "bg-white hover:bg-gray-50 border-gray-200 shadow-xs"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
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
                                className={`text-[13.5px] font-medium break-all mt-0.5 hover:underline transition-colors ${isDark
                                  ? "text-[#53bdeb] hover:text-[#7fd2f5]"
                                  : "text-blue-600 hover:text-blue-800"
                                  }`}
                              >
                                {item.url}
                              </a>

                              {item.title && item.title !== item.url && (
                                <p
                                  className={`text-[12px] line-clamp-2 mt-1 leading-relaxed ${isDark ? "text-[#8696a0]" : "text-gray-600"
                                    }`}
                                >
                                  {item.title}
                                </p>
                              )}

                              <div
                                className={`flex items-center gap-2 text-[11px] mt-2 ${isDark ? "text-[#8696a0]" : "text-gray-400"
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
                                {item.sender?.username && scope === "all" && (
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
                              onClick={() => handleCopyLink(item.url, item._id)}
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
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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