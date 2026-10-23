import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useOutsideClick from "../hook/useOutsideClick";
import useLayoutStore from "../store/layoutStore";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import { useChatStore, getTargetUserId } from "../store/chatStore";
import useVideoCallStore from "../store/videoCallStore";
import { generateSafetyNumber } from "../utils/cryptoUtils";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { RxCross2, RxExit } from "react-icons/rx";
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
  FaUsers,
  FaUser,
  FaUserCog,
  FaUserCheck,
  FaRegHeart,
} from "react-icons/fa";
import { FaArrowLeft, FaUserShield } from "react-icons/fa6";
import { IoMdRemoveCircleOutline, IoMdExit } from "react-icons/io";
import { BsEmojiSmile } from "react-icons/bs";
import { TbCameraPlus } from "react-icons/tb";
import EmojiPicker from "emoji-picker-react";
import { IoTimerOutline, IoColorPaletteOutline, IoShieldCheckmarkOutline, IoRemoveCircleOutline } from "react-icons/io5";
import {
  MdChevronLeft,
  MdChevronRight,
  MdRefresh,
  MdOutlineChatBubbleOutline,
  MdOutlineWallpaper,
  MdCheck,
  MdBlock,
  MdThumbDown,
  MdShield,
  MdList,
  MdOutlineChat,
  MdHistory,
  MdKeyboardArrowDown,
  MdOutlineVisibility,
  MdOutlinePhotoCamera,
  MdOutlineFolder,
  MdOutlineEmojiEmotions,
  MdDeleteOutline,
} from "react-icons/md";
import { FiUserPlus, FiLink, FiEdit2, FiTag } from "react-icons/fi";
import { LuSparkles, LuDownload } from "react-icons/lu";
import { format } from "date-fns";
import ReportModal from "./ReportModal";
import BlockModal from "./BlockModal";
import AddMemberModal from "./AddMemberModal";
import EditGroupAdminsModal from "./EditGroupAdminsModal";
import GroupCallModal from "./GroupCallModal";
import CameraModal from "./CameraModal";
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
import axiosInstance from "../services/url.services";
import {
  WhatsAppMediaFolderIcon,
  EndToEndEncryptionIllustration,
  DisappearingMessagesIllustration,
} from "./common/Icons";
import ContactMedia from "./ContactMedia";
import FileViewerModal from "./FileViewerModal";
import { FALLBACK_MEDIA } from "../assets/rawData";
import { MetaAiRing, META_AI_USER_ID, MetaAiBadge } from "./common/MetaAiIcon";
import { HiOutlineInformationCircle } from "react-icons/hi";
import AboutAiMessagesModal from "./AboutAiMessagesModal";

const WhatsAppSwitch = ({ checked, onChange, disabled = false, className = "" }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={(e) => {
      e?.stopPropagation?.();
      if (!disabled && onChange) onChange(e);
    }}
    className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${checked
      ? "bg-[#00a884] justify-end"
      : "bg-transparent border-2 border-[#8696a0] justify-start"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
  >
    <div
      className={`w-4 h-4 rounded-full transition-transform ${checked ? "bg-[#111b21] mr-0.5" : "bg-[#8696a0] ml-0.5"
        }`}
    />
  </button>
);

const formatMemberChangeDate = (dateVal) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} at ${hours}:${minutes}`;
};

const ActionButton = ({ icon, label, onClick, disabled, theme }) => (
  <button
    type="button"
    onClick={!disabled ? onClick : undefined}
    className={`flex flex-col items-center gap-1.5 group transition-all duration-200 ${disabled ? "opacity-35 cursor-not-allowed" : "cursor-pointer active:scale-95"
      }`}
  >
    <div
      className={`w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-200 ${theme === "dark"
        ? "bg-white/5 border-transparent text-[#00a884] group-hover:bg-white/10 group-hover:border-[#00a884]/40"
        : "bg-white border-gray-200 text-[#00897b] group-hover:bg-gray-100 group-hover:border-[#00897b]/40"
        } shadow-xs`}
    >
      {icon}
    </div>
    <span
      className={`text-[12px] font-normal tracking-tight transition-colors ${theme === "dark"
        ? "text-[#00a884] group-hover:text-[#02906f]"
        : "text-[#00897b] group-hover:text-[#00796b]"
        }`}
    >
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
    viewingMember: layoutViewingMember,
    setViewingMember: setLayoutViewingMember,
    setChatDoodles,
    chatBubbleColors = {},
    setChatBubbleColor,
    resetChatBubbleColor,
    resetChatTheme,
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
  } = useChatStore();
  const setIsChatSearchOpen = useLayoutStore((state) => state.setIsChatSearchOpen);

  const handleExecuteClearChat = async () => {
    const targetId = targetUserId || selectedContact?._id;
    await clearChat(chatId, targetId);
    toast.success("Chat cleared");
    onClose();
  };
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
    selectedContact?.conversation?.isGroup
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

  const groupDescription =
    selectedContact?.groupDescription ||
    selectedContact?.conversation?.groupDescription ||
    "";

  const getGroupOnlineCount = useChatStore((state) => state.getGroupOnlineCount);
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const checkUserStatus = useChatStore((state) => state.checkUserStatus);

  useEffect(() => {
    if (isGroup && groupParticipants.length > 0 && typeof checkUserStatus === "function") {
      const myIdStr = user?._id?.toString();
      groupParticipants.forEach((p) => {
        const pId = (p?._id || p)?.toString();
        if (pId && pId !== myIdStr) {
          checkUserStatus(pId);
        }
      });
    }
  }, [isGroup, groupParticipants, user?._id, checkUserStatus]);

  const groupOnlineCount = useMemo(() => {
    if (!isGroup || !getGroupOnlineCount) return 0;
    return getGroupOnlineCount(groupParticipants, user?._id);
  }, [isGroup, groupParticipants, user?._id, onlineUsers, getGroupOnlineCount]);

  const [viewingMember, setViewingMemberState] = useState(layoutViewingMember || null);

  const setViewingMember = useCallback(
    (member) => {
      setViewingMemberState(member);
      setLayoutViewingMember?.(member);
    },
    [setLayoutViewingMember]
  );

  useEffect(() => {
    if (layoutViewingMember !== undefined) {
      setViewingMemberState(layoutViewingMember);
    }
  }, [layoutViewingMember]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditAdminsModal, setShowEditAdminsModal] = useState(false);
  const [showGroupCallModal, setShowGroupCallModal] = useState(false);
  const [groupCallModalType, setGroupCallModalType] = useState("audio");
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [showAboutAiModal, setShowAboutAiModal] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [openMemberMenuId, setOpenMemberMenuId] = useState(null);
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
  const memberMenuRef = useRef(null);

  useEffect(() => {
    setViewingMember(null);
  }, [selectedContact?._id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (memberMenuRef.current && !memberMenuRef.current.contains(e.target)) {
        setOpenMemberMenuId(null);
      }
    };
    if (openMemberMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMemberMenuId]);

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

  const displayedParticipants = useMemo(() => {
    if (showAllMembers) return groupParticipants;
    return groupParticipants.slice(0, 10);
  }, [groupParticipants, showAllMembers]);

  const effectiveTargetUserId = useMemo(() => {
    if (viewingMember) return (viewingMember._id || viewingMember.id)?.toString();
    if (!isGroup) return (targetUserId || selectedContact?._id || selectedContact?.id)?.toString();
    return null;
  }, [viewingMember, isGroup, targetUserId, selectedContact]);

  const commonGroups = useMemo(() => {
    const currentUserId = user?._id?.toString();
    if (!effectiveTargetUserId || !currentUserId || effectiveTargetUserId === currentUserId) {
      return [];
    }
    const convList = Array.isArray(conversations?.data) ? conversations.data : [];
    const list = [];
    const seenIds = new Set();

    if (isGroup) {
      const parts = groupParticipants || [];
      const hasTarget = parts.some(
        (p) => (p?._id || p)?.toString() === effectiveTargetUserId
      );
      if (hasTarget) {
        const gId = (selectedContact?._id || selectedContact?.id || chatId)?.toString();
        if (gId) {
          seenIds.add(gId);
          list.push({
            ...selectedContact,
            _id: gId,
            id: gId,
            groupName: groupName,
            name: groupName,
            username: groupName,
            groupProfileImage: selectedContact?.profilePicture || selectedContact?.groupProfileImage || "",
            participants: groupParticipants,
          });
        }
      }
    }

    for (const conv of convList) {
      if (!conv) continue;
      const isGrp = Boolean(conv.isGroup || conv.isGroupChat || conv.conversation?.isGroup);
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

  const isViewingMemberOnline = useMemo(() => {
    if (!viewingMember) return false;
    const mId = (viewingMember._id || viewingMember.id || viewingMember)?.toString();
    if (!mId) return false;
    if (onlineUsers instanceof Map) {
      return Boolean(onlineUsers.get(mId)?.isOnline);
    }
    if (Array.isArray(onlineUsers)) {
      return onlineUsers.includes(mId);
    }
    if (typeof isUserOnline === "function") {
      return Boolean(isUserOnline(mId));
    }
    return Boolean(viewingMember.isOnline);
  }, [viewingMember, onlineUsers, isUserOnline]);

  const isViewingMemberBlocked = useMemo(() => {
    if (!viewingMember || !blockedContacts || blockedContacts.length === 0) return false;
    const mId = (viewingMember._id || viewingMember.id)?.toString();
    return mId ? blockedContacts.includes(mId) : false;
  }, [viewingMember, blockedContacts]);

  const handleMessageMember = (member) => {
    if (!member) return;
    const memberId = (member._id || member.id || member)?.toString();
    if (!memberId) return;

    const convList = Array.isArray(conversations?.data) ? conversations.data : [];
    const existingConv = convList.find((c) => {
      if (c.isGroup || c.isGroupChat || c.conversation?.isGroup) return false;
      const parts = c.participants || c.conversation?.participants || [];
      return parts.some((p) => (p?._id || p)?.toString() === memberId);
    });

    const userList = Array.isArray(allChatUsers) ? allChatUsers : [];
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
    setShowContactInfo(false);
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
    setShowContactInfo(false);
  };

  const handleAudioCallMember = (member) => {
    if (!member) return;
    const mId = (member._id || member.id || member)?.toString();
    const isOnline = isUserOnline ? isUserOnline(mId) : Boolean(member?.isOnline);
    if (!isOnline) {
      toast.info("User is offline. Cannot initiate the call");
      return;
    }
    const { initiateCall } = useVideoCallStore.getState();
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
    const isOnline = isUserOnline ? isUserOnline(mId) : Boolean(member?.isOnline);
    if (!isOnline) {
      toast.info("User is offline. Cannot initiate the call");
      return;
    }
    const { initiateCall } = useVideoCallStore.getState();
    const avatar = member?.profilePicture;
    initiateCall(
      mId,
      member?.username || member?.name || "Participant",
      avatar,
      "video"
    );
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

    const otherMemberIds = otherMembers
      .map((p) => (p?._id || p)?.toString())
      .filter(Boolean);

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
    const gId = (selectedContact?._id || selectedContact?.id || chatId)?.toString();

    initiateCall(
      otherMemberIds[0],
      displayName,
      avatar,
      callType,
      {
        isGroup: true,
        groupId: gId,
        groupName: displayName,
        groupAvatar: avatar,
        participantIds: otherMemberIds,
      }
    );
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

  const renderCommonGroupsCard = () => {
    return (
      <div
        className={`relative p-3.5 rounded-2xl transition-all duration-200 border ${theme === "dark"
          ? "bg-white/[0.03] border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
          : "bg-white border-gray-200 shadow-xs"
          }`}
      >
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <p className="text-[13px] font-medium text-[#8696a0] dark:text-[#8696a0]">
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

  const [memberChanges, setMemberChanges] = useState([]);
  const [isLoadingMemberChanges, setIsLoadingMemberChanges] = useState(false);

  const fetchMemberChanges = useCallback(async () => {
    const convId = (
      selectedContact?.conversation?._id ||
      selectedContact?._id
    )?.toString();
    if (!convId || !isGroup) return;

    setIsLoadingMemberChanges(true);
    try {
      const { data } = await axiosInstance.get(
        `/chat/group/${convId}/member-changes`
      );
      const list = data?.data || data || [];
      setMemberChanges(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching member changes:", err);
    } finally {
      setIsLoadingMemberChanges(false);
    }
  }, [selectedContact?._id, selectedContact?.conversation?._id, isGroup]);

  useEffect(() => {
    if (contactInfoTab === "memberChanges") {
      fetchMemberChanges();
    }
  }, [contactInfoTab, fetchMemberChanges]);

  useEffect(() => {
    const socket = useChatStore.getState().socket;
    if (!socket) return;

    const handleMemberChangeAdded = (change) => {
      const convId = (
        selectedContact?.conversation?._id ||
        selectedContact?._id
      )?.toString();
      if (!change || (change.conversationId && change.conversationId !== convId)) return;
      setMemberChanges((prev) => [change, ...prev]);
    };

    socket.on("member_change_added", handleMemberChangeAdded);
    return () => {
      socket.off("member_change_added", handleMemberChangeAdded);
    };
  }, [selectedContact?._id, selectedContact?.conversation?._id]);

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

  const canEditGroupSettings = useMemo(() => {
    if (!isGroup) return false;
    if (isCurrentUserAdmin) return true;
    return groupPermissions.editGroupSettings !== false;
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

  const handleTogglePermission = async (key) => {
    if (!isCurrentUserAdmin) {
      toast.error("Only group admins can edit group permissions");
      return;
    }
    const convId = (
      selectedContact?.conversation?._id ||
      selectedContact?._id
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
      toast.error(err?.response?.data?.message || "Failed to update permissions");
    }
  };

  const handleToggleMemberAdmin = async (memberId, currentlyAdmin, memberName) => {
    const convId = (
      selectedContact?.conversation?._id ||
      selectedContact?._id
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
      const updated = data?.data || data;
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
      selectedContact?.conversation?._id ||
      selectedContact?._id
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

      const { data } = await axiosInstance.put(`/chat/group/${convId}`, payload);
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
      selectedContact?.conversation?._id ||
      selectedContact?._id
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
          toast.error(err?.response?.data?.message || "Failed to remove member");
        }
      },
    });
  };

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

  useEffect(() => {
    setEditedGroupName(groupName);
    setEditedGroupDesc(groupDescription);
    setIsEditingGroupName(false);
    setIsEditingGroupDesc(false);
    setShowNameEmoji(false);
    setShowDescEmoji(false);
  }, [selectedContact?._id, groupName, groupDescription]);

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
      const { data } = await axiosInstance.put(`/chat/group/${convId}`, {
        groupName: trimmed,
      });
      const updated = data?.data || data;
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
      const { data } = await axiosInstance.put(`/chat/group/${convId}`, {
        groupDescription: trimmed,
      });
      const updated = data?.data || data;
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
      toast.error(
        err?.response?.data?.message || "Failed to update group description"
      );
    }
  };

  const AVATAR_BG_COLORS = [
    "#00a884",
    "#008069",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f97316",
    "#f59e0b",
    "#ef4444",
    "#202c33",
  ];

  const [showGroupPhotoMenu, setShowGroupPhotoMenu] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showEmojiStickerModal, setShowEmojiStickerModal] = useState(false);
  const [isUploadingGroupImage, setIsUploadingGroupImage] = useState(false);
  const [selectedEmojiAvatar, setSelectedEmojiAvatar] = useState("😎");
  const [selectedBgColor, setSelectedBgColor] = useState("#00a884");

  const groupPhotoMenuRef = useRef(null);
  const groupImageInputRef = useRef(null);

  useOutsideClick(groupPhotoMenuRef, () => {
    if (showGroupPhotoMenu) setShowGroupPhotoMenu(false);
  });

  useEffect(() => {
    setShowGroupPhotoMenu(false);
    setShowEmojiStickerModal(false);
    setShowCameraModal(false);
  }, [selectedContact?._id]);

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
      const { data } = await axiosInstance.put(`/chat/group/${convId}`, {
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
          setShowContactInfo(false);
          useLayoutStore.getState().setSelectedContact(null);
          toast.info("You left the group");
        } catch (err) {
          console.error("Error exiting group:", err);
          try {
            await useChatStore.getState().deleteChat(convId);
            setShowContactInfo(false);
            useLayoutStore.getState().setSelectedContact(null);
            toast.info("You left the group");
          } catch (e) {
            toast.error("Failed to exit group");
          }
        }
      },
    });
  };

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

  const [chatMediaCount, setChatMediaCount] = useState(0);
  const [chatMediaList, setChatMediaList] = useState([]);
  const [previewModalFile, setPreviewModalFile] = useState(null);
  const [previewModalIndex, setPreviewModalIndex] = useState(0);

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
      } catch (err) {
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
      return Boolean(item.isStarred || item.starred);
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
      messageId: item._id || item.messageId,
      _id: item._id || item.messageId,
      _rawItem: item,
      isUserMessage: String(item.sender?._id || item.sender) === String(user?._id),
      items: previewImages.map((img) => ({
        url: img.url || img.imageOrVideoUrl,
        name: img.fileName || "image.jpg",
        type: "image",
        fileType: "image",
        size: img.fileSize,
        sender: img.sender,
        createdAt: img.createdAt,
        messageId: img._id || img.messageId,
        _id: img._id || img.messageId,
        _rawItem: img,
        isUserMessage: String(img.sender?._id || img.sender) === String(user?._id),
      })),
      initialIndex: idx,
    });
  };

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

    window.dispatchEvent(new Event("whatsapp_lists_changed"));

    toast.success(
      isMember ? `Removed from ${listName}` : `Added to ${listName}`
    );
  };

  useEffect(() => {
    const handleSyncLists = () => {
      try {
        const custom = JSON.parse(
          localStorage.getItem("whatsapp_all_custom_lists") || "[]"
        );
        setCustomLists(custom);
        const map = JSON.parse(
          localStorage.getItem("whatsapp_contact_lists") || "{}"
        );
        if (chatId) setContactLists(map[chatId] || []);
      } catch { }
    };
    window.addEventListener("whatsapp_lists_changed", handleSyncLists);
    return () =>
      window.removeEventListener("whatsapp_lists_changed", handleSyncLists);
  }, [chatId]);

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
    window.dispatchEvent(new Event("whatsapp_lists_changed"));
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
      targetUserId,
      chatId,
      selectedContact?._id,
      selectedContact?.id,
      selectedContact?.conversation?._id,
      selectedContact?.conversation,
    ].filter(Boolean).map(String);
    return candidates.some((id) => blockedContacts.includes(id));
  }, [targetUserId, chatId, selectedContact, blockedContacts]);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

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
      : (targetUserId || selectedContact?._id || chatId);
    const targetName = viewingMember
      ? (viewingMember.username || viewingMember.name || "Contact")
      : (selectedContact?.username || "Contact");
    if (block && targetId) {
      blockContact(targetId);
      toast.success(
        `${targetName} reported and blocked`
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
  const [themePageIndex, setThemePageIndex] = useState(0);

  useEffect(() => {
    const activeIdx = CURATED_THEME_IDS.indexOf(activeChatThemeId);
    if (activeIdx !== -1) {
      setThemePageIndex(Math.floor(activeIdx / 6));
    }
  }, [activeChatThemeId]);

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
    if (showBlockModal || showReportModal) return;
    setShowContactInfo(false);
  });

  const setShowProfilePicture = useLayoutStore(
    (state) => state.setShowProfilePicture,
  );

  useEffect(() => {
    if (!showContactInfo || (!selectedContact && !viewingMember)) return;

    const myPubKey =
      user?.publicKey ||
      localStorage.getItem(`e2ee_pk_${user?._id}`) ||
      user?._id;
    const activeContact = viewingMember || selectedContact;
    const peerPubKey = activeContact?.publicKey || activeContact?._id;

    if (myPubKey && peerPubKey) {
      generateSafetyNumber(myPubKey, peerPubKey).then((result) => {
        setSafetyNumber(result);
      });
    }
  }, [showContactInfo, selectedContact, viewingMember, user]);
  useEffect(() => {
    if (!safetyNumber.fullNumber) return;
    const activeContact = viewingMember || selectedContact;

    const payload = JSON.stringify({
      app: "whatsapp-security",
      safetyNumber: safetyNumber.fullNumber,
      participants: [
        user?._id?.toString() || "",
        activeContact?._id?.toString() || "",
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
  }, [safetyNumber.fullNumber, user?._id, selectedContact?._id, viewingMember?._id]);

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
      toast.info("User is offline. Cannot initiate the call");
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
      toast.info("User is offline. Cannot initiate the call");
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
          className={`h-full flex flex-col select-none ${isMobile
            ? "fixed inset-0 z-[100]"
            : "relative w-full md:w-[350px] lg:w-[380px] xl:w-[420px] shrink-0 border-l"
            } ${theme === "dark"
              ? "bg-[#111b21] border-[#222d34] text-[#e9edef]"
              : "bg-[#f0f2f5] border-gray-200 text-gray-800"
            } shadow-xl`}
        >
          {contactInfoTab !== "media" && (
            <div
              className={`h-[60px] px-4 flex items-center justify-between border-b shrink-0 ${theme === "dark" ? "bg-[#111b21] border-[#222d34]" : "bg-[#f0f2f5] border-gray-200 text-gray-900"
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {contactInfoTab === "info" && viewingMember ? (
                  <button
                    type="button"
                    onClick={() => setViewingMember(null)}
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer"
                    title="Back to group info"
                  >
                    <FaArrowLeft size={18} />
                  </button>
                ) : contactInfoTab === "info" ? (
                  <button
                    type="button"
                    onClick={() => setShowContactInfo(false)}
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer"
                    title="Close"
                  >
                    <RxCross2 size={22} />
                  </button>
                ) : (
                  <button
                    type="button"
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
                      } else if (contactInfoTab === "memberChanges") {
                        setContactInfoTab("info");
                      } else {
                        setContactInfoTab("info");
                      }
                    }}
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer"
                    title="Back"
                  >
                    <FaArrowLeft size={18} />
                  </button>
                )}

                {contactInfoTab === "security" ? (
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-[16px] leading-tight truncate">
                      Verify security code
                    </span>
                    <span className="text-[12px] text-[#8696a0] font-normal truncate">
                      You, {viewingMember?.username || viewingMember?.name || selectedContact?.username || "Contact"}
                    </span>
                  </div>
                ) : (
                  <h2 className="font-semibold text-[17px] tracking-tight truncate">
                    {contactInfoTab === "privacy"
                      ? "Your chats and calls are private"
                      : contactInfoTab === "media"
                        ? "Media, links and docs"
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
                                              : contactInfoTab === "groupPermissions"
                                                ? "Group permissions"
                                                : contactInfoTab === "memberChanges"
                                                  ? "Member changes"
                                                  : isMetaAi
                                                    ? "Meta AI info"
                                                    : isGroup
                                                      ? (viewingMember ? "Contact info" : "Group info")
                                                      : "Contact info"}
                  </h2>
                )}
              </div>

              {contactInfoTab === "info" && viewingMember ? (
                <button
                  type="button"
                  onClick={() => setShowContactInfo(false)}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer flex items-center justify-center"
                  title="Close"
                >
                  <RxCross2 size={22} />
                </button>
              ) : contactInfoTab === "info" && !isMetaAi && !isGroup ? (
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer flex items-center justify-center"
                  title="Edit contact"
                >
                  <FaPen className="h-4 w-4" />
                </button>
              ) : contactInfoTab === "info" && isGroup ? null : contactInfoTab === "info" && isMetaAi ? (
                <button
                  type="button"
                  onClick={() => setShowContactInfo(false)}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer flex items-center justify-center"
                  title="Close"
                >
                  <RxCross2 size={22} />
                </button>
              ) : contactInfoTab === "chatTheme" || contactInfoTab === "wallpaper" ? (
                <button
                  type="button"
                  onClick={handleResetTheme}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer"
                  title={contactInfoTab === "wallpaper" ? "Reset wallpaper" : "Reset theme"}
                >
                  <MdRefresh size={22} />
                </button>
              ) : contactInfoTab === "chatBubble" ? (
                <button
                  type="button"
                  onClick={handleResetBubbleColor}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer"
                  title="Reset chat bubble"
                >
                  <MdRefresh size={22} />
                </button>
              ) : contactInfoTab === "allThemes" || contactInfoTab === "solidColour" ? null : (
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setScanError(null);
                    setShowContactInfo(false);
                  }}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer"
                  title="Close"
                >
                  <RxCross2 size={22} />
                </button>
              )}
            </div>
          )}
          <AnimatePresence mode="wait">
            {contactInfoTab === "info" && (
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
                        if (viewingMember?.profilePicture && !viewingMember.profilePicture.includes("default-avatar")) {
                          setShowProfilePicture(true, {
                            image: viewingMember.profilePicture,
                            username: viewingMember.username || viewingMember.name || "Member",
                          });
                        }
                      }}
                      className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex items-center justify-center overflow-hidden border-2 ${theme === "dark" ? "border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.5)]" : "border-gray-200 shadow-md"} cursor-pointer select-none`}
                    >
                      {viewingMember?.profilePicture && !viewingMember.profilePicture.includes("default-avatar") ? (
                        <img
                          src={viewingMember.profilePicture}
                          alt={viewingMember.username || viewingMember.name || "Member"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white font-semibold text-5xl"
                          style={{ backgroundColor: getAvatarColor(viewingMember.username || viewingMember.name || "Participant") }}
                        >
                          {((viewingMember.username || viewingMember.name || "U")[0] || "U").toUpperCase()}
                        </div>
                      )}
                    </div>
                  ) : isMetaAi ? (
                    <div
                      onClick={() =>
                        setShowProfilePicture(true, {
                          isMetaAi: true,
                          username: "Meta AI",
                        })
                      }
                      className="w-40 h-40 rounded-full flex items-center justify-center p-2 cursor-pointer relative group transition-transform duration-300"
                      title="Click to view Meta AI"
                    >
                      <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-blue-500/15 via-purple-500/15 to-pink-500/15 blur-2xl group-hover:blur-3xl transition-all" />
                      <MetaAiRing
                        size={146}
                        animate
                        className="relative z-10 drop-shadow-[0_12px_30px_rgba(59,130,246,0.35)]"
                      />
                    </div>
                  ) : isGroup ? (
                    <div className="relative flex flex-col items-center">
                      <div
                        onClick={() => {
                          const hasImg = selectedContact?.profilePicture || selectedContact?.groupProfileImage;
                          if (hasImg) {
                            setShowProfilePicture(true, {
                              image: selectedContact.profilePicture || selectedContact.groupProfileImage,
                              username: groupName,
                            });
                          } else if (canEditGroupSettings) {
                            setShowGroupPhotoMenu((prev) => !prev);
                          }
                        }}
                        className={`relative w-40 h-40 rounded-full select-none shadow-[0_16px_40px_rgba(0,0,0,0.25)] transition-transform duration-200 group overflow-hidden border-4 ${theme === "dark" ? "border-[#202c33]" : "border-white"
                          } ${selectedContact?.profilePicture || selectedContact?.groupProfileImage
                            ? "cursor-pointer hover:scale-[1.02]"
                            : canEditGroupSettings
                              ? "cursor-pointer hover:scale-[1.02]"
                              : "cursor-default"
                          }`}
                        title={
                          selectedContact?.profilePicture || selectedContact?.groupProfileImage
                            ? "Click to view photo"
                            : canEditGroupSettings
                              ? "Click to add photo"
                              : groupName
                        }
                      >
                        {selectedContact?.profilePicture || selectedContact?.groupProfileImage ? (
                          <img
                            src={selectedContact.profilePicture || selectedContact.groupProfileImage}
                            alt={groupName}
                            className="w-full h-full object-cover block"
                          />
                        ) : (
                          <div
                            className="w-full h-full bg-[#dfe5e7] dark:bg-[#202c33] flex items-center justify-center"
                            title={groupName}
                          >
                            <FaUsers className="w-16 h-16 text-gray-400 dark:text-gray-300" />
                          </div>
                        )}

                        {canEditGroupSettings && (
                          <div
                            className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center transition-opacity duration-200 text-white gap-1 pointer-events-none ${showGroupPhotoMenu
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                              }`}
                          >
                            <TbCameraPlus size={36} className="text-white drop-shadow-md" />
                            <span className="text-[11px] font-medium uppercase tracking-wider text-white/95">
                              {selectedContact?.profilePicture || selectedContact?.groupProfileImage ? "Change" : "Add photo"}
                            </span>
                          </div>
                        )}
                      </div>

                      {canEditGroupSettings && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowGroupPhotoMenu((prev) => !prev);
                          }}
                          className={`absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] active:scale-95 text-white flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.35)] border-2 transition-all duration-150 cursor-pointer z-20 ${theme === "dark" ? "border-[#111b21]" : "border-white"
                            }`}
                          title="Change group photo"
                        >
                          <TbCameraPlus size={20} />
                        </button>
                      )}

                      {showGroupPhotoMenu && (
                        <div
                          ref={groupPhotoMenuRef}
                          className={`absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-50 w-52 py-2 rounded-2xl shadow-[0_14px_40px_rgba(0,0,0,0.55)] border backdrop-blur-md select-none animate-in fade-in zoom-in-95 duration-150 overflow-hidden ${theme === "dark"
                            ? "bg-[#233138] border-[#2e3b43] text-[#e9edef]"
                            : "bg-white border-gray-200 text-gray-800"
                            }`}
                        >
                          {(selectedContact?.profilePicture || selectedContact?.groupProfileImage) && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowGroupPhotoMenu(false);
                                setShowProfilePicture(true, {
                                  image: selectedContact?.profilePicture || selectedContact?.groupProfileImage,
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
                          {(selectedContact?.profilePicture || selectedContact?.groupProfileImage) && (
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
                      className={`w-36 h-36 sm:w-40 sm:h-40 rounded-full object-cover border-2 ${theme === "dark" ? "border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.5)]" : "border-gray-200 shadow-md"} cursor-pointer`}
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
                      {getMemberTag(viewingMember?._id || viewingMember?.id) && (
                        <div className="mt-0.5 mb-1.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[12px] font-medium border shadow-sm ${theme === "dark"
                              ? "bg-[#16312e] text-[#00a884] border-[#00a884]/30"
                              : "bg-[#e0f0e9] text-[#00897b] border-[#00897b]/30"
                              }`}
                          >
                            <FiTag className="w-3 h-3" />
                            {getMemberTag(viewingMember?._id || viewingMember?.id)}
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
                        <div className="flex items-center justify-center gap-2 group px-4 max-w-full">
                          <h2
                            className={`text-2xl font-bold tracking-tight transition-colors duration-300 break-words text-center ${theme === "dark" ? "text-white/95" : "text-gray-900"
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
                        <p className="text-[12px] font-medium text-[#00a884] uppercase tracking-wide">
                          Group description
                        </p>
                        {!isEditingGroupDesc && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditedGroupDesc(groupDescription);
                              setIsEditingGroupDesc(true);
                              setShowDescEmoji(false);
                            }}
                            className="p-1 rounded-full text-[#8696a0] hover:text-[#00a884] hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                            title="Edit group description"
                          >
                            <FaPen size={13} />
                          </button>
                        )}
                      </div>

                      {!isEditingGroupDesc ? (
                        <div
                          onClick={() => {
                            if (!groupDescription) {
                              setEditedGroupDesc("");
                              setIsEditingGroupDesc(true);
                              setShowDescEmoji(false);
                            }
                          }}
                          className={!groupDescription ? "cursor-pointer" : ""}
                        >
                          {groupDescription ? (
                            <p
                              className={`text-[14.5px] leading-relaxed whitespace-pre-wrap select-text ${theme === "dark" ? "text-[#e9edef]" : "text-gray-800"
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
                            ? (selectedContact?.about || "Responses are generated by AI. Some may be inaccurate or inappropriate,including for some teens.")
                            : (selectedContact?.about || "Hey there! I am using WhatsApp.")
                        }
                        className={`text-[14.5px] leading-relaxed select-text ${theme === "dark" ? "text-[#e9edef]" : "text-gray-800"
                          }`}
                      >
                        {isMetaAi
                          ? (<div className="cursor-pointer hover:opacity-90 transition" onClick={() => setShowAboutAiModal(true)}>{selectedContact?.about || "Responses are generated by AI. Some may be inaccurate or inappropriate,including for some teens."} </div>)
                          : (selectedContact?.about || "Hey there! I am using WhatsApp.")}
                      </p>
                      {!isMetaAi && selectedContact?.aboutUpdatedAt && (
                        <p className="text-[11px] mt-1.5 text-[#8696a0]">
                          {`Updated ${new Date(
                            selectedContact.aboutUpdatedAt,
                          ).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}`}
                        </p>
                      )}
                    </div>
                  )}

                  {(viewingMember || (!isGroup && !isMetaAi && commonGroups.length > 0)) && (
                    renderCommonGroupsCard()
                  )}

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
                          <h4 className={`text-[14.5px] font-medium flex items-center gap-2 ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                            }`}>
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

                            <span className={`text-[14.5px] font-medium ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                              }`}>
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
                              <h4 className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                                }`}>
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

                          <div className="flex items-center gap-2 shrink-0">
                            {chatStarredMessages.length > 0 && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                                {chatStarredMessages.length}
                              </span>
                            )}
                            <MdChevronRight size={19} className="text-[#8696a0]" />
                          </div>
                        </div>

                        <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />

                        {!isMetaAi && (
                          <div
                            onClick={() => setContactInfoTab("kept")}
                            className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                              }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-[#00a884]/10 text-[#00a884] flex items-center justify-center shrink-0">
                                <FaBookmark size={15} />
                              </div>

                              <div className="min-w-0">
                                <h4 className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                                  }`}>
                                  Kept messages
                                </h4>
                                <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                                  {chatKeptMessages.length > 0
                                    ? `${chatKeptMessages.length} kept message${chatKeptMessages.length > 1 ? "s" : ""
                                    }`
                                    : "None"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {chatKeptMessages.length > 0 && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#00a884]/15 text-[#00a884]">
                                  {chatKeptMessages.length}
                                </span>
                              )}
                              <MdChevronRight size={19} className="text-[#8696a0]" />
                            </div>
                          </div>)}
                      </div>

                      <div
                        className={`rounded-xl border overflow-hidden ${theme === "dark"
                          ? "bg-white/[0.03] border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
                          : "bg-white border-gray-200 shadow-sm"
                          }`}
                      >
                        {!isMetaAi && (
                          <div
                            onClick={() => setContactInfoTab("disappearing")}
                            className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                              }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-[#00a884]/10 text-[#00a884] flex items-center justify-center shrink-0">
                                <IoTimerOutline size={19} />
                              </div>

                              <div className="min-w-0">
                                <h4 className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                                  }`}>
                                  Disappearing messages
                                </h4>
                                <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                                  {disappearingDuration}
                                </p>
                              </div>
                            </div>

                            <MdChevronRight size={19} className="text-[#8696a0]" />
                          </div>)}

                        <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />

                        {!isMetaAi && (
                          <div
                            onClick={() => setContactInfoTab("advancedPrivacy")}
                            className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                              }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                                <MdShield size={19} />
                              </div>

                              <div className="min-w-0">
                                <h4 className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                                  }`}>
                                  Advanced chat privacy
                                </h4>
                                <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                                  Protect IP address, disable link previews
                                </p>
                              </div>
                            </div>

                            <MdChevronRight size={19} className="text-[#8696a0]" />
                          </div>)}

                        <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />

                        <div
                          onClick={() => setContactInfoTab("chatTheme")}
                          className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                            }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#00a884]/10 text-[#00a884] flex items-center justify-center shrink-0">
                              <IoColorPaletteOutline size={19} />
                            </div>

                            <div className="min-w-0">
                              <h4 className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                                }`}>
                                Chat theme
                              </h4>
                              <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                                {activeChatTheme.name}
                              </p>
                            </div>
                          </div>

                          <MdChevronRight size={19} className="text-[#8696a0]" />
                        </div>
                      </div>

                      <div
                        className={`rounded-xl border overflow-hidden ${theme === "dark"
                          ? "bg-white/[0.03] border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
                          : "bg-white border-gray-200 shadow-sm"
                          }`}
                      >
                        <div
                          onClick={handleToggleFavorite}
                          className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                            }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isFavorite
                                ? "bg-rose-500/15 text-rose-500"
                                : "bg-rose-500/10 text-rose-400"
                                }`}
                            >
                              {isFavorite ? (
                                <FaHeart size={16} />
                              ) : (
                                <FaRegHeart size={16} />
                              )}
                            </div>

                            <div className="min-w-0">
                              <h4 className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                                }`}>
                                {isFavorite ? "Remove from favourites" : "Add to favourites"}
                              </h4>
                              <p className="text-[12.5px] text-[#8696a0] truncate mt-0.5">
                                {isFavorite
                                  ? "Saved to your favourites list"
                                  : "Add to favourite chats for quick access"}
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
                              <h4 className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                                }`}>
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
                              <h4 className={`text-[14.5px] font-medium leading-tight ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                                }`}>
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
                              <h4 className={`text-[14.5px] font-medium flex items-center gap-2 ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                                }`}>
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
                              <h4 className={`text-[14.5px] font-medium truncate ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                                }`}>
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
                        <div
                          id="group-members-section"
                          className={`rounded-xl border overflow-hidden ${theme === "dark"
                            ? "bg-white/[0.03] border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
                            : "bg-white border-gray-200 shadow-sm"
                            }`}
                        >
                          <div className="flex items-center justify-between p-3.5 pb-2">
                            <span className="text-[13.5px] font-medium text-[#8696a0]">
                              {groupParticipants.length} {groupParticipants.length === 1 ? "member" : "members"}
                            </span>
                            {groupOnlineCount > 0 && (
                              <span className="text-[12px] font-medium text-[#00a884]">
                                {groupOnlineCount} online
                              </span>
                            )}
                          </div>

                          <div className="p-1 space-y-0.5">
                            {canAddMembers && (
                              <div
                                onClick={() => setShowAddMemberModal(true)}
                                className={`flex items-center gap-3.5 p-2.5 rounded-lg transition-colors cursor-pointer ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                                  }`}
                              >
                                <div className="w-10 h-10 rounded-full bg-[#00a884]/15 text-[#00a884] flex items-center justify-center shrink-0 border border-[#00a884]/30">
                                  <FiUserPlus size={18} />
                                </div>
                                <span className="text-[14.5px] font-medium text-[#00a884]">
                                  Add member
                                </span>
                              </div>
                            )}

                            {displayedParticipants.map((member, index) => {
                              const memberId = (member?._id || member)?.toString();
                              const isMe = memberId === user?._id?.toString();
                              const isAdmin = groupAdmins.includes(memberId);
                              const memberTag = getMemberTag(memberId);
                              const isMemberOnline = isMe
                                ? true
                                : Boolean(
                                  isUserOnline
                                    ? isUserOnline(memberId)
                                    : onlineUsers instanceof Map
                                      ? onlineUsers.get(memberId)?.isOnline
                                      : Array.isArray(onlineUsers)
                                        ? onlineUsers.includes(memberId)
                                        : member?.isOnline
                                );
                              const displayName = isMe ? "You" : (member?.username || member?.name || "Participant");
                              const memberAbout = isMe
                                ? (user?.about || member?.about || "MY PRONOUN IS\"he\"NOT \"him\" ✌️🤞👊;")
                                : (member?.about || "Hey there! I am using WhatsApp.");
                              const isMenuOpen = openMemberMenuId === memberId;
                              const isNearBottom = index >= displayedParticipants.length - 2 && displayedParticipants.length > 3;

                              return (
                                <div
                                  key={memberId}
                                  onClick={() => {
                                    if (!isMe) {
                                      setViewingMember(member);
                                    }
                                  }}
                                  className={`group relative flex items-center gap-3.5 p-2.5 rounded-lg transition-colors ${!isMe ? "cursor-pointer" : ""
                                    } ${isMenuOpen
                                      ? theme === "dark" ? "bg-white/10" : "bg-gray-100"
                                      : theme === "dark"
                                        ? "hover:bg-white/[0.05]"
                                        : "hover:bg-gray-50"
                                    }`}
                                >
                                  <div
                                    className={`relative shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${theme === "dark" ? "bg-[#2a3942]" : "bg-gray-100"
                                      } border ${theme === "dark" ? "border-transparent" : "border-gray-200"}`}
                                  >
                                    <div>
                                      {member?.profilePicture && !member.profilePicture.includes("default-avatar") ? (
                                        <img
                                          src={member.profilePicture}
                                          alt={displayName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : isMe ? (
                                        <div className="w-full h-full bg-[#9a3412] flex items-center justify-center text-white">
                                          <FaUser size={16} className="text-white/80" />
                                        </div>
                                      ) : (
                                        <div
                                          className="w-full h-full flex items-center justify-center text-white font-semibold text-[15px]"
                                          style={{ backgroundColor: getAvatarColor(displayName) }}
                                        >
                                          {(displayName[0] || "U").toUpperCase()}
                                        </div>
                                      )}
                                    </div>

                                    {isMemberOnline && (
                                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00a884] rounded-full border-2 border-[#111b21]" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className={`text-[14.5px] font-normal truncate ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                                        }`}>
                                        {displayName}
                                      </span>
                                      <div className="flex items-center justify-center gap-1.5 shrink-0 ml-2">
                                        {memberTag && (
                                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${theme === "dark"
                                            ? "bg-[#16312e] text-[#00a884] border-[#00a884]/30"
                                            : "bg-[#e0f0e9] text-[#00897b] border-[#00897b]/30"
                                            } shrink-0 flex items-center gap-1`}>
                                            <FiTag className="w-2.5 h-2.5" />
                                            {memberTag}
                                          </span>
                                        )}
                                        {isAdmin && (
                                          <span className={`text-[11px] font-normal px-2 py-0.5 rounded ${theme === "dark"
                                            ? "bg-[#16312e] text-[#00a884]"
                                            : "bg-[#e0f0e9] text-[#00897b]"
                                            } shrink-0`}>
                                            Group admin
                                          </span>
                                        )}
                                        {!isMe && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenMemberMenuId((prev) => (prev === memberId ? null : memberId));
                                            }}
                                            className={`p-1 rounded-full text-[#8696a0] hover:text-[#e9edef] transition cursor-pointer ${isMenuOpen
                                              ? "opacity-100 text-[#e9edef]"
                                              : "opacity-0 group-hover:opacity-100"
                                              }`}
                                            title="Member options"
                                          >
                                            <MdKeyboardArrowDown size={20} />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {isMe ? (
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingMemberForTag(null);
                                          setUserMemberTag(myMemberTag || "");
                                          setMemberTagPromptOpen(true);
                                        }}
                                        className="text-[12.5px] text-[#00a884] hover:underline cursor-pointer font-normal mt-0.5 inline-flex items-center gap-1"
                                      >
                                        {myMemberTag ? (
                                          <>
                                            <FiTag className="w-3 h-3 text-[#00a884]" />
                                            <span>{myMemberTag}</span>
                                            <span className="text-[11px] text-[#8696a0] ml-0.5">(edit)</span>
                                          </>
                                        ) : (
                                          <>
                                            <FiTag className="w-3 h-3 text-[#00a884]" />
                                            <span>Add member tag</span>
                                          </>
                                        )}
                                      </div>
                                    ) : (
                                      <p className={`text-[12.5px] truncate font-normal leading-tight mt-0.5 ${theme === "dark" ? "text-[#8696a0]" : "text-gray-500"
                                        }`}>
                                        {memberAbout}
                                      </p>
                                    )}
                                  </div>

                                  {isMenuOpen && (
                                    <div
                                      ref={memberMenuRef}
                                      onClick={(e) => e.stopPropagation()}
                                      className={`absolute right-3 ${isNearBottom ? "bottom-full mb-1" : "top-full mt-1"
                                        } w-56 bg-[#233138] border border-[#2e3b43] rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.6)] py-1.5 z-50`}
                                    >
                                      {!isMe && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenMemberMenuId(null);
                                              handleAudioCallMember(member);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#e9edef] hover:bg-[#182229] transition-colors cursor-pointer text-left"
                                          >
                                            <FaPhone size={14} className="text-[#8696a0] shrink-0 ml-0.5" />
                                            <span>Voice call</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenMemberMenuId(null);
                                              handleVideoCallMember(member);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#e9edef] hover:bg-[#182229] transition-colors cursor-pointer text-left"
                                          >
                                            <FaVideo size={15} className="text-[#8696a0] shrink-0" />
                                            <span>Video call</span>
                                          </button>
                                        </>
                                      )}

                                      {isCurrentUserAdmin && !isMe && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenMemberMenuId(null);
                                            handleRemoveMember(memberId, displayName);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#e9edef] hover:bg-[#182229] transition-colors cursor-pointer text-left"
                                        >
                                          <IoRemoveCircleOutline size={19} className="text-[#8696a0] shrink-0" />
                                          <span>Remove</span>
                                        </button>
                                      )}

                                      {isCurrentUserAdmin && !isMe && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenMemberMenuId(null);
                                            handleToggleMemberAdmin(memberId, isAdmin, displayName);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#e9edef] hover:bg-[#182229] transition-colors cursor-pointer text-left"
                                        >
                                          <FaUserShield size={18} className="text-[#8696a0] shrink-0" />
                                          <span>{isAdmin ? "Dismiss as admin" : "Make group admin"}</span>
                                        </button>
                                      )}

                                      {isCurrentUserAdmin && !isMe && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenMemberMenuId(null);
                                            setEditingMemberForTag({
                                              id: memberId,
                                              name: displayName,
                                              currentTag: memberTag,
                                            });
                                            setUserMemberTag(memberTag || "");
                                            setMemberTagPromptOpen(true);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#e9edef] hover:bg-[#182229] transition-colors cursor-pointer text-left"
                                        >
                                          <FiTag size={17} className="text-[#8696a0] shrink-0" />
                                          <span>{memberTag ? "Edit member tag" : "Add member tag"}</span>
                                        </button>
                                      )}

                                      {!isMe && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenMemberMenuId(null);
                                            setContactInfoTab("security");
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#e9edef] hover:bg-[#182229] transition-colors cursor-pointer text-left"
                                        >
                                          <span className="font-mono font-bold text-[13px] text-[#8696a0] w-[19px] text-center shrink-0">
                                            123
                                          </span>
                                          <span>Verify security code</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {groupParticipants.length > 10 && (
                              <button
                                type="button"
                                onClick={() => setShowAllMembers((prev) => !prev)}
                                className={`w-full flex items-center justify-between p-2.5 mt-1 rounded-lg cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05] text-[#00a884]" : "hover:bg-gray-50 text-[#00a884]"
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#00a884]/10 text-[#00a884] flex items-center justify-center shrink-0">
                                    <MdKeyboardArrowDown
                                      size={20}
                                      className={`transition-transform duration-200 ${showAllMembers ? "rotate-180" : ""
                                        }`}
                                    />
                                  </div>
                                  <span className="text-[14px] font-medium">
                                    {showAllMembers
                                      ? "View less"
                                      : `View all (${groupParticipants.length - 10} more)`}
                                  </span>
                                </div>
                              </button>
                            )}
                          </div>

                          <div className={`border-t ${theme === "dark" ? "border-transparent" : "border-gray-100"}`} />

                          <div
                            onClick={() => setContactInfoTab("memberChanges")}
                            className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"
                              }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${theme === "dark" ? "bg-[#16312e] text-[#00a884]" : "bg-[#e0f0e9] text-[#00897b]"
                                } shrink-0`}>
                                <MdHistory size={20} />
                              </div>
                              <div className="min-w-0">
                                <h5 className={`text-[14.5px] font-medium leading-snug ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                                  }`}>
                                  See member changes
                                </h5>
                                <p className="text-[12px] text-[#8696a0] truncate mt-0.5">
                                  View member changes from the last 60 days
                                </p>
                              </div>
                            </div>
                            <MdChevronRight size={19} className="text-[#8696a0]" />
                          </div>
                        </div>
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
                                Report {isGroup ? "group" : (selectedContact?.username || "contact")}
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
            )}

            {contactInfoTab === "groupPermissions" && (
              <motion.div
                key="tab-group-permissions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin space-y-6"
              >
                <div>
                  <h4 className={`text-xs font-medium mb-3 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    Members can:
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <FiEdit2 size={18} className="text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <h5 className={`text-[14px] font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                            Edit group settings
                          </h5>
                          <p className="text-[12px] opacity-60 leading-relaxed mt-0.5">
                            This includes the name, icon, description, disappearing message timer, and the ability to pin, keep or unkeep messages.
                          </p>
                        </div>
                      </div>
                      <WhatsAppSwitch
                        checked={groupPermissions.editGroupSettings}
                        disabled={!isCurrentUserAdmin}
                        onChange={() => handleTogglePermission("editGroupSettings")}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <MdOutlineChat size={18} className="text-gray-400 shrink-0" />
                        <h5 className={`text-[14px] font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                          Send new messages
                        </h5>
                      </div>
                      <WhatsAppSwitch
                        checked={groupPermissions.sendMessages}
                        disabled={!isCurrentUserAdmin}
                        onChange={() => handleTogglePermission("sendMessages")}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <FiUserPlus size={18} className="text-gray-400 shrink-0" />
                        <h5 className={`text-[14px] font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                          Add other members
                        </h5>
                      </div>
                      <WhatsAppSwitch
                        checked={groupPermissions.addMembers}
                        disabled={!isCurrentUserAdmin}
                        onChange={() => handleTogglePermission("addMembers")}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <FiLink size={18} className="text-gray-400 shrink-0" />
                        <h5 className={`text-[14px] font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                          Invite via link
                        </h5>
                      </div>
                      <WhatsAppSwitch
                        checked={groupPermissions.inviteViaLink}
                        disabled={!isCurrentUserAdmin}
                        onChange={() => handleTogglePermission("inviteViaLink")}
                      />
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <MdHistory size={18} className="text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <h5 className={`text-[14px] font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                            Send message history
                          </h5>
                          <p className="text-[12px] opacity-60 leading-relaxed mt-0.5">
                            Past messages can be sent to new members.
                          </p>
                        </div>
                      </div>
                      <WhatsAppSwitch
                        checked={groupPermissions.sendMessageHistory}
                        disabled={!isCurrentUserAdmin}
                        onChange={() => handleTogglePermission("sendMessageHistory")}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <h4 className={`text-xs font-medium mb-3 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    Admins can:
                  </h4>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="relative shrink-0 text-gray-400 mt-1">
                        <FaUserCheck size={16} />
                      </div>
                      <div>
                        <h5 className={`text-[14px] font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                          Approve new members
                        </h5>
                        <p className="text-[12px] opacity-60 leading-relaxed mt-0.5">
                          When turned on, admins must approve anyone who wants to join this group.{" "}
                          <span className="text-[#00a884] font-medium hover:underline cursor-pointer">
                            Learn more
                          </span>
                        </p>
                      </div>
                    </div>
                    <WhatsAppSwitch
                      checked={groupPermissions.approveNewMembers}
                      disabled={!isCurrentUserAdmin}
                      onChange={() => handleTogglePermission("approveNewMembers")}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <h4 className={`text-xs font-medium mb-3 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    Group admins
                  </h4>
                  <div
                    onClick={() => {
                      if (isCurrentUserAdmin) {
                        setShowEditAdminsModal(true);
                      } else {
                        toast.info("Only group admins can edit admins");
                      }
                    }}
                    className={`flex items-start justify-between p-2.5 -mx-2 rounded-xl transition-colors cursor-pointer ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                      }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <FaUserCog size={18} className="text-gray-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <h5 className={`text-[14px] font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                          Edit group admins
                        </h5>
                        <p className="text-[12px] opacity-60 leading-relaxed mt-0.5 truncate">
                          {adminDisplayNames || "No admins"}
                        </p>
                      </div>
                    </div>
                    <MdChevronRight size={18} className="text-gray-400 shrink-0 mt-1" />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <div
                    onClick={() => setContactInfoTab("memberChanges")}
                    className={`flex items-center justify-between p-2.5 -mx-2 rounded-xl transition-colors cursor-pointer ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                      }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <MdHistory size={18} className="text-gray-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h5 className={`text-[14px] font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                          Member changes
                        </h5>
                        <p className="text-[12px] opacity-60 leading-relaxed mt-0.5 truncate">
                          See who has left or been removed
                        </p>
                      </div>
                    </div>
                    <MdChevronRight size={18} className="text-gray-400 shrink-0" />
                  </div>
                </div>
              </motion.div>
            )}

            {contactInfoTab === "memberChanges" && (
              <motion.div
                key="tab-member-changes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-y-auto scrollbar-thin"
              >
                <div className="px-6 py-5 text-center">
                  <p className="text-[13px] text-[#8696a0] leading-relaxed max-w-sm mx-auto">
                    See updates from the last 60 days like username changes or who has left or been removed.{" "}
                    <span
                      onClick={() =>
                        toast.info(
                          "Only member changes from the last 60 days are shown in this list."
                        )
                      }
                      className="text-[#00a884] font-medium hover:underline cursor-pointer"
                    >
                      Learn more
                    </span>
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto px-2">
                  {isLoadingMemberChanges ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-7 h-7 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-[#8696a0]">Loading updates...</span>
                    </div>
                  ) : memberChanges.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#1b3445]/40 text-[#53bdeb] flex items-center justify-center mb-3">
                        <MdHistory size={24} />
                      </div>
                      <h4 className={`text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                        No member changes
                      </h4>
                      <p className="text-xs text-[#8696a0] max-w-xs leading-relaxed">
                        No one has left or been removed from this group in the last 60 days.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {memberChanges.map((change, idx) => {
                        const changeUser = change.user || {};
                        const avatar = changeUser.profilePicture;
                        return (
                          <div
                            key={change._id || idx}
                            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-colors ${theme === "dark" ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]"
                              }`}
                          >
                            <div className="w-11 h-11 rounded-full bg-[#1a3848] text-[#53bdeb] flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                              {avatar ? (
                                <img
                                  src={avatar}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FaUser size={18} />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4
                                className={`text-[15px] font-semibold leading-snug truncate ${theme === "dark" ? "text-white" : "text-gray-900"
                                  }`}
                              >
                                {change.text}
                              </h4>
                              <p className="text-[12px] text-[#8696a0] mt-0.5 font-normal">
                                {formatMemberChangeDate(change.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {contactInfoTab === "security" && isMetaAi ? (
              <motion.div
                key="tab-security-ai"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center py-6 px-6 overflow-y-auto flex-1 scrollbar-hide text-center"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl" />
                  <MetaAiRing size={110} animate className="relative z-10 drop-shadow-[0_10px_25px_rgba(59,130,246,0.35)]" />
                </div>

                <h3 className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  Meta AI & Your Privacy
                </h3>

                <p className={`text-sm leading-relaxed max-w-sm mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Your personal messages and calls with friends and family remain <span className="text-emerald-500 font-semibold">end-to-end encrypted</span>. No one else, not even WhatsApp or Meta, can read or listen to them.
                </p>

                <div className={`w-full p-4 rounded-2xl border text-left mb-4 ${theme === "dark" ? "bg-white/[0.03] border-white/10" : "bg-black/[0.02] border-black/5"
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <MdShield size={18} />
                    </div>
                    <div>
                      <h4 className={`text-sm font-semibold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        How Meta AI works
                      </h4>
                      <p className={`text-xs leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        When you chat with Meta AI, your prompts are processed securely using AI models to provide helpful answers and generate images.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`w-full p-4 rounded-2xl border text-left mb-6 ${theme === "dark" ? "bg-white/[0.03] border-white/10" : "bg-black/[0.02] border-black/5"
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                      <FaLock size={14} />
                    </div>
                    <div>
                      <h4 className={`text-sm font-semibold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        Personal chats stay private
                      </h4>
                      <p className={`text-xs leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        Meta AI cannot access messages in your other 1-on-1 or group chats unless you explicitly invoke @Meta AI in that chat.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setContactInfoTab("info")}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-medium text-sm shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                >
                  Done
                </button>
              </motion.div>
            ) : contactInfoTab === "security" && (
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
                    {viewingMember?.username || viewingMember?.name || selectedContact?.username || "this contact"}
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
                  <EndToEndEncryptionIllustration
                    isDark={isDark}
                    width={150}
                    height={115}
                  />
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
                  <DisappearingMessagesIllustration width={200} height={125} />
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

                  <div className="relative group">
                    {themePageIndex > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          hideCursorTooltip();
                          setThemePageIndex((prev) => Math.max(0, prev - 1));
                        }}
                        onMouseEnter={hideCursorTooltip}
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#182229]/90 hover:bg-[#202c33] active:bg-[#2a3942] text-white flex items-center justify-center shadow-xl border border-white/10 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto cursor-pointer hover:scale-105 active:scale-95"
                        title="Previous themes"
                        aria-label="Previous themes"
                      >
                        <MdChevronLeft size={20} />
                      </button>
                    )}
                    {themePageIndex < Math.ceil(CURATED_THEME_IDS.length / 6) - 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          hideCursorTooltip();
                          setThemePageIndex((prev) =>
                            Math.min(Math.ceil(CURATED_THEME_IDS.length / 6) - 1, prev + 1)
                          );
                        }}
                        onMouseEnter={hideCursorTooltip}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#182229]/90 hover:bg-[#202c33] active:bg-[#2a3942] text-white flex items-center justify-center shadow-xl border border-white/10 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto cursor-pointer hover:scale-105 active:scale-95"
                        title="Next themes"
                        aria-label="Next themes"
                      >
                        <MdChevronRight size={20} />
                      </button>
                    )}

                    <div className="grid grid-cols-3 gap-2.5">
                      {CURATED_THEME_IDS.slice(themePageIndex * 6, (themePageIndex + 1) * 6).map((id) => {
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
                              backgroundColor: themeItem.bgColor || "#0b141a",
                              backgroundImage: themeItem.imageUrl
                                ? `url('${themeItem.thumbnailUrl || themeItem.imageUrl}')`
                                : themeItem.gradient || undefined,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              backgroundRepeat: "no-repeat",
                            }}
                          >
                            {!themeItem.imageUrl && themeItem.hasDoodles && doodlesEnabled && (
                              <div
                                className="absolute inset-0 opacity-40 pointer-events-none"
                                style={{
                                  backgroundImage:
                                    "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                                  backgroundSize: "120px",
                                  backgroundBlendMode: "overlay",
                                }}
                              />
                            )}

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

          <AboutAiMessagesModal
            isOpen={showAboutAiModal}
            onClose={() => setShowAboutAiModal(false)}
            theme={theme}
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
              initialCallType={groupCallModalType}
              theme={theme}
            />
          )}

          {memberTagPromptOpen && (
            <div
              className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
              onClick={() => {
                if (!isSavingMemberTag) {
                  setMemberTagPromptOpen(false);
                  setEditingMemberForTag(null);
                }
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-[#222e35] rounded-2xl p-5 shadow-2xl border border-white/10 text-[#e9edef] animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#00a884]/15 text-[#00a884] flex items-center justify-center">
                    <FiTag size={16} />
                  </div>
                  <h3 className="text-[17px] font-semibold">
                    {editingMemberForTag
                      ? `Member Tag for ${editingMemberForTag.name}`
                      : "Your Member Tag"}
                  </h3>
                </div>
                <p className="text-[13px] text-[#8696a0] mb-4">
                  {editingMemberForTag
                    ? `Assign a role or alias for ${editingMemberForTag.name} in this group (e.g. Lead, Designer, Moderator).`
                    : "Add a tag to your profile in this group so other members know your role or alias (e.g. Lead, Developer)."}
                </p>
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={userMemberTag}
                    onChange={(e) => setUserMemberTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isSavingMemberTag) {
                        e.preventDefault();
                        handleSaveMemberTag();
                      }
                    }}
                    placeholder="e.g. Lead, Admin, Developer"
                    maxLength={30}
                    disabled={isSavingMemberTag}
                    className="w-full bg-[#111b21] border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] text-[#e9edef] placeholder-[#8696a0] outline-none focus:border-[#00a884] pr-14"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#8696a0] font-mono">
                    {userMemberTag.length}/30
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2.5">
                  {(editingMemberForTag
                    ? editingMemberForTag.currentTag
                    : myMemberTag) && (
                      <button
                        type="button"
                        disabled={isSavingMemberTag}
                        onClick={() => {
                          setUserMemberTag("");
                          handleSaveMemberTag("");
                        }}
                        className="px-3 py-2 rounded-xl text-[13px] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer mr-auto"
                      >
                        Clear tag
                      </button>
                    )}
                  <button
                    type="button"
                    disabled={isSavingMemberTag}
                    onClick={() => {
                      setMemberTagPromptOpen(false);
                      setEditingMemberForTag(null);
                    }}
                    className="px-4 py-2 rounded-xl text-[14px] text-[#8696a0] hover:text-[#e9edef] hover:bg-white/5 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingMemberTag}
                    onClick={() => handleSaveMemberTag()}
                    className="px-4 py-2 rounded-xl text-[14px] bg-[#00a884] text-[#111b21] font-semibold hover:bg-[#00a884]/90 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isSavingMemberTag ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}
          <input
            ref={groupImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGroupImageFileChange}
          />

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
