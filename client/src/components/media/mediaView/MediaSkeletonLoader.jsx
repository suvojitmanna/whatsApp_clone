import React from "react";

export const MediaSkeletonLoader = ({ activeTab, isDark }) => {
  return (
    <div className="space-y-6 select-none p-1">
      <div className="space-y-1.5 px-1">
        <div
          className={`h-4 w-28 rounded-md animate-skeleton-shimmer ${isDark ? "bg-[#202c33]" : "bg-gray-200"
            }`}
        />
        <div
          className={`h-3 w-36 rounded-md animate-skeleton-shimmer ${isDark ? "bg-[#202c33]/60" : "bg-gray-100"
            }`}
        />
      </div>

      {activeTab === "media" && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
          {Array.from({ length: 15 }).map((_, idx) => (
            <div
              key={idx}
              className={`aspect-square rounded-lg overflow-hidden relative animate-skeleton-shimmer ${isDark ? "bg-[#202c33]" : "bg-gray-200"
                }`}
            >
              <div className="absolute inset-x-0 bottom-0 p-2 flex flex-col gap-1.5 pointer-events-none">
                {idx % 3 === 0 && (
                  <div
                    className={`h-2.5 w-10 rounded ${isDark ? "bg-white/10" : "bg-black/10"
                      }`}
                  />
                )}
                <div
                  className={`h-2.5 w-20 rounded ${isDark ? "bg-white/10" : "bg-black/10"
                    }`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "docs" && (
        <div className="space-y-0">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx}>
              <div
                className={`flex items-center justify-between p-3 rounded-xl animate-skeleton-shimmer ${isDark ? "bg-[#202c33]/70" : "bg-white"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl ${isDark ? "bg-white/10" : "bg-gray-200"
                      }`}
                  />

                  <div className="space-y-1.5">
                    <div
                      className={`h-3.5 w-48 rounded ${isDark ? "bg-white/15" : "bg-gray-300"
                        }`}
                    />

                    <div
                      className={`h-2.5 w-24 rounded ${isDark ? "bg-white/10" : "bg-gray-200"
                        }`}
                    />
                  </div>
                </div>

                <div
                  className={`w-8 h-8 rounded-full ${isDark ? "bg-white/10" : "bg-gray-200"
                    }`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "links" && (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border space-y-2 animate-skeleton-shimmer ${isDark
                ? "bg-[#202c33]/70 border-white/5"
                : "bg-white border-gray-200"
                }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg ${isDark ? "bg-white/10" : "bg-gray-200"
                    }`}
                />
                <div
                  className={`h-3 w-28 rounded ${isDark ? "bg-emerald-500/20" : "bg-emerald-100"
                    }`}
                />
              </div>
              <div
                className={`h-3.5 w-3/4 rounded ${isDark ? "bg-white/15" : "bg-gray-300"
                  }`}
              />
              <div
                className={`h-2.5 w-1/2 rounded ${isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaSkeletonLoader;
