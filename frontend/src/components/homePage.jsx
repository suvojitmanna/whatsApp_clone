import React, { useEffect, useState } from "react";
import Layout from "./layout";
import { motion, AnimatePresence } from "framer-motion";
import ChatList from "../pages/chatSection/chatList";
import { getAllUsers } from "../services/user.services";
import { FaUserFriends } from "react-icons/fa";
import useUserStore from "../store/useUserStore";
import { useChatStore } from "../store/chatStore";

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
  const { user } = useUserStore();
  const conversations = useChatStore((state) => state.conversations);
  const fetchConversations = useChatStore((state) => state.fetchConversations);

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

  return (
    <Layout>
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
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
