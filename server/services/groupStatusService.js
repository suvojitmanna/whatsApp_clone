const Message = require("../models/message");
const Conversation = require("../models/ConverSation");

async function processGroupMessageReceipt(
  messageId,
  userId,
  action = "read",
  io = null,
  onlineUsers = null,
  now = new Date(),
) {
  try {
    if (!messageId || !userId) return null;
    const msg = await Message.findById(messageId);
    if (!msg) return null;

    const conv = await Conversation.findById(msg.conversation).select(
      "isGroup participants",
    );
    if (!conv || !conv.isGroup) return null;

    const senderId = (msg.sender?._id || msg.sender)?.toString();
    const uId = userId.toString();

    if (uId === senderId) return null;

    const allRecipients = (conv.participants || [])
      .map((p) => (p._id || p).toString())
      .filter((id) => id !== senderId);

    const recipientCount = allRecipients.length;
    if (recipientCount === 0) return null;

    let updateFields = {};
    let pushDelivered = false;
    let pushRead = false;

    const existingDeliveredIds = new Set(
      (msg.deliveredTo || []).map((d) =>
        (d.user?._id || d.user || d)?.toString(),
      ),
    );
    if (!existingDeliveredIds.has(uId)) {
      pushDelivered = true;
      existingDeliveredIds.add(uId);
    }

    const existingReadIds = new Set(
      (msg.readBy || []).map((r) => (r.user?._id || r.user || r)?.toString()),
    );
    if (action === "read" && !existingReadIds.has(uId)) {
      pushRead = true;
      existingReadIds.add(uId);
    }

    const allRead = allRecipients.every((rId) => existingReadIds.has(rId));
    const allDelivered = allRecipients.every(
      (rId) => existingDeliveredIds.has(rId) || existingReadIds.has(rId),
    );

    let newStatus = msg.messageStatus || "send";
    if (allRead) {
      newStatus = "read";
      updateFields.messageStatus = "read";
      updateFields.readAt = msg.readAt || now;
      updateFields.deliveredAt = msg.deliveredAt || now;
    } else if (allDelivered && newStatus !== "read") {
      newStatus = "delivered";
      updateFields.messageStatus = "delivered";
      updateFields.deliveredAt = msg.deliveredAt || now;
    }

    let mongoUpdate = {};
    if (Object.keys(updateFields).length > 0) {
      mongoUpdate.$set = updateFields;
    }
    let pushes = {};
    if (pushDelivered) {
      pushes.deliveredTo = { user: uId, deliveredAt: now };
    }
    if (pushRead) {
      pushes.readBy = { user: uId, readAt: now };
    }
    if (Object.keys(pushes).length > 0) {
      mongoUpdate.$push = pushes;
    }

    if (Object.keys(mongoUpdate).length > 0) {
      await Message.findByIdAndUpdate(messageId, mongoUpdate);
    }

    if (io) {
      const receiptPayload = {
        messageId: msg._id.toString(),
        conversationId: conv._id.toString(),
        userId: uId,
        action,
        timestamp: now.toISOString(),
        newStatus,
        allRead,
        allDelivered,
      };

      io.to(conv._id.toString()).emit(
        "group_message_receipt_update",
        receiptPayload,
      );
      if (newStatus !== msg.messageStatus) {
        const statusPayload = {
          messageId: msg._id.toString(),
          messageIds: [msg._id.toString()],
          conversationId: conv._id.toString(),
          messageStatus: newStatus,
          readAt: (updateFields.readAt || now).toISOString(),
          deliveredAt: (updateFields.deliveredAt || now).toISOString(),
        };

        io.to(senderId).emit("message_status_update", statusPayload);
        io.to(senderId).emit("message_status_update_bulk", statusPayload);
        if (newStatus === "read") {
          io.to(senderId).emit("message_read", statusPayload);
        }

        if (onlineUsers && typeof onlineUsers.get === "function") {
          const sSocket = onlineUsers.get(senderId);
          if (sSocket && sSocket !== senderId) {
            io.to(sSocket).emit("message_status_update", statusPayload);
            io.to(sSocket).emit("message_status_update_bulk", statusPayload);
            if (newStatus === "read") {
              io.to(sSocket).emit("message_read", statusPayload);
            }
          }
        }
      }
    }

    return {
      messageId: msg._id.toString(),
      newStatus,
      allRead,
      allDelivered,
    };
  } catch (err) {
    console.error("Error in processGroupMessageReceipt:", err);
    return null;
  }
}

async function processMultipleGroupReceipts(
  messageIds,
  userId,
  action = "read",
  io = null,
  onlineUsers = null,
) {
  if (!Array.isArray(messageIds) || messageIds.length === 0) return;
  const now = new Date();
  for (const mId of messageIds) {
    await processGroupMessageReceipt(mId, userId, action, io, onlineUsers, now);
  }
}

async function onGroupMessageCreated(
  message,
  conversation,
  senderId,
  io,
  onlineUsers,
) {
  const otherParticipants = (conversation.participants || []).filter(
    (p) => (p._id || p).toString() !== senderId.toString(),
  );
  if (otherParticipants.length === 0) return;

  const now = new Date();
  const deliveredList = [];

  otherParticipants.forEach((p) => {
    const pIdStr = (p._id || p).toString();
    const isOnline = Boolean(
      (onlineUsers &&
        typeof onlineUsers.get === "function" &&
        onlineUsers.get(pIdStr)) ||
      (io && io.sockets?.adapter?.rooms?.get(pIdStr)?.size > 0),
    );
    if (isOnline) {
      deliveredList.push({ user: pIdStr, deliveredAt: now });
    }
  });

  const allDelivered = deliveredList.length >= otherParticipants.length;
  if (allDelivered) {
    await Message.findByIdAndUpdate(message._id, {
      $set: {
        messageStatus: "delivered",
        deliveredAt: now,
        deliveredTo: deliveredList,
      },
    });
    message.messageStatus = "delivered";
    message.deliveredAt = now;
    message.deliveredTo = deliveredList;

    if (io) {
      const statusPayload = {
        messageId: message._id.toString(),
        messageStatus: "delivered",
        deliveredAt: now.toISOString(),
      };
      io.to(senderId.toString()).emit("message_status_update", statusPayload);
      if (onlineUsers && typeof onlineUsers.get === "function") {
        const sSocket = onlineUsers.get(senderId.toString());
        if (sSocket && sSocket !== senderId.toString()) {
          io.to(sSocket).emit("message_status_update", statusPayload);
        }
      }
    }
  } else if (deliveredList.length > 0) {
    await Message.findByIdAndUpdate(message._id, {
      $set: { deliveredTo: deliveredList },
    });
    message.deliveredTo = deliveredList;
  }
}

async function onUserConnectedGroupDelivery(userId, io, onlineUsers) {
  try {
    const uId = userId.toString();
    const groupConvs = await Conversation.find({
      isGroup: true,
      participants: uId,
    }).select("_id");

    if (!groupConvs.length) return;
    const convIds = groupConvs.map((c) => c._id);

    const pendingGroupMsgs = await Message.find({
      conversation: { $in: convIds },
      sender: { $ne: uId },
      "deliveredTo.user": { $ne: uId },
    }).select("_id");

    if (pendingGroupMsgs.length > 0) {
      for (const m of pendingGroupMsgs) {
        await processGroupMessageReceipt(
          m._id,
          uId,
          "delivered",
          io,
          onlineUsers,
        );
      }
    }
  } catch (err) {
    console.error("Error in onUserConnectedGroupDelivery:", err);
  }
}

module.exports = {
  processGroupMessageReceipt,
  processMultipleGroupReceipts,
  onGroupMessageCreated,
  onUserConnectedGroupDelivery,
};
