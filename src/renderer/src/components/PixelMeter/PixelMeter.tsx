import type { ReactNode } from 'react'
import { mixColor, statusColor } from '@renderer/lib/colors'
import type { PixelMeterProps } from './PixelMeter.types'

/** Pixel-cell usage meter with a hatched limit marker (menu bar panel). */
export function PixelMeter({
  usedGB,
  thresholdGB,
  trackMaxGB,
  accent,
  cells = 32,
}: PixelMeterProps): ReactNode {
  const limitPos = Math.min(0.97, thresholdGB / trackMaxGB)
  const limitCellIdx = Math.min(cells - 1, Math.max(0, Math.floor(limitPos * cells)))

  return (
    <div style={{ position: 'relative', paddingTop: 4 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: cells }).map((_, i) => {
          const p = ((i + 0.5) / cells) * trackMaxGB
          const filled = p <= usedGB
          const over = p > thresholdGB
          if (i === limitCellIdx) {
            return (
              <div
                key={i}
                title={`${thresholdGB} GB limit`}
                style={{
                  flex: 1,
                  height: 17,
                  borderRadius: 2.5,
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
                height: 17,
                borderRadius: 2.5,
                backgroundColor: col,
                boxShadow: filled && over ? `0 0 7px ${mixColor(col, 'rgba(0,0,0,0)', 0.35)}` : 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
