import type { ReactNode } from 'react'
import type { KbdProps } from './Kbd.types'

export function Kbd({ children, wide }: KbdProps): ReactNode {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: wide ? 'auto' : 20,
        height: 20,
        padding: wide ? '0 7px' : '0 4px',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.09)',
        color: 'rgba(255,255,255,0.72)',
        fontSize: 11.5,
        fontWeight: 600,
        lineHeight: 1,
        fontFamily: 'var(--ui-font)',
      }}
    >
      {children}
    </span>
  )
}
