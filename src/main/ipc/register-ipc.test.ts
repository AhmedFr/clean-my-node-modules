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
vi.mock('../actions/project-actions', () => ({
  deleteNodeModules: (p: Project) => deleteNodeModules(p),
  revealInFinder: vi.fn(),
  openProject: vi.fn(),
}))
const prunePnpmStore = vi.fn(async () => ({ ok: true, freedBytes: 512 }))
vi.mock('../pnpm-store/pnpm-store', () => ({
  getPnpmStoreInfo: vi.fn(),
  prunePnpmStore: () => prunePnpmStore(),
}))
vi.mock('../actions/app-actions', () => ({ uninstallApp: vi.fn() }))
vi.mock('../actions/pick-path', () => ({ pickPath: vi.fn() }))

const { IPC } = await import('@shared/ipc.constants')
const { registerIpc } = await import('./register-ipc')

const project = { id: 'p1', size: 1024 } as Project

function makeCtx(pro: boolean) {
  const remove = vi.fn()
  const activate = vi.fn(async (): Promise<ActivateResult> => ({ ok: true as const, state: { pro: true } }))
  const analytics = { capture: vi.fn(), identify: vi.fn() }
  const ctx = {
    projects: { all: [project], remove, lastScanTime: 0 },
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
  prunePnpmStore.mockClear()
  // biome-ignore lint/suspicious/noExplicitAny: deliberately partial test double
  registerIpc(ctx as any)
  return { ctx, remove, activate, analytics }
}

const invoke = (ch: string, ...args: unknown[]) => handlers.get(ch)?.({}, ...args)

describe('license enforcement in IPC handlers', () => {
  it('unlicensed delete refuses: returns 0, nothing trashed, project kept', async () => {
    const { remove } = makeCtx(false)
    expect(await invoke(IPC.deleteNodeModules, 'p1')).toBe(0)
    expect(deleteNodeModules).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })

  it('licensed delete goes through', async () => {
    const { remove } = makeCtx(true)
    expect(await invoke(IPC.deleteNodeModules, 'p1')).toBe(1024)
    expect(deleteNodeModules).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledWith('p1')
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
})
