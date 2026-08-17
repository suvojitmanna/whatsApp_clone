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
      updateSelectedContact: (updatedUser) => {
        set((state) => {
          if (!state.selectedContact) {
            return state;
          }

          if (
            String(state.selectedContact._id) !==
            String(updatedUser.userId)
          ) {
            return state;
          }

          return {
            selectedContact: {
              ...state.selectedContact,
              username: updatedUser.username,
              about: updatedUser.about,
              profilePicture: updatedUser.profilePicture,
            },
          };
        });
      },
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
