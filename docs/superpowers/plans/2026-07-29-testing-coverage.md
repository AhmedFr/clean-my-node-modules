# Testing Coverage (ratchet + renderer logic + main backfill) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Coverage measurement with a CI-enforced ratchet, tests for all renderer hooks, and tests for the untested high-risk main-process code (deletion, scanner, scheduler, notifier).

**Architecture:** Vitest upgraded to v4 with two projects (node for `src/main|shared|preload`, jsdom for `src/renderer`). One typed mock of the `window.clean` preload bridge (compile-checked against `CleanApi`) backs all hook tests. Coverage uses `@vitest/coverage-v8` with `thresholds.autoUpdate: true` as the ratchet; thresholds are set to the measured baseline only in the final task, after all new tests land.

**Tech Stack:** vitest 4, @vitest/coverage-v8, jsdom, @testing-library/react (renderHook), existing biome/tsc/CI.

**Spec:** `docs/superpowers/specs/2026-07-29-testing-coverage-design.md`

## Global Constraints

- Package manager: **pnpm** (pnpm 11; build-script approvals live in `pnpm-workspace.yaml`).
- All work on branch **`feat/test-coverage`**, lands via PR (main is protected by convention).
- Conventional-commit subjects (`test: …`, `ci: …`, `chore: …`, `docs: …`).
- **No component/UI render tests** — Storybook (parallel effort) owns UI. Hooks and pure logic only.
- Coverage scope: `src/**/*.ts` only; `.tsx`, `*.types.ts`, `*.d.ts`, `**/index.ts`, and the test helper dir are excluded.
- Every task ends with `pnpm test` green; run `pnpm typecheck` and `pnpm lint` before each commit.
- New files follow biome formatting (2-space indent, single quotes in app code — run `pnpm format` if unsure).

---

### Task 1: Branch + vitest 4 upgrade + coverage measurement (no gates yet)

**Files:**
- Modify: `vitest.config.ts`
- Modify: `package.json` (devDependencies, scripts)

**Interfaces:**
- Produces: `pnpm test:coverage` script; coverage config all later tasks run under. No thresholds yet (Task 11 sets them).

- [ ] **Step 1: Create the branch**

```bash
git checkout -b feat/test-coverage
```

- [ ] **Step 2: Upgrade vitest and add the coverage provider**

```bash
pnpm add -D vitest@^4 @vitest/coverage-v8@^4
```

- [ ] **Step 3: Run the existing suite to prove the upgrade is clean**

Run: `pnpm test`
Expected: all 57 existing test files PASS. If any test fails, it is an upgrade behavior change — investigate and fix before continuing (do not delete or skip tests).

- [ ] **Step 4: Add coverage config**

Replace `vitest.config.ts` contents with:

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // mirror the tsconfig path aliases so tests can import shared/renderer code
    alias: {
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@renderer': fileURLToPath(new URL('./src/renderer/src', import.meta.url)),
    },
  },
  test: {
    // only this checkout's sources — keeps temporary worktrees under .claude/ out of runs
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // *.ts only: .tsx (UI) is Storybook's domain and intentionally unmeasured
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.types.ts',
        'src/**/*.d.ts',
        // barrels and bootstrap wiring (src/main/index.ts, src/preload/index.ts)
        'src/**/index.ts',
        'src/renderer/src/test/**',
      ],
      reporter: ['text', 'json-summary'],
    },
  },
})
```

- [ ] **Step 5: Add the coverage script**

In `package.json` scripts, after `"test": "vitest run",` add:

```json
    "test:coverage": "vitest run --coverage",
```

- [ ] **Step 6: Measure the baseline**

Run: `pnpm test:coverage`
Expected: suite passes and a coverage table prints (untested files like `src/main/scanner/scanner.ts` appear at 0%). Note the overall `% Lines` — it will rise through Tasks 3–10.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "chore: upgrade vitest to v4, add v8 coverage measurement"
```

---

### Task 2: Split vitest into node + jsdom projects, add renderHook infra

**Files:**
- Modify: `vitest.config.ts`
- Create: `src/renderer/src/test/setup.ts`
- Modify: `package.json` (devDependencies)

**Interfaces:**
- Produces: a `renderer` vitest project (jsdom env, RTL cleanup) that all hook tests in Tasks 3–6 run under; node project for `src/main|shared|preload`.

- [ ] **Step 1: Add jsdom + testing-library**

```bash
pnpm add -D jsdom @testing-library/react
```

(`react-dom` is already a runtime dependency; RTL 16 works with React 18.)

- [ ] **Step 2: Create the renderer test setup file**

Create `src/renderer/src/test/setup.ts`:

```ts
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest globals are off in this repo, so RTL's auto-cleanup never registers.
afterEach(cleanup)
```

- [ ] **Step 3: Split the config into two projects**

In `vitest.config.ts`, replace the `test` block (keep the `coverage` object exactly as written in Task 1) with:

```ts
  test: {
    coverage: {
      /* unchanged from Task 1 */
    },
    projects: [
      {
        extends: true, // inherit root resolve.alias
        test: {
          name: 'node',
          include: ['src/main/**/*.test.ts', 'src/shared/**/*.test.ts', 'src/preload/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'renderer',
          environment: 'jsdom',
          include: ['src/renderer/**/*.test.ts'],
          setupFiles: ['src/renderer/src/test/setup.ts'],
        },
      },
    ],
  },
```

- [ ] **Step 4: Verify both projects run**

Run: `pnpm test`
Expected: PASS; output shows tests tagged `|node|` and `|renderer|`, same total file count as before (renderer tests like `colors.test.ts` now run under jsdom — they are pure logic and must still pass).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/renderer/src/test/setup.ts
git commit -m "test: split vitest into node + jsdom projects, add RTL setup"
```

---

### Task 3: Typed `window.clean` bridge mock + first hook test (useProjects)

**Files:**
- Create: `src/renderer/src/test/mock-clean-bridge.ts`
- Test: `src/renderer/src/hooks/useProjects.test.ts`

**Interfaces:**
- Consumes: `CleanApi` from `src/preload/api.types.ts` (already in tsconfig.web's include).
- Produces (used by Tasks 4–6):
  - `installMockClean(): MockClean` — installs a fully-stubbed bridge on `window.clean`, returns `{ api, emit, listeners }`.
  - `emit.projectsChanged(p: Project[])`, `emit.settingsChanged(s: Settings)`, `emit.licenseChanged(s: LicenseState)`, `emit.updaterState(s: UpdaterState)`, `emit.scanProgress(p: ScanProgress)`, `emit.launcherNavigate(nav: LauncherNavTarget)` — push subscription events.
  - `listeners.projects | settings | license | updater | scanProgress | launcherNavigate: number` — live listener counts for unsubscribe assertions.
  - `makeProject(over?: Partial<Project>): Project` — fixture factory.
  - Per-test overrides use `vi.mocked(window.clean.method).mockResolvedValue(...)`.

- [ ] **Step 1: Write the failing test**

Create `src/renderer/src/hooks/useProjects.test.ts`:

```ts
import type { Project } from '@shared/project.types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean, makeProject, type MockClean } from '../test/mock-clean-bridge'
import { useProjects } from './useProjects'

let bridge: MockClean
beforeEach(() => {
  bridge = installMockClean()
})

describe('useProjects', () => {
  it('loads the initial inventory then follows change events', async () => {
    const first = [makeProject({ id: 'a' })]
    vi.mocked(window.clean.getProjects).mockResolvedValue(first)
    const { result } = renderHook(() => useProjects())
    expect(result.current).toEqual([])
    await waitFor(() => expect(result.current).toEqual(first))

    const next = [makeProject({ id: 'b' })]
    act(() => bridge.emit.projectsChanged(next))
    expect(result.current).toEqual(next)
  })

  it('unsubscribes on unmount and ignores a late initial fetch', async () => {
    let resolve!: (p: Project[]) => void
    vi.mocked(window.clean.getProjects).mockReturnValue(
      new Promise<Project[]>((r) => {
        resolve = r
      }),
    )
    const { unmount } = renderHook(() => useProjects())
    expect(bridge.listeners.projects).toBe(1)
    unmount()
    expect(bridge.listeners.projects).toBe(0)
    // the `alive` guard: resolving after unmount must not throw or set state
    await act(async () => resolve([makeProject()]))
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run --project renderer src/renderer/src/hooks/useProjects.test.ts`
Expected: FAIL — cannot resolve `../test/mock-clean-bridge`.

- [ ] **Step 3: Implement the mock bridge**

Create `src/renderer/src/test/mock-clean-bridge.ts`:

```ts
import type { LauncherNavTarget } from '@shared/launcher-nav.types'
import type { LicenseState } from '@shared/license.types'
import type { Project, ScanProgress } from '@shared/project.types'
import { DEFAULT_SETTINGS } from '@shared/settings.constants'
import type { Settings } from '@shared/settings.types'
import type { UpdaterState } from '@shared/updater.types'
import { vi } from 'vitest'
import type { CleanApi } from '../../../preload/api.types'

/** One subscription channel: records listeners, exposes an emitter and a live count. */
function channel<T>(): {
  on: (fn: (v: T) => void) => () => void
  emit: (v: T) => void
  readonly count: number
} {
  const listeners = new Set<(v: T) => void>()
  return {
    on: (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    emit: (v) => {
      for (const fn of listeners) fn(v)
    },
    get count() {
      return listeners.size
    },
  }
}

export interface MockClean {
  /** The bridge installed on window.clean; override per test via vi.mocked(window.clean.method). */
  api: CleanApi
  /** Push subscription events, as the main process would. */
  emit: {
    scanProgress: (p: ScanProgress) => void
    projectsChanged: (p: Project[]) => void
    settingsChanged: (s: Settings) => void
    licenseChanged: (s: LicenseState) => void
    launcherNavigate: (nav: LauncherNavTarget) => void
    updaterState: (s: UpdaterState) => void
  }
  /** Live listener counts, for asserting unsubscription on unmount. */
  listeners: {
    scanProgress: number
    projects: number
    settings: number
    license: number
    launcherNavigate: number
    updater: number
  }
}

export function makeProject(over: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'demo',
    path: '~/code/demo',
    absPath: '/Users/me/code/demo',
    kind: 'node',
    size: 1024,
    lastUsed: 0,
    ...over,
  }
}

/**
 * Installs a fully-stubbed window.clean. Typed against the real CleanApi, so any
 * preload bridge change breaks this file at typecheck time — the compiler, not
 * discipline, keeps the mock in sync.
 */
export function installMockClean(): MockClean {
  const scanProgress = channel<ScanProgress>()
  const projects = channel<Project[]>()
  const settings = channel<Settings>()
  const license = channel<LicenseState>()
  const nav = channel<LauncherNavTarget>()
  const updater = channel<UpdaterState>()

  const api: CleanApi = {
    getProjects: vi.fn(async () => []),
    getLastScanTime: vi.fn(async () => 0),
    getPnpmStore: vi.fn(async () => ({
      available: false,
      path: null,
      displayPath: '',
      sizeBytes: 0,
      checkedAt: 0,
      source: 'none' as const,
      canPrune: false,
    })),
    prunePnpmStore: vi.fn(async () => ({ ok: true, freedBytes: 0 })),
    getDocker: vi.fn(async () => ({ available: false, checkedAt: 0, totals: [], items: [], projects: [] })),
    removeDockerItem: vi.fn(async () => ({ ok: true, freedBytes: 0 })),
    pruneDocker: vi.fn(async () => ({ ok: true, freedBytes: 0 })),
    getPackages: vi.fn(async () => null),
    computePackages: vi.fn(async () => ({ packages: [], computedAt: 0, projectCount: 0 })),
    openExternal: vi.fn(async () => {}),
    scan: vi.fn(async () => {}),
    deleteNodeModules: vi.fn(async () => ({ freed: 0 })),
    deleteManyNodeModules: vi.fn(async () => ({ freed: 0, blockedIds: [] })),
    revealInFinder: vi.fn(async () => {}),
    openProject: vi.fn(async () => {}),
    getSettings: vi.fn(async () => DEFAULT_SETTINGS),
    setSetting: vi.fn(async () => DEFAULT_SETTINGS),
    listVolumes: vi.fn(async () => []),
    getLiveProjects: vi.fn(async () => ({})),
    getLicense: vi.fn(async () => ({ pro: false })),
    activateLicense: vi.fn(async () => ({ ok: false as const, reason: 'invalid' as const })),
    copyShareCard: vi.fn(async () => ({ ok: true })),
    openLauncher: vi.fn(async () => {}),
    consumeLauncherNav: vi.fn(async () => null),
    getUpdaterState: vi.fn(async () => ({
      currentVersion: '0.0.0',
      checkedAt: null,
      status: { phase: 'idle' as const },
    })),
    updaterCheck: vi.fn(async () => {}),
    updaterDownload: vi.fn(async () => {}),
    updaterInstall: vi.fn(async () => {}),
    closeWindow: vi.fn(async () => {}),
    setWindowHeight: vi.fn(),
    quitApp: vi.fn(),
    uninstall: vi.fn(async () => {}),
    pickPath: vi.fn(async () => null),
    trackEvent: vi.fn(),
    onScanProgress: vi.fn(scanProgress.on),
    onProjectsChanged: vi.fn(projects.on),
    onSettingsChanged: vi.fn(settings.on),
    onLicenseChanged: vi.fn(license.on),
    onLauncherNavigate: vi.fn(nav.on),
    onUpdaterState: vi.fn(updater.on),
  }

  window.clean = api
  return {
    api,
    emit: {
      scanProgress: scanProgress.emit,
      projectsChanged: projects.emit,
      settingsChanged: settings.emit,
      licenseChanged: license.emit,
      launcherNavigate: nav.emit,
      updaterState: updater.emit,
    },
    listeners: {
      get scanProgress() {
        return scanProgress.count
      },
      get projects() {
        return projects.count
      },
      get settings() {
        return settings.count
      },
      get license() {
        return license.count
      },
      get launcherNavigate() {
        return nav.count
      },
      get updater() {
        return updater.count
      },
    },
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run --project renderer src/renderer/src/hooks/useProjects.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck + full suite**

Run: `pnpm typecheck && pnpm test`
Expected: both PASS. (Typecheck is the point: the mock must satisfy `CleanApi` under tsconfig.web.)

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/test/mock-clean-bridge.ts src/renderer/src/hooks/useProjects.test.ts
git commit -m "test: typed window.clean bridge mock + useProjects hook tests"
```

---

### Task 4: Subscription hooks — useLicense, useSettings, useUpdater, useScanProgress

**Files:**
- Test: `src/renderer/src/hooks/useLicense.test.ts`
- Test: `src/renderer/src/hooks/useSettings.test.ts`
- Test: `src/renderer/src/hooks/useUpdater.test.ts`
- Test: `src/renderer/src/hooks/useScanProgress.test.ts`

**Interfaces:**
- Consumes: `installMockClean`, `MockClean` from `../test/mock-clean-bridge` (Task 3).

For each file below: write the test file, run `pnpm vitest run --project renderer <file>` (expect FAIL only if you typo an import — these hooks already exist, so tests should pass on first run if correct; a failing assertion means your test encodes the behavior wrong — re-read the hook), then move on. Commit once at the end.

- [ ] **Step 1: useLicense tests**

Create `src/renderer/src/hooks/useLicense.test.ts`:

```ts
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean, type MockClean } from '../test/mock-clean-bridge'
import { useLicense } from './useLicense'

let bridge: MockClean
beforeEach(() => {
  bridge = installMockClean()
})

describe('useLicense', () => {
  it('starts free, loads the stored state, follows change broadcasts', async () => {
    vi.mocked(window.clean.getLicense).mockResolvedValue({ pro: true, email: 'a@b.c' })
    const { result } = renderHook(() => useLicense())
    expect(result.current.license).toEqual({ pro: false })
    await waitFor(() => expect(result.current.license.pro).toBe(true))

    act(() => bridge.emit.licenseChanged({ pro: false, needsReverify: true }))
    expect(result.current.license.needsReverify).toBe(true)
  })

  it('activate() applies the returned state on success and not on failure', async () => {
    const { result } = renderHook(() => useLicense())
    vi.mocked(window.clean.activateLicense).mockResolvedValue({ ok: false, reason: 'network' })
    await act(async () => {
      const r = await result.current.activate('bad-key')
      expect(r.ok).toBe(false)
    })
    expect(result.current.license.pro).toBe(false)

    vi.mocked(window.clean.activateLicense).mockResolvedValue({ ok: true, state: { pro: true } })
    await act(async () => {
      await result.current.activate('good-key')
    })
    expect(result.current.license.pro).toBe(true)
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useLicense())
    expect(bridge.listeners.license).toBe(1)
    unmount()
    expect(bridge.listeners.license).toBe(0)
  })
})
```

- [ ] **Step 2: useSettings tests**

Create `src/renderer/src/hooks/useSettings.test.ts`:

```ts
import { DEFAULT_SETTINGS } from '@shared/settings.constants'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean, type MockClean } from '../test/mock-clean-bridge'
import { useSettings } from './useSettings'

let bridge: MockClean
beforeEach(() => {
  bridge = installMockClean()
})

describe('useSettings', () => {
  it('serves defaults until the first fetch resolves, then flips loaded', async () => {
    vi.mocked(window.clean.getSettings).mockResolvedValue({ ...DEFAULT_SETTINGS, thresholdGB: 42 })
    const { result } = renderHook(() => useSettings())
    expect(result.current[0]).toEqual(DEFAULT_SETTINGS)
    expect(result.current[2]).toBe(false)
    await waitFor(() => expect(result.current[2]).toBe(true))
    expect(result.current[0].thresholdGB).toBe(42)
  })

  it('setSetting applies optimistically and forwards to the bridge', async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current[2]).toBe(true))
    act(() => {
      void result.current[1]('scanInterval', 'manual')
    })
    // optimistic: local state updated before the IPC round-trip resolves
    expect(result.current[0].scanInterval).toBe('manual')
    expect(vi.mocked(window.clean.setSetting)).toHaveBeenCalledWith('scanInterval', 'manual')
  })

  it('follows settings broadcasts and unsubscribes on unmount', async () => {
    const { result, unmount } = renderHook(() => useSettings())
    act(() => bridge.emit.settingsChanged({ ...DEFAULT_SETTINGS, notify: false }))
    expect(result.current[0].notify).toBe(false)
    expect(bridge.listeners.settings).toBe(1)
    unmount()
    expect(bridge.listeners.settings).toBe(0)
  })
})
```

- [ ] **Step 3: useUpdater tests**

Create `src/renderer/src/hooks/useUpdater.test.ts`:

```ts
import type { UpdaterState } from '@shared/updater.types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean, type MockClean } from '../test/mock-clean-bridge'
import { useUpdater } from './useUpdater'

let bridge: MockClean
beforeEach(() => {
  bridge = installMockClean()
})

const downloaded: UpdaterState = {
  currentVersion: '1.1.0',
  checkedAt: 123,
  status: {
    phase: 'downloaded',
    info: { version: '1.2.0', releaseDate: '', sizeBytes: 0, notes: null },
  },
}

describe('useUpdater', () => {
  it('fetches the snapshot then follows state broadcasts', async () => {
    vi.mocked(window.clean.getUpdaterState).mockResolvedValue({
      currentVersion: '1.1.0',
      checkedAt: null,
      status: { phase: 'idle' },
    })
    const { result } = renderHook(() => useUpdater())
    await waitFor(() => expect(result.current.state.currentVersion).toBe('1.1.0'))
    act(() => bridge.emit.updaterState(downloaded))
    expect(result.current.state.status.phase).toBe('downloaded')
  })

  it('exposes the three actions as bridge passthroughs', () => {
    const { result } = renderHook(() => useUpdater())
    result.current.check()
    result.current.download()
    result.current.install()
    expect(vi.mocked(window.clean.updaterCheck)).toHaveBeenCalledOnce()
    expect(vi.mocked(window.clean.updaterDownload)).toHaveBeenCalledOnce()
    expect(vi.mocked(window.clean.updaterInstall)).toHaveBeenCalledOnce()
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useUpdater())
    expect(bridge.listeners.updater).toBe(1)
    unmount()
    expect(bridge.listeners.updater).toBe(0)
  })
})
```

- [ ] **Step 4: useScanProgress tests**

Create `src/renderer/src/hooks/useScanProgress.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { installMockClean, type MockClean } from '../test/mock-clean-bridge'
import { useScanProgress } from './useScanProgress'

let bridge: MockClean
beforeEach(() => {
  bridge = installMockClean()
})

describe('useScanProgress', () => {
  it('is null until an event arrives, then mirrors the latest event', () => {
    const { result } = renderHook(() => useScanProgress())
    expect(result.current).toBeNull()
    act(() => bridge.emit.scanProgress({ foldersChecked: 5, currentPath: '/a', done: false }))
    expect(result.current?.foldersChecked).toBe(5)
    act(() => bridge.emit.scanProgress({ foldersChecked: 9, currentPath: '', done: true }))
    expect(result.current?.done).toBe(true)
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useScanProgress())
    expect(bridge.listeners.scanProgress).toBe(1)
    unmount()
    expect(bridge.listeners.scanProgress).toBe(0)
  })
})
```

- [ ] **Step 5: Run, verify, commit**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS.

```bash
git add src/renderer/src/hooks/*.test.ts
git commit -m "test: subscription hooks (useLicense, useSettings, useUpdater, useScanProgress)"
```

---

### Task 5: Fetch/action hooks — useDocker, usePnpmStore, usePackages, usePackagesTab

**Files:**
- Test: `src/renderer/src/hooks/useDocker.test.ts`
- Test: `src/renderer/src/hooks/usePnpmStore.test.ts`
- Test: `src/renderer/src/hooks/usePackages.test.ts`
- Test: `src/renderer/src/hooks/usePackagesTab.test.ts`

**Interfaces:**
- Consumes: `installMockClean` from Task 3; `DockerActionResult`, `DockerInfo` from `@shared/docker.types`; `PackageEntry`, `PackageInventory` from `@shared/package.types`.

- [ ] **Step 1: useDocker tests**

Create `src/renderer/src/hooks/useDocker.test.ts`:

```ts
import type { DockerActionResult, DockerInfo } from '@shared/docker.types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean } from '../test/mock-clean-bridge'
import { useDocker } from './useDocker'

const info = (checkedAt: number): DockerInfo => ({
  available: true,
  checkedAt,
  totals: [],
  items: [],
  projects: [],
})

beforeEach(() => {
  installMockClean()
})

describe('useDocker', () => {
  it('loads once on mount and clears loading', async () => {
    vi.mocked(window.clean.getDocker).mockResolvedValue(info(1))
    const { result } = renderHook(() => useDocker())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.info?.checkedAt).toBe(1)
    expect(vi.mocked(window.clean.getDocker)).toHaveBeenCalledWith()
  })

  it('remove() sets busyId for the item, refreshes with force, then clears', async () => {
    vi.mocked(window.clean.getDocker).mockResolvedValue(info(1))
    const { result } = renderHook(() => useDocker())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let resolveRemove!: (r: DockerActionResult) => void
    vi.mocked(window.clean.removeDockerItem).mockReturnValue(
      new Promise<DockerActionResult>((r) => {
        resolveRemove = r
      }),
    )
    vi.mocked(window.clean.getDocker).mockResolvedValue(info(2))
    act(() => {
      void result.current.remove('image', 'img1')
    })
    expect(result.current.busyId).toBe('img1')
    await act(async () => resolveRemove({ ok: true, freedBytes: 10 }))
    await waitFor(() => expect(result.current.busyId).toBeNull())
    expect(vi.mocked(window.clean.getDocker)).toHaveBeenLastCalledWith(true)
    expect(result.current.info?.checkedAt).toBe(2)
  })

  it('prune() marks busy as prune:<target> and clears even when the call rejects', async () => {
    const { result } = renderHook(() => useDocker())
    await waitFor(() => expect(result.current.loading).toBe(false))
    vi.mocked(window.clean.pruneDocker).mockRejectedValue(new Error('boom'))
    await act(async () => {
      await expect(result.current.prune('buildCache')).rejects.toThrow('boom')
    })
    expect(result.current.busyId).toBeNull()
  })
})
```

- [ ] **Step 2: usePnpmStore tests**

Create `src/renderer/src/hooks/usePnpmStore.test.ts`:

```ts
import type { PnpmStoreInfo } from '@shared/pnpm-store.types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean } from '../test/mock-clean-bridge'
import { usePnpmStore } from './usePnpmStore'

const store = (sizeBytes: number): PnpmStoreInfo => ({
  available: true,
  path: '/store',
  displayPath: '~/store',
  sizeBytes,
  checkedAt: 1,
  source: 'pnpm',
  canPrune: true,
})

beforeEach(() => {
  installMockClean()
})

describe('usePnpmStore', () => {
  it('loads on mount and clears loading', async () => {
    vi.mocked(window.clean.getPnpmStore).mockResolvedValue(store(100))
    const { result } = renderHook(() => usePnpmStore())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.store?.sizeBytes).toBe(100)
  })

  it('prune() re-reads the store and reports the result', async () => {
    vi.mocked(window.clean.getPnpmStore).mockResolvedValue(store(100))
    const { result } = renderHook(() => usePnpmStore())
    await waitFor(() => expect(result.current.loading).toBe(false))
    vi.mocked(window.clean.prunePnpmStore).mockResolvedValue({ ok: true, freedBytes: 40 })
    vi.mocked(window.clean.getPnpmStore).mockResolvedValue(store(60))
    await act(async () => {
      const r = await result.current.prune()
      expect(r).toEqual({ ok: true, freedBytes: 40 })
    })
    expect(result.current.store?.sizeBytes).toBe(60)
    expect(result.current.pruning).toBe(false)
  })

  it('prune() swallows failures and returns null', async () => {
    const { result } = renderHook(() => usePnpmStore())
    await waitFor(() => expect(result.current.loading).toBe(false))
    vi.mocked(window.clean.prunePnpmStore).mockRejectedValue(new Error('no pnpm'))
    await act(async () => {
      expect(await result.current.prune()).toBeNull()
    })
    expect(result.current.pruning).toBe(false)
  })

  it('refresh() forces a re-measure', async () => {
    const { result } = renderHook(() => usePnpmStore())
    await waitFor(() => expect(result.current.loading).toBe(false))
    vi.mocked(window.clean.getPnpmStore).mockResolvedValue(store(7))
    await act(async () => result.current.refresh())
    expect(vi.mocked(window.clean.getPnpmStore)).toHaveBeenLastCalledWith(true)
    expect(result.current.store?.sizeBytes).toBe(7)
  })
})
```

- [ ] **Step 3: usePackages tests**

Create `src/renderer/src/hooks/usePackages.test.ts`:

```ts
import type { PackageInventory } from '@shared/package.types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean } from '../test/mock-clean-bridge'
import { usePackages } from './usePackages'

const inv = (computedAt: number): PackageInventory => ({ packages: [], computedAt, projectCount: 0 })

beforeEach(() => {
  installMockClean()
})

describe('usePackages', () => {
  it('shows a cached inventory immediately when main has one', async () => {
    vi.mocked(window.clean.getPackages).mockResolvedValue(inv(1))
    const { result } = renderHook(() => usePackages())
    await waitFor(() => expect(result.current.inventory?.computedAt).toBe(1))
    expect(vi.mocked(window.clean.computePackages)).not.toHaveBeenCalled()
  })

  it('ensure() computes exactly once, refresh() forces', async () => {
    vi.mocked(window.clean.computePackages).mockResolvedValue(inv(2))
    const { result } = renderHook(() => usePackages())
    await act(async () => {
      result.current.ensure()
      result.current.ensure()
    })
    expect(vi.mocked(window.clean.computePackages)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(window.clean.computePackages)).toHaveBeenCalledWith(false)
    expect(result.current.inventory?.computedAt).toBe(2)

    vi.mocked(window.clean.computePackages).mockResolvedValue(inv(3))
    await act(async () => result.current.refresh())
    expect(vi.mocked(window.clean.computePackages)).toHaveBeenLastCalledWith(true)
    expect(result.current.inventory?.computedAt).toBe(3)
    expect(result.current.computing).toBe(false)
  })
})
```

- [ ] **Step 4: usePackagesTab tests**

Create `src/renderer/src/hooks/usePackagesTab.test.ts`:

```ts
import type { PackageEntry, PackageInventory } from '@shared/package.types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean } from '../test/mock-clean-bridge'
import { usePackagesTab } from './usePackagesTab'

function entry(name: string, over: Partial<PackageEntry> = {}): PackageEntry {
  return { name, usages: [], projectCount: 1, versions: ['1.0.0'], multipleVersions: false, ...over }
}

const inventory: PackageInventory = {
  packages: [
    entry('react', { projectCount: 5, size: 10 }),
    entry('lodash', { projectCount: 2, size: 300, outdated: true }),
    entry('axios', {
      projectCount: 3,
      size: 50,
      advisory: { severity: 'high', title: 'ssrf', vulnerableVersions: '<1' },
    }),
  ],
  computedAt: 1,
  projectCount: 5,
}

beforeEach(() => {
  installMockClean()
  vi.mocked(window.clean.getPackages).mockResolvedValue(inventory)
})

function mount(query = '', active = true) {
  return renderHook(({ q, a }) => usePackagesTab(q, a), { initialProps: { q: query, a: active } })
}

describe('usePackagesTab', () => {
  it('computes on first activation only', async () => {
    const { rerender } = mount('', false)
    expect(vi.mocked(window.clean.computePackages)).not.toHaveBeenCalled()
    rerender({ q: '', a: true })
    await waitFor(() => expect(vi.mocked(window.clean.computePackages)).toHaveBeenCalledTimes(1))
    rerender({ q: '', a: false })
    rerender({ q: '', a: true })
    expect(vi.mocked(window.clean.computePackages)).toHaveBeenCalledTimes(1)
  })

  it('default sort is by projectCount; size/name/updates re-sort', async () => {
    const { result } = mount()
    await waitFor(() => expect(result.current.filtered).toHaveLength(3))
    expect(result.current.filtered.map((p) => p.name)).toEqual(['react', 'axios', 'lodash'])
    act(() => result.current.setSortBy('size'))
    expect(result.current.filtered.map((p) => p.name)).toEqual(['lodash', 'axios', 'react'])
    act(() => result.current.setSortBy('name'))
    expect(result.current.filtered.map((p) => p.name)).toEqual(['axios', 'lodash', 'react'])
    act(() => result.current.setSortBy('updates'))
    // advisory (2) beats outdated (1) beats clean (0)
    expect(result.current.filtered.map((p) => p.name)).toEqual(['axios', 'lodash', 'react'])
  })

  it('filters by query and a query change collapses the open panel', async () => {
    const { result, rerender } = mount()
    await waitFor(() => expect(result.current.filtered).toHaveLength(3))
    act(() => result.current.toggleExpand('react'))
    expect(result.current.expandedName).toBe('react')
    rerender({ q: 'lo', a: true })
    expect(result.current.expandedName).toBeNull()
    expect(result.current.filtered.map((p) => p.name)).toEqual(['lodash'])
  })

  it('toggleExpand toggles and collapse clears', async () => {
    const { result } = mount()
    await waitFor(() => expect(result.current.filtered).toHaveLength(3))
    act(() => result.current.toggleExpand('axios'))
    act(() => result.current.toggleExpand('axios'))
    expect(result.current.expandedName).toBeNull()
    act(() => result.current.toggleExpand('axios'))
    act(() => result.current.collapse())
    expect(result.current.expandedName).toBeNull()
  })
})
```

- [ ] **Step 5: Run, verify, commit**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS.

```bash
git add src/renderer/src/hooks/*.test.ts
git commit -m "test: fetch/action hooks (useDocker, usePnpmStore, usePackages, usePackagesTab)"
```

---

### Task 6: Timer/observer hooks — useToast, useLiveProjects, useAutoHeight

**Files:**
- Test: `src/renderer/src/hooks/useToast.test.ts`
- Test: `src/renderer/src/hooks/useLiveProjects/useLiveProjects.test.ts`
- Test: `src/renderer/src/hooks/useAutoHeight.test.ts`

**Interfaces:**
- Consumes: `installMockClean` from Task 3; fake timers via `vi.useFakeTimers()`.

- [ ] **Step 1: useToast tests**

Create `src/renderer/src/hooks/useToast.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToast } from './useToast'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useToast', () => {
  it('shows the toast then auto-clears after 2400ms', () => {
    const { result } = renderHook(() => useToast<string>())
    expect(result.current.toast).toBeNull()
    act(() => result.current.flashToast('saved'))
    expect(result.current.toast).toBe('saved')
    act(() => vi.advanceTimersByTime(2399))
    expect(result.current.toast).toBe('saved')
    act(() => vi.advanceTimersByTime(1))
    expect(result.current.toast).toBeNull()
  })

  it('re-flashing replaces the toast and restarts the clock', () => {
    const { result } = renderHook(() => useToast<string>())
    act(() => result.current.flashToast('first'))
    act(() => vi.advanceTimersByTime(2000))
    act(() => result.current.flashToast('second'))
    act(() => vi.advanceTimersByTime(2000))
    expect(result.current.toast).toBe('second')
    act(() => vi.advanceTimersByTime(400))
    expect(result.current.toast).toBeNull()
  })
})
```

- [ ] **Step 2: useLiveProjects tests**

Create `src/renderer/src/hooks/useLiveProjects/useLiveProjects.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean } from '../../test/mock-clean-bridge'
import { useLiveProjects } from './useLiveProjects'

beforeEach(() => {
  installMockClean()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('useLiveProjects', () => {
  it('fetches immediately, then re-polls every 45s', async () => {
    vi.mocked(window.clean.getLiveProjects).mockResolvedValue({ a: { pid: 1, command: 'node' } })
    const { result } = renderHook(() => useLiveProjects())
    await act(async () => {}) // flush the initial tick's promise
    expect(result.current).toEqual({ a: { pid: 1, command: 'node' } })

    vi.mocked(window.clean.getLiveProjects).mockResolvedValue({})
    await act(async () => {
      vi.advanceTimersByTime(45_000)
    })
    expect(result.current).toEqual({})
    expect(vi.mocked(window.clean.getLiveProjects)).toHaveBeenCalledTimes(2)
  })

  it('stops polling and ignores late results after unmount', async () => {
    const { unmount } = renderHook(() => useLiveProjects())
    await act(async () => {})
    unmount()
    await act(async () => {
      vi.advanceTimersByTime(45_000 * 3)
    })
    expect(vi.mocked(window.clean.getLiveProjects)).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 3: useAutoHeight tests**

Create `src/renderer/src/hooks/useAutoHeight.test.ts`:

```ts
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean } from '../test/mock-clean-bridge'
import { useAutoHeight } from './useAutoHeight'

const observers: Array<{ observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = []

beforeEach(() => {
  installMockClean()
  observers.length = 0
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      disconnect = vi.fn()
      constructor() {
        observers.push(this)
      }
    },
  )
})

describe('useAutoHeight', () => {
  it('syncs the window height to the element layout box and observes resizes', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'offsetHeight', { value: 240 })
    const { unmount } = renderHook(() => useAutoHeight({ current: el }))
    expect(vi.mocked(window.clean.setWindowHeight)).toHaveBeenCalledWith(240)
    expect(observers).toHaveLength(1)
    expect(observers[0].observe).toHaveBeenCalledWith(el)
    unmount()
    expect(observers[0].disconnect).toHaveBeenCalledOnce()
  })

  it('does nothing when the ref is empty', () => {
    renderHook(() => useAutoHeight({ current: null }))
    expect(vi.mocked(window.clean.setWindowHeight)).not.toHaveBeenCalled()
    expect(observers).toHaveLength(0)
  })
})
```

- [ ] **Step 4: Run, verify, commit**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS. (Note: `lib/staleness/staleness.ts` is a single exported constant with no logic — the spec's mention is satisfied by coverage picking it up via imports; no test file.)

```bash
git add src/renderer/src/hooks
git commit -m "test: timer/observer hooks (useToast, useLiveProjects, useAutoHeight)"
```

---

### Task 7: Deletion safety — project-actions tests

**Files:**
- Test: `src/main/actions/project-actions.test.ts`

**Interfaces:**
- Consumes: `deleteNodeModules`, `guardExists`, `revealInFinder`, `openProject` from `src/main/actions/project-actions.ts`; `makeProject`-equivalent fixture built inline (renderer test helpers are not imported into main tests).

- [ ] **Step 1: Write the tests**

Create `src/main/actions/project-actions.test.ts`:

```ts
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Project } from '@shared/project.types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  trashItem: vi.fn(async (_p: string) => {}),
  showItemInFolder: vi.fn((_p: string) => {}),
  openPath: vi.fn(async (_p: string) => ''),
  execFileFails: { value: false },
}))

vi.mock('electron', () => ({
  shell: {
    trashItem: mocks.trashItem,
    showItemInFolder: mocks.showItemInFolder,
    openPath: mocks.openPath,
  },
}))

vi.mock('node:child_process', () => ({
  execFile: (_cmd: string, _args: string[], cb: (err: Error | null, stdout: string, stderr: string) => void) => {
    cb(mocks.execFileFails.value ? new Error('open failed') : null, '', '')
  },
}))

import { deleteNodeModules, guardExists, openProject, revealInFinder } from './project-actions'

function project(over: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'demo',
    path: '~/code/demo',
    absPath: '/Users/me/code/demo',
    kind: 'node',
    size: 4096,
    lastUsed: 0,
    ...over,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.execFileFails.value = false
})

describe('deleteNodeModules', () => {
  it('trashes exactly <absPath>/node_modules — never anything else — and reports freed bytes', async () => {
    const p = project()
    const freed = await deleteNodeModules(p)
    expect(mocks.trashItem).toHaveBeenCalledTimes(1)
    expect(mocks.trashItem).toHaveBeenCalledWith('/Users/me/code/demo/node_modules')
    expect(freed).toBe(4096)
  })

  it('propagates trash failures instead of reporting success', async () => {
    mocks.trashItem.mockRejectedValueOnce(new Error('EPERM'))
    await expect(deleteNodeModules(project())).rejects.toThrow('EPERM')
  })
})

describe('guardExists', () => {
  let dir: string
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tidy-guard-'))
  })
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('passes (null) when node_modules exists on disk', async () => {
    const nm = join(dir, 'node_modules')
    await mkdir(nm)
    expect(guardExists(nm)).toBeNull()
  })

  it('blocks as unmounted when the path vanished since the scan', () => {
    expect(guardExists(join(dir, 'node_modules'))).toEqual({ freed: 0, blocked: 'unmounted' })
  })
})

describe('revealInFinder', () => {
  it('reveals the node_modules folder itself', () => {
    revealInFinder(project())
    expect(mocks.showItemInFolder).toHaveBeenCalledWith('/Users/me/code/demo/node_modules')
  })
})

describe('openProject', () => {
  it('opens in VS Code when available', async () => {
    await openProject(project())
    expect(mocks.openPath).not.toHaveBeenCalled()
  })

  it('falls back to Finder when the editor launch fails', async () => {
    mocks.execFileFails.value = true
    await openProject(project())
    expect(mocks.openPath).toHaveBeenCalledWith('/Users/me/code/demo')
  })
})
```

- [ ] **Step 2: Run to verify**

Run: `pnpm vitest run --project node src/main/actions/project-actions.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 3: Commit**

```bash
git add src/main/actions/project-actions.test.ts
git commit -m "test: project-actions deletion safety (exact trash path, guard, fallbacks)"
```

---

### Task 8: ScanScheduler + ThresholdNotifier tests

**Files:**
- Test: `src/main/scheduler/scan-scheduler.test.ts`
- Test: `src/main/notifications/threshold-notifier.test.ts`

**Interfaces:**
- Consumes: `ScanScheduler` (constructor takes `runScan: () => void`; methods `apply(interval)`, `stop()`); `ThresholdNotifier` (constructor takes `onOpen: () => void`; method `check(totalBytes, thresholdGB, enabled)`); `SCAN_INTERVAL_MS` from `@shared/settings.constants`; `GB` from `@shared/units.constants`.

- [ ] **Step 1: ScanScheduler tests**

Create `src/main/scheduler/scan-scheduler.test.ts`:

```ts
import { SCAN_INTERVAL_MS } from '@shared/settings.constants'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScanScheduler } from './scan-scheduler'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('ScanScheduler', () => {
  it('re-runs the scan on the configured interval', () => {
    const run = vi.fn()
    const s = new ScanScheduler(run)
    s.apply('6h')
    vi.advanceTimersByTime(SCAN_INTERVAL_MS['6h'])
    expect(run).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(SCAN_INTERVAL_MS['6h'])
    expect(run).toHaveBeenCalledTimes(2)
    s.stop()
  })

  it('manual disables scheduling entirely', () => {
    const run = vi.fn()
    const s = new ScanScheduler(run)
    s.apply('6h')
    s.apply('manual')
    vi.advanceTimersByTime(SCAN_INTERVAL_MS.weekly)
    expect(run).not.toHaveBeenCalled()
  })

  it('re-applying replaces the previous timer instead of stacking', () => {
    const run = vi.fn()
    const s = new ScanScheduler(run)
    s.apply('daily')
    s.apply('daily')
    vi.advanceTimersByTime(SCAN_INTERVAL_MS.daily)
    expect(run).toHaveBeenCalledTimes(1)
    s.stop()
    vi.advanceTimersByTime(SCAN_INTERVAL_MS.daily)
    expect(run).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: ThresholdNotifier tests**

Create `src/main/notifications/threshold-notifier.test.ts`:

```ts
import { GB } from '@shared/units.constants'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  shown: [] as Array<{ title: string; body: string }>,
  clicks: [] as Array<() => void>,
  supported: { value: true },
}))

vi.mock('electron', () => ({
  Notification: class {
    static isSupported = (): boolean => mocks.supported.value
    constructor(private opts: { title: string; body: string }) {}
    on(_event: string, fn: () => void): void {
      mocks.clicks.push(fn)
    }
    show(): void {
      mocks.shown.push(this.opts)
    }
  },
}))

import { ThresholdNotifier } from './threshold-notifier'

beforeEach(() => {
  mocks.shown.length = 0
  mocks.clicks.length = 0
  mocks.supported.value = true
})

describe('ThresholdNotifier', () => {
  it('fires once when usage crosses the threshold, not while it stays over', () => {
    const n = new ThresholdNotifier(() => {})
    n.check(4 * GB, 5, true)
    expect(mocks.shown).toHaveLength(0)
    n.check(6 * GB, 5, true)
    expect(mocks.shown).toHaveLength(1)
    expect(mocks.shown[0].body).toContain('6.00 GB')
    n.check(7 * GB, 5, true)
    expect(mocks.shown).toHaveLength(1)
  })

  it('re-arms after dropping back below the threshold', () => {
    const n = new ThresholdNotifier(() => {})
    n.check(6 * GB, 5, true)
    n.check(4 * GB, 5, true)
    n.check(6 * GB, 5, true)
    expect(mocks.shown).toHaveLength(2)
  })

  it('never fires when disabled or unsupported', () => {
    const n = new ThresholdNotifier(() => {})
    n.check(6 * GB, 5, false)
    mocks.supported.value = false
    n.check(4 * GB, 5, true) // reset below
    n.check(6 * GB, 5, true)
    expect(mocks.shown).toHaveLength(0)
  })

  it('clicking the notification opens the app', () => {
    const onOpen = vi.fn()
    const n = new ThresholdNotifier(onOpen)
    n.check(6 * GB, 5, true)
    mocks.clicks[0]()
    expect(onOpen).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 3: Run, verify, commit**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS.

```bash
git add src/main/scheduler/scan-scheduler.test.ts src/main/notifications/threshold-notifier.test.ts
git commit -m "test: scan scheduler intervals + threshold notifier crossing semantics"
```

---

### Task 9: Scanner integration tests over a real fixture tree

**Files:**
- Test: `src/main/scanner/scanner.test.ts`

**Interfaces:**
- Consumes: `Scanner` class (`scan(roots, onProgress?)`, `isScanning`); its collaborators (`measureNodeModules`, `detectKind`, `resolveProjectName`, `findProjectIcon`) run for real against the fixture — no mocks.

- [ ] **Step 1: Write the tests**

Create `src/main/scanner/scanner.test.ts`:

```ts
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ScanProgress } from '@shared/project.types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Scanner } from './scanner'

let root: string

/** Creates <root>/<rel>/node_modules with one 2KB file so sizes are non-zero. */
async function makeApp(rel: string, name: string): Promise<string> {
  const dir = join(root, rel)
  await mkdir(join(dir, 'node_modules', 'pkg'), { recursive: true })
  await writeFile(join(dir, 'package.json'), JSON.stringify({ name }))
  await writeFile(join(dir, 'node_modules', 'pkg', 'index.js'), 'x'.repeat(2048))
  return dir
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'tidy-scan-'))
})
afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('Scanner', () => {
  it('finds projects, builds entries, and sorts by lastUsed ascending', async () => {
    const aDir = await makeApp('app-a', 'app-a')
    await makeApp('nested/app-b', 'app-b')
    const projects = await new Scanner().scan([root])
    expect(projects.map((p) => p.name).sort()).toEqual(['app-a', 'app-b'])
    const a = projects.find((p) => p.name === 'app-a')
    expect(a?.absPath).toBe(aDir)
    expect(a?.size).toBeGreaterThan(0)
    expect(projects.map((p) => p.lastUsed)).toEqual([...projects.map((p) => p.lastUsed)].sort((x, y) => x - y))
  })

  it('never descends into node_modules or dot-directories', async () => {
    await makeApp('app-a', 'app-a')
    // a nested install inside app-a's node_modules must NOT become a project
    await mkdir(join(root, 'app-a', 'node_modules', 'dep', 'node_modules'), { recursive: true })
    // a project hidden in a dot-directory must NOT be found
    await makeApp('.cache/secret-app', 'secret-app')
    const projects = await new Scanner().scan([root])
    expect(projects.map((p) => p.name)).toEqual(['app-a'])
  })

  it('shares an in-flight scan between concurrent callers', async () => {
    await makeApp('app-a', 'app-a')
    const scanner = new Scanner()
    const p1 = scanner.scan([root])
    const p2 = scanner.scan([root])
    expect(p1).toBe(p2)
    expect(scanner.isScanning).toBe(true)
    await p1
    expect(scanner.isScanning).toBe(false)
  })

  it('emits a final done progress event', async () => {
    await makeApp('app-a', 'app-a')
    const events: ScanProgress[] = []
    await new Scanner().scan([root], (p) => events.push(p))
    expect(events.at(-1)).toMatchObject({ done: true })
    expect(events.at(-1)?.foldersChecked).toBeGreaterThan(0)
  })

  it('survives unreadable roots without throwing', async () => {
    const projects = await new Scanner().scan([join(root, 'does-not-exist')])
    expect(projects).toEqual([])
  })
})
```

- [ ] **Step 2: Run to verify**

Run: `pnpm vitest run --project node src/main/scanner/scanner.test.ts`
Expected: PASS (5 tests). These hit the real filesystem (`du` via `measureNodeModules`) — they run on macOS and on the ubuntu CI runner.

- [ ] **Step 3: Commit**

```bash
git add src/main/scanner/scanner.test.ts
git commit -m "test: scanner walk/build/dedupe semantics over a real fixture tree"
```

---

### Task 10: Small pure files — abbreviate-home, png-encode, window-utils

**Files:**
- Test: `src/main/lib/abbreviate-home.test.ts`
- Test: `src/main/tray/png-encode.test.ts`
- Test: `src/main/windows/window-utils.test.ts`

**Interfaces:**
- Consumes: `abbreviateHome(path, home?)`; `encodePng(rgba: Buffer, width, height): Buffer`; `is.dev` (computed from env at module load — tests must reset modules and stub env before importing).

- [ ] **Step 1: abbreviate-home tests**

Create `src/main/lib/abbreviate-home.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { abbreviateHome } from './abbreviate-home'

describe('abbreviateHome', () => {
  it('replaces the home prefix with ~', () => {
    expect(abbreviateHome('/Users/me/code/app', '/Users/me')).toBe('~/code/app')
  })
  it('leaves non-home paths untouched', () => {
    expect(abbreviateHome('/Volumes/Ext/code', '/Users/me')).toBe('/Volumes/Ext/code')
  })
  it('abbreviates the home directory itself to ~', () => {
    expect(abbreviateHome('/Users/me', '/Users/me')).toBe('~')
  })
})
```

- [ ] **Step 2: png-encode tests**

Create `src/main/tray/png-encode.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { encodePng } from './png-encode'

describe('encodePng', () => {
  it('produces a valid PNG header with the right dimensions', () => {
    const w = 3
    const h = 2
    const png = encodePng(Buffer.alloc(w * h * 4, 0xff), w, h)
    // PNG signature
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    // IHDR chunk starts at byte 8: 4-byte length, 'IHDR', then width/height
    expect(png.subarray(12, 16).toString('ascii')).toBe('IHDR')
    expect(png.readUInt32BE(16)).toBe(w)
    expect(png.readUInt32BE(20)).toBe(h)
    // 8-bit RGBA
    expect(png[24]).toBe(8)
    expect(png[25]).toBe(6)
  })
})
```

- [ ] **Step 3: window-utils tests**

Create `src/main/windows/window-utils.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

// `is.dev` is computed at module load, so each case stubs env then re-imports.
afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

async function loadIsDev(): Promise<boolean> {
  vi.resetModules()
  const { is } = await import('./window-utils')
  return is.dev
}

describe('is.dev', () => {
  it('true when the renderer dev-server URL is set', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', 'http://localhost:5173')
    vi.stubEnv('NODE_ENV', 'production')
    expect(await loadIsDev()).toBe(true)
  })
  it('true in NODE_ENV=development', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', '')
    vi.stubEnv('NODE_ENV', 'development')
    expect(await loadIsDev()).toBe(true)
  })
  it('false in a packaged run', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', '')
    vi.stubEnv('NODE_ENV', 'production')
    expect(await loadIsDev()).toBe(false)
  })
})
```

- [ ] **Step 4: Run, verify, commit**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS.

```bash
git add src/main/lib/abbreviate-home.test.ts src/main/tray/png-encode.test.ts src/main/windows/window-utils.test.ts
git commit -m "test: abbreviate-home, png encoder header, is.dev env detection"
```

Remaining untested main files (`tray.ts`, `glyph-raster.ts`, `liveness.ts`, `pnpm-store.ts`, `registry-client.ts`, `package-store.ts`, window creation, `card-window.ts`, `pick-path.ts`, `app-actions.ts`, `find-project-icon.ts`) are Electron/process glue or network clients per spec section 3.4 — intentionally left to the ratchet; do not mock them to death now.

---

### Task 11: Turn the ratchet on + wire coverage into CI

**Files:**
- Modify: `vitest.config.ts` (add `coverage.thresholds`)
- Modify: `.github/workflows/ci.yml` (unit-test step)

**Interfaces:**
- Consumes: all tests from Tasks 3–10 (thresholds must be set from the *final* baseline, which is why this task is last).

- [ ] **Step 1: Measure the final baseline**

Run: `pnpm test:coverage`
Expected: PASS, with the summary table's `All files` row showing four percentages (Stmts, Branch, Funcs, Lines). Write them down.

- [ ] **Step 2: Add the thresholds**

In `vitest.config.ts`, inside the `coverage` object, add (replace the four numbers with the measured values from Step 1, each rounded DOWN to one decimal so the very next run passes):

```ts
      // Ratchet: CI fails below these; local coverage runs auto-bump them as tests are added.
      thresholds: {
        autoUpdate: true,
        statements: 0, // ← replace with measured baseline, rounded down
        branches: 0, // ← replace with measured baseline, rounded down
        functions: 0, // ← replace with measured baseline, rounded down
        lines: 0, // ← replace with measured baseline, rounded down
      },
```

- [ ] **Step 3: Verify the gate passes and would bump**

Run: `pnpm test:coverage`
Expected: PASS. If `autoUpdate` rewrote the numbers in `vitest.config.ts` upward, keep the rewritten values — that is the ratchet working.

- [ ] **Step 4: Gate CI on coverage**

In `.github/workflows/ci.yml`, replace:

```yaml
      - name: Unit tests
        run: pnpm test
```

with:

```yaml
      - name: Unit tests (coverage-gated)
        run: pnpm test:coverage

      - name: Coverage summary
        if: always()
        run: |
          if [ -f coverage/coverage-summary.json ]; then
            echo '### Coverage' >> "$GITHUB_STEP_SUMMARY"
            node -e 'const t=require("./coverage/coverage-summary.json").total; for (const k of ["lines","statements","functions","branches"]) console.log(`- ${k}: ${t[k].pct}%`)' >> "$GITHUB_STEP_SUMMARY"
          fi
```

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts .github/workflows/ci.yml
git commit -m "ci: enforce coverage ratchet (auto-updating thresholds) in CI"
```

---

### Task 12: Policy docs, STATUS update, PR

**Files:**
- Modify: `CLAUDE.md` (new Testing section)
- Modify: `STATUS.html` (STATUS data block only)

- [ ] **Step 1: Add the testing policy to CLAUDE.md**

Append to the `## Conventions` section of `CLAUDE.md`:

```markdown
## Testing

- Coverage is ratcheted: `vitest.config.ts` thresholds auto-bump on local
  `pnpm test:coverage` runs and CI fails below them. Never lower them by hand.
- New logic ships with tests in the same PR. Renderer hook tests use the typed
  bridge mock (`src/renderer/src/test/mock-clean-bridge.ts`); it is typed
  against `CleanApi`, so preload API changes must update it (the compiler
  will insist).
- UI components (`.tsx`) are Storybook's responsibility — no component render
  tests, and `.tsx` is excluded from coverage on purpose.
- Two vitest projects: `node` (`src/main|shared|preload`) and `renderer`
  (jsdom). Run one file with `pnpm vitest run --project <name> <path>`.
```

- [ ] **Step 2: Update STATUS.html**

In the `STATUS` data block at the top of `STATUS.html` (per the project rules: data block only):
- Bump `updated` to today's date.
- Add a roadmap item under `done`: "Test coverage: CI-enforced ratchet, all renderer hooks + high-risk main code (deletion, scanner, scheduler, notifier) tested".
- Append a `log` entry: today's date + "Enterprise testing: vitest 4 + coverage ratchet in CI, typed window.clean mock, ~20 new test files across hooks and main process."

- [ ] **Step 3: Commit, push, open the PR**

```bash
git add CLAUDE.md STATUS.html
git commit -m "docs: testing policy + STATUS update for coverage ratchet work"
git push -u origin feat/test-coverage
gh pr create --title "test: coverage ratchet + renderer hooks + main-process backfill" --body "$(cat <<'EOF'
Implements docs/superpowers/specs/2026-07-29-testing-coverage-design.md:

- vitest 4 + @vitest/coverage-v8; coverage ratchet (auto-updating thresholds) enforced in CI
- two vitest projects (node / jsdom) + typed window.clean bridge mock (compile-checked against CleanApi)
- tests for all 11 renderer hooks
- main-process backfill: project-actions deletion safety, scanner fixture-tree integration, scheduler, threshold notifier, small pure utils

UI component tests intentionally absent (Storybook owns UI). E2E deferred per spec.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Verify CI is green**

Run: `gh pr checks --watch`
Expected: `check` and `package-macos` both pass.

---

## Execution notes

- Tasks 3–10 each raise coverage; Task 11 (thresholds) MUST come after them or the baseline locks in too low.
- If a hook test fails on first run, the test's model of the hook is wrong — re-read the hook source before touching the hook (these are shipped behaviors; tests document them, they don't change them).
- `vi.hoisted` is the required pattern for new `vi.mock('electron', ...)` factories that share state with the test body (Tasks 7–8).
