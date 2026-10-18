const { Server } = require("socket.io");
const User = require("../models/user");
const Message = require("../models/message");
const Conversation = require("../models/ConverSation");
const handleVideoCallEvent = require("./videoCallService");
const socketMiddleware = require("../middleware/socketMiddleware");
const { deleteFileFromCloudinary } = require("../config/cloudinary");

const onlineUsers = new Map();
const typingUsers = new Map();

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
    pingTimeout: 60000,
  });
  io.use(socketMiddleware);
  io.on("connection", (socket) => {
    let userId;
    socket.on("user_connected", async (connectingUserId) => {
      try {
        if (!connectingUserId) return;
        userId = connectingUserId.toString();
        socket.userId = userId;
        onlineUsers.set(userId, socket.id);
        socket.join(userId);
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        io.emit("user_status", { userId, isOnline: true });

        const now = new Date();
        const pendingMessages = await Message.find({
          receiver: userId,
          messageStatus: "send",
          blockedDelivery: { $ne: true },
          deletedFor: { $ne: userId },
        });

        if (pendingMessages.length > 0) {
          const pendingIds = pendingMessages.map((m) => m._id);
          await Message.updateMany(
            { _id: { $in: pendingIds } },
            { $set: { messageStatus: "delivered", deliveredAt: now } },
          );

          const senderMap = new Map();
          pendingMessages.forEach((msg) => {
            const sId = msg.sender?.toString();
            if (sId) {
              if (!senderMap.has(sId)) senderMap.set(sId, []);
              senderMap.get(sId).push(msg._id.toString());
            }
          });

          for (const [sId, msgIds] of senderMap.entries()) {
            const payload = {
              messageIds: msgIds,
              messageStatus: "delivered",
              deliveredAt: now.toISOString(),
            };
            io.to(sId).emit("message_status_update_bulk", payload);
            if (onlineUsers.has(sId)) {
              io.to(onlineUsers.get(sId)).emit(
                "message_status_update_bulk",
                payload,
              );
            }
          }
        }
      } catch (error) {
        console.error("Error in user_connected:", error);
      }
    });

    socket.on("get_user_status", (requestingUserId, callback) => {
      const isOnline = onlineUsers.has(requestingUserId);

      callback({
        userId: requestingUserId,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    socket.on("send_message", async (message) => {
      try {
        const receiverId = message.receiver?._id?.toString();
        if (receiverId) {
          io.to(receiverId).emit("receive_message", message);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message_error", "Failed to send message");
      }
    });

    socket.on("message_read", async ({ messageIds }) => {
      try {
        if (!messageIds || !messageIds.length) return;
        const now = new Date();
        const messages = await Message.find({ _id: { $in: messageIds } });

        if (!messages.length) return;
        const senderIds = [
          ...new Set(
            messages.map((msg) => msg.sender?.toString()).filter(Boolean),
          ),
        ];

        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read", readAt: now } },
        );
        await Message.updateMany(
          { _id: { $in: messageIds }, deliveredAt: null },
          { $set: { deliveredAt: now } },
        );

        senderIds.forEach((senderId) => {
          const sId = senderId.toString();
          const payload = {
            messageIds: messageIds.map(String),
            messageStatus: "read",
            readAt: now.toISOString(),
            deliveredAt: now.toISOString(),
          };
          io.to(sId).emit("message_status_update_bulk", payload);
          io.to(sId).emit("message_read", payload);
          if (onlineUsers.has(sId)) {
            const socketId = onlineUsers.get(sId);
            io.to(socketId).emit("message_status_update_bulk", payload);
            io.to(socketId).emit("message_read", payload);
          }
        });
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    });

    socket.on("message_delivered", async ({ messageIds }) => {
      try {
        if (!messageIds || !messageIds.length) return;
        const now = new Date();
        const messages = await Message.find({
          _id: { $in: messageIds },
          messageStatus: "send",
        });

        if (!messages.length) return;
        const senderIds = [
          ...new Set(
            messages.map((msg) => msg.sender?.toString()).filter(Boolean),
          ),
        ];

        await Message.updateMany(
          { _id: { $in: messages.map((m) => m._id) }, messageStatus: "send" },
          { $set: { messageStatus: "delivered", deliveredAt: now } },
        );

        senderIds.forEach((senderId) => {
          const sId = senderId.toString();
          const payload = {
            messageIds: messages.map((m) => m._id.toString()),
            messageStatus: "delivered",
            deliveredAt: now.toISOString(),
          };
          io.to(sId).emit("message_status_update_bulk", payload);
          if (onlineUsers.has(sId)) {
            const socketId = onlineUsers.get(sId);
            io.to(socketId).emit("message_status_update_bulk", payload);
          }
        });
      } catch (error) {
        console.error("Error in message_delivered:", error);
      }
    });
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;
      if (!typingUsers.has(userId)) typingUsers.set(userId, {});
      const userTyping = typingUsers.get(userId);
      userTyping[conversationId] = true;
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;

        io.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      io.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!typingUsers.has(userId)) return;
      const userTyping = typingUsers.get(userId);
      userTyping[conversationId] = false;
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
        delete userTyping[`${conversationId}_timeout`];
      }

      io.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    const mongoose = require("mongoose");

    socket.on("add_reaction", async ({ messageId, emoji, reactionUserId }) => {
      try {
        if (!messageId || !reactionUserId) return;

        let userObjectId = null;
        try {
          userObjectId = new mongoose.Types.ObjectId(reactionUserId);
        } catch (e) {
          userObjectId = null;
        }

        const matchIds = [reactionUserId.toString()];
        if (userObjectId) {
          matchIds.push(userObjectId);
        }

        await Message.updateOne(
          { _id: messageId },
          {
            $pull: {
              reactions: {
                $or: [
                  { userId: { $in: matchIds } },
                  { emoji: null },
                  { emoji: "" },
                  { emoji: { $exists: false } },
                ],
              },
            },
          },
        );

        if (emoji) {
          await Message.updateOne(
            { _id: messageId },
            {
              $push: {
                reactions: {
                  userId: userObjectId || reactionUserId,
                  emoji,
                },
              },
            },
          );
        }

        const updated = await Message.findById(messageId)
          .populate("sender", "username profilePicture")
          .populate("receiver", "username profilePicture")
          .populate("reactions.userId", "username profilePicture");

        if (!updated) return;

        const validReactions = (updated.reactions || []).filter((r) =>
          Boolean(r && r.emoji),
        );

        const targets = new Set();
        if (updated?.sender?._id) targets.add(updated.sender._id.toString());
        if (updated?.receiver?._id)
          targets.add(updated.receiver._id.toString());
        targets.add(reactionUserId.toString());

        targets.forEach((targetId) => {
          io.to(targetId).emit("reaction_update", {
            messageId,
            reactions: validReactions,
          });
        });
      } catch (error) {
        console.error("Error updating reaction:", error);
      }
    });

    socket.on("vote_poll", async ({ messageId, optionIndex, voterId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message || message.contentType !== "poll" || !message.pollData)
          return;
        const voterObjectId = new mongoose.Types.ObjectId(voterId);

        if (!message.pollData.allowMultiple) {
          message.pollData.options.forEach((opt, idx) => {
            if (idx !== optionIndex) {
              opt.votes = opt.votes.filter(
                (v) => v.toString() !== voterId.toString(),
              );
            }
          });
        }

        const targetOption = message.pollData.options[optionIndex];
        if (targetOption) {
          const alreadyVoted = targetOption.votes.some(
            (v) => v.toString() === voterId.toString(),
          );
          if (alreadyVoted) {
            targetOption.votes = targetOption.votes.filter(
              (v) => v.toString() !== voterId.toString(),
            );
          } else {
            targetOption.votes.push(voterObjectId);
          }
        }

        message.markModified("pollData");
        await message.save();

        const populated = await Message.findById(message._id).populate(
          "pollData.options.votes",
          "username profilePicture",
        );

        const payload = {
          messageId: message._id.toString(),
          pollData: populated.pollData,
        };
        socket.emit("poll_update", payload);
        const senderIdStr = message.sender.toString();
        const receiverIdStr = message.receiver.toString();
        io.to(senderIdStr).emit("poll_update", payload);
        io.to(receiverIdStr).emit("poll_update", payload);
        const senderSocketId = onlineUsers.get(senderIdStr);
        const receiverSocketId = onlineUsers.get(receiverIdStr);
        if (senderSocketId && senderSocketId !== socket.id) {
          io.to(senderSocketId).emit("poll_update", payload);
        }
        if (receiverSocketId && receiverSocketId !== socket.id) {
          io.to(receiverSocketId).emit("poll_update", payload);
        }
      } catch (error) {
        console.error("VOTE POLL ERROR:", error);
      }
    });

    socket.on(
      "pin_message",
      async ({
        conversationId,
        message,
        duration,
        pinnedBy,
        receiverId,
        secondaryId,
      }) => {
        try {
          const pinnedAt = Date.now();
          let durationMs = 7 * 24 * 60 * 60 * 1000;
          if (duration === "24 hours") durationMs = 24 * 60 * 60 * 1000;
          if (duration === "30 days") durationMs = 30 * 24 * 60 * 60 * 1000;
          const expiresAt = pinnedAt + durationMs;

          let resolvedConvId = conversationId;
          const targets = new Set();
          if (receiverId)
            targets.add((receiverId._id || receiverId).toString());
          if (pinnedBy) targets.add((pinnedBy._id || pinnedBy).toString());
          if (secondaryId)
            targets.add((secondaryId._id || secondaryId).toString());

          if (message?.sender) {
            const sId = (message.sender._id || message.sender).toString();
            targets.add(sId);
          }
          if (message?.receiver) {
            const rId = (message.receiver._id || message.receiver).toString();
            targets.add(rId);
          }

          if (!resolvedConvId && (receiverId || secondaryId) && pinnedBy) {
            try {
              const otherId = (receiverId || secondaryId).toString();
              const foundConv = await Conversation.findOne({
                participants: { $all: [pinnedBy.toString(), otherId] },
              });
              if (foundConv) {
                resolvedConvId = foundConv._id.toString();
              }
            } catch (e) {}
          }

          if (resolvedConvId) {
            try {
              const conv = await Conversation.findById(resolvedConvId);
              if (conv && conv.participants) {
                conv.participants.forEach((p) => targets.add(p.toString()));
              }
              const pinnedByUserId = pinnedBy?._id || pinnedBy;
              await Conversation.findByIdAndUpdate(resolvedConvId, {
                pinnedMessage: {
                  message: message?._id || message,
                  pinnedBy: pinnedByUserId,
                  duration: duration || "7 days",
                  pinnedAt: new Date(pinnedAt),
                  expiresAt: new Date(expiresAt),
                },
              });
            } catch (e) {
              console.error("Error saving pinned message to conversation:", e);
            }
          }

          const payload = {
            conversationId: resolvedConvId || conversationId,
            message,
            duration,
            pinnedBy,
            secondaryId,
            receiverId,
            pinnedAt,
            expiresAt,
          };

          targets.forEach((targetId) => {
            io.to(targetId).emit("message_pinned", payload);
            const socketId = onlineUsers.get(targetId);
            if (socketId) {
              io.to(socketId).emit("message_pinned", payload);
            }
          });
        } catch (error) {
          console.error("Error in pin_message socket event:", error);
        }
      },
    );

    socket.on(
      "unpin_message",
      async ({ conversationId, receiverId, secondaryId, unpinnedBy }) => {
        try {
          let resolvedConvId = conversationId;
          const targets = new Set();
          if (receiverId)
            targets.add((receiverId._id || receiverId).toString());
          if (unpinnedBy)
            targets.add((unpinnedBy._id || unpinnedBy).toString());
          if (secondaryId)
            targets.add((secondaryId._id || secondaryId).toString());

          if (!resolvedConvId && (receiverId || secondaryId) && unpinnedBy) {
            try {
              const otherId = (receiverId || secondaryId).toString();
              const foundConv = await Conversation.findOne({
                participants: { $all: [unpinnedBy.toString(), otherId] },
              });
              if (foundConv) {
                resolvedConvId = foundConv._id.toString();
              }
            } catch (e) {}
          }

          if (resolvedConvId) {
            try {
              const conv = await Conversation.findById(resolvedConvId);
              if (conv && conv.participants) {
                conv.participants.forEach((p) => targets.add(p.toString()));
              }
              await Conversation.findByIdAndUpdate(resolvedConvId, {
                $unset: { pinnedMessage: 1 },
              });
            } catch (e) {
              console.error(
                "Error unsetting pinned message from conversation:",
                e,
              );
            }
          }

          const payload = {
            conversationId: resolvedConvId || conversationId,
            secondaryId,
            receiverId,
            unpinnedBy,
          };

          targets.forEach((targetId) => {
            io.to(targetId).emit("message_unpinned", payload);
            const socketId = onlineUsers.get(targetId);
            if (socketId) {
              io.to(socketId).emit("message_unpinned", payload);
            }
          });
        } catch (error) {
          console.error("Error in unpin_message socket event:", error);
        }
      },
    );

    socket.on(
      "disappearing_update",
      async ({
        chatId,
        conversationId,
        secondaryId,
        receiverId,
        duration,
        event,
        setBy,
      }) => {
        try {
          let resolvedConvId = conversationId;
          const targets = new Set();
          if (receiverId)
            targets.add((receiverId._id || receiverId).toString());
          if (secondaryId)
            targets.add((secondaryId._id || secondaryId).toString());
          if (setBy) targets.add((setBy._id || setBy).toString());

          if (!resolvedConvId && chatId) {
            try {
              const convById = await Conversation.findById(chatId);
              if (convById) {
                resolvedConvId = convById._id.toString();
              } else {
                targets.add(chatId.toString());
                if (setBy) {
                  const foundConv = await Conversation.findOne({
                    participants: {
                      $all: [setBy.toString(), chatId.toString()],
                    },
                  });
                  if (foundConv) {
                    resolvedConvId = foundConv._id.toString();
                  }
                }
              }
            } catch (e) {}
          }

          if (!resolvedConvId && setBy) {
            const otherId = (receiverId || secondaryId || chatId)?.toString();
            if (otherId && otherId !== setBy.toString()) {
              try {
                let foundConv = await Conversation.findOne({
                  participants: { $all: [setBy.toString(), otherId] },
                });
                if (!foundConv) {
                  foundConv = await Conversation.create({
                    participants: [setBy.toString(), otherId].sort(),
                    disappearingDuration: duration || "Off",
                    disappearingSetBy: setBy || null,
                    disappearingUpdatedAt: new Date(),
                  });
                }
                if (foundConv) {
                  resolvedConvId = foundConv._id.toString();
                }
              } catch (e) {}
            }
          }

          if (resolvedConvId) {
            try {
              const conv = await Conversation.findById(resolvedConvId);
              if (conv && conv.participants) {
                conv.participants.forEach((p) => targets.add(p.toString()));
              }
              await Conversation.findByIdAndUpdate(resolvedConvId, {
                disappearingDuration: duration || "Off",
                disappearingSetBy: setBy || null,
                disappearingUpdatedAt: new Date(),
              });
            } catch (e) {
              console.error(
                "Error saving disappearing update to conversation:",
                e,
              );
            }
          }

          const payload = {
            chatId: resolvedConvId || conversationId || chatId || secondaryId,
            conversationId: resolvedConvId || conversationId,
            secondaryId,
            receiverId,
            duration,
            event,
            setBy,
          };

          targets.forEach((targetId) => {
            io.to(targetId).emit("disappearing_update", payload);
            const socketId = onlineUsers.get(targetId);
            if (socketId) {
              io.to(socketId).emit("disappearing_update", payload);
            }
          });

          if (resolvedConvId) {
            socket.to(resolvedConvId).emit("disappearing_update", payload);
          }
        } catch (error) {
          console.error("Error in disappearing_update socket event:", error);
        }
      },
    );

    handleVideoCallEvent(socket, io, onlineUsers);

    const handleDisconnected = async () => {
      if (!userId) return;

      try {
        onlineUsers.delete(userId);
        const lastSeen = new Date().toISOString();
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen,
        });

        io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen,
        });

        socket.leave(userId);
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    };

    socket.on("disconnect", handleDisconnected);
  });

  setInterval(async () => {
    try {
      const now = new Date();
      const expiredMsgs = await Message.find({
        isKept: { $ne: true },
        deletedForEveryone: { $ne: true },
        isDisappearing: true,
        disappearingExpiresAt: { $ne: null, $lte: now },
      })
        .select(
          "_id conversation sender receiver imageOrVideoUrl mediaPublicId mediaResourceType",
        )
        .lean();

      if (expiredMsgs && expiredMsgs.length > 0) {
        for (const m of expiredMsgs) {
          if (m.imageOrVideoUrl) {
            deleteFileFromCloudinary({
              url: m.imageOrVideoUrl,
              publicId: m.mediaPublicId,
              resourceType: m.mediaResourceType,
            }).catch((e) =>
              console.error("Cloudinary expiring message delete error:", e),
            );
          }
        }

        const expiredIds = expiredMsgs.map((m) => m._id);
        await Message.deleteMany({ _id: { $in: expiredIds } });

        const convGroups = new Map();
        expiredMsgs.forEach((m) => {
          const cId = m.conversation?.toString();
          if (cId) {
            if (!convGroups.has(cId)) convGroups.set(cId, []);
            convGroups.get(cId).push(m);
          }
        });

        for (const [cId, msgs] of convGroups.entries()) {
          const conv = await Conversation.findById(cId).select(
            "participants lastMessage",
          );
          const latestRemaining = await Message.findOne({ conversation: cId })
            .sort({ createdAt: -1 })
            .lean();

          if (conv) {
            if (
              conv.lastMessage &&
              expiredIds.some(
                (id) => id.toString() === conv.lastMessage.toString(),
              )
            ) {
              conv.lastMessage = latestRemaining?._id || null;
              await conv.save();
            }

            const participants = conv.participants || [];
            msgs.forEach((m) => {
              const msgIdStr = m._id.toString();
              participants.forEach((p) => {
                const targetId = (p._id || p).toString();
                const payload = {
                  deletedMessageId: msgIdStr,
                  conversationId: cId,
                  lastMessage: latestRemaining || null,
                  deletedForEveryone: false,
                  isDisappearingExpiry: true,
                };
                io.to(targetId).emit("message_deleted", payload);
                const sockId = onlineUsers.get(targetId);
                if (sockId) {
                  io.to(sockId).emit("message_deleted", payload);
                }
              });
            });
          }
        }
      }
    } catch (err) {
      console.error("Error in background disappearing cleanup interval:", err);
    }
  }, 3000);

  io.socketUserMap = onlineUsers;
  return io;
}

module.exports = { initializeSocket };
