# Launcher Caches tab — design

**Date:** 2026-06-17
**Status:** Approved
**Issue:** #2 (Beyond node_modules) — surfaces M1 (pnpm store) inside the launcher and
becomes the home for M2 (npm/yarn/bun caches) and M3 (build outputs).

## Goal

Surface the global **pnpm store size + safe prune** in the launcher (⌘O) window,
in a way that scales to the other package-manager caches the roadmap will add.

The pnpm prune is already fully built: the IPC (`getPnpmStore` / `prunePnpmStore`),
the `usePnpmStore` hook, and the panel's `PnpmStoreRow` already exist. This is a
**placement + UI** change in the launcher, not new main-process plumbing.

## Decision

A **`Projects | Caches` segmented toggle** in the launcher's list header. The
`Caches` tab lists global caches. This was chosen over a footer chip or a strip
above the list because it is the only option that becomes the real home for all of
issue #2 instead of needing a redo at M2.

- **pnpm store** — functional now (size + Prune).
- **npm / yarn / bun** — shown now as **disabled "soon" placeholder rows** to
  communicate the roadmap inside the app.

## Layout

- The list view's header strip (`.cc-listhead`) gains a `Segmented` toggle on the
  left: `Projects | Caches` (reuse `components/Segmented`, `small`, accent active).
- **Sort** controls stay on the right in the **Projects** tab; hidden in **Caches**
  (a small fixed set — nothing to sort).
- The window header (search + gauge + close) and footer keep their structure.
- **Projects tab** — today's project list, unchanged.
- **Caches tab** — a vertical list of cache rows:
  - `pnpm store`: hdd icon, name, path subtitle (or "Pruning…"), size, **Prune**
    button. Driven by `usePnpmStore`.
  - `npm` / `yarn` / `bun`: disabled, greyed, "soon", no action.

## Tabs & keyboard (keyboard-first)

- Tabs are clickable **and** bound to **⌘1 = Projects, ⌘2 = Caches** (added to the
  existing `LauncherApp` keydown handler).
- In the Caches tab: **↑↓** highlights enabled rows (skips the "soon" placeholders),
  **↵** runs the highlighted cache's action = **Prune**. pnpm prune is safe (it
  never deletes the store, only unreferenced packages), so Enter-to-prune is allowed.
- Switching tabs resets that tab's selection to the top.
- Footer keyboard hints adapt per tab:
  - Projects: `↑↓ navigate · ↵ open · ⌘⌫ delete`
  - Caches: `↑↓ navigate · ↵ prune`

## Behavior

- **Search box** stays in both tabs; in Caches it filters the cache rows by name
  (consistent with Projects; trivial for a short list — accepted default).
- **Prune feedback**: on success, a toast mirroring the delete flow —
  `Reclaimed {size} · pnpm store` (via `useToast` / `flashToast`). The store size
  auto-refreshes (the hook already re-fetches after prune).
- **Gauge + "% of limit"** footer text stay as-is — they describe the *project*
  node_modules total. The pnpm store is a separate number and is **not** folded in.
- **Empty projects**: the tab bar still renders; the Projects tab shows the existing
  `EmptyView`, the Caches tab still works (the store can have size with zero scanned
  projects).

## Components & data flow

New:
- `components/CacheRow/` (`index.ts`, `CacheRow.tsx`, `CacheRow.types.ts`) — a
  launcher-styled row for one cache, with `enabled` (pnpm) and `disabled` ("soon")
  variants. The panel's `PnpmStoreRow` is left as-is; the launcher gets its own row
  to match its visual language.
- `launcher/views/CachesView.tsx` — flat file, matching its sibling views
  (`EmptyView`, `ScanningView`, `SettingsView`). Renders the pnpm row (from
  `usePnpmStore`) + the placeholder rows, owns the Caches-tab selection/highlight.
- `launcher/views/CachesView.constants.ts` — the npm/yarn/bun placeholder definitions.

Changed:
- `LauncherApp` gains `tab: LauncherTab` state; the listhead and body switch on it.
  The keydown handler gains ⌘1/⌘2 and Caches ↑↓/↵. The footer hints become
  tab-aware.
- `LauncherApp.types.ts` gains `export type LauncherTab = 'projects' | 'caches'`.

Reused unchanged: `Segmented`, `usePnpmStore`, `useToast`, the `hdd` UIIcon, the
sliding-highlight + scroll-into-view infra already in `LauncherApp`.

## Testing

- The codebase tests pure logic with vitest (no React component-test harness). The
  pure surface here is thin, so: unit-test `CachesView.constants.ts` (placeholder
  shape) and any extracted cache-list assembly helper, matching the existing style.
- Tab switching, the prune toast, keyboard (⌘1/⌘2, ↑↓, ↵-prune), and the disabled
  rows are verified in the running app (`pnpm dev`).

## Out of scope

- Actually implementing npm/yarn/bun cache sizing or pruning (that is issue #2 M2).
- Folding the pnpm store size into the GB-limit gauge/meter.
- Sorting or searching semantics beyond name-filtering in the Caches tab.
