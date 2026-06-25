export interface GaugeProps {
  /** Real disk used (own freeable bytes + pnpm store, counted once). */
  used: number
  threshold: number
  accent: string
  /** Bytes linked to the pnpm store across projects, for the tooltip. */
  linkedBytes?: number
  /** A background scan / pnpm-store sizing is still running — the total is provisional. */
  calculating?: boolean
}
