import type { SeverityCounts, SeverityKey } from '@renderer/lib/severity'

export interface SeveritySegment {
  key: SeverityKey
  count: number
  color: string
  /** Share of the vulnerable total (0–1). */
  frac: number
}

export interface SeverityMeterProps {
  counts: SeverityCounts
  /** Total package count, for the tooltip. */
  total: number
  /** Inventory still computing, show the ghost shimmer. */
  computing?: boolean
}
