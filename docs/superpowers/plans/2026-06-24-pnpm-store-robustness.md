# pnpm Store Robustness + Manual Override + Diff Hint — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make pnpm store sizing a no-fail zone (auto-detect every install method, infer the store from disk when pnpm can't run, manual override as the escape hatch) and honestly represent the real/linked diff for legacy caches via a rescan hint.

**Architecture:** Main-process detection becomes a layered chain (`manual store path → run pnpm → filesystem inference → none`) recording how it resolved. Binary discovery is unified through a shared `runtime-bins` module so npm-global/corepack pnpm under any node manager is found. The renderer gains a manual-override settings section, a "rescan to compute" hint, and tolerates an undefined `uniqueSize`.

**Tech Stack:** Electron (main/preload/renderer), TypeScript, React, Vitest, Biome, pnpm. Sizing via `du -sk` (existing `folderSize`).

## Global Constraints

- Package manager: **pnpm**. Run `pnpm typecheck && pnpm lint && pnpm test` to verify; all must be green.
- One folder per component: `index.ts`, `Component.tsx`, `Component.types.ts`, optional `.constants.ts`/tests.
- Single responsibility per file; prefer small focused files.
- Conventional-commit subjects: `feat(scope): …`, `fix: …`, `test: …`, `docs: …`.
- Never trust renderer IPC payloads — validate in `coerceSetting` before persisting.
- Path alias: `@shared/*` → `src/shared/*`, `@renderer/*` → `src/renderer/src/*`.
- Branch: `feat/pnpm-store-robustness` (already created off `feat/real-vs-virtual-storage`).
- Update `STATUS.html`'s STATUS data block at the end (final task).

---

### Task 1: Extend `PnpmStoreInfo` with `source`, `reason`, `canPrune`

**Files:**
- Modify: `src/shared/pnpm-store.types.ts`
- Modify: `src/main/pnpm-store/pnpm-store.ts` (keep it compiling against the new shape)

**Interfaces:**
- Produces: `PnpmStoreInfo` now also has `source: PnpmStoreSource`, `reason?: string`, `canPrune: boolean`; `type PnpmStoreSource = 'manual' | 'pnpm' | 'inferred' | 'none'`.

- [ ] **Step 1: Update the shared type**

Replace the `PnpmStoreInfo` interface in `src/shared/pnpm-store.types.ts`:

```ts
/** How the store path was resolved. */
export type PnpmStoreSource = 'manual' | 'pnpm' | 'inferred' | 'none'

/** State of the global pnpm content-addressable store. */
export interface PnpmStoreInfo {
  /** false when no store path could be resolved by any method */
  available: boolean
  path: string | null
  /** path with the home dir abbreviated to ~ */
  displayPath: string
  sizeBytes: number
  checkedAt: number
  /** how the path was resolved (or 'none' when unavailable) */
  source: PnpmStoreSource
  /** true only when a pnpm binary was found that we can run `store prune` with */
  canPrune: boolean
  /** human-readable explanation of the current state, for the UI */
  reason?: string
}

export interface PnpmPruneResult {
  ok: boolean
  freedBytes: number
}
```

- [ ] **Step 2: Make `pnpm-store.ts` populate the new fields (temporary, fully rewritten in Task 5)**

In `src/main/pnpm-store/pnpm-store.ts`, update the `unavailable` object and the success return so the file type-checks:

In `readStoreInfo`, change the `unavailable` constant to:

```ts
  const unavailable: PnpmStoreInfo = {
    available: false,
    path: null,
    displayPath: '',
    sizeBytes: 0,
    checkedAt: Date.now(),
    source: 'none',
    canPrune: false,
  }
```

And the success `return` object (the one with `available: true`) gains two fields:

```ts
    return {
      available: true,
      path,
      displayPath: abbreviateHome(path),
      sizeBytes: await folderSize(path),
      checkedAt: Date.now(),
      source: 'pnpm',
      canPrune: true,
    }
```

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: PASS (no type errors).

- [ ] **Step 4: Verify existing tests still pass**

Run: `pnpm test`
Expected: PASS (63 tests; no behavior change yet).

- [ ] **Step 5: Commit**

```bash
git add src/shared/pnpm-store.types.ts src/main/pnpm-store/pnpm-store.ts
git commit -m "feat(pnpm-store): add source/reason/canPrune to PnpmStoreInfo"
```

---

### Task 2: Shared `runtime-bins` module + refactor `find-node`

**Files:**
- Create: `src/main/pnpm-store/runtime-bins.ts`
- Create: `src/main/pnpm-store/runtime-bins.test.ts`
- Modify: `src/main/pnpm-store/find-node.ts` (consume `versionManagerBinDirs`)

**Interfaces:**
- Produces: `versionManagerBinDirs(env: NodeJS.ProcessEnv, home: string, nvmBins: string[]): string[]` — ordered, deduped bin directories: PATH dirs, `$PNPM_HOME`, nvm bins, `~/.volta/bin`, `~/.asdf/shims`, `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`.
- Produces: `nvmNodeBins(home: string): Promise<string[]>` (moved here from `find-node.ts`, newest-first).
- Consumes (find-node): unchanged public API `nodeCandidates(env, home, nvmNodeBins?)` and `findNode()`/`pnpmExecEnv()`.

- [ ] **Step 1: Write the failing test**

Create `src/main/pnpm-store/runtime-bins.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { versionManagerBinDirs } from './runtime-bins'

const HOME = '/Users/me'

describe('versionManagerBinDirs', () => {
  it('prefers PATH entries, in order', () => {
    const dirs = versionManagerBinDirs({ PATH: '/a/bin:/b/bin' }, HOME, [])
    expect(dirs.slice(0, 2)).toEqual(['/a/bin', '/b/bin'])
  })

  it('inserts PNPM_HOME then nvm bins (newest first) before other well-knowns', () => {
    const dirs = versionManagerBinDirs({ PATH: '', PNPM_HOME: '/ph' }, HOME, [
      '/Users/me/.nvm/versions/node/v25.2.1/bin',
      '/Users/me/.nvm/versions/node/v20.0.0/bin',
    ])
    expect(dirs).toEqual([
      '/ph',
      '/Users/me/.nvm/versions/node/v25.2.1/bin',
      '/Users/me/.nvm/versions/node/v20.0.0/bin',
      '/Users/me/.volta/bin',
      '/Users/me/.asdf/shims',
      '/opt/homebrew/bin',
      '/usr/local/bin',
      '/usr/bin',
    ])
  })

  it('omits PNPM_HOME when unset and dedups PATH overlaps', () => {
    const dirs = versionManagerBinDirs({ PATH: '/opt/homebrew/bin' }, HOME, [])
    expect(dirs[0]).toBe('/opt/homebrew/bin')
    expect(dirs.filter((d) => d === '/opt/homebrew/bin')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- runtime-bins`
Expected: FAIL with "Cannot find module './runtime-bins'".

- [ ] **Step 3: Write the implementation**

Create `src/main/pnpm-store/runtime-bins.ts`:

```ts
import { readdir } from 'node:fs/promises'
import { delimiter, join } from 'node:path'

/**
 * Ordered, deduped bin directories where a JS runtime or its globally-installed
 * tools live: PATH first (a Finder launch has a minimal one), then the version
 * managers and package locations a GUI app does not inherit.
 *
 * `nvmBins` is passed in (newest first) so ordering stays pure and testable.
 */
export function versionManagerBinDirs(env: NodeJS.ProcessEnv, home: string, nvmBins: string[]): string[] {
  const fromPath = (env.PATH ?? '').split(delimiter).filter(Boolean)
  const wellKnown = [
    env.PNPM_HOME ?? null,
    ...nvmBins,
    join(home, '.volta', 'bin'),
    join(home, '.asdf', 'shims'),
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/usr/bin',
  ].filter((d): d is string => d !== null)
  return [...new Set([...fromPath, ...wellKnown])]
}

/** nvm keeps each version under ~/.nvm/versions/node/<v>/bin; newest first. */
export async function nvmNodeBins(home: string): Promise<string[]> {
  const base = join(home, '.nvm', 'versions', 'node')
  try {
    const versions = await readdir(base)
    return versions
      .sort()
      .reverse()
      .map((v) => join(base, v, 'bin'))
  } catch {
    return []
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- runtime-bins`
Expected: PASS.

- [ ] **Step 5: Refactor `find-node.ts` to consume `runtime-bins`**

Replace the body of `src/main/pnpm-store/find-node.ts` (keep the same exports/behavior). The only change is sourcing the bin dirs from `versionManagerBinDirs` + reusing `nvmNodeBins` from `runtime-bins`:

```ts
import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'
import { nvmNodeBins, versionManagerBinDirs } from './runtime-bins'

/**
 * Candidate `node` binary locations, PATH first, then well-known installs.
 *
 * Homebrew's pnpm is a `#!/usr/bin/env node` script, so running it needs
 * `node` on PATH. A Finder-launched app only inherits the minimal launchd
 * PATH, which usually has neither a version-manager node (nvm/volta/asdf)
 * nor Homebrew's bin — so PATH alone is not enough.
 *
 * `nvmBins` is the list of nvm version `bin` dirs (newest first); it is passed
 * in so the pure candidate ordering stays testable.
 */
export function nodeCandidates(env: NodeJS.ProcessEnv, home: string, nvmBins: string[] = []): string[] {
  return versionManagerBinDirs(env, home, nvmBins).map((dir) => join(dir, 'node'))
}

let resolved: string | null | undefined

/** Resolves a usable node binary once per app run; null when none is found. */
export async function findNode(): Promise<string | null> {
  if (resolved !== undefined) return resolved
  const home = homedir()
  const candidates = nodeCandidates(process.env, home, await nvmNodeBins(home))
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK)
      resolved = candidate
      return resolved
    } catch {
      // keep looking
    }
  }
  resolved = null
  return resolved
}

/**
 * Process env for spawning pnpm, with a resolved node's directory prepended to
 * PATH so the pnpm shebang can find node even under a bare launchd PATH.
 * Falls back to the unmodified env when no node is found.
 */
export async function pnpmExecEnv(): Promise<NodeJS.ProcessEnv> {
  const node = await findNode()
  if (!node) return process.env
  const PATH = [dirname(node), process.env.PATH ?? ''].filter(Boolean).join(delimiter)
  return { ...process.env, PATH }
}
```

- [ ] **Step 6: Verify node tests still pass (regression guard)**

Run: `pnpm test -- find-node runtime-bins`
Expected: PASS (the existing `nodeCandidates` tests must stay green).

- [ ] **Step 7: Commit**

```bash
git add src/main/pnpm-store/runtime-bins.ts src/main/pnpm-store/runtime-bins.test.ts src/main/pnpm-store/find-node.ts
git commit -m "feat(pnpm-store): extract shared runtime-bins discovery"
```

---

### Task 3: Harden `find-pnpm` (npm-global / corepack / manual override)

**Files:**
- Modify: `src/main/pnpm-store/find-pnpm.ts`
- Modify: `src/main/pnpm-store/find-pnpm.test.ts`

**Interfaces:**
- Consumes: `versionManagerBinDirs`, `nvmNodeBins` from `runtime-bins`.
- Produces: `pnpmCandidates(env, home, nvmBins?: string[], overrideBin?: string): string[]` and `findPnpm(overrideBin?: string): Promise<string | null>`.

- [ ] **Step 1: Update the failing test**

Replace `src/main/pnpm-store/find-pnpm.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { pnpmCandidates } from './find-pnpm'

const HOME = '/Users/me'

describe('pnpmCandidates', () => {
  it('prefers PATH entries, in order', () => {
    const candidates = pnpmCandidates({ PATH: '/a/bin:/b/bin' }, HOME)
    expect(candidates.slice(0, 2)).toEqual(['/a/bin/pnpm', '/b/bin/pnpm'])
  })

  it('tries an explicit override binary first', () => {
    const candidates = pnpmCandidates({ PATH: '/a/bin' }, HOME, [], '/my/pnpm')
    expect(candidates[0]).toBe('/my/pnpm')
  })

  it('searches nvm bins so an npm-global / corepack pnpm is found', () => {
    const candidates = pnpmCandidates({ PATH: '' }, HOME, ['/Users/me/.nvm/versions/node/v25.2.1/bin'])
    expect(candidates).toContain('/Users/me/.nvm/versions/node/v25.2.1/bin/pnpm')
  })

  it('includes PNPM_HOME, version managers, and pnpm standalone locations', () => {
    const candidates = pnpmCandidates({ PATH: '', PNPM_HOME: '/ph' }, HOME)
    expect(candidates).toEqual([
      '/ph/pnpm',
      '/Users/me/.volta/bin/pnpm',
      '/Users/me/.asdf/shims/pnpm',
      '/opt/homebrew/bin/pnpm',
      '/usr/local/bin/pnpm',
      '/usr/bin/pnpm',
      '/Users/me/Library/pnpm/pnpm',
      '/Users/me/.local/share/pnpm/pnpm',
    ])
  })

  it('deduplicates PATH and well-known overlaps', () => {
    const candidates = pnpmCandidates({ PATH: '/opt/homebrew/bin' }, HOME)
    expect(candidates.filter((c) => c === '/opt/homebrew/bin/pnpm')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- find-pnpm`
Expected: FAIL (override/nvm expectations not met by current implementation).

- [ ] **Step 3: Write the implementation**

Replace `src/main/pnpm-store/find-pnpm.ts`:

```ts
import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { nvmNodeBins, versionManagerBinDirs } from './runtime-bins'

/**
 * Candidate pnpm binary locations: an explicit override first, then every
 * runtime bin dir (so an npm-global or corepack pnpm under nvm/volta/asdf is
 * found, not just standalone/Homebrew), then pnpm's standalone install dirs.
 * The app may be launched from Finder without the user's shell PATH, so PATH
 * alone is not enough.
 */
export function pnpmCandidates(
  env: NodeJS.ProcessEnv,
  home: string,
  nvmBins: string[] = [],
  overrideBin?: string,
): string[] {
  const fromBinDirs = versionManagerBinDirs(env, home, nvmBins).map((dir) => join(dir, 'pnpm'))
  const standalone = [join(home, 'Library', 'pnpm', 'pnpm'), join(home, '.local', 'share', 'pnpm', 'pnpm')]
  const all = overrideBin ? [overrideBin, ...fromBinDirs, ...standalone] : [...fromBinDirs, ...standalone]
  return [...new Set(all)]
}

let resolved: string | null | undefined

/**
 * Resolves the pnpm binary; null when pnpm isn't installed. An explicit
 * `overrideBin` (from settings) is tried first and bypasses the per-run cache
 * so changing it in Settings takes effect immediately.
 */
export async function findPnpm(overrideBin?: string): Promise<string | null> {
  if (overrideBin === undefined && resolved !== undefined) return resolved
  const home = homedir()
  const candidates = pnpmCandidates(process.env, home, await nvmNodeBins(home), overrideBin || undefined)
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

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- find-pnpm`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/pnpm-store/find-pnpm.ts src/main/pnpm-store/find-pnpm.test.ts
git commit -m "feat(pnpm-store): find npm-global/corepack pnpm + manual override"
```

---

### Task 4: Filesystem store inference (`infer-store`)

**Files:**
- Create: `src/main/pnpm-store/infer-store.ts`
- Create: `src/main/pnpm-store/infer-store.test.ts`

**Interfaces:**
- Produces: `storeRootCandidates(env: NodeJS.ProcessEnv, home: string): string[]`
- Produces: `newestVersionDir(entries: string[]): string | null` (picks the highest `v<N>` name)
- Produces: `inferStoreDir(env: NodeJS.ProcessEnv, home: string): Promise<string | null>` (reads disk)

- [ ] **Step 1: Write the failing test**

Create `src/main/pnpm-store/infer-store.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { inferStoreDir, newestVersionDir, storeRootCandidates } from './infer-store'

const HOME = '/Users/me'

describe('storeRootCandidates', () => {
  it('lists PNPM_HOME, the mac standalone, and XDG-style roots', () => {
    expect(storeRootCandidates({ PNPM_HOME: '/ph' }, HOME)).toEqual([
      '/ph/store',
      '/Users/me/Library/pnpm/store',
      '/Users/me/.local/share/pnpm/store',
    ])
  })

  it('omits PNPM_HOME when unset and adds XDG_DATA_HOME when set', () => {
    expect(storeRootCandidates({ XDG_DATA_HOME: '/xdg' }, HOME)).toEqual([
      '/Users/me/Library/pnpm/store',
      '/Users/me/.local/share/pnpm/store',
      '/xdg/pnpm/store',
    ])
  })
})

describe('newestVersionDir', () => {
  it('picks the highest v<N> entry', () => {
    expect(newestVersionDir(['v3', 'v11', 'v10', 'tmp'])).toBe('v11')
  })
  it('returns null when no version dir exists', () => {
    expect(newestVersionDir(['tmp', 'files'])).toBeNull()
  })
})

describe('inferStoreDir', () => {
  let home: string
  beforeAll(() => {
    home = mkdtempSync(join(tmpdir(), 'cmnm-store-'))
    mkdirSync(join(home, 'Library', 'pnpm', 'store', 'v3'), { recursive: true })
    mkdirSync(join(home, 'Library', 'pnpm', 'store', 'v11'), { recursive: true })
  })
  afterAll(() => rmSync(home, { recursive: true, force: true }))

  it('returns the newest version dir under the first existing root', async () => {
    expect(await inferStoreDir({}, home)).toBe(join(home, 'Library', 'pnpm', 'store', 'v11'))
  })

  it('returns null when no candidate root exists', async () => {
    expect(await inferStoreDir({}, '/no/such/home')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- infer-store`
Expected: FAIL with "Cannot find module './infer-store'".

- [ ] **Step 3: Write the implementation**

Create `src/main/pnpm-store/infer-store.ts`:

```ts
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Well-known pnpm store roots, in priority order. The store lives under a
 * `v<N>` subdir of one of these (what `pnpm store path` returns), so we can
 * locate it on disk without running pnpm at all.
 */
export function storeRootCandidates(env: NodeJS.ProcessEnv, home: string): string[] {
  const roots = [
    env.PNPM_HOME ? join(env.PNPM_HOME, 'store') : null,
    join(home, 'Library', 'pnpm', 'store'),
    join(home, '.local', 'share', 'pnpm', 'store'),
    env.XDG_DATA_HOME ? join(env.XDG_DATA_HOME, 'pnpm', 'store') : null,
  ].filter((p): p is string => p !== null)
  return [...new Set(roots)]
}

/** Highest `v<N>` directory name among entries, or null. */
export function newestVersionDir(entries: string[]): string | null {
  const versioned = entries
    .filter((e) => /^v\d+$/.test(e))
    .map((e) => ({ name: e, n: Number.parseInt(e.slice(1), 10) }))
    .sort((a, b) => b.n - a.n)
  return versioned[0]?.name ?? null
}

/** Locates the store dir on disk (newest version under the first existing root). */
export async function inferStoreDir(env: NodeJS.ProcessEnv, home: string): Promise<string | null> {
  for (const root of storeRootCandidates(env, home)) {
    try {
      const newest = newestVersionDir(await readdir(root))
      if (newest) return join(root, newest)
    } catch {
      // root doesn't exist — try the next
    }
  }
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- infer-store`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/pnpm-store/infer-store.ts src/main/pnpm-store/infer-store.test.ts
git commit -m "feat(pnpm-store): infer the store dir from disk without running pnpm"
```

---

### Task 5: Layered store resolution in `pnpm-store.ts`

**Files:**
- Modify: `src/main/pnpm-store/pnpm-store.ts`
- Modify: `src/main/ipc/register-ipc.ts` (pass settings overrides into `getPnpmStoreInfo`)

**Interfaces:**
- Consumes: `findPnpm(overrideBin?)`, `pnpmExecEnv`, `inferStoreDir`, `folderSize`, `abbreviateHome`.
- Produces: `getPnpmStoreInfo(force?: boolean, overrides?: StoreOverrides): Promise<PnpmStoreInfo>` where `interface StoreOverrides { storePath?: string; binaryPath?: string }`; `prunePnpmStore(overrides?: StoreOverrides): Promise<PnpmPruneResult>`.

- [ ] **Step 1: Rewrite `pnpm-store.ts` with the layered chain**

Replace `src/main/pnpm-store/pnpm-store.ts`:

```ts
import { execFile } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { promisify } from 'node:util'
import type { PnpmPruneResult, PnpmStoreInfo } from '@shared/pnpm-store.types'
import { abbreviateHome } from '../lib/abbreviate-home'
import { folderSize } from '../lib/folder-size'
import { pnpmExecEnv } from './find-node'
import { findPnpm } from './find-pnpm'
import { inferStoreDir } from './infer-store'

const execFileAsync = promisify(execFile)

/** Sizing a multi-GB store with du isn't free; reuse results briefly. */
const INFO_TTL_MS = 5 * 60_000
/** `pnpm store prune` rewrites the store index and can be slow on big stores. */
const PRUNE_TIMEOUT_MS = 10 * 60_000

export interface StoreOverrides {
  storePath?: string
  binaryPath?: string
}

let cached: PnpmStoreInfo | null = null
let cachedKey = ''

const keyOf = (o: StoreOverrides): string => `${o.storePath ?? ''}|${o.binaryPath ?? ''}`

export async function getPnpmStoreInfo(force = false, overrides: StoreOverrides = {}): Promise<PnpmStoreInfo> {
  const key = keyOf(overrides)
  if (!force && cached && key === cachedKey && Date.now() - cached.checkedAt < INFO_TTL_MS) return cached
  cached = await readStoreInfo(overrides)
  cachedKey = key
  return cached
}

async function isDir(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

async function ok(path: string, source: PnpmStoreInfo['source'], canPrune: boolean): Promise<PnpmStoreInfo> {
  return {
    available: true,
    path,
    displayPath: abbreviateHome(path),
    sizeBytes: await folderSize(path),
    checkedAt: Date.now(),
    source,
    canPrune,
  }
}

/** Layered resolution: manual store path → run pnpm → infer from disk → none. */
async function readStoreInfo(overrides: StoreOverrides): Promise<PnpmStoreInfo> {
  const binary = await findPnpm(overrides.binaryPath)
  const canPrune = binary !== null

  // 1. Manual store path wins when it points at a real directory.
  if (overrides.storePath) {
    if (await isDir(overrides.storePath)) return ok(overrides.storePath, 'manual', canPrune)
  }

  // 2. Ask pnpm itself (with node resolved onto PATH for the shebang).
  if (binary) {
    try {
      const env = await pnpmExecEnv()
      const { stdout } = await execFileAsync(binary, ['store', 'path'], { timeout: 10_000, env })
      const path = stdout.trim()
      if (path && (await isDir(path))) return ok(path, 'pnpm', canPrune)
    } catch {
      // fall through to inference
    }
  }

  // 3. Infer the store location straight from disk — no pnpm execution needed.
  const inferred = await inferStoreDir(process.env, homedir())
  if (inferred) return ok(inferred, 'inferred', canPrune)

  // 4. Nothing worked — explain why so the UI can guide a manual override.
  return {
    available: false,
    path: null,
    displayPath: '',
    sizeBytes: 0,
    checkedAt: Date.now(),
    source: 'none',
    canPrune,
    reason: binary
      ? 'pnpm is installed but its store could not be located — set the store folder in Settings'
      : 'pnpm not found — choose its binary or the store folder in Settings',
  }
}

/**
 * Removes unreferenced packages from the store via `pnpm store prune` — the
 * only safe way to shrink it (a full delete would break every hardlinked
 * node_modules on disk). Requires a runnable pnpm binary.
 */
export async function prunePnpmStore(overrides: StoreOverrides = {}): Promise<PnpmPruneResult> {
  const pnpm = await findPnpm(overrides.binaryPath)
  const before = await getPnpmStoreInfo(true, overrides)
  if (!pnpm || !before.available) return { ok: false, freedBytes: 0 }
  try {
    const env = await pnpmExecEnv()
    await execFileAsync(pnpm, ['store', 'prune'], { timeout: PRUNE_TIMEOUT_MS, env })
  } catch {
    return { ok: false, freedBytes: 0 }
  }
  const after = await getPnpmStoreInfo(true, overrides)
  return { ok: true, freedBytes: Math.max(0, before.sizeBytes - after.sizeBytes) }
}
```

- [ ] **Step 2: Pass settings overrides from the IPC handler**

In `src/main/ipc/register-ipc.ts`, replace the two pnpm-store handler lines:

```ts
  ipcMain.handle(IPC.getPnpmStore, (_e, force?: boolean) => {
    const s = ctx.settings.get()
    return getPnpmStoreInfo(force, { storePath: s.pnpmStorePath, binaryPath: s.pnpmBinaryPath })
  })
  ipcMain.handle(IPC.prunePnpmStore, () => {
    const s = ctx.settings.get()
    return prunePnpmStore({ storePath: s.pnpmStorePath, binaryPath: s.pnpmBinaryPath })
  })
```

(These reference `s.pnpmStorePath` / `s.pnpmBinaryPath`, added to `Settings` in Task 6. If executing strictly in order, this file will type-error until Task 6 is done — that is expected; run typecheck after Task 6.)

- [ ] **Step 3: Verify the pnpm-store unit still type-checks in isolation**

Run: `pnpm test -- pnpm-store find-pnpm find-node infer-store runtime-bins`
Expected: PASS (no test imports `register-ipc`).

- [ ] **Step 4: Commit**

```bash
git add src/main/pnpm-store/pnpm-store.ts src/main/ipc/register-ipc.ts
git commit -m "feat(pnpm-store): layered resolution (manual > pnpm > inferred > none)"
```

---

### Task 6: Settings — `pnpmStorePath` / `pnpmBinaryPath`

**Files:**
- Modify: `src/shared/settings.types.ts`
- Modify: `src/shared/settings.constants.ts`
- Modify: `src/main/settings/validate-setting.ts`
- Modify: `src/main/settings/validate-setting.test.ts`

**Interfaces:**
- Produces: `Settings.pnpmStorePath?: string`, `Settings.pnpmBinaryPath?: string`; `coerceSetting` accepts both (trimmed string; empty string clears).

- [ ] **Step 1: Write the failing test**

Append to `src/main/settings/validate-setting.test.ts` (inside the existing `describe`, or add one). Full test block:

```ts
import { describe, expect, it } from 'vitest'
import { coerceSetting } from './validate-setting'

describe('coerceSetting — pnpm overrides', () => {
  it('accepts and trims a pnpm store path', () => {
    expect(coerceSetting('pnpmStorePath', '  /Users/me/Library/pnpm/store/v11  ')).toEqual({
      key: 'pnpmStorePath',
      value: '/Users/me/Library/pnpm/store/v11',
    })
  })

  it('accepts a pnpm binary path', () => {
    expect(coerceSetting('pnpmBinaryPath', '/opt/homebrew/bin/pnpm')).toEqual({
      key: 'pnpmBinaryPath',
      value: '/opt/homebrew/bin/pnpm',
    })
  })

  it('clears an override when given an empty/whitespace string', () => {
    expect(coerceSetting('pnpmStorePath', '   ')).toEqual({ key: 'pnpmStorePath', value: '' })
  })

  it('rejects a non-string override', () => {
    expect(coerceSetting('pnpmBinaryPath', 42)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- validate-setting`
Expected: FAIL (`pnpmStorePath` hits the `default: return null`).

- [ ] **Step 3: Extend the `Settings` type**

In `src/shared/settings.types.ts`, add two optional fields to the interface:

```ts
export interface Settings {
  accent: string
  sizeStyle: SizeStyle
  density: Density
  thresholdGB: number
  scanInterval: ScanInterval
  notify: boolean
  onboarded: boolean
  /** Manual override: path to the pnpm content-addressable store dir. */
  pnpmStorePath?: string
  /** Manual override: path to the pnpm executable. */
  pnpmBinaryPath?: string
}
```

- [ ] **Step 4: Keep `DEFAULT_SETTINGS` exhaustive-safe**

`src/shared/settings.constants.ts` needs no new key (both are optional/undefined by default). Leave `DEFAULT_SETTINGS` unchanged.

- [ ] **Step 5: Extend `coerceSetting`**

In `src/main/settings/validate-setting.ts`, add two cases before `default:`:

```ts
    case 'pnpmStorePath':
    case 'pnpmBinaryPath':
      return typeof value === 'string' ? { key, value: value.trim() } : null
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test -- validate-setting`
Expected: PASS.

- [ ] **Step 7: Verify whole project type-checks now (Task 5's IPC refs resolve)**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/shared/settings.types.ts src/main/settings/validate-setting.ts src/main/settings/validate-setting.test.ts
git commit -m "feat(settings): add pnpmStorePath/pnpmBinaryPath manual overrides"
```

---

### Task 7: Native path picker (main + preload + api)

**Files:**
- Create: `src/main/actions/pick-path.ts`
- Modify: `src/shared/ipc.constants.ts`
- Modify: `src/main/ipc/register-ipc.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/preload/api.types.ts`

**Interfaces:**
- Produces: `pickPath(mode: 'file' | 'folder'): Promise<string | null>` (main); IPC channel `pickPath: 'dialog:pick-path'`; `CleanApi.pickPath(mode: 'file' | 'folder'): Promise<string | null>`.

- [ ] **Step 1: Create the action**

Create `src/main/actions/pick-path.ts`:

```ts
import { dialog } from 'electron'

/** Opens a native open-dialog and returns the chosen path, or null if cancelled. */
export async function pickPath(mode: 'file' | 'folder'): Promise<string | null> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: [mode === 'folder' ? 'openDirectory' : 'openFile'],
  })
  return canceled || filePaths.length === 0 ? null : filePaths[0]
}
```

- [ ] **Step 2: Add the IPC channel**

In `src/shared/ipc.constants.ts`, add to the invoke group:

```ts
  pickPath: 'dialog:pick-path',
```

- [ ] **Step 3: Register the handler**

In `src/main/ipc/register-ipc.ts`, add an import and a handler:

```ts
import { pickPath } from '../actions/pick-path'
```

```ts
  ipcMain.handle(IPC.pickPath, (_e, mode: 'file' | 'folder') => pickPath(mode))
```

- [ ] **Step 4: Expose it in preload**

In `src/preload/index.ts`, add to the `api` object:

```ts
  pickPath: (mode) => ipcRenderer.invoke(IPC.pickPath, mode),
```

In `src/preload/api.types.ts`, add to `CleanApi`:

```ts
  pickPath(mode: 'file' | 'folder'): Promise<string | null>
```

- [ ] **Step 5: Verify typecheck + build**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/main/actions/pick-path.ts src/shared/ipc.constants.ts src/main/ipc/register-ipc.ts src/preload/index.ts src/preload/api.types.ts
git commit -m "feat(ipc): native file/folder path picker"
```

---

### Task 8: `uniqueSize` optional + stop back-filling

**Files:**
- Modify: `src/shared/project.types.ts`
- Modify: `src/main/projects/project-store.ts`
- Modify: `src/main/projects/project-store.test.ts` (create if absent — see step 1)

**Interfaces:**
- Produces: `Project.uniqueSize?: number` (undefined = "split unknown"); `ProjectStore.load()` no longer coerces legacy `uniqueSize` to `size`.

- [ ] **Step 1: Write the failing test**

Check whether `src/main/projects/project-store.test.ts` exists. If not, create it:

```ts
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ProjectStore } from './project-store'

describe('ProjectStore legacy cache', () => {
  let dir: string
  let file: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'cmnm-ps-'))
    file = join(dir, 'projects-cache.json')
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('leaves uniqueSize undefined for entries written before the real/linked split', () => {
    writeFileSync(
      file,
      JSON.stringify({ projects: [{ id: 'a', name: 'x', path: '~/x', absPath: '/x', kind: 'node', size: 100, lastUsed: 1 }], lastScanTime: 5 }),
    )
    const store = new ProjectStore(file)
    expect(store.all[0].uniqueSize).toBeUndefined()
  })

  it('preserves a real uniqueSize when present', () => {
    writeFileSync(
      file,
      JSON.stringify({ projects: [{ id: 'a', name: 'x', path: '~/x', absPath: '/x', kind: 'node', size: 100, uniqueSize: 40, lastUsed: 1 }], lastScanTime: 5 }),
    )
    const store = new ProjectStore(file)
    expect(store.all[0].uniqueSize).toBe(40)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- project-store`
Expected: FAIL (current `load()` back-fills `uniqueSize ?? p.size`, so the first assertion gets `100`, not `undefined`).

- [ ] **Step 3: Make `uniqueSize` optional in the type**

In `src/shared/project.types.ts`, change the field:

```ts
  /** Bytes actually freed by deleting node_modules now (apparent minus the pnpm-store-backed `.pnpm` subtree). Undefined for caches written before the real/linked split — rescan to populate. */
  uniqueSize?: number
```

- [ ] **Step 4: Stop back-filling in `project-store.ts`**

In `src/main/projects/project-store.ts`, replace the `load()` body's projects line:

```ts
      // Pre-split caches have no uniqueSize; leave it undefined (= unknown) so
      // the UI can prompt a rescan instead of pretending the split is 0.
      this.projects = raw.projects ?? []
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- project-store`
Expected: PASS.

- [ ] **Step 6: Typecheck the scanner (it sets uniqueSize unconditionally — still valid)**

Run: `pnpm typecheck`
Expected: PASS (assigning a number to an optional number field is fine).

- [ ] **Step 7: Commit**

```bash
git add src/shared/project.types.ts src/main/projects/project-store.ts src/main/projects/project-store.test.ts
git commit -m "feat(projects): leave legacy uniqueSize undefined (rescan to compute)"
```

---

### Task 9: Renderer tolerates undefined `uniqueSize`

**Files:**
- Modify: `src/renderer/src/components/MiniRow/MiniRow.tsx`
- Modify: `src/renderer/src/components/SizeViz/SizeViz.tsx`
- Modify: `src/renderer/src/components/Row/Row.tsx`
- Modify: `src/renderer/src/panel/PanelApp/PanelApp.tsx`
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`

**Interfaces:**
- Consumes: `Project.uniqueSize?: number`. Convention: `const real = p.uniqueSize ?? p.size` (apparent when unknown); the "linked" split is shown only when `uniqueSize` is a number AND `size > uniqueSize`.

- [ ] **Step 1: `MiniRow` — guard the split**

In `src/renderer/src/components/MiniRow/MiniRow.tsx`, replace the `linked`/`sizeTip` lines and the headline:

```ts
  const known = p.uniqueSize !== undefined
  const real = p.uniqueSize ?? p.size
  const linked = known && p.size > real ? p.size - real : 0
  const sizeTip = linked
    ? `${formatSizeStr(real)} freeable now · ${formatSizeStr(linked)} linked to the pnpm store`
    : undefined
```

Then change the headline value `{formatSizeStr(p.uniqueSize)}` to `{formatSizeStr(real)}`, and the `linked > 0 && (...)` block already keys off `linked` (now correct).

- [ ] **Step 2: `Row` — same guard**

In `src/renderer/src/components/Row/Row.tsx`, find where it computes the size/linked (it passes `bytes`/`apparentBytes` to `SizeViz` and renders confirm text). Replace its uniqueSize usage with:

```ts
  const real = p.uniqueSize ?? p.size
```

Pass `bytes={real}` and `apparentBytes={p.size}` to `SizeViz` (so SizeViz shows the linked line only when apparent > real). If the file references `p.uniqueSize` elsewhere (e.g. sort/labels), replace each with `real`.

- [ ] **Step 3: `SizeViz` — already correct, confirm**

`src/renderer/src/components/SizeViz/SizeViz.tsx` already derives `linked = apparentBytes && apparentBytes > bytes ? apparentBytes - bytes : 0`. With `bytes = real` and `apparentBytes = p.size`, an unknown split yields `bytes === apparentBytes` → no linked line. No change required; do not edit unless Step 2 changed its props.

- [ ] **Step 4: `PanelApp` totals — use `?? size`**

In `src/renderer/src/panel/PanelApp/PanelApp.tsx`, replace the two reducers and the stale `freeable`:

```ts
  const totalUsed = useMemo(
    () => projects.reduce((a, p) => a + (p.uniqueSize ?? p.size), 0) + storeBytes,
    [projects, storeBytes],
  )
  const linkedTotal = useMemo(
    () => projects.reduce((a, p) => a + (p.uniqueSize !== undefined ? p.size - p.uniqueSize : 0), 0),
    [projects],
  )
```

And the stale-set freeable:

```ts
  const freeable = staleSet.reduce((a, p) => a + (p.uniqueSize ?? p.size), 0)
```

- [ ] **Step 5: `LauncherApp` totals/sort/max — use `?? size`**

In `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`:

```ts
  const totalUsed = useMemo(
    () => projects.reduce((a, p) => a + (p.uniqueSize ?? p.size), 0) + storeBytes,
    [projects, storeBytes],
  )
  const linkedTotal = useMemo(
    () => projects.reduce((a, p) => a + (p.uniqueSize !== undefined ? p.size - p.uniqueSize : 0), 0),
    [projects],
  )
  const maxBytes = useMemo(() => Math.max(1, ...projects.map((p) => p.uniqueSize ?? p.size)), [projects])
```

And in the `filtered` sort, change `sortBy === 'size'` comparison to:

```ts
      if (sortBy === 'size') return (b.uniqueSize ?? b.size) - (a.uniqueSize ?? a.size)
```

And the delete-confirm footer (`confirm.uniqueSize`, `confirm.size > confirm.uniqueSize`) — replace with a known-guarded version:

```ts
                  Delete <b>{confirm.name}</b>’s node_modules? Frees{' '}
                  <b style={{ color: '#fff' }}>{formatSizeStr(confirm.uniqueSize ?? confirm.size)}</b>
                  {confirm.uniqueSize !== undefined && confirm.size > confirm.uniqueSize ? (
                    <span style={{ color: 'var(--text-dim)' }}>
                      {' '}
                      ({formatSizeStr(confirm.size - confirm.uniqueSize)} linked stays in the pnpm store)
                    </span>
                  ) : (
                    '.'
                  )}
```

And the commitDelete toast `freed || p.uniqueSize` → `freed || (p.uniqueSize ?? p.size)`.

- [ ] **Step 6: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Verify tests + lint**

Run: `pnpm test && pnpm lint`
Expected: PASS / no errors.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/src/components/MiniRow src/renderer/src/components/Row src/renderer/src/components/SizeViz src/renderer/src/panel/PanelApp/PanelApp.tsx src/renderer/src/launcher/LauncherApp/LauncherApp.tsx
git commit -m "feat(renderer): tolerate undefined uniqueSize (apparent until rescanned)"
```

---

### Task 10: `RescanHint` component + wire into Panel & Launcher

**Files:**
- Create: `src/renderer/src/components/RescanHint/index.ts`
- Create: `src/renderer/src/components/RescanHint/RescanHint.tsx`
- Create: `src/renderer/src/components/RescanHint/RescanHint.types.ts`
- Modify: `src/renderer/src/panel/PanelApp/PanelApp.tsx`
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`

**Interfaces:**
- Produces: `RescanHintProps { accent: string; onRescan: () => void }`; `<RescanHint accent onRescan />`.
- Trigger condition (both surfaces): `const needsRescan = projects.some((p) => p.uniqueSize === undefined)`.

- [ ] **Step 1: Create the component types**

`src/renderer/src/components/RescanHint/RescanHint.types.ts`:

```ts
export interface RescanHintProps {
  accent: string
  onRescan: () => void
}
```

- [ ] **Step 2: Create the component**

`src/renderer/src/components/RescanHint/RescanHint.tsx`:

```tsx
import { UIIcon } from '@renderer/components/UIIcon'
import { mixColor } from '@renderer/lib/colors'
import type { ReactNode } from 'react'
import type { RescanHintProps } from './RescanHint.types'

/** Shown when any project predates the real/linked split — one rescan fixes it. */
export function RescanHint({ accent, onRescan }: RescanHintProps): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        margin: '6px 12px',
        padding: '8px 11px',
        borderRadius: 9,
        background: mixColor('rgba(0,0,0,0)', accent, 0.1),
        border: '1px solid var(--surface-3)',
      }}
    >
      <span style={{ color: accent, display: 'flex', flex: 'none' }}>{UIIcon.refresh({ size: 14 })}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Real vs linked sizes need a rescan</div>
        <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
          These projects were scanned before the pnpm split was measured.
        </div>
      </div>
      <button
        onClick={onRescan}
        style={{
          border: '1px solid var(--surface-4)',
          cursor: 'pointer',
          padding: '4px 10px',
          borderRadius: 7,
          background: 'var(--surface-1)',
          color: 'rgba(255,255,255,0.85)',
          fontSize: 11.5,
          fontWeight: 600,
          flex: 'none',
        }}
      >
        Rescan
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create the barrel**

`src/renderer/src/components/RescanHint/index.ts`:

```ts
export { RescanHint } from './RescanHint'
```

- [ ] **Step 4: Wire into `PanelApp`**

In `src/renderer/src/panel/PanelApp/PanelApp.tsx`, add the import:

```ts
import { RescanHint } from '@renderer/components/RescanHint'
```

Add the condition near the other derived values (after `projects`):

```ts
  const needsRescan = useMemo(() => projects.some((p) => p.uniqueSize === undefined), [projects])
```

In the `view === 'main'` branch, render the hint right after `<Separator />` that follows `DiskSummary` and before the project list block:

```tsx
          {needsRescan && <RescanHint accent={accent} onRescan={() => setView('scan')} />}
```

- [ ] **Step 5: Wire into `LauncherApp`**

In `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`, add the import:

```ts
import { RescanHint } from '@renderer/components/RescanHint'
```

Add the derived flag near `totalUsed`:

```ts
  const needsRescan = useMemo(() => projects.some((p) => p.uniqueSize === undefined), [projects])
```

In the `tab === 'projects'` list branch (the `else` that renders `cc-list`), render the hint above the list `div`, only when not empty:

```tsx
              {needsRescan && <RescanHint accent={accent} onRescan={rescan} />}
```

Place it immediately before `<div ref={listRef} className="cc-list" ...>`.

- [ ] **Step 6: Verify typecheck + lint + tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/components/RescanHint src/renderer/src/panel/PanelApp/PanelApp.tsx src/renderer/src/launcher/LauncherApp/LauncherApp.tsx
git commit -m "feat(renderer): rescan-to-compute hint for legacy caches"
```

---

### Task 11: `usePnpmStore` refresh + `PnpmStoreSettings` UI

**Files:**
- Modify: `src/renderer/src/hooks/usePnpmStore.ts`
- Create: `src/renderer/src/components/PnpmStoreSettings/index.ts`
- Create: `src/renderer/src/components/PnpmStoreSettings/PnpmStoreSettings.tsx`
- Create: `src/renderer/src/components/PnpmStoreSettings/PnpmStoreSettings.types.ts`
- Modify: `src/renderer/src/launcher/views/SettingsView.tsx`

**Interfaces:**
- Produces (`usePnpmStore`): adds `refresh: () => Promise<void>` (re-fetches with `force: true`).
- Produces: `PnpmStoreSettingsProps { settings: Settings; setSetting: SetSetting; store: PnpmStoreInfo | null; onRefresh: () => void }`.

- [ ] **Step 1: Add `refresh` to `usePnpmStore`**

In `src/renderer/src/hooks/usePnpmStore.ts`, extend the interface and return value:

```ts
interface UsePnpmStore {
  store: PnpmStoreInfo | null
  pruning: boolean
  prune: () => Promise<PnpmPruneResult | null>
  refresh: () => Promise<void>
}
```

Add the callback (after `prune`):

```ts
  const refresh = useCallback(async (): Promise<void> => {
    setStore(await window.clean.getPnpmStore(true))
  }, [])
```

And return it: `return { store, pruning, prune, refresh }`.

- [ ] **Step 2: Create the component types**

`src/renderer/src/components/PnpmStoreSettings/PnpmStoreSettings.types.ts`:

```ts
import type { SetSetting } from '@renderer/hooks/useSettings'
import type { PnpmStoreInfo } from '@shared/pnpm-store.types'
import type { Settings } from '@shared/settings.types'

export interface PnpmStoreSettingsProps {
  settings: Settings
  setSetting: SetSetting
  store: PnpmStoreInfo | null
  /** Re-resolve the store after an override changes. */
  onRefresh: () => void
}
```

- [ ] **Step 3: Create the component**

`src/renderer/src/components/PnpmStoreSettings/PnpmStoreSettings.tsx`:

```tsx
import { formatSizeStr } from '@renderer/lib/format'
import type { PnpmStoreInfo } from '@shared/pnpm-store.types'
import type { ReactNode } from 'react'
import type { PnpmStoreSettingsProps } from './PnpmStoreSettings.types'

const SOURCE_LABEL: Record<PnpmStoreInfo['source'], string> = {
  manual: 'set manually',
  pnpm: 'detected automatically',
  inferred: 'found on disk',
  none: '',
}

function statusLine(store: PnpmStoreInfo | null): string {
  if (!store) return 'Checking…'
  if (store.available) {
    return `${store.displayPath} · ${formatSizeStr(store.sizeBytes)} · ${SOURCE_LABEL[store.source]}`
  }
  return store.reason ?? 'pnpm store not found'
}

function PathRow({
  label,
  value,
  placeholder,
  mode,
  onPick,
  onClear,
}: {
  label: string
  value: string
  placeholder: string
  mode: 'file' | 'folder'
  onPick: (path: string) => void
  onClear: () => void
}): ReactNode {
  return (
    <div style={{ padding: '11px 4px' }}>
      <div style={{ fontSize: 13.5, fontWeight: 550, color: 'var(--text)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            color: value ? 'var(--text-muted)' : 'var(--text-dim)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'ui-monospace, monospace',
          }}
          title={value || placeholder}
        >
          {value || placeholder}
        </div>
        <button
          className="cc-btn ghost"
          onClick={() => {
            void window.clean.pickPath(mode).then((p) => {
              if (p) onPick(p)
            })
          }}
        >
          Choose…
        </button>
        {value && (
          <button className="cc-btn ghost" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

/** Manual pnpm store / binary overrides with a live detection status line. */
export function PnpmStoreSettings({ settings, setSetting, store, onRefresh }: PnpmStoreSettingsProps): ReactNode {
  const apply = (key: 'pnpmStorePath' | 'pnpmBinaryPath', value: string): void => {
    void setSetting(key, value)
    // give the main process a tick to persist before re-resolving
    setTimeout(onRefresh, 50)
  }
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', padding: '2px 4px 8px' }}>{statusLine(store)}</div>
      {store?.available && !store.canPrune && (
        <div style={{ fontSize: 11.5, color: 'var(--text-dim)', padding: '0 4px 8px' }}>
          Pruning needs a runnable pnpm binary — set one below to enable it.
        </div>
      )}
      <PathRow
        label="pnpm store folder"
        value={settings.pnpmStorePath ?? ''}
        placeholder="Auto-detected — choose to override"
        mode="folder"
        onPick={(p) => apply('pnpmStorePath', p)}
        onClear={() => apply('pnpmStorePath', '')}
      />
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
      <PathRow
        label="pnpm binary"
        value={settings.pnpmBinaryPath ?? ''}
        placeholder="Auto-detected — choose to override"
        mode="file"
        onPick={(p) => apply('pnpmBinaryPath', p)}
        onClear={() => apply('pnpmBinaryPath', '')}
      />
    </div>
  )
}
```

- [ ] **Step 4: Create the barrel**

`src/renderer/src/components/PnpmStoreSettings/index.ts`:

```ts
export { PnpmStoreSettings } from './PnpmStoreSettings'
```

- [ ] **Step 5: Render it in the launcher `SettingsView`**

`SettingsView` currently takes `{ settings, setSetting, accent }`. Extend its props to receive store + refresh, and render a new section. In `src/renderer/src/launcher/views/SettingsView.tsx`:

Update the props interface:

```ts
import type { PnpmStoreInfo } from '@shared/pnpm-store.types'
import { PnpmStoreSettings } from '@renderer/components/PnpmStoreSettings'

interface SettingsViewProps {
  settings: Settings
  setSetting: SetSetting
  accent: string
  store: PnpmStoreInfo | null
  onRefreshStore: () => void
}
```

Update the function signature: `export function SettingsView({ settings, setSetting, accent, store, onRefreshStore }: SettingsViewProps)`.

Add a section before the `Uninstall` row (after the `Threshold notifications` row + its divider):

```tsx
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
      <div style={{ padding: '13px 4px 4px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 550, color: 'var(--text)' }}>pnpm store</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
          Override detection if the store or pnpm can’t be found automatically
        </div>
      </div>
      <PnpmStoreSettings settings={settings} setSetting={setSetting} store={store} onRefresh={onRefreshStore} />
```

- [ ] **Step 6: Pass store + refresh from `LauncherApp`**

In `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`, the `usePnpmStore()` destructure becomes:

```ts
  const { store, pruning, prune, refresh } = usePnpmStore()
```

And the `SettingsView` render gains props:

```tsx
          {view === 'settings' && (
            <SettingsView
              settings={settings}
              setSetting={setSetting}
              accent={accent}
              store={store}
              onRefreshStore={() => void refresh()}
            />
          )}
```

- [ ] **Step 7: Verify typecheck + lint + tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/src/hooks/usePnpmStore.ts src/renderer/src/components/PnpmStoreSettings src/renderer/src/launcher/views/SettingsView.tsx src/renderer/src/launcher/LauncherApp/LauncherApp.tsx
git commit -m "feat(renderer): pnpm store override settings with live status"
```

---

### Task 12: Surface `reason` + disable prune when `!canPrune`

**Files:**
- Modify: `src/renderer/src/launcher/views/CachesView.tsx`
- Modify: `src/renderer/src/panel/PanelApp/PnpmStoreRow.tsx`
- Modify: `src/renderer/src/panel/PanelApp/PanelApp.tsx`

**Interfaces:**
- Consumes: `PnpmStoreInfo.reason`, `PnpmStoreInfo.canPrune`.

- [ ] **Step 1: `CachesView` — show the real reason and reflect prunability**

In `src/renderer/src/launcher/views/CachesView.tsx`, the `detail` for the unavailable case currently hardcodes `'pnpm not found on your PATH'`. Replace the `detail` expression:

```tsx
            detail={
              pruning
                ? 'Pruning unreferenced packages…'
                : storeAvailable
                  ? (store?.displayPath ?? '')
                  : (store?.reason ?? 'pnpm store not found')
            }
```

When the store is available via inference but not prunable, also gate the action. Change `onAction`/disabled wiring so the row still shows size but Prune is inert when `!store?.canPrune`:

```tsx
            size={storeAvailable ? store?.sizeBytes : undefined}
            selected={selectedIndex === 0 && storeAvailable}
            disabled={!storeAvailable}
            busy={pruning}
            actionLabel={store?.canPrune ? 'Prune' : undefined}
            onSelect={() => onSelectIndex(0)}
            onAction={onPrune}
```

(If `CacheRow` renders the action only when `actionLabel` is set, passing `undefined` hides Prune. Verify `CacheRow.types`; if `actionLabel` is required, instead pass a no-op `onAction` and keep the label — choose whichever its API supports without changing `CacheRow`.)

- [ ] **Step 2: `PnpmStoreRow` (panel) — hide Prune when not prunable**

In `src/renderer/src/panel/PanelApp/PnpmStoreRow.tsx`, gate the Prune `<button>` on `store.canPrune`. Wrap the button:

```tsx
        {store.canPrune && (
          <button
            onClick={onPrune}
            disabled={pruning}
            title="Remove packages no project references (pnpm store prune)"
            style={{
              border: '1px solid var(--surface-4)',
              cursor: pruning ? 'default' : 'pointer',
              padding: '4px 9px',
              borderRadius: 7,
              background: 'var(--surface-1)',
              color: pruning ? 'var(--text-dim)' : 'rgba(255,255,255,0.85)',
              fontSize: 11.5,
              fontWeight: 600,
              flex: 'none',
            }}
          >
            {pruning ? 'Pruning…' : 'Prune'}
          </button>
        )}
```

- [ ] **Step 3: `PanelApp` — show the store row whenever available (not just prunable)**

The panel currently renders `PnpmStoreRow` only when `store?.available`. That is already correct (inference sets `available: true`). No change needed beyond Step 2. Confirm by reading the `{store?.available && (…PnpmStoreRow…)}` block — leave as is.

- [ ] **Step 4: Verify typecheck + lint + tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/launcher/views/CachesView.tsx src/renderer/src/panel/PanelApp/PnpmStoreRow.tsx
git commit -m "feat(renderer): show store reason; disable prune when no runnable pnpm"
```

---

### Task 13: Full verification, manual smoke test, STATUS.html

**Files:**
- Modify: `STATUS.html` (STATUS data block only)

- [ ] **Step 1: Full green gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all PASS.

- [ ] **Step 2: Manual smoke test (dev)**

Run: `pnpm dev`. Verify, in order:
1. With the existing (legacy) cache, the **RescanHint** appears in both panel and launcher.
2. Click **Rescan** → after the scan, the hint disappears and rows show "X · Y linked".
3. Open launcher Settings → the **pnpm store** section shows a status line with the detected store path + size + "detected automatically".
4. Click **Choose…** on the store folder → pick `~/Library/pnpm/store/v11` → status flips to "set manually" and size still shows.
5. Click **Clear** → reverts to auto-detection.

Simulate a broken pnpm to exercise inference (optional): temporarily rename the binary, e.g. `mv "$(which pnpm)" /tmp/pnpm.bak`, restart dev, confirm the store size still appears (source "found on disk") and Prune is hidden/disabled; then restore: `mv /tmp/pnpm.bak "$(which pnpm)"`.

- [ ] **Step 3: Update `STATUS.html`**

Edit only the `STATUS` data block: bump `updated` to `2026-06-24`, add a `done` roadmap item under "Beyond node_modules" or "Core app" describing robust pnpm store detection + manual override + rescan hint, and append one `log` entry:

```js
    { date: "2026-06-24", text: "Made pnpm store detection a no-fail zone (branch feat/pnpm-store-robustness). Layered resolution: manual store/binary override > run pnpm (node-prepended) > infer the store dir straight from disk (PNPM_HOME/~/Library/pnpm/~/.local/share/pnpm, newest v<N>) > none-with-reason. Shared runtime-bins discovery now finds npm-global/corepack pnpm under nvm/volta/asdf, not just standalone/Homebrew. New Settings 'pnpm store' section with native folder/file pickers + a live status line; PnpmStoreInfo gained source/reason/canPrune (sizing survives a broken pnpm; prune stays honest). Separately fixed the missing real/linked diff: stop back-filling uniqueSize=size for pre-split caches (now undefined=unknown) and show a one-click 'rescan to compute' hint in panel + launcher. TDD on runtime-bins/find-pnpm/infer-store/validate-setting/project-store; typecheck/lint/tests/build green." }
```

- [ ] **Step 4: Commit**

```bash
git add STATUS.html
git commit -m "docs: STATUS — robust pnpm store detection + manual override + diff hint"
```

- [ ] **Step 5: Push and open PR**

```bash
git push -u origin feat/pnpm-store-robustness
gh pr create --base main --title "feat: robust pnpm store detection + manual override + rescan hint" --body "Implements docs/superpowers/specs/2026-06-24-pnpm-store-robustness-design.md. Depends on #19 (uniqueSize)."
```

---

## Self-Review

**Spec coverage:**
- Layered resolution (manual > pnpm > inferred > none) → Task 5. ✓
- `source`/`reason`/`canPrune` → Task 1. ✓
- Filesystem inference → Task 4. ✓
- Shared runtime-bin discovery + find-pnpm hardening → Tasks 2–3. ✓
- Manual override settings + validation → Task 6. ✓
- Native pickers → Task 7. ✓
- Settings UI section + live status → Task 11. ✓
- `uniqueSize` optional, stop back-fill → Task 8. ✓
- Renderer tolerates undefined + totals → Task 9. ✓
- Rescan hint (single banner, both surfaces) → Task 10. ✓
- Surface reason + prune gating → Task 12. ✓
- Tests on pure logic → Tasks 2,3,4,6,8. ✓
- STATUS.html → Task 13. ✓

**Placeholder scan:** Task 11 Step 3 contains a deliberately-flagged awkward guard; Step 7 instructs the exact final form (`{store?.available && !store.canPrune && …}`). No "TBD"/"handle errors"/"similar to" placeholders elsewhere.

**Type consistency:** `getPnpmStoreInfo(force, overrides)`, `prunePnpmStore(overrides)`, `findPnpm(overrideBin?)`, `pnpmCandidates(env, home, nvmBins?, overrideBin?)`, `versionManagerBinDirs(env, home, nvmBins)`, `inferStoreDir(env, home)`, `Settings.pnpmStorePath?/pnpmBinaryPath?`, `PnpmStoreInfo.source/reason/canPrune`, `usePnpmStore().refresh` — names are used identically across producing and consuming tasks.
