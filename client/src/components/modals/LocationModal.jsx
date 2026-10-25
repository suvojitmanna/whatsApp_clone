import React, { useState } from "react";
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { MdLocationOn, MdMyLocation, MdMap, MdOutlineTimer, MdVisibility } from "react-icons/md";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { toast } from "react-toastify";

const DURATION_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "1 hour", value: 60 },
  { label: "8 hours", value: 480 },
  { label: "24 hours", value: 1440 },
  { label: "Always", value: null },
];

const ACCESS_LIMIT_OPTIONS = [
  { label: "1 View (View-Once)", value: 1 },
  { label: "3 Views", value: 3 },
  { label: "5 Views", value: 5 },
  { label: "10 Views", value: 10 },
  { label: "Unlimited", value: null },
];

export const LocationModal = ({ isOpen = true, onClose, onSend, theme = "dark" }) => {
  const isDark = theme === "dark";

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxAccesses, setMaxAccesses] = useState(null);
  const [loadingGps, setLoadingGps] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);

        setLatitude(lat);
        setLongitude(lng);
        setAccuracy(acc);
        setLoadingGps(false);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          if (data && data.display_name) {
            const parts = data.display_name.split(",");
            const titleGuess = parts[0]?.trim();
            if (!placeName) setPlaceName(titleGuess || "My Location");
            setAddress(data.display_name);
          } else if (!placeName) {
            setPlaceName("Live Location");
          }
        } catch {
          if (!placeName) setPlaceName("Live Location");
        }
      },
      (err) => {
        setLoadingGps(false);
        console.error("GPS error:", err);
        toast.error(
          err.code === 1
            ? "Location permission denied. Please allow location access in your browser."
            : "Could not retrieve your location. Try again or enter coordinates manually.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (latitude === null || longitude === null) {
      toast.error("Please fetch or enter your location coordinates");
      return;
    }

    const durationMs = durationMinutes ? durationMinutes * 60 * 1000 : null;
    const expiresAt = durationMs
      ? new Date(Date.now() + durationMs).toISOString()
      : null;

    const locData = {
      name: placeName.trim() || "Live Location",
      address: address.trim() || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy || null,
      timestamp: new Date().toISOString(),
      durationMinutes,
      expiresAt,
      maxAccesses,
      accessCount: 0,
      accessLogs: [],
    };

    onSend(locData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 backdrop-blur-md transition-all ${isDark ? "bg-black/75" : "bg-black/40"
        }`}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl flex flex-col max-h-[92vh] ${isDark
          ? "bg-[#111b21] border-white/10 text-white"
          : "bg-white border-black/10 text-gray-900"
          }`}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-[#00a884] to-teal-500 shrink-0" />
        <div className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${isDark ? "border-white/10 bg-[#202c33]/50" : "border-black/5 bg-gray-50"}`} >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-inner">
              <MdLocationOn size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[16px] leading-tight">
                  Share Location
                </h3>
                {latitude !== null && longitude !== null && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    GPS Signal
                  </span>
                )}
              </div>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Send real-time GPS location or custom landmark
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
              ? "hover:bg-white/10 text-gray-400 hover:text-white"
              : "hover:bg-black/10 text-gray-500 hover:text-gray-900"
              }`}
          >
            <RxCross2 size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={loadingGps}
                className={`w-full py-2.5 px-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${loadingGps
                  ? "bg-emerald-700/50 text-white opacity-70"
                  : "bg-gradient-to-r from-emerald-600 via-[#00a884] to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25"
                  }`}
              >
                <MdMyLocation size={16} className={loadingGps ? "animate-spin" : ""} />
                <span>
                  {loadingGps
                    ? "Acquiring GPS Satellite Signal..."
                    : latitude
                      ? "Refresh GPS Location"
                      : "Use Current GPS Location"}
                </span>
              </button>

              {latitude !== null && longitude !== null ? (
                <div className="rounded-xl overflow-hidden border border-white/10 relative shadow-inner">
                  <iframe
                    title="Location Preview"
                    width="100%"
                    height="135"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005}%2C${latitude - 0.004}%2C${longitude + 0.005}%2C${latitude + 0.004}&layer=mapnik&marker=${latitude}%2C${longitude}`}
                    className="w-full pointer-events-none h-32 sm:h-36"
                  />
                  <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10.5px] text-white flex items-center gap-1.5 font-mono shadow-sm">
                    <MdMap size={13} className="text-emerald-400" />
                    <span>
                      {latitude.toFixed(4)}, {longitude.toFixed(4)}
                      {accuracy && ` (±${accuracy}m)`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className={`h-32 sm:h-36 rounded-xl border border-dashed flex flex-col items-center justify-center p-3 text-center gap-1.5 transition-all ${isDark ? "border-white/10 bg-[#202c33]/40 text-gray-400" : "border-black/10 bg-gray-50 text-gray-500"}`} >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <MdMap size={22} />
                  </div>
                  <p className="text-xs font-medium">Map Preview</p>
                  <p className="text-[10px] opacity-70">
                    Fetch GPS or enter coordinates to preview map
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider mb-1 opacity-75">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 28.6139"
                    value={latitude ?? ""}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || null)}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs border font-mono outline-none transition-all ${isDark
                      ? "bg-[#202c33] border-white/10 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                      : "bg-gray-50 border-black/10 text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                      }`}
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider mb-1 opacity-75">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 77.2090"
                    value={longitude ?? ""}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || null)}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs border font-mono outline-none transition-all ${isDark
                      ? "bg-[#202c33] border-white/10 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                      : "bg-gray-50 border-black/10 text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                      }`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80 flex items-center gap-1.5">
                  <MdLocationOn className="text-emerald-500" size={14} />
                  <span>Place / Landmark Name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Location, Starbucks, Office Gate"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none transition-all ${isDark
                    ? "bg-[#202c33] border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-white placeholder-gray-500"
                    : "bg-gray-50 border-black/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-gray-900 placeholder-gray-400"
                    }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">
                  Address / Meeting Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Street name, landmark, gate number or meeting notes..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none transition-all resize-none ${isDark
                    ? "bg-[#202c33] border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-white placeholder-gray-500"
                    : "bg-gray-50 border-black/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-gray-900 placeholder-gray-400"
                    }`}
                />
              </div>

              <div className={`p-2.5 rounded-xl border space-y-2.5 ${isDark ? "bg-[#202c33]/70 border-white/10" : "bg-gray-50 border-black/10"}`} >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-85">
                      <MdOutlineTimer className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Duration</span>
                    </label>
                    <span className="text-[10.5px] font-semibold text-emerald-500">
                      {durationMinutes
                        ? `${durationMinutes >= 60 ? `${durationMinutes / 60} hr(s)` : `${durationMinutes}m`}`
                        : "Always (No expiry)"}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {DURATION_OPTIONS.map((opt) => {
                      const isSelected = durationMinutes === opt.value;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setDurationMinutes(opt.value)}
                          className={`py-1.5 px-0.5 rounded-lg text-[10.5px] font-medium text-center transition-all cursor-pointer ${isSelected
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-xs"
                            : isDark
                              ? "bg-white/5 hover:bg-white/10 text-gray-300"
                              : "bg-black/5 hover:bg-black/10 text-gray-700"
                            }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-85">
                      <MdVisibility className="w-3.5 h-3.5 text-blue-500" />
                      <span>Access Limit</span>
                    </label>
                    <span className="text-[10.5px] font-semibold text-blue-500">
                      {maxAccesses
                        ? `${maxAccesses} ${maxAccesses === 1 ? "view (once)" : "views"}`
                        : "Unlimited"}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {ACCESS_LIMIT_OPTIONS.map((opt) => {
                      const isSelected = maxAccesses === opt.value;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setMaxAccesses(opt.value)}
                          className={`py-1.5 px-0.5 rounded-lg text-[10.5px] font-medium text-center transition-all truncate cursor-pointer ${isSelected
                            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-xs"
                            : isDark
                              ? "bg-white/5 hover:bg-white/10 text-gray-300"
                              : "bg-black/5 hover:bg-black/10 text-gray-700"
                            }`}
                          title={opt.label}
                        >
                          {opt.label.replace(" (View-Once)", "")}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10.5px] leading-tight ${isDark ? "bg-black/35 text-gray-300" : "bg-white text-gray-600 border border-black/5"}`}
                >
                  <IoShieldCheckmarkOutline className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {maxAccesses
                      ? `Max ${maxAccesses} ${maxAccesses === 1 ? "view (view-once)" : "views"}.`
                      : "Unlimited views."}{" "}
                    {durationMinutes
                      ? `Expires in ${durationMinutes >= 60 ? `${durationMinutes / 60}h` : `${durationMinutes}m`}.`
                      : "No expiry time."}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 flex items-center justify-between border-t border-white/10">
            <div className="text-[11px] opacity-70 hidden sm:block">
              {latitude !== null && longitude !== null ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Coordinates locked & ready
                </span>
              ) : (
                <span className="text-gray-400">Select coordinates to share</span>
              )}
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${isDark
                  ? "border-white/10 hover:bg-white/5 text-gray-300"
                  : "border-black/10 hover:bg-black/5 text-gray-600"
                  }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={latitude === null || longitude === null}
                className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer ${latitude !== null && longitude !== null
                  ? "bg-gradient-to-r from-emerald-600 via-[#00a884] to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30"
                  : "bg-gray-500/20 text-gray-400 cursor-not-allowed border border-white/5"
                  }`}
              >
                <MdLocationOn size={16} />
                <span>Share Location</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LocationModal;
