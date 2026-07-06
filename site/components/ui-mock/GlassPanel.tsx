import { cn } from "@/lib/utils";
import type { GlassPanelProps } from "./ui-mock.types";

// `glass-panel` is a residual class in globals.css (backdrop blur chrome shared
// with the /og capture page, which cannot use components' utility classes).
export function GlassPanel({ className, children }: GlassPanelProps) {
  return <div className={cn("glass-panel", className)}>{children}</div>;
}
