import { Kbd } from '@renderer/components/Kbd'
import { PingBadge } from '@renderer/components/PingBadge'
import { UIIcon } from '@renderer/components/UIIcon'
import { formatSizeStr } from '@renderer/lib/format'
import type { ReactNode } from 'react'

interface EmptyViewProps {
  reclaimedTotal: number
  /** Human label for the next scheduled scan, or null when automatic scan is off. */
  nextScanLabel: string | null
  accent: string
}

/** All-clean state: no node_modules folders remain. */
export function EmptyView({ reclaimedTotal, nextScanLabel, accent }: EmptyViewProps): ReactNode {
  return (
    <div
      style={{
        padding: '50px 30px 56px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        textAlign: 'center',
      }}
    >
      <PingBadge icon={UIIcon.checkCircle} tone="good" accent={accent} size={72} iconSize={36} />
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)' }}>All clean</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, maxWidth: 320, lineHeight: 1.5 }}>
          {reclaimedTotal > 0 ? (
            <>
              You reclaimed{' '}
              <span style={{ color: 'var(--good)', fontWeight: 600 }}>{formatSizeStr(reclaimedTotal)}</span> this
              session. Nicely done.
            </>
          ) : (
            <>
              No <code style={{ fontFamily: 'var(--mono-font)', color: 'var(--text-3)' }}>node_modules</code> folders
              found. Your disk is in great shape.
            </>
          )}
        </div>
      </div>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4, color: 'var(--text-dim)', fontSize: 12 }}
      >
        {nextScanLabel ? (
          <>
            {UIIcon.refresh({ size: 13 })} Next scan in {nextScanLabel} · <Kbd wide>⌘R</Kbd> to scan now
          </>
        ) : (
          <>
            {UIIcon.refresh({ size: 13 })} Automatic scan is off · <Kbd wide>⌘R</Kbd> to scan now
          </>
        )}
      </div>
    </div>
  )
}
