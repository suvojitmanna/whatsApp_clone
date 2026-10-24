import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";
import { VscSearchLarge } from "react-icons/vsc";
import { RxCross2 } from "react-icons/rx";
import { format } from "date-fns";
import { toast } from "react-toastify";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import useLayoutStore from "../../store/layoutStore";
import { useChatStore, decryptSingleMessage } from "../../store/chatStore";
import axiosInstance from "../../services/url.services";
import FileViewerModal from "../modals/FileViewerModal";
import ForwardModal from "../modals/ForwardModal";
import MediaMenu from "./MediaMenu";
import { FALLBACK_DOCS, FALLBACK_LINKS, FALLBACK_MEDIA } from "../../assets/rawData";

import {
  ContactMediaSkeleton,
  ContactMediaTabContent,
  ContactDocsTabContent,
  ContactLinksTabContent,
  ContactMediaTopBar,
  ContactMediaBottomBar,
  ContactMediaDeleteModal
} from "./contactMedia/index.js";

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
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    let isMounted = true;
    const fetchChatMedia = async () => {
      if (!resolvedConversationId && !contact?._id) {
        setLoading(false);
        return;
      }
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
  const handleExecuteDelete = async (type) => {
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
            <ContactMediaTopBar
              isDark={isDark}
              selectedItems={selectedItems}
              handleCancelSelect={handleCancelSelect}
              handleStarSelected={handleStarSelected}
              areAllStarred={areAllStarred}
              setShowDeleteModal={setShowDeleteModal}
              setShowForwardModal={setShowForwardModal}
              handleDownloadSelected={handleDownloadSelected}
            />
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
                <h2 className={`text-[16px] font-semibold tracking-tight truncate ${isDark ? "text-[#e9edef]" : "text-gray-900"}`}>
                  Media, docs and links
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

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4">
        {loading ? (
          <ContactMediaSkeleton activeTab={activeTab} isDark={isDark} />
        ) : groupedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center px-6 select-none">
            <h4
              className={`text-[18px] font-bold mb-1.5 ${isDark ? "text-white" : "text-gray-900"
                }`}
            >
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

                  {activeTab === "media" && (
                    <ContactMediaTabContent
                      items={items}
                      isDark={isDark}
                      selectedItems={selectedItems}
                      toggleSelectItem={toggleSelectItem}
                      handleOpenViewer={handleOpenViewer}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      isMessageStarred={isMessageStarred}
                      starredMessages={starredMessages}
                    />
                  )}

                  {activeTab === "docs" && (
                    <ContactDocsTabContent
                      items={items}
                      isDark={isDark}
                      selectedItems={selectedItems}
                      toggleSelectItem={toggleSelectItem}
                      handleOpenViewer={handleOpenViewer}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      isMessageStarred={isMessageStarred}
                      starredMessages={starredMessages}
                      user={user}
                    />
                  )}

                  {activeTab === "links" && (
                    <ContactLinksTabContent
                      items={items}
                      isDark={isDark}
                      selectedItems={selectedItems}
                      toggleSelectItem={toggleSelectItem}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      isMessageStarred={isMessageStarred}
                      starredMessages={starredMessages}
                      user={user}
                      contact={contact}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ContactMediaBottomBar
        isDark={isDark}
        activeTab={activeTab}
        openMediaModal={openMediaModal}
      />

      <ContactMediaDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        isDark={isDark}
        canDeleteForEveryone={canDeleteForEveryone}
        handleExecuteDelete={handleExecuteDelete}
        selectedCount={selectedItems.length}
      />

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

      {activeMenu && (
        <MediaMenu
          isOpen={Boolean(activeMenu)}
          item={activeMenu.item}
          type={activeMenu.type || (activeTab === "links" ? "link" : activeTab === "docs" ? "doc" : "media")}
          position={activeMenu.position}
          onClose={() => setActiveMenu(null)}
          onOpenLink={(item) => {
            if (item?.url) {
              window.open(item.url, "_blank", "noopener,noreferrer");
            }
          }}
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
