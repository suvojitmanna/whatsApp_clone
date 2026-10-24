import {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
  deleteMultipleFilesFromCloudinary,
} from "../config/cloudinary.js";
import response from "../utils/responseHandeler.js";
import Message from "../models/message.js";
import Conversation from "../models/ConverSation.js";
import User from "../models/user.js";
import mongoose from "mongoose";
import { META_AI_USER_ID, processMetaAiQuery } from "../services/aiService.js";
import { callFastLlm, callDualLlm } from "../services/ai/llmProvider.js";
import { AI_CONFIG } from "../services/ai/config.js";
import {
  onGroupMessageCreated,
  processMultipleGroupReceipts,
} from "../services/groupStatusService.js";

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
  metaAiPersona = "default",
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

    const aiResult = await processMetaAiQuery(
      rawPrompt,
      recentMessages,
      metaAiPersona || "default",
    );

    const aiMessage = new Message({
      conversation: conversationId,
      sender: META_AI_USER_ID,
      receiver: senderId,
      content: aiResult.content || "",
      contentType: aiResult.type === "image" ? "image" : "text",
      imageOrVideoUrl: aiResult.imageOrVideoUrl || null,
      metaAiImages: Array.isArray(aiResult.metaAiImages)
        ? aiResult.metaAiImages
        : Array.isArray(aiResult.searchImages)
          ? aiResult.searchImages
          : [],
      metaAiSuggestions: Array.isArray(aiResult.metaAiSuggestions)
        ? aiResult.metaAiSuggestions
        : Array.isArray(aiResult.suggestions)
          ? aiResult.suggestions
          : [],
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

    const readTime = new Date();
    const updatedUserMsgIds = [];

    if (userMessage?._id) {
      await Message.findByIdAndUpdate(userMessage._id, {
        $set: {
          messageStatus: "read",
          readAt: readTime,
          deliveredAt: userMessage.deliveredAt || readTime,
        },
      });
      updatedUserMsgIds.push(userMessage._id.toString());
    }

    if (isDirectToMetaAi) {
      const pendingUserMsgs = await Message.find({
        conversation: conversationId,
        sender: senderId,
        messageStatus: { $in: ["send", "delivered", "pending"] },
      }).select("_id");

      if (pendingUserMsgs.length > 0) {
        await Message.updateMany(
          {
            conversation: conversationId,
            sender: senderId,
            messageStatus: { $in: ["send", "delivered", "pending"] },
          },
          {
            $set: {
              messageStatus: "read",
              readAt: readTime,
              deliveredAt: readTime,
            },
          },
        );
        pendingUserMsgs.forEach((m) => {
          const idStr = m._id.toString();
          if (!updatedUserMsgIds.includes(idStr)) {
            updatedUserMsgIds.push(idStr);
          }
        });
      }
    }

    if (io) {
      if (updatedUserMsgIds.length > 0) {
        const statusPayload = {
          messageId: userMessage?._id?.toString() || updatedUserMsgIds[0],
          messageIds: updatedUserMsgIds,
          conversationId: conversationId.toString(),
          messageStatus: "read",
          readAt: readTime.toISOString(),
          deliveredAt: readTime.toISOString(),
        };
        io.to(senderRoom).emit("message_status_update", statusPayload);
        io.to(senderRoom).emit("message_status_update_bulk", statusPayload);
        io.to(senderRoom).emit("message_read", statusPayload);
        if (senderSocketId && senderSocketId !== senderRoom) {
          io.to(senderSocketId).emit("message_status_update", statusPayload);
          io.to(senderSocketId).emit(
            "message_status_update_bulk",
            statusPayload,
          );
          io.to(senderSocketId).emit("message_read", statusPayload);
        }
      }
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

export const sendMessage = async (req, res) => {
  try {
    let {
      senderId,
      receiverId,
      conversationId: incomingConvId,
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

    let conversation = null;
    let isGroup = false;

    let explicitIsGroup =
      req.body.isGroup === "true" || req.body.isGroup === true;

    if (incomingConvId && mongoose.Types.ObjectId.isValid(incomingConvId)) {
      const foundConv = await Conversation.findById(incomingConvId);
      if (foundConv) {
        conversation = foundConv;
        isGroup = Boolean(foundConv.isGroup);
      }
    }

    if (
      !conversation &&
      receiverId &&
      mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      const possibleConv = await Conversation.findById(receiverId);
      if (possibleConv?.isGroup) {
        conversation = possibleConv;
        isGroup = true;
      }
    }

    let effectiveReceiverId = null;

    if (isGroup) {
      const isMember = conversation.participants?.some(
        (p) => p.toString() === senderId.toString(),
      );
      if (!isMember) {
        return response(res, 403, "You are not a member of this group");
      }

      const isAdmin = conversation.groupAdmin?.some(
        (a) => a.toString() === senderId.toString(),
      );
      if (conversation.groupPermissions?.sendMessages === false && !isAdmin) {
        return response(
          res,
          403,
          "Only admins can send messages in this group",
        );
      }
    } else {
      effectiveReceiverId = receiverId ? receiverId.toString() : null;
      if (
        effectiveReceiverId &&
        mongoose.Types.ObjectId.isValid(effectiveReceiverId)
      ) {
        const possibleConv = await Conversation.findById(
          effectiveReceiverId,
        ).select("participants isGroup");
        if (
          possibleConv &&
          !possibleConv.isGroup &&
          Array.isArray(possibleConv.participants)
        ) {
          const other = possibleConv.participants.find(
            (p) => p.toString() !== senderId.toString(),
          );
          if (other) effectiveReceiverId = other.toString();
        }
      }

      const participants = [senderId, effectiveReceiverId].sort();
      if (!conversation) {
        conversation = await Conversation.findOne({
          participants: participants,
          isGroup: false,
        });
      }
      if (!conversation) {
        conversation = new Conversation({
          participants: participants,
          isGroup: false,
        });
        await conversation.save();
      }
    }

    const file = req.file;
    const timestamp = new Date();
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

    let isReceiverBlockedBySender = false;
    let isSenderBlockedByReceiver = false;
    let receiverRoom = null;
    let isReceiverOnline = false;

    if (!isGroup && effectiveReceiverId) {
      const senderUser = await User.findById(senderId).select("blockedUsers");
      isReceiverBlockedBySender = Boolean(
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
      isSenderBlockedByReceiver = Boolean(
        receiverUser?.blockedUsers?.some((bId) => {
          const str = bId.toString();
          return (
            str === senderId.toString() ||
            (conversation && str === conversation._id.toString())
          );
        }),
      );

      receiverRoom = effectiveReceiverId?.toString();
      isReceiverOnline =
        !isSenderBlockedByReceiver &&
        Boolean(
          (req.socketUserMap &&
            typeof req.socketUserMap.get === "function" &&
            req.socketUserMap.get(receiverRoom)) ||
          (req.io &&
            req.io.sockets?.adapter?.rooms?.get(receiverRoom)?.size > 0),
        );
    }

    const now = new Date();
    const finalStatus = isGroup
      ? "send"
      : isSenderBlockedByReceiver
        ? "send"
        : isReceiverOnline
          ? "delivered"
          : "send";
    const initialDeliveredAt =
      !isGroup && isReceiverOnline && !isSenderBlockedByReceiver ? now : null;
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
      receiver: isGroup ? null : effectiveReceiverId,
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
      deletedFor:
        isSenderBlockedByReceiver && effectiveReceiverId
          ? [effectiveReceiverId]
          : [],
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
        (!isGroup && effectiveReceiverId && !isSenderBlockedByReceiver
          ? dId.toString() !== effectiveReceiverId.toString()
          : true),
    );
    if (isGroup || !isSenderBlockedByReceiver) {
      conversation.lastMessage = message._id;
    }
    await conversation.save();

    let populatedMessage = await Message.findById(message._id)
      .populate("sender", "username profilePicture publicKey")
      .populate("receiver", "username profilePicture publicKey")
      .populate("replyTo")
      .populate("deliveredTo.user", "username profilePicture phoneNumber about")
      .populate("readBy.user", "username profilePicture phoneNumber about")
      .populate({
        path: "statusId",
        populate: {
          path: "user",
          select: "username profilePicture",
        },
      });

    if (isGroup) {
      if (req.io) {
        await onGroupMessageCreated(
          message,
          conversation,
          senderId,
          req.io,
          req.socketUserMap,
        );
      }
      const updatedPopulatedMessage = await Message.findById(message._id)
        .populate("sender", "username profilePicture publicKey")
        .populate("receiver", "username profilePicture publicKey")
        .populate("replyTo")
        .populate(
          "deliveredTo.user",
          "username profilePicture phoneNumber about",
        )
        .populate("readBy.user", "username profilePicture phoneNumber about")
        .populate({
          path: "statusId",
          populate: {
            path: "user",
            select: "username profilePicture",
          },
        });

      if (updatedPopulatedMessage) {
        populatedMessage = updatedPopulatedMessage;
      }

      if (req.io) {
        const basePayload = {
          ...populatedMessage.toObject(),
          conversationId: conversation._id.toString(),
        };

        await Promise.all(
          conversation.participants.map(async (p) => {
            const pIdStr = (p._id || p).toString();
            if (pIdStr !== senderId.toString()) {
              let pUnreadCount = 1;
              try {
                pUnreadCount = await Message.countDocuments({
                  conversation: conversation._id,
                  sender: { $ne: new mongoose.Types.ObjectId(pIdStr) },
                  "readBy.user": { $ne: new mongoose.Types.ObjectId(pIdStr) },
                  isSystemMessage: { $ne: true },
                  contentType: { $ne: "system" },
                  deletedFor: { $ne: new mongoose.Types.ObjectId(pIdStr) },
                });
              } catch (e) {
                console.error(
                  "Error computing group participant unread count:",
                  e,
                );
              }
              req.io.to(pIdStr).emit("receive_message", {
                ...basePayload,
                unreadCount: pUnreadCount,
              });
            }
          }),
        );
      }
    } else if (req.io && !isSenderBlockedByReceiver && receiverRoom) {
      const targetReceiverId =
        effectiveReceiverId || (receiverId ? receiverId.toString() : null);
      let receiverUnreadCount = 1;
      if (
        targetReceiverId &&
        mongoose.Types.ObjectId.isValid(targetReceiverId)
      ) {
        receiverUnreadCount = await Message.countDocuments({
          conversation: conversation._id,
          receiver: new mongoose.Types.ObjectId(targetReceiverId),
          messageStatus: { $in: ["send", "delivered"] },
          deletedFor: { $ne: new mongoose.Types.ObjectId(targetReceiverId) },
        });
      }

      const messagePayload = {
        ...populatedMessage.toObject(),
        conversationId: conversation._id.toString(),
        unreadCount: receiverUnreadCount,
      };

      req.io.to(receiverRoom).emit("receive_message", messagePayload);

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
      !isGroup &&
      (effectiveReceiverId?.toString() === META_AI_USER_ID ||
        conversation?.participants?.some(
          (p) => p?.toString() === META_AI_USER_ID,
        ));
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
        metaAiPersona: req.body?.metaAiPersona || "default",
      }).catch((err) =>
        console.error("Error triggering Meta AI response:", err),
      );
    }

    const returnData = {
      ...(populatedMessage && typeof populatedMessage.toObject === "function"
        ? populatedMessage.toObject()
        : populatedMessage),
      conversationId:
        conversation?._id?.toString() || message?.conversation?.toString(),
      isGroup: Boolean(isGroup),
    };

    return response(res, 201, "Message sent successfully", returnData);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

export const getConversation = async (req, res) => {
  const userId = req.user.userId;
  try {
    let conversation = await Conversation.find({
      participants: userId,
      deletedFor: { $ne: userId },
    })
      .populate(
        "participants",
        "username profilePicture isOnline lastSeen email phoneNumber publicKey about",
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
      .populate("groupAdmin", "username profilePicture")
      .populate("memberTags.user", "username profilePicture")
      .sort({ updatedAt: -1 })
      .lean();

    if (conversation && conversation.length > 0) {
      const directConvIds = conversation
        .filter((c) => !c.isGroup)
        .map((c) => c._id);
      const groupConvIds = conversation
        .filter((c) => c.isGroup)
        .map((c) => c._id);

      const matchConditions = [];
      if (directConvIds.length > 0) {
        matchConditions.push({
          conversation: { $in: directConvIds },
          receiver: new mongoose.Types.ObjectId(userId),
          messageStatus: { $in: ["send", "delivered"] },
        });
      }
      if (groupConvIds.length > 0) {
        matchConditions.push({
          conversation: { $in: groupConvIds },
          sender: { $ne: new mongoose.Types.ObjectId(userId) },
          "readBy.user": { $ne: new mongoose.Types.ObjectId(userId) },
          isSystemMessage: { $ne: true },
          contentType: { $ne: "system" },
          systemAction: null,
          content: {
            $not: /^(Group ".*" created|.+ added .+|.+ removed .+|.+ changed .+|.+ deleted .+|.+ left the group)$/i,
          },
        });
      }

      let unreadAgg = [];
      if (matchConditions.length > 0) {
        unreadAgg = await Message.aggregate([
          {
            $match: {
              deletedFor: { $ne: new mongoose.Types.ObjectId(userId) },
              $or: matchConditions,
            },
          },
          {
            $group: {
              _id: "$conversation",
              count: { $sum: 1 },
            },
          },
        ]);
      }

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

export const getMessages = async (req, res) => {
  const userId = req.user.userId;
  const { conversationId } = req.params;
  try {
    const conversation = await Conversation.findById(conversationId)
      .select(
        "participants disappearingDuration disappearingUpdatedAt lastMessage isGroup",
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
    const isDirectToMetaAi = conversation.participants.some(
      (p) => p.toString() === META_AI_USER_ID,
    );
    if (isDirectToMetaAi) {
      const latestAiMsg = await Message.findOne({
        conversation: conversationId,
        sender: META_AI_USER_ID,
      }).sort({ createdAt: -1 });

      if (latestAiMsg) {
        await Message.updateMany(
          {
            conversation: conversationId,
            sender: userId,
            createdAt: { $lte: latestAiMsg.createdAt },
            messageStatus: { $in: ["send", "delivered", "pending"] },
          },
          {
            $set: {
              messageStatus: "read",
              readAt: latestAiMsg.createdAt || now,
              deliveredAt: latestAiMsg.createdAt || now,
            },
          },
        );
      }
    }

    if (conversation.isGroup) {
      const unreadGroupMessages = await Message.find({
        conversation: conversationId,
        sender: { $ne: userId },
        "readBy.user": { $ne: userId },
        deletedFor: { $ne: userId },
      }).select("_id");

      if (unreadGroupMessages.length > 0) {
        const unreadGroupIds = unreadGroupMessages.map((m) => m._id);
        await processMultipleGroupReceipts(
          unreadGroupIds,
          userId,
          "read",
          req.io,
          req.socketUserMap,
        );
      }
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
      .populate("deliveredTo.user", "username profilePicture phoneNumber about")
      .populate("readBy.user", "username profilePicture phoneNumber about")
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

export const markAsRead = async (req, res) => {
  const userId = req.user.userId;
  const { messageIds } = req.body;

  try {
    if (!messageIds || !messageIds.length) {
      return response(res, 200, "No message IDs provided", []);
    }

    const allMessages = await Message.find({
      _id: { $in: messageIds },
      sender: { $ne: userId },
    });

    if (!allMessages.length) {
      return response(
        res,
        200,
        "Messages already marked as read or not found",
        [],
      );
    }

    const groupMessages = allMessages.filter((m) => !m.receiver);
    let directMessages = allMessages.filter(
      (m) => m.receiver && m.receiver.toString() === userId.toString(),
    );

    if (groupMessages.length > 0) {
      const groupMsgIds = groupMessages.map((m) => m._id.toString());
      await processMultipleGroupReceipts(
        groupMsgIds,
        userId,
        "read",
        req.io,
        req.socketUserMap,
      );
    }

    const now = new Date();
    if (directMessages.length > 0) {
      const directIds = directMessages.map((m) => m._id);
      await Message.updateMany(
        { _id: { $in: directIds } },
        { $set: { messageStatus: "read", readAt: now } },
      );
      await Message.updateMany(
        { _id: { $in: directIds }, deliveredAt: null },
        { $set: { deliveredAt: now } },
      );

      const convIds = [
        ...new Set(
          directMessages.map((m) => m.conversation?.toString()).filter(Boolean),
        ),
      ];
      if (convIds.length > 0) {
        await Conversation.updateMany(
          { _id: { $in: convIds } },
          { $set: { unreadCount: 0 } },
        );
      }

      directMessages = directMessages.map((msg) => ({
        ...msg._doc,
        messageStatus: "read",
        readAt: now,
        deliveredAt: msg.deliveredAt || now,
      }));

      if (req.io) {
        const readMessageIds = directIds.map(String);
        const senderIds = [
          ...new Set(
            directMessages.map((m) => m.sender?.toString()).filter(Boolean),
          ),
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

          if (
            req.socketUserMap &&
            typeof req.socketUserMap.get === "function"
          ) {
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
    }

    return response(res, 200, "Messages marked as read", allMessages);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

export const deleteMessage = async (req, res) => {
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

        const isSelfChat = Boolean(
          message.receiver &&
          message.sender.toString() === message.receiver.toString(),
        );
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
            receiverId: message.receiver ? message.receiver.toString() : null,
            unpinnedBy: userId,
          };
          req.io
            .to(message.conversation.toString())
            .emit("message_unpinned", unpinPayload);

          if (conv?.isGroup) {
            conv.participants?.forEach((p) => {
              req.io
                .to((p._id || p).toString())
                .emit("message_unpinned", unpinPayload);
            });
          } else {
            if (message.receiver) {
              req.io
                .to(message.receiver.toString())
                .emit("message_unpinned", unpinPayload);
            }
            req.io.to(userId.toString()).emit("message_unpinned", unpinPayload);
          }
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

        if (conv?.isGroup) {
          conv.participants?.forEach((p) => {
            req.io.to((p._id || p).toString()).emit("message_deleted", payload);
          });
        } else {
          if (message.receiver) {
            req.io
              .to(message.receiver.toString())
              .emit("message_deleted", payload);
          }
          req.io.to(userId.toString()).emit("message_deleted", payload);
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

export const editMessage = async (req, res) => {
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

    if (req.io) {
      const payload = {
        message: updatedMessage,
        messageId: messageId,
        conversationId: message.conversation.toString(),
      };

      const conv = await Conversation.findById(message.conversation).select(
        "isGroup participants",
      );
      if (conv?.isGroup) {
        conv.participants?.forEach((p) => {
          req.io.to((p._id || p).toString()).emit("message_edited", payload);
        });
      } else {
        if (message.receiver) {
          req.io
            .to(message.receiver.toString())
            .emit("message_edited", payload);
        }
        req.io.to(userId.toString()).emit("message_edited", payload);
      }
    }

    return response(res, 200, "Message edited successfully", updatedMessage);
  } catch (error) {
    console.error("EDIT MESSAGE ERROR:", error);
    return response(res, 500, "Internal server error");
  }
};

export const votePoll = async (req, res) => {
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
      const conv = await Conversation.findById(message.conversation).select(
        "isGroup participants",
      );
      if (conv?.isGroup) {
        conv.participants?.forEach((p) => {
          req.io.to((p._id || p).toString()).emit("poll_update", payload);
        });
      } else {
        if (message.sender) {
          req.io.to(message.sender.toString()).emit("poll_update", payload);
        }
        if (message.receiver) {
          req.io.to(message.receiver.toString()).emit("poll_update", payload);
        }
      }

      if (isReceiverVoting) {
        const statusPayload = {
          messageId: message._id.toString(),
          messageStatus: "read",
          readAt: (message.readAt || new Date()).toISOString(),
          deliveredAt: (message.deliveredAt || new Date()).toISOString(),
        };
        if (message.sender) {
          req.io
            .to(message.sender.toString())
            .emit("message_status_update", statusPayload);
          req.io
            .to(message.sender.toString())
            .emit("message_read", statusPayload);
        }
      }
    }

    return response(res, 200, "Vote updated successfully", populated);
  } catch (error) {
    console.error("VOTE POLL CONTROLLER ERROR:", error);
    return response(res, 500, "Internal server error");
  }
};

export const blockUser = async (req, res) => {
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

export const unblockUser = async (req, res) => {
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

export const getBlockedUsers = async (req, res) => {
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

export const clearChat = async (req, res) => {
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

export const deleteChat = async (req, res) => {
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

export const getChatMedia = async (req, res) => {
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

export const setDisappearingDuration = async (req, res) => {
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

export const askMetaAi = async (req, res) => {
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

export const summarizeConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) {
      return response(res, 400, "Conversation ID is required");
    }

    const messages = await Message.find({
      conversation: conversationId,
      deletedForEveryone: false,
      contentType: "text",
    })
      .sort({ createdAt: -1 })
      .limit(25)
      .populate("sender", "username")
      .lean();

    messages.reverse();

    if (messages.length === 0) {
      return response(res, 200, "Summary generated", {
        summary: "No text messages found to summarize in this conversation.",
        messageCount: 0,
      });
    }

    const transcript = messages
      .map((m) => `${m.sender?.username || "User"}: ${m.content}`)
      .join("\n");

    const summarizePrompt = `Please summarize the following WhatsApp chat conversation.
Format with:
📌 **Executive Summary** (1-2 sentences)
🎯 **Key Discussions & Decisions** (bullet points)
⏳ **Action Items / Next Steps** (if any)

Chat Transcript:
${transcript}`;

    const aiResult = await processMetaAiQuery(summarizePrompt, []);
    return response(res, 200, "Summary generated", {
      summary: aiResult.content,
      messageCount: messages.length,
    });
  } catch (error) {
    console.error("summarizeConversation error:", error);
    return response(res, 500, "Failed to summarize conversation");
  }
};

export const createGroup = async (req, res) => {
  const creatorId = req.user.userId;
  let {
    name,
    description,
    participants = [],
    groupProfileImage,
    disappearingDuration,
    groupPermissions,
  } = req.body;

  try {
    if (!name || !name.trim()) {
      return response(res, 400, "Group name is required");
    }

    let parsedParticipants = [];
    if (typeof participants === "string") {
      try {
        parsedParticipants = JSON.parse(participants);
      } catch (e) {
        parsedParticipants = participants
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    } else if (Array.isArray(participants)) {
      parsedParticipants = participants;
    }

    const participantSet = new Set(
      parsedParticipants
        .map((p) => (p._id || p.userId || p).toString())
        .filter(Boolean),
    );
    participantSet.add(creatorId.toString());

    let imageUrl = groupProfileImage || "";
    if (req.file) {
      try {
        const uploadRes = await uploadFileToCloudinary(req.file);
        imageUrl = uploadRes?.secure_url || uploadRes?.url || "";
      } catch (uploadErr) {
        console.warn("Group avatar upload failed:", uploadErr);
      }
    }

    let parsedPermissions = undefined;
    if (groupPermissions) {
      try {
        parsedPermissions =
          typeof groupPermissions === "string"
            ? JSON.parse(groupPermissions)
            : groupPermissions;
      } catch (e) {}
    }

    const conversation = new Conversation({
      isGroup: true,
      groupName: name.trim(),
      groupDescription: description ? description.trim() : "",
      groupProfileImage: imageUrl,
      groupAdmin: [creatorId],
      participants: Array.from(participantSet),
      disappearingDuration: disappearingDuration || "Off",
      ...(parsedPermissions ? { groupPermissions: parsedPermissions } : {}),
    });

    await conversation.save();

    const initialMessage = new Message({
      conversation: conversation._id,
      sender: creatorId,
      content: `Group "${name.trim()}" created`,
      contentType: "system",
      isSystemMessage: true,
      systemAction: "created",
      messageStatus: "read",
      readAt: new Date(),
    });
    await initialMessage.save();

    conversation.lastMessage = initialMessage._id;
    await conversation.save();

    const populatedConv = await Conversation.findById(conversation._id)
      .populate(
        "participants",
        "username profilePicture isOnline lastSeen email phoneNumber publicKey about",
      )
      .populate("groupAdmin", "username profilePicture")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture email phoneNumber publicKey",
        },
      })
      .lean();

    if (req.io) {
      Array.from(participantSet).forEach((pId) => {
        req.io.to(pId).emit("new_group_created", populatedConv);
        if (req.socketUserMap && typeof req.socketUserMap.get === "function") {
          const sId = req.socketUserMap.get(pId);
          if (sId && sId !== pId) {
            req.io.to(sId).emit("new_group_created", populatedConv);
          }
        }
      });
    }

    return response(res, 201, "Group created successfully", populatedConv);
  } catch (error) {
    console.error("Error creating group:", error);
    return response(res, 500, "Internal server error");
  }
};

export const updateGroup = async (req, res) => {
  const userId = req.user.userId;
  const { conversationId } = req.params;
  let {
    groupName,
    groupDescription,
    groupProfileImage,
    groupPermissions,
    groupAdmin,
    addParticipants,
    removeParticipant,
    memberTag,
  } = req.body || {};

  try {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      isGroup: true,
      participants: userId,
    });

    if (!conversation) {
      return response(res, 404, "Group conversation not found");
    }

    const isAdmin =
      Array.isArray(conversation.groupAdmin) &&
      conversation.groupAdmin.some(
        (a) => (a?._id || a)?.toString() === userId.toString(),
      );

    let systemMessageContent = null;
    const actorUser = await User.findById(userId);
    const actorName = actorUser?.username || "Admin";

    let newGroupProfileImage = groupProfileImage;
    if (req.file) {
      try {
        const uploadRes = await uploadFileToCloudinary(req.file);
        newGroupProfileImage = uploadRes?.secure_url || uploadRes?.url || "";
      } catch (uploadErr) {
        console.warn("Group avatar upload failed:", uploadErr);
      }
    }

    if (
      groupName !== undefined ||
      groupDescription !== undefined ||
      newGroupProfileImage !== undefined
    ) {
      if (
        !isAdmin &&
        conversation.groupPermissions?.editGroupSettings === false
      ) {
        return response(res, 403, "Only admins can edit group settings");
      }
      if (groupName !== undefined && typeof groupName === "string") {
        conversation.groupName = groupName.trim();
      }
      if (
        groupDescription !== undefined &&
        typeof groupDescription === "string"
      ) {
        conversation.groupDescription = groupDescription.trim();
      }
      if (
        newGroupProfileImage !== undefined &&
        typeof newGroupProfileImage === "string"
      ) {
        conversation.groupProfileImage = newGroupProfileImage;
        if (!systemMessageContent) {
          if (newGroupProfileImage === "") {
            systemMessageContent = `${actorName} deleted this group's icon`;
          } else {
            systemMessageContent = `${actorName} changed this group's icon`;
          }
        }
      }
    }

    if (typeof groupPermissions === "string") {
      try {
        groupPermissions = JSON.parse(groupPermissions);
      } catch (e) {}
    }

    if (groupPermissions && typeof groupPermissions === "object") {
      if (!isAdmin) {
        return response(res, 403, "Only admins can edit group permissions");
      }
      let currentPerms = {};
      if (conversation.groupPermissions) {
        if (typeof conversation.groupPermissions.toObject === "function") {
          currentPerms = conversation.groupPermissions.toObject();
        } else if (typeof conversation.groupPermissions === "object") {
          currentPerms = { ...conversation.groupPermissions };
        }
      }
      conversation.groupPermissions = {
        editGroupSettings:
          groupPermissions.editGroupSettings !== undefined
            ? Boolean(groupPermissions.editGroupSettings)
            : (currentPerms.editGroupSettings ?? true),
        sendMessages:
          groupPermissions.sendMessages !== undefined
            ? Boolean(groupPermissions.sendMessages)
            : (currentPerms.sendMessages ?? true),
        addMembers:
          groupPermissions.addMembers !== undefined
            ? Boolean(groupPermissions.addMembers)
            : (currentPerms.addMembers ?? true),
        inviteViaLink:
          groupPermissions.inviteViaLink !== undefined
            ? Boolean(groupPermissions.inviteViaLink)
            : (currentPerms.inviteViaLink ?? true),
        sendMessageHistory:
          groupPermissions.sendMessageHistory !== undefined
            ? Boolean(groupPermissions.sendMessageHistory)
            : (currentPerms.sendMessageHistory ?? true),
        approveNewMembers:
          groupPermissions.approveNewMembers !== undefined
            ? Boolean(groupPermissions.approveNewMembers)
            : (currentPerms.approveNewMembers ?? false),
      };
      if (typeof conversation.markModified === "function") {
        conversation.markModified("groupPermissions");
      }
    }

    if (groupAdmin && Array.isArray(groupAdmin)) {
      if (!isAdmin) {
        return response(res, 403, "Only admins can edit group admins");
      }
      const participantIds = new Set(
        conversation.participants.map((p) => (p._id || p).toString()),
      );
      const validAdminIds = groupAdmin
        .map((a) => (a?._id || a)?.toString())
        .filter((id) => id && participantIds.has(id));

      if (validAdminIds.length > 0) {
        conversation.groupAdmin = validAdminIds.map(
          (id) => new mongoose.Types.ObjectId(id),
        );
      }
    }

    let newlyAddedIds = [];
    if (addParticipants) {
      if (!isAdmin && conversation.groupPermissions?.addMembers === false) {
        return response(res, 403, "Only admins can add members to this group");
      }
      const candidates = (
        Array.isArray(addParticipants) ? addParticipants : [addParticipants]
      )
        .map((c) => (c?._id || c)?.toString())
        .filter(Boolean);

      const existingSet = new Set(
        conversation.participants.map((p) => (p._id || p).toString()),
      );
      newlyAddedIds = candidates.filter((id) => !existingSet.has(id));

      if (newlyAddedIds.length > 0) {
        newlyAddedIds.forEach((id) => {
          conversation.participants.push(new mongoose.Types.ObjectId(id));
        });

        const addedUsers = await User.find({ _id: { $in: newlyAddedIds } });
        const addedNames = addedUsers
          .map((u) => u.phoneNumber || u.username || "Member")
          .join(", ");
        systemMessageContent = `${actorName} added ${addedNames}`;

        if (!Array.isArray(conversation.memberChanges)) {
          conversation.memberChanges = [];
        }
        addedUsers.forEach((u) => {
          const uName = u.phoneNumber || u.username || "Member";
          conversation.memberChanges.push({
            user: u._id,
            action: "added",
            actor: userId,
            text: `${actorName} added ${uName}`,
            timestamp: new Date(),
          });
        });
      }
    }

    let removedUserId = null;
    let isSelf = false;
    if (removeParticipant) {
      const targetId = (
        removeParticipant?._id || removeParticipant
      )?.toString();
      isSelf = targetId === userId.toString();
      if (!isSelf && !isAdmin) {
        return response(res, 403, "Only admins can remove participants");
      }

      removedUserId = targetId;
      conversation.participants = conversation.participants.filter(
        (p) => (p._id || p).toString() !== targetId,
      );
      conversation.groupAdmin = conversation.groupAdmin.filter(
        (a) => (a._id || a).toString() !== targetId,
      );

      if (
        conversation.groupAdmin.length === 0 &&
        conversation.participants.length > 0
      ) {
        conversation.groupAdmin.push(conversation.participants[0]);
      }

      const targetUser = await User.findById(targetId);
      const targetPhoneOrName =
        targetUser?.phoneNumber || targetUser?.username || "Member";
      if (!Array.isArray(conversation.memberChanges)) {
        conversation.memberChanges = [];
      }

      if (isSelf) {
        systemMessageContent = `${targetPhoneOrName} left the group`;
        conversation.memberChanges.push({
          user: targetId,
          action: "left",
          actor: userId,
          text: `${targetPhoneOrName} left the group`,
          timestamp: new Date(),
        });
      } else {
        systemMessageContent = `${actorName} removed ${targetPhoneOrName}`;
        conversation.memberChanges.push({
          user: targetId,
          action: "removed",
          actor: userId,
          text: `${actorName} removed ${targetPhoneOrName}`,
          timestamp: new Date(),
        });
      }

      if (Array.isArray(conversation.memberTags)) {
        conversation.memberTags = conversation.memberTags.filter(
          (mt) => (mt.user?._id || mt.user)?.toString() !== targetId,
        );
      }
    }

    if (memberTag !== undefined) {
      if (!Array.isArray(conversation.memberTags)) {
        conversation.memberTags = [];
      }
      let targetUserId = userId;
      let newTag = "";

      if (typeof memberTag === "string") {
        newTag = memberTag.trim();
      } else if (typeof memberTag === "object" && memberTag !== null) {
        if (memberTag.user) {
          targetUserId = (memberTag.user._id || memberTag.user).toString();
        }
        newTag = typeof memberTag.tag === "string" ? memberTag.tag.trim() : "";
      }

      const isTargetSelf = targetUserId.toString() === userId.toString();
      if (!isTargetSelf && !isAdmin) {
        return response(res, 403, "Only admins can change other members' tags");
      }

      const existingIdx = conversation.memberTags.findIndex(
        (mt) =>
          (mt.user?._id || mt.user)?.toString() === targetUserId.toString(),
      );

      if (newTag === "") {
        if (existingIdx !== -1) {
          conversation.memberTags.splice(existingIdx, 1);
        }
      } else {
        if (existingIdx !== -1) {
          conversation.memberTags[existingIdx].tag = newTag.slice(0, 30);
        } else {
          conversation.memberTags.push({
            user: new mongoose.Types.ObjectId(targetUserId),
            tag: newTag.slice(0, 30),
          });
        }
      }

      if (typeof conversation.markModified === "function") {
        conversation.markModified("memberTags");
      }
    }

    let createdSysMsg = null;
    if (systemMessageContent) {
      createdSysMsg = new Message({
        conversation: conversation._id,
        sender: userId,
        content: systemMessageContent,
        contentType: "system",
        isSystemMessage: true,
        systemAction: removeParticipant
          ? isSelf
            ? "left"
            : "removed"
          : addParticipants
            ? "added"
            : newGroupProfileImage !== undefined
              ? "icon"
              : "settings",
        messageStatus: "read",
        readAt: new Date(),
      });
      await createdSysMsg.save();
      conversation.lastMessage = createdSysMsg._id;
    }

    await conversation.save();

    const populatedConv = await Conversation.findById(conversation._id)
      .populate(
        "participants",
        "username profilePicture isOnline lastSeen email phoneNumber publicKey about",
      )
      .populate("groupAdmin", "username profilePicture")
      .populate("memberTags.user", "username profilePicture")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture email phoneNumber publicKey",
        },
      })
      .lean();

    if (req.io) {
      conversation.participants.forEach((p) => {
        const pIdStr = (p._id || p).toString();
        req.io.to(pIdStr).emit("group_updated", populatedConv);
        if (req.socketUserMap && typeof req.socketUserMap.get === "function") {
          const sId = req.socketUserMap.get(pIdStr);
          if (sId && sId !== pIdStr) {
            req.io.to(sId).emit("group_updated", populatedConv);
          }
        }
      });

      newlyAddedIds.forEach((pIdStr) => {
        req.io.to(pIdStr).emit("new_group_created", populatedConv);
        if (req.socketUserMap && typeof req.socketUserMap.get === "function") {
          const sId = req.socketUserMap.get(pIdStr);
          if (sId && sId !== pIdStr) {
            req.io.to(sId).emit("new_group_created", populatedConv);
          }
        }
      });

      if (removedUserId) {
        req.io.to(removedUserId).emit("group_updated", {
          ...populatedConv,
          removedParticipantId: removedUserId,
        });
        if (req.socketUserMap && typeof req.socketUserMap.get === "function") {
          const sId = req.socketUserMap.get(removedUserId);
          if (sId && sId !== removedUserId) {
            req.io.to(sId).emit("group_updated", {
              ...populatedConv,
              removedParticipantId: removedUserId,
            });
          }
        }
      }

      if (createdSysMsg) {
        const populatedMsg = await Message.findById(createdSysMsg._id)
          .populate("sender", "username profilePicture")
          .lean();
        conversation.participants.forEach((p) => {
          const pIdStr = (p._id || p).toString();
          req.io.to(pIdStr).emit("receive_message", populatedMsg);
          if (
            req.socketUserMap &&
            typeof req.socketUserMap.get === "function"
          ) {
            const sId = req.socketUserMap.get(pIdStr);
            if (sId && sId !== pIdStr) {
              req.io.to(sId).emit("receive_message", populatedMsg);
            }
          }
        });
        if (removedUserId) {
          req.io.to(removedUserId).emit("receive_message", populatedMsg);
          if (
            req.socketUserMap &&
            typeof req.socketUserMap.get === "function"
          ) {
            const sId = req.socketUserMap.get(removedUserId);
            if (sId && sId !== removedUserId) {
              req.io.to(sId).emit("receive_message", populatedMsg);
            }
          }
        }
      }
    }

    return response(res, 200, "Group updated successfully", populatedConv);
  } catch (error) {
    console.error("Error updating group:", error);
    return response(res, 500, "Internal server error");
  }
};

export const getMemberChanges = async (req, res) => {
  const userId = req.user.userId;
  const { conversationId } = req.params;

  try {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      isGroup: true,
      participants: userId,
    })
      .populate("memberChanges.user", "username phoneNumber profilePicture")
      .populate("memberChanges.actor", "username phoneNumber profilePicture")
      .lean();

    if (!conversation) {
      return response(res, 404, "Group conversation not found");
    }

    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const changes = (conversation.memberChanges || [])
      .filter((mc) => !mc.timestamp || new Date(mc.timestamp) >= sixtyDaysAgo)
      .map((mc) => ({
        _id: mc._id,
        text: mc.text,
        action: mc.action || "left",
        timestamp: mc.timestamp || new Date(),
        user: mc.user,
        actor: mc.actor,
      }));

    const systemMsgs = await Message.find({
      conversation: conversationId,
      createdAt: { $gte: sixtyDaysAgo },
      content: { $regex: /(left|removed|added)/i },
    })
      .populate("sender", "username phoneNumber profilePicture")
      .lean();

    const seenTexts = new Set(
      changes.map((c) => (c.text || "") + new Date(c.timestamp).toDateString()),
    );

    systemMsgs.forEach((sm) => {
      let text = sm.content;
      if (text.includes("left") && !text.includes("left the group")) {
        text = text
          .replace(/left$/i, "left the group")
          .replace(/left\s+/i, "left the group ");
      }
      const key = text + new Date(sm.createdAt).toDateString();
      if (!seenTexts.has(key)) {
        seenTexts.add(key);
        changes.push({
          _id: sm._id,
          text: text,
          action: text.includes("removed")
            ? "removed"
            : text.includes("added")
              ? "added"
              : "left",
          timestamp: sm.createdAt,
          user: sm.sender,
          actor: sm.sender,
        });
      }
    });

    changes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return response(res, 200, "Member changes fetched successfully", changes);
  } catch (error) {
    console.error("Error fetching member changes:", error);
    return response(res, 500, "Internal server error");
  }
};

export const translateText = async (req, res) => {
  try {
    const { text, targetLang = "English" } = req.body;
    if (!text || !text.trim()) {
      return response(res, 400, "Text is required for translation");
    }

    const systemPrompt = `You are an expert multilingual translator for WhatsApp. Translate the user's text into ${targetLang}. Return ONLY the translation, with no explanation, greetings, quotation marks, or meta commentary. Preserve emojis, line breaks, and punctuation.`;
    const prompt = `Translate this text into ${targetLang}:\n\n${text}`;

    let translated = await callFastLlm(prompt, systemPrompt);
    if (!translated) {
      const dualRes = await callDualLlm({
        systemPrompt,
        prompt,
      });
      translated = dualRes.text;
    }

    translated = (translated || text).trim();
    if (translated.startsWith('"') && translated.endsWith('"') && translated.length > 2) {
      translated = translated.slice(1, -1);
    }

    return response(res, 200, "Translation successful", {
      original: text,
      translation: translated,
      targetLang,
    });
  } catch (error) {
    console.error("translateText error:", error);
    return response(res, 500, "Failed to translate text");
  }
};

export const getSmartReplies = async (req, res) => {
  try {
    const { messageText } = req.body;
    if (!messageText || !messageText.trim()) {
      return response(res, 200, "Smart replies", { replies: [] });
    }

    const systemPrompt = `You are an AI assistant generating short, natural WhatsApp quick-reply chips for a received message. Generate exactly 3 short responses (under 6 words each), separated by pipes (|). Example: Sounds great! 👍 | I'll check and let you know | Can you send the details? Return ONLY the replies separated by |.`;
    const prompt = `Generate 3 WhatsApp quick replies to this message:\n"${messageText}"`;

    let replyText = await callFastLlm(prompt, systemPrompt);
    let replies = [];
    if (replyText) {
      replies = replyText
        .split("|")
        .map((r) => r.trim().replace(/^["'`\d.-]+/, "").replace(/["'`]+$/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
    }

    if (replies.length === 0) {
      const lower = messageText.toLowerCase();
      if (lower.includes("how are you") || lower.includes("how r u")) {
        replies = ["I'm doing well, thanks! 😊", "All good here! How about you?", "Great! What's up?"];
      } else if (lower.includes("where") || lower.includes("location")) {
        replies = ["On my way! 🚗", "I'll be there in 15 mins", "Sharing my location now"];
      } else if (lower.includes("thanks") || lower.includes("thank you")) {
        replies = ["You're welcome! 😊", "Anytime!", "No problem at all! 👍"];
      } else if (lower.includes("?")) {
        replies = ["Yes, absolutely! 👍", "I'll check on that", "Not sure, let me verify"];
      } else {
        replies = ["Sounds good! 👍", "Got it, thanks!", "Let's catch up later"];
      }
    }

    return response(res, 200, "Smart replies generated", { replies });
  } catch (error) {
    console.error("getSmartReplies error:", error);
    return response(res, 200, "Fallback smart replies", {
      replies: ["Sounds good! 👍", "Got it, thanks!", "Let's connect soon"],
    });
  }
};

export default {
  sendMessage,
  getConversation,
  getMessages,
  markAsRead,
  deleteMessage,
  editMessage,
  votePoll,
  blockUser,
  unblockUser,
  getBlockedUsers,
  clearChat,
  deleteChat,
  getChatMedia,
  setDisappearingDuration,
  askMetaAi,
  summarizeConversation,
  translateText,
  getSmartReplies,
  createGroup,
  updateGroup,
  getMemberChanges,
};
