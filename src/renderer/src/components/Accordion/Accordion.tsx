import type { ReactNode } from 'react'
import { ACCORDION_OPEN_CARD } from './Accordion.constants'
import type { AccordionProps } from './Accordion.types'

/** A header row with a body that shows only when `open`. With `card`, the open block becomes
 *  one solid rounded surface (Packages); without it, a plain static wrapper (Docker), so
 *  nested rows keep the outer list's positioned ancestor for the sliding highlight. */
export function Accordion({ open, header, children, card = false }: AccordionProps): ReactNode {
  return (
    <div style={open && card ? ACCORDION_OPEN_CARD : undefined}>
      {header}
      {open ? children : null}
    </div>
  )
}
