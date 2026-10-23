import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import axiosInstance from "../../services/url.services";
import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore, getTargetUserId } from "../../store/chatStore";
import useVideoCallStore from "../../store/videoCallStore";
import { META_AI_USER_ID } from "../common/MetaAiIcon";
import { getChatTheme } from "../../utils/chatThemes";
import ContactMedia from "../media/ContactMedia";
import BlockModal from "../modals/BlockModal";
import ReportModal from "../modals/ReportModal";
import AboutAiMessagesModal from "../modals/AboutAiMessagesModal";
import AddMemberModal from "../modals/AddMemberModal";
import EditGroupAdminsModal from "../modals/EditGroupAdminsModal";
import GroupCallModal from "../modals/GroupCallModal";

import {
  ContactInfoHeader,
  ContactInfoMainTab,
  ContactInfoSecurityTab,
  ContactInfoPrivacyTab,
  ContactInfoDisappearingTab,
  ContactInfoThemeTab,
  ContactInfoStarredTab,
  ContactInfoGroupPermissionsTab,
  ContactInfoMemberChangesTab,
  ContactInfoListsTab,
} from "./index.js";
import {
  WhatsAppSwitch,
  ActionButton,
  formatMemberChangeDate,
  AVATAR_BG_COLORS,
} from "./shared.jsx";

export { WhatsAppSwitch, ActionButton, formatMemberChangeDate, AVATAR_BG_COLORS };

const ContactInfo = () => {
  const contactInfoRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    viewingMember: layoutViewingMember,
    setViewingMember: setLayoutViewingMember,
    setChatDoodles,
    chatBubbleColors = {},
    setChatBubbleColor,
    resetChatBubbleColor,
    resetChatTheme,
    setShowProfilePicture,
    setIsChatSearchOpen,
  } = useLayoutStore();

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const {
    isUserOnline,
    messages,
    starredMessages,
    isMessageStarred,
    toggleStarMessage,
    blockedContacts,
    blockContact,
    unblockContact,
    clearChat,
    conversations,
    users: allChatUsers,
    getGroupOnlineCount,
    onlineUsers,
    checkUserStatus,
  } = useChatStore();

  const chatId = (
    selectedContact?.conversation?._id ||
    selectedContact?.conversation ||
    selectedContact?._id ||
    ""
  )?.toString();

  const targetUserId = useMemo(
    () => getTargetUserId(selectedContact, user?._id),
    [selectedContact, user?._id]
  );

  const isMetaAi = Boolean(
    selectedContact?.isAI ||
    selectedContact?.username === "Meta AI" ||
    String(selectedContact?._id) === META_AI_USER_ID ||
    String(selectedContact?.id) === META_AI_USER_ID ||
    String(targetUserId) === META_AI_USER_ID ||
    (Array.isArray(selectedContact?.participants) &&
      selectedContact.participants.some(
        (p) =>
          p?.isAI ||
          p?.username === "Meta AI" ||
          String(p?._id || p) === META_AI_USER_ID
      )) ||
    (Array.isArray(selectedContact?.conversation?.participants) &&
      selectedContact.conversation.participants.some(
        (p) =>
          p?.isAI ||
          p?.username === "Meta AI" ||
          String(p?._id || p) === META_AI_USER_ID
      ))
  );

  const isGroup = Boolean(
    selectedContact?.isGroup ||
    selectedContact?.isGroupChat ||
    selectedContact?.conversation?.isGroup ||
    (typeof selectedContact?.groupName === "string" &&
      selectedContact.groupName.trim() !== "" &&
      selectedContact.groupName !== selectedContact?.username) ||
    (typeof selectedContact?.conversation?.groupName === "string" &&
      selectedContact.conversation.groupName.trim() !== "") ||
    (Array.isArray(selectedContact?.groupAdmin) &&
      selectedContact.groupAdmin.length > 0) ||
    (Array.isArray(selectedContact?.conversation?.groupAdmin) &&
      selectedContact.conversation.groupAdmin.length > 0) ||
    (Array.isArray(selectedContact?.participants) &&
      selectedContact.participants.length > 2) ||
    (Array.isArray(selectedContact?.conversation?.participants) &&
      selectedContact.conversation.participants.length > 2)
  );

  const groupAdmins = useMemo(() => {
    const raw =
      selectedContact?.groupAdmin ||
      selectedContact?.conversation?.groupAdmin ||
      [];
    const list = Array.isArray(raw) ? raw : [raw];
    return list
      .filter(Boolean)
      .map((a) => (a?._id || a)?.toString())
      .filter(Boolean);
  }, [selectedContact]);

  const groupParticipants = useMemo(() => {
    const raw =
      selectedContact?.participants ||
      selectedContact?.conversation?.participants ||
      [];
    const list = Array.isArray(raw) ? [...raw] : [];
    const myIdStr = user?._id?.toString();
    list.sort((a, b) => {
      const aId = (a?._id || a)?.toString();
      const bId = (b?._id || b)?.toString();
      if (aId === myIdStr) return -1;
      if (bId === myIdStr) return 1;
      const aIsAdmin = groupAdmins.includes(aId);
      const bIsAdmin = groupAdmins.includes(bId);
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;
      const aName = (a?.username || a?.name || "").toLowerCase();
      const bName = (b?.username || b?.name || "").toLowerCase();
      return aName.localeCompare(bName);
    });
    return list;
  }, [selectedContact, user?._id, groupAdmins]);

  const groupName =
    selectedContact?.groupName ||
    selectedContact?.name ||
    selectedContact?.username ||
    "Group";

  useEffect(() => {
    if (
      isGroup &&
      groupParticipants.length > 0 &&
      typeof checkUserStatus === "function"
    ) {
      const myIdStr = user?._id?.toString();
      groupParticipants.forEach((p) => {
        const pId = (p?._id || p)?.toString();
        if (pId && pId !== myIdStr) {
          checkUserStatus(pId);
        }
      });
    } else if (!isGroup && typeof checkUserStatus === "function") {
      const targetId = (
        targetUserId ||
        selectedContact?._id ||
        selectedContact?.id
      )?.toString();
      if (targetId && targetId !== user?._id?.toString()) {
        checkUserStatus(targetId);
      }
    }
  }, [
    isGroup,
    groupParticipants,
    user?._id,
    checkUserStatus,
    targetUserId,
    selectedContact?._id,
    selectedContact?.id,
  ]);

  const groupOnlineCount = useMemo(() => {
    if (!isGroup || !getGroupOnlineCount) return 0;
    return getGroupOnlineCount(groupParticipants, user?._id);
  }, [isGroup, groupParticipants, user?._id, onlineUsers, getGroupOnlineCount]);

  const viewingMember = layoutViewingMember || null;
  const setViewingMember = setLayoutViewingMember;

  const prevContactIdRef = useRef(selectedContact?._id);
  useEffect(() => {
    if (
      prevContactIdRef.current !== undefined &&
      prevContactIdRef.current !== selectedContact?._id
    ) {
      setViewingMember(null);
    }
    prevContactIdRef.current = selectedContact?._id;
  }, [selectedContact?._id, setViewingMember]);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditAdminsModal, setShowEditAdminsModal] = useState(false);
  const [showGroupCallModal, setShowGroupCallModal] = useState(false);
  const [groupCallModalType, setGroupCallModalType] = useState("audio");
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [showAboutAiModal, setShowAboutAiModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const [memberTagPromptOpen, setMemberTagPromptOpen] = useState(false);
  const [userMemberTag, setUserMemberTag] = useState("");
  const [editingMemberForTag, setEditingMemberForTag] = useState(null);
  const [isSavingMemberTag, setIsSavingMemberTag] = useState(false);

  const memberTags = useMemo(() => {
    const raw =
      selectedContact?.memberTags ||
      selectedContact?.conversation?.memberTags ||
      [];
    return Array.isArray(raw) ? raw : [];
  }, [selectedContact]);

  const getMemberTag = useCallback(
    (memberId) => {
      if (!memberId) return "";
      const mIdStr = (memberId?._id || memberId)?.toString();
      const found = memberTags.find(
        (mt) => (mt.user?._id || mt.user)?.toString() === mIdStr
      );
      return found?.tag || "";
    },
    [memberTags]
  );

  const myMemberTag = useMemo(() => {
    return user?._id ? getMemberTag(user._id) : "";
  }, [user?._id, getMemberTag]);

  const getAvatarColor = useCallback((name) => {
    const colors = [
      "#7c3aed",
      "#b45309",
      "#047857",
      "#be185d",
      "#0284c7",
      "#9333ea",
      "#b91c1c",
      "#d97706",
      "#059669",
      "#4f46e5",
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, []);

  const effectiveTargetUserId = useMemo(() => {
    if (viewingMember)
      return (viewingMember._id || viewingMember.id)?.toString();
    if (!isGroup)
      return (targetUserId || selectedContact?._id || selectedContact?.id)?.toString();
    return null;
  }, [viewingMember, isGroup, targetUserId, selectedContact]);

  const commonGroups = useMemo(() => {
    const currentUserId = user?._id?.toString();
    if (
      !effectiveTargetUserId ||
      !currentUserId ||
      effectiveTargetUserId === currentUserId
    ) {
      return [];
    }
    const convList = Array.isArray(conversations?.data)
      ? conversations.data
      : [];
    const list = [];
    const seenIds = new Set();

    if (isGroup) {
      const parts = groupParticipants || [];
      const hasTarget = parts.some(
        (p) => (p?._id || p)?.toString() === effectiveTargetUserId
      );
      if (hasTarget) {
        const gId = (
          selectedContact?._id ||
          selectedContact?.id ||
          chatId
        )?.toString();
        if (gId) {
          seenIds.add(gId);
          list.push({
            ...selectedContact,
            _id: gId,
            id: gId,
            groupName: groupName,
            name: groupName,
            username: groupName,
            groupProfileImage:
              selectedContact?.profilePicture ||
              selectedContact?.groupProfileImage ||
              "",
            participants: groupParticipants,
          });
        }
      }
    }

    for (const conv of convList) {
      if (!conv) continue;
      const isGrp = Boolean(
        conv.isGroup || conv.isGroupChat || conv.conversation?.isGroup
      );
      if (!isGrp) continue;
      const gId = (conv._id || conv.id)?.toString();
      if (gId && seenIds.has(gId)) continue;

      const parts = conv.participants || conv.conversation?.participants || [];
      const hasCurrent = parts.some(
        (p) => (p?._id || p)?.toString() === currentUserId
      );
      const hasTarget = parts.some(
        (p) => (p?._id || p)?.toString() === effectiveTargetUserId
      );

      if (hasCurrent && hasTarget) {
        if (gId) seenIds.add(gId);
        list.push(conv);
      }
    }

    return list;
  }, [
    effectiveTargetUserId,
    user?._id,
    conversations?.data,
    isGroup,
    selectedContact,
    groupName,
    groupParticipants,
    chatId,
  ]);

  const online = Boolean(
    isUserOnline(targetUserId) ||
    isUserOnline(selectedContact?._id) ||
    isUserOnline(selectedContact?.id)
  );

  const isViewingMemberOnline = useMemo(() => {
    if (!viewingMember) return false;
    const mId = (
      viewingMember._id ||
      viewingMember.id ||
      viewingMember
    )?.toString();
    if (!mId) return false;
    if (typeof isUserOnline === "function") {
      return Boolean(isUserOnline(mId));
    }
    if (onlineUsers instanceof Map) {
      return Boolean(onlineUsers.get(mId)?.isOnline);
    }
    if (Array.isArray(onlineUsers)) {
      return onlineUsers.some((u) => (u?._id || u)?.toString() === mId);
    }
    if (onlineUsers && typeof onlineUsers === "object") {
      return Boolean(onlineUsers[mId]?.isOnline || onlineUsers[mId]);
    }
    return Boolean(viewingMember.isOnline);
  }, [viewingMember, onlineUsers, isUserOnline]);

  const isBlocked = useMemo(() => {
    if (!blockedContacts || blockedContacts.length === 0) return false;
    const candidates = [
      targetUserId,
      chatId,
      selectedContact?._id,
      selectedContact?.id,
      selectedContact?.conversation?._id,
      selectedContact?.conversation,
    ]
      .filter(Boolean)
      .map(String);
    return candidates.some((id) => blockedContacts.includes(id));
  }, [targetUserId, chatId, selectedContact, blockedContacts]);

  const isViewingMemberBlocked = useMemo(() => {
    if (!viewingMember || !blockedContacts || blockedContacts.length === 0)
      return false;
    const mId = (viewingMember._id || viewingMember.id)?.toString();
    return mId ? blockedContacts.includes(mId) : false;
  }, [viewingMember, blockedContacts]);

  const groupPermissions = useMemo(() => {
    const raw =
      selectedContact?.groupPermissions ||
      selectedContact?.conversation?.groupPermissions ||
      {};
    return {
      editGroupSettings: raw.editGroupSettings ?? true,
      sendMessages: raw.sendMessages ?? true,
      addMembers: raw.addMembers ?? true,
      inviteViaLink: raw.inviteViaLink ?? true,
      sendMessageHistory: raw.sendMessageHistory ?? true,
      approveNewMembers: raw.approveNewMembers ?? false,
    };
  }, [selectedContact]);

  const isCurrentUserAdmin = useMemo(() => {
    const currentUserId = user?._id?.toString();
    return groupAdmins.some((a) => (a?._id || a)?.toString() === currentUserId);
  }, [groupAdmins, user?._id]);

  const canAddMembers = useMemo(() => {
    if (!isGroup) return false;
    if (isCurrentUserAdmin) return true;
    return groupPermissions.addMembers !== false;
  }, [isGroup, isCurrentUserAdmin, groupPermissions]);

  const adminDisplayNames = useMemo(() => {
    if (!groupParticipants || groupParticipants.length === 0) return "";
    const adminSet = new Set(groupAdmins.map((a) => (a?._id || a)?.toString()));
    const names = groupParticipants
      .filter((p) => adminSet.has((p?._id || p)?.toString()))
      .map((p) => {
        const pId = (p?._id || p)?.toString();
        if (pId === user?._id?.toString()) return "You";
        return p?.username || p?.name || "Admin";
      });
    return names.join(", ");
  }, [groupParticipants, groupAdmins, user?._id]);

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

  const chatKeptMessages = useMemo(() => {
    if (!chatId) return [];
    try {
      const keptMessagesMap = JSON.parse(
        localStorage.getItem("whatsapp_kept_messages") || "{}"
      );
      if (!keptMessagesMap?.[chatId]) return [];
      return Object.values(keptMessagesMap[chatId]).sort(
        (a, b) => (b.keptAt || 0) - (a.keptAt || 0)
      );
    } catch {
      return [];
    }
  }, [chatId]);

  const activeChatThemeId = (chatId && chatThemes?.[chatId]) || "default";
  const activeChatTheme = getChatTheme(activeChatThemeId);
  const customBubbleColor = chatId && chatBubbleColors?.[chatId];
  const activeBubbleColor = customBubbleColor || activeChatTheme.bubbleColor;
  const doodlesEnabled = chatId ? chatDoodles?.[chatId] !== false : true;
  const disappearingDuration =
    (chatId && disappearingDurations?.[chatId]) || defaultMessageTimer || "Off";

  const cursorTooltipRef = useRef(null);
  const updateCursorTooltip = useCallback((e, text) => {
    if (!cursorTooltipRef.current) return;
    const el = cursorTooltipRef.current;
    el.textContent = text;
    el.style.display = "block";
    const x = e.clientX;
    const y = e.clientY - 35;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }, []);

  const hideCursorTooltip = useCallback(() => {
    if (!cursorTooltipRef.current) return;
    cursorTooltipRef.current.style.display = "none";
  }, []);

  const handleResetTheme = () => {
    if (chatId) {
      resetChatTheme(chatId);
      toast.success("Chat theme reset to default");
    }
  };

  const handleResetBubbleColor = () => {
    if (chatId) {
      resetChatBubbleColor(chatId);
      toast.info("Chat bubble reset to theme default");
    }
  };

  const handleGroupCall = (callType = "audio") => {
    const myIdStr = user?._id?.toString();
    const otherMembers = groupParticipants.filter((p) => {
      const pId = (p?._id || p)?.toString();
      return pId && pId !== myIdStr;
    });

    if (otherMembers.length === 0) {
      toast.info("No other participants in this group to call");
      return;
    }

    setGroupCallModalType(callType);
    setShowGroupCallModal(true);
  };

  const handleStartCallFromModal = (target, callType = "audio") => {
    setShowGroupCallModal(false);
    const { initiateCall } = useVideoCallStore.getState();
    if (typeof initiateCall !== "function") {
      toast.error("Call service not ready. Please try again.");
      return;
    }

    const avatar =
      selectedContact?.profilePicture ||
      selectedContact?.groupProfileImage ||
      "";
    const displayName =
      selectedContact?.groupName ||
      selectedContact?.name ||
      selectedContact?.username ||
      groupName ||
      "Group";
    const gId = (
      selectedContact?._id ||
      selectedContact?.id ||
      chatId
    )?.toString();

    if (Array.isArray(target)) {
      const otherMemberIds = target
        .map((p) => (p?._id || p)?.toString())
        .filter(Boolean);
      if (otherMemberIds.length === 0) {
        toast.info("No other participants in this group to call");
        return;
      }
      initiateCall(otherMemberIds[0], displayName, avatar, callType, {
        isGroup: true,
        groupId: gId,
        groupName: displayName,
        groupAvatar: avatar,
        participantIds: otherMemberIds,
      });
    } else if (target) {
      const mId = (target?._id || target?.id || target)?.toString();
      const mName = target?.username || target?.name || "Participant";
      const mAvatar = target?.profilePicture || "";
      initiateCall(mId, mName, mAvatar, callType);
    }
  };

  const handleAudioCall = () => {
    if (isGroup) {
      handleGroupCall("audio");
      return;
    }
    if (selectedContact && online) {
      const { initiateCall } = useVideoCallStore.getState();
      if (typeof initiateCall !== "function") {
        toast.error("Call service not ready. Please try again.");
        return;
      }
      const avatar = selectedContact?.profilePicture;
      initiateCall(
        selectedContact?._id,
        selectedContact?.username,
        avatar,
        "audio"
      );
    } else {
      toast.info("User is offline. Cannot initiate the call");
    }
  };

  const handleVideoCall = () => {
    if (isGroup) {
      handleGroupCall("video");
      return;
    }
    if (selectedContact && online) {
      const { initiateCall } = useVideoCallStore.getState();
      if (typeof initiateCall !== "function") {
        toast.error("Call service not ready. Please try again.");
        return;
      }
      const avatar = selectedContact?.profilePicture;
      initiateCall(
        selectedContact?._id,
        selectedContact?.username,
        avatar,
        "video"
      );
    } else {
      toast.info("User is offline. Cannot initiate the call");
    }
  };

  const handleExecuteClearChat = async () => {
    const targetId = targetUserId || selectedContact?._id;
    await clearChat(chatId, targetId);
    toast.success("Chat cleared");
  };

  const handleToggleBlock = () => {
    const targetId = targetUserId || selectedContact?._id || chatId;
    if (!targetId) return;
    if (isBlocked) {
      unblockContact(targetId, chatId);
      toast.success(`${selectedContact?.username || "Contact"} unblocked`);
    } else {
      setShowBlockModal(true);
    }
  };

  const handleConfirmBlock = ({ report } = {}) => {
    const targetId = targetUserId || selectedContact?._id || chatId;
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
    const targetId = viewingMember
      ? (viewingMember._id || viewingMember.id)?.toString()
      : targetUserId || selectedContact?._id || chatId;
    const targetName = viewingMember
      ? viewingMember.username || viewingMember.name || "Contact"
      : selectedContact?.username || "Contact";
    if (block && targetId) {
      blockContact(targetId);
      toast.success(`${targetName} reported and blocked`);
    } else {
      toast.success("Report submitted to WhatsApp");
    }
    setShowReportModal(false);
  };

  const handleToggleBlockMember = (member) => {
    if (!member) return;
    const mId = (member._id || member.id || member)?.toString();
    if (!mId) return;
    const mName = member?.username || member?.name || "Contact";
    if (isViewingMemberBlocked) {
      unblockContact(mId, null);
      toast.success(`${mName} unblocked`);
    } else {
      blockContact(mId, null);
      toast.success(`${mName} blocked`);
    }
  };

  const handleTogglePermission = async (key) => {
    if (!isCurrentUserAdmin) {
      toast.error("Only group admins can edit group permissions");
      return;
    }
    const convId = (
      selectedContact?.conversation?._id || selectedContact?._id
    )?.toString();
    if (!convId) {
      toast.error("Group conversation not found");
      return;
    }

    const currentPerms = { ...groupPermissions };
    const updated = {
      ...currentPerms,
      [key]: !currentPerms[key],
    };

    useChatStore.getState().updateGroupInfo(convId, {
      groupPermissions: updated,
    });
    useLayoutStore.getState().setSelectedContact((prev) => {
      if (!prev || typeof prev !== "object") return prev;
      return {
        ...prev,
        groupPermissions: updated,
        conversation: {
          ...prev?.conversation,
          groupPermissions: updated,
        },
      };
    });

    try {
      const { data } = await axiosInstance.put(`/chat/group/${convId}`, {
        groupPermissions: updated,
      });
      const resData = data?.data || data;
      const serverPerms = resData?.groupPermissions || updated;
      useChatStore.getState().updateGroupInfo(convId, {
        groupPermissions: serverPerms,
      });
      useLayoutStore.getState().setSelectedContact((prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...prev,
          groupPermissions: serverPerms,
          conversation: {
            ...prev?.conversation,
            groupPermissions: serverPerms,
          },
        };
      });
      toast.success("Group permissions updated");
    } catch (err) {
      console.error("Error updating permissions:", err);
      useChatStore.getState().updateGroupInfo(convId, {
        groupPermissions: currentPerms,
      });
      useLayoutStore.getState().setSelectedContact((prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...prev,
          groupPermissions: currentPerms,
          conversation: {
            ...prev?.conversation,
            groupPermissions: currentPerms,
          },
        };
      });
      toast.error(
        err?.response?.data?.message || "Failed to update permissions"
      );
    }
  };

  const handleToggleMemberAdmin = async (
    memberId,
    currentlyAdmin,
    memberName
  ) => {
    const convId = (
      selectedContact?.conversation?._id || selectedContact?._id
    )?.toString();
    const newAdmins = currentlyAdmin
      ? groupAdmins.filter((id) => id !== memberId)
      : [...groupAdmins, memberId];
    if (newAdmins.length === 0) {
      toast.error("There must be at least one group admin");
      return;
    }
    try {
      const { data } = await axiosInstance.put(`/chat/group/${convId}`, {
        groupAdmin: newAdmins,
      });
      useChatStore.getState().updateGroupInfo(convId, {
        groupAdmin: newAdmins,
      });
      useLayoutStore.getState().setSelectedContact((prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...prev,
          groupAdmin: newAdmins,
          conversation: {
            ...prev?.conversation,
            groupAdmin: newAdmins,
          },
        };
      });
      toast.success(
        currentlyAdmin
          ? `${memberName} dismissed as admin`
          : `${memberName} is now an admin`
      );
    } catch (err) {
      console.error("Error updating admin status:", err);
      toast.error(err?.response?.data?.message || "Failed to update admin");
    }
  };

  const handleSaveMemberTag = async (overrideTag = null) => {
    const convId = (
      selectedContact?.conversation?._id || selectedContact?._id
    )?.toString();
    if (!convId) {
      toast.error("Conversation not found");
      return;
    }

    const tagToSave = overrideTag !== null ? overrideTag : userMemberTag;
    const trimmed = (tagToSave || "").trim().slice(0, 30);
    const targetUserId = editingMemberForTag?.id
      ? editingMemberForTag.id.toString()
      : user?._id?.toString();

    if (!targetUserId) {
      toast.error("User not found");
      return;
    }

    setIsSavingMemberTag(true);
    try {
      const payload = {
        memberTag: {
          user: targetUserId,
          tag: trimmed,
        },
      };

      const { data } = await axiosInstance.put(
        `/chat/group/${convId}`,
        payload
      );
      const updated = data?.data || data;

      const updatedTags = updated?.memberTags || [
        ...memberTags.filter(
          (mt) => (mt.user?._id || mt.user)?.toString() !== targetUserId
        ),
        ...(trimmed
          ? [
            {
              user: editingMemberForTag
                ? { _id: targetUserId, username: editingMemberForTag.name }
                : { _id: user?._id, username: user?.username },
              tag: trimmed,
            },
          ]
          : []),
      ];

      useChatStore.getState().updateGroupInfo(convId, {
        memberTags: updatedTags,
      });

      useLayoutStore.getState().setSelectedContact((prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...prev,
          memberTags: updatedTags,
          conversation: {
            ...prev?.conversation,
            memberTags: updatedTags,
          },
        };
      });

      toast.success(trimmed ? "Member tag saved" : "Member tag removed");
      setMemberTagPromptOpen(false);
      setEditingMemberForTag(null);
    } catch (err) {
      console.error("Failed to save member tag:", err);
      toast.error(err?.response?.data?.message || "Failed to save member tag");
    } finally {
      setIsSavingMemberTag(false);
    }
  };

  const handleRemoveMember = (memberId, memberName) => {
    const convId = (
      selectedContact?.conversation?._id || selectedContact?._id
    )?.toString();
    if (!convId) return;

    setConfirmModalConfig({
      title: `Remove ${memberName}?`,
      description: `Remove ${memberName} from the "${groupName}" group? They will no longer be able to send or receive messages in this group.`,
      confirmText: "Remove",
      isDanger: true,
      onConfirm: async () => {
        try {
          const { data } = await axiosInstance.put(`/chat/group/${convId}`, {
            removeParticipant: memberId,
          });
          const updated = data?.data || data;
          useChatStore.getState().updateGroupInfo(convId, updated);
          useLayoutStore.getState().setSelectedContact((prev) => {
            if (!prev || typeof prev !== "object") return prev;
            const newParticipants = (
              prev?.participants ||
              prev?.conversation?.participants ||
              []
            ).filter((p) => (p?._id || p)?.toString() !== memberId?.toString());
            return {
              ...prev,
              participants: newParticipants,
              conversation: {
                ...prev?.conversation,
                participants: newParticipants,
              },
            };
          });
          toast.info(`${memberName} was removed from the group`);
        } catch (err) {
          console.error("Error removing member:", err);
          toast.error(
            err?.response?.data?.message || "Failed to remove member"
          );
        }
      },
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (
          showBlockModal ||
          showReportModal ||
          showAddMemberModal ||
          showEditAdminsModal ||
          showGroupCallModal ||
          showAboutAiModal
        ) {
          return;
        }
        if (viewingMember) {
          setViewingMember(null);
        } else if (contactInfoTab !== "info") {
          setContactInfoTab("info");
        } else {
          setShowContactInfo(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    viewingMember,
    contactInfoTab,
    showBlockModal,
    showReportModal,
    showAddMemberModal,
    showEditAdminsModal,
    showGroupCallModal,
    showAboutAiModal,
    setViewingMember,
    setContactInfoTab,
    setShowContactInfo,
  ]);

  return (
    <AnimatePresence>
      {showContactInfo && (
        <motion.div
          ref={contactInfoRef}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "tween", duration: 0.2 }}
          className={`h-full flex flex-col select-none ${isMobile
            ? "fixed inset-0 z-[100]"
            : "relative w-full md:w-[350px] lg:w-[380px] xl:w-[420px] shrink-0 border-l"
            } ${theme === "dark"
              ? "bg-[#111b21] border-[#222d34] text-[#e9edef]"
              : "bg-[#f0f2f5] border-gray-200 text-gray-800"
            } shadow-xl`}
        >
          <ContactInfoHeader
            contactInfoTab={contactInfoTab}
            setContactInfoTab={setContactInfoTab}
            previousContactInfoTab={previousContactInfoTab}
            setShowContactInfo={setShowContactInfo}
            viewingMember={viewingMember}
            setViewingMember={setViewingMember}
            selectedContact={selectedContact}
            isGroup={isGroup}
            isMetaAi={isMetaAi}
            theme={theme}
            handleResetTheme={handleResetTheme}
            handleResetBubbleColor={handleResetBubbleColor}
          />

          <AnimatePresence mode="wait">
            {contactInfoTab === "info" && (
              <ContactInfoMainTab
                theme={theme}
                user={user}
                selectedContact={selectedContact}
                chatId={chatId}
                isGroup={isGroup}
                isMetaAi={isMetaAi}
                targetUserId={targetUserId}
                groupAdmins={groupAdmins}
                groupParticipants={groupParticipants}
                groupOnlineCount={groupOnlineCount}
                canAddMembers={canAddMembers}
                isCurrentUserAdmin={isCurrentUserAdmin}
                viewingMember={viewingMember}
                setViewingMember={setViewingMember}
                isViewingMemberOnline={isViewingMemberOnline}
                isViewingMemberBlocked={isViewingMemberBlocked}
                isBlocked={isBlocked}
                online={online}
                commonGroups={commonGroups}
                contactLists={contactLists}
                chatStarredMessages={chatStarredMessages}
                chatKeptMessages={chatKeptMessages}
                disappearingDuration={disappearingDuration}
                activeChatTheme={activeChatTheme}
                doodlesEnabled={doodlesEnabled}
                activeBubbleColor={activeBubbleColor}
                messages={messages}
                starredMessages={starredMessages}
                isMessageStarred={isMessageStarred}
                setShowAddMemberModal={setShowAddMemberModal}
                setShowBlockModal={setShowBlockModal}
                setShowReportModal={setShowReportModal}
                setShowAboutAiModal={setShowAboutAiModal}
                setShowProfilePicture={setShowProfilePicture}
                setConfirmModalConfig={setConfirmModalConfig}
                setContactInfoTab={setContactInfoTab}
                setIsChatSearchOpen={setIsChatSearchOpen}
                handleAudioCall={handleAudioCall}
                handleVideoCall={handleVideoCall}
                handleGroupCall={handleGroupCall}
                handleExecuteClearChat={handleExecuteClearChat}
                handleToggleBlock={handleToggleBlock}
                handleToggleBlockMember={handleToggleBlockMember}
                getAvatarColor={getAvatarColor}
                memberTags={memberTags}
                myMemberTag={myMemberTag}
                onlineUsers={onlineUsers}
                isUserOnline={isUserOnline}
                handleToggleMemberAdmin={handleToggleMemberAdmin}
                handleRemoveMember={handleRemoveMember}
                handleSaveMemberTag={handleSaveMemberTag}
                memberTagPromptOpen={memberTagPromptOpen}
                setMemberTagPromptOpen={setMemberTagPromptOpen}
                editingMemberForTag={editingMemberForTag}
                setEditingMemberForTag={setEditingMemberForTag}
                userMemberTag={userMemberTag}
                setUserMemberTag={setUserMemberTag}
                isSavingMemberTag={isSavingMemberTag}
              />
            )}

            {contactInfoTab === "security" && (
              <ContactInfoSecurityTab
                isMetaAi={isMetaAi}
                theme={theme}
                user={user}
                selectedContact={selectedContact}
                viewingMember={viewingMember}
                setContactInfoTab={setContactInfoTab}
                showContactInfo={showContactInfo}
              />
            )}

            {(contactInfoTab === "privacy" ||
              contactInfoTab === "advancedPrivacy") && (
                <ContactInfoPrivacyTab
                  contactInfoTab={contactInfoTab}
                  setContactInfoTab={setContactInfoTab}
                  chatId={chatId}
                  theme={theme}
                />
              )}

            {(contactInfoTab === "disappearing" ||
              contactInfoTab === "defaultTimer") && (
                <ContactInfoDisappearingTab
                  contactInfoTab={contactInfoTab}
                  setContactInfoTab={setContactInfoTab}
                  chatId={chatId}
                  disappearingDurations={disappearingDurations}
                  setDisappearingDuration={setDisappearingDuration}
                  defaultMessageTimer={defaultMessageTimer}
                  setDefaultMessageTimer={setDefaultMessageTimer}
                  theme={theme}
                />
              )}

            {(contactInfoTab === "chatTheme" ||
              contactInfoTab === "chatBubble" ||
              contactInfoTab === "allThemes" ||
              contactInfoTab === "wallpaper" ||
              contactInfoTab === "solidColour") && (
                <ContactInfoThemeTab
                  contactInfoTab={contactInfoTab}
                  setContactInfoTab={setContactInfoTab}
                  chatId={chatId}
                  chatThemes={chatThemes}
                  chatBubbleColors={chatBubbleColors}
                  chatDoodles={chatDoodles}
                  setChatTheme={setChatTheme}
                  setChatDoodles={setChatDoodles}
                  setChatBubbleColor={setChatBubbleColor}
                  updateCursorTooltip={updateCursorTooltip}
                  hideCursorTooltip={hideCursorTooltip}
                />
              )}

            {(contactInfoTab === "starred" || contactInfoTab === "kept") && (
              <ContactInfoStarredTab
                contactInfoTab={contactInfoTab}
                chatId={chatId}
                theme={theme}
                user={user}
                selectedContact={selectedContact}
                starredMessages={starredMessages}
                messages={messages}
                toggleStarMessage={toggleStarMessage}
              />
            )}

            {contactInfoTab === "groupPermissions" && (
              <ContactInfoGroupPermissionsTab
                theme={theme}
                isCurrentUserAdmin={isCurrentUserAdmin}
                groupPermissions={groupPermissions}
                handleTogglePermission={handleTogglePermission}
                setShowEditAdminsModal={setShowEditAdminsModal}
                setContactInfoTab={setContactInfoTab}
                adminDisplayNames={adminDisplayNames}
              />
            )}

            {contactInfoTab === "memberChanges" && (
              <ContactInfoMemberChangesTab
                selectedContact={selectedContact}
                isGroup={isGroup}
                theme={theme}
              />
            )}

            {contactInfoTab === "lists" && (
              <ContactInfoListsTab
                chatId={chatId}
                selectedContact={selectedContact}
                theme={theme}
              />
            )}

            {contactInfoTab === "media" && (
              <motion.div
                key="tab-media"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col flex-1 overflow-hidden select-none"
              >
                <ContactMedia
                  contact={selectedContact}
                  chatId={chatId}
                  onClose={() => setContactInfoTab("info")}
                  onCloseDrawer={() => setShowContactInfo(false)}
                />
              </motion.div>
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

          <AboutAiMessagesModal
            isOpen={showAboutAiModal}
            onClose={() => setShowAboutAiModal(false)}
            theme={theme}
          />

          {showAddMemberModal && (
            <AddMemberModal
              isOpen={showAddMemberModal}
              onClose={() => setShowAddMemberModal(false)}
              onOpenPermissions={() => {
                setShowAddMemberModal(false);
                setContactInfoTab("groupPermissions");
              }}
              groupParticipants={groupParticipants}
              convId={chatId}
              theme={theme}
            />
          )}

          {showEditAdminsModal && (
            <EditGroupAdminsModal
              isOpen={showEditAdminsModal}
              onClose={() => setShowEditAdminsModal(false)}
              groupParticipants={groupParticipants}
              groupAdmins={groupAdmins}
              currentUserId={user?._id?.toString()}
              convId={chatId}
            />
          )}

          {showGroupCallModal && (
            <GroupCallModal
              isOpen={showGroupCallModal}
              onClose={() => setShowGroupCallModal(false)}
              groupParticipants={groupParticipants}
              groupAdmins={groupAdmins}
              groupName={groupName}
              groupId={(
                selectedContact?._id ||
                selectedContact?.id ||
                chatId
              )?.toString()}
              groupAvatar={
                selectedContact?.profilePicture ||
                selectedContact?.groupProfileImage ||
                ""
              }
              initialCallType={groupCallModalType}
              theme={theme}
              onStartCall={handleStartCallFromModal}
            />
          )}

          {confirmModalConfig && (
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-[2px] animate-in fade-in duration-150 select-none"
              onClick={() => setConfirmModalConfig(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-[380px] rounded-[24px] p-6 sm:p-7 shadow-2xl border select-none animate-in zoom-in-95 duration-150 ${theme === "dark"
                  ? "bg-[#202c33] border-white/5 text-[#e9edef]"
                  : "bg-white border-black/10 text-[#111b21]"
                  }`}
              >
                <h3
                  className={`text-[19px] sm:text-[20px] font-semibold leading-snug mb-3 break-words ${theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                >
                  {confirmModalConfig.title}
                </h3>
                {confirmModalConfig.description && (
                  <p
                    className={`text-[14px] leading-relaxed mb-6 ${theme === "dark" ? "text-[#8696a0]" : "text-gray-600"
                      }`}
                  >
                    {confirmModalConfig.description}
                  </p>
                )}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmModalConfig(null)}
                    className={`px-5 py-2.5 rounded-full text-[14px] font-medium transition-colors cursor-pointer border ${theme === "dark"
                      ? "border-[#3b4a54] text-[#00a884] hover:bg-[#00a884]/10"
                      : "border-gray-300 text-[#00a884] hover:bg-[#00a884]/10"
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const onConfirm = confirmModalConfig.onConfirm;
                      setConfirmModalConfig(null);
                      if (typeof onConfirm === "function") {
                        onConfirm();
                      }
                    }}
                    className={`px-5 py-2.5 rounded-full text-[14px] font-medium transition-colors cursor-pointer shadow-md ${confirmModalConfig.isDanger
                      ? "bg-[#ea4335] hover:bg-[#d93025] text-white"
                      : "bg-[#00a884] hover:bg-[#02906f] text-white"
                      }`}
                  >
                    {confirmModalConfig.confirmText || "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          )}

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
