import React, { useState, useMemo, useEffect } from "react";
import useThemeStore from "../../store/themeStore";
import useCallStore, { SEED_FAVOURITE_CANDIDATES } from "../../store/useCallStore";
import {
  MdClose,
  MdSearch,
  MdCheck,
  MdArrowBack,
  MdEdit,
  MdAdd,
  MdDragHandle,
  MdVerified,
} from "react-icons/md";
import { FaUser } from "react-icons/fa";

export const ContactAvatar = ({ contact, size = 48, className = "" }) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const username = contact?.username || contact?.name || "";
  const avatarType = contact?.avatarType;
  const profilePicture = contact?.profilePicture || contact?.avatar;

  if (avatarType === "amazon" || username.toLowerCase() === "amazon") {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-full bg-[#d69e66] flex flex-col items-center justify-center relative overflow-hidden shrink-0 shadow-sm ${className}`}
      >
        <div className="w-5 h-2.5 bg-[#00a8e1] rounded-b-sm absolute top-0 shadow-xs" />
        <svg
          viewBox="0 0 36 20"
          className="w-7 h-4 text-black mt-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M 4 12 Q 18 20 32 8" />
          <path d="M 28 6 L 32 8 L 30 13" fill="currentColor" />
        </svg>
      </div>
    );
  }

  if (
    avatarType === "flipkart" ||
    username.toLowerCase().includes("flipkart")
  ) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-full bg-[#fed700] flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm ${className}`}
      >
        <div className="w-6 h-7 bg-[#2874f0] rounded-sm flex flex-col items-center justify-center relative shadow-xs">
          <div className="w-2.5 h-1.5 border-t-2 border-l-2 border-r-2 border-[#fed700] -mt-1 rounded-t-sm" />
          <span className="text-[#fed700] text-xs font-black italic">f</span>
        </div>
      </div>
    );
  }

  if (
    avatarType === "prime" ||
    username.toLowerCase().includes("prime video")
  ) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-full bg-[#00a8e1] flex flex-col items-center justify-center relative overflow-hidden shrink-0 shadow-sm ${className}`}
      >
        <span className="text-white font-bold text-[9px] tracking-tight leading-none">
          prime
        </span>
        <span className="text-white font-semibold text-[8px] tracking-tight leading-none">
          video
        </span>
        <svg
          viewBox="0 0 20 6"
          className="w-4 h-1.5 text-white mt-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M 2 3 Q 10 7 18 2" />
        </svg>
      </div>
    );
  }

  if (avatarType === "hostel" || username.toLowerCase().includes("h4 batch")) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-full bg-[#a06859] flex items-center justify-center relative overflow-hidden shrink-0 border border-amber-900/40 shadow-sm ${className}`}
      >
        <div className="bg-[#e4cfb7] px-1 py-0.5 rounded text-[8px] font-black tracking-widest text-[#5a2e1d] uppercase border border-[#bfa286]">
          HOSTEL
        </div>
      </div>
    );
  }

  if (avatarType === "lme" || username.toLowerCase().includes("lme 2024")) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-full bg-white flex flex-col items-center justify-center relative overflow-hidden shrink-0 border border-gray-300 shadow-sm ${className}`}
      >
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-80">
          <div className="h-0.5 bg-red-500 w-full" />
          <div className="h-0.5 bg-yellow-400 w-full" />
          <div className="h-0.5 bg-green-500 w-full" />
          <div className="h-0.5 bg-blue-500 w-full" />
        </div>
        <span className="text-[#111b21] font-black text-xs relative z-10 bg-white/70 px-1 rounded">
          LME
        </span>
      </div>
    );
  }

  if (avatarType === "mar" || username.toLowerCase().includes("mar support")) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-full bg-white flex flex-col items-center justify-center relative overflow-hidden shrink-0 border border-gray-200 shadow-sm ${className}`}
      >
        <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-red-500 flex items-center justify-center font-black text-[9px] text-blue-600">
          R
        </div>
        <span className="text-[6px] font-bold text-gray-700 leading-none mt-0.5">
          Get MAR
        </span>
      </div>
    );
  }

  if (username.toLowerCase().includes("baba") || !profilePicture) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-full flex items-center justify-center shrink-0 shadow-xs ${isDark ? "bg-[#374248]" : "bg-[#dfe5e7]"
          } ${className}`}
      >
        <FaUser
          className={`text-xl ${isDark ? "text-[#f3a847]" : "text-[#54656f]"}`}
        />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-xs ${isDark ? "bg-[#374248]" : "bg-[#dfe5e7]"
        } ${className}`}
    >
      <img
        src={profilePicture}
        alt={username}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
};

export const AddFavouritesModal = ({
  isOpen,
  onClose,
  contacts = [],
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const { favourites, setFavourites } = useCallStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const allCandidates = useMemo(() => {
    const map = new Map();
    SEED_FAVOURITE_CANDIDATES.forEach((c) => map.set(c._id, c));
    contacts.forEach((c) => {
      const id = c._id || c.id;
      if (id && !map.has(id)) {
        map.set(id, c);
      }
    });
    return Array.from(map.values());
  }, [contacts]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(favourites.map((f) => f.contactId || f._id));
      setSearchTerm("");
    }
  }, [isOpen, favourites]);

  const toggleSelect = (candidate) => {
    const id = candidate._id || candidate.id;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const removeChip = (id) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const selectedCandidates = useMemo(() => {
    return selectedIds
      .map((id) => allCandidates.find((c) => (c._id || c.id) === id))
      .filter(Boolean);
  }, [selectedIds, allCandidates]);

  const filteredCandidates = useMemo(() => {
    if (!searchTerm.trim()) return allCandidates;
    const term = searchTerm.toLowerCase();
    return allCandidates.filter(
      (c) =>
        (c.username || c.name)?.toLowerCase().includes(term) ||
        c.about?.toLowerCase().includes(term) ||
        c.phoneNumber?.includes(term)
    );
  }, [allCandidates, searchTerm]);

  const handleConfirm = () => {
    const updatedFavourites = selectedCandidates.map((c) => ({
      contactId: c._id || c.id,
      _id: c._id || c.id,
      username: c.username || c.name,
      name: c.username || c.name,
      profilePicture: c.profilePicture || c.avatar || null,
      avatarType: c.avatarType || null,
      isVerified: Boolean(c.isVerified),
      about: c.about || "Hey there! I am using WhatsApp",
    }));

    setFavourites(updatedFavourites);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-[480px] h-[88vh] max-h-[700px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border relative transition-all duration-200 ${isDark
            ? "bg-[#111b21] border-[#222e35] text-[#e9edef]"
            : "bg-white border-gray-200 text-[#111b21]"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
                ? "hover:bg-[#202c33] text-gray-300"
                : "hover:bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21]"
              }`}
            title="Close"
          >
            <MdClose className="text-2xl" />
          </button>
          <h2
            className={`text-[19px] font-semibold tracking-tight ${isDark ? "text-white" : "text-[#111b21]"
              }`}
          >
            Add to Favourites
          </h2>
        </div>

        <div className="px-5 pb-3 shrink-0">
          <div
            className={`flex items-center gap-3 px-4 py-2.5 rounded-full border-2 transition-all ${isDark
                ? "bg-[#111b21] border-[#00a884] focus-within:ring-2 focus-within:ring-[#00a884]/40"
                : "bg-[#f0f2f5] border-[#00a884] focus-within:ring-2 focus-within:ring-[#00a884]/40"
              }`}
          >
            <MdSearch
              className={`text-xl shrink-0 ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                }`}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, number or @username"
              className={`w-full bg-transparent text-[14px] focus:outline-none placeholder:text-[#8696a0] ${isDark ? "text-[#e9edef]" : "text-[#111b21]"
                }`}
              autoFocus
            />
          </div>
        </div>

        {selectedCandidates.length > 0 && (
          <div className="px-5 pb-3 shrink-0 flex flex-wrap gap-2 max-h-28 overflow-y-auto scrollbar-thin">
            {selectedCandidates.map((cand) => {
              const id = cand._id || cand.id;
              const name = cand.username || cand.name;

              return (
                <div
                  key={id}
                  className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full transition-all text-xs font-medium border ${isDark
                      ? "bg-[#202c33] border-[#2a3942] text-[#e9edef]"
                      : "bg-[#f0f2f5] border-gray-300 text-[#111b21]"
                    }`}
                >
                  <ContactAvatar contact={cand} size={24} />
                  <span className="truncate max-w-[120px]">{name}</span>
                  {cand.isVerified && (
                    <MdVerified className="text-[#00a884] text-sm shrink-0" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeChip(id)}
                    className={`p-0.5 rounded-full transition-colors cursor-pointer ${isDark
                        ? "text-[#8696a0] hover:text-white"
                        : "text-[#54656f] hover:text-[#111b21] hover:bg-black/5"
                      }`}
                  >
                    <MdClose className="text-xs" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 pb-24 scrollbar-thin">
          <div className="flex flex-col gap-1">
            {filteredCandidates.map((candidate) => {
              const id = candidate._id || candidate.id;
              const isSelected = selectedIds.includes(id);
              const name = candidate.username || candidate.name;
              const subtitle = candidate.about || "Hey there! I am using WhatsApp";

              return (
                <div
                  key={id}
                  onClick={() => toggleSelect(candidate)}
                  className={`flex items-center gap-3.5 px-3 py-2.5 rounded-2xl transition-all cursor-pointer ${isSelected
                      ? isDark
                        ? "bg-[#202c33]"
                        : "bg-[#e7fce3] border border-[#25d366]/40"
                      : isDark
                        ? "hover:bg-[#202c33]/50"
                        : "hover:bg-[#f5f6f6]"
                    }`}
                >
                  <div className="shrink-0 flex items-center justify-center">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${isSelected
                          ? "bg-[#00a884] text-black shadow-xs"
                          : isDark
                            ? "border-2 border-[#8696a0]"
                            : "border-2 border-[#8696a0]"
                        }`}
                    >
                      {isSelected && <MdCheck className="text-sm font-bold stroke-2" />}
                    </div>
                  </div>

                  <ContactAvatar contact={candidate} size={48} />

                  <div className="min-w-0 flex-1">
                    <div
                      className={`flex items-center gap-1.5 font-medium text-[15px] truncate leading-tight ${isDark ? "text-white" : "text-[#111b21]"
                        }`}
                    >
                      <span>{name}</span>
                      {candidate.isVerified && (
                        <MdVerified className="text-[#00a884] text-base shrink-0" />
                      )}
                    </div>
                    <div
                      className={`text-xs truncate mt-0.5 max-w-[280px] ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
                        }`}
                    >
                      {subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-6 right-6 z-20">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-14 h-14 rounded-full bg-[#00a884] hover:bg-[#008f6f] active:scale-90 text-black flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer"
            title="Done"
            aria-label="Confirm favourites"
          >
            <MdCheck className="text-3xl font-bold" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const FavouritesView = ({
  onBack,
  onOpenAddModal,
  onStartCall,
  contacts = [],
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const { favourites } = useCallStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModalInternal, setShowAddModalInternal] = useState(false);

  const handleOpenAdd = () => {
    if (typeof onOpenAddModal === "function") {
      onOpenAddModal();
    } else {
      setShowAddModalInternal(true);
    }
  };

  if (isEditMode) {
    return (
      <EditFavouritesView
        onBack={() => setIsEditMode(false)}
        onSave={() => setIsEditMode(false)}
      />
    );
  }

  return (
    <div
      className={`h-full w-full flex flex-col select-none border-r transition-colors duration-200 ${isDark
          ? "bg-[#111b21] border-[#222e35] text-[#e9edef]"
          : "bg-white border-gray-200 text-[#111b21]"
        }`}
    >
      <div
        className={`h-16 px-4 flex items-center justify-between shrink-0 border-b ${isDark ? "border-[#222e35]" : "border-gray-200"
          }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
                ? "hover:bg-[#202c33] text-gray-300"
                : "hover:bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21]"
              }`}
            title="Back to Calls"
          >
            <MdArrowBack className="text-2xl" />
          </button>
          <h2
            className={`text-[20px] font-bold ${isDark ? "text-white" : "text-[#111b21]"
              }`}
          >
            Favourites
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditMode(true)}
            className={`p-2.5 rounded-full transition-colors cursor-pointer ${isDark
                ? "hover:bg-[#202c33] text-gray-300"
                : "hover:bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21]"
              }`}
            title="Edit favourites"
          >
            <MdEdit className="text-xl" />
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className={`p-2.5 rounded-full transition-colors cursor-pointer ${isDark
                ? "hover:bg-[#202c33] text-gray-300"
                : "hover:bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21]"
              }`}
            title="Add to favourites"
          >
            <MdAdd className="text-2xl" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin">
        {favourites.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <p className={`text-sm ${isDark ? "text-[#8696a0]" : "text-[#54656f]"}`}>
              No favourites added yet
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-5 py-2 rounded-full bg-[#00a884] text-black font-semibold text-xs active:scale-95 transition-all shadow-md cursor-pointer"
            >
              Add favourite
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {favourites.map((fav) => {
              const name = fav.username || fav.name;
              return (
                <div
                  key={fav.contactId || fav._id}
                  onClick={() =>
                    onStartCall ? onStartCall(fav, "audio") : null
                  }
                  className={`p-3.5 rounded-2xl flex items-center gap-3.5 transition-all cursor-pointer shadow-xs ${isDark
                      ? "bg-[#202c33] hover:bg-[#2a3942]"
                      : "bg-[#f0f2f5] hover:bg-[#e9edef] border border-gray-200/80 shadow-xs"
                    }`}
                >
                  <ContactAvatar contact={fav} size={48} />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`flex items-center gap-1.5 font-medium text-[16px] truncate ${isDark ? "text-white" : "text-[#111b21]"
                        }`}
                    >
                      <span>{name}</span>
                      {fav.isVerified && (
                        <MdVerified className="text-[#00a884] text-base shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModalInternal && (
        <AddFavouritesModal
          isOpen={showAddModalInternal}
          onClose={() => setShowAddModalInternal(false)}
          contacts={contacts}
        />
      )}
    </div>
  );
};

/* =========================================================================
   3. EDIT FAVOURITES VIEW (MATCHES IMAGE 4)
   ========================================================================= */
export const EditFavouritesView = ({ onBack, onSave }) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const { favourites, removeFavourite, reorderFavourites } = useCallStore();
  const [localList, setLocalList] = useState(favourites);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    setLocalList(favourites);
  }, [favourites]);

  const handleRemove = (contactId) => {
    removeFavourite(contactId);
    setLocalList((prev) =>
      prev.filter((item) => (item.contactId || item._id) !== contactId)
    );
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...localList];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setLocalList(updated);
    reorderFavourites(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div
      className={`h-full w-full flex flex-col select-none border-r transition-colors duration-200 ${isDark
          ? "bg-[#111b21] border-[#222e35] text-[#e9edef]"
          : "bg-white border-gray-200 text-[#111b21]"
        }`}
    >
      <div
        className={`h-16 px-4 flex items-center justify-between shrink-0 border-b ${isDark ? "border-[#222e35]" : "border-gray-200"
          }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
                ? "hover:bg-[#202c33] text-gray-300"
                : "hover:bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21]"
              }`}
            title="Back"
          >
            <MdArrowBack className="text-2xl" />
          </button>
          <h2
            className={`text-[20px] font-bold ${isDark ? "text-white" : "text-[#111b21]"
              }`}
          >
            Edit favourites
          </h2>
        </div>

        <button
          type="button"
          onClick={onSave}
          className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
              ? "hover:bg-[#202c33] text-gray-200"
              : "hover:bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21]"
            }`}
          title="Save changes"
        >
          <MdCheck className="text-2xl font-bold" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin">
        {localList.length === 0 ? (
          <div
            className={`py-20 text-center text-sm ${isDark ? "text-[#8696a0]" : "text-[#54656f]"
              }`}
          >
            No favourites to edit
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-500/10">
            {localList.map((fav, index) => {
              const id = fav.contactId || fav._id;
              const name = fav.username || fav.name;

              return (
                <div
                  key={id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`py-3 px-1 flex items-center justify-between gap-3 group transition-all rounded-xl ${draggedIndex === index
                      ? "opacity-30"
                      : dragOverIndex === index
                        ? "border-t-2 border-[#00a884] bg-[#00a884]/5"
                        : isDark
                          ? "hover:bg-[#202c33]/40"
                          : "hover:bg-[#f5f6f6]"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`cursor-grab active:cursor-grabbing p-1.5 transition-colors flex items-center justify-center shrink-0 select-none ${isDark
                          ? "text-[#8696a0] hover:text-white"
                          : "text-[#8696a0] hover:text-[#111b21]"
                        }`}
                      title="Drag to reorder"
                    >
                      <div className="w-5 flex flex-col gap-1 py-1">
                        <div className="h-[2px] bg-current rounded-full w-full" />
                        <div className="h-[2px] bg-current rounded-full w-full" />
                      </div>
                    </div>

                    <ContactAvatar contact={fav} size={48} />

                    <div
                      className={`font-medium text-[16px] truncate ${isDark ? "text-white" : "text-[#111b21]"
                        }`}
                    >
                      {name}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(id)}
                    className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 ${isDark
                        ? "text-[#8696a0] hover:text-white hover:bg-red-500/10"
                        : "text-[#54656f] hover:text-red-600 hover:bg-red-50"
                      }`}
                    title="Remove from favourites"
                  >
                    <MdClose className="text-xl" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   DEFAULT EXPORT (COMPATIBLE COMPONENT)
   ========================================================================= */
const FaviouriteCall = ({
  isOpen,
  onClose,
  contacts = [],
}) => {
  return (
    <AddFavouritesModal
      isOpen={isOpen}
      onClose={onClose}
      contacts={contacts}
    />
  );
};

export default FaviouriteCall;