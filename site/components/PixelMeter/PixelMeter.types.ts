import type { CSSProperties } from "react";

export interface PixelMeterProps {
  used: number;
  threshold: number;
  cells?: number;
  className?: string;
  style?: CSSProperties;
}
