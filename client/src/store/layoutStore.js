import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem("layout-storage");
    if (raw) {
      const data = JSON.parse(raw);
      if (data?.state?.selectedContact) {
        delete data.state.selectedContact;
        localStorage.setItem("layout-storage", JSON.stringify(data));
      }
    }
  } catch (err) {}
}

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
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        activeTab: state.activeTab,
        chatListScrollTop: state.chatListScrollTop,
      }),
    },
  ),
);

export default useLayoutStore;
