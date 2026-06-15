import { join } from 'node:path'
import { BrowserWindow, screen, type Tray } from 'electron'
import { is } from './window-utils'

const PANEL_WIDTH = 334
const PANEL_INITIAL_HEIGHT = 420

/** Frameless dropdown anchored under the tray icon (mb-panel in the design). */
export class PanelWindow {
  private win: BrowserWindow | null = null

  create(): BrowserWindow {
    this.win = new BrowserWindow({
      width: PANEL_WIDTH,
      height: PANEL_INITIAL_HEIGHT,
      show: false,
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      hasShadow: true,
      roundedCorners: true,
      vibrancy: 'hud',
      visualEffectState: 'active',
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false,
      },
    })
    this.win.setWindowButtonVisibility?.(false)
    this.win.on('blur', () => this.hide())
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      this.win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/panel.html`)
    } else {
      this.win.loadFile(join(__dirname, '../renderer/panel.html'))
    }
    return this.win
  }

  toggle(tray: Tray): void {
    if (!this.win) this.create()
    if (this.win!.isVisible()) this.hide()
    else this.showUnderTray(tray)
  }

  showUnderTray(tray: Tray): void {
    if (!this.win) this.create()
    const win = this.win!
    const trayBounds = tray.getBounds()
    const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
    const x = Math.min(
      Math.round(trayBounds.x + trayBounds.width / 2 - PANEL_WIDTH / 2),
      display.workArea.x + display.workArea.width - PANEL_WIDTH - 8,
    )
    const y = display.workArea.y + 5
    win.setPosition(x, y, false)
    win.show()
    win.focus()
  }

  hide(): void {
    this.win?.hide()
  }

  get browserWindow(): BrowserWindow | null {
    return this.win
  }
}
