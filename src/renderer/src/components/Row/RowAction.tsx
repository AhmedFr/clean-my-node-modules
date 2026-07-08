import { type ReactNode, useState } from 'react'
import type { RowActionProps } from './Row.types'

export function RowAction({ icon, label, danger, disabled, onClick }: RowActionProps): ReactNode {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        if (disabled) return
        onClick()
      }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      title={label}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 7,
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        background: h && !disabled ? (danger ? 'rgba(255,99,99,0.18)' : 'var(--surface-3)') : 'var(--surface-1)',
        color: danger ? (h && !disabled ? '#ff8585' : 'rgba(255,99,99,0.85)') : 'var(--text-3)',
        transition: 'background .12s, color .12s, transform .12s',
        transform: h && !disabled ? 'scale(1.06)' : 'scale(1)',
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? 'none' : undefined,
      }}
    >
      {icon({ size: 15 })}
    </button>
  )
}
