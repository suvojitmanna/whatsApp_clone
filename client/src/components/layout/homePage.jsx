import React, { useEffect, useState, useMemo } from "react";
import Layout from "./layout";
import { motion, AnimatePresence } from "framer-motion";
import ChatList from "../../pages/chatSection/ChatList";
import { getAllUsers } from "../../services/user.services";
import { FaUserFriends } from "react-icons/fa";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import StatusPreview from "../../pages/statusSection/statusPreview";
import useStatusStore from "../../store/statusStore";
import useThemeStore from "../../store/themeStore";

const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const HomePage = () => {
  const users = useChatStore((state) => state.users);
  const setUsers = useChatStore((state) => state.setUsers);
  const [allUser, setAllUser] = useState(users || []);
  const [loading, setLoading] = useState(!users || users.length === 0);
  const [previewContact, setPreviewContact] = useState(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);

  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const conversations = useChatStore((state) => state.conversations);
  const fetchConversations = useChatStore((state) => state.fetchConversations);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersResult] = await Promise.all([
          getAllUsers(),
          fetchConversations(),
        ]);

        const fetchedUsers = usersResult?.users || [];
        setAllUser(fetchedUsers);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("HomePage load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchConversations, setUsers]);

  const conversationList = Array.isArray(conversations?.data)
    ? conversations.data
    : [];

  const effectiveUsers = allUser.length > 0 ? allUser : (users || []);

  const contacts = useMemo(() => {
    const currentUserId = user?._id?.toString();
    const convMap = new Map();
    const groupItems = [];

    for (let i = 0; i < conversationList.length; i++) {
      const conv = conversationList[i];
      if (!conv) continue;

      if (conv.isGroup) {
        const isMember =
          !currentUserId ||
          conv.participants?.some((p) => {
            const pId = (p?._id || p)?.toString();
            return pId === currentUserId;
          });

        if (isMember) {
          const convId = conv._id?.toString() || conv._id;
          groupItems.push({
            _id: convId,
            id: convId,
            isGroup: true,
            isGroupChat: true,
            username: conv.groupName || "Group",
            name: conv.groupName || "Group",
            profilePicture: conv.groupProfileImage || "",
            groupName: conv.groupName || "Group",
            groupProfileImage: conv.groupProfileImage || "",
            groupAdmin: conv.groupAdmin,
            groupDescription: conv.groupDescription || "",
            about: conv.groupDescription || "",
            groupPermissions: conv.groupPermissions,
            participants: conv.participants || [],
            conversation: conv,
          });
        }
        continue;
      }

      if (!conv?.participants) continue;
      let otherUserId = null;
      let hasCurrent = false;

      for (let j = 0; j < conv.participants.length; j++) {
        const pId = (conv.participants[j]?._id || conv.participants[j])?.toString();
        if (pId === currentUserId) {
          hasCurrent = true;
        } else {
          otherUserId = pId;
        }
      }

      if (hasCurrent && otherUserId) {
        convMap.set(otherUserId, conv);
      }
    }

    const directContacts = effectiveUsers.map((contact) => {
      const contactId = contact?._id?.toString();
      const conversation = convMap.get(contactId) || contact?.conversation || null;
      return {
        ...contact,
        conversation,
      };
    });

    return [...groupItems, ...directContacts];
  }, [effectiveUsers, conversationList, user?._id]);

  const handleStatusPreview = (contact, index = 0) => {
    setPreviewContact(contact);
    setCurrentStatusIndex(index);
    const status = contact?.statuses?.[index];
    if (status) {
      useStatusStore.getState().viewStatus(status.id);
    }
  };

  const handleStatusClick = (statusData) => {
    if (!statusData) return;
    const statusId =
      typeof statusData === "object" ? statusData?._id : statusData;

    if (!statusId) return;

    const grouped = useStatusStore.getState().getGroupStatus();
    const clickedStatusId = String(statusId);

    for (const contact of Object.values(grouped || {})) {
      const index = contact?.statuses?.findIndex(
        (item) => String(item.id) === clickedStatusId,
      );

      if (index !== -1) {
        handleStatusPreview(contact, index);
        return;
      }
    }

    if (typeof statusData === "object") {
      const status = {
        id: statusData._id,
        content: statusData.content,
        media: statusData.mediaUrl,
        contentType: statusData.contentType,
        timeStamp: statusData.createdAt,
        viewers: statusData.viewers || [],
      };

      const contact = {
        id: statusData.user?._id,
        name: statusData.user?.username,
        avatar: statusData.user?.profilePicture,
        statuses: [status],
      };

      handleStatusPreview(contact, 0);
    }
  };

  const handlePreviewClose = () => {
    setPreviewContact(null);
    setCurrentStatusIndex(0);
  };

  const handlePreviewNext = () => {
    if (!previewContact) return;

    const nextIndex = currentStatusIndex + 1;

    if (nextIndex >= previewContact.statuses.length) {
      handlePreviewClose();
      return;
    }

    setCurrentStatusIndex(nextIndex);

    const nextStatus = previewContact.statuses[nextIndex];

    if (nextStatus) {
      useStatusStore.getState().viewStatus(nextStatus.id);
    }
  };

  const handlePreviewPrev = () => {
    setCurrentStatusIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <Layout
      handleStatusClick={handleStatusClick}
      isStatusPreviewOpen={!!previewContact}
      statusPreviewContent={
        previewContact && (
          <StatusPreview
            contact={previewContact}
            currentIndex={currentStatusIndex}
            onClose={handlePreviewClose}
            onNext={handlePreviewNext}
            onPrev={handlePreviewPrev}
            theme={theme}
            currentUser={user}
            loading={false}
          />
        )
      }
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="h-full w-full"
      >
        <AnimatePresence mode="wait">
          {loading && contacts.length === 0 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 p-2"
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-gray-700/20 dark:bg-gray-700/40 animate-pulse flex items-center px-3 gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-600/30 dark:bg-gray-600/40 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-24 bg-gray-600/30 dark:bg-gray-600/40 rounded" />
                    <div className="h-2.5 w-36 bg-gray-600/20 dark:bg-gray-600/30 rounded" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : contacts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{
                opacity: 0,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-gray-400"
            >
              <FaUserFriends size={45} className="mb-3 opacity-70" />
              <p className="text-sm">No chats found</p>
              <span className="text-xs opacity-60 mt-1">
                Try refreshing or starting a new chat or group
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <ChatList contacts={contacts} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
};

export default HomePage;
