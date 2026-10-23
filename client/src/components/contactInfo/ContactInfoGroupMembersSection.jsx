import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { FaUser } from "react-icons/fa";
import { FaUserShield } from "react-icons/fa6";
import { FiUserPlus, FiTag, FiSearch } from "react-icons/fi";
import { IoRemoveCircleOutline } from "react-icons/io5";
import { MdChevronRight, MdKeyboardArrowDown, MdHistory } from "react-icons/md";
import useOutsideClick from "../../hook/useOutsideClick";
import { useChatStore } from "../../store/chatStore";

const ContactInfoGroupMembersSection = ({
  theme,
  user,
  groupParticipants = [],
  groupOnlineCount = 0,
  groupAdmins = [],
  canAddMembers,
  isCurrentUserAdmin,
  setShowAddMemberModal,
  setContactInfoTab,
  setViewingMember,
  getAvatarColor,
  memberTags = [],
  myMemberTag,
  onlineUsers,
  isUserOnline,
  handleToggleMemberAdmin,
  handleRemoveMember,
  handleSaveMemberTag,
  memberTagPromptOpen,
  setMemberTagPromptOpen,
  editingMemberForTag,
  setEditingMemberForTag,
  userMemberTag,
  setUserMemberTag,
  isSavingMemberTag,
}) => {
  const [participantSearchTerm, setParticipantSearchTerm] = useState("");
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [openMemberMenuId, setOpenMemberMenuId] = useState(null);
  const memberMenuRef = useRef(null);
  const storeOnlineUsers = useChatStore((state) => state.onlineUsers);
  const storeIsUserOnline = useChatStore((state) => state.isUserOnline);
  const checkUserStatus = useChatStore((state) => state.checkUserStatus);

  useEffect(() => {
    if (groupParticipants && groupParticipants.length > 0 && typeof checkUserStatus === "function") {
      const myIdStr = user?._id?.toString();
      groupParticipants.forEach((p) => {
        const pId = (p?._id || p?.id || p)?.toString();
        if (pId && pId !== myIdStr) {
          checkUserStatus(pId);
        }
      });
    }
  }, [groupParticipants, checkUserStatus, user?._id]);

  const checkMemberOnline = useCallback(
    (member) => {
      const memberId = (member?._id || member?.id || member)?.toString();
      if (!memberId || memberId === user?._id?.toString()) return false;

      if (typeof storeIsUserOnline === "function" && storeIsUserOnline(memberId)) {
        return true;
      }

      if (typeof isUserOnline === "function" && isUserOnline(memberId)) {
        return true;
      }

      const effectiveOnlineUsers = storeOnlineUsers || onlineUsers;
      if (effectiveOnlineUsers instanceof Map && effectiveOnlineUsers.has(memberId)) {
        return Boolean(effectiveOnlineUsers.get(memberId)?.isOnline);
      }

      if (
        effectiveOnlineUsers &&
        typeof effectiveOnlineUsers === "object" &&
        !Array.isArray(effectiveOnlineUsers)
      ) {
        const entry = effectiveOnlineUsers[memberId];
        if (typeof entry === "boolean") return entry;
        if (entry && typeof entry === "object") return Boolean(entry.isOnline);
      }

      if (Array.isArray(effectiveOnlineUsers)) {
        return effectiveOnlineUsers.some(
          (u) => (u?._id || u?.id || u)?.toString() === memberId
        );
      }

      return Boolean(member?.isOnline);
    },
    [storeIsUserOnline, isUserOnline, storeOnlineUsers, onlineUsers, user?._id]
  );

  const activeOnlineCount = useMemo(() => {
    if (groupOnlineCount > 0) return groupOnlineCount;
    if (!groupParticipants || !Array.isArray(groupParticipants)) return 0;
    return groupParticipants.filter((m) => checkMemberOnline(m)).length;
  }, [groupOnlineCount, groupParticipants, checkMemberOnline]);

  useOutsideClick(memberMenuRef, () => {
    if (openMemberMenuId) setOpenMemberMenuId(null);
  });

  const getMemberTag = (memberId) => {
    if (!memberId || !memberTags || memberTags.length === 0) return "";
    const mId = memberId.toString();
    const found = memberTags.find(
      (mt) => (mt.user?._id || mt.user)?.toString() === mId
    );
    return found?.tag || "";
  };

  const displayedParticipants = useMemo(() => {
    let list = groupParticipants || [];
    if (participantSearchTerm.trim()) {
      const q = participantSearchTerm.toLowerCase();
      list = list.filter((p) => {
        const name = (p.username || p.name || "").toLowerCase();
        const tag = getMemberTag(p._id || p.id || p).toLowerCase();
        const about = (p.about || "").toLowerCase();
        return name.includes(q) || tag.includes(q) || about.includes(q);
      });
    }
    if (!showAllMembers && !participantSearchTerm.trim()) {
      return list.slice(0, 10);
    }
    return list;
  }, [groupParticipants, participantSearchTerm, showAllMembers, memberTags]);

  const itemClass = `mx-1.5 my-0.5 flex w-[calc(100%-12px)] items-center px-3.5 py-[7.5px] gap-3 cursor-pointer rounded-2xl border border-transparent transition-all duration-150 text-left font-normal text-[14px] group select-none ${theme === "dark"
      ? "text-[#d1d7db] hover:text-white hover:bg-white/10 hover:border-white/15"
      : "text-[#111b21] hover:text-black hover:bg-black/5 hover:border-black/10"
    }`;

  const dangerItemClass = `mx-1.5 my-0.5 flex w-[calc(100%-12px)] items-center px-3.5 py-[7.5px] gap-3 cursor-pointer rounded-2xl border border-transparent transition-all duration-150 text-left font-normal text-[14px] group select-none ${theme === "dark"
      ? "hover:bg-red-500/15 hover:border-red-400/25 text-red-400"
      : "hover:bg-red-50 hover:border-red-300 text-red-600"
    }`;

  const menuDividerClass = `my-1 border-t ${theme === "dark" ? "border-white/10" : "border-black/10"
    }`;

  return (
    <>
      <div
        id="group-members-section"
        className={`rounded-xl border ${theme === "dark"
          ? "bg-white/[0.03] border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md"
          : "bg-white border-gray-200 shadow-sm"
          }`}
      >
        <div className="flex items-center justify-between p-3.5 pb-2">
          <span className="text-[13.5px] font-medium text-[#8696a0]">
            {groupParticipants.length} {groupParticipants.length === 1 ? "member" : "members"}
          </span>
          {activeOnlineCount > 0 && (
            <span className="text-[12px] font-medium text-[#00a884]">
              {activeOnlineCount} online
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
              <div className="w-10 h-10 rounded-full bg-[#00a884]/15 text-[#00a884] flex items-center justify-center shrink-0">
                <FiUserPlus size={18} />
              </div>
              <span className="text-[14.5px] font-medium text-[#00a884]">
                Add member
              </span>
            </div>
          )}

          {groupParticipants.length > 5 && (
            <div className="px-2 py-1">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${theme === "dark"
                  ? "bg-[#202c33] border-white/5 text-white"
                  : "bg-gray-100 border-gray-200 text-gray-900"
                  }`}
              >
                <FiSearch size={14} className="text-[#8696a0] shrink-0" />
                <input
                  type="text"
                  value={participantSearchTerm}
                  onChange={(e) => setParticipantSearchTerm(e.target.value)}
                  placeholder="Search members..."
                  className="bg-transparent border-none outline-none text-[13px] w-full placeholder-[#8696a0]"
                />
                {participantSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setParticipantSearchTerm("")}
                    className={`text-xs text-[#8696a0] ${theme === "dark" ? "hover:text-white" : "hover:text-gray-900"}`}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-0.5">
            {displayedParticipants.map((member, index) => {
              const memberId = (member?._id || member?.id || member)?.toString();
              const isMe = memberId === user?._id?.toString();
              const displayName = isMe
                ? "You"
                : member?.username || member?.name || "Member";
              const memberAbout = member?.about || "Hey there! I am using WhatsApp.";
              const isAdmin = groupAdmins.some((a) => (a?._id || a)?.toString() === memberId);
              const memberTag = getMemberTag(memberId);
              const isMemberOnline = checkMemberOnline(member);
              const isMenuOpen = openMemberMenuId === memberId;
              const isNearBottom = index >= Math.max(1, displayedParticipants.length - 2);

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
                      ? theme === "dark"
                        ? "bg-white/10"
                        : "bg-gray-100"
                      : theme === "dark"
                        ? "hover:bg-white/[0.05]"
                        : "hover:bg-gray-50"
                    }`}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${theme === "dark" ? "bg-[#2a3942]" : "bg-gray-100"
                        } border ${theme === "dark" ? "border-transparent" : "border-gray-200"}`}
                    >
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
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 ${theme === "dark" ? "border-[#111b21]" : "border-white"
                          } shadow-sm z-10`}
                        title="Online"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[14.5px] font-normal truncate ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                          }`}
                      >
                        {displayName}
                      </span>
                      <div className="flex items-center justify-center gap-1.5 shrink-0 ml-2">
                        {memberTag && (
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${theme === "dark"
                              ? "bg-[#16312e] text-[#00a884] border-[#00a884]/30"
                              : "bg-[#e0f0e9] text-[#00897b] border-[#00897b]/30"
                              } shrink-0 flex items-center gap-1`}
                          >
                            <FiTag className="w-2.5 h-2.5" />
                            {memberTag}
                          </span>
                        )}
                        {isAdmin && (
                          <span
                            className={`text-[11px] font-normal px-2 py-0.5 rounded ${theme === "dark"
                              ? "bg-[#16312e] text-[#00a884]"
                              : "bg-[#e0f0e9] text-[#00897b]"
                              } shrink-0`}
                          >
                            Group admin
                          </span>
                        )}
                        {!isMe && isCurrentUserAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMemberMenuId((prev) => (prev === memberId ? null : memberId));
                            }}
                            className={`p-1 rounded-full transition-colors cursor-pointer ${theme === "dark"
                                ? isMenuOpen
                                  ? "opacity-100 text-[#e9edef] bg-white/10"
                                  : "text-[#8696a0] hover:text-[#e9edef] hover:bg-white/10 opacity-0 group-hover:opacity-100"
                                : isMenuOpen
                                  ? "opacity-100 text-[#111b21] bg-black/5"
                                  : "text-[#667781] hover:text-[#111b21] hover:bg-black/5 opacity-0 group-hover:opacity-100"
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
                      <p
                        className={`text-[12.5px] truncate font-normal leading-tight mt-0.5 ${theme === "dark" ? "text-[#8696a0]" : "text-gray-500"
                          }`}
                      >
                        {memberAbout}
                      </p>
                    )}
                  </div>

                  {isMenuOpen && isCurrentUserAdmin && !isMe && (
                    <div
                      ref={memberMenuRef}
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute right-3 ${isNearBottom ? "bottom-full mb-1.5" : "top-full mt-1.5"
                        } z-50 w-52 rounded-2xl shadow-2xl py-1.5 border select-none transition-all duration-150 animate-in fade-in zoom-in-95 ${theme === "dark"
                          ? "bg-[#233138] border-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.5)]"
                          : "bg-white border-black/10 shadow-[0_12px_28px_rgba(0,0,0,0.15)]"
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMemberMenuId(null);
                          handleToggleMemberAdmin(memberId, isAdmin, displayName);
                        }}
                        className={itemClass}
                      >
                        <FaUserShield
                          size={17}
                          className="text-[#8696a0] group-hover:text-inherit shrink-0 transition-colors"
                        />
                        <span>{isAdmin ? "Dismiss as admin" : "Make group admin"}</span>
                      </button>

                      <div className={menuDividerClass} />

                      <button
                        type="button"
                        onClick={() => {
                          setOpenMemberMenuId(null);
                          handleRemoveMember(memberId, displayName);
                        }}
                        className={dangerItemClass}
                      >
                        <IoRemoveCircleOutline
                          size={18}
                          className="shrink-0 transition-colors text-inherit"
                        />
                        <span className="truncate">
                          Remove
                        </span>
                      </button>
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
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${theme === "dark" ? "bg-[#16312e] text-[#00a884]" : "bg-[#e0f0e9] text-[#00897b]"
                  } shrink-0`}
              >
                <MdHistory size={20} />
              </div>
              <div className="min-w-0">
                <h5
                  className={`text-[14.5px] font-medium leading-snug ${theme === "dark" ? "text-[#e9edef]" : "text-gray-900"
                    }`}
                >
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
      </div>

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
    </>
  );
};

export default ContactInfoGroupMembersSection;
