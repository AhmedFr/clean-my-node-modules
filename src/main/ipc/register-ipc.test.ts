import type { ActivateResult } from '@shared/license.types'
import type { Project } from '@shared/project.types'
import { describe, expect, it, vi } from 'vitest'

type Handler = (event: unknown, ...args: unknown[]) => unknown
const handlers = new Map<string, Handler>()
const sent: Array<[string, unknown]> = []

vi.mock('electron', () => ({
  app: { quit: vi.fn(), getPath: () => '/tmp' },
  ipcMain: {
    handle: (ch: string, fn: Handler) => handlers.set(ch, fn),
    on: (ch: string, fn: Handler) => handlers.set(ch, fn),
  },
  BrowserWindow: {
    getAllWindows: () => [
      { isDestroyed: () => false, webContents: { send: (ch: string, p: unknown) => sent.push([ch, p]) } },
    ],
    fromWebContents: () => null,
  },
  screen: { getDisplayNearestPoint: vi.fn() },
  shell: { openExternal: vi.fn() },
}))

const deleteNodeModules = vi.fn(async (p: Project) => p.size)
const guardExists = vi.fn(() => null)
vi.mock('../actions/project-actions', () => ({
  deleteNodeModules: (p: Project) => deleteNodeModules(p),
  guardExists: () => guardExists(),
  revealInFinder: vi.fn(),
  openProject: vi.fn(),
}))
const prunePnpmStore = vi.fn(async () => ({ ok: true, freedBytes: 512 }))
vi.mock('../pnpm-store/pnpm-store', () => ({
  getPnpmStoreInfo: vi.fn(),
  prunePnpmStore: () => prunePnpmStore(),
}))
// Never let delete tests shell out to real lsof; default to "nothing is live".
const detectLiveProjects = vi.fn(async (_dirs: string[]) => new Map())
vi.mock('../liveness/liveness', () => ({
  detectLiveProjects: (dirs: string[]) => detectLiveProjects(dirs),
}))
vi.mock('../actions/app-actions', () => ({ uninstallApp: vi.fn() }))
vi.mock('../actions/pick-path', () => ({ pickPath: vi.fn() }))
const copyCardToClipboard = vi.fn(async (_p: unknown) => true)
vi.mock('../share', async () => ({
  copyCardToClipboard: (p: unknown) => copyCardToClipboard(p),
  coerceCardPayload: (await import('../share/render-card')).coerceCardPayload,
}))

const { IPC } = await import('@shared/ipc.constants')
const { registerIpc } = await import('./register-ipc')

const project = { id: 'p1', size: 1024, absPath: '/projects/p1' } as Project

function makeCtx(pro: boolean, extraProjects: Project[] = []) {
  const remove = vi.fn()
  const activate = vi.fn(async (): Promise<ActivateResult> => ({ ok: true as const, state: { pro: true } }))
  const analytics = { capture: vi.fn(), identify: vi.fn() }
  const ctx = {
    projects: { all: [project, ...extraProjects], remove, lastScanTime: 0 },
    packages: { get: vi.fn(), compute: vi.fn() },
    settings: { get: () => ({ pnpmStorePath: undefined, pnpmBinaryPath: undefined }) },
    license: { get: () => ({ pro }), activate, revalidateIfStale: vi.fn() },
    analytics,
    panel: { hide: vi.fn(), browserWindow: null },
    launcher: { open: vi.fn(), hide: vi.fn(), browserWindow: null },
    runScan: vi.fn(),
  }
  handlers.clear()
  sent.length = 0
  deleteNodeModules.mockClear()
  guardExists.mockClear()
  prunePnpmStore.mockClear()
  copyCardToClipboard.mockClear()
  detectLiveProjects.mockClear()
  detectLiveProjects.mockImplementation(async () => new Map())
  // biome-ignore lint/suspicious/noExplicitAny: deliberately partial test double
  registerIpc(ctx as any)
  return { ctx, remove, activate, analytics }
}

const invoke = (ch: string, ...args: unknown[]) => handlers.get(ch)?.({}, ...args)

describe('license enforcement in IPC handlers', () => {
  it('unlicensed delete refuses: returns 0, nothing trashed, project kept', async () => {
    const { remove } = makeCtx(false)
    expect(await invoke(IPC.deleteNodeModules, 'p1')).toEqual({ freed: 0 })
    expect(deleteNodeModules).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })

  it('licensed delete goes through', async () => {
    const { remove } = makeCtx(true)
    expect(await invoke(IPC.deleteNodeModules, 'p1')).toEqual({ freed: 1024 })
    expect(deleteNodeModules).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledWith('p1')
  })

  it('delete refuses when the guard reports unmounted, and still drops the project', async () => {
    const { remove } = makeCtx(true)
    guardExists.mockReturnValueOnce({ freed: 0, blocked: 'unmounted' } as never)
    expect(await invoke(IPC.deleteNodeModules, 'p1')).toEqual({ freed: 0, blocked: 'unmounted' })
    expect(deleteNodeModules).not.toHaveBeenCalled()
    expect(remove).toHaveBeenCalledWith('p1')
  })

  it('delete refuses when the project is live, and keeps the project in the list', async () => {
    const { remove } = makeCtx(true)
    detectLiveProjects.mockImplementationOnce(async () => new Map([[project.absPath, { pid: 1, command: 'node' }]]))
    expect(await invoke(IPC.deleteNodeModules, 'p1')).toEqual({ freed: 0, blocked: 'live' })
    expect(deleteNodeModules).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })

  it('unlicensed batch delete refuses: returns empty result, nothing trashed', async () => {
    makeCtx(false)
    expect(await invoke(IPC.deleteManyNodeModules, ['p1'])).toEqual({ freed: 0, blockedIds: [] })
    expect(deleteNodeModules).not.toHaveBeenCalled()
  })

  it('batch delete runs liveness once for the batch: blocks live ids without trashing or removing them, sums freed for the rest', async () => {
    const project2 = { id: 'p2', size: 2048, absPath: '/projects/p2' } as Project
    const { remove } = makeCtx(true, [project2])
    detectLiveProjects.mockImplementationOnce(async () => new Map([[project.absPath, { pid: 1, command: 'node' }]]))
    const res = await invoke(IPC.deleteManyNodeModules, ['p1', 'p2'])
    expect(res).toEqual({ freed: 2048, blockedIds: ['p1'] })
    expect(detectLiveProjects).toHaveBeenCalledOnce()
    expect(detectLiveProjects).toHaveBeenCalledWith([project.absPath, project2.absPath])
    expect(deleteNodeModules).toHaveBeenCalledOnce()
    expect(deleteNodeModules).toHaveBeenCalledWith(project2)
    expect(remove).toHaveBeenCalledWith('p2')
    expect(remove).not.toHaveBeenCalledWith('p1')
  })

  it('unlicensed prune refuses without spawning pnpm', async () => {
    makeCtx(false)
    expect(await invoke(IPC.prunePnpmStore)).toEqual({ ok: false, freedBytes: 0 })
    expect(prunePnpmStore).not.toHaveBeenCalled()
  })

  it('licensed prune goes through', async () => {
    makeCtx(true)
    expect(await invoke(IPC.prunePnpmStore)).toEqual({ ok: true, freedBytes: 512 })
  })

  it('license:get returns the store state; activate broadcasts on success', async () => {
    const { activate } = makeCtx(false)
    expect(await invoke(IPC.getLicense)).toEqual({ pro: false })
    const res = await invoke(IPC.activateLicense, 'POLAR-x-y')
    expect(activate).toHaveBeenCalledWith('POLAR-x-y')
    expect(res).toEqual({ ok: true, state: { pro: true } })
    expect(sent).toContainEqual([IPC.onLicenseChanged, { pro: true }])
  })

  it('failed activation does not broadcast license:changed', async () => {
    const { activate } = makeCtx(false)
    activate.mockImplementation(async () => ({ ok: false as const, reason: 'invalid' as const }))
    const res = await invoke(IPC.activateLicense, 'BAD')
    expect(res).toEqual({ ok: false, reason: 'invalid' })
    expect(sent).toEqual([])
  })

  it('trackEvent forwards whitelisted renderer events with sanitized props', () => {
    const { analytics } = makeCtx(false)
    invoke(IPC.trackEvent, 'paywall_shown', { trigger: 'delete', teased_gb: 1.2, nested: { no: true } })
    expect(analytics.capture).toHaveBeenCalledWith('paywall_shown', { trigger: 'delete', teased_gb: 1.2 })
  })

  it('trackEvent drops non-whitelisted events entirely', () => {
    const { analytics } = makeCtx(false)
    invoke(IPC.trackEvent, 'license_activated', {})
    invoke(IPC.trackEvent, 42, {})
    expect(analytics.capture).not.toHaveBeenCalled()
  })

  it('successful activation captures license_activated and identifies the buyer', async () => {
    const { activate, analytics } = makeCtx(false)
    activate.mockImplementation(async () => ({ ok: true as const, state: { pro: true, email: 'b@x.y' } }))
    await invoke(IPC.activateLicense, 'KEY')
    expect(analytics.capture).toHaveBeenCalledWith('license_activated')
    expect(analytics.identify).toHaveBeenCalledWith('b@x.y')
  })

  it('licensed delete captures clean_performed with freed_gb', async () => {
    const { analytics } = makeCtx(true)
    await invoke(IPC.deleteNodeModules, 'p1')
    expect(analytics.capture).toHaveBeenCalledWith('clean_performed', { kind: 'delete', freed_gb: 0 })
  })

  it('share:copy-card rejects garbage without opening a window or capturing', async () => {
    const { analytics } = makeCtx(false)
    expect(await invoke(IPC.copyShareCard, { totalBytes: -5 })).toEqual({ ok: false })
    expect(copyCardToClipboard).not.toHaveBeenCalled()
    expect(analytics.capture).not.toHaveBeenCalled()
  })

  it('share:copy-card copies and captures share_card_copied with source', async () => {
    const { analytics } = makeCtx(false)
    const GBv = 1024 ** 3
    const res = await invoke(IPC.copyShareCard, {
      totalBytes: 247.3 * GBv,
      nodeModulesBytes: 214 * GBv,
      storeBytes: 33.3 * GBv,
      projectsCount: 14,
      source: 'header',
    })
    expect(res).toEqual({ ok: true })
    expect(analytics.capture).toHaveBeenCalledWith('share_card_copied', { total_gb: 247.3, source: 'header' })
  })
})
