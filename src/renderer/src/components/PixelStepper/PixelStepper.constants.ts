/** Alert-threshold range, in whole GB, for the pixel stepper. */
export const STEPPER_MIN_GB = 1
export const STEPPER_MAX_GB = 10
export const STEPPER_STEP_GB = 1
/** One clickable block per GB step (10 blocks for 1–10 GB). */
export const STEPPER_CELLS = (STEPPER_MAX_GB - STEPPER_MIN_GB) / STEPPER_STEP_GB + 1

/** Clamp any value into the stepper's GB range. */
export function clampGb(gb: number): number {
  if (!Number.isFinite(gb)) return STEPPER_MIN_GB
  return Math.min(STEPPER_MAX_GB, Math.max(STEPPER_MIN_GB, gb))
}

/** 0-based block index for a (possibly fractional) GB value. */
export function gbToIndex(gb: number): number {
  return Math.round((clampGb(gb) - STEPPER_MIN_GB) / STEPPER_STEP_GB)
}

/** Whole-GB value represented by block index `i`. */
export function indexToGb(i: number): number {
  const idx = Math.min(STEPPER_CELLS - 1, Math.max(0, Math.round(i)))
  return STEPPER_MIN_GB + idx * STEPPER_STEP_GB
}

/** Step a GB value by ±1 block, clamped. */
export function nudgeGb(gb: number, dir: -1 | 1): number {
  return indexToGb(gbToIndex(gb) + dir)
}
