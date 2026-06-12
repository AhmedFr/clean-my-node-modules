import { useState, type ReactNode } from 'react'
import type { RowActionProps } from './Row.types'

export function RowAction({ icon, label, danger, onClick }: RowActionProps): ReactNode {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
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
        cursor: 'pointer',
        background: h ? (danger ? 'rgba(255,99,99,0.18)' : 'rgba(255,255,255,0.12)') : 'rgba(255,255,255,0.05)',
        color: danger ? (h ? '#ff8585' : 'rgba(255,99,99,0.85)') : 'rgba(255,255,255,0.75)',
        transition: 'background .12s, color .12s, transform .12s',
        transform: h ? 'scale(1.06)' : 'scale(1)',
      }}
    >
      {icon({ size: 15 })}
    </button>
  )
}
