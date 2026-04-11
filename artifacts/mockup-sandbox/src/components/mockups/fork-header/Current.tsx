export function Current() {
  return (
    <div
      style={{
        background: "#FEF9F3",
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Simulated safe-area top */}
      <div style={{ height: 44, background: "rgba(254,249,243,0.92)" }} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 20px 14px",
          background: "rgba(254,249,243,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "0.5px solid rgba(154,65,0,0.08)",
        }}
      >
        {/* Left: avatar + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Avatar circle — generic, no identity */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
                stroke="#9CA3AF"
                strokeWidth="1.5"
              />
              <path
                d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20"
                stroke="#9CA3AF"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Wordmark — plain italic serif */}
          <span
            style={{
              fontFamily: "'Noto Serif', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 18,
              color: "#1C1410",
              letterSpacing: "-0.2px",
            }}
          >
            Fork &amp; Compass
          </span>
        </div>

        {/* Right: heart icon */}
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
        Current — generic avatar, plain italic wordmark
      </div>
    </div>
  );
}
