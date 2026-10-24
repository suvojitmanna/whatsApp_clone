import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { FaFileAlt, FaFileCode, FaPrint, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import formatTimestamp from "../../utils/formatTime";

export default function ExportChatModal({
  isOpen,
  onClose,
  messages = [],
  contactName = "Chat",
  theme = "dark",
}) {
  const [format, setFormat] = useState("markdown");
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [includeMediaLinks, setIncludeMediaLinks] = useState(true);

  if (!isOpen) return null;

  const generateExportContent = (fmt) => {
    const lines = [];
    const title = `WhatsApp Chat with ${contactName}`;
    const date = new Date().toLocaleString();

    if (fmt === "markdown") {
      lines.push(`# ${title}`);
      lines.push(`*Exported on: ${date}*\n`);
      lines.push("---\n");

      for (const m of messages) {
        if (!m || m.deletedForEveryone) continue;
        const sender = m.sender?.username || (m.isMetaAi ? "Meta AI" : "User");
        const time = includeTimestamps && m.createdAt ? ` [${formatTimestamp(m.createdAt)}]` : "";

        if (m.isMetaAi) {
          lines.push(`### 🤖 ${sender}${time}`);
          lines.push(`${m.content || ""}\n`);
          if (includeMediaLinks && m.imageOrVideoUrl) {
            lines.push(`![Image](${m.imageOrVideoUrl})\n`);
          }
        } else {
          lines.push(`**${sender}**${time}: ${m.content || ""}`);
          if (includeMediaLinks && m.imageOrVideoUrl) {
            lines.push(`*Attachment: ${m.imageOrVideoUrl}*\n`);
          }
        }
      }
    } else {
      lines.push(`${title}`);
      lines.push(`Exported on: ${date}`);
      lines.push("----------------------------------------\n");

      for (const m of messages) {
        if (!m || m.deletedForEveryone) continue;
        const sender = m.sender?.username || (m.isMetaAi ? "Meta AI" : "User");
        const time = includeTimestamps && m.createdAt ? ` [${formatTimestamp(m.createdAt)}]` : "";
        lines.push(`${sender}${time}: ${m.content || ""}`);
        if (includeMediaLinks && m.imageOrVideoUrl) {
          lines.push(`[Attachment: ${m.imageOrVideoUrl}]`);
        }
      }
    }

    return lines.join("\n");
  };

  const handleExport = () => {
    if (!messages || messages.length === 0) {
      toast.info("No messages to export");
      return;
    }

    if (format === "pdf") {
      const content = generateExportContent("markdown");
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Popup blocked. Please allow popups to print.");
        return;
      }
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Chat with ${contactName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; line-height: 1.6; color: #111; }
            h1 { font-size: 20px; border-bottom: 2px solid #00a884; padding-bottom: 8px; }
            .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
            .msg { margin-bottom: 12px; padding: 8px 12px; border-radius: 8px; background: #f4f4f4; }
            .sender { font-weight: bold; color: #008069; }
            .time { font-size: 11px; color: #888; margin-left: 6px; }
          </style>
        </head>
        <body>
          <h1>WhatsApp Chat with ${contactName}</h1>
          <div class="meta">Exported on: ${new Date().toLocaleString()} • ${messages.length} messages</div>
          <pre style="white-space: pre-wrap; font-family: inherit;">${content}</pre>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      onClose();
      return;
    }

    const text = generateExportContent(format);
    const extension = format === "markdown" ? "md" : "txt";
    const mime = format === "markdown" ? "text/markdown" : "text/plain";
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = contactName.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.href = url;
    link.download = `chat-${safeName}-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Chat exported as .${extension}`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${theme === "dark"
            ? "bg-[#202c33] border-white/10 text-white"
            : "bg-white border-black/10 text-gray-900"
            }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <FaDownload size={14} />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base leading-tight">
                  Export Chat
                </h3>
                <p className="text-[11px] text-gray-400">
                  Save messages, notes, and AI answers
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <IoClose size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 select-none">
                Export Format:
              </label>
              <div className="grid grid-cols-3 gap-2 select-none">
                <button
                  type="button"
                  onClick={() => setFormat("markdown")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer ${format === "markdown"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-500 font-semibold shadow-xs"
                    : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-400 hover:text-white"
                    }`}
                >
                  <FaFileCode size={20} />
                  <span className="text-xs">Markdown (.md)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat("text")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer ${format === "text"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-500 font-semibold shadow-xs"
                    : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-400 hover:text-white"
                    }`}
                >
                  <FaFileAlt size={20} />
                  <span className="text-xs">Plain Text (.txt)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat("pdf")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer ${format === "pdf"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-500 font-semibold shadow-xs"
                    : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-400 hover:text-white"
                    }`}
                >
                  <FaPrint size={20} />
                  <span className="text-xs">Print / PDF</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5 select-none">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={includeTimestamps}
                  onChange={(e) => setIncludeTimestamps(e.target.checked)}
                  className="rounded border-gray-400 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Include timestamps</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={includeMediaLinks}
                  onChange={(e) => setIncludeMediaLinks(e.target.checked)}
                  className="rounded border-gray-400 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Include image and attachment links</span>
              </label>
            </div>

            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-400 text-[11px] select-none">
              ℹ️ Export includes all {messages?.length || 0} messages currently loaded in this chat session.
            </div>
          </div>

          <div className="p-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between select-none">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <FaDownload size={12} />
              <span>{format === "pdf" ? "Open Print View" : "Download File"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
