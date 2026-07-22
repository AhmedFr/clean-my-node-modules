import { homedir } from 'node:os'
import { IPC } from '@shared/ipc.constants'
import { GB } from '@shared/units.constants'
import { app } from 'electron'
// electron-updater is CJS; with "type": "module" the default import is the interop shim.
import electronUpdater from 'electron-updater'
import { Analytics } from './analytics/analytics'
import { getInstallId } from './analytics/install-id'
import { broadcast, registerIpc } from './ipc/register-ipc'
import { LicenseStore } from './license'
import { ThresholdNotifier } from './notifications/threshold-notifier'
import { PackageStore } from './packages/package-store'
import { ProjectStore } from './projects/project-store'
import { resolveScanRoots } from './scanner/resolve-scan-roots'
import { Scanner } from './scanner/scanner'
import { ScanScheduler } from './scheduler/scan-scheduler'
import { SettingsStore } from './settings/settings-store'
import { TrayManager } from './tray/tray'
import { noteVersionChange, UpdaterService } from './updater'
import { LauncherWindow } from './windows/launcher-window'
import { PanelWindow } from './windows/panel-window'
import { is } from './windows/window-utils'

// Single-instance: a second launch (double-click, or a stray `pnpm dev`) hands off
// to the already-running app instead of spawning a duplicate tray icon + windows.
// The first instance surfaces its window via the 'second-instance' handler below.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) app.quit()

app.whenReady().then(() => {
  if (!gotLock) return
  app.dock?.hide()

  const settings = new SettingsStore()
  const projects = new ProjectStore()
  const packages = new PackageStore()
  const license = new LicenseStore()
  const analytics = new Analytics(() => settings.get().analytics, getInstallId(), is.dev ? null : undefined)
  analytics.capture('app_launched', { version: app.getVersion() })

  const prevVersion = noteVersionChange(app.getVersion())
  if (prevVersion) analytics.capture('update_installed', { from: prevVersion, to: app.getVersion() })

  const scanner = new Scanner()
  const panel = new PanelWindow()
  const launcher = new LauncherWindow()
  const tray = new TrayManager()
  const notifier = new ThresholdNotifier(() => launcher.open())

  const updater = new UpdaterService(electronUpdater.autoUpdater, {
    currentVersion: app.getVersion(),
    execPath: process.execPath,
    onState: (s) => broadcast(IPC.onUpdaterState, s),
    onEvent: (event, props) => analytics.capture(event, props),
  })
  // Silent checks only make sense for a packaged, signed build.
  if (app.isPackaged) updater.start()

  const revalidateLicense = (): void => {
    void license.revalidateIfStale().then((result) => {
      if (!result) return
      analytics.capture('license_revalidated', { status: result.outcome })
      if (result.changed) broadcast(IPC.onLicenseChanged, license.get())
    })
  }
  revalidateLicense()
  const licenseTimer = setInterval(revalidateLicense, 24 * 60 * 60 * 1000)

  const runScan = async (): Promise<void> => {
    if (scanner.isScanning) return
    const startedAt = Date.now()
    try {
      const roots = resolveScanRoots(settings.get().scanRoots, { home: homedir() })
      const result = await scanner.scan(roots, (progress) => broadcast(IPC.onScanProgress, progress))
      projects.replaceAll(result)
      analytics.capture('scan_completed', {
        total_gb: Math.round((result.reduce((a, p) => a + (p.uniqueSize ?? p.size), 0) / GB) * 10) / 10,
        projects_count: result.length,
        duration_s: Math.round((Date.now() - startedAt) / 1000),
      })
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

  let prevSettings = settings.get()

  const unsubscribe = [
    projects.onChange((all) => {
      broadcast(IPC.onProjectsChanged, all)
      syncDerivedState()
    }),
    settings.onChange((s) => {
      if (!prevSettings.onboarded && s.onboarded) analytics.capture('onboarding_completed')
      if (prevSettings.analytics && !s.analytics) analytics.noteOptOut()
      prevSettings = s
      broadcast(IPC.onSettingsChanged, s)
      scheduler.apply(s.scanInterval)
      syncDerivedState()
    }),
  ]

  // Tear down timers + store listeners on quit so nothing outlives the app.
  app.on('before-quit', () => {
    scheduler.stop()
    clearInterval(licenseTimer)
    updater.stop()
    for (const off of unsubscribe) off()
    void analytics.shutdown()
  })

  tray.create((trayInstance) => panel.toggle(trayInstance))
  panel.create()
  registerIpc({ projects, packages, settings, license, updater, analytics, panel, launcher, runScan })
  syncDerivedState()

  // First launch: show onboarding front-and-center; it triggers the first scan.
  // Returning users: refresh inventory if empty, and keep the dev convenience.
  if (!settings.get().onboarded) {
    launcher.open()
  } else {
    if (projects.all.length === 0) void runScan()
    if (is.dev) launcher.open()
  }

  // A second launch surfaces the full window instead of starting another instance.
  app.on('second-instance', () => launcher.open())

  // menu bar app: keep running with no windows open
  app.on('window-all-closed', () => {})
})
