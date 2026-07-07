# External Drives / Scan Locations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users include external drives and arbitrary folders in the node_modules scan.

**Architecture:** Store opted-in extra roots as absolute paths in `Settings.scanRoots`. `runScan` resolves the effective roots each scan (`[home, ...scanRoots]`, filtered to currently-existing paths, deduped, nesting dropped) via a pure `resolveScanRoots`, and passes them to `Scanner`. A settings UI lists auto-detected external volumes plus an "Add folder…" picker. A delete-time guard refuses trashing a path that is no longer mounted.

**Tech Stack:** Electron (main/preload/renderer), TypeScript, React, Vitest, pnpm, Biome.

## Global Constraints

- Package manager: **pnpm**. Run tests with `pnpm test`, typecheck with `pnpm typecheck`.
- One folder per component: `index.ts`, `Component.tsx`, `Component.types.ts`, optional `.constants.ts` + tests.
- Each file has a single responsibility; prefer small focused files.
- Never trust the renderer's IPC payload — validate in main before persisting.
- Conventional-commit subjects: `feat(scope): …`, `test: …`, `refactor: …`.
- No em dashes in any user-facing copy.

---

### Task 1: Settings model + validation for `scanRoots`

**Files:**
- Modify: `src/shared/settings.types.ts`
- Modify: `src/shared/settings.constants.ts:3-13`
- Modify: `src/main/settings/validate-setting.ts`
- Test: `src/main/settings/validate-setting.test.ts`

**Interfaces:**
- Produces: `Settings.scanRoots: string[]`; `coerceSetting('scanRoots', unknown)` returns `{ key: 'scanRoots', value: string[] }` for arrays of absolute path strings, else `null`.

- [ ] **Step 1: Write the failing test** — append to `validate-setting.test.ts`:

```ts
import { isAbsolute } from 'node:path'

describe('scanRoots', () => {
  it('accepts an array of absolute paths', () => {
    expect(coerceSetting('scanRoots', ['/Volumes/SSD', '/data/projects'])).toEqual({
      key: 'scanRoots',
      value: ['/Volumes/SSD', '/data/projects'],
    })
  })
  it('accepts an empty array', () => {
    expect(coerceSetting('scanRoots', [])).toEqual({ key: 'scanRoots', value: [] })
  })
  it('rejects a non-array', () => {
    expect(coerceSetting('scanRoots', '/Volumes/SSD')).toBeNull()
  })
  it('rejects relative paths', () => {
    expect(coerceSetting('scanRoots', ['relative/path'])).toBeNull()
  })
  it('rejects non-string members', () => {
    expect(coerceSetting('scanRoots', ['/ok', 42])).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/settings/validate-setting.test.ts`
Expected: FAIL (scanRoots returns null for the valid cases).

- [ ] **Step 3: Add the field and default**

In `src/shared/settings.types.ts` add to the `Settings` interface:

```ts
  /** Extra scan roots opted in by the user (absolute paths): toggled external
   *  volumes and arbitrary "Add folder…" paths. Home is implicit, never stored. */
  scanRoots: string[]
```

In `src/shared/settings.constants.ts` add `scanRoots: []` to `DEFAULT_SETTINGS`.

- [ ] **Step 4: Add the validator case**

In `validate-setting.ts`, add `import { isAbsolute } from 'node:path'` at top, and before `default:`:

```ts
    case 'scanRoots':
      return Array.isArray(value) && value.every((v) => typeof v === 'string' && isAbsolute(v))
        ? { key, value: value as string[] }
        : null
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/main/settings/validate-setting.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/shared/settings.types.ts src/shared/settings.constants.ts src/main/settings/validate-setting.ts src/main/settings/validate-setting.test.ts
git commit -m "feat(settings): add scanRoots setting with validation"
```

---

### Task 2: `resolveScanRoots` pure helper

**Files:**
- Create: `src/main/scanner/resolve-scan-roots.ts`
- Test: `src/main/scanner/resolve-scan-roots.test.ts`

**Interfaces:**
- Produces: `resolveScanRoots(scanRoots: string[], opts?: { home?: string; exists?: (p: string) => boolean }): string[]`. Returns `[home, ...scanRoots]` filtered to existing paths, deduped, with any root nested inside another kept root removed. `home` defaults to `os.homedir()`, `exists` defaults to `fs.existsSync`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { resolveScanRoots } from './resolve-scan-roots'

const opts = (present: string[]) => ({ home: '/Users/me', exists: (p: string) => present.includes(p) })

describe('resolveScanRoots', () => {
  it('always includes home first', () => {
    expect(resolveScanRoots([], opts(['/Users/me']))).toEqual(['/Users/me'])
  })
  it('adds mounted extra roots and drops unmounted ones', () => {
    const out = resolveScanRoots(['/Volumes/SSD', '/Volumes/Gone'], opts(['/Users/me', '/Volumes/SSD']))
    expect(out).toEqual(['/Users/me', '/Volumes/SSD'])
  })
  it('dedupes identical paths', () => {
    const out = resolveScanRoots(['/Volumes/SSD', '/Volumes/SSD'], opts(['/Users/me', '/Volumes/SSD']))
    expect(out).toEqual(['/Users/me', '/Volumes/SSD'])
  })
  it('drops a root nested inside another kept root', () => {
    const out = resolveScanRoots(['/Users/me/projects'], opts(['/Users/me', '/Users/me/projects']))
    expect(out).toEqual(['/Users/me'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/scanner/resolve-scan-roots.test.ts`
Expected: FAIL ("resolve-scan-roots" not found).

- [ ] **Step 3: Implement**

```ts
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { sep } from 'node:path'

interface Options {
  home?: string
  exists?: (p: string) => boolean
}

/** Effective scan roots for a run: home plus user extras, keeping only paths
 *  that currently exist, deduped, with any root nested inside another removed. */
export function resolveScanRoots(scanRoots: string[], opts: Options = {}): string[] {
  const home = opts.home ?? homedir()
  const exists = opts.exists ?? existsSync
  const present = [home, ...scanRoots].filter((p, i, a) => a.indexOf(p) === i).filter(exists)
  return present.filter(
    (p) => !present.some((other) => other !== p && p.startsWith(other.endsWith(sep) ? other : other + sep)),
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/main/scanner/resolve-scan-roots.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/scanner/resolve-scan-roots.ts src/main/scanner/resolve-scan-roots.test.ts
git commit -m "feat(scanner): resolveScanRoots helper for effective roots"
```

---

### Task 3: Scanner takes roots per-scan; `runScan` wires them

**Files:**
- Modify: `src/main/scanner/scanner.ts:20,27-31,33,66`
- Modify: `src/main/index.ts:28,44-58`

**Interfaces:**
- Consumes: `resolveScanRoots` (Task 2), `Settings.scanRoots` (Task 1).
- Produces: `Scanner.scan(roots: string[], onProgress?: ProgressCallback): Promise<Project[]>`.

- [ ] **Step 1: Change the Scanner signature to accept roots per scan**

In `scanner.ts`: remove the constructor `roots` param (delete `constructor(private roots ...)`). Change `scan` and `run`:

```ts
  scan(roots: string[], onProgress?: ProgressCallback): Promise<Project[]> {
    if (this.current) return this.current
    this.current = this.run(roots, onProgress)
    return this.current
  }

  private async run(roots: string[], onProgress?: ProgressCallback): Promise<Project[]> {
```

And change the walk loop (was `for (const root of this.roots)`):

```ts
      for (const root of roots) await walk(root, 0)
```

Remove the now-unused `homedir` import from scanner.ts if nothing else uses it.

- [ ] **Step 2: Wire roots in `runScan`**

In `src/main/index.ts`: add imports `import { homedir } from 'node:os'` and `import { resolveScanRoots } from './scanner/resolve-scan-roots'`. `new Scanner()` stays as-is (no constructor args now). In `runScan`, change the scan call:

```ts
      const roots = resolveScanRoots(settings.get().scanRoots, { home: homedir() })
      const result = await scanner.scan(roots, (progress) => broadcast(IPC.onScanProgress, progress))
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS (no callers pass old constructor arg; scan now requires roots).

- [ ] **Step 4: Run the scanner-adjacent tests**

Run: `pnpm test`
Expected: PASS. Fix any test constructing `new Scanner([...])` or calling `scan(cb)` to the new `scan(roots, cb)` shape.

- [ ] **Step 5: Commit**

```bash
git add src/main/scanner/scanner.ts src/main/index.ts
git commit -m "refactor(scanner): resolve roots per scan from settings"
```

---

### Task 4: `listExternalVolumes`

**Files:**
- Create: `src/main/volumes/list-external-volumes.ts`
- Test: `src/main/volumes/list-external-volumes.test.ts`

**Interfaces:**
- Produces: `listExternalVolumes(opts?: { volumesDir?: string; readdir?: ...; statDev?: (p: string) => number | null }): Promise<{ path: string; name: string }[]>`. Lists real mounted external volumes under `/Volumes`, excluding the boot disk (same `st_dev` as `/`) and symlinks/unreadable entries.

- [ ] **Step 1: Write the failing test** (inject fs so it is pure/deterministic):

```ts
import { describe, expect, it } from 'vitest'
import { listExternalVolumes } from './list-external-volumes'

// dev map: '/' is boot (dev 1); SSD is separate (dev 2); GhostLink unreadable.
const deps = {
  volumesDir: '/Volumes',
  readdir: async () => ['Macintosh HD', 'SSD-T7', 'GhostLink'],
  statDev: (p: string) => {
    const map: Record<string, number | null> = {
      '/': 1,
      '/Volumes/Macintosh HD': 1,
      '/Volumes/SSD-T7': 2,
      '/Volumes/GhostLink': null, // unreadable/broken
    }
    return p in map ? map[p] : null
  },
}

describe('listExternalVolumes', () => {
  it('returns only separate-device volumes, excluding the boot disk', async () => {
    expect(await listExternalVolumes(deps)).toEqual([{ path: '/Volumes/SSD-T7', name: 'SSD-T7' }])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/volumes/list-external-volumes.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
import { readdir as fsReaddir, statSync } from 'node:fs'
import { readdir as readdirP } from 'node:fs/promises'
import { join } from 'node:path'

interface Deps {
  volumesDir?: string
  readdir?: (dir: string) => Promise<string[]>
  statDev?: (p: string) => number | null
}

const defaultStatDev = (p: string): number | null => {
  try {
    return statSync(p).dev
  } catch {
    return null
  }
}

/** Mounted external volumes under /Volumes, excluding the boot disk. */
export async function listExternalVolumes(deps: Deps = {}): Promise<{ path: string; name: string }[]> {
  const volumesDir = deps.volumesDir ?? '/Volumes'
  const readdir = deps.readdir ?? ((dir: string) => readdirP(dir))
  const statDev = deps.statDev ?? defaultStatDev
  const rootDev = statDev('/')
  const names = await readdir(volumesDir).catch(() => [] as string[])
  const out: { path: string; name: string }[] = []
  for (const name of names) {
    const path = join(volumesDir, name)
    const dev = statDev(path)
    if (dev === null || dev === rootDev) continue
    out.push({ path, name })
  }
  return out
}
```

(The unused `fsReaddir` import is illustrative; keep only `readdir as readdirP` and `statSync`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/main/volumes/list-external-volumes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/volumes/list-external-volumes.ts src/main/volumes/list-external-volumes.test.ts
git commit -m "feat(volumes): detect mounted external volumes"
```

---

### Task 5: `listVolumes` IPC + preload/api wiring

**Files:**
- Modify: `src/shared/ipc.constants.ts:23`
- Modify: `src/main/ipc/register-ipc.ts` (add handler; import `listExternalVolumes`)
- Modify: `src/preload/index.ts:35`
- Modify: `src/preload/api.types.ts`
- Create: `src/shared/volume.types.ts`

**Interfaces:**
- Consumes: `listExternalVolumes` (Task 4), `Settings.scanRoots` (Task 1).
- Produces: renderer `window.clean.listVolumes(): Promise<VolumeOption[]>` where `VolumeOption = { path: string; name: string; included: boolean }`.

- [ ] **Step 1: Add the shared type** — `src/shared/volume.types.ts`:

```ts
/** A mounted external volume offered as a scan-location toggle. */
export interface VolumeOption {
  path: string
  name: string
  /** True when this volume's path is already in Settings.scanRoots. */
  included: boolean
}
```

- [ ] **Step 2: Add the IPC channel** — in `ipc.constants.ts`, in the invoke block:

```ts
  listVolumes: 'volumes:list',
```

- [ ] **Step 3: Register the handler** — in `register-ipc.ts`, add near the other settings handlers:

```ts
  ipcMain.handle(IPC.listVolumes, async () => {
    const roots = new Set(ctx.settings.get().scanRoots)
    const vols = await listExternalVolumes()
    return vols.map((v) => ({ ...v, included: roots.has(v.path) }))
  })
```

Add `import { listExternalVolumes } from '../volumes/list-external-volumes'` at the top.

- [ ] **Step 4: Expose in preload + api types** — in `preload/index.ts` add to `api`:

```ts
  listVolumes: () => ipcRenderer.invoke(IPC.listVolumes),
```

In `api.types.ts` import `VolumeOption` and add to `CleanApi`:

```ts
  /** Mounted external volumes offered as scan-location toggles. */
  listVolumes(): Promise<VolumeOption[]>
```

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/shared/volume.types.ts src/shared/ipc.constants.ts src/main/ipc/register-ipc.ts src/preload/index.ts src/preload/api.types.ts
git commit -m "feat(ipc): listVolumes channel for scan-location UI"
```

---

### Task 6: Delete unmount guard + `{ freed, blocked }` return shape

**Files:**
- Create: `src/shared/delete.types.ts`
- Modify: `src/main/ipc/register-ipc.ts:75-83` (deleteNodeModules handler)
- Modify: `src/preload/api.types.ts:20` (deleteNodeModules return type)
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx:190-197`
- Modify: `src/renderer/src/panel/PanelApp/PanelApp.tsx:80-86`
- Test: `src/main/ipc/delete-result.test.ts` (guard unit via extracted helper)

**Interfaces:**
- Produces: `DeleteResult = { freed: number; blocked?: 'unmounted' | 'live' }`. `deleteNodeModules` IPC now resolves `DeleteResult`. (`'live'` reserved for the liveness feature; only `'unmounted'` is produced here.)

- [ ] **Step 1: Add the shared type** — `src/shared/delete.types.ts`:

```ts
/** Result of a node_modules delete request. `blocked` is set when the delete
 *  was refused: 'unmounted' (path gone since scan) or 'live' (app running). */
export interface DeleteResult {
  freed: number
  blocked?: 'unmounted' | 'live'
}
```

- [ ] **Step 2: Write the failing test** for a small guard helper — `src/main/ipc/delete-result.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { guardExists } from '../actions/project-actions'

describe('guardExists', () => {
  it('returns unmounted when node_modules is gone', () => {
    expect(guardExists('/gone/node_modules', () => false)).toEqual({ freed: 0, blocked: 'unmounted' })
  })
  it('returns null when present (proceed)', () => {
    expect(guardExists('/here/node_modules', () => true)).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test src/main/ipc/delete-result.test.ts`
Expected: FAIL (`guardExists` not exported).

- [ ] **Step 4: Add `guardExists` to `project-actions.ts`**:

```ts
import { existsSync } from 'node:fs'
import type { DeleteResult } from '@shared/delete.types'

/** Pre-delete guard: unmounted result if the node_modules path is gone, else null. */
export function guardExists(nodeModulesPath: string, exists: (p: string) => boolean = existsSync): DeleteResult | null {
  return exists(nodeModulesPath) ? null : { freed: 0, blocked: 'unmounted' }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test src/main/ipc/delete-result.test.ts`
Expected: PASS.

- [ ] **Step 6: Rewrite the delete handler** in `register-ipc.ts` to return `DeleteResult`:

```ts
  ipcMain.handle(IPC.deleteNodeModules, async (_e, id: string): Promise<DeleteResult> => {
    if (!ctx.license.get().pro) return { freed: 0 }
    const project = ctx.projects.all.find((p) => p.id === id)
    if (!project) return { freed: 0 }
    const guard = guardExists(join(project.absPath, 'node_modules'))
    if (guard) {
      ctx.projects.remove(id)
      return guard
    }
    const freed = await deleteNodeModules(project)
    ctx.projects.remove(id)
    ctx.analytics.capture('clean_performed', { kind: 'delete', freed_gb: Math.round((freed / GB) * 10) / 10 })
    return { freed }
  })
```

Add imports: `import { join } from 'node:path'`, `import type { DeleteResult } from '@shared/delete.types'`, and `guardExists` to the existing `project-actions` import.

- [ ] **Step 7: Update the api type** — in `api.types.ts` import `DeleteResult` and change:

```ts
  deleteNodeModules(id: string): Promise<DeleteResult>
```

- [ ] **Step 8: Update renderer callers.**

`LauncherApp.tsx` currently: `void window.clean.deleteNodeModules(p.id).then((freed) => { ... })`. Change to destructure and handle `blocked`:

```ts
      void window.clean.deleteNodeModules(p.id).then(({ freed, blocked }) => {
        if (blocked) return // row already gone / not deletable; keep silent for now
        // ...existing freed handling unchanged, using `freed`...
      })
```

`PanelApp.tsx` `removeMany` loop currently: `freed += await window.clean.deleteNodeModules(id)`. Change to:

```ts
        const res = await window.clean.deleteNodeModules(id)
        freed += res.freed
```

- [ ] **Step 9: Typecheck + tests**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/shared/delete.types.ts src/main/actions/project-actions.ts src/main/ipc/register-ipc.ts src/main/ipc/delete-result.test.ts src/preload/api.types.ts src/renderer/src/launcher/LauncherApp/LauncherApp.tsx src/renderer/src/panel/PanelApp/PanelApp.tsx
git commit -m "feat(delete): DeleteResult shape + unmounted guard"
```

---

### Task 7: `ScanLocationsSettings` component + SettingsView integration

**Files:**
- Create: `src/renderer/src/components/ScanLocationsSettings/index.ts`
- Create: `src/renderer/src/components/ScanLocationsSettings/ScanLocationsSettings.tsx`
- Create: `src/renderer/src/components/ScanLocationsSettings/ScanLocationsSettings.types.ts`
- Modify: `src/renderer/src/launcher/views/SettingsView.tsx`

**Interfaces:**
- Consumes: `window.clean.listVolumes()` (Task 5), `Settings.scanRoots` (Task 1), `window.clean.pickPath('folder')` (existing).
- Produces: `<ScanLocationsSettings settings accent setSetting />` where `setSetting` is the existing `SetSetting`.

- [ ] **Step 1: Read the existing settings-section pattern.**

Read `src/renderer/src/components/PnpmStoreSettings/PnpmStoreSettings.tsx` and `SettingsView.tsx` to match section heading, spacing, toggle, and color-token conventions (`var(--text-*)`, `accent`). Match that visual language exactly rather than inventing new styles.

- [ ] **Step 2: Define props** — `ScanLocationsSettings.types.ts`:

```ts
import type { SetSetting } from '@renderer/hooks/useSettings'
import type { Settings } from '@shared/settings.types'

export interface ScanLocationsSettingsProps {
  settings: Settings
  accent: string
  setSetting: SetSetting
}
```

- [ ] **Step 3: Implement the component** — `ScanLocationsSettings.tsx`. Behavior (match existing styles from Step 1):
  - On mount and after every `scanRoots` change, call `window.clean.listVolumes()` into state `volumes: VolumeOption[]`.
  - Render a disabled always-checked "Home (~)" row.
  - Render each volume with a checkbox bound to `v.included`. Toggle ON: `setSetting('scanRoots', [...settings.scanRoots, v.path])`. Toggle OFF: `setSetting('scanRoots', settings.scanRoots.filter((p) => p !== v.path))`.
  - Derive addedFolders = `settings.scanRoots.filter((p) => !volumes.some((v) => v.path === p))`. Render each with a remove ✕ that filters it out of `scanRoots`.
  - "Add folder…" button: `const picked = await window.clean.pickPath('folder'); if (picked && !settings.scanRoots.includes(picked)) setSetting('scanRoots', [...settings.scanRoots, picked])`.
  - Copy contains no em dashes.

`index.ts`:

```ts
export { ScanLocationsSettings } from './ScanLocationsSettings'
```

- [ ] **Step 4: Render it in SettingsView** — import and place `<ScanLocationsSettings settings={settings} accent={accent} setSetting={setSetting} />` in the appropriate settings section (near the scan-interval control), passing the props SettingsView already has.

- [ ] **Step 5: Typecheck + build**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Manual verification** (the `/run` or `/verify` skill drives the real app):

Launch the app, open Settings, confirm: detected external volumes appear as toggles; toggling one persists (reopen Settings shows it checked); "Add folder…" adds a path with a working remove; a subsequent scan walks the added root. If no external drive is attached, verify "Add folder…" against a normal directory.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/components/ScanLocationsSettings src/renderer/src/launcher/views/SettingsView.tsx
git commit -m "feat(settings): scan locations UI for external drives and folders"
```

---

## Self-Review

- **Spec coverage:** scanRoots model+validation (T1) ✓; roots resolution incl. skip-unmounted/dedupe/nesting (T2, T3) ✓; volume detection (T4); listVolumes IPC (T5); delete unmount guard + return shape (T6); UI incl. Home-always, volume toggles, Add folder, remove (T7). All spec sections mapped.
- **Placeholders:** cores have complete code + tests; T7 UI specifies exact behavior/handlers and points to the concrete existing pattern file rather than leaving copy vague.
- **Type consistency:** `DeleteResult`, `VolumeOption`, `Scanner.scan(roots, cb)`, `resolveScanRoots(scanRoots, opts)` referenced consistently across tasks.
