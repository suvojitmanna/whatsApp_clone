import React, { useRef, useState } from 'react';
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { MdEventNote, MdOutlineLocationOn } from "react-icons/md";
import { FaRegFaceSmile } from 'react-icons/fa6';
import { FaVideo } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import useOutsideClick from '../hook/useOutsideClick';

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentTimeStr = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getDefaultEndTimeStr = () => {
  const d = new Date();
  d.setHours(d.getHours() + 1);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const EventModal = ({
  onClose,
  onSend,
  onCancelEvent,
  initialEvent = null,
  isEdit = false,
  theme,
}) => {
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [eventDate, setEventDate] = useState(initialEvent?.eventDate || getTodayStr());
  const [eventTime, setEventTime] = useState(initialEvent?.eventTime || getCurrentTimeStr());
  const [showEndTime, setShowEndTime] = useState(Boolean(initialEvent?.endDate || initialEvent?.endTime));
  const [endDate, setEndDate] = useState(initialEvent?.endDate || getTodayStr());
  const [endTime, setEndTime] = useState(initialEvent?.endTime || getDefaultEndTimeStr());
  const [location, setLocation] = useState(initialEvent?.location || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [hasCallLink, setHasCallLink] = useState(Boolean(initialEvent?.hasCallLink));
  const [activeEmojiTarget, setActiveEmojiTarget] = useState(null);
  const emojiPickerRef = useRef(null);
  const isDark = theme === "dark";

  const canSubmit = title.trim() !== "" && eventDate !== "";

  useOutsideClick(emojiPickerRef, (e) => {
    if (e?.target?.closest?.("button[data-emoji-trigger='true']")) {
      return;
    }
    if (activeEmojiTarget !== null) {
      setActiveEmojiTarget(null);
    }
  });

  const handleEmojiClick = (emojiData) => {
    if (!emojiData?.emoji) return;
    if (activeEmojiTarget === "question") {
      setTitle((prev) => prev + emojiData.emoji);
    } else if (activeEmojiTarget === "description") {
      setDescription((prev) => prev + emojiData.emoji);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSend({
      title: title.trim(),
      eventDate,
      eventTime,
      endDate: showEndTime ? endDate : null,
      endTime: showEndTime ? endTime : null,
      location: location.trim(),
      description: description.trim(),
      hasCallLink,
    });
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 relative ${isDark
          ? "bg-[#111b21] border-white/10 text-white"
          : "bg-white border-gray-200 text-gray-900"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {activeEmojiTarget && (
          <div
            ref={emojiPickerRef}
            className="absolute right-4 top-16 z-50 shadow-2xl rounded-2xl overflow-hidden border border-black/10 dark:border-white/10"
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={theme}
              lazyLoadEmojis={true}
              searchPlaceHolder="Search emoji..."
              width={300}
              height={360}
            />
          </div>
        )}

        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <MdEventNote className="text-emerald-500" size={22} />
            <h2 className="text-lg font-bold">{isEdit ? "Edit event" : "Create event"}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
            title="Close"
          >
            <RxCross2 size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3.5 max-h-[62vh] overflow-y-auto pr-1 custom-scrollbar">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Event Name *
            </label>

            <div className="relative mt-1.5">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event name"
                className={`w-full px-3.5 py-2.5 pr-11 rounded-xl border text-sm outline-none transition-all duration-200 ${isDark
                  ? "bg-[#202c33] border-white/10 text-white placeholder-gray-400 hover:border-white/25 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30"
                  }`}
                autoFocus
              />

              <button
                type="button"
                data-emoji-trigger="true"
                onClick={() =>
                  setActiveEmojiTarget((prev) =>
                    prev === "question" ? null : "question"
                  )
                }
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                title="Add emoji to event name"
              >
                <FaRegFaceSmile
                  className={`text-base transition-transform duration-200 ${activeEmojiTarget === "question"
                    ? "text-emerald-500 scale-110"
                    : isDark
                      ? "text-gray-400 hover:text-emerald-400 hover:scale-110"
                      : "text-gray-500 hover:text-emerald-600 hover:scale-110"
                    }`}
                />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
              Description
            </label>
            <div className="relative mt-1.5">
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description (optional)"
                className={`w-full px-3.5 py-2.5 pr-11 rounded-xl border text-sm outline-none resize-none transition-all duration-200 ${isDark
                  ? "bg-[#202c33] border-white/10 text-white placeholder-gray-400 hover:border-white/25 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30"
                  }`}
              />
              <button
                type="button"
                data-emoji-trigger="true"
                onClick={() =>
                  setActiveEmojiTarget((prev) =>
                    prev === "description" ? null : "description"
                  )
                }
                className="absolute right-2.5 top-3 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                title="Add emoji to description"
              >
                <FaRegFaceSmile
                  className={`text-base transition-transform duration-200 ${activeEmojiTarget === "description"
                    ? "text-emerald-500 scale-110"
                    : isDark
                      ? "text-gray-400 hover:text-emerald-400 hover:scale-110"
                      : "text-gray-500 hover:text-emerald-600 hover:scale-110"
                    }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                Start date*
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={`mt-1.5 w-full px-3 py-2 rounded-xl border text-sm outline-none cursor-pointer transition-all duration-200 ${isDark
                  ? "bg-[#202c33] border-white/10 text-white hover:border-white/25 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  : "bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30"
                  }`}
                title="Select start date"
              />
            </div>
            <div>
              <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                Start Time*
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className={`mt-1.5 w-full px-3 py-2 rounded-xl border text-sm outline-none cursor-pointer transition-all duration-200 ${isDark
                  ? "bg-[#202c33] border-white/10 text-white hover:border-white/25 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  : "bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30"
                  }`}
                title="Select start time"
              />
            </div>
          </div>

          {!showEndTime ? (
            <div>
              <button
                type="button"
                onClick={() => setShowEndTime(true)}
                className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer py-1 px-2 -ml-2 rounded-lg hover:bg-emerald-500/10"
                title="Add end date and time"
              >
                <span className="text-base leading-none font-bold">+</span>
                <span>Add end time</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in duration-200">
              <div>
                <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                  End date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`mt-1.5 w-full px-3 py-2 rounded-xl border text-sm outline-none cursor-pointer transition-all duration-200 ${isDark
                    ? "bg-[#202c33] border-white/10 text-white hover:border-white/25 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    : "bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30"
                    }`}
                  title="Select end date"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                    End Time
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEndTime(false)}
                    className="text-[11px] font-semibold text-red-500 hover:text-red-400 active:scale-95 transition-all cursor-pointer hover:underline"
                    title="Remove end time"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`mt-1.5 w-full px-3 py-2 rounded-xl border text-sm outline-none cursor-pointer transition-all duration-200 ${isDark
                    ? "bg-[#202c33] border-white/10 text-white hover:border-white/25 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    : "bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30"
                    }`}
                  title="Select end time"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
              Location
            </label>

            <div className="relative mt-1.5">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location (optional)"
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm outline-none transition-all duration-200 ${isDark
                  ? "bg-[#202c33] border-white/10 text-white placeholder-gray-500 hover:border-white/25 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30"
                  }`}
              />

              <MdOutlineLocationOn
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none transition-colors duration-200 ${isDark
                  ? "text-gray-400 group-hover:text-emerald-400"
                  : "text-gray-500 group-hover:text-emerald-600"
                  }`}
                title="Location"
              />
            </div>
          </div>

          <div
            className={`p-3 rounded-2xl border transition-all duration-200 hover:border-emerald-500/30 ${isDark
              ? "bg-[#202c33]/60 border-white/10"
              : "bg-gray-50 border-gray-200"
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${hasCallLink
                    ? "bg-emerald-500/20 text-emerald-400 scale-105"
                    : isDark
                      ? "bg-white/5 text-gray-400"
                      : "bg-gray-200 text-gray-500"
                    }`}
                >
                  <FaVideo size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight">WhatsApp call link</p>
                  <p className="text-[11px] opacity-60">
                    Add a voice or video call link
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={hasCallLink}
                onClick={() => setHasCallLink((prev) => !prev)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${hasCallLink ? "bg-emerald-500" : isDark ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                title={hasCallLink ? "Disable WhatsApp call link" : "Enable WhatsApp call link"}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${hasCallLink ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between pt-3 border-t border-black/10 dark:border-white/10">
          {isEdit ? (
            <button
              type="button"
              onClick={() => {
                if (onCancelEvent) {
                  onCancelEvent();
                }
              }}
              className="text-sm font-semibold text-red-500 hover:text-red-400 active:scale-95 py-2 px-3 rounded-xl hover:bg-red-500/10 transition-all cursor-pointer"
              title="Cancel this event"
            >
              Cancel event
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              title="Cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:opacity-40 transition-all shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 cursor-pointer"
              title={isEdit ? "Save changes" : "Create Event"}
            >
              {isEdit ? "Save changes" : "Create Event"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EventModal;