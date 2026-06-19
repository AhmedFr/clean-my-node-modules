import { statusColor } from "@/lib/meter";
import { PANEL, PANEL_PROJECTS } from "./AppPanel.constants";

// Sized sprite glyph (mirrors the renderer's UIIcon size prop).
function G({ id, size }: { id: string; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: "block", flexShrink: 0 }}
    >
      <use href={`#${id}`} />
    </svg>
  );
}

function Separator() {
  return <div style={{ height: 1, background: "var(--surface-2)", margin: "7px 0" }} />;
}

function Meter() {
  const cells = 32;
  const { usedGB, thresholdGB, trackMaxGB } = PANEL;
  const limitPos = Math.min(0.97, thresholdGB / trackMaxGB);
  const limitIdx = Math.min(cells - 1, Math.max(0, Math.floor(limitPos * cells)));
  return (
    <div style={{ position: "relative", paddingTop: 4 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {Array.from({ length: cells }).map((_, i) => {
          const p = ((i + 0.5) / cells) * trackMaxGB;
          const filled = p <= usedGB;
          const over = p > thresholdGB;
          if (i === limitIdx) {
            return (
              <div
                key={i}
                title={`${thresholdGB} GB limit`}
                style={{
                  flex: 1,
                  height: 17,
                  borderRadius: 2.5,
                  backgroundColor: "var(--surface-1)",
                  backgroundImage:
                    "repeating-linear-gradient(45deg, var(--text-3) 0 1.5px, rgba(255,255,255,0) 1.5px 4px)",
                  boxShadow: "inset 0 0 0 1px var(--text-muted)",
                }}
              />
            );
          }
          const col = filled ? statusColor(p / thresholdGB) : "var(--surface-2)";
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 17,
                borderRadius: 2.5,
                backgroundColor: col,
                boxShadow: filled && over ? `0 0 7px ${col}` : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

const SECTION_LABEL = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: ".05em",
  color: "var(--text-dim)",
};

const MENU_ITEMS = [
  { icon: "i-search", label: "Open full window…", shortcut: "⌘O" },
  { icon: "i-refresh", label: "Scan now", shortcut: "⌘R" },
  { icon: "i-gear", label: "Settings…", shortcut: "⌘," },
  { icon: "i-power", label: "Quit", shortcut: "⌘Q" },
];

/**
 * Recreation of the live menu-bar dropdown (src/renderer PanelApp), rendered
 * with demo data. Markup + inline styles are ported from the real renderer
 * components; design tokens are scoped to `.app-panel` in landing.css.
 */
export function AppPanel() {
  const status = statusColor(PANEL.usedGB / PANEL.thresholdGB);
  return (
    <div className="app-panel">
      {/* DiskSummary */}
      <div style={{ padding: "13px 15px 12px" }}>
        <div style={SECTION_LABEL}>node_modules on disk</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginTop: 5,
          }}
        >
          <span
            style={{
              fontSize: 27,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-.01em",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {PANEL.total}
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 3,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
              }}
            >
              <span style={{ display: "flex", color: "var(--text-dim)" }}>
                <G id="i-hdd" size={12} />
              </span>
              {PANEL.thresholdGB} GB limit
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
                fontSize: 12.5,
                fontWeight: 650,
                color: status,
              }}
            >
              <span style={{ display: "flex" }}>
                <G id="i-alert" size={12} />
              </span>
              {PANEL.over}
            </span>
          </div>
        </div>
        <Meter />
      </div>

      <Separator />

      {/* Reclaimable list */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 15px 4px",
        }}
      >
        <span style={SECTION_LABEL}>Reclaimable · oldest first</span>
        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
          {PANEL.totalCount} total
        </span>
      </div>
      {PANEL_PROJECTS.map((p) => (
        <div
          key={p.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "6px 8px",
            margin: "0 6px",
            borderRadius: 7,
          }}
        >
          <svg
            width={23}
            height={23}
            viewBox="0 0 24 24"
            style={{ display: "block", flexShrink: 0 }}
          >
            <use href={`#${p.framework}`} />
          </svg>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 550,
                color: "var(--text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {p.name}
            </div>
            <div style={{ fontSize: 10.5, color: "rgba(150,154,162,0.95)" }}>
              {p.age}
            </div>
          </div>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 650,
              color: "rgba(255,255,255,0.82)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {p.size}
          </span>
        </div>
      ))}

      {/* Clean stale CTA */}
      <button
        type="button"
        style={{
          width: "calc(100% - 16px)",
          margin: "4px 8px 6px",
          border: "none",
          cursor: "default",
          padding: "9px 12px",
          borderRadius: 9,
          background: "var(--accent)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700 }}>{PANEL.stale.label}</span>
        <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>
          {PANEL.stale.sub}
        </span>
      </button>

      <Separator />

      {/* Caches — pnpm store */}
      <div style={{ ...SECTION_LABEL, padding: "8px 15px 4px" }}>Caches</div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "6px 8px",
          margin: "0 6px 4px",
          borderRadius: 7,
        }}
      >
        <span
          style={{
            width: 23,
            height: 23,
            borderRadius: 6,
            background: "var(--surface-2)",
            color: "var(--text-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
          }}
        >
          <G id="i-hdd" size={13} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 550, color: "var(--text)" }}>
            {PANEL.store.name}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: "rgba(150,154,162,0.95)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {PANEL.store.path}
          </div>
        </div>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 650,
            color: "rgba(255,255,255,0.82)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {PANEL.store.size}
        </span>
        <button
          type="button"
          style={{
            border: "1px solid var(--surface-4)",
            cursor: "default",
            padding: "4px 9px",
            borderRadius: 7,
            background: "var(--surface-1)",
            color: "rgba(255,255,255,0.85)",
            fontSize: 11.5,
            fontWeight: 600,
            flex: "none",
          }}
        >
          Prune
        </button>
      </div>

      <Separator />

      {/* Menu items */}
      <div style={{ paddingBottom: 5 }}>
        {MENU_ITEMS.map((m) => (
          <div
            key={m.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "6px 10px",
              margin: "0 6px",
              borderRadius: 6,
              color: "rgba(255,255,255,0.86)",
            }}
          >
            <span
              style={{ display: "flex", width: 16, color: "rgba(255,255,255,0.6)" }}
            >
              <G id={m.icon} size={15} />
            </span>
            <span style={{ flex: 1, fontSize: 13 }}>{m.label}</span>
            <span
              style={{ fontSize: 12, color: "var(--text-dim)", letterSpacing: ".06em" }}
            >
              {m.shortcut}
            </span>
          </div>
        ))}
      </div>

      <Separator />

      <div style={{ padding: "1px 16px 9px", fontSize: 11, color: "var(--text-dim)" }}>
        Last scan {PANEL.lastScan} · next in {PANEL.nextScan}
      </div>
    </div>
  );
}
