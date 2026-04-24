import React, { useEffect, useState } from "react";
import Layout from "./layout";
import { motion, AnimatePresence } from "framer-motion";
import ChatList from "../pages/chatSection/chatList";
import { getAllUsers } from "../services/user.services";
import { FaUserFriends } from "react-icons/fa";

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

  const getUser = async () => {
    try {
      const result = await getAllUsers();

      setAllUser(result.users); // DIRECT FIX
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

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
              className="space-y-3"
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-gray-700/40 animate-pulse"
                />
              ))}
            </motion.div>
          )}

          {/* Empty state */}
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

          {/* List */}
          {!loading && allUser.length > 0 && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto"
            >
              <ChatList contacts={allUser} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
};

export default HomePage;
