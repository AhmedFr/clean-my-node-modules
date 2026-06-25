import type { PackageStore } from './packages/package-store'
import type { ProjectStore } from './projects/project-store'
import type { SettingsStore } from './settings/settings-store'
import type { LauncherWindow } from './windows/launcher-window'
import type { PanelWindow } from './windows/panel-window'

export interface AppContext {
  projects: ProjectStore
  packages: PackageStore
  settings: SettingsStore
  panel: PanelWindow
  launcher: LauncherWindow
  runScan: () => Promise<void>
}
