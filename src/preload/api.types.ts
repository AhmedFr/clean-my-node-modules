import type { Project, ScanProgress } from '@shared/project.types'
import type { Settings } from '@shared/settings.types'

export interface CleanApi {
  getProjects(): Promise<Project[]>
  getLastScanTime(): Promise<number>
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
  onScanProgress(fn: (p: ScanProgress) => void): () => void
  onProjectsChanged(fn: (projects: Project[]) => void): () => void
  onSettingsChanged(fn: (settings: Settings) => void): () => void
}

declare global {
  interface Window {
    clean: CleanApi
  }
}
