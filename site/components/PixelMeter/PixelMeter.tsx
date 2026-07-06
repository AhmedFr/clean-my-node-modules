import { cn } from "@/lib/utils";
import { buildMeterCells } from "@/lib/meter";
import type { PixelMeterProps } from "./PixelMeter.types";

// Pure + deterministic, so it renders on the server (no client JS, no flash),
// unlike the original landing.js which built cells in the browser.
export function PixelMeter({
  used,
  threshold,
  cells = 32,
  size = "md",
  className,
  style,
}: PixelMeterProps) {
  const meterCells = buildMeterCells({ used, threshold, cells });
  return (
    <div className={cn("flex gap-[2px]", className)} style={style}>
      {meterCells.map((cell, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 bg-white/9",
            size === "sm"
              ? "h-[13px] rounded-[2px]"
              : "h-[18px] rounded-[2.5px]",
            cell.hatch &&
              "bg-[rgba(255,255,255,0.06)] bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.75)_0_1.6px,rgba(255,255,255,0)_1.6px_4.2px)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]",
          )}
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
