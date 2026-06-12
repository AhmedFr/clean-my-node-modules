import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc.constants'
import type { CleanApi } from './api.types'

function subscribe<T>(channel: string) {
  return (fn: (payload: T) => void): (() => void) => {
    const handler = (_e: Electron.IpcRendererEvent, payload: T): void => fn(payload)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  }
}

const api: CleanApi = {
  getProjects: () => ipcRenderer.invoke(IPC.getProjects),
  getLastScanTime: () => ipcRenderer.invoke(IPC.getLastScanTime),
  getPnpmStore: (force) => ipcRenderer.invoke(IPC.getPnpmStore, force),
  prunePnpmStore: () => ipcRenderer.invoke(IPC.prunePnpmStore),
  scan: () => ipcRenderer.invoke(IPC.scan),
  deleteNodeModules: (id) => ipcRenderer.invoke(IPC.deleteNodeModules, id),
  revealInFinder: (id) => ipcRenderer.invoke(IPC.revealInFinder, id),
  openProject: (id) => ipcRenderer.invoke(IPC.openProject, id),
  getSettings: () => ipcRenderer.invoke(IPC.getSettings),
  setSetting: (key, value) => ipcRenderer.invoke(IPC.setSetting, key, value),
  openLauncher: () => ipcRenderer.invoke(IPC.openLauncher),
  closeWindow: () => ipcRenderer.invoke(IPC.closeWindow),
  setWindowHeight: (height) => ipcRenderer.send(IPC.setWindowHeight, height),
  quitApp: () => ipcRenderer.send(IPC.quitApp),
  onScanProgress: subscribe(IPC.onScanProgress),
  onProjectsChanged: subscribe(IPC.onProjectsChanged),
  onSettingsChanged: subscribe(IPC.onSettingsChanged),
}

contextBridge.exposeInMainWorld('clean', api)
