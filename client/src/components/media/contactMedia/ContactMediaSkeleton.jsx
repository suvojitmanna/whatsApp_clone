import React from "react";

export const ContactMediaSkeleton = ({ activeTab, isDark }) => {
  return (
    <div className="space-y-6 select-none animate-pulse">
      {activeTab === "media" && (
        <>
          <div className="space-y-2.5">
            <div
              className={`h-3 w-24 rounded-md ${isDark ? "bg-[#202c33]" : "bg-gray-200"
                }`}
            />
            <div className="grid grid-cols-3 gap-1.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={`media-skel-1-${i}`}
                  className={`aspect-square rounded-lg ${isDark ? "bg-[#202c33]" : "bg-gray-200"
                    }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <div
              className={`h-3 w-28 rounded-md ${isDark ? "bg-[#202c33]" : "bg-gray-200"
                }`}
            />
            <div className="grid grid-cols-3 gap-1.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={`media-skel-2-${i}`}
                  className={`aspect-square rounded-lg ${isDark ? "bg-[#202c33]" : "bg-gray-200"
                    }`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "docs" && (
        <div className="space-y-3">
          <div
            className={`h-3 w-24 rounded-md mb-2 ${isDark ? "bg-[#202c33]" : "bg-gray-200"
              }`}
          />
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={`doc-skel-${i}`}>
              <div
                className={`p-3 rounded-xl border flex flex-col gap-2 ${isDark
                  ? "bg-[#202c33] border-transparent"
                  : "bg-white border-transparent"
                  }`}
              >
                {i === 0 && (
                  <div
                    className={`w-full h-24 rounded-t-md mb-1 ${isDark ? "bg-[#182229]" : "bg-gray-100"
                      }`}
                  />
                )}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-9 rounded-[3px] bg-[#e53935]/30 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div
                      className={`h-3.5 w-3/4 rounded ${isDark ? "bg-[#2a3942]" : "bg-gray-200"
                        }`}
                    />
                    <div
                      className={`h-2.5 w-1/2 rounded ${isDark ? "bg-[#2a3942]/60" : "bg-gray-200/70"
                        }`}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-0.5">
                  <div
                    className={`h-2 w-16 rounded ${isDark ? "bg-[#2a3942]/40" : "bg-gray-200/50"
                      }`}
                  />
                </div>
              </div>
              {i < 3 && (
                <div
                  className={`border-b ${isDark ? "border-[#222d34]" : "border-gray-200"
                    } my-2.5 mx-1`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {activeTab === "links" && (
        <div className="space-y-4">
          <div
            className={`h-3 w-24 rounded-md mb-2 ${isDark ? "bg-[#202c33]" : "bg-gray-200"
              }`}
          />
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={`link-skel-${i}`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full ${isDark ? "bg-[#2a3942]" : "bg-gray-300"
                        }`}
                    />
                    <div
                      className={`h-3 w-28 rounded ${isDark ? "bg-[#2a3942]" : "bg-gray-200"
                        }`}
                    />
                  </div>
                  <div
                    className={`h-2.5 w-14 rounded ${isDark ? "bg-[#2a3942]/60" : "bg-gray-200"
                      }`}
                  />
                </div>

                <div
                  className={`p-3 rounded-xl border flex gap-3 ${isDark
                    ? "bg-[#202c33] border-transparent"
                    : "bg-white border-transparent"
                    }`}
                >
                  <div
                    className={`w-16 h-16 rounded-lg shrink-0 ${isDark ? "bg-[#182229]" : "bg-gray-200"
                      }`}
                  />
                  <div className="flex-1 space-y-2 py-1">
                    <div
                      className={`h-3.5 w-4/5 rounded ${isDark ? "bg-[#2a3942]" : "bg-gray-200"
                        }`}
                    />
                    <div
                      className={`h-2.5 w-full rounded ${isDark ? "bg-[#2a3942]/60" : "bg-gray-100"
                        }`}
                    />
                    <div
                      className={`h-2 w-28 rounded ${isDark ? "bg-[#2a3942]/40" : "bg-gray-100"
                        }`}
                    />
                  </div>
                </div>
              </div>
              {i < 3 && (
                <div
                  className={`border-b ${isDark ? "border-[#222d34]" : "border-gray-200"
                    } my-2.5 mx-1`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactMediaSkeleton;
