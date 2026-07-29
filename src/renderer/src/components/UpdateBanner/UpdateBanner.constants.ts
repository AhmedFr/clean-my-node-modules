import type { UpdaterState, UpdateSummary } from '@shared/updater.types'

export interface BannerModel {
  info: UpdateSummary
  phase: 'available' | 'downloading' | 'downloaded'
  percent?: number
  dismissible: boolean
}

/** What the panel banner shows, or null to hide. Dismissal only silences the plain
 *  "available" nudge; an in-flight or completed download stays visible. */
export function bannerModel(status: UpdaterState['status'], dismissedVersion: string | undefined): BannerModel | null {
  switch (status.phase) {
    case 'available':
      if (status.info.version === dismissedVersion) return null
      return { info: status.info, phase: 'available', dismissible: true }
    case 'downloading':
      return { info: status.info, phase: 'downloading', percent: status.percent, dismissible: false }
    case 'downloaded':
      return { info: status.info, phase: 'downloaded', dismissible: false }
    default:
      return null
  }
}
