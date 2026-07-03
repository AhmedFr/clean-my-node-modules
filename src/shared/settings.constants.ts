import type { Settings } from './settings.types'

export const DEFAULT_SETTINGS: Settings = {
  accent: '#ff6363',
  sizeStyle: 'plain',
  density: 'roomy',
  thresholdGB: 5,
  scanInterval: 'daily',
  notify: true,
  onboarded: false,
  checkUpdates: true,
  analytics: true,
}

export const SCAN_INTERVAL_MS: Record<Exclude<Settings['scanInterval'], 'manual'>, number> = {
  '6h': 6 * 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
}
