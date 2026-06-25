import { PixelMeter } from '@renderer/components/PixelMeter'
import { UIIcon } from '@renderer/components/UIIcon'
import { statusColor } from '@renderer/lib/colors'
import { formatSizeStr } from '@renderer/lib/format'
import type { ReactNode } from 'react'

interface DiskSummaryProps {
  totalUsed: number
  /** threshold in bytes */
  threshold: number
  thresholdGB: number
  usedGB: number
  trackMaxGB: number
  accent: string
  /** Bytes linked to the pnpm store across projects (shared, counted once). */
  linkedBytes?: number
}

/** Panel header: total node_modules size, the limit + over/free lines, and the meter. */
export function DiskSummary({
  totalUsed,
  threshold,
  thresholdGB,
  usedGB,
  trackMaxGB,
  accent,
  linkedBytes = 0,
}: DiskSummaryProps): ReactNode {
  const over = totalUsed > threshold
  const status = statusColor(totalUsed / threshold, accent)

  return (
    <div style={{ padding: '13px 15px 12px' }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
          color: 'var(--text-dim)',
        }}
      >
        node_modules on disk
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 5 }}>
        <span
          title={
            linkedBytes > 0
              ? `Real disk used (packages counted once). A further ${formatSizeStr(linkedBytes)} is linked to the pnpm store and shared across projects.`
              : undefined
          }
          style={{
            fontSize: 27,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-.01em',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            flex: '0 0 auto',
          }}
        >
          {formatSizeStr(totalUsed)}
        </span>
        {/* Two stacked lines, each no-wrap, so the narrow panel never reflows */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flex: '0 0 auto' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ display: 'flex', color: 'var(--text-dim)' }}>{UIIcon.hdd({ size: 12 })}</span>
            {thresholdGB} GB limit
          </span>
          {over ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap',
                fontSize: 12.5,
                fontWeight: 650,
                color: status,
              }}
            >
              <span style={{ display: 'flex' }}>{UIIcon.alert({ size: 12 })}</span>
              {formatSizeStr(totalUsed - threshold)} over
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap',
                fontSize: 12.5,
                fontWeight: 650,
                color: 'var(--good)',
              }}
            >
              <span style={{ display: 'flex' }}>{UIIcon.check({ size: 13 })}</span>
              {formatSizeStr(threshold - totalUsed)} free
            </span>
          )}
        </div>
      </div>
      {linkedBytes > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
          + {formatSizeStr(linkedBytes)} linked in pnpm store · shared
        </div>
      )}
      <PixelMeter usedGB={usedGB} thresholdGB={thresholdGB} trackMaxGB={trackMaxGB} accent={accent} cells={32} />
    </div>
  )
}
