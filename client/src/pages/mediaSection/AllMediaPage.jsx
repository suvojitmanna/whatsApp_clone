import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FaSearch,
  FaArrowLeft,
  FaPhotoVideo,
  FaFileAlt,
  FaLink,
  FaComments,
} from "react-icons/fa";
import { HiOutlinePhotograph } from "react-icons/hi";
import { MdOutlinePermMedia, MdChevronRight, MdCheck } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";

import Layout from "../../components/layout";
import Media, { WhatsAppMediaFolderIcon } from "../../components/Media";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import axiosInstance from "../../services/url.services";

const AllMediaPage = () => {
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isDark = theme === "dark";
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const initialChatParam = searchParams.get("chat") || "all";
  const [selectedChat, setSelectedChat] = useState(initialChatParam);
  const [chatSearch, setChatSearch] = useState("");
  const [isViewingMediaOnMobile, setIsViewingMediaOnMobile] = useState(
    initialChatParam !== "all"
  );
  const [allCounts, setAllCounts] = useState({
    media: 0,
    docs: 0,
    links: 0,
    total: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const conversations = useChatStore((state) => state.conversations?.data || []);
  const getConversations = useChatStore((state) => state.getConversations);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (getConversations) {
      getConversations();
    }
  }, [getConversations]);
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const { data } = await axiosInstance.get("/chat/media", {
          params: { conversationId: "all" },
        });
        const counts = data?.data?.counts || data?.counts || {
          media: 0,
          docs: 0,
          links: 0,
          total: 0,
        };
        if (isMounted) setAllCounts(counts);
      } catch (err) {
        console.error("Failed to load all media stats:", err);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    };
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectChat = (chatId) => {
    setSelectedChat(chatId);
    if (chatId === "all") {
      searchParams.delete("chat");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ chat: chatId });
    }
    if (isMobile) {
      setIsViewingMediaOnMobile(true);
    }
  };
  const filteredConversations = useMemo(() => {
    if (!chatSearch.trim()) return conversations;
    const q = chatSearch.toLowerCase();
    return conversations.filter((conv) => {
      const peer = conv.participants?.find(
        (p) => String(p._id || p) !== String(user?._id)
      );
      const name = peer?.username || conv.name || "";
      return name.toLowerCase().includes(q);
    });
  }, [conversations, chatSearch, user?._id])
  const activePeer = useMemo(() => {
    if (!selectedChat || selectedChat === "all") return null;
    const foundConv = conversations.find(
      (c) =>
        String(c._id) === String(selectedChat) ||
        c.participants?.some((p) => String(p._id || p) === String(selectedChat))
    );
    if (!foundConv) return null;
    return foundConv.participants?.find(
      (p) => String(p._id || p) !== String(user?._id)
    );
  }, [conversations, selectedChat, user?._id]);
  const leftPanel = (
    <div
      className={`h-full w-full flex flex-col border-r select-none ${isDark ? "bg-[#111b21] border-[#222d34] text-white" : "bg-white border-gray-200 text-gray-900"
        }`}
    >
      <div
        className={`px-4 py-3.5 flex items-center justify-between border-b shrink-0 ${isDark ? "bg-[#202c33] border-[#222d34]" : "bg-gray-100 border-gray-200"
          }`}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className={`p-2 rounded-full transition-colors cursor-pointer ${isDark ? "hover:bg-white/10 text-[#aebac1] hover:text-white" : "hover:bg-gray-200 text-gray-600"
              }`}
            title="Back to chats"
          >
            <FaArrowLeft size={16} />
          </Link>
          <h2 className="text-[18px] font-bold tracking-tight">Media, links & docs</h2>
        </div>
      </div>
      <div className="p-3 border-b border-white/5 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div
            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${isDark ? "bg-[#202c33]/70 border-white/5" : "bg-gray-50 border-gray-200"
              }`}
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1">
              <HiOutlinePhotograph size={16} />
            </div>
            <span className="text-[11px] text-[#8696a0] font-medium">Media</span>
            <span className="text-[15px] font-bold text-white">
              {loadingStats ? "..." : allCounts.media}
            </span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${isDark ? "bg-[#202c33]/70 border-white/5" : "bg-gray-50 border-gray-200"
              }`}
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-1">
              <FaFileAlt size={13} />
            </div>
            <span className="text-[11px] text-[#8696a0] font-medium">Docs</span>
            <span className="text-[15px] font-bold text-white">
              {loadingStats ? "..." : allCounts.docs}
            </span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${isDark ? "bg-[#202c33]/70 border-white/5" : "bg-gray-50 border-gray-200"
              }`}
          >
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-1">
              <FaLink size={13} />
            </div>
            <span className="text-[11px] text-[#8696a0] font-medium">Links</span>
            <span className="text-[15px] font-bold text-white">
              {loadingStats ? "..." : allCounts.links}
            </span>
          </div>
        </div>
      </div>
      <div className="p-3 pb-2">
        <div className="relative">
          <FaSearch
            size={13}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-[#8696a0]" : "text-gray-400"
              }`}
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={chatSearch}
            onChange={(e) => setChatSearch(e.target.value)}
            className={`w-full pl-9 pr-8 py-2 text-[13.5px] rounded-xl outline-none transition-all border ${isDark
                ? "bg-[#202c33] text-white border-transparent focus:border-emerald-500/60 placeholder-[#8696a0]"
                : "bg-gray-100 text-gray-900 border-gray-200 focus:border-emerald-500 placeholder-gray-400"
              }`}
          />
          {chatSearch && (
            <button
              type="button"
              onClick={() => setChatSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#8696a0] hover:text-white"
            >
              <RxCross2 size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4 space-y-1">
        <div
          onClick={() => handleSelectChat("all")}
          className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${selectedChat === "all"
              ? isDark
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm"
                : "bg-emerald-50 border border-emerald-500/20 text-emerald-700"
              : isDark
                ? "hover:bg-white/5 border border-transparent text-white"
                : "hover:bg-gray-100 border border-transparent text-gray-800"
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <WhatsAppMediaFolderIcon size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[14.5px] font-semibold truncate leading-tight">
                All chats
              </span>
              <span className="text-[12px] text-[#8696a0] truncate">
                Everything shared across all conversations
              </span>
            </div>
          </div>
          {selectedChat === "all" && (
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-[#111b21] flex items-center justify-center shrink-0 shadow">
              <MdCheck size={13} className="stroke-[1.5]" />
            </div>
          )}
        </div>

        <div className="px-2 pt-3 pb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#8696a0]">
            Chats ({filteredConversations.length})
          </span>
        </div>

        {filteredConversations.map((conv) => {
          const peer = conv.participants?.find(
            (p) => String(p._id || p) !== String(user?._id)
          );
          if (!peer) return null;
          const peerId = peer._id || peer;
          const convId = conv._id || peerId;
          const isSelected = selectedChat === String(convId) || selectedChat === String(peerId);

          return (
            <div
              key={conv._id}
              onClick={() => handleSelectChat(convId)}
              className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${isSelected
                  ? isDark
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-white shadow-sm"
                    : "bg-emerald-50 border border-emerald-500/20 text-emerald-800"
                  : isDark
                    ? "hover:bg-white/5 border border-transparent text-white"
                    : "hover:bg-gray-100 border border-transparent text-gray-800"
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={peer.profilePicture || "/default-avatar.png"}
                  alt={peer.username}
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-medium truncate leading-tight">
                    {peer.username || "Contact"}
                  </span>
                  <span className="text-[12px] text-[#8696a0] truncate">
                    Tap to view media
                  </span>
                </div>
              </div>
              <MdChevronRight size={18} className="text-[#8696a0] shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
  const mainMediaContent = (
    <div className="h-full w-full flex flex-col relative overflow-hidden">
      <Media
        mode="page"
        chatId={selectedChat === "all" ? null : selectedChat}
        contact={activePeer}
        initialTab="media"
        onClose={() => {
          if (isMobile) {
            setIsViewingMediaOnMobile(false);
          } else {
            navigate("/");
          }
        }}
      />
    </div>
  );

  return (
    <Layout rightContent={mainMediaContent}>
      {isMobile ? (
        isViewingMediaOnMobile ? null : leftPanel
      ) : (
        leftPanel
      )}
    </Layout>
  );
};

export default AllMediaPage;
