import { mixColor } from '@renderer/lib/colors'
import type { ReactNode } from 'react'
import type { PingBadgeProps } from './PingBadge.types'

const GOOD = '#34d399'

/** Icon tile wrapped in a subtle Tailwind-style ping ring. */
export function PingBadge({ icon, tone, accent, size = 54, iconSize = 26 }: PingBadgeProps): ReactNode {
  const color = tone === 'good' ? GOOD : accent
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: mixColor(color, 'rgba(0,0,0,0)', 0.32),
          animation: 'ping-soft 2.2s cubic-bezier(0, 0, 0.2, 1) infinite',
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: mixColor(color, 'rgba(0,0,0,0)', 0.14),
          color,
        }}
      >
        {icon({ size: iconSize })}
      </span>
    </div>
  )
}
