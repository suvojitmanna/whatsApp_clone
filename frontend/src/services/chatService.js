import { io } from "socket.io-client";
import useUserStore from "../store/useUserStore";

let socket = null;

export const initializeSocket = () => {
  if (socket) {
    socket.disconnect(); // force fresh connection
  }

  const BACKEND_URL = import.meta.env.VITE_API_URL;

  socket = io(BACKEND_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"], // improved
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);
    emitUserConnected();
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket error:", error.message);
  });

  return socket;
};

// IMPORTANT: separate function (fixes refresh/login issue)
export const emitUserConnected = () => {
  if (!socket) return;

  const user = useUserStore.getState().user;

  if (user?._id) {
    socket.emit("user_connected", user._id);
  }
};

export const getSocket = () => {
  return socket || initializeSocket();
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
