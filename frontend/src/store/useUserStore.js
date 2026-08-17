import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSocket } from "../services/chatService";
import useLayoutStore from "./layoutStore";

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setUser: (userData) => {
        const normalizedUser =
          userData?.user ||
          userData?.data?.user ||
          userData;

        set({
          user: normalizedUser,
          isAuthenticated: true,
        });
      },

      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      initSocketListener: () => {
        const socket = getSocket();

        if (!socket) {
          console.log("Socket not available");
          return;
        }

        socket.off("receiveMessage");
        socket.on("receiveMessage", (msg) => {
          console.log("New message:", msg);
        });

        socket.off("profile_updated");
        socket.on("profile_updated", (updatedUser) => {
          console.log(
            "🔥 REALTIME PROFILE UPDATE:",
            updatedUser
          );

          // Update logged-in user
          const currentUser = get().user;

          if (
            currentUser &&
            String(currentUser._id) ===
              String(updatedUser.userId)
          ) {
            const newUser = {
              ...currentUser,
              username: updatedUser.username,
              about: updatedUser.about,
              profilePicture:
                updatedUser.profilePicture,
            };

            set({
              user: newUser,
            });
          }
          useLayoutStore
            .getState()
            .updateSelectedContact(updatedUser);
        });
      },

      cleanup: () => {
        const socket = getSocket();

        if (socket) {
          socket.off("receiveMessage");
          socket.off("profile_updated");
        }
      },
    }),
    {
      name: "user-storage",
    }
  )
);

export default useUserStore;