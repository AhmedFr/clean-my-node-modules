# Auto-Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TidyDisk checks GitHub Releases for updates silently; the user clicks once to download and once to restart-and-install, driven from a Settings "Updates" tab and a compact banner in the menu bar panel.

**Architecture:** A main-process `UpdaterService` wraps `electron-updater` (injected via a structural `AutoUpdaterLike` interface so tests use a fake) and broadcasts an `UpdaterState` over IPC. The renderer consumes it through a `useUpdater` hook feeding two surfaces: `UpdateBanner` in the panel (tray dropdown) and `UpdateSettings` in the launcher's Settings view. Pure logic (summarizing electron-updater's `UpdateInfo`, error classification, banner visibility) lives in standalone testable modules.

**Tech Stack:** Electron 33, electron-updater (new prod dep), electron-vite (main deps externalized, electron-builder packs prod `dependencies`), React 18, vitest, pnpm.

**Spec:** `docs/superpowers/specs/2026-07-22-auto-update-design.md`. One refinement vs. the spec's state sketch: `currentVersion` and `checkedAt` are hoisted to the top level of `UpdaterState` (with the phase union nested under `status`) because the Settings tab must always render them, in every phase.

## Global Constraints

- Package manager: pnpm (pnpm 11; build-script approvals live in `pnpm-workspace.yaml`, not package.json — electron-updater has no build scripts, nothing to approve).
- One folder per component: `index.ts`, `Component.tsx`, `Component.types.ts`, optional `.constants.ts` + tests.
- Conventional-commit subjects; branch `feat/auto-update`; PR into `main`.
- Commit trailer on every commit: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- No em dashes in any user-facing copy.
- The renderer is untrusted: every value crossing IPC into persisted settings goes through `coerceSetting`.
- Downloads and installs are ONLY user-initiated (`autoDownload = false`). Checks are automatic (launch + every 6 h) but only in packaged builds.
- Analytics: flat primitive props only, through the existing `Analytics.capture` gate.
- Style: inline styles with CSS vars (`var(--text)`, `var(--text-dim)`, `var(--surface-2)`, `var(--hairline)`), buttons via `cc-btn` / `cc-btn ghost` / `cc-btn danger` classes, sizes in the 11.5–13.5px range (copy existing SettingsView idioms).

---

### Task 1: Branch, dependency, shared types, IPC channels

**Files:**
- Create: `src/shared/updater.types.ts`
- Modify: `src/shared/ipc.constants.ts`
- Modify: `src/shared/launcher-nav.types.ts`
- Modify: `package.json` (via pnpm add)

**Interfaces:**
- Produces: `UpdateSummary`, `UpdaterErrorKind`, `UpdaterState` (all later tasks); IPC channel names `updaterGetState`, `updaterCheck`, `updaterDownload`, `updaterInstall`, `onUpdaterState`; `LauncherNavTarget` gains `'settings-updates'`.

- [ ] **Step 1: Branch and install dependency**

```bash
git checkout -b feat/auto-update
pnpm add electron-updater
```

Expected: `electron-updater` appears under `"dependencies"` in package.json (NOT devDependencies — electron-vite's `externalizeDepsPlugin` keeps it out of the bundle and electron-builder packs prod deps, same as `posthog-node`).

- [ ] **Step 2: Create `src/shared/updater.types.ts`**

```ts
/** What the renderer needs to describe one available update. */
export interface UpdateSummary {
  version: string
  /** ISO date string from the release feed; '' when the feed omits it. */
  releaseDate: string
  /** Size of the update zip in bytes; 0 when the feed omits it. */
  sizeBytes: number
  /** Plain-text release notes; null when the GitHub release body is empty. */
  notes: string | null
}

export type UpdaterErrorKind = 'network' | 'translocation' | 'unknown'

/** Full updater snapshot broadcast to renderers on every transition. */
export interface UpdaterState {
  currentVersion: string
  /** Epoch ms of the last completed check; null before the first one. */
  checkedAt: number | null
  status:
    | { phase: 'idle' }
    | { phase: 'checking' }
    | { phase: 'available'; info: UpdateSummary }
    | { phase: 'downloading'; info: UpdateSummary; percent: number }
    | { phase: 'downloaded'; info: UpdateSummary }
    | { phase: 'error'; message: string; kind: UpdaterErrorKind }
}
```

- [ ] **Step 3: Add IPC channels to `src/shared/ipc.constants.ts`**

In the invoke block (after `consumeLauncherNav`):

```ts
  updaterGetState: 'updater:get-state',
  updaterCheck: 'updater:check',
  updaterDownload: 'updater:download',
  updaterInstall: 'updater:install',
```

In the events block (after `onLauncherNavigate`):

```ts
  onUpdaterState: 'updater:state',
```

- [ ] **Step 4: Extend `src/shared/launcher-nav.types.ts`**

```ts
/** A view or tab the launcher can be told to open on (e.g. from a menu-bar panel click). */
export type LauncherNavTarget = 'settings' | 'settings-updates' | 'projects' | 'caches' | 'packages' | 'docker'
```

(`launcherNavState` maps unknown targets to the list view, so this is safe before Task 10 wires the mapping.)

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm typecheck
git add package.json pnpm-lock.yaml src/shared/updater.types.ts src/shared/ipc.constants.ts src/shared/launcher-nav.types.ts
git commit -m "feat(updater): shared updater types, IPC channels, electron-updater dep"
```

Expected: typecheck passes.

---

### Task 2: `dismissedUpdateVersion` setting

**Files:**
- Modify: `src/shared/settings.types.ts`
- Modify: `src/main/settings/validate-setting.ts`
- Test: `src/main/settings/validate-setting.test.ts`

**Interfaces:**
- Produces: optional `Settings.dismissedUpdateVersion?: string` (consumed by Task 9's banner). Not added to `DEFAULT_SETTINGS` (optional keys like `pnpmStorePath` aren't).

- [ ] **Step 1: Write the failing tests** (append inside the existing describe block of `validate-setting.test.ts`, matching its style):

```ts
  it('accepts dismissedUpdateVersion strings', () => {
    expect(coerceSetting('dismissedUpdateVersion', '1.2.0')).toEqual({
      key: 'dismissedUpdateVersion',
      value: '1.2.0',
    })
  })

  it('rejects non-string dismissedUpdateVersion', () => {
    expect(coerceSetting('dismissedUpdateVersion', 5)).toBeNull()
    expect(coerceSetting('dismissedUpdateVersion', null)).toBeNull()
  })
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/main/settings/validate-setting.test.ts`
Expected: FAIL (coerceSetting returns null for the unknown key).

- [ ] **Step 3: Implement**

`src/shared/settings.types.ts` — add to the `Settings` interface after `dockerBinaryPath`:

```ts
  /** Update banner dismissed for this version; a newer release re-shows the banner. */
  dismissedUpdateVersion?: string
```

`src/main/settings/validate-setting.ts` — add a case next to the other string cases:

```ts
    case 'dismissedUpdateVersion':
      return typeof value === 'string' ? { key, value: value.trim() } : null
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/main/settings/validate-setting.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/settings.types.ts src/main/settings/validate-setting.ts src/main/settings/validate-setting.test.ts
git commit -m "feat(updater): dismissedUpdateVersion setting with IPC validation"
```

---

### Task 3: Pure updater logic

**Files:**
- Create: `src/main/updater/updater-logic.ts`
- Test: `src/main/updater/updater-logic.test.ts`

**Interfaces:**
- Produces: `UpdateInfoLike`, `isTranslocated(execPath: string): boolean`, `classifyUpdaterError(message: string): UpdaterErrorKind`, `summarizeUpdate(info: UpdateInfoLike): UpdateSummary` — all consumed by Task 4.

- [ ] **Step 1: Write the failing tests** — `src/main/updater/updater-logic.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { classifyUpdaterError, isTranslocated, summarizeUpdate } from './updater-logic'

describe('isTranslocated', () => {
  it('detects the App Translocation mount path', () => {
    expect(isTranslocated('/private/var/folders/x/AppTranslocation/ABC/d/TidyDisk.app/Contents/MacOS/TidyDisk')).toBe(true)
  })
  it('passes a normal /Applications path', () => {
    expect(isTranslocated('/Applications/TidyDisk.app/Contents/MacOS/TidyDisk')).toBe(false)
  })
})

describe('classifyUpdaterError', () => {
  it('classifies network failures', () => {
    expect(classifyUpdaterError('net::ERR_INTERNET_DISCONNECTED')).toBe('network')
    expect(classifyUpdaterError('getaddrinfo ENOTFOUND github.com')).toBe('network')
    expect(classifyUpdaterError('HttpError: 503 status 503')).toBe('network')
  })
  it('classifies translocation mentions', () => {
    expect(classifyUpdaterError('cannot update in /AppTranslocation/ path')).toBe('translocation')
  })
  it('falls back to unknown', () => {
    expect(classifyUpdaterError('something exploded')).toBe('unknown')
  })
})

describe('summarizeUpdate', () => {
  it('picks the zip file size and passes fields through', () => {
    const s = summarizeUpdate({
      version: '1.2.0',
      releaseDate: '2026-07-20T14:26:58.000Z',
      releaseNotes: 'Fixes and speedups',
      files: [
        { url: 'tidydisk-arm64.dmg', size: 99 },
        { url: 'TidyDisk-1.2.0-arm64-mac.zip', size: 4200000 },
      ],
    })
    expect(s).toEqual({
      version: '1.2.0',
      releaseDate: '2026-07-20T14:26:58.000Z',
      sizeBytes: 4200000,
      notes: 'Fixes and speedups',
    })
  })

  it('strips HTML from notes and nulls empty ones', () => {
    expect(summarizeUpdate({ version: '1.2.0', releaseNotes: '<h2>New</h2><ul><li>Faster scans</li></ul>' }).notes).toBe(
      'New\nFaster scans',
    )
    expect(summarizeUpdate({ version: '1.2.0', releaseNotes: '' }).notes).toBeNull()
    expect(summarizeUpdate({ version: '1.2.0' }).notes).toBeNull()
  })

  it('joins ReleaseNoteInfo arrays', () => {
    const s = summarizeUpdate({
      version: '1.3.0',
      releaseNotes: [
        { version: '1.3.0', note: 'C' },
        { version: '1.2.0', note: 'B' },
      ],
    })
    expect(s.notes).toBe('1.3.0: C\n\n1.2.0: B')
  })

  it('defaults missing date and size', () => {
    const s = summarizeUpdate({ version: '1.2.0' })
    expect(s.releaseDate).toBe('')
    expect(s.sizeBytes).toBe(0)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/main/updater/updater-logic.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `src/main/updater/updater-logic.ts`:

```ts
import type { UpdateSummary, UpdaterErrorKind } from '@shared/updater.types'

/** Structural slice of electron-updater's UpdateInfo that we consume; injectable for tests. */
export interface UpdateInfoLike {
  version: string
  releaseDate?: string
  releaseNotes?: string | Array<{ version: string; note: string | null }> | null
  files?: Array<{ url: string; size?: number }>
}

/** macOS App Translocation runs the app from a random read-only mount; updates cannot install there. */
export function isTranslocated(execPath: string): boolean {
  return execPath.includes('/AppTranslocation/')
}

export function classifyUpdaterError(message: string): UpdaterErrorKind {
  if (/apptranslocation/i.test(message)) return 'translocation'
  if (/net::|enotfound|etimedout|econn|getaddrinfo|socket|network|status [45]\d\d/i.test(message)) return 'network'
  return 'unknown'
}

/** GitHub release bodies can arrive as HTML; keep the text, drop the tags. */
function stripHtml(s: string): string {
  return s
    .replace(/<\/(h[1-6]|li|p|ul|ol|div|br)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
}

export function summarizeUpdate(info: UpdateInfoLike): UpdateSummary {
  // The DMG is for humans; the zip is what Squirrel.Mac downloads and applies.
  const zip = info.files?.find((f) => f.url.endsWith('.zip')) ?? info.files?.[0]
  // stripHtml runs per note fragment, not on the joined string: it drops blank
  // lines, which would otherwise collapse the '\n\n' separators between entries.
  const notes = Array.isArray(info.releaseNotes)
    ? info.releaseNotes
        .map((n) => stripHtml([n.version, n.note ?? ''].filter(Boolean).join(': ')))
        .filter((s) => s.length > 0)
        .join('\n\n')
    : stripHtml(info.releaseNotes ?? '')
  return {
    version: info.version,
    releaseDate: info.releaseDate ?? '',
    sizeBytes: zip?.size ?? 0,
    notes: notes.length > 0 ? notes : null,
  }
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/main/updater/updater-logic.test.ts`
Expected: PASS (all 5 groups).

- [ ] **Step 5: Commit**

```bash
git add src/main/updater/updater-logic.ts src/main/updater/updater-logic.test.ts
git commit -m "feat(updater): pure logic for update summaries, error kinds, translocation"
```

---

### Task 4: `UpdaterService`

**Files:**
- Create: `src/main/updater/updater-service.ts`
- Create: `src/main/updater/index.ts`
- Test: `src/main/updater/updater-service.test.ts`

**Interfaces:**
- Consumes: Task 3's functions, `UpdaterState` from shared.
- Produces (for Tasks 6):
  - `interface AutoUpdaterLike { autoDownload: boolean; autoInstallOnAppQuit: boolean; on(event: string, listener: (...args: never[]) => void): unknown; checkForUpdates(): Promise<unknown>; downloadUpdate(): Promise<unknown>; quitAndInstall(): void }`
  - `class UpdaterService { constructor(updater: AutoUpdaterLike, opts: UpdaterServiceOptions); getState(): UpdaterState; check(): void; download(): void; quitAndInstall(): void; start(): void; stop(): void }`
  - `interface UpdaterServiceOptions { currentVersion: string; execPath: string; onState: (s: UpdaterState) => void; onEvent: (event: 'update_available' | 'update_download_clicked', props?: Record<string, string | number | boolean>) => void }`

- [ ] **Step 1: Write the failing tests** — `src/main/updater/updater-service.test.ts`:

```ts
import type { UpdaterState } from '@shared/updater.types'
import { describe, expect, it, vi } from 'vitest'
import type { AutoUpdaterLike } from './updater-service'
import { UpdaterService } from './updater-service'

class FakeAutoUpdater implements AutoUpdaterLike {
  autoDownload = true
  autoInstallOnAppQuit = false
  checkForUpdates = vi.fn(async () => undefined)
  downloadUpdate = vi.fn(async () => undefined)
  quitAndInstall = vi.fn()
  private listeners = new Map<string, (...args: unknown[]) => void>()
  on(event: string, listener: (...args: never[]) => void): unknown {
    this.listeners.set(event, listener as (...args: unknown[]) => void)
    return this
  }
  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.(...args)
  }
}

const INFO = {
  version: '1.2.0',
  releaseDate: '2026-07-20T14:26:58.000Z',
  releaseNotes: 'Notes',
  files: [{ url: 'TidyDisk-1.2.0-arm64-mac.zip', size: 4200000 }],
}

function makeService(execPath = '/Applications/TidyDisk.app/Contents/MacOS/TidyDisk') {
  const fake = new FakeAutoUpdater()
  const states: UpdaterState[] = []
  const onEvent = vi.fn()
  const service = new UpdaterService(fake, {
    currentVersion: '1.1.0',
    execPath,
    onState: (s) => states.push(s),
    onEvent,
  })
  return { fake, states, onEvent, service }
}

describe('UpdaterService', () => {
  it('configures manual download and install-on-quit', () => {
    const { fake } = makeService()
    expect(fake.autoDownload).toBe(false)
    expect(fake.autoInstallOnAppQuit).toBe(true)
  })

  it('starts idle with the current version and no checkedAt', () => {
    const { service } = makeService()
    expect(service.getState()).toEqual({ currentVersion: '1.1.0', checkedAt: null, status: { phase: 'idle' } })
  })

  it('walks check -> checking -> available and reports the event', () => {
    const { fake, service, states, onEvent } = makeService()
    service.check()
    expect(fake.checkForUpdates).toHaveBeenCalledOnce()
    fake.emit('checking-for-update')
    expect(states.at(-1)?.status.phase).toBe('checking')
    fake.emit('update-available', INFO)
    const last = states.at(-1)
    expect(last?.status).toEqual({
      phase: 'available',
      info: { version: '1.2.0', releaseDate: '2026-07-20T14:26:58.000Z', sizeBytes: 4200000, notes: 'Notes' },
    })
    expect(last?.checkedAt).toBeTypeOf('number')
    expect(onEvent).toHaveBeenCalledWith('update_available', { version: '1.2.0' })
  })

  it('returns to idle with checkedAt when no update exists', () => {
    const { fake, service, states } = makeService()
    service.check()
    fake.emit('update-not-available')
    expect(states.at(-1)?.status).toEqual({ phase: 'idle' })
    expect(states.at(-1)?.checkedAt).toBeTypeOf('number')
  })

  it('refuses download unless an update is available', () => {
    const { fake, service } = makeService()
    service.download()
    expect(fake.downloadUpdate).not.toHaveBeenCalled()
  })

  it('downloads from available, tracks progress and downloaded', () => {
    const { fake, service, states, onEvent } = makeService()
    fake.emit('update-available', INFO)
    service.download()
    expect(fake.downloadUpdate).toHaveBeenCalledOnce()
    expect(onEvent).toHaveBeenCalledWith('update_download_clicked', { version: '1.2.0' })
    fake.emit('download-progress', { percent: 41.7 })
    expect(states.at(-1)?.status).toMatchObject({ phase: 'downloading', percent: 42 })
    fake.emit('update-downloaded')
    expect(states.at(-1)?.status).toMatchObject({ phase: 'downloaded' })
  })

  it('refuses install unless downloaded', () => {
    const { fake, service } = makeService()
    service.quitAndInstall()
    expect(fake.quitAndInstall).not.toHaveBeenCalled()
    fake.emit('update-available', INFO)
    fake.emit('update-downloaded')
    service.quitAndInstall()
    expect(fake.quitAndInstall).toHaveBeenCalledOnce()
  })

  it('maps errors through classifyUpdaterError', () => {
    const { fake, states } = makeService()
    fake.emit('error', new Error('getaddrinfo ENOTFOUND github.com'))
    expect(states.at(-1)?.status).toEqual({
      phase: 'error',
      message: 'getaddrinfo ENOTFOUND github.com',
      kind: 'network',
    })
  })

  it('short-circuits to a translocation error without hitting the network', () => {
    const { fake, service, states } = makeService('/private/var/folders/x/AppTranslocation/ABC/d/TidyDisk.app/Contents/MacOS/TidyDisk')
    service.check()
    expect(fake.checkForUpdates).not.toHaveBeenCalled()
    expect(states.at(-1)?.status).toMatchObject({ phase: 'error', kind: 'translocation' })
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/main/updater/updater-service.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `src/main/updater/updater-service.ts`:

```ts
import type { UpdateSummary, UpdaterState } from '@shared/updater.types'
import { classifyUpdaterError, isTranslocated, summarizeUpdate, type UpdateInfoLike } from './updater-logic'

/** Structural subset of electron-updater's autoUpdater; injectable for tests. */
export interface AutoUpdaterLike {
  autoDownload: boolean
  autoInstallOnAppQuit: boolean
  on(event: string, listener: (...args: never[]) => void): unknown
  checkForUpdates(): Promise<unknown>
  downloadUpdate(): Promise<unknown>
  quitAndInstall(): void
}

export interface UpdaterServiceOptions {
  currentVersion: string
  execPath: string
  onState: (state: UpdaterState) => void
  onEvent: (
    event: 'update_available' | 'update_download_clicked',
    props?: Record<string, string | number | boolean>,
  ) => void
}

const FIRST_CHECK_DELAY_MS = 10_000
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

/**
 * Wraps electron-updater with a fully user-driven flow: checks are silent and
 * automatic, but download and install each require an explicit call (a click).
 */
export class UpdaterService {
  private status: UpdaterState['status'] = { phase: 'idle' }
  private checkedAt: number | null = null
  private lastInfo: UpdateSummary | null = null
  private firstCheckTimer: ReturnType<typeof setTimeout> | null = null
  private checkInterval: ReturnType<typeof setInterval> | null = null

  constructor(
    private updater: AutoUpdaterLike,
    private opts: UpdaterServiceOptions,
  ) {
    updater.autoDownload = false
    updater.autoInstallOnAppQuit = true
    updater.on('checking-for-update', () => this.setStatus({ phase: 'checking' }))
    updater.on('update-available', (info: UpdateInfoLike) => {
      const summary = summarizeUpdate(info)
      this.lastInfo = summary
      this.checkedAt = Date.now()
      this.opts.onEvent('update_available', { version: summary.version })
      this.setStatus({ phase: 'available', info: summary })
    })
    updater.on('update-not-available', () => {
      this.checkedAt = Date.now()
      this.setStatus({ phase: 'idle' })
    })
    updater.on('download-progress', (p: { percent: number }) => {
      if (this.lastInfo) this.setStatus({ phase: 'downloading', info: this.lastInfo, percent: Math.round(p.percent) })
    })
    updater.on('update-downloaded', () => {
      if (this.lastInfo) this.setStatus({ phase: 'downloaded', info: this.lastInfo })
    })
    updater.on('error', (err: Error) => {
      this.setStatus({ phase: 'error', message: err.message, kind: classifyUpdaterError(err.message) })
    })
  }

  getState(): UpdaterState {
    return { currentVersion: this.opts.currentVersion, checkedAt: this.checkedAt, status: this.status }
  }

  check(): void {
    if (isTranslocated(this.opts.execPath)) {
      this.setStatus({
        phase: 'error',
        message: 'TidyDisk is running from a translocated path.',
        kind: 'translocation',
      })
      return
    }
    // Never interrupt an in-flight or completed download with a fresh check.
    if (this.status.phase === 'downloading' || this.status.phase === 'downloaded') return
    void this.updater.checkForUpdates().catch(() => {
      // failures surface through the 'error' event
    })
  }

  download(): void {
    if (this.status.phase !== 'available') return
    this.opts.onEvent('update_download_clicked', { version: this.status.info.version })
    void this.updater.downloadUpdate().catch(() => {
      // failures surface through the 'error' event
    })
  }

  quitAndInstall(): void {
    if (this.status.phase !== 'downloaded') return
    this.updater.quitAndInstall()
  }

  /** Silent background checks: shortly after launch, then every 6 hours. */
  start(): void {
    this.firstCheckTimer = setTimeout(() => this.check(), FIRST_CHECK_DELAY_MS)
    this.checkInterval = setInterval(() => this.check(), CHECK_INTERVAL_MS)
  }

  stop(): void {
    if (this.firstCheckTimer) clearTimeout(this.firstCheckTimer)
    if (this.checkInterval) clearInterval(this.checkInterval)
    this.firstCheckTimer = null
    this.checkInterval = null
  }

  private setStatus(status: UpdaterState['status']): void {
    this.status = status
    this.opts.onState(this.getState())
  }
}
```

`src/main/updater/index.ts`:

```ts
export type { AutoUpdaterLike, UpdaterServiceOptions } from './updater-service'
export { UpdaterService } from './updater-service'
export { classifyUpdaterError, isTranslocated, summarizeUpdate } from './updater-logic'
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/main/updater/updater-service.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/main/updater
git commit -m "feat(updater): UpdaterService state machine over injectable autoUpdater"
```

---

### Task 5: Analytics events + version-change detection

**Files:**
- Modify: `src/main/analytics/analytics.ts` (ANALYTICS_EVENTS)
- Create: `src/main/updater/note-version-change.ts`
- Test: `src/main/updater/note-version-change.test.ts`

**Interfaces:**
- Produces: analytics events `'update_available' | 'update_download_clicked' | 'update_installed'`; `noteVersionChange(current: string, filePath?: string): string | null` returning the previous version only when this launch is the first on a strictly newer version.

- [ ] **Step 1: Write the failing tests** — `src/main/updater/note-version-change.test.ts` (mirrors `settings-store.test.ts`'s electron mock pattern):

```ts
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp' } }))

// imported after the mock so the module's `import { app }` resolves
const { noteVersionChange } = await import('./note-version-change')

const dir = mkdtempSync(join(tmpdir(), 'cmn-updater-'))
const fileIn = (name: string): string => join(dir, name)
afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('noteVersionChange', () => {
  it('returns null on first run and records the version', () => {
    const f = fileIn('first.json')
    expect(noteVersionChange('1.1.0', f)).toBeNull()
    expect(JSON.parse(readFileSync(f, 'utf8'))).toEqual({ version: '1.1.0' })
  })

  it('returns null when the version is unchanged', () => {
    const f = fileIn('same.json')
    noteVersionChange('1.1.0', f)
    expect(noteVersionChange('1.1.0', f)).toBeNull()
  })

  it('returns the previous version after an upgrade', () => {
    const f = fileIn('upgrade.json')
    noteVersionChange('1.1.0', f)
    expect(noteVersionChange('1.2.0', f)).toBe('1.1.0')
    expect(JSON.parse(readFileSync(f, 'utf8'))).toEqual({ version: '1.2.0' })
  })

  it('returns null on a downgrade but still records it', () => {
    const f = fileIn('downgrade.json')
    noteVersionChange('1.2.0', f)
    expect(noteVersionChange('1.1.0', f)).toBeNull()
    expect(JSON.parse(readFileSync(f, 'utf8'))).toEqual({ version: '1.1.0' })
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/main/updater/note-version-change.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `src/main/updater/note-version-change.ts`:

```ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app } from 'electron'
import { lt, valid } from 'semver'

/**
 * Records the running version in userData; returns the previous version only when
 * this launch is the first on a strictly newer one (i.e. an update just landed).
 */
export function noteVersionChange(
  current: string,
  filePath = join(app.getPath('userData'), 'last-run-version.json'),
): string | null {
  let previous: string | null = null
  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf8')) as { version?: unknown }
    if (typeof raw.version === 'string') previous = raw.version
  } catch {
    // first run: no file yet
  }
  if (previous !== current) {
    try {
      mkdirSync(dirname(filePath), { recursive: true })
      writeFileSync(filePath, JSON.stringify({ version: current }))
    } catch (err) {
      console.error('Failed to persist last-run version', err)
    }
  }
  return previous && valid(previous) && valid(current) && lt(previous, current) ? previous : null
}
```

Add to `ANALYTICS_EVENTS` in `src/main/analytics/analytics.ts` (after `'share_card_copied'`):

```ts
  'update_available',
  'update_download_clicked',
  'update_installed',
```

Also export from `src/main/updater/index.ts`:

```ts
export { noteVersionChange } from './note-version-change'
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/main/updater/note-version-change.test.ts src/main/analytics/analytics.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/updater src/main/analytics/analytics.ts
git commit -m "feat(updater): update analytics events and post-install version detection"
```

---

### Task 6: Wire main process — AppContext, IPC handlers, preload, app startup

**Files:**
- Modify: `src/main/app-context.types.ts`
- Modify: `src/main/ipc/register-ipc.ts`
- Modify: `src/main/ipc/register-ipc.test.ts` (ctx fixture)
- Modify: `src/preload/index.ts`
- Modify: `src/preload/api.types.ts`
- Modify: `src/main/index.ts`

**Interfaces:**
- Consumes: `UpdaterService` (Task 4), `noteVersionChange` (Task 5), IPC channels (Task 1).
- Produces (renderer surface, used by Task 7): `window.clean.getUpdaterState(): Promise<UpdaterState>`, `updaterCheck(): Promise<void>`, `updaterDownload(): Promise<void>`, `updaterInstall(): Promise<void>`, `onUpdaterState(fn: (s: UpdaterState) => void): () => void`.

- [ ] **Step 1: AppContext** — in `src/main/app-context.types.ts` add:

```ts
import type { UpdaterService } from './updater/updater-service'
```

and inside `AppContext`, after `license: LicenseStore`:

```ts
  updater: UpdaterService
```

- [ ] **Step 2: IPC handlers** — in `src/main/ipc/register-ipc.ts`, after the `IPC.consumeLauncherNav` handler:

```ts
  ipcMain.handle(IPC.updaterGetState, () => ctx.updater.getState())
  ipcMain.handle(IPC.updaterCheck, () => ctx.updater.check())
  ipcMain.handle(IPC.updaterDownload, () => ctx.updater.download())
  ipcMain.handle(IPC.updaterInstall, () => ctx.updater.quitAndInstall())
```

- [ ] **Step 3: Test fixture** — in `src/main/ipc/register-ipc.test.ts`, find the ctx object literal passed to `registerIpc(...)` and add an `updater` stub alongside the other stores:

```ts
    updater: {
      getState: vi.fn(() => ({ currentVersion: '1.1.0', checkedAt: null, status: { phase: 'idle' } })),
      check: vi.fn(),
      download: vi.fn(),
      quitAndInstall: vi.fn(),
    } as unknown as UpdaterService,
```

with `import type { UpdaterService } from '../updater/updater-service'` at the top. Then add a test:

```ts
  it('exposes updater state and forwards updater actions', async () => {
    expect(await handlers.get(IPC.updaterGetState)?.(null)).toMatchObject({ status: { phase: 'idle' } })
    await handlers.get(IPC.updaterDownload)?.(null)
    expect(ctx.updater.download).toHaveBeenCalledOnce()
  })
```

(Adapt `handlers.get(...)` / ctx access to the file's existing helper style — it stores handlers in a Map keyed by channel.)

- [ ] **Step 4: Preload** — `src/preload/api.types.ts`: add `import type { UpdaterState } from '@shared/updater.types'` and, to `CleanApi` after `consumeLauncherNav`:

```ts
  /** Current updater snapshot; renderers fetch once on mount then subscribe. */
  getUpdaterState(): Promise<UpdaterState>
  /** Triggers a silent update check (also used by the Settings "Check for updates" button). */
  updaterCheck(): Promise<void>
  /** Starts downloading the available update; no-op unless one is available. */
  updaterDownload(): Promise<void>
  /** Quits and installs the downloaded update; no-op unless downloaded. */
  updaterInstall(): Promise<void>
```

and after `onLauncherNavigate`:

```ts
  onUpdaterState(fn: (s: UpdaterState) => void): () => void
```

`src/preload/index.ts`: add to the `api` object:

```ts
  getUpdaterState: () => ipcRenderer.invoke(IPC.updaterGetState),
  updaterCheck: () => ipcRenderer.invoke(IPC.updaterCheck),
  updaterDownload: () => ipcRenderer.invoke(IPC.updaterDownload),
  updaterInstall: () => ipcRenderer.invoke(IPC.updaterInstall),
  onUpdaterState: subscribe(IPC.onUpdaterState),
```

- [ ] **Step 5: App startup** — `src/main/index.ts`:

Imports (electron-updater is CJS; with `"type": "module"` use the default-import interop):

```ts
import electronUpdater from 'electron-updater'
import { noteVersionChange, UpdaterService } from './updater'
```

After `analytics.capture('app_launched', ...)`:

```ts
  const prevVersion = noteVersionChange(app.getVersion())
  if (prevVersion) analytics.capture('update_installed', { from: prevVersion, to: app.getVersion() })
```

After `const notifier = new ThresholdNotifier(...)`:

```ts
  const updater = new UpdaterService(electronUpdater.autoUpdater, {
    currentVersion: app.getVersion(),
    execPath: process.execPath,
    onState: (s) => broadcast(IPC.onUpdaterState, s),
    onEvent: (event, props) => analytics.capture(event, props),
  })
  // Silent checks only make sense for a packaged, signed build.
  if (app.isPackaged) updater.start()
```

In the `before-quit` handler add `updater.stop()`. In the `registerIpc({...})` call add `updater`.

- [ ] **Step 6: Verify**

Run: `pnpm typecheck && pnpm vitest run src/main/ipc/register-ipc.test.ts`
Expected: both PASS.

- [ ] **Step 7: Smoke-run in dev** (updater inert in dev, but the app must boot):

Run: `timeout 20 pnpm dev > /tmp/dev-smoke.log 2>&1; grep -i "error" /tmp/dev-smoke.log | grep -vi "0 error" || echo CLEAN`
Expected: `CLEAN` (or only pre-existing noise; no updater/import errors).

- [ ] **Step 8: Commit**

```bash
git add src/main/app-context.types.ts src/main/ipc src/preload src/main/index.ts
git commit -m "feat(updater): wire UpdaterService through IPC, preload and app startup"
```

---

### Task 7: `useUpdater` renderer hook

**Files:**
- Create: `src/renderer/src/hooks/useUpdater.ts`

**Interfaces:**
- Consumes: `window.clean.getUpdaterState` / `updaterCheck` / `updaterDownload` / `updaterInstall` / `onUpdaterState` (Task 6).
- Produces: `useUpdater(): { state: UpdaterState; check: () => void; download: () => void; install: () => void }` (Tasks 8–9). Follows the `useSettings` fetch-then-subscribe pattern.

- [ ] **Step 1: Implement** — `src/renderer/src/hooks/useUpdater.ts`:

```ts
import type { UpdaterState } from '@shared/updater.types'
import { useEffect, useState } from 'react'

const INITIAL: UpdaterState = { currentVersion: '', checkedAt: null, status: { phase: 'idle' } }

/** Live updater state synced with the main process, plus the three user actions. */
export function useUpdater(): {
  state: UpdaterState
  check: () => void
  download: () => void
  install: () => void
} {
  const [state, setState] = useState<UpdaterState>(INITIAL)

  useEffect(() => {
    let alive = true
    void window.clean.getUpdaterState().then((s) => {
      if (alive) setState(s)
    })
    const unsubscribe = window.clean.onUpdaterState(setState)
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  return {
    state,
    check: () => void window.clean.updaterCheck(),
    download: () => void window.clean.updaterDownload(),
    install: () => void window.clean.updaterInstall(),
  }
}
```

- [ ] **Step 2: Verify and commit**

Run: `pnpm typecheck`
Expected: PASS.

```bash
git add src/renderer/src/hooks/useUpdater.ts
git commit -m "feat(updater): useUpdater hook syncing updater state to renderers"
```

---

### Task 8: Settings "Updates" tab (`UpdateSettings` component)

**Files:**
- Create: `src/renderer/src/components/UpdateSettings/index.ts`
- Create: `src/renderer/src/components/UpdateSettings/UpdateSettings.tsx`
- Create: `src/renderer/src/components/UpdateSettings/UpdateSettings.types.ts`
- Modify: `src/renderer/src/lib/format/format.ts` (add `releaseDateLabel`)
- Test: `src/renderer/src/lib/format/format.test.ts` (append)
- Modify: `src/renderer/src/launcher/views/SettingsView.tsx` (new tab)

**Interfaces:**
- Consumes: `useUpdater` (Task 7), `formatSizeStr` from `@renderer/lib/format/format`.
- Produces: `<UpdateSettings accent={string} />`; `SettingsView` exports `type SettingsTab` (now including `'updates'`) and accepts optional prop `initialTab?: SettingsTab` (default `'scanning'`) — Task 10 consumes both. `releaseDateLabel(iso: string): string | null` in the format lib (Task 9 also uses it).

- [ ] **Step 1: Failing test for the date helper** — append to `src/renderer/src/lib/format/format.test.ts`:

```ts
describe('releaseDateLabel', () => {
  it('formats an ISO date', () => {
    expect(releaseDateLabel('2026-07-20T14:26:58.000Z')).toMatch(/2026/)
  })
  it('returns null for empty or garbage input', () => {
    expect(releaseDateLabel('')).toBeNull()
    expect(releaseDateLabel('not-a-date')).toBeNull()
  })
})
```

(add `releaseDateLabel` to the file's import from `./format`.)

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/renderer/src/lib/format/format.test.ts`
Expected: FAIL (no export).

- [ ] **Step 3: Implement the helper** — append to `src/renderer/src/lib/format/format.ts`:

```ts
/** "Jul 20, 2026" from an ISO string, or null when absent/unparseable. */
export function releaseDateLabel(iso: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
```

Run: `pnpm vitest run src/renderer/src/lib/format/format.test.ts` — expected PASS.

- [ ] **Step 4: Component** — `src/renderer/src/components/UpdateSettings/UpdateSettings.types.ts`:

```ts
export interface UpdateSettingsProps {
  accent: string
}
```

`src/renderer/src/components/UpdateSettings/index.ts`:

```ts
export { UpdateSettings } from './UpdateSettings'
export type { UpdateSettingsProps } from './UpdateSettings.types'
```

`src/renderer/src/components/UpdateSettings/UpdateSettings.tsx`:

```tsx
import { useUpdater } from '@renderer/hooks/useUpdater'
import { formatSizeStr, relativeTime, releaseDateLabel } from '@renderer/lib/format/format'
import type { ReactNode } from 'react'
import type { UpdateSettingsProps } from './UpdateSettings.types'

/** The Updates tab of Settings: version info, manual check, and the two-click
 *  download -> restart-and-install flow. All updater actions live here. */
export function UpdateSettings({ accent }: UpdateSettingsProps): ReactNode {
  const { state, check, download, install } = useUpdater()
  const { status } = state
  const info = 'info' in status ? status.info : null
  const meta = info
    ? [info.sizeBytes ? formatSizeStr(info.sizeBytes) : null, releaseDateLabel(info.releaseDate)]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '13px 4px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 550, color: 'var(--text)' }}>
            TidyDisk {state.currentVersion || '…'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
            {status.phase === 'checking'
              ? 'Checking…'
              : state.checkedAt
                ? `Last checked ${relativeTime(state.checkedAt)}`
                : 'Updates are checked automatically in the background'}
          </div>
        </div>
        <button className="cc-btn ghost" disabled={status.phase === 'checking'} onClick={check}>
          Check for updates
        </button>
      </div>

      {status.phase === 'idle' && state.checkedAt !== null && (
        <div style={{ padding: '2px 4px 10px', fontSize: 12, color: 'var(--text-dim)' }}>Up to date.</div>
      )}

      {info && (
        <>
          <div style={{ height: 1, background: 'var(--surface-1)' }} />
          <div style={{ padding: '13px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 550, color: 'var(--text)' }}>
                  Version {info.version} available
                </div>
                {meta && <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>{meta}</div>}
              </div>
              {status.phase === 'available' && (
                <button className="cc-btn danger" style={{ background: accent }} onClick={download}>
                  Download update
                </button>
              )}
              {status.phase === 'downloading' && (
                <span
                  style={{
                    fontSize: 12.5,
                    color: 'var(--text-dim)',
                    fontVariantNumeric: 'tabular-nums',
                    flex: '0 0 auto',
                  }}
                >
                  Downloading… {status.percent}%
                </span>
              )}
              {status.phase === 'downloaded' && (
                <button className="cc-btn danger" style={{ background: accent }} onClick={install}>
                  Restart and install
                </button>
              )}
            </div>
            {info.notes && (
              <div
                style={{
                  marginTop: 10,
                  padding: '10px 12px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 7,
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: 'var(--text)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {info.notes}
              </div>
            )}
          </div>
        </>
      )}

      {status.phase === 'error' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '2px 4px 10px',
            fontSize: 12,
            color: 'var(--text-dim)',
          }}
        >
          <span>
            {status.kind === 'translocation'
              ? 'Updates need TidyDisk to run from the Applications folder. Move the app there and relaunch.'
              : status.kind === 'network'
                ? 'Could not reach the update server.'
                : `Update check failed: ${status.message}`}
          </span>
          {status.kind !== 'translocation' && (
            <button className="cc-btn ghost" onClick={check}>
              Try again
            </button>
          )}
        </div>
      )}
    </>
  )
}
```

Note: verify `formatSizeStr` and `relativeTime` import paths by checking an existing consumer (`grep -rn "formatSizeStr" src/renderer/src --include="*.tsx" | head -3`) and match that exact import specifier.

- [ ] **Step 5: SettingsView tab** — in `src/renderer/src/launcher/views/SettingsView.tsx`:

Export the tab type and add the tab (replacing the current private declarations):

```ts
export type SettingsTab = 'scanning' | 'packages' | 'privacy' | 'updates' | 'license'

const SETTINGS_TABS: { value: SettingsTab; label: string }[] = [
  { value: 'scanning', label: 'Scanning' },
  { value: 'packages', label: 'Packages' },
  { value: 'privacy', label: 'Privacy' },
  { value: 'updates', label: 'Updates' },
  { value: 'license', label: 'License' },
]
```

Add `initialTab` to `SettingsViewProps`:

```ts
  /** Tab to land on when the view mounts (deep link from the panel banner). */
  initialTab?: SettingsTab
```

In the component: destructure `initialTab` and change the tab state line to

```ts
  const [tab, setTab] = useState<SettingsTab>(initialTab ?? 'scanning')
```

Add the import `import { UpdateSettings } from '@renderer/components/UpdateSettings'` and render, between the `privacy` and `license` blocks:

```tsx
      {tab === 'updates' && <UpdateSettings accent={accent} />}
```

- [ ] **Step 6: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS. Then visually: `pnpm dev`, open full window → Settings → Updates tab renders version row and "Check for updates" (check errors in dev are fine/expected — dev has no update feed; confirm the error renders as the friendly network message, not a crash).

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/components/UpdateSettings src/renderer/src/lib/format src/renderer/src/launcher/views/SettingsView.tsx
git commit -m "feat(updater): Updates tab in Settings with manual download/install flow"
```

---

### Task 9: Panel `UpdateBanner`

**Files:**
- Create: `src/renderer/src/components/UpdateBanner/index.ts`
- Create: `src/renderer/src/components/UpdateBanner/UpdateBanner.tsx`
- Create: `src/renderer/src/components/UpdateBanner/UpdateBanner.types.ts`
- Create: `src/renderer/src/components/UpdateBanner/UpdateBanner.constants.ts`
- Test: `src/renderer/src/components/UpdateBanner/UpdateBanner.constants.test.ts`
- Modify: `src/renderer/src/panel/PanelApp/PanelApp.tsx`

**Interfaces:**
- Consumes: `useUpdater` (Task 7), `Settings.dismissedUpdateVersion` (Task 2), `formatSizeStr`/`releaseDateLabel` (Task 8), `window.clean.openLauncher('settings-updates')`.
- Produces: `bannerModel(status: UpdaterState['status'], dismissedVersion: string | undefined): BannerModel | null`; `<UpdateBanner accent dismissedVersion onDismiss />` in the panel.

- [ ] **Step 1: Write the failing tests** — `UpdateBanner.constants.test.ts`:

```ts
import type { UpdaterState } from '@shared/updater.types'
import { describe, expect, it } from 'vitest'
import { bannerModel } from './UpdateBanner.constants'

const INFO = { version: '1.2.0', releaseDate: '2026-07-20T14:26:58.000Z', sizeBytes: 4200000, notes: null }

describe('bannerModel', () => {
  it('hides for idle, checking and error phases', () => {
    expect(bannerModel({ phase: 'idle' }, undefined)).toBeNull()
    expect(bannerModel({ phase: 'checking' }, undefined)).toBeNull()
    expect(bannerModel({ phase: 'error', message: 'x', kind: 'network' }, undefined)).toBeNull()
  })

  it('shows a dismissible banner when an update is available', () => {
    expect(bannerModel({ phase: 'available', info: INFO }, undefined)).toEqual({
      info: INFO,
      phase: 'available',
      dismissible: true,
    })
  })

  it('hides when that exact version was dismissed, but not a different one', () => {
    expect(bannerModel({ phase: 'available', info: INFO }, '1.2.0')).toBeNull()
    expect(bannerModel({ phase: 'available', info: INFO }, '1.1.5')).not.toBeNull()
  })

  it('ignores dismissal once a download is in flight or done', () => {
    const downloading: UpdaterState['status'] = { phase: 'downloading', info: INFO, percent: 30 }
    expect(bannerModel(downloading, '1.2.0')).toEqual({ info: INFO, phase: 'downloading', percent: 30, dismissible: false })
    expect(bannerModel({ phase: 'downloaded', info: INFO }, '1.2.0')).toEqual({
      info: INFO,
      phase: 'downloaded',
      dismissible: false,
    })
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/renderer/src/components/UpdateBanner/UpdateBanner.constants.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `UpdateBanner.constants.ts`:

```ts
import type { UpdateSummary, UpdaterState } from '@shared/updater.types'

export interface BannerModel {
  info: UpdateSummary
  phase: 'available' | 'downloading' | 'downloaded'
  percent?: number
  dismissible: boolean
}

/** What the panel banner shows, or null to hide. Dismissal only silences the plain
 *  "available" nudge; an in-flight or completed download stays visible. */
export function bannerModel(
  status: UpdaterState['status'],
  dismissedVersion: string | undefined,
): BannerModel | null {
  switch (status.phase) {
    case 'available':
      if (status.info.version === dismissedVersion) return null
      return { info: status.info, phase: 'available', dismissible: true }
    case 'downloading':
      return { info: status.info, phase: 'downloading', percent: status.percent, dismissible: false }
    case 'downloaded':
      return { info: status.info, phase: 'downloaded', dismissible: false }
    default:
      return null
  }
}
```

`UpdateBanner.types.ts`:

```ts
export interface UpdateBannerProps {
  accent: string
  dismissedVersion?: string
  onDismiss: (version: string) => void
}
```

`index.ts`:

```ts
export { UpdateBanner } from './UpdateBanner'
export type { UpdateBannerProps } from './UpdateBanner.types'
```

`UpdateBanner.tsx`:

```tsx
import { useUpdater } from '@renderer/hooks/useUpdater'
import { formatSizeStr, releaseDateLabel } from '@renderer/lib/format/format'
import type { ReactNode } from 'react'
import { bannerModel } from './UpdateBanner.constants'
import type { UpdateBannerProps } from './UpdateBanner.types'

/** Compact one-line update nudge for the menu bar panel. Clicking it deep-links to
 *  Settings -> Updates; all download/install actions live there, not here. */
export function UpdateBanner({ accent, dismissedVersion, onDismiss }: UpdateBannerProps): ReactNode {
  const { state } = useUpdater()
  const model = bannerModel(state.status, dismissedVersion)
  if (!model) return null

  const { info } = model
  const date = releaseDateLabel(info.releaseDate)
  const label =
    model.phase === 'downloading'
      ? `Downloading v${info.version}… ${model.percent ?? 0}%`
      : model.phase === 'downloaded'
        ? `v${info.version} ready to install`
        : `v${info.version} available${info.sizeBytes ? ` · ${formatSizeStr(info.sizeBytes)}` : ''}${date ? ` · ${date}` : ''}`

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => void window.clean.openLauncher('settings-updates')}
      onKeyDown={(e) => {
        if (e.key === 'Enter') void window.clean.openLauncher('settings-updates')
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '6px 10px 2px',
        padding: '7px 10px',
        borderRadius: 8,
        background: 'var(--surface-2)',
        border: '1px solid var(--hairline)',
        cursor: 'pointer',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 3, background: accent, flex: '0 0 auto' }} />
      <span
        style={{
          fontSize: 11.5,
          color: 'var(--text)',
          flex: 1,
          minWidth: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </span>
      {model.dismissible && (
        <button
          aria-label="Dismiss"
          onClick={(e) => {
            e.stopPropagation()
            onDismiss(info.version)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            fontSize: 12,
            padding: '0 2px',
            flex: '0 0 auto',
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/renderer/src/components/UpdateBanner/UpdateBanner.constants.test.ts`
Expected: PASS.

- [ ] **Step 5: Mount in the panel** — `src/renderer/src/panel/PanelApp/PanelApp.tsx`:

Change the settings destructure to expose the setter:

```ts
  const [settings, setSetting, settingsLoaded] = useSettings()
```

Add `import { UpdateBanner } from '@renderer/components/UpdateBanner'`. In the `view === 'main'`, onboarded branch, directly BEFORE `<TrackedSummary`:

```tsx
                <UpdateBanner
                  accent={accent}
                  dismissedVersion={settings.dismissedUpdateVersion}
                  onDismiss={(v) => void setSetting('dismissedUpdateVersion', v)}
                />
```

- [ ] **Step 6: Verify**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all PASS (banner renders nothing in dev since state stays idle).

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/components/UpdateBanner src/renderer/src/panel/PanelApp/PanelApp.tsx
git commit -m "feat(updater): dismissible update banner in the menu bar panel"
```

---

### Task 10: Deep link `settings-updates` through launcher navigation

**Files:**
- Modify: `src/renderer/src/launcher/LauncherApp/launcherNav.ts`
- Test: `src/renderer/src/launcher/LauncherApp/launcherNav.test.ts` (append)
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`

**Interfaces:**
- Consumes: `LauncherNavTarget` incl. `'settings-updates'` (Task 1), `SettingsView`'s `initialTab` prop + exported `SettingsTab` (Task 8).
- Produces: `LauncherNavState` gains optional `settingsTab?: 'updates'`; banner clicks land on Settings → Updates whether the launcher was closed or already open.

- [ ] **Step 1: Write the failing test** — append to `launcherNav.test.ts`:

```ts
  it('maps settings-updates to the settings view with the updates tab', () => {
    expect(launcherNavState('settings-updates')).toEqual({ view: 'settings', settingsTab: 'updates' })
  })
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/renderer/src/launcher/LauncherApp/launcherNav.test.ts`
Expected: FAIL (`settingsTab` missing; falls back to list view).

- [ ] **Step 3: Implement** — `launcherNav.ts`:

```ts
export interface LauncherNavState {
  view: LauncherView
  /** Only set for tab targets; undefined leaves the current tab alone. */
  tab?: LauncherTab
  /** Only set for 'settings-updates': which settings tab to land on. */
  settingsTab?: 'updates'
}
```

and in `launcherNavState`, before the `settings` check:

```ts
  if (target === 'settings-updates') return { view: 'settings', settingsTab: 'updates' }
```

Run the test again — expected PASS.

- [ ] **Step 4: Thread through LauncherApp** — `LauncherApp.tsx`:

Add `import type { SettingsTab } from '../views/SettingsView'` and state near the `view` state (`~line 72`):

```ts
  const [settingsLandingTab, setSettingsLandingTab] = useState<SettingsTab>('scanning')
```

In `applyNav` (the `useCallback` around line 125), before `setView(next.view)`:

```ts
    setSettingsLandingTab(next.settingsTab ?? 'scanning')
```

In the footer gear toggle (`~line 1200`, `onClick={() => setView(view === 'settings' ? 'list' : 'settings')}`), reset the landing tab so a manual visit doesn't inherit a stale deep link:

```ts
  onClick={() => {
    setSettingsLandingTab('scanning')
    setView(view === 'settings' ? 'list' : 'settings')
  }}
```

In the `<SettingsView` render (`~line 820`) add:

```tsx
              initialTab={settingsLandingTab}
```

(`SettingsView` unmounts whenever `view !== 'settings'`, so the `useState(initialTab ?? 'scanning')` initializer re-runs on every entry — no effect needed.)

- [ ] **Step 5: Verify**

Run: `pnpm typecheck && pnpm vitest run src/renderer/src/launcher/LauncherApp/launcherNav.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/launcher/LauncherApp
git commit -m "feat(updater): settings-updates deep link from panel banner to Updates tab"
```

---

### Task 11: Full verification, STATUS.html, PR

**Files:**
- Modify: `STATUS.html` (STATUS data block only)

- [ ] **Step 1: Full local CI**

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Expected: all pass. Fix anything that fails before proceeding.

- [ ] **Step 2: Update STATUS.html** (per project rules): bump `updated` to today, add a roadmap item `In-app auto-update (check silently, click to download, click to install)` with status `progress` (flips to `done` when the PR merges), add a `userActions` entry: review the auto-update PR AND manually test the update flow with a signed build (CI cannot). Append a `log` entry. Commit directly:

```bash
git add STATUS.html
git commit -m "docs: STATUS — auto-update feature branch ready for review"
```

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin feat/auto-update
gh pr create --title "feat: in-app auto-update via electron-updater" --body "$(cat <<'EOF'
## What

TidyDisk now updates in place: silent background checks (launch + every 6 h, packaged builds only), then a fully user-driven flow — one click to download, another to restart and install.

- Panel (tray dropdown): compact dismissible banner "v1.2.0 available · 4.2 MB · Jul 20"; clicking deep-links to Settings → Updates. Dismissal is per-version.
- Settings → Updates tab: current version, manual check, release notes from the GitHub release body, Download → progress → Restart and install.
- `UpdaterService` wraps electron-updater (`autoDownload=false`, install-on-quit after a download) behind an injectable interface; state machine unit-tested.
- Translocation (app not in /Applications) detected up front with a friendly fix-it message.
- Analytics: `update_available`, `update_download_clicked`, `update_installed`.
- Release process unchanged: publishing the GitHub release draft remains the go-live switch. Spec: docs/superpowers/specs/2026-07-22-auto-update-design.md

## Manual test checklist (needs a signed build — CI can't do this)

- [ ] Build current version + a fake higher version (`pnpm release` twice, bumping package.json version in between)
- [ ] Publish the higher version as a GitHub prerelease-draft → publish; install the lower one in /Applications
- [ ] Banner appears in panel within ~10 s of launch with version/size/date
- [ ] Banner ✕ hides it; stays hidden after app restart; Settings → Updates still shows the update
- [ ] Banner click opens launcher on Settings → Updates
- [ ] Download shows live percent; Restart and install relaunches on the new version
- [ ] `update_installed` fires on the relaunch (PostHog)
- [ ] Run from ~/Downloads (translocated): friendly "move to Applications" message, no crash

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR created; CI (typecheck + tests + build + unsigned packaging) goes green.

---

## Self-Review Notes

- Spec coverage: service+state machine (T4), IPC/types/settings (T1, T2, T6), banner (T9), Updates tab (T8), deep link (T10), analytics incl. `update_installed` (T5, T6), tests + manual checklist (each task + T11), release process untouched (T11 PR body documents it).
- Deviation from spec recorded in header: `currentVersion`/`checkedAt` hoisted in `UpdaterState`.
- Type consistency: `UpdaterState['status']` is the type `bannerModel` consumes; `SettingsTab` exported from SettingsView and imported by LauncherApp; `AutoUpdaterLike.on` uses `(...args: never[])` so the real `autoUpdater` and the test fake both satisfy it.
