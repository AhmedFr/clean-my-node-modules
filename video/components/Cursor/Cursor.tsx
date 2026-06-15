import type React from 'react'
import { ACCENT } from '../../theme.constants'
import type { CursorProps } from './Cursor.types'

/** macOS-style arrow pointer with an accent click-ripple. */
export function Cursor({ x, y, pulse = 0, press = 0, size = 46 }: CursorProps): React.ReactNode {
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-4%, -2%)', zIndex: 50 }}>
      {pulse > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 2,
            top: 2,
            width: 46,
            height: 46,
            marginLeft: -23,
            marginTop: -23,
            borderRadius: '50%',
            border: `3px solid ${ACCENT}`,
            transform: `scale(${0.3 + pulse * 1.1})`,
            opacity: (1 - pulse) * 0.8,
          }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.45))', transform: `scale(${1 - press * 0.16})` }}
      >
        <path
          d="M4 2.6 L4 18.4 L8.6 14.1 L11.4 20.4 L13.9 19.3 L11.1 13.2 L16.8 13.2 Z"
          fill="#fff"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={1}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
