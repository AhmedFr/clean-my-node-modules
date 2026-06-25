import type { PackageInventory } from '@shared/package.types'
import type { PnpmPruneResult, PnpmStoreInfo } from '@shared/pnpm-store.types'
import type { Project, ScanProgress } from '@shared/project.types'
import type { Settings } from '@shared/settings.types'

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
  deleteNodeModules(id: string): Promise<number>
  revealInFinder(id: string): Promise<void>
  openProject(id: string): Promise<void>
  getSettings(): Promise<Settings>
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<Settings>
  openLauncher(): Promise<void>
  closeWindow(): Promise<void>
  setWindowHeight(height: number): void
  quitApp(): void
  uninstall(): Promise<void>
  pickPath(mode: 'file' | 'folder'): Promise<string | null>
  onScanProgress(fn: (p: ScanProgress) => void): () => void
  onProjectsChanged(fn: (projects: Project[]) => void): () => void
  onSettingsChanged(fn: (settings: Settings) => void): () => void
}

declare global {
  interface Window {
    clean: CleanApi
  }
}
