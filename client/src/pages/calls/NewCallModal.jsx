import React, { useState, useMemo, useRef, useEffect } from "react";
import useThemeStore from "../../store/themeStore";
import {
  MdClose,
  MdCall,
  MdVideocam,
  MdSearch,
  MdClear,
  MdLink,
  MdDialpad,
} from "react-icons/md";
import { ContactAvatar } from "./FaviouriteCall";

export const NewCallView = ({
  onBack,
  onClose,
  contacts = [],
  onStartCall,
  onOpenCallLink,
  onOpenDialpad,
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = onBack || onClose;

  const allContacts = useMemo(() => {
    const map = new Map();
    contacts.forEach((c) => {
      const id = c._id || c.id || c.contactId;
      if (id && !map.has(id)) {
        map.set(id, c);
      }
    });
    return Array.from(map.values());
  }, [contacts]);

  const selectedContacts = useMemo(() => {
    return selectedIds
      .map((id) =>
        allContacts.find((c) => (c._id || c.id || c.contactId) === id)
      )
      .filter(Boolean);
  }, [selectedIds, allContacts]);

  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return allContacts;
    const term = searchTerm.toLowerCase();
    return allContacts.filter(
      (c) =>
        (c.username || c.name)?.toLowerCase().includes(term) ||
        c.about?.toLowerCase().includes(term) ||
        c.phoneNumber?.includes(term)
    );
  }, [allContacts, searchTerm]);

  const toggleSelect = (contact) => {
    const id = contact._id || contact.id || contact.contactId;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const removeSelected = (id) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleTriggerCall = (callType = "audio") => {
    if (selectedContacts.length === 0) return;

    if (onStartCall) {
      const primary = selectedContacts[0];
      const contactId = primary._id || primary.id || primary.contactId;
      const contactName =
        selectedContacts.length > 1
          ? selectedContacts.map((c) => c.username || c.name).join(", ")
          : primary.username || primary.name;
      const contactAvatar = primary.profilePicture || primary.avatar;

      onStartCall(
        {
          _id: contactId,
          contactId,
          username: contactName,
          name: contactName,
          profilePicture: contactAvatar,
        },
        callType
      );
    }

    if (handleClose) handleClose();
  };

  return (
    <div
      className={`h-full w-full flex flex-col select-none border-r transition-colors duration-200 ${isDark
        ? "bg-[#111b21] border-[#222e35] text-[#e9edef]"
        : "bg-white border-gray-200 text-[#111b21]"
        }`}
    >
      <div className="h-16 px-4 flex items-center gap-6 shrink-0">
        <button
          type="button"
          onClick={handleClose}
          className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
            ? "text-gray-300 hover:bg-[#1f2b33] hover:text-white"
            : "text-[#54656f] hover:bg-[#e9edef] hover:text-[#111b21]"
            }`}
          title="Close"
        >
          <MdClose className="text-2xl" />
        </button>

        <h2
          className={`text-[20px] font-bold tracking-tight ${isDark ? "text-white" : "text-[#111b21]"
            }`}
        >
          New call
        </h2>
      </div>

      {selectedContacts.length > 0 && (
        <div className="px-4 pb-2 flex flex-col gap-2 max-h-56 overflow-y-auto scrollbar-thin shrink-0">
          {selectedContacts.map((contact) => {
            const id = contact._id || contact.id || contact.contactId;
            const name = contact.username || contact.name;

            return (
              <div
                key={id}
                className="flex items-center justify-between py-1 group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <ContactAvatar contact={contact} size={36} />
                  <span
                    className={`font-medium text-[15px] truncate ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
                      }`}
                  >
                    {name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeSelected(id)}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
                    ? "text-[#8696a0] hover:text-white hover:bg-[#1f2b33]"
                    : "text-[#54656f] hover:text-[#111b21] hover:bg-[#e9edef]"
                    }`}
                  title="Remove"
                >
                  <MdClose className="text-lg" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-4 pb-2 shrink-0">
        <div
          className={`flex items-center gap-3 px-3.5 py-2 rounded-xl border transition-all ${isDark
            ? "bg-[#111b21] border-[#222e35] focus-within:border-[#00a884]"
            : "bg-[#f0f2f5] border-gray-200 focus-within:border-[#00a884]"
            }`}
        >
          <MdSearch
            className={`text-xl shrink-0 ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
              }`}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name or number"
            className={`w-full bg-transparent text-sm focus:outline-none placeholder:text-[#8696a0] ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
              }`}
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className={`cursor-pointer ${isDark
                ? "text-[#8696a0] hover:text-white"
                : "text-[#54656f] hover:text-[#111b21]"
                }`}
            >
              <MdClear className="text-base" />
            </button>
          )}
        </div>
      </div>

      <div
        className={`border-b shrink-0 ${isDark ? "border-[#222e35]" : "border-gray-200"
          }`}
      />

      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {!searchTerm && selectedIds.length === 0 && (
          <div className="flex flex-col gap-1 mb-2 pb-2 border-b border-gray-500/10">
            {onOpenCallLink && (
              <div
                onClick={onOpenCallLink}
                className={`mx-1 p-2.5 rounded-xl flex items-center gap-3.5 transition-all cursor-pointer ${
                  isDark
                    ? "hover:bg-[#1f2b33] text-[#e9edef]"
                    : "hover:bg-[#e9edef] text-[#111b21]"
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-[#00a884] text-black flex items-center justify-center shrink-0 shadow-sm">
                  <MdLink className="text-2xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[15.5px]">
                    New call link
                  </div>
                  <div
                    className={`text-[12.5px] truncate ${
                      isDark ? "text-[#8696a0]" : "text-[#54656f]"
                    }`}
                  >
                    Share a link for your WhatsApp call
                  </div>
                </div>
              </div>
            )}

            {onOpenDialpad && (
              <div
                onClick={onOpenDialpad}
                className={`mx-1 p-2.5 rounded-xl flex items-center gap-3.5 transition-all cursor-pointer ${
                  isDark
                    ? "hover:bg-[#1f2b33] text-[#e9edef]"
                    : "hover:bg-[#e9edef] text-[#111b21]"
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-[#00a884] text-black flex items-center justify-center shrink-0 shadow-sm">
                  <MdDialpad className="text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[15.5px]">
                    Call a phone number
                  </div>
                  <div
                    className={`text-[12.5px] truncate ${
                      isDark ? "text-[#8696a0]" : "text-[#54656f]"
                    }`}
                  >
                    Enter a number to start a voice or video call
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {filteredContacts.length === 0 ? (
          <div
            className={`py-12 text-center text-sm ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
              }`}
          >
            No contacts found
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredContacts.map((contact) => {
              const contactId = contact._id || contact.id || contact.contactId;
              const contactName =
                contact.username || contact.name || "Unknown";
              const about = contact.about || "Hey there! I am using WhatsApp";
              const isSelected = selectedIds.includes(contactId);

              return (
                <div
                  key={contactId}
                  onClick={() => toggleSelect(contact)}
                  className={`mx-1 p-2.5 rounded-xl flex items-center gap-3.5 transition-all cursor-pointer group ${isSelected
                    ? isDark
                      ? "bg-[#202c33] text-white shadow-sm"
                      : "bg-[#e7fce3] border border-[#25d366]/40 text-[#111b21]"
                    : isDark
                      ? "hover:bg-[#1f2b33] hover:shadow-sm"
                      : "hover:bg-[#e9edef] hover:shadow-sm"
                    }`}
                >
                  <ContactAvatar contact={contact} size={48} />

                  <div className="min-w-0 flex-1">
                    <div
                      className={`font-medium text-[16px] truncate leading-tight ${isDark ? "text-white" : "text-[#111b21]"
                        }`}
                    >
                      {contactName}
                    </div>
                    {about && (
                      <div
                        className={`text-[13px] truncate mt-0.5 ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                          }`}
                      >
                        {about}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedContacts.length > 0 && (
        <div
          className={`px-4 py-3.5 border-t shrink-0 flex items-center justify-between select-none animate-fadeIn ${isDark
            ? "bg-[#111b21] border-[#222e35]"
            : "bg-white border-gray-200"
            }`}
        >
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-[#00a884] hover:text-[#06cf9c] font-semibold text-[15px] transition-colors cursor-pointer px-2 py-1.5 active:scale-95"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleTriggerCall("audio")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00a884] hover:bg-[#06cf9c] active:scale-95 text-[#111b21] font-bold text-sm transition-all cursor-pointer shadow-md"
            >
              <MdCall className="text-lg" />
              <span>Voice</span>
            </button>

            <button
              type="button"
              onClick={() => handleTriggerCall("video")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00a884] hover:bg-[#06cf9c] active:scale-95 text-[#111b21] font-bold text-sm transition-all cursor-pointer shadow-md"
            >
              <MdVideocam className="text-lg" />
              <span>Video</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const NewCallModal = ({
  isOpen,
  onClose,
  contacts = [],
  onStartCall,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] h-[88vh] max-h-[700px] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <NewCallView
          onClose={onClose}
          onBack={onClose}
          contacts={contacts}
          onStartCall={onStartCall}
        />
      </div>
    </div>
  );
};

export default NewCallModal;
