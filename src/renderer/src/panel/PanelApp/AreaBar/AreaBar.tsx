import { PixelMeter } from '@renderer/components/PixelMeter'
import { SeverityMeter } from '@renderer/components/SeverityMeter'
import { UIIcon } from '@renderer/components/UIIcon'
import { GB } from '@renderer/lib/format'
import type { ReactNode } from 'react'
import type { AreaBarProps } from './AreaBar.types'

/** One area of the panel dashboard: label, its meter, its value, and a chevron.
 *  Clicking anywhere opens that area's tab in the main window. Read-only: the
 *  panel visualizes, the launcher acts. */
export function AreaBar({ row, accent, onOpen }: AreaBarProps): ReactNode {
  return (
    <button
      type="button"
      onClick={onOpen}
      title={`Open ${row.label} in the main window`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '7px 15px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ flex: '0 0 62px', fontSize: 12, fontWeight: 620, color: 'var(--text)' }}>{row.label}</span>

      <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
        {row.kind === 'size' && (
          <PixelMeter
            usedGB={row.usedBytes / GB}
            thresholdGB={row.thresholdGB}
            trackMaxGB={row.trackMaxGB}
            accent={accent}
            cells={16}
          />
        )}
        {row.kind === 'severity' && <SeverityMeter counts={row.severity} total={row.packagesTotal} />}
        {row.kind === 'placeholder' && <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{row.note}</span>}
      </span>

      {row.kind === 'size' && (
        <span
          style={{
            flex: '0 0 auto',
            fontSize: 12,
            fontWeight: 650,
            color: 'var(--text-2)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {row.value}
        </span>
      )}
      <span style={{ flex: '0 0 auto', display: 'flex', color: 'var(--text-faint)' }}>
        {UIIcon.chevronRight({ size: 13 })}
      </span>
    </button>
  )
}
