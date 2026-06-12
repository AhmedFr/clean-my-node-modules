import { BrowserWindow, app, ipcMain } from 'electron'
import { IPC } from '@shared/ipc.constants'
import type { Settings } from '@shared/settings.types'
import type { AppContext } from '../app-context.types'
import { deleteNodeModules, openProject, revealInFinder } from '../actions/project-actions'
import { getPnpmStoreInfo, prunePnpmStore } from '../pnpm-store/pnpm-store'

export function registerIpc(ctx: AppContext): void {
  ipcMain.handle(IPC.getProjects, () => ctx.projects.all)
  ipcMain.handle(IPC.getLastScanTime, () => ctx.projects.lastScanTime)
  ipcMain.handle(IPC.getSettings, () => ctx.settings.get())

  ipcMain.handle(IPC.setSetting, (_e, key: keyof Settings, value: Settings[keyof Settings]) => {
    return ctx.settings.set(key, value as never)
  })

  ipcMain.handle(IPC.scan, () => ctx.runScan())

  ipcMain.handle(IPC.getPnpmStore, (_e, force?: boolean) => getPnpmStoreInfo(force))
  ipcMain.handle(IPC.prunePnpmStore, () => prunePnpmStore())

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
    else win?.close()
  })

  ipcMain.on(IPC.quitApp, () => app.quit())

  ipcMain.on(IPC.setWindowHeight, (e, height: number) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win || win.isDestroyed()) return
    const [width] = win.getContentSize()
    win.setContentSize(width, Math.round(height), false)
  })
}

/** Broadcasts an event payload to every open window. */
export function broadcast(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload)
  }
}
