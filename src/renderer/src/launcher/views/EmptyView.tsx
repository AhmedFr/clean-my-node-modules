import { Kbd } from '@renderer/components/Kbd'
import { UIIcon } from '@renderer/components/UIIcon'
import { formatSizeStr } from '@renderer/lib/format'
import type { ReactNode } from 'react'

interface EmptyViewProps {
  reclaimedTotal: number
  nextScanLabel: string
}

/** All-clean state when no node_modules folders remain. */
export function EmptyView({ reclaimedTotal, nextScanLabel }: EmptyViewProps): ReactNode {
  return (
    <div
      style={{
        padding: '52px 30px 58px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(52,211,153,0.12)',
          color: 'var(--good)',
          animation: 'ccpop .5s cubic-bezier(.2,1.4,.4,1)',
        }}
      >
        {UIIcon.checkCircle({ size: 38, stroke: 2 })}
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.96)' }}>All clean</div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginTop: 6,
            maxWidth: 320,
            lineHeight: 1.5,
          }}
        >
          No stale <code style={{ fontFamily: 'var(--mono-font)', color: 'var(--text-3)' }}>node_modules</code> over
          your limit.{' '}
          {reclaimedTotal > 0 ? (
            <>
              You reclaimed{' '}
              <span style={{ color: 'var(--good)', fontWeight: 600 }}>{formatSizeStr(reclaimedTotal)}</span> this
              session.
            </>
          ) : (
            'Your disk is in great shape.'
          )}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginTop: 4,
          color: 'var(--text-dim)',
          fontSize: 12,
        }}
      >
        {UIIcon.refresh({ size: 13 })} Next scan in {nextScanLabel} · <Kbd wide>⌘R</Kbd> to rescan now
      </div>
    </div>
  )
}
