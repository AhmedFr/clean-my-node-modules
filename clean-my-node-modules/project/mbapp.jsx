// mbapp.jsx — interactive menu bar app. Module icon + Concept A status list
// with a pixel-cell meter. Reuses colors/icons/data/menubar(Glyph,AppTile).

var { useState, useEffect, useRef, useMemo, useCallback } = React;
const GBx = 1024 * MB;
const INITIAL_TOTAL = MOCK_PROJECTS.reduce((a, p) => a + p.size, 0);
const STALE_DAYS = 100;

const MB_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#ff6363",
  "thresholdGB": 5,
  "scanInterval": "daily",
  "cells": 32,
  "meter": "pixels",
  "notify": true,
  "density": "compact",
  "sizeStyle": "plain"
} /*EDITMODE-END*/;

// ---------------- Pixel-cell meter ----------------
function PixelMeter({ usedGB, thresholdGB, trackMaxGB, accent, cells, style }) {
  const shown = usedGB; // fill tracks the live value; cells transition on change
  const limitPos = Math.min(0.97, thresholdGB / trackMaxGB);

  if (style === "smooth") {
    const ratio = shown / trackMaxGB;
    const sc = statusColor(shown / thresholdGB, accent);
    return (
      <div style={{ position: "relative", paddingTop: 14 }}>
        <div style={{ height: 8, borderRadius: 5, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, ratio * 100)}%`, height: "100%", borderRadius: 5, background: sc, boxShadow: shown > thresholdGB ? `0 0 10px ${sc}` : "none", transition: "width .6s cubic-bezier(.2,.8,.2,1), background .4s" }} />
        </div>
        <LimitTick limitPos={limitPos} thresholdGB={thresholdGB} />
      </div>);

  }

  const limitCellIdx = Math.min(cells - 1, Math.max(0, Math.floor(limitPos * cells)));
  return (
    <div style={{ position: "relative", paddingTop: 4 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {Array.from({ length: cells }).map((_, i) => {
          const p = (i + 0.5) / cells * trackMaxGB; // GB at cell center
          const filled = p <= shown;
          const over = p > thresholdGB;
          const isLimit = i === limitCellIdx;
          const col = filled ? statusColor(p / thresholdGB, accent) : "rgba(255,255,255,0.085)";
          if (isLimit) {
            // the limit marker: a hatched rectangle in place of the overlaid line
            return (
              <div key={i} title={`${thresholdGB} GB limit`} style={{
                flex: 1, height: 17, borderRadius: 2.5,
                backgroundColor: "rgba(255,255,255,0.06)",
                backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.7) 0 1.5px, rgba(255,255,255,0) 1.5px 4px)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5)"
              }} />);

          }
          return (
            <div key={i} style={{
              flex: 1, height: 17, borderRadius: 2.5,
              backgroundColor: col,
              boxShadow: filled && over ? `0 0 7px ${mixColor(col, "rgba(0,0,0,0)", 0.35)}` : "none"
            }} />);

        })}
      </div>
    </div>);

}
function LimitTick({ limitPos, line = true }) {
  if (!line) return null;
  return <div style={{ position: "absolute", top: 9, height: 27, left: `${limitPos * 100}%`, width: 2, marginLeft: -1, background: "rgba(255,255,255,0.85)", borderRadius: 2, zIndex: 2 }} />;
}

// ---------------- bits ----------------
function MItem({ icon, label, shortcut, danger, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick}
    style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px", margin: "0 6px", borderRadius: 6, cursor: "default",
      background: h ? danger ? mixColor("#000", "#ff6363", 0.86) : "rgba(255,255,255,0.07)" : "transparent",
      color: h ? "#fff" : "rgba(255,255,255,0.86)", transition: "background .08s" }}>
      <span style={{ display: "flex", width: 16, color: h ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)" }}>{icon && icon({ size: 15 })}</span>
      <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
      {shortcut && <span style={{ fontSize: 12, color: h ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)", letterSpacing: ".06em" }}>{shortcut}</span>}
    </div>);

}
function MiniRow({ p, accent, deleting, onDelete, onReveal }) {
  const [h, setH] = useState(false);
  const stale = staleness(p.lastUsed);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onReveal}
    style={{ display: "flex", alignItems: "center", gap: 9, padding: deleting ? "0 8px" : "6px 8px", margin: "0 6px", borderRadius: 7, cursor: "default",
      background: h && !deleting ? "rgba(255,255,255,0.07)" : "transparent",
      height: deleting ? 0 : "auto", opacity: deleting ? 0 : 1, transform: deleting ? "translateX(30px)" : "none",
      overflow: "hidden", transition: "opacity .3s, transform .3s, height .3s, padding .3s" }}>
      <FrameworkIcon kind={p.kind} size={23} radius={6} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 550, color: "rgba(255,255,255,0.92)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
        <div style={{ fontSize: 10.5, color: mixColor("rgba(150,154,162,0.95)", accent, stale * 0.85) }}>{relativeTime(p.lastUsed)}</div>
      </div>
      {h ?
      <button onClick={(e) => {e.stopPropagation();onDelete();}} title="Delete now"
      style={{ border: "none", cursor: "pointer", width: 26, height: 26, borderRadius: 7, background: mixColor("#000", accent, 0.8), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {UIIcon.trash({ size: 14 })}
        </button> :

      <span style={{ fontSize: 12.5, fontWeight: 650, color: "rgba(255,255,255,0.82)", fontVariantNumeric: "tabular-nums" }}>{formatSizeStr(p.size)}</span>
      }
    </div>);

}
function Sep2() {return <div style={{ height: 1, background: "rgba(255,255,255,0.09)", margin: "7px 0" }} />;}
function Seg({ options, value, onChange, accent }) {
  return (
    <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: 2, gap: 2 }}>
      {options.map((o) => {
        const on = o === value;
        return <button key={o} onClick={() => onChange(o)} style={{ border: "none", cursor: "pointer", padding: "4px 9px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, color: on ? "#fff" : "rgba(255,255,255,0.55)", background: on ? accent : "transparent", textTransform: "capitalize" }}>{o}</button>;
      })}
    </div>);

}

Object.assign(window, { PixelMeter, MItem, MiniRow, Sep2, Seg, GBx, INITIAL_TOTAL, STALE_DAYS, MB_DEFAULTS });