import React, { useState, useEffect, useRef } from "react";
import { FaCaretDown, FaCheck } from "react-icons/fa";

export const PERSONAS = [
  {
    id: "default",
    name: "Helpful Assistant",
    shortName: "Default",
    icon: "⚡",
    description: "Balanced, friendly, and factual for everyday questions",
  },
  {
    id: "coder",
    name: "Software Architect",
    shortName: "Coder",
    icon: "💻",
    description: "Production-ready code, modern patterns, clean architecture",
  },
  {
    id: "tutor",
    name: "Teacher / ELI5",
    shortName: "Tutor",
    icon: "🎓",
    description: "Explains concepts simply with clear, fun analogies",
  },
  {
    id: "concise",
    name: "Ultra Concise",
    shortName: "Concise",
    icon: "📝",
    description: "Direct bullet points, high information density, no fluff",
  },
  {
    id: "creative",
    name: "Creative Writer",
    shortName: "Creative",
    icon: "🎨",
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
  };

  const current = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];

  return (
    <div className="relative inline-block select-none" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-95 ${
          theme === "dark"
            ? "bg-[#182229] hover:bg-[#202c33] text-gray-200 border-white/10"
            : "bg-white hover:bg-gray-50 text-gray-700 border-black/10"
        }`}
        title="Change Meta AI persona / response style"
      >
        <span>{current.icon}</span>
        <span className="font-semibold text-[11.5px]">{current.shortName}</span>
        <FaCaretDown
          size={10}
          className={`opacity-50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 mt-1.5 w-60 rounded-xl py-1.5 shadow-2xl z-50 border transition-all animate-in fade-in zoom-in-95 duration-150 ${
            theme === "dark"
              ? "bg-[#233138] border-[#374248] text-white"
              : "bg-white border-gray-200 text-gray-900 shadow-[0_10px_35px_rgba(0,0,0,0.15)]"
          }`}
        >
          <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            AI Persona Mode
          </div>

          {PERSONAS.map((p) => {
            const isChosen = p.id === selectedPersona;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p.id)}
                className={`w-full flex items-start gap-2.5 px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                  theme === "dark"
                    ? isChosen
                      ? "bg-white/10 text-cyan-400"
                      : "hover:bg-white/5 text-gray-300 hover:text-white"
                    : isChosen
                    ? "bg-cyan-50 text-cyan-700"
                    : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                }`}
              >
                <span className="text-sm mt-0.5">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold flex items-center justify-between">
                    <span>{p.name}</span>
                    {isChosen && <FaCheck size={11} className="text-cyan-500" />}
                  </div>
                  <p className="text-[10.5px] text-gray-400 leading-tight mt-0.5 truncate">
                    {p.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
