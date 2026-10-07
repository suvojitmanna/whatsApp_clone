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