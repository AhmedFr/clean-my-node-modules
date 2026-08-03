import type { LauncherNavTarget } from '@shared/launcher-nav.types'
import type { LicenseState } from '@shared/license.types'
import type { Project, ScanProgress } from '@shared/project.types'
import { DEFAULT_SETTINGS } from '@shared/settings.constants'
import type { Settings } from '@shared/settings.types'
import type { UpdaterState } from '@shared/updater.types'
import { vi } from 'vitest'
import type { CleanApi } from '../../../preload/api.types'

/** One subscription channel: records listeners, exposes an emitter and a live count. */
function channel<T>(): {
  on: (fn: (v: T) => void) => () => void
  emit: (v: T) => void
  readonly count: number
} {
  const listeners = new Set<(v: T) => void>()
  return {
    on: (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    emit: (v) => {
      for (const fn of listeners) fn(v)
    },
    get count() {
      return listeners.size
    },
  }
}

export interface MockClean {
  /** The bridge installed on window.clean; override per test via vi.mocked(window.clean.method). */
  api: CleanApi
  /** Push subscription events, as the main process would. */
  emit: {
    scanProgress: (p: ScanProgress) => void
    projectsChanged: (p: Project[]) => void
    settingsChanged: (s: Settings) => void
    licenseChanged: (s: LicenseState) => void
    launcherNavigate: (nav: LauncherNavTarget) => void
    updaterState: (s: UpdaterState) => void
  }
  /** Live listener counts, for asserting unsubscription on unmount. */
  listeners: {
    scanProgress: number
    projects: number
    settings: number
    license: number
    launcherNavigate: number
    updater: number
  }
}

export function makeProject(over: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'demo',
    path: '~/code/demo',
    absPath: '/Users/me/code/demo',
    kind: 'node',
    size: 1024,
    lastUsed: 0,
    ...over,
  }
}

/**
 * Installs a fully-stubbed window.clean. Typed against the real CleanApi, so any
 * preload bridge change breaks this file at typecheck time — the compiler, not
 * discipline, keeps the mock in sync.
 */
export function installMockClean(): MockClean {
  const scanProgress = channel<ScanProgress>()
  const projects = channel<Project[]>()
  const settings = channel<Settings>()
  const license = channel<LicenseState>()
  const nav = channel<LauncherNavTarget>()
  const updater = channel<UpdaterState>()

  const api: CleanApi = {
    getProjects: vi.fn(async () => []),
    getLastScanTime: vi.fn(async () => 0),
    getPnpmStore: vi.fn(async () => ({
      available: false,
      path: null,
      displayPath: '',
      sizeBytes: 0,
      checkedAt: 0,
      source: 'none' as const,
      canPrune: false,
    })),
    prunePnpmStore: vi.fn(async () => ({ ok: true, freedBytes: 0 })),
    getDocker: vi.fn(async () => ({ available: false, checkedAt: 0, totals: [], items: [], projects: [] })),
    removeDockerItem: vi.fn(async () => ({ ok: true, freedBytes: 0 })),
    pruneDocker: vi.fn(async () => ({ ok: true, freedBytes: 0 })),
    getPackages: vi.fn(async () => null),
    computePackages: vi.fn(async () => ({ packages: [], computedAt: 0, projectCount: 0 })),
    openExternal: vi.fn(async () => {}),
    scan: vi.fn(async () => {}),
    deleteNodeModules: vi.fn(async () => ({ freed: 0 })),
    deleteManyNodeModules: vi.fn(async () => ({ freed: 0, blockedIds: [] })),
    revealInFinder: vi.fn(async () => {}),
    openProject: vi.fn(async () => {}),
    getSettings: vi.fn(async () => DEFAULT_SETTINGS),
    setSetting: vi.fn(async () => DEFAULT_SETTINGS),
    listVolumes: vi.fn(async () => []),
    getLiveProjects: vi.fn(async () => ({})),
    getLicense: vi.fn(async () => ({ pro: false })),
    activateLicense: vi.fn(async () => ({ ok: false as const, reason: 'invalid' as const })),
    copyShareCard: vi.fn(async () => ({ ok: true })),
    openLauncher: vi.fn(async () => {}),
    consumeLauncherNav: vi.fn(async () => null),
    getUpdaterState: vi.fn(async () => ({
      currentVersion: '0.0.0',
      checkedAt: null,
      status: { phase: 'idle' as const },
    })),
    updaterCheck: vi.fn(async () => {}),
    updaterDownload: vi.fn(async () => {}),
    updaterInstall: vi.fn(async () => {}),
    closeWindow: vi.fn(async () => {}),
    setWindowHeight: vi.fn(),
    quitApp: vi.fn(),
    uninstall: vi.fn(async () => {}),
    pickPath: vi.fn(async () => null),
    trackEvent: vi.fn(),
    onScanProgress: vi.fn(scanProgress.on),
    onProjectsChanged: vi.fn(projects.on),
    onSettingsChanged: vi.fn(settings.on),
    onLicenseChanged: vi.fn(license.on),
    onLauncherNavigate: vi.fn(nav.on),
    onUpdaterState: vi.fn(updater.on),
  }

  window.clean = api
  return {
    api,
    emit: {
      scanProgress: scanProgress.emit,
      projectsChanged: projects.emit,
      settingsChanged: settings.emit,
      licenseChanged: license.emit,
      launcherNavigate: nav.emit,
      updaterState: updater.emit,
    },
    listeners: {
      get scanProgress() {
        return scanProgress.count
      },
      get projects() {
        return projects.count
      },
      get settings() {
        return settings.count
      },
      get license() {
        return license.count
      },
      get launcherNavigate() {
        return nav.count
      },
      get updater() {
        return updater.count
      },
    },
  }
}
