import React from "react";
import { format, isThisYear } from "date-fns";
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileArchive,
  FaFileAlt,
  FaFileCode,
  FaFileCsv,
  FaFileAudio,
} from "react-icons/fa";

export const formatDocSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return "";
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  return `${(num / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const formatVideoDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export const parseFileSize = (item) => {
  if (item.fileSize && !isNaN(item.fileSize)) return Number(item.fileSize);
  if (item.size && !isNaN(item.size)) return Number(item.size);
  if (typeof item.size === "string") {
    const s = item.size.trim().toUpperCase();
    if (s.endsWith("GB")) return parseFloat(s) * 1024 * 1024 * 1024;
    if (s.endsWith("MB")) return parseFloat(s) * 1024 * 1024;
    if (s.endsWith("KB")) return parseFloat(s) * 1024;
    if (s.endsWith("B")) return parseFloat(s);
  }
  return 0;
};

export const getFileIcon = (fileName = "") => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return { icon: FaFilePdf, color: "text-red-500", bg: "bg-red-500/10", label: "PDF" };
    case "doc":
    case "docx":
      return { icon: FaFileWord, color: "text-blue-500", bg: "bg-blue-500/10", label: "WORD" };
    case "xls":
    case "xlsx":
      return { icon: FaFileExcel, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "EXCEL" };
    case "csv":
      return { icon: FaFileCsv, color: "text-emerald-600", bg: "bg-emerald-600/10", label: "CSV" };
    case "ppt":
    case "pptx":
      return { icon: FaFilePowerpoint, color: "text-orange-500", bg: "bg-orange-500/10", label: "PPT" };
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return { icon: FaFileArchive, color: "text-yellow-600", bg: "bg-yellow-600/10", label: "ARCHIVE" };
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "html":
    case "css":
    case "json":
      return { icon: FaFileCode, color: "text-purple-500", bg: "bg-purple-500/10", label: "CODE" };
    case "mp3":
    case "wav":
    case "ogg":
    case "m4a":
      return { icon: FaFileAudio, color: "text-pink-500", bg: "bg-pink-500/10", label: "AUDIO" };
    default:
      return { icon: FaFileAlt, color: "text-gray-500", bg: "bg-gray-500/10", label: "DOC" };
  }
};

export const formatDateGroup = (date) => {
  if (!date) return "Recent";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Recent";
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This week";
  if (diffDays < 30) return "This month";
  if (isThisYear(d)) return format(d, "MMMM");
  return format(d, "MMMM yyyy");
};

export const calculateTotalSize = (items) => {
  const bytes = items.reduce((acc, item) => acc + parseFileSize(item), 0);
  if (bytes === 0) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const getSenderDisplay = (item) => {
  if (!item) return "";
  if (item.senderName) return item.senderName;
  if (typeof item.sender === "string") return item.sender;
  if (item.sender?.username) return item.sender.username;
  if (item.sender?.name) return item.sender.name;
  return "";
};

export const getAttachedMessage = (item) => {
  if (!item) return "";
  const direct = item.attachedMessage || item.messageText || item.caption;
  if (direct && typeof direct === "string") return direct.trim();
  const content = item.content;
  if (content && typeof content === "string") {
    if (content.startsWith("http://") || content.startsWith("https://")) {
      return "";
    }
    return content.trim();
  }
  return "";
};
