import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSocket } from "../services/chatService";
import { useChatStore } from "./chatStore"; // ✅ ADD

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setUser: (userData) => {
        set({
          user: userData,
          isAuthenticated: true,
        });

        // ✅ FIX HERE
        useChatStore.getState().setCurrentUser(userData);
      },

      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      initSocketListener: () => {
        const socket = getSocket();
        if (!socket) return;

        socket.off("receiveMessage");

        socket.on("receiveMessage", (msg) => {
          console.log("New message:", msg);
        });
      },

      cleanup: () => {
        const socket = getSocket();
        if (socket) {
          socket.off("receiveMessage");
        }
      },
    }),
    {
      name: "user-storage",
    }
  )
);

export default useUserStore;