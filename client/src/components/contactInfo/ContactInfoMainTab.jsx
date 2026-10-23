import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FaPen,
  FaPhone,
  FaSearch,
  FaVideo,
  FaLock,
  FaCheck,
  FaStar,
  FaHeart,
  FaBookmark,
  FaUsers,
  FaRegHeart,
} from "react-icons/fa";
import { RxCross2, RxExit } from "react-icons/rx";
import { IoMdRemoveCircleOutline } from "react-icons/io";
import { BsEmojiSmile } from "react-icons/bs";
import { TbCameraPlus } from "react-icons/tb";
import EmojiPicker from "emoji-picker-react";
import {
  IoTimerOutline,
  IoColorPaletteOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import {
  MdChevronRight,
  MdBlock,
  MdThumbDown,
  MdShield,
  MdList,
  MdOutlineChat,
  MdOutlineVisibility,
  MdOutlinePhotoCamera,
  MdOutlineFolder,
  MdOutlineEmojiEmotions,
  MdDeleteOutline,
} from "react-icons/md";
import { FiUserPlus, FiTag } from "react-icons/fi";
import { LuDownload } from "react-icons/lu";
import { HiOutlineInformationCircle } from "react-icons/hi";
import { toast } from "react-toastify";
import axiosInstance from "../../services/url.services";
import { WhatsAppMediaFolderIcon } from "../common/Icons";
import { FALLBACK_MEDIA } from "../../assets/rawData";
import { MetaAiRing, MetaAiBadge } from "../common/MetaAiIcon";
import FileViewerModal from "../FileViewerModal";
import CameraModal from "../CameraModal";
import { ActionButton, AVATAR_BG_COLORS } from "./shared";
import ContactInfoGroupMembersSection from "./ContactInfoGroupMembersSection";
import useOutsideClick from "../../hook/useOutsideClick";
import { useChatStore } from "../../store/chatStore";
import useLayoutStore from "../../store/layoutStore";
import useVideoCallStore from "../../store/videoCallStore";

const ContactInfoMainTab = ({
  theme,
  user,
  selectedContact,
  chatId,
  isGroup,
  isMetaAi,
  groupAdmins = [],
  groupParticipants = [],
  groupOnlineCount = 0,
  canAddMembers,
  isCurrentUserAdmin,
  viewingMember,
  setViewingMember,
  isViewingMemberOnline,
  isViewingMemberBlocked,
  isBlocked,
  online,
  commonGroups = [],
  contactLists = [],
  chatStarredMessages = [],
  chatKeptMessages = [],
  disappearingDuration = "Off",
  activeChatTheme,
  activeBubbleColor,
  messages = [],
  starredMessages = {},
  isMessageStarred,
  setShowAddMemberModal,
  setShowReportModal,
  setShowAboutAiModal,
  setShowProfilePicture,
  setConfirmModalConfig,
  setContactInfoTab,
  setIsChatSearchOpen,
  handleAudioCall,
  handleVideoCall,
  handleGroupCall,
  handleExecuteClearChat,
  handleToggleBlock,
  handleToggleBlockMember,
  getAvatarColor,
  memberTags = [],
  myMemberTag,
  onlineUsers,
  isUserOnline,
  handleToggleMemberAdmin,
  handleRemoveMember,
  handleSaveMemberTag,
  memberTagPromptOpen,
  setMemberTagPromptOpen,
  editingMemberForTag,
  setEditingMemberForTag,
  userMemberTag,
  setUserMemberTag,
  isSavingMemberTag,
}) => {
  const groupName =
    selectedContact?.groupName ||
    selectedContact?.name ||
    selectedContact?.conversation?.groupName ||
    "Group";
  const groupDescription =
    selectedContact?.groupDescription ||
    selectedContact?.conversation?.groupDescription ||
    "";

  const [showGroupPhotoMenu, setShowGroupPhotoMenu] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showEmojiStickerModal, setShowEmojiStickerModal] = useState(false);
  const [isUploadingGroupImage, setIsUploadingGroupImage] = useState(false);
  const [selectedEmojiAvatar, setSelectedEmojiAvatar] = useState("😀");
  const [selectedBgColor, setSelectedBgColor] = useState(AVATAR_BG_COLORS[0]);
  const groupPhotoMenuRef = useRef(null);
  const groupImageInputRef = useRef(null);

  useOutsideClick(groupPhotoMenuRef, () => {
    if (showGroupPhotoMenu) setShowGroupPhotoMenu(false);
  });
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState("");
  const [showNameEmoji, setShowNameEmoji] = useState(false);
  const nameEmojiRef = useRef(null);

  useOutsideClick(nameEmojiRef, () => {
    if (showNameEmoji) setShowNameEmoji(false);
  });
  const [isEditingGroupDesc, setIsEditingGroupDesc] = useState(false);
  const [editedGroupDesc, setEditedGroupDesc] = useState("");
  const [showDescEmoji, setShowDescEmoji] = useState(false);
  const descEmojiRef = useRef(null);

  useOutsideClick(descEmojiRef, () => {
    if (showDescEmoji) setShowDescEmoji(false);
  });
  const [chatMediaCount, setChatMediaCount] = useState(0);
  const [chatMediaList, setChatMediaList] = useState([]);
  const [previewModalFile, setPreviewModalFile] = useState(null);
  const [previewModalIndex, setPreviewModalIndex] = useState(0);

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
    } catch (e) {
      toast.error("Failed to update favorites", e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      if (!chatId) return;
      try {
        const { data } = await axiosInstance.get("/chat/media", {
          params: { conversationId: chatId },
        });
        const total = data?.data?.counts?.total ?? data?.counts?.total ?? 0;
        const media = data?.data?.media ?? data?.media ?? [];
        if (isMounted) {
          setChatMediaCount(total);
          if (Array.isArray(media)) {
            setChatMediaList(media);
          }
        }
      } catch {
        if (Array.isArray(messages) && isMounted) {
          const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
          const count = messages.filter((m) => {
            if (!m || m.deletedForEveryone) return false;
            return (
              m.imageOrVideoUrl ||
              m.fileUrl ||
              m.fileName ||
              (m.content && urlRegex.test(m.content))
            );
          }).length;
          setChatMediaCount(count);
        }
      }
    };
    fetchCount();
    return () => {
      isMounted = false;
    };
  }, [chatId, messages?.length]);

  const isItemStarred = useCallback(
    (item) => {
      if (!item) return false;
      const itemId = (item._id || item.messageId || item.temp)?.toString();
      if (itemId && starredMessages?.[itemId]) return true;
      if (isMessageStarred && itemId && isMessageStarred(itemId)) return true;
      if (
        itemId &&
        chatStarredMessages.some(
          (sm) => (sm.messageId || sm.message?._id)?.toString() === itemId
        )
      ) {
        return true;
      }
      return false;
    },
    [starredMessages, isMessageStarred, chatStarredMessages]
  );

  const previewImages = useMemo(() => {
    const list = [];
    const seen = new Set();
    const currentUserId = user?._id?.toString();

    if (Array.isArray(messages)) {
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (!m || m.deletedForEveryone) continue;
        if (
          currentUserId &&
          m.deletedFor &&
          Array.isArray(m.deletedFor) &&
          m.deletedFor.some((id) => String(id) === currentUserId)
        ) {
          continue;
        }

        const isVideo =
          m.contentType === "video" ||
          Boolean(
            (m.imageOrVideoUrl || m.url) &&
            (m.imageOrVideoUrl || m.url).match(/\.(mp4|webm|mov|mkv)($|\?)/i)
          );
        const isImage =
          m.contentType === "image" ||
          Boolean((m.imageOrVideoUrl || m.url) && !isVideo);

        if (isImage) {
          const src = m.imageOrVideoUrl || m.url;
          const id = String(m._id || m.temp || src);
          if (src && !seen.has(id) && !seen.has(src)) {
            seen.add(id);
            seen.add(src);
            list.push({
              _id: m._id || m.temp,
              messageId: m._id || m.temp,
              url: src,
              createdAt: m.createdAt,
            });
          }
        }
      }
    }

    if (Array.isArray(chatMediaList)) {
      chatMediaList.forEach((m) => {
        if (!m) return;
        const isVideo =
          m.mediaType === "video" ||
          m.contentType === "video" ||
          Boolean(
            (m.url || m.imageOrVideoUrl) &&
            (m.url || m.imageOrVideoUrl).match(/\.(mp4|webm|mov|mkv)($|\?)/i)
          );
        const isImage =
          m.mediaType === "image" ||
          m.contentType === "image" ||
          Boolean((m.url || m.imageOrVideoUrl) && !isVideo);

        if (isImage) {
          const src = m.url || m.imageOrVideoUrl;
          const id = String(m._id || m.messageId || src);
          if (src && !seen.has(id) && !seen.has(src)) {
            seen.add(id);
            seen.add(src);
            list.push({
              ...m,
              _id: m._id || m.messageId || id,
              messageId: m._id || m.messageId || id,
              url: src,
            });
          }
        }
      });
    }

    if (list.length === 0 && Array.isArray(FALLBACK_MEDIA)) {
      return FALLBACK_MEDIA.filter((m) => m.mediaType === "image").slice(0, 4);
    }

    return list.slice(0, 4);
  }, [messages, chatMediaList, user?._id]);

  const handleOpenImagePreview = (item, idx, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const url = item.url || item.imageOrVideoUrl;
    if (!url) return;

    setPreviewModalIndex(idx);
    setPreviewModalFile({
      url,
      name: item.fileName || "image.jpg",
      type: "image",
      fileType: "image",
      size: item.fileSize,
      sender: item.sender,
      createdAt: item.createdAt,
      items: previewImages.map((p) => ({
        url: p.url,
        name: p.fileName || "image.jpg",
        type: "image",
      })),
    });
  };

  const handleMessageMember = (member) => {
    if (!member) return;
    const memberId = (member._id || member.id || member)?.toString();
    if (!memberId) return;

    const convList = Array.isArray(useChatStore.getState().conversations?.data)
      ? useChatStore.getState().conversations.data
      : [];
    const existingConv = convList.find((c) => {
      if (c.isGroup || c.isGroupChat || c.conversation?.isGroup) return false;
      const parts = c.participants || c.conversation?.participants || [];
      return parts.some((p) => (p?._id || p)?.toString() === memberId);
    });

    const userList = Array.isArray(useChatStore.getState().users)
      ? useChatStore.getState().users
      : [];
    const matchedUser = userList.find(
      (u) => (u._id || u.id)?.toString() === memberId
    );

    const contactToSelect = {
      ...(matchedUser || {}),
      ...member,
      _id: memberId,
      id: memberId,
      username: member.username || member.name || matchedUser?.username || "Contact",
      name: member.username || member.name || matchedUser?.name || "Contact",
      profilePicture: member.profilePicture || matchedUser?.profilePicture || "",
      about: member.about || matchedUser?.about || "Hey there! I am using WhatsApp.",
      phoneNumber: member.phoneNumber || matchedUser?.phoneNumber || "",
      conversation: existingConv || matchedUser?.conversation || null,
      isGroup: false,
      isGroupChat: false,
    };

    useLayoutStore.getState().setSelectedContact(contactToSelect);
    useChatStore.getState().clearUnreadCount(memberId);
    if (existingConv?._id) {
      useChatStore.getState().clearUnreadCount(existingConv._id);
    }

    setViewingMember(null);
    useLayoutStore.getState().setShowContactInfo(false);
  };

  const handleOpenCommonGroup = (groupConv) => {
    if (!groupConv) return;
    const convId = (groupConv._id || groupConv.id)?.toString();
    const groupContact = {
      ...groupConv,
      _id: convId,
      id: convId,
      isGroup: true,
      isGroupChat: true,
      groupName: groupConv.groupName || groupConv.name || "Group",
      name: groupConv.groupName || groupConv.name || "Group",
      username: groupConv.groupName || groupConv.name || "Group",
      profilePicture: groupConv.groupProfileImage || groupConv.profilePicture || "",
      groupProfileImage: groupConv.groupProfileImage || groupConv.profilePicture || "",
      groupAdmin: groupConv.groupAdmin,
      groupDescription: groupConv.groupDescription || "",
      about: groupConv.groupDescription || "",
      groupPermissions: groupConv.groupPermissions,
      participants: groupConv.participants || [],
      conversation: groupConv,
    };
    useLayoutStore.getState().setSelectedContact(groupContact);
    useChatStore.getState().clearUnreadCount(convId);
    setViewingMember(null);
    useLayoutStore.getState().setShowContactInfo(false);
  };

  const handleAudioCallMember = (member) => {
    if (!member) return;
    const mId = (member._id || member.id || member)?.toString();
    const isOnlineMember =
      typeof isUserOnline === "function"
        ? isUserOnline(mId)
        : Boolean(member?.isOnline);
    if (!isOnlineMember) {
      toast.info("User is offline. Cannot initiate the call");
      return;
    }
    const { initiateCall } = useVideoCallStore.getState();
    if (typeof initiateCall !== "function") {
      toast.error("Call service not ready. Please try again.");
      return;
    }
    const avatar = member?.profilePicture;
    initiateCall(
      mId,
      member?.username || member?.name || "Participant",
      avatar,
      "audio"
    );
  };

  const handleVideoCallMember = (member) => {
    if (!member) return;
    const mId = (member._id || member.id || member)?.toString();
    const isOnlineMember =
      typeof isUserOnline === "function"
        ? isUserOnline(mId)
        : Boolean(member?.isOnline);
    if (!isOnlineMember) {
      toast.info("User is offline. Cannot initiate the call");
      return;
    }
    const { initiateCall } = useVideoCallStore.getState();
    if (typeof initiateCall !== "function") {
      toast.error("Call service not ready. Please try again.");
      return;
    }
    const avatar = member?.profilePicture;
    initiateCall(
      mId,
      member?.username || member?.name || "Participant",
      avatar,
      "video"
    );
  };

  const handleSaveGroupName = async () => {
    const trimmed = editedGroupName.trim();
    if (!trimmed) {
      toast.error("Group name cannot be empty");
      return;
    }
    const convId = (
      selectedContact?.conversation?._id ||
      selectedContact?._id
    )?.toString();
    try {
      await axiosInstance.put(`/chat/group/${convId}`, {
        groupName: trimmed,
      });
      useChatStore.getState().updateGroupInfo(convId, {
        groupName: trimmed,
        name: trimmed,
        username: trimmed,
      });
      useLayoutStore.getState().setSelectedContact((prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...prev,
          username: trimmed,
          name: trimmed,
          groupName: trimmed,
          conversation: {
            ...prev?.conversation,
            groupName: trimmed,
          },
        };
      });
      setIsEditingGroupName(false);
      setShowNameEmoji(false);
      toast.success("Group name updated");
    } catch (err) {
      console.error("Error updating group name:", err);
      toast.error(err?.response?.data?.message || "Failed to update group name");
    }
  };

  const handleSaveGroupDesc = async () => {
    const convId = (
      selectedContact?.conversation?._id ||
      selectedContact?._id
    )?.toString();
    try {
      const trimmed = editedGroupDesc.trim();
      await axiosInstance.put(`/chat/group/${convId}`, {
        groupDescription: trimmed,
      });
      useChatStore.getState().updateGroupInfo(convId, {
        groupDescription: trimmed,
      });
      useLayoutStore.getState().setSelectedContact((prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...prev,
          groupDescription: trimmed,
          conversation: {
            ...prev?.conversation,
            groupDescription: trimmed,
          },
        };
      });
      setIsEditingGroupDesc(false);
      setShowDescEmoji(false);
      toast.success("Group description updated");
    } catch (err) {
      console.error("Error updating group description:", err);
      toast.error(err?.response?.data?.message || "Failed to update group description");
    }
  };

  const uploadAndSetGroupImage = async (file) => {
    const convId = (
      selectedContact?.conversation?._id ||
      selectedContact?._id
    )?.toString();
    if (!convId || !file) return;

    setIsUploadingGroupImage(true);
    const loadingToast = toast.loading("Updating group photo...");
    try {
      const formData = new FormData();
      formData.append("media", file);

      const { data } = await axiosInstance.put(`/chat/group/${convId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated = data?.data || data;
      const newImageUrl = updated?.groupProfileImage || "";

      useChatStore.getState().updateGroupInfo(convId, {
        groupProfileImage: newImageUrl,
        profilePicture: newImageUrl,
      });
      useLayoutStore.getState().setSelectedContact((prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...prev,
          groupProfileImage: newImageUrl,
          profilePicture: newImageUrl,
          conversation: {
            ...prev?.conversation,
            groupProfileImage: newImageUrl,
            profilePicture: newImageUrl,
          },
        };
      });
      toast.update(loadingToast, {
        render: "Group photo updated",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (err) {
      console.error("Error updating group photo:", err);
      toast.update(loadingToast, {
        render: err?.response?.data?.message || "Failed to update group photo",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsUploadingGroupImage(false);
    }
  };

  const handleGroupImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }
    await uploadAndSetGroupImage(file);
    e.target.value = "";
  };

  const handleRemoveGroupImage = async () => {
    const convId = (
      selectedContact?.conversation?._id ||
      selectedContact?._id
    )?.toString();
    if (!convId) return;

    setIsUploadingGroupImage(true);
    const loadingToast = toast.loading("Removing group photo...");
    try {
      await axiosInstance.put(`/chat/group/${convId}`, {
        groupProfileImage: "",
      });
      useChatStore.getState().updateGroupInfo(convId, {
        groupProfileImage: "",
        profilePicture: "",
      });
      useLayoutStore.getState().setSelectedContact((prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...prev,
          groupProfileImage: "",
          profilePicture: "",
          conversation: {
            ...prev?.conversation,
            groupProfileImage: "",
            profilePicture: "",
          },
        };
      });
      toast.update(loadingToast, {
        render: "Group photo removed",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (err) {
      console.error("Error removing group photo:", err);
      toast.update(loadingToast, {
        render: err?.response?.data?.message || "Failed to remove group photo",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsUploadingGroupImage(false);
    }
  };

  const handleSaveEmojiAvatar = async () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.arc(256, 256, 256, 0, Math.PI * 2);
      ctx.fillStyle = selectedBgColor;
      ctx.fill();

      ctx.font = "260px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(selectedEmojiAvatar, 256, 280);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `group_avatar_${Date.now()}.png`, {
          type: "image/png",
        });
        setShowEmojiStickerModal(false);
        await uploadAndSetGroupImage(file);
      }, "image/png");
    } catch (err) {
      console.error("Error generating emoji avatar:", err);
      toast.error("Failed to set emoji avatar");
    }
  };

  const handleExitGroup = () => {
    const convId = (
      selectedContact?.conversation?._id ||
      selectedContact?._id
    )?.toString();
    if (!convId) return;

    setConfirmModalConfig({
      title: `Exit "${groupName}" group?`,
      description: "Only group admins will be notified that you left the group.",
      confirmText: "Exit group",
      isDanger: true,
      onConfirm: async () => {
        try {
          await axiosInstance.put(`/chat/group/${convId}`, {
            removeParticipant: user?._id,
          });
          useLayoutStore.getState().setShowContactInfo(false);
          useLayoutStore.getState().setSelectedContact(null);
          toast.info("You left the group");
        } catch (err) {
          console.error("Error exiting group:", err);
          toast.error("Failed to exit group");
        }
      },
    });
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
      const isMe = String(msg.sender?._id || msg.sender) === String(user?._id);
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

  const renderCommonGroupsCard = () => {
    return (
      <div
        className={`relative p-3.5 rounded-2xl transition-all duration-200 border ${theme === "dark"
          ? "bg-white/[0.03] border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
          : "bg-white border-gray-200 shadow-xs"
          }`}
      >
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <p className="text-[13px] font-medium text-[#8696a0]">
            Groups in common
          </p>
          <span className="text-[12px] font-medium text-[#8696a0] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
            {commonGroups.length}
          </span>
        </div>

        {commonGroups.length === 0 ? (
          <p className="text-[13px] text-[#8696a0] px-1 py-1.5">
            No groups in common
          </p>
        ) : (
          <div className="space-y-1 mt-1">
            {commonGroups.map((group) => {
              const gName = group.groupName || group.name || "Group";
              const gPic = group.groupProfileImage || group.profilePicture;
              const gParts = group.participants || group.conversation?.participants || [];
              const partNames = gParts
                .map((p) => {
                  const pId = (p?._id || p)?.toString();
                  if (pId === user?._id?.toString()) return "You";
                  return p?.username || p?.name;
                })
                .filter(Boolean)
                .slice(0, 4)
                .join(", ");

              return (
                <div
                  key={group._id || group.id}
                  onClick={() => handleOpenCommonGroup(group)}
                  className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-black/5"
                    }`}
                  title={`Open ${gName}`}
                >
                  <div
                    className={`relative shrink-0 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center ${theme === "dark" ? "bg-[#2a3942]" : "bg-gray-100"
                      } border border-white/10`}
                  >
                    {gPic ? (
                      <img
                        src={gPic}
                        alt={gName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white font-semibold text-[16px]"
                        style={{ backgroundColor: getAvatarColor(gName) }}
                      >
                        <FaUsers size={18} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5
                      className={`text-[14.5px] font-medium truncate ${theme === "dark" ? "text-[#e9edef]" : "text-gray-800"
                        }`}
                    >
                      {gName}
                    </h5>
                    <p
                      className={`text-[12px] truncate ${theme === "dark" ? "text-[#8696a0]" : "text-gray-500"
                        }`}
                    >
                      {partNames
                        ? `${partNames}${gParts.length > 4 ? ` +${gParts.length - 4}` : ""}`
                        : `${gParts.length} members`}
                    </p>
                  </div>
                  <MdChevronRight size={18} className="text-[#8696a0]" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const getMemberTagForHeader = (memberId) => {
    if (!memberId || !memberTags || memberTags.length === 0) return "";
    const mId = memberId.toString();
    const found = memberTags.find(
      (mt) => (mt.user?._id || mt.user)?.toString() === mId
    );
    return found?.tag || "";
  };

  return (
    <>
      <motion.div
        key="tab-info"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col items-center pt-5 px-4 sm:px-5 pb-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-600/30 scrollbar-track-transparent"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative flex items-center justify-center"
        >
          {viewingMember ? (
            <div
              onClick={() => {
                if (
                  viewingMember?.profilePicture &&
                  !viewingMember.profilePicture.includes("default-avatar")
                ) {
                  setShowProfilePicture(true, {
                    image: viewingMember.profilePicture,
                    username:
                      viewingMember.username || viewingMember.name || "Member",
                  });
                }
              }}
              className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex items-center justify-center overflow-hidden border-2 ${theme === "dark"
                ? "border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                : "border-gray-200 shadow-md"
                } cursor-pointer select-none`}
            >
              {viewingMember?.profilePicture &&
                !viewingMember.profilePicture.includes("default-avatar") ? (
                <img
                  src={viewingMember.profilePicture}
                  alt={viewingMember.username || viewingMember.name || "Member"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-semibold text-5xl"
                  style={{
                    backgroundColor: getAvatarColor(
                      viewingMember.username || viewingMember.name || "Participant"
                    ),
                  }}
                >
                  {(
                    (viewingMember.username || viewingMember.name || "U")[0] || "U"
                  ).toUpperCase()}
                </div>
              )}
            </div>
          ) : isMetaAi ? (
            <div
              onClick={() =>
                setShowProfilePicture(true, {
                  image: selectedContact?.profilePicture || "/default-avatar.png",
                  username: "Meta AI",
                })
              }
              className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center cursor-pointer select-none"
            >
              <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl" />
              <MetaAiRing size={140} animate className="relative z-10 drop-shadow-xl" />
              <div className="absolute -bottom-1 -right-1 z-20">
                <MetaAiBadge size={28} />
              </div>
            </div>
          ) : isGroup ? (
            <div className="relative group/avatar">
              <div
                onClick={() => {
                  if (
                    selectedContact?.profilePicture ||
                    selectedContact?.groupProfileImage
                  ) {
                    setShowProfilePicture(true, {
                      image:
                        selectedContact?.profilePicture ||
                        selectedContact?.groupProfileImage,
                      username: groupName,
                    });
                  } else {
                    setShowGroupPhotoMenu(true);
                  }
                }}
                className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex items-center justify-center overflow-hidden border-2 ${theme === "dark"
                  ? "border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.5)] bg-[#2a3942]"
                  : "border-gray-200 shadow-md bg-gray-200"
                  } cursor-pointer select-none`}
              >
                {selectedContact?.profilePicture ||
                  selectedContact?.groupProfileImage ? (
                  <img
                    src={
                      selectedContact.profilePicture ||
                      selectedContact.groupProfileImage
                    }
                    alt={groupName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white"
                    style={{ backgroundColor: getAvatarColor(groupName) }}
                  >
                    <FaUsers size={68} />
                  </div>
                )}

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGroupPhotoMenu((prev) => !prev);
                  }}
                  className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-1.5 text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 backdrop-blur-[2px]"
                >
                  <TbCameraPlus size={30} />
                  <span className="text-[11px] font-medium tracking-wide uppercase">
                    Change Photo
                  </span>
                </div>
              </div>

              {showGroupPhotoMenu && (
                <div
                  ref={groupPhotoMenuRef}
                  className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 rounded-2xl shadow-2xl py-2 z-50 border select-none animate-in fade-in zoom-in-95 duration-150 ${theme === "dark"
                    ? "bg-[#233138] border-white/10"
                    : "bg-white border-black/10"
                    }`}
                >
                  {(selectedContact?.profilePicture ||
                    selectedContact?.groupProfileImage) && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowGroupPhotoMenu(false);
                          setShowProfilePicture(true, {
                            image:
                              selectedContact?.profilePicture ||
                              selectedContact?.groupProfileImage,
                            username: groupName,
                          });
                        }}
                        className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-[14px] font-normal transition-colors cursor-pointer text-left ${theme === "dark"
                          ? "text-[#e9edef] hover:bg-[#182229]"
                          : "text-gray-800 hover:bg-gray-100"
                          }`}
                      >
                        <MdOutlineVisibility size={20} className="text-[#8696a0] shrink-0" />
                        <span>View photo</span>
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowGroupPhotoMenu(false);
                      setShowCameraModal(true);
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-[14px] font-normal transition-colors cursor-pointer text-left ${theme === "dark"
                      ? "text-[#e9edef] hover:bg-[#182229]"
                      : "text-gray-800 hover:bg-gray-100"
                      }`}
                  >
                    <MdOutlinePhotoCamera size={20} className="text-[#8696a0] shrink-0" />
                    <span>Take photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGroupPhotoMenu(false);
                      groupImageInputRef.current?.click();
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-[14px] font-normal transition-colors cursor-pointer text-left ${theme === "dark"
                      ? "text-[#e9edef] hover:bg-[#182229]"
                      : "text-gray-800 hover:bg-gray-100"
                      }`}
                  >
                    <MdOutlineFolder size={20} className="text-[#8696a0] shrink-0" />
                    <span>Upload photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGroupPhotoMenu(false);
                      setShowEmojiStickerModal(true);
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-[14px] font-normal transition-colors cursor-pointer text-left ${theme === "dark"
                      ? "text-[#e9edef] hover:bg-[#182229]"
                      : "text-gray-800 hover:bg-gray-100"
                      }`}
                  >
                    <MdOutlineEmojiEmotions size={20} className="text-[#8696a0] shrink-0" />
                    <span>Emoji & sticker</span>
                  </button>
                  {(selectedContact?.profilePicture ||
                    selectedContact?.groupProfileImage) && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowGroupPhotoMenu(false);
                          handleRemoveGroupImage();
                        }}
                        className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-[14px] font-normal transition-colors cursor-pointer text-left text-red-500 hover:text-red-600 ${theme === "dark" ? "hover:bg-[#182229]" : "hover:bg-red-50"
                          }`}
                      >
                        <MdDeleteOutline size={20} className="text-red-500 shrink-0" />
                        <span>Remove photo</span>
                      </button>
                    )}
                </div>
              )}
            </div>
          ) : (
            <img
              src={selectedContact?.profilePicture || "/default-avatar.png"}
              alt={selectedContact?.username}
              onClick={() =>
                setShowProfilePicture(true, {
                  image: selectedContact?.profilePicture,
                  username: selectedContact?.username,
                })
              }
              className={`w-36 h-36 sm:w-40 sm:h-40 rounded-full object-cover border-2 ${theme === "dark"
                ? "border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                : "border-gray-200 shadow-md"
                } cursor-pointer`}
            />
          )}

          {((viewingMember && isViewingMemberOnline) ||
            (!viewingMember && online && !isMetaAi && !isGroup)) && (
              <span
                className="absolute bottom-2 right-2 w-4 h-4 bg-[#00a884] border-2 border-[#111b21] rounded-full shadow-md"
                title={viewingMember ? (isViewingMemberOnline ? "Online" : "Offline") : "Online"}
              />
            )}
        </motion.div>

        <div className="text-center mb-4 sm:mb-5 w-full flex flex-col items-center">
          {viewingMember ? (
            <div className="flex flex-col items-center w-full">
              <h2
                className={`text-2xl font-bold tracking-tight mb-1 transition-colors duration-300 flex items-center justify-center gap-2 ${theme === "dark" ? "text-white/95" : "text-gray-900"
                  }`}
              >
                <span>{viewingMember?.username || viewingMember?.name || "Participant"}</span>
              </h2>
              {getMemberTagForHeader(viewingMember?._id || viewingMember?.id) && (
                <div className="mt-0.5 mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[12px] font-medium border shadow-sm ${theme === "dark"
                      ? "bg-[#16312e] text-[#00a884] border-[#00a884]/30"
                      : "bg-[#e0f0e9] text-[#00897b] border-[#00897b]/30"
                      }`}
                  >
                    <FiTag className="w-3 h-3" />
                    {getMemberTagForHeader(viewingMember?._id || viewingMember?.id)}
                  </span>
                </div>
              )}
              <div className="flex flex-col items-center gap-1">
                {viewingMember?.phoneNumber && (
                  <p
                    className={`text-[13px] font-medium transition-colors duration-300 ${theme === "dark" ? "text-[#8696a0]" : "text-gray-500"
                      }`}
                  >
                    {viewingMember.phoneNumber}
                  </p>
                )}
                {viewingMember?.email && (
                  <p
                    className={`text-[13px] font-medium transition-colors duration-300 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                  >
                    {viewingMember.email}
                  </p>
                )}
                {isViewingMemberOnline && (
                  <span className="text-[12px] text-emerald-500 font-medium">online</span>
                )}
              </div>
            </div>
          ) : isGroup ? (
            <div className="flex flex-col items-center w-full">
              {!isEditingGroupName ? (
                <div className="flex items-center justify-center gap-2 max-w-full px-4">
                  <h2
                    className={`text-2xl font-bold tracking-tight truncate ${theme === "dark" ? "text-white/95" : "text-gray-900"
                      }`}
                  >
                    {groupName}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setEditedGroupName(groupName);
                      setIsEditingGroupName(true);
                      setShowNameEmoji(false);
                    }}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all cursor-pointer shrink-0"
                    title="Edit group name"
                  >
                    <FaPen size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative w-full max-w-[320px] flex flex-col items-center">
                  <div className="flex items-center gap-2 w-full border-b-2 border-emerald-500 pb-1">
                    <input
                      type="text"
                      autoFocus
                      maxLength={100}
                      value={editedGroupName}
                      onChange={(e) => setEditedGroupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveGroupName();
                        if (e.key === "Escape") {
                          setIsEditingGroupName(false);
                          setShowNameEmoji(false);
                        }
                      }}
                      className={`w-full bg-transparent border-none outline-none text-center text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNameEmoji((prev) => !prev)}
                      className="text-gray-400 hover:text-emerald-500 transition p-1 cursor-pointer shrink-0"
                      title="Add emoji"
                    >
                      <BsEmojiSmile size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveGroupName}
                      className="text-emerald-500 hover:text-emerald-400 hover:scale-110 active:scale-95 transition p-1 cursor-pointer shrink-0"
                      title="Save group name"
                    >
                      <FaCheck size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingGroupName(false);
                        setShowNameEmoji(false);
                      }}
                      className="text-gray-400 hover:text-red-500 transition p-1 cursor-pointer shrink-0"
                      title="Cancel"
                    >
                      <RxCross2 size={16} />
                    </button>
                  </div>
                  <div className="w-full flex justify-end text-[11px] text-gray-400 mt-1">
                    <span>{100 - editedGroupName.length}</span>
                  </div>

                  {showNameEmoji && (
                    <div
                      ref={nameEmojiRef}
                      className="absolute left-1/2 -translate-x-1/2 top-14 z-50 shadow-2xl rounded-2xl overflow-hidden"
                    >
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setEditedGroupName((prev) => prev + emojiData.emoji);
                        }}
                        theme={theme === "dark" ? "dark" : "light"}
                        height={350}
                        width={300}
                      />
                    </div>
                  )}
                </div>
              )}

              <p
                className={`text-[14px] font-normal mt-1 flex items-center justify-center gap-1.5 transition-colors duration-300 ${theme === "dark" ? "text-[#8696a0]" : "text-gray-500"
                  }`}
              >
                <span>Group</span>
                <span className="opacity-60">•</span>
                <span
                  onClick={() => {
                    document
                      .getElementById("group-members-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-emerald-500 hover:underline cursor-pointer transition-colors"
                >
                  {groupParticipants.length} {groupParticipants.length === 1 ? "member" : "members"}
                </span>
                {groupOnlineCount > 0 && (
                  <>
                    <span className="opacity-60">•</span>
                    <span className="text-emerald-500 font-medium">
                      {groupOnlineCount} online
                    </span>
                  </>
                )}
              </p>
            </div>
          ) : (
            <>
              <h2
                className={`text-2xl font-bold tracking-tight mb-1 transition-colors duration-300 flex items-center justify-center gap-2 ${theme === "dark" ? "text-white/95" : "text-gray-900"
                  }`}
              >
                <span>{selectedContact?.username || (isMetaAi ? "Meta AI" : "Contact")}</span>
                {isMetaAi && (
                  <span
                    title="Verified Meta AI Assistant"
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-bold shadow-sm"
                  >
                    ✓
                  </span>
                )}
              </h2>

              <div className="flex flex-col items-center gap-1">
                {isMetaAi ? (
                  <p className="text-[13px] font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Official AI Assistant • Meta
                  </p>
                ) : (
                  <>
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
                        className={`text-[13px] font-medium transition-colors duration-300 ${theme === "dark" ? "text-[#8696a0]" : "text-gray-500"
                          }`}
                      >
                        {selectedContact.phoneNumber}
                      </p>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-center gap-6 sm:gap-7">
          {viewingMember ? (
            <>
              <ActionButton
                icon={<MdOutlineChat size={20} />}
                label="Message"
                onClick={() => handleMessageMember(viewingMember)}
                theme={theme}
              />
              <ActionButton
                icon={<FaPhone size={18} />}
                label="Audio"
                onClick={() => handleAudioCallMember(viewingMember)}
                disabled={!isViewingMemberOnline}
                theme={theme}
              />
              <ActionButton
                icon={<FaVideo size={18} />}
                label="Video"
                onClick={() => handleVideoCallMember(viewingMember)}
                disabled={!isViewingMemberOnline}
                theme={theme}
              />
            </>
          ) : (
            <>
              <ActionButton
                icon={<FaSearch size={18} />}
                label="Search"
                onClick={() => {
                  setIsChatSearchOpen(true);
                }}
                theme={theme}
              />

              {isGroup ? (
                <>
                  <ActionButton
                    icon={<FaPhone size={18} />}
                    label="Audio"
                    onClick={() => handleGroupCall("audio")}
                    theme={theme}
                  />

                  <ActionButton
                    icon={<FaVideo size={18} />}
                    label="Video"
                    onClick={() => handleGroupCall("video")}
                    theme={theme}
                  />

                  {canAddMembers && (
                    <ActionButton
                      icon={<FiUserPlus size={18} />}
                      label="Add"
                      onClick={() => setShowAddMemberModal(true)}
                      theme={theme}
                    />
                  )}
                </>
              ) : isMetaAi ? (
                <ActionButton
                  icon={<FaStar size={18} />}
                  label="Starred"
                  onClick={() => setContactInfoTab("starred")}
                  theme={theme}
                />
              ) : (
                <>
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
                </>
              )}
            </>
          )}
        </div>

        <div className="w-full space-y-3.5 pt-4">
          {viewingMember ? (
            <div
              className={`p-4 rounded-xl border ${theme === "dark"
                ? "bg-white/[0.03] border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
                : "bg-white border-gray-200 shadow-sm"
                }`}
            >
              <p className="text-[12px] font-medium text-[#00a884] mb-1.5 uppercase tracking-wide">
                About
              </p>
              <p
                title={viewingMember?.about || "Hey there! I am using WhatsApp."}
                className={`text-[14.5px] leading-relaxed select-text ${theme === "dark" ? "text-[#e9edef]" : "text-gray-800"
                  }`}
              >
                {viewingMember?.about || "Hey there! I am using WhatsApp."}
              </p>
              {viewingMember?.aboutUpdatedAt && (
                <p className="text-[11px] mt-1.5 text-[#8696a0]">
                  {`Updated ${new Date(
                    viewingMember.aboutUpdatedAt
                  ).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`}
                </p>
              )}
            </div>
          ) : isGroup ? (
            <div
              className={`p-4 rounded-xl border ${theme === "dark"
                ? "bg-white/[0.03] border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
                : "bg-white border-gray-200 shadow-sm"
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-medium uppercase tracking-wide text-[#00a884]">
                  Group description
                </span>
                {!isEditingGroupDesc && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedGroupDesc(groupDescription);
                      setIsEditingGroupDesc(true);
                      setShowDescEmoji(false);
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                    title="Edit description"
                  >
                    <FaPen size={13} />
                  </button>
                )}
              </div>

              {!isEditingGroupDesc ? (
                <div
                  onClick={() => {
                    setEditedGroupDesc(groupDescription);
                    setIsEditingGroupDesc(true);
                    setShowDescEmoji(false);
                  }}
                  className="cursor-pointer group/desc"
                >
                  {groupDescription ? (
                    <p
                      className={`text-[14.5px] leading-relaxed whitespace-pre-wrap ${theme === "dark" ? "text-[#e9edef]" : "text-gray-800"
                        }`}
                    >
                      {groupDescription}
                    </p>
                  ) : (
                    <p className="text-[14px] text-[#00a884] hover:underline cursor-pointer">
                      Add group description
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative flex flex-col gap-2 pt-1">
                  <textarea
                    autoFocus
                    rows={3}
                    maxLength={512}
                    value={editedGroupDesc}
                    onChange={(e) => setEditedGroupDesc(e.target.value)}
                    placeholder="Add group description..."
                    className={`w-full p-2.5 rounded-xl text-[14px] border border-[#00a884]/60 focus:border-[#00a884] outline-none resize-none transition ${theme === "dark"
                      ? "bg-[#202c33] text-[#e9edef] placeholder:text-[#8696a0]"
                      : "bg-gray-50 text-gray-800 placeholder:text-gray-400"
                      }`}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#8696a0]">
                      {512 - editedGroupDesc.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowDescEmoji((prev) => !prev)}
                        className="p-1.5 rounded-full text-[#8696a0] hover:text-[#00a884] hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                        title="Add emoji"
                      >
                        <BsEmojiSmile size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingGroupDesc(false);
                          setShowDescEmoji(false);
                        }}
                        className="p-1.5 rounded-full text-[#8696a0] hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                        title="Cancel"
                      >
                        <RxCross2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveGroupDesc}
                        className="p-1.5 rounded-full bg-[#00a884] text-white hover:bg-[#02906f] active:scale-95 transition cursor-pointer shadow-md"
                        title="Save description"
                      >
                        <FaCheck size={13} />
                      </button>
                    </div>
                  </div>

                  {showDescEmoji && (
                    <div
                      ref={descEmojiRef}
                      className="absolute right-0 top-full mt-2 z-50 shadow-2xl rounded-2xl overflow-hidden"
                    >
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setEditedGroupDesc((prev) => prev + emojiData.emoji);
                        }}
                        theme={theme === "dark" ? "dark" : "light"}
                        height={320}
                        width={280}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              className={`p-4 rounded-xl border ${theme === "dark"
                ? "bg-white/[0.03] border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
                : "bg-white border-gray-200 shadow-sm"
                }`}
            >
              {isMetaAi ? (
                <div
                  onClick={() => setShowAboutAiModal(true)}
                  className="flex justify-between items-center cursor-pointer group/metaabout hover:opacity-90 transition select-none mb-1.5"
                  title="About AI messages"
                >
                  <span className="text-[12px] font-medium uppercase tracking-wide text-[#00a884]">
                    About Meta AI
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAboutAiModal(true);
                    }}
                    className="p-1 rounded-full text-[#00a884] hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                    title="About AI messages"
                  >
                    <HiOutlineInformationCircle size={18} />
                  </button>
                </div>
              ) : (
                <p className="text-[12px] font-medium mb-1.5 uppercase tracking-wide text-[#00a884]">
                  About
                </p>
              )}

              <p
                title={
                  isMetaAi
                    ? selectedContact?.about ||
                    "Responses are generated by AI. Some may be inaccurate or inappropriate,including for some teens."
                    : selectedContact?.about || "Hey there! I am using WhatsApp."
                }
                className={`text-[14.5px] leading-relaxed select-text ${theme === "dark" ? "text-[#e9edef]" : "text-gray-800"
                  }`}
              >
                {isMetaAi ? (
                  <span
                    className="cursor-pointer hover:opacity-90 transition"
                    onClick={() => setShowAboutAiModal(true)}
                  >
                    {selectedContact?.about ||
                      "Responses are generated by AI. Some may be inaccurate or inappropriate,including for some teens."}
                  </span>
                ) : (
                  selectedContact?.about || "Hey there! I am using WhatsApp."
                )}
              </p>
              {!isMetaAi && selectedContact?.aboutUpdatedAt && (
                <p className="text-[11px] mt-1.5 text-[#8696a0]">
                  {`Updated ${new Date(
                    selectedContact.aboutUpdatedAt
                  ).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`}
                </p>
              )}
            </div>
          )}

          {(viewingMember || (!isGroup && !isMetaAi && commonGroups.length > 0)) &&
            renderCommonGroupsCard()}

          {viewingMember && (
            <div
              onClick={() => setContactInfoTab("security")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${theme === "dark"
                ? "bg-white/[0.03] border-transparent hover:bg-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
                : "bg-white border-gray-200 hover:bg-gray-50 shadow-sm"
                }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#00a884]/10 text-[#00a884]">
                  <FaLock size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-[14.5px] font-medium flex items-center gap-2 ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                      }`}
                  >
                    Encryption
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#00a884]/15 text-[#00a884]">
                      Active
                    </span>
                  </h4>
                  <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                    Messages and calls are end-to-end encrypted. Tap to verify.
                  </p>
                </div>
                <MdChevronRight size={19} className="text-[#8696a0] shrink-0" />
              </div>
            </div>
          )}

          {!viewingMember && (
            <>
              <div
                className={`rounded-xl border overflow-hidden ${theme === "dark"
                  ? "bg-white/[0.03] border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
                  : "bg-white border-gray-200 shadow-sm"
                  }`}
              >
                <div
                  onClick={() => setContactInfoTab("media")}
                  className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#00a884]/10 text-[#00a884] flex items-center justify-center shrink-0">
                      <WhatsAppMediaFolderIcon size={20} />
                    </div>

                    <span
                      className={`text-[14.5px] font-medium ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                        }`}
                    >
                      Media, links and docs
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[#8696a0]">
                    <span className="text-[13.5px] font-normal">
                      {chatMediaCount}
                    </span>
                    <MdChevronRight size={19} />
                  </div>
                </div>

                {previewImages.length > 0 && (
                  <div className="p-3 pt-0 grid grid-cols-4 gap-2">
                    {previewImages.map((item, idx) => {
                      const isStarred = isItemStarred(item);
                      const src = item.url || item.imageOrVideoUrl;

                      return (
                        <div
                          key={item._id || item.messageId || idx}
                          onClick={(e) => handleOpenImagePreview(item, idx, e)}
                          className="relative aspect-square rounded-lg overflow-hidden bg-black/20 group/thumb cursor-pointer transition-all hover:opacity-90"
                          title="Click to view image"
                        >
                          <img
                            src={src}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-200 group-hover/thumb:scale-105"
                          />
                          {isStarred && (
                            <div className="absolute bottom-1 right-1 z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none">
                              <FaStar size={10} className="text-amber-400 fill-amber-400" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                className={`rounded-xl border overflow-hidden ${theme === "dark"
                  ? "bg-white/[0.03] border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
                  : "bg-white border-gray-200 shadow-sm"
                  }`}
              >
                <div
                  onClick={() => setContactInfoTab("starred")}
                  className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <FaStar size={16} />
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                          }`}
                      >
                        Starred messages
                      </h4>
                      <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                        {chatStarredMessages.length > 0
                          ? `${chatStarredMessages.length} starred message${chatStarredMessages.length > 1 ? "s" : ""
                          }`
                          : "None"}
                      </p>
                    </div>
                  </div>

                  <MdChevronRight size={19} className="text-[#8696a0]" />
                </div>

                {chatKeptMessages.length > 0 && (
                  <>
                    <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />
                    <div
                      onClick={() => setContactInfoTab("kept")}
                      className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                        }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                          <FaBookmark size={15} />
                        </div>

                        <div className="min-w-0">
                          <h4
                            className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                              }`}
                          >
                            Kept messages
                          </h4>
                          <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                            {chatKeptMessages.length} kept message
                            {chatKeptMessages.length > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <MdChevronRight size={19} className="text-[#8696a0]" />
                    </div>
                  </>
                )}

                <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />

                <div
                  onClick={() => setContactInfoTab("disappearing")}
                  className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#00a884]/10 text-[#00a884] flex items-center justify-center shrink-0">
                      <IoTimerOutline size={20} />
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                          }`}
                      >
                        Disappearing messages
                      </h4>
                      <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                        {disappearingDuration}
                      </p>
                    </div>
                  </div>

                  <MdChevronRight size={19} className="text-[#8696a0]" />
                </div>

                <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />

                <div
                  onClick={() => setContactInfoTab("chatTheme")}
                  className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
                      <IoColorPaletteOutline size={20} />
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                          }`}
                      >
                        Chat theme
                      </h4>
                      <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                        {activeChatTheme?.name || "Default"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm overflow-hidden"
                      style={{
                        backgroundColor: activeBubbleColor || activeChatTheme?.bubbleColor,
                      }}
                    />
                    <MdChevronRight size={19} className="text-[#8696a0]" />
                  </div>
                </div>

                <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />

                <div
                  onClick={handleToggleFavorite}
                  className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isFavorite
                        ? "bg-rose-500/15 text-rose-500"
                        : "bg-white/5 text-[#8696a0]"
                        }`}
                    >
                      {isFavorite ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                          }`}
                      >
                        Favourites
                      </h4>
                      <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                        {isFavorite ? "Added to favourites" : "Add to favourites"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${isFavorite
                      ? "bg-rose-500/20 text-rose-400 font-semibold"
                      : "text-[#8696a0]"
                      }`}
                  >
                    {isFavorite ? "Favourite" : "Add"}
                  </span>
                </div>

                <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />

                <div
                  onClick={() => setContactInfoTab("lists")}
                  className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                      <MdList size={20} />
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                          }`}
                      >
                        Add to list
                      </h4>
                      <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                        {contactLists.length > 0
                          ? contactLists.join(", ")
                          : "Organize into custom lists"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {contactLists.length > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400">
                        {contactLists.length}
                      </span>
                    )}
                    <MdChevronRight size={19} className="text-[#8696a0]" />
                  </div>
                </div>

                <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />

                <div
                  onClick={handleExportChat}
                  className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                      <LuDownload size={18} />
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                          }`}
                      >
                        Export chat
                      </h4>
                      <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                        Download conversation history (.txt)
                      </p>
                    </div>
                  </div>

                  <MdChevronRight size={19} className="text-[#8696a0]" />
                </div>

                <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />

                <div
                  onClick={() => {
                    if (isMetaAi) {
                      setShowAboutAiModal(true);
                    } else {
                      setContactInfoTab("security");
                    }
                  }}
                  className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isMetaAi
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-[#00a884]/10 text-[#00a884]"
                        }`}
                    >
                      {isMetaAi ? <MdShield size={19} /> : <FaLock size={15} />}
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`text-[14.5px] font-medium flex items-center gap-2 ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                          }`}
                      >
                        {isMetaAi ? "AI Privacy & Security" : "Encryption"}
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${isMetaAi
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-[#00a884]/15 text-[#00a884]"
                            }`}
                        >
                          {isMetaAi ? "Meta AI" : "Active"}
                        </span>
                      </h4>
                      <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                        {isMetaAi
                          ? "Messages with Meta AI are processed securely. Tap to view AI terms."
                          : "Messages and calls are end-to-end encrypted. Tap to verify."}
                      </p>
                    </div>
                  </div>

                  <MdChevronRight size={19} className="text-[#8696a0]" />
                </div>
              </div>

              {isGroup && (
                <div
                  onClick={() => setContactInfoTab("groupPermissions")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${theme === "dark"
                    ? "bg-white/[0.03] border-transparent hover:bg-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
                    : "bg-white border-gray-200 hover:bg-gray-50 shadow-sm"
                    }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#00a884]/10 text-[#00a884] flex items-center justify-center shrink-0">
                      <IoShieldCheckmarkOutline size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-[14.5px] font-medium truncate ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                          }`}
                      >
                        Group permissions
                      </h4>
                      <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                        Edit group settings, send messages, and more
                      </p>
                    </div>

                    <MdChevronRight size={19} className="text-[#8696a0]" />
                  </div>
                </div>
              )}

              {isGroup && (
                <ContactInfoGroupMembersSection
                  theme={theme}
                  user={user}
                  groupParticipants={groupParticipants}
                  groupOnlineCount={groupOnlineCount}
                  groupAdmins={groupAdmins}
                  canAddMembers={canAddMembers}
                  isCurrentUserAdmin={isCurrentUserAdmin}
                  setShowAddMemberModal={setShowAddMemberModal}
                  setContactInfoTab={setContactInfoTab}
                  setViewingMember={setViewingMember}
                  getAvatarColor={getAvatarColor}
                  memberTags={memberTags}
                  myMemberTag={myMemberTag}
                  onlineUsers={onlineUsers}
                  isUserOnline={isUserOnline}
                  handleToggleMemberAdmin={handleToggleMemberAdmin}
                  handleRemoveMember={handleRemoveMember}
                  handleSaveMemberTag={handleSaveMemberTag}
                  handleMessageMember={handleMessageMember}
                  handleAudioCallMember={handleAudioCallMember}
                  handleVideoCallMember={handleVideoCallMember}
                  memberTagPromptOpen={memberTagPromptOpen}
                  setMemberTagPromptOpen={setMemberTagPromptOpen}
                  editingMemberForTag={editingMemberForTag}
                  setEditingMemberForTag={setEditingMemberForTag}
                  userMemberTag={userMemberTag}
                  setUserMemberTag={setUserMemberTag}
                  isSavingMemberTag={isSavingMemberTag}
                />
              )}
            </>
          )}

          {viewingMember ? (
            <div
              className={`rounded-xl border overflow-hidden ${theme === "dark"
                ? "bg-white/[0.03] border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
                : "bg-white border-gray-200 shadow-sm"
                }`}
            >
              <div
                onClick={() => handleToggleBlockMember(viewingMember)}
                className={`flex items-center gap-3.5 p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-red-500/10" : "hover:bg-red-50"
                  }`}
              >
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <MdBlock size={19} />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-[14.5px] font-medium text-red-500 truncate">
                    {isViewingMemberBlocked
                      ? `Unblock ${viewingMember?.username || viewingMember?.name || "contact"}`
                      : `Block ${viewingMember?.username || viewingMember?.name || "contact"}`}
                  </h4>
                  <p className="text-[12px] text-[#8696a0] truncate mt-0.5">
                    {isViewingMemberBlocked
                      ? "Allow calls and messages from this contact"
                      : "Calls and messages will be blocked"}
                  </p>
                </div>
              </div>

              <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />

              <div
                onClick={() => setShowReportModal(true)}
                className={`flex items-center gap-3.5 p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-red-500/10" : "hover:bg-red-50"
                  }`}
              >
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <MdThumbDown size={19} />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-[14.5px] font-medium text-red-500 truncate">
                    Report {viewingMember?.username || viewingMember?.name || "contact"}
                  </h4>
                  <p className="text-[12px] text-[#8696a0] truncate mt-0.5">
                    Send report and last 5 messages to WhatsApp
                  </p>
                </div>
              </div>

              <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />

              <div
                onClick={() => setViewingMember(null)}
                className={`p-3 text-center text-[13.5px] font-medium transition-colors cursor-pointer ${theme === "dark"
                  ? "hover:bg-white/[0.05] text-[#00a884]"
                  : "hover:bg-gray-50 text-[#00897b]"
                  }`}
              >
                ← Back to group info
              </div>
            </div>
          ) : (
            <div
              className={`rounded-xl border overflow-hidden ${theme === "dark"
                ? "bg-white/[0.03] border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
                : "bg-white border-gray-200 shadow-sm"
                }`}
            >
              {!isMetaAi && (
                !isGroup ? (
                  <>
                    <div
                      onClick={handleToggleBlock}
                      className={`flex items-center gap-3.5 p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-red-500/10" : "hover:bg-red-50"
                        }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                        <MdBlock size={19} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14.5px] font-medium text-red-500 truncate">
                          {isBlocked
                            ? `Unblock ${selectedContact?.username || "contact"}`
                            : `Block ${selectedContact?.username || "contact"}`}
                        </h4>
                        <p className="text-[12px] text-[#8696a0] truncate mt-0.5">
                          {isBlocked
                            ? "Allow calls and messages from this contact"
                            : "Calls and messages will be blocked"}
                        </p>
                      </div>
                    </div>
                    <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />
                  </>
                ) : (
                  <>
                    <div
                      onClick={handleExitGroup}
                      className={`flex items-center gap-3.5 p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-red-500/10" : "hover:bg-red-50"
                        }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                        <RxExit size={19} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14.5px] font-medium text-red-500 truncate">
                          Exit group
                        </h4>
                        <p className="text-[12px] text-[#8696a0] truncate mt-0.5">
                          Leave this group conversation
                        </p>
                      </div>
                    </div>
                    <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />
                  </>
                )
              )}

              <div
                onClick={handleExecuteClearChat}
                className={`flex items-center gap-3.5 p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-red-500/10" : "hover:bg-red-50"
                  }`}
              >
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <IoMdRemoveCircleOutline size={19} />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-[14.5px] font-medium text-red-500 truncate">
                    Clear chat
                  </h4>
                  <p className="text-[12px] text-[#8696a0] truncate mt-0.5">
                    Delete all messages in this chat
                  </p>
                </div>
              </div>

              {!isMetaAi && (
                <>
                  <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />
                  <div
                    onClick={() => setShowReportModal(true)}
                    className={`flex items-center gap-3.5 p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-red-500/10" : "hover:bg-red-50"
                      }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                      <MdThumbDown size={19} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14.5px] font-medium text-red-500 truncate">
                        Report {isGroup ? "group" : selectedContact?.username || "contact"}
                      </h4>
                      <p className="text-[12px] text-[#8696a0] truncate mt-0.5">
                        Send report and last 5 messages to WhatsApp
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <input
        type="file"
        ref={groupImageInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleGroupImageFileChange}
      />

      {previewModalFile && (
        <FileViewerModal
          isOpen={Boolean(previewModalFile)}
          onClose={() => setPreviewModalFile(null)}
          file={previewModalFile}
          items={previewModalFile.items}
          initialIndex={previewModalIndex}
          theme={theme}
        />
      )}

      {showCameraModal && (
        <CameraModal
          onClose={() => setShowCameraModal(false)}
          onCapture={async (file) => {
            setShowCameraModal(false);
            await uploadAndSetGroupImage(file);
          }}
          fullScreen={true}
        />
      )}

      {showEmojiStickerModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col ${theme === "dark" ? "bg-[#202c33] text-[#e9edef]" : "bg-white text-gray-900"
              }`}
          >
            <div
              className={`flex items-center justify-between px-5 py-4 border-b ${theme === "dark" ? "border-[#2e3b43]" : "border-gray-200"
                }`}
            >
              <h3 className="text-lg font-semibold tracking-tight">Emoji & sticker</h3>
              <button
                type="button"
                onClick={() => setShowEmojiStickerModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <RxCross2 size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center pt-6 pb-4">
              <div
                style={{ backgroundColor: selectedBgColor }}
                className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl text-6xl select-none transition-colors duration-200 border-4 border-white/20"
              >
                <span>{selectedEmojiAvatar}</span>
              </div>

              <div className="flex items-center justify-center gap-2.5 flex-wrap mt-5 px-4">
                {AVATAR_BG_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedBgColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full cursor-pointer transition-transform duration-150 flex items-center justify-center ${selectedBgColor === c
                      ? "ring-2 ring-emerald-400 scale-115 shadow-md"
                      : "hover:scale-105 opacity-90 hover:opacity-100"
                      }`}
                  >
                    {selectedBgColor === c && <FaCheck size={11} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex justify-center pb-2 overflow-hidden px-4">
              <EmojiPicker
                theme={theme === "dark" ? "dark" : "light"}
                width="100%"
                height={320}
                lazyLoadEmojis={true}
                searchDisabled={false}
                skinTonesDisabled={true}
                previewConfig={{ showPreview: false }}
                onEmojiClick={(emojiData) => setSelectedEmojiAvatar(emojiData.emoji)}
              />
            </div>

            <div
              className={`px-5 py-3.5 flex justify-end gap-3 border-t ${theme === "dark" ? "border-[#2e3b43] bg-[#182229]" : "border-gray-200 bg-gray-50"
                }`}
            >
              <button
                type="button"
                onClick={() => setShowEmojiStickerModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploadingGroupImage}
                onClick={handleSaveEmojiAvatar}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-[#00a884] hover:bg-[#02906f] text-white flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer transition"
              >
                {isUploadingGroupImage ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <FaCheck size={14} />
                    <span>Done</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactInfoMainTab;
