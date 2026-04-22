const { uploadFileToCloudinary } = require("../config/cloudinary");
const response = require("../utils/responseHandeler.js");
const Message = require("../models/message.js");
const Conversation = require("../models/converSation.js");

exports.sendMessage = async (req, res) => {
  // Implementation for sending a message
  try {
    const { senderId, receiverId, content, messageStatus } = req.body;
    console.log("FILE:", req.file); 
    console.log("BODY:", req.body);
    const participants = [senderId, receiverId].sort();
    const file = req.file;
    const timestamp = new Date();

    let conversation = await Conversation.findOne({
      participants: participants,
    });

    if (!conversation) {
      conversation = new Conversation({ participants: participants });
      await conversation.save();
    }

    let imageOrVideoUrl = null;
    let contentType = null;

    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);
      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to upload file");
      }
      imageOrVideoUrl = uploadFile?.secure_url;
      if (file.mimetype.startsWith("image")) {
        contentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        contentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content?.trim()) {
      contentType = "text";
    } else {
      return response(res, 400, "Message content is required");
    }

    const message = new Message({
      conversation: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content,
      contentType,
      imageOrVideoUrl,
      messageStatus,
      timestamp,
      reactions: [],
    });
    await message.save();
    if (message?.content) {
      conversation.lastMessage = message._id;
    }
    conversation.unreadCount += 1;
    await conversation.save();

    const populatedMessage = await Message.findOne(message._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");

    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(receiverId);
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("receive_message", populatedMessage);
        message.messageStatus = "delivered";
        await message.save();
      }
    }

    return response(res, 201, "Message sent successfully", populatedMessage);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

exports.getConversation = async (req, res) => {
  const userId = req.user.userId;
  try {
    let conversation = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture",
        },
      })
      .sort({ updatedAt: -1 });

    return response(
      res,
      201,
      "Conversation retrieved successfully",
      conversation,
    );
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

exports.getMessages = async (req, res) => {
  const userId = req.user.userId;
  const { conversationId } = req.params;

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }
    if (!conversation.participants.includes(userId)) {
      return response(res, 403, "Not Authorized  Access denied");
    }
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .populate("reactions.userId", "username profilePicture") // ADD THIS
      .sort({ createdAt: 1 });

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        messageStatus: { $in: ["send", "delivered", "read"] },
      },
      { $set: { messageStatus: "read" } },
    );

    conversation.unreadCount = 0;
    await conversation.save();
    return response(res, 201, "Messages retrieved successfully", messages);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

exports.markAsRead = async (req, res) => {
  const userId = req.user.userId;
  const { messageId } = req.body;

  try {
    let messages = await Message.find({
      _id: messageId,
      receiver: userId,
    });

    if (!messages.length) {
      return response(res, 404, "Message not found");
    }

    await Message.updateMany(
      { _id: messageId, receiver: userId },
      { $set: { messageStatus: "read" } },
    );

    // Update local response
    messages = messages.map((msg) => ({
      ...msg._doc,
      messageStatus: "read",
    }));

    // Socket emit
    if (req.io && req.socketUserMap instanceof Map) {
      for (const message of messages) {
        const senderSocketId = req.socketUserMap.get(message.sender.toString());

        if (senderSocketId) {
          req.io.to(senderSocketId).emit("message_read", {
            _id: message._id,
            messageStatus: "read",
          });
        }
      }
    }

    return response(res, 200, "Message marked as read", messages);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

exports.deleteMessage = async (req, res) => {
  const userId = req.user.userId;
  const { messageId } = req.params;

  try {
    const message = await Message.findOneAndDelete({
      _id: messageId,
      sender: userId,
    });

    if (!message) {
      return response(res, 404, "Message not found or unauthorized");
    }

    if (req.io && req.socketUserMap instanceof Map) {
      const receiverSocketId = req.socketUserMap.get(
        message.receiver.toString(),
      );

      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("message_deleted", messageId);
      }

      // optional: update sender UI
      const senderSocketId = req.socketUserMap.get(userId);
      if (senderSocketId) {
        req.io.to(senderSocketId).emit("message_deleted", messageId);
      }
    }

    return response(res, 200, "Message deleted successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};
