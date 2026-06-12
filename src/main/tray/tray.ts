import { Tray, nativeImage } from 'electron'
import { rasterizeGlyph } from './glyph-raster'
import { encodePng } from './png-encode'

const ICON_PT = 18
const SCALE = 2

function buildIcon(over: boolean, accent: string): Electron.NativeImage {
  const size = ICON_PT * SCALE
  const rgba = rasterizeGlyph({
    size,
    color: over ? [255, 138, 138] : [0, 0, 0],
    strokeWidth: 1.8,
    dot: over ? { x: 20.5, y: 3.5, r: 2.6, color: hexToRgb(accent) } : undefined,
  })
  const img = nativeImage.createFromBuffer(encodePng(rgba, size, size), { scaleFactor: SCALE })
  img.setTemplateImage(!over)
  return img
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)]
}

/** Menu bar tray icon; red glyph + accent dot when over the threshold. */
export class TrayManager {
  private tray: Tray | null = null
  private over = false

  create(onClick: (tray: Tray) => void): Tray {
    this.tray = new Tray(buildIcon(false, '#ff6363'))
    this.tray.setToolTip('Clean my node_modules')
    this.tray.on('click', () => onClick(this.tray!))
    return this.tray
  }

  setOverLimit(over: boolean, accent: string): void {
    if (!this.tray || over === this.over) return
    this.over = over
    this.tray.setImage(buildIcon(over, accent))
  }

  get instance(): Tray | null {
    return this.tray
  }
}
