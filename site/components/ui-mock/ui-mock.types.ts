import type { ReactNode } from "react";

export interface GlassPanelProps {
  className?: string;
  children: ReactNode;
}

export interface UiRowProps {
  /** Selected-row treatment (subtle fill + inset ring). */
  highlighted?: boolean;
  className?: string;
  children: ReactNode;
}

export interface RowMetaProps {
  name: string;
  sub: string;
  /** Render the sub line (a path) in the mono face. */
  mono?: boolean;
}

export interface PillProps {
  tone: "sev" | "unify" | "upd";
  children: ReactNode;
}

export interface SizeLabelProps {
  value: string;
  unit: string;
}

export interface PicoProps {
  /** Severity tint (accent icon color). */
  sev?: boolean;
  /** Compact 26px variant used by the hero mini-card. */
  small?: boolean;
  children: ReactNode;
}
