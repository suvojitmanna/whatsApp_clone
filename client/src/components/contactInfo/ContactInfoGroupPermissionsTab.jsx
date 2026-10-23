import React from "react";
import { motion } from "framer-motion";
import { FiEdit2, FiUserPlus, FiLink } from "react-icons/fi";
import { MdOutlineChat, MdHistory, MdChevronRight } from "react-icons/md";
import { FaUserCheck, FaUserCog } from "react-icons/fa";
import { toast } from "react-toastify";
import { WhatsAppSwitch } from "./shared";

const ContactInfoGroupPermissionsTab = ({
  theme,
  isCurrentUserAdmin,
  groupPermissions,
  handleTogglePermission,
  setShowEditAdminsModal,
  setContactInfoTab,
  adminDisplayNames,
}) => {
  return (
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
  );
};

export default ContactInfoGroupPermissionsTab;
