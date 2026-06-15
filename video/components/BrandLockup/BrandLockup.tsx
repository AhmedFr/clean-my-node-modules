import type React from 'react'
import { UI_FONT } from '../../theme.constants'
import { AppTile } from '../AppTile'
import type { BrandLockupProps } from './BrandLockup.types'

/** End card: big cube + wordmark + tagline. */
export function BrandLockup({ appear }: BrandLockupProps): React.ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 30,
        fontFamily: UI_FONT,
        transform: `scale(${0.86 + appear * 0.14})`,
        opacity: appear,
      }}
    >
      <AppTile size={148} glow={appear} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
          Clean my{' '}
          <span style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontWeight: 700 }}>node_modules</span>
        </div>
        <div style={{ marginTop: 16, fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>
          The menu-bar app that reclaims your disk
        </div>
      </div>
    </div>
  )
}
