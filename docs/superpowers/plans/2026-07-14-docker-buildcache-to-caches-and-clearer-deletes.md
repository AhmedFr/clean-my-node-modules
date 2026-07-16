# Docker build cache → Caches tab + clearer deletion buttons — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Docker build cache out of the Docker tab into the Caches tab as a single deletable row, and make the Docker deletion buttons unmistakably read as deletions.

**Architecture:** Pure display/wiring change. `groupDockerForDisplay` stops emitting a build-cache group (build-cache items stay in `docker.info.items`, so gauge/scale accounting is untouched); the Caches tab renders a generalized list of "live caches" (pnpm store + Docker build cache) whose keyboard nav and Delete/Prune actions are driven by data built in `LauncherApp`. Bulk-prune buttons and the build-cache Delete button get delete-verb labels + trash icon + danger (red) styling. Every delete still routes through the existing docker confirm gate; no safety-model change.

**Tech Stack:** Electron + React 18 (renderer), TypeScript, Vitest (pure-logic tests only — no `.test.tsx`/testing-library; JSX is verified by typecheck + build + manual). Biome for lint/format. pnpm.

## Global Constraints

- Package manager: **pnpm** (`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`).
- **No em dashes** in any user-facing copy (labels, tooltips, detail lines). Ellipsis `…` is fine and already used ("Pruning…").
- Tests live beside sources as `*.test.ts` and use Vitest (`import { describe, expect, it } from 'vitest'`). There is **no** component-render testing — do not add `.test.tsx` or testing-library.
- Danger (destructive) styling matches the node_modules `RowAction`: border `rgba(255,99,99,0.4)`, background `rgba(255,99,99,0.10)`, text `rgba(255,99,99,0.95)` (dim to `var(--text-dim)` while busy).
- Safety model is frozen: all deletes go through the existing `requestDockerPrune` / `requestDockerRemove` confirm gate; the typed-name volume gate is byte-identical. Build cache is never individually removable.
- Conventional-commit subjects. Commit at the end of each task.

---

## File Structure

- `src/renderer/src/launcher/views/DockerView.constants.ts` — drop the `buildcache` display group; add `PRUNE_BUTTON_LABEL` (delete-verb button labels) and `dockerBuildCacheBytes` helper. (Keep `PRUNE_TARGET_LABEL`, `pruneEstimateBytes` — still used by the confirm footer/toast and the Caches delete estimate.)
- `src/renderer/src/launcher/views/DockerView.tsx` — prune buttons use `PRUNE_BUTTON_LABEL` + trash icon + danger styling; drop `buildcache` from `GROUP_ICON`.
- `src/renderer/src/components/CacheRow/CacheRow.types.ts` + `CacheRow.tsx` — optional `danger` + `actionIcon` on the action button.
- `src/renderer/src/launcher/views/CachesView.constants.ts` — add `LiveCache` interface + `visibleCaches` helper.
- `src/renderer/src/launcher/views/CachesView.tsx` — render a list of `LiveCache` rows (query-filtered, index-preserving) above the placeholders.
- `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx` — build `liveCaches` (pnpm + Docker build cache), pass to `CachesView`, extend the Docker auto-scan effect to the Caches tab, update the Caches keyboard nav.

Tests: `DockerView.constants.test.ts`, `CachesView.constants.test.ts`.

---

## Task 1: DockerView.constants — remove build-cache group, add button labels + size helper

**Files:**
- Modify: `src/renderer/src/launcher/views/DockerView.constants.ts`
- Test: `src/renderer/src/launcher/views/DockerView.constants.test.ts`

**Interfaces:**
- Produces:
  - `PRUNE_BUTTON_LABEL: Record<DockerPruneTarget, string>` — delete-verb button labels.
  - `dockerBuildCacheBytes(items: DockerItem[]): number` — total bytes of build-cache items.
  - `DisplayGroup` union no longer has a `{ kind: 'buildcache' }` variant.
- Consumes: existing `DockerItem`, `DockerPruneTarget` from `@shared/docker.types`.

- [ ] **Step 1: Update the failing tests first**

In `DockerView.constants.test.ts`, replace the first `groupDockerForDisplay` test (the one asserting `kinds` contains `'buildcache'`) with a version that asserts build cache is gone, and add two new `describe` blocks. Apply these edits:

Replace this block (currently around lines 40-49):

```ts
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
```

with:

```ts
  it('puts project groups first, then repository/unaffiliated under "Other"', () => {
    const g = groupDockerForDisplay(info(items), { sortBy: 'size', typeFilter: 'all', query: '' })
    expect(g[0]).toMatchObject({ kind: 'project', project: { name: 'myapp' } })
    const kinds = g.map((x) => x.kind)
    expect(kinds).toContain('repository') // redis
    expect(kinds).toContain('unaffiliated') // orphan volume
    // project group before any "Other" group
    expect(kinds.indexOf('project')).toBeLessThan(kinds.indexOf('repository'))
  })

  it('never groups build-cache items (they moved to the Caches tab)', () => {
    const g = groupDockerForDisplay(info(items), { sortBy: 'size', typeFilter: 'all', query: '' })
    expect(g.some((x) => x.kind === ('buildcache' as unknown))).toBe(false)
    expect(g.every((x) => x.items.every((i) => i.kind !== 'buildcache'))).toBe(true)
  })
```

Then delete the `prunesForGroup` test titled `'buildcache group offers buildCache'` (currently around lines 180-183):

```ts
  it('buildcache group offers buildCache', () => {
    const g = group({ kind: 'buildcache', items: [item({ id: 'b1', kind: 'buildcache', name: 'b1' })] })
    expect(prunesForGroup(g)).toEqual(['buildCache'])
  })
```

Then add these two `describe` blocks at the end of the file (before the final line), and add `PRUNE_BUTTON_LABEL, dockerBuildCacheBytes` to the top `import { … } from './DockerView.constants'`:

```ts
describe('PRUNE_BUTTON_LABEL', () => {
  it('leads every label with the word "Delete" so the button reads as destructive', () => {
    for (const label of Object.values(PRUNE_BUTTON_LABEL)) {
      expect(label.startsWith('Delete ')).toBe(true)
    }
  })

  it('has no em dashes', () => {
    for (const label of Object.values(PRUNE_BUTTON_LABEL)) {
      expect(label.includes('—')).toBe(false)
    }
  })
})

describe('dockerBuildCacheBytes', () => {
  it('sums only build-cache items', () => {
    const items: DockerItem[] = [
      { id: 'b1', kind: 'buildcache', name: 'b1', sizeBytes: 100, createdAt: 0, inUse: false, removable: false },
      { id: 'b2', kind: 'buildcache', name: 'b2', sizeBytes: 250, createdAt: 0, inUse: false, removable: false },
      { id: 'i1', kind: 'image', name: 'redis', sizeBytes: 999, createdAt: 0, inUse: false, removable: true },
    ]
    expect(dockerBuildCacheBytes(items)).toBe(350)
  })

  it('is 0 when there are no build-cache items', () => {
    expect(dockerBuildCacheBytes([])).toBe(0)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test src/renderer/src/launcher/views/DockerView.constants.test.ts`
Expected: FAIL — `PRUNE_BUTTON_LABEL` / `dockerBuildCacheBytes` are not exported yet, and the removed-buildcache assertions fail against the current implementation.

- [ ] **Step 3: Implement the constants changes**

In `DockerView.constants.ts`:

(a) Remove the `buildcache` variant from the `DisplayGroup` union:

```ts
export type DisplayGroup =
  | { kind: 'project'; id: string; label: string; project: DockerProject; items: DockerItem[] }
  | { kind: 'repository'; id: string; label: string; items: DockerItem[] }
  | { kind: 'unaffiliated'; id: string; label: string; items: DockerItem[] }
```

(b) In `groupDockerForDisplay`, delete the `cache` / `buildcacheGroup` construction and drop it from the return. The `rest` filter already excludes build-cache items, so they simply no longer appear. The tail of the function becomes:

```ts
  const rest = other.filter((i) => i.kind !== 'buildcache' && !(i.kind === 'image' && i.repository)).sort(bySizeDesc)
  const unaffiliatedGroup: DisplayGroup[] = rest.length
    ? [{ kind: 'unaffiliated', id: 'unaffiliated', label: 'Not linked to a project', items: rest }]
    : []

  return [
    ...sortGroups(projectGroups, opts.sortBy),
    ...sortGroups([...repoGroups, ...unaffiliatedGroup], opts.sortBy),
  ]
}
```

(c) In `prunesForGroup`, remove the build-cache branch. After the repository/unaffiliated block it becomes just:

```ts
export function prunesForGroup(group: DisplayGroup): DockerPruneTarget[] {
  if (group.kind === 'repository' || group.kind === 'unaffiliated') {
    const targets: DockerPruneTarget[] = []
    if (group.items.some((i) => i.kind === 'image' && i.name === '<none>')) targets.push('danglingImages')
    if (group.items.some((i) => i.kind === 'image' && i.removable)) targets.push('unusedImages')
    if (group.kind === 'unaffiliated') {
      if (group.items.some((i) => i.kind === 'volume')) targets.push('unusedVolumes')
      if (group.items.some((i) => i.kind === 'container' && i.removable)) targets.push('stoppedContainers')
    }
    return targets
  }
  return []
}
```

(d) Add the new exports (place `PRUNE_BUTTON_LABEL` next to `PRUNE_TARGET_LABEL`, and `dockerBuildCacheBytes` next to `pruneEstimateBytes`):

```ts
/** Button labels for the bulk-prune actions. Unlike `PRUNE_TARGET_LABEL` (the noun used in
 *  the confirm footer + toast), these lead with a delete verb so the button reads as the
 *  destructive action it is. */
export const PRUNE_BUTTON_LABEL: Record<DockerPruneTarget, string> = {
  danglingImages: 'Delete dangling images',
  unusedImages: 'Delete unused images',
  stoppedContainers: 'Delete stopped containers',
  buildCache: 'Delete build cache',
  unusedVolumes: 'Delete unused volumes',
}

/** Total bytes of Docker build-cache items. Surfaced as a single row in the Caches tab —
 *  build cache is a global cache, not a per-project resource, so it lives with the other
 *  package-manager caches rather than in the project-grouped Docker list. */
export function dockerBuildCacheBytes(items: DockerItem[]): number {
  return items.filter((i) => i.kind === 'buildcache').reduce((s, i) => s + i.sizeBytes, 0)
}
```

Note: keep `PRUNE_TARGET_LABEL` and `pruneEstimateBytes` unchanged — they are still used by the confirm footer/toast and the Caches-tab delete estimate.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test src/renderer/src/launcher/views/DockerView.constants.test.ts`
Expected: PASS (all `groupDockerForDisplay`, `prunesForGroup`, `PRUNE_BUTTON_LABEL`, `dockerBuildCacheBytes` tests green).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/launcher/views/DockerView.constants.ts src/renderer/src/launcher/views/DockerView.constants.test.ts
git commit -m "refactor(app): drop Docker build-cache group; add delete-verb labels + size helper"
```

---

## Task 2: DockerView — danger prune buttons with trash icon

**Files:**
- Modify: `src/renderer/src/launcher/views/DockerView.tsx`

**Interfaces:**
- Consumes: `PRUNE_BUTTON_LABEL` (Task 1), `UIIcon.trash`.

- [ ] **Step 1: Swap the prune-button import**

In `DockerView.tsx`, the import from `./DockerView.constants` currently pulls `PRUNE_TARGET_LABEL`. `PRUNE_TARGET_LABEL` is no longer used in this file — replace it with `PRUNE_BUTTON_LABEL`. The import block becomes:

```ts
import {
  type DisplayGroup,
  dockerGroupActive,
  dockerItemDetail,
  groupDockerForDisplay,
  PRUNE_BUTTON_LABEL,
  projectRowExpanded,
  prunesForGroup,
} from './DockerView.constants'
```

- [ ] **Step 2: Drop `buildcache` from `GROUP_ICON`**

`GroupHeader`'s `group` type is now `Exclude<DisplayGroup, { kind: 'project' }>` = `repository | unaffiliated`. Update `GROUP_ICON` to match:

```ts
/** Generic header glyph for the non-project ("Other") groups. */
const GROUP_ICON: Record<'repository' | 'unaffiliated', IconRenderer> = {
  repository: UIIcon.box,
  unaffiliated: UIIcon.hdd,
}
```

Leave `KIND_ICON` unchanged (it is keyed by `DockerItemKind`, which still includes `buildcache`).

- [ ] **Step 3: Restyle the prune buttons as danger + trash icon**

Inside `GroupHeader`, replace the button JSX (the `targets.map(...)` button) with:

```tsx
          {targets.map((target) => {
            const busy = busyId === `prune:${target}`
            return (
              <button
                key={target}
                type="button"
                onClick={() => onPrune(target)}
                disabled={busy}
                title={`${PRUNE_BUTTON_LABEL[target]}. Permanent, not sent to the Trash.`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  border: '1px solid rgba(255,99,99,0.4)',
                  cursor: busy ? 'default' : 'pointer',
                  padding: '3px 9px',
                  borderRadius: 7,
                  background: 'rgba(255,99,99,0.10)',
                  color: busy ? 'var(--text-dim)' : 'rgba(255,99,99,0.95)',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {UIIcon.trash({ size: 11 })}
                {busy ? 'Deleting…' : PRUNE_BUTTON_LABEL[target]}
              </button>
            )
          })}
```

- [ ] **Step 4: Verify typecheck + build (no unit test for JSX)**

Run: `pnpm typecheck && pnpm test`
Expected: typecheck PASS (no `PRUNE_TARGET_LABEL`/`buildcache`-group type errors); all tests still green.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/launcher/views/DockerView.tsx
git commit -m "feat(app): Docker prune buttons read as deletes (verb + trash icon + danger)"
```

---

## Task 3: CacheRow — optional danger + action icon

**Files:**
- Modify: `src/renderer/src/components/CacheRow/CacheRow.types.ts`
- Modify: `src/renderer/src/components/CacheRow/CacheRow.tsx`

**Interfaces:**
- Produces: `CacheRowProps` gains optional `danger?: boolean` and `actionIcon?: IconRenderer`. When `danger`, the action button uses the destructive red styling; when `actionIcon` is set it renders before the label inside the button.
- Consumes: existing `IconRenderer` (already imported in the types file).

- [ ] **Step 1: Extend the props type**

In `CacheRow.types.ts`, add two properties inside `CacheRowProps` (after `busyLabel`):

```ts
  /** Optional leading glyph inside the action button (e.g. a trash icon for a delete action). */
  actionIcon?: IconRenderer
  /** Style the action button as destructive (red), matching the node_modules RowAction. */
  danger?: boolean
```

- [ ] **Step 2: Consume the new props in the component**

In `CacheRow.tsx`, add `actionIcon` and `danger = false` to the destructured props, then replace the action `<button>` (the `actionLabel && !disabled` branch) with:

```tsx
      {actionLabel && !disabled ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAction?.()
          }}
          disabled={busy}
          title={title ?? 'Remove packages no project references (pnpm store prune)'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            border: `1px solid ${danger ? 'rgba(255,99,99,0.4)' : 'var(--surface-4)'}`,
            cursor: busy ? 'default' : 'pointer',
            padding: '5px 11px',
            borderRadius: 8,
            background: danger ? 'rgba(255,99,99,0.10)' : 'var(--surface-1)',
            color: busy ? 'var(--text-dim)' : danger ? 'rgba(255,99,99,0.95)' : 'var(--text-2)',
            fontSize: 12,
            fontWeight: 600,
            flex: 'none',
          }}
        >
          {actionIcon?.({ size: 12 })}
          {busy ? (busyLabel ?? 'Pruning…') : actionLabel}
        </button>
      ) : disabled ? (
```

Leave the `disabled` ("soon") and `null` branches unchanged.

- [ ] **Step 3: Verify typecheck + build**

Run: `pnpm typecheck && pnpm test`
Expected: PASS. The pnpm store row (no `danger`, no `actionIcon`) renders identically to before — the new styling is opt-in.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/CacheRow/CacheRow.types.ts src/renderer/src/components/CacheRow/CacheRow.tsx
git commit -m "feat(app): CacheRow supports a danger action button with an optional icon"
```

---

## Task 4: CachesView — live-cache list

**Files:**
- Modify: `src/renderer/src/launcher/views/CachesView.constants.ts`
- Test: `src/renderer/src/launcher/views/CachesView.constants.test.ts`
- Modify: `src/renderer/src/launcher/views/CachesView.tsx`

**Interfaces:**
- Produces:
  - `LiveCache` interface (the data shape `LauncherApp` builds per live cache).
  - `visibleCaches(caches: LiveCache[], query: string): { cache: LiveCache; index: number }[]` — query-filters by name (case-insensitive substring) while preserving each cache's original index.
  - `CachesView` new props: `{ caches: LiveCache[]; selectedIndex: number; query: string; onSelectIndex: (i: number) => void }` (the old `store`/`pruning`/`onPrune` props are removed).
- Consumes: `CacheRow` (Task 3), `IconRenderer`, `UIIcon`.

- [ ] **Step 1: Write the failing helper tests**

In `CachesView.constants.test.ts`, add to the top import and append a new `describe`:

```ts
import { CACHE_PLACEHOLDERS, type LiveCache, visibleCaches } from './CachesView.constants'
import type { IconRenderer } from '@renderer/components/UIIcon'
```

```ts
describe('visibleCaches', () => {
  const stubIcon: IconRenderer = () => null
  const cache = (name: string): LiveCache => ({ id: name, icon: stubIcon, name, detail: '' })
  const caches = [cache('pnpm store'), cache('Docker build cache')]

  it('returns every cache with its original index when the query is empty', () => {
    expect(visibleCaches(caches, '')).toEqual([
      { cache: caches[0], index: 0 },
      { cache: caches[1], index: 1 },
    ])
  })

  it('filters by name case-insensitively, preserving the original index', () => {
    const r = visibleCaches(caches, 'DOCKER')
    expect(r).toHaveLength(1)
    expect(r[0]).toEqual({ cache: caches[1], index: 1 })
  })

  it('returns nothing when no cache matches', () => {
    expect(visibleCaches(caches, 'zzz')).toEqual([])
  })
})
```

(Keep the existing `CACHE_PLACEHOLDERS` import in that first line — the edit above replaces the whole import line, so `CACHE_PLACEHOLDERS` must stay in it.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test src/renderer/src/launcher/views/CachesView.constants.test.ts`
Expected: FAIL — `LiveCache` / `visibleCaches` not exported yet.

- [ ] **Step 3: Implement `LiveCache` + `visibleCaches`**

In `CachesView.constants.ts`, add the import and the two exports (keep `CachePlaceholder` / `CACHE_PLACEHOLDERS` as-is):

```ts
import type { IconRenderer } from '@renderer/components/UIIcon'
```

```ts
/** One live (present, actionable) cache shown at the top of the Caches tab, above the
 *  "coming soon" placeholders. `LauncherApp` builds these — the view stays presentational. */
export interface LiveCache {
  id: string
  icon: IconRenderer
  name: string
  /** Secondary line: store path, a status, or a short description. */
  detail: string
  size?: number
  disabled?: boolean
  busy?: boolean
  actionLabel?: string
  busyLabel?: string
  title?: string
  /** Render the action button as destructive (red) with a trash icon. */
  danger?: boolean
  onAction?: () => void
}

/** Query-filter live caches by name (case-insensitive substring), preserving each cache's
 *  original index so the keyboard-selected row stays correct while the list is filtered. */
export function visibleCaches(caches: LiveCache[], query: string): { cache: LiveCache; index: number }[] {
  const q = query.trim().toLowerCase()
  return caches
    .map((cache, index) => ({ cache, index }))
    .filter(({ cache }) => !q || cache.name.toLowerCase().includes(q))
}
```

- [ ] **Step 4: Run the helper tests to verify they pass**

Run: `pnpm test src/renderer/src/launcher/views/CachesView.constants.test.ts`
Expected: PASS.

- [ ] **Step 5: Rewrite `CachesView.tsx` to render the live-cache list**

Replace the entire contents of `CachesView.tsx` with:

```tsx
import { CacheRow } from '@renderer/components/CacheRow'
import { UIIcon } from '@renderer/components/UIIcon'
import type { ReactNode } from 'react'
import { CACHE_PLACEHOLDERS, type LiveCache, visibleCaches } from './CachesView.constants'

interface CachesViewProps {
  /** Live caches (pnpm store, Docker build cache, …) in keyboard order. */
  caches: LiveCache[]
  /** Index (into `caches`) of the keyboard-selected live cache. */
  selectedIndex: number
  /** Search text from the shared header input; filters cache rows by name. */
  query: string
  onSelectIndex: (i: number) => void
}

/** The launcher's "Caches" tab: live global caches (pnpm store, Docker build cache) above
 *  the not-yet-built placeholders (npm/yarn/bun). */
export function CachesView({ caches, selectedIndex, query, onSelectIndex }: CachesViewProps): ReactNode {
  const q = query.trim().toLowerCase()
  const rows = visibleCaches(caches, query)
  const placeholders = CACHE_PLACEHOLDERS.filter((c) => !q || c.name.toLowerCase().includes(q))

  return (
    <div className="cc-list">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map(({ cache, index }) => (
          <CacheRow
            key={cache.id}
            icon={cache.icon}
            name={cache.name}
            detail={cache.detail}
            size={cache.size}
            selected={selectedIndex === index && !cache.disabled}
            disabled={cache.disabled}
            busy={cache.busy}
            actionLabel={cache.actionLabel}
            actionIcon={cache.danger ? UIIcon.trash : undefined}
            danger={cache.danger}
            title={cache.title}
            busyLabel={cache.busyLabel}
            onSelect={() => onSelectIndex(index)}
            onAction={cache.onAction}
          />
        ))}
        {placeholders.map((c) => (
          <CacheRow key={c.id} icon={UIIcon.hdd} name={c.name} detail={c.detail} disabled />
        ))}
        {rows.length === 0 && placeholders.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            No caches match “{query}”.
          </div>
        )}
      </div>
    </div>
  )
}
```

Note: this file will not typecheck against `LauncherApp` until Task 5 updates the call site — that is expected and fixed in Task 5.

- [ ] **Step 6: Run the tests (helpers) to confirm green**

Run: `pnpm test src/renderer/src/launcher/views/CachesView.constants.test.ts`
Expected: PASS. (Full `pnpm typecheck` is deferred to Task 5, which updates the `CachesView` call site.)

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/launcher/views/CachesView.constants.ts src/renderer/src/launcher/views/CachesView.constants.test.ts src/renderer/src/launcher/views/CachesView.tsx
git commit -m "feat(app): Caches tab renders a live-cache list (pnpm + future caches)"
```

---

## Task 5: LauncherApp — wire the Docker build cache into the Caches tab

**Files:**
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`

**Interfaces:**
- Consumes: `dockerBuildCacheBytes` (Task 1), `LiveCache` (Task 4), the new `CachesView` props (Task 4), existing `requestDockerPrune`, `handlePrune`, `dockerAvailable`, `dockerEnabled`, `docker.busyId`, `store`, `pruning`.

- [ ] **Step 1: Add imports**

Ensure these imports exist in `LauncherApp.tsx`:
- From `../views/DockerView.constants`: add `dockerBuildCacheBytes` (alongside the existing `pruneEstimateBytes` / `PRUNE_TARGET_LABEL` imports).
- From `../views/CachesView.constants`: add `type LiveCache`.
- `UIIcon` is already imported.

- [ ] **Step 2: Build `buildCacheBytes` and `liveCaches` memos**

Add these near the other docker-derived memos (after `const dockerAvailable = !!docker.info?.available`, around line 174). `useMemo` is already imported.

```tsx
  const buildCacheBytes = useMemo(
    () => (dockerAvailable ? dockerBuildCacheBytes(docker.info?.items ?? []) : 0),
    [dockerAvailable, docker.info],
  )

  const liveCaches = useMemo<LiveCache[]>(() => {
    const list: LiveCache[] = [
      {
        id: 'pnpm',
        icon: UIIcon.hdd,
        name: 'pnpm store',
        detail: pruning
          ? 'Pruning unreferenced packages…'
          : store?.available
            ? (store?.displayPath ?? '')
            : (store?.reason ?? 'pnpm store not found'),
        size: store?.available ? store?.sizeBytes : undefined,
        disabled: !store?.available,
        busy: pruning,
        actionLabel: store?.canPrune ? 'Prune' : undefined,
        onAction: handlePrune,
      },
    ]
    if (dockerEnabled && dockerAvailable && buildCacheBytes > 0) {
      list.push({
        id: 'docker-buildcache',
        icon: UIIcon.hdd,
        name: 'Docker build cache',
        detail: 'Docker layer build cache',
        size: buildCacheBytes,
        busy: docker.busyId === 'prune:buildCache',
        actionLabel: 'Delete',
        busyLabel: 'Deleting…',
        danger: true,
        title: 'Delete all Docker build cache. Permanent, not sent to the Trash.',
        onAction: () => requestDockerPrune('buildCache'),
      })
    }
    return list
  }, [store, pruning, handlePrune, dockerEnabled, dockerAvailable, buildCacheBytes, docker.busyId, requestDockerPrune])
```

- [ ] **Step 3: Update the `CachesView` call site**

Replace the `<CachesView ... />` block (around lines 837-844) with:

```tsx
              ) : tab === 'caches' ? (
                <CachesView caches={liveCaches} selectedIndex={sel} query={query} onSelectIndex={setSel} />
```

- [ ] **Step 4: Extend the Docker auto-scan effect to the Caches tab**

In the auto-scan effect (currently around lines 139-145), change the tab guard so it also runs on the Caches tab. Replace:

```tsx
    if (view !== 'list' || tab !== 'docker' || !dockerEnabled || docker.loading) return
```

with:

```tsx
    if (view !== 'list' || (tab !== 'docker' && tab !== 'caches') || !dockerEnabled || docker.loading) return
```

Add `tab` is already a dep; no dep change needed (the effect already depends on `tab`). Leave the rest of the effect unchanged.

- [ ] **Step 5: Update the Caches keyboard nav**

Replace the `if (tab === 'caches') { … }` block (around lines 504-517) with:

```tsx
      if (tab === 'caches') {
        const cacheCount = liveCaches.length
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSel((s) => Math.min(cacheCount - 1, s + 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSel((s) => Math.max(0, s - 1))
        } else if (e.key === 'Enter') {
          e.preventDefault()
          const c = liveCaches[sel]
          if (c && !c.disabled && !c.busy) c.onAction?.()
        }
        return
      }
```

Then update the keyboard effect's dependency array (around lines 559-584): remove `store`, `pruning`, `handlePrune` (no longer referenced directly in the handler — they now live inside the `liveCaches` memo) and add `liveCaches`. `sel` is already present. The array's caches-related entries become just `liveCaches`.

- [ ] **Step 6: Verify the full suite**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all PASS. Typecheck confirms the new `CachesView` props line up; lint confirms no unused deps/imports (`store`/`pruning`/`handlePrune` may still be referenced elsewhere in the component — that is fine; only remove them from the keyboard effect's dep array, not their declarations).

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/launcher/LauncherApp/LauncherApp.tsx
git commit -m "feat(app): Docker build cache lives in the Caches tab (delete + auto-scan + keyboard nav)"
```

---

## Task 6: Full verification + STATUS.html

**Files:**
- Modify: `STATUS.html` (the `STATUS` data block only)

- [ ] **Step 1: Run the complete gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all green. Note the final test count.

- [ ] **Step 2: Manual smoke (needs a running app + Docker daemon)**

With `pnpm dev` and Docker running:
- Docker tab (⌘4): build cache no longer appears; the bulk-delete buttons on "Not linked to a project" headers read "Delete unused images" / "Delete dangling images" / "Delete stopped containers" / "Delete unused volumes", are red, and carry a trash icon; hovering an unused image/volume/container still reveals the red trash.
- Caches tab (⌘2): a "Docker build cache" row appears with its size and a red "Delete" button (trash icon). ↑/↓ moves between pnpm store and the build-cache row; Enter on the build-cache row opens the confirm; confirming prunes and shows the reclaimed toast. As a free user, Delete shows the paywall.
- Open the Caches tab cold (without visiting Docker first) and confirm the build-cache row populates via auto-scan.

(Restart `pnpm dev` fully — the main-process docker changes are not part of this change, but the auto-scan timing is renderer-side and hot-reloads.)

- [ ] **Step 3: Update the `STATUS` data block in `STATUS.html`**

- Bump `updated` to `2026-07-14`.
- Add a `done` roadmap item under the Docker milestones, e.g. "M1h — Docker build cache moved to the Caches tab + clearer (verb + trash + danger) deletion buttons".
- Append one `log` entry dated `2026-07-14` summarizing this session.
- Leave `userActions` as-is except: the existing Docker manual-test entries already cover the daemon pass; add a note there only if a new user-only obligation appeared (it did not — same daemon test surface).

- [ ] **Step 4: Commit**

```bash
git add STATUS.html
git commit -m "docs: STATUS — Docker build cache to Caches tab + clearer delete buttons"
```

---

## Self-Review

**Spec coverage:**
- Build cache dropped from Docker tab → Task 1 (`groupDockerForDisplay`).
- Aggregated "Docker build cache" row in Caches with Delete → Tasks 4 (view) + 5 (data/handler).
- Reuses existing confirm/gate/toast (`requestDockerPrune('buildCache')`) → Task 5.
- Auto-scan extended to Caches tab → Task 5 Step 4.
- Live-cache list + keyboard nav across pnpm + build cache → Tasks 4 + 5.
- Gauge accounting unchanged → no task needed (build-cache items stay in `docker.info.items`; `dockerTotal`/`dockerMaxBytes` untouched — noted in Architecture).
- Bulk-prune buttons: delete verb + trash + danger → Tasks 1 (labels) + 2 (styling).
- Docker build-cache Delete button: danger + trash → Task 3 (`CacheRow`) + 5 (data).
- Per-item hover trash unchanged (already danger) → no task, verified in Task 6 manual.
- Tests for constants/helpers → Tasks 1, 4.

**Placeholder scan:** none — every code step shows full code.

**Type consistency:** `LiveCache` (Task 4) is produced by Task 5 and consumed by Task 4's view; `visibleCaches` return shape `{ cache, index }[]` is consumed identically in `CachesView`; `PRUNE_BUTTON_LABEL` keyed by `DockerPruneTarget` matches its use in Task 2; `dockerBuildCacheBytes(items)` signature matches its Task 5 call. `CachesView` prop set changed in Task 4 and the call site updated in Task 5 (the interim non-compile between tasks is called out).
