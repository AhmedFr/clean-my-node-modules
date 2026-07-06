import type { CSSProperties } from "react";

export interface PixelMeterProps {
  used: number;
  threshold: number;
  cells?: number;
  /** "sm" is the compact 13px-cell variant used inside the mock panels. */
  size?: "md" | "sm";
  className?: string;
  style?: CSSProperties;
}
