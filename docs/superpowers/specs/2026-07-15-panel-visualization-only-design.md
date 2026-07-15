# Menu bar panel: visualization + shortcuts only

**Date:** 2026-07-15
**Status:** approved, ready for planning
**Branch:** rides `feat/docker-project-grouping` or its own branch (user's call)

## Problem

The menu bar popover (`src/renderer/src/panel/PanelApp/PanelApp.tsx`, 307 lines) is a
miniature of the main window: it lists the four oldest reclaimable `node_modules`
folders as `MiniRow`s, offers a "Clean N stale folders" CTA, and carries a pnpm store
prune row. It shows one of the app's four areas (`node_modules`) and lets you delete
from it, while caches, packages/vulnerabilities and Docker are invisible until you open
the launcher.

The app has since become TidyDisk: all developer disk waste, not just `node_modules`.
The panel should reflect that. It becomes a **read-only dashboard**: one glance at every
area, and a click into the main window for anything actionable.

## Decisions

Every decision below was made explicitly during brainstorming. They are recorded with
their rationale because several are non-obvious and one is a real product tradeoff.

### D1 — The panel is fully read-only

Remove from the panel: the `MiniRow` list and its "Reclaimable · oldest first" header,
`CleanStaleCta`, `PnpmStoreRow`, the "Free version · scanning is free forever" paywall
affordance button, and `UnlockPrompt`.

**Consequence, accepted deliberately:** all three `paywall_shown` triggers currently
fired from the panel (`clean_stale`, `prune`, `affordance`) disappear with them. The
launcher becomes the app's only paywall surface. This is a funnel change, not just a UI
change.

`ScanPanel` and its ⌘R shortcut stay — scanning is read-only and is a shortcut, not an
action.

### D2 — Layout: aggregate hero + four rows

```
┌────────────────────────────────────┐
│ TRACKED ON DISK                    │
│ 64.8 GB          🖴 50 GB limit    │  ← hero: big number + combined limit
│                  ⚠ 14.8 GB over    │
│ [████████████████░░░░▓░░░░░░░░░░]  │  ← 32-cell PixelMeter vs combined limit
│ node_modules + caches + Docker     │
├────────────────────────────────────┤
│ Projects   [▪▪▪▪▪░░░]   41.2 GB  › │  ← four click-through rows
│ Caches     [▪▪░░░░░░]    6.4 GB  › │
│ Packages   [██▓▓░░░░]    7 vuln  › │
│ Docker     [▪▪▪▪▪▪▓░]   23.6 GB  › │
├────────────────────────────────────┤
│ Open full window…             ⌘O   │  ← unchanged
│ Scan now                      ⌘R   │
│ Settings…                     ⌘,   │
│ Quit                          ⌘Q   │
├────────────────────────────────────┤
│ Last scan 3 min ago · next in 18 h │  ← unchanged
└────────────────────────────────────┘
```

Rejected alternatives: keeping a `node_modules` hero with three secondary rows (says
`node_modules` is still the product); four equal rows with no hero (loses the headline
number the business model treats as the shareable artifact).

`useAutoHeight` already drives `setWindowHeight` from a `ResizeObserver`, so the native
popover resizes to the new content with no window-sizing work.

### D3 — The hero means "tracked", not "reclaimable"

Hero = `totalUsed + dockerTotal`, labelled **"Tracked on disk"**. Purely descriptive:
what these areas occupy. It makes no reclaim promise, so it cannot be dishonest.

"Reclaimable" was rejected as the headline: Docker exposes `reclaimableBytes` per
category and `node_modules` has a defensible stale set, but **the pnpm store's prunable
share is unknowable until you actually prune it**. A "reclaimable" headline would have to
silently omit an entire area.

### D4 — Each byte counted once; rows mirror their tabs

`totalUsed` (`LauncherApp.tsx:157`, mirrored in `PanelApp.tsx:48`) is
`sum(project.uniqueSize ?? size) + storeBytes` — it **already includes the pnpm store**,
by design, because that is real `node_modules` disk. The Caches gauge
(`LauncherApp.tsx:674`) is `storeBytes`, that same store again. The launcher can afford
this overlap (separate tabs answer separate questions); a summed hero cannot.

Therefore:

- **Hero** = `totalUsed + dockerTotal`. Each byte once.
- **Rows mirror their tab headline exactly**: Projects `totalUsed`, Caches `storeBytes`,
  Docker `dockerTotal`, Packages the `SeverityMeter`.
- **The hero is therefore smaller than the four rows added up**, by exactly the pnpm
  store. Accepted: click-through must never lie (clicking a row showing 41.2 GB must land
  on a tab reading 41.2 GB), and only a user manually summing rows can see the gap. The
  hero carries a tooltip explaining the store is shared and counted once — the same
  device `DiskSummary` already uses for linked bytes.

There is **no Docker build-cache double count**: the Caches *gauge* is `storeBytes` only;
the build cache appears in the Caches tab's *list*, not its headline.

### D5 — Combined limit = sum of the present areas' limits

No new setting. Combined limit is derived at render time from the existing
`thresholdGB` (20) + `cacheThresholdGB` (10) + `dockerThresholdGB` (20), including only
areas actually present (see D6). The "over" line is `hero − combinedLimit`: one number,
internally consistent.

**Known approximation, written down rather than hidden:** the store sits inside the
hero's numerator once, while `cacheThresholdGB` is added to the denominator. The combined
budget is a rough sum, not an airtight one. Rejected: a fourth `combinedThresholdGB`
setting (one more limit to explain and keep in sync).

### D6 — Honesty gating

Follows the rule the Packages headline already learned: never show a false "all clear",
never render a gauge for data that was never measured.

| Condition | Behavior |
|---|---|
| `settings.docker === false` or `!docker.info.available` | Docker row hidden; its bytes leave the hero; `dockerThresholdGB` leaves the denominator; label reads "across 2 areas" |
| `!store.available` | Caches row hidden; `cacheThresholdGB` leaves the denominator; `storeBytes` is already 0 in `totalUsed` |
| `checkUpdates` off, no cached inventory, or `inventory.enrichmentError` | Packages row renders a muted "Not checked yet" placeholder that still clicks through to the tab |
| Packages OK | `SeverityMeter` from `severityCounts(inventory.packages)` |

Packages is never part of the hero total or the combined limit — vulnerabilities are not
bytes. The hero label counts size areas only ("across N areas", N ≤ 3).

### D6b — The "All clean" empty state goes away

`PanelEmpty` currently replaces the **entire** panel body whenever `projects.length === 0`
(`PanelApp.tsx:175-183`). Under D2 that is a lie: a user with 23 GB of Docker and zero
`node_modules` folders would see a full-panel "All clean" with their Docker bar hidden
behind it. Its "Reclaimed {n} this session" line is also permanently `0 B` once D1 removes
the panel's delete path.

Therefore:

- **Keep** the `!onboarded` first-run branch — before the first scan there is genuinely
  nothing to visualize, so it still owns the whole body.
- **Delete** the "All clean" branch and the `reclaimed` prop. With zero projects the
  Projects row simply reads `0 B` and every other area still renders. The dashboard is
  never replaced by a verdict about one area.

### D7 — Freshness: cheap live, expensive lazy

The popover opens on every menu bar click and must never block.

- **Docker + store:** render last-known numbers instantly, refresh in the background when
  data is missing or >5 min stale, reusing the Docker tab's existing `DOCKER_STALE_MS`
  rule (`LauncherApp.tsx:139-146`). `getDockerInfo` already caches to disk and dedupes
  in-flight calls; `getPnpmStore` is a `du` that can take seconds, so its result must
  never gate first paint.
- **Packages:** read `getPackages()` (cached-or-null) only. **Never** call
  `computePackages()` from the panel. An uncomputed inventory shows the D6 placeholder;
  clicking through to the Packages tab computes it there, as it does today.

Rejected: always-live (every menu bar click would spawn docker CLI calls and a full
inventory recompute).

### D8 — Nav: widen the existing mechanism

The transport already exists and handles both cases correctly (fresh window →
`pendingNav` → `consumeLauncherNav()`; already-open window → `onLauncherNavigate` send).
It needs no change.

- `src/shared/launcher-nav.types.ts:2`: widen `LauncherNavTarget` from the single-member
  `'settings'` to `'settings' | 'projects' | 'caches' | 'packages' | 'docker'`.
- `LauncherApp.tsx:124` and `:127`: replace the two hardcoded `nav === 'settings'` checks
  with one shared target → `{view, tab}` map.
- Clicking a row calls `window.clean.openLauncher(<target>)`, which already hides the
  panel before opening the launcher (`register-ipc.ts:197-200`).

**Edge case:** navigating to `docker` while `settings.docker === false` must not select a
hidden tab. The Docker row is hidden in exactly that case (D6), so it is unreachable from
the panel; the existing fallback at `LauncherApp.tsx:132-137` remains the backstop.

## Architecture

Tests in this repo are **pure-logic only** — `vitest.config.ts` includes
`src/**/*.test.ts` (not `.tsx`), and there is no React Testing Library. Every decision
therefore lives in a pure `.ts` module, and the `.tsx` files stay thin layout.

### New

- **`panel/PanelApp/panelAreas.ts`** — the whole brain. One pure function:

  ```ts
  panelAreas(input: PanelAreasInput): PanelAreas
  ```

  Input: projects, store, docker info, inventory, settings. Output: `heroBytes`,
  `combinedLimitGB`, `areaCount`, and the ordered row list with gating resolved
  (each row: id/nav target, label, value, meter kind, whether it's a placeholder).
  Modelled on `tabSummary.ts` — same shape, same testing style. This is where D3–D6 are
  encoded and tested.

- **`panel/PanelApp/AreaBar/`** — `AreaBar.tsx`, `AreaBar.types.ts`, `index.ts`. Renders
  one click-through row: label, slim meter (`PixelMeter` at reduced `cells`/height, or
  `SeverityMeter`), value, chevron. Dumb; takes a resolved row from `panelAreas`.

- **`launcher/LauncherApp/launcherNav.ts`** — the pure target → `{view, tab}` map, tested.
  It lives in the launcher, not `shared/`, because `LauncherView` and `LauncherTab` are
  defined in `LauncherApp.types.ts`; only the `LauncherNavTarget` union itself is shared
  (the panel and main both need it).

### Changed

- **`DiskSummary` → `TrackedSummary`** — the hero generalizes: label, total, combined
  limit, meter, composition sub-line. It is no longer `node_modules`-specific; the
  existing structure (27px number, limit/over lines, 32-cell `PixelMeter`) carries over
  as-is.
- **`PanelApp.tsx`** — shrinks from 307 lines to layout: hero, `areas.map(AreaBar)`,
  menu items, footer. Loses `removeMany`, `pruneStore`, `deleting`, `reclaimed`,
  `useLicense`, `useLiveProjects`, and the store-prune wiring; gains `useDocker` and
  `usePackages` (cached reads).
- **`launcher-nav.types.ts`**, **`LauncherApp.tsx:122-129`** — per D8.

### Removed

`PnpmStoreRow.tsx`, `CleanStaleCta.tsx`, the panel's `MiniRow` usage, and `PanelEmpty`'s
"All clean" branch + `reclaimed` prop (D6b). `MiniRow` itself stays — the launcher uses
it. No dead props are left behind.

## Testing

TDD, per project convention. All pure:

- `panelAreas.test.ts` — the bulk. Hero counts the store once; hero < sum of rows by
  exactly the store (D4, asserted explicitly); each byte-area's row value equals its tab
  headline value; Docker absent/disabled drops bytes + limit + row and reports 2 areas;
  store unavailable drops the caches row and limit; Packages placeholder under each of
  the three D6 conditions; Packages never enters the hero or the limit; combined limit
  math; over/free line; zero projects still yields a full row list with Projects at `0 B`
  (D6b — the dashboard is never collapsed by one empty area).
- `launcher-nav.test.ts` — every target maps to the right `{view, tab}`; `'settings'`
  still resolves to the settings view (no regression).
- Existing `tabSummary.test.ts` and the Docker/Caches constants tests must stay green —
  this change must not alter launcher behavior beyond nav.

Manual QA (user, needs a running app + Docker daemon): every row opens the right tab;
panel opens instantly with a cold Docker cache; Docker off hides the row and rebalances
the hero; Packages placeholder appears before the Packages tab is ever visited.

## Out of scope

- The npm/yarn/bun cache placeholders in `CachesView.constants.ts` (still "coming soon").
- Any change to launcher tab content, delete paths, or the license gate.
- Moving or redesigning the paywall inside the launcher — D1 removes the panel's paywall
  surface; where the launcher's paywall lives is a separate question.
