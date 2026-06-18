import type { IconRenderer } from '@renderer/components/UIIcon'

export interface PingBadgeProps {
  icon: IconRenderer
  /** 'good' = green (all clean), 'accent' = brand color (scanning). */
  tone: 'good' | 'accent'
  /** Accent color, used when tone is 'accent'. */
  accent: string
  /** Outer diameter in px. */
  size?: number
  /** Icon glyph size in px. */
  iconSize?: number
}
