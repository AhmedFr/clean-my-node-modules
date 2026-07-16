import { formatSizeStr, GB } from '@renderer/lib/format'
import { type SeverityCounts, severityCounts } from '@renderer/lib/severity'
import type { DockerInfo } from '@shared/docker.types'
import type { LauncherNavTarget } from '@shared/launcher-nav.types'
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

interface PanelAreaRowBase {
  id: 'projects' | 'caches' | 'packages' | 'docker'
  /** Tab this row opens in the launcher when clicked. */
  nav: LauncherNavTarget
  label: string
}

/** A size area: renders a slim PixelMeter against its own limit. */
export interface PanelSizeRow extends PanelAreaRowBase {
  kind: 'size'
  usedBytes: number
  thresholdGB: number
  /** Upper bound of this row's meter track. */
  trackMaxGB: number
  /** Preformatted for the row's right-hand value. */
  value: string
}

/** The packages area: renders a SeverityMeter, which draws its own label. */
export interface PanelSeverityRow extends PanelAreaRowBase {
  kind: 'severity'
  severity: SeverityCounts
  packagesTotal: number
}

/** An area with nothing honest to show yet. Still clicks through. */
export interface PanelPlaceholderRow extends PanelAreaRowBase {
  kind: 'placeholder'
  note: string
}

export type PanelAreaRow = PanelSizeRow | PanelSeverityRow | PanelPlaceholderRow

/** Meter track: always clears the limit marker and the current usage. Named apart from
 *  the `trackMaxGB` fields it feeds, so the function and the value never read alike. */
function meterTrackMax(usedGB: number, limitGB: number): number {
  return Math.max(limitGB * 1.5, usedGB * 1.06)
}

function sizeRow(
  id: 'projects' | 'caches' | 'docker',
  label: string,
  usedBytes: number,
  thresholdGB: number,
): PanelSizeRow {
  return {
    id,
    nav: id,
    label,
    kind: 'size',
    usedBytes,
    thresholdGB,
    trackMaxGB: meterTrackMax(usedBytes / GB, thresholdGB),
    value: formatSizeStr(usedBytes),
  }
}

/** Packages can only show a severity bar when the check is on, an inventory is cached,
 *  and enrichment actually succeeded. Anything else would render "all clear" for data
 *  that was never checked. */
function packagesRow(input: PanelAreasInput): PanelSeverityRow | PanelPlaceholderRow {
  const ready = !!input.inventory && !input.inventory.enrichmentError
  if (!input.checkUpdates || !ready || !input.inventory) {
    return { id: 'packages', nav: 'packages', label: 'Packages', kind: 'placeholder', note: 'Not checked yet' }
  }
  return {
    id: 'packages',
    nav: 'packages',
    label: 'Packages',
    kind: 'severity',
    severity: severityCounts(input.inventory.packages),
    packagesTotal: input.inventory.packages.length,
  }
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

  const rows: PanelAreaRow[] = [sizeRow('projects', 'Projects', projectsUsed, input.thresholdGB)]
  if (cachesAvailable) rows.push(sizeRow('caches', 'Caches', storeBytes, input.cacheThresholdGB))
  rows.push(packagesRow(input))
  if (dockerAvailable) rows.push(sizeRow('docker', 'Docker', dockerUsed, input.dockerThresholdGB))

  return {
    heroBytes,
    combinedLimitGB,
    trackMaxGB: meterTrackMax(heroBytes / GB, combinedLimitGB),
    areaCount: 1 + (cachesAvailable ? 1 : 0) + (dockerAvailable ? 1 : 0),
    rows,
  }
}
