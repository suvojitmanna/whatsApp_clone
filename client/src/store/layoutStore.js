import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getSocket } from "../services/chatService";
import axiosInstance from "../services/url.services";

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
      isChatSearchOpen: false,
      setIsChatSearchOpen: (val) => set({ isChatSearchOpen: val }),
      showProfilePicture: false,
      profilePictureData: null,

      isMediaModalOpen: false,
      mediaModalScope: "all",
      mediaModalContact: null,
      mediaModalChatId: null,
      mediaModalInitialTab: "media",
      openMediaModal: (options = {}) =>
        set({
          isMediaModalOpen: true,
          mediaModalScope: options.scope || "all",
          mediaModalContact: options.contact || null,
          mediaModalChatId: options.chatId || null,
          mediaModalInitialTab: options.initialTab || "media",
        }),
      closeMediaModal: () => set({ isMediaModalOpen: false }),

      selectedMessageInfo: null,
      setSelectedMessageInfo: (message) =>
        set({
          selectedMessageInfo: message,
          ...(message
            ? {
                showContactInfo: false,
                selectedPollMessage: null,
                selectedPollMessageId: null,
              }
            : {}),
        }),

      setSelectedContact: (contactOrFn) => {
        set((state) => {
          let nextContact;
          if (typeof contactOrFn === "function") {
            const current =
              typeof state.selectedContact === "function"
                ? null
                : state.selectedContact;
            nextContact = contactOrFn(current);
          } else {
            nextContact = contactOrFn;
          }
          return {
            selectedContact: nextContact,
            selectedMessageInfo: null,
          };
        });
      },
      updateSelectedContact: (updatesOrFn) =>
        set((state) => {
          if (
            !state.selectedContact ||
            typeof state.selectedContact === "function"
          ) {
            return { selectedContact: null };
          }
          const updates =
            typeof updatesOrFn === "function"
              ? updatesOrFn(state.selectedContact)
              : updatesOrFn;
          return {
            selectedContact: {
              ...state.selectedContact,
              ...updates,
            },
          };
        }),
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      contactInfoTab: "info",
      previousContactInfoTab: "info",
      setShowContactInfo: (value) =>
        set((state) => ({
          showContactInfo: value,
          ...(value
            ? {
                selectedPollMessage: null,
                selectedPollMessageId: null,
                selectedMessageInfo: null,
              }
            : { contactInfoTab: "info", previousContactInfoTab: "info" }),
        })),
      setContactInfoTab: (tab) =>
        set((state) => ({
          previousContactInfoTab: state.contactInfoTab,
          contactInfoTab: tab,
        })),
      openContactInfoWithTab: (tab = "info") =>
        set((state) => ({
          showContactInfo: true,
          previousContactInfoTab: state.showContactInfo
            ? state.contactInfoTab
            : null,
          contactInfoTab: tab,
          selectedPollMessage: null,
          selectedPollMessageId: null,
          selectedMessageInfo: null,
        })),
      disappearingDurations: (() => {
        try {
          return JSON.parse(
            localStorage.getItem("whatsapp_disappearing_messages") || "{}",
          );
        } catch {
          return {};
        }
      })(),
      defaultMessageTimer: (() => {
        try {
          return (
            localStorage.getItem("whatsapp_default_message_timer") || "Off"
          );
        } catch {
          return "Off";
        }
      })(),
      lastDisappearingActions: (() => {
        try {
          return JSON.parse(
            localStorage.getItem("whatsapp_disappearing_actions") || "{}",
          );
        } catch {
          return {};
        }
      })(),
      disappearingEvents: (() => {
        try {
          return JSON.parse(
            localStorage.getItem("whatsapp_disappearing_events") || "{}",
          );
        } catch {
          return {};
        }
      })(),
      setDisappearingDuration: (chatId, duration, setBy) =>
        set((state) => {
          if (!chatId) return state;
          const prev =
            state.disappearingDurations?.[chatId] ||
            state.defaultMessageTimer ||
            "Off";

          if (
            prev === duration &&
            state.disappearingEvents?.[chatId]?.length > 0
          ) {
            return state;
          }

          const nextDurations = {
            ...state.disappearingDurations,
            [chatId]: duration,
          };
          const nextActions = {
            ...state.lastDisappearingActions,
            [chatId]: { duration, timestamp: Date.now() },
          };
          const nextEvents = {
            ...state.disappearingEvents,
          };

          const prevEvents = state.disappearingEvents?.[chatId] || [];
          const baselineEvents =
            prevEvents.length === 0 && prev !== "Off"
              ? [
                  {
                    _id: `disp_init_${chatId}`,
                    isDisappearingSystemEvent: true,
                    action: "turned_on",
                    duration: prev,
                    previousDuration: "Off",
                    setBy: setBy || null,
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    timestamp: Date.now() - 3600000,
                  },
                ]
              : [...prevEvents];

          let action = "updated";
          if (
            (prev === "Off" || baselineEvents.length === 0) &&
            duration !== "Off"
          ) {
            action = "turned_on";
          } else if (duration === "Off") {
            action = "turned_off";
          }

          const newEvent = {
            _id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            isDisappearingSystemEvent: true,
            action,
            duration,
            previousDuration: prev,
            setBy: setBy || null,
            createdAt: new Date().toISOString(),
            timestamp: Date.now(),
          };

          const selContact = state.selectedContact;
          const convId = (
            selContact?.conversation?._id ||
            (typeof selContact?.conversation === "string"
              ? selContact.conversation
              : null)
          )?.toString();
          const receiverId = selContact?._id?.toString();

          const allKeys = new Set(
            [chatId, convId, receiverId].filter(Boolean).map(String),
          );

          allKeys.forEach((k) => {
            nextDurations[k] = duration;
            nextActions[k] = { duration, timestamp: Date.now() };
            const existing = state.disappearingEvents?.[k] || [];
            nextEvents[k] = [
              ...existing.filter((e) => e._id !== newEvent._id),
              newEvent,
            ];
          });

          try {
            localStorage.setItem(
              "whatsapp_disappearing_messages",
              JSON.stringify(nextDurations),
            );
            localStorage.setItem(
              "whatsapp_disappearing_actions",
              JSON.stringify(nextActions),
            );
            localStorage.setItem(
              "whatsapp_disappearing_events",
              JSON.stringify(nextEvents),
            );
          } catch {}

          try {
            const socket =
              getSocket() ||
              (typeof window !== "undefined" ? window.__whatsapp_socket : null);
            if (socket?.connected) {
              socket.emit("disappearing_update", {
                chatId,
                conversationId: convId,
                receiverId,
                secondaryId: receiverId,
                duration,
                event: newEvent,
                setBy: setBy || null,
              });
            }
          } catch {}

          const targetConvId =
            convId ||
            (chatId && /^[0-9a-fA-F]{24}$/.test(chatId) ? chatId : null);
          const targetReceiverId =
            receiverId || (chatId !== targetConvId ? chatId : null);
          if (targetConvId) {
            axiosInstance
              .put(`/chat/conversation/${targetConvId}/disappearing`, {
                duration,
                receiverId: targetReceiverId,
              })
              .catch(() => {});
          } else if (targetReceiverId) {
            axiosInstance
              .post("/chat/disappearing-duration", {
                duration,
                receiverId: targetReceiverId,
              })
              .catch(() => {});
          }

          try {
            import("./chatStore")
              .then(({ useChatStore }) => {
                useChatStore
                  .getState()
                  ?.updateConversationDisappearing?.(
                    Array.from(allKeys),
                    duration,
                    setBy,
                    newEvent.createdAt,
                  );
              })
              .catch(() => {});
          } catch (e) {}

          let updatedSelectedContact = state.selectedContact;
          if (updatedSelectedContact) {
            const curConvId = String(
              updatedSelectedContact.conversation?._id ||
                updatedSelectedContact.conversation ||
                "",
            );
            const curUserId = String(updatedSelectedContact._id || "");
            if (allKeys.has(curConvId) || allKeys.has(curUserId)) {
              updatedSelectedContact = {
                ...updatedSelectedContact,
                conversation: {
                  ...(typeof updatedSelectedContact.conversation === "object"
                    ? updatedSelectedContact.conversation
                    : {}),
                  disappearingDuration: duration,
                  disappearingSetBy: setBy || null,
                  disappearingUpdatedAt: newEvent.createdAt,
                },
              };
            }
          }

          return {
            selectedContact: updatedSelectedContact,
            disappearingDurations: nextDurations,
            lastDisappearingActions: nextActions,
            disappearingEvents: nextEvents,
          };
        }),
      syncDisappearingFromDb: (durations, events) =>
        set((state) => {
          const nextDurations = {
            ...state.disappearingDurations,
            ...durations,
          };
          const nextEvents = {
            ...state.disappearingEvents,
            ...events,
          };
          try {
            localStorage.setItem(
              "whatsapp_disappearing_messages",
              JSON.stringify(nextDurations),
            );
            localStorage.setItem(
              "whatsapp_disappearing_events",
              JSON.stringify(nextEvents),
            );
          } catch {}
          return {
            disappearingDurations: nextDurations,
            disappearingEvents: nextEvents,
          };
        }),
      receiveDisappearingEvent: (chatId, duration, event) =>
        set((state) => {
          if (!chatId || !event) return state;
          const nextDurations = {
            ...state.disappearingDurations,
            [chatId]: duration,
          };
          const prevEvents = state.disappearingEvents?.[chatId] || [];
          if (prevEvents.some((e) => e._id === event._id)) {
            return { disappearingDurations: nextDurations };
          }
          const nextEvents = {
            ...state.disappearingEvents,
            [chatId]: [...prevEvents, event],
          };
          try {
            localStorage.setItem(
              "whatsapp_disappearing_messages",
              JSON.stringify(nextDurations),
            );
            localStorage.setItem(
              "whatsapp_disappearing_events",
              JSON.stringify(nextEvents),
            );
          } catch {}
          return {
            disappearingDurations: nextDurations,
            disappearingEvents: nextEvents,
          };
        }),
      setDefaultMessageTimer: (duration) =>
        set(() => {
          try {
            localStorage.setItem("whatsapp_default_message_timer", duration);
          } catch {}
          return { defaultMessageTimer: duration };
        }),
      chatThemes: (() => {
        try {
          return JSON.parse(
            localStorage.getItem("whatsapp_chat_themes") || "{}",
          );
        } catch {
          return {};
        }
      })(),
      chatDoodles: (() => {
        try {
          return JSON.parse(
            localStorage.getItem("whatsapp_chat_doodles") || "{}",
          );
        } catch {
          return {};
        }
      })(),
      chatBubbleColors: (() => {
        try {
          return JSON.parse(
            localStorage.getItem("whatsapp_chat_bubble_colors") || "{}",
          );
        } catch {
          return {};
        }
      })(),
      setChatTheme: (chatId, themeId) =>
        set((state) => {
          const next = { ...state.chatThemes, [chatId]: themeId };
          try {
            localStorage.setItem("whatsapp_chat_themes", JSON.stringify(next));
          } catch {}
          return { chatThemes: next };
        }),
      setChatDoodles: (chatId, enabled) =>
        set((state) => {
          const next = { ...state.chatDoodles, [chatId]: enabled };
          try {
            localStorage.setItem("whatsapp_chat_doodles", JSON.stringify(next));
          } catch {}
          return { chatDoodles: next };
        }),
      setChatBubbleColor: (chatId, color) =>
        set((state) => {
          const next = { ...state.chatBubbleColors, [chatId]: color };
          try {
            localStorage.setItem(
              "whatsapp_chat_bubble_colors",
              JSON.stringify(next),
            );
          } catch {}
          return { chatBubbleColors: next };
        }),
      resetChatBubbleColor: (chatId) =>
        set((state) => {
          const next = { ...state.chatBubbleColors };
          delete next[chatId];
          try {
            localStorage.setItem(
              "whatsapp_chat_bubble_colors",
              JSON.stringify(next),
            );
          } catch {}
          return { chatBubbleColors: next };
        }),
      resetChatTheme: (chatId) =>
        set((state) => {
          const nextThemes = { ...state.chatThemes };
          delete nextThemes[chatId];
          const nextDoodles = { ...state.chatDoodles };
          delete nextDoodles[chatId];
          const nextBubbles = { ...state.chatBubbleColors };
          delete nextBubbles[chatId];
          try {
            localStorage.setItem(
              "whatsapp_chat_themes",
              JSON.stringify(nextThemes),
            );
            localStorage.setItem(
              "whatsapp_chat_doodles",
              JSON.stringify(nextDoodles),
            );
            localStorage.setItem(
              "whatsapp_chat_bubble_colors",
              JSON.stringify(nextBubbles),
            );
          } catch {}
          return {
            chatThemes: nextThemes,
            chatDoodles: nextDoodles,
            chatBubbleColors: nextBubbles,
          };
        }),
      setShowProfilePicture: (value, data = null) =>
        set({
          showProfilePicture: value,
          profilePictureData: value ? data || null : null,
        }),
      setSelectedPollDetails: (pollMessage) =>
        set({
          selectedPollMessage: pollMessage,
          selectedPollMessageId: pollMessage?._id || null,
          ...(pollMessage
            ? { showContactInfo: false, selectedMessageInfo: null }
            : {}),
        }),
      chatListScrollTop: 0,
      setChatListScrollTop: (pos) => set({ chatListScrollTop: pos }),
    }),
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
