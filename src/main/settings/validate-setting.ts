import { isAbsolute } from 'node:path'
import type { Density, ScanInterval, Settings, SizeStyle } from '@shared/settings.types'

const SIZE_STYLES: SizeStyle[] = ['plain', 'bar', 'ring']
const DENSITIES: Density[] = ['compact', 'roomy']
const SCAN_INTERVALS: ScanInterval[] = ['6h', 'daily', 'weekly', 'manual']
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/** Threshold clamp — keep it a sane, positive number of gigabytes. */
const MIN_THRESHOLD_GB = 0.1
const MAX_THRESHOLD_GB = 1000

const oneOf = <T extends string>(allowed: T[], value: unknown): value is T =>
  typeof value === 'string' && (allowed as string[]).includes(value)

/**
 * Validates an untrusted (key, value) coming over IPC from the renderer and
 * returns the coerced pair, or null to reject. The renderer can't write
 * arbitrary/garbage values into the persisted settings file.
 */
export function coerceSetting(
  key: unknown,
  value: unknown,
): { key: keyof Settings; value: Settings[keyof Settings] } | null {
  switch (key) {
    case 'accent':
      return typeof value === 'string' && HEX_COLOR.test(value) ? { key, value } : null
    case 'sizeStyle':
      return oneOf(SIZE_STYLES, value) ? { key, value } : null
    case 'density':
      return oneOf(DENSITIES, value) ? { key, value } : null
    case 'scanInterval':
      return oneOf(SCAN_INTERVALS, value) ? { key, value } : null
    case 'notify':
      return typeof value === 'boolean' ? { key, value } : null
    case 'analytics':
      return typeof value === 'boolean' ? { key, value } : null
    case 'onboarded':
      return typeof value === 'boolean' ? { key, value } : null
    case 'checkUpdates':
    case 'docker':
      return typeof value === 'boolean' ? { key, value } : null
    case 'thresholdGB':
    case 'cacheThresholdGB':
    case 'dockerThresholdGB':
      return typeof value === 'number' && Number.isFinite(value)
        ? { key, value: Math.min(MAX_THRESHOLD_GB, Math.max(MIN_THRESHOLD_GB, value)) }
        : null
    case 'pnpmStorePath':
    case 'pnpmBinaryPath':
    case 'dockerBinaryPath':
      return typeof value === 'string' ? { key, value: value.trim() } : null
    case 'scanRoots':
      return Array.isArray(value) && value.every((v) => typeof v === 'string' && isAbsolute(v))
        ? { key, value: value as string[] }
        : null
    default:
      return null
  }
}
