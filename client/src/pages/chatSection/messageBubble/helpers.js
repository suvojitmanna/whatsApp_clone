import { format } from "date-fns";
import { toast } from "react-toastify";

export const formatEventSchedule = (eventData) => {
  if (!eventData?.eventDate) return "Date TBD";
  try {
    const parts = eventData.eventDate.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const targetDate = new Date(year, month, day);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      let dayStr = "";
      if (targetDate.getTime() === today.getTime()) {
        dayStr = "Today";
      } else if (targetDate.getTime() === tomorrow.getTime()) {
        dayStr = "Tomorrow";
      } else {
        dayStr = format(targetDate, "EEE, d MMM");
      }
      let timeStr = "";
      if (eventData.eventTime) {
        timeStr = `, ${eventData.eventTime}`;
        if (eventData.endTime) {
          timeStr += ` - ${eventData.endTime}`;
        }
      }
      return `${dayStr}${timeStr}`;
    }
    return eventData.eventDate;
  } catch (e) {
    return eventData.eventDate;
  }
};

export const getInitials = (name) => {
  if (!name) return "U";
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
};

export const handleDownloadFile = async (e, url, fileName, setDownloading) => {
  if (e) {
    e.stopPropagation();
  }
  if (!url) return;

  if (setDownloading) setDownloading(true);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        throw new Error("CLOUDINARY_RESTRICTED");
      }
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || "document.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    toast.success("Download started");
  } catch (err) {
    console.warn("Blob download failed:", err);
    if (err.message === "CLOUDINARY_RESTRICTED") {
      toast.error(
        "Cloudinary is blocking PDF delivery. Please enable 'Allow delivery of PDF and ZIP files' in your Cloudinary Security Settings."
      );
    }
    try {
      let downloadUrl = url;
      if (url.includes("/upload/")) {
        downloadUrl = url.replace("/upload/", "/upload/fl_attachment/");
      }
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("download", fileName || "document.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (fallbackErr) {
      window.open(url, "_blank");
    }
  } finally {
    if (setDownloading) setDownloading(false);
  }
};
