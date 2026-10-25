import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { MdReceiptLong, MdCheck } from "react-icons/md";
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
      const id = (u._id || u.id || u.userId || u)?.toString();
      if (!id || seen.has(id)) return;
      seen.add(id);

      const isCurrent = id === (currentUser?._id || currentUser?.id)?.toString();
      list.push({
        userId: id,
        name: isCurrent
          ? "You"
          : u.username || u.name || "Participant",
        avatar: isCurrent
          ? currentUser?.profilePicture || ""
          : u.profilePicture || u.avatar || "",
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

  const selectedCount = selectedIds.size;
  const numTotal = parseFloat(totalAmount) || 0;
  const equalPerPerson = selectedCount > 0 ? (numTotal / selectedCount).toFixed(2) : 0;

  const customSum = useMemo(() => {
    let sum = 0;
    selectedIds.forEach((id) => {
      sum += parseFloat(customShares[id]) || 0;
    });
    return sum;
  }, [selectedIds, customShares]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title for the bill");
      return;
    }
    if (numTotal <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (selectedCount === 0) {
      toast.error("Select at least one participant");
      return;
    }

    if (splitType === "custom" && Math.abs(customSum - numTotal) > 0.05) {
      toast.error(`Custom shares (${currency}${customSum.toFixed(2)}) must match total (${currency}${numTotal})`);
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
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center px-4 backdrop-blur-md ${isDark ? "bg-black/75" : "bg-black/35"
        }`}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] ${isDark
          ? "bg-[#111b21] border-white/10 text-white"
          : "bg-white border-black/10 text-gray-900"
          }`}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${isDark ? "border-white/10 bg-[#202c33]/50" : "border-black/5 bg-gray-50"
            }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <MdReceiptLong size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-[17px] leading-tight">
                Split a Bill
              </h3>
              <p
                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"
                  }`}
              >
                Share and settle expenses instantly
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
              ? "hover:bg-white/10 text-gray-400 hover:text-white"
              : "hover:bg-black/10 text-gray-500 hover:text-gray-900"
              }`}
          >
            <RxCross2 size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
              Bill / Expense Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Team Dinner, Uber Ride, Groceries"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all ${isDark
                ? "bg-[#202c33] border-white/10 focus:border-cyan-500 text-white placeholder-gray-500"
                : "bg-gray-50 border-black/10 focus:border-cyan-600 text-gray-900 placeholder-gray-400"
                }`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all ${isDark
                  ? "bg-[#202c33] border-white/10 focus:border-cyan-500 text-white"
                  : "bg-gray-50 border-black/10 focus:border-cyan-600 text-gray-900"
                  }`}
              >
                <option value="₹">₹ INR</option>
                <option value="$">$ USD</option>
                <option value="€">€ EUR</option>
                <option value="£">£ GBP</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                Total Amount
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none font-semibold transition-all ${isDark
                  ? "bg-[#202c33] border-white/10 focus:border-cyan-500 text-white placeholder-gray-500"
                  : "bg-gray-50 border-black/10 focus:border-cyan-600 text-gray-900 placeholder-gray-400"
                  }`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-80">
                Split Mode
              </label>
              <div className={`inline-flex rounded-lg p-0.5 border ${isDark ? "bg-[#202c33] border-white/10" : "bg-gray-100 border-black/10"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setSplitType("equal")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${splitType === "equal"
                    ? "bg-cyan-500 text-white shadow-sm"
                    : "opacity-70 hover:opacity-100"
                    }`}
                >
                  Equally
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType("custom")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${splitType === "custom"
                    ? "bg-cyan-500 text-white shadow-sm"
                    : "opacity-70 hover:opacity-100"
                    }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {splitType === "equal" && numTotal > 0 && selectedCount > 0 && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center justify-between ${isDark ? "bg-cyan-950/40 text-cyan-200 border border-cyan-800/40" : "bg-cyan-50 text-cyan-800 border border-cyan-200"
                  }`}
              >
                <span>Each person pays:</span>
                <span className="font-bold text-sm">
                  {currency}
                  {equalPerPerson}
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                <FaUserFriends /> Split Among ({selectedCount})
              </label>
              <span className="text-[11px] opacity-60">Tap to toggle</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {participants.map((p) => {
                const isSelected = selectedIds.has(p.userId);
                return (
                  <div
                    key={p.userId}
                    onClick={() => toggleSelect(p.userId)}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${isSelected
                      ? isDark
                        ? "bg-[#202c33] border-cyan-500/40"
                        : "bg-cyan-50/60 border-cyan-400"
                      : isDark
                        ? "bg-black/20 border-white/5 opacity-60"
                        : "bg-gray-50 border-black/5 opacity-60"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs ${isSelected
                        ? "bg-cyan-500 border-cyan-500 text-white"
                        : isDark
                          ? "border-white/20"
                          : "border-black/20"
                        }`}
                      >
                        {isSelected && <MdCheck size={14} />}
                      </div>

                      {p.avatar ? (
                        <img
                          src={p.avatar}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-cyan-700 text-white flex items-center justify-center text-xs font-bold">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <span className="text-sm font-medium">
                        {p.name} {p.isCurrent && "(You)"}
                      </span>
                    </div>

                    {isSelected && (
                      <div onClick={(e) => e.stopPropagation()}>
                        {splitType === "equal" ? (
                          <span className="text-xs font-semibold opacity-75">
                            {currency}
                            {equalPerPerson}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-xs opacity-60">{currency}</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={customShares[p.userId] || ""}
                              onChange={(e) =>
                                setCustomShares({
                                  ...customShares,
                                  [p.userId]: e.target.value,
                                })
                              }
                              className={`w-16 px-2 py-1 text-right text-xs rounded-lg border outline-none font-semibold ${isDark
                                ? "bg-[#111b21] border-white/20 text-white"
                                : "bg-white border-black/20 text-gray-900"
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
            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${isDark ? "bg-[#202c33]/70 border-white/10" : "bg-gray-50 border-black/10"
              }`}
          >
            <input
              type="checkbox"
              checked={creatorPaid}
              onChange={(e) => setCreatorPaid(e.target.checked)}
              className="checkbox checkbox-xs checkbox-primary"
            />
            <span className="text-xs font-medium">
              I already paid my share (or paid the merchant upfront)
            </span>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${isDark
                ? "border-white/10 hover:bg-white/5 text-gray-300"
                : "border-black/10 hover:bg-black/5 text-gray-600"
                }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md active:scale-98 cursor-pointer"
            >
              Send Split Bill
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SplitBillModal;
