# Per-Tab Headline Data-Viz + Docker Auto-Scan — Design

**Date:** 2026-07-09
**Status:** Approved
**Branch context:** `feat/docker-project-grouping` (this work builds on it)

## Goal

Give every launcher tab its own headline data-visualization, instead of the
header gauge and footer line always reflecting node_modules. The header slot
and footer summary become tab-contextual. Docker additionally refreshes itself
when its tab is opened and the data is stale.

## Background — what exists today

- `LauncherApp` renders a compact 132px `Gauge` in the header top-right, always
  fed node_modules `totalUsed` vs `settings.thresholdGB` (default 5 GB). It is
  visible on every tab.
- The footer shows a text line `"{pct}% of your {thresholdGB} GB limit"` (or
  `"{over} over your {thresholdGB} GB limit"`), also node_modules-only.
- Data available per tab:
  - **Projects**: `totalUsed` (real disk: per-project unique size + pnpm store
    counted once) vs `thresholdGB`.
  - **Caches**: `store.sizeBytes` (pnpm store), `store.available`. No limit today.
  - **Packages**: `inventory.packages: PackageEntry[]`, each with optional
    `advisory.severity` (`low|moderate|high|critical`) and `outdated: boolean`.
    Also `inventory.computing`, `inventory.enrichmentError`.
  - **Docker**: `docker.info.totals: DockerCategoryTotal[]` (per-kind size +
    reclaimable + count), `docker.info.items`, `docker.info.checkedAt`,
    `docker.info.available`. `docker.refresh()` already exists, decoupled from
    the disk rescan.
- Settings clamp: `validate-setting.ts` clamps threshold values with
  `MIN_THRESHOLD_GB = 0.1`, `MAX_THRESHOLD_GB = 1000`.

## Decisions (locked during brainstorming)

1. **Limit model:** own limit per tab. Caches and Docker each get their own
   configurable GB limit in Settings, alongside the existing node_modules limit.
2. **Packages viz:** a severity stacked bar (critical/high/moderate/low) plus a
   secondary outdated count. Duplicate-version stays a per-row concern, not in
   the headline.
3. **Placement:** reuse the compact header gauge slot, made tab-contextual (not
   a new full-width band). Because the slot is ~132px, the Packages severity
   legend lives in the tooltip, not inline.
4. **Docker refresh:** auto-scan when the Docker tab opens and data is missing or
   older than 5 minutes; keep the manual ⌘R / refresh button.

## Architecture

### 1. Settings — two new per-tab limits

Add to `Settings` (`src/shared/settings.types.ts`):

```ts
/** pnpm cache (store) size limit, GB — headline gauge on the Caches tab. */
cacheThresholdGB: number
/** Docker total size limit, GB — headline gauge on the Docker tab. */
dockerThresholdGB: number
```

Defaults in `DEFAULT_SETTINGS` (`src/shared/settings.constants.ts`):
`cacheThresholdGB: 10`, `dockerThresholdGB: 20`.

Validation in `validate-setting.ts`: add both keys to the existing
`thresholdGB` clamp case (same `MIN_THRESHOLD_GB`/`MAX_THRESHOLD_GB` bounds), so
one `case 'thresholdGB': case 'cacheThresholdGB': case 'dockerThresholdGB':`
branch covers all three.

Settings UI (`SettingsView`): a small "Limits" group with three labeled GB
number inputs — node_modules / pnpm caches / Docker — following the existing
SettingsRow pattern. The node_modules input reuses whatever control edits
`thresholdGB` today (moved into this group if it lives elsewhere).

These are renderer-facing settings that already flow through the existing
`useSettings` / `setSetting` IPC path; no new IPC channel is needed.

### 2. `severityCounts` — pure helper

New pure function (co-located with the Packages tab logic, e.g.
`views/PackagesView.constants.ts` or a dedicated util file with a test):

```ts
export interface SeverityCounts {
  critical: number
  high: number
  moderate: number
  low: number
  vulnerable: number // sum of the four above
  outdated: number
}
export function severityCounts(packages: PackageEntry[]): SeverityCounts
```

Rules:
- Each package contributes to exactly one severity bucket: its `advisory.severity`
  (the entry's already-worst-severity advisory). Packages without an `advisory`
  contribute to none.
- `vulnerable` = critical + high + moderate + low.
- `outdated` = count of packages with `outdated === true` (independent of
  advisories — an outdated package may or may not be vulnerable).

### 3. `SeverityMeter` — compact packages headline

New component `components/SeverityMeter/` (index.ts, `SeverityMeter.tsx`,
`SeverityMeter.types.ts`, `SeverityMeter.constants.ts`, test).

Props: `{ counts: SeverityCounts; total: number; computing?: boolean }`.

Render (fits the ~132px header slot, matching `Gauge`'s footprint):
- A stacked horizontal bar whose segments are proportional to
  critical/high/moderate/low counts, each colored from a severity palette in
  `SeverityMeter.constants.ts`:
  - critical `#ff453a`, high `#ff9f0a`, moderate `#ffd60a`, low `#5e9eff`
    (final hexes may be tuned to the app palette during implementation).
- When `vulnerable === 0`: a full-width muted/ok-toned bar (an "all clear"
  state) instead of empty segments.
- A leading numeric: total vulnerable count; a trailing muted `· {outdated} outdated`.
- `title` (tooltip) carries the full breakdown:
  `"{critical} critical · {high} high · {moderate} moderate · {low} low · {outdated} outdated of {total} packages"`.
- When `computing`, show the same ghost-shimmer treatment `Gauge` uses (reuse
  the `cc-ghost` class) so the bar reads as "still calculating".

### 4. `TabHeadline` — the header switcher

New component `components/TabHeadline/` (index.ts, `TabHeadline.tsx`,
`TabHeadline.types.ts`, test).

Props (a small descriptor computed in `LauncherApp`):
```ts
type TabHeadlineProps = {
  tab: LauncherTab
  accent: string
} & (
  | { tab: 'projects'; used: number; threshold: number; linkedBytes: number; calculating: boolean }
  | { tab: 'caches';   used: number; threshold: number; calculating: boolean }
  | { tab: 'docker';   used: number; threshold: number }
  | { tab: 'packages'; counts: SeverityCounts; total: number; computing: boolean }
)
```
(Implementation may use a single flattened prop object rather than a strict
discriminated union if that reads cleaner in JSX — the switch on `tab` is the
essential part.)

Behavior:
- `projects` / `caches` / `docker` → render `<Gauge used threshold accent … />`.
  Projects passes `linkedBytes` + `calculating` as today; caches passes
  `calculating`; docker passes neither (0/false).
- `packages` → render `<SeverityMeter counts total computing />`.
- When a size tab has nothing to show (caches: `!store.available`; docker:
  `!info` or `!info.available`) `TabHeadline` renders `null` for that tab so the
  header slot is simply empty, rather than a 0-of-limit gauge.

`LauncherApp` replaces its inline `<Gauge …/>` in the header with
`<TabHeadline …/>`, computing the per-tab inputs it already has in scope
(`totalUsed`, `linkedTotal`, `storeBytes`, docker total, `severityCounts(...)`).

Docker total is the sum of `info.totals[*].sizeBytes` (a small memo).

### 5. `tabSummary` — tab-contextual footer line

New pure helper (co-located with `LauncherApp` logic, with a test):

```ts
function tabSummary(input): string | null
```
Returns the footer text for the active tab:
- `projects`: unchanged wording — `"{pct}% of your {thresholdGB} GB limit"` /
  `"{over} over your {thresholdGB} GB limit"`.
- `caches` (only when `store.available`): same shape vs `cacheThresholdGB`,
  worded `"… of your {cacheThresholdGB} GB cache limit"` / `"… over …"`.
- `docker` (only when `info?.available`): same shape vs `dockerThresholdGB`,
  worded `"… of your {dockerThresholdGB} GB Docker limit"`.
- `packages`: `"{vulnerable} vulnerable · {outdated} outdated"`, or `"all clear"`
  when both are 0. `null` while `computing` with no data yet (footer stays quiet).
- Returns `null` when there is nothing meaningful to show (e.g. caches with no
  store), so the footer simply omits the line.

The existing calculating-spinner branch (scan / pnpm sizing) is preserved for
`projects` and `caches`; `tabSummary` only supplies the settled text.

### 6. Docker auto-scan on open

In `LauncherApp`, add an effect keyed on the Docker tab being active:

```ts
useEffect(() => {
  if (view !== 'list' || tab !== 'docker' || !dockerEnabled) return
  const info = docker.info
  const stale = !info || Date.now() - info.checkedAt > 5 * 60 * 1000
  if (stale && !docker.loading) void docker.refresh()
}, [view, tab, dockerEnabled, docker])
```

Use a 5-minute staleness window constant (`DOCKER_STALE_MS = 5 * 60 * 1000`).
The manual ⌘R handler and the DockerView refresh button are unchanged. Guard
against a refresh loop: the effect must not fire while `docker.loading` is true,
and `checkedAt` updates after a refresh so a fresh scan won't immediately
re-trigger.

## Data flow

```
useSettings ──► thresholdGB / cacheThresholdGB / dockerThresholdGB
usePnpmStore ─► store.sizeBytes, store.available
usePackagesTab ► inventory.packages ──► severityCounts() ─► SeverityCounts
useDocker ────► info.totals ─► dockerTotal ; info.checkedAt ─► staleness
                    │
                    ▼
              LauncherApp  ──► TabHeadline (header slot, per active tab)
                           ──► tabSummary() (footer line, per active tab)
                           ──► docker auto-scan effect
```

## Error / edge handling

- **Caches, no store** (`!store.available`): `TabHeadline` renders null;
  `tabSummary` returns null. No gauge, no footer line.
- **Docker unavailable / not scanned** (`!info || !info.available`):
  `TabHeadline` renders null; `tabSummary` returns null. DockerView's own
  unavailable UI is untouched.
- **Packages still computing**: `SeverityMeter` shows the ghost shimmer;
  `tabSummary` returns null until counts exist.
- **Zero vulnerabilities**: `SeverityMeter` shows the "all clear" bar;
  `tabSummary` returns `"all clear"` (with outdated count when > 0:
  `"all clear · {outdated} outdated"`).
- **Threshold inputs**: clamped by `validate-setting` (0.1–1000 GB); invalid
  types rejected exactly like `thresholdGB`.
- **Docker auto-scan**: never fires while `docker.loading`; 5-min window
  prevents re-scan on every glance.

## Testing

- `severityCounts()`: worst-severity-per-package bucketing; packages with no
  advisory excluded; `vulnerable` = sum; `outdated` tallied independently;
  empty input → all zeros.
- `tabSummary()`: each tab — under limit, over limit, unavailable/no-data (null),
  packages zero → "all clear", packages with counts, computing → null.
- `validate-setting`: `cacheThresholdGB` and `dockerThresholdGB` clamp high/low,
  reject NaN and string, exactly as `thresholdGB`.
- `SeverityMeter`: render smoke — segments present for non-zero counts, all-clear
  state for zero, tooltip text composed correctly.
- `TabHeadline`: renders `Gauge` for size tabs, `SeverityMeter` for packages,
  `null` when a size tab has no data.

## Out of scope

- No new IPC channels (settings flow through the existing path).
- No change to Docker grouping, prune/remove flows, or the safety confirm gate.
- Duplicate-version count is not surfaced in the headline (per-row only).
- No menu-bar tray changes (tray still tracks node_modules `thresholdGB`).
