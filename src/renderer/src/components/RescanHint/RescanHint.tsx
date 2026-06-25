import { UIIcon } from '@renderer/components/UIIcon'
import { mixColor } from '@renderer/lib/colors'
import type { ReactNode } from 'react'
import type { RescanHintProps } from './RescanHint.types'

/** Shown when any project predates the real/linked split — one rescan fixes it. */
export function RescanHint({ accent, onRescan }: RescanHintProps): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        margin: '6px 12px',
        padding: '8px 11px',
        borderRadius: 9,
        background: mixColor('rgba(0,0,0,0)', accent, 0.1),
        border: '1px solid var(--surface-3)',
      }}
    >
      <span style={{ color: accent, display: 'flex', flex: 'none' }}>{UIIcon.refresh({ size: 14 })}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Real vs linked sizes need a rescan</div>
        <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
          These projects were scanned before the pnpm split was measured.
        </div>
      </div>
      <button
        onClick={onRescan}
        style={{
          border: '1px solid var(--surface-4)',
          cursor: 'pointer',
          padding: '4px 10px',
          borderRadius: 7,
          background: 'var(--surface-1)',
          color: 'rgba(255,255,255,0.85)',
          fontSize: 11.5,
          fontWeight: 600,
          flex: 'none',
        }}
      >
        Rescan
      </button>
    </div>
  )
}
