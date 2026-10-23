const activeGroupCalls = new Map();
const groupToCallMap = new Map();

const endGroupCall = (callId, io, onlineUsers, reason = "Call ended") => {
  const groupCall = activeGroupCalls.get(callId);
  if (!groupCall) return;

  if (groupCall.ringTimeout) {
    clearTimeout(groupCall.ringTimeout);
    groupCall.ringTimeout = null;
  }

  activeGroupCalls.delete(callId);
  if (groupCall.groupId) {
    groupToCallMap.delete(groupCall.groupId);
  }

  const allTargets = new Set([
    ...Array.from(groupCall.participants.keys()),
    ...Array.from(groupCall.pendingReceivers),
  ]);

  allTargets.forEach((uId) => {
    const sock = onlineUsers.get(uId);
    if (sock && io) {
      io.to(sock).emit("active_group_call_update", {
        callId: groupCall.callId,
        groupId: groupCall.groupId,
        isActive: false,
        status: "ended",
        joinedParticipants: [],
      });
      io.to(sock).emit("call_ended", {
        callId: groupCall.callId,
        reason,
      });
    }
  });
};

const broadcastGroupCallUpdate = (groupCall, io, onlineUsers) => {
  if (!groupCall) return;

  if (groupCall.hasConnected && groupCall.participants.size < 2) {
    endGroupCall(groupCall.callId, io, onlineUsers, "Call ended - everyone else left the call");
    return;
  }

  if (groupCall.participants.size === 0) {
    endGroupCall(groupCall.callId, io, onlineUsers, "Call ended");
    return;
  }

  const joinedList = Array.from(groupCall.participants.values()).map((p) => ({
    userId: p.userId,
    username: p.username,
    profilePicture: p.profilePicture,
    joinedAt: p.joinedAt || Date.now(),
  }));

  const updatePayload = {
    callId: groupCall.callId,
    groupId: groupCall.groupId,
    groupName: groupCall.groupName,
    groupAvatar: groupCall.groupAvatar,
    callType: groupCall.callType,
    callerId: groupCall.callerId,
    callerName: groupCall.callerInfo?.username || "Someone",
    callerAvatar: groupCall.callerInfo?.profilePicture || "",
    isActive: true,
    status: groupCall.hasConnected ? "ongoing" : "ringing",
    joinedParticipants: joinedList,
  };

  const targetUserIds = new Set([
    ...Array.from(groupCall.participants.keys()),
    ...Array.from(groupCall.pendingReceivers),
  ]);

  targetUserIds.forEach((uId) => {
    const sock = onlineUsers.get(uId);
    if (sock && io) {
      io.to(sock).emit("active_group_call_update", updatePayload);
    }
  });
};

const handleParticipantLeaveGroupCall = (groupCall, leavingUserId, io, onlineUsers, reason) => {
  if (!groupCall || !leavingUserId) return;
  const strLeavingId = leavingUserId.toString();

  groupCall.participants.delete(strLeavingId);
  groupCall.pendingReceivers.delete(strLeavingId);

  groupCall.participants.forEach((p) => {
    const pSocket = onlineUsers.get(p.userId);
    if (pSocket && io) {
      io.to(pSocket).emit("group_call_participant_left", {
        callId: groupCall.callId,
        groupId: groupCall.groupId,
        userId: strLeavingId,
        joinedParticipants: Array.from(groupCall.participants.values()).map((pt) => ({
          userId: pt.userId,
          username: pt.username,
          profilePicture: pt.profilePicture,
        })),
      });
    }
  });

  if (groupCall.participants.size === 0) {
    endGroupCall(groupCall.callId, io, onlineUsers, reason || "Call ended");
  } else if (groupCall.hasConnected && groupCall.participants.size < 2) {
    endGroupCall(groupCall.callId, io, onlineUsers, "Call ended - everyone else left the call");
  } else if (!groupCall.hasConnected && groupCall.participants.size < 2 && strLeavingId === groupCall.callerId) {
    endGroupCall(groupCall.callId, io, onlineUsers, "Call ended by caller");
  } else {
    broadcastGroupCallUpdate(groupCall, io, onlineUsers);
  }
};

const handleUserCallDisconnect = (userId, io, onlineUsers) => {
  if (!userId) return;
  const strUserId = userId.toString();

  for (const [callId, groupCall] of activeGroupCalls.entries()) {
    if (groupCall.participants.has(strUserId)) {
      handleParticipantLeaveGroupCall(groupCall, strUserId, io, onlineUsers, "Call ended - participant disconnected");
    } else if (groupCall.pendingReceivers.has(strUserId)) {
      groupCall.pendingReceivers.delete(strUserId);
      if (!groupCall.hasConnected && groupCall.pendingReceivers.size === 0 && groupCall.participants.size <= 1) {
        endGroupCall(callId, io, onlineUsers, "Call ended");
      }
    }
  }
};

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
      const strCallerId = (callerId?._id || callerId)?.toString();

      if (isGroup && Array.isArray(receiverIds) && receiverIds.length > 0) {
        const callId = `${strCallerId}-${groupId || "group"}-${Date.now()}`;
        const strGroupId = (groupId?._id || groupId)?.toString();

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
              groupId: strGroupId,
              groupName: groupName || "Group Call",
              groupAvatar: groupAvatar || "",
              joinedParticipants: [
                {
                  userId: strCallerId,
                  username: callerInfo?.username || "Someone",
                  profilePicture: callerInfo?.profilePicture || "",
                  joinedAt: Date.now(),
                },
              ],
            });
          }
        });

        if (onlineCount === 0) {
          console.log(`server: No group participants online for group ${strGroupId}`);
          socket.emit("call_failed", {
            reason: "All participants are offline",
          });
          return;
        }

        const participantsMap = new Map();
        participantsMap.set(strCallerId, {
          userId: strCallerId,
          username: callerInfo?.username || "Someone",
          profilePicture: callerInfo?.profilePicture || "",
          joinedAt: Date.now(),
        });

        const ringTimeout = setTimeout(() => {
          const c = activeGroupCalls.get(callId);
          if (c && !c.hasConnected && c.participants.size < 2) {
            endGroupCall(callId, io, onlineUsers, "No answer");
          }
        }, 45000);

        const newGroupCall = {
          callId,
          groupId: strGroupId,
          groupName: groupName || "Group Call",
          groupAvatar: groupAvatar || "",
          callType,
          callerId: strCallerId,
          callerInfo,
          pendingReceivers: targetIds,
          participants: participantsMap,
          startedAt: Date.now(),
          hasConnected: false,
          ringTimeout,
        };

        activeGroupCalls.set(callId, newGroupCall);
        if (strGroupId) {
          groupToCallMap.set(strGroupId, callId);
        }

        broadcastGroupCallUpdate(newGroupCall, io, onlineUsers);
        return;
      }

      const strReceiverId = (receiverId?._id || receiverId)?.toString();
      const receiverSocketId = onlineUsers.get(strReceiverId);

      if (receiverSocketId) {
        const callId = `${strCallerId}-${strReceiverId}-${Date.now()}`;

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
        socket.emit("call_failed", { reason: "user is offline" });
      }
    },
  );

  socket.on(
    "accept_call",
    ({ callerId, receiverInfo, callId, isGroup, groupId }) => {
      const answeringUserId = (socket.userId || socket.id)?.toString();
      const strCallerId = (callerId?._id || callerId)?.toString();

      let groupCall = activeGroupCalls.get(callId);
      if (!groupCall && (isGroup || groupId)) {
        const mappedCallId = groupToCallMap.get(groupId?.toString());
        if (mappedCallId) {
          groupCall = activeGroupCalls.get(mappedCallId);
          callId = mappedCallId;
        }
      }

      if (groupCall) {
        groupCall.pendingReceivers.delete(answeringUserId);

        const newParticipant = {
          userId: answeringUserId,
          username: receiverInfo?.username || "Member",
          profilePicture: receiverInfo?.profilePicture || "",
          joinedAt: Date.now(),
        };
        groupCall.participants.set(answeringUserId, newParticipant);
        groupCall.hasConnected = true;

        if (groupCall.ringTimeout) {
          clearTimeout(groupCall.ringTimeout);
          groupCall.ringTimeout = null;
        }

        const callerSocketId = onlineUsers.get(groupCall.callerId);
        if (callerSocketId) {
          io.to(callerSocketId).emit("call_accepted", {
            callId: groupCall.callId,
            receiverId: answeringUserId,
            receiverName: receiverInfo?.username,
            receiverAvatar: receiverInfo?.profilePicture,
            isGroup: true,
            groupId: groupCall.groupId,
          });
        }

        const existingParticipantsList = Array.from(groupCall.participants.values()).filter(
          (p) => p.userId !== answeringUserId,
        );

        socket.emit("group_call_joined", {
          callId: groupCall.callId,
          groupId: groupCall.groupId,
          groupName: groupCall.groupName,
          groupAvatar: groupCall.groupAvatar,
          callType: groupCall.callType,
          callerId: groupCall.callerId,
          existingParticipants: existingParticipantsList,
          joinedParticipants: Array.from(groupCall.participants.values()),
        });

        groupCall.participants.forEach((p) => {
          if (p.userId !== answeringUserId) {
            const pSocket = onlineUsers.get(p.userId);
            if (pSocket) {
              io.to(pSocket).emit("group_call_participant_joined", {
                callId: groupCall.callId,
                groupId: groupCall.groupId,
                participant: newParticipant,
                joinedParticipants: Array.from(groupCall.participants.values()),
              });
            }
          }
        });

        broadcastGroupCallUpdate(groupCall, io, onlineUsers);
        return;
      }

      const callerSocketId = onlineUsers.get(strCallerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit("call_accepted", {
          callId,
          receiverId: answeringUserId,
          receiverName: receiverInfo?.username,
          receiverAvatar: receiverInfo?.profilePicture,
          isGroup: false,
        });
      } else {
        console.log(`server: Caller ${strCallerId} not found`);
        socket.emit("call_failed", { reason: "caller is offline" });
      }
    },
  );

  socket.on("join_group_call", ({ callId, groupId, userInfo }) => {
    const joiningUserId = (socket.userId || socket.id)?.toString();
    const strGroupId = (groupId?._id || groupId)?.toString();

    let groupCall = callId ? activeGroupCalls.get(callId) : null;
    if (!groupCall && strGroupId) {
      const mappedId = groupToCallMap.get(strGroupId);
      if (mappedId) {
        groupCall = activeGroupCalls.get(mappedId);
        callId = mappedId;
      }
    }

    if (!groupCall) {
      socket.emit("call_failed", { reason: "Call is no longer active" });
      return;
    }

    groupCall.pendingReceivers.delete(joiningUserId);

    const newParticipant = {
      userId: joiningUserId,
      username: userInfo?.username || "Member",
      profilePicture: userInfo?.profilePicture || "",
      joinedAt: Date.now(),
    };
    groupCall.participants.set(joiningUserId, newParticipant);
    groupCall.hasConnected = true;

    if (groupCall.ringTimeout) {
      clearTimeout(groupCall.ringTimeout);
      groupCall.ringTimeout = null;
    }

    const existingParticipantsList = Array.from(groupCall.participants.values()).filter(
      (p) => p.userId !== joiningUserId,
    );

    socket.emit("group_call_joined", {
      callId: groupCall.callId,
      groupId: groupCall.groupId,
      groupName: groupCall.groupName,
      groupAvatar: groupCall.groupAvatar,
      callType: groupCall.callType,
      callerId: groupCall.callerId,
      existingParticipants: existingParticipantsList,
      joinedParticipants: Array.from(groupCall.participants.values()),
    });

    groupCall.participants.forEach((p) => {
      if (p.userId !== joiningUserId) {
        const pSocket = onlineUsers.get(p.userId);
        if (pSocket) {
          io.to(pSocket).emit("group_call_participant_joined", {
            callId: groupCall.callId,
            groupId: groupCall.groupId,
            participant: newParticipant,
            joinedParticipants: Array.from(groupCall.participants.values()),
          });
        }
      }
    });

    broadcastGroupCallUpdate(groupCall, io, onlineUsers);
  });

  socket.on("get_active_group_call", ({ groupId, callId }, callback) => {
    const strGroupId = (groupId?._id || groupId)?.toString();
    let groupCall = callId ? activeGroupCalls.get(callId) : null;
    if (!groupCall && strGroupId) {
      const mappedId = groupToCallMap.get(strGroupId);
      if (mappedId) groupCall = activeGroupCalls.get(mappedId);
    }

    const isCallStillValid = Boolean(
      groupCall &&
      groupCall.participants.size > 0 &&
      (!groupCall.hasConnected || groupCall.participants.size >= 2)
    );

    if (isCallStillValid) {
      const payload = {
        callId: groupCall.callId,
        groupId: groupCall.groupId,
        groupName: groupCall.groupName,
        groupAvatar: groupCall.groupAvatar,
        callType: groupCall.callType,
        callerId: groupCall.callerId,
        callerName: groupCall.callerInfo?.username || "Someone",
        callerAvatar: groupCall.callerInfo?.profilePicture || "",
        isActive: true,
        status: groupCall.hasConnected ? "ongoing" : "ringing",
        joinedParticipants: Array.from(groupCall.participants.values()).map((p) => ({
          userId: p.userId,
          username: p.username,
          profilePicture: p.profilePicture,
        })),
      };
      if (typeof callback === "function") callback({ activeCall: payload });
      socket.emit("active_group_call_update", payload);
    } else {
      if (typeof callback === "function") callback({ activeCall: null });
      socket.emit("active_group_call_update", {
        groupId: strGroupId,
        isActive: false,
        status: "ended",
        joinedParticipants: [],
      });
    }
  });

  socket.on("leave_group_call", ({ callId, groupId }) => {
    let groupCall = activeGroupCalls.get(callId);
    if (!groupCall && groupId) {
      const mappedId = groupToCallMap.get(groupId?.toString());
      if (mappedId) groupCall = activeGroupCalls.get(mappedId);
    }
    if (!groupCall) return;

    const leavingUserId = (socket.userId || socket.id)?.toString();
    handleParticipantLeaveGroupCall(groupCall, leavingUserId, io, onlineUsers, "Call ended - participant left");
  });

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

      if (groupCall.participants.size > 1) {
        return;
      }

      if (groupCall.pendingReceivers.size === 0 && groupCall.participants.size <= 1) {
        endGroupCall(groupCall.callId, io, onlineUsers, "Call declined");
      }
      return;
    }

    const callerSocketId = onlineUsers.get(strCallerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call_rejected", { callId });
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
          gCall.participants.has(endingUserId)
        ) {
          groupCall = gCall;
          callId = gCallId;
          break;
        }
      }
    }

    if (groupCall) {
      handleParticipantLeaveGroupCall(groupCall, endingUserId, io, onlineUsers, "Call ended");
      return;
    }

    const participantSocketId = onlineUsers.get(strParticipantId);
    if (participantSocketId) {
      io.to(participantSocketId).emit("call_ended", { callId });
    }
  });

  socket.on("disconnect", () => {
    const disconnectedUserId = (socket.userId || socket.id)?.toString();
    handleUserCallDisconnect(disconnectedUserId, io, onlineUsers);
  });

  socket.on("webrtc_offer", ({ offer, receiverId, targetUserId, senderId, callId }) => {
    const destId = (targetUserId || receiverId?._id || receiverId)?.toString();
    const srcId = (senderId || socket.userId || socket.id)?.toString();
    const destSocket = onlineUsers.get(destId);

    if (destSocket) {
      io.to(destSocket).emit("webrtc_offer", {
        offer,
        senderId: srcId,
        targetUserId: destId,
        callId,
      });
    } else {
      console.log(`server: Target ${destId} not found for WebRTC offer`);
    }
  });

  socket.on("webrtc_answer", ({ answer, receiverId, targetUserId, senderId, callId }) => {
    const destId = (targetUserId || receiverId?._id || receiverId)?.toString();
    const srcId = (senderId || socket.userId || socket.id)?.toString();
    const destSocket = onlineUsers.get(destId);

    if (destSocket) {
      io.to(destSocket).emit("webrtc_answer", {
        answer,
        senderId: srcId,
        targetUserId: destId,
        callId,
      });
    } else {
      console.log(`server: Target ${destId} not found for WebRTC answer`);
    }
  });

  socket.on("webrtc_ice_candidate", ({ candidate, receiverId, targetUserId, senderId, callId }) => {
    const destId = (targetUserId || receiverId?._id || receiverId)?.toString();
    const srcId = (senderId || socket.userId || socket.id)?.toString();
    const destSocket = onlineUsers.get(destId);

    if (destSocket) {
      io.to(destSocket).emit("webrtc_ice_candidate", {
        candidate,
        senderId: srcId,
        targetUserId: destId,
        callId,
      });
    }
  });
};

export default handleVideoCallEvent;
export { handleVideoCallEvent, handleUserCallDisconnect, endGroupCall };
