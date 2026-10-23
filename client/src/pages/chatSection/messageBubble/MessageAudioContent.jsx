import React from "react";
import { FaHeadphones } from "react-icons/fa";

export const MessageAudioContent = ({
  message,
  renderTimestampAndStatus,
}) => {
  return (
    <div className="flex flex-col gap-1 min-w-[240px] max-w-[320px] py-1">
      <div className="flex items-center gap-2 mb-1">
        <FaHeadphones className="text-amber-500 shrink-0" size={14} />
        <span className="text-xs font-medium opacity-75 truncate">
          {message.fileName || "Voice / Audio message"}
        </span>
      </div>
      <audio
        src={message.imageOrVideoUrl}
        controls
        className="w-full h-9 rounded-lg"
      />
      <div className="flex items-center justify-end mt-0.5 select-none">
        {renderTimestampAndStatus(false)}
      </div>
    </div>
  );
};

export default MessageAudioContent;
