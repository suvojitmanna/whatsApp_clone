import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaPlay,
  FaFilePdf,
  FaCheck,
} from "react-icons/fa";
import { TbStarOff } from "react-icons/tb";
import { VscSearchLarge } from "react-icons/vsc";
import { FiDownload } from "react-icons/fi";
import {
  HiOutlinePhotograph,
  HiOutlineDocumentText,
  HiOutlineLink,
} from "react-icons/hi";
import {
  MdOutlineKeyboardArrowDown,
  MdDoneAll,
  MdChevronRight,
  MdOutlineStarBorderPurple500,
} from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { IoArrowRedoOutline, IoReturnDownForward } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { format } from "date-fns";
import { toast } from "react-toastify";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import useLayoutStore from "../store/layoutStore";
import { useChatStore, decryptSingleMessage } from "../store/chatStore";
import axiosInstance from "../services/url.services";
import FileViewerModal from "./FileViewerModal";
import ForwardModal from "./ForwardModal";
import MediaMenu from "./MediaMenu";
import { FALLBACK_DOCS, FALLBACK_LINKS, FALLBACK_MEDIA } from "../assets/rawData";

const formatDocSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return "";
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${Math.round(num / 1024)} kB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
};

const ContactMedia = ({
  contact = null,
  chatId = null,
  onClose = null,
  onCloseDrawer = null,
  initialTab = "media",
}) => {
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const openMediaModal = useLayoutStore((state) => state.openMediaModal);
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [mediaData, setMediaData] = useState({
    media: [],
    docs: [],
    links: [],
  });

  const [viewerFile, setViewerFile] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  const storeMessages = useChatStore((state) => state.messages || []);
  const isMessageStarred = useChatStore((state) => state.isMessageStarred);
  const starredMessages = useChatStore((state) => state.starredMessages);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    setSelectedItems([]);
  }, [activeTab]);

  const resolvedConversationId = useMemo(() => {
    if (chatId) return chatId;
    if (contact?.conversation?._id) return contact.conversation._id;
    if (contact?.conversation) return contact.conversation;
    return null;
  }, [chatId, contact]);

  // Fetch media from server if conversation exists
  useEffect(() => {
    let isMounted = true;
    const fetchChatMedia = async () => {
      if (!resolvedConversationId && !contact?._id) return;
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(`/chat/media`, {
          params: {
            conversationId: resolvedConversationId || contact?._id,
          },
        });
        const resData = data?.data || data || { media: [], docs: [], links: [] };
        const currentUserId = user?._id?.toString();

        if (currentUserId && isMounted) {
          const decryptItem = async (item) => {
            if (!item || !item.isEncrypted || item._isDecrypted) return item;
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
            Promise.all((resData.media || []).map(decryptItem)),
            Promise.all((resData.docs || []).map(decryptItem)),
            Promise.all((resData.links || []).map(decryptItem)),
          ]);

          if (isMounted) {
            setMediaData({
              media: decMedia,
              docs: decDocs,
              links: decLinks,
            });
          }
        } else if (isMounted) {
          setMediaData(resData);
        }
      } catch (err) {
        console.error("Failed to fetch contact media:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchChatMedia();
    return () => {
      isMounted = false;
    };
  }, [resolvedConversationId, contact, user?._id]);

  // Combine real items with fallbacks
  const effectiveData = useMemo(() => {
    const rawMedia = [...(mediaData?.media || [])];
    const rawDocs = [...(mediaData?.docs || [])];
    const rawLinks = [...(mediaData?.links || [])];

    // Merge store messages
    const existingIds = new Set([
      ...rawMedia.map((m) => String(m._id)),
      ...rawDocs.map((d) => String(d._id)),
      ...rawLinks.map((l) => String(l.messageId || l._id)),
    ]);

    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

    if (Array.isArray(storeMessages)) {
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
          Boolean(msg.imageOrVideoUrl && msg.imageOrVideoUrl.match(/\.(mp4|webm|mov)($|\?)/i));
        const isImage = msg.contentType === "image" || Boolean(msg.imageOrVideoUrl && !isVideo);

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
          if (matches) {
            matches.forEach((matchedUrl) => {
              const cleanUrl = matchedUrl.startsWith("http") ? matchedUrl : `https://${matchedUrl}`;
              let domain = "";
              try {
                domain = new URL(cleanUrl).hostname;
              } catch {
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
              });
            });
          }
        }
      });
    }

    return {
      media: rawMedia.length > 0 ? rawMedia : FALLBACK_MEDIA,
      docs: rawDocs.length > 0 ? rawDocs : FALLBACK_DOCS,
      links: rawLinks.length > 0 ? rawLinks : FALLBACK_LINKS,
    };
  }, [mediaData, storeMessages, user?._id]);

  const filteredItems = useMemo(() => {
    let list = effectiveData[activeTab] || [];
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      if (activeTab === "media") {
        return (
          (item.content && item.content.toLowerCase().includes(q)) ||
          (item.sender?.username && item.sender.username.toLowerCase().includes(q))
        );
      }
      if (activeTab === "docs") {
        return (
          (item.docName && item.docName.toLowerCase().includes(q)) ||
          (item.fileName && item.fileName.toLowerCase().includes(q))
        );
      }
      if (activeTab === "links") {
        return (
          (item.url && item.url.toLowerCase().includes(q)) ||
          (item.domain && item.domain.toLowerCase().includes(q)) ||
          (item.title && item.title.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [effectiveData, activeTab, searchQuery]);

  const groupedItems = useMemo(() => {
    if (!filteredItems.length) return [];
    const groups = {};

    filteredItems.forEach((item) => {
      const dateVal = item.createdAt ? new Date(item.createdAt) : new Date();
      const now = new Date();
      const isCurrentMonth =
        dateVal.getMonth() === now.getMonth() && dateVal.getFullYear() === now.getFullYear();

      const groupKey = isCurrentMonth ? "THIS MONTH" : format(dateVal, "MMMM yyyy").toUpperCase();

      if (!groups[groupKey]) {
        groups[groupKey] = {
          primary: groupKey,
          items: [],
        };
      }
      groups[groupKey].items.push(item);
    });

    return Object.values(groups);
  }, [filteredItems]);

  const toggleSelectItem = (item) => {
    setSelectedItems((prev) => {
      const itemId = item.messageId || item._id;
      const exists = prev.some((i) => (i.messageId || i._id) === itemId);
      if (exists) {
        return prev.filter((i) => (i.messageId || i._id) !== itemId);
      }
      return [...prev, item];
    });
  };

  const handleOpenViewer = (item) => {
    const isVideo = item.mediaType === "video";
    const isDoc = activeTab === "docs";
    const name = item.fileName || item.docName || (isVideo ? "video.mp4" : "image.jpg");
    const url = item.url || item.imageOrVideoUrl || item.docUrl || item.fileUrl;

    if (!url) return;

    setViewerFile({
      url,
      name,
      fileType: isVideo ? "video" : isDoc ? "document" : "image",
      createdAt: item.createdAt,
      sender: item.sender,
      _rawItem: item,
      canDeleteForEveryone: item.sender?._id === user?._id || item.sender === "You",
    });
    setShowViewer(true);
  };

  const handleCancelSelect = () => {
    setSelectedItems([]);
  };

  const areAllStarred = useMemo(() => {
    if (!selectedItems.length) return false;
    return selectedItems.every((item) => isMessageStarred(item.messageId || item._id));
  }, [selectedItems, isMessageStarred, starredMessages]);

  const handleStarSelected = () => {
    const { toggleStarMessage } = useChatStore.getState();
    if (areAllStarred) {
      selectedItems.forEach((item) => {
        const id = item.messageId || item._id;
        if (isMessageStarred(id)) toggleStarMessage(id, item);
      });
      toast.success(`Unstarred ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""}`);
    } else {
      selectedItems.forEach((item) => {
        const id = item.messageId || item._id;
        if (!isMessageStarred(id)) toggleStarMessage(id, item);
      });
      toast.success(`Starred ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""}`);
    }
  };

  const handleDownloadFile = async (e, url, name) => {
    if (e) e.stopPropagation();
    if (!url) {
      toast.info("Download preview simulated");
      return;
    }
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = name || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
      toast.success("Download complete");
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleDownloadSelected = () => {
    toast.info(`Downloading ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""}`);
    selectedItems.forEach((item) => {
      const url = item.url || item.imageOrVideoUrl || item.docUrl || item.fileUrl;
      const name = item.fileName || item.docName || "download";
      handleDownloadFile(null, url, name);
    });
  };

  const executeDeleteSelected = async (type) => {
    setIsDeleting(true);
    try {
      const { deleteMessage } = useChatStore.getState();
      for (const item of selectedItems) {
        const id = item.messageId || item._id;
        if (id && deleteMessage) {
          await deleteMessage(id, type);
        }
      }
      toast.success(`Deleted ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""}`);
      setSelectedItems([]);
      setShowDeleteModal(false);
    } catch {
      toast.error("Failed to delete selected items");
    } finally {
      setIsDeleting(false);
    }
  };

  const canDeleteForEveryone = useMemo(() => {
    if (!selectedItems.length) return false;
    return selectedItems.every(
      (item) => item.sender?._id === user?._id || item.sender === "You" || item.isOutgoing
    );
  }, [selectedItems, user?._id]);

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
      {/* Dual-State Top Bar */}
      <div className="flex flex-col shrink-0 z-20">
        <div
          className={`h-[60px] px-4 flex items-center justify-between border-b shrink-0 transition-colors select-none ${isDark
            ? selectedItems.length > 0
              ? "bg-[#202c33] border-[#222d34] text-[#e9edef]"
              : "bg-[#111b21] border-[#222d34] text-[#e9edef]"
            : selectedItems.length > 0
              ? "bg-[#f0f2f5] border-gray-200 text-gray-900"
              : "bg-white border-gray-200 text-gray-900"
            }`}
        >
          {selectedItems.length > 0 ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleCancelSelect}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
                    ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                    : "hover:bg-gray-200 text-gray-600"
                    }`}
                  title="Cancel selection"
                >
                  <RxCross2 size={20} />
                </button>
                <span className="text-[15px] font-medium tracking-normal text-[#e9edef]">
                  {selectedItems.length} selected
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={handleStarSelected}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${areAllStarred
                    ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                    : isDark
                      ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                      : "text-black/60 hover:text-black/80 hover:bg-black/10"
                    }`}
                  title={areAllStarred ? "Unstar" : "Star"}
                >
                  {areAllStarred ? <TbStarOff size={18} /> : <MdOutlineStarBorderPurple500 size={18} />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
                    ? "text-[#aebac1] hover:text-rose-400 hover:bg-rose-500/10"
                    : "text-gray-500 hover:text-rose-600 hover:bg-rose-100"
                    }`}
                  title="Delete"
                >
                  <RiDeleteBin6Line size={19} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowForwardModal(true)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
                    ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                    : "text-gray-500 hover:text-gray-900 hover:bg-black/10"
                    }`}
                  title="Forward"
                >
                  <IoReturnDownForward size={19} />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSelected}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
                    ? "text-[#aebac1] hover:text-white hover:bg-white/10"
                    : "text-gray-500 hover:text-gray-900 hover:bg-black/10 "
                    }`}
                  title="Download"
                >
                  <FiDownload size={19} />
                </button>
              </div>
            </div>
          ) : isSearching ? (
            <div className="flex items-center w-full gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery("");
                }}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark ? "text-[#8696a0] hover:text-white" : "text-gray-600"
                  }`}
                title="Back"
              >
                <FaArrowLeft size={16} />
              </button>
              <input
                type="text"
                autoFocus
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 bg-transparent text-[14px] outline-none ${isDark ? "text-white placeholder-[#8696a0]" : "text-gray-900 placeholder-gray-400"
                  }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[#8696a0] hover:text-white p-1"
                >
                  <RxCross2 size={16} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
                    ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                    : "hover:bg-gray-100 text-gray-600"
                    }`}
                  title="Back"
                >
                  <FaArrowLeft size={18} />
                </button>
                <h2 className="text-[16px] font-semibold tracking-tight text-[#e9edef] truncate">
                  Media, links and docs
                </h2>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsSearching(true)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
                    ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                    : "hover:bg-gray-100 text-gray-600"
                    }`}
                  title="Search"
                >
                  <VscSearchLarge size={17} />
                </button>
                {onCloseDrawer && (
                  <button
                    type="button"
                    onClick={onCloseDrawer}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
                      ? "hover:bg-white/10 text-[#aebac1] hover:text-white"
                      : "hover:bg-gray-100 text-gray-600"
                      }`}
                    title="Close"
                  >
                    <RxCross2 size={20} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs Bar */}
        <div
          className={`h-[44px] flex items-center border-b shrink-0 px-2 select-none ${isDark ? "bg-[#111b21] border-[#222d34]" : "bg-white border-gray-200"
            }`}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedItems([]);
                }}
                className={`flex-1 h-full flex items-center justify-center relative text-[14.5px] transition-colors cursor-pointer font-medium ${isActive
                  ? "text-[#00a884] font-semibold"
                  : isDark
                    ? "text-[#8696a0] hover:text-[#d1d7db]"
                    : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="contactmedia-active-tab"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00a884] rounded-t-full"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-[#8696a0] text-sm">
            Loading...
          </div>
        ) : groupedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center px-6 select-none">
            <h4 className="text-[18px] font-bold mb-1.5 text-white">
              No {activeTab} found
            </h4>
            <p className="text-[13px] text-[#8696a0] max-w-[260px] leading-relaxed">
              No results matching your query.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedItems.map((group) => {
              const { primary, items } = group;
              return (
                <div key={primary} className="space-y-2">
                  <h4 className="text-[13px] font-semibold uppercase tracking-wider text-[#8696a0] px-0.5 mb-2">
                    {primary}
                  </h4>

                  {/* MEDIA TAB */}
                  {activeTab === "media" && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {items.map((item) => {
                        const isVideo = item.mediaType === "video";
                        const itemId = item.messageId || item._id;
                        const isSelected = selectedItems.some(
                          (i) => (i.messageId || i._id) === itemId
                        );
                        const mediaSrc = item.url || item.imageOrVideoUrl;

                        return (
                          <div
                            key={itemId}
                            onClick={() => {
                              if (selectedItems.length > 0) {
                                toggleSelectItem(item);
                              } else {
                                handleOpenViewer(item);
                              }
                            }}
                            onContextMenu={(e) => {
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
                            className={`relative aspect-square rounded-lg overflow-hidden group cursor-pointer select-none transition-all ${isDark ? "bg-[#202c33]" : "bg-gray-200"
                              } ${isSelected
                                ? "border-[3.5px] border-[#00a884]"
                                : "hover:brightness-105"
                              }`}
                          >
                            {/* Checkbox */}
                            {isSelected ? (
                              <div
                                className="absolute top-1.5 left-1.5 z-20 w-[18px] h-[18px] rounded-[3px] bg-white text-black flex items-center justify-center shadow-md cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelectItem(item);
                                }}
                              >
                                <FaCheck size={10} className="stroke-[1.5]" />
                              </div>
                            ) : (
                              <div
                                className={`absolute top-1.5 left-1.5 z-20 transition-all ${selectedItems.length > 0
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-100"
                                  }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelectItem(item);
                                }}
                              >
                                <div className="w-[18px] h-[18px] rounded-[3px] border-[1.5px] border-white/80 bg-black/30 backdrop-blur-xs flex items-center justify-center hover:border-white transition-all shadow-sm" />
                              </div>
                            )}

                            {/* Down Arrow Menu */}
                            {!isSelected && (
                              <div
                                className={`absolute top-1 right-1 z-20 flex items-center justify-center rounded-full p-1 cursor-pointer transition-all ${(activeMenu?.item?.messageId || activeMenu?.item?._id) === itemId
                                  ? "opacity-100 bg-black/60 text-white shadow-md scale-105"
                                  : "opacity-0 group-hover:opacity-100 hover:bg-black/40 text-white"
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
                                <MdOutlineKeyboardArrowDown size={18} />
                              </div>
                            )}

                            {isVideo ? (
                              <video
                                src={mediaSrc}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                              />
                            ) : (
                              <img
                                src={mediaSrc}
                                alt=""
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            )}

                            {isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center shadow-lg backdrop-blur-xs">
                                  <FaPlay size={10} className="ml-0.5" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* DOCS TAB */}
                  {activeTab === "docs" && (
                    <div className="space-y-3">
                      {items.map((item) => {
                        const itemId = item.messageId || item._id;
                        const isSelected = selectedItems.some(
                          (i) => (i.messageId || i._id) === itemId
                        );
                        const isOutgoing =
                          item.isOutgoing ||
                          item.sender?._id === user?._id ||
                          item.sender === "You";
                        const docName = item.docName || item.fileName || "Document.pdf";
                        const sizeStr = formatDocSize(item.fileSize);
                        const isForwarded = item.isForwarded || item.forwarded;
                        const dateDisplay = item.createdAt
                          ? format(new Date(item.createdAt), "dd/MM/yyyy")
                          : "20/09/2026";

                        return (
                          <div
                            key={itemId}
                            className="flex items-start gap-3 select-none group"
                            onContextMenu={(e) => {
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
                          >
                            {/* Checkbox */}
                            {isSelected ? (
                              <div
                                className="pt-3.5 cursor-pointer shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelectItem(item);
                                }}
                              >
                                <div className="w-[18px] h-[18px] rounded-[3px] bg-[#00a884] text-white flex items-center justify-center shadow-sm">
                                  <FaCheck size={10} className="stroke-[2]" />
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`pt-3.5 cursor-pointer shrink-0 transition-opacity duration-150 ${selectedItems.length > 0
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-100"
                                  }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelectItem(item);
                                }}
                              >
                                <div className="w-[18px] h-[18px] rounded-[3px] border-[1.8px] border-[#8696a0]/70 group-hover:border-[#00a884] hover:border-[#00a884] transition-colors" />
                              </div>
                            )}

                            {/* Chat bubble */}
                            <div
                              onClick={() => {
                                if (selectedItems.length > 0) {
                                  toggleSelectItem(item);
                                } else {
                                  handleOpenViewer(item);
                                }
                              }}
                              className={`flex-1 rounded-xl p-2.5 transition-all cursor-pointer shadow-sm relative ${isSelected ? "ring-2 ring-[#00a884]" : ""
                                } ${isOutgoing ? "bg-[#005c4b] text-white" : "bg-[#202c33] text-white"
                                }`}
                            >
                              {/* Down Arrow Menu */}
                              {!isSelected && (
                                <div
                                  className={`absolute top-2 right-2 z-20 flex items-center justify-center rounded-full p-1 cursor-pointer transition-all ${(activeMenu?.item?.messageId || activeMenu?.item?._id) === itemId
                                    ? "opacity-100 bg-black/40 text-white shadow-md scale-105"
                                    : "opacity-0 group-hover:opacity-100 hover:bg-black/30 text-white/80 hover:text-white"
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

                              {/* Forwarded Header */}
                              {isForwarded && (
                                <div className="flex items-center gap-1.5 text-[#8696a0] text-[12px] italic mb-1.5">
                                  <IoArrowRedoOutline className="scale-x-[-1]" size={14} />
                                  <span>Forwarded</span>
                                </div>
                              )}

                              {/* Document preview card */}
                              {item.previewHeader ? (
                                <div className="w-full bg-white text-black p-3 rounded-t-md mb-2 shadow-inner border border-black/10 text-center select-none flex flex-col justify-between min-h-[110px]">
                                  <div className="text-[11px] font-bold tracking-tight text-gray-900 border-b border-black/20 pb-1 uppercase">
                                    {item.previewHeader.split("\n")[0] ||
                                      "MEGHNAD SAHA INSTITUTE OF TECHNOLOGY"}
                                  </div>
                                  <div className="text-[9.5px] text-gray-700 font-semibold my-1">
                                    {item.previewHeader.split("\n")[1] ||
                                      "Computer Science & Engineering"}
                                  </div>
                                  <div className="w-5 h-5 mx-auto my-0.5 rounded-full border border-gray-400 flex items-center justify-center text-[7px] text-gray-500 font-serif font-bold">
                                    ★
                                  </div>
                                  <div className="text-[8.5px] text-gray-600 font-medium tracking-tight">
                                    {docName.replace(/\.pdf$/i, "")}
                                  </div>
                                </div>
                              ) : null}

                              {/* File info row */}
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-9 rounded-[3px] bg-[#e53935] text-white flex flex-col items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                                  <FaFilePdf size={15} />
                                  <span className="text-[7px] font-black tracking-tight mt-0.5">
                                    PDF
                                  </span>
                                </div>

                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-[14px] font-medium truncate leading-snug">
                                    {docName}
                                  </span>
                                  <span className="text-[12px] text-[#8696a0] mt-0.5 truncate">
                                    {item.pageCount || item.pages
                                      ? `${item.pageCount || item.pages} pages • `
                                      : ""}
                                    PDF • {sizeStr || "810 kB"}
                                  </span>
                                </div>
                              </div>

                              {/* Date and ticks */}
                              <div className="flex items-center justify-end gap-1 mt-1 text-[11px] text-[#8696a0]">
                                <span>{dateDisplay}</span>
                                {isOutgoing && (
                                  <MdDoneAll size={15} className="text-[#53bdeb] ml-0.5" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* LINKS TAB */}
                  {activeTab === "links" && (
                    <div className="space-y-3">
                      {items.map((item) => {
                        const itemId = item.messageId || item._id;
                        const isSelected = selectedItems.some(
                          (i) => (i.messageId || i._id) === itemId
                        );
                        const isOutgoing =
                          item.isOutgoing ||
                          item.sender?._id === user?._id ||
                          item.sender === "You";
                        const dateDisplay = item.createdAt
                          ? format(new Date(item.createdAt), "dd/MM/yyyy")
                          : "04/10/2026";
                        const timeDisplay = item.createdAt
                          ? format(new Date(item.createdAt), "HH:mm")
                          : "17:10";
                        const otherPartyName =
                          contact?.username || contact?.fullName || "Contact";

                        return (
                          <div
                            key={itemId}
                            className="select-none group"
                            onContextMenu={(e) => {
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
                          >
                            {/* Header row */}
                            <div
                              onClick={() => {
                                if (selectedItems.length > 0) {
                                  toggleSelectItem(item);
                                }
                              }}
                              className="flex items-center justify-between px-1 py-1 text-[#8696a0] text-[12px] cursor-pointer hover:text-white transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {item.sender?.profilePicture ? (
                                  <img
                                    src={item.sender.profilePicture}
                                    alt=""
                                    className="w-5 h-5 rounded-full object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-[#e53935] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {isOutgoing
                                      ? "Y"
                                      : item.sender?.username?.[0]?.toUpperCase() || "S"}
                                  </div>
                                )}

                                <span className="text-[13px] font-medium text-[#e9edef] truncate">
                                  {isOutgoing
                                    ? `You ▸ ${otherPartyName}`
                                    : `${item.sender?.username || otherPartyName} ▸ You`}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 text-[12px]">
                                <span>{dateDisplay}</span>
                                <MdChevronRight size={16} />
                              </div>
                            </div>

                            {/* Link content row */}
                            <div className="flex items-start gap-3 mt-1">
                              {/* Checkbox */}
                              {isSelected ? (
                                <div
                                  className="pt-3.5 cursor-pointer shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectItem(item);
                                  }}
                                >
                                  <div className="w-[18px] h-[18px] rounded-[3px] bg-[#00a884] text-white flex items-center justify-center shadow-sm">
                                    <FaCheck size={10} className="stroke-[2]" />
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`pt-3.5 cursor-pointer shrink-0 transition-opacity duration-150 ${selectedItems.length > 0
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-100"
                                    }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectItem(item);
                                  }}
                                >
                                  <div className="w-[18px] h-[18px] rounded-[3px] border-[1.8px] border-[#8696a0]/70 group-hover:border-[#00a884] hover:border-[#00a884] transition-colors" />
                                </div>
                              )}

                              {/* Chat bubble */}
                              <div
                                onClick={() => {
                                  if (selectedItems.length > 0) {
                                    toggleSelectItem(item);
                                  }
                                }}
                                className={`flex-1 rounded-xl p-2.5 transition-all shadow-sm relative ${selectedItems.length > 0 ? "cursor-pointer" : ""
                                  } ${isSelected ? "ring-2 ring-[#00a884]" : ""
                                  } ${isOutgoing ? "bg-[#005c4b] text-white" : "bg-[#202c33] text-white"
                                  }`}
                              >
                                {/* Down Arrow Menu */}
                                {!isSelected && (
                                  <div
                                    className={`absolute top-2 right-2 z-20 flex items-center justify-center rounded-full p-1 cursor-pointer transition-all ${(activeMenu?.item?.messageId || activeMenu?.item?._id) === itemId
                                      ? "opacity-100 bg-black/40 text-white shadow-md scale-105"
                                      : "opacity-0 group-hover:opacity-100 hover:bg-black/30 text-white/80 hover:text-white"
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

                                <div className="bg-[#111b21]/75 rounded-lg p-2.5 space-y-1 border border-white/5">
                                  <div className="text-[13.5px] font-bold text-white truncate">
                                    {item.domain || "live-classes.vercel.app"}
                                  </div>
                                  <div className="text-[12px] text-[#8696a0] line-clamp-2 break-all leading-snug">
                                    {item.url}
                                  </div>
                                  <div className="text-[11px] text-[#8696a0] pt-0.5">
                                    {item.domain || "live-classes.vercel.app"}
                                  </div>
                                </div>

                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => {
                                    if (selectedItems.length > 0) e.preventDefault();
                                  }}
                                  className="text-[#00a884] hover:text-[#06cf9c] underline text-[13px] break-all block mt-2 font-normal"
                                >
                                  {item.url}
                                </a>

                                <div className="flex items-center justify-end gap-1 mt-1 text-[11px] text-[#8696a0]">
                                  <span>{timeDisplay}</span>
                                  {isOutgoing && (
                                    <MdDoneAll size={15} className="text-[#53bdeb] ml-0.5" />
                                  )}
                                </div>
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

      {/* Sticky Bottom Action */}
      <div className="shrink-0 h-[52px] border-t px-4 flex items-center justify-center select-none bg-[#111b21] border-[#222d34]">
        <button
          type="button"
          onClick={() => {
            if (openMediaModal) {
              openMediaModal({ scope: "all", initialTab: activeTab });
            }
          }}
          className="flex items-center gap-2 text-[#00a884] hover:text-[#06cf9c] font-medium text-[14px] transition-colors cursor-pointer group"
        >
          {activeTab === "media" ? (
            <HiOutlinePhotograph size={20} className="transition-transform group-hover:scale-105" />
          ) : activeTab === "docs" ? (
            <HiOutlineDocumentText size={20} className="transition-transform group-hover:scale-105" />
          ) : (
            <HiOutlineLink size={20} className="transition-transform group-hover:scale-105" />
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center px-4 backdrop-blur-xs bg-black/60"
          onClick={() => setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-[420px] rounded-2xl shadow-2xl p-6 select-none bg-[#233138] text-[#d1d7db] border border-[#3b4a54]/40"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[17px] font-medium leading-snug text-[#e9edef]">
              Delete {selectedItems.length === 1 ? "message" : `${selectedItems.length} messages`}?
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[#8696a0]">
              {canDeleteForEveryone
                ? "You can delete messages for everyone or just for yourself."
                : "Are you sure you want to delete this message?"}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2 rounded-full border border-[#3b4a54] text-[#00a884] hover:bg-white/5 text-[13.5px] font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => executeDeleteSelected("me")}
                className="px-5 py-2 rounded-full border border-[#3b4a54] text-[#00a884] hover:bg-white/5 text-[13.5px] font-medium transition-colors cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete for me"}
              </button>
              {canDeleteForEveryone && (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => executeDeleteSelected("everyone")}
                  className="px-5 py-2 rounded-full bg-[#00a884] hover:bg-[#02906f] text-[#111b21] text-[13.5px] font-medium transition-colors shadow-sm cursor-pointer"
                >
                  {isDeleting ? "Deleting..." : "Delete for everyone"}
                </button>
              )}
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
            setSelectedItems([]);
          }}
          messages={selectedItems}
        />
      )}

      {/* Media Menu */}
      {activeMenu && (
        <MediaMenu
          item={activeMenu.item}
          position={activeMenu.position}
          onClose={() => setActiveMenu(null)}
          onDownload={(item) => {
            const url = item.url || item.imageOrVideoUrl || item.docUrl || item.fileUrl;
            const name = item.fileName || item.docName || "file";
            handleDownloadFile(null, url, name);
          }}
          onSelect={(item) => toggleSelectItem(item)}
          onForward={(item) => {
            setSelectedItems([item]);
            setShowForwardModal(true);
          }}
          onStar={(item) => {
            const id = item.messageId || item._id;
            useChatStore.getState().toggleStarMessage(id, item);
            toast.success(isMessageStarred(id) ? "Message unstarred" : "Message starred");
          }}
          onDelete={(item) => {
            setSelectedItems([item]);
            setShowDeleteModal(true);
          }}
          isStarred={isMessageStarred(activeMenu.item.messageId || activeMenu.item._id)}
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
          allFiles={filteredItems.map((i) => ({
            url: i.url || i.imageOrVideoUrl || i.docUrl || i.fileUrl,
            name: i.fileName || i.docName || "file",
            fileType: activeTab === "docs" ? "document" : i.mediaType || "image",
            createdAt: i.createdAt,
            sender: i.sender,
            _rawItem: i,
            canDeleteForEveryone: i.sender?._id === user?._id || i.sender === "You",
          }))}
        />
      )}
    </div>
  );
};

export default ContactMedia;
