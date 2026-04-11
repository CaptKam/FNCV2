// Variant C: Stamp Badge / Monogram
// The brand is anchored by a compact monogram badge (like a wax seal or passport stamp).
// "F&C" in a bordered rounded-square — ownable, distinctive, works as app icon too.
// Wordmark sits beside it in a relaxed but confident Noto Serif.

export function StampBadge() {
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
          padding: "8px 18px 14px",
          background: "rgba(254,249,243,0.94)",
          backdropFilter: "blur(16px)",
          borderBottom: "0.5px solid rgba(154,65,0,0.1)",
        }}
      >
        {/* Left: monogram badge + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          {/* Badge — works as logo lockup on its own */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "1.5px solid #9A4100",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 0,
              background: "rgba(154,65,0,0.05)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "'Noto Serif', Georgia, serif",
                fontWeight: 700,
                fontStyle: "italic",
                fontSize: 13,
                color: "#9A4100",
                lineHeight: 1,
                letterSpacing: "-0.5px",
              }}
            >
              F&amp;C
            </span>
          </div>

          {/* Wordmark beside the badge */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "'Noto Serif', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: 17,
                color: "#2D1A0E",
                letterSpacing: "-0.2px",
                lineHeight: 1.15,
              }}
            >
              Fork &amp; Compass
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 10,
                color: "#A0826A",
                fontWeight: 400,
                letterSpacing: "0.04em",
              }}
            >
              Pick a country. Cook a dinner.
            </span>
          </div>
        </div>

        {/* Right: two actions — profile initial + heart */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(154,65,0,0.09)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Noto Serif', Georgia, serif",
                fontWeight: 700,
                fontSize: 14,
                color: "#9A4100",
              }}
            >
              J
            </span>
          </button>
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
        C — Monogram badge · tagline · dual right actions
      </div>
    </div>
  );
}
