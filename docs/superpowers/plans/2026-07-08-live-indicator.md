# Live/Running Indicator + Delete Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a green dot on projects whose app is currently running, and hard-block deleting a running app's node_modules.

**Architecture:** A main-side `liveness` module runs one `lsof -a -d cwd` call, parses it (pure), and matches process working directories against project dirs (pure). `getLiveProjects` IPC returns a `Record<projectId, LiveInfo>`; a renderer `useLiveProjects` hook polls every 45s while a window is open. Rows show a `LiveDot` and disable delete when live; the delete IPC re-checks liveness at the instant of delete and refuses with `blocked: 'live'`.

**Tech Stack:** Electron (main/preload/renderer), TypeScript, React, Vitest, `lsof`, pnpm, Biome.

## Global Constraints

- Package manager: **pnpm**. Tests: `pnpm test`. Typecheck: `pnpm typecheck`.
- One folder per component/hook: `index.ts`, `X.tsx`/`X.ts`, `X.types.ts`, optional `.constants.ts` + tests.
- Each file has a single responsibility; prefer small focused files.
- Liveness failures are soft: any `lsof` error yields an empty map. Never block a delete because detection failed.
- No em dashes in user-facing copy.

## Dependency on the external-drives plan

This plan **extends** `DeleteResult` (`src/shared/delete.types.ts`) — already introduced by the external-drives feature with `blocked?: 'unmounted' | 'live'`. If that plan has not shipped, create `delete.types.ts` per its Task 6 Step 1 first. This plan only adds the `'live'` producer.

---

### Task 1: lsof cwd output parser

**Files:**
- Create: `src/main/liveness/parse-lsof-cwd.ts`
- Test: `src/main/liveness/parse-lsof-cwd.test.ts`

**Interfaces:**
- Produces: `parseLsofCwd(output: string): { pid: number; command: string; cwd: string }[]`. Parses `lsof -F pcn` machine output (records begin with `p<pid>`, `c<command>`, and file lines carry `f<fd>` + `n<name>`; we keep the `cwd` fd's name).

- [ ] **Step 1: Write the failing test**

`lsof -a -d cwd -F pcn` output looks like: a `p`/`c` header per process, then `fcwd` and `n<path>` for the cwd descriptor.

```ts
import { describe, expect, it } from 'vitest'
import { parseLsofCwd } from './parse-lsof-cwd'

const SAMPLE = [
  'p123',
  'cnode',
  'fcwd',
  'n/Users/me/projects/app',
  'p456',
  'cpostgres',
  'fcwd',
  'n/Users/me/db',
  '',
].join('\n')

describe('parseLsofCwd', () => {
  it('extracts pid, command, and cwd per process', () => {
    expect(parseLsofCwd(SAMPLE)).toEqual([
      { pid: 123, command: 'node', cwd: '/Users/me/projects/app' },
      { pid: 456, command: 'postgres', cwd: '/Users/me/db' },
    ])
  })
  it('returns [] for empty input', () => {
    expect(parseLsofCwd('')).toEqual([])
  })
  it('skips a process with no cwd line', () => {
    expect(parseLsofCwd('p1\ncbash\n')).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/liveness/parse-lsof-cwd.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
interface Proc {
  pid: number
  command: string
  cwd: string
}

/** Parse `lsof -a -d cwd -F pcn` output into one record per process with a cwd. */
export function parseLsofCwd(output: string): Proc[] {
  const procs: Proc[] = []
  let pid: number | null = null
  let command = ''
  let cwd: string | null = null
  const flush = (): void => {
    if (pid !== null && cwd !== null) procs.push({ pid, command, cwd })
    cwd = null
  }
  for (const line of output.split('\n')) {
    const tag = line[0]
    const rest = line.slice(1)
    if (tag === 'p') {
      flush()
      pid = Number(rest)
      command = ''
    } else if (tag === 'c') {
      command = rest
    } else if (tag === 'n') {
      cwd = rest
    }
  }
  flush()
  return procs
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/main/liveness/parse-lsof-cwd.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/liveness/parse-lsof-cwd.ts src/main/liveness/parse-lsof-cwd.test.ts
git commit -m "feat(liveness): parse lsof cwd output"
```

---

### Task 2: cwd → project matcher

**Files:**
- Create: `src/main/liveness/match-live.ts`
- Create: `src/main/liveness/liveness.types.ts`
- Test: `src/main/liveness/match-live.test.ts`

**Interfaces:**
- Consumes: the `Proc` shape from Task 1 (`{ pid, command, cwd }`).
- Produces: `LiveInfo = { pid: number; command: string; port?: number }`; `matchLive(procs, projectDirs, ports?): Map<string, LiveInfo>` keyed by projectDir. A dir is live if any proc cwd equals it or is under it. `ports` is an optional `Map<number, number>` (pid → listening port) used to fill `LiveInfo.port`.

- [ ] **Step 1: Define the shared type** — `liveness.types.ts`:

```ts
/** A running process associated with a live project (tooltip detail). */
export interface LiveInfo {
  pid: number
  command: string
  /** Best-effort listening TCP port, tooltip only. */
  port?: number
}
```

- [ ] **Step 2: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { matchLive } from './match-live'

const procs = [
  { pid: 1, command: 'node', cwd: '/u/app' },
  { pid: 2, command: 'node', cwd: '/u/app/packages/web' },
  { pid: 3, command: 'bash', cwd: '/u/other' },
]

describe('matchLive', () => {
  it('marks a dir live on exact cwd match', () => {
    const m = matchLive(procs, ['/u/app'])
    expect(m.get('/u/app')).toEqual({ pid: 1, command: 'node' })
  })
  it('marks a dir live when a process runs in a subfolder', () => {
    const m = matchLive([procs[1]], ['/u/app'])
    expect(m.get('/u/app')).toEqual({ pid: 2, command: 'node' })
  })
  it('leaves unrelated dirs out of the map', () => {
    const m = matchLive(procs, ['/u/nope'])
    expect(m.has('/u/nope')).toBe(false)
  })
  it('attaches a port when the matching pid is listening', () => {
    const m = matchLive([procs[0]], ['/u/app'], new Map([[1, 3000]]))
    expect(m.get('/u/app')).toEqual({ pid: 1, command: 'node', port: 3000 })
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test src/main/liveness/match-live.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement**

```ts
import { sep } from 'node:path'
import type { LiveInfo } from './liveness.types'

interface Proc {
  pid: number
  command: string
  cwd: string
}

const isUnder = (cwd: string, dir: string): boolean => cwd === dir || cwd.startsWith(dir.endsWith(sep) ? dir : dir + sep)

/** Map each live project dir to its first matching process (with optional port). */
export function matchLive(procs: Proc[], projectDirs: string[], ports?: Map<number, number>): Map<string, LiveInfo> {
  const live = new Map<string, LiveInfo>()
  for (const dir of projectDirs) {
    const hit = procs.find((p) => isUnder(p.cwd, dir))
    if (!hit) continue
    const info: LiveInfo = { pid: hit.pid, command: hit.command }
    const port = ports?.get(hit.pid)
    if (port !== undefined) info.port = port
    live.set(dir, info)
  }
  return live
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test src/main/liveness/match-live.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/main/liveness/match-live.ts src/main/liveness/liveness.types.ts src/main/liveness/match-live.test.ts
git commit -m "feat(liveness): match process cwds to project dirs"
```

---

### Task 3: `detectLiveProjects` (compose exec + parse + match + ports)

**Files:**
- Create: `src/main/liveness/liveness.ts`
- Create: `src/main/liveness/parse-lsof-ports.ts`
- Test: `src/main/liveness/parse-lsof-ports.test.ts`

**Interfaces:**
- Consumes: `parseLsofCwd` (T1), `matchLive` (T2).
- Produces: `detectLiveProjects(projectDirs: string[]): Promise<Map<string, LiveInfo>>`; `parseLsofPorts(output: string): Map<number, number>`.

- [ ] **Step 1: Write the failing test for the ports parser** — `lsof -iTCP -sTCP:LISTEN -P -F pn` yields `p<pid>` then `n<host>:<port>` lines:

```ts
import { describe, expect, it } from 'vitest'
import { parseLsofPorts } from './parse-lsof-ports'

const SAMPLE = ['p123', 'n*:3000', 'p456', 'n127.0.0.1:5432', ''].join('\n')

describe('parseLsofPorts', () => {
  it('maps pid to its listening port', () => {
    expect(parseLsofPorts(SAMPLE)).toEqual(new Map([[123, 3000], [456, 5432]]))
  })
  it('returns an empty map for empty input', () => {
    expect(parseLsofPorts('')).toEqual(new Map())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/liveness/parse-lsof-ports.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the ports parser** — `parse-lsof-ports.ts`:

```ts
/** Parse `lsof -iTCP -sTCP:LISTEN -P -F pn` output into pid -> listening port. */
export function parseLsofPorts(output: string): Map<number, number> {
  const ports = new Map<number, number>()
  let pid: number | null = null
  for (const line of output.split('\n')) {
    const tag = line[0]
    const rest = line.slice(1)
    if (tag === 'p') {
      pid = Number(rest)
    } else if (tag === 'n' && pid !== null) {
      const port = Number(rest.slice(rest.lastIndexOf(':') + 1))
      if (Number.isFinite(port) && !ports.has(pid)) ports.set(pid, port)
    }
  }
  return ports
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/main/liveness/parse-lsof-ports.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement the composer** — `liveness.ts`. Uses `execFile` with non-blocking `lsof` flags; swallows all errors to an empty map:

```ts
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { parseLsofCwd } from './parse-lsof-cwd'
import { parseLsofPorts } from './parse-lsof-ports'
import type { LiveInfo } from './liveness.types'
import { matchLive } from './match-live'

const execFileAsync = promisify(execFile)

// -b: non-blocking (never hang on a stuck mount); -w: suppress warnings; -n/-P: no name lookups.
const run = async (args: string[]): Promise<string> => {
  try {
    const { stdout } = await execFileAsync('lsof', args, { maxBuffer: 8 * 1024 * 1024 })
    return stdout
  } catch (err) {
    // lsof exits non-zero when some fds are inaccessible but still prints usable output.
    const stdout = (err as { stdout?: string }).stdout
    return typeof stdout === 'string' ? stdout : ''
  }
}

/** Live projects among `projectDirs`, keyed by dir. Empty on any failure. */
export async function detectLiveProjects(projectDirs: string[]): Promise<Map<string, LiveInfo>> {
  if (projectDirs.length === 0) return new Map()
  const uid = String(process.getuid?.() ?? '')
  const [cwdOut, portOut] = await Promise.all([
    run(['-b', '-w', '-n', '-a', '-d', 'cwd', ...(uid ? ['-u', uid] : []), '-F', 'pcn']),
    run(['-b', '-w', '-n', '-P', '-iTCP', '-sTCP:LISTEN', '-F', 'pn']),
  ])
  return matchLive(parseLsofCwd(cwdOut), projectDirs, parseLsofPorts(portOut))
}
```

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Manual smoke** — with a dev server running in a scanned project, add a temporary script or use the app (Task 8) to confirm the dir shows up. (Automated test covers the pure parsers/matcher; `detectLiveProjects` is a thin exec composition.)

- [ ] **Step 8: Commit**

```bash
git add src/main/liveness/liveness.ts src/main/liveness/parse-lsof-ports.ts src/main/liveness/parse-lsof-ports.test.ts
git commit -m "feat(liveness): detectLiveProjects composing lsof cwd + ports"
```

---

### Task 4: `getLiveProjects` IPC + preload/api wiring

**Files:**
- Modify: `src/shared/ipc.constants.ts`
- Modify: `src/main/ipc/register-ipc.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/preload/api.types.ts`

**Interfaces:**
- Consumes: `detectLiveProjects` (T3), `ctx.projects.all`.
- Produces: `window.clean.getLiveProjects(): Promise<Record<string, LiveInfo>>` keyed by project **id**.

- [ ] **Step 1: Add the channel** — in `ipc.constants.ts` invoke block:

```ts
  getLiveProjects: 'projects:live',
```

- [ ] **Step 2: Register the handler** — in `register-ipc.ts`:

```ts
  ipcMain.handle(IPC.getLiveProjects, async (): Promise<Record<string, LiveInfo>> => {
    const projects = ctx.projects.all
    const byDir = await detectLiveProjects(projects.map((p) => p.absPath))
    const out: Record<string, LiveInfo> = {}
    for (const p of projects) {
      const info = byDir.get(p.absPath)
      if (info) out[p.id] = info
    }
    return out
  })
```

Add imports: `import { detectLiveProjects } from '../liveness/liveness'` and `import type { LiveInfo } from '../liveness/liveness.types'`.

- [ ] **Step 3: Expose in preload + api types** — `preload/index.ts` add `getLiveProjects: () => ipcRenderer.invoke(IPC.getLiveProjects),`. In `api.types.ts` import `LiveInfo` from `@shared`... note: `LiveInfo` currently lives under `src/main/liveness`. Move it to `src/shared/liveness.types.ts` so both preload and renderer can import it. Update the import in `match-live.ts`, `liveness.ts`, and the handler accordingly. Then add to `CleanApi`:

```ts
  /** Project ids currently running (process cwd inside the project). */
  getLiveProjects(): Promise<Record<string, LiveInfo>>
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/ipc.constants.ts src/shared/liveness.types.ts src/main/liveness src/main/ipc/register-ipc.ts src/preload/index.ts src/preload/api.types.ts
git commit -m "feat(ipc): getLiveProjects channel"
```

---

### Task 5: Delete-time re-check produces `blocked: 'live'`

**Files:**
- Modify: `src/main/ipc/register-ipc.ts` (deleteNodeModules handler)
- Test: `src/main/liveness/guard-live.test.ts`
- Create: `src/main/liveness/guard-live.ts`

**Interfaces:**
- Consumes: `detectLiveProjects` (T3), `DeleteResult` (from external-drives Task 6, or create it now).
- Produces: `liveGuard(absPath, detect): Promise<DeleteResult | null>` — `{ freed: 0, blocked: 'live' }` if that dir is live, else `null`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { liveGuard } from './guard-live'

describe('liveGuard', () => {
  it('blocks when the project dir is live', async () => {
    const detect = async () => new Map([['/u/app', { pid: 1, command: 'node' }]])
    expect(await liveGuard('/u/app', detect)).toEqual({ freed: 0, blocked: 'live' })
  })
  it('allows (null) when not live', async () => {
    const detect = async () => new Map()
    expect(await liveGuard('/u/app', detect)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/liveness/guard-live.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `guard-live.ts`:

```ts
import type { DeleteResult } from '@shared/delete.types'
import type { LiveInfo } from '@shared/liveness.types'

type Detect = (dirs: string[]) => Promise<Map<string, LiveInfo>>

/** Pre-delete guard: live result if the project dir is running, else null. */
export async function liveGuard(absPath: string, detect: Detect): Promise<DeleteResult | null> {
  const live = await detect([absPath])
  return live.has(absPath) ? { freed: 0, blocked: 'live' } : null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/main/liveness/guard-live.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire into the delete handler** — in `register-ipc.ts`, after the existing `guardExists` unmount check and before trashing:

```ts
    const live = await liveGuard(project.absPath, detectLiveProjects)
    if (live) return live
```

Add `import { liveGuard } from '../liveness/guard-live'`. (Do NOT `ctx.projects.remove(id)` on a live block — the project still exists and should remain in the list.)

- [ ] **Step 6: Typecheck + tests**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/main/liveness/guard-live.ts src/main/liveness/guard-live.test.ts src/main/ipc/register-ipc.ts
git commit -m "feat(delete): refuse deleting a live project"
```

---

### Task 6: `useLiveProjects` hook (poll while window open)

**Files:**
- Create: `src/renderer/src/hooks/useLiveProjects/index.ts`
- Create: `src/renderer/src/hooks/useLiveProjects/useLiveProjects.ts`

**Interfaces:**
- Consumes: `window.clean.getLiveProjects()` (T4).
- Produces: `useLiveProjects(): Record<string, LiveInfo>` — fetches on mount, re-polls every 45s, clears interval on unmount.

- [ ] **Step 1: Implement** — `useLiveProjects.ts`:

```ts
import type { LiveInfo } from '@shared/liveness.types'
import { useEffect, useState } from 'react'

const POLL_MS = 45_000

/** Live projects keyed by id, refreshed every 45s while this component is mounted. */
export function useLiveProjects(): Record<string, LiveInfo> {
  const [live, setLive] = useState<Record<string, LiveInfo>>({})
  useEffect(() => {
    let active = true
    const tick = (): void => {
      void window.clean.getLiveProjects().then((r) => {
        if (active) setLive(r)
      })
    }
    tick()
    const id = setInterval(tick, POLL_MS)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])
  return live
}
```

`index.ts`:

```ts
export { useLiveProjects } from './useLiveProjects'
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/hooks/useLiveProjects
git commit -m "feat(renderer): useLiveProjects polling hook"
```

---

### Task 7: `LiveDot` component

**Files:**
- Create: `src/renderer/src/components/LiveDot/index.ts`
- Create: `src/renderer/src/components/LiveDot/LiveDot.tsx`
- Create: `src/renderer/src/components/LiveDot/LiveDot.types.ts`

**Interfaces:**
- Consumes: `LiveInfo` (`@shared/liveness.types`).
- Produces: `<LiveDot info={LiveInfo} />` — a green dot with a `title` tooltip `Running · <command>[ · :<port>]`.

- [ ] **Step 1: Define props** — `LiveDot.types.ts`:

```ts
import type { LiveInfo } from '@shared/liveness.types'

export interface LiveDotProps {
  info: LiveInfo
}
```

- [ ] **Step 2: Implement** — `LiveDot.tsx`:

```tsx
import type { ReactNode } from 'react'
import type { LiveDotProps } from './LiveDot.types'

/** Small green dot marking a project whose app is currently running. */
export function LiveDot({ info }: LiveDotProps): ReactNode {
  const label = `Running · ${info.command}${info.port ? ` · :${info.port}` : ''}`
  return (
    <span
      title={label}
      aria-label={label}
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#35c759',
        boxShadow: '0 0 0 3px rgba(53,199,89,0.18)',
        flexShrink: 0,
      }}
    />
  )
}
```

`index.ts`:

```ts
export { LiveDot } from './LiveDot'
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/LiveDot
git commit -m "feat(renderer): LiveDot indicator component"
```

---

### Task 8: Wire live state into Row, MiniRow, and both apps

**Files:**
- Modify: `src/renderer/src/components/Row/Row.types.ts`, `Row.tsx:128-134`
- Modify: `src/renderer/src/components/MiniRow/MiniRow.types.ts`, `MiniRow.tsx`
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`
- Modify: `src/renderer/src/panel/PanelApp/PanelApp.tsx`

**Interfaces:**
- Consumes: `useLiveProjects` (T6), `LiveDot` (T7), `LiveInfo`.
- Produces: rows accept `live?: LiveInfo`; when set, render the dot and disable delete.

- [ ] **Step 1: Add `live` to row props.** In `Row.types.ts` add `import type { LiveInfo } from '@shared/liveness.types'` and `live?: LiveInfo` to `RowProps`. Same for `MiniRow.types.ts` / `MiniRowProps`.

- [ ] **Step 2: Render the dot + disable delete in `Row.tsx`.** Import `LiveDot`. Render `{p /* row */}` — place `{live && <LiveDot info={live} />}` next to the project name (inside the name/meta block, before or after `{p.name}`). In the actions block, make the delete action reflect live state:

```tsx
          <RowAction
            icon={UIIcon.trash}
            label={live ? 'This app is running' : 'Delete node_modules'}
            danger
            disabled={!!live}
            onClick={live ? () => {} : onDelete}
          />
```

Add an optional `disabled?: boolean` to `RowActionProps` (`Row.types.ts`) and in `RowAction.tsx` apply `opacity: .4; cursor: default; pointerEvents: 'none'` when disabled and skip `onClick`. (Read `RowAction.tsx` first to match its existing style approach.)

- [ ] **Step 3: Mirror in `MiniRow.tsx`.** Read `MiniRow.tsx` first. Render `{live && <LiveDot info={live} />}` beside the name, and guard its delete affordance (`MiniRow.tsx:61`) so it is disabled/no-op when `live` is set.

- [ ] **Step 4: Provide `live` from LauncherApp.** In `LauncherApp.tsx`: `const liveById = useLiveProjects()` (import from `@renderer/hooks/useLiveProjects`). Where it maps projects to `<Row ... />` (around line 639), pass `live={liveById[p.id]}`. Also in the delete `.then(({ freed, blocked }) => ...)` handler, treat `blocked === 'live'` by surfacing a brief inline "Can't delete, app is running" message (reuse whatever transient-message mechanism the view already has; if none, a minimal `useState` string shown near the list is fine and must contain no em dash).

- [ ] **Step 5: Provide `live` from PanelApp.** In `PanelApp.tsx`: `const liveById = useLiveProjects()`; pass `live={liveById[p.id]}` to `<MiniRow ... />` (around line 222). In `removeMany`, if any id returns `blocked === 'live'`, skip it (do not count freed) — the disabled affordance already prevents the click, this is defense in depth.

- [ ] **Step 6: Typecheck + build**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Manual verification** (drive via `/run` or `/verify`):

Start a dev server inside a scanned project (`pnpm dev` in some app). Open the launcher: that project shows a green dot with a tooltip naming the process (and `:port` if it listens). Its delete button is disabled with the "This app is running" tooltip. Stop the server, wait up to 45s (or reopen the window): the dot clears and delete re-enables. Attempt a delete right as the app is running via the panel path to confirm main refuses (`blocked: 'live'`).

- [ ] **Step 8: Commit**

```bash
git add src/renderer/src/components/Row src/renderer/src/components/MiniRow src/renderer/src/launcher/LauncherApp/LauncherApp.tsx src/renderer/src/panel/PanelApp/PanelApp.tsx
git commit -m "feat(renderer): live dot + disabled delete on running projects"
```

---

## Self-Review

- **Spec coverage:** detection core via lsof cwd (T1–T3) ✓; port enrichment for tooltip only (T3) ✓; soft-fail on lsof error (T3 `run`) ✓; getLiveProjects IPC keyed by id (T4) ✓; hard block + delete-time re-check, no project removal on live (T5) ✓; poll-while-open 45s (T6) ✓; green dot + disabled delete in both Row and MiniRow (T7, T8) ✓; documented blind spots live in the spec.
- **Placeholders:** pure cores fully coded + tested; UI tasks give exact prop names, the disabled-delete snippet, and point to the concrete files to match style.
- **Type consistency:** `LiveInfo` (moved to `@shared/liveness.types` in T4), `DeleteResult` with `'live' | 'unmounted'`, `detectLiveProjects(dirs)`, `matchLive(procs, dirs, ports?)`, `liveGuard(absPath, detect)` used consistently across tasks.
