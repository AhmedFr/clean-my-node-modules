import { relativeTime } from '@renderer/lib/format'
import type { DockerItem, DockerItemKind } from '@shared/docker.types'

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
