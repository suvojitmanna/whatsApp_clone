import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_CALL_HISTORY = [];
export const DEFAULT_FAVOURITES = [];
export const SEED_FAVOURITE_CANDIDATES = [];

export const isDummyCall = (call) => {
  if (!call) return false;
  const id = String(call.id || "");
  const contactId = String(call.contactId || "");
  const name = String(call.contactName || "")
    .toLowerCase()
    .trim();
  return (
    id.startsWith("call-seed-") ||
    id.startsWith("seed-") ||
    id.includes("seed") ||
    contactId.startsWith("seed-") ||
    name === "priyanshu manna" ||
    name === "anirban ghosh" ||
    name === "suman roy" ||
    name === "rohan debnath" ||
    name === "debojyoti sen" ||
    name === "sneha mukherjee"
  );
};

export const isDummyFavourite = (fav) => {
  if (!fav) return false;
  const id = String(fav.id || fav._id || fav.contactId || "");
  const name = String(fav.username || fav.name || "")
    .toLowerCase()
    .trim();
  return (
    id.startsWith("fav-") ||
    id.startsWith("seed-") ||
    id.includes("seed") ||
    name === "priyanshu manna" ||
    name === "anirban ghosh" ||
    name === "suman roy" ||
    name === "rohan debnath" ||
    name === "debojyoti sen" ||
    name === "sneha mukherjee" ||
    fav.avatarType === "amazon" ||
    fav.avatarType === "flipkart" ||
    fav.avatarType === "prime" ||
    fav.avatarType === "hostel" ||
    fav.avatarType === "lme"
  );
};

if (typeof window !== "undefined" && window.localStorage) {
  try {
    const raw = window.localStorage.getItem("whatsapp-call-storage");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state) {
        let changed = false;
        if (Array.isArray(parsed.state.callHistory)) {
          const filteredCalls = parsed.state.callHistory.filter(
            (c) => !isDummyCall(c),
          );
          if (filteredCalls.length !== parsed.state.callHistory.length) {
            parsed.state.callHistory = filteredCalls;
            changed = true;
          }
        }
        if (Array.isArray(parsed.state.favourites)) {
          const filteredFavs = parsed.state.favourites.filter(
            (f) => !isDummyFavourite(f),
          );
          if (filteredFavs.length !== parsed.state.favourites.length) {
            parsed.state.favourites = filteredFavs;
            changed = true;
          }
        }
        if (isDummyCall(parsed.state.selectedCall)) {
          parsed.state.selectedCall = null;
          changed = true;
        }
        if (changed || parsed.version !== 3) {
          parsed.version = 3;
          window.localStorage.setItem(
            "whatsapp-call-storage",
            JSON.stringify(parsed),
          );
        }
      }
    }
  } catch (e) {
    console.warn("Call storage sanitization warning:", e);
  }
}

const useCallStore = create(
  persist(
    (set, get) => ({
      callHistory: DEFAULT_CALL_HISTORY,
      favourites: DEFAULT_FAVOURITES,
      selectedCall: null,
      searchQuery: "",

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSelectedCall: (call) => {
        if (isDummyCall(call)) {
          set({ selectedCall: null });
        } else {
          set({ selectedCall: call });
        }
      },

      addCall: (callData) => {
        const now = new Date();
        const timeFormatted = now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const dateFormatted = "Today";

        const newCall = {
          id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          timeFormatted,
          dateFormatted,
          timestamp: now.toISOString(),
          status: callData.direction === "missed" ? "missed" : "completed",
          duration: callData.direction === "missed" ? "Missed" : "Connected",
          ...callData,
        };

        set((state) => ({
          callHistory: [
            newCall,
            ...state.callHistory.filter((c) => !isDummyCall(c)),
          ],
          selectedCall: newCall,
        }));

        return newCall;
      },

      removeCall: (callId) => {
        set((state) => ({
          callHistory: state.callHistory.filter((c) => c.id !== callId),
          selectedCall:
            state.selectedCall?.id === callId ? null : state.selectedCall,
        }));
      },

      removeCalls: (callIds) => {
        const idSet = new Set(callIds || []);
        set((state) => ({
          callHistory: state.callHistory.filter((c) => !idSet.has(c.id)),
          selectedCall: idSet.has(state.selectedCall?.id)
            ? null
            : state.selectedCall,
        }));
      },

      clearCallHistory: () => {
        set({ callHistory: [], selectedCall: null });
      },

      resetToDefaultHistory: () => {
        set({ callHistory: [], selectedCall: null });
      },

      clearDummyData: () => {
        set((state) => ({
          callHistory: state.callHistory.filter((c) => !isDummyCall(c)),
          favourites: state.favourites.filter((f) => !isDummyFavourite(f)),
          selectedCall: isDummyCall(state.selectedCall)
            ? null
            : state.selectedCall,
        }));
      },

      setFavourites: (favourites) => {
        set({
          favourites: (favourites || []).filter((f) => !isDummyFavourite(f)),
        });
      },

      reorderFavourites: (favourites) => {
        set({
          favourites: (favourites || []).filter((f) => !isDummyFavourite(f)),
        });
      },

      addFavourite: (contact) => {
        const { favourites } = get();
        const contactId = contact._id || contact.id || contact.contactId;
        if (!contactId) return;

        if (
          favourites.some((f) => (f._id || f.id || f.contactId) === contactId)
        ) {
          return;
        }

        const favItem = {
          contactId,
          _id: contactId,
          username: contact.username || contact.name || contact.contactName,
          name: contact.username || contact.name || contact.contactName,
          profilePicture:
            contact.profilePicture ||
            contact.avatar ||
            contact.contactAvatar ||
            null,
          avatarType: contact.avatarType || null,
          isVerified: Boolean(contact.isVerified),
          about: contact.about || "Hey there! I am using WhatsApp",
          addedAt: new Date().toISOString(),
        };

        set({ favourites: [...favourites, favItem] });
      },

      removeFavourite: (contactId) => {
        set((state) => ({
          favourites: state.favourites.filter(
            (f) => (f._id || f.id || f.contactId) !== contactId,
          ),
        }));
      },

      toggleFavourite: (contact) => {
        const { favourites, addFavourite, removeFavourite } = get();
        const contactId = contact._id || contact.id || contact.contactId;
        const exists = favourites.some(
          (f) => (f._id || f.id || f.contactId) === contactId,
        );
        if (exists) {
          removeFavourite(contactId);
        } else {
          addFavourite(contact);
        }
      },

      isFavourite: (contactId) => {
        const { favourites } = get();
        return favourites.some(
          (f) => (f._id || f.id || f.contactId) === contactId,
        );
      },
    }),
    {
      name: "whatsapp-call-storage",
      version: 3,
      migrate: (persistedState) => {
        const cleanHistory = (persistedState?.callHistory || []).filter(
          (c) => !isDummyCall(c),
        );
        const cleanFavourites = (persistedState?.favourites || []).filter(
          (f) => !isDummyFavourite(f),
        );
        return {
          ...persistedState,
          callHistory: cleanHistory,
          favourites: cleanFavourites,
          selectedCall: isDummyCall(persistedState?.selectedCall)
            ? null
            : persistedState?.selectedCall,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.callHistory = (state.callHistory || []).filter(
          (c) => !isDummyCall(c),
        );
        state.favourites = (state.favourites || []).filter(
          (f) => !isDummyFavourite(f),
        );
        if (isDummyCall(state.selectedCall)) {
          state.selectedCall = null;
        }
      },
      partialize: (state) => ({
        callHistory: state.callHistory,
        favourites: state.favourites,
      }),
    },
  ),
);

export default useCallStore;
