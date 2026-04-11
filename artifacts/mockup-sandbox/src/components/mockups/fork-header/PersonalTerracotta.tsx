// Variant B: Personal + Terracotta
// Terracotta is the primary colour throughout — avatar, wordmark, icons.
// The user's actual avatar (initial + chosen icon) sits left; wordmark is terracotta, not neutral.
// Feels warm, personal, owned — like the app belongs to THIS user.

export function PersonalTerracotta() {
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
          justifyContent: "space-between",
          padding: "6px 18px 12px",
          background: "rgba(254,249,243,0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "0.5px solid rgba(154,65,0,0.12)",
        }}
      >
        {/* Left: solid terracotta avatar with user initial */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#9A4100",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(154,65,0,0.28)",
            }}
          >
            {/* Chef hat — the user's chosen avatar icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 14H18V19C18 19.5523 17.5523 20 17 20H7C6.44772 20 6 19.5523 6 19V14Z"
                fill="rgba(255,255,255,0.9)"
              />
              <path
                d="M8.5 14V11.5M15.5 14V11.5"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <circle cx="9" cy="9" r="3" fill="rgba(255,255,255,0.85)" />
              <circle cx="15" cy="9" r="3" fill="rgba(255,255,255,0.85)" />
              <circle cx="12" cy="7.5" r="3.5" fill="white" />
              <path
                d="M8.5 10.5 Q12 12 15.5 10.5"
                stroke="rgba(154,65,0,0.3)"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </button>

          {/* Wordmark — terracotta, not neutral */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <span
              style={{
                fontFamily: "'Noto Serif', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: 18,
                color: "#9A4100",
                letterSpacing: "-0.3px",
                lineHeight: 1.1,
              }}
            >
              Fork &amp; Compass
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 10,
                color: "#C87940",
                fontWeight: 500,
                letterSpacing: "0.05em",
              }}
            >
              Good morning, James
            </span>
          </div>
        </div>

        {/* Right: heart in terracotta */}
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(154,65,0,0.08)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21C12 21 3 14.5 3 8.5C3 5.46 5.46 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.54 3 23 5.46 23 8.5C23 14.5 12 21 12 21Z"
              fill="rgba(154,65,0,0.12)"
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
        B — Personal avatar · terracotta wordmark · greeting
      </div>
    </div>
  );
}
