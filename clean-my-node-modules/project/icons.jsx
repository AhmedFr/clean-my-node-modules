// icons.jsx — framework glyphs (rounded-square monograms) + UI icons.
// All original simplified marks; exported to window.

// --- UI icons (stroke, inherit color via currentColor) ---
function Icon({ path, size = 16, stroke = 2, fill = "none", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
    strokeLinejoin="round" style={style} aria-hidden="true">
      {path}
    </svg>);

}

const UIIcon = {
  search: (p) => <Icon {...p} path={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />,
  trash: (p) => <Icon {...p} path={<><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></>} />,
  folder: (p) => <Icon {...p} path={<path d="M4 5a2 2 0 0 1 2-2h3.5l2 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />} />,
  finder: (p) => <Icon {...p} path={<><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M12 4v16" /><path d="M7 9h.01M16.5 9c0 1.5-.8 3-1.5 4" /></>} />,
  gear: (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="3.2" /><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" data-comment-anchor="e99ca28a9f-path-20-71" /></>} />,
  refresh: (p) => <Icon {...p} path={<><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>} />,
  chevronRight: (p) => <Icon {...p} path={<path d="m9 6 6 6-6 6" />} />,
  chevronLeft: (p) => <Icon {...p} path={<path d="m15 6-6 6 6 6" />} />,
  check: (p) => <Icon {...p} path={<path d="m20 6-11 11-5-5" />} />,
  checkCircle: (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>} />,
  clock: (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />,
  alert: (p) => <Icon {...p} path={<><path d="M12 2 1 21h22z" /><path d="M12 9v5M12 17.5v.5" /></>} />,
  sparkle: (p) => <Icon {...p} path={<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />} />,
  command: (p) => <Icon {...p} path={<path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z" />} />,
  arrowUp: (p) => <Icon {...p} path={<path d="M12 19V5M5 12l7-7 7 7" />} />,
  arrowDown: (p) => <Icon {...p} path={<path d="M12 5v14M19 12l-7 7-7-7" />} />,
  enter: (p) => <Icon {...p} path={<path d="M9 10 4 15l5 5M4 15h12a4 4 0 0 0 4-4V4" />} />,
  x: (p) => <Icon {...p} path={<path d="M18 6 6 18M6 6l12 12" />} />,
  hdd: (p) => <Icon {...p} path={<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M7 15h.01M11 15h6" /></>} />
};

// --- Framework glyphs: { bg, fg, label, mark(fg) } drawn in a rounded square ---
const FRAMEWORKS = {
  react: { bg: "#0b3a47", fg: "#61dafb", mark: (c) => <g stroke={c} strokeWidth="1.4" fill="none"><ellipse cx="12" cy="12" rx="9" ry="3.6" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" /><circle cx="12" cy="12" r="1.6" fill={c} stroke="none" /></g> },
  next: { bg: "#000000", fg: "#ffffff", mark: (c) => <g><path d="M7 7v10M7 7l9 11" stroke={c} strokeWidth="1.7" fill="none" strokeLinecap="round" /><path d="M16 7v6.5" stroke={c} strokeWidth="1.7" strokeLinecap="round" /></g> },
  vue: { bg: "#14231d", fg: "#42b883", mark: (c) => <path d="M4 6h3.2L12 14l4.8-8H20l-8 13.5z M8.5 6H12l0 0 3.5 0" stroke={c} strokeWidth="1.5" fill="none" strokeLinejoin="round" /> },
  svelte: { bg: "#3a1a0e", fg: "#ff5d2b", mark: (c) => <path d="M14.5 7.5c-2-1.3-4.7-.8-6 1.1-1.4 1.9-.9 4.3.6 5.4-.2.4-.3.9-.3 1.4 0 1.7 1.5 3.1 3.6 3.1 1 0 2-.4 2.8-1.1l2-1.7c2-1.3 2.4-3.7 1-5.6" stroke={c} strokeWidth="1.4" fill="none" strokeLinejoin="round" /> },
  node: { bg: "#13270f", fg: "#7fc241", mark: (c) => <g stroke={c} strokeWidth="1.4" fill="none"><path d="M12 3.5 20 8v8L12 20.5 4 16V8z" strokeLinejoin="round" /><path d="M12 16c-2 0-3-1-3-2.4 0-.8.6-1.3 1.5-1.3 1 0 1.4.5 1.4 1.6 0 1 .8 1.6 2.1 1.6 1.2 0 1.9-.5 1.9-1.2 0-.8-.5-1.1-2.2-1.4-2-.3-3.2-.8-3.2-2.3 0-1.4 1.2-2.2 3.1-2.2 1.8 0 3 .7 3.1 2.2" /></g> },
  astro: { bg: "#1a1020", fg: "#ff5d01", mark: (c) => <g fill={c}><path d="M12 3 8 19l4-2.2L16 19z" opacity="0.95" /><ellipse cx="12" cy="16.5" rx="3.6" ry="1.2" fill="none" stroke={c} strokeWidth="1.2" /></g> },
  ts: { bg: "#13294a", fg: "#3b82f6", mark: (c) => <text x="12" y="16.5" fontSize="11" fontWeight="800" fill={c} textAnchor="middle" fontFamily="ui-monospace, monospace">TS</text> },
  vite: { bg: "#241a3a", fg: "#bd34fe", mark: (c) => <path d="M5 6 12 20 19 6 12 9z" stroke={c} strokeWidth="1.4" fill="none" strokeLinejoin="round" /> },
  remix: { bg: "#20242b", fg: "#9ca3af", mark: (c) => <path d="M6 6h7c2 0 3 1 3 2.6 0 1.6-1 2.4-2.6 2.5 1.6.1 2.6.8 2.6 2.7V18M6 11h6.5" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" /> },
  expo: { bg: "#0b1020", fg: "#e2e8f0", mark: (c) => <path d="M12 5 5 18M12 5l7 13M9 13h6" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /> }
};

function FrameworkIcon({ kind, size = 30, radius = 8 }) {
  const fw = FRAMEWORKS[kind] || FRAMEWORKS.node;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flex: "0 0 auto" }} aria-hidden="true">
      <rect x="0" y="0" width="24" height="24" rx={radius / size * 24} fill={fw.bg} />
      {fw.mark(fw.fg)}
    </svg>);

}

Object.assign(window, { UIIcon, FrameworkIcon, FRAMEWORKS });