import React, { useEffect, useRef, useState, useCallback } from "react";
import { RxCross2 } from "react-icons/rx";
import { FaCamera, FaSync } from "react-icons/fa";

const CameraModal = ({ onClose, onCapture, fullScreen = false }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isClosingRef = useRef(false);

  const [facingMode, setFacingMode] = useState("user");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Check if device has more than one camera
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices?.()
      .then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
      })
      .catch(() => {});
  }, []);

  // Safe track stopper that releases camera hardware immediately
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.error("Error stopping track:", e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }, []);

  const handleClose = useCallback(() => {
    isClosingRef.current = true;
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // Handle stream initialization with retry and cancellation guard
  useEffect(() => {
    let isCancelled = false;
    let localStream = null;

    const startStream = async () => {
      setError(null);
      setIsCameraReady(false);

      // Clean up previous stream tracks if any remain
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {}
        });
        streamRef.current = null;
      }

      const targetConstraints = facingMode
        ? {
            video: {
              facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          }
        : { video: true, audio: false };

      let stream = null;

      // Retry up to 3 times to gracefully wait if Windows webcam driver is releasing previous lock
      for (let attempt = 0; attempt < 3; attempt++) {
        if (isCancelled || isClosingRef.current) return;
        try {
          stream = await navigator.mediaDevices.getUserMedia(targetConstraints);
          break;
        } catch (err) {
          console.warn(`Camera attempt ${attempt + 1} failed:`, err.name, err.message);

          // If overconstrained on desktop/laptop, immediately try basic video
          if (
            err.name === "OverconstrainedError" ||
            err.name === "ConstraintNotSatisfiedError"
          ) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
              break;
            } catch (fallbackErr) {
              console.warn("Fallback to basic video also failed:", fallbackErr);
            }
          }

          // If device is busy or just closed, pause briefly before retrying
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 250));
          } else {
            // Final fallback to any video input
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
              break;
            } catch (finalErr) {
              if (!isCancelled && !isClosingRef.current) {
                console.error("All camera attempts failed:", finalErr);
                setError(
                  "Unable to access camera. Please check permissions or wait a moment."
                );
              }
              return;
            }
          }
        }
      }

      // If modal was closed while getUserMedia was resolving, stop tracks immediately
      if (isCancelled || isClosingRef.current) {
        if (stream) {
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (e) {}
          });
        }
        return;
      }

      if (!stream) return;

      localStream = stream;
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Video play error (will autoplay on metadata):", playErr);
        }
      }
    };

    startStream();

    return () => {
      isCancelled = true;
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {}
        });
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {}
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraReady(false);
    };
  }, [facingMode, retryTrigger]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !isCameraReady || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    setFlash(true);
    setTimeout(() => setFlash(false), 120);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        isClosingRef.current = true;
        stopCamera();
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div
      className={`${
        fullScreen ? "fixed inset-0 z-[200]" : "absolute inset-0 z-50"
      } bg-[#111b21] flex flex-col justify-between font-sans select-none overflow-hidden`}
    >
      {flash && (
        <div className="absolute inset-0 bg-white z-[300] pointer-events-none animate-pulse" />
      )}

      {/* WhatsApp Web Style Header */}
      <header className="h-[60px] px-4 sm:px-6 flex items-center justify-between border-b border-[#222d34] bg-[#111b21] shrink-0 z-50">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={handleClose}
            className="p-2 -ml-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <RxCross2 size={22} />
          </button>
          <span className="text-white text-base sm:text-lg font-medium tracking-tight">
            Take photo
          </span>
        </div>

        {hasMultipleCameras && (
          <button
            onClick={() =>
              setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
            }
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Switch Camera"
          >
            <FaSync size={18} />
          </button>
        )}
      </header>

      {/* Centered Video Stream in Chat Window */}
      <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
        {error ? (
          <div className="text-center px-6 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <FaCamera size={26} />
            </div>
            <p className="text-gray-200 text-sm mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setRetryTrigger((prev) => prev + 1);
              }}
              className="px-4 py-2 bg-[#00a884] hover:bg-[#02906f] text-white text-xs font-semibold rounded-full transition-colors cursor-pointer"
            >
              Retry Camera
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                videoRef.current?.play().catch(() => {});
                setIsCameraReady(true);
              }}
              onCanPlay={() => {
                setIsCameraReady(true);
              }}
              className={`w-full h-full max-h-[calc(100vh-160px)] md:max-w-4xl object-contain transition-opacity duration-300 ${
                isCameraReady ? "opacity-100" : "opacity-0"
              } ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            />

            {!isCameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                <div className="w-10 h-10 border-3 border-[#00a884] border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs tracking-wider uppercase font-medium">
                  Starting camera...
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* WhatsApp Web Style Bottom Bar with Round Green Shutter Button */}
      <footer className="h-[90px] flex items-center justify-center bg-[#111b21] border-t border-[#222d34] shrink-0 z-50">
        <button
          onClick={capturePhoto}
          disabled={!isCameraReady}
          className={`w-14 h-14 rounded-full bg-[#00a884] hover:bg-[#02906f] active:scale-90 text-white flex items-center justify-center shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
          title="Take Photo"
        >
          <FaCamera size={22} />
        </button>
      </footer>
    </div>
  );
};

export default CameraModal;
