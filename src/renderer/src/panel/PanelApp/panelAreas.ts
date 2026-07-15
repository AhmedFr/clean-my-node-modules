import { GB } from '@renderer/lib/format'
import type { DockerInfo } from '@shared/docker.types'
import type { PackageInventory } from '@shared/package.types'
import type { PnpmStoreInfo } from '@shared/pnpm-store.types'
import type { Project } from '@shared/project.types'

export interface PanelAreasInput {
  projects: Project[]
  store: PnpmStoreInfo | null
  docker: DockerInfo | null
  /** settings.docker !== false */
  dockerEnabled: boolean
  inventory: PackageInventory | null
  /** settings.checkUpdates */
  checkUpdates: boolean
  thresholdGB: number
  cacheThresholdGB: number
  dockerThresholdGB: number
}

export interface PanelAreas {
  /** Every tracked byte, counted once (see D4): projects + store + docker. */
  heroBytes: number
  /** Sum of the limits of the areas actually present. */
  combinedLimitGB: number
  /** Upper bound of the hero meter's track. */
  trackMaxGB: number
  /** How many size areas are present (max 3). Packages is never counted: it is not bytes. */
  areaCount: number
  rows: PanelAreaRow[]
}

export type PanelAreaRow = never

/** Meter track: always clears the limit marker and the current usage. Named apart from
 *  the `trackMaxGB` fields it feeds, so the function and the value never read alike. */
function meterTrackMax(usedGB: number, limitGB: number): number {
  return Math.max(limitGB * 1.5, usedGB * 1.06)
}

/** Hero totals and per-area presence for the menu bar panel.
 *
 *  The pnpm store is counted ONCE here, inside the projects term (that is what
 *  `uniqueSize` means: bytes freed by deleting node_modules now, with store-backed
 *  content excluded). The Caches row reports the same store again because it mirrors
 *  the Caches tab, so the rows deliberately sum to MORE than the hero. See D4. */
export function panelAreas(input: PanelAreasInput): PanelAreas {
  const cachesAvailable = !!input.store?.available
  const storeBytes = cachesAvailable ? (input.store?.sizeBytes ?? 0) : 0
  const projectsUsed = input.projects.reduce((a, p) => a + (p.uniqueSize ?? p.size), 0) + storeBytes

  const dockerAvailable = input.dockerEnabled && !!input.docker?.available
  const dockerUsed = dockerAvailable ? (input.docker?.totals ?? []).reduce((s, t) => s + t.sizeBytes, 0) : 0

  const heroBytes = projectsUsed + dockerUsed
  const combinedLimitGB =
    input.thresholdGB + (cachesAvailable ? input.cacheThresholdGB : 0) + (dockerAvailable ? input.dockerThresholdGB : 0)

  return {
    heroBytes,
    combinedLimitGB,
    trackMaxGB: meterTrackMax(heroBytes / GB, combinedLimitGB),
    areaCount: 1 + (cachesAvailable ? 1 : 0) + (dockerAvailable ? 1 : 0),
    rows: [],
  }
}
