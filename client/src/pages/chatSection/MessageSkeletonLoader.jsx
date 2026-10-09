import React from "react";
import { FaImage, FaPlay, FaCheckDouble } from "react-icons/fa";

const MessageSkeletonLoader = ({ theme = "dark" }) => {
  const isDark = theme === "dark";

  return (
    <div className="w-full flex flex-col space-y-3.5 py-2 animate-fade-in select-none">
      <div className="flex justify-center my-2">
        <div
          className={`h-6 w-24 rounded-lg flex items-center justify-center animate-pulse ${
            isDark ? "bg-[#182229]/80" : "bg-white/80 shadow-sm"
          }`}
        >
          <div
            className={`h-2.5 w-14 rounded-full ${
              isDark ? "bg-[#2a3942]" : "bg-gray-200"
            }`}
          />
        </div>
      </div>

      <div className="flex justify-start w-full">
        <div
          className={`relative max-w-[85%] sm:max-w-[65%] md:max-w-[480px] p-3 rounded-2xl rounded-tl-sm animate-pulse ${
            isDark
              ? "bg-[#202c33] border border-white/5 shadow-md"
              : "bg-white border border-gray-100 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
          }`}
        >
          <div className="flex flex-col space-y-2">
            <div
              className={`h-3 w-48 sm:w-64 rounded-md ${
                isDark ? "bg-[#2a3942]" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-3 w-32 sm:w-44 rounded-md ${
                isDark ? "bg-[#2a3942]/70" : "bg-gray-200/70"
              }`}
            />
          </div>
          <div className="flex justify-end mt-2">
            <div
              className={`h-2 w-10 rounded-full ${
                isDark ? "bg-[#2a3942]/50" : "bg-gray-300/60"
              }`}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end w-full">
        <div
          className={`relative max-w-[85%] sm:max-w-[65%] md:max-w-[440px] p-3 rounded-2xl rounded-tr-sm animate-pulse ${
            isDark
              ? "bg-[#005c4b] border border-emerald-600/20 shadow-md"
              : "bg-[#d9fdd3] border border-green-200/40 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
          }`}
        >
          <div className="flex flex-col space-y-2">
            <div
              className={`h-3 w-52 sm:w-72 rounded-md ${
                isDark ? "bg-[#056162]" : "bg-[#c2ecc0]"
              }`}
            />
            <div
              className={`h-3 w-36 sm:w-56 rounded-md ${
                isDark ? "bg-[#056162]/80" : "bg-[#c2ecc0]/80"
              }`}
            />
            <div
              className={`h-3 w-24 rounded-md ${
                isDark ? "bg-[#056162]/60" : "bg-[#c2ecc0]/60"
              }`}
            />
          </div>
          <div className="flex items-center justify-end gap-1 mt-2">
            <div
              className={`h-2 w-10 rounded-full ${
                isDark ? "bg-[#056162]/60" : "bg-green-300/80"
              }`}
            />
            <FaCheckDouble
              className={`text-[10px] ${
                isDark ? "text-[#056162]" : "text-green-300"
              }`}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-start w-full">
        <div
          className={`relative max-w-[85%] sm:max-w-[340px] p-2 rounded-2xl rounded-tl-sm animate-pulse ${
            isDark
              ? "bg-[#202c33] border border-white/5 shadow-md"
              : "bg-white border border-gray-100 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
          }`}
        >
          <div
            className={`w-56 sm:w-72 h-44 rounded-xl flex items-center justify-center ${
              isDark ? "bg-[#182229]" : "bg-gray-100"
            }`}
          >
            <div
              className={`p-3 rounded-full ${
                isDark ? "bg-[#2a3942]/60 text-[#8696a0]" : "bg-gray-200 text-gray-400"
              }`}
            >
              <FaImage className="text-xl" />
            </div>
          </div>
          <div className="mt-2.5 px-1 flex flex-col space-y-1.5">
            <div
              className={`h-3 w-40 rounded-md ${
                isDark ? "bg-[#2a3942]" : "bg-gray-200"
              }`}
            />
          </div>
          <div className="flex justify-end mt-1 px-1">
            <div
              className={`h-2 w-9 rounded-full ${
                isDark ? "bg-[#2a3942]/50" : "bg-gray-300/60"
              }`}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end w-full">
        <div
          className={`relative max-w-[70%] sm:max-w-[280px] p-3 rounded-2xl rounded-tr-sm animate-pulse ${
            isDark
              ? "bg-[#005c4b] border border-emerald-600/20 shadow-md"
              : "bg-[#d9fdd3] border border-green-200/40 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
          }`}
        >
          <div
            className={`h-3 w-32 sm:w-40 rounded-md ${
              isDark ? "bg-[#056162]" : "bg-[#c2ecc0]"
            }`}
          />
          <div className="flex items-center justify-end gap-1 mt-2">
            <div
              className={`h-2 w-9 rounded-full ${
                isDark ? "bg-[#056162]/60" : "bg-green-300/80"
              }`}
            />
            <FaCheckDouble
              className={`text-[10px] ${
                isDark ? "text-[#056162]" : "text-green-300"
              }`}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-start w-full">
        <div
          className={`relative w-64 sm:w-72 p-3 rounded-2xl rounded-tl-sm animate-pulse ${
            isDark
              ? "bg-[#202c33] border border-white/5 shadow-md"
              : "bg-white border border-gray-100 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${
                isDark ? "bg-[#2a3942] text-[#8696a0]" : "bg-gray-200 text-gray-400"
              }`}
            >
              <FaPlay className="text-xs ml-0.5" />
            </div>
            <div className="flex-1 flex items-center gap-1">
              {[40, 70, 30, 90, 60, 45, 80, 55, 30, 75, 50, 65, 35, 60].map(
                (h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h * 0.28}px` }}
                    className={`w-1 rounded-full ${
                      isDark ? "bg-[#2a3942]" : "bg-gray-200"
                    }`}
                  />
                )
              )}
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 px-1">
            <div
              className={`h-2 w-7 rounded-full ${
                isDark ? "bg-[#2a3942]/60" : "bg-gray-300/60"
              }`}
            />
            <div
              className={`h-2 w-9 rounded-full ${
                isDark ? "bg-[#2a3942]/50" : "bg-gray-300/60"
              }`}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end w-full">
        <div
          className={`relative max-w-[80%] sm:max-w-[360px] p-3 rounded-2xl rounded-tr-sm animate-pulse ${
            isDark
              ? "bg-[#005c4b] border border-emerald-600/20 shadow-md"
              : "bg-[#d9fdd3] border border-green-200/40 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
          }`}
        >
          <div className="flex flex-col space-y-2">
            <div
              className={`h-3 w-44 sm:w-56 rounded-md ${
                isDark ? "bg-[#056162]" : "bg-[#c2ecc0]"
              }`}
            />
            <div
              className={`h-3 w-28 sm:w-36 rounded-md ${
                isDark ? "bg-[#056162]/70" : "bg-[#c2ecc0]/70"
              }`}
            />
          </div>
          <div className="flex items-center justify-end gap-1 mt-2">
            <div
              className={`h-2 w-9 rounded-full ${
                isDark ? "bg-[#056162]/60" : "bg-green-300/80"
              }`}
            />
            <FaCheckDouble
              className={`text-[10px] ${
                isDark ? "text-[#056162]" : "text-green-300"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageSkeletonLoader;
