import { create } from "zustand";
import { getSocket, initializeSocket } from "../services/chatService";
import axiosInstance from "../services/url.services";
import useUserStore from "./useUserStore";
import useLayoutStore from "./layoutStore";
import {
  getSharedAesKey,
  encryptText,
  decryptText,
  batchDecryptMessages,
} from "../utils/cryptoUtils";
function syncMessagesCache(cache, convId, newMessages) {
  if (!cache || !convId) return cache;
  const nextCache = new Map(cache);
  nextCache.set(String(convId), newMessages);
  return nextCache;
}

const readStatusCache = new Set();

async function decryptSingleMessage(
  msg,
  currentUserId,
  fallbackPeer = null,
  getStore = null,
) {
  if (!msg || !msg.isEncrypted || !msg.content || !msg.iv) {
    return msg;
  }
  if (msg._isDecrypted) {
    return msg;
  }

  const senderId = (msg.sender?._id || msg.sender)?.toString();
  const receiverId = (msg.receiver?._id || msg.receiver)?.toString();
  const myId = currentUserId?.toString();

  let peerId = null;
  let peerPubKey = null;

  if (senderId === myId) {
    peerId = receiverId;
    peerPubKey = msg.receiver?.publicKey || fallbackPeer?.publicKey;
  } else {
    peerId = senderId;
    peerPubKey = msg.sender?.publicKey || fallbackPeer?.publicKey;
  }

  if (!peerPubKey && peerId && getStore) {
    const userList = getStore()?.users || [];
    const foundUser = userList.find((u) => u._id?.toString() === peerId);
    if (foundUser?.publicKey) {
      peerPubKey = foundUser.publicKey;
    }
  }

  if (!peerPubKey && peerId) {
    const activeContact = useLayoutStore.getState()?.selectedContact;
    if (activeContact?._id?.toString() === peerId && activeContact?.publicKey) {
      peerPubKey = activeContact.publicKey;
    }
  }

  if (!peerPubKey || !peerId || !myId) {
    return msg;
  }

  try {
    const sharedKey = await getSharedAesKey(peerId, peerPubKey, myId);
    if (!sharedKey) return msg;

    const decrypted = await decryptText(msg.content, msg.iv, sharedKey);
    if (decrypted !== null) {
      return {
        ...msg,
        content: decrypted,
        _isDecrypted: true,
      };
    }
  } catch (err) {
    console.warn("Failed to decrypt message:", err);
  }

  return msg;
}

const getStoredPinned = () => {
  try {
    const raw = localStorage.getItem("whatsapp_pinned_messages");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const valid = {};
    for (const [convId, data] of Object.entries(parsed)) {
      if (data && (!data.expiresAt || data.expiresAt > now)) {
        valid[convId] = data;
      }
    }
    return valid;
  } catch (e) {
    return {};
  }
};

export const useChatStore = create((set, get) => ({
  users: [],
  setUsers: (users) => set({ users }),
  conversations: { data: [] },
  currentConversation: null,
  currentUser: null,
  setCurrentConversation: (conversation) =>
    set({ currentConversation: conversation }),
  messages: [],
  messagesCache: new Map(),
  isMessagesLoading: false,
  setIsMessagesLoading: (isMessagesLoading) => set({ isMessagesLoading }),
  clearMessages: () => set({ messages: [], isMessagesLoading: false }),
  loading: false,
  error: null,
  onlineUsers: new Map(),
  typingUsers: new Map(),
  pinnedMessages: getStoredPinned(),
  pinMessage: (conversationId, message, duration = "7 days") => {
    if (!conversationId || !message) return;
    const pinnedAt = Date.now();
    let durationMs = 7 * 24 * 60 * 60 * 1000;
    if (duration === "24 hours") durationMs = 24 * 60 * 60 * 1000;
    if (duration === "30 days") durationMs = 30 * 24 * 60 * 60 * 1000;
    const expiresAt = pinnedAt + durationMs;

    const newPinned = {
      ...get().pinnedMessages,
      [conversationId]: {
        message,
        duration,
        pinnedAt,
        expiresAt,
      },
    };

    try {
      localStorage.setItem("whatsapp_pinned_messages", JSON.stringify(newPinned));
    } catch (e) {}

    set({ pinnedMessages: newPinned });
  },
  unpinMessage: (conversationId) => {
    if (!conversationId) return;
    const updated = { ...get().pinnedMessages };
    delete updated[conversationId];

    try {
      localStorage.setItem("whatsapp_pinned_messages", JSON.stringify(updated));
    } catch (e) {}

    set({ pinnedMessages: updated });
  },
  scrollPositions: {},
  saveScrollPosition: (id, pos) =>
    set((state) => ({
      scrollPositions: {
        ...state.scrollPositions,
        [id]: pos,
      },
    })),

  initSocketListener: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off("receive_message");
    socket.off("user_typing");
    socket.off("user_status");
    socket.off("message_send");
    socket.off("message_error");
    socket.off("message_deleted");
    socket.off("message_status_update");
    socket.off("message_read");
    socket.off("reaction_update");
    socket.off("poll_update");
    socket.off("message_status_update_bulk");

    socket.on("receive_message", (message) => {
      get().receiveMessage(message);
    });

    const handleStatusBulk = (ids, status) => {
      if (!ids || !ids.length) return;
      const strIds = new Set(
        ids.map((id) => (id?._id || id)?.toString()).filter(Boolean),
      );

      if (status === "read") {
        strIds.forEach((id) => readStatusCache.add(id));
      }

      set((state) => {
        let changed = false;
        const nextMessages = state.messages.map((msg) => {
          const msgIdStr = (msg._id?._id || msg._id)?.toString();
          if (strIds.has(msgIdStr)) {
            if (msg.messageStatus !== status) {
              changed = true;
            }
            return { ...msg, messageStatus: status };
          }
          return msg;
        });

        let convsChanged = false;
        const nextConversationsData = state.conversations?.data?.map((conv) => {
          const lastMsgId = (
            conv.lastMessage?._id || conv.lastMessage
          )?.toString();
          if (
            strIds.has(lastMsgId) &&
            conv.lastMessage?.messageStatus !== status
          ) {
            convsChanged = true;
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                messageStatus: status,
              },
            };
          }
          return conv;
        });

        if (!changed && !convsChanged) return {};

        const convId = state.currentConversation?._id;
        const nextCache =
          convId && changed
            ? syncMessagesCache(state.messagesCache, convId, nextMessages)
            : state.messagesCache;

        return {
          messages: changed ? nextMessages : state.messages,
          messagesCache: nextCache,
          conversations: convsChanged
            ? { ...state.conversations, data: nextConversationsData }
            : state.conversations,
        };
      });
    };

    socket.on("message_status_update_bulk", ({ messageIds, messageStatus }) => {
      const ids = Array.isArray(messageIds) ? messageIds : [];
      handleStatusBulk(ids, messageStatus || "read");
    });

    socket.on("message_send", (message) => {
      set((state) => {
        const nextMessages = state.messages.map((msg) =>
          msg._id === message._id ? { ...msg } : msg,
        );
        const nextCache = state.currentConversation?._id
          ? syncMessagesCache(
              state.messagesCache,
              state.currentConversation._id,
              nextMessages,
            )
          : state.messagesCache;
        return { messages: nextMessages, messagesCache: nextCache };
      });
    });

    socket.on("message_status_update", ({ messageId, messageStatus }) => {
      if (messageId) {
        handleStatusBulk([messageId], messageStatus || "read");
      }
    });

    socket.on("message_read", (payload) => {
      const rawIds =
        payload?.messageIds ||
        (payload?._id
          ? [payload._id]
          : payload?.messageId
            ? [payload.messageId]
            : []);
      const ids = Array.isArray(rawIds) ? rawIds : [];
      handleStatusBulk(ids, payload?.messageStatus || "read");
    });

    socket.on("reaction_update", ({ messageId, reactions }) => {
      const cleanReactions = (reactions || []).filter((r) =>
        Boolean(r && r.emoji),
      );
      set((state) => {
        const nextMessages = state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions: cleanReactions } : msg,
        );
        const nextCache = state.currentConversation?._id
          ? syncMessagesCache(
              state.messagesCache,
              state.currentConversation._id,
              nextMessages,
            )
          : state.messagesCache;
        return { messages: nextMessages, messagesCache: nextCache };
      });
    });

    socket.on("poll_update", ({ messageId, pollData }) => {
      set((state) => {
        const nextMessages = state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, pollData } : msg,
        );
        const nextCache = state.currentConversation?._id
          ? syncMessagesCache(
              state.messagesCache,
              state.currentConversation._id,
              nextMessages,
            )
          : state.messagesCache;
        return { messages: nextMessages, messagesCache: nextCache };
      });
    });

    socket.on(
      "message_deleted",
      async ({ deletedMessageId, conversationId, lastMessage }) => {
        const currentUserId = (
          get().currentUser || useUserStore.getState().user
        )?._id;
        const selectedContact = useLayoutStore.getState()?.selectedContact;
        let decryptedLast = lastMessage;

        if (
          lastMessage &&
          lastMessage.isEncrypted &&
          !lastMessage._isDecrypted
        ) {
          decryptedLast = await decryptSingleMessage(
            lastMessage,
            currentUserId,
            selectedContact,
            get,
          );
        }

        set((state) => {
          const updatedMessages = state.messages.filter(
            (msg) => msg._id !== deletedMessageId,
          );

          let finalLastMessage = decryptedLast;
          if (
            !finalLastMessage &&
            String(state.currentConversation?._id) === String(conversationId) &&
            updatedMessages.length > 0
          ) {
            finalLastMessage = updatedMessages[updatedMessages.length - 1];
          }

          const cache = state.messagesCache || new Map();
          if (conversationId) {
            const cached = cache.get(String(conversationId));
            if (cached) {
              cache.set(
                String(conversationId),
                cached.filter((m) => m._id !== deletedMessageId),
              );
            }
          }

          return {
            messages: updatedMessages,
            messagesCache: new Map(cache),
            conversations: {
              ...state.conversations,
              data: state.conversations?.data?.map((conv) =>
                String(conv._id) === String(conversationId)
                  ? {
                      ...conv,
                      lastMessage: finalLastMessage || null,
                    }
                  : conv,
              ),
            },
          };
        });
      },
    );

    socket.on("message_edited", async ({ message }) => {
      const currentUserId = (get().currentUser || useUserStore.getState().user)
        ?._id;
      const selectedContact = useLayoutStore.getState()?.selectedContact;
      const decrypted = await decryptSingleMessage(
        message,
        currentUserId,
        selectedContact,
        get,
      );

      set((state) => {
        const nextMessages = state.messages.map((oldMessage) =>
          oldMessage._id === decrypted._id ? decrypted : oldMessage,
        );
        const convId =
          decrypted.conversation?._id ||
          decrypted.conversation ||
          state.currentConversation?._id;
        const nextCache = convId
          ? syncMessagesCache(state.messagesCache, convId, nextMessages)
          : state.messagesCache;
        return { messages: nextMessages, messagesCache: nextCache };
      });
    });

    socket.on("message_error", (error) => {
      console.error("Message error:", error);
      set({ error: error.message });
    });

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

    socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(userId, { isOnline, lastSeen });
        return { onlineUsers: newOnlineUsers };
      });
    });
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
  setCurrentUser: (user) => set({ currentUser: user }),

  fetchConversations: async () => {
    if (!get().conversations?.data?.length) {
      set({ loading: true, error: null });
    }
    try {
      const { data } = await axiosInstance.get("/chat/conversation");
      const currentUserId = (get().currentUser || useUserStore.getState().user)
        ?._id;

      let convData = data;
      if (Array.isArray(data?.data)) {
        const decryptedList = await Promise.all(
          data.data.map(async (conv) => {
            if (conv.lastMessage?.isEncrypted) {
              const peer = conv.participants?.find(
                (p) => p._id?.toString() !== currentUserId?.toString(),
              );
              const decryptedLast = await decryptSingleMessage(
                conv.lastMessage,
                currentUserId,
                peer,
                get,
              );
              return { ...conv, lastMessage: decryptedLast };
            }
            return conv;
          }),
        );
        convData = { ...data, data: decryptedList };
      }

      set({ conversations: convData, loading: false });
      get().initSocketListener();
      return convData;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
        loading: false,
      });
      return null;
    }
  },

  fetchMessages: async (conversationId) => {
    if (!conversationId) {
      set({ isMessagesLoading: false, messages: [] });
      return [];
    }

    const convIdStr = conversationId.toString();
    const cachedMessages = get().messagesCache?.get(convIdStr);

    if (cachedMessages && cachedMessages.length > 0) {
      set({
        messages: cachedMessages,
        currentConversation: { _id: conversationId },
        isMessagesLoading: false,
        loading: false,
      });
      get().markMessageAsRead();
    } else {
      set({
        loading: true,
        isMessagesLoading: true,
        error: null,
        messages: [],
      });
    }

    try {
      const { data } = await axiosInstance.get(
        `/chat/conversation/${conversationId}/messages`,
      );
      const rawMessages = data?.data || data || [];
      const currentUserId = (get().currentUser || useUserStore.getState().user)
        ?._id;
      const selectedContact = useLayoutStore.getState()?.selectedContact;

      const peerId = selectedContact?._id?.toString();
      let peerPubKey = selectedContact?.publicKey;
      if (!peerPubKey && peerId) {
        const foundUser = (get().users || []).find(
          (u) => u._id?.toString() === peerId,
        );
        peerPubKey = foundUser?.publicKey;
      }

      const decryptedMessages = await batchDecryptMessages(
        rawMessages,
        currentUserId,
        peerId,
        peerPubKey,
      );

      const cache = get().messagesCache || new Map();
      cache.set(convIdStr, decryptedMessages);

      set({
        messages: decryptedMessages,
        messagesCache: cache,
        currentConversation: { _id: conversationId },
        loading: false,
        isMessagesLoading: false,
      });
      get().markMessageAsRead();

      return decryptedMessages;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
        loading: false,
        isMessagesLoading: false,
      });
      return [];
    }
  },

  sendMessage: async (formData) => {
    const senderId = formData.get("senderId");
    const receiverId = formData.get("receiverId");
    const media = formData.get("media");
    const content = formData.get("content");
    const messageStatus = formData.get("messageStatus");
    const customContentType = formData.get("contentType");

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

    const selectedContact = useLayoutStore.getState()?.selectedContact;
    let peerPubKey =
      selectedContact?._id?.toString() === receiverId?.toString()
        ? selectedContact?.publicKey
        : null;

    if (!peerPubKey) {
      const allUsers = get().users || [];
      const foundPeer = allUsers.find(
        (u) => u._id?.toString() === receiverId?.toString(),
      );
      peerPubKey = foundPeer?.publicKey;
    }

    let isEncrypted = false;
    let iv = null;
    let rawContentToKeep = content;

    if (
      peerPubKey &&
      content &&
      typeof content === "string" &&
      content.trim()
    ) {
      try {
        const sharedKey = await getSharedAesKey(
          receiverId,
          peerPubKey,
          senderId,
        );
        if (sharedKey) {
          const encResult = await encryptText(content, sharedKey);
          if (encResult) {
            formData.set("content", encResult.ciphertext);
            formData.set("isEncrypted", "true");
            formData.set("iv", encResult.iv);
            isEncrypted = true;
            iv = encResult.iv;
          }
        }
      } catch (encErr) {
        console.warn("E2EE encryption warning:", encErr);
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
      content: rawContentToKeep,
      _isDecrypted: true,
      isEncrypted,
      iv,
      contentType:
        customContentType ||
        (media
          ? media?.type?.startsWith("image")
            ? "image"
            : "video"
          : "text"),
      createdAt: new Date().toISOString(),
      messageStatus,
    };

    set((state) => {
      const nextMessages = [...state.messages, optimisticMessage];
      const nextCache = conversationId
        ? syncMessagesCache(state.messagesCache, conversationId, nextMessages)
        : state.messagesCache;
      return {
        messages: nextMessages,
        messagesCache: nextCache,
        conversations: {
          ...state.conversations,
          data: state.conversations?.data?.map((conv) => {
            const isTarget =
              String(conv._id) === String(conversationId) ||
              conv.participants?.some(
                (p) => String(p?._id || p) === String(receiverId),
              );
            return isTarget
              ? { ...conv, lastMessage: optimisticMessage, unreadCount: 0 }
              : conv;
          }),
        },
      };
    });

    try {
      const { data } = await axiosInstance.post(
        "/chat/send-message",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      const messageData = data.data || data;
      const savedMsgId = String(messageData._id);
      const isAlreadyRead = readStatusCache.has(savedMsgId);
      const savedMessage = {
        ...messageData,
        messageStatus: isAlreadyRead
          ? "read"
          : messageData.messageStatus || "delivered",
        content: rawContentToKeep,
        _isDecrypted: true,
        isEncrypted: messageData.isEncrypted ?? isEncrypted,
        iv: messageData.iv ?? iv,
      };

      const resolvedConvId =
        savedMessage.conversation?._id ||
        savedMessage.conversation ||
        conversationId;

      set((state) => {
        const nextMessages = state.messages.map((msg) =>
          msg._id === tempId ? savedMessage : msg,
        );
        const nextCache = resolvedConvId
          ? syncMessagesCache(state.messagesCache, resolvedConvId, nextMessages)
          : state.messagesCache;
        return {
          messages: nextMessages,
          messagesCache: nextCache,
          conversations: {
            ...state.conversations,
            data: state.conversations?.data?.map((conv) => {
              const isTarget =
                String(conv._id) === String(resolvedConvId) ||
                conv.participants?.some(
                  (p) => String(p?._id || p) === String(receiverId),
                );
              return isTarget
                ? { ...conv, lastMessage: savedMessage, unreadCount: 0 }
                : conv;
            }),
          },
        };
      });

      return savedMessage;
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

  receiveMessage: async (message) => {
    if (!message) return;

    const { currentConversation, currentUser, messages } = get();

    const currentUserId = (currentUser || useUserStore.getState().user)?._id;
    const selectedContact = useLayoutStore.getState()?.selectedContact;
    const decryptedMessage = await decryptSingleMessage(
      message,
      currentUserId,
      selectedContact,
      get,
    );

    const messageExists = messages.some(
      (msg) => msg._id === decryptedMessage._id,
    );
    if (messageExists) return;

    const conversationId =
      decryptedMessage.conversation?._id || decryptedMessage.conversation;

    const myId = currentUserId?.toString();
    const receiverId = (
      decryptedMessage.receiver?._id || decryptedMessage.receiver
    )?.toString();
    const senderId = (
      decryptedMessage.sender?._id || decryptedMessage.sender
    )?.toString();

    const activeContactId = selectedContact?._id?.toString();
    const isCurrentConversation =
      Boolean(
        conversationId &&
        currentConversation?._id &&
        String(conversationId) === String(currentConversation._id),
      ) ||
      Boolean(
        activeContactId &&
        (senderId === activeContactId || receiverId === activeContactId),
      );

    const isForCurrentUser =
      Boolean(myId && receiverId && receiverId === myId) ||
      Boolean(myId && senderId && senderId !== myId);
    const isSentByCurrentUser = Boolean(myId && senderId && senderId === myId);

    if (isCurrentConversation) {
      if (isForCurrentUser) {
        decryptedMessage.messageStatus = "read";
      }

      set((state) => {
        const nextMessages = [...state.messages, decryptedMessage];
        const nextCache = conversationId
          ? syncMessagesCache(state.messagesCache, conversationId, nextMessages)
          : state.messagesCache;
        return {
          messages: nextMessages,
          messagesCache: nextCache,
        };
      });

      if (isForCurrentUser && decryptedMessage._id) {
        get().markMessageAsRead([decryptedMessage._id]);
      }
    } else if (conversationId) {
      const cache = get().messagesCache;
      const convKey = String(conversationId);
      if (cache && cache.has(convKey)) {
        const cached = cache.get(convKey);
        if (!cached.some((m) => m._id === decryptedMessage._id)) {
          const nextCache = new Map(cache);
          nextCache.set(convKey, [...cached, decryptedMessage]);
          set({ messagesCache: nextCache });
        }
      }
    }

    set((state) => ({
      conversations: {
        ...state.conversations,
        data: state.conversations?.data?.map((conv) => {
          if (String(conv._id) !== String(conversationId)) {
            return conv;
          }

          let nextUnread = conv.unreadCount || 0;
          if (isCurrentConversation) {
            nextUnread = 0;
          } else if (isForCurrentUser) {
            nextUnread =
              typeof decryptedMessage.unreadCount === "number"
                ? decryptedMessage.unreadCount
                : (conv.unreadCount || 0) + 1;
          } else if (isSentByCurrentUser) {
            nextUnread = 0;
          }

          return {
            ...conv,
            lastMessage: decryptedMessage,
            unreadCount: nextUnread,
          };
        }),
      },
    }));
  },

  markMessageAsRead: async (explicitIds = null) => {
    const { messages, currentUser } = get();
    const effectiveUser = currentUser || useUserStore.getState().user;
    const myId = (effectiveUser?._id || effectiveUser?.id)?.toString();

    let unreadIds = [];
    if (Array.isArray(explicitIds) && explicitIds.length > 0) {
      unreadIds = explicitIds
        .map((id) => (id?._id || id)?.toString())
        .filter(Boolean);
    } else {
      if (!messages.length || !myId) {
        return;
      }
      unreadIds = messages
        .filter((msg) => {
          if (msg.messageStatus === "read") return false;
          const senderId = (msg.sender?._id || msg.sender)?.toString();
          const receiverId = (msg.receiver?._id || msg.receiver)?.toString();
          const isIncoming =
            (receiverId && receiverId === myId) ||
            (senderId && senderId !== myId);
          return isIncoming && Boolean(msg._id);
        })
        .map((msg) => (msg._id?._id || msg._id)?.toString())
        .filter(Boolean);
    }

    if (unreadIds.length === 0) return;

    try {
      const unreadIdStrs = new Set(unreadIds.map(String));
      unreadIdStrs.forEach((id) => readStatusCache.add(id));
      set((state) => {
        const nextMessages = state.messages.map((msg) =>
          unreadIdStrs.has(String(msg._id))
            ? {
                ...msg,
                messageStatus: "read",
              }
            : msg,
        );

        const convId =
          state.currentConversation?._id ||
          messages[0]?.conversation?._id ||
          messages[0]?.conversation;
        const nextCache = convId
          ? syncMessagesCache(state.messagesCache, convId, nextMessages)
          : state.messagesCache;

        return {
          messages: nextMessages,
          messagesCache: nextCache,
          conversations: {
            ...state.conversations,
            data: state.conversations?.data?.map((conv) =>
              String(conv._id) ===
              String(state.currentConversation?._id || convId)
                ? {
                    ...conv,
                    unreadCount: 0,
                  }
                : conv,
            ),
          },
        };
      });

      const socket = getSocket();
      if (socket) {
        socket.emit("message_read", {
          messageIds: unreadIds,
        });
      }

      await axiosInstance.put("/chat/messages/read", {
        messageIds: unreadIds,
      });
    } catch (error) {
      console.error("failed to mark message as read", error);
    }
  },

  deleteMessage: async (messageId, deleteFor) => {
    try {
      const { data } = await axiosInstance.delete(
        `/chat/messages/${messageId}`,
        {
          data: { deleteFor },
        },
      );

      const state = get();
      const currentConversationId = state.currentConversation?._id;
      const remainingMessages = (state.messages || []).filter(
        (msg) => msg?._id !== messageId,
      );
      const previousMsg =
        remainingMessages.length > 0
          ? remainingMessages[remainingMessages.length - 1]
          : null;

      const serverLastMsg = data?.data?.lastMessage || data?.lastMessage;
      const currentUserId = (state.currentUser || useUserStore.getState().user)
        ?._id;
      const selectedContact = useLayoutStore.getState()?.selectedContact;

      let decryptedServerLast = serverLastMsg;
      if (
        serverLastMsg &&
        serverLastMsg.isEncrypted &&
        !serverLastMsg._isDecrypted
      ) {
        decryptedServerLast = await decryptSingleMessage(
          serverLastMsg,
          currentUserId,
          selectedContact,
          get,
        );
      }

      const effectiveLastMessage = previousMsg || decryptedServerLast || null;

      set((currentState) => {
        let updatedConvData = currentState.conversations?.data;
        if (updatedConvData) {
          updatedConvData = updatedConvData.map((conv) => {
            const isMatchConv = currentConversationId
              ? String(conv._id) === String(currentConversationId)
              : false;
            const wasLastMessage =
              String(conv.lastMessage?._id) === String(messageId);

            if (isMatchConv || wasLastMessage) {
              return {
                ...conv,
                lastMessage: effectiveLastMessage,
              };
            }
            return conv;
          });
        }

        const nextCache = currentConversationId
          ? syncMessagesCache(
              currentState.messagesCache,
              currentConversationId,
              remainingMessages,
            )
          : currentState.messagesCache;

        return {
          messages: remainingMessages,
          messagesCache: nextCache,
          conversations: currentState.conversations
            ? {
                ...currentState.conversations,
                data: updatedConvData,
              }
            : currentState.conversations,
        };
      });
      return true;
    } catch (error) {
      console.log("error deleting message", error);
      set({ error: error.response?.data?.message || error.message });
      return false;
    }
  },

  editMessage: async (messageId, content, eventData = null) => {
    try {
      const payload = { content };
      if (eventData) {
        payload.eventData = eventData;
      }

      const existingMsg = get().messages.find((m) => m._id === messageId);
      const currentUserId = (get().currentUser || useUserStore.getState().user)
        ?._id;
      const selectedContact = useLayoutStore.getState()?.selectedContact;

      let isEncrypted = existingMsg?.isEncrypted;
      let rawText = content;

      if (isEncrypted && content && typeof content === "string") {
        const peerId = selectedContact?._id?.toString();
        const peerPubKey = selectedContact?.publicKey;

        if (peerId && peerPubKey && currentUserId) {
          try {
            const sharedKey = await getSharedAesKey(
              peerId,
              peerPubKey,
              currentUserId,
            );
            if (sharedKey) {
              const enc = await encryptText(content, sharedKey);
              if (enc) {
                payload.content = enc.ciphertext;
                payload.isEncrypted = true;
                payload.iv = enc.iv;
              }
            }
          } catch (err) {
            console.warn("Failed to encrypt edited message:", err);
          }
        }
      }

      const response = await axiosInstance.put(
        `/chat/messages/${messageId}`,
        payload,
      );

      if (response.data?.data) {
        const returnedMsg = response.data.data;
        const msgToStore = {
          ...returnedMsg,
          content: rawText,
          _isDecrypted: true,
        };

        set((state) => {
          const nextMessages = state.messages.map((m) =>
            m._id === messageId ? msgToStore : m,
          );
          const nextCache = state.currentConversation?._id
            ? syncMessagesCache(
                state.messagesCache,
                state.currentConversation._id,
                nextMessages,
              )
            : state.messagesCache;
          return {
            messages: nextMessages,
            messagesCache: nextCache,
          };
        });
      }

      return response.data;
    } catch (error) {
      console.error(
        "EDIT MESSAGE ERROR:",
        error.response?.data || error.message,
      );
      throw error.response?.data || error;
    }
  },

  addReaction: async (messageId, emoji) => {
    let socket = getSocket();
    const currentUser = get().currentUser || useUserStore.getState().user;

    if (!socket) {
      socket = initializeSocket();
    }

    if (socket && currentUser) {
      const reactionUserId = currentUser._id || currentUser.id;

      set((state) => ({
        messages: state.messages.map((msg) => {
          if (msg._id !== messageId) return msg;
          const currentReactions = (msg.reactions || []).filter((r) =>
            Boolean(r && r.emoji),
          );
          const filtered = currentReactions.filter(
            (r) => String(r.userId?._id || r.userId) !== String(reactionUserId),
          );
          return {
            ...msg,
            reactions: emoji
              ? [
                  ...filtered,
                  {
                    userId: {
                      _id: reactionUserId,
                      username: currentUser.username,
                      profilePicture: currentUser.profilePicture,
                    },
                    emoji,
                  },
                ]
              : filtered,
          };
        }),
      }));

      socket.emit("add_reaction", {
        messageId,
        emoji: emoji || null,
        reactionUserId,
      });
    }
  },

  removeReaction: async (messageId) => {
    return get().addReaction(messageId, null);
  },

  votePoll: async (messageId, optionIndex) => {
    let socket = getSocket();
    if (!socket) {
      socket = initializeSocket();
    }
    const currentUser = get().currentUser || useUserStore.getState().user;
    const voterId = (currentUser?._id || currentUser?.id)?.toString();
    if (!voterId || !messageId) return;

    set((state) => {
      const updatedMessages = state.messages.map((msg) => {
        if (
          msg._id !== messageId ||
          msg.contentType !== "poll" ||
          !msg.pollData
        ) {
          return msg;
        }

        const pollData = JSON.parse(JSON.stringify(msg.pollData));
        const allowMultiple = !!pollData.allowMultiple;

        if (!allowMultiple) {
          pollData.options.forEach((opt, idx) => {
            if (idx !== optionIndex) {
              opt.votes = (opt.votes || []).filter(
                (v) => (v?._id || v)?.toString() !== voterId,
              );
            }
          });
        }

        const targetOption = pollData.options[optionIndex];
        if (targetOption) {
          targetOption.votes = targetOption.votes || [];
          const alreadyVoted = targetOption.votes.some(
            (v) => (v?._id || v)?.toString() === voterId,
          );

          if (alreadyVoted) {
            targetOption.votes = targetOption.votes.filter(
              (v) => (v?._id || v)?.toString() !== voterId,
            );
          } else {
            targetOption.votes.push(voterId);
          }
        }

        return { ...msg, pollData };
      });

      return { messages: updatedMessages };
    });

    if (socket) {
      socket.emit("vote_poll", {
        messageId,
        optionIndex,
        voterId,
      });
    }

    try {
      const { data } = await axiosInstance.post(
        `/chat/messages/${messageId}/vote`,
        { optionIndex },
      );
      if (data?.data?.pollData) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === messageId ? { ...m, pollData: data.data.pollData } : m,
          ),
        }));
      }
    } catch (err) {
      console.error("VOTE POLL REST SYNC ERROR:", err);
    }
  },

  startTying: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("typing_start", {
        conversationId: currentConversation?._id,
        receiverId,
      });
    }
  },

  stopTying: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("typing_stop", {
        conversationId: currentConversation?._id,
        receiverId,
      });
    }
  },

  isUserTyping: (conversationId, userId) => {
    const { typingUsers } = get();

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
