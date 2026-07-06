import { statusColor } from "@/lib/meter";
import type { PixrowProps } from "./Pixrow.types";

// Decorative pixel strip (brand motif), ported from landing.js. Deterministic,
// so it renders on the server.
export function pixrowColors(cells: number, mirror: boolean): string[] {
  return Array.from({ length: cells }, (_, i) => {
    const frac = (i + 0.5) / cells;
    return statusColor(mirror ? 1 - frac : frac);
  });
}

export function Pixrow({ cells = 7, mirror = false }: PixrowProps) {
  return (
    <div className="pixrow" aria-hidden>
      {pixrowColors(cells, mirror).map((background, i) => (
        <i key={i} style={{ background }} />
      ))}
    </div>
  );
}
