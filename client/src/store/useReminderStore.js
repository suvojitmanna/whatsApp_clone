import { create } from "zustand";

const STORAGE_KEY = "whatsapp_reminders_v1";

export const playReminderChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.22, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.14);
    gain2.gain.setValueAtTime(0.28, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.65);
  } catch (e) {
    console.warn("Could not play chime:", e);
  }
};

const loadInitialReminders = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveRemindersToStorage = (reminders) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch (e) {
    console.error("Failed to save reminders:", e);
  }
};

export const useReminderStore = create((set, get) => ({
  reminders: loadInitialReminders(),
  activeAlert: null,

  addReminder: ({
    message,
    remindAt,
    note = "",
    contactName = "Chat",
    conversationId,
  }) => {
    const id =
      "rem_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const snippet = message.content
      ? message.content.length > 70
        ? message.content.substring(0, 70) + "..."
        : message.content
      : `[${message.contentType || "Media"}]`;

    const newReminder = {
      id,
      messageId: message._id,
      conversationId: conversationId || message.conversation,
      contactName,
      senderName: message.sender?.username || "Someone",
      contentSnippet: snippet,
      note: note.trim(),
      remindAt: new Date(remindAt).getTime(),
      status: "pending",
      createdAt: Date.now(),
    };

    const updated = [...get().reminders, newReminder];
    set({ reminders: updated });
    saveRemindersToStorage(updated);
    return newReminder;
  },

  dismissReminder: (id) => {
    const updated = get().reminders.map((r) =>
      r.id === id ? { ...r, status: "dismissed" } : r,
    );
    set((state) => ({
      reminders: updated,
      activeAlert: state.activeAlert?.id === id ? null : state.activeAlert,
    }));
    saveRemindersToStorage(updated);
  },

  snoozeReminder: (id, minutes = 10) => {
    const newTime = Date.now() + minutes * 60 * 1000;
    const updated = get().reminders.map((r) =>
      r.id === id ? { ...r, remindAt: newTime, status: "pending" } : r,
    );
    set((state) => ({
      reminders: updated,
      activeAlert: state.activeAlert?.id === id ? null : state.activeAlert,
    }));
    saveRemindersToStorage(updated);
  },

  removeReminder: (id) => {
    const updated = get().reminders.filter((r) => r.id !== id);
    set((state) => ({
      reminders: updated,
      activeAlert: state.activeAlert?.id === id ? null : state.activeAlert,
    }));
    saveRemindersToStorage(updated);
  },

  setActiveAlert: (alert) => set({ activeAlert: alert }),

  checkDueReminders: () => {
    const now = Date.now();
    const { reminders, activeAlert } = get();
    let triggeredAny = false;

    const updated = reminders.map((r) => {
      if (r.status === "pending" && r.remindAt <= now) {
        triggeredAny = true;
        return { ...r, status: "triggered" };
      }
      return r;
    });

    if (triggeredAny) {
      const due = updated.find(
        (r) =>
          r.status === "triggered" && (!activeAlert || activeAlert.id !== r.id),
      );
      set({ reminders: updated });
      saveRemindersToStorage(updated);

      if (due) {
        set({ activeAlert: due });
        playReminderChime();
      }
    }
  },
}));

if (typeof window !== "undefined") {
  setInterval(() => {
    useReminderStore.getState().checkDueReminders();
  }, 2000);
}

export default useReminderStore;
