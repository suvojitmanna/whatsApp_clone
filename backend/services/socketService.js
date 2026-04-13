const { Server } = require("socket.io");
const User = require("../models/user");
const Message = require("../models/message");
const handleVideoCallEvent = require("./videoCallService");

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

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    let userId;

    // 🔹 USER CONNECT
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

    // 🔹 GET USER STATUS
    socket.on("get_user_status", (requestingUserId, callback) => {
      const isOnline = onlineUsers.has(requestingUserId);

      callback({
        userId: requestingUserId,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    // 🔹 SEND MESSAGE
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

    // 🔹 READ RECEIPT
    socket.on("message_read", async ({ messageIds }) => {
      console.log("🔥 READ EVENT RECEIVED:", messageIds, messageStatus);
      try {
        const messages = await Message.find({ _id: { $in: messageIds } });

        if (!messages.length) return;

        // get unique senderIds
        const senderIds = [
          ...new Set(messages.map((msg) => msg.sender.toString())),
        ];

        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } },
        );

        // emit to all senders
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

    // 🔹 TYPING START
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

    // 🔹 TYPING STOP
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

    // 🔹 ADD REACTION
    const mongoose = require("mongoose");

    socket.on("add_reaction", async ({ messageId, emoji, reactionUserId }) => {
      try {
        const userObjectId = new mongoose.Types.ObjectId(reactionUserId);

        // REMOVE old reaction from this user
        await Message.updateOne(
          { _id: messageId },
          {
            $pull: { reactions: { userId: userObjectId } },
          },
        );

        // ADD new reaction
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

    //handleVideo call events
    handleVideoCallEvent(socket, io, onlineUsers);

    // 🔹 DISCONNECT
    const handleDisconnected= async () => {
      if (!userId) return;

      try {
        onlineUsers.delete(userId);

        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);

          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) {
              clearTimeout(userTyping[key]);
            }
          });

          typingUsers.delete(userId);
        }

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });

        socket.leave(userId);
        console.log("User disconnected:", userId);
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    };
  });

  // FIXED (outside connection)
  io.socketUserMap = onlineUsers;

  return io;
}

module.exports = { initializeSocket };
