import React, { useEffect, useState } from "react";
import Layout from "./layout";
import { motion, AnimatePresence } from "framer-motion";
import ChatList from "../pages/chatSection/chatList";
import { getAllUsers } from "../services/user.services";
import { FaUserFriends } from "react-icons/fa";
import useUserStore from "../store/useUserStore";
import { useChatStore } from "../store/chatStore";
import StatusPreview from "../pages/statusSection/statusPreview";
import useStatusStore from "../store/statusStore";
import useThemeStore from "../store/themeStore";

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
  const [allUser, setAllUser] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewContact, setPreviewContact] = useState(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const conversations = useChatStore((state) => state.conversations);
  const fetchConversations = useChatStore((state) => state.fetchConversations);

  // Fetch users and conversations
  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersResult] = await Promise.all([
          getAllUsers(),
          fetchConversations(),
        ]);

        setAllUser(usersResult?.users || []);
      } catch (error) {
        console.error("HomePage load error:", error);
        setAllUser([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchConversations]);

  const conversationList = Array.isArray(conversations?.data)
    ? conversations.data
    : [];

  const contacts = allUser.map((contact) => {
    const conversation = conversationList.find((conv) => {
      const participantIds =
        conv?.participants?.map((participant) => String(participant?._id)) ||
        [];

      const hasContact = participantIds.includes(String(contact?._id));
      const hasCurrentUser = participantIds.includes(String(user?._id));
      return hasContact && hasCurrentUser;
    });

    return {
      ...contact,
      conversation: conversation || null,
    };
  });

  const handleStatusPreview = (contact, index = 0) => {
    setPreviewContact(contact);
    setCurrentStatusIndex(index);
    const status = contact?.statuses?.[index];
    if (status) {
      useStatusStore.getState().viewStatus(status.id);
    }
  };

  // Status card clicked from MessageBuble
  const handleStatusClick = (statusData) => {
    if (!statusData) return;
    const statusId =
      typeof statusData === "object" ? statusData?._id : statusData;

    if (!statusId) return;

    // If backend already populated the status
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
      return;
    }

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

  // Previous status
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
          {loading && (
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
                  className="h-12 rounded-lg bg-gray-700/40 animate-pulse"
                />
              ))}
            </motion.div>
          )}

          {!loading && allUser.length === 0 && (
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
              <p className="text-sm">No users found</p>
              <span className="text-xs opacity-60 mt-1">
                Try refreshing or adding contacts
              </span>
            </motion.div>
          )}

          {!loading && allUser.length > 0 && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto"
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
