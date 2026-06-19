import type { CSSProperties } from "react";

export interface IconProps {
  /** Symbol id in the SvgSprite, e.g. "i-download". */
  id: string;
  className?: string;
  style?: CSSProperties;
}
