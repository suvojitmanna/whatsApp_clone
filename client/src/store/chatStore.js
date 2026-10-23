import { create } from "zustand";
import { getSocket, initializeSocket } from "../services/chatService";
import axiosInstance from "../services/url.services";
import useUserStore from "./useUserStore";
import useLayoutStore from "./layoutStore";
import { getDisappearingDurationMs } from "../utils/formatTime";
import {
  getSharedAesKey,
  encryptText,
  decryptText,
  batchDecryptMessages,
  clearSharedKeyCache,
} from "../utils/cryptoUtils";
function syncMessagesCache(cache, convId, newMessages) {
  if (!cache || !convId) return cache;
  const nextCache = new Map(cache);
  nextCache.set(String(convId), newMessages);
  return nextCache;
}

const readStatusCache = new Set();

if (typeof window !== "undefined") {
  try {
    sessionStorage.removeItem("whatsapp_chat_scroll_positions");
    localStorage.removeItem("whatsapp_chat_scroll_positions");
  } catch (e) {
    console.log(e);
  }
}

export const getTargetUserId = (contact, currentUserId) => {
  if (!contact) return null;
  if (Array.isArray(contact.participants) && contact.participants.length > 0) {
    const other = contact.participants.find(
      (p) => String(p?._id || p) !== String(currentUserId),
    );
    if (other) return String(other?._id || other);
  }
  if (
    Array.isArray(contact.conversation?.participants) &&
    contact.conversation.participants.length > 0
  ) {
    const other = contact.conversation.participants.find(
      (p) => String(p?._id || p) !== String(currentUserId),
    );
    if (other) return String(other?._id || other);
  }
  if (contact.user?._id) return String(contact.user._id);
  if (
    contact._id &&
    contact.conversation &&
    String(contact._id) !== String(contact.conversation?._id)
  ) {
    return String(contact._id);
  }
  if (contact.userId) return String(contact.userId);
  if (contact._id) return String(contact._id);
  if (contact.id) return String(contact.id);
  return null;
};

export async function decryptSingleMessage(
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

  const myId = (
    currentUserId ||
    useUserStore.getState()?.user?._id ||
    useUserStore.getState()?.user?.id
  )?.toString();
  const senderId = (msg.sender?._id || msg.sender)?.toString();
  const receiverId = (msg.receiver?._id || msg.receiver)?.toString();

  let peerId = null;
  let peerPubKey = null;

  if (senderId && myId && senderId === myId) {
    peerId = receiverId;
    peerPubKey = msg.receiver?.publicKey || fallbackPeer?.publicKey;
  } else if (senderId && myId && senderId !== myId) {
    peerId = senderId;
    peerPubKey = msg.sender?.publicKey || fallbackPeer?.publicKey;
  }

  if (!peerId && fallbackPeer) {
    peerId = (fallbackPeer._id || fallbackPeer.id || fallbackPeer)?.toString();
    if (!peerPubKey) peerPubKey = fallbackPeer.publicKey;
  }

  if (
    !peerId &&
    msg.conversation?.participants &&
    Array.isArray(msg.conversation.participants)
  ) {
    const otherPart = msg.conversation.participants.find(
      (p) => (p._id || p)?.toString() !== myId,
    );
    if (otherPart) {
      peerId = (otherPart._id || otherPart)?.toString();
      if (!peerPubKey && otherPart.publicKey) peerPubKey = otherPart.publicKey;
    }
  }

  if (!peerPubKey && peerId && getStore) {
    const userList = getStore()?.users || [];
    const foundUser = userList.find((u) => u._id?.toString() === peerId);
    if (foundUser?.publicKey) {
      peerPubKey = foundUser.publicKey;
    }
  }

  if (!peerPubKey && peerId && getStore) {
    const convs = getStore()?.conversations?.data || [];
    for (const c of convs) {
      const part = c.participants?.find(
        (p) => (p._id || p)?.toString() === peerId,
      );
      if (part?.publicKey) {
        peerPubKey = part.publicKey;
        break;
      }
    }
  }

  if (!peerPubKey && peerId) {
    const activeContact = useLayoutStore.getState()?.selectedContact;
    if (activeContact?._id?.toString() === peerId && activeContact?.publicKey) {
      peerPubKey = activeContact.publicKey;
    }
  }

  if (
    (!peerPubKey || !peerId) &&
    msg.conversation?.participants &&
    Array.isArray(msg.conversation.participants)
  ) {
    if (!peerId) {
      const otherPart = msg.conversation.participants.find(
        (p) => (p._id || p)?.toString() !== myId,
      );
      if (otherPart) {
        peerId = (otherPart._id || otherPart)?.toString();
        if (otherPart.publicKey) peerPubKey = otherPart.publicKey;
      }
    } else {
      const part = msg.conversation.participants.find(
        (p) => (p._id || p)?.toString() === peerId,
      );
      if (part?.publicKey) {
        peerPubKey = part.publicKey;
      }
    }
  }

  if (!peerPubKey && peerId) {
    try {
      const resp = await axiosInstance.get(`/auth/public-key/${peerId}`);
      peerPubKey = resp.data?.data?.publicKey || resp.data?.publicKey;
      if (peerPubKey && getStore) {
        const users = getStore()?.users || [];
        const userObj = users.find((u) => u._id?.toString() === peerId);
        if (userObj) userObj.publicKey = peerPubKey;
      }
    } catch (e) {
      console.log(e);
    }
  }

  if (!peerPubKey || !peerId || !myId) {
    return msg;
  }

  try {
    let sharedKey = await getSharedAesKey(peerId, peerPubKey, myId);
    let decrypted = null;
    if (sharedKey) {
      decrypted = await decryptText(msg.content, msg.iv, sharedKey);
    }

    if (decrypted === null) {
      clearSharedKeyCache(peerId);
      try {
        const resp = await axiosInstance.get(`/auth/public-key/${peerId}`);
        const freshKey = resp.data?.data?.publicKey || resp.data?.publicKey;
        if (freshKey) {
          peerPubKey = freshKey;
          sharedKey = await getSharedAesKey(peerId, peerPubKey, myId);
          if (sharedKey) {
            decrypted = await decryptText(msg.content, msg.iv, sharedKey);
          }
        }
      } catch (retryErr) {}
    }

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

const getStoredStarred = () => {
  try {
    const raw = localStorage.getItem("whatsapp_starred_messages");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
};

const getStoredBlocked = () => {
  try {
    const raw = localStorage.getItem("whatsapp_blocked_contacts");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

export const useChatStore = create((set, get) => ({
  users: [],
  setUsers: (users) => {
    if (Array.isArray(users)) {
      set((state) => {
        const nextOnline = new Map(state.onlineUsers || new Map());
        users.forEach((u) => {
          if (u && u._id) {
            const uId = u._id.toString();
            if (!nextOnline.has(uId) && u.isOnline !== undefined) {
              nextOnline.set(uId, {
                isOnline: Boolean(u.isOnline),
                lastSeen: u.lastSeen,
              });
            }
          }
        });
        return { users, onlineUsers: nextOnline };
      });
    } else {
      set({ users });
    }
  },
  conversations: { data: [] },
  currentConversation: null,
  currentUser: useUserStore.getState()?.user || null,
  setCurrentConversation: (conversation) =>
    set({ currentConversation: conversation }),
  messages: [],
  messagesCache: new Map(),
  isMessagesLoading: false,
  setIsMessagesLoading: (isMessagesLoading) => set({ isMessagesLoading }),
  clearMessages: () => set({ messages: [], isMessagesLoading: false }),
  clearUnreadCount: (targetId) => {
    if (!targetId) return;
    const strId = (targetId?._id || targetId)?.toString();
    set((state) => ({
      conversations: {
        ...state.conversations,
        data: state.conversations?.data?.map((conv) => {
          const isMatch =
            String(conv._id) === strId ||
            conv.participants?.some((p) => String(p?._id || p) === strId);
          return isMatch ? { ...conv, unreadCount: 0 } : conv;
        }),
      },
      users: state.users?.map((u) => {
        const isMatch =
          String(u._id) === strId ||
          (u.conversation && String(u.conversation._id) === strId);
        if (isMatch && u.conversation) {
          return {
            ...u,
            conversation: {
              ...u.conversation,
              unreadCount: 0,
            },
          };
        }
        return u;
      }),
    }));
  },
  loading: false,
  error: null,
  onlineUsers: new Map(),
  typingUsers: new Map(),
  pinnedMessages: getStoredPinned(),
  starredMessages: getStoredStarred(),
  toggleStarMessage: (messageId, message = null) => {
    if (!messageId) return false;
    const current = { ...get().starredMessages };
    let isStarred = false;
    if (current[messageId]) {
      delete current[messageId];
      isStarred = false;
    } else {
      current[messageId] = {
        messageId,
        message,
        starredAt: Date.now(),
      };
      isStarred = true;
    }

    try {
      localStorage.setItem(
        "whatsapp_starred_messages",
        JSON.stringify(current),
      );
    } catch (e) {}

    set({ starredMessages: current });
    return isStarred;
  },
  isMessageStarred: (messageId) => {
    if (!messageId) return false;
    return Boolean(get().starredMessages[messageId]);
  },
  blockedContacts: getStoredBlocked(),
  fetchBlockedUsers: async () => {
    try {
      const { data } = await axiosInstance.get("/chat/blocked-users");
      const list = (data?.data?.blockedUsers || data?.blockedUsers || []).map(
        String,
      );
      try {
        localStorage.setItem("whatsapp_blocked_contacts", JSON.stringify(list));
      } catch (e) {}
      set({ blockedContacts: list });
    } catch (error) {
      console.error("fetchBlockedUsers error:", error);
    }
  },
  blockContact: async (targetId) => {
    if (!targetId) return;
    const strId = (targetId?._id || targetId)?.toString();
    const current = get().blockedContacts || [];
    if (!current.includes(strId)) {
      const next = [...current, strId];
      try {
        localStorage.setItem("whatsapp_blocked_contacts", JSON.stringify(next));
      } catch (e) {}
      set({ blockedContacts: next });
    }
    try {
      await axiosInstance.post("/chat/block-user", { targetUserId: strId });
    } catch (error) {
      console.error("block-user error:", error);
    }
  },
  unblockContact: async (targetId, fallbackId = null) => {
    if (!targetId && !fallbackId) return;
    const strId = targetId ? (targetId?._id || targetId)?.toString() : null;
    const strFallback = fallbackId
      ? (fallbackId?._id || fallbackId)?.toString()
      : null;
    const current = get().blockedContacts || [];
    const next = current.filter((id) => id !== strId && id !== strFallback);
    try {
      localStorage.setItem("whatsapp_blocked_contacts", JSON.stringify(next));
    } catch (e) {}
    set({ blockedContacts: next });
    try {
      await axiosInstance.post("/chat/unblock-user", {
        targetUserId: strId || strFallback,
      });
    } catch (error) {
      console.error("unblock-user error:", error);
    }
  },
  isContactBlocked: (targetId) => {
    if (!targetId) return false;
    const strId = (targetId?._id || targetId)?.toString();
    return Boolean(get().blockedContacts?.includes(strId));
  },
  clearChat: async (conversationId, targetUserId = null) => {
    const state = get();
    const currentConvId = conversationId || state.currentConversation?._id;
    const targetId = targetUserId || state.selectedContact?._id;

    const nextCache = new Map(state.messagesCache || new Map());
    if (currentConvId) nextCache.set(String(currentConvId), []);
    if (targetId) nextCache.set(String(targetId), []);

    const nextConversationsData = state.conversations?.data?.map((conv) => {
      const isMatch =
        (currentConvId && String(conv._id) === String(currentConvId)) ||
        (targetId &&
          conv.participants?.some(
            (p) => String(p?._id || p) === String(targetId),
          ));
      if (isMatch) {
        return {
          ...conv,
          lastMessage: null,
          unreadCount: 0,
        };
      }
      return conv;
    });

    set({
      messages: [],
      messagesCache: nextCache,
      conversations: state.conversations
        ? { ...state.conversations, data: nextConversationsData }
        : state.conversations,
    });

    try {
      await axiosInstance.post("/chat/clear-chat", {
        conversationId: currentConvId,
        targetUserId: targetId,
      });
    } catch (error) {
      console.error("clearChat error:", error);
    }
  },
  deleteChat: async (conversationId, targetUserId = null) => {
    const state = get();
    const currentConvId = conversationId || state.currentConversation?._id;
    const targetId = targetUserId || state.selectedContact?._id;

    const nextCache = new Map(state.messagesCache || new Map());
    if (currentConvId) nextCache.delete(String(currentConvId));
    if (targetId) nextCache.delete(String(targetId));

    const nextConversationsData = (state.conversations?.data || []).filter(
      (conv) => {
        const isMatch =
          (currentConvId && String(conv._id) === String(currentConvId)) ||
          (targetId &&
            conv.participants?.some(
              (p) => String(p?._id || p) === String(targetId),
            ));
        return !isMatch;
      },
    );

    set({
      messages: [],
      messagesCache: nextCache,
      currentConversation: null,
      conversations: {
        ...state.conversations,
        data: nextConversationsData,
      },
    });

    try {
      useLayoutStore.getState().setSelectedContact(null);
    } catch (e) {}

    try {
      await axiosInstance.post("/chat/delete-chat", {
        conversationId: currentConvId,
        targetUserId: targetId,
      });
    } catch (error) {
      console.error("deleteChat error:", error);
    }
  },
  updateConversationDisappearing: (targetIds, duration, setBy, updatedAt) => {
    const idsSet = new Set((targetIds || []).map(String));
    const effectiveTime = updatedAt || new Date().toISOString();
    set((state) => {
      const nextData = state.conversations?.data?.map((conv) => {
        const cId = String(conv._id);
        const matches =
          idsSet.has(cId) ||
          conv.participants?.some((p) => idsSet.has(String(p?._id || p)));
        if (matches) {
          return {
            ...conv,
            disappearingDuration: duration,
            disappearingSetBy: setBy,
            disappearingUpdatedAt: effectiveTime,
          };
        }
        return conv;
      });
      return {
        conversations: state.conversations
          ? { ...state.conversations, data: nextData }
          : state.conversations,
      };
    });
  },
  pinMessage: async (
    conversationId,
    message,
    duration = "7 days",
    secondaryId = null,
    receiverId = null,
    emitSocket = true,
    pinnedBy = null,
    pinnedAtParam = null,
    expiresAtParam = null,
  ) => {
    if (!conversationId && !secondaryId && !receiverId) return;
    if (!message) return;

    let finalMessage = message;
    if (finalMessage.isEncrypted && !finalMessage._isDecrypted) {
      const currentUserId = (get().currentUser || useUserStore.getState().user)
        ?._id;
      finalMessage = await decryptSingleMessage(
        finalMessage,
        currentUserId,
        null,
        get,
      );
    }

    const pinnedAt = pinnedAtParam
      ? new Date(pinnedAtParam).getTime()
      : Date.now();
    let durationMs = 7 * 24 * 60 * 60 * 1000;
    if (duration === "24 hours") durationMs = 24 * 60 * 60 * 1000;
    if (duration === "30 days") durationMs = 30 * 24 * 60 * 60 * 1000;
    const expiresAt = expiresAtParam
      ? new Date(expiresAtParam).getTime()
      : pinnedAt + durationMs;

    const user = useUserStore.getState()?.user;
    const currentUserId = (user?._id || user?.id)?.toString();
    const effectivePinnedBy =
      pinnedBy && typeof pinnedBy === "object"
        ? pinnedBy
        : pinnedBy && pinnedBy.toString() !== currentUserId
          ? pinnedBy
          : user
            ? {
                _id: currentUserId,
                username: user.username,
                profilePicture: user.profilePicture,
              }
            : currentUserId;

    const pinData = {
      message: finalMessage || message,
      duration,
      pinnedAt,
      expiresAt,
      pinnedBy: effectivePinnedBy,
    };

    const newPinned = {
      ...get().pinnedMessages,
    };

    const addKey = (k) => {
      if (!k) return;
      const str = (k?._id || k)?.toString();
      if (str) newPinned[str] = pinData;
    };

    const senderId = (message?.sender?._id || message?.sender)?.toString();
    const receiverIdStr = (
      message?.receiver?._id || message?.receiver
    )?.toString();
    const otherUserId = senderId === currentUserId ? receiverIdStr : senderId;

    addKey(conversationId);
    addKey(secondaryId);
    addKey(receiverId);
    addKey(otherUserId);
    addKey(senderId);
    addKey(receiverIdStr);
    addKey(effectivePinnedBy);
    addKey(message?.conversationId);
    addKey(message?.conversation?._id || message?.conversation);

    try {
      localStorage.setItem(
        "whatsapp_pinned_messages",
        JSON.stringify(newPinned),
      );
    } catch (e) {}

    set((state) => ({
      pinnedMessages: newPinned,
      conversations: state.conversations?.data
        ? {
            ...state.conversations,
            data: state.conversations.data.map((conv) => {
              const cId = conv?._id?.toString();
              const convTarget = (
                conversationId?._id || conversationId
              )?.toString();
              const secTarget = (secondaryId?._id || secondaryId)?.toString();
              const recTarget = (receiverId?._id || receiverId)?.toString();
              const msgConvId = (
                message?.conversation?._id ||
                message?.conversation ||
                message?.conversationId
              )?.toString();

              const matchesParticipant = conv.participants?.some((p) => {
                const pid = (p?._id || p)?.toString();
                return (
                  pid === secTarget ||
                  pid === recTarget ||
                  pid === senderId ||
                  pid === receiverIdStr
                );
              });

              if (
                cId &&
                (cId === convTarget ||
                  cId === secTarget ||
                  cId === msgConvId ||
                  matchesParticipant)
              ) {
                return {
                  ...conv,
                  pinnedMessage: {
                    message: finalMessage || message,
                    duration,
                    pinnedAt: new Date(pinnedAt),
                    expiresAt: new Date(expiresAt),
                    pinnedBy: effectivePinnedBy,
                  },
                };
              }
              return conv;
            }),
          }
        : state.conversations,
    }));

    try {
      const layout = useLayoutStore.getState();
      const sel = layout.selectedContact;
      if (sel) {
        const selConvId = String(
          sel.conversation?._id || sel.conversation || "",
        );
        const selUserId = String(sel._id || "");
        const convTarget = (conversationId?._id || conversationId)?.toString();
        const secTarget = (secondaryId?._id || secondaryId)?.toString();
        const recTarget = (receiverId?._id || receiverId)?.toString();
        if (
          (convTarget && selConvId === convTarget) ||
          (secTarget && selUserId === secTarget) ||
          (recTarget && selUserId === recTarget) ||
          (otherUserId && selUserId === otherUserId)
        ) {
          layout.updateSelectedContact({
            conversation: {
              ...(typeof sel.conversation === "object" ? sel.conversation : {}),
              pinnedMessage: pinData,
            },
          });
        }
      }
    } catch (e) {}

    if (emitSocket) {
      const socket = getSocket();
      if (socket) {
        const user = useUserStore.getState()?.user;
        const currentUserId = (user?._id || user?.id)?.toString();
        const targetReceiverId =
          receiverId ||
          (message.sender?._id?.toString() === currentUserId
            ? message.receiver?._id || message.receiver
            : message.sender?._id || message.sender) ||
          secondaryId;

        socket.emit("pin_message", {
          conversationId: (conversationId?._id || conversationId)?.toString(),
          message: finalMessage || message,
          duration,
          pinnedBy: user
            ? {
                _id: currentUserId,
                username: user.username,
                profilePicture: user.profilePicture,
              }
            : currentUserId,
          receiverId: (targetReceiverId?._id || targetReceiverId)?.toString(),
          secondaryId: (secondaryId?._id || secondaryId)?.toString(),
        });
      }
    }
  },
  unpinMessage: (
    conversationId,
    secondaryId = null,
    receiverId = null,
    emitSocket = true,
    unpinnedBy = null,
  ) => {
    if (!conversationId && !secondaryId && !receiverId) return;
    const updated = { ...get().pinnedMessages };

    const keysToRemove = new Set();
    const addKey = (k) => {
      if (!k) return;
      const str = (k?._id || k)?.toString();
      if (str) keysToRemove.add(str);
    };

    addKey(conversationId);
    addKey(secondaryId);
    addKey(receiverId);
    addKey(unpinnedBy);

    const convIdStr = (conversationId?._id || conversationId)?.toString();
    const secIdStr = (secondaryId?._id || secondaryId)?.toString();
    const recIdStr = (receiverId?._id || receiverId)?.toString();

    Object.keys(updated).forEach((key) => {
      const pin = updated[key];
      if (!pin) return;
      const convMatch =
        convIdStr &&
        (key === convIdStr ||
          (pin.message?.conversation &&
            (
              pin.message.conversation._id || pin.message.conversation
            ).toString() === convIdStr) ||
          (pin.message?.conversationId &&
            pin.message.conversationId.toString() === convIdStr));
      const secMatch = secIdStr && key === secIdStr;
      const recMatch = recIdStr && key === recIdStr;
      if (convMatch || secMatch || recMatch) {
        keysToRemove.add(key);
        if (pin.message?.sender) addKey(pin.message.sender);
        if (pin.message?.receiver) addKey(pin.message.receiver);
        if (pin.message?.conversation) addKey(pin.message.conversation);
      }
    });

    keysToRemove.forEach((k) => {
      delete updated[k];
    });

    try {
      localStorage.setItem("whatsapp_pinned_messages", JSON.stringify(updated));
    } catch (e) {}

    set((state) => ({
      pinnedMessages: updated,
      conversations: state.conversations?.data
        ? {
            ...state.conversations,
            data: state.conversations.data.map((conv) => {
              const cId = conv?._id?.toString();
              if (
                cId &&
                (cId === convIdStr || cId === secIdStr || cId === recIdStr)
              ) {
                const nextConv = { ...conv };
                delete nextConv.pinnedMessage;
                return nextConv;
              }
              return conv;
            }),
          }
        : state.conversations,
    }));

    try {
      const layout = useLayoutStore.getState();
      const sel = layout.selectedContact;
      if (sel) {
        const selConvId = String(
          sel.conversation?._id || sel.conversation || "",
        );
        const selUserId = String(sel._id || "");
        if (keysToRemove.has(selConvId) || keysToRemove.has(selUserId)) {
          const nextConv = {
            ...(typeof sel.conversation === "object" ? sel.conversation : {}),
          };
          delete nextConv.pinnedMessage;
          layout.updateSelectedContact({ conversation: nextConv });
        }
      }
    } catch (e) {}

    if (emitSocket) {
      const socket = getSocket();
      if (socket) {
        const user = useUserStore.getState()?.user;
        const currentUserId = (user?._id || user?.id)?.toString();
        socket.emit("unpin_message", {
          conversationId: convIdStr,
          receiverId: recIdStr || secIdStr,
          secondaryId: secIdStr,
          unpinnedBy: currentUserId,
        });
      }
    }
  },
  scrollPositions: {},
  saveScrollPosition: (idOrIds, pos) => {
    if (!idOrIds || !pos) return;
    const ids = (Array.isArray(idOrIds) ? idOrIds : [idOrIds])
      .map((item) => (item?._id || item)?.toString())
      .filter(Boolean);
    if (ids.length === 0) return;

    set((state) => {
      const nextPositions = { ...state.scrollPositions };
      for (const id of ids) {
        nextPositions[id] = pos;
      }
      return { scrollPositions: nextPositions };
    });
  },

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
    socket.off("message_pinned");
    socket.off("message_unpinned");
    socket.off("user_blocked");
    socket.off("user_unblocked");
    socket.off("chat_cleared");
    socket.off("chat_deleted");
    socket.off("user_public_key_updated");
    socket.off("request_reencrypt_message");
    socket.off("message_reencrypted");
    socket.off("new_group_created");
    socket.off("group_message_receipt_update");

    get().fetchBlockedUsers();

    socket.on("user_public_key_updated", ({ userId, publicKey }) => {
      if (!userId || !publicKey) return;
      const strId = String(userId);
      clearSharedKeyCache(strId);
      const layout = useLayoutStore.getState();
      if (
        layout?.selectedContact &&
        String(layout.selectedContact._id) === strId
      ) {
        layout.updateSelectedContact({ publicKey });
      }
      set((state) => ({
        users: (state.users || []).map((u) =>
          String(u._id) === strId ? { ...u, publicKey } : u,
        ),
      }));
    });

    socket.on("request_reencrypt_message", async (data) => {
      if (!data) return;
      const { messageId, receiverId, receiverPublicKey, conversationId } = data;
      const currentUserId = (
        get().currentUser || useUserStore.getState().user
      )?._id?.toString();
      if (!currentUserId || !messageId) return;

      let targetMsg = get().messages.find(
        (m) => (m._id?._id || m._id)?.toString() === messageId.toString(),
      );
      if (!targetMsg) {
        for (const cachedList of (get().messagesCache || new Map()).values()) {
          const found = cachedList.find(
            (m) => (m._id?._id || m._id)?.toString() === messageId.toString(),
          );
          if (found) {
            targetMsg = found;
            break;
          }
        }
      }

      if (
        targetMsg &&
        targetMsg.content &&
        (targetMsg._isDecrypted ||
          (targetMsg.sender?._id || targetMsg.sender)?.toString() ===
            currentUserId)
      ) {
        try {
          const plainText = targetMsg.content;
          if (receiverId && receiverPublicKey) {
            clearSharedKeyCache(receiverId);
            const sharedKey = await getSharedAesKey(
              receiverId,
              receiverPublicKey,
              currentUserId,
            );
            if (sharedKey) {
              const enc = await encryptText(plainText, sharedKey);
              if (enc) {
                const sock = getSocket();
                if (sock) {
                  sock.emit("reencrypt_message_response", {
                    messageId,
                    conversationId,
                    receiverId,
                    content: enc.ciphertext,
                    iv: enc.iv,
                  });
                }
              }
            }
          }
        } catch (err) {
          console.warn("Failed to handle re-encrypt request:", err);
        }
      }
    });

    socket.on("message_reencrypted", async (data) => {
      if (!data) return;
      const { messageId, content, iv, message, conversationId } = data;
      const currentUserId = (get().currentUser || useUserStore.getState().user)
        ?._id;
      const selectedContact = useLayoutStore.getState()?.selectedContact;
      const rawMsg = message || {
        _id: messageId,
        content,
        iv,
        isEncrypted: true,
        conversation: conversationId,
      };

      const decrypted = await decryptSingleMessage(
        rawMsg,
        currentUserId,
        selectedContact,
        get,
      );

      const targetIdStr = messageId?.toString();
      set((state) => {
        const nextMessages = state.messages.map((m) => {
          if ((m._id?._id || m._id)?.toString() === targetIdStr) {
            return {
              ...m,
              content: decrypted._isDecrypted ? decrypted.content : content,
              iv: iv,
              _isDecrypted: Boolean(decrypted._isDecrypted),
            };
          }
          return m;
        });

        const nextCache = new Map(state.messagesCache || new Map());
        for (const [cId, list] of nextCache.entries()) {
          const updatedList = list.map((m) => {
            if ((m._id?._id || m._id)?.toString() === targetIdStr) {
              return {
                ...m,
                content: decrypted._isDecrypted ? decrypted.content : content,
                iv: iv,
                _isDecrypted: Boolean(decrypted._isDecrypted),
              };
            }
            return m;
          });
          nextCache.set(cId, updatedList);
        }

        return {
          messages: nextMessages,
          messagesCache: nextCache,
        };
      });
    });

    socket.on("message_pinned", async (data) => {
      if (!data) return;
      const {
        conversationId,
        message,
        duration,
        secondaryId,
        receiverId,
        pinnedBy,
        pinnedAt,
        expiresAt,
      } = data;
      let decMsg = message;
      if (decMsg?.isEncrypted && !decMsg?._isDecrypted) {
        const currentUserId = (
          get().currentUser || useUserStore.getState().user
        )?._id;
        decMsg = await decryptSingleMessage(decMsg, currentUserId, null, get);
      }
      get().pinMessage(
        conversationId,
        decMsg,
        duration || "7 days",
        secondaryId,
        receiverId,
        false,
        pinnedBy,
        pinnedAt,
        expiresAt,
      );
    });

    socket.on("message_unpinned", (data) => {
      if (!data) return;
      const { conversationId, secondaryId, receiverId, unpinnedBy } = data;
      get().unpinMessage(
        conversationId,
        secondaryId,
        receiverId,
        false,
        unpinnedBy,
      );
    });

    socket.on("disappearing_update", (data) => {
      if (!data) return;
      const {
        chatId,
        conversationId,
        secondaryId,
        receiverId,
        duration,
        event,
        setBy,
      } = data;
      const layout = useLayoutStore.getState();

      const allTargetIds = new Set(
        [chatId, conversationId, secondaryId, receiverId]
          .filter(Boolean)
          .map(String),
      );

      allTargetIds.forEach((id) => {
        if (event) {
          layout.receiveDisappearingEvent(id, duration, event);
        }
      });

      set((state) => {
        const nextData = state.conversations?.data?.map((conv) => {
          const cId = String(conv._id);
          const matches =
            allTargetIds.has(cId) ||
            conv.participants?.some((p) =>
              allTargetIds.has(String(p?._id || p)),
            );
          if (matches) {
            return {
              ...conv,
              disappearingDuration: duration,
              disappearingSetBy: setBy,
              disappearingUpdatedAt:
                event?.createdAt || new Date().toISOString(),
            };
          }
          return conv;
        });

        return {
          conversations: state.conversations
            ? { ...state.conversations, data: nextData }
            : state.conversations,
        };
      });

      const sel = layout.selectedContact;
      if (sel) {
        const selConvId = String(
          sel.conversation?._id || sel.conversation || "",
        );
        const selUserId = String(sel._id || "");
        if (allTargetIds.has(selConvId) || allTargetIds.has(selUserId)) {
          layout.updateSelectedContact({
            conversation: {
              ...(typeof sel.conversation === "object" ? sel.conversation : {}),
              disappearingDuration: duration,
              disappearingSetBy: setBy,
              disappearingUpdatedAt:
                event?.createdAt || new Date().toISOString(),
            },
          });
        }
      }
    });

    socket.on("receive_message", (message) => {
      get().receiveMessage(message);
    });

    socket.on("new_group_created", (newGroup) => {
      if (!newGroup) return;
      get().fetchConversations();
    });

    socket.on("user_blocked", ({ blockedUserId, blockedBy }) => {
      const myId = useUserStore.getState().user?._id?.toString();
      if (myId && String(blockedBy) === String(myId)) {
        const strId = String(blockedUserId);
        const current = get().blockedContacts || [];
        if (!current.includes(strId)) {
          const next = [...current, strId];
          try {
            localStorage.setItem(
              "whatsapp_blocked_contacts",
              JSON.stringify(next),
            );
          } catch (e) {}
          set({ blockedContacts: next });
        }
      }
    });

    socket.on("user_unblocked", ({ unblockedUserId, unblockedBy }) => {
      const myId = useUserStore.getState().user?._id?.toString();
      if (myId && String(unblockedBy) === String(myId)) {
        const strId = String(unblockedUserId);
        const current = get().blockedContacts || [];
        const next = current.filter((id) => id !== strId);
        try {
          localStorage.setItem(
            "whatsapp_blocked_contacts",
            JSON.stringify(next),
          );
        } catch (e) {}
        set({ blockedContacts: next });
      }
    });

    const handleStatusBulk = (ids, status, extraData = {}) => {
      if (!ids || !ids.length) return;
      const strIds = new Set(
        ids.map((id) => (id?._id || id)?.toString()).filter(Boolean),
      );

      if (status === "read") {
        strIds.forEach((id) => readStatusCache.add(id));
      }

      set((state) => {
        let changed = false;
        const nowIso = new Date().toISOString();
        const nextMessages = state.messages.map((msg) => {
          const msgIdStr = (msg._id?._id || msg._id)?.toString();
          if (strIds.has(msgIdStr)) {
            changed = true;
            return {
              ...msg,
              messageStatus: status,
              ...(status === "read" && {
                readAt: extraData.readAt || msg.readAt || nowIso,
                deliveredAt:
                  msg.deliveredAt ||
                  extraData.deliveredAt ||
                  msg.createdAt ||
                  nowIso,
              }),
              ...(status === "delivered" && {
                deliveredAt: extraData.deliveredAt || msg.deliveredAt || nowIso,
              }),
              ...extraData,
            };
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
                ...(status === "read" && {
                  readAt:
                    extraData.readAt || conv.lastMessage?.readAt || nowIso,
                  deliveredAt:
                    conv.lastMessage?.deliveredAt ||
                    extraData.deliveredAt ||
                    conv.lastMessage?.createdAt ||
                    nowIso,
                }),
                ...(status === "delivered" && {
                  deliveredAt:
                    extraData.deliveredAt ||
                    conv.lastMessage?.deliveredAt ||
                    nowIso,
                }),
                ...extraData,
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

    socket.on(
      "message_status_update_bulk",
      ({ messageIds, messageStatus, readAt, deliveredAt }) => {
        const ids = Array.isArray(messageIds) ? messageIds : [];
        handleStatusBulk(ids, messageStatus || "read", {
          readAt,
          deliveredAt,
        });
      },
    );

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

    socket.on(
      "message_status_update",
      ({ messageId, messageStatus, readAt, deliveredAt }) => {
        if (messageId) {
          handleStatusBulk([messageId], messageStatus || "read", {
            readAt,
            deliveredAt,
          });
        }
      },
    );

    socket.on("message_read", (payload) => {
      const rawIds =
        payload?.messageIds ||
        (payload?._id
          ? [payload._id]
          : payload?.messageId
            ? [payload.messageId]
            : []);
      const ids = Array.isArray(rawIds) ? rawIds : [];
      handleStatusBulk(ids, payload?.messageStatus || "read", {
        readAt: payload?.readAt,
        deliveredAt: payload?.deliveredAt,
      });
    });

    socket.on("group_message_receipt_update", (payload) => {
      if (!payload?.messageId) return;
      const { messageId, userId, action, timestamp, newStatus } = payload;
      set((state) => {
        const resolvedUser =
          payload.user ||
          state.users?.find((u) => String(u._id) === String(userId)) ||
          userId;

        const nextMessages = state.messages.map((msg) => {
          if (String(msg._id) !== String(messageId)) return msg;
          const nextMsg = { ...msg };
          if (newStatus) {
            nextMsg.messageStatus = newStatus;
          }
          const existingReadBy = Array.isArray(nextMsg.readBy)
            ? [...nextMsg.readBy]
            : [];
          const existingDeliveredTo = Array.isArray(nextMsg.deliveredTo)
            ? [...nextMsg.deliveredTo]
            : [];

          const dIdx = existingDeliveredTo.findIndex(
            (d) => String(d.user?._id || d.user || d) === String(userId),
          );
          if (dIdx >= 0) {
            existingDeliveredTo[dIdx] = {
              ...existingDeliveredTo[dIdx],
              deliveredAt:
                existingDeliveredTo[dIdx].deliveredAt || timestamp,
              user:
                (typeof existingDeliveredTo[dIdx].user === "object" &&
                existingDeliveredTo[dIdx].user?.username
                  ? existingDeliveredTo[dIdx].user
                  : resolvedUser) || existingDeliveredTo[dIdx].user,
            };
          } else {
            existingDeliveredTo.push({
              user: resolvedUser,
              deliveredAt: timestamp,
            });
          }

          if (action === "read") {
            const rIdx = existingReadBy.findIndex(
              (r) => String(r.user?._id || r.user || r) === String(userId),
            );
            if (rIdx >= 0) {
              existingReadBy[rIdx] = {
                ...existingReadBy[rIdx],
                readAt: timestamp || existingReadBy[rIdx].readAt,
                user:
                  (typeof existingReadBy[rIdx].user === "object" &&
                  existingReadBy[rIdx].user?.username
                    ? existingReadBy[rIdx].user
                    : resolvedUser) || existingReadBy[rIdx].user,
              };
            } else {
              existingReadBy.push({
                user: resolvedUser,
                readAt: timestamp,
              });
            }
          }
          nextMsg.readBy = existingReadBy;
          nextMsg.deliveredTo = existingDeliveredTo;
          return nextMsg;
        });

        let nextConversations = state.conversations;
        if (
          state.conversations?.data &&
          Array.isArray(state.conversations.data)
        ) {
          let convsChanged = false;
          const updatedData = state.conversations.data.map((conv) => {
            const lastMsg = conv.lastMessage;
            if (lastMsg && String(lastMsg._id) === String(messageId)) {
              convsChanged = true;
              const nextLastMsg = { ...lastMsg };
              if (newStatus) {
                nextLastMsg.messageStatus = newStatus;
              }
              const existingReadBy = Array.isArray(nextLastMsg.readBy)
                ? [...nextLastMsg.readBy]
                : [];
              const existingDeliveredTo = Array.isArray(nextLastMsg.deliveredTo)
                ? [...nextLastMsg.deliveredTo]
                : [];

              const dIdx = existingDeliveredTo.findIndex(
                (d) => String(d.user?._id || d.user || d) === String(userId),
              );
              if (dIdx >= 0) {
                existingDeliveredTo[dIdx] = {
                  ...existingDeliveredTo[dIdx],
                  deliveredAt:
                    existingDeliveredTo[dIdx].deliveredAt || timestamp,
                  user:
                    (typeof existingDeliveredTo[dIdx].user === "object" &&
                    existingDeliveredTo[dIdx].user?.username
                      ? existingDeliveredTo[dIdx].user
                      : resolvedUser) || existingDeliveredTo[dIdx].user,
                };
              } else {
                existingDeliveredTo.push({
                  user: resolvedUser,
                  deliveredAt: timestamp,
                });
              }

              if (action === "read") {
                const rIdx = existingReadBy.findIndex(
                  (r) => String(r.user?._id || r.user || r) === String(userId),
                );
                if (rIdx >= 0) {
                  existingReadBy[rIdx] = {
                    ...existingReadBy[rIdx],
                    readAt: timestamp || existingReadBy[rIdx].readAt,
                    user:
                      (typeof existingReadBy[rIdx].user === "object" &&
                      existingReadBy[rIdx].user?.username
                        ? existingReadBy[rIdx].user
                        : resolvedUser) || existingReadBy[rIdx].user,
                  };
                } else {
                  existingReadBy.push({
                    user: resolvedUser,
                    readAt: timestamp,
                  });
                }
              }
              nextLastMsg.readBy = existingReadBy;
              nextLastMsg.deliveredTo = existingDeliveredTo;
              return { ...conv, lastMessage: nextLastMsg };
            }
            return conv;
          });
          if (convsChanged) {
            nextConversations = { ...state.conversations, data: updatedData };
          }
        }

        const nextCache = state.currentConversation?._id
          ? syncMessagesCache(
              state.messagesCache,
              state.currentConversation._id,
              nextMessages,
            )
          : state.messagesCache;

        try {
          const curInfo = useLayoutStore.getState().selectedMessageInfo;
          if (
            curInfo &&
            String(curInfo._id?._id || curInfo._id) === String(messageId)
          ) {
            const updatedTarget = nextMessages.find(
              (m) => String(m._id?._id || m._id) === String(messageId),
            );
            if (updatedTarget) {
              useLayoutStore.getState().setSelectedMessageInfo(updatedTarget);
            }
          }
        } catch (e) {
        }

        return {
          messages: nextMessages,
          conversations: nextConversations,
          messagesCache: nextCache,
        };
      });
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

    socket.on(
      "poll_update",
      ({ messageId, pollData, messageStatus, readAt, deliveredAt }) => {
        set((state) => {
          const nextMessages = state.messages.map((msg) =>
            msg._id === messageId
              ? {
                  ...msg,
                  pollData,
                  ...(messageStatus
                    ? { messageStatus, readAt, deliveredAt }
                    : {}),
                }
              : msg,
          );
          const nextCache = state.currentConversation?._id
            ? syncMessagesCache(
                state.messagesCache,
                state.currentConversation._id,
                nextMessages,
              )
            : state.messagesCache;

          let convsChanged = false;
          const nextConversationsData = state.conversations?.data?.map(
            (conv) => {
              const lastMsgId = (
                conv.lastMessage?._id || conv.lastMessage
              )?.toString();
              if (lastMsgId === messageId) {
                convsChanged = true;
                return {
                  ...conv,
                  lastMessage: {
                    ...conv.lastMessage,
                    pollData,
                    ...(messageStatus
                      ? { messageStatus, readAt, deliveredAt }
                      : {}),
                  },
                };
              }
              return conv;
            },
          );

          return {
            messages: nextMessages,
            messagesCache: nextCache,
            conversations: convsChanged
              ? { ...state.conversations, data: nextConversationsData }
              : state.conversations,
          };
        });
      },
    );

    socket.on(
      "message_deleted",
      async ({
        deletedMessageId,
        conversationId,
        lastMessage,
        deletedForEveryone,
        updatedMessage,
        isDisappearingExpiry,
      }) => {
        const currentUserId = (
          get().currentUser || useUserStore.getState().user
        )?._id?.toString();
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
          let updatedMessages;
          if (deletedForEveryone && !isDisappearingExpiry) {
            updatedMessages = (state.messages || []).map((msg) => {
              if (String(msg._id) === String(deletedMessageId)) {
                const sId = String(msg.sender?._id || msg.sender || "");
                const isMe = currentUserId && sId === currentUserId;
                return {
                  ...msg,
                  ...(updatedMessage || {}),
                  deletedForEveryone: true,
                  content: isMe
                    ? "You deleted this message"
                    : "This message was deleted",
                  isEncrypted: false,
                  imageOrVideoUrl: null,
                  fileName: null,
                  fileSize: null,
                  pollData: null,
                  contactData: null,
                  eventData: null,
                  reactions: [],
                  edited: false,
                };
              }
              return msg;
            });
          } else {
            updatedMessages = (state.messages || []).filter(
              (msg) => String(msg._id) !== String(deletedMessageId),
            );
          }

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
              const updatedCached =
                deletedForEveryone && !isDisappearingExpiry
                  ? cached.map((m) => {
                      if (String(m._id) === String(deletedMessageId)) {
                        const sId = String(m.sender?._id || m.sender || "");
                        const isMe = currentUserId && sId === currentUserId;
                        return {
                          ...m,
                          ...(updatedMessage || {}),
                          deletedForEveryone: true,
                          content: isMe
                            ? "You deleted this message"
                            : "This message was deleted",
                          isEncrypted: false,
                          imageOrVideoUrl: null,
                          fileName: null,
                          fileSize: null,
                          pollData: null,
                          contactData: null,
                          eventData: null,
                          reactions: [],
                          edited: false,
                        };
                      }
                      return m;
                    })
                  : cached.filter(
                      (m) => String(m._id) !== String(deletedMessageId),
                    );
              cache.set(String(conversationId), updatedCached);
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
        const strId = (userId?._id || userId)?.toString();
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(strId, { isOnline, lastSeen });
        const updatedUsers = state.users?.map((u) =>
          (u?._id || u)?.toString() === strId
            ? { ...u, isOnline, lastSeen }
            : u,
        );
        return {
          onlineUsers: newOnlineUsers,
          users: updatedUsers || state.users,
        };
      });
    });

    socket.on("group_updated", (updatedConv) => {
      if (!updatedConv?._id) return;
      const strId = updatedConv._id.toString();
      set((state) => ({
        conversations: {
          ...state.conversations,
          data: state.conversations?.data?.map((conv) => {
            if (String(conv._id) === strId) {
              return { ...conv, ...updatedConv };
            }
            return conv;
          }),
        },
        users: state.users?.map((u) => {
          if (
            String(u._id) === strId ||
            String(u.conversation?._id) === strId
          ) {
            return {
              ...u,
              ...updatedConv,
              conversation: {
                ...u.conversation,
                ...updatedConv,
              },
            };
          }
          return u;
        }),
      }));
      const active = useLayoutStore.getState().selectedContact;
      if (
        active &&
        typeof active === "object" &&
        (String(active._id) === strId ||
          String(active.conversation?._id) === strId)
      ) {
        useLayoutStore.getState().setSelectedContact((prev) => {
          if (!prev || typeof prev !== "object") return updatedConv;
          return {
            ...prev,
            ...updatedConv,
            username: updatedConv.groupName || prev?.username,
            name: updatedConv.groupName || prev?.name,
            groupName: updatedConv.groupName || prev?.groupName,
            groupDescription:
              updatedConv.groupDescription !== undefined
                ? updatedConv.groupDescription
                : prev?.groupDescription,
            groupPermissions:
              updatedConv.groupPermissions || prev?.groupPermissions,
            groupAdmin: updatedConv.groupAdmin || prev?.groupAdmin,
            participants: updatedConv.participants || prev?.participants,
            conversation: {
              ...prev?.conversation,
              ...updatedConv,
            },
          };
        });
      }
    });

    socket.on(
      "message_pinned",
      ({
        conversationId,
        message,
        duration,
        pinnedBy,
        secondaryId,
        receiverId,
        pinnedAt,
        expiresAt,
      }) => {
        get().pinMessage(
          conversationId,
          message,
          duration,
          secondaryId,
          receiverId,
          false,
          pinnedBy,
          pinnedAt,
          expiresAt,
        );
      },
    );

    socket.on(
      "message_unpinned",
      ({ conversationId, secondaryId, receiverId, unpinnedBy }) => {
        get().unpinMessage(
          conversationId,
          secondaryId,
          receiverId,
          false,
          unpinnedBy,
        );
      },
    );

    socket.on("chat_cleared", ({ conversationId, targetUserId }) => {
      set((state) => {
        const isCurrent =
          (conversationId &&
            String(state.currentConversation?._id) ===
              String(conversationId)) ||
          (targetUserId &&
            state.currentConversation?.participants?.some(
              (p) => String(p?._id || p) === String(targetUserId),
            ));

        const nextCache = new Map(state.messagesCache || new Map());
        if (conversationId) nextCache.set(String(conversationId), []);
        if (targetUserId) nextCache.set(String(targetUserId), []);

        const nextConversationsData = state.conversations?.data?.map((conv) => {
          const isMatch =
            (conversationId && String(conv._id) === String(conversationId)) ||
            (targetUserId &&
              conv.participants?.some(
                (p) => String(p?._id || p) === String(targetUserId),
              ));
          if (isMatch) {
            return {
              ...conv,
              lastMessage: null,
              unreadCount: 0,
            };
          }
          return conv;
        });

        return {
          messages: isCurrent ? [] : state.messages,
          messagesCache: nextCache,
          conversations: state.conversations
            ? { ...state.conversations, data: nextConversationsData }
            : state.conversations,
        };
      });
    });

    socket.on("chat_deleted", ({ conversationId, targetUserId }) => {
      set((state) => {
        const isCurrent =
          (conversationId &&
            String(state.currentConversation?._id) ===
              String(conversationId)) ||
          (targetUserId &&
            state.currentConversation?.participants?.some(
              (p) => String(p?._id || p) === String(targetUserId),
            ));

        const nextCache = new Map(state.messagesCache || new Map());
        if (conversationId) nextCache.delete(String(conversationId));
        if (targetUserId) nextCache.delete(String(targetUserId));

        const nextConversationsData = (state.conversations?.data || []).filter(
          (conv) => {
            const isMatch =
              (conversationId && String(conv._id) === String(conversationId)) ||
              (targetUserId &&
                conv.participants?.some(
                  (p) => String(p?._id || p) === String(targetUserId),
                ));
            return !isMatch;
          },
        );

        if (isCurrent) {
          try {
            useLayoutStore.getState().setSelectedContact(null);
          } catch (e) {}
        }

        return {
          messages: isCurrent ? [] : state.messages,
          messagesCache: nextCache,
          currentConversation: isCurrent ? null : state.currentConversation,
          conversations: {
            ...state.conversations,
            data: nextConversationsData,
          },
        };
      });
    });
    const { conversations } = get();
    const myId = (
      get().currentUser || useUserStore.getState().user
    )?._id?.toString();

    if (conversations?.data?.length > 0) {
      conversations.data.forEach((con) => {
        if (Array.isArray(con.participants)) {
          con.participants.forEach((p) => {
            const pId = (p?._id || p)?.toString();
            if (pId && pId !== myId) {
              socket.emit("get_user_status", pId, (status) => {
                if (!status) return;
                set((state) => {
                  const newOnlineUsers = new Map(state.onlineUsers);
                  const strId = (
                    status?.userId?._id || status?.userId
                  )?.toString();
                  newOnlineUsers.set(strId, {
                    isOnline: status.isOnline,
                    lastSeen: status.lastSeen,
                  });
                  return { onlineUsers: newOnlineUsers };
                });
              });
            }
          });
        }
      });
    }

    const userList = get().users || [];
    userList.forEach((u) => {
      const uId = (u?._id || u)?.toString();
      if (uId && uId !== myId) {
        socket.emit("get_user_status", uId, (status) => {
          if (!status) return;
          set((state) => {
            const newOnlineUsers = new Map(state.onlineUsers);
            const strId = (status?.userId?._id || status?.userId)?.toString();
            newOnlineUsers.set(strId, {
              isOnline: status.isOnline,
              lastSeen: status.lastSeen,
            });
            return { onlineUsers: newOnlineUsers };
          });
        });
      }
    });
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
            const peer = conv.participants?.find(
              (p) => (p._id || p)?.toString() !== currentUserId?.toString(),
            );

            let decryptedLast = conv.lastMessage;
            if (
              conv.lastMessage?.isEncrypted &&
              !conv.lastMessage?._isDecrypted
            ) {
              decryptedLast = await decryptSingleMessage(
                conv.lastMessage,
                currentUserId,
                peer,
                get,
              );
            }

            let decryptedPinnedMessage = conv.pinnedMessage;
            if (
              conv.pinnedMessage?.message?.isEncrypted &&
              !conv.pinnedMessage?.message?._isDecrypted
            ) {
              const decPinnedMsg = await decryptSingleMessage(
                conv.pinnedMessage.message,
                currentUserId,
                peer,
                get,
              );
              decryptedPinnedMessage = {
                ...conv.pinnedMessage,
                message: decPinnedMsg,
              };
            }

            return {
              ...conv,
              lastMessage: decryptedLast,
              pinnedMessage: decryptedPinnedMessage,
            };
          }),
        );
        convData = { ...data, data: decryptedList };

        const syncedPins = { ...get().pinnedMessages };
        const dbDisappearingDurations = {};
        const dbDisappearingEvents = {};

        decryptedList.forEach((conv) => {
          const cId = conv._id ? conv._id.toString() : null;
          const peer = conv.participants?.find(
            (p) => (p._id || p)?.toString() !== currentUserId?.toString(),
          );
          const peerId = (peer?._id || peer)?.toString();

          if (conv.pinnedMessage && conv.pinnedMessage.message) {
            const expires = conv.pinnedMessage.expiresAt
              ? new Date(conv.pinnedMessage.expiresAt).getTime()
              : null;
            if (!expires || expires > Date.now()) {
              const pinData = {
                message: conv.pinnedMessage.message,
                duration: conv.pinnedMessage.duration || "7 days",
                pinnedAt: conv.pinnedMessage.pinnedAt
                  ? new Date(conv.pinnedMessage.pinnedAt).getTime()
                  : Date.now(),
                expiresAt: expires,
                pinnedBy: conv.pinnedMessage.pinnedBy,
              };
              if (cId) syncedPins[cId] = pinData;
              if (peerId) syncedPins[peerId] = pinData;
              conv.participants?.forEach((p) => {
                const pid = (p?._id || p)?.toString();
                if (pid) syncedPins[pid] = pinData;
              });
            } else {
              if (cId) delete syncedPins[cId];
              if (peerId) delete syncedPins[peerId];
            }
          } else {
            if (cId) delete syncedPins[cId];
            if (peerId) delete syncedPins[peerId];
          }

          const duration = conv.disappearingDuration || "Off";
          if (cId) dbDisappearingDurations[cId] = duration;
          if (peerId) dbDisappearingDurations[peerId] = duration;

          if (duration !== "Off") {
            const initialEvent = {
              _id: `disp_init_${cId || peerId}`,
              isDisappearingSystemEvent: true,
              action: "turned_on",
              duration,
              previousDuration: "Off",
              setBy: conv.disappearingSetBy || null,
              createdAt:
                conv.disappearingUpdatedAt ||
                conv.updatedAt ||
                new Date().toISOString(),
              timestamp: new Date(
                conv.disappearingUpdatedAt || conv.updatedAt || Date.now(),
              ).getTime(),
            };
            if (cId) dbDisappearingEvents[cId] = [initialEvent];
            if (peerId) dbDisappearingEvents[peerId] = [initialEvent];
          }
        });

        try {
          useLayoutStore
            .getState()
            .syncDisappearingFromDb(
              dbDisappearingDurations,
              dbDisappearingEvents,
            );
        } catch (e) {}

        try {
          localStorage.setItem(
            "whatsapp_pinned_messages",
            JSON.stringify(syncedPins),
          );
        } catch (e) {}
        set({ pinnedMessages: syncedPins });
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
      set((state) => ({
        messages: cachedMessages,
        currentConversation: { _id: conversationId },
        isMessagesLoading: false,
        loading: false,
        conversations: {
          ...state.conversations,
          data: state.conversations?.data?.map((conv) =>
            String(conv._id) === String(conversationId)
              ? { ...conv, unreadCount: 0 }
              : conv,
          ),
        },
      }));
      get().markMessageAsRead();

      const hasUndecrypted = cachedMessages.some(
        (m) => m && m.isEncrypted && !m._isDecrypted,
      );
      if (hasUndecrypted) {
        const currentUserId = (
          get().currentUser || useUserStore.getState().user
        )?._id;
        const selectedContact = useLayoutStore.getState()?.selectedContact;
        const peerId = selectedContact?._id?.toString();
        let peerPubKey = selectedContact?.publicKey;
        if (!peerPubKey && peerId) {
          const foundUser = (get().users || []).find(
            (u) => u._id?.toString() === peerId,
          );
          peerPubKey = foundUser?.publicKey;
        }
        batchDecryptMessages(
          cachedMessages,
          currentUserId,
          peerId,
          peerPubKey,
          get,
        ).then((reDecrypted) => {
          if (reDecrypted && reDecrypted.length > 0) {
            const cache = get().messagesCache || new Map();
            cache.set(convIdStr, reDecrypted);
            set({ messages: reDecrypted, messagesCache: cache });
          }
        });
      }
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

      if (peerId) {
        try {
          const resp = await axiosInstance.get(`/auth/public-key/${peerId}`);
          const freshKey = resp.data?.data?.publicKey || resp.data?.publicKey;
          if (freshKey) {
            if (peerPubKey && peerPubKey !== freshKey) {
              clearSharedKeyCache(peerId);
            }
            peerPubKey = freshKey;
            if (selectedContact) {
              selectedContact.publicKey = freshKey;
            }
          }
        } catch (e) {}
      }

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
        get,
      );

      const cache = get().messagesCache || new Map();
      cache.set(convIdStr, decryptedMessages);

      set((state) => ({
        messages: decryptedMessages,
        messagesCache: cache,
        currentConversation: { _id: conversationId },
        loading: false,
        isMessagesLoading: false,
        conversations: {
          ...state.conversations,
          data: state.conversations?.data?.map((conv) => {
            const isMatch =
              String(conv._id) === String(conversationId) ||
              (peerId &&
                conv.participants?.some(
                  (p) => String(p?._id || p) === String(peerId),
                ));
            return isMatch ? { ...conv, unreadCount: 0 } : conv;
          }),
        },
      }));
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
    let peerPubKey = null;
    if (receiverId) {
      try {
        const resp = await axiosInstance.get(`/auth/public-key/${receiverId}`);
        peerPubKey = resp.data?.data?.publicKey || resp.data?.publicKey;
      } catch (e) {}
    }

    if (!peerPubKey) {
      peerPubKey =
        selectedContact?._id?.toString() === receiverId?.toString()
          ? selectedContact?.publicKey
          : null;
    }

    if (!peerPubKey) {
      const allUsers = get().users || [];
      const foundPeer = allUsers.find(
        (u) => u._id?.toString() === receiverId?.toString(),
      );
      peerPubKey = foundPeer?.publicKey;
    }

    if (peerPubKey) {
      const layout = useLayoutStore.getState();
      if (
        layout?.selectedContact &&
        layout.selectedContact._id?.toString() === receiverId?.toString()
      ) {
        if (layout.selectedContact.publicKey !== peerPubKey) {
          clearSharedKeyCache(receiverId);
          layout.updateSelectedContact({ publicKey: peerPubKey });
        }
      }
    }

    let isEncrypted = false;
    let iv = null;
    let rawContentToKeep = content;

    const isTargetingMetaAi = Boolean(
      receiverId?.toString() === "66f000000000000000000001" ||
      selectedContact?.isAI ||
      (typeof content === "string" && /@meta\s*ai/i.test(content)),
    );

    if (
      !isTargetingMetaAi &&
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
    const replyTo = formData.get("replyTo");
    const replyMessageStr = formData.get("replyMessage");
    let parsedReplyMessage = null;
    if (replyMessageStr) {
      try {
        parsedReplyMessage = JSON.parse(replyMessageStr);
      } catch (e) {}
    }

    const layoutState = useLayoutStore.getState?.() || {};
    const disappearingDurationsMap = layoutState.disappearingDurations || {};
    const activeDisappearingDuration =
      (selectedContact?.conversation?.disappearingDuration &&
        selectedContact.conversation.disappearingDuration !== "Off" &&
        selectedContact.conversation.disappearingDuration) ||
      (conversationId &&
        disappearingDurationsMap[conversationId] !== "Off" &&
        disappearingDurationsMap[conversationId]) ||
      (receiverId &&
        disappearingDurationsMap[receiverId] !== "Off" &&
        disappearingDurationsMap[receiverId]) ||
      (layoutState.defaultMessageTimer &&
        layoutState.defaultMessageTimer !== "Off" &&
        layoutState.defaultMessageTimer);

    let isDisappearing = false;
    let disappearingDuration = null;
    let disappearingExpiresAt = null;

    if (activeDisappearingDuration && activeDisappearingDuration !== "Off") {
      const durMs = getDisappearingDurationMs(activeDisappearingDuration);
      if (durMs) {
        isDisappearing = true;
        disappearingDuration = activeDisappearingDuration;
        disappearingExpiresAt = new Date(Date.now() + durMs).toISOString();
      }
    }

    if (isDisappearing) {
      formData.set("isDisappearing", "true");
      formData.set("disappearingDuration", disappearingDuration);
      formData.set("disappearingExpiresAt", disappearingExpiresAt);
    } else {
      formData.set("isDisappearing", "false");
      formData.set("disappearingDuration", "Off");
    }

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
      messageStatus: messageStatus || "send",
      replyTo: replyTo || null,
      replyMessage: parsedReplyMessage,
      isDisappearing,
      disappearingDuration,
      disappearingExpiresAt,
      isKept: false,
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
            const targetConvId = conversationId ? String(conversationId) : null;
            const hasSender = Boolean(
              senderId &&
              conv.participants?.some(
                (p) => String(p?._id || p) === String(senderId),
              ),
            );
            const hasReceiver = Boolean(
              receiverId &&
              conv.participants?.some(
                (p) => String(p?._id || p) === String(receiverId),
              ),
            );
            const isTarget =
              Boolean(targetConvId && String(conv._id) === targetConvId) ||
              Boolean(hasSender && hasReceiver);
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
          : messageData.messageStatus || "send",
        content: rawContentToKeep,
        _isDecrypted: true,
        isEncrypted: messageData.isEncrypted ?? isEncrypted,
        iv: messageData.iv ?? iv,
        isDisappearing: messageData.isDisappearing ?? isDisappearing,
        disappearingDuration:
          messageData.disappearingDuration ?? disappearingDuration,
        disappearingExpiresAt:
          messageData.disappearingExpiresAt ?? disappearingExpiresAt,
        isKept: messageData.isKept ?? false,
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
              const targetConvId = resolvedConvId
                ? String(resolvedConvId)
                : null;
              const hasSender = Boolean(
                senderId &&
                conv.participants?.some(
                  (p) => String(p?._id || p) === String(senderId),
                ),
              );
              const hasReceiver = Boolean(
                receiverId &&
                conv.participants?.some(
                  (p) => String(p?._id || p) === String(receiverId),
                ),
              );
              const isTarget =
                Boolean(targetConvId && String(conv._id) === targetConvId) ||
                Boolean(hasSender && hasReceiver);
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

  sendCallMessage: async ({
    receiverId,
    conversationId,
    callType = "audio",
    duration = "28 seconds",
    status = "completed",
    direction = "outgoing",
    isGroup = false,
    groupId = null,
  }) => {
    const currentUserId = (get().currentUser || useUserStore.getState().user)
      ?._id;
    const selectedContact = useLayoutStore.getState()?.selectedContact;
    const isActuallyGroup = Boolean(
      isGroup ||
      groupId ||
      selectedContact?.isGroup ||
      selectedContact?.isGroupChat ||
      selectedContact?.conversation?.isGroup,
    );
    const resolvedGroupId =
      groupId ||
      (isActuallyGroup
        ? conversationId ||
          selectedContact?._id ||
          selectedContact?.conversation?._id
        : null);
    const effectiveReceiverId = isActuallyGroup
      ? resolvedGroupId
      : receiverId || selectedContact?._id;
    if (!effectiveReceiverId || !currentUserId) return;

    const resolvedConvId =
      conversationId ||
      resolvedGroupId ||
      get().currentConversation?._id ||
      selectedContact?.conversation?._id;

    const isVideo = callType === "video";
    const title = isVideo ? "Video call" : "Voice call";

    const callPayload = {
      callType: isVideo ? "video" : "audio",
      callTitle: title,
      duration: duration || "28 seconds",
      status: status || "completed",
      direction: direction || "outgoing",
    };

    const tempId = `call-msg-${Date.now()}`;
    const optimisticCallMsg = {
      _id: tempId,
      temp: tempId,
      conversation: resolvedConvId,
      conversationId: resolvedConvId,
      sender: {
        _id: currentUserId,
        username: useUserStore.getState().user?.username,
        profilePicture: useUserStore.getState().user?.profilePicture,
      },
      receiver: isActuallyGroup
        ? {
            _id: resolvedGroupId,
            groupName:
              selectedContact?.groupName ||
              selectedContact?.username ||
              "Group",
            profilePicture: selectedContact?.profilePicture,
            isGroup: true,
          }
        : {
            _id: effectiveReceiverId,
            username: selectedContact?.username,
            profilePicture: selectedContact?.profilePicture,
          },
      contentType: "call",
      content: `${title} • ${duration}`,
      callData: callPayload,
      callType: isVideo ? "video" : "audio",
      duration: duration || "28 seconds",
      status: status || "completed",
      direction: direction || "outgoing",
      messageStatus: "send",
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const nextMessages = [...state.messages, optimisticCallMsg];
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
              resolvedConvId && String(conv._id) === String(resolvedConvId);
            return isTarget
              ? { ...conv, lastMessage: optimisticCallMsg, unreadCount: 0 }
              : conv;
          }),
        },
      };
    });

    try {
      const formData = new FormData();
      formData.append("senderId", currentUserId);
      formData.append("receiverId", effectiveReceiverId);
      if (resolvedConvId) {
        formData.append("conversationId", resolvedConvId);
      }
      if (isActuallyGroup) {
        formData.append("isGroup", "true");
      }
      formData.append("contentType", "call");
      formData.append("content", `${title} • ${duration}`);
      formData.append("callData", JSON.stringify(callPayload));
      formData.append("messageStatus", "send");

      const { data } = await axiosInstance.post(
        "/chat/send-message",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const messageData = data.data || data;
      const savedMsg = {
        ...messageData,
        contentType: "call",
        callData: callPayload,
        callType: isVideo ? "video" : "audio",
        duration: duration || "28 seconds",
        status: status || "completed",
        direction: direction || "outgoing",
        _isDecrypted: true,
      };

      set((state) => {
        const nextMessages = state.messages.map((m) =>
          m._id === tempId || m.temp === tempId ? savedMsg : m,
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
                resolvedConvId && String(conv._id) === String(resolvedConvId);
              return isTarget
                ? { ...conv, lastMessage: savedMsg, unreadCount: 0 }
                : conv;
            }),
          },
        };
      });

      return savedMsg;
    } catch (err) {
      console.warn(
        "sendCallMessage backend log failed, kept optimistic message:",
        err,
      );
      return optimisticCallMsg;
    }
  },

  sendCallLinkMessage: async ({
    receiverId,
    conversationId,
    callType = "video",
    linkCode,
    url,
    isGroup = false,
    groupId = null,
  }) => {
    const currentUserId = (get().currentUser || useUserStore.getState().user)
      ?._id;
    const selectedContact = useLayoutStore.getState()?.selectedContact;
    const isActuallyGroup = Boolean(
      isGroup ||
      groupId ||
      selectedContact?.isGroup ||
      selectedContact?.isGroupChat ||
      selectedContact?.conversation?.isGroup,
    );
    const resolvedGroupId =
      groupId ||
      (isActuallyGroup
        ? conversationId ||
          selectedContact?._id ||
          selectedContact?.conversation?._id
        : null);
    const effectiveReceiverId = isActuallyGroup
      ? resolvedGroupId
      : receiverId || selectedContact?._id;
    if (!effectiveReceiverId || !currentUserId) return;

    const resolvedConvId =
      conversationId ||
      resolvedGroupId ||
      get().currentConversation?._id ||
      selectedContact?.conversation?._id;

    const generatedLinkCode =
      linkCode ||
      (url
        ? url.split("/").pop()
        : `SUH50${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
    const callUrl =
      url || `https://call.whatsapp.com/${callType}/${generatedLinkCode}`;

    const linkPayload = {
      callType: callType === "video" ? "video" : "voice",
      linkCode: generatedLinkCode,
      url: callUrl,
      title: `WhatsApp ${callType === "video" ? "Video" : "Voice"} Call Link`,
      description: `Use this link to join my WhatsApp ${callType === "video" ? "video" : "voice"} call.`,
    };

    const tempId = `call-link-msg-${Date.now()}`;
    const optimisticCallLinkMsg = {
      _id: tempId,
      temp: tempId,
      conversation: resolvedConvId,
      conversationId: resolvedConvId,
      sender: {
        _id: currentUserId,
        username: useUserStore.getState().user?.username,
        profilePicture: useUserStore.getState().user?.profilePicture,
      },
      receiver: isActuallyGroup
        ? {
            _id: resolvedGroupId,
            groupName:
              selectedContact?.groupName ||
              selectedContact?.username ||
              "Group",
            profilePicture: selectedContact?.profilePicture,
            isGroup: true,
          }
        : {
            _id: effectiveReceiverId,
            username: selectedContact?.username,
            profilePicture: selectedContact?.profilePicture,
          },
      contentType: "call_link",
      callLinkData: linkPayload,
      content: callUrl,
      messageStatus: "send",
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      _isDecrypted: true,
    };

    set((state) => {
      const nextMessages = [...state.messages, optimisticCallLinkMsg];
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
              resolvedConvId && String(conv._id) === String(resolvedConvId);
            return isTarget
              ? { ...conv, lastMessage: optimisticCallLinkMsg, unreadCount: 0 }
              : conv;
          }),
        },
      };
    });

    try {
      const formData = new FormData();
      formData.append("senderId", currentUserId);
      formData.append("receiverId", effectiveReceiverId);
      if (resolvedConvId) {
        formData.append("conversationId", resolvedConvId);
      }
      if (isActuallyGroup) {
        formData.append("isGroup", "true");
      }
      formData.append("contentType", "call_link");
      formData.append("content", callUrl);
      formData.append("callLinkData", JSON.stringify(linkPayload));
      formData.append("messageStatus", "send");

      const { data } = await axiosInstance.post(
        "/chat/send-message",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const messageData = data.data || data;
      const savedMsg = {
        ...messageData,
        contentType: "call_link",
        callLinkData: linkPayload,
        content: callUrl,
        _isDecrypted: true,
      };

      set((state) => {
        const nextMessages = state.messages.map((m) =>
          m._id === tempId || m.temp === tempId ? savedMsg : m,
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
                resolvedConvId && String(conv._id) === String(resolvedConvId);
              return isTarget
                ? { ...conv, lastMessage: savedMsg, unreadCount: 0 }
                : conv;
            }),
          },
        };
      });

      return savedMsg;
    } catch (err) {
      console.warn(
        "sendCallLinkMessage backend log failed, kept optimistic message:",
        err,
      );
      return optimisticCallLinkMsg;
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

    const activeConvId = (
      currentConversation?._id || selectedContact?.conversation?._id
    )?.toString();
    const activeContactId = (
      selectedContact?._id || selectedContact?.id
    )?.toString();
    const isCurrentConversation =
      Boolean(
        conversationId &&
        activeConvId &&
        String(conversationId) === String(activeConvId),
      ) ||
      Boolean(activeContactId && senderId && senderId === activeContactId) ||
      Boolean(
        activeContactId &&
        receiverId &&
        receiverId === activeContactId &&
        senderId === myId,
      ) ||
      Boolean(
        currentConversation?.participants?.some(
          (p) => String(p?._id || p?.id || p) === String(senderId),
        ),
      );

    const isForCurrentUser =
      Boolean(myId && receiverId && receiverId === myId) ||
      Boolean(myId && senderId && senderId !== myId) ||
      Boolean(!senderId || (myId && senderId !== myId));
    const isSentByCurrentUser = Boolean(myId && senderId && senderId === myId);

    if (isCurrentConversation) {
      if (isForCurrentUser) {
        decryptedMessage.messageStatus = "read";
      }

      set((state) => {
        let nextMessages = [...state.messages, decryptedMessage];
        const isFromMetaAi = Boolean(
          decryptedMessage.isMetaAi ||
          decryptedMessage.sender?.username === "Meta AI" ||
          String(decryptedMessage.sender?._id || decryptedMessage.sender) ===
            "66f000000000000000000001",
        );
        if (isFromMetaAi) {
          const nowIso = new Date().toISOString();
          const replyToId = String(
            decryptedMessage.replyTo?._id || decryptedMessage.replyTo || "",
          );
          nextMessages = nextMessages.map((msg) => {
            const isUserMsg =
              String(msg.sender?._id || msg.sender) === String(myId);
            const isTarget = replyToId
              ? String(msg._id) === replyToId
              : isUserMsg;
            if (isTarget && msg.messageStatus !== "read") {
              return {
                ...msg,
                messageStatus: "read",
                readAt: msg.readAt || nowIso,
                deliveredAt: msg.deliveredAt || nowIso,
              };
            }
            return msg;
          });
        }

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
    } else {
      if (isForCurrentUser && decryptedMessage._id) {
        const socket = getSocket();
        if (socket) {
          socket.emit("message_delivered", {
            messageIds: [decryptedMessage._id],
          });
        }
      }
      if (conversationId) {
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
    }

    let foundTarget = false;
    set((state) => {
      const targetConvId = conversationId ? String(conversationId) : null;
      return {
        conversations: {
          ...state.conversations,
          data: state.conversations?.data?.map((conv) => {
            const hasSender = Boolean(
              senderId &&
              conv.participants?.some(
                (p) => String(p?._id || p) === String(senderId),
              ),
            );
            const hasReceiver = Boolean(
              receiverId &&
              conv.participants?.some(
                (p) => String(p?._id || p) === String(receiverId),
              ),
            );

            const isTarget =
              Boolean(targetConvId && String(conv._id) === targetConvId) ||
              Boolean(hasSender && hasReceiver);

            if (!isTarget) {
              return conv;
            }

            foundTarget = true;

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
      };
    });

    if (!foundTarget) {
      get().fetchConversations();
    }
  },

  markMessageAsRead: async (explicitIds = null) => {
    const { messages, currentUser, currentConversation } = get();
    const effectiveUser = currentUser || useUserStore.getState().user;
    const myId = (effectiveUser?._id || effectiveUser?.id)?.toString();
    const selectedContact = useLayoutStore.getState()?.selectedContact;
    const peerId = (selectedContact?._id || selectedContact?.id)?.toString();
    const activeConvId = (
      currentConversation?._id ||
      selectedContact?.conversation?._id ||
      messages[0]?.conversation?._id ||
      messages[0]?.conversation
    )?.toString();

    if (activeConvId || peerId) {
      set((state) => ({
        conversations: {
          ...state.conversations,
          data: state.conversations?.data?.map((conv) => {
            const isMatch =
              (activeConvId && String(conv._id) === String(activeConvId)) ||
              (peerId &&
                peerId !== myId &&
                conv.participants?.some(
                  (p) => String(p?._id || p) === String(peerId),
                ));
            return isMatch ? { ...conv, unreadCount: 0 } : conv;
          }),
        },
      }));
    }

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
      const nowIso = new Date().toISOString();
      set((state) => {
        const nextMessages = state.messages.map((msg) =>
          unreadIdStrs.has(String(msg._id))
            ? {
                ...msg,
                messageStatus: "read",
                readAt: msg.readAt || nowIso,
                deliveredAt: msg.deliveredAt || msg.createdAt || nowIso,
              }
            : msg,
        );

        const convId =
          activeConvId ||
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
            data: state.conversations?.data?.map((conv) => {
              const isMatch =
                (convId && String(conv._id) === String(convId)) ||
                (peerId &&
                  peerId !== myId &&
                  conv.participants?.some(
                    (p) => String(p?._id || p) === String(peerId),
                  ));
              return isMatch
                ? {
                    ...conv,
                    unreadCount: 0,
                  }
                : conv;
            }),
          },
        };
      });

      const socket = getSocket();
      if (socket) {
        socket.emit("message_read", {
          messageIds: unreadIds,
          readAt: nowIso,
        });
      }

      await axiosInstance.put("/chat/messages/read", {
        messageIds: unreadIds,
      });
    } catch (error) {
      console.error("failed to mark message as read", error);
    }
  },

  deleteMessage: async (messageId, deleteFor, options = {}) => {
    try {
      const { data } = await axiosInstance.delete(
        `/chat/messages/${messageId}`,
        {
          data: { deleteFor, deleteMedia: true, ...options },
        },
      );

      const state = get();
      const currentConversationId = state.currentConversation?._id;
      const currentUserId = (
        state.currentUser || useUserStore.getState().user
      )?._id?.toString();

      let nextMessages;
      if (deleteFor === "everyone") {
        nextMessages = (state.messages || []).map((msg) => {
          if (String(msg?._id) === String(messageId)) {
            return {
              ...msg,
              deletedForEveryone: true,
              content: "You deleted this message",
              isEncrypted: false,
              imageOrVideoUrl: null,
              fileName: null,
              fileSize: null,
              pollData: null,
              contactData: null,
              eventData: null,
              reactions: [],
              edited: false,
            };
          }
          return msg;
        });
      } else {
        nextMessages = (state.messages || []).filter(
          (msg) => String(msg?._id) !== String(messageId),
        );
      }

      const previousMsg =
        nextMessages.length > 0 ? nextMessages[nextMessages.length - 1] : null;

      const serverLastMsg = data?.data?.lastMessage || data?.lastMessage;
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
              nextMessages,
            )
          : currentState.messagesCache;

        return {
          messages: nextMessages,
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
        let peerPubKey = selectedContact?.publicKey;

        if (peerId) {
          try {
            const resp = await axiosInstance.get(`/auth/public-key/${peerId}`);
            const freshKey = resp.data?.data?.publicKey || resp.data?.publicKey;
            if (freshKey) {
              if (peerPubKey && peerPubKey !== freshKey) {
                clearSharedKeyCache(peerId);
              }
              peerPubKey = freshKey;
            }
          } catch (e) {}
        }

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

  checkUserStatus: (userId) => {
    const socket = getSocket();
    if (!socket || !userId) return;
    const strId = (userId?._id || userId)?.toString();
    socket.emit("get_user_status", strId, (status) => {
      if (!status) return;
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        const sId = (status?.userId?._id || status?.userId)?.toString();
        newOnlineUsers.set(sId, {
          isOnline: status.isOnline,
          lastSeen: status.lastSeen,
        });
        const updatedUsers = state.users?.map((u) =>
          (u?._id || u)?.toString() === sId
            ? { ...u, isOnline: status.isOnline, lastSeen: status.lastSeen }
            : u,
        );
        return {
          onlineUsers: newOnlineUsers,
          users: updatedUsers || state.users,
        };
      });
    });
  },

  isUserOnline: (userId) => {
    if (!userId) return false;
    const strId = (userId?._id || userId)?.toString();
    const { onlineUsers, users } = get();
    if (onlineUsers && onlineUsers.has(strId)) {
      return Boolean(onlineUsers.get(strId)?.isOnline);
    }
    const found = users?.find((u) => (u?._id || u)?.toString() === strId);
    return Boolean(found?.isOnline);
  },

  getUserLastSeen: (userId) => {
    if (!userId) return null;
    const strId = (userId?._id || userId)?.toString();
    const { onlineUsers, users } = get();
    if (onlineUsers && onlineUsers.has(strId)) {
      return onlineUsers.get(strId)?.lastSeen || null;
    }
    const found = users?.find((u) => (u?._id || u)?.toString() === strId);
    return found?.lastSeen || null;
  },

  getGroupOnlineCount: (participants, currentUserId) => {
    if (!participants || !Array.isArray(participants)) return 0;
    const { isUserOnline } = get();
    const myIdStr = (currentUserId?._id || currentUserId)?.toString();
    let count = 0;
    participants.forEach((p) => {
      const pId = (p?._id || p)?.toString();
      if (!pId || pId === myIdStr) return;
      if (isUserOnline(pId)) {
        count++;
      }
    });
    return count;
  },

  updateGroupInfo: (conversationId, updateData) => {
    if (!conversationId) return;
    const strId = conversationId.toString();
    set((state) => {
      const convList = Array.isArray(state.conversations?.data)
        ? state.conversations.data
        : Array.isArray(state.conversations)
          ? state.conversations
          : [];
      const updatedConvs = convList.map((conv) => {
        if (String(conv._id) === strId) {
          return {
            ...conv,
            ...updateData,
            groupPermissions: {
              ...(conv.groupPermissions || {}),
              ...(updateData.groupPermissions || {}),
            },
          };
        }
        return conv;
      });

      const updatedUsers = Array.isArray(state.users)
        ? state.users.map((u) => {
            if (
              String(u._id) === strId ||
              String(u.conversation?._id) === strId
            ) {
              return {
                ...u,
                ...updateData,
                groupPermissions: {
                  ...(u.groupPermissions ||
                    u.conversation?.groupPermissions ||
                    {}),
                  ...(updateData.groupPermissions || {}),
                },
                conversation: {
                  ...u.conversation,
                  ...updateData,
                  groupPermissions: {
                    ...(u.conversation?.groupPermissions || {}),
                    ...(updateData.groupPermissions || {}),
                  },
                },
              };
            }
            return u;
          })
        : state.users;

      return {
        conversations: Array.isArray(state.conversations?.data)
          ? { ...state.conversations, data: updatedConvs }
          : updatedConvs,
        users: updatedUsers,
      };
    });
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

if (typeof useUserStore?.subscribe === "function") {
  useUserStore.subscribe((state) => {
    const currentChatUser = useChatStore.getState().currentUser;
    if (currentChatUser !== state.user) {
      useChatStore.setState({ currentUser: state.user });
    }
  });
}

export default useChatStore;
