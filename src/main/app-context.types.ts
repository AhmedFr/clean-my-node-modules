import type { Analytics } from './analytics/analytics'
import type { LicenseStore } from './license/license-store'
import type { PackageStore } from './packages/package-store'
import type { ProjectStore } from './projects/project-store'
import type { SettingsStore } from './settings/settings-store'
import type { LauncherWindow } from './windows/launcher-window'
import type { PanelWindow } from './windows/panel-window'

export interface AppContext {
  projects: ProjectStore
  packages: PackageStore
  settings: SettingsStore
  license: LicenseStore
  analytics: Analytics
  panel: PanelWindow
  launcher: LauncherWindow
  runScan: () => Promise<{ cancelled: boolean }>
  cancelScan: () => void
}
