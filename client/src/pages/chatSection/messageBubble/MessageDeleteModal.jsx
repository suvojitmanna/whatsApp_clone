import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast } from "react-toastify";

export const MessageDeleteModal = ({
  deleteModal,
  setDeleteModal,
  deleteMessage,
  isDark,
}) => {
  if (!deleteModal) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[999999] flex items-center justify-center p-4"
        onClick={(e) => {
          e.stopPropagation();
          setDeleteModal(null);
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{
            type: "spring",
            damping: 24,
            stiffness: 300,
          }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-[340px] overflow-hidden rounded-[28px] border p-6 shadow-2xl ${isDark
            ? "border-white/[0.08] bg-zinc-900/95 text-white shadow-black/80 backdrop-blur-xl"
            : "border-black/[0.06] bg-white/95 text-zinc-900 shadow-zinc-300/50 backdrop-blur-xl"
            }`}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark
                ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
                : "bg-red-50 text-red-500 ring-1 ring-red-100"
                }`}
            >
              <RiDeleteBin6Line size={26} />
            </div>

            <h3 className="text-lg font-bold tracking-tight">
              Delete message?
            </h3>

            <p
              className={`mt-1.5 text-xs leading-relaxed max-w-[240px] ${isDark ? "text-zinc-400" : "text-zinc-500"
                }`}
            >
              Choose how you would like to delete this message.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            {deleteModal.isUserMessage &&
              !deleteModal.deletedForEveryone && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await deleteMessage(deleteModal._id, "everyone");
                      toast.success("Message deleted for everyone");
                    } catch (error) {
                      toast.error("Failed to delete message");
                    } finally {
                      setDeleteModal(null);
                    }
                  }}
                  className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 font-semibold transition-all duration-300 cursor-pointer ${isDark
                    ? "border-red-400/10 bg-gradient-to-r from-red-500/90 to-rose-600/90 text-white shadow-lg shadow-red-500/10 hover:border-red-300/20 hover:from-red-500 hover:to-rose-500 hover:shadow-xl hover:shadow-red-500/20"
                    : "border-red-500/10 bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20 hover:from-red-600 hover:to-rose-500 hover:shadow-xl hover:shadow-red-500/25"
                    }`}
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  <span className="relative z-10 flex items-center justify-center gap-2.5">
                    <RiDeleteBin6Line size={17} />
                    <span>Delete for everyone</span>
                  </span>
                </motion.button>
              )}

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await deleteMessage(deleteModal._id, "me");
                  toast.success("Message deleted for me");
                } catch (error) {
                  toast.error("Failed to delete message");
                } finally {
                  setDeleteModal(null);
                }
              }}
              className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 font-semibold transition-all duration-300 cursor-pointer ${isDark
                ? "border-white/[0.08] bg-gradient-to-r from-zinc-800/90 to-zinc-900/90 text-zinc-100 shadow-lg shadow-black/10 hover:border-emerald-400/20 hover:from-zinc-700/90 hover:to-zinc-800/90 hover:text-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5"
                : "border-black/[0.06] bg-gradient-to-r from-zinc-100 to-white text-zinc-800 shadow-md shadow-black/5 hover:border-emerald-500/20 hover:from-emerald-50 hover:to-white hover:text-emerald-700 hover:shadow-lg"
                }`}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              <span className="relative z-10 flex items-center justify-center gap-2.5">
                <RiDeleteBin6Line
                  size={17}
                  className="transition-transform duration-300 group-hover:scale-110"
                />
                <span>Delete for me</span>
              </span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal(null);
              }}
              className={`mt-1 w-full rounded-2xl border py-3 text-sm font-medium transition-all duration-300 cursor-pointer ${isDark
                ? "border-transparent text-zinc-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"
                : "border-transparent text-zinc-500 hover:border-black/[0.05] hover:bg-black/[0.03] hover:text-zinc-900"
                }`}
            >
              Cancel
            </motion.button>
          </div>

          <div
            className={`mt-5 text-center text-[11px] ${isDark ? "text-zinc-600" : "text-zinc-400"
              }`}
          >
            Deleted messages cannot be recovered
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default MessageDeleteModal;
