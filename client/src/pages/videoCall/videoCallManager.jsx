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
    setIsInitiator,
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

    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_failed", handleCallEnded);

    return () => {
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_failed", handleCallEnded);
    };
  }, [socket, setIncomingCall, setCallType, setCallStatus, setCallModalOpen, endCall, setIsInitiator]);

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

      socket.emit("initiate_call", {
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
    [user, socket, setCurrentCall, setCallType, setCallModalOpen, setCallStatus, setIsInitiator],
  );

  useEffect(() => {
    useVideoCallStore.getState().initiateCall = initiateCall;
  }, [initiateCall]);

  return <VideoCallModel socket={socket} />;
};

export default VideoCallManager;
