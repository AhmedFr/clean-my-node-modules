import { type ReactNode, useState } from 'react'

interface CleanStaleCtaProps {
  accent: string
  sub?: string
  children: ReactNode
  onClick: () => void
}

/** Accent call-to-action button (CTA2 in the design). */
export function CleanStaleCta({ accent, sub, children, onClick }: CleanStaleCtaProps): ReactNode {
  const [h, setH] = useState(false)
  return (
    <button
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onClick={onClick}
      style={{
        width: 'calc(100% - 16px)',
        margin: '4px 8px 6px',
        border: 'none',
        cursor: 'pointer',
        padding: '9px 12px',
        borderRadius: 9,
        background: accent,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        alignItems: 'flex-start',
        filter: h ? 'brightness(1.08)' : 'none',
        transition: 'filter .1s',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700 }}>{children}</span>
      {sub && <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>{sub}</span>}
    </button>
  )
}
