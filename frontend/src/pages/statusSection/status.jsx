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
    statuses,
    loading,
    error,
    fetchStatuses,
    createStatus,
    viewStatus,
    deleteStatus,
    getStatusViewer,
    getGroupStatus,
    getOtherStatuses,
    getUserStatuses,
    clearError,
    reset,
    initializeSocket,
    cleanupSocket,
  } = useStatusStore();

  const userStatuses = getUserStatuses(user?._id);
  const otherStatuses = getOtherStatuses(user?._id);
  console.log(statuses);
  useEffect(() => {
    fetchStatuses();
    initializeSocket();
    return () => {
      cleanupSocket();
    };
  }, [user?._id]);

  //clear the error When page is mounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, []);

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
        file: selectedFile,
      });
      setNewStatus("");
      setSelectedFile(null);
      setFilePreview(null);
      setShowCreateModal(false);
    } catch (error) {
      console.log("Error creating status", error);
    }
  };

  const handleViewStatus = async (statusId) => {
    try {
      await viewStatus(statusId);
    } catch (error) {
      console.log("error to status view", error);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId);
      setShowOption(false);
      handlePreviewClose();
    } catch (error) {
      console.log("Error to deleted status", error);
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

    if (contact.statuses[statusIndex]) {
      handleViewStatus(contact.statuses[statusIndex].id);
    }
  };

  const handlePreviewClose = () => {
    setPreviewContact(null);
    setCurrentStatusIndex(0);
  };

  return (
    <Layout
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
            theme={theme}
            currentUser={user}
            loading={loading}
          />
        )
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex flex-col min-h-screen transition-colors duration-500 ${
          theme === "dark"
            ? "bg-[#0b141a] text-gray-100"
            : "bg-slate-50 text-gray-900"
        }`}
      >
        {/* Header - Premium Glassmorphism */}
        <header
          className={`sticky top-0 z-20 backdrop-blur-xl border-b transition-all ${
            theme === "dark"
              ? "bg-[#111b21]/70 border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
              : "bg-white/70 border-gray-200 shadow-sm"
          } p-5`}
        >
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <h2 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-400">
              Status
            </h2>
            <div className="flex gap-4"></div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto w-full px-4 pb-24">
          {/* Error Toast - Animated */}
          {error && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-4 bg-red-500/10 border border-red-500/20 backdrop-blur-md text-red-500 p-4 rounded-2xl flex justify-between items-center shadow-lg"
            >
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={clearError}
                className="p-2 hover:bg-red-500/20 rounded-full transition-colors"
              >
                <RxCross2 className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {/* User Status Section - Card Style */}
          <section
            className={`mt-6 rounded-3xl shadow-xl border transition-all hover:shadow-2xl ${
              theme === "dark"
                ? "bg-[#111b21] border-white/5"
                : "bg-white border-gray-100"
            } p-5`}
          >
            <div className="flex items-center space-x-5">
              <div
                className="relative flex-shrink-0 cursor-pointer group"
                onClick={() =>
                  userStatuses
                    ? handleStatusPreview(userStatuses)
                    : setShowCreateModal(true)
                }
              >
                <div
                  className={`p-[3px] rounded-full bg-gradient-to-tr shadow-lg`}
                >
                  <img
                    className={`w-16 h-16 rounded-full object-cover border-2 transition-transform group-hover:scale-95 ${
                      theme === "dark" ? "border-[#111b21]" : "border-white"
                    }`}
                    src={user?.profilePicture}
                    alt={user?.username}
                  />
                </div>

                {userStatuses && (
                  <svg
                    className="absolute -top-1 -left-1 w-[72px] h-[72px] pointer-events-none"
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
                          strokeWidth="3.5"
                          strokeDasharray={`${segmentLength - 4} 4`}
                          strokeDashoffset={-(index * segmentLength)}
                          transform={`rotate(-90 50 50)`}
                        />
                      );
                    })}
                  </svg>
                )}

                <button
                  className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full border-4 border-[#0b141a] dark:border-[#111b21] hover:scale-110 active:scale-90 transition-all shadow-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateModal(true);
                  }}
                >
                  <FaPlus className="h-3 w-3 cursor-pointer" />
                </button>
              </div>

              <div className="flex-1">
                <h4 className="font-extrabold text-lg tracking-tight">
                  My Status
                </h4>
                <p
                  className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                >
                  {userStatuses
                    ? `${userStatuses.statuses.length} updates • ${formatTimestamp(
                        userStatuses.statuses[userStatuses.statuses.length - 1]
                          .timeStamp,
                      )}`
                    : "Tap to share your moment"}
                </p>
              </div>

              {userStatuses && (
                <button
                  onClick={() => setShowOption(!showOption)}
                  className="p-3 rounded-2xl hover:bg-gray-500/10 active:bg-gray-500/20 transition-all cursor-pointer"
                >
                  <FaEllipsisH
                    className={
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }
                  />
                </button>
              )}
            </div>

            {/* Floating Options Menu - Improved Grid */}
            {showOption && userStatuses && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className={`mt-5 border-t pt-4 grid grid-cols-2 gap-3 ${theme === "dark" ? "border-white/5" : "border-gray-100"}`}
              >
                <button
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500/10 text-green-500 font-bold text-sm transition-all hover:bg-green-500/20"
                  onClick={() => {
                    setShowCreateModal(true);
                    setShowOption(false);
                  }}
                >
                  <FaCamera size={14} /> Add New
                </button>
                <button
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-500/10 text-blue-500 font-bold text-sm transition-all hover:bg-blue-500/20"
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

          {/* Others' Updates Section */}
          <div className="mt-12">
            {/* 🔥 Section Header */}
            <div className="flex items-center justify-between px-2 mb-4">
              <h3
                className={`text-[11px] font-black uppercase tracking-[0.25em] ${
                  theme === "dark" ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Recent Updates
              </h3>

              {/* subtle line */}
              <div className="flex-1 h-[1px] ml-3 bg-gradient-to-r from-transparent via-gray-500/20 to-transparent" />
            </div>

            {/* 🔄 Loading */}
            {loading ? (
              <div className="flex flex-col items-center py-24">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-4 border-green-500/20" />
                  <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-t-green-500 animate-spin" />
                </div>

                <p className="text-xs font-bold uppercase tracking-widest opacity-40 mt-4">
                  Syncing updates...
                </p>
              </div>
            ) : otherStatuses.length > 0 ? (
              /* 📦 Status List Container */
              <div
                className={`rounded-[2.5rem] overflow-hidden border shadow-2xl backdrop-blur-xl transition-all ${
                  theme === "dark"
                    ? "bg-[#111b21]/80 border-white/5"
                    : "bg-white/80 border-gray-100"
                }`}
              >
                {/* soft glow */}
                <div className="absolute inset-0 pointer-events-none rounded-[2.5rem] ring-1 ring-white/5" />

                {otherStatuses.map((contact, index) => (
                  <div
                    key={contact.id}
                    className={`transition-all duration-300 ${
                      index !== otherStatuses.length - 1
                        ? "border-b border-white/5"
                        : ""
                    } hover:bg-white/5`}
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
              /* 😶 Empty State */
              <div className="text-center py-24 px-6 rounded-[2.5rem] border border-dashed backdrop-blur-md bg-black/5 dark:bg-white/5 dark:border-white/10 border-gray-300 transition-all">
                <div className="text-6xl mb-5 opacity-20 animate-pulse">✨</div>

                <h3 className="text-lg font-bold opacity-70 mb-2">
                  No Updates Yet
                </h3>

                <p className="text-sm opacity-50 max-w-xs mx-auto leading-relaxed">
                  When your contacts share something, it will appear here
                  beautifully.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Create Status Modal - Responsive Premium UI */}
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
              {/* Mobile Handle */}
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
                    <RxCross2 className="w-6 h-6" />
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

                  {/* Action Buttons - Responsive Stack */}
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
