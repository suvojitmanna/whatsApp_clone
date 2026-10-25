import React, { useState } from "react";
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { MdLocationOn, MdMyLocation, MdMap } from "react-icons/md";
import { toast } from "react-toastify";

export const LocationModal = ({ isOpen = true, onClose, onSend, theme = "dark" }) => {
  const isDark = theme === "dark";

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
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

    const locData = {
      name: placeName.trim() || "Live Location",
      address: address.trim() || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy || null,
      timestamp: new Date().toISOString(),
    };

    onSend(locData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center px-4 backdrop-blur-md ${isDark ? "bg-black/75" : "bg-black/35"}`} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] ${isDark
          ? "bg-[#111b21] border-white/10 text-white"
          : "bg-white border-black/10 text-gray-900"
          }`}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${isDark ? "border-white/10 bg-[#202c33]/50" : "border-black/5 bg-gray-50"
          }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
              <MdLocationOn size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-[17px] leading-tight">
                Share Location
              </h3>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Send your current location or place
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={loadingGps}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 cursor-pointer ${loadingGps
              ? "bg-emerald-700/50 text-white opacity-70"
              : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
          >
            <MdMyLocation size={18} className={loadingGps ? "animate-spin" : ""} />
            <span>
              {loadingGps
                ? "Acquiring GPS Satellite Signal..."
                : "Send Your Current Location"}
            </span>
          </button>

          {latitude !== null && longitude !== null && (
            <div className="rounded-xl overflow-hidden border border-white/10 relative shadow-inner">
              <iframe
                title="Location Preview"
                width="100%"
                height="160"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005}%2C${latitude - 0.004}%2C${longitude + 0.005}%2C${latitude + 0.004}&layer=mapnik&marker=${latitude}%2C${longitude}`}
                className="w-full pointer-events-none"
              />
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[11px] text-white flex items-center gap-1 font-mono">
                <MdMap size={12} className="text-red-400" />
                <span>
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  {accuracy && ` (±${accuracy}m)`}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
              Place / Landmark Name
            </label>
            <input
              type="text"
              placeholder="e.g. My Current Location, Starbucks, Office Gate"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all ${isDark
                ? "bg-[#202c33] border-white/10 focus:border-red-500 text-white placeholder-gray-500"
                : "bg-gray-50 border-black/10 focus:border-red-500 text-gray-900 placeholder-gray-400"
                }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
              Address / Details (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Street name, landmark or meeting notes"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none transition-all resize-none ${isDark
                ? "bg-[#202c33] border-white/10 focus:border-red-500 text-white placeholder-gray-500"
                : "bg-gray-50 border-black/10 focus:border-red-500 text-gray-900 placeholder-gray-400"
                }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1 opacity-70">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 28.6139"
                value={latitude ?? ""}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || null)}
                className={`w-full px-3 py-2 rounded-xl text-xs border font-mono outline-none ${isDark
                  ? "bg-[#202c33] border-white/10 text-white"
                  : "bg-gray-50 border-black/10 text-gray-900"
                  }`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1 opacity-70">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 77.2090"
                value={longitude ?? ""}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || null)}
                className={`w-full px-3 py-2 rounded-xl text-xs border font-mono outline-none ${isDark
                  ? "bg-[#202c33] border-white/10 text-white"
                  : "bg-gray-50 border-black/10 text-gray-900"
                  }`}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${isDark
                ? "border-white/10 hover:bg-white/5 text-gray-300"
                : "border-black/10 hover:bg-black/5 text-gray-600"
                }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={latitude === null || longitude === null}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-98 cursor-pointer ${latitude !== null && longitude !== null
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-gray-500/30 text-gray-400 cursor-not-allowed"
                }`}
            >
              Share Location
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LocationModal;
