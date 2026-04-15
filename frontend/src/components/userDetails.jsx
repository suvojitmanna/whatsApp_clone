import React, { useEffect, useRef, useState } from "react";
import useUserStore from "../store/useUserStore";
import useThemeStore from "../store/themeStore";
import { updateUserProfile } from "../services/url.services";
import { toast } from "react-toastify";
import Layout from "../components/layout";
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
import useOutsideClick from "../hook/useOutsideClick";

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
    if (user) {
      setName(user.username || "");
      setAbout(user.about || "");
    }
  }, [user]);

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
        setIsEditingName(false);
        setShowNameEmoji(false);
      } else if (field === "about") {
        formData.append("about", about);
        setIsEditingAbout(false);
        setShowAboutEmoji(false);
      }
      if (profilePicture && field === "profile") {
        formData.append("media", profilePicture);
      }
      const updated = await updateUserProfile(formData);
      setUser(updated?.data);
      setProfilePicture(null);
      setPreview(null);
      toast.success("Profile Updated");
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to Update Profile");
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`w-full min-h-screen flex flex-col items-center transition-all duration-500 ${
          theme === "dark"
            ? "bg-gradient-to-br from-[#0b141a] via-[#0f1f25] to-[#0b141a] text-gray-100"
            : "bg-gradient-to-br from-[#f0f2f5] via-white to-[#f0f2f5] text-gray-900"
        }`}
      >
        {/* Header */}
        <div className="w-full px-8 py-2 max-w-2xl">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">
            Profile Settings
          </h1>
        </div>

        <div className="w-full max-w-2xl px-6 pb-20 space-y-8">
          {/* Profile Image */}
          <section className="flex flex-col items-center px-8 py-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition"></div>

              <img
                src={preview || user?.profilePicture}
                className="w-40 h-40 rounded-full object-cover relative border-4 border-white/20"
              />

              <label
                htmlFor="profileUpload"
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                <FaCamera className="text-white text-xl" />
                <input
                  type="file"
                  id="profileUpload"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            <AnimatePresence>
              {preview && (
                <motion.div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleSave("profile")}
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:scale-105 transition"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setProfilePicture(null);
                      setPreview(null);
                    }}
                    className="px-6 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur hover:bg-white/20"
                  >
                    Discard
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* FORM */}
          <div className="grid gap-3">
            {/* EMAIL / PHONE SECTION */}
            {/* EMAIL FIELD */}
            {user?.email && (
              <div
                className={`group rounded-2xl px-4 py-6 backdrop-blur-xl border transition-all ${
                  theme === "dark"
                    ? "bg-white/5 border-white/10 hover:border-blue-400/40"
                    : "bg-white/70 border-gray-200 hover:border-blue-400/40"
                } shadow-lg`}
              >
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                    Email Address
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      Verified
                    </span>
                    {/* The lock icon added to show it's non-editable */}
                    <FaLock className="text-blue-500/40 size-2.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex-grow flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`}
                    >
                      <FaEnvelope className="text-gray-400 size-4" />
                    </div>
                    <p className="text-lg font-medium opacity-90">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PHONE FIELD */}
            {user?.phoneNumber && (
              <div
                className={`group rounded-2xl px-4 py-6 backdrop-blur-xl border transition-all ${
                  theme === "dark"
                    ? "bg-white/5 border-white/10 hover:border-emerald-400/40"
                    : "bg-white/70 border-gray-200 hover:border-emerald-400/40"
                } shadow-lg`}
              >
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
                    Phone Number
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Primary
                    </span>
                    {/* Matched the lock color to the emerald theme for a cleaner look */}
                    <FaLock className="text-emerald-500/30 size-2.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex-grow flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`}
                    >
                      <FaPhone className="text-gray-400 size-4" />
                    </div>
                    <p className="text-lg font-medium opacity-90">
                      {user.phoneNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* NAME */}
            <div
              className={`group rounded-2xl px-4 py-6 backdrop-blur-xl border transition-all ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 hover:border-green-400/40"
                  : "bg-white/70 border-gray-200 hover:border-green-400/40"
              } shadow-lg`}
            >
              <label className="text-xs font-bold text-green-500 uppercase tracking-widest">
                Your Name
              </label>

              <div
                ref={nameWrapperRef}
                className="flex items-center justify-between mt-3"
              >
                <div className="flex-grow">
                  {isEditingName ? (
                    <div ref={inputPickerRef} className="relative">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent border-b border-gray-400 focus:border-green-500 outline-none text-lg"
                      />
                    </div>
                  ) : (
                    <p className="text-lg font-medium truncate">
                      {user?.username || name || "Add your name"}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-3">
                  {isEditingName ? (
                    <>
                      <button onClick={() => setShowNameEmoji(!showNameEmoji)}>
                        <FaSmile className="text-green-500 cursor-pointer" />
                      </button>
                      <button onClick={() => handleSave("name")}>
                        <FaCheck className="text-green-500 cursor-pointer" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingName(false);
                          setShowNameEmoji(false);
                        }}
                      >
                        <MdCancel className="cursor-pointer" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                    >
                      <FaPencil className="text-gray-400 cursor-pointer" />
                    </button>
                  )}
                </div>
              </div>

              {/* Emoji Picker (FIXED MOBILE) */}
              {showNameEmoji && (
                <div
                  ref={emojiPickerRef}
                  className="fixed bottom-0 left-0 w-full z-50 bg-white dark:bg-[#1f2c34] rounded-t-2xl shadow-2xl p-2"
                >
                  <EmojiPicker
                    theme={theme === "dark" ? "dark" : "light"}
                    onEmojiClick={(emoji) => handleEmojiSelect(emoji, "name")}
                  />
                </div>
              )}
            </div>

            {/* ABOUT */}
            <div
              className={`group rounded-2xl px-4 py-6 backdrop-blur-xl border transition-all ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 hover:border-green-400/40"
                  : "bg-white/70 border-gray-200 hover:border-green-400/40"
              } shadow-lg`}
            >
              <label className="text-xs font-bold text-green-500 uppercase tracking-widest">
                About
              </label>

              <div
                ref={aboutWrapperRef}
                className="flex items-center justify-between mt-3"
              >
                <div className="flex-grow">
                  {isEditingAbout ? (
                    <input
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      className="w-full bg-transparent border-b border-gray-400 focus:border-green-500 outline-none text-lg"
                    />
                  ) : (
                    <p className="italic opacity-80">
                      {user?.about ||
                        about ||
                        "Hey there! I am using this app."}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-3">
                  {isEditingAbout ? (
                    <>
                      <button
                        onClick={() => setShowAboutEmoji(!showAboutEmoji)}
                      >
                        <FaSmile className="text-green-500 cursor-pointer" />
                      </button>
                      <button onClick={() => handleSave("about")}>
                        <FaCheck className="text-green-500 cursor-pointer" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingAbout(false);
                          setShowAboutEmoji(false);
                        }}
                      >
                        <MdCancel className="cursor-pointer" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditingAbout(true)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                    >
                      <FaPencil className="text-gray-400 cursor-pointer" />
                    </button>
                  )}
                </div>
              </div>

              {/* Emoji Picker FIX */}
              {showAboutEmoji && (
                <div
                  ref={emojiPickerRef}
                  className="fixed bottom-0 left-0 w-full z-50 bg-white dark:bg-[#1f2c34] rounded-t-2xl shadow-2xl p-2"
                >
                  <EmojiPicker
                    theme={theme === "dark" ? "dark" : "light"}
                    onEmojiClick={(emoji) => handleEmojiSelect(emoji, "about")}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default userDetails;
