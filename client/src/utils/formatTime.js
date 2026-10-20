export default function formatTimestamp(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return `today at ${time}`;
  if (isYesterday) return `yesterday at ${time}`;

  return (
    date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }) + ` at ${time}`
  );
}

export function formatCallDate(call) {
  if (!call) return "";

  if (call.timestamp) {
    const d = new Date(call.timestamp);
    if (!isNaN(d.getTime())) {
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return "Today";
      }
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      }
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }

  if (call.dateFormatted) {
    const raw = String(call.dateFormatted).trim();
    const lower = raw.toLowerCase();
    if (lower === "today") return "Today";
    if (lower === "yesterday") return "Yesterday";

    if (raw.includes("/")) {
      const parts = raw.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const parsed = new Date(year, month, day);
        if (!isNaN(parsed.getTime())) {
          const now = new Date();
          if (parsed.toDateString() === now.toDateString()) return "Today";
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          if (parsed.toDateString() === yesterday.toDateString())
            return "Yesterday";
          return raw;
        }
      }
    }
    return raw;
  }

  return call.timeFormatted || "";
}

export function getDisappearingDurationMs(duration) {
  if (!duration || duration === "Off") return null;
  const dur = String(duration).toLowerCase().trim();
  if (dur.includes("24 hour") || dur === "24h") return 24 * 60 * 60 * 1000;
  if (dur.includes("7 day") || dur === "7d") return 7 * 24 * 60 * 60 * 1000;
  if (dur.includes("90 day") || dur === "90d") return 90 * 24 * 60 * 60 * 1000;
  if (dur.includes("minute")) {
    const m = parseInt(dur, 10);
    return (m || 1) * 60 * 1000;
  }
  if (dur.includes("hour")) {
    const h = parseInt(dur, 10);
    return (h || 1) * 60 * 60 * 1000;
  }
  if (dur.includes("day")) {
    const d = parseInt(dur, 10);
    return (d || 1) * 24 * 60 * 60 * 1000;
  }
  if (dur.includes("second")) {
    const s = parseInt(dur, 10);
    return (s || 1) * 1000;
  }
  return null;
}
