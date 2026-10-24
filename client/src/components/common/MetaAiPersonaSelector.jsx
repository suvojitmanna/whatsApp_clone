import React, { useState, useEffect, useRef } from "react";
import { FaCaretDown, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";

export const PERSONAS = [
  {
    id: "default",
    name: "Helpful Assistant",
    shortName: "Default",
    icon: "⚡",
    tag: "Balanced",
    color: "from-cyan-400 to-blue-500",
    textColor: "text-cyan-400",
    bgAlpha: "bg-cyan-500/15",
    borderAlpha: "border-cyan-500/30",
    description: "Balanced, friendly, and factual for everyday questions",
  },
  {
    id: "coder",
    name: "Software Architect",
    shortName: "Coder",
    icon: "💻",
    tag: "Tech",
    color: "from-emerald-400 to-teal-500",
    textColor: "text-emerald-400",
    bgAlpha: "bg-emerald-500/15",
    borderAlpha: "border-emerald-500/30",
    description: "Production-ready code, modern patterns, clean architecture",
  },
  {
    id: "tutor",
    name: "Teacher / ELI5",
    shortName: "Tutor",
    icon: "🎓",
    tag: "Learn",
    color: "from-amber-400 to-orange-500",
    textColor: "text-amber-400",
    bgAlpha: "bg-amber-500/15",
    borderAlpha: "border-amber-500/30",
    description: "Explains concepts simply with clear, fun analogies",
  },
  {
    id: "concise",
    name: "Ultra Concise",
    shortName: "Concise",
    icon: "📝",
    tag: "Speed",
    color: "from-indigo-400 to-violet-500",
    textColor: "text-indigo-400",
    bgAlpha: "bg-indigo-500/15",
    borderAlpha: "border-indigo-500/30",
    description: "Direct bullet points, high information density, no fluff",
  },
  {
    id: "creative",
    name: "Creative Writer",
    shortName: "Creative",
    icon: "🎨",
    tag: "Story",
    color: "from-fuchsia-400 to-pink-500",
    textColor: "text-pink-400",
    bgAlpha: "bg-pink-500/15",
    borderAlpha: "border-pink-500/30",
    description: "Vivid storytelling, engaging prose, imaginative ideas",
  },
];

export default function MetaAiPersonaSelector({ theme = "dark", onChange }) {
  const [selectedPersona, setSelectedPersona] = useState(() => {
    return localStorage.getItem("meta_ai_persona") || "default";
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id) => {
    setSelectedPersona(id);
    localStorage.setItem("meta_ai_persona", id);
    setIsOpen(false);
    onChange?.(id);
    const chosen = PERSONAS.find((p) => p.id === id) || PERSONAS[0];
    window.dispatchEvent(
      new CustomEvent("meta_ai_persona_changed", { detail: chosen })
    );
    toast.success(`Meta AI Mode: ${chosen.name} ${chosen.icon}`);
  };

  const current = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];

  return (
    <div className="relative inline-block select-none" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md hover:scale-105 active:scale-95 ${theme === "dark"
            ? "bg-[#182229]/90 hover:bg-[#202c33] text-gray-100 border-white/10 hover:border-cyan-500/40"
            : "bg-white/95 hover:bg-gray-50 text-gray-800 border-black/10 hover:border-cyan-600/40"
          } backdrop-blur-xs`}
        title={`Current Persona: ${current.name} (${current.shortName}). Click to switch.`}
      >
        <span className="flex items-center justify-center w-4 h-4 rounded-full text-[11px] shrink-0">
          {current.icon}
        </span>
        <span className="font-semibold text-[11.5px] tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
          {current.shortName}
        </span>
        <span
          className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${current.color} shadow-xs shrink-0 animate-pulse`}
        />
        <FaCaretDown
          size={9}
          className={`text-gray-400 group-hover:text-cyan-400 transition-transform duration-200 ml-0.5 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 mt-2 w-72 rounded-2xl shadow-2xl z-50 border overflow-hidden backdrop-blur-xl transition-all animate-in fade-in zoom-in-95 duration-150 ${theme === "dark"
              ? "bg-[#1f2c34]/95 border-[#374248] text-white shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
              : "bg-white/95 border-gray-200 text-gray-900 shadow-[0_12px_40px_rgba(0,0,0,0.15)]"
            }`}
        >
          <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500" />

          <div className="px-3.5 pt-2.5 pb-2 flex items-center justify-between border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px]">✨</span>
              <span className="text-[11px] font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 dark:from-cyan-400 dark:via-blue-400 dark:to-pink-400 bg-clip-text text-transparent">
                Meta AI Persona
              </span>
            </div>
            <span className="text-[9.5px] px-1.5 py-0.5 rounded-full font-medium bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400">
              {PERSONAS.length} styles
            </span>
          </div>

          <div className="p-1.5 space-y-1">
            {PERSONAS.map((p) => {
              const isChosen = p.id === selectedPersona;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p.id)}
                  className={`w-full group flex items-start gap-2.5 p-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${isChosen
                      ? theme === "dark"
                        ? "bg-white/10 shadow-xs border border-white/10"
                        : "bg-cyan-500/10 shadow-xs border border-cyan-500/20"
                      : theme === "dark"
                        ? "hover:bg-white/5 hover:border-white/5 border border-transparent"
                        : "hover:bg-gray-100/70 hover:border-gray-200 border border-transparent"
                    }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 transition-transform duration-200 group-hover:scale-110 shadow-xs ${isChosen
                        ? `bg-gradient-to-br ${p.color} text-white shadow-md`
                        : `${p.bgAlpha} ${p.borderAlpha} border`
                      }`}
                  >
                    <span>{p.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-semibold text-xs transition-colors ${isChosen
                            ? theme === "dark"
                              ? "text-cyan-300"
                              : "text-cyan-700 font-bold"
                            : theme === "dark"
                              ? "text-gray-200 group-hover:text-white"
                              : "text-gray-800 group-hover:text-black"
                          }`}
                      >
                        {p.name}
                      </span>
                      {isChosen ? (
                        <div className="w-4 h-4 rounded-full bg-cyan-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <FaCheck size={9} />
                        </div>
                      ) : (
                        <span
                          className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono font-medium ${p.bgAlpha} ${p.textColor}`}
                        >
                          {p.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5 line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-3 py-1.5 bg-black/5 dark:bg-black/20 text-[9.5px] text-gray-500 dark:text-gray-400 text-center border-t border-black/5 dark:border-white/5 flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span>Active persona controls response formatting & tone</span>
          </div>
        </div>
      )}
    </div>
  );
}
