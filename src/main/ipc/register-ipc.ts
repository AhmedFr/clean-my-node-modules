import { join } from 'node:path'
import type { DeleteManyResult, DeleteResult } from '@shared/delete.types'
import { IPC } from '@shared/ipc.constants'
import type { LiveInfo } from '@shared/liveness.types'
import type { Project } from '@shared/project.types'
import { GB } from '@shared/units.constants'
import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'
import { uninstallApp } from '../actions/app-actions'
import { pickPath } from '../actions/pick-path'
import { deleteNodeModules, guardExists, openProject, revealInFinder } from '../actions/project-actions'
import type { AnalyticsEvent, AnalyticsProps } from '../analytics'
import { RENDERER_EVENTS } from '../analytics'
import type { AppContext } from '../app-context.types'
import { liveGuard } from '../liveness/guard-live'
import { detectLiveProjects } from '../liveness/liveness'
import { getPnpmStoreInfo, prunePnpmStore } from '../pnpm-store/pnpm-store'
import { coerceSetting } from '../settings/validate-setting'
import { coerceCardPayload, copyCardToClipboard } from '../share'
import { listExternalVolumes } from '../volumes/list-external-volumes'

export function registerIpc(ctx: AppContext): void {
  ipcMain.handle(IPC.getProjects, () => ctx.projects.all)
  ipcMain.handle(IPC.getLastScanTime, () => ctx.projects.lastScanTime)
  ipcMain.handle(IPC.getSettings, () => ctx.settings.get())

  ipcMain.handle(IPC.setSetting, (_e, key: unknown, value: unknown) => {
    // Never trust the renderer's payload — validate before persisting.
    const ok = coerceSetting(key, value)
    if (!ok) return ctx.settings.get()
    return ctx.settings.set(ok.key, ok.value as never)
  })

  ipcMain.handle(IPC.listVolumes, async () => {
    const roots = new Set(ctx.settings.get().scanRoots)
    const vols = await listExternalVolumes()
    return vols.map((v) => ({ ...v, included: roots.has(v.path) }))
  })

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

  ipcMain.handle(IPC.getLicense, () => ctx.license.get())
  ipcMain.handle(IPC.activateLicense, async (_e, key: unknown) => {
    const result = await ctx.license.activate(key)
    if (result.ok) {
      broadcast(IPC.onLicenseChanged, result.state)
      ctx.analytics.capture('license_activated')
      if (result.state.email) ctx.analytics.identify(result.state.email)
    }
    return result
  })

  ipcMain.handle(IPC.scan, () => ctx.runScan())

  ipcMain.handle(IPC.getPnpmStore, (_e, force?: boolean) => {
    const s = ctx.settings.get()
    return getPnpmStoreInfo(force, { storePath: s.pnpmStorePath, binaryPath: s.pnpmBinaryPath })
  })
  ipcMain.handle(IPC.prunePnpmStore, async () => {
    // Free tier sees everything but mutates nothing — cleanup is the paid unlock.
    if (!ctx.license.get().pro) return { ok: false, freedBytes: 0 }
    const s = ctx.settings.get()
    const result = await prunePnpmStore({ storePath: s.pnpmStorePath, binaryPath: s.pnpmBinaryPath })
    if (result.ok) {
      ctx.analytics.capture('clean_performed', {
        kind: 'prune',
        freed_gb: Math.round((result.freedBytes / GB) * 10) / 10,
      })
    }
    return result
  })

  ipcMain.handle(IPC.copyShareCard, async (_e, raw: unknown) => {
    const payload = coerceCardPayload(raw)
    if (!payload) return { ok: false }
    const ok = await copyCardToClipboard(payload)
    if (ok) {
      ctx.analytics.capture('share_card_copied', {
        total_gb: Math.round((payload.totalBytes / GB) * 10) / 10,
        source: payload.source ?? 'reveal',
      })
    }
    return { ok }
  })

  ipcMain.handle(IPC.getPackages, () => ctx.packages.get())
  ipcMain.handle(IPC.computePackages, (_e, force?: boolean) =>
    ctx.packages.compute(ctx.projects.all, ctx.settings.get(), force),
  )

  ipcMain.handle(IPC.deleteNodeModules, async (_e, id: string): Promise<DeleteResult> => {
    if (!ctx.license.get().pro) return { freed: 0 }
    const project = ctx.projects.all.find((p) => p.id === id)
    if (!project) return { freed: 0 }
    const guard = guardExists(join(project.absPath, 'node_modules'))
    if (guard) {
      ctx.projects.remove(id)
      return guard
    }
    const live = await liveGuard(project.absPath, detectLiveProjects)
    if (live) return live
    const freed = await deleteNodeModules(project)
    ctx.projects.remove(id)
    ctx.analytics.capture('clean_performed', { kind: 'delete', freed_gb: Math.round((freed / GB) * 10) / 10 })
    return { freed }
  })

  ipcMain.handle(IPC.deleteManyNodeModules, async (_e, rawIds: unknown): Promise<DeleteManyResult> => {
    if (!ctx.license.get().pro) return { freed: 0, blockedIds: [] }
    // Never trust the renderer's payload — coerce to a plain string list.
    const ids = Array.isArray(rawIds) ? rawIds.filter((id): id is string => typeof id === 'string') : []
    const projects = ids
      .map((id) => ctx.projects.all.find((p) => p.id === id))
      .filter((p): p is Project => p !== undefined)
    // One liveness check for the whole batch instead of one per project.
    const live = await detectLiveProjects(projects.map((p) => p.absPath))
    let freed = 0
    const blockedIds: string[] = []
    for (const project of projects) {
      const guard = guardExists(join(project.absPath, 'node_modules'))
      if (guard) {
        // Path vanished since the scan (e.g. an unmounted drive) — drop it silently,
        // it's skipped rather than blocked and contributes nothing to `freed`.
        ctx.projects.remove(project.id)
        continue
      }
      if (live.has(project.absPath)) {
        blockedIds.push(project.id)
        continue
      }
      const projectFreed = await deleteNodeModules(project)
      ctx.projects.remove(project.id)
      freed += projectFreed
      ctx.analytics.capture('clean_performed', {
        kind: 'delete',
        freed_gb: Math.round((projectFreed / GB) * 10) / 10,
      })
    }
    return { freed, blockedIds }
  })

  ipcMain.handle(IPC.revealInFinder, (_e, id: string) => {
    const project = ctx.projects.all.find((p) => p.id === id)
    if (project) revealInFinder(project)
  })

  ipcMain.handle(IPC.openProject, async (_e, id: string) => {
    const project = ctx.projects.all.find((p) => p.id === id)
    if (project) await openProject(project)
  })

  ipcMain.handle(IPC.openLauncher, () => {
    ctx.panel.hide()
    ctx.launcher.open()
  })

  ipcMain.handle(IPC.closeWindow, (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (win === ctx.panel.browserWindow) ctx.panel.hide()
    else if (win === ctx.launcher.browserWindow) ctx.launcher.hide()
    else win?.close()
  })

  ipcMain.on(IPC.quitApp, () => app.quit())

  ipcMain.on(IPC.trackEvent, (_e, event: unknown, props: unknown) => {
    // The renderer only ever originates these two; everything else is dropped.
    if (typeof event !== 'string' || !(RENDERER_EVENTS as readonly string[]).includes(event)) return
    ctx.analytics.capture(event as AnalyticsEvent, sanitizeProps(props))
  })

  ipcMain.handle(IPC.openExternal, (_e, url: unknown) => {
    // Only ever hand https URLs to the OS — never arbitrary schemes from the renderer.
    if (typeof url === 'string' && /^https:\/\//.test(url)) return shell.openExternal(url)
  })

  ipcMain.handle(IPC.uninstall, () => uninstallApp())
  ipcMain.handle(IPC.pickPath, (_e, mode: 'file' | 'folder') => pickPath(mode))

  ipcMain.on(IPC.setWindowHeight, (e, height: number) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win || win.isDestroyed()) return
    const [width] = win.getContentSize()
    const { workArea } = screen.getDisplayNearestPoint(win.getBounds())
    // Never let the window grow taller than the screen, or the footer clips.
    const target = Math.min(Math.round(height), workArea.height - 16)
    win.setContentSize(width, target, false)
    // If the resized window now spills past the bottom edge, nudge it back up.
    const bounds = win.getBounds()
    const overflow = bounds.y + bounds.height - (workArea.y + workArea.height)
    if (overflow > 0) win.setPosition(bounds.x, Math.max(workArea.y, bounds.y - overflow), false)
  })
}

/** Broadcasts an event payload to every open window. */
export function broadcast(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload)
  }
}

/** Flat primitives only: the renderer cannot smuggle objects or paths by accident. */
function sanitizeProps(props: unknown): AnalyticsProps | undefined {
  if (typeof props !== 'object' || props === null) return undefined
  const out: AnalyticsProps = {}
  for (const [k, v] of Object.entries(props).slice(0, 10)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = v
  }
  return Object.keys(out).length ? out : undefined
}
