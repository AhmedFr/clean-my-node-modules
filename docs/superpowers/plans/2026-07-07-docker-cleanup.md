# Docker Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a launcher "Docker" tab that lists Docker images/volumes/stopped-containers/build-cache with size, created date, and in-use status, and reclaims space via the `docker` CLI, with a tiered permanent-delete safety model.

**Architecture:** Clone the pnpm-store/Caches feature end to end: `src/shared/docker.types.ts` (data model), `src/main/docker/` (find-docker + cached CLI wrappers via `execFileAsync`, no shell), gated IPC handlers in `register-ipc.ts`, and a `DockerView` renderer tab. Listing is free (ungated); every mutation opens with the license gate. Docker removals are permanent (no Trash), so volumes get an extra typed-name confirmation and in-use items are read-only.

**Tech Stack:** Electron + TypeScript, React renderer, vitest (`pnpm test`), biome (`pnpm lint`), electron-vite (`pnpm build`), two tsconfig typechecks (`pnpm typecheck`). Spec: `docs/superpowers/specs/2026-07-07-docker-cleanup-design.md`.

## Global Constraints

- Package manager: pnpm. All gates green per task: `pnpm typecheck && pnpm test && pnpm lint && pnpm build`.
- All `docker` CLI calls use `promisify(execFile)` with **array args, no shell** (injection-safe) and a timeout. Never interpolate item names/ids into a shell string.
- Every mutating IPC handler OPENS with `if (!ctx.license.get().pro) return { ok: false, freedBytes: 0 }` (read-only `docker:get` is ungated).
- In-use items are never force-removed: `removable === false` ⇒ no remove action. No `-f` on `rmi`/`rm`/`volume rm` of in-use items (the `-f` on `prune` only skips docker's own y/N prompt).
- Volume removals (per-item and unused-volume prune) require a typed-name confirmation in the UI before the IPC call is made.
- Docker removals are labeled "permanent, not sent to the Trash" in the UI.
- Follow existing conventions: one folder per component; shared types in `src/shared`; biome formatting (single quotes, no semicolons, 2-space).
- Commit style `feat(app): …` / `test(app): …`; run gates before each commit.

## File Structure

- Create `src/shared/docker.types.ts` — data model.
- Create `src/main/docker/find-docker.ts` — binary resolution (mirrors `find-pnpm.ts`).
- Create `src/main/docker/docker-parse.ts` — pure parsers (`docker system df -v` + `docker ps -a` → `DockerItem[]`/totals). Pure, no exec — fully unit-tested.
- Create `src/main/docker/docker.ts` — `getDockerInfo`, `removeDockerItem`, `pruneDocker` (exec + cache; exec injected for tests).
- Create `src/main/docker/validate-docker-arg.ts` — IPC payload validation (kind/id/prune target).
- Modify `src/shared/ipc.constants.ts`, `src/shared/settings.types.ts`, `src/shared/settings.constants.ts`, `src/main/settings/validate-setting.ts`, `src/main/analytics/analytics.ts`.
- Modify `src/main/ipc/register-ipc.ts`, `src/preload/index.ts`, `src/preload/api.types.ts`.
- Create `src/renderer/src/hooks/useDocker.ts`, `src/renderer/src/launcher/views/DockerView.tsx`.
- Modify `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`, `.../LauncherApp.types.ts`, `.../components/Segmented`, `SettingsView.tsx`.

---

## PHASE A — read-only listing (free, ungated)

### Task 1: Shared model, IPC channels, settings keys

**Files:**
- Create: `src/shared/docker.types.ts`
- Modify: `src/shared/ipc.constants.ts`, `src/shared/settings.types.ts`, `src/shared/settings.constants.ts`
- Modify + Test: `src/main/settings/validate-setting.ts`, `src/main/settings/validate-setting.test.ts`

**Interfaces:**
- Produces: `DockerItemKind`, `DockerItem`, `DockerCategoryTotal`, `DockerInfo`, `DockerActionResult`, `DockerPruneTarget`; IPC channels `getDocker='docker:get'`, `removeDockerItem='docker:remove'`, `pruneDocker='docker:prune'`; settings `docker?: boolean`, `dockerBinaryPath?: string`.

- [ ] **Step 1: Create `src/shared/docker.types.ts`**

```ts
export type DockerItemKind = 'image' | 'volume' | 'container' | 'buildcache'

export type DockerPruneTarget =
  | 'danglingImages'
  | 'unusedImages'
  | 'stoppedContainers'
  | 'buildCache'
  | 'unusedVolumes'

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
}

export interface DockerActionResult {
  ok: boolean
  freedBytes: number
}
```

- [ ] **Step 2: Add IPC channels** to `src/shared/ipc.constants.ts` — after the `getPackages`/`computePackages` lines, add:

```ts
  getDocker: 'docker:get',
  removeDockerItem: 'docker:remove',
  pruneDocker: 'docker:prune',
```

- [ ] **Step 3: Add settings keys** — in `src/shared/settings.types.ts`, inside `Settings`, after `pnpmBinaryPath?: string`:

```ts
  /** Show the Docker tab and allow Docker cleanup. */
  docker?: boolean
  /** Manual override: path to the docker executable. */
  dockerBinaryPath?: string
```

In `src/shared/settings.constants.ts`, add to `DEFAULT_SETTINGS` (after `analytics: true,`):

```ts
  docker: true,
```

- [ ] **Step 4: Write failing test** — append to `src/main/settings/validate-setting.test.ts`:

```ts
  it('validates the docker settings keys', () => {
    expect(coerceSetting('docker', true)).toEqual({ key: 'docker', value: true })
    expect(coerceSetting('docker', 'yes')).toBeNull()
    expect(coerceSetting('dockerBinaryPath', ' /usr/local/bin/docker ')).toEqual({
      key: 'dockerBinaryPath',
      value: '/usr/local/bin/docker',
    })
    expect(coerceSetting('dockerBinaryPath', 42)).toBeNull()
  })
```

- [ ] **Step 5: Run it, expect FAIL** — `pnpm test src/main/settings/validate-setting.test.ts` → fails (`docker` hits the `default: return null`).

- [ ] **Step 6: Implement** — in `src/main/settings/validate-setting.ts`, add a `docker` boolean case next to `checkUpdates`, and add `dockerBinaryPath` to the path-string case:

```ts
    case 'checkUpdates':
    case 'docker':
      return typeof value === 'boolean' ? { key, value } : null
```

```ts
    case 'pnpmStorePath':
    case 'pnpmBinaryPath':
    case 'dockerBinaryPath':
      return typeof value === 'string' ? { key, value: value.trim() } : null
```

- [ ] **Step 7: Gates + commit** — `pnpm typecheck && pnpm test && pnpm lint`; `git commit -m "feat(app): Docker shared model, IPC channels, settings keys"`.

### Task 2: `find-docker.ts` — resolve the docker binary

**Files:**
- Create: `src/main/docker/find-docker.ts`
- Create Test: `src/main/docker/find-docker.test.ts`

**Interfaces:**
- Consumes: `versionManagerBinDirs`, `nvmNodeBins` from `../pnpm-store/runtime-bins`; `pnpmExecEnv` from `../pnpm-store/find-node`.
- Produces: `dockerCandidates(env, home, nvmBins, overrideBin?): string[]`, `findDocker(overrideBin?): Promise<string | null>`, and re-exports the spawn env as `dockerExecEnv = pnpmExecEnv`.

- [ ] **Step 1: Write failing test** — `src/main/docker/find-docker.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { dockerCandidates } from './find-docker'

describe('dockerCandidates', () => {
  it('puts an explicit override first and includes Docker Desktop + homebrew paths', () => {
    const c = dockerCandidates({ PATH: '/usr/bin' }, '/Users/x', [], '/opt/homebrew/bin/docker')
    expect(c[0]).toBe('/opt/homebrew/bin/docker')
    expect(c).toContain('/usr/local/bin/docker')
    expect(c).toContain('/Applications/Docker.app/Contents/Resources/bin/docker')
  })

  it('dedupes and works with no override', () => {
    const c = dockerCandidates({ PATH: '/usr/local/bin' }, '/Users/x', [])
    expect(new Set(c).size).toBe(c.length)
    expect(c).toContain('/usr/local/bin/docker')
  })
})
```

- [ ] **Step 2: Run it, expect FAIL** — `pnpm test src/main/docker/find-docker.test.ts` (module missing).

- [ ] **Step 3: Implement `src/main/docker/find-docker.ts`**

```ts
import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { pnpmExecEnv } from '../pnpm-store/find-node'
import { nvmNodeBins, versionManagerBinDirs } from '../pnpm-store/runtime-bins'

/** Finder-launched apps get a minimal PATH; reuse the pnpm spawn env (real PATH). */
export const dockerExecEnv = pnpmExecEnv

/**
 * Candidate docker binary locations: an explicit override first, then every
 * runtime bin dir, then the standard Docker Desktop / Homebrew / /usr/local
 * install paths. Deduped, order-preserving.
 */
export function dockerCandidates(
  env: NodeJS.ProcessEnv,
  home: string,
  nvmBins: string[] = [],
  overrideBin?: string,
): string[] {
  const fromBinDirs = versionManagerBinDirs(env, home, nvmBins).map((dir) => join(dir, 'docker'))
  const standard = [
    '/usr/local/bin/docker',
    '/opt/homebrew/bin/docker',
    '/Applications/Docker.app/Contents/Resources/bin/docker',
  ]
  const all = overrideBin ? [overrideBin, ...fromBinDirs, ...standard] : [...fromBinDirs, ...standard]
  return [...new Set(all)]
}

let resolved: string | null | undefined

/** Resolves the docker binary; null when not installed. Override bypasses the cache. */
export async function findDocker(overrideBin?: string): Promise<string | null> {
  if (overrideBin === undefined && resolved !== undefined) return resolved
  const home = homedir()
  const candidates = dockerCandidates(process.env, home, await nvmNodeBins(home), overrideBin || undefined)
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK)
      if (overrideBin === undefined) resolved = candidate
      return candidate
    } catch {
      // keep looking
    }
  }
  if (overrideBin === undefined) resolved = null
  return null
}
```

- [ ] **Step 4: Run test, expect PASS.** Gates + commit `feat(app): find-docker binary resolution`.

### Task 3: `docker-parse.ts` — pure parsers (the core logic)

**Files:**
- Create: `src/main/docker/docker-parse.ts`
- Create Test: `src/main/docker/docker-parse.test.ts`

**Interfaces:**
- Produces:
  - `parseDf(dfJson: string): { images: DfImage[]; volumes: DfVolume[]; containers: DfContainer[]; buildCache: DfCache[] }`
  - `parseContainers(psJsonLines: string): PsContainer[]`
  - `buildDockerItems(df, ps): { items: DockerItem[]; totals: DockerCategoryTotal[] }`
  - Consumed by Task 4.

`docker system df -v --format '{{json .}}'` prints ONE JSON object with arrays `Images`, `Containers`, `Volumes`, `BuildCache`. Sizes come as human strings ("1.2GB", "512MB", "0B") and must be parsed to bytes. `docker ps -a --format '{{json .}}'` prints ONE JSON object PER LINE.

- [ ] **Step 1: Write failing test** — `src/main/docker/docker-parse.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildDockerItems, parseContainers, parseDf, parseSize } from './docker-parse'

const DF = JSON.stringify({
  Images: [
    { ID: 'sha256:aaa', Repository: 'node', Tag: '20', CreatedAt: '2026-01-02 10:00:00 +0000 UTC', Size: '1.1GB', Containers: '1' },
    { ID: 'sha256:bbb', Repository: '<none>', Tag: '<none>', CreatedAt: '2026-01-01 10:00:00 +0000 UTC', Size: '400MB', Containers: '0' },
  ],
  Volumes: [
    { Name: 'pgdata', Size: '2.0GB', Links: '1' },
    { Name: 'scratch', Size: '512MB', Links: '0' },
  ],
  Containers: [
    { ID: 'ctr111', Names: 'web', State: 'running', Image: 'node:20', CreatedAt: '2026-01-03 10:00:00 +0000 UTC', Size: '10MB' },
    { ID: 'ctr222', Names: 'old', State: 'exited', Image: 'node:20', CreatedAt: '2026-01-02 09:00:00 +0000 UTC', Size: '5MB' },
  ],
  BuildCache: [{ ID: 'cache1', Size: '800MB', CreatedAt: '2026-01-01 08:00:00 +0000 UTC', InUse: 'false' }],
})

describe('parseSize', () => {
  it('parses docker human sizes to bytes', () => {
    expect(parseSize('0B')).toBe(0)
    expect(parseSize('512MB')).toBe(512 * 1000 * 1000)
    expect(parseSize('1.1GB')).toBeCloseTo(1.1 * 1e9, -6)
    expect(parseSize('')).toBe(0)
  })
})

describe('buildDockerItems', () => {
  const df = parseDf(DF)
  const ps = parseContainers('') // df already carries containers; ps not needed for this fixture
  const { items, totals } = buildDockerItems(df, ps)

  it('marks dangling/untagged images unused+removable and tagged-in-container in-use', () => {
    const dangling = items.find((i) => i.id === 'sha256:bbb')
    expect(dangling?.inUse).toBe(false)
    expect(dangling?.removable).toBe(true)
    const used = items.find((i) => i.id === 'sha256:aaa')
    expect(used?.inUse).toBe(true) // Containers > 0
    expect(used?.removable).toBe(false)
  })

  it('marks volumes with Links>0 in-use (not removable) and Links=0 removable', () => {
    expect(items.find((i) => i.name === 'pgdata')?.removable).toBe(false)
    expect(items.find((i) => i.name === 'scratch')?.removable).toBe(true)
  })

  it('only stopped containers are removable', () => {
    expect(items.find((i) => i.id === 'ctr111')?.removable).toBe(false) // running
    expect(items.find((i) => i.id === 'ctr222')?.removable).toBe(true) // exited
  })

  it('build-cache rows are never per-item removable', () => {
    expect(items.find((i) => i.kind === 'buildcache')?.removable).toBe(false)
  })

  it('totals reclaimable = sum of removable item sizes per kind', () => {
    const vol = totals.find((t) => t.kind === 'volume')
    expect(vol?.reclaimableBytes).toBe(512 * 1000 * 1000) // only scratch
    expect(vol?.count).toBe(2)
  })
})
```

- [ ] **Step 2: Run it, expect FAIL.**

- [ ] **Step 3: Implement `src/main/docker/docker-parse.ts`**

```ts
import type { DockerCategoryTotal, DockerItem, DockerItemKind } from '@shared/docker.types'

// docker prints decimal (SI) sizes: 1kB = 1000 B.
const UNIT: Record<string, number> = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KIB: 1024, MIB: 1024 ** 2, GIB: 1024 ** 3 }

/** "1.1GB" | "512MB" | "0B" → bytes. Unknown/empty → 0. */
export function parseSize(s: string): number {
  const m = /^([\d.]+)\s*([A-Za-z]+)$/.exec((s ?? '').trim())
  if (!m) return 0
  const n = Number(m[1])
  const mult = UNIT[m[2].toUpperCase()] ?? 0
  return Number.isFinite(n) ? Math.round(n * mult) : 0
}

/** "2026-01-02 10:00:00 +0000 UTC" → ms epoch (0 if unparseable). */
export function parseDate(s: string): number {
  if (!s) return 0
  const t = Date.parse(s.replace(' UTC', '').replace(' +0000', 'Z').replace(' ', 'T'))
  return Number.isFinite(t) ? t : 0
}

export interface DfImage { ID: string; Repository: string; Tag: string; CreatedAt: string; Size: string; Containers: string }
export interface DfVolume { Name: string; Size: string; Links: string }
export interface DfContainer { ID: string; Names: string; State: string; Image: string; CreatedAt: string; Size: string }
export interface DfCache { ID: string; Size: string; CreatedAt: string; InUse: string }
export interface DfParsed { images: DfImage[]; volumes: DfVolume[]; containers: DfContainer[]; buildCache: DfCache[] }

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

export interface PsContainer { ID: string; Image: string; State: string }

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

export function buildDockerItems(df: DfParsed, _ps: PsContainer[]): { items: DockerItem[]; totals: DockerCategoryTotal[] } {
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
    items.push({ id: vol.Name, kind: 'volume', name: vol.Name, sizeBytes: parseSize(vol.Size), createdAt: 0, inUse, removable: !inUse })
  }
  for (const c of df.containers) {
    const running = c.State === 'running'
    items.push({
      id: c.ID,
      kind: 'container',
      name: c.Names || c.ID.slice(0, 12),
      sizeBytes: parseSize(c.Size),
      createdAt: parseDate(c.CreatedAt),
      inUse: running,
      removable: !running,
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
```

Note: the `_ps` param is reserved — for this df-driven derivation the image in-use flag comes from `Images[].Containers`; the ps list is threaded through for a future refinement and kept in the signature so Task 4 wires it without a signature change.

- [ ] **Step 4: Run test, expect PASS.** Gates + commit `feat(app): docker df/ps parsers`.

### Task 4: `docker.ts` — availability + cached `getDockerInfo`

**Files:**
- Create: `src/main/docker/docker.ts`
- Create Test: `src/main/docker/docker.test.ts`

**Interfaces:**
- Consumes: `findDocker`, `dockerExecEnv` (Task 2); `parseDf`, `parseContainers`, `buildDockerItems` (Task 3).
- Produces: `getDockerInfo(force?, opts?): Promise<DockerInfo>` and an injectable `__setExecForTests(fn)` seam. `opts: { binaryPath?: string }`.

- [ ] **Step 1: Write failing test** — `src/main/docker/docker.test.ts` (inject a fake exec so no daemon is needed):

```ts
import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp/tidydisk-test' } }))
vi.mock('./find-docker', () => ({
  findDocker: vi.fn(async () => '/usr/local/bin/docker'),
  dockerExecEnv: vi.fn(async () => ({})),
}))

import { __setExecForTests, getDockerInfo } from './docker'

const DF = JSON.stringify({
  Images: [{ ID: 'i1', Repository: '<none>', Tag: '<none>', CreatedAt: '', Size: '400MB', Containers: '0' }],
  Volumes: [], Containers: [], BuildCache: [],
})

describe('getDockerInfo', () => {
  it('reports available with parsed items when the daemon responds', async () => {
    __setExecForTests(async (_bin, args) => {
      if (args[0] === 'version') return { stdout: '27.0.0', stderr: '' }
      if (args[0] === 'system' && args[1] === 'df') return { stdout: DF, stderr: '' }
      return { stdout: '', stderr: '' }
    })
    const info = await getDockerInfo(true)
    expect(info.available).toBe(true)
    expect(info.items).toHaveLength(1)
    expect(info.items[0].removable).toBe(true)
  })

  it('reports daemon not running when version fails', async () => {
    __setExecForTests(async (_bin, args) => {
      if (args[0] === 'version') throw new Error('Cannot connect to the Docker daemon')
      return { stdout: '', stderr: '' }
    })
    const info = await getDockerInfo(true)
    expect(info.available).toBe(false)
    expect(info.reason).toBe('daemon not running')
  })
})
```

- [ ] **Step 2: Run it, expect FAIL.**

- [ ] **Step 3: Implement `src/main/docker/docker.ts`**

```ts
import { execFile } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import type { DockerInfo } from '@shared/docker.types'
import { app } from 'electron'
import { buildDockerItems, parseContainers, parseDf } from './docker-parse'
import { dockerExecEnv, findDocker } from './find-docker'

const CLI_TIMEOUT_MS = 60_000
const PRUNE_TIMEOUT_MS = 10 * 60_000
const MAX_BUFFER = 32 * 1024 * 1024

type Exec = (bin: string, args: string[], opts: { timeout: number; env: NodeJS.ProcessEnv; maxBuffer: number }) => Promise<{ stdout: string; stderr: string }>

let execImpl: Exec = promisify(execFile) as unknown as Exec
/** Test seam: swap the exec used by all docker calls. */
export function __setExecForTests(fn: Exec): void {
  execImpl = fn
}

export interface DockerOpts { binaryPath?: string }

let cached: DockerInfo | null = null
let cachedKey = ''
let diskLoaded = false
let inFlight: Promise<DockerInfo> | null = null

const cacheFile = (): string => join(app.getPath('userData'), 'docker-cache.json')

function loadDiskCache(): void {
  if (diskLoaded) return
  diskLoaded = true
  try {
    const raw = JSON.parse(readFileSync(cacheFile(), 'utf8')) as { key: string; info: DockerInfo }
    if (raw?.info) {
      cached = raw.info
      cachedKey = raw.key ?? ''
    }
  } catch {
    // no cache yet
  }
}

function saveDiskCache(): void {
  if (!cached) return
  try {
    const file = cacheFile()
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify({ key: cachedKey, info: cached }))
  } catch (err) {
    console.error('Failed to persist docker cache', err)
  }
}

async function run(bin: string, args: string[], timeout = CLI_TIMEOUT_MS): Promise<string> {
  const env = (await dockerExecEnv()) as NodeJS.ProcessEnv
  const { stdout } = await execImpl(bin, args, { timeout, env, maxBuffer: MAX_BUFFER })
  return stdout
}

async function readDockerInfo(opts: DockerOpts): Promise<DockerInfo> {
  const now = Date.now()
  const bin = await findDocker(opts.binaryPath)
  if (!bin) return { available: false, reason: 'not installed', checkedAt: now, totals: [], items: [] }
  try {
    await run(bin, ['version', '--format', '{{.Server.Version}}'])
  } catch {
    return { available: false, reason: 'daemon not running', checkedAt: now, totals: [], items: [] }
  }
  let df = ''
  let ps = ''
  try {
    df = await run(bin, ['system', 'df', '-v', '--format', '{{json .}}'])
    ps = await run(bin, ['ps', '-a', '--no-trunc', '--format', '{{json .}}'])
  } catch {
    return { available: false, reason: 'daemon not running', checkedAt: now, totals: [], items: [] }
  }
  const { items, totals } = buildDockerItems(parseDf(df), parseContainers(ps))
  return { available: true, checkedAt: now, totals, items }
}

export async function getDockerInfo(force = false, opts: DockerOpts = {}): Promise<DockerInfo> {
  loadDiskCache()
  const key = opts.binaryPath ?? ''
  if (!force && cached && key === cachedKey) return cached
  if (inFlight) return inFlight
  const pending = (async (): Promise<DockerInfo> => {
    const info = await readDockerInfo(opts)
    cached = info
    cachedKey = key
    saveDiskCache()
    return info
  })()
  inFlight = pending
  void pending.finally(() => {
    if (inFlight === pending) inFlight = null
  })
  return pending
}

export { CLI_TIMEOUT_MS, PRUNE_TIMEOUT_MS, run }
```

- [ ] **Step 4: Run test, expect PASS.** Gates + commit `feat(app): getDockerInfo with availability probe + cache`.

### Task 5: IPC `docker:get` + preload bridge

**Files:**
- Modify: `src/main/ipc/register-ipc.ts`, `src/preload/index.ts`, `src/preload/api.types.ts`

**Interfaces:**
- Produces: `window.clean.getDocker(force?): Promise<DockerInfo>`.

- [ ] **Step 1: Register the read-only handler** — in `register-ipc.ts`, import at top:

```ts
import { getDockerInfo } from '../docker/docker'
```

and add near the `getPnpmStore` handler (ungated — listing is free):

```ts
  ipcMain.handle(IPC.getDocker, (_e, force?: boolean) => {
    const s = ctx.settings.get()
    return getDockerInfo(force, { binaryPath: s.dockerBinaryPath })
  })
```

- [ ] **Step 2: Preload** — in `src/preload/index.ts` add after `getPnpmStore`:

```ts
  getDocker: (force) => ipcRenderer.invoke(IPC.getDocker, force),
```

In `src/preload/api.types.ts` add the import and method:

```ts
import type { DockerInfo } from '@shared/docker.types'
```
```ts
  getDocker(force?: boolean): Promise<DockerInfo>
```

- [ ] **Step 3: Gates + commit** — `pnpm typecheck && pnpm test && pnpm lint && pnpm build`; `git commit -m "feat(app): docker:get IPC + preload"`.

### Task 6: `useDocker` hook + `DockerView` + tab wiring

**Files:**
- Create: `src/renderer/src/hooks/useDocker.ts`, `src/renderer/src/launcher/views/DockerView.tsx`
- Create Test: `src/renderer/src/launcher/views/DockerView.test.tsx`
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.types.ts`, `LauncherApp.tsx`, `SortTab` usage, `Segmented` options

**Interfaces:**
- Consumes: `window.clean.getDocker`.
- Produces: `useDocker()` → `{ info, loading, refresh, remove, prune }` (remove/prune added in Phase B — for Task 6 provide `info/loading/refresh` and stub `remove/prune` returning null so the view compiles; Task 9 fills them).

- [ ] **Step 1: Implement `useDocker.ts`** (Phase-A subset; Phase B extends it):

```ts
import type { DockerInfo } from '@shared/docker.types'
import { useCallback, useEffect, useState } from 'react'

export function useDocker(): {
  info: DockerInfo | null
  loading: boolean
  refresh: () => Promise<void>
} {
  const [info, setInfo] = useState<DockerInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    void window.clean.getDocker().then((i) => {
      if (alive) {
        setInfo(i)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      setInfo(await window.clean.getDocker(true))
    } finally {
      setLoading(false)
    }
  }, [])

  return { info, loading, refresh }
}
```

- [ ] **Step 2: Write failing test** — `DockerView.test.tsx` (render grouping + query filter + unavailable state). Use the repo's existing renderer test setup (vitest + jsdom; see `PackagesView`/`CachesView` tests if present, else `@testing-library/react`). Assert: given a `DockerInfo` with an image + a volume, both group headers render; a `query` of "node" filters to the node image; an unavailable `info` renders `reason`.

```tsx
import { render, screen } from '@testing-library/react'
import type { DockerInfo } from '@shared/docker.types'
import { describe, expect, it } from 'vitest'
import { DockerView } from './DockerView'

const base: DockerInfo = { available: true, checkedAt: 0, totals: [], items: [
  { id: 'i1', kind: 'image', name: 'node:20', sizeBytes: 1e9, createdAt: 0, inUse: false, removable: true },
  { id: 'v1', kind: 'volume', name: 'pgdata', sizeBytes: 2e9, createdAt: 0, inUse: true, removable: false },
] }

describe('DockerView', () => {
  it('groups by category and filters by query', () => {
    const { rerender } = render(<DockerView info={base} loading={false} query="" onRefresh={() => {}} />)
    expect(screen.getByText('Images')).toBeTruthy()
    expect(screen.getByText('Volumes')).toBeTruthy()
    rerender(<DockerView info={base} loading={false} query="node" onRefresh={() => {}} />)
    expect(screen.queryByText('pgdata')).toBeNull()
    expect(screen.getByText('node:20')).toBeTruthy()
  })

  it('shows the reason when docker is unavailable', () => {
    render(<DockerView info={{ available: false, reason: 'daemon not running', checkedAt: 0, totals: [], items: [] }} loading={false} query="" onRefresh={() => {}} />)
    expect(screen.getByText(/daemon not running/i)).toBeTruthy()
  })
})
```

- [ ] **Step 3: Run it, expect FAIL.**

- [ ] **Step 4: Implement `DockerView.tsx`** — Phase-A read-only view. Props: `{ info, loading, query, onRefresh, selectedIndex?, onSelectIndex?, onRemove?, onPrune? }` (remove/prune optional; unused in Phase A). Group `info.items` into the four kinds; render a section header per non-empty group (`Images`, `Volumes`, `Containers`, `Build cache`), each a list of `CacheRow`s (icon per kind from `UIIcon`; `detail` = `${created} · ${inUse ? 'in use' : 'unused'}` using `relativeTime(createdAt)` when `createdAt>0` else 'unknown date'; `size`; NO action button in Phase A). When `!info?.available`, render the centered reason state (clone the `CachesView` unavailable/empty markup). Filter items by `query` (name includes, case-insensitive).

- [ ] **Step 5: Tab wiring in `LauncherApp`:**
  - `LauncherApp.types.ts`: `export type LauncherTab = 'projects' | 'caches' | 'packages' | 'docker'`.
  - `Segmented` options array: add `{ value: 'docker', label: 'Docker' }`.
  - `⌘1..⌘4` branch — replace the `'1'|'2'|'3'` guard with `'1'..'4'` and map `'4' → 'docker'`:
    ```ts
    if (meta && ['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault()
      setTab(e.key === '1' ? 'projects' : e.key === '2' ? 'caches' : e.key === '3' ? 'packages' : 'docker')
      setSel(0); setConfirm(null); setUnlock(null); collapsePkg()
      return
    }
    ```
  - `⌘R` refresh branch: add `else if (tab === 'docker') void docker.refresh()`.
  - Body switch: add a `tab === 'docker'` branch rendering `<DockerView info={docker.info} loading={docker.loading} query={query} onRefresh={() => void docker.refresh()} />`. Instantiate `const docker = useDocker()` near the other hooks.

- [ ] **Step 6: Run test, gates, commit** `feat(app): Docker tab (read-only listing)`. Deliverable: launching the app on a machine with Docker shows a populated Docker tab; without Docker, an explanatory state.

### Task 7: Settings toggle + docker binary override

**Files:**
- Modify: `src/renderer/src/launcher/views/SettingsView.tsx`

- [ ] **Step 1:** Add a `Toggle` row bound to `settings.docker ?? true` calling `setSetting('docker', v)` (clone the `checkUpdates` toggle block), labeled "Docker cleanup" / "Show the Docker tab and let you reclaim image, volume, container and build-cache space." Add an optional path override input for `dockerBinaryPath` (clone the pnpm binary override row). 
- [ ] **Step 2:** Gate the Docker tab's Segmented option on `settings.docker !== false` in `LauncherApp` (hide the tab when the user disables it; default shows it).
- [ ] **Step 3:** Gates + commit `feat(app): Docker settings toggle + binary override`.

---

## PHASE B — cleanup actions (Pro-gated, permanent)

### Task 8: `docker.ts` — `removeDockerItem` + `pruneDocker`

**Files:**
- Modify + Test: `src/main/docker/docker.ts`, `src/main/docker/docker.test.ts`

**Interfaces:**
- Produces:
  - `removeDockerItem(kind: DockerItemKind, id: string, opts?): Promise<DockerActionResult>`
  - `pruneDocker(target: DockerPruneTarget, opts?): Promise<DockerActionResult>`
  - freed bytes via `docker system df` (grand total) before/after diff.

- [ ] **Step 1: Write failing tests** (inject exec; assert the exact docker args and freed-bytes math). Add to `docker.test.ts`:

```ts
import { pruneDocker, removeDockerItem } from './docker'

it('removeDockerItem maps kind→command and reports freed bytes from df delta', async () => {
  const calls: string[][] = []
  let phase = 0
  __setExecForTests(async (_bin, args) => {
    calls.push(args)
    if (args[0] === 'system' && args[1] === 'df' && !args.includes('-v')) {
      // grand-total df prints ONE JSON object per line; shrink after removal.
      return { stdout: JSON.stringify({ Type: 'Images', Size: phase++ === 0 ? '1GB' : '0B' }), stderr: '' }
    }
    return { stdout: '', stderr: '' }
  })
  const r = await removeDockerItem('image', 'sha256:bbb')
  expect(r.ok).toBe(true)
  expect(calls.some((a) => a[0] === 'rmi' && a[1] === 'sha256:bbb')).toBe(true)
})

it('pruneDocker maps each target to the right prune command', async () => {
  const seen: string[] = []
  __setExecForTests(async (_bin, args) => {
    if (args[0] === 'system' && args[1] === 'df') return { stdout: '[]', stderr: '' }
    seen.push(args.join(' '))
    return { stdout: '', stderr: '' }
  })
  await pruneDocker('buildCache')
  await pruneDocker('unusedVolumes')
  expect(seen).toContain('builder prune -f')
  expect(seen).toContain('volume prune -f')
})
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement** — add to `docker.ts`:

```ts
import type { DockerActionResult, DockerItemKind, DockerPruneTarget } from '@shared/docker.types'

/** Grand-total docker disk usage in bytes (sum of `docker system df` rows). */
async function totalDiskBytes(bin: string): Promise<number> {
  try {
    const out = await run(bin, ['system', 'df', '--format', '{{json .}}'])
    // df grand total prints one JSON object per row (Type, Size, Reclaimable, ...)
    const { parseSize } = await import('./docker-parse')
    return out
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .reduce((sum, line) => {
        try {
          return sum + parseSize((JSON.parse(line) as { Size: string }).Size)
        } catch {
          return sum
        }
      }, 0)
  } catch {
    return 0
  }
}

const REMOVE_ARGS: Record<Exclude<DockerItemKind, 'buildcache'>, (id: string) => string[]> = {
  image: (id) => ['rmi', id],
  volume: (id) => ['volume', 'rm', id],
  container: (id) => ['rm', id],
}

export async function removeDockerItem(kind: DockerItemKind, id: string, opts: DockerOpts = {}): Promise<DockerActionResult> {
  const bin = await findDocker(opts.binaryPath)
  if (!bin || kind === 'buildcache') return { ok: false, freedBytes: 0 }
  const before = await totalDiskBytes(bin)
  try {
    // in-use guard lives in the UI/validation; the CLI itself also refuses an
    // in-use image/volume without -f (which we never pass), so this is safe.
    await run(bin, REMOVE_ARGS[kind](id))
  } catch {
    return { ok: false, freedBytes: 0 }
  }
  const after = await totalDiskBytes(bin)
  return { ok: true, freedBytes: Math.max(0, before - after) }
}

const PRUNE_ARGS: Record<DockerPruneTarget, string[]> = {
  danglingImages: ['image', 'prune', '-f'],
  unusedImages: ['image', 'prune', '-a', '-f'],
  stoppedContainers: ['container', 'prune', '-f'],
  buildCache: ['builder', 'prune', '-f'],
  unusedVolumes: ['volume', 'prune', '-f'],
}

export async function pruneDocker(target: DockerPruneTarget, opts: DockerOpts = {}): Promise<DockerActionResult> {
  const bin = await findDocker(opts.binaryPath)
  if (!bin) return { ok: false, freedBytes: 0 }
  const before = await totalDiskBytes(bin)
  try {
    await run(bin, PRUNE_ARGS[target], PRUNE_TIMEOUT_MS)
  } catch {
    return { ok: false, freedBytes: 0 }
  }
  const after = await totalDiskBytes(bin)
  return { ok: true, freedBytes: Math.max(0, before - after) }
}
```

- [ ] **Step 4: Run tests, expect PASS.** Gates + commit `feat(app): docker remove + prune with freed-bytes diff`.

### Task 9: Gated IPC handlers + payload validation + analytics

**Files:**
- Create + Test: `src/main/docker/validate-docker-arg.ts`, `src/main/docker/validate-docker-arg.test.ts`
- Modify: `src/main/ipc/register-ipc.ts`, `src/main/analytics/analytics.ts`, `src/preload/index.ts`, `src/preload/api.types.ts`

**Interfaces:**
- Produces: `window.clean.removeDockerItem(kind, id)`, `window.clean.pruneDocker(target)` → `Promise<DockerActionResult>`.

- [ ] **Step 1: Write failing validation test** — `validate-docker-arg.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { coercePruneTarget, coerceRemoveArgs } from './validate-docker-arg'

describe('docker arg validation', () => {
  it('accepts valid remove kind/id and rejects junk', () => {
    expect(coerceRemoveArgs('image', 'sha256:aaa')).toEqual({ kind: 'image', id: 'sha256:aaa' })
    expect(coerceRemoveArgs('buildcache', 'x')).toBeNull() // no per-item build-cache removal
    expect(coerceRemoveArgs('image', '')).toBeNull()
    expect(coerceRemoveArgs('bogus', 'x')).toBeNull()
    expect(coerceRemoveArgs('image', 42)).toBeNull()
  })
  it('accepts only known prune targets', () => {
    expect(coercePruneTarget('buildCache')).toBe('buildCache')
    expect(coercePruneTarget('rm -rf /')).toBeNull()
  })
})
```

- [ ] **Step 2: Run, expect FAIL. Implement `validate-docker-arg.ts`:**

```ts
import type { DockerItemKind, DockerPruneTarget } from '@shared/docker.types'

const REMOVABLE_KINDS: DockerItemKind[] = ['image', 'volume', 'container']
const PRUNE_TARGETS: DockerPruneTarget[] = ['danglingImages', 'unusedImages', 'stoppedContainers', 'buildCache', 'unusedVolumes']

export function coerceRemoveArgs(kind: unknown, id: unknown): { kind: DockerItemKind; id: string } | null {
  if (typeof kind !== 'string' || !(REMOVABLE_KINDS as string[]).includes(kind)) return null
  if (typeof id !== 'string' || id.trim() === '') return null
  return { kind: kind as DockerItemKind, id }
}

export function coercePruneTarget(target: unknown): DockerPruneTarget | null {
  return typeof target === 'string' && (PRUNE_TARGETS as string[]).includes(target)
    ? (target as DockerPruneTarget)
    : null
}
```

- [ ] **Step 3: Extend analytics** — in `analytics.ts`, `clean_performed` already carries a `kind`; no new event needed. (The `kind` prop is a free-form string in `AnalyticsProps`.) No code change required beyond passing new kind values in Step 4.

- [ ] **Step 4: Register gated handlers** — in `register-ipc.ts`, import:

```ts
import { pruneDocker, removeDockerItem } from '../docker/docker'
import { coercePruneTarget, coerceRemoveArgs } from '../docker/validate-docker-arg'
```

and add:

```ts
  ipcMain.handle(IPC.removeDockerItem, async (_e, kind: unknown, id: unknown) => {
    if (!ctx.license.get().pro) return { ok: false, freedBytes: 0 }
    const args = coerceRemoveArgs(kind, id)
    if (!args) return { ok: false, freedBytes: 0 }
    const s = ctx.settings.get()
    const result = await removeDockerItem(args.kind, args.id, { binaryPath: s.dockerBinaryPath })
    if (result.ok) {
      ctx.analytics.capture('clean_performed', {
        kind: `docker_${args.kind}`,
        freed_gb: Math.round((result.freedBytes / GB) * 10) / 10,
      })
    }
    return result
  })

  ipcMain.handle(IPC.pruneDocker, async (_e, target: unknown) => {
    if (!ctx.license.get().pro) return { ok: false, freedBytes: 0 }
    const t = coercePruneTarget(target)
    if (!t) return { ok: false, freedBytes: 0 }
    const s = ctx.settings.get()
    const result = await pruneDocker(t, { binaryPath: s.dockerBinaryPath })
    if (result.ok) {
      ctx.analytics.capture('clean_performed', {
        kind: 'docker_prune',
        freed_gb: Math.round((result.freedBytes / GB) * 10) / 10,
      })
    }
    return result
  })
```

- [ ] **Step 5: Preload** — `src/preload/index.ts`:

```ts
  removeDockerItem: (kind, id) => ipcRenderer.invoke(IPC.removeDockerItem, kind, id),
  pruneDocker: (target) => ipcRenderer.invoke(IPC.pruneDocker, target),
```

`api.types.ts`:

```ts
import type { DockerActionResult, DockerInfo, DockerItemKind, DockerPruneTarget } from '@shared/docker.types'
```
```ts
  removeDockerItem(kind: DockerItemKind, id: string): Promise<DockerActionResult>
  pruneDocker(target: DockerPruneTarget): Promise<DockerActionResult>
```

- [ ] **Step 6: Run tests, gates, commit** `feat(app): gated docker remove/prune IPC + validation`.

### Task 10: Confirmation UX + wire actions in the view

**Files:**
- Modify: `src/renderer/src/hooks/useDocker.ts`, `src/renderer/src/launcher/views/DockerView.tsx`, `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`
- Create + Test: `src/renderer/src/launcher/views/docker-confirm.ts`, `docker-confirm.test.ts` (the typed-name gating logic, unit-tested pure)

**Interfaces:**
- Consumes: `window.clean.removeDockerItem`, `window.clean.pruneDocker`, `ctx.license` (via existing `license` prop/hook in LauncherApp).

- [ ] **Step 1: Extend `useDocker`** with `remove(kind, id)` and `prune(target)` that call the IPC then `refresh()`; add `busyId: string | null`:

```ts
  const remove = useCallback(async (kind, id) => {
    setBusyId(id)
    try {
      const r = await window.clean.removeDockerItem(kind, id)
      await refresh()
      return r
    } finally {
      setBusyId(null)
    }
  }, [refresh])
```
(and a parallel `prune(target)` keyed by `busyId = 'prune:' + target`.)

- [ ] **Step 2: TDD the typed-name gate** — `docker-confirm.ts`:

```ts
import type { DockerItem } from '@shared/docker.types'

/** True when a pending removal needs the extra typed confirmation (all volumes). */
export function needsTypedConfirm(item: { kind: DockerItem['kind'] }): boolean {
  return item.kind === 'volume'
}

/** The string the user must type: the volume name (per-item) or 'prune' (bulk volumes). */
export function requiredConfirmText(target: { kind: 'volume'; name: string } | { kind: 'prune' }): string {
  return target.kind === 'prune' ? 'prune' : target.name
}

export function confirmSatisfied(required: string, typed: string): boolean {
  return typed.trim() === required
}
```

Test `docker-confirm.test.ts`: `needsTypedConfirm({kind:'volume'})===true`, `image===false`; `confirmSatisfied('pgdata','pgdata')===true`, `confirmSatisfied('pgdata','pg')===false`.

- [ ] **Step 3: Wire the two-tier confirm** in `LauncherApp` (extend the existing `confirm` footer, do not invent a modal):
  - Free user (`!license.pro`): any remove/prune sets `unlock` + `trackEvent('paywall_shown', { trigger: 'docker' })` — clone the delete path.
  - Pro user, non-volume (image/container/build-cache prune): set `confirm`-style state showing "Remove <name>? Frees ~N. Permanent — not sent to the Trash." with Cancel(`esc`)/Remove(`↵`). On confirm call `docker.remove(kind,id)` or `docker.prune(target)`.
  - Pro user, volume (per-item or `unusedVolumes` prune): render the SAME footer PLUS a text input; the Remove button/`↵` stays disabled until `confirmSatisfied(requiredConfirmText(...), typed)`. Only then call the IPC.
  - `DockerView` gets `onRemove(item)` / `onPrune(target)` callbacks and per-category "Prune" buttons (Dangling images / Unused images / Stopped containers / Build cache / Unused volumes), each firing `onPrune`. `CacheRow` action button is shown only when `item.removable` (in-use/build-cache rows show a badge instead).

- [ ] **Step 4:** Run tests, gates (`pnpm typecheck && pnpm test && pnpm lint && pnpm build`), commit `feat(app): docker cleanup actions + tiered confirmation`.

### Task 11: Integration verify + STATUS

- [ ] **Step 1:** Full gates green. Manually (or note as a user action, since it needs a real daemon): launch the app, open Docker tab (⌘4), confirm images/volumes/containers/build-cache list with sizes + in-use badges; as a free user a remove shows the paywall; as Pro, removing an unused image works and the meter updates; a volume removal requires typing its name; in-use items have no remove button.
- [ ] **Step 2:** Update `STATUS.html` data block (new "done" roadmap item for the Docker cleanup layer; a userAction for the manual daemon test; log entry). Bump `updated`.
- [ ] **Step 3:** Push `feat/docker-cleanup`, open PR to main with a summary + the manual-test checklist; confirm CI green.
