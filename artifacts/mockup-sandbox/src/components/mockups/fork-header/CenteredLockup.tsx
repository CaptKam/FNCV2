// Variant A: Centered Logomark
// Composition: user initial left | [icon + wordmark centered] | heart right
// Brand icon (fork + compass) anchors the centre; feels premium app (Airbnb / Headspace pattern)

function CompassForkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {/* Fork tines */}
      <line x1="7" y1="3" x2="7" y2="9" stroke="#9A4100" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="10" y1="3" x2="10" y2="9" stroke="#9A4100" strokeWidth="1.6" strokeLinecap="round" />
      {/* Fork handle */}
      <path d="M7 9 Q8.5 11 8.5 13 L8.5 21" stroke="#9A4100" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 9 Q8.5 11 8.5 13" stroke="#9A4100" strokeWidth="1.6" strokeLinecap="round" />
      {/* Compass needle — crossing the fork */}
      <line x1="14" y1="4" x2="20" y2="20" stroke="#C8651A" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="20" y1="4" x2="14" y2="20" stroke="#C8651A" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
      {/* Compass centre dot */}
      <circle cx="17" cy="12" r="1.8" fill="#9A4100" />
    </svg>
  );
}

export function CenteredLockup() {
  return (
    <div
      style={{
        background: "#FEF9F3",
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ height: 44 }} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 16px 14px",
          background: "rgba(254,249,243,0.94)",
          backdropFilter: "blur(16px)",
          borderBottom: "0.5px solid rgba(154,65,0,0.1)",
          position: "relative",
        }}
      >
        {/* Left: user initial in warm circle */}
        <button
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "rgba(154,65,0,0.10)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Noto Serif', Georgia, serif",
              fontWeight: 700,
              fontSize: 15,
              color: "#9A4100",
            }}
          >
            J
          </span>
        </button>

        {/* Centre: icon + wordmark */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <CompassForkIcon />
          <span
            style={{
              fontFamily: "'Noto Serif', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: 17,
              color: "#2D1A0E",
              letterSpacing: "-0.2px",
              whiteSpace: "nowrap",
            }}
          >
            Fork &amp; Compass
          </span>
        </div>

        {/* Right: heart */}
        <button
          style={{
            marginLeft: "auto",
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21C12 21 3 14.5 3 8.5C3 5.46 5.46 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.54 3 23 5.46 23 8.5C23 14.5 12 21 12 21Z"
              stroke="#9A4100"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Label */}
      <div
        style={{
          padding: "12px 20px 0",
          fontSize: 11,
          color: "#A0826A",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        A — Centered logomark · user initial · branded icon
      </div>
    </div>
  );
}
