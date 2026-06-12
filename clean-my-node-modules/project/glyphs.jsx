// glyphs.jsx — Module logo glyph + colored app tile (standalone, no menubar.jsx).
const GLYPHS = {
  module: (c, sw) => (
    <g fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <path d="M12 2.6 20.5 7.3v9.4L12 21.4 3.5 16.7V7.3z" />
      <path d="M3.5 7.3 12 12l8.5-4.7M12 12v9.4" />
    </g>
  ),
};
function Glyph({ kind, size = 20, color = "currentColor", sw = 1.7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
      {(GLYPHS[kind] || GLYPHS.module)(color, sw)}
    </svg>
  );
}
function AppTile({ kind = "module", size = 44, accent = "#ff6363" }) {
  const r = size * 0.26;
  return (
    <div style={{ width: size, height: size, borderRadius: r, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flex: "0 0 auto",
      background: `linear-gradient(155deg, ${mixColor(accent, "#fff", 0.16)}, ${mixColor(accent, "#000", 0.34)})`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px ${mixColor(accent, "#000", 0.3)}` }}>
      <Glyph kind={kind} size={size * 0.56} color="#fff" sw={1.8} />
    </div>
  );
}
Object.assign(window, { Glyph, AppTile, GLYPHS });
