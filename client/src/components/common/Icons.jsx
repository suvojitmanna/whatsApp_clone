export const AmazonSmileIcon = ({
  size,
  width = 28,
  height = 16,
  className = "text-black",
  ...props
}) => {
  const w = size ?? width;
  const h = size ? Math.round(size * (16 / 28)) : height;
  return (
    <svg
      viewBox="0 0 36 20"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
      {...props}
    >
      <path d="M 4 12 Q 18 20 32 8" />
      <path d="M 28 6 L 32 8 L 30 13" fill="currentColor" />
    </svg>
  );
};

export const PrimeVideoWaveIcon = ({
  size,
  width = 16,
  height = 6,
  className = "text-white",
  ...props
}) => {
  const w = size ?? width;
  const h = size ? Math.round(size * (6 / 16)) : height;
  return (
    <svg
      viewBox="0 0 20 6"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={className}
      {...props}
    >
      <path d="M 2 3 Q 10 7 18 2" />
    </svg>
  );
};

export const WhatsAppMediaFolderIcon = ({
  size = 20,
  width,
  height,
  className = "",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="2" y="5" width="16" height="13" rx="2.5" opacity="0.6" />
      <rect x="6" y="8" width="16" height="13" rx="2.5" />
      <circle cx="11" cy="13" r="1.5" />
      <path d="m22 17-4.5-4.5-4 4" />
    </svg>
  );
};

export const WhatsAppPinIcon = ({
  size = 12,
  width,
  height,
  className = "shrink-0",
  title = "Pinned message",
  ...props
}) => {
  const w = width || Math.abs(size);
  const h = height || Math.round(w * 1.25);
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 12 15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      title={title}
      {...props}
    >
      <path d="M2.5 1.5h7" />
      <path d="M3.5 1.5v3.6l-1.8 3.2v1.5h8.6V8.3L8.5 5.1V1.5" />
      <path d="M6 9.8v4.2" />
    </svg>
  );
};

export const WhatsAppUnpinIcon = ({
  size = 16,
  width,
  height,
  className = "shrink-0",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Unpin message"
      role="img"
      {...props}
    >
      <g
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 3.5H13" />
        <path d="M8 3.5V7L6 10V12H14V10L12 7V3.5" />
        <path d="M10 12V16.5" />
        <path d="M4 3.5L16 16.5" />
      </g>
    </svg>
  );
};

export const WhatsAppDisappearingIcon = ({
  size = 15,
  width,
  height,
  className = "shrink-0",
  ...props
}) => {
  const w = width || size;
  const h = height || size;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9.5" strokeDasharray="3.2 2.2" />
      <polyline points="12 6.8 12 12 15.6 14.2" strokeDasharray="none" />
    </svg>
  );
};

export const TailOutIcon = ({
  width = 8,
  height = 13,
  className = "fill-current",
  ...props }) => (
  <svg
    viewBox="0 0 8 13"
    height={height}
    width={width}
    className={className}
    {...props}
  >
    <path
      opacity="0.13"
      d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"
    />
    <path d="M5.188 0H0v12.193l6.467-8.625C7.526 2.156 6.958 0 5.188 0z" />
  </svg>
);

export const TailInIcon = ({
  width = 8,
  height = 13,
  className = "fill-current",
  ...props
}) => (
  <svg
    viewBox="0 0 8 13"
    height={height}
    width={width}
    className={className}
    {...props}
  >
    <path
      opacity="0.13"
      d="M1.533 4.568 8 13.193V1H2.812C1.042 1 .474 3.156 1.533 4.568z"
    />
    <path d="M1.533 3.568 8 12.193V0H2.812C1.042 0 .474 2.156 1.533 3.568z" />
  </svg>
);

export const ProhibitedIcon = ({
  size = 16,
  width,
  height,
  className = "shrink-0",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
};
export const CircleSlashIcon = ProhibitedIcon;

export const StatusRingPlaceholderIcon = ({
  size = 62,
  width,
  height,
  className = "",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 48 48"
      width={w}
      height={h}
      className={className}
      {...props}
    >
      <circle cx="24" cy="24" r="7.5" fill="currentColor" />
      <circle
        cx="24"
        cy="24"
        r="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeDasharray="20 5.13"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const ArchivedBoxIcon = ({
  size = 19,
  width,
  height,
  className = "shrink-0",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <polyline points="9 14 12 17 15 14" />
    </svg>
  );
};

export const MutedBellIcon = ({
  size = 19,
  width,
  height,
  className = "shrink-0",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
      <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
      <path d="M18 8a6 6 0 0 0-9.33-5" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
};
export const BellOffIcon = MutedBellIcon;

export const MarkUnreadIcon = ({
  size = 19,
  width,
  height,
  className = "shrink-0",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h9" />
      <line x1="7" y1="9" x2="13" y2="9" />
      <line x1="7" y1="13" x2="11" y2="13" />
      <circle cx="18" cy="6" r="3" fill="currentColor" />
    </svg>
  );
};

export const AddToListIcon = ({
  size = 19,
  width,
  height,
  className = "shrink-0",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M7 21h12a2 2 0 0 0 2-2V7" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
      <path d="M4 15l4-3 5 4" />
    </svg>
  );
};

export const MinusCircleIcon = ({
  size = 19,
  width,
  height,
  className = "shrink-0",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
};

export const ArrowLeftIcon = ({
  size = 18,
  width,
  height,
  className = "",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
};

export const ChevronUpIcon = ({
  size = 12,
  width,
  height,
  className = "",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      className={className}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M5 15l7-7 7 7"
      />
    </svg>
  );
};

export const ChevronDownIcon = ({
  size = 12,
  width,
  height,
  className = "",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      className={className}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
};

export const CheckmarkIcon = ({
  size = 14,
  width,
  height,
  className = "w-3.5 h-3.5 fill-current stroke-current",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 20 20"
      width={w}
      height={h}
      className={className}
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export const MessageCheckIcon = ({
  size = 14,
  width,
  height,
  className = "w-3.5 h-3.5 stroke-white fill-none stroke-[2.5]",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 16 16"
      width={w}
      height={h}
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3.5 8.5l3 3 6-6" />
    </svg>
  );
};

export const SelectCheckboxIcon = ({
  size = 18,
  width,
  height,
  className = "",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
};

export const GoToMessageIcon = ({
  size = 18,
  width,
  height,
  className = "",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="14" y2="13" />
    </svg>
  );
};

export const ReplyArrowIcon = ({
  size = 18,
  width,
  height,
  className = "",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
  );
};

export const ReplyPrivatelyIcon = ({
  size = 18,
  width,
  height,
  className = "",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="15" cy="7" r="3.5" />
      <path d="M19.5 19v-1a4 4 0 0 0-4-4h-2.5" />
      <polyline points="7 14 3 18 7 22" />
      <path d="M3 18h7a3 3 0 0 0 3-3v-1" />
    </svg>
  );
};

export const DownloadIcon = ({
  size = 18,
  width,
  height,
  className = "",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
};

export const CopyIcon = ({
  size = 18,
  width,
  height,
  className = "",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
};

export const ForwardDoubleArrowIcon = ({
  size = 18,
  width,
  height,
  className = "",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polyline points="15 7 20 12 15 17" />
      <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
      <polyline points="10 7 15 12 10 17" />
    </svg>
  );
};

export const StarIcon = ({
  size = 18,
  width,
  height,
  filled = false,
  className = "",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
};

export const TrashBinIcon = ({
  size = 18,
  width,
  height,
  className = "",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
};

export const MessageSquareIcon = ({
  size = 21,
  width,
  height,
  className = "shrink-0",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="13" y2="13" />
    </svg>
  );
};

export const PhoneCallIcon = ({
  size = 21,
  width,
  height,
  className = "shrink-0",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
};

export const PhotoDocumentIcon = ({
  size = 21,
  width,
  height,
  className = "shrink-0",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
};

export const MapPinIcon = ({
  size = 21,
  width,
  height,
  className = "shrink-0",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
};

export const StatusDashedIcon = ({
  size = 21,
  width,
  height,
  className = "shrink-0",
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9" strokeDasharray="5 3.5" />
      <circle cx="12" cy="12" r="3.5" fill="none" />
    </svg>
  );
};

export const EndToEndEncryptionIllustration = ({
  isDark = true,
  showBadge = false,
  width = 160,
  height = 125,
  className = "overflow-visible",
  ...props
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 160 125"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <g transform="translate(14, 20)">
      <circle
        cx="28"
        cy="28"
        r="23"
        fill={isDark ? "#182229" : "#222e35"}
        stroke="#ffffff"
        strokeWidth="5"
      />
      <line
        x1="12"
        y1="44"
        x2="44"
        y2="12"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </g>
    <path
      d="M62 48V28C62 17.5 70 9 80 9C90 9 98 17.5 98 28V48"
      stroke="#dcf8c6"
      strokeWidth="11"
      strokeLinecap="round"
    />
    <rect x="54" y="44" width="52" height="46" rx="14" fill="#dcf8c6" />
    <circle cx="80" cy="62" r="5" fill="#111b21" />
    <path d="M77 62L75 76H85L83 62Z" fill="#111b21" />
    <g transform="translate(86, 20)">
      <circle cx="34" cy="34" r="28" fill="#00a884" />
      <circle cx="34" cy="34" r="23" fill="#111b21" />

      <circle cx="34" cy="16" r="1.5" fill="#ffffff" />
      <circle cx="44" cy="19" r="1.5" fill="#ffffff" />
      <circle cx="51" cy="26" r="1.5" fill="#ffffff" />
      <circle cx="52" cy="35" r="1.5" fill="#ffffff" />
      <circle cx="17" cy="26" r="1.5" fill="#ffffff" />
      <circle cx="24" cy="19" r="1.5" fill="#ffffff" />

      <line
        x1="34"
        y1="34"
        x2="25"
        y2="23"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="34" cy="34" r="3" fill="#ffffff" />
    </g>
    {showBadge && (
      <g transform="translate(74, 82)">
        <rect x="0" y="0" width="30" height="13" rx="6.5" fill="#25d366" />
        <circle cx="6.5" cy="6.5" r="6.5" fill="#00a884" />
        <rect x="15" y="4" width="36" height="5" rx="2.5" fill="#ffffff" />
      </g>
    )}
  </svg>
);

export const DisappearingMessagesIllustration = ({
  width = 200,
  height = 125,
  className = "drop-shadow-md select-none",
  ...props
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 220 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M175 35 C175 22 163 12 148 12 C133 12 121 22 121 35 C121 44 126 51 134 55 L130 68 L143 58 C145 58 146 58 148 58 C163 58 175 48 175 35 Z"
      fill="#fff9e6"
    />
    <circle cx="112" cy="70" r="44" fill="#00a884" />
    <circle cx="112" cy="70" r="37" fill="#25d366" />
    <circle cx="112" cy="70" r="30" fill="#00a884" />
    <circle cx="112" cy="37" r="2.2" fill="#ffffff" />
    <circle cx="128" cy="41" r="2.2" fill="#ffffff" />
    <circle cx="142" cy="54" r="2.2" fill="#ffffff" />
    <circle cx="147" cy="70" r="2.2" fill="#ffffff" />
    <circle cx="142" cy="86" r="2.2" fill="#ffffff" />
    <circle cx="128" cy="99" r="2.2" fill="#ffffff" />
    <circle cx="112" cy="103" r="2.2" fill="#ffffff" />
    <circle cx="96" cy="99" r="2.2" fill="#ffffff" />
    <circle cx="82" cy="86" r="2.2" fill="#ffffff" />
    <circle cx="77" cy="69" r="2.2" fill="#ffffff" />
    <circle cx="81" cy="52" r="2.2" fill="#ffffff" />
    <circle cx="95" cy="39" r="2.2" fill="#ffffff" />
    <path
      d="M110 70 L133 47 C134.5 45.5 136.5 47.5 135 49 L114 72 Z"
      fill="#111b21"
    />
    <circle cx="112" cy="70" r="4.5" fill="#111b21" />
    <circle cx="72" cy="84" r="19" fill="#b9f5d0" />
    <circle cx="93" cy="94" r="14" fill="#b9f5d0" />
    <circle cx="81" cy="98" r="11" fill="#b9f5d0" />
    <circle cx="66" cy="64" r="6" fill="#b9f5d0" />
    <circle cx="162" cy="90" r="4.5" fill="#00a884" />
    <circle cx="170" cy="84" r="3" fill="#00a884" />
  </svg>
);

export const FavouritesEmptyIllustration = () => (
  <svg
    viewBox="0 0 200 180"
    className="w-48 h-44 mb-6 select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="66"
      y="32"
      width="82"
      height="110"
      rx="24"
      fill="#00a884"
      stroke="#111b21"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />

    <path
      d="M 148 68 C 145 59, 131 56, 123 66 C 114 77, 127 89, 148 103 C 169 89, 182 77, 173 66 C 165 56, 151 59, 148 68 Z"
      fill="#00a884"
      stroke="#111b21"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <rect
      x="52"
      y="24"
      width="82"
      height="110"
      rx="24"
      fill="#dcf8d6"
      stroke="#111b21"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {[42, 64, 86, 108].map((y) => (
      <rect
        key={y}
        x="43"
        y={y}
        width="16"
        height="8"
        rx="4"
        fill="#ffffff"
        stroke="#111b21"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    ))}

    <circle
      cx="93"
      cy="56"
      r="17"
      fill="none"
      stroke="#111b21"
      strokeWidth="3"
    />
    <circle
      cx="93"
      cy="51"
      r="5.5"
      fill="none"
      stroke="#111b21"
      strokeWidth="2.6"
    />
    <path
      d="M 81 67 C 82 60, 104 60, 105 67"
      fill="none"
      stroke="#111b21"
      strokeWidth="2.6"
      strokeLinecap="round"
    />

    <line
      x1="76"
      y1="85"
      x2="110"
      y2="85"
      stroke="#111b21"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <line
      x1="71"
      y1="96"
      x2="115"
      y2="96"
      stroke="#111b21"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <line
      x1="85"
      y1="107"
      x2="101"
      y2="107"
      stroke="#111b21"
      strokeWidth="3"
      strokeLinecap="round"
    />

    <path
      d="M 142 63 C 139 54, 125 51, 117 61 C 108 72, 121 84, 142 98 C 163 84, 176 72, 167 61 C 159 51, 145 54, 142 63 Z"
      fill="#9ae68e"
      stroke="#111b21"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const CallLaptopIllustration = ({ className = "w-44 h-32" }) => (
  <svg
    viewBox="0 0 160 110"
    className={`${className} select-none drop-shadow-md`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="80" cy="98" rx="58" ry="4" fill="#000000" opacity="0.35" />

    <rect
      x="36"
      y="18"
      width="88"
      height="66"
      rx="10"
      fill="#111b21"
      stroke="#1f2c34"
      strokeWidth="2.5"
    />

    <g clipPath="url(#laptopScreenClip)">
      <rect x="40" y="22" width="40" height="58" fill="#00c57c" />
      <line
        x1="45"
        y1="27"
        x2="49"
        y2="31"
        stroke="#111b21"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="49"
        y1="27"
        x2="45"
        y2="31"
        stroke="#111b21"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="45"
        y1="40"
        x2="69"
        y2="40"
        stroke="#111b21"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="45"
        y1="48"
        x2="69"
        y2="48"
        stroke="#111b21"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="45"
        y1="56"
        x2="59"
        y2="56"
        stroke="#111b21"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <rect x="80" y="22" width="40" height="58" fill="#f8faf6" />
      <g transform="translate(100, 51) rotate(-35) scale(0.95)">
        <path
          d="M -9 -14 C -11 -14, -14 -11, -14 -8 C -14 6, -5 15, 9 15 C 12 15, 15 12, 15 10 L 12 2 C 11 0, 9 -1, 7 0 L 4 2 C 0 0, -1 -1, -3 -5 L -1 -8 C 0 -10, 0 -12 -1 -13 L -8 -15 Z"
          fill="#00a884"
          stroke="#111b21"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>
    </g>

    <defs>
      <clipPath id="laptopScreenClip">
        <rect x="40" y="22" width="80" height="58" rx="7" />
      </clipPath>
    </defs>

    <path
      d="M 28 86 C 28 86, 31 83, 36 83 H 124 C 129 83, 132 86, 132 86 L 136 93 C 136 95, 133 96.5, 129 96.5 H 31 C 27 96.5, 24 95, 24 93 Z"
      fill="#f4f6f3"
      stroke="#111b21"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <rect x="73" y="86.5" width="14" height="2" rx="1" fill="#94a3b8" />
  </svg>
);

export const WhatsAppChatsIcon = ({
  size = 24,
  width,
  height,
  className = "",
  strokeWidth = 2,
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M 3.5 5.5 H 17.5 A 3 3 0 0 1 20.5 8.5 V 15.5 A 3 3 0 0 1 17.5 18.5 H 9 A 3 3 0 0 1 6.5 16 V 10 L 3.5 5.5 Z" />
      <path d="M 10.5 10.5 H 16" />
      <path d="M 10.5 14 H 13.8" />
    </svg>
  );
};

