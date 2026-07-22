import type { UpdaterState, UpdateSummary } from '@shared/updater.types'
import { classifyUpdaterError, isTranslocated, summarizeUpdate, type UpdateInfoLike } from './updater-logic'

/** Structural subset of electron-updater's autoUpdater; injectable for tests. */
export interface AutoUpdaterLike {
  autoDownload: boolean
  autoInstallOnAppQuit: boolean
  on(event: string, listener: (...args: never[]) => void): unknown
  checkForUpdates(): Promise<unknown>
  downloadUpdate(): Promise<unknown>
  quitAndInstall(): void
}

export interface UpdaterServiceOptions {
  currentVersion: string
  execPath: string
  onState: (state: UpdaterState) => void
  onEvent: (
    event: 'update_available' | 'update_download_clicked',
    props?: Record<string, string | number | boolean>,
  ) => void
}

const FIRST_CHECK_DELAY_MS = 10_000
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

/**
 * Wraps electron-updater with a fully user-driven flow: checks are silent and
 * automatic, but download and install each require an explicit call (a click).
 */
export class UpdaterService {
  private status: UpdaterState['status'] = { phase: 'idle' }
  private checkedAt: number | null = null
  private lastInfo: UpdateSummary | null = null
  private firstCheckTimer: ReturnType<typeof setTimeout> | null = null
  private checkInterval: ReturnType<typeof setInterval> | null = null

  constructor(
    private updater: AutoUpdaterLike,
    private opts: UpdaterServiceOptions,
  ) {
    updater.autoDownload = false
    updater.autoInstallOnAppQuit = true
    updater.on('checking-for-update', () => this.setStatus({ phase: 'checking' }))
    updater.on('update-available', (info: UpdateInfoLike) => {
      const summary = summarizeUpdate(info)
      this.lastInfo = summary
      this.checkedAt = Date.now()
      this.opts.onEvent('update_available', { version: summary.version })
      this.setStatus({ phase: 'available', info: summary })
    })
    updater.on('update-not-available', () => {
      this.checkedAt = Date.now()
      this.setStatus({ phase: 'idle' })
    })
    updater.on('download-progress', (p: { percent: number }) => {
      if (this.lastInfo) this.setStatus({ phase: 'downloading', info: this.lastInfo, percent: Math.round(p.percent) })
    })
    updater.on('update-downloaded', () => {
      if (this.lastInfo) this.setStatus({ phase: 'downloaded', info: this.lastInfo })
    })
    updater.on('error', (err: Error) => {
      this.setStatus({ phase: 'error', message: err.message, kind: classifyUpdaterError(err.message) })
    })
  }

  getState(): UpdaterState {
    return { currentVersion: this.opts.currentVersion, checkedAt: this.checkedAt, status: this.status }
  }

  check(): void {
    if (isTranslocated(this.opts.execPath)) {
      this.setStatus({
        phase: 'error',
        message: 'TidyDisk is running from a translocated path.',
        kind: 'translocation',
      })
      return
    }
    // Never interrupt an in-flight or completed download with a fresh check.
    if (this.status.phase === 'downloading' || this.status.phase === 'downloaded') return
    void this.updater.checkForUpdates().catch(() => {
      // failures surface through the 'error' event
    })
  }

  download(): void {
    if (this.status.phase !== 'available') return
    this.opts.onEvent('update_download_clicked', { version: this.status.info.version })
    void this.updater.downloadUpdate().catch(() => {
      // failures surface through the 'error' event
    })
  }

  quitAndInstall(): void {
    if (this.status.phase !== 'downloaded') return
    this.updater.quitAndInstall()
  }

  /** Silent background checks: shortly after launch, then every 6 hours. */
  start(): void {
    this.firstCheckTimer = setTimeout(() => this.check(), FIRST_CHECK_DELAY_MS)
    this.checkInterval = setInterval(() => this.check(), CHECK_INTERVAL_MS)
  }

  stop(): void {
    if (this.firstCheckTimer) clearTimeout(this.firstCheckTimer)
    if (this.checkInterval) clearInterval(this.checkInterval)
    this.firstCheckTimer = null
    this.checkInterval = null
  }

  private setStatus(status: UpdaterState['status']): void {
    this.status = status
    this.opts.onState(this.getState())
  }
}
