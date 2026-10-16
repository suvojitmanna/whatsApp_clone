import React from "react";
import { toast } from "react-toastify";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { LuReply, LuForward } from "react-icons/lu";
import { FaRegCopy, FaStar, FaRegStar, FaDownload } from "react-icons/fa";
import { BsEmojiSmile } from "react-icons/bs";
import { TbPin } from "react-icons/tb";
import { SiMetaai } from "react-icons/si";
import { RiEditLine, RiDeleteBin6Line } from "react-icons/ri";
import { FiThumbsDown, FiCheckSquare } from "react-icons/fi";
import { useChatStore } from "../../store/chatStore";
import useLayoutStore from "../../store/layoutStore";
import { WhatsAppUnpinIcon } from "./MessageBuble";

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
}) => {
    const chatToggleStar = useChatStore((state) => state.toggleStarMessage);
    const chatUnpinMessage = useChatStore((state) => state.unpinMessage);
    const layoutSetSelectedMessageInfo = useLayoutStore(
        (state) => state.setSelectedMessageInfo
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
                    <RiDeleteBin6Line
                        size={17}
                        className="shrink-0 text-[#8696a0] group-hover:text-red-400 transition-colors"
                    />
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
                        <FiCheckSquare
                            size={17}
                            className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors"
                        />
                        <span>Select message</span>
                    </button>
                )}
            </>
        );
    }

    const hasCopyableText = Boolean(
        message?.contentType === "text" ||
        message?.content ||
        message?.imageOrVideoUrl
    );

    const isMediaDownloadable = Boolean(
        ["document", "image", "video", "audio"].includes(message?.contentType) &&
        message?.imageOrVideoUrl
    );

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
                <LuReply
                    size={18}
                    className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors"
                />
                <span>Reply</span>
            </button>

            {hasCopyableText && (
                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
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
                    <FaRegCopy
                        size={16}
                        className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors"
                    />
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
                <BsEmojiSmile
                    size={18}
                    className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors"
                />
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
                <LuForward
                    size={18}
                    className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors"
                />
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
                    <FaRegStar
                        size={16}
                        className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors"
                    />
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
                    <WhatsAppUnpinIcon
                        size={18}
                        className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors"
                    />
                ) : (
                    <TbPin
                        size={18}
                        className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors"
                    />
                )}
                <span>{isPinned ? "Unpin" : "Pin"}</span>
            </button>

            {message?.content && (
                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        setShowForwardModal?.(true);
                    }}
                    className={itemClass}
                >
                    <SiMetaai
                        size={17}
                        className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors"
                    />
                    <span>Ask Meta AI</span>
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
                    <RiEditLine
                        size={17}
                        className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors"
                    />
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
                    <FaDownload
                        size={15}
                        className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors"
                    />
                    <span>Download</span>
                </button>
            )}

            {isUserMessage && (
                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        setSelectedMessageInfo?.(message);
                    }}
                    className={itemClass}
                >
                    <IoIosInformationCircleOutline
                        size={19}
                        className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors"
                    />
                    <span>Message info</span>
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
                <FiCheckSquare
                    size={17}
                    className="shrink-0 text-[#8696a0] group-hover:text-inherit transition-colors"
                />
                <span>Select message</span>
            </button>

            <div
                className={`my-1 border-t ${isDark ? "border-[#2a3942]/80" : "border-black/10"
                    }`}
            />

            {!isUserMessage && (
                <button
                    type="button"
                    onClick={() => {
                        setShowOptions?.(false);
                        setShowReportModal?.(true);
                    }}
                    className={dangerItemClass}
                >
                    <FiThumbsDown
                        size={17}
                        className="shrink-0 text-[#8696a0] group-hover:text-red-400 transition-colors"
                    />
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
                <RiDeleteBin6Line
                    size={17}
                    className="shrink-0 text-[#8696a0] group-hover:text-red-400 transition-colors"
                />
                <span>Delete</span>
            </button>
        </>
    );
};

export default MessageMenu;