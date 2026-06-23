import type { Density, SizeStyle } from '@shared/settings.types'

export interface SizeVizProps {
  style: SizeStyle
  /** Headline size: bytes freed by deleting this folder now (real/unique). */
  bytes: number
  /** Total apparent size; when larger than `bytes`, the difference is shown as linked. */
  apparentBytes?: number
  maxBytes: number
  /** 0..1, drives warmth: fresh = cool slate, stale = accent. */
  stale: number
  accent: string
  density: Density
}
