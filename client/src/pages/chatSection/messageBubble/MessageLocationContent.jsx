import React, { useState, useEffect } from "react";
import {
  MdLocationOn,
  MdDirections,
  MdLock,
  MdOutlineTimer,
  MdOutlineHistory,
} from "react-icons/md";
import { FiExternalLink, FiEye } from "react-icons/fi";
import { RxCross2 } from "react-icons/rx";
import { useChatStore } from "../../../store/chatStore";
import formatTimestamp from "../../../utils/formatTime";

export const MessageLocationContent = ({
  message,
  isUserMessage,
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
  const hasCoords =
    lat !== undefined && lat !== null && lng !== undefined && lng !== null;

  const expiresDate = loc?.expiresAt ? new Date(loc.expiresAt) : null;
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!expiresDate) return null;
    return Math.max(0, Math.floor((expiresDate.getTime() - Date.now()) / 1000));
  });

  const [showLogsModal, setShowLogsModal] = useState(false);

  useEffect(() => {
    if (!expiresDate) return;
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((expiresDate.getTime() - Date.now()) / 1000),
      );
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [loc?.expiresAt]);

  const isExpired = Boolean(
    loc?.isExpired || (timeLeft !== null && timeLeft <= 0),
  );

  const maxAccesses =
    typeof loc?.maxAccesses === "number" && loc.maxAccesses > 0
      ? loc.maxAccesses
      : null;
  const accessCount =
    typeof loc?.accessCount === "number" ? loc.accessCount : 0;
  const accessLogs = Array.isArray(loc?.accessLogs) ? loc.accessLogs : [];
  const isLimitReached = Boolean(
    loc?.isLimitReached || (maxAccesses !== null && accessCount >= maxAccesses),
  );

  const isBlocked = isExpired || isLimitReached;

  const formatCountdown = (totalSec) => {
    if (totalSec <= 0) return "Expired";
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : "#";

  const handleOpenMap = (e) => {
    if (isBlocked) {
      e.preventDefault();
      return;
    }
    if (!isUserMessage) {
      const { recordLocationAccess } = useChatStore.getState();
      if (typeof recordLocationAccess === "function") {
        recordLocationAccess(message._id);
      }
    }
  };

  const handleStopSharing = async () => {
    const { revokeLocationSharing } = useChatStore.getState();
    if (typeof revokeLocationSharing === "function") {
      await revokeLocationSharing(message._id);
    }
  };

  return (
    <div className="flex flex-col min-w-[270px] max-w-[340px] w-full select-none">
      {(loc?.expiresAt || maxAccesses !== null || accessCount > 0) && (
        <div className="flex items-center justify-between gap-1.5 px-1 pb-1.5 text-[11px]">
          {loc?.expiresAt ? (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${isExpired
              ? "bg-rose-500/15 text-rose-500 border border-rose-500/20"
              : "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20"
              }`}
            >
              <MdOutlineTimer className="w-3.5 h-3.5" />
              <span>
                {isExpired ? "Expired" : formatCountdown(timeLeft)}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-medium opacity-80">
              <MdOutlineTimer className="w-3 h-3" />
              <span>Live Location</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => isUserMessage && setShowLogsModal(true)}
            title={
              isUserMessage
                ? "Click to see who accessed your location"
                : `${accessCount} access${accessCount === 1 ? "" : "es"}`
            }
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium transition-all ${isUserMessage
              ? "cursor-pointer hover:scale-105 active:scale-95"
              : "cursor-default"
              } ${isLimitReached
                ? "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                : maxAccesses === 1
                  ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                  : "bg-blue-500/15 text-blue-500 border border-blue-500/20"
              }`}
          >
            <FiEye className="w-3 h-3" />
            <span>
              {maxAccesses
                ? `${accessCount}/${maxAccesses} views`
                : `${accessCount} ${accessCount === 1 ? "view" : "views"}`}
            </span>
            {isUserMessage && (
              <span className="text-[9px] underline opacity-70 ml-0.5">
                Logs
              </span>
            )}
          </button>
        </div>
      )}

      {hasCoords ? (
        <div className="relative w-full h-[155px] rounded-xl overflow-hidden block border border-black/10 dark:border-white/10">
          <iframe
            title="Location Map"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.004}%2C${lng + 0.005}%2C${lat + 0.004}&layer=mapnik&marker=${lat}%2C${lng}`}
            className={`w-full h-full pointer-events-none transition-all duration-300 ${isBlocked ? "filter blur-md scale-110 opacity-30" : "scale-105"
              }`}
          />

          {!isBlocked ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenMap}
              className="absolute inset-0 group cursor-pointer"
            >
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
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center text-center p-3 select-none">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-1.5 shadow-lg">
                <MdLock size={20} />
              </div>
              <p className="text-xs font-bold text-white leading-tight">
                {isExpired ? "Location Expired" : "Access Limit Reached"}
              </p>
              <p className="text-[10px] text-gray-300 mt-0.5 line-clamp-2 max-w-[220px]">
                {isExpired
                  ? "Sharing duration ended. Location coordinate access is locked."
                  : `Accessed ${accessCount}/${maxAccesses} times. Further access disabled for privacy.`}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-24 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
          <MdLocationOn size={36} />
        </div>
      )}

      <div className="pt-2 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-[14.5px] font-bold leading-tight break-words">
              {loc?.name || message.content || "Live Location"}
            </h4>
            {loc?.address && (
              <p
                className={`text-[11.5px] font-normal mt-0.5 break-words line-clamp-2 ${isDark ? "text-white/70" : "text-gray-600"
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
            {!isBlocked ? (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenMap}
                className="w-full py-2 px-3 text-center text-[13.5px] font-semibold text-[#00a884] dark:text-[#25d366] hover:bg-black/5 dark:hover:bg-white/5 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MdDirections size={18} />
                <span>Get Directions</span>
              </a>
            ) : (
              <div className="w-full py-2 px-3 text-center text-[12px] font-medium text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5 select-none opacity-80">
                <MdLock size={15} />
                <span>
                  {isExpired ? "Sharing Ended" : "Max Views Reached"}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end mt-2 pt-0.5 text-[11px] opacity-75">
          {renderTimestampAndStatus(false)}
        </div>
      </div>

      {showLogsModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center px-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowLogsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-4.5 flex flex-col max-h-[85vh] ${isDark
              ? "bg-[#111b21] border-[#313d45] text-white"
              : "bg-white border-gray-200 text-gray-900"
              }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <MdOutlineHistory size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] leading-tight">
                    Location Access Log
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Real-time access audit & privacy
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLogsModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <RxCross2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 my-3">
              <div className={`p-2.5 rounded-xl border ${isDark ? "bg-[#202c33]/50 border-white/5" : "bg-gray-50 border-black/5"
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 block mb-0.5">
                  Times Accessed
                </span>
                <span className="text-base font-extrabold text-blue-500">
                  {accessCount}{" "}
                  <span className="text-xs font-normal opacity-70">
                    / {maxAccesses ? `${maxAccesses} allowed` : "unlimited"}
                  </span>
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border ${isDark ? "bg-[#202c33]/50 border-white/5" : "bg-gray-50 border-black/5"
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 block mb-0.5">
                  Time Remaining
                </span>
                <span
                  className={`text-sm font-bold ${isExpired ? "text-rose-400" : "text-emerald-500"
                    }`}
                >
                  {loc?.expiresAt
                    ? isExpired
                      ? "Expired"
                      : formatCountdown(timeLeft)
                    : "No Limit"}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-1 max-h-56 pr-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Access History ({accessLogs.length})
              </p>
              {accessLogs.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  <FiEye className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                  No recipient has accessed this location yet.
                </div>
              ) : (
                accessLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs border ${isDark
                      ? "bg-[#202c33] border-white/5"
                      : "bg-gray-50 border-black/5"
                      }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                        {log.username?.[0]?.toUpperCase() || "U"}
                      </div>
                      <span className="font-medium truncate">
                        {log.username || "Recipient"}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                      {formatTimestamp(log.accessedAt)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {!isExpired && (
              <div className="pt-3 border-t border-black/10 dark:border-white/10 mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await handleStopSharing();
                    setShowLogsModal(false);
                  }}
                  className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  Stop Sharing Location Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageLocationContent;
