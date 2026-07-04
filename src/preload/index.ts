import { IPC } from '@shared/ipc.constants'
import { contextBridge, ipcRenderer } from 'electron'
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
  getPackages: () => ipcRenderer.invoke(IPC.getPackages),
  computePackages: (force) => ipcRenderer.invoke(IPC.computePackages, force),
  openExternal: (url) => ipcRenderer.invoke(IPC.openExternal, url),
  scan: () => ipcRenderer.invoke(IPC.scan),
  deleteNodeModules: (id) => ipcRenderer.invoke(IPC.deleteNodeModules, id),
  revealInFinder: (id) => ipcRenderer.invoke(IPC.revealInFinder, id),
  openProject: (id) => ipcRenderer.invoke(IPC.openProject, id),
  getSettings: () => ipcRenderer.invoke(IPC.getSettings),
  setSetting: (key, value) => ipcRenderer.invoke(IPC.setSetting, key, value),
  getLicense: () => ipcRenderer.invoke(IPC.getLicense),
  activateLicense: (key) => ipcRenderer.invoke(IPC.activateLicense, key),
  copyShareCard: (payload) => ipcRenderer.invoke(IPC.copyShareCard, payload),
  openLauncher: () => ipcRenderer.invoke(IPC.openLauncher),
  closeWindow: () => ipcRenderer.invoke(IPC.closeWindow),
  setWindowHeight: (height) => ipcRenderer.send(IPC.setWindowHeight, height),
  quitApp: () => ipcRenderer.send(IPC.quitApp),
  uninstall: () => ipcRenderer.invoke(IPC.uninstall),
  pickPath: (mode) => ipcRenderer.invoke(IPC.pickPath, mode),
  trackEvent: (event, props) => ipcRenderer.send(IPC.trackEvent, event, props),
  onScanProgress: subscribe(IPC.onScanProgress),
  onProjectsChanged: subscribe(IPC.onProjectsChanged),
  onSettingsChanged: subscribe(IPC.onSettingsChanged),
  onLicenseChanged: subscribe(IPC.onLicenseChanged),
}

contextBridge.exposeInMainWorld('clean', api)
