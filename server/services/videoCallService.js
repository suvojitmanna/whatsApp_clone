const activeGroupCalls = new Map();

const handleVideoCallEvent = (socket, io, onlineUsers) => {
  socket.on(
    "initiate_call",
    ({
      callerId,
      receiverId,
      receiverIds,
      isGroup,
      groupId,
      groupName,
      groupAvatar,
      callType,
      callerInfo,
    }) => {
      if (isGroup && Array.isArray(receiverIds) && receiverIds.length > 0) {
        const callId = `${callerId}-${groupId || "group"}-${Date.now()}`;
        const targetIds = new Set(
          receiverIds
            .map((id) => (id?._id || id)?.toString())
            .filter((id) => id && id !== callerId?.toString()),
        );

        let onlineCount = 0;
        targetIds.forEach((targetId) => {
          const receiverSocketId = onlineUsers.get(targetId);
          if (receiverSocketId) {
            onlineCount++;
            io.to(receiverSocketId).emit("incoming_call", {
              callerId,
              callerName: callerInfo?.username || "Someone",
              callerAvatar: callerInfo?.profilePicture || "",
              callId,
              callType,
              isGroup: true,
              groupId,
              groupName: groupName || "Group Call",
              groupAvatar: groupAvatar || "",
            });
          }
        });

        if (onlineCount === 0) {
          console.log(
            `server: No group participants online for group ${groupId}`,
          );
          socket.emit("call_failed", {
            reason: "All participants are offline",
          });
        } else {
          activeGroupCalls.set(callId, {
            callerId: callerId?.toString(),
            groupId,
            pendingReceivers: targetIds,
            answeredBy: null,
            callType,
          });
        }
        return;
      }

      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        const callId = `${callerId}-${receiverId}-${Date.now()}`;

        io.to(receiverSocketId).emit("incoming_call", {
          callerId,
          callerName: callerInfo?.username || "Someone",
          callerAvatar: callerInfo?.profilePicture || "",
          callId,
          callType,
        });
      } else {
        console.log(`server: Receiver ${receiverId} is offline`);
        socket.emit("call_failed", { reason: "user is offline" });
      }
    },
  );

  socket.on(
    "accept_call",
    ({ callerId, receiverInfo, callId, isGroup, groupId }) => {
      const callerSocketId = onlineUsers.get(callerId);

      const groupCall = activeGroupCalls.get(callId);
      if (groupCall) {
        const answeringUserId = socket.userId?.toString();
        groupCall.answeredBy = answeringUserId;

        groupCall.pendingReceivers.forEach((pId) => {
          if (pId !== answeringUserId) {
            const otherSocketId = onlineUsers.get(pId);
            if (otherSocketId) {
              io.to(otherSocketId).emit("call_ended", {
                callId,
                reason: "answered_elsewhere",
              });
            }
          }
        });
      }

      if (callerSocketId) {
        io.to(callerSocketId).emit("call_accepted", {
          callId,
          receiverId: socket.userId,
          receiverName: receiverInfo?.username,
          receiverAvatar: receiverInfo?.profilePicture,
          isGroup: Boolean(isGroup || groupCall),
          groupId: groupId || groupCall?.groupId,
        });
      } else {
        console.log(`server: Caller ${callerId} not found`);
        socket.emit("call_failed", { reason: "caller is offline" });
      }
    },
  );

  socket.on("reject_call", ({ callerId, callId }) => {
    const groupCall = activeGroupCalls.get(callId);
    if (groupCall) {
      const rejectingUserId = socket.userId?.toString();
      groupCall.pendingReceivers.delete(rejectingUserId);

      if (!groupCall.answeredBy && groupCall.pendingReceivers.size === 0) {
        activeGroupCalls.delete(callId);
        const callerSocketId = onlineUsers.get(callerId);
        if (callerSocketId) {
          io.to(callerSocketId).emit("call_rejected", {
            callId,
          });
        }
      }
      return;
    }

    const callerSocketId = onlineUsers.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call_rejected", {
        callId,
      });
    } else {
      console.log(`server: Caller ${callerId} not found`);
    }
  });

  socket.on("end_call", ({ participantId, callId }) => {
    const groupCall = activeGroupCalls.get(callId);
    if (groupCall) {
      activeGroupCalls.delete(callId);
      groupCall.pendingReceivers.forEach((pId) => {
        const pSocket = onlineUsers.get(pId);
        if (pSocket) {
          io.to(pSocket).emit("call_ended", { callId });
        }
      });
      if (groupCall.answeredBy) {
        const ansSocket = onlineUsers.get(groupCall.answeredBy);
        if (ansSocket && ansSocket !== socket.id) {
          io.to(ansSocket).emit("call_ended", { callId });
        }
      }
      const callerSocketId = onlineUsers.get(groupCall.callerId);
      if (callerSocketId && callerSocketId !== socket.id) {
        io.to(callerSocketId).emit("call_ended", { callId });
      }
      return;
    }

    const participantSocketId = onlineUsers.get(participantId);
    if (participantSocketId) {
      io.to(participantSocketId).emit("call_ended", {
        callId,
      });
    } else {
      console.log(`server: Participant ${participantId} not found`);
    }
  });

  socket.on("webrtc_offer", ({ offer, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_offer", {
        offer,
        senderId: socket.userId,
        callId,
      });
      console.log(`server offer forward to ${receiverId}`);
    } else {
      console.log(`server: Receiver ${receiverId} not found for offer`);
      socket.emit("call_failed", { reason: "receiver offline" });
    }
  });

  socket.on("webrtc_answer", ({ answer, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_answer", {
        answer,
        senderId: socket.userId,
        callId,
      });
    } else {
      console.log(`server: Receiver ${receiverId} not found for answer`);
      socket.emit("call_failed", { reason: "receiver offline" });
    }
  });

  socket.on("webrtc_ice_candidate", ({ candidate, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_ice_candidate", {
        candidate,
        senderId: socket.userId,
        callId,
      });
    } else {
      console.log(`server: Receiver ${receiverId} not found for ICE`);
      socket.emit("call_failed", { reason: "receiver offline" });
    }
  });
};

export default handleVideoCallEvent;
export { handleVideoCallEvent };
