import { join } from 'node:path'
import { BrowserWindow } from 'electron'
import { is } from './window-utils'

const LAUNCHER_WIDTH = 740
const LAUNCHER_HEIGHT = 640

/** Spotlight-style full window (cc-window in the design). */
export class LauncherWindow {
  private win: BrowserWindow | null = null

  open(): BrowserWindow {
    if (this.win && !this.win.isDestroyed()) {
      this.win.show()
      this.win.focus()
      return this.win
    }
    this.win = new BrowserWindow({
      width: LAUNCHER_WIDTH,
      height: LAUNCHER_HEIGHT,
      show: false,
      frame: false,
      transparent: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      hasShadow: true,
      roundedCorners: true,
      vibrancy: 'under-window',
      visualEffectState: 'active',
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false,
      },
    })
    this.win.setWindowButtonVisibility?.(false)
    this.win.once('ready-to-show', () => this.win?.show())
    this.win.on('closed', () => {
      this.win = null
    })
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      this.win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/launcher.html`)
    } else {
      this.win.loadFile(join(__dirname, '../renderer/launcher.html'))
    }
    return this.win
  }

  close(): void {
    this.win?.close()
  }

  get browserWindow(): BrowserWindow | null {
    return this.win
  }
}
