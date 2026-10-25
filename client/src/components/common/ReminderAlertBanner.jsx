import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdOutlineAlarm, MdClose, MdNorthWest } from "react-icons/md";
import useReminderStore from "../../store/useReminderStore";
import { useChatStore } from "../../store/chatStore";
import useLayoutStore from "../../store/layoutStore";

export const ReminderAlertBanner = () => {
  const activeAlert = useReminderStore((state) => state.activeAlert);
  const dismissReminder = useReminderStore((state) => state.dismissReminder);
  const snoozeReminder = useReminderStore((state) => state.snoozeReminder);

  if (!activeAlert) return null;

  const handleJumpToMessage = () => {
    const { conversationId, messageId } = activeAlert;
    const chatStore = useChatStore.getState();
    const layoutStore = useLayoutStore.getState();
    const currentConv = chatStore.currentConversation || chatStore.selectedContact;
    const currentConvId = currentConv?._id || currentConv?.id;

    if (conversationId && currentConvId !== conversationId) {
      const allConvs = chatStore.conversations || [];
      const targetConv = allConvs.find(
        (c) => c._id === conversationId || c.id === conversationId
      );
      if (targetConv) {
        layoutStore.setSelectedContact(targetConv);
        chatStore.setSelectedContact?.(targetConv);
      }
    }

    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("jump_to_message", {
          detail: { messageId },
        })
      );
    }, 250);

    dismissReminder(activeAlert.id);
  };

  return (
    <AnimatePresence>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-[520px]">
        <motion.div
          initial={{ opacity: 0, y: -25, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -25, scale: 0.95 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-[#00a884] to-teal-600 text-white shadow-[0_14px_40px_-8px_rgba(5,150,105,0.5),0_6px_20px_rgba(0,0,0,0.3)] backdrop-blur-md border border-emerald-300/40 select-none overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white text-xl font-bold border border-white/25 shadow-inner">
            <span className="absolute inset-0 rounded-full bg-emerald-300 animate-ping opacity-60" />
            <MdOutlineAlarm className="relative z-10" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-950/40 text-emerald-100 border border-emerald-300/30 px-2.5 py-0.5 rounded-full shadow-2xs">
                ⏰ Reminder
              </span>
              <span className="text-xs font-semibold truncate text-emerald-100/95">
                {activeAlert.contactName}
              </span>
            </div>

            <p className="text-[13.5px] font-medium leading-tight truncate mt-1 text-white drop-shadow-2xs">
              {activeAlert.note || activeAlert.contentSnippet}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 z-10">
            <button
              type="button"
              onClick={handleJumpToMessage}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <span>View</span>
              <MdNorthWest className="rotate-45 text-emerald-700" size={13} />
            </button>

            <button
              type="button"
              onClick={() => snoozeReminder(activeAlert.id, 10)}
              className="px-2.5 py-1.5 rounded-full bg-black/20 hover:bg-black/30 border border-white/20 text-white text-xs font-semibold active:scale-95 transition-all cursor-pointer"
              title="Snooze for 10 minutes"
            >
              +10m
            </button>

            <button
              type="button"
              onClick={() => dismissReminder(activeAlert.id)}
              className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Dismiss"
            >
              <MdClose size={17} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReminderAlertBanner;
