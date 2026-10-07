const { uploadFileToCloudinary } = require("../config/cloudinary");
const response = require("../utils/responseHandeler.js");
const Message = require("../models/message.js");
const Conversation = require("../models/ConverSation.js");

exports.sendMessage = async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      content,
      messageStatus,
      statusId,
      contentType: customContentType,
      pollData,
      contactData,
      eventData,
      fileName,
      fileSize,
    } = req.body;
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
    let contentType = customContentType || null;

    let parsedPoll = pollData;
    if (typeof pollData === "string") {
      try {
        parsedPoll = JSON.parse(pollData);
      } catch (e) {}
    }

    let parsedContact = contactData;
    if (typeof contactData === "string") {
      try {
        parsedContact = JSON.parse(contactData);
      } catch (e) {}
    }

    let parsedEvent = eventData;
    if (typeof eventData === "string") {
      try {
        parsedEvent = JSON.parse(eventData);
      } catch (e) {}
    }

    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);
      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to upload file");
      }
      imageOrVideoUrl = uploadFile?.secure_url;
      if (customContentType) {
        contentType = customContentType;
      } else if (file.mimetype.startsWith("image")) {
        contentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        contentType = "video";
      } else if (file.mimetype.startsWith("audio")) {
        contentType = "audio";
      } else {
        contentType = "document";
      }
    } else if (
      customContentType &&
      ["poll", "contact", "event", "sticker"].includes(customContentType)
    ) {
      contentType = customContentType;
      if (req.body.imageOrVideoUrl) {
        imageOrVideoUrl = req.body.imageOrVideoUrl;
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
      content: content || "",
      contentType,
      imageOrVideoUrl,
      fileName: fileName || file?.originalname,
      fileSize:
        fileSize || (file ? `${(file.size / 1024).toFixed(1)} KB` : null),
      pollData: parsedPoll,
      contactData: parsedContact,
      eventData: parsedEvent,
      messageStatus,
      timestamp,
      reactions: [],
      statusId: statusId || null,
    });
    await message.save();
    if (message?.content) {
      conversation.lastMessage = message._id;
    }
    conversation.unreadCount += 1;
    await conversation.save();

    const populatedMessage = await Message.findOne(message._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .populate({
        path: "statusId",
        populate: {
          path: "user",
          select: "username profilePicture",
        },
      });

    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(receiverId);

      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("receive_message", {
          ...populatedMessage.toObject(),
          unreadCount: conversation.unreadCount,
        });
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
    return response(res, 201, "Conversation retrieved successfully", conversation);
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
    const messages = await Message.find({
      conversation: conversationId,
      deletedFor: {
        $ne: userId,
      },
    })
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .populate("reactions.userId", "username profilePicture")
      .populate("pollData.options.votes", "username profilePicture")
      .populate({
        path: "statusId",
        populate: {
          path: "user",
          select: "username profilePicture",
        },
      })
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
  const { messageIds } = req.body;

  try {
    let messages = await Message.find({
      _id: { $in: messageIds },
      receiver: userId,
    });

    if (!messages.length) {
      return response(res, 404, "Messages not found");
    }

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: userId,
      },
      {
        $set: { messageStatus: "read" },
      }
    );
    messages = messages.map((msg) => ({
      ...msg._doc,
      messageStatus: "read",
    }));

    if (req.io && req.socketUserMap instanceof Map) {
      for (const message of messages) {
        const senderSocketId = req.socketUserMap.get(
          message.sender.toString()
        );
        if (senderSocketId) {
          req.io.to(senderSocketId).emit("message_read", {
            _id: message._id,
            messageStatus: "read",
          });
        }
      }
    }
    return response(res, 200, "Messages marked as read", messages);

  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

exports.deleteMessage = async (req, res) => {
  const userId = req.user.userId;
  const { messageId } = req.params;
  const { deleteFor } = req.body;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return response(res, 404, "Message not found");
    }
    if (deleteFor === "me") {
      await Message.updateOne(
        { _id: messageId },
        {
          $addToSet: {
            deletedFor: userId,
          },
        }
      );
      if (req.io && req.socketUserMap instanceof Map) {
        const userSocketId = req.socketUserMap.get(userId.toString());

        if (userSocketId) {
          req.io.to(userSocketId).emit("message_deleted_for_me", {
            deletedMessageId: messageId,
            conversationId: message.conversation.toString(),
          });
        }
      }

      return response(res, 200, "Message deleted for you");
    }

    if (deleteFor === "everyone") {
      if (message.sender.toString() !== userId) {
        return response(res, 403, "Only sender can delete for everyone");
      }
      await Message.deleteOne({ _id: messageId, });

      const previousMessage = await Message.findOne({
        conversation: message.conversation,
      })
        .sort({ createdAt: -1 })
        .populate("sender", "username profilePicture")
        .populate("receiver", "username profilePicture");

      await Conversation.findByIdAndUpdate(
        message.conversation,
        {
          lastMessage: previousMessage?._id || null,
        },
        { new: true }
      );
      const payload = {
        deletedMessageId: messageId,
        conversationId: message.conversation.toString(),
        lastMessage: previousMessage,
      };
      if (req.io && req.socketUserMap instanceof Map) {
        const receiverSocketId = req.socketUserMap.get(
          message.receiver.toString()
        );
        if (receiverSocketId) {
          req.io
            .to(receiverSocketId)
            .emit("message_deleted", payload);
        }
        const senderSocketId = req.socketUserMap.get(userId);
        if (senderSocketId) {
          req.io
            .to(senderSocketId)
            .emit("message_deleted", payload);
        }
      }

      return response(res, 200, "Message deleted for everyone");
    }
    return response(res, 400, "Invalid delete option");
  } catch (error) {
    console.error("DELETE MESSAGE ERROR:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

exports.editMessage = async (req, res) => {
  const userId = req.user.userId;
  const { messageId } = req.params;
  const { content } = req.body;

  try {
    if (!content || !content.trim()) {
      return response(res, 400, "Message cannot be empty");
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return response(res, 404, "Message not found");
    }
    if (message.sender.toString() !== userId.toString()) {
      return response(res, 403, "You can only edit your own messages");
    }

    if (message.contentType !== "text") {
      return response(res, 400, "Only text messages can be edited");
    }

    message.content = content.trim();
    message.edited = true;
    message.editedAt = new Date();

    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");

    if (req.io && req.socketUserMap instanceof Map) {
      const payload = {
        message: updatedMessage,
        messageId: messageId,
        conversationId: message.conversation.toString(),
      };

      const receiverSocketId = req.socketUserMap.get(
        message.receiver.toString()
      );

      const senderSocketId = req.socketUserMap.get(
        userId.toString()
      );

      if (receiverSocketId) {
        req.io
          .to(receiverSocketId)
          .emit("message_edited", payload);
      }

      if (senderSocketId) {
        req.io
          .to(senderSocketId)
          .emit("message_edited", payload);
      }
    }

    return response(res, 200, "Message edited successfully", updatedMessage);
  } catch (error) {
    console.error("EDIT MESSAGE ERROR:", error);
    return response(res, 500, "Internal server error");
  }
};

exports.votePoll = async (req, res) => {
  const { messageId } = req.params;
  const { optionIndex } = req.body;
  const userId = req.user?._id;

  try {
    const message = await Message.findById(messageId);
    if (!message || message.contentType !== "poll" || !message.pollData) {
      return response(res, 404, "Poll message not found");
    }

    const voterObjectId = new mongoose.Types.ObjectId(userId);
    const targetIdx = Number(optionIndex);

    if (
      isNaN(targetIdx) ||
      targetIdx < 0 ||
      targetIdx >= (message.pollData.options?.length || 0)
    ) {
      return response(res, 400, "Invalid option index");
    }

    if (!message.pollData.allowMultiple) {
      message.pollData.options.forEach((opt, idx) => {
        if (idx !== targetIdx) {
          opt.votes = (opt.votes || []).filter(
            (v) => (v?._id || v)?.toString() !== userId.toString()
          );
        }
      });
    }

    const targetOption = message.pollData.options[targetIdx];
    if (targetOption) {
      targetOption.votes = targetOption.votes || [];
      const alreadyVoted = targetOption.votes.some(
        (v) => (v?._id || v)?.toString() === userId.toString()
      );
      if (alreadyVoted) {
        targetOption.votes = targetOption.votes.filter(
          (v) => (v?._id || v)?.toString() !== userId.toString()
        );
      } else {
        targetOption.votes.push(voterObjectId);
      }
    }

    message.markModified("pollData");
    await message.save();

    const populated = await Message.findById(message._id)
      .populate("pollData.options.votes", "username profilePicture");

    const payload = {
      messageId: message._id.toString(),
      pollData: populated.pollData,
    };

    if (req.io && req.socketUserMap) {
      const senderSocketId = req.socketUserMap.get(message.sender.toString());
      const receiverSocketId = req.socketUserMap.get(
        message.receiver.toString()
      );

      if (senderSocketId) {
        req.io.to(senderSocketId).emit("poll_update", payload);
      }
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("poll_update", payload);
      }
      req.io.to(message.sender.toString()).emit("poll_update", payload);
      req.io.to(message.receiver.toString()).emit("poll_update", payload);
    }

    return response(res, 200, "Vote updated successfully", populated);
  } catch (error) {
    console.error("VOTE POLL CONTROLLER ERROR:", error);
    return response(res, 500, "Internal server error");
  }
};
