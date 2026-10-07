import React, { useState } from 'react'
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { MdEventNote } from "react-icons/md";

const EventModal = ({ onClose, onSend, theme }) => {
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const isDark = theme === "dark";

  const canSubmit = title.trim() !== "" && eventDate !== "";

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${isDark
          ? "bg-[#111b21] border-white/10 text-white"
          : "bg-white border-gray-200 text-gray-900"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <MdEventNote className="text-purple-500" size={22} />
            <h2 className="text-lg font-bold">Create event</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <RxCross2 size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
              Event Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Birthday Party, Team Catchup"
              className={`mt-1 w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${isDark
                ? "bg-[#202c33] border-white/10 focus:border-purple-500"
                : "bg-gray-50 border-gray-300 focus:border-purple-600"
                }`}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                Date *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={`mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none ${isDark
                  ? "bg-[#202c33] border-white/10 focus:border-purple-500"
                  : "bg-gray-50 border-gray-300 focus:border-purple-600"
                  }`}
              />
            </div>
            <div>
              <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                Time
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className={`mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none ${isDark
                  ? "bg-[#202c33] border-white/10 focus:border-purple-500"
                  : "bg-gray-50 border-gray-300 focus:border-purple-600"
                  }`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location (optional)"
              className={`mt-1 w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${isDark
                ? "bg-[#202c33] border-white/10 focus:border-purple-500"
                : "bg-gray-50 border-gray-300 focus:border-purple-600"
                }`}
            />
          </div>

          <div>
            <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description (optional)"
              className={`mt-1 w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none resize-none ${isDark
                ? "bg-[#202c33] border-white/10 focus:border-purple-500"
                : "bg-gray-50 border-gray-300 focus:border-purple-600"
                }`}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              onSend({ title, eventDate, eventTime, location, description })
            }
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 transition shadow-md shadow-purple-500/20 cursor-pointer"
          >
            Create Event
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EventModal