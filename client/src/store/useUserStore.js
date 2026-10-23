import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSocket } from "../services/chatService";

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      setUser: (userData) => {
        const normalizedUser =
          userData?.user || userData?.data?.user || userData;

        set({
          user: normalizedUser,
          isAuthenticated: true,
        });

        import("./chatStore")
          .then((mod) => {
            const store = mod.useChatStore || mod.default;
            store?.getState()?.setCurrentUser?.(normalizedUser);
          })
          .catch(() => {});
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
    },
  ),
);

export default useUserStore;
