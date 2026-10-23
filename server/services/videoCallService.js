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
      callId: clientCallId,
    }) => {
      const strCallerId = (callerId?._id || callerId)?.toString();

      if (isGroup && Array.isArray(receiverIds) && receiverIds.length > 0) {
        const callId =
          clientCallId ||
          `${strCallerId}-${groupId || "group"}-${Date.now()}`;
        const targetIds = new Set(
          receiverIds
            .map((id) => (id?._id || id)?.toString())
            .filter((id) => id && id !== strCallerId),
        );

        let onlineCount = 0;
        targetIds.forEach((targetId) => {
          const receiverSocketId = onlineUsers.get(targetId);
          if (receiverSocketId) {
            onlineCount++;
            io.to(receiverSocketId).emit("incoming_call", {
              callerId: strCallerId,
              callerName: callerInfo?.username || "Someone",
              callerAvatar: callerInfo?.profilePicture || "",
              callId,
              callType,
              isGroup: true,
              groupId: groupId?.toString(),
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
            callId,
            callerId: strCallerId,
            groupId: groupId?.toString(),
            pendingReceivers: targetIds,
            answeredBy: null,
            callType,
          });
        }
        return;
      }

      const strReceiverId = (receiverId?._id || receiverId)?.toString();
      const receiverSocketId = onlineUsers.get(strReceiverId);

      if (receiverSocketId) {
        const callId =
          clientCallId || `${strCallerId}-${strReceiverId}-${Date.now()}`;

        io.to(receiverSocketId).emit("incoming_call", {
          callerId: strCallerId,
          callerName: callerInfo?.username || "Someone",
          callerAvatar: callerInfo?.profilePicture || "",
          callId,
          callType,
          isGroup: false,
        });
      } else {
        console.log(`server: Receiver ${strReceiverId} is offline`);
        socket.emit("call_failed", { reason: "User is offline" });
      }
    },
  );

  socket.on(
    "accept_call",
    ({ callerId, receiverInfo, callId, isGroup, groupId }) => {
      const strCallerId = (callerId?._id || callerId)?.toString();
      const callerSocketId = onlineUsers.get(strCallerId);

      // Search activeGroupCalls by callId, or fallback to groupId/callerId matching
      let groupCall = activeGroupCalls.get(callId);
      if (!groupCall && (isGroup || groupId)) {
        for (const [gCallId, gCall] of activeGroupCalls.entries()) {
          if (
            (groupId && gCall.groupId === groupId?.toString()) ||
            gCall.callerId === strCallerId
          ) {
            groupCall = gCall;
            callId = gCallId;
            break;
          }
        }
      }

      const answeringUserId = (socket.userId || socket.id)?.toString();

      if (groupCall) {
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
          receiverId: answeringUserId,
          receiverName: receiverInfo?.username,
          receiverAvatar: receiverInfo?.profilePicture,
          isGroup: Boolean(isGroup || groupCall),
          groupId: groupId || groupCall?.groupId,
        });
      } else {
        console.log(`server: Caller ${strCallerId} not found`);
        socket.emit("call_failed", { reason: "Caller is offline" });
      }
    },
  );

  socket.on("reject_call", ({ callerId, callId, isGroup, groupId }) => {
    const strCallerId = (callerId?._id || callerId)?.toString();
    const rejectingUserId = (socket.userId || socket.id)?.toString();

    let groupCall = activeGroupCalls.get(callId);
    if (!groupCall && (isGroup || groupId)) {
      for (const [gCallId, gCall] of activeGroupCalls.entries()) {
        if (
          (groupId && gCall.groupId === groupId?.toString()) ||
          gCall.callerId === strCallerId
        ) {
          groupCall = gCall;
          callId = gCallId;
          break;
        }
      }
    }

    if (groupCall) {
      if (rejectingUserId) {
        groupCall.pendingReceivers.delete(rejectingUserId);
      }

      // If call is already answered by someone else, a rejection from another member should NOT end the call!
      if (groupCall.answeredBy) {
        return;
      }

      // Only emit call_rejected to caller if ALL pending members have rejected
      if (groupCall.pendingReceivers.size === 0) {
        activeGroupCalls.delete(callId);
        const callerSocketId = onlineUsers.get(groupCall.callerId || strCallerId);
        if (callerSocketId) {
          io.to(callerSocketId).emit("call_rejected", {
            callId,
          });
        }
      }
      return;
    }

    const callerSocketId = onlineUsers.get(strCallerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call_rejected", {
        callId,
      });
    } else {
      console.log(`server: Caller ${strCallerId} not found`);
    }
  });

  socket.on("end_call", ({ participantId, callId, isGroup, groupId }) => {
    const strParticipantId = (participantId?._id || participantId)?.toString();
    const endingUserId = (socket.userId || socket.id)?.toString();

    let groupCall = activeGroupCalls.get(callId);
    if (!groupCall && (isGroup || groupId)) {
      for (const [gCallId, gCall] of activeGroupCalls.entries()) {
        if (
          (groupId && gCall.groupId === groupId?.toString()) ||
          gCall.callerId === endingUserId ||
          gCall.answeredBy === endingUserId
        ) {
          groupCall = gCall;
          callId = gCallId;
          break;
        }
      }
    }

    if (groupCall) {
      const isCaller = endingUserId === groupCall.callerId;
      const isAnswerer = groupCall.answeredBy && endingUserId === groupCall.answeredBy;

      // If someone who is neither the caller nor the person who answered ends call,
      // it's just an ignored/closed ringing screen from a third member. Do NOT terminate the active call!
      if (!isCaller && !isAnswerer) {
        console.log(`server: Non-active participant ${endingUserId} left/ended ring for group call ${callId}`);
        if (endingUserId) {
          groupCall.pendingReceivers.delete(endingUserId);
        }
        return;
      }

      // Either caller or answeredBy ended the call: terminate call for all
      activeGroupCalls.delete(callId);
      groupCall.pendingReceivers.forEach((pId) => {
        const pSocket = onlineUsers.get(pId);
        if (pSocket && pSocket !== socket.id) {
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

    const participantSocketId = onlineUsers.get(strParticipantId);
    if (participantSocketId) {
      io.to(participantSocketId).emit("call_ended", {
        callId,
      });
    } else {
      console.log(`server: Participant ${strParticipantId} not found`);
    }
  });

  socket.on("webrtc_offer", ({ offer, receiverId, callId }) => {
    let strReceiverId = (receiverId?._id || receiverId)?.toString();
    let receiverSocketId = onlineUsers.get(strReceiverId);

    // Fallback lookup from activeGroupCalls
    if (!receiverSocketId && callId) {
      const gCall = activeGroupCalls.get(callId);
      if (gCall && gCall.answeredBy) {
        strReceiverId = gCall.answeredBy;
        receiverSocketId = onlineUsers.get(strReceiverId);
      }
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_offer", {
        offer,
        senderId: (socket.userId || socket.id)?.toString(),
        callId,
      });
      console.log(`server offer forward to ${strReceiverId}`);
    } else {
      console.log(`server: Receiver ${strReceiverId} not found for offer`);
      socket.emit("call_failed", { reason: "Recipient is not reachable" });
    }
  });

  socket.on("webrtc_answer", ({ answer, receiverId, callId }) => {
    let strReceiverId = (receiverId?._id || receiverId)?.toString();
    let receiverSocketId = onlineUsers.get(strReceiverId);

    // Fallback lookup from activeGroupCalls
    if (!receiverSocketId && callId) {
      const gCall = activeGroupCalls.get(callId);
      if (gCall && gCall.callerId) {
        strReceiverId = gCall.callerId;
        receiverSocketId = onlineUsers.get(strReceiverId);
      }
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_answer", {
        answer,
        senderId: (socket.userId || socket.id)?.toString(),
        callId,
      });
    } else {
      console.log(`server: Receiver ${strReceiverId} not found for answer`);
      socket.emit("call_failed", { reason: "Caller is not reachable" });
    }
  });

  socket.on("webrtc_ice_candidate", ({ candidate, receiverId, callId }) => {
    let strReceiverId = (receiverId?._id || receiverId)?.toString();
    let receiverSocketId = onlineUsers.get(strReceiverId);

    // Fallback lookup from activeGroupCalls
    if (!receiverSocketId && callId) {
      const gCall = activeGroupCalls.get(callId);
      if (gCall) {
        const senderId = (socket.userId || socket.id)?.toString();
        if (senderId === gCall.callerId && gCall.answeredBy) {
          strReceiverId = gCall.answeredBy;
          receiverSocketId = onlineUsers.get(strReceiverId);
        } else if (senderId === gCall.answeredBy && gCall.callerId) {
          strReceiverId = gCall.callerId;
          receiverSocketId = onlineUsers.get(strReceiverId);
        }
      }
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_ice_candidate", {
        candidate,
        senderId: (socket.userId || socket.id)?.toString(),
        callId,
      });
    } else {
      // Do NOT emit call_failed for an unrouted ICE candidate - candidates stream continuously and must not kill active calls
      console.log(`server: Receiver ${strReceiverId} not found for ICE candidate`);
    }
  });
};

export default handleVideoCallEvent;
export { handleVideoCallEvent };
