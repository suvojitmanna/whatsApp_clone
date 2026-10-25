import React from "react";
import { MdLocationOn, MdDirections } from "react-icons/md";
import { FiExternalLink } from "react-icons/fi";

export const MessageLocationContent = ({
  message,
  isUserMessage,
  effectiveUser,
  isDark,
  renderTimestampAndStatus,
}) => {
  let loc = message.locationData;
  if (typeof loc === "string") {
    try {
      loc = JSON.parse(loc);
    } catch (e) {
      loc = null;
    }
  }

  const lat = loc?.latitude;
  const lng = loc?.longitude;
  const hasCoords = lat !== undefined && lat !== null && lng !== undefined && lng !== null;

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : "#";

  return (
    <div className="flex flex-col min-w-[260px] max-w-[320px] w-full select-none">
      {hasCoords ? (
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-full h-[150px] rounded-xl overflow-hidden block group cursor-pointer border border-black/10 dark:border-white/10"
        >
          <iframe
            title="Location Map"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.004}%2C${lng + 0.005}%2C${lat + 0.004}&layer=mapnik&marker=${lat}%2C${lng}`}
            className="w-full h-full pointer-events-none scale-105 group-hover:scale-110 transition-transform duration-300"
          />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-10 h-10 rounded-full bg-red-500/30 animate-ping" />
              <div className="relative w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                <MdLocationOn size={18} />
              </div>
            </div>
          </div>

          <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md px-2 py-1 rounded-lg text-[11px] text-white flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
            <span>View Map</span>
            <FiExternalLink size={11} />
          </div>
        </a>
      ) : (
        <div className="w-full h-24 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
          <MdLocationOn size={36} />
        </div>
      )}

      <div className="pt-2 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-[15px] font-bold leading-tight break-words">
              {loc?.name || message.content || "Live Location"}
            </h4>
            {loc?.address && (
              <p
                className={`text-[12px] font-normal mt-0.5 break-words line-clamp-2 ${isDark ? "text-white/70" : "text-gray-600"
                  }`}
              >
                {loc.address}
              </p>
            )}
          </div>
        </div>

        {hasCoords && (
          <div
            className={`border-t -mx-[9px] -mb-[7px] mt-2.5 rounded-b-[7.5px] overflow-hidden ${isDark ? "border-white/10" : "border-black/10"
              }`}
          >
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 text-center text-[14px] font-medium text-[#00a884] dark:text-[#25d366] hover:bg-black/5 dark:hover:bg-white/5 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MdDirections size={18} />
              <span>Get Directions</span>
            </a>
          </div>
        )}

        <div className="flex items-center justify-end mt-2 pt-0.5 text-[11px] opacity-75">
          {renderTimestampAndStatus(false)}
        </div>
      </div>
    </div>
  );
};

export default MessageLocationContent;
