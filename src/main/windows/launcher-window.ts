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
    // Open on whichever Space (virtual desktop) is active instead of switching the
    // user to the Space where the launcher was first created. skipTransformProcessType
    // keeps the dock-hidden (LSUIElement) process type so the Dock / Cmd-Tab don't flicker.
    this.win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true })
    this.win.once('ready-to-show', () => {
      this.win?.show()
      this.win?.focus()
    })
    this.win.on('closed', () => {
      this.win = null
    })
    // Spotlight-style dismissal: losing focus hides the launcher (same as esc).
    // We hide rather than destroy so the next open is an instant show() with no
    // renderer reload or flash. Ignore devtools focus so inspecting won't hide it.
    this.win.on('blur', () => {
      if (this.win?.webContents.isDevToolsFocused()) return
      this.win?.hide()
    })
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      this.win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/launcher.html`)
    } else {
      this.win.loadFile(join(__dirname, '../renderer/launcher.html'))
    }
    return this.win
  }

  hide(): void {
    this.win?.hide()
  }

  get browserWindow(): BrowserWindow | null {
    return this.win
  }
}
