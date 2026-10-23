import React, { useState } from "react";
import { FaVideo } from "react-icons/fa";
import { formatVideoDuration } from "./helpers";

export const VideoThumbnail = ({ src, item }) => {
  const [duration, setDuration] = useState(item.duration || null);

  const handleMetadata = (e) => {
    if (e.target.duration && !isNaN(e.target.duration) && isFinite(e.target.duration)) {
      setDuration(Math.round(e.target.duration));
    }
  };

  const durStr = duration ? formatVideoDuration(duration) : item.durationStr || "0:20";

  return (
    <>
      <video
        src={src}
        preload="metadata"
        onLoadedMetadata={handleMetadata}
        className="w-full h-full object-cover pointer-events-none"
        muted
      />
      {durStr && (
        <div className="flex items-center gap-1.5 text-white text-[11px] font-medium drop-shadow-md">
          <FaVideo size={10} className="text-white/90 shrink-0" />
          <span>{durStr}</span>
        </div>
      )}
    </>
  );
};

export default VideoThumbnail;
