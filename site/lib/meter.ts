// Pixel-meter math, ported verbatim from the original site/landing.js so the
// Next.js meter renders identically. Single responsibility: meter color + cells.

export function hexToRgb(c: string): [number, number, number] {
  if (c[0] === "#") {
    let h = c.slice(1);
    if (h.length === 3)
      h = h
        .split("")
        .map((x) => x + x)
        .join("");
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }
  const m = c.match(/(\d+\.?\d*)/g) ?? ["136", "143", "152"];
  return [+m[0], +m[1], +m[2]];
}

export function mix(a: string, b: string, t: number): string {
  t = Math.max(0, Math.min(1, t));
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(
    A[1] + (B[1] - A[1]) * t,
  )},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
}

const ACCENT = "#ff6363";

export function statusColor(ratio: number): string {
  const safe = "#34d399";
  const warn = "#f5b14c";
  if (ratio <= 0.5) return mix("#22b378", safe, ratio / 0.5);
  if (ratio <= 0.82) return mix(safe, warn, (ratio - 0.5) / 0.32);
  return mix(warn, ACCENT, Math.min(1, (ratio - 0.82) / 0.18));
}

export interface MeterCell {
  hatch: boolean;
  color?: string;
  glow?: boolean;
  title?: string;
}

export function buildMeterCells({
  used,
  threshold,
  cells,
}: {
  used: number;
  threshold: number;
  cells: number;
}): MeterCell[] {
  const trackMaxGB = Math.max(threshold * 1.5, used * 1.05);
  const limitPos = Math.min(0.94, threshold / trackMaxGB);
  const limitIdx = Math.min(cells - 1, Math.max(0, Math.floor(limitPos * cells)));
  const out: MeterCell[] = [];
  for (let i = 0; i < cells; i++) {
    const p = ((i + 0.5) / cells) * trackMaxGB;
    if (i === limitIdx) {
      out.push({ hatch: true, title: `${threshold} GB limit` });
      continue;
    }
    if (p <= used) {
      const color = statusColor(p / threshold);
      out.push({ hatch: false, color, glow: p > threshold });
    } else {
      out.push({ hatch: false });
    }
  }
  return out;
}
