import { join } from 'node:path'
import { IPC } from '@shared/ipc.constants'
import type { LauncherNavTarget } from '@shared/launcher-nav.types'
import { app, BrowserWindow } from 'electron'
import { blurShouldDismiss } from './blur-grace'
import { is } from './window-utils'

const LAUNCHER_WIDTH = 740
const LAUNCHER_HEIGHT = 640

/** Spotlight-style full window (cc-window in the design). */
export class LauncherWindow {
  private win: BrowserWindow | null = null
  private shownAt = 0
  private pendingNav: LauncherNavTarget | null = null

  /** Bring the app forward and show + focus the window, arming the blur grace. */
  private reveal(): void {
    // steal:true activates the dock-hidden (LSUIElement) app so the window can
    // actually become key; without it the accessory app may never hold focus and
    // the blur handler would dismiss the launcher the instant it opens.
    app.focus({ steal: true })
    this.win?.show()
    this.win?.focus()
    this.shownAt = Date.now()
  }

  open(nav?: LauncherNavTarget): BrowserWindow {
    if (this.win && !this.win.isDestroyed()) {
      this.reveal()
      // Window already mounted: navigate live. (Fresh windows pull pendingNav on mount.)
      if (nav) this.win.webContents.send(IPC.onLauncherNavigate, nav)
      return this.win
    }
    this.pendingNav = nav ?? null
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
    this.win.once('ready-to-show', () => this.reveal())
    this.win.on('closed', () => {
      this.win = null
    })
    // Spotlight-style dismissal: losing focus hides the launcher (same as esc). We
    // hide rather than destroy so the next open is an instant show() with no renderer
    // reload or flash. blurShouldDismiss ignores devtools focus and the spurious
    // just-opened blur so a dock-hidden app doesn't dismiss its own window on open.
    this.win.on('blur', () => {
      const devtoolsFocused = this.win?.webContents.isDevToolsFocused() ?? false
      if (blurShouldDismiss(Date.now() - this.shownAt, devtoolsFocused)) this.win?.hide()
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

  /** Returns and clears the nav target queued for a fresh launcher; the renderer
   *  pulls this once on mount so it lands on the right view without a send/subscribe race. */
  consumePendingNav(): LauncherNavTarget | null {
    const nav = this.pendingNav
    this.pendingNav = null
    return nav
  }

  get browserWindow(): BrowserWindow | null {
    return this.win
  }
}
