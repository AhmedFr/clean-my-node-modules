// Per-card presentation for the four areas (copy lives in dict.areas.cards).
// `bar` drives the mini visual: a PixelMeter for size areas, a severity strip
// for Packages. Order matches dict.areas.cards: Projects, Caches, Packages, Docker.
export const AREA_ICONS = ["i-hdd", "i-layers", "i-box", "i-docker"] as const;

export type AreaBar =
  | { kind: "size"; used: number; threshold: number; label: string }
  | { kind: "sev"; label: string };

export const AREA_BARS: [AreaBar, AreaBar, AreaBar, AreaBar] = [
  { kind: "size", used: 41.2, threshold: 30, label: "41.2 GB" },
  { kind: "size", used: 6.4, threshold: 10, label: "6.4 GB" },
  { kind: "sev", label: "7 vulnerable" },
  { kind: "size", used: 23.6, threshold: 20, label: "23.6 GB" },
];

/** Docker is the newest area; give its card the accent border. */
export const AREA_ACCENT = [false, false, false, true] as const;
