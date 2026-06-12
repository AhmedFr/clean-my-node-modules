import type { ProjectStore } from './projects/project-store'
import type { SettingsStore } from './settings/settings-store'
import type { PanelWindow } from './windows/panel-window'
import type { LauncherWindow } from './windows/launcher-window'

export interface AppContext {
  projects: ProjectStore
  settings: SettingsStore
  panel: PanelWindow
  launcher: LauncherWindow
  runScan: () => Promise<void>
}
