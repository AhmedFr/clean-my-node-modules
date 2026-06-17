import type { IconRenderer } from '@renderer/components/UIIcon'

export type LauncherView = 'list' | 'scanning' | 'settings'
export type LauncherTab = 'projects' | 'caches'
export type SortKey = 'used' | 'size' | 'name'

export interface LauncherToast {
  icon: IconRenderer
  text: string
  tone: 'neutral' | 'good'
}
