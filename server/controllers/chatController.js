const {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
  deleteMultipleFilesFromCloudinary,
} = require("../config/cloudinary");
const response = require("../utils/responseHandeler.js");
const Message = require("../models/message.js");
const Conversation = require("../models/ConverSation.js");
const User = require("../models/user.js");
const mongoose = require("mongoose");
const {
  META_AI_USER_ID,
  processMetaAiQuery,
} = require("../services/aiService.js");

function getDisappearingDurationMs(duration) {
  if (!duration || duration === "Off") return null;
  const dur = String(duration).toLowerCase().trim();
  if (dur.includes("24 hour") || dur === "24h") return 24 * 60 * 60 * 1000;
  if (dur.includes("7 day") || dur === "7d") return 7 * 24 * 60 * 60 * 1000;
  if (dur.includes("90 day") || dur === "90d") return 90 * 24 * 60 * 60 * 1000;
  if (dur.includes("minute")) {
    const m = parseInt(dur, 10);
    return (m || 1) * 60 * 1000;
  }
  if (dur.includes("hour")) {
    const h = parseInt(dur, 10);
    return (h || 1) * 60 * 60 * 1000;
  }
  if (dur.includes("day")) {
    const d = parseInt(dur, 10);
    return (d || 1) * 24 * 60 * 60 * 1000;
  }
  if (dur.includes("second")) {
    const s = parseInt(dur, 10);
    return (s || 1) * 1000;
  }
  return null;
}

async function triggerMetaAiResponse({
  io,
  senderId,
  effectiveReceiverId,
  conversationId,
  userMessage,
  isDirectToMetaAi,
  isMetaAiMention,
}) {
  try {
    const senderRoom = senderId.toString();
    const receiverRoom = effectiveReceiverId
      ? effectiveReceiverId.toString()
      : null;
    const senderSocketId =
      io?.socketUserMap && typeof io.socketUserMap.get === "function"
        ? io.socketUserMap.get(senderRoom)
        : null;
    const receiverSocketId =
      receiverRoom &&
      io?.socketUserMap &&
      typeof io.socketUserMap.get === "function"
        ? io.socketUserMap.get(receiverRoom)
        : null;

    if (io) {
      const typingPayload = {
        conversationId: conversationId.toString(),
        userId: META_AI_USER_ID,
        isTyping: true,
        typingUser: "Meta AI",
      };
      io.to(senderRoom).emit("user_typing", typingPayload);
      if (senderSocketId && senderSocketId !== senderRoom) {
        io.to(senderSocketId).emit("user_typing", typingPayload);
      }
      if (receiverRoom && receiverRoom !== META_AI_USER_ID) {
        io.to(receiverRoom).emit("user_typing", typingPayload);
        if (receiverSocketId && receiverSocketId !== receiverRoom) {
          io.to(receiverSocketId).emit("user_typing", typingPayload);
        }
      }
    }

    let rawPrompt = userMessage?.content || "";
    if (isMetaAiMention) {
      rawPrompt = rawPrompt.replace(/@meta\s*ai/gi, "").trim();
    }

    let recentMessages = [];
    try {
      recentMessages = await Message.find({
        conversation: conversationId,
        _id: { $ne: userMessage?._id },
        deletedForEveryone: false,
      })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();
      recentMessages.reverse();
    } catch (e) {
      console.warn(
        "Could not fetch recent messages for AI context:",
        e?.message,
      );
    }

    const aiResult = await processMetaAiQuery(rawPrompt, recentMessages);

    const aiMessage = new Message({
      conversation: conversationId,
      sender: META_AI_USER_ID,
      receiver: senderId,
      content: aiResult.content || "",
      contentType: aiResult.type === "image" ? "image" : "text",
      imageOrVideoUrl: aiResult.imageOrVideoUrl || null,
      isMetaAi: true,
      metaAiPrompt: rawPrompt,
      messageStatus: "read",
      readAt: new Date(),
      replyTo: isMetaAiMention ? userMessage?._id : null,
      timestamp: new Date(),
    });
    await aiMessage.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: aiMessage._id,
      updatedAt: new Date(),
    });

    const populatedAiMessage = await Message.findById(aiMessage._id)
      .populate("sender", "username profilePicture publicKey isAI isVerified")
      .populate("receiver", "username profilePicture publicKey")
      .populate("replyTo");

    if (io) {
      const stopTypingPayload = {
        conversationId: conversationId.toString(),
        userId: META_AI_USER_ID,
        isTyping: false,
        typingUser: "Meta AI",
      };
      io.to(senderRoom).emit("user_typing", stopTypingPayload);
      if (senderSocketId && senderSocketId !== senderRoom) {
        io.to(senderSocketId).emit("user_typing", stopTypingPayload);
      }
      if (receiverRoom && receiverRoom !== META_AI_USER_ID) {
        io.to(receiverRoom).emit("user_typing", stopTypingPayload);
        if (receiverSocketId && receiverSocketId !== receiverRoom) {
          io.to(receiverSocketId).emit("user_typing", stopTypingPayload);
        }
      }

      const aiPayload = {
        ...populatedAiMessage.toObject(),
        unreadCount: 0,
      };

      io.to(senderRoom).emit("receive_message", aiPayload);
      if (senderSocketId && senderSocketId !== senderRoom) {
        io.to(senderSocketId).emit("receive_message", aiPayload);
      }
      if (!isDirectToMetaAi && receiverRoom) {
        io.to(receiverRoom).emit("receive_message", aiPayload);
        if (receiverSocketId && receiverSocketId !== receiverRoom) {
          io.to(receiverSocketId).emit("receive_message", aiPayload);
        }
      }
    }
  } catch (error) {
    console.error("Meta AI response generation error:", error);
    if (io) {
      const senderRoom = senderId.toString();
      const senderSocketId = io?.socketUserMap?.get?.(senderRoom);
      const failPayload = {
        conversationId: conversationId.toString(),
        userId: META_AI_USER_ID,
        isTyping: false,
      };
      io.to(senderRoom).emit("user_typing", failPayload);
      if (senderSocketId && senderSocketId !== senderRoom) {
        io.to(senderSocketId).emit("user_typing", failPayload);
      }
    }
  }
}

exports.sendMessage = async (req, res) => {
  try {
    let {
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

    let effectiveReceiverId = receiverId ? receiverId.toString() : null;
    if (effectiveReceiverId) {
      const possibleConv =
        await Conversation.findById(effectiveReceiverId).select("participants");
      if (possibleConv && Array.isArray(possibleConv.participants)) {
        const other = possibleConv.participants.find(
          (p) => p.toString() !== senderId.toString(),
        );
        if (other) effectiveReceiverId = other.toString();
      }
    }

    const participants = [senderId, effectiveReceiverId].sort();
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

    let parsedCall = req.body.callData;
    if (typeof req.body.callData === "string") {
      try {
        parsedCall = JSON.parse(req.body.callData);
      } catch (e) {}
    }

    let parsedCallLink = req.body.callLinkData;
    if (typeof req.body.callLinkData === "string") {
      try {
        parsedCallLink = JSON.parse(req.body.callLinkData);
      } catch (e) {}
    }

    let mediaPublicId = null;
    let mediaResourceType = null;

    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);
      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to upload file");
      }
      imageOrVideoUrl = uploadFile?.secure_url;
      mediaPublicId = uploadFile?.public_id || null;
      mediaResourceType = uploadFile?.resource_type || null;
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
      ["poll", "contact", "event", "sticker", "call", "call_link"].includes(
        customContentType,
      )
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

    const senderUser = await User.findById(senderId).select("blockedUsers");
    const isReceiverBlockedBySender = Boolean(
      senderUser?.blockedUsers?.some((bId) => {
        const str = bId.toString();
        return (
          str === effectiveReceiverId.toString() ||
          (conversation && str === conversation._id.toString())
        );
      }),
    );
    if (isReceiverBlockedBySender) {
      return response(res, 400, "Unblock contact to send a message");
    }

    const receiverUser =
      await User.findById(effectiveReceiverId).select("blockedUsers");
    const isSenderBlockedByReceiver = Boolean(
      receiverUser?.blockedUsers?.some((bId) => {
        const str = bId.toString();
        return (
          str === senderId.toString() ||
          (conversation && str === conversation._id.toString())
        );
      }),
    );

    const receiverRoom = effectiveReceiverId?.toString();
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
    let isDisappearing = false;
    let disappearingDuration = null;
    let disappearingExpiresAt = null;

    const requestedDuration =
      conversation.disappearingDuration &&
      conversation.disappearingDuration !== "Off"
        ? conversation.disappearingDuration
        : req.body.disappearingDuration &&
            req.body.disappearingDuration !== "Off"
          ? req.body.disappearingDuration
          : null;

    if (requestedDuration && requestedDuration !== "Off") {
      const durMs = getDisappearingDurationMs(requestedDuration);
      if (durMs) {
        isDisappearing = true;
        disappearingDuration = requestedDuration;
        disappearingExpiresAt = new Date(Date.now() + durMs);
      }
    }

    if (
      requestedDuration &&
      conversation.disappearingDuration !== requestedDuration
    ) {
      conversation.disappearingDuration = requestedDuration;
      conversation.disappearingUpdatedAt =
        conversation.disappearingUpdatedAt || now;
      await conversation.save();
    }

    const message = new Message({
      conversation: conversation._id,
      sender: senderId,
      receiver: effectiveReceiverId,
      content: content || "",
      contentType,
      isEncrypted: isEncrypted === true || isEncrypted === "true",
      iv: iv || null,
      imageOrVideoUrl,
      mediaPublicId,
      mediaResourceType,
      fileName: fileName || file?.originalname,
      fileSize:
        fileSize || (file ? `${(file.size / 1024).toFixed(1)} KB` : null),
      pollData: parsedPoll,
      contactData: parsedContact,
      eventData: parsedEvent,
      callData: parsedCall,
      callLinkData: parsedCallLink,
      messageStatus: finalStatus,
      deliveredAt: initialDeliveredAt,
      blockedDelivery: isSenderBlockedByReceiver,
      deletedFor: isSenderBlockedByReceiver ? [effectiveReceiverId] : [],
      readAt: null,
      timestamp,
      reactions: [],
      statusId: statusId || null,
      replyTo: req.body.replyTo || null,
      replyMessage: parsedReply,
      isDisappearing,
      disappearingDuration,
      disappearingExpiresAt,
    });
    await message.save();

    conversation.deletedFor = (conversation.deletedFor || []).filter(
      (dId) =>
        dId.toString() !== senderId.toString() &&
        (!isSenderBlockedByReceiver
          ? dId.toString() !== effectiveReceiverId.toString()
          : true),
    );
    if (!isSenderBlockedByReceiver) {
      conversation.lastMessage = message._id;
    }
    await conversation.save();

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

    const isDirectToMetaAi =
      effectiveReceiverId?.toString() === META_AI_USER_ID ||
      conversation?.participants?.some(
        (p) => p?.toString() === META_AI_USER_ID,
      );
    const isMetaAiMention =
      typeof content === "string" && /@meta\s*ai/i.test(content);

    if (isDirectToMetaAi || isMetaAiMention) {
      triggerMetaAiResponse({
        io: req.io,
        senderId: senderId.toString(),
        effectiveReceiverId: effectiveReceiverId
          ? effectiveReceiverId.toString()
          : META_AI_USER_ID,
        conversationId: conversation._id,
        userMessage: populatedMessage,
        isDirectToMetaAi,
        isMetaAiMention,
      }).catch((err) =>
        console.error("Error triggering Meta AI response:", err),
      );
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
      deletedFor: { $ne: userId },
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
      .populate("disappearingSetBy", "username profilePicture")
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
      .select(
        "participants disappearingDuration disappearingUpdatedAt lastMessage",
      )
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
    const durMs = getDisappearingDurationMs(conversation.disappearingDuration);
    const expiredConditions = [
      {
        conversation: conversationId,
        isKept: { $ne: true },
        deletedForEveryone: { $ne: true },
        isDisappearing: true,
        disappearingExpiresAt: { $ne: null, $lte: now },
      },
    ];

    if (
      conversation.disappearingDuration &&
      conversation.disappearingDuration !== "Off" &&
      conversation.disappearingUpdatedAt &&
      durMs
    ) {
      const cutoff = new Date(Date.now() - durMs);
      expiredConditions.push({
        conversation: conversationId,
        isKept: { $ne: true },
        deletedForEveryone: { $ne: true },
        isDisappearing: true,
        disappearingExpiresAt: null,
        createdAt: {
          $gte: conversation.disappearingUpdatedAt,
          $lte: cutoff,
        },
      });
    }

    if (expiredConditions.length > 0) {
      await Message.deleteMany({ $or: expiredConditions });
    }

    const latestRemaining = await Message.findOne({
      conversation: conversationId,
    })
      .sort({ createdAt: -1 })
      .select("_id");

    if (
      conversation.lastMessage &&
      (!latestRemaining ||
        conversation.lastMessage.toString() !== latestRemaining._id.toString())
    ) {
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: latestRemaining?._id || null,
      });
    }
    const unreadMessages = await Message.find({
      conversation: conversationId,
      receiver: userId,
      messageStatus: { $in: ["send", "delivered"] },
      blockedDelivery: { $ne: true },
      deletedFor: { $ne: userId },
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
      if (message.imageOrVideoUrl) {
        const conv = await Conversation.findById(message.conversation).select(
          "participants",
        );
        const participants = (
          conv?.participants || [message.sender, message.receiver]
        ).map((p) => p.toString());
        const updatedDeletedFor = [
          ...(message.deletedFor || []).map((d) => d.toString()),
          userId.toString(),
        ];
        const allParticipantsDeleted =
          participants.length > 0 &&
          participants.every((p) => updatedDeletedFor.includes(p));

        const isSelfChat =
          message.sender.toString() === message.receiver.toString();
        const shouldDeleteMedia =
          allParticipantsDeleted ||
          isSelfChat ||
          req.body.deleteMedia === true ||
          req.body.deleteFromCloudinary === true;

        if (shouldDeleteMedia) {
          const otherMsg = await Message.exists({
            _id: { $ne: message._id },
            imageOrVideoUrl: message.imageOrVideoUrl,
            deletedForEveryone: { $ne: true },
          });
          if (!otherMsg) {
            deleteFileFromCloudinary({
              url: message.imageOrVideoUrl,
              publicId: message.mediaPublicId,
              resourceType: message.mediaResourceType,
            }).catch((err) =>
              console.error("Cloudinary delete for me error:", err),
            );
          }
        }
      }

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

      if (message.imageOrVideoUrl) {
        const otherMsg = await Message.exists({
          _id: { $ne: message._id },
          imageOrVideoUrl: message.imageOrVideoUrl,
          deletedForEveryone: { $ne: true },
        });
        if (!otherMsg) {
          deleteFileFromCloudinary({
            url: message.imageOrVideoUrl,
            publicId: message.mediaPublicId,
            resourceType: message.mediaResourceType,
          }).catch((err) =>
            console.error("Cloudinary delete for everyone error:", err),
          );
        }
      }

      message.deletedForEveryone = true;
      message.content = "This message was deleted";
      message.contentType = "text";
      message.isEncrypted = false;
      message.iv = null;
      message.imageOrVideoUrl = null;
      message.mediaPublicId = null;
      message.mediaResourceType = null;
      message.fileName = null;
      message.fileSize = null;
      message.pollData = null;
      message.contactData = null;
      message.eventData = null;
      message.reactions = [];
      message.edited = false;
      message.editedAt = null;
      await message.save();

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

      const populatedUpdatedMessage = await Message.findById(messageId)
        .populate("sender", "username profilePicture publicKey")
        .populate("receiver", "username profilePicture publicKey")
        .populate("replyTo");

      const latestMessage = await Message.findOne({
        conversation: message.conversation,
      })
        .sort({ createdAt: -1 })
        .populate("sender", "username profilePicture publicKey")
        .populate("receiver", "username profilePicture publicKey");

      await Conversation.findByIdAndUpdate(
        message.conversation,
        {
          lastMessage: latestMessage?._id || message._id,
        },
        { new: true },
      );

      const payload = {
        deletedMessageId: messageId,
        conversationId: message.conversation.toString(),
        lastMessage: latestMessage || populatedUpdatedMessage,
        deletedForEveryone: true,
        updatedMessage: populatedUpdatedMessage,
      };

      if (req.io) {
        req.io
          .to(message.conversation.toString())
          .emit("message_deleted", payload);
        req.io.to(message.receiver.toString()).emit("message_deleted", payload);
        req.io.to(userId.toString()).emit("message_deleted", payload);

        if (req.socketUserMap instanceof Map) {
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
      }

      return response(res, 200, "Message deleted for everyone", {
        lastMessage: latestMessage || populatedUpdatedMessage,
        updatedMessage: populatedUpdatedMessage,
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

    const isReceiverVoting =
      message.receiver &&
      userId &&
      message.receiver.toString() === userId.toString();

    if (isReceiverVoting && message.messageStatus !== "read") {
      message.messageStatus = "read";
      message.readAt = new Date();
      if (!message.deliveredAt) message.deliveredAt = new Date();
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
      messageStatus: message.messageStatus,
      readAt: message.readAt,
      deliveredAt: message.deliveredAt,
    };

    if (req.io) {
      if (req.socketUserMap) {
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
      }
      req.io.to(message.sender.toString()).emit("poll_update", payload);
      req.io.to(message.receiver.toString()).emit("poll_update", payload);

      if (isReceiverVoting) {
        const statusPayload = {
          messageId: message._id.toString(),
          messageStatus: "read",
          readAt: (message.readAt || new Date()).toISOString(),
          deliveredAt: (message.deliveredAt || new Date()).toISOString(),
        };
        req.io
          .to(message.sender.toString())
          .emit("message_status_update", statusPayload);
        req.io
          .to(message.sender.toString())
          .emit("message_read", statusPayload);
        if (req.socketUserMap) {
          const senderSocketId = req.socketUserMap.get(
            message.sender.toString(),
          );
          if (senderSocketId && senderSocketId !== message.sender.toString()) {
            req.io
              .to(senderSocketId)
              .emit("message_status_update", statusPayload);
            req.io.to(senderSocketId).emit("message_read", statusPayload);
          }
        }
      }
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
    let { targetUserId } = req.body;
    if (!targetUserId) {
      return response(res, 400, "Target user ID is required");
    }

    let resolvedTargetId = targetUserId.toString();
    const conv =
      await Conversation.findById(targetUserId).select("participants");
    if (conv && Array.isArray(conv.participants)) {
      const other = conv.participants.find(
        (p) => p.toString() !== userId.toString(),
      );
      if (other) resolvedTargetId = other.toString();
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: resolvedTargetId },
    });

    if (req.io) {
      req.io.to(userId.toString()).emit("user_blocked", {
        blockedUserId: resolvedTargetId,
        blockedBy: userId.toString(),
      });
      req.io.to(resolvedTargetId).emit("user_blocked", {
        blockedUserId: resolvedTargetId,
        blockedBy: userId.toString(),
      });
    }

    return response(res, 200, "User blocked successfully", {
      targetUserId: resolvedTargetId,
    });
  } catch (error) {
    console.error("BLOCK USER ERROR:", error);
    return response(res, 500, "Internal server error");
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    let { targetUserId } = req.body;
    if (!targetUserId) {
      return response(res, 400, "Target user ID is required");
    }

    let resolvedTargetId = targetUserId.toString();
    const conv =
      await Conversation.findById(targetUserId).select("participants");
    if (conv && Array.isArray(conv.participants)) {
      const other = conv.participants.find(
        (p) => p.toString() !== userId.toString(),
      );
      if (other) resolvedTargetId = other.toString();
    }
    const pullList = [targetUserId, resolvedTargetId].filter(Boolean);
    const userConv = await Conversation.findOne({
      participants: { $all: [userId, resolvedTargetId] },
    }).select("_id");
    if (userConv) {
      pullList.push(userConv._id.toString());
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: { $in: pullList } },
    });

    const now = new Date();
    const heldMessages = await Message.find({
      receiver: userId,
      sender: resolvedTargetId,
      blockedDelivery: true,
    }).sort({ createdAt: 1 });

    if (heldMessages.length > 0) {
      const heldIds = heldMessages.map((m) => m._id);
      await Message.updateMany(
        { _id: { $in: heldIds } },
        {
          $set: {
            blockedDelivery: false,
            messageStatus: "delivered",
            deliveredAt: now,
          },
          $pull: { deletedFor: userId },
        },
      );
      const lastHeldMsg = heldMessages[heldMessages.length - 1];
      if (lastHeldMsg) {
        await Conversation.findByIdAndUpdate(lastHeldMsg.conversation, {
          $set: { lastMessage: lastHeldMsg._id },
        });
      }
      const populatedHeldMessages = await Message.find({
        _id: { $in: heldIds },
      })
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

      if (req.io) {
        const statusPayload = {
          messageIds: heldIds.map(String),
          messageStatus: "delivered",
          deliveredAt: now.toISOString(),
          conversationId: heldMessages[0]?.conversation?.toString(),
        };
        req.io
          .to(resolvedTargetId)
          .emit("message_status_update_bulk", statusPayload);
        for (const heldId of heldIds) {
          req.io.to(resolvedTargetId).emit("message_status_update", {
            messageId: heldId.toString(),
            messageStatus: "delivered",
            deliveredAt: now.toISOString(),
          });
        }
        if (req.socketUserMap && typeof req.socketUserMap.get === "function") {
          const senderSocketId = req.socketUserMap.get(resolvedTargetId);
          if (senderSocketId && senderSocketId !== resolvedTargetId) {
            req.io
              .to(senderSocketId)
              .emit("message_status_update_bulk", statusPayload);
            for (const heldId of heldIds) {
              req.io.to(senderSocketId).emit("message_status_update", {
                messageId: heldId.toString(),
                messageStatus: "delivered",
                deliveredAt: now.toISOString(),
              });
            }
          }
        }
        for (const msg of populatedHeldMessages) {
          req.io.to(userId.toString()).emit("receive_message", msg);
          if (
            req.socketUserMap &&
            typeof req.socketUserMap.get === "function"
          ) {
            const receiverSocketId = req.socketUserMap.get(userId.toString());
            if (receiverSocketId && receiverSocketId !== userId.toString()) {
              req.io.to(receiverSocketId).emit("receive_message", msg);
            }
          }
        }
      }
    }

    if (req.io) {
      req.io.to(userId.toString()).emit("user_unblocked", {
        unblockedUserId: resolvedTargetId,
        unblockedBy: userId.toString(),
      });
      req.io.to(resolvedTargetId).emit("user_unblocked", {
        unblockedUserId: resolvedTargetId,
        unblockedBy: userId.toString(),
      });
    }

    return response(res, 200, "User unblocked successfully", {
      targetUserId: resolvedTargetId,
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

const cleanupOrphanedMedia = async (query) => {
  try {
    const candidates = await Message.find({
      ...query,
      imageOrVideoUrl: { $ne: null },
    })
      .select(
        "_id conversation sender receiver deletedFor deletedForEveryone imageOrVideoUrl mediaPublicId mediaResourceType",
      )
      .lean();

    if (!candidates || candidates.length === 0) return;

    for (const msg of candidates) {
      const participants = [
        msg.sender?.toString(),
        msg.receiver?.toString(),
      ].filter(Boolean);
      const deletedForList = (msg.deletedFor || []).map((d) => d.toString());
      const isCompletelyDeleted =
        msg.deletedForEveryone ||
        (participants.length > 0 &&
          participants.every((p) => deletedForList.includes(p)));

      if (isCompletelyDeleted && msg.imageOrVideoUrl) {
        const otherMsg = await Message.exists({
          _id: { $ne: msg._id },
          imageOrVideoUrl: msg.imageOrVideoUrl,
          deletedForEveryone: { $ne: true },
        });
        if (!otherMsg) {
          deleteFileFromCloudinary({
            url: msg.imageOrVideoUrl,
            publicId: msg.mediaPublicId,
            resourceType: msg.mediaResourceType,
          }).catch((e) => console.error("Cloudinary cleanup error:", e));
        }
      }
    }
  } catch (err) {
    console.error("Error in cleanupOrphanedMedia:", err);
  }
};

exports.clearChat = async (req, res) => {
  const userId = req.user.userId;
  const { conversationId, targetUserId } = req.body;

  try {
    let conv = null;
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conv = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });
    }

    if (
      !conv &&
      targetUserId &&
      mongoose.Types.ObjectId.isValid(targetUserId)
    ) {
      conv = await Conversation.findOne({
        participants: { $all: [userId, targetUserId] },
      });
    }

    let messageQuery = null;
    if (conv) {
      messageQuery = { conversation: conv._id };
    } else if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId)) {
      messageQuery = {
        $or: [
          { sender: userId, receiver: targetUserId },
          { sender: targetUserId, receiver: userId },
        ],
      };
    } else if (
      conversationId &&
      mongoose.Types.ObjectId.isValid(conversationId)
    ) {
      messageQuery = { conversation: conversationId };
    }

    if (!messageQuery) {
      return response(
        res,
        400,
        "Conversation ID or target user ID is required",
      );
    }
    await Message.updateMany(messageQuery, {
      $addToSet: { deletedFor: userId },
    });

    cleanupOrphanedMedia(messageQuery);

    if (conv) {
      await Conversation.findByIdAndUpdate(conv._id, {
        $set: { unreadCount: 0 },
      });
    }

    if (req.io) {
      req.io.to(userId.toString()).emit("chat_cleared", {
        conversationId: conv ? conv._id.toString() : conversationId,
        targetUserId,
      });
    }

    return response(res, 200, "Chat cleared successfully");
  } catch (error) {
    console.error("CLEAR CHAT ERROR:", error);
    return response(res, 500, "Internal server error");
  }
};

exports.deleteChat = async (req, res) => {
  const userId = req.user.userId;
  const { conversationId, targetUserId } = req.body;

  try {
    let conv = null;
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conv = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });
    }

    if (
      !conv &&
      targetUserId &&
      mongoose.Types.ObjectId.isValid(targetUserId)
    ) {
      conv = await Conversation.findOne({
        participants: { $all: [userId, targetUserId] },
      });
    }

    let messageQuery = null;
    if (conv) {
      messageQuery = { conversation: conv._id };
    } else if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId)) {
      messageQuery = {
        $or: [
          { sender: userId, receiver: targetUserId },
          { sender: targetUserId, receiver: userId },
        ],
      };
    } else if (
      conversationId &&
      mongoose.Types.ObjectId.isValid(conversationId)
    ) {
      messageQuery = { conversation: conversationId };
    }

    if (!messageQuery) {
      return response(
        res,
        400,
        "Conversation ID or target user ID is required",
      );
    }
    await Message.updateMany(messageQuery, {
      $addToSet: { deletedFor: userId },
    });
    cleanupOrphanedMedia(messageQuery);

    if (conv) {
      await Conversation.findByIdAndUpdate(conv._id, {
        $addToSet: { deletedFor: userId },
        $set: { unreadCount: 0 },
      });
    }

    if (req.io) {
      req.io.to(userId.toString()).emit("chat_deleted", {
        conversationId: conv ? conv._id.toString() : conversationId,
        targetUserId,
      });
    }

    return response(res, 200, "Chat deleted successfully");
  } catch (error) {
    console.error("DELETE CHAT ERROR:", error);
    return response(res, 500, "Internal server error");
  }
};

exports.getChatMedia = async (req, res) => {
  const userId = req.user.userId;
  const { conversationId } = req.query;

  try {
    let convIds = [];
    if (
      conversationId &&
      conversationId !== "all" &&
      mongoose.Types.ObjectId.isValid(conversationId)
    ) {
      let conv = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      }).select("_id");

      if (!conv) {
        conv = await Conversation.findOne({
          participants: { $all: [userId, conversationId] },
        }).select("_id");
      }

      if (conv) {
        convIds = [conv._id];
      } else {
        convIds = [];
      }
    } else {
      const convs = await Conversation.find({
        participants: userId,
        deletedFor: { $ne: userId },
      }).select("_id");
      convIds = convs.map((c) => c._id);
    }

    if (convIds.length === 0) {
      return response(res, 200, "Media retrieved successfully", {
        media: [],
        docs: [],
        links: [],
        counts: { media: 0, docs: 0, links: 0, total: 0 },
      });
    }

    const baseFilter = {
      conversation: { $in: convIds },
      deletedFor: { $ne: userId },
      deletedForEveryone: { $ne: true },
      blockedDelivery: { $ne: true },
    };

    const messages = await Message.find({
      ...baseFilter,
      $or: [
        { contentType: { $in: ["image", "video", "document"] } },
        { imageOrVideoUrl: { $exists: true, $ne: null, $ne: "" } },
        { fileUrl: { $exists: true, $ne: null, $ne: "" } },
        { fileName: { $exists: true, $ne: null, $ne: "" } },
        { content: { $regex: /https?:\/\/|www\./i } },
      ],
    })
      .populate("sender", "username phoneNumber profilePicture publicKey")
      .populate("receiver", "username phoneNumber profilePicture publicKey")
      .populate({
        path: "conversation",
        select: "participants updatedAt",
        populate: {
          path: "participants",
          select: "username phoneNumber profilePicture publicKey",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    const mediaList = [];
    const docsList = [];
    const linksList = [];

    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

    messages.forEach((msg) => {
      const isVideo =
        msg.contentType === "video" ||
        Boolean(
          msg.imageOrVideoUrl &&
          msg.imageOrVideoUrl.match(/\.(mp4|webm|mov|mkv)($|\?)/i),
        );
      const isImage =
        msg.contentType === "image" || Boolean(msg.imageOrVideoUrl && !isVideo);

      if (isImage || isVideo) {
        mediaList.push({
          ...msg,
          mediaType: isVideo ? "video" : "image",
          url: msg.imageOrVideoUrl,
        });
      }

      const isDoc =
        msg.contentType === "document" ||
        Boolean(msg.fileName) ||
        Boolean(msg.fileUrl && !isImage && !isVideo);

      if (isDoc) {
        docsList.push({
          ...msg,
          docName: msg.fileName || msg.content || "Document",
          docUrl: msg.fileUrl || msg.imageOrVideoUrl,
          fileSize: msg.fileSize || "",
        });
      }

      if (msg.content && typeof msg.content === "string") {
        const matches = msg.content.match(urlRegex);
        if (matches && matches.length > 0) {
          matches.forEach((matchedUrl) => {
            const cleanUrl = matchedUrl.startsWith("http")
              ? matchedUrl
              : `https://${matchedUrl}`;
            let domain = "";
            try {
              domain = new URL(cleanUrl).hostname;
            } catch (e) {
              domain = cleanUrl;
            }
            linksList.push({
              _id: `${msg._id}_${cleanUrl}`,
              messageId: msg._id,
              url: cleanUrl,
              domain: domain.replace(/^www\./i, ""),
              title: msg.content,
              createdAt: msg.createdAt,
              sender: msg.sender,
              receiver: msg.receiver,
              conversation: msg.conversation,
            });
          });
        }
      }
    });

    return response(res, 200, "Media retrieved successfully", {
      media: mediaList,
      docs: docsList,
      links: linksList,
      counts: {
        media: mediaList.length,
        docs: docsList.length,
        links: linksList.length,
        total: mediaList.length + docsList.length + linksList.length,
      },
    });
  } catch (error) {
    console.error("Error in getChatMedia:", error);
    return response(res, 500, "Internal server error");
  }
};

exports.setDisappearingDuration = async (req, res) => {
  try {
    const conversationId = req.params.conversationId || req.body.conversationId;
    const { duration, receiverId } = req.body;
    const userId = req.user._id;

    let conv = null;
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conv = await Conversation.findById(conversationId);
    }

    if (!conv && receiverId && mongoose.Types.ObjectId.isValid(receiverId)) {
      conv = await Conversation.findOne({
        participants: { $all: [userId.toString(), receiverId.toString()] },
      });
      if (!conv) {
        conv = await Conversation.create({
          participants: [userId.toString(), receiverId.toString()].sort(),
          disappearingDuration: duration || "Off",
          disappearingSetBy: userId,
          disappearingUpdatedAt: new Date(),
        });
      }
    }

    if (!conv) {
      return response(res, 404, "Conversation not found");
    }

    const prevDuration = conv.disappearingDuration || "Off";
    const now = new Date();
    conv.disappearingDuration = duration || "Off";
    conv.disappearingSetBy = userId;
    conv.disappearingUpdatedAt = now;
    await conv.save();

    let action = "updated";
    if (prevDuration === "Off" && duration !== "Off") {
      action = "turned_on";
    } else if (duration === "Off") {
      action = "turned_off";
    }

    const newEvent = {
      _id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isDisappearingSystemEvent: true,
      action,
      duration: conv.disappearingDuration,
      previousDuration: prevDuration,
      setBy: userId,
      createdAt: now.toISOString(),
      timestamp: now.getTime(),
    };

    const io = req.io;
    if (io && conv.participants) {
      const payload = {
        chatId: conv._id.toString(),
        conversationId: conv._id.toString(),
        secondaryId: receiverId || null,
        duration: conv.disappearingDuration,
        event: newEvent,
        setBy: userId,
      };
      conv.participants.forEach((p) => {
        io.to(p.toString()).emit("disappearing_update", payload);
      });
    }

    return response(res, 200, "Disappearing messages updated", {
      conversation: conv,
      event: newEvent,
    });
  } catch (error) {
    console.error("Error in setDisappearingDuration:", error);
    return response(res, 500, "Internal server error");
  }
};

exports.askMetaAi = async (req, res) => {
  try {
    const { prompt, conversationId } = req.body;
    if (!prompt || !prompt.trim()) {
      return response(res, 400, "Prompt is required");
    }

    let recentMessages = [];
    if (conversationId) {
      try {
        recentMessages = await Message.find({
          conversation: conversationId,
          deletedForEveryone: false,
        })
          .sort({ createdAt: -1 })
          .limit(6)
          .lean();
        recentMessages.reverse();
      } catch (e) {
        console.warn("askMetaAi history fetch failed:", e?.message);
      }
    }

    const aiResult = await processMetaAiQuery(prompt.trim(), recentMessages);
    return response(res, 200, "Meta AI response generated", aiResult);
  } catch (error) {
    console.error("askMetaAi error:", error);
    return response(res, 500, "Failed to generate Meta AI response");
  }
};
