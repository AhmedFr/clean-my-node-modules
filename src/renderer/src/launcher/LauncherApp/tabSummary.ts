import { formatSizeStr, GB } from '@renderer/lib/format'
import type { SeverityCounts } from '@renderer/lib/severity'
import type { LauncherTab } from './LauncherApp.types'

export interface TabSummaryInput {
  tab: LauncherTab
  projectsUsed: number
  cachesUsed: number
  cachesAvailable: boolean
  dockerUsed: number
  dockerAvailable: boolean
  thresholdGB: number
  cacheThresholdGB: number
  dockerThresholdGB: number
  severity: SeverityCounts
  packagesCheckEnabled: boolean
  packagesComputing: boolean
  packagesDataReady: boolean
}

/** "{pct}% of your {n} GB {qualifier}limit" under the cap, or
 *  "{over} over your {n} GB {qualifier}limit" past it. `qualifier` is ''
 *  for node_modules, 'cache ' for caches, 'Docker ' for docker. */
function sizeLimitSummary(usedBytes: number, thresholdGB: number, qualifier: string): string {
  const threshold = thresholdGB * GB
  if (usedBytes > threshold) {
    return `${formatSizeStr(usedBytes - threshold)} over your ${thresholdGB} GB ${qualifier}limit`
  }
  const pct = threshold > 0 ? (usedBytes / threshold) * 100 : 0
  return `${pct.toFixed(0)}% of your ${thresholdGB} GB ${qualifier}limit`
}

/** The footer line for the active tab, or null when there is nothing to show. */
export function tabSummary(input: TabSummaryInput): string | null {
  switch (input.tab) {
    case 'projects':
      return sizeLimitSummary(input.projectsUsed, input.thresholdGB, '')
    case 'caches':
      return input.cachesAvailable ? sizeLimitSummary(input.cachesUsed, input.cacheThresholdGB, 'cache ') : null
    case 'docker':
      return input.dockerAvailable ? sizeLimitSummary(input.dockerUsed, input.dockerThresholdGB, 'Docker ') : null
    case 'packages': {
      if (!input.packagesCheckEnabled) return null
      if (input.packagesComputing) return null
      if (!input.packagesDataReady) return null
      const { vulnerable, outdated } = input.severity
      if (vulnerable === 0) return outdated > 0 ? `all clear · ${outdated} outdated` : 'all clear'
      return `${vulnerable} vulnerable · ${outdated} outdated`
    }
    default:
      return null
  }
}
