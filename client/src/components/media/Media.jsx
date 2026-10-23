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
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import useLayoutStore from "../../store/layoutStore";
import { useChatStore, decryptSingleMessage } from "../../store/chatStore";
import axiosInstance from "../../services/url.services";
import FileViewerModal from "../modals/FileViewerModal";
import ForwardModal from "../modals/ForwardModal";
import MediaMenu from "./MediaMenu";
import { copyImageToClipboard } from "../../utils/clipboardUtils";
import { FALLBACK_DOCS, FALLBACK_LINKS, FALLBACK_MEDIA } from "../../assets/rawData";

export { WhatsAppMediaFolderIcon } from "../common/Icons";

import {
  formatDocSize,
  formatVideoDuration,
  parseFileSize,
  getFileIcon,
  formatDateGroup,
  calculateTotalSize,
  getSenderDisplay,
  getAttachedMessage,
  VideoThumbnail,
  MediaSkeletonLoader,
  MediaTabContent,
  DocsTabContent,
  LinksTabContent,
  MediaActionBar
} from "./mediaView";

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
                    <MediaTabContent
                      items={items}
                      mode={mode}
                      isDark={isDark}
                      selectedItems={selectedItems}
                      isSelectMode={isSelectMode}
                      setIsSelectMode={setIsSelectMode}
                      toggleSelectItem={toggleSelectItem}
                      handleOpenViewer={handleOpenViewer}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      isMessageStarred={isMessageStarred}
                      starredMessages={starredMessages}
                    />
                  )}

                  {activeTab === "docs" && (
                    <DocsTabContent
                      items={items}
                      isDark={isDark}
                      selectedItems={selectedItems}
                      isSelectMode={isSelectMode}
                      setIsSelectMode={setIsSelectMode}
                      toggleSelectItem={toggleSelectItem}
                      handleOpenViewer={handleOpenViewer}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      isMessageStarred={isMessageStarred}
                      starredMessages={starredMessages}
                      handleDownloadFile={handleDownloadFile}
                    />
                  )}

                  {activeTab === "links" && (
                    <LinksTabContent
                      items={items}
                      isDark={isDark}
                      selectedItems={selectedItems}
                      isSelectMode={isSelectMode}
                      setIsSelectMode={setIsSelectMode}
                      toggleSelectItem={toggleSelectItem}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      isMessageStarred={isMessageStarred}
                      starredMessages={starredMessages}
                      handleCopyLink={handleCopyLink}
                      copiedId={copiedId}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MediaActionBar
        scope={scope}
        isSelectMode={isSelectMode}
        isDark={isDark}
        setScope={setScope}
        setSelectedContactFilter={setSelectedContactFilter}
        activeTab={activeTab}
        selectedItems={selectedItems}
        handleCancelSelect={handleCancelSelect}
        selectedTotalSize={selectedTotalSize}
        handleStarSelected={handleStarSelected}
        areAllStarred={areAllStarred}
        setShowDeleteModal={setShowDeleteModal}
        handleForwardSelected={handleForwardSelected}
        handleDownloadSelected={handleDownloadSelected}
      />

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
          type={activeMenu.type || (activeTab === "links" ? "link" : activeTab === "docs" ? "doc" : "media")}
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