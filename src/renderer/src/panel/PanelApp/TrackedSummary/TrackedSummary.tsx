import { PixelMeter } from '@renderer/components/PixelMeter'
import { UIIcon } from '@renderer/components/UIIcon'
import { statusColor } from '@renderer/lib/colors'
import { formatSizeStr, GB } from '@renderer/lib/format'
import type { ReactNode } from 'react'
import type { TrackedSummaryProps } from './TrackedSummary.types'

/** Panel hero: every tracked byte counted once, against the combined limit.
 *  "Tracked", not "reclaimable" — this is what these areas occupy, not a promise
 *  about what deleting would free (see the spec's D3). */
export function TrackedSummary({
  heroBytes,
  combinedLimitGB,
  trackMaxGB,
  areaCount,
  accent,
}: TrackedSummaryProps): ReactNode {
  const limitBytes = combinedLimitGB * GB
  const over = heroBytes > limitBytes
  const status = statusColor(limitBytes > 0 ? heroBytes / limitBytes : 0, accent)

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
        Tracked on disk
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 5 }}>
        <span
          title="Every tracked byte counted once. The pnpm store is shared by your projects, so it is included here a single time even though it also appears in the Caches row."
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
          {formatSizeStr(heroBytes)}
        </span>
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
            {combinedLimitGB} GB limit
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              fontSize: 12.5,
              fontWeight: 650,
              color: over ? status : 'var(--good)',
            }}
          >
            <span style={{ display: 'flex' }}>{over ? UIIcon.alert({ size: 12 }) : UIIcon.check({ size: 13 })}</span>
            {over ? `${formatSizeStr(heroBytes - limitBytes)} over` : `${formatSizeStr(limitBytes - heroBytes)} free`}
          </span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
        across {areaCount} {areaCount === 1 ? 'area' : 'areas'}
      </div>
      <PixelMeter
        usedGB={heroBytes / GB}
        thresholdGB={combinedLimitGB}
        trackMaxGB={trackMaxGB}
        accent={accent}
        cells={32}
      />
    </div>
  )
}
