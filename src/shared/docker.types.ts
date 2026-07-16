import type { FrameworkKind } from './project.types'

export type DockerItemKind = 'image' | 'volume' | 'container' | 'buildcache'

export type DockerPruneTarget = 'danglingImages' | 'unusedImages' | 'stoppedContainers' | 'buildCache' | 'unusedVolumes'

export interface DockerItem {
  /** image ID / volume name / container ID / build-cache ID */
  id: string
  kind: DockerItemKind
  /** repo:tag, volume name, container name, or cache short id */
  name: string
  sizeBytes: number
  /** ms epoch; 0 when docker does not report a creation time */
  createdAt: number
  /** referenced by an existing container (image/volume) or running (container) */
  inUse: boolean
  /** false whenever inUse, or for build-cache rows (no per-item removal) */
  removable: boolean
  /** Compose project this resource is grouped under; undefined = unaffiliated ("Other"). */
  project?: string
  /** Image repository (name before the last ':'), for repo sub-grouping in "Other". */
  repository?: string
}

export interface DockerProject {
  name: string
  workingDir?: string
  kind?: FrameworkKind
  iconDataUrl?: string
}

export interface DockerCategoryTotal {
  kind: DockerItemKind
  sizeBytes: number
  reclaimableBytes: number
  count: number
}

export interface DockerInfo {
  /** docker CLI found AND daemon reachable */
  available: boolean
  /** when unavailable: 'not installed' | 'daemon not running' */
  reason?: string
  checkedAt: number
  totals: DockerCategoryTotal[]
  items: DockerItem[]
  projects: DockerProject[]
}

export interface DockerActionResult {
  ok: boolean
  freedBytes: number
}
