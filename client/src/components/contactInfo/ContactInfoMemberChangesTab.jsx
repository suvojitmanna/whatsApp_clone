import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MdHistory } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { toast } from "react-toastify";
import axiosInstance from "../../services/url.services";
import { useChatStore } from "../../store/chatStore";
import { formatMemberChangeDate } from "./shared";

const ContactInfoMemberChangesTab = ({
  selectedContact,
  isGroup,
  theme,
}) => {
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
    fetchMemberChanges();
  }, [fetchMemberChanges]);

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

  return (
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
  );
};

export default ContactInfoMemberChangesTab;
