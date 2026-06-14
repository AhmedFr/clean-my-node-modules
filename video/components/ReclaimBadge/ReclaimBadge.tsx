import React from 'react'
import { SAFE, UI_FONT } from '../../theme.constants'
import type { ReclaimBadgeProps } from './ReclaimBadge.types'

/** Floating "Reclaimed X GB" pill with a live-counting number. */
export function ReclaimBadge({ gb, appear }: ReclaimBadgeProps): React.ReactNode {
  if (appear <= 0) return null
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 26px',
        borderRadius: 18,
        background: 'rgba(18,22,20,0.92)',
        border: `1px solid ${SAFE}55`,
        boxShadow: `0 18px 50px rgba(0,0,0,0.5), 0 0 40px -6px ${SAFE}66`,
        fontFamily: UI_FONT,
        transform: `scale(${0.8 + appear * 0.2})`,
        opacity: appear,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: SAFE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0c1410" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="m20 6-11 11-5-5" />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
          Reclaimed
        </span>
        <span style={{ fontSize: 34, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          {gb.toFixed(1)} GB
        </span>
      </div>
    </div>
  )
}
