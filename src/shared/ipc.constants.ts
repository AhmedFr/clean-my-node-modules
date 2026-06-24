/** IPC channel names shared between main, preload and renderer. */
export const IPC = {
  // invoke (renderer -> main)
  getProjects: 'projects:get',
  scan: 'projects:scan',
  deleteNodeModules: 'projects:delete',
  revealInFinder: 'projects:reveal',
  openProject: 'projects:open',
  getSettings: 'settings:get',
  setSetting: 'settings:set',
  openLauncher: 'window:open-launcher',
  closeWindow: 'window:close-self',
  setWindowHeight: 'window:set-height',
  quitApp: 'app:quit',
  uninstall: 'app:uninstall',
  getLastScanTime: 'scan:last-time',
  getPnpmStore: 'pnpm-store:get',
  prunePnpmStore: 'pnpm-store:prune',
  pickPath: 'dialog:pick-path',
  // events (main -> renderer)
  onScanProgress: 'scan:progress',
  onProjectsChanged: 'projects:changed',
  onSettingsChanged: 'settings:changed',
} as const
