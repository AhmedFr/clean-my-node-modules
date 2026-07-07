import type { DockerCategoryTotal, DockerItem, DockerItemKind } from '@shared/docker.types'

// docker prints decimal (SI) sizes: 1kB = 1000 B.
const UNIT: Record<string, number> = {
  B: 1,
  KB: 1e3,
  MB: 1e6,
  GB: 1e9,
  TB: 1e12,
  KIB: 1024,
  MIB: 1024 ** 2,
  GIB: 1024 ** 3,
}

/** "1.1GB" | "512MB" | "0B" → bytes. Unknown/empty → 0. */
export function parseSize(s: string): number {
  const m = /^([\d.]+)\s*([A-Za-z]+)$/.exec((s ?? '').trim())
  if (!m) return 0
  const n = Number(m[1])
  const mult = UNIT[m[2].toUpperCase()] ?? 0
  return Number.isFinite(n) ? Math.round(n * mult) : 0
}

/** "2026-01-02 10:00:00 +0000 UTC" | "2026-01-02 10:00:00 -0500 EST" → ms epoch (0 if unparseable). */
export function parseDate(s: string): number {
  if (!s) return 0
  // Docker prints Go's time.Time.String(): "2006-01-02 15:04:05[.frac] -0700 MST".
  const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:\s+([+-]\d{4}))?/.exec(s.trim())
  if (!m) return 0
  const offset = m[3] ? `${m[3].slice(0, 3)}:${m[3].slice(3)}` : 'Z'
  const t = Date.parse(`${m[1]}T${m[2]}${offset}`)
  return Number.isFinite(t) ? t : 0
}

export interface DfImage {
  ID: string
  Repository: string
  Tag: string
  CreatedAt: string
  Size: string
  Containers: string
}
export interface DfVolume {
  Name: string
  Size: string
  Links: string
}
export interface DfContainer {
  ID: string
  Names: string
  State: string
  Image: string
  CreatedAt: string
  Size: string
}
export interface DfCache {
  ID: string
  Size: string
  CreatedAt: string
  InUse: string
}
export interface DfParsed {
  images: DfImage[]
  volumes: DfVolume[]
  containers: DfContainer[]
  buildCache: DfCache[]
}

export function parseDf(json: string): DfParsed {
  let o: Record<string, unknown> = {}
  try {
    o = JSON.parse(json) as Record<string, unknown>
  } catch {
    // leave empty
  }
  return {
    images: (o.Images as DfImage[]) ?? [],
    volumes: (o.Volumes as DfVolume[]) ?? [],
    containers: (o.Containers as DfContainer[]) ?? [],
    buildCache: (o.BuildCache as DfCache[]) ?? [],
  }
}

export interface PsContainer {
  ID: string
  Image: string
  State: string
}

/** `docker ps -a --format '{{json .}}'` = one JSON object per line. */
export function parseContainers(text: string): PsContainer[] {
  return (text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l) as PsContainer
      } catch {
        return null
      }
    })
    .filter((x): x is PsContainer => x !== null)
}

function totalsOf(items: DockerItem[]): DockerCategoryTotal[] {
  const kinds: DockerItemKind[] = ['image', 'volume', 'container', 'buildcache']
  return kinds.map((kind) => {
    const of = items.filter((i) => i.kind === kind)
    return {
      kind,
      sizeBytes: of.reduce((s, i) => s + i.sizeBytes, 0),
      reclaimableBytes: of.filter((i) => i.removable).reduce((s, i) => s + i.sizeBytes, 0),
      count: of.length,
    }
  })
}

export function buildDockerItems(
  df: DfParsed,
  _ps: PsContainer[],
): { items: DockerItem[]; totals: DockerCategoryTotal[] } {
  const items: DockerItem[] = []

  for (const img of df.images) {
    const dangling = img.Repository === '<none>' || img.Tag === '<none>'
    const inUse = Number(img.Containers) > 0
    const tag = dangling ? '<none>' : `${img.Repository}:${img.Tag}`
    items.push({
      id: img.ID,
      kind: 'image',
      name: tag,
      sizeBytes: parseSize(img.Size),
      createdAt: parseDate(img.CreatedAt),
      inUse,
      removable: !inUse,
    })
  }
  for (const vol of df.volumes) {
    const inUse = Number(vol.Links) > 0
    items.push({
      id: vol.Name,
      kind: 'volume',
      name: vol.Name,
      sizeBytes: parseSize(vol.Size),
      createdAt: 0,
      inUse,
      removable: !inUse,
    })
  }
  for (const c of df.containers) {
    // `docker rm` (no -f) only accepts truly stopped containers; it refuses
    // running, paused, restarting, and removing states.
    const inUse = c.State === 'running' || c.State === 'paused'
    const removable = c.State === 'exited' || c.State === 'created' || c.State === 'dead'
    items.push({
      id: c.ID,
      kind: 'container',
      name: c.Names || c.ID.slice(0, 12),
      sizeBytes: parseSize(c.Size),
      createdAt: parseDate(c.CreatedAt),
      inUse,
      removable,
    })
  }
  for (const cache of df.buildCache) {
    items.push({
      id: cache.ID,
      kind: 'buildcache',
      name: cache.ID.slice(0, 12),
      sizeBytes: parseSize(cache.Size),
      createdAt: parseDate(cache.CreatedAt),
      inUse: cache.InUse === 'true',
      removable: false, // build cache is bulk-prune-only
    })
  }

  return { items, totals: totalsOf(items) }
}
