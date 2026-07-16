import type { IconRenderer } from '@renderer/components/UIIcon'
import type { DockerItem, DockerPruneTarget } from '@shared/docker.types'

export type LauncherView = 'list' | 'scanning' | 'result' | 'settings'
export type LauncherTab = 'projects' | 'caches' | 'packages' | 'docker'
export type SortKey = 'used' | 'size' | 'name'
export type PackageSortKey = 'used' | 'size' | 'name' | 'updates'

export interface LauncherToast {
  icon: IconRenderer
  text: string
  tone: 'neutral' | 'good'
}

/** A pending Docker removal/prune awaiting confirmation in the footer (Pro users only —
 * free users hit the paywall before this state is ever set). */
export type DockerConfirmState =
  | { kind: 'remove'; item: DockerItem }
  | { kind: 'prune'; target: DockerPruneTarget; estimatedBytes: number }
