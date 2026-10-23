import React, { useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import useVideoCallStore from "../../store/videoCallStore";
import useUserStore from "../../store/useUserStore";
import VideoCallModel from "./videoCallModel";
import { getSocket } from "../../services/chatService";

const VideoCallManager = () => {
  const {
    setIncomingCall,
    setCurrentCall,
    setCallType,
    setCallModalOpen,
    endCall,
    setCallStatus,
    setCallActive,
    setIsInitiator,
    setActiveGroupCall,
    setGroupParticipants,
    addGroupParticipant,
    removeGroupParticipant,
    removeRemoteStreamForUser,
  } = useVideoCallStore();

  const { user } = useUserStore();
  const socket = getSocket();

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({
      callerId,
      callerName,
      callerAvatar,
      callType,
      callId,
      isGroup,
      groupId,
      groupName,
      groupAvatar,
      joinedParticipants,
    }) => {
      setIsInitiator(false);
      setIncomingCall({
        callerId,
        callerName: isGroup && groupName ? `${groupName} (${callerName})` : callerName,
        callerAvatar: isGroup && groupAvatar ? groupAvatar : callerAvatar,
        callId,
        isInitiator: false,
        isGroup: Boolean(isGroup),
        groupId,
        groupName,
        actualCallerName: callerName,
      });

      if (isGroup && Array.isArray(joinedParticipants)) {
        const myId = user?._id?.toString();
        const others = joinedParticipants.filter(
          (p) => (p.userId || p._id || p)?.toString() !== myId,
        );
        setGroupParticipants(others);
      }

      setCallType(callType);
      setCallModalOpen(true);
      setCallStatus("ringing");
    };

    const handleCallEnded = ({ reason }) => {
      if (reason) {
        toast.info(reason);
      }
      setCallStatus("failed");
      setTimeout(() => {
        endCall();
      }, 2000);
    };

    const handleActiveGroupCallUpdate = (callData) => {
      if (callData?.isActive && (callData?.joinedParticipants?.length > 0 || callData?.status === "ongoing")) {
        setActiveGroupCall(callData);
      } else {
        setActiveGroupCall(null);
      }
    };

    const handleGroupCallJoined = ({
      callId,
      groupId,
      groupName,
      groupAvatar,
      callType,
      callerId,
      existingParticipants,
      joinedParticipants,
    }) => {
      const myId = user?._id?.toString();
      const allJoined = joinedParticipants || existingParticipants || [];
      const others = allJoined.filter(
        (p) => (p.userId || p._id || p)?.toString() !== myId,
      );
      setGroupParticipants(others);
      setCallStatus("connected");
      setCallActive(true);
    };

    const handleGroupCallParticipantJoined = ({ participant }) => {
      if (participant && participant.userId?.toString() !== user?._id?.toString()) {
        addGroupParticipant(participant);
      }
    };

    const handleGroupCallParticipantLeft = ({ userId }) => {
      if (userId) {
        removeGroupParticipant(userId);
        removeRemoteStreamForUser(userId);
      }
    };

    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_failed", handleCallEnded);
    socket.on("active_group_call_update", handleActiveGroupCallUpdate);
    socket.on("group_call_joined", handleGroupCallJoined);
    socket.on("group_call_participant_joined", handleGroupCallParticipantJoined);
    socket.on("group_call_participant_left", handleGroupCallParticipantLeft);

    return () => {
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_failed", handleCallEnded);
      socket.off("active_group_call_update", handleActiveGroupCallUpdate);
      socket.off("group_call_joined", handleGroupCallJoined);
      socket.off("group_call_participant_joined", handleGroupCallParticipantJoined);
      socket.off("group_call_participant_left", handleGroupCallParticipantLeft);
    };
  }, [
    socket,
    user,
    setIncomingCall,
    setCallType,
    setCallStatus,
    setCallActive,
    setCallModalOpen,
    endCall,
    setIsInitiator,
    setActiveGroupCall,
    setGroupParticipants,
    addGroupParticipant,
    removeGroupParticipant,
    removeRemoteStreamForUser,
  ]);

  const initiateCall = useCallback(
    (receiverId, receiverName, receiverAvatar, callType = "video", extraOptions = {}) => {
      const isGroup = Boolean(extraOptions?.isGroup);
      const strReceiverId = (receiverId?._id || receiverId)?.toString();
      const strGroupId = (extraOptions?.groupId?._id || extraOptions?.groupId)?.toString();
      const callId = `${user?._id}-${strGroupId || strReceiverId}-${Date.now()}`;

      const rawParticipantIds = extraOptions?.participantIds || (strReceiverId ? [strReceiverId] : []);
      const normalizedParticipantIds = rawParticipantIds
        .map((p) => (p?._id || p)?.toString())
        .filter(Boolean);

      const callData = {
        callId,
        participantId: strReceiverId,
        participantName: receiverName,
        participantAvatar: receiverAvatar,
        isInitiator: true,
        isGroup,
        groupId: strGroupId,
        groupName: extraOptions?.groupName || receiverName,
        participantIds: normalizedParticipantIds,
      };

      setIsInitiator(true);
      setCurrentCall(callData);
      setCallType(callType);
      setCallModalOpen(true);
      setCallStatus("calling");

      if (isGroup) {
        setGroupParticipants([]);
      }

      socket?.emit("initiate_call", {
        callId,
        callerId: user?._id?.toString(),
        receiverId: strReceiverId,
        receiverIds: normalizedParticipantIds,
        isGroup,
        groupId: strGroupId,
        groupName: extraOptions?.groupName || receiverName,
        groupAvatar: extraOptions?.groupAvatar || receiverAvatar,
        callType,
        callerInfo: {
          username: user?.username,
          profilePicture: user?.profilePicture,
        },
      });
    },
    [user, socket, setCurrentCall, setCallType, setCallModalOpen, setCallStatus, setIsInitiator, setGroupParticipants],
  );

  const joinGroupCall = useCallback(
    (groupCallData) => {
      if (!groupCallData || !socket) return;
      const callId = groupCallData.callId;
      const groupId = groupCallData.groupId;
      const callType = groupCallData.callType || "video";

      const callData = {
        callId,
        isGroup: true,
        groupId,
        groupName: groupCallData.groupName || "Group Call",
        groupAvatar: groupCallData.groupAvatar,
        participantName: groupCallData.groupName || "Group Call",
        participantAvatar: groupCallData.groupAvatar,
        isInitiator: false,
      };

      setIsInitiator(false);
      setCurrentCall(callData);
      setCallType(callType);
      setCallModalOpen(true);
      setCallStatus("connecting");

      const myId = user?._id?.toString();
      const existingOthers = (groupCallData.joinedParticipants || []).filter(
        (p) => (p.userId || p._id || p)?.toString() !== myId,
      );
      setGroupParticipants(existingOthers);

      socket.emit("join_group_call", {
        callId,
        groupId,
        userInfo: {
          username: user?.username,
          profilePicture: user?.profilePicture,
        },
      });
    },
    [socket, user, setCurrentCall, setCallType, setCallModalOpen, setCallStatus, setIsInitiator, setGroupParticipants],
  );

  useEffect(() => {
    useVideoCallStore.getState().initiateCall = initiateCall;
    useVideoCallStore.getState().joinGroupCall = joinGroupCall;
  }, [initiateCall, joinGroupCall]);

  return <VideoCallModel socket={socket} />;
};

export default VideoCallManager;
