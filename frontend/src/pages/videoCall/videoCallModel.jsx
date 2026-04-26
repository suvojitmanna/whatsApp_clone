import React, { useEffect, useMemo, useRef } from "react";
import useVideoCallStore from "../../store/videoCallStore";
import useUserStore from "../../store/useUserStore";
import useThemeStore from "../../store/themeStore";
import { LuScreenShare, LuScreenShareOff } from "react-icons/lu";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneSlash,
  FaTimes,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";

const VideoCallModel = ({ socket }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callTime, setCallTime] = React.useState(0);
  const [isScreenSharing, setIsScreenSharing] = React.useState(false);
  const [cameraStream, setCameraStream] = React.useState(null);

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

  //Memorize display the user info and it is prevent the unnecessary re-render
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

  //Connection Detection
  useEffect(() => {
    if (peerConnection && remoteStream) {
      console.log("both peer connection ");
      setCallStatus("connected");
      setCallActive(true);
    }
  }, [peerConnection, remoteStream, setCallStatus, setCallActive]);

  //setup local video stream when local stream change
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  //setup the remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  //Timer function
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

  //Initialize media stream
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

      //STOP SCREEN SHARE
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

      //START SCREEN SHARE
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const screenTrack = screenStream.getVideoTracks()[0];

      if (sender) {
        sender.replaceTrack(screenTrack);
      }

      setLocalStream(screenStream);
      setIsScreenSharing(true);

      //ONLY switch back when screen ENDS
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

  //create peer connection
  const createPeerConnection = (stream, role) => {
    const pc = new RTCPeerConnection(rtcConfiguration);

    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log(`${role} adding ${track.kind} track`, track.id.slice(0, 8));
        pc.addTrack(track, stream);
      });
    }

    // handle ice candidates
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

    // handle remote stream
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

      if (["failed", "disconnected"].includes(pc.connectionState)) {
        setCallStatus("failed");
        setTimeout(handleEndCall, 2000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`role: ${role} :ICE state`, pc.iceConnectionState);
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

  //Receiver : Answer Call
  const handleAnswerCall = async () => {
    try {
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
      });

      clearIncomingCall();
    } catch (error) {
      console.error("Receiver Error", error);
      handleEndCall();
    }
  };

  // Reject call
  const handleRejectCall = () => {
    if (incomingCall) {
      socket.emit("reject_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
      });
    }
    endCall();
  };

  const cleanupCall = () => {
    //stop sender tracks
    if (peerConnection) {
      peerConnection.getSenders().forEach((s) => {
        if (s.track) s.track.stop();
        s.replaceTrack(null);
      });
    }

    //stop screen stream
    if (isScreenSharing && localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }

    //stop camera stream (IMPORTANT)
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }

    //fallback
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
    setCallType(null);

    endCall();
  };

  //Handle end call
  const handleEndCall = () => {
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

  // Time format function
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = ({ receiverName }) => {
      if (currentCall) {
        setTimeout(() => {
          initializeCallerCall();
        }, 500);
      }
    };

    const handleCallRejected = () => {
      setCallStatus("rejected");
      setTimeout(endCall, 2000);
    };

    const handleCallEnded = () => {
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

    // receiver answer (caller)
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

    // Receiver ICE candidate
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

    // register all event listener
    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);
    socket.on("webrtc_offer", handleWebRTCOffer);
    socket.on("webrtc_answer", handleWebRTCAnswer);
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidates);
    console.log("socket listener registered");

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-2xl p-4">
      <div
        className={`relative w-full h-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.6)] ${
          theme === "dark"
            ? "bg-gradient-to-br from-gray-900/90 via-black/80 to-gray-900/90"
            : "bg-white/90"
        }`}
      >
        {/*BACKGROUND GLOW */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full top-[-100px] left-[-100px] animate-pulse"></div>
          <div className="absolute w-[400px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full bottom-[-100px] right-[-100px] animate-pulse"></div>
        </div>

        {/* ================= INCOMING CALL ================= */}
        {incomingCall && !isCallActive && (
          <div className="flex flex-col items-center justify-center h-full p-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-12">
              {/* Avatar Glow */}
              <div className="relative inline-block mb-6">
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative w-36 h-36 rounded-full border-4 border-white/20 overflow-hidden shadow-xl">
                  <img
                    src={displayInfo?.avatar}
                    alt={displayInfo?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-black mb-2">
                {displayInfo?.name}
              </h2>

              <p className="text-emerald-400 text-xs tracking-[0.3em] uppercase animate-pulse">
                Incoming {callType} call...
              </p>
            </div>

            <div className="flex space-x-12">
              {/* Reject */}
              <button
                onClick={handleRejectCall}
                className="group flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/40 transition-all duration-200 hover:scale-110 active:scale-90">
                  <FaPhoneSlash className="w-6 h-6" />
                </div>
                <span className="text-xs text-gray-400">Decline</span>
              </button>

              {/* Accept */}
              <button
                onClick={handleAnswerCall}
                className="group flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/40 transition-all duration-200 hover:scale-110 active:scale-90">
                  <FaVideo className="w-6 h-6" />
                </div>
                <span className="text-xs text-gray-400">Accept</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= ACTIVE CALL ================= */}
        {shouldShowActiveCall && (
          <div className="relative w-full h-full bg-black">
            {/* Remote Video */}
            {callType === "video" && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover transition-all duration-1000 ${
                  remoteStream ? "opacity-100 scale-100" : "opacity-0 scale-110"
                }`}
              />
            )}

            {/* AUDIO (IMPORTANT) */}
            <audio
              autoPlay
              ref={(audio) => {
                if (audio && remoteStream) {
                  audio.srcObject = remoteStream;
                }
              }}
            />

            {/* Avatar fallback */}
            {(!remoteStream || callType !== "video") && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <img
                      src={displayInfo.avatar}
                      className="w-full h-full rounded-full object-cover"
                    />
                    {isAudioEnabled && (
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-40"></div>
                    )}
                  </div>

                  <p className="text-white text-xl font-semibold">
                    {displayInfo?.name}
                  </p>
                  <p className="text-white/40 text-sm mt-2 uppercase tracking-[0.3em]">
                    {callStatus}
                  </p>
                </div>
              </div>
            )}

            {/* Local Video */}
            {callType === "video" && localStream && (
              <div className="absolute top-6 right-6 w-40 h-52 rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              </div>
            )}

            {/* Status */}
            <div className="absolute top-6 left-6">
              <div className="px-4 py-2 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500">
                <div className="flex items-center gap-3">
                  {/* Live Status Indicator */}
                  <div className="flex items-center gap-2">
                    {callStatus === "connected" && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.2em] ${callStatus === "connected" ? "text-red-400" : "text-white/70"}`}
                    >
                      {callStatus === "connected" ? "Live" : callStatus}
                    </p>
                  </div>

                  {/* Divider - Only shows when connected */}
                  {callStatus === "connected" && (
                    <div className="h-3 w-[1px] bg-white/20"></div>
                  )}

                  {/* Call Timer */}
                  {callStatus === "connected" && (
                    <p className="text-[11px] text-white/90 font-mono font-medium tabular-nums tracking-wider">
                      {formatTime(callTime)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
              <div className="flex items-center space-x-6 px-8 py-4 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
                {/*When NOT connected → only End Call */}
                {callStatus !== "connected" ? (
                  <button
                    onClick={handleEndCall}
                    className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/50 transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer"
                  >
                    <FaPhoneSlash className="w-7 h-7" />
                  </button>
                ) : (
                  <>
                    {/* Video */}
                    {callType === "video" && (
                      <button
                        onClick={toggleVideo}
                        className={`group relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer overflow-hidden ${
                          isVideoEnabled
                            ? "hover:bg-green-600/20 hover:border-green-400/50 hover:shadow-[0_0_20px_rgba(37,99,235,0. 2)] border text-white"
                            : "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] border border-red-400/50"
                        }`}
                      >
                        {/* Subtle inner light effect for premium depth */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative transform transition-transform duration-300 group-hover:scale-110">
                          {isVideoEnabled ? (
                            <FaVideo className="size-5" />
                          ) : (
                            <FaVideoSlash className="size-5" />
                          )}
                        </div>
                      </button>
                    )}

                    {/* Share Screen */}
                    {callType === "video" && (
                      <button
                        onClick={toggleScreenShare}
                        className={`group relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer overflow-hidden ${
                          isScreenSharing
                            ? "bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)] border border-emerald-300/50"
                            : " hover:bg-blue-600/20 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(37,99,235,0.2)] border text-white"
                        }`}
                        title={
                          isScreenSharing ? "Stop Sharing" : "Share Screen"
                        }
                      >
                        {/* Background pulse for active sharing */}
                        {isScreenSharing && (
                          <span className="absolute inset-0 rounded-2xl bg-emerald-400 animate-pulse opacity-20" />
                        )}

                        <div className="relative transition-all duration-300 group-hover:scale-110">
                          {isScreenSharing ? (
                            <LuScreenShareOff className="text-xl" />
                          ) : (
                            <LuScreenShare className="text-xl" />
                          )}
                        </div>

                        {/* Premium indicator dot */}
                        {isScreenSharing && (
                          <span className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                        )}
                      </button>
                    )}

                    {/* Audio */}
                    <button
                      onClick={toggleAudio}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer ${
                        isAudioEnabled
                          ? "bg-white/10 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {isAudioEnabled ? (
                        <FaMicrophone className="size-5" />
                      ) : (
                        <FaMicrophoneSlash className="size-5" />
                      )}
                    </button>

                    {/* End */}
                    <button
                      onClick={handleEndCall}
                      className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/50 transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer"
                    >
                      <FaPhoneSlash className="w-7 h-7" />
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
