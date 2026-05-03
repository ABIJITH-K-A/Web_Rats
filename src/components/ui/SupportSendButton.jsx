const renderLetters = (label, offset = 0) =>
  label.split("").map((character, index) => (
    <span key={`${label}-${index}`} style={{ "--i": index + offset }}>
      {character === " " ? "\u00A0" : character}
    </span>
  ));

function SendPlaneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g filter="url(#tn-send-plane-shadow)">
        <path
          d="M14.22 21.63C13.04 21.63 11.37 20.8 10.05 16.83L9.33 14.67L7.17 13.95C3.21 12.63 2.38 10.96 2.38 9.78C2.38 8.61 3.21 6.93 7.17 5.6L15.66 2.77C17.78 2.06 19.55 2.27 20.64 3.35C21.73 4.43 21.94 6.21 21.23 8.33L18.4 16.82C17.07 20.8 15.4 21.63 14.22 21.63Z"
          fill="currentColor"
        />
        <path
          d="M10.11 14.4C9.92 14.4 9.73 14.33 9.58 14.18C9.29 13.89 9.29 13.41 9.58 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"
          fill="#0b0f13"
        />
      </g>
      <defs>
        <filter id="tn-send-plane-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="0.6" floodOpacity="0.45" />
        </filter>
      </defs>
    </svg>
  );
}

function SentCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g filter="url(#tn-send-check-shadow)">
        <path
          fill="currentColor"
          d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75Z"
        />
        <path
          fill="#0b0f13"
          d="M10.58 15.58C10.38 15.58 10.19 15.5 10.05 15.36L7.22 12.53C6.93 12.24 6.93 11.76 7.22 11.47C7.51 11.18 7.99 11.18 8.28 11.47L10.58 13.77L15.72 8.63C16.01 8.34 16.49 8.34 16.78 8.63C17.07 8.92 17.07 9.4 16.78 9.69L11.11 15.36C10.97 15.5 10.78 15.58 10.58 15.58Z"
        />
      </g>
      <defs>
        <filter id="tn-send-check-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="0.6" floodOpacity="0.45" />
        </filter>
      </defs>
    </svg>
  );
}

export default function SupportSendButton({
  status = "idle",
  idleLabel = "Send Message",
  sentLabel = "Sent",
  className = "",
  disabled = false,
  type = "submit",
  ...props
}) {
  return (
    <button
      type={type}
      data-status={status}
      disabled={disabled}
      className={`tn-send-btn w-full bg-[#0f151a] text-[#0b0f13] shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_18px_36px_rgba(0,0,0,0.3)] ${className}`}
      {...props}
    >
      <div className="tn-send-outline" />
      <div className="tn-send-state tn-send-state--default">
        <div className="tn-send-icon text-cyan-primary">
          <SendPlaneIcon />
        </div>
        <p>{renderLetters(idleLabel)}</p>
      </div>
      <div className="tn-send-state tn-send-state--sent">
        <div className="tn-send-icon text-cyan-primary">
          <SentCheckIcon />
        </div>
        <p>{renderLetters(sentLabel, 5)}</p>
      </div>
    </button>
  );
}
