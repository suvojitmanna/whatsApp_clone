import React, { useEffect, useMemo, useRef, useState } from "react";
import useVideoCallStore from "../../store/videoCallStore";
import useUserStore from "../../store/useUserStore";
import useThemeStore from "../../store/themeStore";
import useCallStore from "../../store/useCallStore";
import { useChatStore } from "../../store/chatStore";
import useLayoutStore from "../../store/layoutStore";
import { LuScreenShare, LuScreenShareOff } from "react-icons/lu";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhone,
  FaPhoneSlash,
  FaTimes,
  FaVideo,
  FaVideoSlash,
  FaLock,
  FaExpand,
  FaCompress,
} from "react-icons/fa";

const defaultAvatar =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80";

const VideoCallModel = ({ socket }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const recordedCallIds = useRef(new Set());
  const callAcceptedRef = useRef(false);
  const callStartTimeRef = useRef(null);
  const [callTime, setCallTime] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    currentCall,
    incomingCall,
    isCallActive,
    localStream,
    callType,
    isVideoEnabled,
    isAudioEnabled,
    peerConnection,
    isCallModalOpen,
    callStatus,
    setCurrentCall,
    setCallType,
    setCallActive,
    endCall,
    setCallStatus,
    setLocalStream,
    remoteStream,
    setRemoteStream,
    setPeerConnection,
    addIceCandidate,
    processQueuedIceCandidates,
    toggleVideo,
    toggleAudio,
    clearIncomingCall,
    isInitiator,
    setIsInitiator,
  } = useVideoCallStore();

  const { user } = useUserStore();
  const { theme } = useThemeStore();

  const rtcConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  const displayInfo = useMemo(() => {
    if (incomingCall && !isCallActive) {
      return {
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar,
      };
    } else if (currentCall) {
      return {
        name: currentCall.participantName,
        avatar: currentCall.participantAvatar,
      };
    }
    return null;
  }, [incomingCall, currentCall, isCallActive]);

  useEffect(() => {
    if (peerConnection && remoteStream) {
      console.log("both peer connection ");
      callAcceptedRef.current = true;
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
      }
      setCallStatus("connected");
      setCallActive(true);
    }
  }, [peerConnection, remoteStream, setCallStatus, setCallActive]);
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    let interval;

    if (callStatus === "connected") {
      interval = setInterval(() => {
        setCallTime((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [callStatus]);

  useEffect(() => {
    if (
      callStatus === "failed" ||
      callStatus === "rejected" ||
      callStatus === "calling" ||
      !isCallActive
    ) {
      setCallTime(0);
    }
  }, [callStatus, isCallActive]);
  const InitializeMedia = async (video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio: true,
      });

      console.log("local media stream ", stream.getTracks());
      setLocalStream(stream);
      setCameraStream(stream);
      return stream;
    } catch (error) {
      console.error("Media error", error);
      throw error;
    }
  };

  const toggleScreenShare = async () => {
    try {
      const sender = peerConnection
        ?.getSenders()
        .find((s) => s.track?.kind === "video");
      if (isScreenSharing) {
        const sender = peerConnection
          ?.getSenders()
          .find((s) => s.track?.kind === "video");

        const cameraTrack = cameraStream?.getVideoTracks()[0];

        if (sender && cameraTrack) {
          sender.replaceTrack(cameraTrack);
        }

        setLocalStream(cameraStream);
        setIsScreenSharing(false);

        return;
      }
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const screenTrack = screenStream.getVideoTracks()[0];

      if (sender) {
        sender.replaceTrack(screenTrack);
      }

      setLocalStream(screenStream);
      setIsScreenSharing(true);
      screenTrack.onended = () => {
        const sender = peerConnection
          ?.getSenders()
          .find((s) => s.track?.kind === "video");

        const cameraTrack = cameraStream?.getVideoTracks()[0];

        if (sender && cameraTrack) {
          sender.replaceTrack(cameraTrack);
        }

        setLocalStream(cameraStream);
        setIsScreenSharing(false);
      };
    } catch (err) {
      console.error("Screen share toggle error:", err);
    }
  };
  const createPeerConnection = (stream, role) => {
    const pc = new RTCPeerConnection(rtcConfiguration);

    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log(`${role} adding ${track.kind} track`, track.id.slice(0, 8));
        pc.addTrack(track, stream);
      });
    }
    pc.onicecandidate = (event) => {
      if (event.candidate && socket?.connected) {
        const participantId =
          currentCall?.participantId || incomingCall?.callerId;
        const callId = currentCall?.callId || incomingCall?.callId;

        if (participantId && callId) {
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            receiverId: participantId,
            callId: callId,
          });
        }
      }
    };
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const stream = new MediaStream([event.track]);
        setRemoteStream(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`role: ${role} :connection state`, pc.connectionState);

      if (pc.connectionState === "connected") {
        callAcceptedRef.current = true;
        if (!callStartTimeRef.current) {
          callStartTimeRef.current = Date.now();
        }
        setCallStatus("connected");
        setCallActive(true);
      } else if (["failed", "disconnected"].includes(pc.connectionState)) {
        setCallStatus("failed");
        setTimeout(handleEndCall, 2000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`role: ${role} :ICE state`, pc.iceConnectionState);
      if (["connected", "completed"].includes(pc.iceConnectionState)) {
        callAcceptedRef.current = true;
        if (!callStartTimeRef.current) {
          callStartTimeRef.current = Date.now();
        }
        setCallStatus("connected");
        setCallActive(true);
      }
    };

    pc.onsignalingstatechange = () => {
      console.log(`role: ${role} :signaling state`, pc.signalingState);
    };

    setPeerConnection(pc);
    return pc;
  };
  const initializeCallerCall = async () => {
    try {
      setCallStatus("connecting");

      const stream = await InitializeMedia(callType === "video");

      const pc = createPeerConnection(stream, "CALLER");

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });

      await pc.setLocalDescription(offer);

      socket.emit("webrtc_offer", {
        offer,
        receiverId: currentCall?.participantId,
        callId: currentCall?.callId,
      });
    } catch (error) {
      console.error("Caller init error:", error);
      setCallStatus("failed");
      setTimeout(handleEndCall, 2000);
    }
  };
  const handleAnswerCall = async () => {
    try {
      callAcceptedRef.current = true;
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
      }
      setCallStatus("connecting");

      const stream = await InitializeMedia(callType === "video");
      setLocalStream(stream);

      const pc = createPeerConnection(stream, "RECEIVER");

      socket.emit("accept_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
        receiverInfo: {
          username: user?.username,
          profilePicture: user?.profilePicture,
        },
      });

      setCurrentCall({
        callId: incomingCall?.callId,
        participantId: incomingCall?.callerId,
        participantName: incomingCall?.callerName,
        participantAvatar: incomingCall?.callerAvatar,
        isInitiator: false,
      });
      setIsInitiator(false);

      clearIncomingCall();
    } catch (error) {
      console.error("Receiver Error", error);
      handleEndCall();
    }
  };
  const recordCallEvent = (finalSeconds = callTime, explicitStatus = null) => {
    const participantId = currentCall?.participantId || incomingCall?.callerId;
    const callId = currentCall?.callId || incomingCall?.callId;
    if (!participantId || !callId) return;

    if (recordedCallIds.current.has(callId)) return;
    recordedCallIds.current.add(callId);

    const isCaller = Boolean(
      currentCall?.isInitiator === true ||
      isInitiator === true
    );
    const participantName =
      currentCall?.participantName || incomingCall?.callerName || "Contact";
    const participantAvatar =
      currentCall?.participantAvatar || incomingCall?.callerAvatar || "";

    let effectiveSeconds = finalSeconds;
    if (callStartTimeRef.current && effectiveSeconds <= 0) {
      effectiveSeconds = Math.max(
        1,
        Math.round((Date.now() - callStartTimeRef.current) / 1000)
      );
    }

    const wasAnswered = Boolean(
      callAcceptedRef.current ||
      callStatus === "connected" ||
      effectiveSeconds > 0
    );

    const isConnected =
      wasAnswered &&
      explicitStatus !== "rejected" &&
      callStatus !== "rejected";

    let durationText = "";
    if (isConnected) {
      if (effectiveSeconds <= 0) {
        durationText = "1 second";
      } else if (effectiveSeconds < 60) {
        durationText = `${effectiveSeconds} second${effectiveSeconds === 1 ? "" : "s"}`;
      } else {
        const mins = Math.floor(effectiveSeconds / 60);
        const secs = effectiveSeconds % 60;
        durationText = `${mins} min ${secs} sec`;
      }
    } else {
      durationText =
        explicitStatus === "rejected" || callStatus === "rejected"
          ? "Declined"
          : "Missed";
    }

    const direction = isCaller
      ? "outgoing"
      : isConnected
        ? "incoming"
        : "missed";

    const statusType = isConnected
      ? "completed"
      : explicitStatus === "rejected" || callStatus === "rejected"
        ? "declined"
        : "missed";

    try {
      useCallStore.getState().addCall({
        contactId: participantId,
        contactName: participantName,
        contactAvatar: participantAvatar,
        callType: callType === "video" ? "video" : "audio",
        direction,
        duration: durationText,
        status: statusType,
      });
    } catch (e) {
      console.warn("Could not save to useCallStore:", e);
    }

    if (isCaller) {
      try {
        const activeContact = useLayoutStore.getState()?.selectedContact;
        const conv = useChatStore.getState()?.currentConversation;
        const conversationId = conv?._id || activeContact?.conversation?._id;

        useChatStore.getState().sendCallMessage?.({
          receiverId: participantId,
          conversationId,
          callType: callType === "video" ? "video" : "audio",
          duration: durationText,
          status: statusType,
          direction: "outgoing",
        });
      } catch (e) {
        console.warn("Could not save call message to useChatStore:", e);
      }
    }
  };

  const handleRejectCall = () => {
    recordCallEvent(0, "rejected");
    if (incomingCall) {
      socket.emit("reject_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
      });
    }
    endCall();
  };

  const cleanupCall = () => {
    const callId = currentCall?.callId || incomingCall?.callId;
    if (callId && !recordedCallIds.current.has(callId)) {
      recordCallEvent(callTime);
    }

    if (peerConnection) {
      peerConnection.getSenders().forEach((s) => {
        if (s.track) s.track.stop();
        s.replaceTrack(null);
      });
    }
    if (isScreenSharing && localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((t) => t.stop());
    }

    if (peerConnection) {
      peerConnection.close();
    }

    setLocalStream(null);
    setCameraStream(null);
    setRemoteStream(null);
    setPeerConnection(null);
    callAcceptedRef.current = false;
    callStartTimeRef.current = null;
    endCall();
  };
  const handleEndCall = () => {
    const elapsed = callTime;
    recordCallEvent(elapsed);
    setCallTime(0);
    const participantId = currentCall?.participantId || incomingCall?.callerId;
    const callId = currentCall?.callId || incomingCall?.callId;

    if (participantId && callId) {
      socket.emit("end_call", {
        callId: callId,
        participantId: participantId,
      });
    }

    cleanupCall();
  };
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = ({ receiverName }) => {
      callAcceptedRef.current = true;
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
      }
      setCallStatus("connecting");
      if (currentCall) {
        setTimeout(() => {
          initializeCallerCall();
        }, 500);
      }
    };

    const handleCallRejected = () => {
      recordCallEvent(0, "rejected");
      setCallStatus("rejected");
      setTimeout(endCall, 2000);
    };

    const handleCallEnded = () => {
      recordCallEvent(callTime);
      cleanupCall();
    };

    const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
      if (!peerConnection) return;

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer),
        );

        await processQueuedIceCandidates();

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("webrtc_answer", {
          answer,
          receiverId: senderId,
          callId,
        });

        console.log("Receiver: Answer send waiting for ice candidates");
      } catch (error) {
        console.error("Receiver offer error", error);
      }
    };
    const handleWebRTCAnswer = async ({ answer, senderId, callId }) => {
      if (!peerConnection) return;
      if (peerConnection.signalingState === "closed") {
        console.log("Caller peer connection is closed");
        return;
      }

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer),
        );

        await processQueuedIceCandidates();

        const receivers = peerConnection.getReceivers();
        console.log("Receivers:", receivers);
      } catch (error) {
        console.error("Caller answer error", error);
      }
    };
    const handleWebRTCIceCandidates = async ({ candidate, senderId }) => {
      if (peerConnection && peerConnection.signalingState !== "closed") {
        if (peerConnection.remoteDescription) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate),
            );
            console.log("ICE candidate added");
          } catch (error) {
            console.log("ice error", error);
          }
        } else {
          console.log("queuing ice candidate");
          addIceCandidate(candidate);
        }
      }
    };
    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);
    socket.on("webrtc_offer", handleWebRTCOffer);
    socket.on("webrtc_answer", handleWebRTCAnswer);
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidates);

    return () => {
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("webrtc_offer", handleWebRTCOffer);
      socket.off("webrtc_answer", handleWebRTCAnswer);
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidates);
    };
  }, [socket, peerConnection, currentCall, incomingCall, user]);

  if (!isCallModalOpen && !incomingCall) return null;
  const shouldShowActiveCall =
    isCallActive || callStatus === "calling" || callStatus === "connecting";
  const isVideoCall = callType === "video";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-300 ${
        isFullscreen ? "p-0" : "p-3 sm:p-5"
      }`}
    >
      <div
        className={`relative w-full overflow-hidden transition-all duration-300 shadow-[0_25px_80px_rgba(0,0,0,0.85)] border border-[#2a3942]/70 bg-[#111b21] ${
          isFullscreen
            ? "h-full w-full max-w-none max-h-none rounded-none border-0"
            : incomingCall && !isCallActive
              ? "max-w-[400px] h-[520px] rounded-3xl"
              : !isVideoCall
                ? "max-w-[400px] h-[580px] rounded-3xl"
                : "max-w-4xl h-[85vh] max-h-[760px] rounded-3xl"
        }`}
      >
        {/* Ambient subtle WhatsApp glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[500px] h-[500px] bg-[#00a884]/10 blur-[140px] rounded-full top-[-100px] left-[-100px]" />
          <div className="absolute w-[400px] h-[400px] bg-[#111b21] blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />
        </div>

        {/* 1. WhatsApp Incoming Call Screen */}
        {incomingCall && !isCallActive && (
          <div className="relative flex flex-col items-center justify-between h-full p-8 sm:p-10 text-center z-10 animate-in fade-in zoom-in duration-300">
            {/* Top Security Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#202c33]/90 border border-[#2a3942] text-[#8696a0] text-xs font-medium shadow-sm">
              <FaLock className="text-[#00a884] text-[10px]" />
              <span>End-to-end encrypted</span>
            </div>

            {/* Caller Info with WhatsApp Pulsing Rings */}
            <div className="my-auto flex flex-col items-center">
              <div className="relative inline-block mb-6">
                <div className="absolute -inset-4 rounded-full bg-[#00a884]/20 animate-ping opacity-60 pointer-events-none" />
                <div className="absolute -inset-2 rounded-full border-2 border-[#00a884]/50 animate-pulse pointer-events-none" />
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#00a884] shadow-2xl bg-[#202c33]">
                  <img
                    src={displayInfo?.avatar || defaultAvatar}
                    alt={displayInfo?.name || "Caller"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
                {displayInfo?.name || "WhatsApp Contact"}
              </h2>

              <p className="text-[#00a884] text-xs font-semibold tracking-widest uppercase mt-2 flex items-center justify-center gap-1.5">
                {callType === "video" ? (
                  <FaVideo className="text-xs" />
                ) : (
                  <FaPhone className="text-xs" />
                )}
                <span>WhatsApp {callType === "video" ? "Video" : "Voice"} Call</span>
              </p>

              <p className="text-[#8696a0] text-xs mt-3 flex items-center justify-center gap-1">
                <FaLock className="text-[#00a884] text-[10px]" />
                Ringing on your device...
              </p>
            </div>

            {/* Action Buttons: Decline and Accept */}
            <div className="flex items-center justify-center gap-16 sm:gap-20 mt-6">
              <button
                onClick={handleRejectCall}
                className="group flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-[#ea0038] hover:bg-[#d00032] flex items-center justify-center text-white shadow-xl shadow-[#ea0038]/30 transition-all duration-200 group-hover:scale-110 active:scale-95">
                  <FaPhoneSlash className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-[#8696a0] group-hover:text-white transition-colors">
                  Decline
                </span>
              </button>

              <button
                onClick={handleAnswerCall}
                className="group flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-[#00a884] hover:bg-[#02906f] flex items-center justify-center text-white shadow-xl shadow-[#00a884]/40 transition-all duration-200 group-hover:scale-110 active:scale-95 animate-pulse">
                  {callType === "video" ? (
                    <FaVideo className="w-6 h-6" />
                  ) : (
                    <FaPhone className="w-6 h-6" />
                  )}
                </div>
                <span className="text-xs font-medium text-[#8696a0] group-hover:text-white transition-colors">
                  Accept
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 2. WhatsApp Active Call Screen (Voice or Video) */}
        {shouldShowActiveCall && (
          <div className="relative w-full h-full bg-[#111b21] flex flex-col justify-between overflow-hidden">
            {/* Top WhatsApp Call Header Bar */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
              {/* Left: Status / Timer Pill */}
              <div className="flex items-center gap-2.5 shrink-0">
                {callStatus === "connected" ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#202c33]/85 border border-[#2a3942]/60 text-white backdrop-blur-md shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00a884] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00a884]"></span>
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#00a884] tracking-wider">
                      {formatTime(callTime)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#202c33]/85 border border-[#2a3942]/60 text-[#8696a0] text-xs font-medium backdrop-blur-md shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span className="capitalize">
                      {callStatus === "calling" ? "Calling..." : "Connecting..."}
                    </span>
                  </div>
                )}

                {isVideoCall && (
                  <div className="hidden sm:block text-white/90 text-sm font-semibold truncate max-w-[200px]">
                    {displayInfo?.name}
                  </div>
                )}
              </div>

              {/* Center: Official WhatsApp End-to-End Encryption Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#202c33]/85 border border-[#2a3942]/70 text-[11px] text-[#8696a0] font-medium backdrop-blur-md shadow-sm select-none shrink-0">
                <FaLock className="text-[#00a884] text-[10px]" />
                <span className="font-medium">End-to-end encrypted</span>
              </div>

              {/* Right: Window controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  className="p-2 rounded-full bg-[#202c33]/80 hover:bg-[#374248] text-[#8696a0] hover:text-white border border-[#2a3942]/50 transition-colors cursor-pointer"
                >
                  {isFullscreen ? (
                    <FaCompress className="size-3.5" />
                  ) : (
                    <FaExpand className="size-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remote Audio Track (Always active) */}
            <audio
              autoPlay
              ref={(audio) => {
                if (audio && remoteStream && audio.srcObject !== remoteStream) {
                  audio.srcObject = remoteStream;
                }
              }}
            />

            {/* Video Call Mode Remote Stream */}
            {callType === "video" && (
              <video
                ref={(video) => {
                  remoteVideoRef.current = video;
                  if (video && remoteStream && video.srcObject !== remoteStream) {
                    video.srcObject = remoteStream;
                  }
                }}
                autoPlay
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-700 ${
                  remoteStream ? "opacity-100" : "opacity-0"
                }`}
              />
            )}

            {/* Fallback Screen: When Voice Call OR Remote Video is not streaming */}
            {(!remoteStream || callType !== "video") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111b21] z-10 px-4">
                <div className="text-center flex flex-col items-center">
                  <div className="relative inline-block mb-6">
                    {/* Pulsing Ripple Wave for Voice/Active Call */}
                    {isAudioEnabled && (
                      <>
                        <div className="absolute -inset-6 rounded-full bg-[#00a884]/15 animate-ping opacity-40 pointer-events-none" />
                        <div className="absolute -inset-3 rounded-full border border-[#00a884]/30 animate-pulse pointer-events-none" />
                      </>
                    )}
                    <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-[#2a3942] shadow-2xl bg-[#202c33]">
                      <img
                        src={displayInfo?.avatar || defaultAvatar}
                        alt={displayInfo?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
                    {displayInfo?.name || "WhatsApp Contact"}
                  </h3>

                  <p className="text-sm font-medium text-[#8696a0] mt-2 capitalize tracking-wider flex items-center justify-center gap-2">
                    {callStatus === "connected" ? (
                      <span className="font-mono text-base font-semibold text-[#00a884]">
                        {formatTime(callTime)}
                      </span>
                    ) : callStatus === "calling" ? (
                      <span className="animate-pulse">Ringing...</span>
                    ) : (
                      <span className="animate-pulse">Connecting...</span>
                    )}
                  </p>

                  <div className="mt-5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#202c33]/70 border border-[#2a3942]/50 text-[#8696a0] text-xs">
                    <FaLock className="text-[#00a884] text-[10px]" />
                    <span>
                      {callType === "video"
                        ? "Waiting for video stream..."
                        : "End-to-end encrypted voice call"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Picture-in-Picture Local Video Preview (for Video Calls) */}
            {callType === "video" && localStream && (
              <div className="absolute top-18 right-5 sm:right-8 w-36 sm:w-44 h-48 sm:h-56 rounded-2xl overflow-hidden border-2 border-[#2a3942] shadow-2xl bg-[#202c33] z-20 group transition-transform duration-300 hover:scale-105">
                {isVideoEnabled ? (
                  <video
                    ref={(video) => {
                      localVideoRef.current = video;
                      if (video && localStream && video.srcObject !== localStream) {
                        video.srcObject = localStream;
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#202c33] text-[#8696a0] p-4 text-center">
                    <FaVideoSlash className="size-6 text-[#ea0038] mb-2" />
                    <span className="text-xs">Camera off</span>
                  </div>
                )}
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-medium text-white/90 select-none">
                  You
                </span>
              </div>
            )}

            {/* WhatsApp Signature Floating Control Dock (Bottom) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
              <div className="flex items-center gap-4 px-6 py-3.5 rounded-full bg-[#202c33]/95 backdrop-blur-xl border border-[#2a3942] shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
                {callStatus !== "connected" ? (
                  /* Cancel / Hangup button when calling */
                  <button
                    onClick={handleEndCall}
                    title="End call"
                    className="w-13 h-13 rounded-full bg-[#ea0038] hover:bg-[#d00032] flex items-center justify-center text-white shadow-xl shadow-[#ea0038]/40 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <FaPhoneSlash className="w-6 h-6" />
                  </button>
                ) : (
                  <>
                    {/* Microphone Mute / Unmute */}
                    <button
                      onClick={toggleAudio}
                      title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        isAudioEnabled
                          ? "bg-[#374248] hover:bg-[#4a555c] text-white"
                          : "bg-[#ea0038] text-white shadow-lg shadow-[#ea0038]/30"
                      }`}
                    >
                      {isAudioEnabled ? (
                        <FaMicrophone className="size-5" />
                      ) : (
                        <FaMicrophoneSlash className="size-5" />
                      )}
                    </button>

                    {/* Camera Video On / Off */}
                    {callType === "video" && (
                      <button
                        onClick={toggleVideo}
                        title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                          isVideoEnabled
                            ? "bg-[#374248] hover:bg-[#4a555c] text-white"
                            : "bg-[#ea0038] text-white shadow-lg shadow-[#ea0038]/30"
                        }`}
                      >
                        {isVideoEnabled ? (
                          <FaVideo className="size-5" />
                        ) : (
                          <FaVideoSlash className="size-5" />
                        )}
                      </button>
                    )}

                    {/* Screen Sharing Toggle (Video Call) */}
                    {callType === "video" && (
                      <button
                        onClick={toggleScreenShare}
                        title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                          isScreenSharing
                            ? "bg-[#00a884] text-white shadow-lg shadow-[#00a884]/30"
                            : "bg-[#374248] hover:bg-[#4a555c] text-white"
                        }`}
                      >
                        {isScreenSharing ? (
                          <LuScreenShareOff className="size-5" />
                        ) : (
                          <LuScreenShare className="size-5" />
                        )}
                      </button>
                    )}

                    {/* Hangup / End Call */}
                    <button
                      onClick={handleEndCall}
                      title="End call"
                      className="w-13 h-13 rounded-full bg-[#ea0038] hover:bg-[#d00032] flex items-center justify-center text-white shadow-xl shadow-[#ea0038]/40 transition-transform hover:scale-105 active:scale-95 cursor-pointer ml-1"
                    >
                      <FaPhoneSlash className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallModel;
