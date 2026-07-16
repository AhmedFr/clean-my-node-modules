import type { ReactNode } from 'react'

export interface AccordionProps {
  open: boolean
  /** The always-visible clickable header (the caller owns the click handler and chevron). */
  header: ReactNode
  /** The body, rendered only when open. */
  children?: ReactNode
  /** When true, the open block becomes one solid rounded card (header + body share a
   *  surface). Packages uses this; Docker omits it so its rows stay flat for the sliding
   *  highlight. */
  card?: boolean
}
