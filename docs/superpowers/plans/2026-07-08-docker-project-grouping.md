# Docker Project-Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Regroup the Docker tab by project (Compose labels + used-by references) with type badges, a type-filter chip row, and Size/Name/Recent sort tabs, keeping the cleanup + volume-confirmation safety flow untouched.

**Architecture:** Enrich each `DockerItem` with a `project?`/`repository?` in the main process from `docker container/volume inspect` (compose labels + image/mount references), attach a per-project logo via the scanner's `detectKind`/`findProjectIcon`, and rewrite the renderer's grouping (`groupDockerForDisplay`) + `DockerView` to render project group headers with badged rows. Presentation + enrichment only; cleanup identifiers (`DockerItem.id`/`kind`) are unchanged. Spec: `docs/superpowers/specs/2026-07-08-docker-project-grouping-design.md`.

**Tech Stack:** Electron + TypeScript, React renderer, vitest (`pnpm test`), biome (`pnpm lint`), electron-vite (`pnpm build`), two tsconfig typechecks (`pnpm typecheck`).

## Global Constraints

- Package manager: pnpm. All gates green per task: `pnpm typecheck && pnpm test && pnpm lint && pnpm build`.
- **Safety is untouched:** every row must keep flowing its real `DockerItem.id` and `kind` to `onRemove(item)`/`onPrune(target)`. Do NOT change `LauncherApp`'s `dockerConfirm`/`dockerConfirmBlocked`/`commitDockerConfirm` logic or `docker-confirm.ts`. The typed-name volume gate must keep working.
- Project identity = a Docker Compose project only (name + working_dir). Never invent a project for non-compose resources; those go to "Other".
- An item belongs to exactly ONE group (no double-counting in the size sort): an image/volume used by MULTIPLE compose projects → "Other".
- All docker CLI calls: `execFile` with array args, no shell, fail-soft (association failure degrades to "everything in Other", never an error/crash).
- Repo biome style (single quotes, no semicolons, 2-space). Commit style `feat(app): …`.

## File structure

- Modify: `src/shared/docker.types.ts` (new fields + `DockerProject`).
- Create: `src/main/docker/docker-inspect.ts` (parse `docker container/volume inspect` JSON) + `docker-associate.ts` (`associateProjects`) + tests.
- Modify: `src/main/docker/docker.ts` (`readDockerInfo` runs the inspect calls + logo detection).
- Modify: `src/renderer/src/launcher/views/DockerView.constants.ts` (`groupDockerForDisplay`) + test.
- Create: `src/renderer/src/components/TypeBadge/` and `DockerProjectIcon` (in DockerView or its own file).
- Modify: `src/renderer/src/launcher/views/DockerView.tsx`, `DockerView.types.ts`, `LauncherApp.tsx`, `LauncherApp.types.ts`.

---

### Task 1: Data model + pure `associateProjects`

**Files:**
- Modify: `src/shared/docker.types.ts`
- Create: `src/main/docker/docker-inspect.ts`, `src/main/docker/docker-inspect.test.ts`, `src/main/docker/docker-associate.ts`, `src/main/docker/docker-associate.test.ts`

**Interfaces:**
- Produces:
  - `DockerItem` gains `project?: string`, `repository?: string`.
  - `DockerProject { name: string; workingDir?: string; kind?: FrameworkKind; iconDataUrl?: string }`.
  - `DockerInfo` gains `projects: DockerProject[]`.
  - `parseContainerInspect(json: string): InspectedContainer[]` where `InspectedContainer = { id: string; imageRef: string; imageId: string; project?: string; workingDir?: string; mounts: string[] }`.
  - `parseVolumeInspect(json: string): Map<string, string>` (volume name → compose project).
  - `associateProjects(items, containers, volumeProjects): { items: DockerItem[]; projects: DockerProject[] }`.

- [ ] **Step 1: Types** — in `src/shared/docker.types.ts`, add the import and fields:

```ts
import type { FrameworkKind } from './project.types'
```
Add to `DockerItem` (after `removable`):
```ts
  /** Compose project this resource is grouped under; undefined = unaffiliated ("Other"). */
  project?: string
  /** Image repository (name before the last ':'), for repo sub-grouping in "Other". */
  repository?: string
```
Add the interface + `projects` field:
```ts
export interface DockerProject {
  name: string
  workingDir?: string
  kind?: FrameworkKind
  iconDataUrl?: string
}
```
In `DockerInfo`, add `projects: DockerProject[]`. Update the four `readDockerInfo` early-return objects in `docker.ts` to include `projects: []` (done in Task 2, but the type change forces it — for THIS task, also add `projects: []` to those returns so typecheck passes).

- [ ] **Step 2: Write failing test** `docker-inspect.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseContainerInspect, parseVolumeInspect } from './docker-inspect'

const CONTAINERS = JSON.stringify([
  {
    Id: 'c1abc',
    Image: 'node:20',
    Config: { Image: 'node:20', Labels: {
      'com.docker.compose.project': 'myapp',
      'com.docker.compose.project.working_dir': '/Users/x/code/myapp',
    } },
    Mounts: [{ Type: 'volume', Name: 'myapp_pgdata' }],
  },
  { Id: 'c2def', Image: 'redis:7', Config: { Image: 'redis:7', Labels: {} }, Mounts: [] },
])

describe('parseContainerInspect', () => {
  it('extracts compose project, working_dir, image ref, and named-volume mounts', () => {
    const r = parseContainerInspect(CONTAINERS)
    expect(r[0]).toMatchObject({ id: 'c1abc', imageRef: 'node:20', project: 'myapp', workingDir: '/Users/x/code/myapp', mounts: ['myapp_pgdata'] })
    expect(r[1].project).toBeUndefined()
    expect(r[1].mounts).toEqual([])
  })
  it('survives malformed input', () => {
    expect(parseContainerInspect('not json')).toEqual([])
  })
})

describe('parseVolumeInspect', () => {
  it('maps volume name to compose project', () => {
    const json = JSON.stringify([
      { Name: 'myapp_pgdata', Labels: { 'com.docker.compose.project': 'myapp' } },
      { Name: 'loose', Labels: null },
    ])
    const m = parseVolumeInspect(json)
    expect(m.get('myapp_pgdata')).toBe('myapp')
    expect(m.has('loose')).toBe(false)
  })
})
```

- [ ] **Step 3: Run it, expect FAIL.** `pnpm test src/main/docker/docker-inspect.test.ts`

- [ ] **Step 4: Implement `docker-inspect.ts`:**

```ts
export interface InspectedContainer {
  id: string
  /** image reference the container runs (repo:tag), from Config.Image */
  imageRef: string
  /** resolved image id when present (Image field), for id-based matching */
  imageId: string
  project?: string
  workingDir?: string
  /** named volume mounts (Mounts[].Name where Type === 'volume') */
  mounts: string[]
}

const P = 'com.docker.compose.project'
const WD = 'com.docker.compose.project.working_dir'

export function parseContainerInspect(json: string): InspectedContainer[] {
  let arr: unknown
  try {
    arr = JSON.parse(json)
  } catch {
    return []
  }
  if (!Array.isArray(arr)) return []
  return arr.map((c: Record<string, unknown>) => {
    const config = (c.Config ?? {}) as Record<string, unknown>
    const labels = (config.Labels ?? {}) as Record<string, string>
    const mounts = Array.isArray(c.Mounts) ? (c.Mounts as Record<string, unknown>[]) : []
    return {
      id: String(c.Id ?? ''),
      imageRef: String(config.Image ?? c.Image ?? ''),
      imageId: String(c.Image ?? ''),
      project: labels[P] || undefined,
      workingDir: labels[WD] || undefined,
      mounts: mounts.filter((m) => m.Type === 'volume' && m.Name).map((m) => String(m.Name)),
    }
  })
}

export function parseVolumeInspect(json: string): Map<string, string> {
  const out = new Map<string, string>()
  let arr: unknown
  try {
    arr = JSON.parse(json)
  } catch {
    return out
  }
  if (!Array.isArray(arr)) return out
  for (const v of arr as Record<string, unknown>[]) {
    const labels = (v.Labels ?? {}) as Record<string, string> | null
    const project = labels?.[P]
    if (v.Name && project) out.set(String(v.Name), project)
  }
  return out
}
```

- [ ] **Step 5: Run test, expect PASS. Commit** `feat(app): docker inspect parsers (compose labels + refs)`.

- [ ] **Step 6: Write failing test** `docker-associate.test.ts`:

```ts
import type { DockerItem } from '@shared/docker.types'
import { describe, expect, it } from 'vitest'
import { associateProjects } from './docker-associate'

const mk = (o: Partial<DockerItem> & Pick<DockerItem, 'id' | 'kind' | 'name'>): DockerItem => ({
  sizeBytes: 0, createdAt: 0, inUse: false, removable: true, ...o,
})

describe('associateProjects', () => {
  it('groups a container by its compose project and lists the project', () => {
    const items = [mk({ id: 'c1abc', kind: 'container', name: 'myapp-web' })]
    const containers = [{ id: 'c1abc', imageRef: 'node:20', imageId: 'sha256:img1', project: 'myapp', workingDir: '/w/myapp', mounts: ['myapp_pgdata'] }]
    const { items: out, projects } = associateProjects(items, containers, new Map())
    expect(out[0].project).toBe('myapp')
    expect(projects).toEqual([{ name: 'myapp', workingDir: '/w/myapp' }])
  })

  it('associates an image to the single project whose container uses it (used-by)', () => {
    const items = [mk({ id: 'sha256:img1', kind: 'image', name: 'node:20' })]
    const containers = [{ id: 'c1abc', imageRef: 'node:20', imageId: 'sha256:img1', project: 'myapp', workingDir: '/w/myapp', mounts: [] }]
    const { items: out } = associateProjects(items, containers, new Map())
    expect(out[0].project).toBe('myapp')
    expect(out[0].repository).toBe('node')
  })

  it('leaves an image used by multiple projects unassociated (no double-count)', () => {
    const items = [mk({ id: 'sha256:img1', kind: 'image', name: 'node:20' })]
    const containers = [
      { id: 'a', imageRef: 'node:20', imageId: 'sha256:img1', project: 'app1', workingDir: '/w/a', mounts: [] },
      { id: 'b', imageRef: 'node:20', imageId: 'sha256:img1', project: 'app2', workingDir: '/w/b', mounts: [] },
    ]
    const { items: out } = associateProjects(items, containers, new Map())
    expect(out[0].project).toBeUndefined()
    expect(out[0].repository).toBe('node')
  })

  it('associates a volume by compose label, else by mounting container', () => {
    const items = [mk({ id: 'myapp_pgdata', kind: 'volume', name: 'myapp_pgdata' }), mk({ id: 'mounted', kind: 'volume', name: 'mounted' })]
    const containers = [{ id: 'c1', imageRef: 'x', imageId: 'x', project: 'byMount', workingDir: '/w', mounts: ['mounted'] }]
    const volProjects = new Map([['myapp_pgdata', 'myapp']])
    const { items: out } = associateProjects(items, containers, volProjects)
    expect(out.find((i) => i.name === 'myapp_pgdata')?.project).toBe('myapp')
    expect(out.find((i) => i.name === 'mounted')?.project).toBe('byMount')
  })

  it('build cache and dangling images stay unassociated; repository parsed', () => {
    const items = [mk({ id: 'bc', kind: 'buildcache', name: 'bc' }), mk({ id: 'd', kind: 'image', name: '<none>' })]
    const { items: out } = associateProjects(items, [], new Map())
    expect(out[0].project).toBeUndefined()
    expect(out[1].project).toBeUndefined()
    expect(out[1].repository).toBeUndefined() // '<none>' has no repository
  })
})
```

- [ ] **Step 7: Run it, expect FAIL. Implement `docker-associate.ts`:**

```ts
import type { DockerItem, DockerProject } from '@shared/docker.types'
import type { InspectedContainer } from './docker-inspect'

/** Repository = name before the last ':'; undefined for dangling '<none>'. */
function repositoryOf(name: string): string | undefined {
  if (name === '<none>' || !name.includes(':')) return name === '<none>' ? undefined : name
  return name.slice(0, name.lastIndexOf(':'))
}

/** The single compose project referencing this image (by id or repo:tag), or undefined if 0 or >1. */
function soleProject(projects: Set<string>): string | undefined {
  return projects.size === 1 ? [...projects][0] : undefined
}

export function associateProjects(
  items: DockerItem[],
  containers: InspectedContainer[],
  volumeProjects: Map<string, string>,
): { items: DockerItem[]; projects: DockerProject[] } {
  // project name → working_dir (from any container that carries both)
  const workingDirs = new Map<string, string>()
  // image ref/id → set of projects whose containers reference it
  const imageProjects = new Map<string, Set<string>>()
  // volume name → set of projects whose containers mount it
  const volumeMountProjects = new Map<string, Set<string>>()

  for (const c of containers) {
    if (c.project && c.workingDir && !workingDirs.has(c.project)) workingDirs.set(c.project, c.workingDir)
    if (c.project) {
      for (const key of [c.imageRef, c.imageId].filter(Boolean)) {
        if (!imageProjects.has(key)) imageProjects.set(key, new Set())
        imageProjects.get(key)!.add(c.project)
      }
      for (const vol of c.mounts) {
        if (!volumeMountProjects.has(vol)) volumeMountProjects.set(vol, new Set())
        volumeMountProjects.get(vol)!.add(c.project)
      }
    }
  }

  const byId = new Map(containers.map((c) => [c.id, c]))
  const projectNames = new Set<string>()

  const out = items.map((item): DockerItem => {
    let project: string | undefined
    let repository: string | undefined
    if (item.kind === 'container') {
      project = byId.get(item.id)?.project
    } else if (item.kind === 'image') {
      repository = repositoryOf(item.name)
      project = soleProject(imageProjects.get(item.id) ?? imageProjects.get(item.name) ?? new Set())
    } else if (item.kind === 'volume') {
      project = volumeProjects.get(item.name) ?? soleProject(volumeMountProjects.get(item.name) ?? new Set())
    }
    if (project) projectNames.add(project)
    return { ...item, project, repository }
  })

  const projects: DockerProject[] = [...projectNames].map((name) => ({
    name,
    workingDir: workingDirs.get(name),
  }))
  return { items: out, projects }
}
```

- [ ] **Step 8: Run tests, expect PASS.** Full suite + typecheck green. **Commit** `feat(app): associateProjects (compose + used-by) with types`.

### Task 2: Main-process wiring — inspect calls + per-project logo

**Files:**
- Modify: `src/main/docker/docker.ts`
- Modify: `src/main/docker/docker.test.ts`

**Interfaces:**
- Consumes: `parseContainerInspect`, `parseVolumeInspect` (Task 1), `associateProjects` (Task 1), `detectKind`/`findProjectIcon` from `../scanner/detect-kind` and `../scanner/find-project-icon`.
- Produces: `readDockerInfo` returns `DockerInfo` with enriched `items` + populated `projects` (incl. logos).

- [ ] **Step 1: Extend `readDockerInfo`** in `docker.ts`. After the existing `df` fetch + `buildDockerItems`, add the inspect + associate + logo pass. Replace the tail of `readDockerInfo` (from `const { items, totals } = buildDockerItems(parseDf(df))` onward) with:

```ts
  const { items, totals } = buildDockerItems(parseDf(df))

  // Enrich with project association (fail-soft: any inspect failure → everything in "Other").
  let enriched = items
  let projects: DockerProject[] = []
  try {
    const ids = (await run(bin, ['ps', '-aq', '--no-trunc'])).split('\n').map((s) => s.trim()).filter(Boolean)
    const containers = ids.length ? parseContainerInspect(await run(bin, ['container', 'inspect', ...ids])) : []
    const volNames = items.filter((i) => i.kind === 'volume').map((i) => i.id)
    const volProjects = volNames.length ? parseVolumeInspect(await run(bin, ['volume', 'inspect', ...volNames])) : new Map<string, string>()
    const assoc = associateProjects(items, containers, volProjects)
    enriched = assoc.items
    projects = await withLogos(assoc.projects)
  } catch {
    // leave items unassociated
  }
  return { available: true, checkedAt: now, totals, items: enriched, projects }
```

Add the helper (below `readDockerInfo`), and the imports at the top:

```ts
import type { DockerInfo, DockerProject } from '@shared/docker.types'
import { detectKind } from '../scanner/detect-kind'
import { findProjectIcon } from '../scanner/find-project-icon'
import { associateProjects } from './docker-associate'
import { parseContainerInspect, parseVolumeInspect } from './docker-inspect'
```

```ts
/** Attach a project logo (framework kind + favicon) from each project's working_dir.
 * Fail-soft per project: a missing/unreadable dir leaves kind/iconDataUrl undefined,
 * and the renderer shows a generic Docker icon. */
async function withLogos(projects: DockerProject[]): Promise<DockerProject[]> {
  return Promise.all(
    projects.map(async (p) => {
      if (!p.workingDir) return p
      try {
        const [kind, iconDataUrl] = await Promise.all([detectKind(p.workingDir), findProjectIcon(p.workingDir)])
        return { ...p, kind, iconDataUrl }
      } catch {
        return p
      }
    }),
  )
}
```

Also add `projects: []` to the four early-return objects in `readDockerInfo` (not installed / daemon not running ×2) if Task 1 did not already (it should have).

- [ ] **Step 2: Test** — extend `docker.test.ts`. The existing tests mock `./find-docker` and inject exec via `__setExecForTests`. Add a test where the injected exec answers `ps -aq`, `container inspect`, `volume inspect`, and `system df -v`, and mock the scanner:

```ts
vi.mock('../scanner/detect-kind', () => ({ detectKind: vi.fn(async () => 'node') }))
vi.mock('../scanner/find-project-icon', () => ({ findProjectIcon: vi.fn(async () => undefined) }))
```

Test asserts: given a df image `node:20` (id `sha256:img1`) and a container inspect that runs `node:20` under compose project `myapp` (working_dir `/w/myapp`), `getDockerInfo(true)` returns `info.projects` containing `{ name: 'myapp', workingDir: '/w/myapp', kind: 'node' }` and the image item has `project: 'myapp'`. Add a second test: when `container inspect` throws, items come back with `project` undefined and `projects` empty (fail-soft), still `available: true`.

- [ ] **Step 3:** Run tests, gates green. **Commit** `feat(app): docker project enrichment (inspect + logos) in readDockerInfo`.

### Task 3: Renderer grouping — `groupDockerForDisplay`

**Files:**
- Modify: `src/renderer/src/launcher/views/DockerView.constants.ts`
- Modify: `src/renderer/src/launcher/views/DockerView.constants.test.ts`

**Interfaces:**
- Produces: `DockerSortKey = 'size' | 'name' | 'recent'`; `DockerTypeFilter = 'all' | DockerItemKind`; `DisplayGroup` union; `groupDockerForDisplay(info, opts): DisplayGroup[]`. Keeps `dockerItemDetail`, `PRUNE_TARGET_LABEL`, `pruneEstimateBytes` (unchanged). `groupDockerItems` is REPLACED.

- [ ] **Step 1: Write failing test** in `DockerView.constants.test.ts` (add to the existing file; keep other tests):

```ts
import type { DockerInfo, DockerItem } from '@shared/docker.types'
import { groupDockerForDisplay } from './DockerView.constants'

const item = (o: Partial<DockerItem> & Pick<DockerItem, 'id' | 'kind' | 'name'>): DockerItem => ({
  sizeBytes: 0, createdAt: 0, inUse: false, removable: true, ...o,
})
const info = (items: DockerItem[], projects = [{ name: 'myapp', workingDir: '/w', kind: 'node' as const }]): DockerInfo => ({
  available: true, checkedAt: 0, totals: [], items, projects,
})

describe('groupDockerForDisplay', () => {
  const items = [
    item({ id: 'c1', kind: 'container', name: 'myapp-web', project: 'myapp', sizeBytes: 10 }),
    item({ id: 'i1', kind: 'image', name: 'node:20', project: 'myapp', repository: 'node', sizeBytes: 100 }),
    item({ id: 'i2', kind: 'image', name: 'redis:7', repository: 'redis', sizeBytes: 500 }),
    item({ id: 'bc', kind: 'buildcache', name: 'bc', removable: false, sizeBytes: 300 }),
    item({ id: 'v9', kind: 'volume', name: 'orphan', sizeBytes: 5 }),
  ]

  it('puts project groups first, then repository/buildcache/unaffiliated under "Other"', () => {
    const g = groupDockerForDisplay(info(items), { sortBy: 'size', typeFilter: 'all', query: '' })
    expect(g[0]).toMatchObject({ kind: 'project', project: { name: 'myapp' } })
    const kinds = g.map((x) => x.kind)
    expect(kinds).toContain('repository') // redis
    expect(kinds).toContain('buildcache')
    expect(kinds).toContain('unaffiliated') // orphan volume
    // project group before any "Other" group
    expect(kinds.indexOf('project')).toBeLessThan(kinds.indexOf('repository'))
  })

  it('sorts groups by total size when sortBy=size', () => {
    const g = groupDockerForDisplay(info(items), { sortBy: 'size', typeFilter: 'all', query: '' })
    const other = g.filter((x) => x.kind !== 'project')
    // redis repo (500) sorts before buildcache (300) before orphan volume (5)
    expect(other[0].kind === 'repository').toBe(true)
  })

  it('type filter keeps only matching items and drops empty groups', () => {
    const g = groupDockerForDisplay(info(items), { sortBy: 'size', typeFilter: 'volume', query: '' })
    expect(g.every((x) => x.items.every((i) => i.kind === 'volume'))).toBe(true)
    expect(g.some((x) => x.kind === 'repository')).toBe(false) // images filtered out
  })

  it('query filters by item name or project name', () => {
    expect(groupDockerForDisplay(info(items), { sortBy: 'size', typeFilter: 'all', query: 'redis' }).length).toBe(1)
  })
})
```

- [ ] **Step 2: Run it, expect FAIL. Implement** — in `DockerView.constants.ts`, add (keep the existing `dockerItemDetail`, `PRUNE_TARGET_LABEL`, `pruneEstimateBytes`; remove `groupDockerItems` + `DockerGroup` + `GROUP_ORDER`):

```ts
import type { DockerInfo, DockerItem, DockerItemKind, DockerProject } from '@shared/docker.types'

export type DockerSortKey = 'size' | 'name' | 'recent'
export type DockerTypeFilter = 'all' | DockerItemKind

export type DisplayGroup =
  | { kind: 'project'; id: string; label: string; project: DockerProject; items: DockerItem[] }
  | { kind: 'repository'; id: string; label: string; items: DockerItem[] }
  | { kind: 'buildcache'; id: string; label: string; items: DockerItem[] }
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

  // Project groups
  const projectGroups: DisplayGroup[] = []
  for (const p of info.projects) {
    const of = items.filter((i) => i.project === p.name).sort(bySizeDesc)
    if (of.length) projectGroups.push({ kind: 'project', id: `project:${p.name}`, label: p.name, project: p, items: of })
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
  for (const [repo, of] of repos) repoGroups.push({ kind: 'repository', id: `repo:${repo}`, label: repo, items: of.sort(bySizeDesc) })

  const cache = other.filter((i) => i.kind === 'buildcache').sort(bySizeDesc)
  const buildcacheGroup: DisplayGroup[] = cache.length ? [{ kind: 'buildcache', id: 'buildcache', label: 'Build cache', items: cache }] : []

  const rest = other.filter((i) => i.kind !== 'buildcache' && !(i.kind === 'image' && i.repository)).sort(bySizeDesc)
  const unaffiliatedGroup: DisplayGroup[] = rest.length ? [{ kind: 'unaffiliated', id: 'unaffiliated', label: 'Not linked to a project', items: rest }] : []

  return [...sortGroups(projectGroups, opts.sortBy), ...sortGroups([...repoGroups, ...buildcacheGroup, ...unaffiliatedGroup], opts.sortBy)]
}
```

- [ ] **Step 3: Run tests, expect PASS.** Gates green. **Commit** `feat(app): project-aware docker grouping (groupDockerForDisplay)`.

### Task 4: DockerView rework + TypeBadge + project icon

**Files:**
- Create: `src/renderer/src/components/TypeBadge/TypeBadge.tsx` (+ `index.ts`)
- Modify: `src/renderer/src/launcher/views/DockerView.tsx`, `DockerView.types.ts`

**Interfaces:**
- Consumes: `groupDockerForDisplay`, `DockerSortKey`, `DockerTypeFilter` (Task 3); `ProjectIcon` (`@renderer/components/ProjectIcon`); the existing `onRemove(item)`/`onPrune(target)`/`busyId` props.
- `DockerViewProps` gains `sortBy: DockerSortKey`, `typeFilter: DockerTypeFilter` (both provided by LauncherApp in Task 5).

- [ ] **Step 1: `TypeBadge.tsx`** — a small chip mapping `DockerItemKind` → label + color (image=IMAGE, volume=VOLUME, container=CONTAINER, buildcache=CACHE), styled with the existing CSS vars (`--surface-2`, `--text-3`). One-line pure component; no test needed (JSX). Export via `index.ts`.

- [ ] **Step 2: Rework `DockerView.tsx`** — replace `groupDockerItems` usage with `groupDockerForDisplay(info, { sortBy, typeFilter, query })`. Render:
  - A `'Not linked to a project'` divider row before the first non-`project` group (once).
  - Group header: for `kind === 'project'`, render the logo via a small local `DockerProjectIcon` that renders `<ProjectIcon p={{ kind: group.project.kind ?? 'node', iconDataUrl: group.project.iconDataUrl }} size={22} />` when `group.project.kind` is defined, else a generic `UIIcon.box`/docker glyph (so a logo-less compose project still gets an icon). Plus the label + total size + count. For `repository`/`buildcache`/`unaffiliated`, a plain header with a generic icon.
  - Rows: keep using `CacheRow` (icon from a per-kind map, name, `dockerItemDetail`, size), and add the `<TypeBadge kind={item.kind} />` into the row (pass through a new `badge` slot on `CacheRow`, or render the badge in the `detail`/name area — reuse `CacheRow`'s existing structure; if `CacheRow` can't host a badge, render the row inline in DockerView instead of via CacheRow, preserving the same `onAction`/size/selected props so behavior is identical). The row's remove button must still call `onRemove(item)` with the real `item` (unchanged).
  - Keep the per-group prune buttons where they apply: image/repository groups → dangling/unused image prune; buildcache group → build cache prune; volume-bearing groups → unused volumes prune; container groups → stopped containers prune. Use `GROUP_PRUNE_TARGETS`-style mapping keyed by the group's item kinds.
  - Preserve the `loading`/unavailable/empty states already in the file.

- [ ] **Step 3:** `pnpm typecheck && pnpm build`; run `pnpm test` (the pure tests cover the logic). **Commit** `feat(app): DockerView project-grouped rendering + type badges`.

### Task 5: LauncherApp — sort tabs + type-filter chips

**Files:**
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`, `LauncherApp.types.ts`

- [ ] **Step 1:** In `LauncherApp.types.ts` (or inline), add `DockerSortKey`/`DockerTypeFilter` re-exports if needed. In `LauncherApp.tsx` add state: `const [dockerSortBy, setDockerSortBy] = useState<DockerSortKey>('size')` and `const [dockerTypeFilter, setDockerTypeFilter] = useState<DockerTypeFilter>('all')` (import the types from `../views/DockerView.constants`).

- [ ] **Step 2:** In the `cc-listhead` area where the Projects/Packages sort tabs render (search `tab === 'packages'` sort block), add a `tab === 'docker'` block with: three `SortTab`s (Size → 'size', Name → 'name', Recent → 'recent') bound to `dockerSortBy`/`setDockerSortBy`, plus a small type-filter chip row (All/Images/Volumes/Containers/Cache) bound to `dockerTypeFilter`. Mirror the existing `SortTab` markup.

- [ ] **Step 3:** Pass `sortBy={dockerSortBy}` and `typeFilter={dockerTypeFilter}` into `<DockerView ... />` in the body switch. Do NOT touch the `dockerConfirm`/`commitDockerConfirm`/`onRemove`/`onPrune` wiring.

- [ ] **Step 4:** `pnpm typecheck && pnpm test && pnpm lint && pnpm build`. **Commit** `feat(app): docker sort tabs + type-filter chips`.

### Task 6: Integration verify + STATUS + PR

- [ ] **Step 1: Safety regression check** — confirm the volume typed-confirm path is untouched: `grep -n "dockerConfirmBlocked\|commitDockerConfirm" src/renderer/src/launcher/LauncherApp/LauncherApp.tsx` still shows the guard; run the full suite (existing `docker-confirm`, `register-ipc`, `docker*` tests green).
- [ ] **Step 2:** Full gates: `pnpm typecheck && pnpm test && pnpm lint && pnpm build`.
- [ ] **Step 3:** Update `STATUS.html` (note the Docker display redesign under the M1d Docker item or a follow-on line; bump `updated`; log entry; a userAction noting the manual daemon+compose test). Manual verification is a user action (needs a real daemon with a compose project).
- [ ] **Step 4:** Push `feat/docker-project-grouping`; open a PR based on `feat/docker-cleanup` (it stacks on PR #40) with a summary + the manual-test checklist; confirm CI green.
