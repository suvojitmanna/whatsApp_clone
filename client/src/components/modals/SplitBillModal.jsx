import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import {
  MdReceiptLong,
  MdCheck,
  MdEditNote,
  MdOutlineAccountBalanceWallet,
  MdAutoAwesome,
} from "react-icons/md";
import { FaUserFriends } from "react-icons/fa";
import { toast } from "react-toastify";
import useUserStore from "../../store/useUserStore";

export const SplitBillModal = ({
  isOpen = true,
  onClose,
  onSend,
  selectedContact,
  currentConversation,
  groupParticipants = [],
  theme = "dark",
}) => {
  const isDark = theme === "dark";
  const { user: currentUser } = useUserStore();
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [currency, setCurrency] = useState("₹");
  const [splitType, setSplitType] = useState("equal");
  const [customShares, setCustomShares] = useState({});
  const [creatorPaid, setCreatorPaid] = useState(true);

  const participants = useMemo(() => {
    const list = [];
    const seen = new Set();

    const addPerson = (u) => {
      if (!u) return;
      const id = (u._id || u.id || u.userId || u.contactId || u)?.toString();
      if (!id || seen.has(id)) return;
      seen.add(id);

      const isCurrent = id === (currentUser?._id || currentUser?.id)?.toString();
      list.push({
        userId: id,
        name: isCurrent
          ? "You"
          : u.username || u.name || u.contactName || "Participant",
        avatar: isCurrent
          ? currentUser?.profilePicture || ""
          : u.profilePicture || u.avatar || u.contactAvatar || "",
        isCurrent,
      });
    };

    if (currentUser) {
      addPerson(currentUser);
    }

    if (Array.isArray(groupParticipants) && groupParticipants.length > 0) {
      groupParticipants.forEach(addPerson);
    } else if (
      currentConversation?.participants &&
      Array.isArray(currentConversation.participants)
    ) {
      currentConversation.participants.forEach(addPerson);
    } else if (selectedContact) {
      addPerson(selectedContact);
    }

    return list;
  }, [currentUser, groupParticipants, currentConversation, selectedContact]);

  const [selectedIds, setSelectedIds] = useState(() =>
    new Set(participants.map((p) => p.userId)),
  );

  useEffect(() => {
    if (participants.length > 0 && selectedIds.size === 0) {
      setSelectedIds(new Set(participants.map((p) => p.userId)));
    }
  }, [participants]);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      if (next.size <= 1) {
        toast.info("At least one participant is required");
        return;
      }
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === participants.length) {
      const selfId = (currentUser?._id || currentUser?.id)?.toString();
      setSelectedIds(new Set(selfId ? [selfId] : []));
    } else {
      setSelectedIds(new Set(participants.map((p) => p.userId)));
    }
  };

  const handleAddPreset = (increment) => {
    const current = parseFloat(totalAmount) || 0;
    setTotalAmount(String(current + increment));
  };

  const selectedCount = selectedIds.size;
  const numTotal = parseFloat(totalAmount) || 0;
  const equalPerPerson = selectedCount > 0 ? (numTotal / selectedCount).toFixed(2) : "0.00";

  const customSum = useMemo(() => {
    let sum = 0;
    selectedIds.forEach((id) => {
      sum += parseFloat(customShares[id]) || 0;
    });
    return sum;
  }, [selectedIds, customShares]);
  const remainingCustom = numTotal - customSum;

  const handleAutoFillRemaining = () => {
    if (remainingCustom <= 0) return;
    const unallocated = Array.from(selectedIds).filter(
      (id) => !(parseFloat(customShares[id]) > 0),
    );
    if (unallocated.length > 0) {
      const share = (remainingCustom / unallocated.length).toFixed(2);
      const next = { ...customShares };
      unallocated.forEach((id) => {
        next[id] = share;
      });
      setCustomShares(next);
      toast.success("Distributed remaining amount equally");
    } else {
      const sharePerPerson = (remainingCustom / selectedIds.size).toFixed(2);
      const next = { ...customShares };
      selectedIds.forEach((id) => {
        const cur = parseFloat(next[id]) || 0;
        next[id] = (cur + parseFloat(sharePerPerson)).toFixed(2);
      });
      setCustomShares(next);
      toast.success("Distributed remaining amount");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title for the bill");
      return;
    }
    if (numTotal <= 0) {
      toast.error("Please enter a valid bill amount");
      return;
    }
    if (selectedCount === 0) {
      toast.error("Select at least one participant");
      return;
    }

    if (splitType === "custom" && Math.abs(customSum - numTotal) > 0.05) {
      toast.error(
        `Custom shares (${currency}${customSum.toFixed(2)}) must equal total (${currency}${numTotal.toFixed(2)})`,
      );
      return;
    }

    const currentId = (currentUser?._id || currentUser?.id)?.toString();
    const compiledParticipants = participants
      .filter((p) => selectedIds.has(p.userId))
      .map((p) => {
        const share =
          splitType === "equal"
            ? parseFloat(equalPerPerson)
            : parseFloat(customShares[p.userId]) || 0;
        const isSelf = p.userId === currentId;
        const isPaid = isSelf ? Boolean(creatorPaid) : false;

        return {
          userId: p.userId,
          name: p.name,
          avatar: p.avatar,
          amount: share,
          isPaid,
          paidAt: isPaid ? new Date() : null,
        };
      });

    const isSettled = compiledParticipants.every((p) => p.isPaid);
    const billData = {
      title: title.trim(),
      totalAmount: numTotal,
      currency,
      splitType,
      isSettled,
      createdAt: new Date(),
      createdBy: {
        userId: currentId,
        name: currentUser?.username || "You",
      },
      participants: compiledParticipants,
    };

    onSend(billData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md select-none animate-fadeIn"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-[460px] overflow-hidden rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] ${isDark
            ? "bg-[#1f2c34] border-white/10 text-[#e9edef] shadow-black/80"
            : "bg-white border-black/10 text-[#111b21] shadow-2xl"
            }`}
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-[#00a884] to-teal-400 shrink-0" />

          <div className={`flex items-center justify-between px-5 py-2.5 border-b shrink-0 ${isDark ? "border-white/10 bg-[#182229]" : "border-black/5 bg-[#f0f2f5]"}`} >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0 border border-emerald-500/30 shadow-inner">
                <MdReceiptLong />
              </div>
              <div>
                <h3 className="font-bold text-[16px] leading-tight">Split a Bill</h3>
                <p className="text-[11.5px] opacity-70">
                  Calculate shares and track repayments easily
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-full transition-colors cursor-pointer ${isDark
                ? "hover:bg-white/10 text-gray-400 hover:text-white"
                : "hover:bg-black/5 text-gray-500 hover:text-black"
                }`}
              title="Close (Esc)"
            >
              <RxCross2 size={18} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 no-scrollbar"
          >
            <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${isDark
              ? "bg-[#111b21] border-white/10"
              : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="mb-3">
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 opacity-70">
                  Bill / Expense Title
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <MdEditNote size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Team Dinner, Uber Ride, Groceries"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full py-2.5 pl-10 pr-3.5 rounded-xl text-sm border outline-none transition-all ${isDark
                      ? "bg-[#202c33] border-white/10 focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 text-white placeholder-gray-500"
                      : "bg-white border-black/10 focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 text-gray-900 placeholder-gray-400 shadow-2xs"
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 opacity-70">
                  Total Bill Amount
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={`h-12 px-3 rounded-xl text-sm font-semibold border outline-none transition-all cursor-pointer ${isDark
                      ? "bg-[#202c33] border-white/10 focus:border-[#00a884] text-white"
                      : "bg-white border-black/10 focus:border-[#00a884] text-gray-900 shadow-2xs"
                      }`}
                  >
                    <option value="₹">₹ INR</option>
                    <option value="$">$ USD</option>
                    <option value="€">€ EUR</option>
                    <option value="£">£ GBP</option>
                    <option value="AED">AED</option>
                  </select>

                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      className={`w-full h-12 px-3.5 rounded-xl text-2xl font-bold tracking-tight border outline-none transition-all ${isDark
                        ? "bg-[#202c33] border-white/10 focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 text-white placeholder-gray-600"
                        : "bg-white border-black/10 focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 text-gray-900 placeholder-gray-300 shadow-2xs"
                        }`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-[10.5px] opacity-60 shrink-0 mr-1">Quick add:</span>
                  {[50, 100, 250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleAddPreset(amt)}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${isDark
                        ? "border-white/10 bg-white/5 hover:bg-[#00a884]/20 hover:border-[#00a884]/40 hover:text-emerald-400 text-gray-300"
                        : "border-black/10 bg-white hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 text-gray-700 shadow-2xs"
                        }`}
                    >
                      +{currency}{amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                  Split Strategy
                </label>
                <div className={`inline-flex rounded-xl p-1 border ${isDark ? "bg-[#111b21] border-white/10" : "bg-gray-100 border-black/10"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSplitType("equal")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${splitType === "equal"
                      ? "bg-gradient-to-r from-emerald-600 to-[#00a884] text-white shadow-sm"
                      : "opacity-70 hover:opacity-100"
                      }`}
                  >
                    Equally
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitType("custom")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${splitType === "custom"
                      ? "bg-gradient-to-r from-emerald-600 to-[#00a884] text-white shadow-sm"
                      : "opacity-70 hover:opacity-100"
                      }`}
                  >
                    Custom Shares
                  </button>
                </div>
              </div>

              {splitType === "equal" && numTotal > 0 && selectedCount > 0 && (
                <div className={`p-3 rounded-2xl text-xs flex items-center justify-between border transition-all ${isDark
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                  : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Each person pays ({selectedCount} people):</span>
                  </div>
                  <span className="font-extrabold text-sm sm:text-base tracking-tight">
                    {currency}
                    {equalPerPerson}
                  </span>
                </div>
              )}

              {splitType === "custom" && numTotal > 0 && (
                <div className={`p-3 rounded-2xl border transition-all space-y-2 ${isDark ? "bg-[#111b21] border-white/10" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>
                      Allocated:{" "}
                      <strong className="text-emerald-500">
                        {currency}
                        {customSum.toFixed(2)}
                      </strong>{" "}
                      / {currency}
                      {numTotal.toFixed(2)}
                    </span>
                    {Math.abs(remainingCustom) < 0.05 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <MdCheck size={13} /> Balanced
                      </span>
                    ) : remainingCustom > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Remaining: {currency}{remainingCustom.toFixed(2)}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        Over: {currency}{Math.abs(remainingCustom).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-black/10"
                    }`}
                  >
                    <div className={`h-full transition-all duration-300 rounded-full ${Math.abs(remainingCustom) < 0.05
                      ? "bg-emerald-500"
                      : remainingCustom > 0
                        ? "bg-amber-500"
                        : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (customSum / (numTotal || 1)) * 100)}%`,
                      }}
                    />
                  </div>

                  {remainingCustom > 0 && (
                    <button
                      type="button"
                      onClick={handleAutoFillRemaining}
                      className="w-full mt-1 py-1.5 px-2.5 rounded-xl text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MdAutoAwesome size={14} />
                      <span>Distribute remaining {currency}{remainingCustom.toFixed(2)}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                  <FaUserFriends /> Split Among ({selectedCount} of {participants.length})
                </label>

                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold cursor-pointer transition-colors"
                >
                  {selectedIds.size === participants.length ? "Select You Only" : "Select All"}
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                {participants.map((p) => {
                  const isSelected = selectedIds.has(p.userId);
                  return (
                    <div
                      key={p.userId}
                      onClick={() => toggleSelect(p.userId)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${isSelected
                        ? isDark
                          ? "bg-[#202c33] border-emerald-500/40 text-white shadow-xs"
                          : "bg-emerald-50/70 border-emerald-300/80 text-gray-900 shadow-xs"
                        : isDark
                          ? "bg-black/20 border-white/5 opacity-50 hover:opacity-80"
                          : "bg-gray-100/70 border-black/5 opacity-50 hover:opacity-80"
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs shrink-0 transition-all ${isSelected
                          ? "bg-[#00a884] border-[#00a884] text-white scale-105 shadow-xs"
                          : isDark
                            ? "border-white/20 bg-transparent"
                            : "border-black/20 bg-transparent"
                          }`}
                        >
                          {isSelected && <MdCheck size={14} />}
                        </div>

                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-black/10 dark:border-white/10"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1 truncate">
                          <span className="text-sm font-semibold truncate block">
                            {p.name}
                          </span>
                          {p.isCurrent && (
                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                              (Organizer)
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0"
                        >
                          {splitType === "equal" ? (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30">
                              {currency}
                              {equalPerPerson}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-emerald-500">
                                {currency}
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder="0"
                                value={customShares[p.userId] || ""}
                                onChange={(e) =>
                                  setCustomShares({
                                    ...customShares,
                                    [p.userId]: e.target.value,
                                  })
                                }
                                className={`w-20 px-2.5 py-1 text-right text-xs rounded-xl border outline-none font-bold transition-all ${isDark
                                  ? "bg-[#111b21] border-white/20 focus:border-[#00a884] text-white"
                                  : "bg-white border-black/20 focus:border-[#00a884] text-gray-900 shadow-2xs"
                                  }`}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              onClick={() => setCreatorPaid(!creatorPaid)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${isDark
                ? "bg-[#111b21] border-white/10 hover:border-emerald-500/30"
                : "bg-gray-50 border-gray-200 hover:border-emerald-500/30"
                }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs shrink-0 transition-all ${creatorPaid
                ? "bg-[#00a884] border-[#00a884] text-white scale-105"
                : isDark
                  ? "border-white/20"
                  : "border-black/20"
                }`}
              >
                {creatorPaid && <MdCheck size={14} />}
              </div>
              <div className="flex-1 text-left">
                <span className="text-xs font-semibold block leading-tight">
                  I already paid this bill upfront
                </span>
                <span className="text-[11px] opacity-70 block mt-0.5">
                  Your share will be automatically marked as paid
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all cursor-pointer ${isDark
                  ? "border-white/10 hover:bg-white/5 text-gray-300"
                  : "border-black/10 hover:bg-black/5 text-gray-700"
                  }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-600 via-[#00a884] to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white transition-all shadow-lg shadow-emerald-900/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <MdOutlineAccountBalanceWallet size={18} />
                <span>
                  {numTotal > 0
                    ? `Send Bill • ${currency}${numTotal.toFixed(2)}`
                    : "Send Split Bill"}
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SplitBillModal;
