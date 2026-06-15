import { mixColor } from '@renderer/lib/colors'
import { type ReactNode, useState } from 'react'
import type { MItemProps } from './MItem.types'

/** Menu-style row (icon, label, shortcut) inside the dropdown panel. */
export function MItem({ icon, label, shortcut, danger, onClick }: MItemProps): ReactNode {
  const [h, setH] = useState(false)
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '6px 10px',
        margin: '0 6px',
        borderRadius: 6,
        cursor: 'default',
        background: h ? (danger ? mixColor('#000', '#ff6363', 0.86) : 'var(--hairline)') : 'transparent',
        color: h ? '#fff' : 'rgba(255,255,255,0.86)',
        transition: 'background .08s',
      }}
    >
      <span style={{ display: 'flex', width: 16, color: h ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)' }}>
        {icon?.({ size: 15 })}
      </span>
      <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
      {shortcut && (
        <span
          style={{
            fontSize: 12,
            color: h ? 'var(--text-2)' : 'var(--text-dim)',
            letterSpacing: '.06em',
          }}
        >
          {shortcut}
        </span>
      )}
    </div>
  )
}
