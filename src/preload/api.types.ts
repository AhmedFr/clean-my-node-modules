import type { DeleteManyResult, DeleteResult } from '@shared/delete.types'
import type { ActivateResult, LicenseState } from '@shared/license.types'
import type { LiveInfo } from '@shared/liveness.types'
import type { PackageInventory } from '@shared/package.types'
import type { PnpmPruneResult, PnpmStoreInfo } from '@shared/pnpm-store.types'
import type { Project, ScanProgress } from '@shared/project.types'
import type { Settings } from '@shared/settings.types'
import type { ShareCardPayload } from '@shared/share.types'
import type { VolumeOption } from '@shared/volume.types'

export interface CleanApi {
  getProjects(): Promise<Project[]>
  getLastScanTime(): Promise<number>
  getPnpmStore(force?: boolean): Promise<PnpmStoreInfo>
  prunePnpmStore(): Promise<PnpmPruneResult>
  /** Cached package inventory, or null if never computed. */
  getPackages(): Promise<PackageInventory | null>
  /** Compute (or, with force, recompute) the package inventory. */
  computePackages(force?: boolean): Promise<PackageInventory>
  /** Opens an https URL in the user's default browser. */
  openExternal(url: string): Promise<void>
  scan(): Promise<void>
  deleteNodeModules(id: string): Promise<DeleteResult>
  /** Deletes node_modules for several projects, running the liveness check once for the batch. */
  deleteManyNodeModules(ids: string[]): Promise<DeleteManyResult>
  revealInFinder(id: string): Promise<void>
  openProject(id: string): Promise<void>
  getSettings(): Promise<Settings>
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<Settings>
  /** Mounted external volumes offered as scan-location toggles. */
  listVolumes(): Promise<VolumeOption[]>
  /** Currently running projects, keyed by project id. */
  getLiveProjects(): Promise<Record<string, LiveInfo>>
  getLicense(): Promise<LicenseState>
  /** Verifies + persists a license key; broadcasts license:changed on success. */
  activateLicense(key: string): Promise<ActivateResult>
  /** Renders the share card offscreen and copies the PNG to the clipboard. */
  copyShareCard(payload: ShareCardPayload): Promise<{ ok: boolean }>
  openLauncher(): Promise<void>
  closeWindow(): Promise<void>
  setWindowHeight(height: number): void
  quitApp(): void
  uninstall(): Promise<void>
  pickPath(mode: 'file' | 'folder'): Promise<string | null>
  /** Fire-and-forget funnel event; main enforces the event whitelist. */
  trackEvent(event: 'paywall_shown' | 'buy_clicked', props?: Record<string, string | number | boolean>): void
  onScanProgress(fn: (p: ScanProgress) => void): () => void
  onProjectsChanged(fn: (projects: Project[]) => void): () => void
  onSettingsChanged(fn: (settings: Settings) => void): () => void
  onLicenseChanged(fn: (s: LicenseState) => void): () => void
}

declare global {
  interface Window {
    clean: CleanApi
  }
}
