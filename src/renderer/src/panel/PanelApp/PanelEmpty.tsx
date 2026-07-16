import { AppIcon } from '@renderer/components/AppIcon'
import type { ReactNode } from 'react'

interface PanelEmptyProps {
  accent: string
  onOpenSetup: () => void
}

/** Panel body before the first scan: there is genuinely nothing to visualize yet.
 *  There is deliberately no "all clean" state — zero projects does not mean zero
 *  disk used, and a verdict about one area must never replace the whole dashboard
 *  (see the spec's D6b). */
export function PanelEmpty({ accent, onOpenSetup }: PanelEmptyProps): ReactNode {
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
