# Visualization-Only Menu Bar Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the menu bar popover from a mini node_modules cleaner into a read-only dashboard — an aggregate "Tracked on disk" hero plus four click-through rows (Projects / Caches / Packages / Docker) that open their tab in the main window.

**Architecture:** All arithmetic, gating and copy live in one pure module (`panelAreas.ts`) that takes projects/store/docker/inventory/settings and returns the hero totals plus a resolved row list. `PanelApp.tsx` and a new `AreaBar` are thin layout over that. Click-through widens the existing `LauncherNavTarget` union (transport already works) and routes through a second pure module (`launcherNav.ts`).

**Tech Stack:** Electron + React 18 + TypeScript, vitest, biome, pnpm.

**Spec:** `docs/superpowers/specs/2026-07-15-panel-visualization-only-design.md` — read it before Task 1. Decisions are referenced below as D1–D8.

## Global Constraints

- **Package manager is pnpm.** Never `npm`/`yarn`. Verify with `pnpm test`, `pnpm typecheck`, `pnpm lint`.
- **Tests are pure-logic only.** `vitest.config.ts` includes `src/**/*.test.ts` — `.tsx` is NOT matched and there is no React Testing Library. Never write a component test; put logic in `.ts` so it can be tested.
- **No em dashes in user-facing copy.** Use `·`, `,` or a full stop. (Applies to every string rendered in the UI.)
- **One folder per component:** `index.ts`, `Component.tsx`, `Component.types.ts`, optionally `.constants.ts` + tests.
- **Conventional commits:** `feat(app): …`, `fix(app): …`, `refactor(app): …`, `test(app): …`, `docs: …`.
- **Path aliases:** `@shared/*` → `src/shared/*`, `@renderer/*` → `src/renderer/src/*`. Use them; never write deep relative imports across those roots.
- **Branch:** `feat/docker-project-grouping` (already checked out).
- **Byte units** come from `@shared/units.constants` (re-exported by `@renderer/lib/format`): `GB = 1024**3`. Never hand-roll `1e9`.
- **Do not touch** launcher tab content, delete paths, or the license gate. This change is panel + nav only.

---

## File Structure

**Create:**
- `src/renderer/src/lib/staleness/staleness.ts` — `DOCKER_STALE_MS`, shared by launcher + panel (Task 2)
- `src/renderer/src/lib/staleness/index.ts`
- `src/renderer/src/launcher/LauncherApp/launcherNav.ts` — pure nav target → `{view, tab}` map (Task 1)
- `src/renderer/src/launcher/LauncherApp/launcherNav.test.ts`
- `src/renderer/src/panel/PanelApp/panelAreas.ts` — the brain: hero math + row gating (Tasks 3, 4)
- `src/renderer/src/panel/PanelApp/panelAreas.test.ts`
- `src/renderer/src/panel/PanelApp/AreaBar/{AreaBar.tsx,AreaBar.types.ts,index.ts}` — one click-through row (Task 5)
- `src/renderer/src/panel/PanelApp/TrackedSummary/{TrackedSummary.tsx,TrackedSummary.types.ts,index.ts}` — the hero (Task 6)

**Modify:**
- `src/shared/launcher-nav.types.ts` — widen the union (Task 1)
- `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx` — use `launcherNav`, import shared `DOCKER_STALE_MS` (Tasks 1, 2)
- `src/renderer/src/panel/PanelApp/PanelApp.tsx` — strip (Task 7), then rewire (Task 8)
- `src/renderer/src/panel/PanelApp/PanelEmpty.tsx` — drop `reclaimed` + the "All clean" branch (Task 7, D6b)
- `src/renderer/src/panel/PanelApp/PanelApp.types.ts` + `index.ts` — drop `PanelToast` (Task 7)
- `STATUS.html` — session log (Task 9)

**Delete:**
- `src/renderer/src/panel/PanelApp/PnpmStoreRow.tsx`, `CleanStaleCta.tsx` (Task 7)
- `src/renderer/src/panel/PanelApp/PanelApp.constants.ts` (Task 7 — `STALE_DAYS`/`VISIBLE_ROWS` are used only by the code Task 7 removes; LauncherApp has its own local `VISIBLE_ROWS = 7` and is unaffected)
- `src/renderer/src/panel/PanelApp/DiskSummary.tsx` (Task 6 — superseded by `TrackedSummary`)

---

### Task 1: Widen the nav target + pure nav map

Enables click-through. The transport (`openLauncher(nav)` → `pendingNav` / `onLauncherNavigate` → `consumeLauncherNav`) already handles fresh and already-open windows and needs no change (D8).

**Files:**
- Modify: `src/shared/launcher-nav.types.ts`
- Create: `src/renderer/src/launcher/LauncherApp/launcherNav.ts`
- Test: `src/renderer/src/launcher/LauncherApp/launcherNav.test.ts`
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx:122-129`

**Interfaces:**
- Produces: `LauncherNavTarget = 'settings' | 'projects' | 'caches' | 'packages' | 'docker'` (from `@shared/launcher-nav.types`); `launcherNavState(target: LauncherNavTarget): LauncherNavState` where `LauncherNavState = { view: LauncherView; tab?: LauncherTab }`.

- [ ] **Step 1: Widen the union**

Replace the whole of `src/shared/launcher-nav.types.ts`:

```ts
/** A view or tab the launcher can be told to open on (e.g. from a menu-bar panel click). */
export type LauncherNavTarget = 'settings' | 'projects' | 'caches' | 'packages' | 'docker'
```

- [ ] **Step 2: Write the failing test**

Create `src/renderer/src/launcher/LauncherApp/launcherNav.test.ts`:

```ts
import type { LauncherNavTarget } from '@shared/launcher-nav.types'
import { describe, expect, it } from 'vitest'
import { launcherNavState } from './launcherNav'

describe('launcherNavState', () => {
  it('settings opens the settings view, not a tab', () => {
    expect(launcherNavState('settings')).toEqual({ view: 'settings' })
  })

  it('each tab target opens the list view on that tab', () => {
    expect(launcherNavState('projects')).toEqual({ view: 'list', tab: 'projects' })
    expect(launcherNavState('caches')).toEqual({ view: 'list', tab: 'caches' })
    expect(launcherNavState('packages')).toEqual({ view: 'list', tab: 'packages' })
    expect(launcherNavState('docker')).toEqual({ view: 'list', tab: 'docker' })
  })

  it('ignores an unknown target rather than selecting a bogus tab (arrives over IPC)', () => {
    expect(launcherNavState('nope' as LauncherNavTarget)).toEqual({ view: 'list' })
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run src/renderer/src/launcher/LauncherApp/launcherNav.test.ts`
Expected: FAIL — cannot find module `./launcherNav`.

- [ ] **Step 4: Write the implementation**

Create `src/renderer/src/launcher/LauncherApp/launcherNav.ts`:

```ts
import type { LauncherNavTarget } from '@shared/launcher-nav.types'
import type { LauncherTab, LauncherView } from './LauncherApp.types'

export interface LauncherNavState {
  view: LauncherView
  /** Only set for tab targets; undefined leaves the current tab alone. */
  tab?: LauncherTab
}

const TAB_TARGETS: readonly LauncherTab[] = ['projects', 'caches', 'packages', 'docker']

/** Where a nav target lands the launcher. The target crosses an IPC boundary, so an
 *  unrecognized value falls back to the list rather than selecting a bogus tab. */
export function launcherNavState(target: LauncherNavTarget): LauncherNavState {
  if (target === 'settings') return { view: 'settings' }
  const tab = TAB_TARGETS.find((t) => t === target)
  return tab ? { view: 'list', tab } : { view: 'list' }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/renderer/src/launcher/LauncherApp/launcherNav.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Use it in LauncherApp**

In `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`, add to the imports:

```ts
import { launcherNavState } from './launcherNav'
```

Replace the effect at lines 122-129 (the one containing the two `if (nav === 'settings') setView('settings')` checks) with:

```ts
  const applyNav = useCallback((nav: LauncherNavTarget | null): void => {
    if (!nav) return
    const next = launcherNavState(nav)
    setView(next.view)
    if (next.tab) setTab(next.tab)
  }, [])
  useEffect(() => {
    void window.clean.consumeLauncherNav().then(applyNav)
    return window.clean.onLauncherNavigate(applyNav)
  }, [applyNav])
```

`LauncherNavTarget` is **not** currently imported in this file — add it:

```ts
import type { LauncherNavTarget } from '@shared/launcher-nav.types'
```

`useCallback`, `useEffect` and `useState` are already imported.

- [ ] **Step 7: Verify nothing regressed**

Run: `pnpm typecheck && pnpm vitest run && pnpm lint`
Expected: typecheck clean, all tests pass, lint clean.

- [ ] **Step 8: Commit**

```bash
git add src/shared/launcher-nav.types.ts src/renderer/src/launcher/LauncherApp/launcherNav.ts src/renderer/src/launcher/LauncherApp/launcherNav.test.ts src/renderer/src/launcher/LauncherApp/LauncherApp.tsx
git commit -m "feat(app): launcher can be told to open on any tab, not just settings"
```

---

### Task 2: Share DOCKER_STALE_MS

The panel needs the same staleness rule as the Docker tab (D7). Move the constant out of `LauncherApp.tsx` so both import one definition instead of duplicating `5 * 60 * 1000`.

**Files:**
- Create: `src/renderer/src/lib/staleness/staleness.ts`, `src/renderer/src/lib/staleness/index.ts`
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx:56-57`

**Interfaces:**
- Consumes: nothing.
- Produces: `DOCKER_STALE_MS: number` from `@renderer/lib/staleness`.

- [ ] **Step 1: Create the module**

Create `src/renderer/src/lib/staleness/staleness.ts`:

```ts
/** Re-probe Docker when a surface that shows Docker data opens and the cached
 *  info is older than this. `getDockerInfo` caches until forced, so without a
 *  staleness rule the numbers would never move. */
export const DOCKER_STALE_MS = 5 * 60 * 1000
```

Create `src/renderer/src/lib/staleness/index.ts`:

```ts
export { DOCKER_STALE_MS } from './staleness'
```

- [ ] **Step 2: Point LauncherApp at it**

In `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`, delete lines 56-57:

```ts
/** Re-scan Docker when its tab opens and the data is older than this. */
const DOCKER_STALE_MS = 5 * 60 * 1000
```

and add to the imports:

```ts
import { DOCKER_STALE_MS } from '@renderer/lib/staleness'
```

Leave the effect at `:142-146` otherwise untouched.

- [ ] **Step 3: Verify**

Run: `pnpm typecheck && pnpm vitest run && pnpm lint`
Expected: all green. No behavior change — this is a pure move.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/lib/staleness src/renderer/src/launcher/LauncherApp/LauncherApp.tsx
git commit -m "refactor(app): share DOCKER_STALE_MS so the panel can reuse the staleness rule"
```

---

### Task 3: panelAreas — hero totals (D3, D4, D5)

The hero arithmetic. **Read D3, D4 and D5 in the spec before writing this** — the invariant "hero is smaller than the rows added up, by exactly the pnpm store" is deliberate, not a bug.

Key facts you need:
- `totalUsed` = `sum(project.uniqueSize ?? project.size) + storeBytes`. It **already includes the pnpm store** (this mirrors `LauncherApp.tsx:157` and the panel's current line 48).
- The Caches gauge is `storeBytes` — the same store again. That overlap is intentional in the launcher; the hero must count it once.
- Hero = `totalUsed + dockerTotal`.
- `dockerTotal` = sum of `docker.totals[].sizeBytes` (mirrors `LauncherApp.tsx:174`). It includes build cache; there is no double count because the Caches *gauge* is store-only.

**Files:**
- Create: `src/renderer/src/panel/PanelApp/panelAreas.ts`
- Test: `src/renderer/src/panel/PanelApp/panelAreas.test.ts`

**Interfaces:**
- Consumes: `GB` from `@renderer/lib/format`; types from `@shared/*`.
- Produces: `panelAreas(input: PanelAreasInput): PanelAreas` with `PanelAreas = { heroBytes, combinedLimitGB, trackMaxGB, areaCount, rows }`. Task 4 adds `rows`; this task returns `rows: []`.

- [ ] **Step 1: Write the failing test**

Create `src/renderer/src/panel/PanelApp/panelAreas.test.ts`:

```ts
import { GB } from '@renderer/lib/format'
import type { DockerInfo } from '@shared/docker.types'
import type { PnpmStoreInfo } from '@shared/pnpm-store.types'
import type { Project } from '@shared/project.types'
import { describe, expect, it } from 'vitest'
import { type PanelAreasInput, panelAreas } from './panelAreas'

const project = (uniqueSize: number): Project => ({
  id: `p${uniqueSize}`,
  name: 'demo',
  path: '~/demo',
  absPath: '/Users/x/demo',
  kind: 'node',
  size: uniqueSize,
  uniqueSize,
  lastUsed: 0,
})

const store = (sizeBytes: number, available = true): PnpmStoreInfo => ({
  available,
  path: '/store',
  displayPath: '~/store',
  sizeBytes,
  checkedAt: 0,
  source: 'pnpm',
  canPrune: true,
})

const docker = (sizeBytes: number, available = true): DockerInfo => ({
  available,
  checkedAt: 0,
  totals: [{ kind: 'image', sizeBytes, reclaimableBytes: 0, count: 1 }],
  items: [],
  projects: [],
})

// 34.8 GB of project-unique bytes + a 6.4 GB store + 23.6 GB of Docker.
const base: PanelAreasInput = {
  projects: [project(34.8 * GB)],
  store: store(6.4 * GB),
  docker: docker(23.6 * GB),
  dockerEnabled: true,
  inventory: null,
  checkUpdates: true,
  thresholdGB: 20,
  cacheThresholdGB: 10,
  dockerThresholdGB: 20,
}

describe('panelAreas hero', () => {
  it('counts every byte once: hero = projects + store + docker', () => {
    // 34.8 + 6.4 (store, once) + 23.6 = 64.8
    expect(panelAreas(base).heroBytes).toBeCloseTo(64.8 * GB, 0)
  })

  it('combined limit sums the three limits', () => {
    expect(panelAreas(base).combinedLimitGB).toBe(50)
    expect(panelAreas(base).areaCount).toBe(3)
  })

  it('drops Docker bytes, limit and area when Docker is disabled', () => {
    const r = panelAreas({ ...base, dockerEnabled: false })
    expect(r.heroBytes).toBeCloseTo(41.2 * GB, 0)
    expect(r.combinedLimitGB).toBe(30)
    expect(r.areaCount).toBe(2)
  })

  it('drops Docker the same way when the daemon is unavailable', () => {
    const r = panelAreas({ ...base, docker: docker(23.6 * GB, false) })
    expect(r.heroBytes).toBeCloseTo(41.2 * GB, 0)
    expect(r.combinedLimitGB).toBe(30)
    expect(r.areaCount).toBe(2)
  })

  it('drops the cache limit and area when no store is available', () => {
    // An unavailable store contributes no bytes, so the hero loses its 6.4 GB too.
    const r = panelAreas({ ...base, store: store(6.4 * GB, false) })
    expect(r.heroBytes).toBeCloseTo(58.4 * GB, 0)
    expect(r.combinedLimitGB).toBe(40)
    expect(r.areaCount).toBe(2)
  })

  it('falls back to apparent size for projects never rescanned', () => {
    const p: Project = { ...project(0), size: 5 * GB, uniqueSize: undefined }
    const r = panelAreas({ ...base, projects: [p], store: store(0), docker: docker(0) })
    expect(r.heroBytes).toBeCloseTo(5 * GB, 0)
  })

  it('scales the meter track past the limit and past usage', () => {
    // 64.8 used vs a 50 GB combined limit: track must clear usage.
    expect(panelAreas(base).trackMaxGB).toBeGreaterThan(64.8)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/renderer/src/panel/PanelApp/panelAreas.test.ts`
Expected: FAIL — cannot find module `./panelAreas`.

- [ ] **Step 3: Write the implementation**

Create `src/renderer/src/panel/PanelApp/panelAreas.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/renderer/src/panel/PanelApp/panelAreas.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/panel/PanelApp/panelAreas.ts src/renderer/src/panel/PanelApp/panelAreas.test.ts
git commit -m "feat(app): panelAreas computes the panel hero totals, each byte counted once"
```

---

### Task 4: panelAreas — the row list (D4, D6, D6b)

Adds the four rows with their gating resolved. **Read D6 and D6b in the spec first.** The rule that matters: never render a gauge for data that was never measured, and never let one empty area collapse the dashboard.

**Files:**
- Modify: `src/renderer/src/panel/PanelApp/panelAreas.ts`
- Test: `src/renderer/src/panel/PanelApp/panelAreas.test.ts`

**Interfaces:**
- Consumes: `panelAreas` / `PanelAreasInput` from Task 3; `severityCounts`, `SeverityCounts` from `@renderer/lib/severity`; `LauncherNavTarget` from `@shared/launcher-nav.types` (Task 1).
- Produces: the `PanelAreaRow` discriminated union (replacing Task 3's `type PanelAreaRow = never`), populated on `PanelAreas.rows`. Task 5's `AreaBar` renders exactly one of these.

- [ ] **Step 1: Write the failing tests**

Append to `src/renderer/src/panel/PanelApp/panelAreas.test.ts`. Two import lines at the top of that file must change first — add the package types, and pull in the row type the helpers below annotate:

```ts
import type { PackageEntry, PackageInventory } from '@shared/package.types'
// widen the existing panelAreas import to include the row type:
import { type PanelAreaRow, type PanelAreasInput, panelAreas } from './panelAreas'
```

```ts
const inventory = (packages: PackageEntry[], enrichmentError?: string): PackageInventory => ({
  packages,
  computedAt: 1,
  projectCount: 1,
  ...(enrichmentError ? { enrichmentError } : {}),
})

const pkg = (name: string, severity?: 'critical' | 'high'): PackageEntry => ({
  name,
  usages: [],
  projectCount: 1,
  versions: ['1.0.0'],
  multipleVersions: false,
  ...(severity ? { advisory: { severity, title: 't', vulnerableVersions: '<1' } } : {}),
})

const rowIds = (i: PanelAreasInput): string[] => panelAreas(i).rows.map((r) => r.id)
const row = (i: PanelAreasInput, id: string): PanelAreaRow => {
  const found = panelAreas(i).rows.find((r) => r.id === id)
  if (!found) throw new Error(`no ${id} row`)
  return found
}

describe('panelAreas rows', () => {
  it('lists the four areas in order when everything is present', () => {
    expect(rowIds(base)).toEqual(['projects', 'caches', 'packages', 'docker'])
  })

  it('every size row mirrors its tab headline number', () => {
    const r = base
    // Projects mirrors totalUsed, which INCLUDES the store (34.8 + 6.4).
    expect(row(r, 'projects')).toMatchObject({ kind: 'size', usedBytes: 41.2 * GB, thresholdGB: 20 })
    // Caches mirrors the Caches gauge: the store alone.
    expect(row(r, 'caches')).toMatchObject({ kind: 'size', usedBytes: 6.4 * GB, thresholdGB: 10 })
    expect(row(r, 'docker')).toMatchObject({ kind: 'size', usedBytes: 23.6 * GB, thresholdGB: 20 })
  })

  it('rows exceed the hero by exactly the pnpm store (D4 invariant)', () => {
    const r = panelAreas(base)
    const summed = r.rows.reduce((a, x) => a + (x.kind === 'size' ? x.usedBytes : 0), 0)
    expect(summed - r.heroBytes).toBeCloseTo(6.4 * GB, 0)
  })

  it('each row carries the nav target for its tab', () => {
    expect(row(base, 'projects').nav).toBe('projects')
    expect(row(base, 'caches').nav).toBe('caches')
    expect(row(base, 'packages').nav).toBe('packages')
    expect(row(base, 'docker').nav).toBe('docker')
  })

  it('hides the Docker row when disabled or unavailable', () => {
    expect(rowIds({ ...base, dockerEnabled: false })).toEqual(['projects', 'caches', 'packages'])
    expect(rowIds({ ...base, docker: docker(1 * GB, false) })).toEqual(['projects', 'caches', 'packages'])
  })

  it('hides the Caches row when no store is available', () => {
    expect(rowIds({ ...base, store: store(6.4 * GB, false) })).toEqual(['projects', 'packages', 'docker'])
  })

  it('shows severity once an inventory is cached', () => {
    const r = row({ ...base, inventory: inventory([pkg('a', 'critical'), pkg('b', 'high'), pkg('c')]) }, 'packages')
    expect(r).toMatchObject({ kind: 'severity', packagesTotal: 3 })
    if (r.kind !== 'severity') throw new Error('expected severity')
    expect(r.severity.vulnerable).toBe(2)
    expect(r.severity.critical).toBe(1)
  })

  it('placeholders rather than claiming all clear when never computed', () => {
    expect(row(base, 'packages')).toMatchObject({ kind: 'placeholder', note: 'Not checked yet' })
  })

  it('placeholders when the update check is off', () => {
    const i = { ...base, checkUpdates: false, inventory: inventory([pkg('a')]) }
    expect(row(i, 'packages')).toMatchObject({ kind: 'placeholder' })
  })

  it('placeholders when enrichment failed, so 0 vulns is not shown as all clear', () => {
    const i = { ...base, inventory: inventory([pkg('a')], 'offline') }
    expect(row(i, 'packages')).toMatchObject({ kind: 'placeholder' })
  })

  it('keeps the whole dashboard when there are no projects (D6b)', () => {
    const r = panelAreas({ ...base, projects: [] })
    expect(r.rows.map((x) => x.id)).toEqual(['projects', 'caches', 'packages', 'docker'])
    // Projects still reports the store, which is real disk that projects link to.
    expect(row({ ...base, projects: [] }, 'projects')).toMatchObject({ usedBytes: 6.4 * GB })
  })

  it('formats the value string for size rows', () => {
    expect(row(base, 'docker')).toMatchObject({ value: '23.60 GB' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/renderer/src/panel/PanelApp/panelAreas.test.ts`
Expected: FAIL — `rows` is empty, so every `row()` call throws "no <id> row".

- [ ] **Step 3: Write the implementation**

In `src/renderer/src/panel/PanelApp/panelAreas.ts`, add these imports:

```ts
import { formatSizeStr, GB } from '@renderer/lib/format'
import { type SeverityCounts, severityCounts } from '@renderer/lib/severity'
import type { LauncherNavTarget } from '@shared/launcher-nav.types'
```

(the existing `import { GB } from '@renderer/lib/format'` is replaced by the line above)

Replace `export type PanelAreaRow = never` with:

```ts
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
```

Add this helper above `panelAreas`:

```ts
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
```

Then in `panelAreas`, replace `rows: []` with `rows`, building it just before the `return`:

```ts
  const rows: PanelAreaRow[] = [sizeRow('projects', 'Projects', projectsUsed, input.thresholdGB)]
  if (cachesAvailable) rows.push(sizeRow('caches', 'Caches', storeBytes, input.cacheThresholdGB))
  rows.push(packagesRow(input))
  if (dockerAvailable) rows.push(sizeRow('docker', 'Docker', dockerUsed, input.dockerThresholdGB))
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/renderer/src/panel/PanelApp/panelAreas.test.ts`
Expected: PASS (19 tests total). Then `pnpm typecheck && pnpm lint` — both clean.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/panel/PanelApp/panelAreas.ts src/renderer/src/panel/PanelApp/panelAreas.test.ts
git commit -m "feat(app): panelAreas resolves the four panel rows with honest gating"
```

---

### Task 5: AreaBar component

One click-through row. Dumb: it renders a resolved `PanelAreaRow` and calls `onOpen`. No logic, no tests (vitest does not match `.tsx`).

**Files:**
- Create: `src/renderer/src/panel/PanelApp/AreaBar/AreaBar.tsx`, `AreaBar.types.ts`, `index.ts`

**Interfaces:**
- Consumes: `PanelAreaRow` from `./panelAreas` (Task 4); `PixelMeter` (props: `usedGB`, `thresholdGB`, `trackMaxGB`, `accent`, `cells?`), `SeverityMeter` (props: `counts`, `total`, `computing?`), `UIIcon.chevronRight`.
- Produces: `<AreaBar row={…} accent={…} onOpen={() => …} />`.

- [ ] **Step 1: Write the types**

Create `src/renderer/src/panel/PanelApp/AreaBar/AreaBar.types.ts`:

```ts
import type { PanelAreaRow } from '../panelAreas'

export interface AreaBarProps {
  row: PanelAreaRow
  accent: string
  /** Opens this area's tab in the launcher. */
  onOpen: () => void
}
```

- [ ] **Step 2: Write the component**

Create `src/renderer/src/panel/PanelApp/AreaBar/AreaBar.tsx`:

```tsx
import { PixelMeter } from '@renderer/components/PixelMeter'
import { SeverityMeter } from '@renderer/components/SeverityMeter'
import { UIIcon } from '@renderer/components/UIIcon'
import { GB } from '@renderer/lib/format'
import type { ReactNode } from 'react'
import type { AreaBarProps } from './AreaBar.types'

/** One area of the panel dashboard: label, its meter, its value, and a chevron.
 *  Clicking anywhere opens that area's tab in the main window. Read-only: the
 *  panel visualizes, the launcher acts. */
export function AreaBar({ row, accent, onOpen }: AreaBarProps): ReactNode {
  return (
    <button
      type="button"
      onClick={onOpen}
      title={`Open ${row.label} in the main window`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '7px 15px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ flex: '0 0 62px', fontSize: 12, fontWeight: 620, color: 'var(--text)' }}>{row.label}</span>

      <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
        {row.kind === 'size' && (
          <PixelMeter
            usedGB={row.usedBytes / GB}
            thresholdGB={row.thresholdGB}
            trackMaxGB={row.trackMaxGB}
            accent={accent}
            cells={16}
          />
        )}
        {row.kind === 'severity' && <SeverityMeter counts={row.severity} total={row.packagesTotal} />}
        {row.kind === 'placeholder' && <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{row.note}</span>}
      </span>

      {row.kind === 'size' && (
        <span
          style={{
            flex: '0 0 auto',
            fontSize: 12,
            fontWeight: 650,
            color: 'var(--text-2)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {row.value}
        </span>
      )}
      <span style={{ flex: '0 0 auto', display: 'flex', color: 'var(--text-faint)' }}>
        {UIIcon.chevronRight({ size: 13 })}
      </span>
    </button>
  )
}
```

Note: `PixelMeter` renders a full-width flex row of cells, so it fills the middle column. `SeverityMeter` draws its own "N vuln" / "all clear" label, which is why severity rows have no `value`.

- [ ] **Step 3: Write the barrel**

Create `src/renderer/src/panel/PanelApp/AreaBar/index.ts`:

```ts
export { AreaBar } from './AreaBar'
export type { AreaBarProps } from './AreaBar.types'
```

- [ ] **Step 4: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: both clean. (No tests — vitest matches `.test.ts` only.)

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/panel/PanelApp/AreaBar
git commit -m "feat(app): AreaBar renders one click-through area row for the panel"
```

---

### Task 6: TrackedSummary (the hero)

Generalizes `DiskSummary` from "node_modules on disk" into the aggregate hero (D2, D3). Same visual structure: 27px number, limit + over/free lines, 32-cell `PixelMeter`.

**Sub-line — read this, the spec is ambiguous here.** D2's ASCII diagram sketches the hero sub-line as a fixed composition string ("node_modules + caches + Docker"), while D6 requires a label that adapts when an area is absent ("across 2 areas"). **Implement D6's version** — `across {areaCount} areas`. It is the one that stays truthful when Docker is off or no store exists; the D2 diagram was illustrative and drawn with all three areas present.

**Files:**
- Create: `src/renderer/src/panel/PanelApp/TrackedSummary/TrackedSummary.tsx`, `TrackedSummary.types.ts`, `index.ts`
- Delete: `src/renderer/src/panel/PanelApp/DiskSummary.tsx`

**Interfaces:**
- Consumes: `PixelMeter`, `UIIcon.hdd/alert/check`, `statusColor` from `@renderer/lib/colors`, `formatSizeStr`/`GB` from `@renderer/lib/format`.
- Produces: `<TrackedSummary heroBytes combinedLimitGB trackMaxGB areaCount accent />`.

- [ ] **Step 1: Write the types**

Create `src/renderer/src/panel/PanelApp/TrackedSummary/TrackedSummary.types.ts`:

```ts
export interface TrackedSummaryProps {
  /** Every tracked byte, counted once. */
  heroBytes: number
  combinedLimitGB: number
  trackMaxGB: number
  /** Number of size areas present, for the "across N areas" line. */
  areaCount: number
  accent: string
}
```

- [ ] **Step 2: Write the component**

Create `src/renderer/src/panel/PanelApp/TrackedSummary/TrackedSummary.tsx`:

```tsx
import { PixelMeter } from '@renderer/components/PixelMeter'
import { UIIcon } from '@renderer/components/UIIcon'
import { statusColor } from '@renderer/lib/colors'
import { formatSizeStr, GB } from '@renderer/lib/format'
import type { ReactNode } from 'react'
import type { TrackedSummaryProps } from './TrackedSummary.types'

/** Panel hero: every tracked byte counted once, against the combined limit.
 *  "Tracked", not "reclaimable" — this is what these areas occupy, not a promise
 *  about what deleting would free (see the spec's D3). */
export function TrackedSummary({
  heroBytes,
  combinedLimitGB,
  trackMaxGB,
  areaCount,
  accent,
}: TrackedSummaryProps): ReactNode {
  const limitBytes = combinedLimitGB * GB
  const over = heroBytes > limitBytes
  const status = statusColor(limitBytes > 0 ? heroBytes / limitBytes : 0, accent)

  return (
    <div style={{ padding: '13px 15px 12px' }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
          color: 'var(--text-dim)',
        }}
      >
        Tracked on disk
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 5 }}>
        <span
          title="Every tracked byte counted once. The pnpm store is shared by your projects, so it is included here a single time even though it also appears in the Caches row."
          style={{
            fontSize: 27,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-.01em',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            flex: '0 0 auto',
          }}
        >
          {formatSizeStr(heroBytes)}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flex: '0 0 auto' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ display: 'flex', color: 'var(--text-dim)' }}>{UIIcon.hdd({ size: 12 })}</span>
            {combinedLimitGB} GB limit
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              fontSize: 12.5,
              fontWeight: 650,
              color: over ? status : 'var(--good)',
            }}
          >
            <span style={{ display: 'flex' }}>{over ? UIIcon.alert({ size: 12 }) : UIIcon.check({ size: 13 })}</span>
            {over ? `${formatSizeStr(heroBytes - limitBytes)} over` : `${formatSizeStr(limitBytes - heroBytes)} free`}
          </span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
        across {areaCount} {areaCount === 1 ? 'area' : 'areas'}
      </div>
      <PixelMeter
        usedGB={heroBytes / GB}
        thresholdGB={combinedLimitGB}
        trackMaxGB={trackMaxGB}
        accent={accent}
        cells={32}
      />
    </div>
  )
}
```

- [ ] **Step 3: Write the barrel**

Create `src/renderer/src/panel/PanelApp/TrackedSummary/index.ts`:

```ts
export { TrackedSummary } from './TrackedSummary'
export type { TrackedSummaryProps } from './TrackedSummary.types'
```

- [ ] **Step 4: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: clean. `DiskSummary.tsx` still exists and is still imported by `PanelApp.tsx` — it is deleted in Task 7, so do not delete it yet.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/panel/PanelApp/TrackedSummary
git commit -m "feat(app): TrackedSummary generalizes the panel hero beyond node_modules"
```

---

### Task 7: Strip the panel (D1, D6b)

Subtraction only. After this the panel is hero + menu + footer, still building and running, with no dashboard rows yet. **Read D1 in the spec** — removing the paywall from the panel is deliberate and takes all three `paywall_shown` triggers with it.

**Files:**
- Modify: `src/renderer/src/panel/PanelApp/PanelApp.tsx`
- Modify: `src/renderer/src/panel/PanelApp/PanelEmpty.tsx`
- Modify: `src/renderer/src/panel/PanelApp/PanelApp.types.ts`, `index.ts`
- Delete: `PnpmStoreRow.tsx`, `CleanStaleCta.tsx`, `PanelApp.constants.ts`, `DiskSummary.tsx`

- [ ] **Step 1: Delete the dead components**

```bash
git rm src/renderer/src/panel/PanelApp/PnpmStoreRow.tsx \
       src/renderer/src/panel/PanelApp/CleanStaleCta.tsx \
       src/renderer/src/panel/PanelApp/PanelApp.constants.ts \
       src/renderer/src/panel/PanelApp/DiskSummary.tsx
```

`PanelApp.constants.ts` only held `STALE_DAYS` and `VISIBLE_ROWS`, both used solely by the code removed in this task. `MiniRow`, `UnlockPrompt`, `RescanHint` and `useToast` stay in the tree — the launcher uses them.

- [ ] **Step 2: Drop PanelToast**

Replace `src/renderer/src/panel/PanelApp/PanelApp.types.ts` with:

```ts
export type PanelView = 'main' | 'scan'
```

Replace `src/renderer/src/panel/PanelApp/index.ts` with:

```ts
export { PanelApp } from './PanelApp'
export type { PanelView } from './PanelApp.types'
```

- [ ] **Step 3: Simplify PanelEmpty (D6b)**

Replace `src/renderer/src/panel/PanelApp/PanelEmpty.tsx` with:

```tsx
import { AppIcon } from '@renderer/components/AppIcon'
import type { ReactNode } from 'react'

interface PanelEmptyProps {
  accent: string
  onOpenSetup: () => void
}

/** Panel body before the first scan: there is genuinely nothing to visualize yet.
 *  There is deliberately no "all clean" state — zero projects does not mean zero
 *  disk used, and a verdict about one area must never replace the whole dashboard
 *  (see the spec's D6b). */
export function PanelEmpty({ accent, onOpenSetup }: PanelEmptyProps): ReactNode {
  return (
    <div style={{ padding: '24px 20px 26px', textAlign: 'center' }}>
      <AppIcon accent={accent} size={40} />
      <div style={{ fontSize: 14.5, fontWeight: 650, color: '#fff', marginTop: 10 }}>Finish setup</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
        Set your limit &amp; run the first scan in the full window.
      </div>
      <button
        type="button"
        onClick={onOpenSetup}
        style={{
          marginTop: 13,
          background: accent,
          color: '#fff',
          border: 'none',
          borderRadius: 9,
          padding: '8px 16px',
          fontSize: 12,
          fontWeight: 650,
          cursor: 'pointer',
        }}
      >
        Open setup →
      </button>
    </div>
  )
}
```

The `onboarded` and `reclaimed` props are gone: the caller now decides when to show it, and `reclaimed` was fed only by the delete path this task removes.

- [ ] **Step 4: Rewrite PanelApp**

Replace `src/renderer/src/panel/PanelApp/PanelApp.tsx` with:

```tsx
import { MItem } from '@renderer/components/MItem'
import { UIIcon } from '@renderer/components/UIIcon'
import { useAutoHeight } from '@renderer/hooks/useAutoHeight'
import { useSettings } from '@renderer/hooks/useSettings'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { DiskSummaryPlaceholder } from './DiskSummaryPlaceholder'
import type { PanelView } from './PanelApp.types'
import { PanelEmpty } from './PanelEmpty'
import { ScanPanel } from './ScanPanel'
import { Separator } from './Separator'

export function PanelApp(): ReactNode {
  const [settings, , settingsLoaded] = useSettings()
  const accent = settings.accent

  const [view, setView] = useState<PanelView>('main')
  const [lastScan, setLastScan] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  useAutoHeight(rootRef)

  useEffect(() => {
    void window.clean.getLastScanTime().then(setLastScan)
  }, [view])

  // keyboard shortcuts: ⌘O full window, ⌘R scan, ⌘, settings, esc close
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault()
        void window.clean.openLauncher()
      } else if (meta && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault()
        window.clean.quitApp()
      } else if (meta && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        setView('scan')
      } else if (meta && e.key === ',') {
        e.preventDefault()
        void window.clean.openLauncher('settings')
      } else if (e.key === 'Escape') {
        if (view !== 'main') setView('main')
        else void window.clean.closeWindow()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view])

  const nextScanLabel =
    settings.scanInterval === '6h'
      ? '6 h'
      : settings.scanInterval === 'daily'
        ? '18 h'
        : settings.scanInterval === 'weekly'
          ? '5 d'
          : '—'
  const lastScanLabel = lastScan ? `${Math.max(1, Math.round((Date.now() - lastScan) / 60000))} min ago` : 'never'

  return (
    <div ref={rootRef} className="mb-panel">
      {view === 'scan' && <ScanPanel accent={accent} onDone={() => setView('main')} />}

      {view === 'main' && (
        <>
          {settingsLoaded && !settings.onboarded ? (
            <PanelEmpty accent={accent} onOpenSetup={() => void window.clean.openLauncher()} />
          ) : (
            <DiskSummaryPlaceholder />
          )}
          <Separator />
          <div style={{ paddingBottom: 5 }}>
            <MItem
              icon={UIIcon.search}
              label="Open full window…"
              shortcut="⌘O"
              onClick={() => void window.clean.openLauncher()}
            />
            <MItem icon={UIIcon.refresh} label="Scan now" shortcut="⌘R" onClick={() => setView('scan')} />
            <MItem
              icon={UIIcon.gear}
              label="Settings…"
              shortcut="⌘,"
              onClick={() => void window.clean.openLauncher('settings')}
            />
            <MItem icon={UIIcon.power} label="Quit" shortcut="⌘Q" onClick={() => window.clean.quitApp()} />
          </div>
          <Separator />
          <div style={{ padding: '1px 16px 9px', fontSize: 11, color: 'var(--text-dim)' }}>
            Last scan {lastScanLabel} · next in {nextScanLabel}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Add the temporary placeholder**

Task 8 replaces this with the real dashboard. It exists only so this task ends on a building app.

Create `src/renderer/src/panel/PanelApp/DiskSummaryPlaceholder.tsx`:

```tsx
import type { ReactNode } from 'react'

/** Temporary: replaced by TrackedSummary + AreaBar rows in Task 8. */
export function DiskSummaryPlaceholder(): ReactNode {
  return <div style={{ padding: '13px 15px 12px', fontSize: 12, color: 'var(--text-dim)' }}>Dashboard loading…</div>
}
```

- [ ] **Step 6: Verify**

Run: `pnpm typecheck && pnpm vitest run && pnpm lint && pnpm build`
Expected: all green. Typecheck is the real gate here — it proves no dangling import of a deleted component survives.

- [ ] **Step 7: Commit**

```bash
git add -A src/renderer/src/panel
git commit -m "refactor(app): strip the panel to read-only (no list, CTA, store prune or paywall)"
```

---

### Task 8: Wire the dashboard (D2, D6b, D7, D8)

Additive: the panel becomes the real dashboard. **Read D7 before writing the effects** — the Docker and store refresh triggers are deliberately different, and getting this wrong makes the popover slow.

- **Docker:** stale-refresh on panel open (missing or >5 min), mirroring `LauncherApp.tsx:142-146`.
- **Store:** cached mount fetch only. Force-refresh **only when a scan finishes**, mirroring `LauncherApp.tsx:112-117`. Never on a timer: `getPnpmStoreInfo` has no TTL and a forced call runs a `du` that takes seconds.
- **Packages:** `usePackages().inventory` is the cached read. **Never call `ensure()` or `refresh()`** — computing the inventory from the panel would block the popover.

**Files:**
- Modify: `src/renderer/src/panel/PanelApp/PanelApp.tsx`
- Delete: `src/renderer/src/panel/PanelApp/DiskSummaryPlaceholder.tsx`

**Interfaces:**
- Consumes: `panelAreas` (Tasks 3-4), `TrackedSummary` (Task 6), `AreaBar` (Task 5), `DOCKER_STALE_MS` (Task 2), `LauncherNavTarget` (Task 1).

- [ ] **Step 1: Delete the placeholder**

```bash
git rm src/renderer/src/panel/PanelApp/DiskSummaryPlaceholder.tsx
```

- [ ] **Step 2: Wire the hooks and the dashboard**

In `src/renderer/src/panel/PanelApp/PanelApp.tsx`, replace the import block with:

```tsx
import { MItem } from '@renderer/components/MItem'
import { UIIcon } from '@renderer/components/UIIcon'
import { useAutoHeight } from '@renderer/hooks/useAutoHeight'
import { useDocker } from '@renderer/hooks/useDocker'
import { usePackages } from '@renderer/hooks/usePackages'
import { usePnpmStore } from '@renderer/hooks/usePnpmStore'
import { useProjects } from '@renderer/hooks/useProjects'
import { useSettings } from '@renderer/hooks/useSettings'
import { DOCKER_STALE_MS } from '@renderer/lib/staleness'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AreaBar } from './AreaBar'
import type { PanelView } from './PanelApp.types'
import { PanelEmpty } from './PanelEmpty'
import { panelAreas } from './panelAreas'
import { ScanPanel } from './ScanPanel'
import { Separator } from './Separator'
import { TrackedSummary } from './TrackedSummary'
```

Add these hooks and derived values directly below `const accent = settings.accent`:

```tsx
  const projects = useProjects()
  const { store, refresh: refreshStore } = usePnpmStore()
  const docker = useDocker()
  const { inventory } = usePackages()
  const dockerEnabled = settings.docker !== false

  const areas = useMemo(
    () =>
      panelAreas({
        projects,
        store,
        docker: docker.info,
        dockerEnabled,
        inventory,
        checkUpdates: settings.checkUpdates,
        thresholdGB: settings.thresholdGB,
        cacheThresholdGB: settings.cacheThresholdGB,
        dockerThresholdGB: settings.dockerThresholdGB,
      }),
    [
      projects,
      store,
      docker.info,
      dockerEnabled,
      inventory,
      settings.checkUpdates,
      settings.thresholdGB,
      settings.cacheThresholdGB,
      settings.dockerThresholdGB,
    ],
  )
```

Add these two effects below the `getLastScanTime` effect:

```tsx
  // Docker's cache never expires on its own, so re-probe it when the panel opens on
  // missing or stale data. Guarded on `loading` and a freshened `checkedAt` so it
  // cannot loop; the last-known numbers render instantly meanwhile.
  useEffect(() => {
    if (view !== 'main' || !dockerEnabled || docker.loading) return
    const stale = !docker.info || Date.now() - docker.info.checkedAt > DOCKER_STALE_MS
    if (stale) void docker.refresh()
  }, [view, dockerEnabled, docker.info, docker.loading, docker.refresh])
```

and replace the `ScanPanel` line so a finished scan re-sizes the store (new installs change it) and re-probes Docker:

```tsx
      {view === 'scan' && (
        <ScanPanel
          accent={accent}
          onDone={() => {
            setView('main')
            void refreshStore()
          }}
        />
      )}
```

Add the nav callback next to the other callbacks:

```tsx
  const openArea = useCallback((nav: LauncherNavTarget): void => {
    void window.clean.openLauncher(nav)
  }, [])
```

with `import type { LauncherNavTarget } from '@shared/launcher-nav.types'` added to the imports.

- [ ] **Step 3: Render the dashboard**

Replace the `{settingsLoaded && !settings.onboarded ? … : <DiskSummaryPlaceholder />}` block with:

```tsx
          {settingsLoaded && !settings.onboarded ? (
            <PanelEmpty accent={accent} onOpenSetup={() => void window.clean.openLauncher()} />
          ) : (
            <>
              <TrackedSummary
                heroBytes={areas.heroBytes}
                combinedLimitGB={areas.combinedLimitGB}
                trackMaxGB={areas.trackMaxGB}
                areaCount={areas.areaCount}
                accent={accent}
              />
              <Separator />
              <div style={{ padding: '4px 0 5px' }}>
                {areas.rows.map((row) => (
                  <AreaBar key={row.id} row={row} accent={accent} onOpen={() => openArea(row.nav)} />
                ))}
              </div>
            </>
          )}
```

- [ ] **Step 4: Verify**

Run: `pnpm typecheck && pnpm vitest run && pnpm lint && pnpm build`
Expected: all green.

- [ ] **Step 5: Confirm the panel never computes the inventory**

Run: `grep -n "computePackages\|ensure()\|deleteMany\|deleteNodeModules\|prunePnpmStore\|pruneDocker\|paywall_shown" src/renderer/src/panel/PanelApp/PanelApp.tsx`
Expected: **no output.** Any hit means an action or an expensive compute leaked back into the read-only panel.

- [ ] **Step 6: Commit**

```bash
git add -A src/renderer/src/panel
git commit -m "feat(app): the menu bar panel is a read-only dashboard of every disk area"
```

---

### Task 9: Update STATUS.html

Mandatory per `CLAUDE.md`: the `STATUS` data block is the user's single source of truth and must not go stale.

**Files:**
- Modify: `STATUS.html` (the `STATUS` data block near the top only — leave the markup and render script alone)

- [ ] **Step 1: Update the data block**

Set `updated: "2026-07-15"`, then prepend this sentence to `summary` (keep the existing prior-session text after it, per the file's established style):

> This session (2026-07-15): the menu bar panel is no longer a mini node_modules cleaner. It is a read-only dashboard: an aggregate "Tracked on disk" hero (every tracked byte counted once, against the sum of your three limits) plus four click-through rows (Projects / Caches / Packages / Docker) that open that tab in the main window. Gone from the panel: the reclaimable list, the Clean stale CTA, the pnpm prune row, and the paywall. NOTE: that removes all three paywall_shown triggers from the panel, so the launcher is now the only paid-conversion surface.

Append to `log` (matching the surrounding entry shape):

```js
{ date: "2026-07-15", text: "Menu bar panel became a read-only dashboard: aggregate hero + four click-through rows into the launcher; the panel's list, actions and paywall are gone." },
```

Add these two `userActions` entries. The shape is `{ id, category, label, detail }` and `category` is rendered as a CSS class (`c-${a.category}` at `STATUS.html:435`), so it must be one of the existing values: `testing`, `review`, `external`, `vision`. Both ids below are new — neither appears in the file today, and no removed id may ever be reused (checkbox state is stored against them).

```js
{ id: "qa-panel-dashboard", category: "testing", label: "Manual pass of the new menu bar panel", detail: "Needs a running app + a Docker daemon (CI has neither). Open the popover: confirm the 'Tracked on disk' hero and the four rows (Projects / Caches / Packages / Docker), and that clicking each row opens the main window on THAT tab (⌘, still opens Settings). Confirm the popover opens instantly with a cold Docker cache (numbers fill in a moment later, they never block the open). Turn Docker off in Settings: its row disappears, its bytes leave the hero, and the hero reads 'across 2 areas'. Before ever visiting the Packages tab, its row should read 'Not checked yet' rather than claiming 'all clear', and clicking it should compute the inventory there. Finally, delete a project's node_modules in the launcher and confirm the panel's Projects row and hero both move." },
{ id: "paywall-surface-decision", category: "vision", label: "Decide where the paywall lives now that the panel has none", detail: "The panel rework made the popover read-only, which removed all three paywall_shown triggers it used to fire (clean_stale, prune, affordance). The launcher is now the only paid-conversion surface in the app. Decide whether that is fine or whether the launcher needs a stronger paywall moment before this ships — the spec deliberately ruled this out of scope rather than guessing." },
```

- [ ] **Step 2: Verify the block still parses**

Run: `node --input-type=module -e "import('node:fs').then(async fs => { const s = fs.readFileSync('STATUS.html','utf8'); console.log(/updated:\s*\"2026-07-15\"/.test(s) ? 'updated ok' : 'MISSING updated') })"`
Expected: `updated ok`. Then open `STATUS.html` in a browser and confirm it renders without a blank page (a JS syntax error in the data block renders nothing).

- [ ] **Step 3: Commit**

```bash
git add STATUS.html
git commit -m "docs: STATUS — the menu bar panel is now a read-only dashboard"
```

---

## Final Verification

- [ ] `pnpm typecheck` — clean
- [ ] `pnpm vitest run` — all tests pass (293 existing + ~22 new)
- [ ] `pnpm lint` — clean
- [ ] `pnpm build` — succeeds
- [ ] `grep -rn "DiskSummary\|PnpmStoreRow\|CleanStaleCta\|PanelToast\|VISIBLE_ROWS" src/renderer/src/panel/` returns nothing
- [ ] The launcher is unregressed: `tabSummary.test.ts`, `CachesView.constants.test.ts`, `DockerView.constants.test.ts`, `docker-confirm.test.ts` all green

**Manual QA (user — needs a running app + a Docker daemon):**
- Each of the four rows opens the main window on the matching tab; ⌘, still opens Settings.
- The popover opens instantly with a cold Docker cache (numbers fill in a moment later).
- Turning Docker off in Settings hides the Docker row, drops its bytes from the hero, and the hero reads "across 2 areas".
- Before ever visiting the Packages tab, the Packages row reads "Not checked yet" and clicking it computes the inventory there.
- Deleting a project's node_modules in the launcher updates the panel's Projects row and hero.
