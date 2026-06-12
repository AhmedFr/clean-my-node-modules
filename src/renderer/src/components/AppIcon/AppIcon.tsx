import type { ReactNode } from 'react'
import { mixColor } from '@renderer/lib/colors'
import { Glyph } from '@renderer/components/Glyph'
import type { AppIconProps } from './AppIcon.types'

/** Mini gradient app icon used in the launcher header and footer. */
export function AppIcon({ size = 26, accent }: AppIconProps): ReactNode {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        background: `linear-gradient(155deg, ${mixColor(accent, '#fff', 0.12)}, ${mixColor(accent, '#000', 0.32)})`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 8px ${mixColor(accent, '#000', 0.25)}`,
      }}
    >
      <Glyph size={size * 0.56} color="#fff" strokeWidth={1.9} />
    </div>
  )
}
