import React from 'react'
import { ACCENT, mixColor } from '../../theme.constants'
import type { AppTileProps } from './AppTile.types'

/** The app's module-cube logo glyph (from src/renderer .../Glyph). */
function Cube({ size, color, strokeWidth }: { size: number; color: string; strokeWidth: number }): React.ReactNode {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
      <g fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
        <path d="M12 2.6 20.5 7.3v9.4L12 21.4 3.5 16.7V7.3z" />
        <path d="M3.5 7.3 12 12l8.5-4.7M12 12v9.4" />
      </g>
    </svg>
  )
}

/** Colored rounded-square app tile with the cube inside — the app icon. */
export function AppTile({ size = 44, accent = ACCENT, glow = 0 }: AppTileProps): React.ReactNode {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flex: '0 0 auto',
        background: `linear-gradient(155deg, ${mixColor(accent, '#fff', 0.16)}, ${mixColor(accent, '#000', 0.34)})`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px ${mixColor(accent, '#000', 0.3)}${
          glow > 0 ? `, 0 0 ${40 * glow}px ${mixColor(accent, 'rgba(0,0,0,0)', 1 - glow)}` : ''
        }`,
      }}
    >
      <Cube size={size * 0.56} color="#fff" strokeWidth={1.8} />
    </div>
  )
}
