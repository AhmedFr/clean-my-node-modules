import type { ReactNode } from 'react'

export interface ScreenFrameProps {
  eyebrow?: string
  headline: string
  /** Optional substring of the headline rendered in the accent color. */
  accentWord?: string
  sub?: string
  /** Ambient glow color (red for "problem", green for "result"). */
  glow?: string
  /** Scale applied to the centered UI. */
  scale?: number
  /** Optional absolutely-positioned overlay (badge, callout chip). */
  overlay?: ReactNode
  children: ReactNode
}
