import React, { useState } from "react";
import { MdReceiptLong, MdCheckCircle, MdRadioButtonUnchecked } from "react-icons/md";
import { HiSparkles } from "react-icons/hi2";
import { useChatStore } from "../../../store/chatStore";

export const MessageSplitBillContent = ({
  message,
  effectiveUser,
  isDark,
  renderTimestampAndStatus,
}) => {
  const toggleSplitBillPayment = useChatStore(
    (state) => state.toggleSplitBillPayment,
  );
  const [loadingUserId, setLoadingUserId] = useState(null);

  let bill = message.splitBillData;
  if (typeof bill === "string") {
    try {
      bill = JSON.parse(bill);
    } catch (e) {
      bill = null;
    }
  }

  if (!bill) {
    return (
      <div className="text-sm italic opacity-75">
        🧾 {message.content || "Split Bill"}
      </div>
    );
  }

  const currentUserId = (
    effectiveUser?._id ||
    effectiveUser?.id ||
    effectiveUser?.userId
  )?.toString();

  const isCreator =
    (message.sender?._id || message.sender)?.toString() === currentUserId;

  const participants = Array.isArray(bill.participants) ? bill.participants : [];
  const totalAmount = parseFloat(bill.totalAmount) || 0;
  const currency = bill.currency || "₹";

  const paidCount = participants.filter((p) => Boolean(p.isPaid)).length;
  const totalCount = participants.length;
  const paidSum = participants
    .filter((p) => Boolean(p.isPaid))
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const percent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
  const isSettled = bill.isSettled || (totalCount > 0 && paidCount === totalCount);

  const myParticipant = participants.find(
    (p) => (p.user?._id || p.user || p.userId)?.toString() === currentUserId,
  );
  const canPayMyShare = myParticipant && !myParticipant.isPaid;

  const handleToggle = async (targetUserId) => {
    if (!message._id || loadingUserId) return;
    setLoadingUserId(targetUserId);
    try {
      if (typeof toggleSplitBillPayment === "function") {
        await toggleSplitBillPayment(message._id, targetUserId);
      }
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="flex flex-col min-w-[270px] max-w-[330px] w-full select-none">
      <div className="flex items-start gap-3">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${isDark
            ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30"
            : "bg-emerald-100 text-emerald-700 border-emerald-200"
            }`}
        >
          <MdReceiptLong size={24} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isDark ? "bg-emerald-900/40 text-emerald-300 border border-emerald-500/30" : "bg-emerald-100 text-emerald-800"
                }`}
            >
              Split Bill
            </span>
            {isSettled && (
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <HiSparkles /> Settled
              </span>
            )}
          </div>
          <h4 className="text-[16px] font-bold leading-tight break-words mt-1">
            {bill.title}
          </h4>
          <p className="text-[20px] font-extrabold text-emerald-500 dark:text-emerald-400 mt-0.5 tracking-tight">
            {currency}
            {totalAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] mb-1 opacity-80 font-medium">
          <span>
            {paidCount} of {totalCount} paid
          </span>
          <span>
            {currency}
            {paidSum.toFixed(2)} / {currency}
            {totalAmount.toFixed(2)}
          </span>
        </div>
        <div
          className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-black/10"
            }`}
        >
          <div
            className={`h-full transition-all duration-500 rounded-full ${isSettled
              ? "bg-emerald-500"
              : "bg-gradient-to-r from-emerald-600 via-[#00a884] to-teal-400"
              }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-3 space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
        {participants.map((p, idx) => {
          const pId = (p.user?._id || p.user || p.userId)?.toString();
          const isMe = pId === currentUserId;
          const isPaid = Boolean(p.isPaid);
          const canClick = isCreator || isMe;

          return (
            <div
              key={pId || idx}
              onClick={() => {
                if (canClick) handleToggle(pId);
              }}
              className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all ${canClick ? "cursor-pointer hover:scale-[1.01]" : ""
                } ${isPaid
                  ? isDark
                    ? "bg-emerald-950/20 text-gray-200 border border-emerald-900/30"
                    : "bg-emerald-50/70 text-gray-800 border border-emerald-200/60"
                  : isDark
                    ? "bg-white/[0.04] text-gray-300 border border-white/[0.06]"
                    : "bg-black/[0.03] text-gray-700 border border-black/[0.05]"
                }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {canClick ? (
                  <button
                    type="button"
                    disabled={loadingUserId === pId}
                    className="shrink-0 transition-transform active:scale-90"
                    title={isPaid ? "Mark as unpaid" : "Mark as paid"}
                  >
                    {isPaid ? (
                      <MdCheckCircle
                        className="text-emerald-500"
                        size={17}
                      />
                    ) : (
                      <MdRadioButtonUnchecked
                        className="text-gray-400 hover:text-emerald-400"
                        size={17}
                      />
                    )}
                  </button>
                ) : isPaid ? (
                  <MdCheckCircle className="text-emerald-500 shrink-0" size={17} />
                ) : (
                  <MdRadioButtonUnchecked className="text-gray-400 shrink-0" size={17} />
                )}

                <span className="truncate font-medium">
                  {p.name} {isMe && "(You)"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                <span className="font-bold">
                  {currency}
                  {parseFloat(p.amount || 0).toFixed(2)}
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isPaid
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                    }`}
                >
                  {isPaid ? "Paid" : "Pending"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {canPayMyShare && (
        <button
          type="button"
          disabled={loadingUserId === currentUserId}
          onClick={() => handleToggle(currentUserId)}
          className="mt-3 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <MdCheckCircle size={16} />
          <span>Mark My Share as Paid ({currency}{parseFloat(myParticipant.amount || 0).toFixed(2)})</span>
        </button>
      )}

      <div className="flex items-center justify-end mt-2 pt-1 text-[11px] opacity-75">
        {renderTimestampAndStatus(false)}
      </div>
    </div>
  );
};

export default MessageSplitBillContent;
