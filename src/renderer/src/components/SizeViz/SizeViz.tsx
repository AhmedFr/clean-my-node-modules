import { mixColor } from '@renderer/lib/colors'
import { formatSize, formatSizeStr } from '@renderer/lib/format'
import type { ReactNode } from 'react'
import type { SizeVizProps } from './SizeViz.types'

export function SizeViz({ style, bytes, apparentBytes, maxBytes, stale, accent, density }: SizeVizProps): ReactNode {
  const s = formatSize(bytes)
  const ratio = Math.max(0.04, Math.min(1, bytes / maxBytes))
  const col = mixColor('#8a8f98', accent, stale)
  const linked = apparentBytes && apparentBytes > bytes ? apparentBytes - bytes : 0
  const tip = linked
    ? `${formatSizeStr(bytes)} freeable now · ${formatSizeStr(linked)} linked to the pnpm store (shared across projects — reclaim it with pnpm store prune)`
    : undefined

  const num = (
    <span
      style={{
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 650,
        color: 'var(--text)',
        fontSize: density === 'compact' ? 13 : 14,
      }}
    >
      {s.value}
      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2, fontWeight: 600 }}>{s.unit}</span>
    </span>
  )

  const linkedLine = linked ? (
    <span
      style={{
        fontSize: 10,
        fontWeight: 550,
        color: 'var(--text-faint)',
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {formatSizeStr(linked)} linked
    </span>
  ) : null

  if (style === 'plain') {
    return (
      <div
        title={tip}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 1,
          minWidth: 70,
        }}
      >
        {num}
        {linkedLine}
      </div>
    )
  }

  if (style === 'bar') {
    return (
      <div
        title={tip}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, minWidth: 96 }}
      >
        {num}
        <div style={{ width: 88, height: 5, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${ratio * 100}%`,
              height: '100%',
              borderRadius: 3,
              background: col,
              transition: 'width .5s cubic-bezier(.2,.8,.2,1)',
            }}
          />
        </div>
        {linkedLine}
      </div>
    )
  }

  const R = 13
  const C = 2 * Math.PI * R
  return (
    <div
      title={tip}
      style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 92, justifyContent: 'flex-end' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
        {num}
        {linkedLine}
      </div>
      <svg width="32" height="32" viewBox="0 0 32 32" style={{ flex: '0 0 auto' }}>
        <circle cx="16" cy="16" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="3.5" />
        <circle
          cx="16"
          cy="16"
          r={R}
          fill="none"
          stroke={col}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - ratio)}
          transform="rotate(-90 16 16)"
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1), stroke .4s' }}
        />
      </svg>
    </div>
  )
}
