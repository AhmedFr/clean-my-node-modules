import type { ReactNode } from 'react'
import { mixColor } from '@renderer/lib/colors'
import type { AppTileProps, GlyphProps } from './Glyph.types'

/** The app's module-cube logo glyph. */
export function Glyph({ size = 20, color = 'currentColor', strokeWidth = 1.7 }: GlyphProps): ReactNode {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block' }}>
      <g fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
        <path d="M12 2.6 20.5 7.3v9.4L12 21.4 3.5 16.7V7.3z" />
        <path d="M3.5 7.3 12 12l8.5-4.7M12 12v9.4" />
      </g>
    </svg>
  )
}

/** Colored rounded-square app tile with the glyph inside. */
export function AppTile({ size = 44, accent = '#ff6363' }: AppTileProps): ReactNode {
  const r = size * 0.26
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flex: '0 0 auto',
        background: `linear-gradient(155deg, ${mixColor(accent, '#fff', 0.16)}, ${mixColor(accent, '#000', 0.34)})`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px ${mixColor(accent, '#000', 0.3)}`,
      }}
    >
      <Glyph size={size * 0.56} color="#fff" strokeWidth={1.8} />
    </div>
  )
}
