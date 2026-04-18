import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

const StatusPreview = ({
  contact,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onDelete,
  theme,
  currentUser,
  loading,
}) => {
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);

  const currentStatus = contact?.statuses?.[currentIndex];
  const isOwner = contact?.id === currentUser?._id;

  useEffect(() => {
    setProgress(0);

    let current = 0;

    const timer = setInterval(() => {
      current += 2;
      setProgress(current);

      if (current >= 100) {
        clearInterval(timer);
        onNext();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleViewersToggle = () => {
    setShowViewers(!showViewers);
  };

  const handleDeleteStatus = () => {
    if (onDelete && currentStatus?.id) {
      onDelete(currentStatus.id);
    }
    if (contact.statuses.length === 1) {
      onClose();
    } else {
      onPrev();
    }
  };

  if (!currentStatus) return null;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 h-full w-full bg-black bg-opacity-90 z-50 flex items-center
         justify-center `}
        style={{ backdropFilter: "blur(5px)" }}
        onClick={onClose}
      >
        <div
          className="relative w-full h-full max-w-4xl mx-auto flex justify-center items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`w-full h-full ${theme === "dark" ? "bg-[#202c33] " : "bg-gray-800 "} relative`}
          >
            <div className="absolute top-0 left-0 right-0 flex justify-between p-4 z-10 gap-1">
              {contact?.statuses.map((_, index) => (
                <div
                  className="h-1 bg-gray-400 bg-opacity-50 flex-1 rounded-full overflow-hidden"
                  key={index}
                >
                  <div
                    className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                    style={{
                      width:
                        index < currentIndex
                          ? "100%"
                          : index === currentIndex
                            ? `${progress}%`
                            : "0%",
                    }}
                  ></div>
                </div>
              ))}
            </div>

            <div className="absolute top-8 left-0 right-0 px-6 z-20 flex items-center justify-between">
              {/* Left Side: Profile & Info */}
              <div className="flex items-center gap-3">
                <img
                  src={contact?.avatar}
                  alt={contact?.name}
                  className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-md"
                />
                <div className="flex flex-col">
                  <p className="text-white font-medium leading-tight drop-shadow-md">
                    {contact?.name}
                  </p>
                  <p className="text-white/70 text-xs mt-0.5">
                    {formatTimestamp(currentStatus.timeStamp)}
                  </p>
                </div>
              </div>

              {/* Right Side: Action Group */}
              <div className="flex items-center gap-3">
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStatus();
                    }}
                    className="group p-2.5 flex items-center justify-center
                   bg-white/10 backdrop-blur-md border border-white/10
                   text-white/80 rounded-full transition-all duration-300
                   hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-500
                   active:scale-90 cursor-pointer"
                    title="Delete Status"
                  >
                    <FaTrash className="h-4 w-4 transition-transform group-hover:rotate-12" />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-2.5 flex items-center justify-center
                 text-white/90 bg-white/10 backdrop-blur-md border border-white/20 
                 rounded-full shadow-lg transition-all duration-300
                 hover:bg-white/20 hover:text-white hover:scale-110 active:scale-95 cursor-pointer"
                  aria-label="Close Preview"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="w-full h-full flex items-center justify-center">
              {currentStatus.contentType === "text" ? (
                <div className="text-white text-center p-8">
                  <p className="text-2xl font-medium">{currentStatus.media} </p>
                </div>
              ) : currentStatus.contentType === "image" ? (
                <img
                  src={currentStatus.media}
                  alt="image"
                  className="max-w-full max-h-full object-contain "
                />
              ) : currentStatus.contentType === "video" ? (
                <video
                  src={currentStatus.media}
                  lassName="max-w-full max-h-full object-contain "
                  controls
                  muted
                  autoPlay
                />
              ) : null}
            </div>

            {currentIndex > 0 && (
              <button
                onClick={onPrev}
                className="absolute top-1/2 left-4 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition -translate-y-1/2"
              >
                <FaChevronLeft className="h-5 w-5" />
              </button>
            )}
            {currentIndex < contact.statuses.length - 1 && (
              <button
                onClick={onNext}
                className="absolute top-1/2 right-4 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition -translate-y-1/2"
              >
                <FaChevronRight className="h-5 w-5" />
              </button>
            )}

            {isOwner && (
              <div className="absolute bottom-4 left-4 right-4 ">
                <button
                  onClick={handleViewersToggle}
                  className="flex items-center justify-between w-full text-white bg-black bg-opacity-50 rounded-lg px-4 py-2 hover:bg-opacity-70 transition-all"
                >
                  <div className="flex items-center space-x-2">
                    <FaEye className="w-4 h-4" />
                    <span>{currentStatus?.viewers.length} </span>
                  </div>
                  <FaChevronDown
                    className={`h-4 w-4 transition-transform cursor-pointer ${showViewers ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {showViewers && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 bg-black bg-opacity-70 rounded-lg p-4 max-h-40 overflow-y-auto"
                    >
                      {loading ? (
                        <p className="text-white text-center">
                          Loading Viewers
                        </p>
                      ) : currentStatus.viewers.length > 0 ? (
                        <div className="space-y-2">
                          {currentStatus?.viewers.map((viewer) => (
                            <div
                              key={viewer?.user?._id || viewer?._id}
                              className="flex items-center space-x-3"
                            >
                              <img
                                src={viewer?.user?.profilePicture}
                                alt={viewer?.user?.username}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <span className="text-white">
                                {viewer?.user?.username}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white text-center">No Viewers Yet</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StatusPreview;
