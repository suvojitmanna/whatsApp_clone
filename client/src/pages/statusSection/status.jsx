import React, { useRef, useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import useStatusStore from "../../store/statusStore";
import { useEffect } from "react";
import Layout from "../../components/layout";
import StatusPreview from "./statusPreview";
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FaCamera, FaEllipsisH, FaPlus } from "react-icons/fa";
import formatTimestamp from "../../utils/formatTime";
import StatusList from "./StatusList";
import CameraModal from "../../components/CameraModal";
import useOutsideClick from "../../hook/useOutsideClick";
import StatusPlaceholder from "../../components/StatusPlaceholder";

const status = () => {
  const [previewContact, setPreviewContact] = useState(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [showOption, setShowOption] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const modalRef = useRef(null);

  const {
    loading,
    error,
    fetchStatuses,
    createStatus,
    viewStatus,
    deleteStatus,
    getOtherStatuses,
    getUserStatuses,
    clearError,
    initializeSocket,
    cleanupSocket,
    statusReaction,
    statuses,
  } = useStatusStore();

  const userStatuses = getUserStatuses(user?._id);
  const otherStatuses = getOtherStatuses(user?._id);

  useEffect(() => {
    initializeSocket();
    fetchStatuses();
    return () => {
      cleanupSocket();
    };
  }, [user?._id]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, []);
  useEffect(() => {
    if (!previewContact) return;
    const grouped = useStatusStore.getState().getGroupStatus();
    const updatedContact = grouped?.[String(previewContact.id)];

    if (updatedContact) {
      setPreviewContact(updatedContact);
    }
  }, [statuses]);
  useOutsideClick(modalRef, () => {
    if (showCreateModal) setShowCreateModal(false);
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleCreateStatus = async () => {
    if (!newStatus.trim() && !selectedFile) return;
    try {
      await createStatus({
        content: newStatus,
        media: selectedFile,
      });
      setNewStatus("");
      setSelectedFile(null);
      setFilePreview(null);
      setShowCreateModal(false);
    } catch (error) {
      console.log("Error creating status", error);
    }
  };

  const handleViewStatus = async (contactId, statusId) => {
    try {
      await viewStatus(statusId);
    } catch (error) {
      console.log("error to status view", error);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(String(statusId));
      setShowOption(false);
      return true;
    } catch (error) {
      console.error("Error deleting status:", error);
      throw error;
    }
  };

  const handlePreviewNext = () => {
    if (currentStatusIndex < previewContact.statuses.length - 1) {
      setCurrentStatusIndex((prev) => prev + 1);
    } else {
      handlePreviewClose();
    }
  };

  const handlePreviewPrev = () => {
    setCurrentStatusIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleStatusPreview = (contact, statusIndex = 0) => {
    setPreviewContact(contact);
    setCurrentStatusIndex(statusIndex);
    const status = contact?.statuses?.[statusIndex];
    if (status) {
      handleViewStatus(contact.id, status.id);
    }
  };

  const handleStatusClick = (statusId) => {
    if (!statusId) return;
    const grouped = useStatusStore.getState().getGroupStatus();
    const clickedStatusId = String(statusId);
    for (const contact of Object.values(grouped || {})) {
      const statuses = contact?.statuses || [];
      const index = statuses.findIndex(
        (item) => String(item.id) === clickedStatusId,
      );

      if (index !== -1) {
        console.log("FOUND STATUS:", contact, index);

        handleStatusPreview(contact, index);
        return;
      }
    }
  };

  const handlePreviewClose = () => {
    setPreviewContact(null);
    setCurrentStatusIndex(0);
  };

  const latestMyStatus = userStatuses?.statuses?.[0];

  return (
    <Layout
      handleStatusClick={handleStatusClick}
      rightContent={<StatusPlaceholder />}
      isStatusPreviewOpen={!!previewContact}
      statusPreviewContent={
        previewContact && (
          <StatusPreview
            contact={previewContact}
            currentIndex={currentStatusIndex}
            onClose={handlePreviewClose}
            onNext={handlePreviewNext}
            onPrev={handlePreviewPrev}
            onDelete={handleDeleteStatus}
            onReact={statusReaction}
            theme={useUserStore.getState().theme}
            currentUser={user}
            loading={false}
          />
        )
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`h-full w-full flex flex-col overflow-hidden border-r relative z-10 transition-colors duration-300 ${
          theme === "dark"
            ? "bg-[#111b21] border-gray-700/60 text-white"
            : "bg-white border-gray-200 text-gray-900"
        }`}
      >
        <header
          className={`h-[60px] px-4 flex items-center justify-between border-b shrink-0 transition-colors duration-300 ${
            theme === "dark"
              ? "bg-[#111b21] border-gray-700/50 text-white"
              : "bg-white border-gray-200 text-gray-900"
          }`}
        >
          <h2 className="text-xl font-semibold">Status</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 bg-green-500 text-white rounded-full shadow-md cursor-pointer transition-all duration-300 ease-in-out hover:bg-green-600 hover:scale-110 active:scale-95"
              title="Add status"
            >
              <FaPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-4">
          {error && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl flex justify-between items-center text-sm shadow-sm"
            >
              <p className="text-xs font-semibold">{error}</p>
              <button
                onClick={clearError}
                className="p-1 hover:bg-red-500/20 rounded-full transition-colors cursor-pointer"
              >
                <RxCross2 className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          <section
            className={`rounded-2xl border transition-all ${
              theme === "dark"
                ? "bg-[#111b21] border-gray-700/40 hover:bg-white/5"
                : "bg-gray-50/80 border-gray-200/70 hover:bg-gray-100/70"
            } p-3`}
          >
            <div className="flex items-center gap-3">
              <div
                className="relative flex-shrink-0 cursor-pointer group"
                onClick={() =>
                  userStatuses
                    ? handleStatusPreview(userStatuses)
                    : setShowCreateModal(true)
                }
              >
                <div className="p-[2px] rounded-full">
                  <img
                    className={`w-12 h-12 rounded-full object-cover border-2 transition-transform group-hover:scale-95 ${
                      theme === "dark" ? "border-[#111b21]" : "border-white"
                    }`}
                    src={user?.profilePicture}
                    alt={user?.username}
                  />
                </div>

                {userStatuses && (
                  <svg
                    className="absolute -top-[3px] -left-[3px] w-[54px] h-[54px] pointer-events-none"
                    viewBox="0 0 100 100"
                  >
                    {userStatuses.statuses.map((_, index) => {
                      const circumference = 2 * Math.PI * 46;
                      const segmentLength =
                        circumference / userStatuses.statuses.length;
                      return (
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="46"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="4"
                          strokeDasharray={`${segmentLength - 4} 4`}
                          strokeDashoffset={-(index * segmentLength)}
                          transform="rotate(-90 50 50)"
                        />
                      );
                    })}
                  </svg>
                )}

                <button
                  className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full border-2 border-white dark:border-[#111b21] hover:scale-110 active:scale-90 transition-all shadow-md cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateModal(true);
                  }}
                  title="Add update"
                >
                  <FaPlus className="h-2.5 w-2.5" />
                </button>
              </div>

              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() =>
                  userStatuses
                    ? handleStatusPreview(userStatuses)
                    : setShowCreateModal(true)
                }
              >
                <h4 className="font-semibold text-[15px] truncate leading-tight">
                  My Status
                </h4>
                <p
                  className={`text-xs mt-1 truncate ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {userStatuses
                    ? `${userStatuses.statuses.length} updates • ${
                        latestMyStatus
                          ? formatTimestamp(latestMyStatus.timeStamp)
                          : ""
                      }`
                    : "Tap to share your moment"}
                </p>
              </div>

              {userStatuses && (
                <button
                  onClick={() => setShowOption(!showOption)}
                  className="p-2 rounded-xl hover:bg-gray-500/10 active:bg-gray-500/20 transition-all cursor-pointer"
                  title="Options"
                >
                  <FaEllipsisH
                    className={
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }
                    size={14}
                  />
                </button>
              )}
            </div>

            {showOption && userStatuses && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className={`mt-3 border-t pt-2.5 grid grid-cols-2 gap-2 ${
                  theme === "dark" ? "border-white/10" : "border-gray-200"
                }`}
              >
                <button
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-green-500/10 text-green-500 font-semibold text-xs transition-all hover:bg-green-500/20 cursor-pointer"
                  onClick={() => {
                    setShowCreateModal(true);
                    setShowOption(false);
                  }}
                >
                  <FaCamera size={12} /> Add New
                </button>
                <button
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-500/10 text-blue-500 font-semibold text-xs transition-all hover:bg-blue-500/20 cursor-pointer"
                  onClick={() => {
                    handleStatusPreview(userStatuses);
                    setShowOption(false);
                  }}
                >
                  View Stories
                </button>
              </motion.div>
            )}
          </section>

          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <h3
                className={`text-xs font-semibold uppercase tracking-wider ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Recent Updates
              </h3>
            </div>
            {loading ? (
              <div className="flex flex-col items-center py-12">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-3 border-green-500/20" />
                  <div className="absolute inset-0 w-10 h-10 rounded-full border-3 border-transparent border-t-green-500 animate-spin" />
                </div>

                <p className="text-xs font-semibold uppercase tracking-widest opacity-40 mt-3">
                  Syncing updates...
                </p>
              </div>
            ) : otherStatuses.length > 0 ? (
              <div
                className={`rounded-2xl overflow-hidden border divide-y transition-all ${
                  theme === "dark"
                    ? "bg-[#111b21] border-gray-700/40 divide-gray-700/40"
                    : "bg-white border-gray-200 divide-gray-100"
                }`}
              >
                {otherStatuses.map((contact, index) => (
                  <div
                    key={contact.id}
                    className="transition-colors duration-200"
                  >
                    <StatusList
                      contact={contact}
                      onPreview={() => handleStatusPreview(contact)}
                      theme={theme}
                      isLast={index === otherStatuses.length - 1}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 rounded-2xl border border-dashed backdrop-blur-md bg-black/5 dark:bg-white/5 dark:border-white/10 border-gray-300 transition-all">
                <div className="text-4xl mb-3 opacity-30">✨</div>

                <h3 className="text-sm font-semibold opacity-80 mb-1">
                  No Updates Yet
                </h3>

                <p className="text-xs opacity-50 max-w-xs mx-auto leading-relaxed">
                  When your contacts share updates, they will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xl bg-black/80">
            <motion.div
              ref={modalRef}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
                theme === "dark" ? "bg-[#1f2c33]" : "bg-white"
              }`}
            >
              <div className="w-12 h-1.5 bg-gray-500/20 rounded-full mx-auto mt-4 sm:hidden" />

              <div className="p-6 sm:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black">Share Update</h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewStatus("");
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="p-2 rounded-full bg-gray-500/10 hover:bg-gray-500/20 transition-colors"
                  >
                    <RxCross2 className="w-6 h-6 cursor-pointer" />
                  </button>
                </div>

                {filePreview && (
                  <div className="relative rounded-[2rem] overflow-hidden mb-6 bg-black shadow-inner ring-1 ring-white/10">
                    {selectedFile?.type.startsWith("video/") ? (
                      <video
                        src={filePreview}
                        controls
                        className="w-full max-h-[300px] object-contain"
                      />
                    ) : (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-full h-auto object-cover max-h-[400px]"
                      />
                    )}
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-red-500 transition-all duration-300 ease-out active:scale-90 cursor-pointer shadow-lg group"
                    >
                      <RxCross2
                        className="transition-transform duration-300 group-hover:rotate-90"
                        size={20}
                      />
                    </button>
                  </div>
                )}

                <textarea
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  placeholder="What's the vibe?"
                  className={`w-full p-6 rounded-[1.5rem] resize-none text-lg font-medium focus:ring-4 focus:ring-green-500/20 outline-none transition-all ${
                    theme === "dark"
                      ? "bg-[#2a3942] text-white border-transparent"
                      : "bg-gray-100 text-black border-transparent"
                  }`}
                  rows={3}
                />

                <div className="mt-8">
                  <div className="flex items-center gap-4 mb-8">
                    <label className="flex-1 cursor-pointer group">
                      <div
                        className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          theme === "dark"
                            ? "border-white/5 hover:bg-white/5"
                            : "border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        <FaCamera className="text-green-500" size={20} />
                        <span className="font-bold text-sm uppercase tracking-wider">
                          Media
                        </span>
                      </div>
                      <input
                        type="file"
                        hidden
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                      />
                    </label>

                    <button
                      onClick={() => setShowCamera(true)}
                      className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                        theme === "dark"
                          ? "border-white/5 hover:bg-white/5"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <FaCamera className="text-blue-500" size={20} />
                      <span className="font-bold text-sm uppercase tracking-wider cursor-pointer">
                        Camera
                      </span>
                    </button>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setNewStatus("");
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className={`flex-1 py-4 font-bold rounded-2xl transition-all active:scale-95 hover:bg-red-400 transition-colors duration-300 ease-in-out${
                        theme === "dark"
                          ? "text-gray-500 hover:text-white"
                          : "text-gray-400 hover:text-gray-900"
                      } cursor-pointer`}
                    >
                      Discard
                    </button>

                    <button
                      onClick={handleCreateStatus}
                      disabled={loading || (!newStatus.trim() && !selectedFile)}
                      className={`flex-[2] py-4 px-8 font-black rounded-2xl transition-all duration-300 active:scale-[0.95] flex justify-center items-center gap-3 text-white ${loading || (!newStatus.trim() && !selectedFile) ? "bg-gray-500/20 text-gray-500 cursor-not-allowed shadow-none" : "bg-green-500 hover:bg-emerald-400 hover:shadow-[0_8px_20px_-5px_rgba(239,68,68,0.5)] cursor-pointer"}`}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Post Update"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showCamera && (
          <CameraModal
            onClose={() => setShowCamera(false)}
            onCapture={(file) => {
              setSelectedFile(file);
              setFilePreview(URL.createObjectURL(file));
            }}
          />
        )}
      </motion.div>
    </Layout>
  );
};
export default status;
