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
        color: active ? 'var(--text)' : 'var(--text-dim)',
        background: active ? 'var(--surface-2)' : 'transparent',
        transition: 'color .12s, background .12s',
      }}
    >
      {label}
    </button>
  )
}
