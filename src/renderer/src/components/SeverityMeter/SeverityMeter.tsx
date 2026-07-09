import type { ReactNode } from 'react'
import { SEVERITY_COLORS, severityMeterTooltip, severitySegments } from './SeverityMeter.constants'
import type { SeverityMeterProps } from './SeverityMeter.types'

/** Compact packages headline for the ~132px header slot: a stacked severity bar
 *  (critical → low) with a vulnerable count and a trailing outdated count. The
 *  full breakdown lives in the tooltip. */
export function SeverityMeter({ counts, total, computing = false }: SeverityMeterProps): ReactNode {
  const segments = severitySegments(counts)
  const tip = severityMeterTooltip(counts, total)
  const clear = counts.vulnerable === 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }} title={tip}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 650,
          color: clear ? 'var(--text-2)' : SEVERITY_COLORS.high,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {clear ? 'all clear' : `${counts.vulnerable} vuln`}
      </div>
      <div style={{ position: 'relative', display: 'flex', gap: 1.5, width: 132, height: 12 }}>
        {clear ? (
          <div style={{ flex: 1, borderRadius: 2, backgroundColor: 'var(--surface-2)' }} />
        ) : (
          segments.map((s) => (
            <div
              key={s.key}
              title={`${s.count} ${s.key}`}
              style={{ flex: s.frac, height: 12, borderRadius: 2, backgroundColor: s.color }}
            />
          ))
        )}
        {computing && (
          <div
            className="cc-ghost"
            aria-hidden="true"
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 2 }}
          />
        )}
      </div>
      {counts.outdated > 0 && (
        <div style={{ fontSize: 11.5, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{counts.outdated} old</div>
      )}
    </div>
  )
}
