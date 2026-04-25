import { create } from "zustand";
import { getSocket } from "../services/chatService";
import axiosInstance from "../services/url.services";

export const useChatStore = create((set, get) => ({
  users: [],
  conversations: [],
  currentConversation: null,
  currentUser: null,
  messages: [],
  loading: false,
  error: null,
  onlineUsers: new Map(),
  typingUsers: new Map(),

  initSocketListener: () => {
    const socket = getSocket();
    if (!socket) return;

    // remove all listeners before adding new ones
    socket.off("receive_message");
    socket.off("user_typing");
    socket.off("user_status");
    socket.off("message_send");
    socket.off("message_error");
    socket.off("message_deleted");
    socket.off("message_status_update");
    socket.off("reaction_update");
    socket.off("message_status_update_bulk");

    // Listen for incoming messages
    socket.on("receive_message", (message) => {
      get().receiveMessage(message); //  FIX
    });

    socket.on("message_status_update_bulk", ({ messageIds, messageStatus }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          messageIds.includes(msg._id) ? { ...msg, messageStatus } : msg,
        ),
      }));
    });

    // confirm message sent successfully
    socket.on("message_send", (message) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === message._id ? { ...msg } : msg,
        ),
      }));
    });

    //update message status
    socket.on("message_status_update", ({ messageId, messageStatus }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, messageStatus } : msg,
        ),
      }));
    });

    //handle reaction on message
    socket.on("reaction_update", ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg,
        ),
      }));
    });

    //handle deleted message
    socket.on("message_deleted", ({ deletedMessageId }) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== deletedMessageId),
      }));
    });

    //handle any message sending error
    socket.on("message_error", (error) => {
      console.error("Message error:", error);
      set({ error: error.message });
    });

    // Listen for typing indicators
    socket.on("user_typing", ({ conversationId, userId, isTyping }) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        if (!newTypingUsers.has(conversationId)) {
          newTypingUsers.set(conversationId, new Set());
        }
        const typingSet = newTypingUsers.get(conversationId);
        if (isTyping) {
          typingSet.add(userId);
        } else {
          typingSet.delete(userId);
        }
        return { typingUsers: newTypingUsers };
      });
    });

    //track users online/offline status
    socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(userId, { isOnline, lastSeen });
        return { onlineUsers: newOnlineUsers };
      });
    });

    // emit status for all users in conversation List
    const { conversations } = get();

    if (conversations?.data?.length > 0) {
      conversations.data.forEach((con) => {
        const otherUser = con.participants.find(
          (p) => p._id !== get().currentConversation?.user?._id,
        );

        if (otherUser?._id) {
          socket.emit("get_user_status", otherUser._id, (status) => {
            set((state) => {
              const newOnlineUsers = new Map(state.onlineUsers);

              newOnlineUsers.set(status.userId, {
                isOnline: status.isOnline,
                lastSeen: status.lastSeen,
              });

              return { onlineUsers: newOnlineUsers };
            });
          });
        }
      });
    }
  },

  // set current user conversation
  setCurrentUser: (user) => set({ currentUser: user }),

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/chat/conversation");
      set({ conversations: data, loading: false });
      get().initSocketListener();
      return data;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
        loading: false,
      });
      return null;
    }
  },

  //fetch messages for a conversation
  fetchMessages: async (conversationId) => {
    if (!conversationId) return;
    set({ loading: true, error: null });

    try {
      const { data } = await axiosInstance.get(
        `/chat/conversation/${conversationId}/messages`,
      );

      const messageArray = data?.data || data || [];
      set({
        messages: messageArray,
        currentConversation: { _id: conversationId },
        loading: false,
      });

      const { markMessageAsRead } = get();
      markMessageAsRead();

      return messageArray;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
        loading: false,
      });
      return [];
    }
  },

  //send message in real time using socket
  sendMessage: async (formData) => {
    const senderId = formData.get("senderId");
    const receiverId = formData.get("receiverId");
    const media = formData.get("media");
    const content = formData.get("content");
    const messageStatus = formData.get("messageStatus");

    const socket = getSocket();
    const { conversations } = get();
    let conversationId = null;

    if (conversations?.data?.length > 0) {
      const conversation = conversations.data.find(
        (conv) =>
          conv.participants.some((p) => p._id === senderId) &&
          conv.participants.some((p) => p._id === receiverId),
      );

      if (conversation) {
        conversationId = conversation._id;
        set({ currentConversation: { _id: conversationId } });
      }
    }

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      sender: { _id: senderId },
      receiver: { _id: receiverId },
      conversation: conversationId,
      imageOrVideoUrl:
        media && typeof media !== "string" ? URL.createObjectURL(media) : null,
      content: content,
      contentType: media
        ? media?.type?.startsWith("image")
          ? "image"
          : "video"
        : "text",
      createdAt: new Date().toISOString(),
      messageStatus,
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      const { data } = await axiosInstance.post(
        "/chat/send-message",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      const messageData = data.data || data;

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? messageData : msg,
        ),
      }));

      return messageData;
    } catch (error) {
      console.error("error sending message", error);

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? { ...msg, messageStatus: "failed" } : msg,
        ),
        error: error?.response?.data?.message || error?.message,
      }));

      throw error;
    }
  },

  receiveMessage: (message) => {
    if (!message) return;

    const { currentConversation, currentUser, messages } = get();

    const messageExits = messages.some((msg) => msg._id === message._id);
    if (messageExits) return;

    if (message.conversationId === currentConversation?._id) {
      set((state) => ({
        messages: [...state.messages, message],
      }));

      if (message.receiver?._id === currentUser?._id) {
        get().markMessageAsRead();
      }
    }

    set((state) => {
      const updateConversations = state.conversations?.data?.map((conv) => {
        if (conv._id === message.conversationId) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount:
              message.receiver?._id === currentUser?._id
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount || 0,
          };
        }
        return conv;
      });

      return {
        conversations: {
          ...state.conversations,
          data: updateConversations,
        },
      };
    });
  },

  //mark as read
  markMessageAsRead: async () => {
    const { messages, currentUser } = get();
    if (!messages.length || !currentUser) return;

    const unreadIds = messages
      .filter(
        (msg) =>
          msg.messageStatus !== "read" &&
          msg.receiver?._id === currentUser?._id,
      )
      .map((msg) => msg._id)
      .filter(Boolean);

    if (unreadIds.length === 0) return;

    try {
      await axiosInstance.put("/chat/messages/read", {
        messageIds: unreadIds,
      });
      console.log("📩 marking as read:", unreadIds);

      set((state) => ({
        messages: state.messages.map((msg) =>
          unreadIds.includes(msg._id) ? { ...msg, messageStatus: "read" } : msg,
        ),
      }));

      const socket = getSocket();
      if (socket) {
        socket.emit("message_read", {
          messageIds: unreadIds,
          senderId: messages[0]?.sender?._id,
        });
      }
    } catch (error) {
      console.error("failed to mark message as read", error);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/chat/messages/${messageId}`);

      set((state) => ({
        messages: state.messages?.filter((msg) => msg?._id !== messageId),
      }));
      return true;
    } catch (error) {
      console.log("error deleting message", error);
      set({ error: error.response?.data?.message || error.message });
      return false;
    }
  },

  addReaction: async (messageId, emoji) => {
    let socket = getSocket();
    const { currentUser } = get();

    console.log("🟡 STEP 1 socket:", socket);
    console.log("🟡 STEP 2 currentUser:", currentUser);

    if (!socket) {
      console.log("🔴 socket is NULL → initializing...");
      socket = initializeSocket();
    }

    console.log("🟢 STEP 3 socket after init:", socket?.id);

    if (socket && currentUser) {
      console.log(" STEP 4 EMIT DATA:", {
        messageId,
        emoji,
        reactionUserId: currentUser._id,
      });

      socket.emit("add_reaction", {
        messageId,
        emoji,
        reactionUserId: currentUser._id,
      });
    } else {
      console.log("❌ STEP 5 emit blocked:", { socket, currentUser });
    }
  },

  startTying: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("typing_start", {
        conversationId: currentConversation?._id, // FIXED
        receiverId,
      });
    }
  },

  stopTying: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("typing_stop", {
        conversationId: currentConversation?._id, // FIXED
        receiverId,
      });
    }
  },

  isUserTyping: (userId) => {
    const { typingUsers, currentConversation } = get();
    const conversationId = currentConversation?._id;

    if (!conversationId || !typingUsers.has(conversationId) || !userId) {
      return false;
    }

    return typingUsers.get(conversationId)?.has(userId) || false;
  },

  isUserOnline: (userId) => {
    if (!userId) return null;

    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.isOnline || false;
  },

  getUserLastSeen: (userId) => {
    if (!userId) return null;

    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.lastSeen || false;
  },

  cleanup: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      onlineUsers: new Map(),
      typingUsers: new Map(),
    });
  },
}));
