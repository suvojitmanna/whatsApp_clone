import React, { useEffect, useRef, useState, useCallback } from "react";
import { RxCross2 } from "react-icons/rx";
import { FaSync } from "react-icons/fa";

const CameraModal = ({ onClose, onCapture }) => {
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const pressTimer = useRef(null);
  const isLongPress = useRef(false);

  // State
  const [facingMode, setFacingMode] = useState("environment");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [flash, setFlash] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  //CAMERA ENGINE

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Please allow camera and microphone access.");
    }
  }, [facingMode, stopCamera]);

  //RECORDING LOGIC

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], `video_${Date.now()}.webm`, {
        type: "video/webm",
      });
      onCapture(file);
      handleClose();
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // PHOTO LOGIC

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Mirror if using front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        const file = new File([blob], `photo_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
        handleClose();
      },
      "image/jpeg",
      0.9,
    );
  };

  // INTERACTION HANDLERS

  const handlePressStart = (e) => {
    e.preventDefault();
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      startRecording();
    }, 400);
  };

  const handlePressEnd = (e) => {
    e.preventDefault();
    clearTimeout(pressTimer.current);
    if (isLongPress.current) {
      stopRecording();
    } else if (!isRecording) {
      capturePhoto();
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center font-sans select-none overflow-hidden">
      {flash && (
        <div className="absolute inset-0 bg-white z-[300] animate-pulse" />
      )}

      <div className="absolute top-0 w-full flex justify-between items-start p-6 z-50 pt-10 px-8">
        <button
          onClick={handleClose}
          className="p-3 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 text-white hover:bg-black/50 transition-all shadow-xl active:scale-90"
        >
          <RxCross2 size={22} />
        </button>

        <div className="flex flex-col items-center mt-2">
          <div
            className={`px-4 py-1.5 rounded-full border ${
              isRecording
                ? "border-red-500 bg-red-500/20"
                : "border-white/10 bg-black/40"
            } backdrop-blur-md transition-colors shadow-lg`}
          >
            <span
              className={`text-[10px] uppercase tracking-[0.2em] font-bold ${
                isRecording ? "text-red-500" : "text-white"
              }`}
            >
              {isRecording ? "Recording" : "Photo Mode"}
            </span>
          </div>
          {isRecording && (
            <span className="text-white font-mono text-xl mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {formatTime(recordingTime)}
            </span>
          )}
        </div>

        <button
          onClick={() =>
            setFacingMode((prev) =>
              prev === "environment" ? "user" : "environment",
            )
          }
          className="p-3 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 text-white hover:bg-black/50 transition-all shadow-xl active:rotate-180 duration-500"
        >
          <FaSync size={20} className={isCameraReady ? "" : "animate-spin"} />
        </button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center bg-[#0a0a0a]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-700 ${isCameraReady ? "opacity-100" : "opacity-0"} ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
        />

        {!isRecording && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border-[0.5px] border-white/50" />
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 w-full pb-10 pt-20 flex flex-col items-center gap-6 z-50">
        <div className="flex gap-8 text-[11px] font-black uppercase tracking-[0.3em] drop-shadow-lg">
          <span className={isRecording ? "text-white/30" : "text-yellow-400"}>
            Photo
          </span>
          <span className={isRecording ? "text-red-500" : "text-white/30"}>
            Video
          </span>
        </div>

        <div className="relative flex items-center justify-center">
          {isRecording && (
            <div className="absolute w-28 h-28 rounded-full border-2 border-red-600 animate-ping opacity-60" />
          )}

          <button
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            className={`
              relative z-10 w-20 h-20 rounded-full border-4 transition-all duration-500 flex items-center justify-center bg-black/10 backdrop-blur-sm shadow-2xl
              ${isRecording ? "border-red-500 scale-110" : "border-white hover:scale-105 active:scale-95"}
            `}
          >
            <div
              className={`
                transition-all duration-300
                ${
                  isRecording
                    ? "w-8 h-8 bg-red-500 rounded-sm shadow-inner"
                    : "w-16 h-16 bg-white rounded-full shadow-lg"
                }
              `}
            />
          </button>
        </div>

        <p className="text-white/60 text-[10px] font-medium tracking-widest uppercase drop-shadow-lg">
          {isRecording ? "Release to Finish" : "Tap for Photo • Hold for Video"}
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraModal;
