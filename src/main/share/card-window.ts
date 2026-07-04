import type { ShareCardPayload } from '@shared/share.types'
import { BrowserWindow, clipboard } from 'electron'
import { CARD_HEIGHT, CARD_SCALE, CARD_WIDTH, renderCardHtml } from './render-card'

/** Renders the card offscreen at 2x and puts the PNG on the clipboard. */
export async function copyCardToClipboard(payload: ShareCardPayload): Promise<boolean> {
  const win = new BrowserWindow({
    width: CARD_WIDTH * CARD_SCALE,
    height: CARD_HEIGHT * CARD_SCALE,
    show: false,
    frame: false,
    enableLargerThanScreen: true,
    webPreferences: { offscreen: true },
  })
  try {
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(renderCardHtml(payload))}`)
    win.webContents.setZoomFactor(CARD_SCALE)
    await new Promise((resolve) => setTimeout(resolve, 150)) // let zoom + paint settle
    const image = await win.webContents.capturePage()
    if (image.isEmpty()) return false
    clipboard.writeImage(image)
    return true
  } catch (err) {
    console.error('Share card capture failed', err)
    return false
  } finally {
    win.destroy()
  }
}
