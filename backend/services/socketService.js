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
        userId = connectingUserId;
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
        const messages = await Message.find({ _id: { $in: messageIds } });

        if (!messages.length) return;
        const senderIds = [
          ...new Set(messages.map((msg) => msg.sender.toString())),
        ];

        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } },
        );
        senderIds.forEach((senderId) => {
          io.to(senderId).emit("message_status_update_bulk", {
            messageIds,
            messageStatus: "read",
          });
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
        const userObjectId = new mongoose.Types.ObjectId(reactionUserId);
        await Message.updateOne(
          { _id: messageId },
          {
            $pull: { reactions: { userId: userObjectId } },
          },
        );
        await Message.updateOne(
          { _id: messageId },
          {
            $push: {
              reactions: {
                userId: userObjectId,
                emoji,
              },
            },
          },
        );

        const updated = await Message.findById(messageId)
          .populate("sender", "username profilePicture")
          .populate("receiver", "username profilePicture")
          .populate("reactions.userId", "username profilePicture");

        io.to(updated.sender._id.toString()).emit("reaction_update", {
          messageId,
          reactions: updated.reactions,
        });

        io.to(updated.receiver._id.toString()).emit("reaction_update", {
          messageId,
          reactions: updated.reactions,
        });
      } catch (error) {
        console.error(error);
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
