# Cancel-a-Scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user cancel a running disk scan from either scanning surface; cancelling kills in-flight `du`, discards partial results, and reverts to the pre-scan state.

**Architecture:** `Scanner` gets an `AbortController` + `cancel()`; the signal threads through the walk, the sizing `mapLimit`, and down to `execFileAsync('du', …, { signal })`. `scan()` returns `{ cancelled, projects }`. `runScan` skips `projects.replaceAll` on cancel. A new `cancelScan` IPC calls `scanner.cancel()`. Both scanning views get a Cancel button + an `onCancel` prop, and ESC cancels while scanning.

**Tech Stack:** Electron (main/preload/renderer), TypeScript, React, Vitest, pnpm, Biome.

## Global Constraints

- Package manager: **pnpm**. Tests: `pnpm test`. Typecheck: `pnpm typecheck`. Lint/format: `pnpm exec biome check` (auto-fix with `--write`).
- One-responsibility files; match existing patterns.
- Never trust the renderer's IPC payload.
- No em dashes in user-facing copy.
- Conventional-commit subjects: `feat(scope): …`, `test: …`, `refactor: …`.

---

### Task 1: `folderSize` / `measureNodeModules` accept an AbortSignal

**Files:**
- Modify: `src/main/lib/folder-size.ts`
- Test: `src/main/lib/folder-size.test.ts` (create if absent; else append)

**Interfaces:**
- Produces: `folderSize(path: string, signal?: AbortSignal): Promise<number>`; `measureNodeModules(nmPath: string, signal?: AbortSignal): Promise<NodeModulesSize>`. An aborted signal makes the underlying `du` reject (child SIGTERM'd, or never spawned if already aborted).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { folderSize } from './folder-size'

describe('folderSize abort', () => {
  it('rejects when the signal is already aborted (du is not left running)', async () => {
    await expect(folderSize('/tmp', AbortSignal.abort())).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/lib/folder-size.test.ts`
Expected: FAIL (current `folderSize` ignores the second arg, spawns `du`, resolves).

- [ ] **Step 3: Thread the signal through**

In `folder-size.ts`, change `folderSize`:

```ts
/** Folder size in bytes via `du -sk` (fast, native). Aborts with the signal. */
export async function folderSize(path: string, signal?: AbortSignal): Promise<number> {
  const { stdout } = await execFileAsync('du', ['-sk', path], {
    maxBuffer: 1024 * 1024,
    signal,
  })
  return parseDuKb(stdout)
}
```

Change `measureNodeModules` to accept and forward the signal:

```ts
export async function measureNodeModules(nmPath: string, signal?: AbortSignal): Promise<NodeModulesSize> {
  const [apparent, shared] = await Promise.all([
    folderSize(nmPath, signal),
    pnpmStoreBackedSize(join(nmPath, '.pnpm'), signal),
  ])
  return { apparent, unique: Math.max(0, apparent - shared) }
}
```

And `pnpmStoreBackedSize`:

```ts
async function pnpmStoreBackedSize(pnpmDir: string, signal?: AbortSignal): Promise<number> {
  try {
    if (!(await stat(pnpmDir)).isDirectory()) return 0
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOENT' || code === 'ENOTDIR') return 0
    throw err
  }
  return folderSize(pnpmDir, signal)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/main/lib/folder-size.test.ts`
Expected: PASS. Then `pnpm test` (full) stays green — existing `folderSize`/`measureNodeModules` callers pass no signal, unchanged behavior.

- [ ] **Step 5: Commit**

```bash
git add src/main/lib/folder-size.ts src/main/lib/folder-size.test.ts
git commit -m "feat(scanner): folderSize/measureNodeModules accept an AbortSignal"
```

---

### Task 2: `Scanner` abort mechanism + `ScanOutcome`

**Files:**
- Modify: `src/main/scanner/scanner.ts`
- Test: `src/main/scanner/scanner.test.ts` (create)

**Interfaces:**
- Consumes: `measureNodeModules(nmPath, signal)` (Task 1).
- Produces: `interface ScanOutcome { cancelled: boolean; projects: Project[] }` (exported from scanner.ts); `Scanner.scan(roots, onProgress): Promise<ScanOutcome>`; `Scanner.cancel(): void`.

- [ ] **Step 1: Write the failing test**

```ts
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Scanner } from './scanner'

async function fixtureRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'scan-'))
  await mkdir(join(root, 'proj', 'node_modules'), { recursive: true })
  await writeFile(join(root, 'proj', 'package.json'), '{"name":"proj"}')
  return root
}

describe('Scanner cancel', () => {
  it('scans a fixture root and reports not-cancelled with the project', async () => {
    const out = await new Scanner().scan([await fixtureRoot()])
    expect(out.cancelled).toBe(false)
    expect(out.projects.map((p) => p.name)).toContain('proj')
  })

  it('cancel() aborts the in-flight scan and reports cancelled with no projects', async () => {
    const scanner = new Scanner()
    const p = scanner.scan([await fixtureRoot()])
    scanner.cancel()
    const out = await p
    expect(out.cancelled).toBe(true)
    expect(out.projects).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/scanner/scanner.test.ts`
Expected: FAIL (`scan` returns `Project[]`, not `{cancelled, projects}`; no `cancel`).

- [ ] **Step 3: Implement the abort mechanism**

In `scanner.ts`, add the type and rework the class. Add near the top (after imports):

```ts
export interface ScanOutcome {
  cancelled: boolean
  projects: Project[]
}
```

Replace the class body's field/methods:

```ts
export class Scanner {
  private current: Promise<ScanOutcome> | null = null
  private controller: AbortController | null = null

  get isScanning(): boolean {
    return this.current !== null
  }

  /** Aborts the in-flight scan (no-op when idle). */
  cancel(): void {
    this.controller?.abort()
  }

  /** Concurrent callers share the in-flight scan instead of starting a second. */
  scan(roots: string[], onProgress?: ProgressCallback): Promise<ScanOutcome> {
    if (this.current) return this.current
    this.controller = new AbortController()
    this.current = this.run(roots, this.controller.signal, onProgress)
    return this.current
  }

  private async run(roots: string[], signal: AbortSignal, onProgress?: ProgressCallback): Promise<ScanOutcome> {
    try {
      const found: string[] = []
      let checked = 0
      let lastEmit = 0
      const emit = (currentPath: string, done = false): void => {
        const now = Date.now()
        if (!done && now - lastEmit < PROGRESS_THROTTLE_MS) return
        lastEmit = now
        onProgress?.({ foldersChecked: checked, currentPath, done })
      }

      const walk = async (dir: string, depth: number): Promise<void> => {
        if (signal.aborted) return
        checked++
        emit(dir)
        const entries = await readdir(dir, { withFileTypes: true }).catch(() => null)
        if (!entries) return
        const subdirs: string[] = []
        for (const entry of entries) {
          if (!entry.isDirectory() || entry.isSymbolicLink()) continue
          if (entry.name === 'node_modules') {
            found.push(join(dir, entry.name))
            continue
          }
          if (entry.name.startsWith('.')) continue
          if (SKIPPED_DIR_NAMES.has(entry.name)) continue
          if (depth >= MAX_SCAN_DEPTH) continue
          subdirs.push(join(dir, entry.name))
        }
        for (const sub of subdirs) await walk(sub, depth + 1)
      }

      for (const root of roots) await walk(root, 0)
      if (signal.aborted) {
        emit('', true)
        return { cancelled: true, projects: [] }
      }

      const repoRootCache = new Map<string, string | null>()
      const projects = await mapLimit(found, SIZE_CONCURRENCY, (nm) => {
        if (signal.aborted) return Promise.resolve(null)
        emit(dirname(nm))
        return buildProject(nm, repoRootCache, signal)
      })
      if (signal.aborted) {
        emit('', true)
        return { cancelled: true, projects: [] }
      }
      emit('', true)
      return {
        cancelled: false,
        projects: projects.filter((p): p is Project => p !== null).sort((a, b) => a.lastUsed - b.lastUsed),
      }
    } finally {
      this.current = null
      this.controller = null
    }
  }
}
```

Update `buildProject` to accept + forward the signal:

```ts
async function buildProject(
  nodeModulesPath: string,
  repoRootCache: Map<string, string | null>,
  signal?: AbortSignal,
): Promise<Project | null> {
  const projectDir = dirname(nodeModulesPath)
  try {
    const [sizes, lastUsed, kind, iconDataUrl, name] = await Promise.all([
      measureNodeModules(nodeModulesPath, signal),
      lastUsedTime(projectDir),
      detectKind(projectDir),
      findProjectIcon(projectDir),
      resolveProjectName(projectDir, repoRootCache),
    ])
    // ...rest unchanged...
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/main/scanner/scanner.test.ts`
Expected: PASS (both cases).

- [ ] **Step 5: Typecheck (callers of `scan` now see `ScanOutcome`)**

Run: `pnpm typecheck`
Expected: FAIL in `src/main/index.ts` (`runScan` still treats the result as `Project[]`). That is fixed in Task 3 — leave it for now, but confirm the failure is only there.

- [ ] **Step 6: Commit**

```bash
git add src/main/scanner/scanner.ts src/main/scanner/scanner.test.ts
git commit -m "feat(scanner): AbortController + cancel(); scan returns ScanOutcome"
```

---

### Task 3: Wire `cancelScan` IPC + `runScan` clean-revert

**Files:**
- Modify: `src/main/index.ts` (`runScan`, ctx wiring)
- Modify: `src/main/app-context.types.ts`
- Modify: `src/main/ipc/register-ipc.ts`
- Modify: `src/main/ipc/register-ipc.test.ts`
- Modify: `src/shared/ipc.constants.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/preload/api.types.ts`

**Interfaces:**
- Consumes: `Scanner.scan` → `ScanOutcome`, `Scanner.cancel()` (Task 2).
- Produces: `AppContext.runScan(): Promise<{ cancelled: boolean }>`, `AppContext.cancelScan(): void`; IPC `scan` resolves `{ cancelled: boolean }`; IPC `cancelScan`; renderer `window.clean.scan(): Promise<{ cancelled: boolean }>` and `window.clean.cancelScan(): Promise<void>`.

- [ ] **Step 1: `runScan` honors the outcome** — in `index.ts`, replace the scan call + result handling inside `runScan`:

```ts
  const runScan = async (): Promise<{ cancelled: boolean }> => {
    if (scanner.isScanning) return { cancelled: false }
    const startedAt = Date.now()
    try {
      const roots = resolveScanRoots(settings.get().scanRoots, { home: homedir() })
      const { cancelled, projects: found } = await scanner.scan(roots, (p) => broadcast(IPC.onScanProgress, p))
      if (cancelled) {
        analytics.capture('scan_cancelled')
        return { cancelled: true }
      }
      projects.replaceAll(found)
      analytics.capture('scan_completed', {
        total_gb: Math.round((found.reduce((a, p) => a + (p.uniqueSize ?? p.size), 0) / GB) * 10) / 10,
        projects_count: found.length,
        duration_s: Math.round((Date.now() - startedAt) / 1000),
      })
      return { cancelled: false }
    } catch (err) {
      console.error('Scan failed', err)
      return { cancelled: false }
    }
  }
```

- [ ] **Step 2: Wire `cancelScan` into the ctx** — in `index.ts`, update the `registerIpc(...)` call:

```ts
  registerIpc({ projects, packages, settings, license, analytics, panel, launcher, runScan, cancelScan: () => scanner.cancel() })
```

- [ ] **Step 3: Extend `AppContext`** — in `app-context.types.ts`:

```ts
  runScan: () => Promise<{ cancelled: boolean }>
  cancelScan: () => void
```

- [ ] **Step 4: Add the IPC channel** — in `ipc.constants.ts`, in the invoke block:

```ts
  cancelScan: 'projects:cancel-scan',
```

- [ ] **Step 5: Register the handler** — in `register-ipc.ts`, the `scan` handler already returns `ctx.runScan()` (now `{cancelled}`); add next to it:

```ts
  ipcMain.handle(IPC.cancelScan, () => ctx.cancelScan())
```

- [ ] **Step 6: Preload + api types** — in `preload/index.ts` add `cancelScan: () => ipcRenderer.invoke(IPC.cancelScan),` (near `scan`). In `api.types.ts` change `scan()` and add `cancelScan()`:

```ts
  scan(): Promise<{ cancelled: boolean }>
  /** Aborts the in-flight scan; the pending scan() resolves { cancelled: true }. */
  cancelScan(): Promise<void>
```

- [ ] **Step 7: Update the register-ipc test** — `register-ipc.test.ts` builds a mock ctx. Add `cancelScan: vi.fn()` to the ctx object, and change any `runScan: vi.fn()` to `runScan: vi.fn(async () => ({ cancelled: false }))`. Add a test:

```ts
  it('cancelScan handler calls ctx.cancelScan', async () => {
    const { ctx } = makeCtx(true)
    await invoke(IPC.cancelScan)
    expect(ctx.cancelScan).toHaveBeenCalledOnce()
  })
```

(Match the file's existing mock/invoke helpers — read them first; `makeCtx`/`invoke` already exist there.)

- [ ] **Step 8: Typecheck + full tests**

Run: `pnpm typecheck && pnpm test`
Expected: PASS (the Task 2 typecheck error is resolved; all tests green).

- [ ] **Step 9: Commit**

```bash
git add src/main/index.ts src/main/app-context.types.ts src/main/ipc/register-ipc.ts src/main/ipc/register-ipc.test.ts src/shared/ipc.constants.ts src/preload/index.ts src/preload/api.types.ts
git commit -m "feat(scan): cancelScan IPC + runScan clean-revert on cancel"
```

---

### Task 4: Cancel in the full-window `ScanningView`

**Files:**
- Modify: `src/renderer/src/launcher/views/ScanningView.tsx`
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`

**Interfaces:**
- Consumes: `window.clean.scan()` → `{ cancelled }`, `window.clean.cancelScan()`.
- Produces: `ScanningView` gains `onCancel: () => void`.

- [ ] **Step 1: Add `onCancel` + route on the result + Cancel button** — in `ScanningView.tsx`:

Change the props interface to add `onCancel: () => void`. Change the start effect:

```ts
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void window.clean.scan().then((res) => {
      if (res.cancelled) onCancel()
      else setTimeout(onDone, 380)
    })
  }, [onDone, onCancel])
```

Add a Cancel button at the end of the view's JSX (after the current-path line), matching the app's `cc-btn ghost` style used elsewhere:

```tsx
      <button
        className="cc-btn ghost"
        disabled={cancelling}
        style={{ marginTop: 4, opacity: cancelling ? 0.6 : 1 }}
        onClick={() => {
          setCancelling(true)
          void window.clean.cancelScan()
        }}
      >
        {cancelling ? 'Cancelling…' : 'Cancel'}
      </button>
```

- [ ] **Step 2: Pass `onCancel` + ESC-cancel in `LauncherApp`** — update the `ScanningView` usage (around line 528):

```tsx
            <ScanningView
              accent={accent}
              onDone={() => setView(totalUsed > 0 ? 'result' : 'list')}
              onCancel={() => setView('list')}
            />
```

In the ESC handler (the `if (e.key === 'Escape') { … }` block), add a scanning branch BEFORE the generic `if (view !== 'list')`:

```ts
        if (view === 'scanning') {
          void window.clean.cancelScan()
          return
        }
```

(The actual view change still flows through `ScanningView`'s `scan().then(onCancel)`.)

- [ ] **Step 3: Typecheck + build + lint**

Run: `pnpm typecheck && pnpm exec biome check src/renderer/src/launcher && pnpm build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/launcher/views/ScanningView.tsx src/renderer/src/launcher/LauncherApp/LauncherApp.tsx
git commit -m "feat(scan): Cancel button + ESC in the full-window scanning view"
```

---

### Task 5: Cancel in the panel `ScanPanel`

**Files:**
- Modify: `src/renderer/src/panel/PanelApp/ScanPanel.tsx`
- Modify: `src/renderer/src/panel/PanelApp/PanelApp.tsx`

**Interfaces:**
- Consumes: `window.clean.scan()` → `{ cancelled }`, `window.clean.cancelScan()`.
- Produces: `ScanPanel` gains `onCancel: () => void`.

- [ ] **Step 1: Add `onCancel` + route + Cancel button** — in `ScanPanel.tsx`:

Add `onCancel: () => void` to props. Change the start effect:

```ts
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void window.clean.scan().then((res) => {
      if (res.cancelled) onCancel()
      else setTimeout(onDone, 350)
    })
  }, [onDone, onCancel])
```

Add a Cancel button after the progress bar JSX:

```tsx
      <button
        className="cc-btn ghost"
        disabled={cancelling}
        style={{ marginTop: 2, opacity: cancelling ? 0.6 : 1 }}
        onClick={() => {
          setCancelling(true)
          void window.clean.cancelScan()
        }}
      >
        {cancelling ? 'Cancelling…' : 'Cancel'}
      </button>
```

- [ ] **Step 2: Pass `onCancel` + ESC-cancel in `PanelApp`** — update the `ScanPanel` usage (around line 160):

```tsx
      {view === 'scan' && <ScanPanel accent={accent} onDone={() => setView('main')} onCancel={() => setView('main')} />}
```

In the ESC branch of the keyboard handler, cancel when scanning:

```ts
      } else if (e.key === 'Escape') {
        if (unlock) setUnlock(null)
        else if (view === 'scan') void window.clean.cancelScan()
        else if (view !== 'main') setView('main')
        else void window.clean.closeWindow()
      }
```

- [ ] **Step 3: Typecheck + build + lint**

Run: `pnpm typecheck && pnpm exec biome check src/renderer/src/panel && pnpm build`
Expected: PASS.

- [ ] **Step 4: Manual verification** (drive via `/run` or `/verify`):

`pnpm dev:clean`. In the full window trigger a scan (⌘R) and hit Cancel (and separately ESC) mid-scan: the scan stops fast, no partial results replace the list, and the view returns to the list. Repeat in the menu-bar panel (Scan now → Cancel / ESC → back to main). Confirm a normal (uncancelled) scan still completes and shows results.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/panel/PanelApp/ScanPanel.tsx src/renderer/src/panel/PanelApp/PanelApp.tsx
git commit -m "feat(scan): Cancel button + ESC in the panel scanning view"
```

---

## Self-Review

- **Spec coverage:** abort mechanism + du signal (T1, T2) ✓; ScanOutcome contract (T2) ✓; clean-revert / no replaceAll on cancel + scan_cancelled (T3) ✓; cancelScan IPC + scan return-type change (T3) ✓; Cancel button + onCancel + ESC on both surfaces (T4, T5) ✓; final `done:true` emit so the scanning flag clears (T2) ✓.
- **Placeholders:** cores (folder-size, scanner, runScan/ipc) have complete code + tests; UI tasks give exact JSX and the precise ESC-branch edits.
- **Type consistency:** `ScanOutcome { cancelled, projects }`, `scan(): Promise<{ cancelled }>`, `cancelScan()`, `runScan(): Promise<{ cancelled }>`, `folderSize(path, signal?)`, `measureNodeModules(nmPath, signal?)`, `onCancel` all referenced consistently across tasks.
