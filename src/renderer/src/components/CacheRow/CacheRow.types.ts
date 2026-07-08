import type { IconRenderer } from '@renderer/components/UIIcon'
import type { ReactNode } from 'react'

export interface CacheRowProps {
  /** Glyph shown in the leading icon tile. */
  icon: IconRenderer
  /** Cache name, e.g. "pnpm store". */
  name: string
  /** Secondary line: the store path, a status, or a "coming soon" note. */
  detail: string
  /** Optional small chip rendered next to the name (e.g. a Docker item-kind badge). */
  badge?: ReactNode
  /** Size in bytes; omit when unknown (e.g. disabled placeholders). */
  size?: number
  /** Whether this is the keyboard-selected row. */
  selected?: boolean
  /** Disabled "soon" placeholder: greyed, not selectable, no action. */
  disabled?: boolean
  /** Action in progress (e.g. pruning) — disables the action button. */
  busy?: boolean
  /** Label for the trailing action button (e.g. "Prune"); omit for none. */
  actionLabel?: string
  /** Tooltip for the action button; defaults to the pnpm store prune copy. */
  title?: string
  /** Label shown on the action button while `busy` is true; defaults to "Pruning…". */
  busyLabel?: string
  /** Fired when the action button is pressed. */
  onAction?: () => void
  /** Fired when the row itself is clicked (selects it). */
  onSelect?: () => void
}
