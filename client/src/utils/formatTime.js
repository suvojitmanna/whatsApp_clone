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
