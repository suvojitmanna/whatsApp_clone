import React, { useState, useEffect, useMemo } from "react";
import Layout from "../../components/layout";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import useVideoCallStore from "../../store/videoCallStore";
import useCallStore from "../../store/useCallStore";
import { getAllUsers } from "../../services/user.services";
import CallInfo from "./CallInfo";
import CallPlaceholder from "./CallPlaceholder";
import { formatCallDate } from "../../utils/formatTime";
import NewCallModal, { NewCallView } from "./NewCallModal";
import PhoneNumberView from "./PhoneNumberView";
import NewCallLinkModal from "./NewCallLinkModal";
import {
  AddFavouritesModal,
  FavouritesView,
  ContactAvatar,
} from "./FaviouriteCall";
import {
  MdAddIcCall,
  MdCallMade,
  MdCallReceived,
  MdCallMissed,
  MdSearch,
  MdClear,
  MdCall,
  MdVideocam,
  MdVerified,
  MdOutlineCall,
  MdOutlineVideocam,
  MdDelete,
} from "react-icons/md";
import { FaUserPlus } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import { RiDeleteBin5Fill } from "react-icons/ri";

const Call = () => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const { user } = useUserStore();

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [activeSidebarView, setActiveSidebarView] = useState("calls");
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [showCallLinkModal, setShowCallLinkModal] = useState(false);
  const [showFavouriteModal, setShowFavouriteModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [activeMenuCallId, setActiveMenuCallId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuCallId(null);
    if (activeMenuCallId) {
      window.addEventListener("click", handleOutsideClick);
    }
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [activeMenuCallId]);

  const storeUsers = useChatStore((state) => state.users) || [];
  const setStoreUsers = useChatStore((state) => state.setUsers);

  const {
    callHistory,
    favourites,
    selectedCall,
    searchQuery,
    setSearchQuery,
    setSelectedCall,
    addCall,
    removeCall,
  } = useCallStore();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        if (!storeUsers || storeUsers.length === 0) {
          const res = await getAllUsers();
          const fetched = res?.users || [];
          setAllUsers(fetched);
          if (setStoreUsers) setStoreUsers(fetched);
        } else {
          setAllUsers(storeUsers);
        }
      } catch (err) {
        console.error("Error loading users for calls:", err);
      }
    };
    loadUsers();
  }, [storeUsers, setStoreUsers]);

  const availableContacts = useMemo(() => {
    const map = new Map();
    allUsers.forEach((u) => {
      if (u._id !== user?._id) {
        map.set(u._id, u);
      }
    });

    callHistory.forEach((c) => {
      if (c.contactId && !map.has(c.contactId)) {
        map.set(c.contactId, {
          _id: c.contactId,
          username: c.contactName,
          name: c.contactName,
          profilePicture: c.contactAvatar,
          about: "Hey there! I am using WhatsApp",
        });
      }
    });

    return Array.from(map.values());
  }, [allUsers, user?._id, callHistory]);

  const filteredCalls = useMemo(() => {
    if (!searchQuery.trim()) return callHistory;
    const q = searchQuery.toLowerCase();
    return callHistory.filter((c) =>
      c.contactName?.toLowerCase().includes(q)
    );
  }, [callHistory, searchQuery]);

  const filteredFavourites = useMemo(() => {
    if (!searchQuery.trim()) return favourites;
    const q = searchQuery.toLowerCase();
    return favourites.filter((f) =>
      (f.username || f.name)?.toLowerCase().includes(q)
    );
  }, [favourites, searchQuery]);

  const handleStartCall = (contact, callType = "audio") => {
    const contactId = contact._id || contact.id || contact.contactId;
    const contactName = contact.username || contact.name || contact.contactName;
    const contactAvatar =
      contact.profilePicture || contact.avatar || contact.contactAvatar;

    const { initiateCall } = useVideoCallStore.getState();
    if (typeof initiateCall === "function") {
      initiateCall(contactId, contactName, contactAvatar, callType);
    } else {
      console.warn("initiateCall is not yet initialized on videoCallStore");
    }
    addCall({
      contactId,
      contactName,
      contactAvatar,
      callType,
      direction: "outgoing",
    });
  };

  const leftPanelContent = (
    <div className="h-full w-full relative">
      {activeSidebarView === "favourites" ? (
        <FavouritesView
          onBack={() => setActiveSidebarView("calls")}
          onOpenAddModal={() => setShowFavouriteModal(true)}
          onStartCall={handleStartCall}
          contacts={availableContacts}
        />
      ) : activeSidebarView === "newcall" ? (
        <NewCallView
          onBack={() => setActiveSidebarView("calls")}
          onClose={() => setActiveSidebarView("calls")}
          contacts={availableContacts}
          onStartCall={handleStartCall}
          onOpenCallLink={() => setShowCallLinkModal(true)}
          onOpenDialpad={() => setActiveSidebarView("phonenumber")}
        />
      ) : activeSidebarView === "phonenumber" ? (
        <PhoneNumberView
          onBack={() => setActiveSidebarView("calls")}
          onStartCall={handleStartCall}
          contacts={availableContacts}
        />
      ) : (
        <div
          className={`h-full w-full flex flex-col select-none border-r transition-colors duration-200 ${isDark
            ? "bg-[#111b21] border-[#222e35] text-[#e9edef]"
            : "bg-white border-gray-200 text-[#111b21]"
            }`}
        >
          <div className="h-16 px-4 flex items-center justify-between shrink-0">
            <h1 className="text-[22px] font-bold tracking-normal">Calls</h1>

            <div className="relative group">
              <button
                type="button"
                onClick={() => setActiveSidebarView("newcall")}
                className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] active:scale-95 text-black flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer"
                title="New call"
                aria-label="New call"
              >
                <MdAddIcCall className="text-xl" />
              </button>

              <span
                className={`absolute -bottom-8 right-0 text-[11px] font-semibold px-2 py-0.5 rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap ${isDark
                  ? "bg-[#202c33] text-white"
                  : "bg-white text-[#111b21] border border-gray-200"
                  }`}
              >
                New call
              </span>
            </div>
          </div>

          <div className="px-4 pb-2 shrink-0">
            <div
              className={`flex items-center gap-3 px-5 py-2.5 rounded-full border-2 transition-all duration-300 ${isDark
                ? "bg-[#161a1d] border-[#00c878]"
                : "bg-[#f0f2f5] border-[#00a884]"
                }`}
            >
              <MdSearch
                className={`text-xl shrink-0 ${isDark ? "text-[#aebac1]" : "text-[#54656f]"
                  }`}
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, number or @username"
                className={`w-full bg-transparent text-[14px] outline-none placeholder:text-[#aebac1] ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
                  }`}
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`shrink-0 cursor-pointer transition-colors ${isDark
                    ? "text-[#8696a0] hover:text-[#00a884]"
                    : "text-[#54656f] hover:text-[#008069]"
                    }`}
                >
                  <MdClear className="text-lg" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
            <div className="pt-2 pb-2">
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-[17px] font-semibold">Favourites</span>
                {favourites.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveSidebarView("favourites")}
                    className={`rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-300 cursor-pointer ${isDark
                      ? "border-white/[0.12] bg-transparent text-[#00c978] hover:border-[#00c978]/80 hover:bg-white/[0.05]"
                      : "border-black/[0.12] bg-transparent text-[#008f5a] hover:border-[#008f5a]/80 hover:bg-black/[0.05]"
                      }`}
                  >
                    View all
                  </button>
                )}
              </div>

              {favourites.length === 0 ? (
                <div
                  onClick={() => setShowFavouriteModal(true)}
                  className={`mx-2.5 p-3 rounded-2xl flex items-center gap-3.5 transition-all cursor-pointer  ${isDark
                    ? "hover:bg-[#1f2b33] hover:shadow-sm"
                    : "hover:bg-[#e9edef] hover:shadow-sm"
                    }`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#00a884] text-black flex items-center justify-center shrink-0">
                    <FaUserPlus className="text-lg" />
                  </div>
                  <div
                    className={`font-medium text-[16px] ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
                      }`}
                  >
                    Add favourite
                  </div>
                </div>
              ) : (
                <div className="px-3 flex flex-col gap-2">
                  {filteredFavourites.map((fav) => {
                    const name = fav.username || fav.name;
                    return (
                      <div
                        key={fav.contactId || fav._id}
                        onClick={() =>
                          setSelectedCall({
                            id: `fav-call-${fav.contactId || fav._id}`,
                            contactId: fav.contactId || fav._id,
                            contactName: fav.username || fav.name,
                            contactAvatar: fav.profilePicture || fav.avatar,
                            callType: "audio",
                            direction: "outgoing",
                            dateFormatted: "Today",
                            timeFormatted: "Now",
                            duration: "Favourite",
                          })
                        }
                        className={`p-3.5 rounded-2xl flex items-center gap-3.5 transition-all cursor-pointer  ${isDark
                          ? "hover:bg-[#1f2b33] hover:shadow-sm"
                          : "hover:bg-[#e9edef] hover:shadow-sm"
                          }`}
                      >
                        <ContactAvatar contact={fav} size={48} />
                        <div className="min-w-0 flex-1">
                          <div
                            className={`flex items-center gap-1.5 font-medium text-[16px] truncate ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
                              }`}
                          >
                            <span>{name}</span>
                            {fav.isVerified && (
                              <MdVerified className="text-[#00a884] text-base shrink-0" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="Video Call"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartCall(fav, "video");
                            }}
                            className={`p-2 rounded-full cursor-pointer transition-all duration-300 ${isDark
                              ? "text-[#aebac1] hover:text-[#00a884] hover:bg-[#00a884]/10 hover:border-[#00a884]/30"
                              : "text-[#54656f] hover:text-[#008069] hover:bg-[#008069]/10 hover:border-[#008069]/25"
                              }`}
                          >
                            <MdOutlineVideocam size={25} />
                          </button>

                          <button
                            type="button"
                            title="Voice Call"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartCall(fav, "audio");
                            }}
                            className={`p-2 rounded-full cursor-pointer transition-all duration-300 ${isDark
                              ? "text-[#aebac1] hover:text-[#00a884] hover:bg-[#00a884]/10 hover:border-[#00a884]/30"
                              : "text-[#54656f] hover:text-[#008069] hover:bg-[#008069]/10 hover:border-[#008069]/25"
                              }`}
                          >
                            <MdOutlineCall size={25} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pb-6">
              <div className="px-4 py-2 pb-5 text-[16px] font-bold">Recent</div>

              {filteredCalls.length === 0 ? (
                <div
                  className={`py-8 text-center text-sm ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                    }`}
                >
                  {searchQuery ? "No matching calls found" : "No recent calls"}
                </div>
              ) : (
                <div className="flex flex-col space-y-1.5">
                  {filteredCalls.map((call) => {
                    const isSelected = selectedCall?.id === call.id;
                    const isMissed = call.direction === "missed";
                    const isIncoming = call.direction === "incoming";

                    return (
                      <div
                        key={call.id}
                        onClick={() => setSelectedCall(call)}
                        className={`mx-3 p-3.5 rounded-2xl flex items-center justify-between gap-3.5 transition-all cursor-pointer group ${isSelected
                          ? isDark
                            ? "bg-[#2a3942] text-white shadow-sm"
                            : "bg-[#e9edef] shadow-sm"
                          : isDark
                            ? "hover:bg-[#1f2b33] hover:shadow-sm"
                            : "hover:bg-[#e9edef] hover:shadow-sm"
                          }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <ContactAvatar
                            contact={{
                              username: call.contactName,
                              profilePicture: call.contactAvatar,
                            }}
                            size={48}
                          />

                          <div className="min-w-0 flex-1">
                            <div
                              className={`font-medium text-[16px] truncate leading-tight ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
                                }`}
                            >
                              {call.contactName}
                            </div>

                            <div className="flex items-center gap-1.5 mt-1 text-[13px]">
                              {isMissed ? (
                                <MdCallMissed className="text-[#ea0038] text-base shrink-0 transform rotate-180" />
                              ) : isIncoming ? (
                                <MdCallReceived className="text-[#00a884] text-base shrink-0" />
                              ) : (
                                <MdCallMade
                                  className={`text-base shrink-0 ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                                    }`}
                                />
                              )}

                              <span
                                className={
                                  isMissed
                                    ? "text-[#ea0038] font-medium"
                                    : isDark
                                      ? "text-[#8696a0]"
                                      : "text-[#54656f]"
                                }
                              >
                                {isMissed
                                  ? "Missed"
                                  : isIncoming
                                    ? "Incoming"
                                    : "Outgoing"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pl-2">
                          <span
                            className={`text-xs ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                              }`}
                          >
                            {formatCallDate(call)}
                          </span>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuCallId((prev) =>
                                  prev === call.id ? null : call.id
                                );
                              }}
                              className={`p-1.5 rounded-full transition-all cursor-pointer ${activeMenuCallId === call.id
                                ? isDark
                                  ? "opacity-100 bg-[#2a3942] text-white shadow-sm"
                                  : "opacity-100 bg-[#d9dde0] text-[#111b21] shadow-sm"
                                : isDark
                                  ? "opacity-0 group-hover:opacity-100 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21]/60"
                                  : "opacity-0 group-hover:opacity-100 text-[#54656f] hover:text-[#111b21] hover:bg-black/5"
                                }`}
                              title="Call options"
                            >
                              <IoIosArrowDown
                                className={`text-base transition-transform duration-200 ${activeMenuCallId === call.id
                                  ? "rotate-180"
                                  : ""
                                  }`}
                              />
                            </button>

                            {activeMenuCallId === call.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute right-0 top-full mt-1.5 w-44 rounded-2xl shadow-xl border py-1.5 z-30 backdrop-blur-xl transition-all duration-200 ${isDark
                                  ? "bg-[#233138]/95 border-white/[0.10] text-[#e9edef] shadow-black/50"
                                  : "bg-white/95 border-black/[0.08] text-[#111b21] shadow-black/10"
                                  }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuCallId(null);
                                    handleStartCall(
                                      {
                                        _id: call.contactId,
                                        username: call.contactName,
                                        profilePicture: call.contactAvatar,
                                      },
                                      "audio"
                                    );
                                  }}
                                  className={`w-[calc(100%-12px)] mx-1.5 px-3.5 py-2.5 flex items-center gap-3 text-[14px] font-medium rounded-xl transition-all duration-200 cursor-pointer ${isDark
                                    ? "hover:bg-white/[0.06] text-[#e9edef]"
                                    : "hover:bg-black/[0.04] text-[#111b21]"
                                    }`}
                                >
                                  <MdCall className="text-lg text-[#00a884] shrink-0" />
                                  <span>Voice call</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuCallId(null);
                                    handleStartCall(
                                      {
                                        _id: call.contactId,
                                        username: call.contactName,
                                        profilePicture: call.contactAvatar,
                                      },
                                      "video"
                                    );
                                  }}
                                  className={`w-[calc(100%-12px)] mx-1.5 px-3.5 py-2.5 flex items-center gap-3 text-[14px] font-medium rounded-xl transition-all duration-200 cursor-pointer ${isDark
                                    ? "hover:bg-white/[0.06] text-[#e9edef]"
                                    : "hover:bg-black/[0.04] text-[#111b21]"
                                    }`}
                                >
                                  <MdVideocam className="text-lg text-[#00a884] shrink-0" />
                                  <span>Video call</span>
                                </button>

                                <div
                                  className={`my-1 mx-3 border-t ${isDark ? "border-white/10" : "border-black/10"
                                    }`}
                                />

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuCallId(null);

                                    if (removeCall) {
                                      removeCall(call.id);
                                    }
                                  }}
                                  className={`w-[calc(100%-12px)] mx-1.5 px-3.5 py-2.5 flex items-center gap-3 text-[14px] font-medium rounded-xl transition-all duration-200 cursor-pointer group ${isDark
                                    ? "text-[#e9edef] hover:bg-red-500/15 hover:text-red-400"
                                    : "text-[#111b21] hover:bg-red-50 hover:text-red-600"
                                    }`}
                                >
                                  <RiDeleteBin5Fill
                                    className={`text-lg shrink-0 transition-colors ${isDark
                                      ? "text-red-400 group-hover:text-red-500"
                                      : "text-red-500 group-hover:text-red-600"
                                      }`}
                                  />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isMobile && selectedCall && (
        <div className="fixed inset-0 z-40 bg-black/50">
          <div className="h-full w-full">
            <CallInfo
              call={selectedCall}
              onClose={() => setSelectedCall(null)}
              onStartAudioCall={(id, name, avatar) =>
                handleStartCall(
                  { _id: id, username: name, profilePicture: avatar },
                  "audio"
                )
              }
              onStartVideoCall={(id, name, avatar) =>
                handleStartCall(
                  { _id: id, username: name, profilePicture: avatar },
                  "video"
                )
              }
              isMobile={true}
            />
          </div>
        </div>
      )}

      <NewCallModal
        isOpen={showNewCallModal}
        onClose={() => setShowNewCallModal(false)}
        contacts={availableContacts}
        onStartCall={handleStartCall}
      />

      <AddFavouritesModal
        isOpen={showFavouriteModal}
        onClose={() => setShowFavouriteModal(false)}
        contacts={availableContacts}
      />

      <NewCallLinkModal
        isOpen={showCallLinkModal}
        onClose={() => setShowCallLinkModal(false)}
        contacts={availableContacts}
        onStartCall={handleStartCall}
      />
    </div>
  );

  const rightPaneContent = selectedCall ? (
    <CallInfo
      call={selectedCall}
      onClose={() => setSelectedCall(null)}
      onStartAudioCall={(id, name, avatar) =>
        handleStartCall(
          { _id: id, username: name, profilePicture: avatar },
          "audio"
        )
      }
      onStartVideoCall={(id, name, avatar) =>
        handleStartCall(
          { _id: id, username: name, profilePicture: avatar },
          "video"
        )
      }
      isMobile={false}
    />
  ) : (
    <CallPlaceholder
      onNewCall={() => setActiveSidebarView("newcall")}
      onOpenDialpad={() => setActiveSidebarView("phonenumber")}
      onStartCall={handleStartCall}
      contacts={availableContacts}
    />
  );

  return (
    <Layout rightContent={rightPaneContent}>
      {leftPanelContent}
    </Layout>
  );
};

export default Call;