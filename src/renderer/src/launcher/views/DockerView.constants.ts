import { relativeTime } from '@renderer/lib/format'
import type { DockerItem, DockerItemKind, DockerPruneTarget } from '@shared/docker.types'

export interface DockerGroup {
  kind: DockerItemKind
  label: string
  items: DockerItem[]
}

/** Fixed display order for the Docker tab's sections. */
const GROUP_ORDER: Array<{ kind: DockerItemKind; label: string }> = [
  { kind: 'image', label: 'Images' },
  { kind: 'volume', label: 'Volumes' },
  { kind: 'container', label: 'Containers' },
  { kind: 'buildcache', label: 'Build cache' },
]

/** Filters items by name (case-insensitive substring) and groups them by kind, in a fixed
 * display order. Groups with no matching items are omitted entirely. */
export function groupDockerItems(items: DockerItem[], query: string): DockerGroup[] {
  const q = query.trim().toLowerCase()
  const filtered = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items
  return GROUP_ORDER.map(({ kind, label }) => ({
    kind,
    label,
    items: filtered.filter((i) => i.kind === kind),
  })).filter((g) => g.items.length > 0)
}

/** Detail line for a Docker row: relative created date (or "unknown date") plus in-use badge. */
export function dockerItemDetail(item: DockerItem, now = Date.now()): string {
  const created = item.createdAt > 0 ? relativeTime(item.createdAt, now) : 'unknown date'
  return `${created} · ${item.inUse ? 'in use' : 'unused'}`
}

/** Display label for each bulk-prune target, used on the per-category prune buttons and confirm footer. */
export const PRUNE_TARGET_LABEL: Record<DockerPruneTarget, string> = {
  danglingImages: 'Dangling images',
  unusedImages: 'Unused images',
  stoppedContainers: 'Stopped containers',
  buildCache: 'Build cache',
  unusedVolumes: 'Unused volumes',
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
