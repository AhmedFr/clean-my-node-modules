import { cn } from "@/lib/utils";
import { buildMeterCells } from "@/lib/meter";
import type { PixelMeterProps } from "./PixelMeter.types";

// Pure + deterministic, so it renders on the server (no client JS, no flash),
// unlike the original landing.js which built cells in the browser.
export function PixelMeter({
  used,
  threshold,
  cells = 32,
  className,
  style,
}: PixelMeterProps) {
  const meterCells = buildMeterCells({ used, threshold, cells });
  return (
    <div className={cn("lp-meter", className)} style={style}>
      {meterCells.map((cell, i) => (
        <div
          key={i}
          className={cell.hatch ? "cell hatch" : "cell"}
          title={cell.title}
          style={{
            backgroundColor: cell.color,
            boxShadow: cell.glow ? `0 0 7px ${cell.color}` : undefined,
          }}
        />
      ))}
    </div>
  );
}
