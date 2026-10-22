import { useState, useEffect } from "react";
import {
    MdClose,
    MdMessage,
    MdCall,
    MdPhotoLibrary,
    MdLocationOn,
    MdRadioButtonChecked,
    MdOpenInNew,
} from "react-icons/md";
import { EncryptionLogo } from "./common/Icons";

const features = [
    { icon: MdMessage, label: "Text and voice messages" },
    { icon: MdCall, label: "Audio and video calls" },
    { icon: MdPhotoLibrary, label: "Photos, videos and documents" },
    { icon: MdLocationOn, label: "Location sharing" },
    { icon: MdRadioButtonChecked, label: "Statuses" },
];

export default function EndToEndEncryption({
    isDark = true,
    onClose,
}) {
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const bg = isDark ? "#1d1f1f" : "#ffffff";
    const fg = isDark ? "#f1f1f1" : "#111b21";
    const muted = isDark ? "#e5e5e5" : "#3b4a54";

    return (
        <>
            <style>{`
                @keyframes encAppear {
                    from { opacity: 0; transform: translateY(18px) scale(.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @keyframes encFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }

                @keyframes encPulse {
                    0%, 100% { filter: drop-shadow(0 0 0px #16cf70); }
                    50% { filter: drop-shadow(0 0 8px #16cf7060); }
                }

                @keyframes encRotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes encShine {
                    0% { transform: translateX(-150%); }
                    60%, 100% { transform: translateX(200%); }
                }

                .enc-screen {
                    animation: encAppear .35s cubic-bezier(.2,.8,.2,1) both;
                }

                .enc-illustration {
                    animation: encFloat 3s ease-in-out infinite;
                }

                .enc-lock {
                    animation: encPulse 3s ease-in-out infinite;
                }

                .enc-dial {
                    transform-origin: 174px 80px;
                    animation: encPulse 2.5s ease-in-out infinite;
                }

                .enc-hand {
                    transform-origin: 174px 80px;
                    animation: encRotate 8s linear infinite;
                }

                .enc-progress {
                    animation: encShine 3s ease-in-out infinite;
                }

                .enc-orb {
                    animation: encFloat 1.7s ease-in-out infinite;
                }

                .enc-feature {
                    animation: encAppear .45s ease both;
                    transition: transform .2s ease;
                }

                .enc-feature:hover {
                    transform: translateX(4px);
                }

                @media (prefers-reduced-motion: reduce) {
                    .enc-screen, .enc-illustration, .enc-lock,
                    .enc-dial, .enc-hand, .enc-progress,
                    .enc-orb, .enc-feature {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            `}</style>

            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-5"
                style={{ background: "#00000099" }}
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) onClose?.();
                }}
            >
                <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="encryption-heading"
                    className="enc-screen relative flex min-h-screen max-w-[600px] flex-col justify-between overflow-y-auto rounded-none border border-white/5 sm:min-h-[680px] sm:rounded-2xl"
                    style={{ background: bg, color: fg }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close encryption information"
                        className="absolute right-4 top-4 z-10 cursor-pointer rounded-full p-2 opacity-70 transition hover:bg-white/10 hover:opacity-100"
                    >
                        <MdClose size={22} />
                    </button>

                    <div>
                        <div className="flex justify-center pt-16 sm:pt-15">
                            <div className="enc-illustration">
                                <EncryptionLogo />
                            </div>
                        </div>

                        <div className="mx-auto max-w-[490px] px-6 pb-6 sm:px-8">
                            <h2
                                id="encryption-heading"
                                className="text-center text-[25px] font-medium tracking-tight sm:text-[27px]"
                            >
                                Your chats and calls are private
                            </h2>

                            <p
                                className="mt-3 text-center text-[16px] leading-[1.6]"
                                style={{ color: muted }}
                            >
                                End-to-end encryption keeps your personal messages and
                                calls between you and the people you choose. No one
                                outside of the chat, not even WhatsApp, can read, listen
                                to, or share them. This includes your:
                            </p>

                            <div className="mt-1">
                                {features.map(({ icon: Icon, label }, index) => (
                                    <div
                                        key={label}
                                        className="enc-feature flex min-h-[43px] items-center gap-3.5 rounded-lg md:pt-5 pt-6 px-10.5"
                                        style={{ animationDelay: `${index * 80}ms` }}
                                    >
                                        <Icon
                                            className="shrink-0"
                                            size={25}
                                            style={{ color: fg }}
                                        />
                                        <span className="text-md font-medium">
                                            {label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {showDetails && (
                            <div
                                className="mx-7 mb-4 rounded-xl border p-4 text-sm leading-6 sm:mx-9"
                                style={{
                                    borderColor: isDark ? "#ffffff1c" : "#00000018",
                                    color: muted,
                                }}
                            >
                                <h3 className="mb-2 font-semibold" style={{ color: fg }}>
                                    How encryption works
                                </h3>
                                Your messages are encrypted on your device and decrypted
                                on the recipient&apos;s device. A secure messaging system
                                needs correct key management and secure device handling
                                to protect your conversations.
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-5 px-7 pb-8 sm:px-9 sm:pb-5 pt-10 ">
                        <button
                            type="button"
                            onClick={() => setShowDetails((prev) => !prev)}
                            className="flex cursor-pointer items-center gap-1.5 text-[15px] font-semibold text-[#16c875] transition hover:text-[#36e58d] hover:underline"
                        >
                            {showDetails ? "Show less" : "Learn more"}
                            {!showDetails && <MdOpenInNew size={15} />}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="min-w-[84px] cursor-pointer rounded-full bg-[#20c568] px-7 py-3 text-[15px] font-medium text-[#10251a] transition duration-200 hover:scale-[1.04] hover:bg-[#2bda78] active:scale-95"
                        >
                            OK
                        </button>
                    </div>
                </section>
            </div>
        </>
    );
}