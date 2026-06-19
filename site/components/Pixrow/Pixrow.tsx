import { statusColor } from "@/lib/meter";
import type { PixrowProps } from "./Pixrow.types";

// Decorative pixel strip (brand motif), ported from landing.js. Deterministic,
// so it renders on the server.
export function Pixrow({ cells = 7 }: PixrowProps) {
  return (
    <div className="pixrow" aria-hidden>
      {Array.from({ length: cells }, (_, i) => (
        <i key={i} style={{ background: statusColor((i + 0.5) / cells) }} />
      ))}
    </div>
  );
}
