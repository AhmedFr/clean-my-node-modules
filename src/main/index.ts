import { IPC } from '@shared/ipc.constants'
import { GB } from '@shared/units.constants'
import { app } from 'electron'
import { broadcast, registerIpc } from './ipc/register-ipc'
import { ThresholdNotifier } from './notifications/threshold-notifier'
import { PackageStore } from './packages/package-store'
import { ProjectStore } from './projects/project-store'
import { Scanner } from './scanner/scanner'
import { ScanScheduler } from './scheduler/scan-scheduler'
import { SettingsStore } from './settings/settings-store'
import { TrayManager } from './tray/tray'
import { LauncherWindow } from './windows/launcher-window'
import { PanelWindow } from './windows/panel-window'
import { is } from './windows/window-utils'

app.whenReady().then(() => {
  app.dock?.hide()

  const settings = new SettingsStore()
  const projects = new ProjectStore()
  const packages = new PackageStore()
  const scanner = new Scanner()
  const panel = new PanelWindow()
  const launcher = new LauncherWindow()
  const tray = new TrayManager()
  const notifier = new ThresholdNotifier(() => launcher.open())

  const runScan = async (): Promise<void> => {
    if (scanner.isScanning) return
    try {
      const result = await scanner.scan((progress) => broadcast(IPC.onScanProgress, progress))
      projects.replaceAll(result)
    } catch (err) {
      console.error('Scan failed', err)
    }
  }

  const scheduler = new ScanScheduler(() => void runScan())
  scheduler.apply(settings.get().scanInterval)

  const syncDerivedState = (): void => {
    const s = settings.get()
    const total = projects.totalSize()
    tray.setOverLimit(total > s.thresholdGB * GB, s.accent)
    notifier.check(total, s.thresholdGB, s.notify)
  }

  const unsubscribe = [
    projects.onChange((all) => {
      broadcast(IPC.onProjectsChanged, all)
      syncDerivedState()
    }),
    settings.onChange((s) => {
      broadcast(IPC.onSettingsChanged, s)
      scheduler.apply(s.scanInterval)
      syncDerivedState()
    }),
  ]

  // Tear down timers + store listeners on quit so nothing outlives the app.
  app.on('before-quit', () => {
    scheduler.stop()
    for (const off of unsubscribe) off()
  })

  tray.create((trayInstance) => panel.toggle(trayInstance))
  panel.create()
  registerIpc({ projects, packages, settings, panel, launcher, runScan })
  syncDerivedState()

  // First launch: show onboarding front-and-center; it triggers the first scan.
  // Returning users: refresh inventory if empty, and keep the dev convenience.
  if (!settings.get().onboarded) {
    launcher.open()
  } else {
    if (projects.all.length === 0) void runScan()
    if (is.dev) launcher.open()
  }

  // menu bar app: keep running with no windows open
  app.on('window-all-closed', () => {})
})
