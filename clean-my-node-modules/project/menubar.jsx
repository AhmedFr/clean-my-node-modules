// menubar.jsx — menu-bar app concepts: logo glyphs, faux macOS menu bar,
// dropdown panel designs. Reuses colors/data/icons loaded before this file.

const ACCENT = "#ff6363";
const GBb = 1024 * MB;

// ---------------- Monochrome menu-bar glyphs (template style) ----------------
// each: (color, strokeWidth, fillRatio?) -> svg children
const GLYPHS = {
  stack: (c, sw) => (
    <g fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round">
      <path d="M12 3 20.5 7.5 12 12 3.5 7.5z" />
      <path d="M3.5 12 12 16.5 20.5 12" />
      <path d="M3.5 16.5 12 21 20.5 16.5" />
    </g>
  ),
  module: (c, sw) => (
    <g fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <path d="M12 2.6 20.5 7.3v9.4L12 21.4 3.5 16.7V7.3z" />
      <path d="M3.5 7.3 12 12l8.5-4.7M12 12v9.4" />
    </g>
  ),
  // meter: ring + arc whose sweep = fillRatio
  meter: (c, sw, ratio = 0.72) => {
    const R = 8, C = 2 * Math.PI * R;
    return (
      <g fill="none" strokeLinecap="round">
        <circle cx="12" cy="12" r={R} stroke={c} strokeWidth={sw} opacity="0.28" />
        <circle cx="12" cy="12" r={R} stroke={c} strokeWidth={sw}
          strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, ratio))}
          transform="rotate(-90 12 12)" />
      </g>
    );
  },
  sweep: (c, sw) => (
    <g fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 4 11.5 12.5" />
      <path d="M4.5 20.5c-1.2-2.3.2-4.6 2.4-5.7l3.8 3.8c-1.1 2.2-3.4 3.6-5.7 2.4z" />
      <path d="M8.2 14.4 5.4 21M11 16.6 9 21.4" />
    </g>
  ),
  hex: (c, sw) => (
    <g fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <path d="M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4z" />
      <path d="M8.8 11.3 12 14.5l3.2-3.2M12 8.2v6" />
    </g>
  ),
};

const GLYPH_INFO = {
  meter:  { name: "Meter",  blurb: "Donut fills & reddens with disk pressure — status at a glance." },
  module: { name: "Module", blurb: "An isometric package — literal node_modules." },
  stack:  { name: "Stack",  blurb: "Stacked layers — the pile that builds up." },
  sweep:  { name: "Sweep",  blurb: "A broom — the cleaning action, friendly." },
  hex:    { name: "Hex",    blurb: "Node-ish hexagon with a clean-out arrow." },
};

function Glyph({ kind, size = 20, color = "currentColor", sw = 1.7, ratio }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
      {GLYPHS[kind](color, sw, ratio)}
    </svg>
  );
}

// colored app-icon squircle (dock / notifications)
function AppTile({ kind, size = 44, accent = ACCENT, ratio }) {
  const r = size * 0.26;
  return (
    <div style={{ width: size, height: size, borderRadius: r, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flex: "0 0 auto",
      background: `linear-gradient(155deg, ${mixColor(accent, "#fff", 0.16)}, ${mixColor(accent, "#000", 0.34)})`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px ${mixColor(accent, "#000", 0.3)}` }}>
      <Glyph kind={kind} size={size * 0.56} color="#fff" sw={1.8} ratio={ratio} />
    </div>
  );
}

// ---------------- faux macOS menu bar ----------------
function SysGlyph({ d, w = 18 }) {
  return <svg width={w} height="16" viewBox="0 0 24 20" fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
}
function MenuBar({ kind, over, open }) {
  const col = over ? "#ff7a7a" : "rgba(255,255,255,0.95)";
  return (
    <div style={{ position: "relative", zIndex: 5, height: 26, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 15, padding: "0 11px",
      background: "linear-gradient(to bottom, rgba(0,0,0,0.34), rgba(0,0,0,0.12))", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      {/* our app icon — active */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", height: 26, padding: "0 5px", borderRadius: 5,
        background: open ? "rgba(255,255,255,0.22)" : "transparent" }}>
        <Glyph kind={kind} size={17} color={col} sw={1.8} ratio={over ? 1 : 0.72} />
        {over && <span style={{ position: "absolute", top: 3, right: 1, width: 6, height: 6, borderRadius: "50%", background: ACCENT, boxShadow: "0 0 0 1.5px rgba(0,0,0,0.25)" }} />}
      </div>
      <SysGlyph d={<><path d="M5 12a7 7 0 0 1 14 0" /><path d="M8 12a4 4 0 0 1 8 0" /><circle cx="12" cy="13" r="0.6" fill="rgba(255,255,255,0.92)" /></>} />
      <SysGlyph w={22} d={<><rect x="3" y="7" width="16" height="9" rx="2.5" /><rect x="5" y="9" width="9" height="5" rx="1" fill="rgba(255,255,255,0.92)" stroke="none" /><path d="M20.5 10.5v3" /></>} />
      <span style={{ color: "rgba(255,255,255,0.92)", fontSize: 12.5, fontWeight: 500, letterSpacing: ".01em" }}>Mon 9:41</span>
    </div>
  );
}

// ---------------- shared dropdown bits ----------------
function oldestN(n) { return MOCK_PROJECTS.slice().sort((a, b) => a.lastUsed - b.lastUsed).slice(0, n); }
const TOTAL = MOCK_PROJECTS.reduce((a, p) => a + p.size, 0);

function MenuItem({ icon, label, shortcut, danger }) {
  const [h, setH] = React.useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px", margin: "0 6px", borderRadius: 6, cursor: "default",
        background: h ? (danger ? mixColor("#000", ACCENT, 0.9) : "rgba(120,150,255,0.9)") : "transparent",
        color: h ? "#fff" : "rgba(255,255,255,0.86)", transition: "background .08s" }}>
      <span style={{ display: "flex", width: 16, color: h ? "#fff" : "rgba(255,255,255,0.6)" }}>{icon && icon({ size: 15 })}</span>
      <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
      {shortcut && <span style={{ fontSize: 12, color: h ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)", letterSpacing: ".06em" }}>{shortcut}</span>}
    </div>
  );
}
function MiniRow({ p, accent }) {
  const [h, setH] = React.useState(false);
  const stale = staleness(p.lastUsed);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px", margin: "0 6px", borderRadius: 7, cursor: "default", background: h ? "rgba(255,255,255,0.07)" : "transparent" }}>
      <FrameworkIcon kind={p.kind} size={22} radius={6} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 550, color: "rgba(255,255,255,0.92)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
        <div style={{ fontSize: 10.5, color: mixColor("rgba(150,154,162,0.9)", accent, stale * 0.8) }}>{relativeTime(p.lastUsed)}</div>
      </div>
      {h ? (
        <button style={{ border: "none", cursor: "pointer", width: 24, height: 24, borderRadius: 6, background: mixColor("#000", accent, 0.82), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }} title="Delete">
          {UIIcon.trash({ size: 13 })}
        </button>
      ) : (
        <span style={{ fontSize: 12, fontWeight: 650, color: "rgba(255,255,255,0.8)", fontVariantNumeric: "tabular-nums" }}>{formatSizeStr(p.size)}</span>
      )}
    </div>
  );
}
function Sep() { return <div style={{ height: 1, background: "rgba(255,255,255,0.09)", margin: "6px 0" }} />; }

function Panel({ children, w = 332 }) {
  return (
    <div style={{ position: "absolute", top: 30, right: 8, width: w, zIndex: 10, borderRadius: 13, overflow: "hidden",
      background: "rgba(30,30,33,0.72)", backdropFilter: "blur(34px) saturate(180%)", WebkitBackdropFilter: "blur(34px) saturate(180%)",
      border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 22px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
      {children}
    </div>
  );
}
function CTA({ accent, children, sub }) {
  const [h, setH] = React.useState(false);
  return (
    <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: "calc(100% - 16px)", margin: "2px 8px 8px", border: "none", cursor: "pointer", padding: "9px 12px", borderRadius: 9,
        background: accent, color: "#fff", display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-start", filter: h ? "brightness(1.08)" : "none", transition: "filter .1s" }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{children}</span>
      {sub && <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>{sub}</span>}
    </button>
  );
}

// ---------------- Concept A: status list ----------------
function DropdownA({ kind, accent }) {
  const ratio = TOTAL / (4 * GBb);
  const status = statusColor(ratio, accent);
  const stale = oldestN(4);
  const freeable = stale.reduce((a, p) => a + p.size, 0);
  return (
    <Panel>
      <div style={{ padding: "12px 14px 10px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "rgba(255,255,255,0.42)" }}>node_modules on disk</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: "-.01em" }}>{formatSizeStr(TOTAL)}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: status }}>{formatSizeStr(TOTAL - 4 * GBb)} over limit</span>
        </div>
        <div style={{ marginTop: 9, height: 7, borderRadius: 4, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, ratio * 100)}%`, height: "100%", borderRadius: 4, background: status, boxShadow: `0 0 10px ${status}` }} />
        </div>
      </div>
      <Sep />
      <div style={{ padding: "0 0 2px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 14px 6px" }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "rgba(255,255,255,0.42)" }}>Oldest &amp; largest</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{MOCK_PROJECTS.length} total</span>
        </div>
        {stale.map((p) => <MiniRow key={p.id} p={p} accent={accent} />)}
      </div>
      <CTA accent={accent} sub={`Frees ${formatSizeStr(freeable)} · keeps your active projects`}>Clean {stale.length} stale folders</CTA>
      <Sep />
      <div style={{ paddingBottom: 6 }}>
        <MenuItem icon={UIIcon.search} label="Open full window…" shortcut="⌘O" />
        <MenuItem icon={UIIcon.refresh} label="Scan now" shortcut="⌘R" />
        <MenuItem icon={UIIcon.gear} label="Settings…" shortcut="⌘," />
      </div>
      <Sep />
      <div style={{ padding: "2px 20px 9px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Last scan 6 min ago · next in 6 h</div>
    </Panel>
  );
}

// ---------------- Concept B: glance / donut ----------------
function Donut({ ratio, status, size = 116 }) {
  const sw = 13, R = (size - sw) / 2, C = 2 * Math.PI * R, pct = Math.min(1, ratio);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={status} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: status }}>{Math.round(ratio * 100)}%</span>
        <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)" }}>of limit</span>
      </div>
    </div>
  );
}
function DropdownB({ kind, accent }) {
  const ratio = TOTAL / (4 * GBb);
  const status = statusColor(ratio, accent);
  const top = MOCK_PROJECTS.slice().sort((a, b) => b.size - a.size).slice(0, 5);
  const stale = oldestN(4);
  const freeable = stale.reduce((a, p) => a + p.size, 0);
  const segColors = ["#ff6363", "#f5a623", "#3b82f6", "#34d399", "#a78bfa"];
  return (
    <Panel w={332}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 14px 8px" }}>
        <Donut ratio={ratio} status={status} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>{formatSizeStr(TOTAL)}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>of 4.0 GB limit</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, padding: "3px 8px", borderRadius: 20, background: mixColor("#000", status, 0.78), color: mixColor("#fff", status, 0.35), fontSize: 11.5, fontWeight: 600 }}>
            <span style={{ display: "flex" }}>{UIIcon.alert({ size: 12 })}</span>{formatSizeStr(TOTAL - 4 * GBb)} over
          </div>
        </div>
      </div>
      {/* composition bar */}
      <div style={{ padding: "4px 14px 10px" }}>
        <div style={{ display: "flex", height: 8, borderRadius: 5, overflow: "hidden", gap: 1.5 }}>
          {top.map((p, i) => <div key={p.id} style={{ width: `${(p.size / TOTAL) * 100}%`, background: segColors[i], borderRadius: 2 }} title={p.name} />)}
          <div style={{ flex: 1, background: "rgba(255,255,255,0.14)", borderRadius: 2 }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 8 }}>
          {top.slice(0, 3).map((p, i) => (
            <span key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: segColors[i] }} />{p.name}
            </span>
          ))}
        </div>
      </div>
      <Sep />
      <CTA accent={accent} sub={`${stale.length} folders untouched 100+ days`}>Free up {formatSizeStr(freeable)}</CTA>
      <div style={{ paddingBottom: 6 }}>
        <MenuItem icon={UIIcon.search} label="Open full window…" shortcut="⌘O" />
        <MenuItem icon={UIIcon.refresh} label="Scan now" shortcut="⌘R" />
        <MenuItem icon={UIIcon.gear} label="Settings…" shortcut="⌘," />
      </div>
    </Panel>
  );
}

// wallpaper backdrop inside an artboard
function Desk({ children, h }) {
  return (
    <div style={{ position: "relative", width: "100%", height: h, overflow: "hidden",
      background: "radial-gradient(700px 380px at 80% 0%, #3a2440, transparent 60%), radial-gradient(620px 420px at 10% 90%, #123038, transparent 55%), linear-gradient(150deg, #14141a, #0c0c10)" }}>
      {children}
    </div>
  );
}

Object.assign(window, { Glyph, AppTile, MenuBar, DropdownA, DropdownB, Desk, GLYPHS, GLYPH_INFO, ACCENT });
