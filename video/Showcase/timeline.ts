import { Easing, interpolate } from 'remotion'
import type { RowState } from '../components/LauncherWindow'
import { LIMIT_GB, PROJECTS, TOTAL_USED_GB } from '../mockData'
import {
  BADGE_IN,
  BRAND_IN,
  CLICK_FRAMES,
  CURSOR_EXIT,
  CURSOR_IDLE,
  DEL_LEN,
  DELETE_STARTS,
  GAUGE_FILL,
  SCENE_OUT,
  TRASH_TARGET,
} from './Showcase.constants'

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n))
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const ease = { easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const clampOpts = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

export interface SceneState {
  rows: RowState[]
  usedGB: number
  reclaimGB: number
  trackMaxGB: number
  limitGB: number
  cursor: { x: number; y: number; pulse: number; press: number; opacity: number }
  badgeAppear: number
  brandAppear: number
  sceneOpacity: number
  /** 0→1 cleaned amount, for ambient glow color. */
  cleanT: number
}

export function computeState(frame: number): SceneState {
  const progress = PROJECTS.map((_, i) => {
    if (i >= DELETE_STARTS.length) return 0
    const start = DELETE_STARTS[i]
    return interpolate(frame, [start, start + DEL_LEN], [0, 1], ease)
  })

  const reclaimGB = PROJECTS.reduce((a, p, i) => a + p.sizeGB * progress[i], 0)
  const introFill = interpolate(frame, GAUGE_FILL, [0, 1], clampOpts)
  const usedGB = Math.max(0, TOTAL_USED_GB * introFill - reclaimGB)
  const trackMaxGB = TOTAL_USED_GB * 1.05

  // No row is "selected" until the cursor arrives — intro shows every size.
  const selIdx = frame < 92 ? -1 : progress.findIndex((p) => p < 0.5)
  const rows: RowState[] = PROJECTS.map((p, i) => ({
    project: p,
    deleteProgress: progress[i],
    selected: i === selIdx,
  }))

  // Cursor: idle → trash → exit, with a click ripple + press dip per delete.
  const moveIn = interpolate(frame, [78, 96], [0, 1], ease)
  const moveOut = interpolate(frame, [158, 178], [0, 1], ease)
  const tx = lerp(CURSOR_IDLE[0], TRASH_TARGET[0], moveIn)
  const ty = lerp(CURSOR_IDLE[1], TRASH_TARGET[1], moveIn)
  const x = lerp(tx, CURSOR_EXIT[0], moveOut)
  const y = lerp(ty, CURSOR_EXIT[1], moveOut)

  let pulse = 0
  let press = 0
  for (const cf of CLICK_FRAMES) {
    if (frame >= cf && frame <= cf + 12) pulse = Math.max(pulse, (frame - cf) / 12)
    if (frame >= cf && frame <= cf + 8) press = Math.max(press, Math.sin(((frame - cf) / 8) * Math.PI))
  }
  const cursorOpacity = interpolate(frame, [160, 178], [1, 0], clampOpts)

  const sceneOpacity = interpolate(frame, SCENE_OUT, [1, 0], clampOpts)
  const badgeAppear =
    interpolate(frame, BADGE_IN, [0, 1], { ...clampOpts, easing: Easing.out(Easing.back(1.4)) }) * sceneOpacity
  const brandAppear = interpolate(frame, BRAND_IN, [0, 1], { ...clampOpts, easing: Easing.out(Easing.cubic) })
  const cleanT = clamp01(reclaimGB / 23)

  return {
    rows,
    usedGB,
    reclaimGB,
    trackMaxGB,
    limitGB: LIMIT_GB,
    cursor: { x, y, pulse, press, opacity: cursorOpacity },
    badgeAppear,
    brandAppear,
    sceneOpacity,
    cleanT,
  }
}
