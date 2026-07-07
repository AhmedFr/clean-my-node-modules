import type { IconRenderer } from '@renderer/components/UIIcon'

export type LauncherView = 'list' | 'scanning' | 'result' | 'settings'
export type LauncherTab = 'projects' | 'caches' | 'packages' | 'docker'
export type SortKey = 'used' | 'size' | 'name'
export type PackageSortKey = 'used' | 'size' | 'name' | 'updates'

export interface LauncherToast {
  icon: IconRenderer
  text: string
  tone: 'neutral' | 'good'
}
