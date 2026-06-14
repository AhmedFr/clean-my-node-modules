import React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { ACCENT, UI_FONT } from '../../theme.constants'
import type { CaptionProps } from './Caption.types'

/** Bold social caption that fades + lifts in, holds, then fades out. */
/** Wrap in a <Sequence> so useCurrentFrame() is relative to its window. */
export function Caption({ text, len, accentWord }: CaptionProps): React.ReactNode {
  const frame = useCurrentFrame()
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' })
  const fadeOut = interpolate(frame, [len - 10, len], [1, 0], { extrapolateLeft: 'clamp' })
  const y = interpolate(frame, [0, 14], [22, 0], { extrapolateRight: 'clamp' })
  const opacity = Math.min(fadeIn, fadeOut)

  const parts = accentWord ? text.split(accentWord) : [text]

  return (
    <div
      style={{
        width: '100%',
        textAlign: 'center',
        opacity,
        transform: `translateY(${y}px)`,
        fontFamily: UI_FONT,
      }}
    >
      <div
        style={{
          fontSize: 52,
          lineHeight: 1.08,
          fontWeight: 750,
          letterSpacing: '-0.02em',
          color: '#fff',
          textShadow: '0 2px 30px rgba(0,0,0,0.6)',
        }}
      >
        {accentWord ? (
          <>
            {parts[0]}
            <span style={{ color: ACCENT }}>{accentWord}</span>
            {parts[1]}
          </>
        ) : (
          text
        )}
      </div>
    </div>
  )
}
