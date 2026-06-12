import type { Density, SizeStyle } from '@shared/settings.types'

export interface SizeVizProps {
  style: SizeStyle
  bytes: number
  maxBytes: number
  /** 0..1, drives warmth: fresh = cool slate, stale = accent. */
  stale: number
  accent: string
  density: Density
}
