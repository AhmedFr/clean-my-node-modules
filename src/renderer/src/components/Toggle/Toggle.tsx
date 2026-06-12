import type { ReactNode } from 'react'
import type { ToggleProps } from './Toggle.types'

export function Toggle({ on, accent, onToggle }: ToggleProps): ReactNode {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        background: on ? accent : 'rgba(255,255,255,0.14)',
        transition: 'background .2s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 20 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left .2s cubic-bezier(.2,.8,.2,1)',
          boxShadow: '0 1px 3px rgba(0,0,0,.4)',
        }}
      />
    </button>
  )
}
