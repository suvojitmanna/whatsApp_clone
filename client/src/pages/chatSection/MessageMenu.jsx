import React from 'react'

const MessageMenu = () => {
    return (
        <>
            {isUserMessage && (
                <button
                    type="button"
                    onClick={() => {
                        setShowOptions(false);
                        setSelectedMessageInfo(message);
                    }}
                    className={`flex w-full items-center px-5 py-2.5 gap-4 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-[#f5f6f6] text-[#111b21]"
                        }`}
                >
                    <IoIosInformationCircleOutline size={20} className="shrink-0 text-[#8696a0]" />
                    <span className="font-normal text-[14.5px]">Message info</span>
                </button>)}

            <button
                type="button"
                onClick={() => {
                    setShowOptions(false);
                    if (onReply) {
                        onReply(message);
                    }
                }}
                className={`flex w-full items-center px-5 py-2.5 gap-4 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-[#f5f6f6] text-[#111b21]"
                    }`}
            >
                <LuReply size={18} className="shrink-0 text-[#8696a0]" />
                <span className="font-normal text-[14.5px]">Reply</span>
            </button>

            <button
                type="button"
                onClick={() => {
                    setShowOptions(false);
                    const textToCopy =
                        message.contentType === "text"
                            ? (message.content || "")
                            : (message.imageOrVideoUrl || message.content || "");
                    if (textToCopy) {
                        navigator.clipboard.writeText(textToCopy);
                        toast.success("Copied to clipboard");
                    }
                }}
                className={`flex w-full items-center px-5 py-2.5 gap-4 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-[#f5f6f6] text-[#111b21]"
                    }`}
            >
                <FaRegCopy size={16} className="shrink-0 text-[#8696a0]" />
                <span className="font-normal text-[14.5px]">Copy</span>
            </button>

            <button
                type="button"
                onClick={() => {
                    setShowOptions(false);
                    setShowReactions(true);
                }}
                className={`flex w-full items-center px-5 py-2.5 gap-4 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-[#f5f6f6] text-[#111b21]"
                    }`}
            >
                <BsEmojiSmile size={18} className="shrink-0 text-[#8696a0]" />
                <span className="font-normal text-[14.5px]">React</span>
            </button>

            <button
                type="button"
                onClick={() => {
                    setShowOptions(false);
                    setShowForwardModal(true);
                }}
                className={`flex w-full items-center px-5 py-2.5 gap-4 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-[#f5f6f6] text-[#111b21]"
                    }`}
            >
                <LuForward size={18} className="shrink-0 text-[#8696a0]" />
                <span className="font-normal text-[14.5px]">Forward</span>
            </button>

            <button
                type="button"
                onClick={() => {
                    setShowOptions(false);

                    if (isPinned) {
                        unpinMessage(conversationId, secondaryConvId);
                        toast.info("Message unpinned");
                    } else {
                        setShowPinModal(true);
                    }
                }}
                className={`flex w-full items-center px-5 py-2.5 gap-4 cursor-pointer transition-colors ${isDark
                    ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white"
                    : "hover:bg-[#f5f6f6] text-[#111b21]"
                    }`}
            >
                {isPinned ? (
                    <WhatsAppUnpinIcon
                        size={18}
                        className="shrink-0 text-[#8696a0]"
                    />
                ) : (
                    <TbPin
                        size={18}
                        className="shrink-0 text-[#8696a0]"
                    />
                )}

                <span className="font-normal text-[14.5px]">
                    {isPinned ? "Unpin" : "Pin"}
                </span>
            </button>

            <button
                type="button"
                onClick={() => {
                    setShowOptions(false);
                    setShowForwardModal(true);
                }}
                className={`flex w-full items-center px-5 py-2.5 gap-4 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-[#f5f6f6] text-[#111b21]"
                    }`}
            >
                <SiMetaai size={18} className="shrink-0 text-[#8696a0]" />
                <span className="font-normal text-[14.5px]">Ask Meta AI</span>
            </button>

            <button
                type="button"
                onClick={() => {
                    setShowOptions(false);
                    const nowStarred = toggleStarMessage(message._id, message);
                    if (nowStarred) {
                        toast.success("Message starred");
                    } else {
                        toast.info("Message unstarred");
                    }
                }}
                className={`flex w-full items-center px-5 py-2.5 gap-4 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-[#f5f6f6] text-[#111b21]"
                    }`}
            >
                {isStarred ? (
                    <FaStar size={16} className="shrink-0 text-amber-400" />
                ) : (
                    <FaRegStar size={16} className="shrink-0 text-[#8696a0]" />
                )}
                <span className="font-normal text-[14.5px]">
                    {isStarred ? "Unstar" : "Star"}
                </span>
            </button>

            {isUserMessage && message.contentType === "text" && (
                <button
                    type="button"
                    onClick={() => {
                        setEditText(message.content || "");
                        setIsEditing(true);
                        setShowOptions(false);
                    }}
                    className={`flex w-full items-center px-5 py-2.5 gap-4 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-[#f5f6f6] text-[#111b21]"
                        }`}
                >
                    <RiEditLine size={17} className="shrink-0 text-[#8696a0]" />
                    <span className="font-normal text-[14.5px]">Edit</span>
                </button>
            )}

            {["document", "image", "video", "audio"].includes(message.contentType) && message.imageOrVideoUrl && (
                <button
                    type="button"
                    onClick={(e) => {
                        setShowOptions(false);
                        handleDownloadFile(
                            e,
                            message.imageOrVideoUrl,
                            message.fileName || (message.contentType === "document" ? "document.pdf" : `${message.contentType}-${message._id}`)
                        );
                    }}
                    className={`flex w-full items-center px-5 py-2.5 gap-4 cursor-pointer transition-colors ${isDark ? "hover:bg-[#182229] text-[#d1d7db] hover:text-white" : "hover:bg-[#f5f6f6] text-[#111b21]"
                        }`}
                >
                    <FaDownload size={15} className="shrink-0 text-[#8696a0]" />
                    <span className="font-normal text-[14.5px]">Download</span>
                </button>
            )}

            <div
                className={`my-1 border-t ${isDark ? "border-[#313d45]" : "border-black/10"
                    }`}
            />
            <button
                type="button"
                onClick={() => {
                    setShowOptions(false);
                    setShowReportModal(true);
                }}
                className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-lg border border-transparent px-5 py-2.5 cursor-pointer backdrop-blur-xl transition-all duration-300 ${isDark
                    ? "text-[#d1d7db] hover:bg-red-500/[0.08] hover:border-red-400/25 hover:shadow-[0_0_16px_rgba(239,68,68,0.08)]"
                    : "text-[#111b21] hover:bg-red-500/[0.05] hover:border-red-400/25 hover:shadow-[0_0_16px_rgba(239,68,68,0.06)]"
                    }`}
            >
                <FiThumbsDown
                    size={17}
                    className="shrink-0 text-[#8696a0] transition-colors duration-300 group-hover:text-red-500"
                />

                <span className="text-[14.5px] font-normal transition-colors duration-300 group-hover:text-red-500">
                    Report
                </span>
            </button>

            <button
                type="button"
                onClick={() => {
                    setDeleteModal(message);
                    setShowOptions(false);
                }}
                className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-lg border border-transparent px-5 py-2.5 cursor-pointer backdrop-blur-xl transition-all duration-300 ${isDark
                    ? "text-[#d1d7db] hover:bg-red-500/[0.08] hover:border-red-400/25 hover:shadow-[0_0_16px_rgba(239,68,68,0.08)]"
                    : "text-[#111b21] hover:bg-red-500/[0.05] hover:border-red-400/25 hover:shadow-[0_0_16px_rgba(239,68,68,0.06)]"
                    }`}
            >
                <RiDeleteBin6Line
                    size={17}
                    className="shrink-0 text-[#8696a0] transition-colors duration-300 group-hover:text-red-500"
                />

                <span className="text-[14.5px] font-normal transition-colors duration-300 group-hover:text-red-500">
                    Delete
                </span>
            </button>
        </>
    )
}

export default MessageMenu