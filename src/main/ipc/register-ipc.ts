import { IPC } from '@shared/ipc.constants'
import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { uninstallApp } from '../actions/app-actions'
import { pickPath } from '../actions/pick-path'
import { deleteNodeModules, openProject, revealInFinder } from '../actions/project-actions'
import type { AppContext } from '../app-context.types'
import { getPnpmStoreInfo, prunePnpmStore } from '../pnpm-store/pnpm-store'
import { coerceSetting } from '../settings/validate-setting'

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

  ipcMain.handle(IPC.scan, () => ctx.runScan())

  ipcMain.handle(IPC.getPnpmStore, (_e, force?: boolean) => {
    const s = ctx.settings.get()
    return getPnpmStoreInfo(force, { storePath: s.pnpmStorePath, binaryPath: s.pnpmBinaryPath })
  })
  ipcMain.handle(IPC.prunePnpmStore, () => {
    const s = ctx.settings.get()
    return prunePnpmStore({ storePath: s.pnpmStorePath, binaryPath: s.pnpmBinaryPath })
  })

  ipcMain.handle(IPC.deleteNodeModules, async (_e, id: string) => {
    const project = ctx.projects.all.find((p) => p.id === id)
    if (!project) return 0
    const freed = await deleteNodeModules(project)
    ctx.projects.remove(id)
    return freed
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
