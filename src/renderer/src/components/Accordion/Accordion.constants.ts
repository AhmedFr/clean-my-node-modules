import type { CSSProperties } from 'react'

/** When open with `card`, the header + body share one solid rounded surface (an accordion,
 *  not an appended box). Must match the Packages tab's previous inline wrapper exactly. */
export const ACCORDION_OPEN_CARD: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  background: 'var(--surface-2)',
  borderRadius: 10,
  boxShadow: 'inset 0 0 0 1px var(--hairline)',
  overflow: 'hidden',
}
