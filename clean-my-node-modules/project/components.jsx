// components.jsx — Row, SizeViz (plain/bar/ring), Gauge, Kbd, Footer pieces.

// ---------- Keycap ----------
function Kbd({ children, wide }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: wide ? "auto" : 20, height: 20, padding: wide ? "0 7px" : "0 4px",
      borderRadius: 6, background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.72)",
      fontSize: 11.5, fontWeight: 600, lineHeight: 1, fontFamily: "var(--ui-font)"
    }}>{children}</span>);

}

// ---------- Size visualizations ----------
function SizeViz({ style, bytes, maxBytes, stale, accent, density }) {
  const s = formatSize(bytes);
  const ratio = Math.max(0.04, Math.min(1, bytes / maxBytes));
  // staleness drives warmth: fresh = cool slate, stale = accent red
  const col = mixColor("#8a8f98", accent, stale);
  const num =
  <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 650, color: "rgba(255,255,255,0.92)", fontSize: density === "compact" ? 13 : 14 }}>
      {s.value}<span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginLeft: 2, fontWeight: 600 }}>{s.unit}</span>
    </span>;

  if (style === "plain") {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", minWidth: 70 }}>{num}</div>;
  }
  if (style === "bar") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, minWidth: 96 }}>
        {num}
        <div style={{ width: 88, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ width: `${ratio * 100}%`, height: "100%", borderRadius: 3, background: col, transition: "width .5s cubic-bezier(.2,.8,.2,1)" }} />
        </div>
      </div>);

  }
  // ring
  const R = 13,C = 2 * Math.PI * R;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 92, justifyContent: "flex-end" }}>
      {num}
      <svg width="32" height="32" viewBox="0 0 32 32" style={{ flex: "0 0 auto" }}>
        <circle cx="16" cy="16" r={R} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="3.5" />
        <circle cx="16" cy="16" r={R} fill="none" stroke={col} strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={C * (1 - ratio)} transform="rotate(-90 16 16)"
        style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1), stroke .4s" }} />
      </svg>
    </div>);

}

// ---------- Inline row action button ----------
function RowAction({ icon, label, danger, onClick }) {
  const [h, setH] = React.useState(false);
  return (
    <button onClick={(e) => {e.stopPropagation();onClick();}}
    onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
    title={label} aria-label={label}
    style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 28, height: 28, borderRadius: 7, border: "none", cursor: "pointer",
      background: h ? danger ? "rgba(255,99,99,0.18)" : "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
      color: danger ? h ? "#ff8585" : "rgba(255,99,99,0.85)" : "rgba(255,255,255,0.75)",
      transition: "background .12s, color .12s, transform .12s", transform: h ? "scale(1.06)" : "scale(1)"
    }}>
      {icon({ size: 15 })}
    </button>);

}

// ---------- Row ----------
function Row({ p, selected, density, sizeStyle, maxBytes, accent, deleting, onSelect, onOpen, onFinder, onDelete, rowRef }) {
  const [hover, setHover] = React.useState(false);
  const stale = staleness(p.lastUsed);
  const roomy = density === "roomy";
  const showActions = selected || hover;
  return (
    <div ref={rowRef} role="option" aria-selected={selected}
    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    onMouseMove={() => {if (!selected) onSelect();}}
    onClick={onOpen}
    style={{
      position: "relative", display: "flex", alignItems: "center",
      gap: roomy ? 13 : 11, padding: roomy ? "11px 14px" : "7px 14px",
      borderRadius: 10, cursor: "pointer", zIndex: 1,
      height: deleting ? 0 : "auto", paddingTop: deleting ? 0 : undefined, paddingBottom: deleting ? 0 : undefined,
      opacity: deleting ? 0 : 1, transform: deleting ? "translateX(40px) scale(.97)" : "none",
      overflow: "hidden",
      transition: "opacity .32s ease, transform .32s ease, height .32s ease, padding .32s ease"
    }}>
      <FrameworkIcon kind={p.kind} size={roomy ? 34 : 28} radius={roomy ? 9 : 8} />
      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: roomy ? "column" : "row", alignItems: roomy ? "flex-start" : "baseline", gap: roomy ? 2 : 9 }}>
        <span style={{ fontWeight: 600, fontSize: roomy ? 14.5 : 13.5, color: "rgba(255,255,255,0.95)", whiteSpace: "nowrap" }}>{p.name}</span>
        <span style={{ fontSize: roomy ? 12 : 12, color: "rgba(255,255,255,0.38)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--mono-font)" }}>{p.path}/node_modules</span>
      </div>
      {/* last used */}
      <div style={{ display: showActions ? "none" : "flex", alignItems: "center", gap: 5, color: mixColor("rgba(150,154,162,0.9)", accent, stale * 0.9), fontSize: 12, whiteSpace: "nowrap", minWidth: 92, justifyContent: "flex-end" }}>
        <span style={{ opacity: 0.8 }}>{UIIcon.clock({ size: 13 })}</span>
        {relativeTime(p.lastUsed)}
      </div>
      {/* size */}
      <div style={{ display: showActions && sizeStyle !== "plain" ? "none" : "flex", justifyContent: "flex-end" }}>
        <SizeViz style={sizeStyle} bytes={p.size} maxBytes={maxBytes} stale={stale} accent={accent} density={density} />
      </div>
      {/* actions */}
      {showActions &&
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RowAction icon={UIIcon.finder} label="Reveal in Finder" onClick={onFinder} />
          <RowAction icon={UIIcon.chevronRight} label="Open project" onClick={onOpen} />
          <RowAction icon={UIIcon.trash} label="Delete node_modules" danger onClick={onDelete} />
        </div>
      }
    </div>);

}

// ---------- Threshold gauge (header) — pixel-cell bar matching the menu meter ----------
function Gauge({ used, threshold, accent }) {
  const unit = 1024 * MB;
  const usedGB = used / unit, thresholdGB = threshold / unit;
  const trackMaxGB = Math.max(thresholdGB * 1.5, usedGB * 1.05);
  const cells = 16;
  const limitPos = Math.min(0.94, thresholdGB / trackMaxGB);
  const limitCellIdx = Math.min(cells - 1, Math.max(0, Math.floor(limitPos * cells)));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <div style={{ fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.92)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{formatSizeStr(used)}</div>
      <div style={{ display: "flex", gap: 1.5, width: 132 }} data-comment-anchor="14b9e2e176-div-130-9">
        {Array.from({ length: cells }).map((_, i) => {
          const p = ((i + 0.5) / cells) * trackMaxGB;
          const filled = p <= usedGB;
          const over = p > thresholdGB;
          if (i === limitCellIdx) {
            return <div key={i} title={`${thresholdGB} GB limit`} style={{ flex: 1, height: 12, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.06)", backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.7) 0 1.5px, rgba(255,255,255,0) 1.5px 4px)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5)" }} />;
          }
          const col = filled ? statusColor(p / thresholdGB, accent) : "rgba(255,255,255,0.09)";
          return <div key={i} style={{ flex: 1, height: 12, borderRadius: 2, backgroundColor: col, boxShadow: filled && over ? `0 0 6px ${col}` : "none" }} />;
        })}
      </div>
    </div>);

}

Object.assign(window, { Kbd, SizeViz, Row, RowAction, Gauge });