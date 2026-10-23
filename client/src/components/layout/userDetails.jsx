import React, { useEffect, useRef, useState } from "react";
import useUserStore from "../../store/useUserStore";
import useThemeStore from "../../store/themeStore";
import { updateUserProfile } from "../../services/url.services";
import { toast } from "react-toastify";
import Layout from "../../components/layout";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaCamera,
  FaCheck,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaSmile,
} from "react-icons/fa";
import { FaPencil } from "react-icons/fa6";
import { MdCancel } from "react-icons/md";
import EmojiPicker from "emoji-picker-react";
import useOutsideClick from "../../hook/useOutsideClick";

const userDetails = () => {
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [showNameEmoji, setShowNameEmoji] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [showAboutEmoji, setShowAboutEmoji] = useState(false);
  const { user, setUser } = useUserStore();
  const { theme } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const emojiPickerRef = useRef(null);
  const inputPickerRef = useRef(null);
  const nameWrapperRef = useRef(null);
  const aboutWrapperRef = useRef(null);

  useEffect(() => {
    setAbout(user?.about || "Hey there! I am using WhatsApp.");
    setName(user?.username || "");
  }, [user?.about, user?.username]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (field) => {
    try {
      setLoading(true);
      const formData = new FormData();
      if (field === "name") {
        formData.append("username", name);
      }

      if (field === "about") {
        formData.append("about", about);
      }

      if (profilePicture && field === "profile") {
        formData.append("media", profilePicture);
      }

      const updated = await updateUserProfile(formData);
      const updatedUser = updated?.data?.data?.user;

      if (!updatedUser) {
        throw new Error("Updated user not found in response");
      }
      setUser(updatedUser);
      if (field === "about") {
        setAbout(updatedUser.about || "");
        setIsEditingAbout(false);
        setShowAboutEmoji(false);
      }

      if (field === "name") {
        setName(updatedUser.username || "");
        setIsEditingName(false);
        setShowNameEmoji(false);
      }

      setProfilePicture(null);
      setPreview(null);

      toast.success("Profile Updated");
    } catch (error) {
      console.error("PROFILE UPDATE ERROR:", error);
      toast.error("Failed to Update Profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEmojiSelect = (emoji, fileld) => {
    if (fileld === "name") {
      setName((prev) => prev + emoji.emoji);
      setShowNameEmoji(false);
    } else {
      setAbout((prev) => prev + emoji.emoji);
      setShowAboutEmoji(false);
    }
  };

  useOutsideClick(emojiPickerRef, () => {
    if (showNameEmoji) setShowNameEmoji(false);
    if (showAboutEmoji) setShowAboutEmoji(false);
  });

  useOutsideClick(nameWrapperRef, () => {
    if (isEditingName) setIsEditingName(false);
  });

  useOutsideClick(aboutWrapperRef, () => {
    if (isEditingAbout) setIsEditingAbout(false);
  });

  console.log(user.data);
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`h-full w-full flex flex-col overflow-hidden border-r relative z-10 transition-colors duration-300 ${theme === "dark"
          ? "bg-[#111b21] border-gray-700/60 text-white"
          : "bg-white border-gray-200 text-gray-900"
          }`}
      >
        <header
          className={`h-[60px] px-4 flex items-center justify-between border-b shrink-0 transition-colors duration-300 ${theme === "dark"
            ? "bg-[#111b21] border-gray-700/50 text-white"
            : "bg-white border-gray-200 text-gray-900"
            }`}
        >
          <h2 className="text-xl font-semibold">Profile</h2>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5 space-y-5">
          <div className="flex flex-col items-center py-2">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500/30 shadow-lg relative">
                <img
                  src={preview || user?.profilePicture || "/default-avatar.png"}
                  alt={user?.username}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <label
                htmlFor="profileUpload"
                className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-white"
              >
                <FaCamera className="text-xl mb-1" />
                <span className="text-[11px] font-medium uppercase tracking-wider">
                  Change Photo
                </span>
                <input
                  type="file"
                  id="profileUpload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              <label
                htmlFor="profileUpload"
                className="absolute bottom-0 right-0 bg-emerald-500 text-white p-2.5 rounded-full border-2 border-white dark:border-[#111b21] shadow-md hover:bg-emerald-600 transition-colors cursor-pointer"
                title="Change Photo"
              >
                <FaCamera size={13} />
              </label>
            </div>

            <AnimatePresence>
              {preview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex gap-2 mt-4"
                >
                  <button
                    onClick={() => handleSave("profile")}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save Photo"}
                  </button>
                  <button
                    onClick={() => {
                      setProfilePicture(null);
                      setPreview(null);
                    }}
                    className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-all active:scale-95 cursor-pointer ${theme === "dark"
                      ? "border-gray-700 bg-white/5 hover:bg-white/10 text-gray-300"
                      : "border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                  >
                    Discard
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            className={`rounded-2xl p-4 border transition-all duration-200 hover:border-emerald-500/40 ${theme === "dark"
              ? "bg-[#111b21] border-gray-700/50"
              : "bg-gray-50/80 border-gray-200/80"
              }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                Your Name
              </label>
            </div>

            <div ref={nameWrapperRef} className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-2">
                  {isEditingName ? (
                    <input
                      ref={inputPickerRef}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={30}
                      placeholder="Your name"
                      autoFocus
                      className={`w-full bg-transparent border-b-2 border-emerald-500 hover:border-emerald-400 focus:border-emerald-500 py-1 outline-none text-base font-medium transition-colors ${theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                    />
                  ) : (
                    <p className="text-base font-medium truncate py-1">
                      {user?.username || name || "Add your name"}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isEditingName ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowNameEmoji(!showNameEmoji)}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-emerald-500 transition-colors cursor-pointer"
                        title="Emoji"
                      >
                        <FaSmile size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave("name")}
                        className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-500 transition-colors cursor-pointer"
                        title="Save"
                      >
                        <FaCheck size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setName(user?.username || "");
                          setIsEditingName(false);
                          setShowNameEmoji(false);
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        <MdCancel size={17} />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-emerald-500 transition-colors cursor-pointer"
                      title="Edit Name"
                    >
                      <FaPencil size={14} />
                    </button>
                  )}
                </div>
              </div>

              {showNameEmoji && (
                <div
                  ref={emojiPickerRef}
                  className="absolute left-0 top-full mt-2 z-50 shadow-2xl rounded-2xl overflow-hidden"
                >
                  <EmojiPicker
                    theme={theme === "dark" ? "dark" : "light"}
                    width={280}
                    height={350}
                    onEmojiClick={(emoji) => handleEmojiSelect(emoji, "name")}
                  />
                </div>
              )}
            </div>

            <p
              className={`text-[11px] mt-2 leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
            >
              This is not your username or pin. This name will be visible to
              your WhatsApp contacts.
            </p>
          </div>

          <div
            className={`rounded-2xl p-4 border transition-all duration-200 hover:border-emerald-500/40 ${theme === "dark"
              ? "bg-[#111b21] border-gray-700/50"
              : "bg-gray-50/80 border-gray-200/80"
              }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                About
              </label>
            </div>

            <div ref={aboutWrapperRef} className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-2">
                  {isEditingAbout ? (
                    <input
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      maxLength={100}
                      placeholder="About"
                      autoFocus
                      className={`w-full bg-transparent border-b-2 border-emerald-500 hover:border-emerald-400 focus:border-emerald-500 py-1 outline-none text-base font-medium transition-colors ${theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                    />
                  ) : (
                    <p className="text-sm font-normal italic opacity-90 truncate py-1">
                      {user?.about ||
                        about ||
                        "Hey there! I am using WhatsApp."}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isEditingAbout ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowAboutEmoji(!showAboutEmoji)}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-emerald-500 transition-colors cursor-pointer"
                        title="Emoji"
                      >
                        <FaSmile size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave("about")}
                        className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-500 transition-colors cursor-pointer"
                        title="Save"
                      >
                        <FaCheck size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAbout(
                            user?.about || "Hey there! I am using WhatsApp.",
                          );
                          setIsEditingAbout(false);
                          setShowAboutEmoji(false);
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        <MdCancel size={17} />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingAbout(true)}
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-emerald-500 transition-colors cursor-pointer"
                      title="Edit About"
                    >
                      <FaPencil size={14} />
                    </button>
                  )}
                </div>
              </div>

              {showAboutEmoji && (
                <div
                  ref={emojiPickerRef}
                  className="absolute left-0 top-full mt-2 z-50 shadow-2xl rounded-2xl overflow-hidden"
                >
                  <EmojiPicker
                    theme={theme === "dark" ? "dark" : "light"}
                    width={280}
                    height={350}
                    onEmojiClick={(emoji) => handleEmojiSelect(emoji, "about")}
                  />
                </div>
              )}
            </div>
          </div>

          {user?.email && (
            <div
              className={`rounded-2xl p-4 border transition-all ${theme === "dark"
                ? "bg-[#111b21] border-gray-700/50"
                : "bg-gray-50/80 border-gray-200/80"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="flex items-center gap-1.5 text-blue-500 text-[11px] font-medium">
                  <FaLock size={10} />
                  <span>Verified</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 ${theme === "dark" ? "bg-white/5" : "bg-gray-200/60"
                    }`}
                >
                  <FaEnvelope className="text-blue-500 size-4" />
                </div>
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
            </div>
          )}

          {user?.phoneNumber && (
            <div
              className={`rounded-2xl p-4 border transition-all ${theme === "dark"
                ? "bg-[#111b21] border-gray-700/50"
                : "bg-gray-50/80 border-gray-200/80"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="flex items-center gap-1.5 text-emerald-500 text-[11px] font-medium">
                  <FaLock size={10} />
                  <span>Primary</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 ${theme === "dark" ? "bg-white/5" : "bg-gray-200/60"
                    }`}
                >
                  <FaPhone className="text-emerald-500 size-4" />
                </div>
                <p className="text-sm font-medium truncate">
                  {user.phoneNumber}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </Layout>
  );
};

export default userDetails;
