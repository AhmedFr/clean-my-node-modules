/** Directory names never descended into while scanning. */
export const SKIPPED_DIR_NAMES = new Set([
  'Library',
  'Applications',
  'Pictures',
  'Music',
  'Movies',
  'Public',
  'vendor',
  'bower_components',
])

/** Maximum directory depth below each scan root. */
export const MAX_SCAN_DEPTH = 8

/** How many `du` size computations run concurrently. */
export const SIZE_CONCURRENCY = 4

/** Throttle interval for scan progress events (ms). */
export const PROGRESS_THROTTLE_MS = 80
