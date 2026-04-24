import React, { useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import useLayoutStore from "../../store/layoutStore";
import { FaPlus, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";

const ChatList = ({ contacts }) => {
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact,
  );

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  const [searchTerms, setSearchTerms] = useState("");

  const filteredContact =
    contacts
      ?.filter((contact) =>
        contact?.username?.toLowerCase().includes(searchTerms.toLowerCase()),
      )
      ?.sort((a, b) => {
        const timeA = a?.conversation?.lastMessage?.createdAt
          ? new Date(a.conversation.lastMessage.createdAt)
          : 0;

        const timeB = b?.conversation?.lastMessage?.createdAt
          ? new Date(b.conversation.lastMessage.createdAt)
          : 0;

        return timeB - timeA;
      }) || [];

  return (
    <div
      className={`h-full border-r relative z-10 transition-all duration-300 
    /* Mobile: full width | Large screen: fixed width */
    w-full lg:w-[350px] lg:min-w-[350px] 
    ${
      theme === "dark"
        ? "bg-[#111b21] border-gray-700 shadow-[4px_0_15px_rgba(0,0,0,0.5)] text-white"
        : "bg-white border-gray-200 shadow-[4px_0_10px_rgba(0,0,0,0.1)] text-gray-900"
    }`}
    >
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Chats</h2>
        <button className="p-2 bg-green-500 text-white rounded-full shadow-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-green-600 hover:scale-110 hover:rotate-90 active:scale-90 animate-bounce-slow">
          <FaPlus />
        </button>
      </div>
      <div className="p-2">
        <div className="relative">
          {" "}
          <FaSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 z-10 ${
              theme === "dark" ? "text-gray-400" : "text-gray-800"
            }`}
          />
          <input
            type="text"
            placeholder="search or start new chat"
            className={`w-full pl-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              theme === "dark"
                ? "bg-gray-800 text-white border-gray-700 placeholder-gray-500"
                : "bg-gray-100 text-black border-gray-200 placeholder-gray-400"
            }`}
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-120px)]">

        {filteredContact.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center h-full text-center px-6"
          >
            {/* Glow Circle */}
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-full blur-xl bg-green-500/20"></div>

              <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-500 shadow-lg animate-pulse">
                <FaSearch className="text-white text-xl" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
              No chats found
            </h2>

            {/* Subtitle */}
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[220px] leading-relaxed">
              Try searching with a different name or start a new conversation.
            </p>
          </motion.div>
        ) : (
          filteredContact.map((contact) => (
            <motion.div
              key={contact._id}
              onClick={() => setSelectedContact(contact)}
              className={`p-3 flex items-center cursor-pointer transition-colors ${
                theme === "dark"
                  ? selectedContact?._id === contact._id
                    ? "bg-gray-700"
                    : "hover:bg-gray-800"
                  : selectedContact?._id === contact._id
                    ? "bg-gray-200"
                    : "hover:bg-gray-100"
              }`}
            >
              <img
                src={contact?.profilePicture}
                alt={contact?.username}
                className="w-12 h-12 rounded-full"
              />

              <div className="ml-3 flex-1">
                <div className="flex justify-between items-baseline">
                  <h2 className="font-semibold">{contact?.username}</h2>
                  {contact?.conversation && (
                    <span
                      className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                    >
                      {formatTimestamp(
                        contact?.conversation?.lastMessage?.createdAt,
                      )}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-baseline">
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    } max-w-[220px] break-all`}
                  >
                    {contact?.conversation?.lastMessage?.content
                      ? contact.conversation.lastMessage.content.length > 30
                        ? contact.conversation.lastMessage.content.slice(
                            0,
                            30,
                          ) + "..."
                        : contact.conversation.lastMessage.content
                      : "No messages yet"}
                  </p>
                  {contact?.conversation &&
                    contact?.conversation?.unreadCount > 0 &&
                    contact?.conversation?.lastMessage?.receiver ===
                      user?._id && (
                      <p
                        className={`text-sm font-semibold w-6 h-6 flex items-center justify-center bg-yellow-500 ${theme === "dark" ? "text-gray-800" : "text-gray-500"} truncate rounded-full`}
                      >
                        {contact?.conversation?.unreadCount}
                      </p>
                    )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
