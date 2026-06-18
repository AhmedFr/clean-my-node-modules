import { AppIcon } from '@renderer/components/AppIcon'
import { PingBadge } from '@renderer/components/PingBadge'
import { UIIcon } from '@renderer/components/UIIcon'
import { formatSizeStr } from '@renderer/lib/format'
import type { ReactNode } from 'react'

interface PanelEmptyProps {
  onboarded: boolean
  reclaimed: number
  accent: string
  onOpenSetup: () => void
}

/** Panel body when there are no projects: first-run setup nudge, or all-clean. */
export function PanelEmpty({ onboarded, reclaimed, accent, onOpenSetup }: PanelEmptyProps): ReactNode {
  if (!onboarded) {
    return (
      <div style={{ padding: '24px 20px 26px', textAlign: 'center' }}>
        <AppIcon accent={accent} size={40} />
        <div style={{ fontSize: 14.5, fontWeight: 650, color: '#fff', marginTop: 10 }}>Finish setup</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
          Set your limit &amp; run the first scan in the full window.
        </div>
        <button
          type="button"
          onClick={onOpenSetup}
          style={{
            marginTop: 13,
            background: accent,
            color: '#fff',
            border: 'none',
            borderRadius: 9,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 650,
            cursor: 'pointer',
          }}
        >
          Open setup →
        </button>
      </div>
    )
  }
  return (
    <div style={{ padding: '24px 20px 28px', textAlign: 'center' }}>
      <PingBadge icon={UIIcon.checkCircle} tone="good" accent={accent} size={46} iconSize={24} />
      <div style={{ fontSize: 14.5, fontWeight: 650, color: '#fff', marginTop: 10 }}>All clean</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
        Reclaimed {formatSizeStr(reclaimed)} this session.
      </div>
    </div>
  )
}
