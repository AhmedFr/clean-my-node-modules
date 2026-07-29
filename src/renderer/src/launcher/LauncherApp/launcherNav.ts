import type { LauncherNavTarget } from '@shared/launcher-nav.types'
import type { LauncherTab, LauncherView } from './LauncherApp.types'

export interface LauncherNavState {
  view: LauncherView
  /** Only set for tab targets; undefined leaves the current tab alone. */
  tab?: LauncherTab
  /** Only set for 'settings-updates': which settings tab to land on. */
  settingsTab?: 'updates'
}

const TAB_TARGETS: readonly LauncherTab[] = ['projects', 'caches', 'packages', 'docker']

/** Where a nav target lands the launcher. The target crosses an IPC boundary, so an
 *  unrecognized value falls back to the list rather than selecting a bogus tab. */
export function launcherNavState(target: LauncherNavTarget): LauncherNavState {
  if (target === 'settings-updates') return { view: 'settings', settingsTab: 'updates' }
  if (target === 'settings') return { view: 'settings' }
  const tab = TAB_TARGETS.find((t) => t === target)
  return tab ? { view: 'list', tab } : { view: 'list' }
}
