import type { ReactNode } from 'react'
import type { SegmentedProps } from './Segmented.types'

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accent,
  small,
}: SegmentedProps<T>): ReactNode {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: small ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.06)',
        borderRadius: small ? 8 : 9,
        padding: small ? 2 : 3,
        gap: 2,
      }}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              border: 'none',
              cursor: 'pointer',
              padding: small ? '4px 9px' : '6px 12px',
              borderRadius: small ? 6 : 7,
              fontSize: small ? 11.5 : 12.5,
              fontWeight: 600,
              fontFamily: 'var(--ui-font)',
              color: on ? '#fff' : 'rgba(255,255,255,0.55)',
              background: on ? accent : 'transparent',
              transition: 'background .15s, color .15s',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
