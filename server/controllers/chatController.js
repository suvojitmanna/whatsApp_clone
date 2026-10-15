const { uploadFileToCloudinary } = require("../config/cloudinary");
const response = require("../utils/responseHandeler.js");
const Message = require("../models/message.js");
const Conversation = require("../models/ConverSation.js");
const User = require("../models/user.js");
const mongoose = require("mongoose");

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
      isEncrypted,
      iv,
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

    let parsedReply = null;
    if (req.body.replyMessage) {
      if (typeof req.body.replyMessage === "string") {
        try {
          parsedReply = JSON.parse(req.body.replyMessage);
        } catch (e) {
          parsedReply = null;
        }
      } else {
        parsedReply = req.body.replyMessage;
      }
    }

    const receiverUser = await User.findById(receiverId).select("blockedUsers");
    const isSenderBlockedByReceiver = Boolean(
      receiverUser?.blockedUsers?.some(
        (bId) => bId.toString() === senderId.toString(),
      ),
    );

    const receiverRoom = receiverId?.toString();
    const isReceiverOnline =
      !isSenderBlockedByReceiver &&
      Boolean(
        (req.socketUserMap &&
          typeof req.socketUserMap.get === "function" &&
          req.socketUserMap.get(receiverRoom)) ||
        (req.io && req.io.sockets?.adapter?.rooms?.get(receiverRoom)?.size > 0),
      );
    const now = new Date();
    const finalStatus = isSenderBlockedByReceiver
      ? "send"
      : isReceiverOnline
        ? "delivered"
        : "send";
    const initialDeliveredAt =
      isReceiverOnline && !isSenderBlockedByReceiver ? now : null;

    const message = new Message({
      conversation: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content: content || "",
      contentType,
      isEncrypted: isEncrypted === true || isEncrypted === "true",
      iv: iv || null,
      imageOrVideoUrl,
      fileName: fileName || file?.originalname,
      fileSize:
        fileSize || (file ? `${(file.size / 1024).toFixed(1)} KB` : null),
      pollData: parsedPoll,
      contactData: parsedContact,
      eventData: parsedEvent,
      messageStatus: finalStatus,
      deliveredAt: initialDeliveredAt,
      blockedDelivery: isSenderBlockedByReceiver,
      deletedFor: isSenderBlockedByReceiver ? [receiverId] : [],
      readAt: null,
      timestamp,
      reactions: [],
      statusId: statusId || null,
      replyTo: req.body.replyTo || null,
      replyMessage: parsedReply,
    });
    await message.save();

    if (!isSenderBlockedByReceiver) {
      conversation.lastMessage = message._id;
      await conversation.save();
    }

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username profilePicture publicKey")
      .populate("receiver", "username profilePicture publicKey")
      .populate("replyTo")
      .populate({
        path: "statusId",
        populate: {
          path: "user",
          select: "username profilePicture",
        },
      });

    if (req.io && !isSenderBlockedByReceiver) {
      const receiverSocketId =
        req.socketUserMap && typeof req.socketUserMap.get === "function"
          ? req.socketUserMap.get(receiverRoom)
          : null;

      const receiverUnreadCount = await Message.countDocuments({
        conversation: conversation._id,
        receiver: receiverId,
        messageStatus: { $in: ["send", "delivered"] },
        deletedFor: { $ne: receiverId },
      });

      const messagePayload = {
        ...populatedMessage.toObject(),
        unreadCount: receiverUnreadCount,
      };

      req.io.to(receiverRoom).emit("receive_message", messagePayload);
      if (receiverSocketId && receiverSocketId !== receiverRoom) {
        req.io.to(receiverSocketId).emit("receive_message", messagePayload);
      }

      if (isReceiverOnline) {
        const senderRoom = senderId.toString();
        const statusPayload = {
          messageId: message._id.toString(),
          messageStatus: "delivered",
          deliveredAt: initialDeliveredAt.toISOString(),
        };
        req.io.to(senderRoom).emit("message_status_update", statusPayload);
        if (req.socketUserMap && typeof req.socketUserMap.get === "function") {
          const senderSocketId = req.socketUserMap.get(senderRoom);
          if (senderSocketId && senderSocketId !== senderRoom) {
            req.io
              .to(senderSocketId)
              .emit("message_status_update", statusPayload);
          }
        }
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
      .populate(
        "participants",
        "username profilePicture isOnline lastSeen email phoneNumber publicKey",
      )
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture email phoneNumber publicKey",
        },
      })
      .populate({
        path: "pinnedMessage.message",
        populate: {
          path: "sender receiver",
          select: "username profilePicture email phoneNumber publicKey",
        },
      })
      .populate("pinnedMessage.pinnedBy", "username profilePicture")
      .sort({ updatedAt: -1 })
      .lean();

    if (conversation && conversation.length > 0) {
      const conversationIds = conversation.map((c) => c._id);
      const unreadAgg = await Message.aggregate([
        {
          $match: {
            conversation: { $in: conversationIds },
            receiver: new mongoose.Types.ObjectId(userId),
            messageStatus: { $in: ["send", "delivered"] },
            deletedFor: { $ne: new mongoose.Types.ObjectId(userId) },
          },
        },
        {
          $group: {
            _id: "$conversation",
            count: { $sum: 1 },
          },
        },
      ]);

      const unreadMap = new Map();
      unreadAgg.forEach((item) => {
        unreadMap.set(item._id.toString(), item.count);
      });

      conversation = conversation.map((conv) => {
        let lastMsg = conv.lastMessage;
        if (
          lastMsg &&
          Array.isArray(lastMsg.deletedFor) &&
          lastMsg.deletedFor.some((dId) => dId.toString() === userId.toString())
        ) {
          lastMsg = null;
        }
        return {
          ...conv,
          lastMessage: lastMsg,
          unreadCount: unreadMap.get(conv._id.toString()) || 0,
        };
      });
    }

    return response(
      res,
      200,
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
    const conversation = await Conversation.findById(conversationId)
      .select("participants")
      .lean();
    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString(),
    );
    if (!isParticipant) {
      return response(res, 403, "Not Authorized Access denied");
    }

    const now = new Date();
    const unreadMessages = await Message.find({
      conversation: conversationId,
      receiver: userId,
      messageStatus: { $in: ["send", "delivered"] },
    }).select("_id sender");

    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map((m) => m._id);
      await Promise.all([
        Message.updateMany(
          { _id: { $in: unreadIds } },
          { $set: { messageStatus: "read", readAt: now } },
        ),
        Message.updateMany(
          { _id: { $in: unreadIds }, deliveredAt: null },
          { $set: { deliveredAt: now } },
        ),
        Conversation.findByIdAndUpdate(conversationId, {
          $set: { unreadCount: 0 },
        }),
      ]);

      if (req.io) {
        const senderGroups = new Map();
        unreadMessages.forEach((m) => {
          const sId = m.sender?.toString();
          if (sId) {
            if (!senderGroups.has(sId)) senderGroups.set(sId, []);
            senderGroups.get(sId).push(m._id.toString());
          }
        });

        for (const [sId, mIds] of senderGroups.entries()) {
          const payload = {
            messageIds: mIds,
            messageStatus: "read",
            readAt: now.toISOString(),
            deliveredAt: now.toISOString(),
          };
          req.io.to(sId).emit("message_status_update_bulk", payload);
          req.io.to(sId).emit("message_read", payload);
          if (
            req.socketUserMap &&
            typeof req.socketUserMap.get === "function"
          ) {
            const senderSocketId = req.socketUserMap.get(sId);
            if (senderSocketId && senderSocketId !== sId) {
              req.io
                .to(senderSocketId)
                .emit("message_status_update_bulk", payload);
              req.io.to(senderSocketId).emit("message_read", payload);
            }
          }
        }
      }
    } else {
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { unreadCount: 0 },
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
      deletedFor: {
        $ne: userId,
      },
    })
      .populate("sender", "username profilePicture publicKey")
      .populate("receiver", "username profilePicture publicKey")
      .populate("reactions.userId", "username profilePicture")
      .populate("pollData.options.votes", "username profilePicture")
      .populate("replyTo")
      .populate({
        path: "statusId",
        populate: {
          path: "user",
          select: "username profilePicture",
        },
      })
      .sort({ createdAt: 1 })
      .lean();

    return response(res, 200, "Messages retrieved successfully", messages);
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
      return response(
        res,
        200,
        "Messages already marked as read or not found",
        [],
      );
    }

    const now = new Date();
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: userId,
      },
      {
        $set: { messageStatus: "read", readAt: now },
      },
    );
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: userId,
        deliveredAt: null,
      },
      {
        $set: { deliveredAt: now },
      },
    );

    const convIds = [
      ...new Set(
        messages.map((m) => m.conversation?.toString()).filter(Boolean),
      ),
    ];
    if (convIds.length > 0) {
      await Conversation.updateMany(
        { _id: { $in: convIds } },
        { $set: { unreadCount: 0 } },
      );
    }

    messages = messages.map((msg) => ({
      ...msg._doc,
      messageStatus: "read",
      readAt: now,
      deliveredAt: msg.deliveredAt || now,
    }));

    if (req.io) {
      const readMessageIds = messageIds.map(String);
      const senderIds = [
        ...new Set(messages.map((m) => m.sender?.toString()).filter(Boolean)),
      ];

      senderIds.forEach((senderId) => {
        const sId = senderId.toString();
        const payload = {
          messageIds: readMessageIds,
          messageStatus: "read",
          readAt: now.toISOString(),
          deliveredAt: now.toISOString(),
        };
        req.io.to(sId).emit("message_status_update_bulk", payload);
        req.io.to(sId).emit("message_read", payload);

        if (req.socketUserMap && typeof req.socketUserMap.get === "function") {
          const senderSocketId = req.socketUserMap.get(sId);
          if (senderSocketId) {
            req.io
              .to(senderSocketId)
              .emit("message_status_update_bulk", payload);
            req.io.to(senderSocketId).emit("message_read", payload);
          }
        }
      });
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
        },
      );

      const previousMessage = await Message.findOne({
        conversation: message.conversation,
        deletedFor: { $ne: userId },
      })
        .sort({ createdAt: -1 })
        .populate("sender", "username profilePicture publicKey")
        .populate("receiver", "username profilePicture publicKey");

      if (req.io && req.socketUserMap instanceof Map) {
        const userSocketId = req.socketUserMap.get(userId.toString());

        if (userSocketId) {
          req.io.to(userSocketId).emit("message_deleted", {
            deletedMessageId: messageId,
            conversationId: message.conversation.toString(),
            lastMessage: previousMessage,
          });
        }
      }

      return response(res, 200, "Message deleted for you", {
        lastMessage: previousMessage,
      });
    }

    if (deleteFor === "everyone") {
      if (message.sender.toString() !== userId) {
        return response(res, 403, "Only sender can delete for everyone");
      }
      await Message.deleteOne({ _id: messageId });

      const conv = await Conversation.findById(message.conversation);
      const isPinned =
        conv &&
        conv.pinnedMessage &&
        conv.pinnedMessage.message &&
        conv.pinnedMessage.message.toString() === messageId.toString();

      if (isPinned) {
        await Conversation.findByIdAndUpdate(message.conversation, {
          pinnedMessage: null,
        });
        if (req.io) {
          const unpinPayload = {
            conversationId: message.conversation.toString(),
            secondaryId: null,
            receiverId: message.receiver.toString(),
            unpinnedBy: userId,
          };
          req.io
            .to(message.conversation.toString())
            .emit("message_unpinned", unpinPayload);
          req.io
            .to(message.receiver.toString())
            .emit("message_unpinned", unpinPayload);
          req.io.to(userId.toString()).emit("message_unpinned", unpinPayload);
        }
      }

      const previousMessage = await Message.findOne({
        conversation: message.conversation,
      })
        .sort({ createdAt: -1 })
        .populate("sender", "username profilePicture publicKey")
        .populate("receiver", "username profilePicture publicKey");

      await Conversation.findByIdAndUpdate(
        message.conversation,
        {
          lastMessage: previousMessage?._id || null,
        },
        { new: true },
      );
      const payload = {
        deletedMessageId: messageId,
        conversationId: message.conversation.toString(),
        lastMessage: previousMessage,
      };
      if (req.io && req.socketUserMap instanceof Map) {
        const receiverSocketId = req.socketUserMap.get(
          message.receiver.toString(),
        );
        if (receiverSocketId) {
          req.io.to(receiverSocketId).emit("message_deleted", payload);
        }
        const senderSocketId = req.socketUserMap.get(userId);
        if (senderSocketId) {
          req.io.to(senderSocketId).emit("message_deleted", payload);
        }
      }

      return response(res, 200, "Message deleted for everyone", {
        lastMessage: previousMessage,
      });
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
  const { content, eventData } = req.body;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return response(res, 404, "Message not found");
    }
    if (message.sender.toString() !== userId.toString()) {
      return response(res, 403, "You can only edit your own messages");
    }

    if (message.contentType !== "text" && message.contentType !== "event") {
      return response(res, 400, "Only text and event messages can be edited");
    }

    if (message.contentType === "event") {
      let parsedEvent = eventData;
      if (typeof parsedEvent === "string") {
        try {
          parsedEvent = JSON.parse(parsedEvent);
        } catch (e) {}
      }
      if (parsedEvent) {
        message.eventData = {
          ...(message.eventData || {}),
          ...parsedEvent,
        };
      }
      if (content && content.trim()) {
        message.content = content.trim();
      } else if (message.eventData?.isCancelled) {
        message.content = `Cancelled event: ${message.eventData?.title || ""}`;
      } else if (message.eventData?.title) {
        message.content = `Event: ${message.eventData.title}`;
      }
      message.markModified("eventData");
    } else {
      if (!content || !content.trim()) {
        return response(res, 400, "Message cannot be empty");
      }
      message.content = content.trim();
    }

    if (req.body.isEncrypted !== undefined) {
      message.isEncrypted =
        req.body.isEncrypted === true || req.body.isEncrypted === "true";
    }
    if (req.body.iv !== undefined) {
      message.iv = req.body.iv;
    }

    message.edited = true;
    message.editedAt = new Date();

    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate("sender", "username profilePicture publicKey")
      .populate("receiver", "username profilePicture publicKey");

    if (req.io && req.socketUserMap instanceof Map) {
      const payload = {
        message: updatedMessage,
        messageId: messageId,
        conversationId: message.conversation.toString(),
      };

      const receiverSocketId = req.socketUserMap.get(
        message.receiver.toString(),
      );

      const senderSocketId = req.socketUserMap.get(userId.toString());

      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("message_edited", payload);
      }

      if (senderSocketId) {
        req.io.to(senderSocketId).emit("message_edited", payload);
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
            (v) => (v?._id || v)?.toString() !== userId.toString(),
          );
        }
      });
    }

    const targetOption = message.pollData.options[targetIdx];
    if (targetOption) {
      targetOption.votes = targetOption.votes || [];
      const alreadyVoted = targetOption.votes.some(
        (v) => (v?._id || v)?.toString() === userId.toString(),
      );
      if (alreadyVoted) {
        targetOption.votes = targetOption.votes.filter(
          (v) => (v?._id || v)?.toString() !== userId.toString(),
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

    if (req.io && req.socketUserMap) {
      const senderSocketId = req.socketUserMap.get(message.sender.toString());
      const receiverSocketId = req.socketUserMap.get(
        message.receiver.toString(),
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

exports.blockUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return response(res, 400, "Target user ID is required");
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: targetUserId },
    });

    return response(res, 200, "User blocked successfully", {
      targetUserId,
    });
  } catch (error) {
    console.error("BLOCK USER ERROR:", error);
    return response(res, 500, "Internal server error");
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return response(res, 400, "Target user ID is required");
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: targetUserId },
    });

    return response(res, 200, "User unblocked successfully", {
      targetUserId,
    });
  } catch (error) {
    console.error("UNBLOCK USER ERROR:", error);
    return response(res, 500, "Internal server error");
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("blockedUsers");
    return response(res, 200, "Blocked users retrieved successfully", {
      blockedUsers: user?.blockedUsers || [],
    });
  } catch (error) {
    console.error("GET BLOCKED USERS ERROR:", error);
    return response(res, 500, "Internal server error");
  }
};

