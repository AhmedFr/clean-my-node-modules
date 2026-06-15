import type { ReactNode } from 'react'
import { statusColor } from '@renderer/lib/colors'
import { GB, formatSizeStr } from '@renderer/lib/format'
import type { GaugeProps } from './Gauge.types'

const CELLS = 16

/** Header threshold gauge — pixel-cell bar matching the menu meter. */
export function Gauge({ used, threshold, accent }: GaugeProps): ReactNode {
  const usedGB = used / GB
  const thresholdGB = threshold / GB
  const trackMaxGB = Math.max(thresholdGB * 1.5, usedGB * 1.05)
  const limitPos = Math.min(0.94, thresholdGB / trackMaxGB)
  const limitCellIdx = Math.min(CELLS - 1, Math.max(0, Math.floor(limitPos * CELLS)))

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 650,
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {formatSizeStr(used)}
      </div>
      <div style={{ display: 'flex', gap: 1.5, width: 132 }}>
        {Array.from({ length: CELLS }).map((_, i) => {
          const p = ((i + 0.5) / CELLS) * trackMaxGB
          const filled = p <= usedGB
          const over = p > thresholdGB
          if (i === limitCellIdx) {
            return (
              <div
                key={i}
                title={`${thresholdGB} GB limit`}
                style={{
                  flex: 1,
                  height: 12,
                  borderRadius: 2,
                  backgroundColor: 'var(--surface-1)',
                  backgroundImage:
                    'repeating-linear-gradient(45deg, var(--text-3) 0 1.5px, rgba(255,255,255,0) 1.5px 4px)',
                  boxShadow: 'inset 0 0 0 1px var(--text-muted)',
                }}
              />
            )
          }
          const col = filled ? statusColor(p / thresholdGB, accent) : 'var(--surface-2)'
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 12,
                borderRadius: 2,
                backgroundColor: col,
                boxShadow: filled && over ? `0 0 6px ${col}` : 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
