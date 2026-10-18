import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_CALL_HISTORY = [
  {
    id: "call-seed-1",
    contactId: "seed-baba",
    contactName: "Baba 💖💖💖",
    contactAvatar: null,
    callType: "audio",
    direction: "outgoing",
    status: "completed",
    timeFormatted: "04:07",
    dateFormatted: "Today",
    timestamp: new Date().toISOString(),
    duration: "3 mins 45 secs",
  },
  {
    id: "call-seed-2",
    contactId: "seed-ankan",
    contactName: "Ankan Dewan MSIT",
    contactAvatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
    callType: "video",
    direction: "missed",
    status: "missed",
    timeFormatted: "19:24",
    dateFormatted: "Yesterday",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    duration: "Missed",
  },
  {
    id: "call-seed-3",
    contactId: "seed-arindam",
    contactName: "Arindam",
    contactAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    callType: "audio",
    direction: "outgoing",
    status: "completed",
    timeFormatted: "16:15",
    dateFormatted: "06/10/2026",
    timestamp: new Date("2026-10-06T16:15:00").toISOString(),
    duration: "1 min 12 secs",
  },
  {
    id: "call-seed-4",
    contactId: "seed-sayak",
    contactName: "Sayak Chandra Hostel Room Met",
    contactAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    callType: "audio",
    direction: "missed",
    status: "missed",
    timeFormatted: "13:02",
    dateFormatted: "06/10/2026",
    timestamp: new Date("2026-10-06T13:02:00").toISOString(),
    duration: "Missed",
  },
  {
    id: "call-seed-5",
    contactId: "seed-sayak",
    contactName: "Sayak Chandra Hostel Room Met",
    contactAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    callType: "video",
    direction: "outgoing",
    status: "completed",
    timeFormatted: "11:40",
    dateFormatted: "06/10/2026",
    timestamp: new Date("2026-10-06T11:40:00").toISOString(),
    duration: "8 mins 20 secs",
  },
  {
    id: "call-seed-6",
    contactId: "seed-arindam",
    contactName: "Arindam",
    contactAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    callType: "audio",
    direction: "outgoing",
    status: "completed",
    timeFormatted: "09:18",
    dateFormatted: "06/10/2026",
    timestamp: new Date("2026-10-06T09:18:00").toISOString(),
    duration: "4 mins 55 secs",
  },
];

export const DEFAULT_FAVOURITES = [
  {
    contactId: "fav-amazon",
    _id: "fav-amazon",
    username: "Amazon",
    name: "Amazon",
    isVerified: true,
    avatarType: "amazon",
    profilePicture:
      "https://upload.wikimedia.org/wikipedia/commons/d/de/Amazon_icon.png",
    about: "Official Business Account",
  },
];

export const SEED_FAVOURITE_CANDIDATES = [
  {
    _id: "fav-amazon",
    id: "fav-amazon",
    username: "Amazon",
    name: "Amazon",
    isVerified: true,
    avatarType: "amazon",
    profilePicture:
      "https://upload.wikimedia.org/wikipedia/commons/d/de/Amazon_icon.png",
    about: "Official Business Account",
  },
  {
    _id: "fav-flipkart",
    id: "fav-flipkart",
    username: "Flipkart Saathi",
    name: "Flipkart Saathi",
    isVerified: true,
    avatarType: "flipkart",
    profilePicture:
      "https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=150&q=80",
    about: "Official Business Account",
  },
  {
    _id: "fav-prime-video",
    id: "fav-prime-video",
    username: "Prime Video India",
    name: "Prime Video India",
    isVerified: true,
    avatarType: "prime",
    profilePicture:
      "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=150&q=80",
    about: "Official Business Account",
  },
  {
    _id: "fav-h4-batch",
    id: "fav-h4-batch",
    username: "H4 batch 2026-27",
    name: "H4 batch 2026-27",
    avatarType: "hostel",
    profilePicture:
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=150&q=80",
    about: "Ankan, Anurag, Arghya, Arindam, Arm...",
  },
  {
    _id: "seed-baba",
    id: "seed-baba",
    username: "Baba 💖💖💖",
    name: "Baba 💖💖💖",
    avatarType: "default",
    profilePicture: null,
    about: "Available",
  },
  {
    _id: "fav-lme",
    id: "fav-lme",
    username: "LME 2024-28",
    name: "LME 2024-28",
    avatarType: "lme",
    profilePicture:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=150&q=80",
    about: "Ankan, Arindam, Priyanshu, Utsab...",
  },
  {
    _id: "fav-mar",
    id: "fav-mar",
    username: "Get MAR Support Group",
    name: "Get MAR Support Group",
    avatarType: "mar",
    profilePicture:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    about: "+91 6295 055 881, +91 93331 28251, ...",
  },
  {
    _id: "cand-anurag-laha",
    id: "cand-anurag-laha",
    username: "Anurag Laha Da CSE iot",
    name: "Anurag Laha Da CSE iot",
    about: "Hey there! I am using WhatsApp",
  },
  {
    _id: "cand-argha-bhukta",
    id: "cand-argha-bhukta",
    username: "Argha Bhukta",
    name: "Argha Bhukta",
    about: "Hey there! I am using WhatsApp",
  },
  {
    _id: "cand-arghya-dam",
    id: "cand-arghya-dam",
    username: "Arghya Dam CSE(Core)",
    name: "Arghya Dam CSE(Core)",
    about: "Hey there! I am using WhatsApp",
  },
  {
    _id: "cand-ankan-dewan",
    id: "cand-ankan-dewan",
    username: "Ankail Dewan Msit",
    name: "Ankail Dewan Msit",
    about: "Talwar se bijli kadke, laal lahu bahe dharti. Ye w...",
  },
  {
    _id: "cand-arindam",
    id: "cand-arindam",
    username: "Arindam",
    name: "Arindam",
    about: "Busy",
  },
  {
    _id: "cand-arindam-sir",
    id: "cand-arindam-sir",
    username: "Arindam Sir",
    name: "Arindam Sir",
    about: "Hey there! I am using WhatsApp",
  },
  {
    _id: "cand-armanu",
    id: "cand-armanu",
    username: "Armanu Rahaman Da CSE 2nd",
    name: "Armanu Rahaman Da CSE 2nd",
    about: "Available",
  },
  {
    _id: "cand-arnab",
    id: "cand-arnab",
    username: "Arnab🥰🥰",
    name: "Arnab🥰🥰",
    about: "Hey there! I am using WhatsApp",
  },
  {
    _id: "cand-arpan",
    id: "cand-arpan",
    username: "arpan pattnayak Msit",
    name: "arpan pattnayak Msit",
    about: "Living the dream",
  },
];

const useCallStore = create(
  persist(
    (set, get) => ({
      callHistory: DEFAULT_CALL_HISTORY,
      favourites: DEFAULT_FAVOURITES,
      selectedCall: null,
      searchQuery: "",

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSelectedCall: (call) => set({ selectedCall: call }),

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
          callHistory: [newCall, ...state.callHistory],
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

      clearCallHistory: () => {
        set({ callHistory: [], selectedCall: null });
      },

      resetToDefaultHistory: () => {
        set({ callHistory: DEFAULT_CALL_HISTORY, selectedCall: null });
      },

      setFavourites: (favourites) => {
        set({ favourites });
      },

      reorderFavourites: (favourites) => {
        set({ favourites });
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
      version: 2,
      migrate: (persistedState, version) => {
        if (!version || version < 2) {
          const updatedHistory = (persistedState?.callHistory || []).map((c) => {
            if (c.id === "call-seed-2") {
              return {
                ...c,
                dateFormatted: "Yesterday",
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              };
            }
            if (c.id === "call-seed-1") {
              return {
                ...c,
                dateFormatted: "Today",
                timestamp: new Date().toISOString(),
              };
            }
            return c;
          });
          return {
            ...persistedState,
            callHistory: updatedHistory,
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        callHistory: state.callHistory,
        favourites: state.favourites,
      }),
    },
  ),
);

export default useCallStore;
