import { toast } from "react-toastify";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { LuReply, LuForward } from "react-icons/lu";
import { FaRegCopy, FaStar, FaRegStar, FaDownload } from "react-icons/fa";
import { BsEmojiSmile } from "react-icons/bs";
import { TbPin } from "react-icons/tb";
import { SiMetaai } from "react-icons/si";
import { HiLanguage } from "react-icons/hi2";
import { MetaAiRing, META_AI_USER_ID } from "../../components/common/MetaAiIcon";
import { RiEditLine, RiDeleteBin6Line } from "react-icons/ri";
import { FiThumbsDown, FiCheckSquare, FiExternalLink, FiUser } from "react-icons/fi";
import { useChatStore } from "../../store/chatStore";
import useLayoutStore from "../../store/layoutStore";
import { WhatsAppUnpinIcon } from "./MessageBuble";
import { copyImageToClipboard } from "../../utils/clipboardUtils";

const MessageMenu = ({
    message,
    isUserMessage,
    isDark,
    isPinned,
    isStarred,
    isDeletedForEveryone,
    conversationId,
    secondaryConvId,
    onReply,
    setShowOptions,
    setSelectedMessageInfo: propSetSelectedMessageInfo,
    setShowReactions,
    setShowForwardModal,
    setShowPinModal,
    toggleStarMessage: propToggleStarMessage,
    unpinMessage: propUnpinMessage,
    setEditText,
    setIsEditing,
    handleDownloadFile,
    setShowReportModal,
    setDeleteModal,
    onEnterSelectMode,
    isMetaAi: propIsMetaAi,
    isGroupChat,
    senderDisplayName,
    onOpenSenderContactInfo,
}) => {
    const chatToggleStar = useChatStore((state) => state.toggleStarMessage);
    const chatUnpinMessage = useChatStore((state) => state.unpinMessage);
    const layoutSetSelectedMessageInfo = useLayoutStore(
        (state) => state.setSelectedMessageInfo
    );
    const layoutSelectedContact = useLayoutStore((state) => state.selectedContact);
    const chatSelectedContact = useChatStore((state) => state.selectedContact);
    const activeContact = layoutSelectedContact || chatSelectedContact;
    const senderId = (
        message?.sender?._id ||
        message?.sender?.id ||
        message?.sender
    )?.toString();

    const isMetaAi = Boolean(
        propIsMetaAi ||
        message?.isMetaAi ||
        senderId === META_AI_USER_ID ||
        message?.sender?.isAI ||
        message?.sender?.username === "Meta AI" ||
        activeContact?.isAI ||
        activeContact?.isMetaAi ||
        activeContact?.username === "Meta AI" ||
        String(activeContact?._id) === META_AI_USER_ID ||
        String(activeContact?.id) === META_AI_USER_ID
    );

    const toggleStarMessage = propToggleStarMessage || chatToggleStar;
    const unpinMessage = propUnpinMessage || chatUnpinMessage;
    const setSelectedMessageInfo =
        propSetSelectedMessageInfo || layoutSetSelectedMessageInfo;

    const itemClass = `mx-1.5 my-0.5 flex w-[calc(100%-12px)] items-center px-3.5 py-[7px] gap-3.5 cursor-pointer rounded-2xl border border-transparent transition-all duration-150 text-left font-normal text-[14px] group select-none ${isDark
        ? "text-[#d1d7db] hover:text-white hover:bg-white/10 hover:border-white/15"
        : "text-[#111b21] hover:text-black hover:bg-black/5 hover:border-black/10"
        }`;

    const dangerItemClass = `mx-1.5 my-0.5 flex w-[calc(100%-12px)] items-center px-3.5 py-[7px] gap-3.5 cursor-pointer rounded-2xl border border-transparent transition-all duration-150 text-left font-normal text-[14px] group select-none ${isDark
        ? "hover:bg-red-500/10 hover:border-red-400/25 text-[#d1d7db] hover:text-red-400"
        : "hover:bg-red-50 hover:border-red-300 text-gray-800 hover:text-red-600"
        }`;

    if (isDeletedForEveryone) {
        return (
            <>
                <button
                    type="button"
                    onClick={() => {
                        setDeleteModal?.(message);
                        setShowOptions?.(false);
                    }}
                    className={dangerItemClass}
                >
                    <RiDeleteBin6Line size={17} className="shrink-0 text-[#8696a0] group-hover:text-red-400 transition-colors" />
                    <span>Delete for me</span>
                </button>
                {onEnterSelectMode && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowOptions?.(false);
                            onEnterSelectMode(message._id?._id || message._id || message.temp);
                        }}
                        className={itemClass}
                    >
                        <FiCheckSquare size={17} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                        <span>Select message</span>
                    </button>
                )}
            </>
        );
    }

    const isCallMessage = Boolean(
        message?.contentType === "call" ||
        Boolean(message?.callData) ||
        message?.contentType === "call_link" ||
        Boolean(message?.callLinkData)
    );

    if (isCallMessage) {
        return (
            <>
                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        if (onReply) {
                            onReply(message);
                        }
                    }}
                    className={itemClass}
                >
                    <LuReply size={18} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    <span>Reply</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        setShowReactions?.(true);
                    }}
                    className={itemClass}
                >
                    <BsEmojiSmile size={18} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    <span>React</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        if (isPinned) {
                            unpinMessage?.(conversationId, secondaryConvId);
                            toast.info("Message unpinned");
                        } else {
                            setShowPinModal?.(true);
                        }
                    }}
                    className={itemClass}
                >
                    {isPinned ? (
                        <WhatsAppUnpinIcon size={18} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    ) : (
                        <TbPin size={18} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    )}
                    <span>{isPinned ? "Unpin" : "Pin"}</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        const nowStarred = toggleStarMessage?.(message?._id, message);
                        if (nowStarred) {
                            toast.success("Message starred");
                        } else {
                            toast.info("Message unstarred");
                        }
                    }}
                    className={itemClass}
                >
                    {isStarred ? (
                        <FaStar size={16} className="shrink-0 text-amber-400 fill-amber-400" />
                    ) : (
                        <FaRegStar size={16} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    )}
                    <span>{isStarred ? "Unstar" : "Star"}</span>
                </button>

                <div
                    className={`my-1 border-t ${isDark ? "border-[#2a3942]/80" : "border-black/10"
                        }`}
                />

                <button
                    type="button"
                    onClick={() => {
                        setDeleteModal?.(message);
                        setShowOptions?.(false);
                    }}
                    className={dangerItemClass}
                >
                    <RiDeleteBin6Line size={17} className="shrink-0 text-[#8696a0] group-hover:text-red-400 transition-colors" />
                    <span>Delete</span>
                </button>
            </>
        );
    }

    const hasCopyableText = Boolean(
        message?.contentType === "text" ||
        message?.content ||
        message?.imageOrVideoUrl
    );

    if (isMetaAi) {
        return (
            <>
                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        setSelectedMessageInfo?.(message);
                    }}
                    className={itemClass}
                >
                    <IoIosInformationCircleOutline size={19} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    <span>Message info</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        if (onReply) {
                            onReply(message);
                        }
                    }}
                    className={itemClass}
                >
                    <LuReply size={18} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    <span>Reply</span>
                </button>

                {hasCopyableText && (
                    <button
                        type="button"
                        onClick={async () => {
                            setShowOptions?.(false);
                            const isImg =
                                message?.contentType === "image" ||
                                Boolean(
                                    message?.imageOrVideoUrl &&
                                    !message?.imageOrVideoUrl.match(/\.(mp4|webm|mov|mkv)($|\?)/i) &&
                                    message?.contentType !== "video"
                                );

                            if (isImg && message?.imageOrVideoUrl) {
                                try {
                                    await copyImageToClipboard(message.imageOrVideoUrl);
                                    toast.success("Image copied to clipboard");
                                    return;
                                } catch (e) {
                                    console.error("Failed to copy image:", e);
                                    toast.error("Failed to copy image to clipboard");
                                    return;
                                }
                            }

                            const textToCopy =
                                message?.contentType === "text"
                                    ? message?.content || ""
                                    : message?.imageOrVideoUrl || message?.content || "";
                            if (textToCopy) {
                                navigator.clipboard?.writeText(textToCopy);
                                toast.success("Copied to clipboard");
                            }
                        }}
                        className={itemClass}
                    >
                        <FaRegCopy size={16} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                        <span>Copy</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        setShowReactions?.(true);
                    }}
                    className={itemClass}
                >
                    <BsEmojiSmile size={18} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    <span>React</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        setShowForwardModal?.(true);
                    }}
                    className={itemClass}
                >
                    <LuForward size={18} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    <span>Forward</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        const nowStarred = toggleStarMessage?.(message?._id, message);
                        if (nowStarred) {
                            toast.success("Message starred");
                        } else {
                            toast.info("Message unstarred");
                        }
                    }}
                    className={itemClass}
                >
                    {isStarred ? (
                        <FaStar size={16} className="shrink-0 text-amber-400 fill-amber-400" />
                    ) : (
                        <FaRegStar size={16} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    )}
                    <span>{isStarred ? "Unstar" : "Star"}</span>
                </button>

                <div
                    className={`my-1 border-t ${isDark ? "border-[#2a3942]/80" : "border-black/10"
                        }`}
                />

                <button
                    type="button"
                    onClick={() => {
                        setDeleteModal?.(message);
                        setShowOptions?.(false);
                    }}
                    className={dangerItemClass}
                >
                    <RiDeleteBin6Line size={17} className="shrink-0 text-[#8696a0] group-hover:text-red-400 transition-colors" />
                    <span>Delete</span>
                </button>
            </>
        );
    }


    const isMediaDownloadable = Boolean(
        ["document", "image", "video", "audio"].includes(message?.contentType) &&
        message?.imageOrVideoUrl
    );

    const linkMatch = message?.content ? message.content.match(/(https?:\/\/[^\s]+)/) : null;
    const detectedUrl = message?.url || (linkMatch ? linkMatch[0] : null);

    return (
        <>
            {detectedUrl && (
                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        window.open(detectedUrl, "_blank", "noopener,noreferrer");
                    }}
                    className={itemClass}
                >
                    <FiExternalLink size={17} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    <span>Open link in a new tab</span>
                </button>
            )}

            {isUserMessage && message?.contentType !== "call" && (
                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        setSelectedMessageInfo?.(message);
                    }}
                    className={itemClass}
                >
                    <IoIosInformationCircleOutline size={19} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    <span>Message info</span>
                </button>
            )}

            {!isUserMessage && !isMetaAi && isGroupChat && onOpenSenderContactInfo && (
                <button
                    type="button"
                    onClick={(e) => {
                        setShowOptions?.(false);
                        onOpenSenderContactInfo(e);
                    }}
                    className={itemClass}
                >
                    <FiUser size={17} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    <span className="truncate">
                        {senderDisplayName ? `Contact info (${senderDisplayName})` : "Contact info"}
                    </span>
                </button>
            )}

            <button
                type="button"
                onClick={() => {
                    setShowOptions?.(false);
                    if (onReply) {
                        onReply(message);
                    }
                }}
                className={itemClass}
            >
                <LuReply size={18} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                <span>Reply</span>
            </button>

            {hasCopyableText && (
                <button
                    type="button"
                    onClick={async () => {
                        setShowOptions?.(false);
                        const isImg =
                            message?.contentType === "image" ||
                            Boolean(
                                message?.imageOrVideoUrl &&
                                !message?.imageOrVideoUrl.match(/\.(mp4|webm|mov|mkv)($|\?)/i) &&
                                message?.contentType !== "video"
                            );

                        if (isImg && message?.imageOrVideoUrl) {
                            try {
                                await copyImageToClipboard(message.imageOrVideoUrl);
                                toast.success("Image copied to clipboard");
                                return;
                            } catch (e) {
                                console.error("Failed to copy image:", e);
                                toast.error("Failed to copy image to clipboard");
                                return;
                            }
                        }

                        const textToCopy =
                            message?.contentType === "text"
                                ? message?.content || ""
                                : message?.imageOrVideoUrl || message?.content || "";
                        if (textToCopy) {
                            navigator.clipboard?.writeText(textToCopy);
                            toast.success("Copied to clipboard");
                        }
                    }}
                    className={itemClass}
                >
                    <FaRegCopy size={16} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    <span>Copy</span>
                </button>
            )}

            <button
                type="button"
                onClick={() => {
                    setShowOptions?.(false);
                    setShowReactions?.(true);
                }}
                className={itemClass}
            >
                <BsEmojiSmile size={18} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                <span>React</span>
            </button>

            <button
                type="button"
                onClick={() => {
                    setShowOptions?.(false);
                    setShowForwardModal?.(true);
                }}
                className={itemClass}
            >
                <LuForward size={18} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                <span>Forward</span>
            </button>

            <button
                type="button"
                onClick={() => {
                    setShowOptions?.(false);
                    const nowStarred = toggleStarMessage?.(message?._id, message);
                    if (nowStarred) {
                        toast.success("Message starred");
                    } else {
                        toast.info("Message unstarred");
                    }
                }}
                className={itemClass}
            >
                {isStarred ? (
                    <FaStar size={16} className="shrink-0 text-amber-400 fill-amber-400" />
                ) : (
                    <FaRegStar size={16} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                )}
                <span>{isStarred ? "Unstar" : "Star"}</span>
            </button>

            <button
                type="button"
                onClick={() => {
                    setShowOptions?.(false);
                    if (isPinned) {
                        unpinMessage?.(conversationId, secondaryConvId);
                        toast.info("Message unpinned");
                    } else {
                        setShowPinModal?.(true);
                    }
                }}
                className={itemClass}
            >
                {isPinned ? (
                    <WhatsAppUnpinIcon size={18} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                ) : (
                    <TbPin size={18} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                )}
                <span>{isPinned ? "Unpin" : "Pin"}</span>
            </button>

            {message?.content && (
                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        const chatStore = useChatStore.getState();
                        const users = chatStore.users || [];
                        const metaContact = users.find((u) => u._id === META_AI_USER_ID || u.username === "Meta AI" || u.isAI) || {
                            _id: META_AI_USER_ID,
                            username: "Meta AI",
                            isAI: true,
                            isVerified: true,
                        };
                        useLayoutStore.getState().setSelectedContact(metaContact);
                        chatStore.setSelectedContact?.(metaContact);
                        setTimeout(() => {
                            window.dispatchEvent(
                                new CustomEvent("meta_ai_prefill", {
                                    detail: `Explain: "${message.content}"`,
                                })
                            );
                        }, 100);
                        toast.info("Asking Meta AI...");
                    }}
                    className={itemClass}
                >
                    <MetaAiRing size={17} className="shrink-0 group-hover:scale-110 transition-transform" />
                    <span>Ask Meta AI</span>
                </button>
            )}

            {message?.content && (
                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        window.dispatchEvent(
                            new CustomEvent("open_translate_modal", {
                                detail: { text: message.content, messageId: message._id },
                            })
                        );
                    }}
                    className={itemClass}
                >
                    <HiLanguage size={17} className="shrink-0 text-cyan-500 group-hover:scale-110 transition-transform" />
                    <span>Translate with AI</span>
                </button>
            )}

            {isUserMessage && message?.contentType === "text" && (
                <button
                    type="button"
                    onClick={() => {
                        setEditText?.(message?.content || "");
                        setIsEditing?.(true);
                        setShowOptions?.(false);
                    }}
                    className={itemClass}
                >
                    <RiEditLine size={17} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    <span>Edit</span>
                </button>
            )}

            {isMediaDownloadable && (
                <button
                    type="button"
                    onClick={(e) => {
                        setShowOptions?.(false);
                        handleDownloadFile?.(
                            e,
                            message.imageOrVideoUrl,
                            message.fileName ||
                            (message.contentType === "document"
                                ? "document.pdf"
                                : `${message.contentType}-${message._id}`)
                        );
                    }}
                    className={itemClass}
                >
                    <FaDownload size={15} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                    <span>Download</span>
                </button>
            )}

            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowOptions?.(false);
                    onEnterSelectMode?.(message._id?._id || message._id || message.temp);
                }}
                className={itemClass}
            >
                <FiCheckSquare size={17} className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors" />
                <span>Select message</span>
            </button>

            <div className={`my-1 border-t ${isDark ? "border-[#2a3942]/80" : "border-black/10"}`} />
            {!isUserMessage && (
                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        setShowReportModal?.(true);
                    }}
                    className={dangerItemClass}
                >
                    <FiThumbsDown size={17} className="shrink-0 text-[#8696a0] group-hover:text-red-400 transition-colors" />
                    <span>Report</span>
                </button>
            )}

            <button
                type="button"
                onClick={() => {
                    setDeleteModal?.(message);
                    setShowOptions?.(false);
                }}
                className={dangerItemClass}
            >
                <RiDeleteBin6Line size={17} className="shrink-0 text-[#8696a0] group-hover:text-red-400 transition-colors" />
                <span>Delete</span>
            </button>
        </>
    );
};

export default MessageMenu;