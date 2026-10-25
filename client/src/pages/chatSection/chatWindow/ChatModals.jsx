import React from "react";
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast } from "react-toastify";
import CameraModal from "../../../components/modals/CameraModal";
import PollModal from "../../../components/modals/pollModal";
import ContactModal from "../../../components/modals/ContactModal";
import EventModal from "../../../components/modals/EventModal";
import StickerModal from "../../../components/modals/StickerModal";
import FileViewerModal from "../../../components/modals/FileViewerModal";
import ForwardModal from "../../../components/modals/ForwardModal";
import BlockModal from "../../../components/modals/BlockModal";
import ReportModal from "../../../components/modals/ReportModal";
import GroupCallModal from "../../../components/modals/GroupCallModal";
import NewCallLinkModal from "../../calls/NewCallLinkModal";
import SplitBillModal from "../../../components/modals/SplitBillModal";
import LocationModal from "../../../components/modals/LocationModal";
import ChatHeaderMenu from "../ChatHeaderMenu";
import useVideoCallStore from "../../../store/videoCallStore";

export const ChatModals = ({
  theme,
  selectedContact,
  setSelectedContact,
  messages,
  showCamera,
  setShowCamera,
  setSelectedFiles,
  showPollModal,
  setShowPollModal,
  handleSendPoll,
  showContactModal,
  setShowContactModal,
  handleSendContact,
  conversations,
  showEventModal,
  setShowEventModal,
  editingEventMessage,
  setEditingEventMessage,
  handleSendEvent,
  handleUpdateEvent,
  handleCancelEvent,
  showStickerModal,
  setShowStickerModal,
  handleSendSticker,
  stickerInputRef,
  showGroupCallModal,
  setShowGroupCallModal,
  groupParticipants,
  groupAdmins,
  groupCallModalType,
  showForwardSelectedModal,
  setShowForwardSelectedModal,
  handleExitSelectMode,
  selectedMsgsList,
  showDeleteSelectedModal,
  setShowDeleteSelectedModal,
  selectedMessageIds,
  canDeleteForEveryone,
  executeDeleteSelected,
  previewModalFile,
  setPreviewModalFile,
  showHeaderMenu,
  setShowHeaderMenu,
  headerMenuAnchor,
  setHeaderMenuAnchor,
  setIsSearchOpen,
  handleEnterSelectMode,
  handleVideoCall,
  handleAudioCall,
  setShowContactInfo,
  openContactInfoWithTab,
  handleCloseChatWindow,
  showCallLinkModal,
  setShowCallLinkModal,
  users,
  sendCallLinkMessage,
  currentConversation,
  showBlockModal,
  setShowBlockModal,
  handleConfirmBlock,
  showReportModal,
  setShowReportModal,
  handleConfirmReport,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleExecuteDeleteChat,
  showSplitBillModal,
  setShowSplitBillModal,
  handleSendSplitBill,
  showLocationModal,
  setShowLocationModal,
  handleSendLocation,
}) => {
  return (
    <>
      {showCamera && (
        <CameraModal
          onClose={() => setShowCamera(false)}
          onCapture={(file) => {
            const item = {
              id: Math.random().toString(36).substring(2, 9) + Date.now(),
              file,
              name: file.name || "camera-photo.jpg",
              size: (file.size / 1024).toFixed(1) + " KB",
              type: "image",
              previewUrl: URL.createObjectURL(file),
            };
            setSelectedFiles((prev) => [...prev, item]);
            setShowCamera(false);
          }}
        />
      )}

      {showPollModal && (
        <PollModal
          onClose={() => setShowPollModal(false)}
          onSend={handleSendPoll}
          theme={theme}
        />
      )}

      {showContactModal && (
        <ContactModal
          onClose={() => setShowContactModal(false)}
          onSend={handleSendContact}
          conversations={conversations}
          theme={theme}
        />
      )}

      {showEventModal && (
        <EventModal
          onClose={() => {
            setShowEventModal(false);
            setEditingEventMessage(null);
          }}
          onSend={editingEventMessage ? handleUpdateEvent : handleSendEvent}
          onCancelEvent={editingEventMessage ? handleCancelEvent : null}
          initialEvent={editingEventMessage?.eventData}
          isEdit={Boolean(editingEventMessage)}
          theme={theme}
        />
      )}

      {showStickerModal && (
        <StickerModal
          onClose={() => setShowStickerModal(false)}
          onSend={handleSendSticker}
          onUploadClick={() => {
            setShowStickerModal(false);
            stickerInputRef.current?.click();
          }}
          theme={theme}
        />
      )}

      {showSplitBillModal && (
        <SplitBillModal
          isOpen={showSplitBillModal}
          onClose={() => setShowSplitBillModal(false)}
          onSend={handleSendSplitBill}
          selectedContact={selectedContact}
          currentConversation={currentConversation}
          groupParticipants={groupParticipants}
          theme={theme}
        />
      )}

      {showLocationModal && (
        <LocationModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onSend={handleSendLocation}
          theme={theme}
        />
      )}

      {showGroupCallModal && (
        <GroupCallModal
          isOpen={showGroupCallModal}
          onClose={() => setShowGroupCallModal(false)}
          groupParticipants={groupParticipants}
          groupAdmins={groupAdmins}
          groupName={
            selectedContact?.groupName ||
            selectedContact?.name ||
            selectedContact?.username ||
            "Group"
          }
          groupId={(selectedContact?._id || selectedContact?.id || selectedContact?.conversation?._id)?.toString()}
          groupAvatar={selectedContact?.profilePicture || selectedContact?.groupProfileImage || ""}
          initialCallType={groupCallModalType}
          theme={theme}
          onStartCall={(target, callType) => {
            setShowGroupCallModal(false);
            const { initiateCall } = useVideoCallStore.getState();
            if (typeof initiateCall !== "function") {
              toast.error("Call service not ready. Please try again.");
              return;
            }

            const avatar =
              selectedContact?.profilePicture ||
              selectedContact?.groupProfileImage ||
              "";
            const displayName =
              selectedContact?.groupName ||
              selectedContact?.name ||
              selectedContact?.username ||
              "Group";
            const gId = (selectedContact?._id || selectedContact?.id || selectedContact?.conversation?._id)?.toString();

            if (Array.isArray(target)) {
              const otherMemberIds = target
                .map((p) => (p?._id || p)?.toString())
                .filter(Boolean);
              if (otherMemberIds.length === 0) {
                toast.info("No members selected to call");
                return;
              }
              initiateCall(
                otherMemberIds[0],
                displayName,
                avatar,
                callType || "audio",
                {
                  isGroup: true,
                  groupId: gId,
                  groupName: displayName,
                  groupAvatar: avatar,
                  participantIds: otherMemberIds,
                }
              );
            } else if (target) {
              const mId = (target?._id || target?.id || target)?.toString();
              const mName = target?.username || target?.name || "Participant";
              const mAvatar = target?.profilePicture || "";
              initiateCall(mId, mName, mAvatar, callType || "audio");
            }
          }}
        />
      )}

      {showForwardSelectedModal && (
        <ForwardModal
          isOpen={showForwardSelectedModal}
          onClose={() => {
            setShowForwardSelectedModal(false);
            handleExitSelectMode();
          }}
          messages={selectedMsgsList}
          theme={theme}
        />
      )}

      {showDeleteSelectedModal && (
        <div
          className={`fixed inset-0 z-[10000] flex items-center justify-center px-4 backdrop-blur-xl ${theme === "dark" ? "bg-black/70" : "bg-black/30"
            }`}
          onClick={() => setShowDeleteSelectedModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className={`relative w-full max-w-sm overflow-hidden rounded-[28px] border p-6 shadow-2xl backdrop-blur-2xl ${theme === "dark"
              ? "border-white/[0.08] bg-gradient-to-br from-[#202c33]/95 via-[#111b21]/95 to-[#0b141a]/95 shadow-black/50"
              : "border-white/70 bg-gradient-to-br from-white/95 via-white/90 to-zinc-100/95 shadow-black/10"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl ${theme === "dark" ? "bg-red-500/10" : "bg-red-400/10"
                }`}
            />
            <button
              type="button"
              aria-label="Close"
              title="Close"
              onClick={() => setShowDeleteSelectedModal(false)}
              className={`absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 cursor-pointer ${theme === "dark"
                ? "bg-white/[0.06] text-gray-400 hover:bg-white/15 hover:text-white"
                : "bg-black/[0.05] text-gray-500 hover:bg-black/10 hover:text-gray-900"
                }`}
            >
              <RxCross2 size={16} />
            </button>

            <div className="relative flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 300,
                }}
                className={`relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg ${theme === "dark"
                  ? "border-red-400/10 bg-gradient-to-br from-red-500/20 to-red-600/5 text-red-400 shadow-red-500/10"
                  : "border-red-500/10 bg-gradient-to-br from-red-500/10 to-red-500/5 text-red-500 shadow-red-500/10"
                  }`}
              >
                <RiDeleteBin6Line size={27} />
              </motion.div>
              <h2
                className={`text-xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-zinc-900"
                  }`}
              >
                Delete {selectedMessageIds.length} message{selectedMessageIds.length > 1 ? "s" : ""}?
              </h2>
              <p
                className={`mt-2 max-w-[290px] text-sm leading-6 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                  }`}
              >
                Choose how you want to delete selected messages. This action cannot be undone.
              </p>
            </div>

            <div className="relative mt-7 flex flex-col gap-3">
              {canDeleteForEveryone && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => executeDeleteSelected("everyone")}
                  className="group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 font-semibold transition-all duration-300 cursor-pointer border-red-500/10 bg-gradient-to-r from-red-500/90 to-rose-600/90 text-white shadow-lg shadow-red-500/10 hover:border-red-300/20 hover:from-red-500 hover:to-rose-500"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2.5">
                    <RiDeleteBin6Line size={17} />
                    <span>Delete for everyone</span>
                  </span>
                </motion.button>
              )}

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => executeDeleteSelected("me")}
                className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 font-semibold transition-all duration-300 cursor-pointer ${theme === "dark"
                  ? "border-white/[0.08] bg-gradient-to-r from-zinc-800/90 to-zinc-900/90 text-zinc-100 shadow-lg shadow-black/10 hover:border-emerald-400/20 hover:from-zinc-700/90 hover:to-zinc-800/90 hover:text-emerald-300"
                  : "border-black/[0.06] bg-gradient-to-r from-zinc-100 to-white text-zinc-800 shadow-md hover:border-emerald-500/20 hover:from-emerald-50 hover:to-white hover:text-emerald-700"
                  }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  <RiDeleteBin6Line size={17} />
                  <span>Delete for me</span>
                </span>
              </motion.button>

              <button
                type="button"
                onClick={() => setShowDeleteSelectedModal(false)}
                className={`w-full py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer ${theme === "dark"
                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                  : "text-gray-600 hover:text-gray-900 hover:bg-black/5"
                  }`}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {previewModalFile && (
        <FileViewerModal
          isOpen={Boolean(previewModalFile)}
          onClose={() => setPreviewModalFile(null)}
          file={previewModalFile}
          theme={theme}
        />
      )}

      <ChatHeaderMenu
        isOpen={showHeaderMenu}
        onClose={() => setShowHeaderMenu(false)}
        onReopenAt={(coords) => {
          setHeaderMenuAnchor(coords);
          setShowHeaderMenu(true);
        }}
        anchorCoords={headerMenuAnchor}
        selectedContact={selectedContact}
        setSelectedContact={setSelectedContact}
        theme={theme}
        messages={messages}
        onSearchClick={() => setIsSearchOpen(true)}
        onSelectMessages={() => {
          handleEnterSelectMode();
        }}
        onStartCall={(type) => {
          if (type === "video") handleVideoCall();
          else handleAudioCall();
        }}
        onOpenContactInfo={() => setShowContactInfo(true)}
        onOpenDisappearingMessages={() => openContactInfoWithTab("disappearing")}
        onOpenChatTheme={() => openContactInfoWithTab("chatTheme")}
        onOpenCallLink={() => setShowCallLinkModal(true)}
        onCloseChat={handleCloseChatWindow}
      />

      <NewCallLinkModal
        isOpen={showCallLinkModal}
        onClose={() => setShowCallLinkModal(false)}
        contacts={users}
        activeContact={selectedContact}
        onStartCall={(contact, type) => {
          const { initiateCall } = useVideoCallStore.getState();
          if (typeof initiateCall === "function") {
            const peer = selectedContact || contact;
            const pId = (peer?._id || peer?.id || peer)?.toString();
            const pName = peer?.username || peer?.name || "Contact";
            const pAvatar = peer?.profilePicture || peer?.avatar || "";
            initiateCall(pId, pName, pAvatar, type);
          }
        }}
        onSendToChat={(contact, url, type, code) => {
          const isGroupChat = Boolean(
            selectedContact?.isGroup ||
            selectedContact?.isGroupChat ||
            selectedContact?.conversation?.isGroup ||
            currentConversation?.isGroup ||
            (typeof selectedContact?.groupName === "string" && selectedContact.groupName.trim() !== "")
          );
          const effectiveConvId = isGroupChat
            ? (selectedContact?._id || selectedContact?.id || currentConversation?._id || selectedContact?.conversation?._id)?.toString()
            : (currentConversation?._id || selectedContact?.conversation?._id)?.toString();
          const receiverId = (contact?._id || contact?.id || (isGroupChat ? effectiveConvId : selectedContact?._id))?.toString();
          if (receiverId || effectiveConvId) {
            sendCallLinkMessage({
              receiverId: isGroupChat ? effectiveConvId : receiverId,
              conversationId: effectiveConvId,
              callType: type || "video",
              linkCode: code,
              url,
              isGroup: isGroupChat,
              groupId: isGroupChat ? effectiveConvId : null,
            });
          }
        }}
      />

      <BlockModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onBlock={handleConfirmBlock}
        contactName={selectedContact?.username || "contact"}
        theme={theme}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReport={handleConfirmReport}
        contactName={selectedContact?.username || "contact"}
        theme={theme}
      />

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/65 backdrop-blur-[2px]"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-[360px] sm:max-w-[400px] rounded-2xl p-6 shadow-2xl border select-none ${theme === "dark"
              ? "bg-[#233138] border-white/10 text-white"
              : "bg-white border-black/10 text-gray-900"
              }`}
          >
            <h3 className="text-lg font-semibold mb-2">Delete this chat?</h3>
            <p
              className={`text-sm mb-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
            >
              Messages will be deleted for you. This chat will be removed from your chats list.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${theme === "dark"
                  ? "hover:bg-white/10 text-gray-300"
                  : "hover:bg-black/5 text-gray-600"
                  }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteChat}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-sm active:scale-95"
              >
                Delete chat
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ChatModals;
