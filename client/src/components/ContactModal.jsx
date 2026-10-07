import React, { useState } from 'react'
import {motion} from "framer-motion"
import { RiContactsFill } from "react-icons/ri"
import { RxCross2 } from "react-icons/rx"

const ContactModal = ({ onClose, onSend, conversations, theme }) => {
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [activeTab, setActiveTab] = useState("chats");
    const isDark = theme === "dark";

    const allContacts =
        conversations?.data?.flatMap((c) => c.participants) || [];
    const uniqueContacts = Array.from(
        new Map(allContacts.map((c) => [c._id, c])).values()
    );

    return (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${isDark
                    ? "bg-[#111b21] border-white/10 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-2">
                        <RiContactsFill className="text-cyan-500" size={20} />
                        <h2 className="text-lg font-bold">Share Contact</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                    >
                        <RxCross2 size={18} />
                    </button>
                </div>

                <div className="flex gap-2 my-4 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                    <button
                        type="button"
                        onClick={() => setActiveTab("chats")}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${activeTab === "chats"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "opacity-70 hover:opacity-100"
                            }`}
                    >
                        From Chats
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("manual")}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${activeTab === "manual"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "opacity-70 hover:opacity-100"
                            }`}
                    >
                        Enter Details
                    </button>
                </div>

                {activeTab === "chats" ? (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                        {uniqueContacts.length > 0 ? (
                            uniqueContacts.map((contact) => (
                                <div
                                    key={contact._id}
                                    onClick={() =>
                                        onSend({
                                            name: contact.username || "User",
                                            phoneNumber: contact.phoneNumber || "",
                                            email: contact.email || "",
                                            avatar: contact.profilePicture || "",
                                        })
                                    }
                                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${isDark
                                        ? "border-white/5 hover:bg-white/10"
                                        : "border-black/5 hover:bg-black/5"
                                        }`}
                                >
                                    <img
                                        src={contact.profilePicture || "/default-avatar.png"}
                                        alt={contact.username}
                                        className="w-10 h-10 rounded-full object-cover shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">
                                            {contact.username}
                                        </p>
                                        <p className="text-xs opacity-60 truncate">
                                            {contact.phoneNumber || contact.email || "Contact"}
                                        </p>
                                    </div>
                                    <span className="text-xs text-emerald-500 font-semibold">
                                        Share
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-8 text-xs opacity-60">
                                No contacts found
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3.5">
                        <div>
                            <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                                Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Full name"
                                className={`mt-1 w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${isDark
                                    ? "bg-[#202c33] border-white/10 focus:border-emerald-500"
                                    : "bg-gray-50 border-gray-300 focus:border-emerald-600"
                                    }`}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                                Phone Number *
                            </label>
                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+1 234 567 8900"
                                className={`mt-1 w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${isDark
                                    ? "bg-[#202c33] border-white/10 focus:border-emerald-500"
                                    : "bg-gray-50 border-gray-300 focus:border-emerald-600"
                                    }`}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                                Email (Optional)
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className={`mt-1 w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${isDark
                                    ? "bg-[#202c33] border-white/10 focus:border-emerald-500"
                                    : "bg-gray-50 border-gray-300 focus:border-emerald-600"
                                    }`}
                            />
                        </div>
                        <div className="pt-2 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!name.trim() || !phoneNumber.trim()}
                                onClick={() => onSend({ name, phoneNumber, email })}
                                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 transition cursor-pointer"
                            >
                                Share
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ContactModal