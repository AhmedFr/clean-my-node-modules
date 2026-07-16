import type { LauncherTab } from '@renderer/launcher/LauncherApp/LauncherApp.types'
import type { SeverityCounts } from '@renderer/lib/severity'

export interface TabHeadlineProps {
  tab: LauncherTab
  accent: string
  // projects (node_modules)
  projectsUsed: number
  linkedBytes: number
  projectsCalculating: boolean
  thresholdGB: number
  // caches (pnpm store)
  cachesUsed: number
  cachesAvailable: boolean
  cachesCalculating: boolean
  cacheThresholdGB: number
  // docker
  dockerUsed: number
  dockerAvailable: boolean
  dockerThresholdGB: number
  // packages
  severity: SeverityCounts
  packagesTotal: number
  packagesCheckEnabled: boolean
  packagesComputing: boolean
  packagesDataReady: boolean
}
