import React, { useRef, useState } from 'react'
import useOutsideClick from '../hook/useOutsideClick';
import { FaRegFaceSmile, FaSquarePollHorizontal } from 'react-icons/fa6';
import { AnimatePresence, motion } from "framer-motion"
import { RxCross2 } from 'react-icons/rx';
import { TfiLineDouble } from 'react-icons/tfi';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { BiSolidSend } from 'react-icons/bi';
import EmojiPicker from 'emoji-picker-react';

const PollModal = ({ onClose, onSend, theme }) => {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [allowMultiple, setAllowMultiple] = useState(false);
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [dragOverIdx, setDragOverIdx] = useState(null);
    const [activeEmojiTarget, setActiveEmojiTarget] = useState(null);
    const emojiPickerRef = useRef(null);
    const isDark = theme === "dark";

    useOutsideClick(emojiPickerRef, (e) => {
        if (e?.target?.closest?.("button[data-emoji-trigger='true']")) {
            return;
        }
        if (activeEmojiTarget !== null) {
            setActiveEmojiTarget(null);
        }
    });

    const handleEmojiSelect = (emojiObject) => {
        if (!emojiObject?.emoji) return;
        const emoji = emojiObject.emoji;
        if (activeEmojiTarget === "question") {
            setQuestion((prev) => prev + emoji);
        } else if (typeof activeEmojiTarget === "number") {
            setOptions((prev) => {
                const updated = [...prev];
                updated[activeEmojiTarget] = (updated[activeEmojiTarget] || "") + emoji;
                return updated;
            });
        }
    };

    const handleOptionChange = (val, idx) => {
        const updated = [...options];
        updated[idx] = val;
        setOptions(updated);
    };

    const addOption = () => {
        if (options.length < 12) {
            setOptions([...options, ""]);
        }
    };

    const removeOption = (idx) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== idx));
        }
    };

    const handleDragStart = (e, index) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverIdx !== index) {
            setDragOverIdx(index);
        }
    };

    const handleDrop = (e, targetIdx) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === targetIdx) {
            setDraggedIdx(null);
            setDragOverIdx(null);
            return;
        }
        const updated = [...options];
        const [movedItem] = updated.splice(draggedIdx, 1);
        updated.splice(targetIdx, 0, movedItem);
        setOptions(updated);
        setDraggedIdx(null);
        setDragOverIdx(null);
    };

    const handleDragEnd = () => {
        setDraggedIdx(null);
        setDragOverIdx(null);
    };

    const validOptions = options.filter((o) => o.trim() !== "");
    const canSubmit = question.trim() !== "" && validOptions.length >= 2;

    return (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
            <div className="flex flex-col md:flex-row items-center justify-center gap-3.5 max-w-full">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className={`w-[92vw] max-w-md rounded-2xl border shadow-2xl p-6 relative ${isDark
                        ? "bg-[#111b21] border-white/10 text-white"
                        : "bg-white border-gray-200 text-gray-900"
                        }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
                        <div className="flex items-center gap-2">
                            <FaSquarePollHorizontal className="text-green-600" size={20} />
                            <h2 className="text-lg font-bold">Create poll</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
                            title="Close"
                        >
                            <RxCross2 size={18} />
                        </button>
                    </div>

                    <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                        <div>
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Question
                            </label>

                            <div className="relative mt-1.5">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="Ask a question..."
                                    className={`w-full px-3.5 py-2.5 pr-11 rounded-xl border text-sm outline-none transition-all duration-200 ${isDark
                                        ? "bg-[#202c33] border-white/10 text-white placeholder-gray-400 hover:border-white/25 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30"
                                        }`}
                                    autoFocus
                                />

                                <button
                                    type="button"
                                    data-emoji-trigger="true"
                                    onClick={() =>
                                        setActiveEmojiTarget((prev) =>
                                            prev === "question" ? null : "question"
                                        )
                                    }
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                                    title="Add emoji to question"
                                >
                                    <FaRegFaceSmile
                                        className={`transition-transform duration-200 ${activeEmojiTarget === "question"
                                            ? "text-emerald-500 scale-110"
                                            : isDark
                                                ? "text-gray-400 hover:text-emerald-400 hover:scale-110"
                                                : "text-gray-500 hover:text-emerald-600 hover:scale-110"
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Options
                            </label>
                            <div className="space-y-2.5 mt-1.5">
                                {options.map((opt, idx) => (
                                    <div
                                        key={idx}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDrop={(e) => handleDrop(e, idx)}
                                        className={`flex items-center gap-2 rounded-xl transition-all duration-150 ${draggedIdx === idx
                                            ? "opacity-35 scale-[0.98]"
                                            : "opacity-100"
                                            } ${dragOverIdx === idx && draggedIdx !== idx
                                                ? "ring-2 ring-emerald-500 bg-emerald-500/10 p-0.5"
                                                : ""
                                            }`}
                                    >
                                        <span className="text-xs font-bold w-4 shrink-0 text-center select-none text-gray-500 dark:text-gray-400">
                                            {idx + 1}
                                        </span>
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => handleOptionChange(e.target.value, idx)}
                                                placeholder={`Option ${idx + 1}`}
                                                className={`w-full px-3 py-2 pr-16 rounded-xl border text-sm outline-none transition-all duration-200 ${isDark
                                                    ? "bg-[#202c33] border-white/10 text-white placeholder-gray-400 hover:border-white/25 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                                                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30"
                                                    }`}
                                            />
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    data-emoji-trigger="true"
                                                    onClick={() =>
                                                        setActiveEmojiTarget((prev) =>
                                                            prev === idx ? null : idx
                                                        )
                                                    }
                                                    className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                                                    title={`Add emoji to option ${idx + 1}`}
                                                >
                                                    <FaRegFaceSmile
                                                        className={`transition-transform duration-200 ${activeEmojiTarget === idx
                                                            ? "text-emerald-500 scale-110"
                                                            : isDark
                                                                ? "text-gray-400 hover:text-emerald-400 hover:scale-110"
                                                                : "text-gray-500 hover:text-emerald-600 hover:scale-110"
                                                            }`}
                                                    />
                                                </button>

                                                <div
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, idx)}
                                                    onDragEnd={handleDragEnd}
                                                    className="p-1 cursor-grab active:cursor-grabbing hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center select-none"
                                                    title="Drag to reorder option"
                                                >
                                                    <TfiLineDouble
                                                        className={`pointer-events-none transition-colors ${isDark
                                                            ? "text-gray-500 hover:text-emerald-400"
                                                            : "text-gray-400 hover:text-emerald-600"
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {options.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(idx)}
                                                className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-full active:scale-90 transition-all cursor-pointer shrink-0"
                                                title={`Remove option ${idx + 1}`}
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {options.length < 12 && (
                                <button
                                    type="button"
                                    onClick={addOption}
                                    title="Add another option"
                                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-500 hover:text-emerald-400 active:scale-95 px-2 py-1 -ml-2 rounded-lg hover:bg-emerald-500/10 transition-all cursor-pointer"
                                >
                                    <FaPlus size={10} /> Add option
                                </button>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Allow multiple answers</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    People can select more than one option
                                </p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={allowMultiple}
                                onClick={() => setAllowMultiple(!allowMultiple)}
                                title={allowMultiple ? "Disable multiple answers" : "Allow multiple answers"}
                                className={`w-11 h-6 rounded-full transition-all duration-200 p-0.5 relative cursor-pointer hover:scale-105 active:scale-95 ${allowMultiple
                                    ? "bg-emerald-500"
                                    : isDark
                                        ? "bg-gray-700 hover:bg-gray-600"
                                        : "bg-gray-300 hover:bg-gray-400"
                                    }`}
                            >
                                <div
                                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${allowMultiple ? "translate-x-5" : "translate-x-0"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all active:scale-95 ${isDark
                                ? "hover:bg-white/10 text-gray-300"
                                : "hover:bg-black/5 text-gray-600"
                                }`}
                            title="Cancel"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!canSubmit}
                            onClick={() =>
                                onSend({ question, options: validOptions, allowMultiple })
                            }
                            className="p-3 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 hover:scale-105 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 cursor-pointer rounded-full"
                            title="Send poll"
                        >
                            <BiSolidSend className="text-white" size={20} />
                        </button>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {activeEmojiTarget !== null && (
                        <motion.div
                            ref={emojiPickerRef}
                            initial={{ opacity: 0, x: -15, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -15, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`w-[320px] xs:w-[340px] sm:w-[350px] max-w-[92vw] h-[490px] max-h-[85vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col shrink-0 ${isDark
                                ? "bg-[#111b21] border-white/10 text-white"
                                : "bg-white border-gray-200 text-gray-900"
                                }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10 shrink-0">
                                <div className="flex items-center gap-2">
                                    <FaRegFaceSmile className="text-emerald-500" size={16} />
                                    <h3 className="text-sm font-semibold">
                                        {activeEmojiTarget === "question"
                                            ? "Add emoji to Question"
                                            : `Add emoji to Option ${activeEmojiTarget + 1}`}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveEmojiTarget(null)}
                                    className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                                    title="Close emoji picker"
                                >
                                    <RxCross2 size={16} />
                                </button>
                            </div>

                            <div className="flex-1 w-full overflow-hidden flex justify-center [&_.EmojiPickerReact]:!border-none [&_.EmojiPickerReact]:!w-full [&_.EmojiPickerReact]:!h-full">
                                <EmojiPicker
                                    theme={isDark ? "dark" : "light"}
                                    onEmojiClick={handleEmojiSelect}
                                    width="100%"
                                    height="100%"
                                    lazyLoadEmojis={true}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PollModal