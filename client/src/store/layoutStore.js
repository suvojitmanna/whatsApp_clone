import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useLayoutStore = create(
  persist(
    (set) => ({
      activeTab: "chats",
      selectedContact: null,
      showContactInfo: false,

      setSelectedContact: (contact) => {
        set({ selectedContact: contact });
      },
      updateSelectedContact: (updates) =>
        set((state) => ({
          selectedContact: state.selectedContact
            ? {
              ...state.selectedContact,
              ...updates,
            }
            : null,
        })),
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      setShowContactInfo: (value) => set({ showContactInfo: value }),
      setShowProfilePicture: (value) => set({ showProfilePicture: value }),
    }
    ),
    {
      name: "layout-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useLayoutStore;
