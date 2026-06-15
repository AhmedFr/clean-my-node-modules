import type React from 'react'
import { AbsoluteFill } from 'remotion'
import { ACCENT, BG, UI_FONT } from '../theme.constants'
import type { ScreenFrameProps } from './ScreenFrame.types'

/** Shared landscape backdrop for static Product Hunt gallery shots: */
/** dark gradient + ambient glow, a headline block on top, centered UI below. */
export function ScreenFrame({
  eyebrow,
  headline,
  accentWord,
  sub,
  glow = ACCENT,
  scale = 1.2,
  overlay,
  children,
}: ScreenFrameProps): React.ReactNode {
  const parts = accentWord ? headline.split(accentWord) : [headline]
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 24%, #15181d 0%, ${BG} 60%, #08090b 100%)`,
        fontFamily: UI_FONT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 320,
          width: 1000,
          height: 560,
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${glow}3a, rgba(0,0,0,0) 70%)`,
          filter: 'blur(40px)',
        }}
      />
      <div style={{ padding: '76px 90px 0', textAlign: 'center', position: 'relative' }}>
        {eyebrow && (
          <div
            style={{
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: ACCENT,
              marginBottom: 16,
            }}
          >
            {eyebrow}
          </div>
        )}
        <div style={{ fontSize: 62, lineHeight: 1.06, fontWeight: 800, letterSpacing: '-0.025em', color: '#fff' }}>
          {accentWord ? (
            <>
              {parts[0]}
              <span style={{ color: ACCENT }}>{accentWord}</span>
              {parts[1]}
            </>
          ) : (
            headline
          )}
        </div>
        {sub && (
          <div
            style={{
              marginTop: 20,
              fontSize: 27,
              fontWeight: 450,
              color: 'rgba(255,255,255,0.5)',
              maxWidth: 1100,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {sub}
          </div>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ transform: `scale(${scale})` }}>{children}</div>
        {overlay}
      </div>
    </AbsoluteFill>
  )
}
