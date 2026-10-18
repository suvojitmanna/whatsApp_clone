import React, { useState, useMemo } from "react";
import useThemeStore from "../../store/themeStore";
import { MdClose, MdCall, MdVideocam, MdSearch, MdClear } from "react-icons/md";
import { ContactAvatar } from "./FaviouriteCall";

const NewCallModal = ({
  isOpen,
  onClose,
  contacts = [],
  onStartCall,
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts;
    const term = searchTerm.toLowerCase();
    return contacts.filter(
      (c) =>
        c.username?.toLowerCase().includes(term) ||
        c.name?.toLowerCase().includes(term) ||
        c.phoneNumber?.includes(term)
    );
  }, [contacts, searchTerm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border transition-all duration-300 ${
          isDark
            ? "bg-[#202c33] border-[#2a3942] text-[#e9edef]"
            : "bg-white border-gray-200 text-[#111b21]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b ${
            isDark ? "border-[#2a3942]" : "border-gray-200"
          }`}
        >
          <h3
            className={`text-lg font-bold ${
              isDark ? "text-white" : "text-[#111b21]"
            }`}
          >
            New call
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isDark
                ? "hover:bg-[#111b21] text-[#8696a0] hover:text-white"
                : "hover:bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21]"
            }`}
            title="Close"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
              isDark
                ? "bg-[#111b21] border-[#2a3942] focus-within:border-[#00a884]"
                : "bg-[#f0f2f5] border-gray-200 focus-within:border-[#00a884]"
            }`}
          >
            <MdSearch
              className={`text-xl shrink-0 ${
                isDark ? "text-[#8696a0]" : "text-[#54656f]"
              }`}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, number or @username"
              className={`w-full bg-transparent text-sm focus:outline-none placeholder:text-[#8696a0] ${
                isDark ? "text-[#e9edef]" : "text-[#111b21]"
              }`}
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className={`cursor-pointer ${
                  isDark
                    ? "text-[#8696a0] hover:text-white"
                    : "text-[#54656f] hover:text-[#111b21]"
                }`}
              >
                <MdClear className="text-lg" />
              </button>
            )}
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <div
            className={`px-3 pb-2 text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-[#00a884]" : "text-[#008069]"
            }`}
          >
            Contacts ({filteredContacts.length})
          </div>

          {filteredContacts.length === 0 ? (
            <div
              className={`py-12 text-center text-sm ${
                isDark ? "text-[#8696a0]" : "text-[#54656f]"
              }`}
            >
              No contacts found
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredContacts.map((contact) => {
                const contactId = contact._id || contact.id;
                const contactName = contact.username || contact.name || "Unknown";
                const about = contact.about || "Hey there! I am using WhatsApp";

                return (
                  <div
                    key={contactId}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                      isDark ? "hover:bg-[#111b21]/70" : "hover:bg-[#f5f6f6]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ContactAvatar contact={contact} size={44} />

                      <div className="min-w-0">
                        <div
                          className={`text-sm font-medium truncate ${
                            isDark ? "text-white" : "text-[#111b21]"
                          }`}
                        >
                          {contactName}
                        </div>
                        <div
                          className={`text-xs truncate max-w-[200px] ${
                            isDark ? "text-[#8696a0]" : "text-[#54656f]"
                          }`}
                        >
                          {about}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onStartCall(contact, "audio");
                          onClose();
                        }}
                        className={`p-2.5 rounded-full transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                          isDark
                            ? "text-[#00a884] hover:bg-[#00a884]/10"
                            : "text-[#008069] hover:bg-[#008069]/10"
                        }`}
                        title="Voice call"
                      >
                        <MdCall className="text-xl" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onStartCall(contact, "video");
                          onClose();
                        }}
                        className={`p-2.5 rounded-full transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                          isDark
                            ? "text-[#00a884] hover:bg-[#00a884]/10"
                            : "text-[#008069] hover:bg-[#008069]/10"
                        }`}
                        title="Video call"
                      >
                        <MdVideocam className="text-xl" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewCallModal;
