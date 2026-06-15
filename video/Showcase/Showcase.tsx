import type React from 'react'
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { BrandLockup } from '../components/BrandLockup'
import { Caption } from '../components/Caption'
import { Cursor } from '../components/Cursor'
import { LauncherWindow } from '../components/LauncherWindow'
import { ReclaimBadge } from '../components/ReclaimBadge'
import { PROJECTS } from '../mockData'
import { ACCENT, BG, mixColor, SAFE } from '../theme.constants'
import { CAP1, CAP2, CAP3, LAUNCHER_LEFT, LAUNCHER_TOP, WINDOW_SPRING_START } from './Showcase.constants'
import { computeState } from './timeline'

const MAX_SIZE = Math.max(...PROJECTS.map((p) => p.sizeGB))

export function Showcase(): React.ReactNode {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = computeState(frame)

  const winSpring = spring({ frame: frame - WINDOW_SPRING_START, fps, config: { damping: 18, mass: 0.85 } })
  const winY = interpolate(winSpring, [0, 1], [70, 0])
  const winScale = interpolate(winSpring, [0, 1], [0.92, 1])
  const winOpacity = interpolate(frame, [WINDOW_SPRING_START, WINDOW_SPRING_START + 10], [0, 1], {
    extrapolateRight: 'clamp',
  })

  const glow = mixColor(ACCENT, SAFE, s.cleanT)

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, #15181d 0%, ${BG} 58%, #08090b 100%)` }}>
      {/* Ambient status glow (red → green as space frees) */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 330,
          width: 800,
          height: 460,
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${glow}55, rgba(0,0,0,0) 70%)`,
          filter: 'blur(34px)',
          opacity: 0.55 * s.sceneOpacity,
        }}
      />

      {/* App scene */}
      <AbsoluteFill style={{ opacity: s.sceneOpacity }}>
        <div
          style={{
            position: 'absolute',
            left: LAUNCHER_LEFT,
            top: LAUNCHER_TOP,
            transformOrigin: 'center top',
            transform: `translateY(${winY}px) scale(${winScale})`,
            opacity: winOpacity,
          }}
        >
          <LauncherWindow
            usedGB={s.usedGB}
            limitGB={s.limitGB}
            trackMaxGB={s.trackMaxGB}
            rows={s.rows}
            maxSizeGB={MAX_SIZE}
            folderCount={61}
          />
        </div>

        <div style={{ opacity: s.cursor.opacity * winOpacity }}>
          <Cursor x={s.cursor.x} y={s.cursor.y} pulse={s.cursor.pulse} press={s.cursor.press} />
        </div>

        <div
          style={{ position: 'absolute', left: 0, right: 0, bottom: 150, display: 'flex', justifyContent: 'center' }}
        >
          <ReclaimBadge gb={s.reclaimGB} appear={s.badgeAppear} />
        </div>

        <div style={{ position: 'absolute', left: 60, right: 60, top: 78 }}>
          <Sequence from={CAP1[0]} durationInFrames={CAP1[1]}>
            <Caption text="Your disk is full of node_modules" len={CAP1[1]} accentWord="node_modules" />
          </Sequence>
          <Sequence from={CAP2[0]} durationInFrames={CAP2[1]}>
            <Caption text="One click — straight to Trash" len={CAP2[1]} accentWord="Trash" />
          </Sequence>
          <Sequence from={CAP3[0]} durationInFrames={CAP3[1]}>
            <Caption text="Reclaim gigabytes in seconds" len={CAP3[1]} accentWord="seconds" />
          </Sequence>
        </div>
      </AbsoluteFill>

      {/* Brand end card */}
      {s.brandAppear > 0 && (
        <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BrandLockup appear={s.brandAppear} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  )
}
