import { app } from 'electron'
import { IPC } from '@shared/ipc.constants'
import { Scanner } from './scanner/scanner'
import { ProjectStore } from './projects/project-store'
import { SettingsStore } from './settings/settings-store'
import { TrayManager } from './tray/tray'
import { PanelWindow } from './windows/panel-window'
import { LauncherWindow } from './windows/launcher-window'
import { ScanScheduler } from './scheduler/scan-scheduler'
import { ThresholdNotifier } from './notifications/threshold-notifier'
import { registerIpc, broadcast } from './ipc/register-ipc'
import { is } from './windows/window-utils'

const GB = 1024 * 1024 * 1024

app.whenReady().then(() => {
  app.dock?.hide()

  const settings = new SettingsStore()
  const projects = new ProjectStore()
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

  projects.onChange((all) => {
    broadcast(IPC.onProjectsChanged, all)
    syncDerivedState()
  })
  settings.onChange((s) => {
    broadcast(IPC.onSettingsChanged, s)
    scheduler.apply(s.scanInterval)
    syncDerivedState()
  })

  tray.create((trayInstance) => panel.toggle(trayInstance))
  panel.create()
  registerIpc({ projects, settings, panel, launcher, runScan })
  syncDerivedState()

  // first launch: populate inventory right away
  if (projects.all.length === 0) void runScan()

  // dev convenience: show the launcher without needing the tray
  if (is.dev) launcher.open()

  // menu bar app: keep running with no windows open
  app.on('window-all-closed', () => {})
})
