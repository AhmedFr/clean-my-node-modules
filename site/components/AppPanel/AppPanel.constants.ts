// Demo data for the Hero's recreation of the real menu-bar panel. Mirrors the
// believable numbers from the original mockup; layout/markup are ported from
// the actual renderer components (PanelApp / DiskSummary / MiniRow / …).

export interface PanelProject {
  name: string;
  framework: string; // sprite id, e.g. "fw-react"
  age: string;
  size: string; // e.g. "612 MB"
}

export const PANEL = {
  total: "5.42 GB",
  thresholdGB: 5,
  usedGB: 5.42,
  trackMaxGB: 7.5, // max(thresholdGB*1.5, usedGB*1.06)
  over: "430 MB over",
  totalCount: 12,
  stale: { label: "Clean 5 stale folders", sub: "Frees 2.2 GB · keeps your active projects" },
  store: { name: "pnpm store", path: "~/Library/pnpm/store/v3", size: "1.84 GB" },
  lastScan: "6 min ago",
  nextScan: "18 h",
  toast: { label: "legacy-dashboard", size: "612 MB" },
} as const;

export const PANEL_PROJECTS: PanelProject[] = [
  { name: "legacy-dashboard", framework: "fw-react", age: "1 year ago", size: "612 MB" },
  { name: "recipe-app-old", framework: "fw-expo", age: "11 months ago", size: "903 MB" },
  { name: "hackathon-bot", framework: "fw-node", age: "9 months ago", size: "441 MB" },
  { name: "portfolio-2021", framework: "fw-vue", age: "7 months ago", size: "284 MB" },
];
