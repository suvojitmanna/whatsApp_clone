import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const useVideoCallStore = create(
  subscribeWithSelector((set, get) => ({
    currentCall: null,
    incomingCall: null,
    isCallActive: false,
    callType: null,
    localStream: null,
    remoteStream: null,
    remoteStreams: {},
    remoteStreamsVersion: 0,
    isVideoEnabled: true,
    isAudioEnabled: true,
    peerConnection: null,
    iceCandidatesQueue: [],
    isCallModalOpen: false,
    callStatus: "idle",
    isInitiator: false,
    activeGroupCall: null,
    groupParticipants: [],
    setIsInitiator: (isInitiator) => {
      set({ isInitiator: Boolean(isInitiator) });
    },
    setCurrentCall: (call) => {
      set({ currentCall: call });
    },
    setIncomingCall: (call) => {
      set({ incomingCall: call });
    },
    setCallActive: (active) => {
      set({ isCallActive: active });
    },
    setCallType: (type) => {
      set({ callType: type });
    },
    setLocalStream: (stream) => {
      set({ localStream: stream });
    },
    setRemoteStream: (stream) => {
      set({ remoteStream: stream });
    },
    setRemoteStreamForUser: (userId, stream) => {
      if (!userId) return;
      const strId = userId.toString();
      const current = { ...get().remoteStreams };
      if (stream) {
        current[strId] = stream;
      } else {
        delete current[strId];
      }
      set({
        remoteStreams: current,
        remoteStreamsVersion: get().remoteStreamsVersion + 1,
      });
    },
    removeRemoteStreamForUser: (userId) => {
      if (!userId) return;
      const strId = userId.toString();
      const current = { ...get().remoteStreams };
      delete current[strId];
      set({
        remoteStreams: current,
        remoteStreamsVersion: get().remoteStreamsVersion + 1,
      });
    },
    clearRemoteStreams: () => {
      set({ remoteStreams: {}, remoteStreamsVersion: 0 });
    },
    setActiveGroupCall: (call) => {
      set({ activeGroupCall: call });
    },
    setGroupParticipants: (participants) => {
      set({
        groupParticipants: Array.isArray(participants) ? participants : [],
      });
    },
    addGroupParticipant: (participant) => {
      if (!participant?.userId) return;
      const pId = participant.userId.toString();
      const current = get().groupParticipants || [];
      const exists = current.some((p) => p.userId?.toString() === pId);
      if (!exists) {
        set({ groupParticipants: [...current, participant] });
      }
    },
    removeGroupParticipant: (userId) => {
      if (!userId) return;
      const strId = userId.toString();
      const current = get().groupParticipants || [];
      set({
        groupParticipants: current.filter(
          (p) => p.userId?.toString() !== strId,
        ),
      });
    },
    setPeerConnection: (pc) => {
      set({ peerConnection: pc });
    },
    setCallModalOpen: (open) => {
      set({ isCallModalOpen: open });
    },
    setCallStatus: (status) => {
      set({ callStatus: status });
    },
    addIceCandidate: (candidate) => {
      const { iceCandidatesQueue } = get();
      set({ iceCandidatesQueue: [...iceCandidatesQueue, candidate] });
    },
    processQueuedIceCandidates: async () => {
      const { peerConnection, iceCandidatesQueue } = get();
      if (
        peerConnection &&
        peerConnection.remoteDescription &&
        iceCandidatesQueue.length > 0
      ) {
        for (const candidate of iceCandidatesQueue) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate),
            );
          } catch (error) {
            console.error("ICE candidate error", error);
          }
        }
        set({ iceCandidatesQueue: [] });
      }
    },
    toggleVideo: () => {
      const { localStream, isVideoEnabled } = get();
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !isVideoEnabled;
          set({ isVideoEnabled: !isVideoEnabled });
        }
      }
    },
    toggleAudio: () => {
      const { localStream, isAudioEnabled } = get();
      if (!localStream) return;
      const enabled = !isAudioEnabled;
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
      set({ isAudioEnabled: enabled });
    },
    endCall: () => {
      const { localStream, peerConnection } = get();

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (peerConnection) {
        peerConnection.close();
      }
      set({
        currentCall: null,
        incomingCall: null,
        isCallActive: false,
        callType: null,
        localStream: null,
        remoteStream: null,
        remoteStreams: {},
        remoteStreamsVersion: 0,
        isVideoEnabled: true,
        isAudioEnabled: true,
        peerConnection: null,
        iceCandidatesQueue: [],
        isCallModalOpen: false,
        callStatus: "idle",
        isInitiator: false,
        activeGroupCall: null,
        groupParticipants: [],
      });
    },
    clearIncomingCall: () => {
      set({ incomingCall: null });
    },
  })),
);

export default useVideoCallStore;
