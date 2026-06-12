import type { ReactNode } from 'react'

interface SortTabProps {
  label: string
  active: boolean
  onClick: () => void
}

export function SortTab({ label, active, onClick }: SortTabProps): ReactNode {
  return (
    <button
      onClick={onClick}
      style={{
        border: 'none',
        cursor: 'pointer',
        padding: '3px 8px',
        borderRadius: 6,
        fontSize: 11.5,
        fontWeight: 600,
        fontFamily: 'var(--ui-font)',
        color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.4)',
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        transition: 'color .12s, background .12s',
      }}
    >
      {label}
    </button>
  )
}
