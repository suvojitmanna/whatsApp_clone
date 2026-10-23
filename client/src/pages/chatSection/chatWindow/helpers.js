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

export const isValidate = (date) => {
  return date instanceof Date && !isNaN(date);
};

export const getPinnedPreviewText = (msg) => {
  if (!msg) return "";
  if (msg.isEncrypted && !msg._isDecrypted) {
    return "Pinned message";
  }
  if (msg.contentType === "text" || (!msg.contentType && msg.content)) {
    return msg.content || "";
  }
  if (msg.contentType === "image") {
    return msg.content ? `📷 ${msg.content}` : "📷 Photo";
  }
  if (msg.contentType === "video") {
    return msg.content ? `🎥 ${msg.content}` : "🎥 Video";
  }
  if (msg.contentType === "audio") {
    return "🎵 Voice message";
  }
  if (msg.contentType === "document") {
    return msg.fileName ? `📄 ${msg.fileName}` : "📄 Document";
  }
  if (msg.contentType === "poll" || msg.pollData || msg.poll) {
    const q =
      msg.pollData?.question ||
      msg.poll?.question ||
      (typeof msg.content === "string" ? msg.content.replace(/^Poll:\s*/, "") : "Poll");
    return `📊 ${q}`;
  }
  if (msg.contentType === "event") {
    return `📅 ${msg.eventData?.eventName || "Event"}`;
  }
  if (msg.contentType === "contact") {
    return `👤 ${msg.contactData?.name || "Contact"}`;
  }
  if (msg.contentType === "sticker") {
    return "💟 Sticker";
  }
  return msg.content || "Pinned message";
};

export const getReplyPreviewText = (msg) => {
  if (!msg) return "";
  if (msg.contentType === "text" || (!msg.contentType && msg.content)) {
    return msg.content || "";
  }
  if (msg.contentType === "image") {
    return msg.content ? `📷 ${msg.content}` : "📷 Photo";
  }
  if (msg.contentType === "video") {
    return msg.content ? `🎥 ${msg.content}` : "🎥 Video";
  }
  if (msg.contentType === "audio") {
    return "🎵 Voice message";
  }
  if (msg.contentType === "document") {
    return msg.fileName ? `📄 ${msg.fileName}` : "📄 Document";
  }
  if (msg.contentType === "poll") {
    return `📊 ${msg.pollData?.question || "Poll"}`;
  }
  if (msg.contentType === "event") {
    return `📅 ${msg.eventData?.eventName || "Event"}`;
  }
  if (msg.contentType === "contact") {
    return `👤 ${msg.contactData?.name || "Contact"}`;
  }
  if (msg.contentType === "sticker") {
    return "💟 Sticker";
  }
  return msg.content || "Message";
};
