import { relativeTime } from '@renderer/lib/format'
import type { DockerInfo, DockerItem, DockerItemKind, DockerProject, DockerPruneTarget } from '@shared/docker.types'

export type DockerSortKey = 'size' | 'name' | 'recent'
export type DockerTypeFilter = 'all' | DockerItemKind

export type DisplayGroup =
  | { kind: 'project'; id: string; label: string; project: DockerProject; items: DockerItem[] }
  | { kind: 'repository'; id: string; label: string; items: DockerItem[] }
  | { kind: 'unaffiliated'; id: string; label: string; items: DockerItem[] }

const bytes = (items: DockerItem[]): number => items.reduce((s, i) => s + i.sizeBytes, 0)
const recent = (items: DockerItem[]): number => items.reduce((m, i) => Math.max(m, i.createdAt), 0)
const bySizeDesc = (a: DockerItem, b: DockerItem): number => b.sizeBytes - a.sizeBytes

function sortGroups(groups: DisplayGroup[], sortBy: DockerSortKey): DisplayGroup[] {
  return [...groups].sort((a, b) => {
    if (sortBy === 'name') return a.label.localeCompare(b.label)
    if (sortBy === 'recent') return recent(b.items) - recent(a.items)
    return bytes(b.items) - bytes(a.items)
  })
}

export function groupDockerForDisplay(
  info: DockerInfo,
  opts: { sortBy: DockerSortKey; typeFilter: DockerTypeFilter; query: string },
): DisplayGroup[] {
  const q = opts.query.trim().toLowerCase()
  const items = info.items.filter((i) => {
    if (opts.typeFilter !== 'all' && i.kind !== opts.typeFilter) return false
    if (!q) return true
    return i.name.toLowerCase().includes(q) || (i.project?.toLowerCase().includes(q) ?? false)
  })

  // Project groups. Guard `projects`: a cache written by an older build (or any
  // DockerInfo that predates project enrichment) has no `projects` field, so it
  // would be undefined here and blow up the iteration.
  const projectGroups: DisplayGroup[] = []
  for (const p of Array.isArray(info.projects) ? info.projects : []) {
    const of = items.filter((i) => i.project === p.name).sort(bySizeDesc)
    if (of.length)
      projectGroups.push({ kind: 'project', id: `project:${p.name}`, label: p.name, project: p, items: of })
  }

  // "Other": unaffiliated items → repository groups (images) + buildcache + unaffiliated (rest)
  const other = items.filter((i) => !i.project)
  const repoGroups: DisplayGroup[] = []
  const repos = new Map<string, DockerItem[]>()
  for (const i of other) {
    if (i.kind === 'image' && i.repository) {
      if (!repos.has(i.repository)) repos.set(i.repository, [])
      repos.get(i.repository)!.push(i)
    }
  }
  for (const [repo, of] of repos)
    repoGroups.push({ kind: 'repository', id: `repo:${repo}`, label: repo, items: of.sort(bySizeDesc) })

  const rest = other.filter((i) => i.kind !== 'buildcache' && !(i.kind === 'image' && i.repository)).sort(bySizeDesc)
  const unaffiliatedGroup: DisplayGroup[] = rest.length
    ? [{ kind: 'unaffiliated', id: 'unaffiliated', label: 'Not linked to a project', items: rest }]
    : []

  return [
    ...sortGroups(projectGroups, opts.sortBy),
    ...sortGroups([...repoGroups, ...unaffiliatedGroup], opts.sortBy),
  ]
}

/** Detail line for a Docker row: relative created date (or "unknown date"). In-use state is
 * shown as a green dot next to the name instead (see `DockerItemRow`), not as text here. */
export function dockerItemDetail(item: DockerItem, now = Date.now()): string {
  return item.createdAt > 0 ? relativeTime(item.createdAt, now) : 'unknown date'
}

/** Display label for each bulk-prune target, used on the per-category prune buttons and confirm footer. */
export const PRUNE_TARGET_LABEL: Record<DockerPruneTarget, string> = {
  danglingImages: 'Dangling images',
  unusedImages: 'Unused images',
  stoppedContainers: 'Stopped containers',
  buildCache: 'Build cache',
  unusedVolumes: 'Unused volumes',
}

/** Button labels for the bulk-prune actions. Unlike `PRUNE_TARGET_LABEL` (the noun used in
 *  the confirm footer + toast), these lead with a delete verb so the button reads as the
 *  destructive action it is. */
export const PRUNE_BUTTON_LABEL: Record<DockerPruneTarget, string> = {
  danglingImages: 'Delete dangling images',
  unusedImages: 'Delete unused images',
  stoppedContainers: 'Delete stopped containers',
  buildCache: 'Delete build cache',
  unusedVolumes: 'Delete unused volumes',
}

/** Prune commands are global (`docker <x> prune -f` spans every project), so bulk-prune
 * buttons only appear on the "Other" section headers — never under a project header, where
 * they'd falsely imply a project-scoped prune. Targets are keyed by the item kinds present
 * in that specific group. Dangling (`<none>`) images have no `repository`, so they can land
 * in either a `repository` group (alongside tagged siblings of the same repo) or the
 * `unaffiliated` group — check both for image targets. */
export function prunesForGroup(group: DisplayGroup): DockerPruneTarget[] {
  if (group.kind === 'repository' || group.kind === 'unaffiliated') {
    const targets: DockerPruneTarget[] = []
    if (group.items.some((i) => i.kind === 'image' && i.name === '<none>')) targets.push('danglingImages')
    if (group.items.some((i) => i.kind === 'image' && i.removable)) targets.push('unusedImages')
    if (group.kind === 'unaffiliated') {
      if (group.items.some((i) => i.kind === 'volume')) targets.push('unusedVolumes')
      if (group.items.some((i) => i.kind === 'container' && i.removable)) targets.push('stoppedContainers')
    }
    return targets
  }
  return []
}

/** Estimated bytes a bulk prune would free, from the currently-known item list (the real
 * total is only known after the CLI runs). Dangling images are untagged (`name === '<none>'`);
 * unused images covers all removable images, tagged or not, matching `docker image prune -a`. */
export function pruneEstimateBytes(items: DockerItem[], target: DockerPruneTarget): number {
  const sum = (of: DockerItem[]): number => of.reduce((s, i) => s + i.sizeBytes, 0)
  switch (target) {
    case 'danglingImages':
      return sum(items.filter((i) => i.kind === 'image' && i.removable && i.name === '<none>'))
    case 'unusedImages':
      return sum(items.filter((i) => i.kind === 'image' && i.removable))
    case 'stoppedContainers':
      return sum(items.filter((i) => i.kind === 'container' && i.removable))
    case 'buildCache':
      return sum(items.filter((i) => i.kind === 'buildcache'))
    case 'unusedVolumes':
      return sum(items.filter((i) => i.kind === 'volume' && i.removable))
    default:
      return 0
  }
}

/** Total bytes of Docker build-cache items. Surfaced as a single row in the Caches tab —
 *  build cache is a global cache, not a per-project resource, so it lives with the other
 *  package-manager caches rather than in the project-grouped Docker list. */
export function dockerBuildCacheBytes(items: DockerItem[]): number {
  return items.filter((i) => i.kind === 'buildcache').reduce((s, i) => s + i.sizeBytes, 0)
}

/** True when any resource in the group is in use by a container. Drives the green active
 *  dot on a collapsed project row. */
export function dockerGroupActive(items: DockerItem[]): boolean {
  return items.some((i) => i.inUse)
}

/** Whether a project row renders expanded. A non-empty search expands every project (their
 *  items are already query-filtered, so results are never hidden behind a collapsed row);
 *  with no query, only the accordion-selected id is open. */
export function projectRowExpanded(hasQuery: boolean, expandedId: string | null, groupId: string): boolean {
  return hasQuery || expandedId === groupId
}
