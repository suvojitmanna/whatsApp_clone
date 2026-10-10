const { Server } = require("socket.io");
const User = require("../models/user");
const Message = require("../models/message");
const handleVideoCallEvent = require("./videoCallService");
const socketMiddleware = require("../middleware/socketMiddleware");

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
        const messages = await Message.find({ _id: { $in: messageIds } });

        if (!messages.length) return;
        const senderIds = [
          ...new Set(
            messages.map((msg) => msg.sender?.toString()).filter(Boolean),
          ),
        ];

        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } },
        );
        senderIds.forEach((senderId) => {
          const sId = senderId.toString();
          const payload = {
            messageIds: messageIds.map(String),
            messageStatus: "read",
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
  io.socketUserMap = onlineUsers;
  return io;
}

module.exports = { initializeSocket };
