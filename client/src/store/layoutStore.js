import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useLayoutStore = create(
  persist(
    (set) => ({
      activeTab: "chats",
      selectedContact: null,
      showContactInfo: false,
      selectedPollMessage: null,
      selectedPollMessageId: null,

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

      setShowContactInfo: (value) =>
        set((state) => ({
          showContactInfo: value,
          ...(value ? { selectedPollMessage: null, selectedPollMessageId: null } : {}),
        })),
      setShowProfilePicture: (value) => set({ showProfilePicture: value }),
      setSelectedPollDetails: (pollMessage) =>
        set({
          selectedPollMessage: pollMessage,
          selectedPollMessageId: pollMessage?._id || null,
          ...(pollMessage ? { showContactInfo: false } : {}),
        }),
      chatListScrollTop: 0,
      setChatListScrollTop: (pos) => set({ chatListScrollTop: pos }),
    }
    ),
    {
      name: "layout-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeTab: state.activeTab,
        selectedContact: state.selectedContact,
        chatListScrollTop: state.chatListScrollTop,
      }),
    },
  ),
);

export default useLayoutStore;
