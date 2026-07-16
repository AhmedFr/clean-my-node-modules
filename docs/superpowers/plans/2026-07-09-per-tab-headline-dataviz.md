# Per-Tab Headline Data-Viz + Docker Auto-Scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each launcher tab's header slot and footer line reflect that tab's core metric (node_modules / caches / docker size-vs-limit gauges, packages severity meter), and auto-refresh Docker when its tab opens stale.

**Architecture:** A pure `severityCounts()` helper and a pure `tabSummary()` helper feed two presentational components — the existing `Gauge` (reused for the three size tabs) and a new `SeverityMeter` (packages) — routed by a new `TabHeadline` switcher that replaces the hardwired header `Gauge`. `LauncherApp` computes per-tab inputs it already holds. Two new clamped settings (`cacheThresholdGB`, `dockerThresholdGB`) drive the caches/docker limits. A Docker staleness effect calls the existing `docker.refresh()`.

**Tech Stack:** Electron + React + TypeScript, Vitest (pure `.test.ts` only — no jsdom/testing-library in this repo), Biome.

## Global Constraints

- Package manager: **pnpm**. Gates for every task: `pnpm typecheck && pnpm test && pnpm lint && pnpm build` (all green before commit).
- Biome style: **single quotes, no semicolons, 2-space indent**. Run `pnpm lint` (biome) — do not hand-format against it.
- **No em dashes** in any user-facing copy (labels, hints, tooltips, footer text). Use "·", ",", or "—"-free phrasing.
- **One folder per component**: `index.ts`, `Component.tsx`, `Component.types.ts`, optional `.constants.ts`, and a co-located `*.test.ts`.
- **Test files must be named `*.test.ts`** and live under `src/**` — Vitest `include` is `src/**/*.test.ts`. There is **no** React render-test harness; do **not** write `.test.tsx` or import `@testing-library/*`. Test pure functions only; gate JSX on typecheck + build + manual verification.
- Threshold values are clamped to **0.1–1000 GB** in `validate-setting.ts` (`MIN_THRESHOLD_GB`/`MAX_THRESHOLD_GB`).
- New setting defaults: `cacheThresholdGB: 10`, `dockerThresholdGB: 20`.
- Header slot is ~132px wide — the packages severity breakdown lives in the **tooltip**, not inline.
- Docker staleness window: **5 minutes** (`DOCKER_STALE_MS = 5 * 60 * 1000`).
- Severity palette (may be tuned to the app palette, keep the four distinct): critical `#ff453a`, high `#ff9f0a`, moderate `#ffd60a`, low `#5e9eff`.
- After all tasks, update the `STATUS` data block in `STATUS.html` (bump `updated`, move roadmap items, add a `log` line). Not a coding task — done in the final wrap-up.

---

### Task 1: Settings — two per-tab limit fields + validation

**Files:**
- Modify: `src/shared/settings.types.ts` (add two fields to `Settings`)
- Modify: `src/shared/settings.constants.ts` (add two defaults)
- Modify: `src/main/settings/validate-setting.ts:43` (extend the `thresholdGB` clamp case)
- Test: `src/main/settings/validate-setting.test.ts` (add cases)

**Interfaces:**
- Produces: `Settings.cacheThresholdGB: number`, `Settings.dockerThresholdGB: number`; both validated/clamped exactly like `thresholdGB`.

- [ ] **Step 1: Write the failing tests**

Append to `src/main/settings/validate-setting.test.ts` (inside the existing top-level `describe`, near the `thresholdGB` test):

```ts
it('clamps cacheThresholdGB and dockerThresholdGB and rejects bad values', () => {
  expect(coerceSetting('cacheThresholdGB', 10)).toEqual({ key: 'cacheThresholdGB', value: 10 })
  expect(coerceSetting('cacheThresholdGB', 99999)).toEqual({ key: 'cacheThresholdGB', value: 1000 })
  expect(coerceSetting('cacheThresholdGB', -3)).toEqual({ key: 'cacheThresholdGB', value: 0.1 })
  expect(coerceSetting('cacheThresholdGB', Number.NaN)).toBeNull()
  expect(coerceSetting('cacheThresholdGB', '10')).toBeNull()

  expect(coerceSetting('dockerThresholdGB', 20)).toEqual({ key: 'dockerThresholdGB', value: 20 })
  expect(coerceSetting('dockerThresholdGB', 99999)).toEqual({ key: 'dockerThresholdGB', value: 1000 })
  expect(coerceSetting('dockerThresholdGB', 0)).toEqual({ key: 'dockerThresholdGB', value: 0.1 })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/main/settings/validate-setting.test.ts`
Expected: FAIL — `coerceSetting('cacheThresholdGB', 10)` returns `null` (unknown key hits the `default` branch).

- [ ] **Step 3: Add the fields to the Settings type**

In `src/shared/settings.types.ts`, add inside `interface Settings` (right after `thresholdGB: number`):

```ts
  /** pnpm cache (store) size limit, GB — headline gauge on the Caches tab. */
  cacheThresholdGB: number
  /** Docker total size limit, GB — headline gauge on the Docker tab. */
  dockerThresholdGB: number
```

- [ ] **Step 4: Add the defaults**

In `src/shared/settings.constants.ts`, add to `DEFAULT_SETTINGS` (after `thresholdGB: 5,`):

```ts
  cacheThresholdGB: 10,
  dockerThresholdGB: 20,
```

- [ ] **Step 5: Extend the validation clamp case**

In `src/main/settings/validate-setting.ts`, change the `case 'thresholdGB':` line so all three keys share the clamp:

```ts
    case 'thresholdGB':
    case 'cacheThresholdGB':
    case 'dockerThresholdGB':
      return typeof value === 'number' && Number.isFinite(value)
        ? { key, value: Math.min(MAX_THRESHOLD_GB, Math.max(MIN_THRESHOLD_GB, value)) }
        : null
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm vitest run src/main/settings/validate-setting.test.ts`
Expected: PASS.

- [ ] **Step 7: Typecheck (catches any full `Settings` literal that now needs the fields)**

Run: `pnpm typecheck`
Expected: PASS. If a test fixture builds a full `Settings` object literal, add `cacheThresholdGB` / `dockerThresholdGB` to it.

- [ ] **Step 8: Commit**

```bash
git add src/shared/settings.types.ts src/shared/settings.constants.ts src/main/settings/validate-setting.ts src/main/settings/validate-setting.test.ts
git commit -m "feat(settings): add cacheThresholdGB and dockerThresholdGB limits"
```

---

### Task 2: `severityCounts` pure helper (`lib/severity`)

**Files:**
- Create: `src/renderer/src/lib/severity/severity.ts`
- Create: `src/renderer/src/lib/severity/index.ts`
- Test: `src/renderer/src/lib/severity/severity.test.ts`

**Interfaces:**
- Consumes: `PackageEntry`, `AdvisorySeverity` from `@shared/package.types` (`PackageEntry` has optional `advisory?: { severity: AdvisorySeverity }` and `outdated?: boolean`; `AdvisorySeverity = 'low' | 'moderate' | 'high' | 'critical'`).
- Produces:
  ```ts
  export type SeverityKey = AdvisorySeverity
  export interface SeverityCounts {
    critical: number; high: number; moderate: number; low: number
    vulnerable: number // critical+high+moderate+low
    outdated: number
  }
  export function severityCounts(packages: PackageEntry[]): SeverityCounts
  ```

- [ ] **Step 1: Write the failing test**

Create `src/renderer/src/lib/severity/severity.test.ts`:

```ts
import type { PackageEntry } from '@shared/package.types'
import { describe, expect, it } from 'vitest'
import { severityCounts } from './severity'

const pkg = (o: Partial<PackageEntry> & Pick<PackageEntry, 'name'>): PackageEntry => ({
  usages: [],
  projectCount: 1,
  versions: [],
  multipleVersions: false,
  ...o,
})

describe('severityCounts', () => {
  it('buckets each package by its advisory severity and sums vulnerable', () => {
    const c = severityCounts([
      pkg({ name: 'a', advisory: { severity: 'critical', title: '', vulnerableVersions: '' } }),
      pkg({ name: 'b', advisory: { severity: 'high', title: '', vulnerableVersions: '' } }),
      pkg({ name: 'c', advisory: { severity: 'high', title: '', vulnerableVersions: '' } }),
      pkg({ name: 'd', advisory: { severity: 'low', title: '', vulnerableVersions: '' } }),
      pkg({ name: 'e' }), // no advisory
    ])
    expect(c).toEqual({ critical: 1, high: 2, moderate: 0, low: 1, vulnerable: 4, outdated: 0 })
  })

  it('counts outdated independently of advisories', () => {
    const c = severityCounts([
      pkg({ name: 'a', outdated: true }),
      pkg({ name: 'b', outdated: true, advisory: { severity: 'moderate', title: '', vulnerableVersions: '' } }),
      pkg({ name: 'c', outdated: false }),
    ])
    expect(c.outdated).toBe(2)
    expect(c.moderate).toBe(1)
    expect(c.vulnerable).toBe(1)
  })

  it('returns all zeros for an empty list', () => {
    expect(severityCounts([])).toEqual({ critical: 0, high: 0, moderate: 0, low: 0, vulnerable: 0, outdated: 0 })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/renderer/src/lib/severity/severity.test.ts`
Expected: FAIL — cannot resolve `./severity`.

- [ ] **Step 3: Implement the helper**

Create `src/renderer/src/lib/severity/severity.ts`:

```ts
import type { AdvisorySeverity, PackageEntry } from '@shared/package.types'

export type SeverityKey = AdvisorySeverity

export interface SeverityCounts {
  critical: number
  high: number
  moderate: number
  low: number
  /** critical + high + moderate + low */
  vulnerable: number
  outdated: number
}

/** Tally packages by their worst-advisory severity (already stored on the entry),
 *  plus a separate count of packages behind `latest`. A package with no advisory
 *  contributes to no severity bucket; `outdated` is independent of advisories. */
export function severityCounts(packages: PackageEntry[]): SeverityCounts {
  const c: SeverityCounts = { critical: 0, high: 0, moderate: 0, low: 0, vulnerable: 0, outdated: 0 }
  for (const p of packages) {
    const sev = p.advisory?.severity
    if (sev) {
      c[sev] += 1
      c.vulnerable += 1
    }
    if (p.outdated) c.outdated += 1
  }
  return c
}
```

Create `src/renderer/src/lib/severity/index.ts`:

```ts
export type { SeverityCounts, SeverityKey } from './severity'
export { severityCounts } from './severity'
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/renderer/src/lib/severity/severity.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/lib/severity
git commit -m "feat(app): severityCounts helper for the packages headline"
```

---

### Task 3: `SeverityMeter` component

**Files:**
- Create: `src/renderer/src/components/SeverityMeter/SeverityMeter.types.ts`
- Create: `src/renderer/src/components/SeverityMeter/SeverityMeter.constants.ts`
- Create: `src/renderer/src/components/SeverityMeter/SeverityMeter.tsx`
- Create: `src/renderer/src/components/SeverityMeter/index.ts`
- Test: `src/renderer/src/components/SeverityMeter/SeverityMeter.constants.test.ts`

**Interfaces:**
- Consumes: `SeverityCounts`, `SeverityKey` from `@renderer/lib/severity` (Task 2). The `Gauge` uses a `cc-ghost` CSS class for the "calculating" shimmer — reuse it.
- Produces:
  ```ts
  export interface SeverityMeterProps { counts: SeverityCounts; total: number; computing?: boolean }
  export interface SeveritySegment { key: SeverityKey; count: number; color: string; frac: number }
  export function severitySegments(counts: SeverityCounts): SeveritySegment[]
  export function severityMeterTooltip(counts: SeverityCounts, total: number): string
  export const SEVERITY_COLORS: Record<SeverityKey, string>
  export const SEVERITY_ORDER: SeverityKey[]
  ```

- [ ] **Step 1: Write the failing test (pure logic only)**

Create `src/renderer/src/components/SeverityMeter/SeverityMeter.constants.test.ts`:

```ts
import type { SeverityCounts } from '@renderer/lib/severity'
import { describe, expect, it } from 'vitest'
import { severityMeterTooltip, severitySegments } from './SeverityMeter.constants'

const counts = (o: Partial<SeverityCounts>): SeverityCounts => ({
  critical: 0, high: 0, moderate: 0, low: 0, vulnerable: 0, outdated: 0, ...o,
})

describe('severitySegments', () => {
  it('returns severity-ordered segments with fractions of the vulnerable total', () => {
    const segs = severitySegments(counts({ critical: 1, high: 3, vulnerable: 4 }))
    expect(segs.map((s) => s.key)).toEqual(['critical', 'high'])
    expect(segs[0].frac).toBeCloseTo(0.25)
    expect(segs[1].frac).toBeCloseTo(0.75)
  })

  it('drops zero-count severities', () => {
    const segs = severitySegments(counts({ high: 2, low: 1, vulnerable: 3 }))
    expect(segs.map((s) => s.key)).toEqual(['high', 'low'])
  })

  it('returns an empty array when nothing is vulnerable', () => {
    expect(severitySegments(counts({ outdated: 5 }))).toEqual([])
  })
})

describe('severityMeterTooltip', () => {
  it('lists every severity plus outdated and the total', () => {
    expect(severityMeterTooltip(counts({ critical: 2, high: 5, moderate: 3, low: 1, vulnerable: 11, outdated: 28 }), 142)).toBe(
      '2 critical · 5 high · 3 moderate · 1 low · 28 outdated of 142 packages',
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/renderer/src/components/SeverityMeter/SeverityMeter.constants.test.ts`
Expected: FAIL — cannot resolve `./SeverityMeter.constants`.

- [ ] **Step 3: Create the types**

Create `src/renderer/src/components/SeverityMeter/SeverityMeter.types.ts`:

```ts
import type { SeverityCounts, SeverityKey } from '@renderer/lib/severity'

export interface SeveritySegment {
  key: SeverityKey
  count: number
  color: string
  /** Share of the vulnerable total (0–1). */
  frac: number
}

export interface SeverityMeterProps {
  counts: SeverityCounts
  /** Total package count, for the tooltip. */
  total: number
  /** Inventory still computing — show the ghost shimmer. */
  computing?: boolean
}
```

- [ ] **Step 4: Create the constants + pure helpers**

Create `src/renderer/src/components/SeverityMeter/SeverityMeter.constants.ts`:

```ts
import type { SeverityCounts, SeverityKey } from '@renderer/lib/severity'
import type { SeveritySegment } from './SeverityMeter.types'

/** Worst-first, so the bar reads critical → low left to right. */
export const SEVERITY_ORDER: SeverityKey[] = ['critical', 'high', 'moderate', 'low']

export const SEVERITY_COLORS: Record<SeverityKey, string> = {
  critical: '#ff453a',
  high: '#ff9f0a',
  moderate: '#ffd60a',
  low: '#5e9eff',
}

/** Non-empty severity buckets, in severity order, each with its share of the
 *  vulnerable total. Empty when nothing is vulnerable. */
export function severitySegments(counts: SeverityCounts): SeveritySegment[] {
  if (counts.vulnerable <= 0) return []
  return SEVERITY_ORDER.filter((k) => counts[k] > 0).map((k) => ({
    key: k,
    count: counts[k],
    color: SEVERITY_COLORS[k],
    frac: counts[k] / counts.vulnerable,
  }))
}

/** Full breakdown for the header tooltip (the 132px slot has no room for a legend). */
export function severityMeterTooltip(counts: SeverityCounts, total: number): string {
  return `${counts.critical} critical · ${counts.high} high · ${counts.moderate} moderate · ${counts.low} low · ${counts.outdated} outdated of ${total} packages`
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run src/renderer/src/components/SeverityMeter/SeverityMeter.constants.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Create the component**

Create `src/renderer/src/components/SeverityMeter/SeverityMeter.tsx`:

```tsx
import type { ReactNode } from 'react'
import { SEVERITY_COLORS, severityMeterTooltip, severitySegments } from './SeverityMeter.constants'
import type { SeverityMeterProps } from './SeverityMeter.types'

/** Compact packages headline for the ~132px header slot: a stacked severity bar
 *  (critical → low) with a vulnerable count and a trailing outdated count. The
 *  full breakdown lives in the tooltip. */
export function SeverityMeter({ counts, total, computing = false }: SeverityMeterProps): ReactNode {
  const segments = severitySegments(counts)
  const tip = severityMeterTooltip(counts, total)
  const clear = counts.vulnerable === 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }} title={tip}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 650,
          color: clear ? 'var(--text-2)' : SEVERITY_COLORS.high,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {clear ? 'all clear' : `${counts.vulnerable} vuln`}
      </div>
      <div style={{ position: 'relative', display: 'flex', gap: 1.5, width: 132, height: 12 }}>
        {clear ? (
          <div style={{ flex: 1, borderRadius: 2, backgroundColor: 'var(--surface-2)' }} />
        ) : (
          segments.map((s) => (
            <div
              key={s.key}
              title={`${s.count} ${s.key}`}
              style={{ flex: s.frac, height: 12, borderRadius: 2, backgroundColor: s.color }}
            />
          ))
        )}
        {computing && (
          <div
            className="cc-ghost"
            aria-hidden="true"
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 2 }}
          />
        )}
      </div>
      {counts.outdated > 0 && (
        <div style={{ fontSize: 11.5, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{counts.outdated} old</div>
      )}
    </div>
  )
}
```

Create `src/renderer/src/components/SeverityMeter/index.ts`:

```ts
export { SeverityMeter } from './SeverityMeter'
export type { SeverityMeterProps } from './SeverityMeter.types'
```

- [ ] **Step 7: Typecheck, lint, build**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: PASS. (The component has no unit test — its logic is covered by Step 5; JSX is gated here.)

- [ ] **Step 8: Commit**

```bash
git add src/renderer/src/components/SeverityMeter
git commit -m "feat(app): SeverityMeter — compact packages severity headline"
```

---

### Task 4: `tabSummary` pure helper (footer line)

**Files:**
- Create: `src/renderer/src/launcher/LauncherApp/tabSummary.ts`
- Test: `src/renderer/src/launcher/LauncherApp/tabSummary.test.ts`

**Interfaces:**
- Consumes: `SeverityCounts` from `@renderer/lib/severity`; `GB`, `formatSizeStr` from `@renderer/lib/format`; `LauncherTab` from `./LauncherApp.types` (`'projects' | 'caches' | 'packages' | 'docker'`).
- Produces:
  ```ts
  export interface TabSummaryInput {
    tab: LauncherTab
    projectsUsed: number
    cachesUsed: number; cachesAvailable: boolean
    dockerUsed: number; dockerAvailable: boolean
    thresholdGB: number; cacheThresholdGB: number; dockerThresholdGB: number
    severity: SeverityCounts
    packagesComputing: boolean; packagesHasData: boolean
  }
  export function tabSummary(input: TabSummaryInput): string | null
  ```

- [ ] **Step 1: Write the failing test**

Create `src/renderer/src/launcher/LauncherApp/tabSummary.test.ts`:

```ts
import type { SeverityCounts } from '@renderer/lib/severity'
import { GB } from '@renderer/lib/format'
import { describe, expect, it } from 'vitest'
import { type TabSummaryInput, tabSummary } from './tabSummary'

const sev = (o: Partial<SeverityCounts> = {}): SeverityCounts => ({
  critical: 0, high: 0, moderate: 0, low: 0, vulnerable: 0, outdated: 0, ...o,
})
const base: TabSummaryInput = {
  tab: 'projects',
  projectsUsed: 0,
  cachesUsed: 0, cachesAvailable: true,
  dockerUsed: 0, dockerAvailable: true,
  thresholdGB: 5, cacheThresholdGB: 10, dockerThresholdGB: 20,
  severity: sev(), packagesComputing: false, packagesHasData: true,
}

describe('tabSummary', () => {
  it('projects: percent under limit, over amount past it', () => {
    expect(tabSummary({ ...base, tab: 'projects', projectsUsed: 2.5 * GB })).toBe('50% of your 5 GB limit')
    expect(tabSummary({ ...base, tab: 'projects', projectsUsed: 6 * GB })).toBe('1.00 GB over your 5 GB limit')
  })

  it('caches: uses the cache limit and wording, null when unavailable', () => {
    expect(tabSummary({ ...base, tab: 'caches', cachesUsed: 5 * GB })).toBe('50% of your 10 GB cache limit')
    expect(tabSummary({ ...base, tab: 'caches', cachesAvailable: false })).toBeNull()
  })

  it('docker: uses the docker limit and wording, null when unavailable', () => {
    expect(tabSummary({ ...base, tab: 'docker', dockerUsed: 10 * GB })).toBe('50% of your 20 GB Docker limit')
    expect(tabSummary({ ...base, tab: 'docker', dockerAvailable: false })).toBeNull()
  })

  it('packages: vulnerable + outdated, all-clear, and null while computing with no data', () => {
    expect(tabSummary({ ...base, tab: 'packages', severity: sev({ vulnerable: 7, outdated: 28 }) })).toBe(
      '7 vulnerable · 28 outdated',
    )
    expect(tabSummary({ ...base, tab: 'packages', severity: sev({ outdated: 3 }) })).toBe('all clear · 3 outdated')
    expect(tabSummary({ ...base, tab: 'packages', severity: sev() })).toBe('all clear')
    expect(tabSummary({ ...base, tab: 'packages', packagesComputing: true, packagesHasData: false })).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/renderer/src/launcher/LauncherApp/tabSummary.test.ts`
Expected: FAIL — cannot resolve `./tabSummary`.

- [ ] **Step 3: Implement the helper**

Create `src/renderer/src/launcher/LauncherApp/tabSummary.ts`:

```ts
import { formatSizeStr, GB } from '@renderer/lib/format'
import type { SeverityCounts } from '@renderer/lib/severity'
import type { LauncherTab } from './LauncherApp.types'

export interface TabSummaryInput {
  tab: LauncherTab
  projectsUsed: number
  cachesUsed: number
  cachesAvailable: boolean
  dockerUsed: number
  dockerAvailable: boolean
  thresholdGB: number
  cacheThresholdGB: number
  dockerThresholdGB: number
  severity: SeverityCounts
  packagesComputing: boolean
  packagesHasData: boolean
}

/** "{pct}% of your {n} GB {qualifier}limit" under the cap, or
 *  "{over} over your {n} GB {qualifier}limit" past it. `qualifier` is ''
 *  for node_modules, 'cache ' for caches, 'Docker ' for docker. */
function sizeLimitSummary(usedBytes: number, thresholdGB: number, qualifier: string): string {
  const threshold = thresholdGB * GB
  if (usedBytes > threshold) {
    return `${formatSizeStr(usedBytes - threshold)} over your ${thresholdGB} GB ${qualifier}limit`
  }
  const pct = threshold > 0 ? (usedBytes / threshold) * 100 : 0
  return `${pct.toFixed(0)}% of your ${thresholdGB} GB ${qualifier}limit`
}

/** The footer line for the active tab, or null when there is nothing to show. */
export function tabSummary(input: TabSummaryInput): string | null {
  switch (input.tab) {
    case 'projects':
      return sizeLimitSummary(input.projectsUsed, input.thresholdGB, '')
    case 'caches':
      return input.cachesAvailable ? sizeLimitSummary(input.cachesUsed, input.cacheThresholdGB, 'cache ') : null
    case 'docker':
      return input.dockerAvailable ? sizeLimitSummary(input.dockerUsed, input.dockerThresholdGB, 'Docker ') : null
    case 'packages': {
      if (input.packagesComputing && !input.packagesHasData) return null
      const { vulnerable, outdated } = input.severity
      if (vulnerable === 0) return outdated > 0 ? `all clear · ${outdated} outdated` : 'all clear'
      return `${vulnerable} vulnerable · ${outdated} outdated`
    }
    default:
      return null
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/renderer/src/launcher/LauncherApp/tabSummary.test.ts`
Expected: PASS (4 tests). If the projects "over" assertion mismatches, check `formatSizeStr(1 * GB)` output and align the expectation to the real format (it renders GB with 2 decimals, e.g. `1.00 GB`).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/launcher/LauncherApp/tabSummary.ts src/renderer/src/launcher/LauncherApp/tabSummary.test.ts
git commit -m "feat(app): tabSummary — per-tab footer line"
```

---

### Task 5: `TabHeadline` switcher component

**Files:**
- Create: `src/renderer/src/components/TabHeadline/TabHeadline.types.ts`
- Create: `src/renderer/src/components/TabHeadline/TabHeadline.tsx`
- Create: `src/renderer/src/components/TabHeadline/index.ts`

**Interfaces:**
- Consumes: `Gauge` from `@renderer/components/Gauge` (`GaugeProps = { used; threshold; accent; linkedBytes?; calculating? }`), `SeverityMeter` from `@renderer/components/SeverityMeter`, `SeverityCounts` from `@renderer/lib/severity`, `GB` from `@renderer/lib/format`, `LauncherTab` from `@renderer/launcher/LauncherApp/LauncherApp.types`.
- Produces: `TabHeadline` rendering the right headline for the active tab, or `null` when a size tab has no data.
  ```ts
  export interface TabHeadlineProps {
    tab: LauncherTab; accent: string
    projectsUsed: number; linkedBytes: number; projectsCalculating: boolean; thresholdGB: number
    cachesUsed: number; cachesAvailable: boolean; cachesCalculating: boolean; cacheThresholdGB: number
    dockerUsed: number; dockerAvailable: boolean; dockerThresholdGB: number
    severity: SeverityCounts; packagesTotal: number; packagesComputing: boolean
  }
  ```

- [ ] **Step 1: Create the types**

Create `src/renderer/src/components/TabHeadline/TabHeadline.types.ts`:

```ts
import type { SeverityCounts } from '@renderer/lib/severity'
import type { LauncherTab } from '@renderer/launcher/LauncherApp/LauncherApp.types'

export interface TabHeadlineProps {
  tab: LauncherTab
  accent: string
  // projects (node_modules)
  projectsUsed: number
  linkedBytes: number
  projectsCalculating: boolean
  thresholdGB: number
  // caches (pnpm store)
  cachesUsed: number
  cachesAvailable: boolean
  cachesCalculating: boolean
  cacheThresholdGB: number
  // docker
  dockerUsed: number
  dockerAvailable: boolean
  dockerThresholdGB: number
  // packages
  severity: SeverityCounts
  packagesTotal: number
  packagesComputing: boolean
}
```

- [ ] **Step 2: Create the component**

Create `src/renderer/src/components/TabHeadline/TabHeadline.tsx`:

```tsx
import { Gauge } from '@renderer/components/Gauge'
import { SeverityMeter } from '@renderer/components/SeverityMeter'
import { GB } from '@renderer/lib/format'
import type { ReactNode } from 'react'
import type { TabHeadlineProps } from './TabHeadline.types'

/** The header data-viz slot, routed by active tab: a size-vs-limit Gauge for
 *  node_modules / caches / docker, a SeverityMeter for packages. Renders null
 *  when a size tab has no data to show (no pnpm store / docker unavailable). */
export function TabHeadline(props: TabHeadlineProps): ReactNode {
  const { tab, accent } = props
  if (tab === 'packages') {
    return <SeverityMeter counts={props.severity} total={props.packagesTotal} computing={props.packagesComputing} />
  }
  if (tab === 'caches') {
    if (!props.cachesAvailable) return null
    return (
      <Gauge
        used={props.cachesUsed}
        threshold={props.cacheThresholdGB * GB}
        accent={accent}
        calculating={props.cachesCalculating}
      />
    )
  }
  if (tab === 'docker') {
    if (!props.dockerAvailable) return null
    return <Gauge used={props.dockerUsed} threshold={props.dockerThresholdGB * GB} accent={accent} />
  }
  // projects
  return (
    <Gauge
      used={props.projectsUsed}
      threshold={props.thresholdGB * GB}
      accent={accent}
      linkedBytes={props.linkedBytes}
      calculating={props.projectsCalculating}
    />
  )
}
```

Create `src/renderer/src/components/TabHeadline/index.ts`:

```ts
export { TabHeadline } from './TabHeadline'
export type { TabHeadlineProps } from './TabHeadline.types'
```

- [ ] **Step 3: Typecheck, lint, build**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: PASS. (Presentational switch, no unit test — verified via the integration task and manual checks.)

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/TabHeadline
git commit -m "feat(app): TabHeadline — per-tab header data-viz switcher"
```

---

### Task 6: Wire `TabHeadline` + `tabSummary` into `LauncherApp`

**Files:**
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx` (imports; add `dockerTotal`, `severity`, `packagesHasData` memos; swap header `Gauge` → `TabHeadline`; swap footer text → `tabSummary`)

**Interfaces:**
- Consumes: `TabHeadline` (Task 5), `severityCounts` (Task 2), `tabSummary` (Task 4). Existing in scope: `totalUsed`, `linkedTotal`, `storeBytes`, `store`, `scanning`, `storeLoading`, `calculating`, `inventory`, `pkgComputing`, `docker.info`, `settings.thresholdGB`, `settings.cacheThresholdGB`, `settings.dockerThresholdGB`, `isEmpty`, `accent`, `tab`, `view`.

- [ ] **Step 1: Update imports**

In `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`:
- Remove the `Gauge` import line (`import { Gauge } from '@renderer/components/Gauge'`) — `Gauge` is now used only inside `TabHeadline`.
- Add:

```ts
import { TabHeadline } from '@renderer/components/TabHeadline'
import { severityCounts } from '@renderer/lib/severity'
import { tabSummary } from './tabSummary'
```

- [ ] **Step 2: Add the derived values**

After the existing `dockerMaxBytes` memo (around line 153-156), add:

```ts
  const dockerTotal = useMemo(
    () => (docker.info?.totals ?? []).reduce((s, t) => s + t.sizeBytes, 0),
    [docker.info],
  )
  const severity = useMemo(() => severityCounts(inventory?.packages ?? []), [inventory])
  const packagesHasData = (inventory?.packages.length ?? 0) > 0
  const cachesAvailable = !!store?.available
  const dockerAvailable = !!docker.info?.available
```

- [ ] **Step 3: Swap the header gauge for `TabHeadline`**

Replace the header `<Gauge … />` block (currently around lines 648-654):

```tsx
              <Gauge
                used={totalUsed}
                threshold={threshold}
                accent={accent}
                linkedBytes={linkedTotal}
                calculating={calculating}
              />
```

with:

```tsx
              <TabHeadline
                tab={tab}
                accent={accent}
                projectsUsed={totalUsed}
                linkedBytes={linkedTotal}
                projectsCalculating={calculating}
                thresholdGB={settings.thresholdGB}
                cachesUsed={storeBytes}
                cachesAvailable={cachesAvailable}
                cachesCalculating={storeLoading}
                cacheThresholdGB={settings.cacheThresholdGB}
                dockerUsed={dockerTotal}
                dockerAvailable={dockerAvailable}
                dockerThresholdGB={settings.dockerThresholdGB}
                severity={severity}
                packagesTotal={inventory?.packages.length ?? 0}
                packagesComputing={pkgComputing}
              />
```

- [ ] **Step 4: Compute the footer summary + over-state**

Just before the `return (` of the component (near line 600, after `const overBy = totalUsed - threshold`), add:

```ts
  const summaryText = tabSummary({
    tab,
    projectsUsed: totalUsed,
    cachesUsed: storeBytes,
    cachesAvailable,
    dockerUsed: dockerTotal,
    dockerAvailable,
    thresholdGB: settings.thresholdGB,
    cacheThresholdGB: settings.cacheThresholdGB,
    dockerThresholdGB: settings.dockerThresholdGB,
    severity,
    packagesComputing: pkgComputing,
    packagesHasData,
  })
  const summaryOver =
    tab === 'projects'
      ? totalUsed > threshold
      : tab === 'caches'
        ? cachesAvailable && storeBytes > settings.cacheThresholdGB * GB
        : tab === 'docker'
          ? dockerAvailable && dockerTotal > settings.dockerThresholdGB * GB
          : severity.vulnerable > 0
  // The disk spinner only makes sense on the size tabs that background-calculate.
  const showCalcSpinner = calculating && (tab === 'projects' || tab === 'caches')
  const showSummary = !!summaryText && !(tab === 'projects' && isEmpty)
```

- [ ] **Step 5: Swap the footer text block**

Replace the footer summary block (currently around lines 991-1032, the `{view === 'list' && !isEmpty && (calculating ? (spinner) : (span))}`) with:

```tsx
                {view === 'list' &&
                  (showCalcSpinner ? (
                    <span
                      title={
                        scanning
                          ? 'Scanning your disk, the total is still updating.'
                          : 'Sizing the pnpm store, the total is still updating.'
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '3px 9px 3px 7px',
                        borderRadius: 999,
                        background: 'var(--surface-2)',
                        boxShadow: 'inset 0 0 0 1px var(--hairline)',
                      }}
                    >
                      <Spinner size={10} color={accent} />
                      <span style={{ fontSize: 11.5, fontWeight: 650, color: 'var(--text-2)' }}>
                        {scanning ? 'scanning' : 'pnpm'}
                      </span>
                      <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-dim)' }}>
                        {scanning
                          ? `${(scanProgress?.foldersChecked ?? 0).toLocaleString()} folders…`
                          : 'sizing store…'}
                      </span>
                    </span>
                  ) : (
                    showSummary && (
                      <span
                        style={{
                          fontSize: 12.5,
                          color: summaryOver ? mixColor('#fff', accent, 0.5) : 'var(--text-muted)',
                          fontWeight: 550,
                        }}
                      >
                        {summaryText}
                      </span>
                    )
                  ))}
```

- [ ] **Step 6: Typecheck, lint, build**

Run: `pnpm typecheck && pnpm test && pnpm lint && pnpm build`
Expected: PASS. If `Gauge` shows as unused-import error, confirm Step 1 removed it. If `calculating`/`ratio`/`overBy` are now unused, remove only the ones no longer referenced (leave `ratio`/`status` — still used by the window boxShadow glow).

- [ ] **Step 7: Manual verification**

Run `pnpm dev`. Confirm:
- Projects tab: header gauge + footer read exactly as before (`{pct}% of your {n} GB limit`).
- Caches tab: gauge fills against the cache limit; footer says "… cache limit". No gauge if no pnpm store.
- Packages tab: severity meter shows (or "all clear"); footer "{n} vulnerable · {m} outdated". Tooltip shows the full breakdown.
- Docker tab: gauge fills against the docker limit; footer "… Docker limit". No gauge when docker unavailable.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/src/launcher/LauncherApp/LauncherApp.tsx
git commit -m "feat(app): per-tab header data-viz and footer summary in LauncherApp"
```

---

### Task 7: Docker auto-scan on open when stale

**Files:**
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx` (add a `DOCKER_STALE_MS` constant + one effect)

**Interfaces:**
- Consumes: `docker.info` (`DockerInfo | null`, has `checkedAt: number`), `docker.loading`, `docker.refresh` (stable `useCallback`), `view`, `tab`, `dockerEnabled` — all already in scope.

- [ ] **Step 1: Add the staleness constant**

Near the top-of-file constants (after `LIST_PADDING` around line 52) add:

```ts
/** Re-scan Docker when its tab opens and the data is older than this. */
const DOCKER_STALE_MS = 5 * 60 * 1000
```

- [ ] **Step 2: Add the effect**

Add alongside the other `useEffect`s (e.g. just after the Docker-tab-fallback effect around line 132):

```ts
  // Docker refreshes on its own cadence, decoupled from the disk rescan: when the
  // Docker tab opens with missing or stale (>5 min) data, kick a background scan.
  // Guarded on `docker.loading` and freshened `checkedAt` so it can't loop.
  useEffect(() => {
    if (view !== 'list' || tab !== 'docker' || !dockerEnabled || docker.loading) return
    const stale = !docker.info || Date.now() - docker.info.checkedAt > DOCKER_STALE_MS
    if (stale) void docker.refresh()
  }, [view, tab, dockerEnabled, docker.info, docker.loading, docker.refresh])
```

- [ ] **Step 3: Typecheck, lint, build**

Run: `pnpm typecheck && pnpm test && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 4: Manual verification**

Run `pnpm dev`. Confirm:
- Opening the Docker tab with no prior scan triggers a refresh (loading state, then data).
- Switching away and back within 5 minutes does **not** re-scan (data stays put, no flicker).
- The manual refresh button and ⌘R still force a scan.
- No refresh loop (watch the busy/loading indicator settle and stay settled).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/launcher/LauncherApp/LauncherApp.tsx
git commit -m "feat(app): auto-scan Docker on tab open when data is stale"
```

---

### Task 8: Settings UI — Caches + Docker limit inputs

**Files:**
- Modify: `src/renderer/src/launcher/views/SettingsView.tsx` (add a `GbInput` local control + a "Storage limits" group in the Scanning tab)

**Interfaces:**
- Consumes: `settings.cacheThresholdGB`, `settings.dockerThresholdGB` (Task 1); existing `setSetting`, `SettingsRow`, `Divider`, `SectionHeading`.
- Note: node_modules keeps its existing `PixelStepper` "Alert threshold" row (1-10 GB, tied to notifications). The two new limits use number inputs because they need a larger range (docker default is 20 GB, above the stepper's 10 GB ceiling).

- [ ] **Step 1: Add a `GbInput` local control**

In `src/renderer/src/launcher/views/SettingsView.tsx`, add near the other local components (after `SectionHeading`):

```tsx
function GbInput({ valueGB, onChange }: { valueGB: number; onChange: (v: number) => void }): ReactNode {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="number"
        min={1}
        max={1000}
        value={valueGB}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (Number.isFinite(v)) onChange(v)
        }}
        style={{
          width: 74,
          background: 'var(--surface-2)',
          border: '1px solid var(--hairline)',
          borderRadius: 7,
          padding: '6px 9px',
          fontSize: 12.5,
          color: 'var(--text)',
          outline: 'none',
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
        }}
      />
      <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>GB</span>
    </div>
  )
}
```

- [ ] **Step 2: Add the "Storage limits" group to the Scanning tab**

In the `{tab === 'scanning' && ( … )}` block, after the "Threshold notifications" `SettingsRow` (the last row in that block), insert:

```tsx
          <Divider />
          <SectionHeading
            title="Storage limits"
            hint="Fill levels for the Caches and Docker headline gauges"
          />
          <SettingsRow label="pnpm cache limit" hint="The Caches tab gauge fills toward this size">
            <GbInput valueGB={settings.cacheThresholdGB} onChange={(v) => setSetting('cacheThresholdGB', v)} />
          </SettingsRow>
          {(settings.docker ?? true) && (
            <>
              <Divider />
              <SettingsRow label="Docker limit" hint="The Docker tab gauge fills toward this size">
                <GbInput valueGB={settings.dockerThresholdGB} onChange={(v) => setSetting('dockerThresholdGB', v)} />
              </SettingsRow>
            </>
          )}
```

- [ ] **Step 3: Typecheck, lint, build**

Run: `pnpm typecheck && pnpm test && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 4: Manual verification**

Run `pnpm dev` → Settings → Scanning. Confirm:
- "Storage limits" group shows pnpm cache limit (default 10) and Docker limit (default 20).
- Editing a value updates the corresponding tab's gauge fill (open Caches / Docker to see the limit line move).
- Docker limit row hides when the Docker tab is disabled (Packages settings tab → Docker cleanup off).
- Out-of-range values are clamped by `validate-setting` (persisted value never exceeds 1000 or drops below 0.1).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/launcher/views/SettingsView.tsx
git commit -m "feat(settings): cache and docker limit inputs in Settings"
```

---

## Final wrap-up (after all tasks pass review)

- [ ] Run the full gate once more: `pnpm typecheck && pnpm test && pnpm lint && pnpm build`.
- [ ] Update the `STATUS` data block in `STATUS.html`: bump `updated` to today, add a `done` roadmap item for per-tab headline data-viz + Docker auto-scan, and append one `log` line.
- [ ] Push the branch and open / update the PR for review.
