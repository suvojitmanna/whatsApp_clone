const handleVideoCallEvent = (socket, io, onlineUsers) => {
  // Incoming Call
  socket.on(
    "initiate_call",
    ({ callerId, receiverId, callType, callerInfo }) => {
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        const callId = `${callerId}-${receiverId}-${Date.now()}`;

        io.to(receiverSocketId).emit("incoming_call", {
          callerId,
          callerName: callerInfo.username,
          callerAvatar: callerInfo.profilePicture,
          callId,
          callType,
        });
      } else {
        console.log(`server: Receiver ${receiverId} is offline`);
        socket.emit("call_failed", { reason: "user is offline" });
      }
    },
  );

  //   Accepted Call
  socket.on("accept_call", ({ callerId, receiverInfo, callId }) => {
    const callerSocketId = onlineUsers.get(callerId);

    if (callerSocketId) {
      io.to(callerSocketId).emit("call_accepted", {
        callId,
        receiverName: receiverInfo.username,
        receiverAvatar: receiverInfo.profilePicture,
      });
    } else {
      console.log(`server: Caller ${callerId} not found`);
      socket.emit("call_failed", { reason: "caller is offline" });
    }
  });

  //   Reject Call
  socket.on("reject_call", ({ callerId, callId }) => {
    const callerSocketId = onlineUsers.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call_rejected", {
        callId,
      });
    } else {
      console.log(`server: Caller ${callerId} not found`);
    }
  });

  //   End Call
  socket.on("end_call", ({ participantId, callId }) => {
    const participantSocketId = onlineUsers.get(participantId);
    if (participantSocketId) {
      io.to(participantSocketId).emit("call_ended", {
        callId,
      });
    } else {
      console.log(`server: Participant ${participantId} not found`);
    }
  });

  //WebRct signaling
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

  //   Answer
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

module.exports = handleVideoCallEvent;
