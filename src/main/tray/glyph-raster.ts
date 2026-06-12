/**
 * Rasterizes the app's module-cube glyph (from the design's glyphs.jsx,
 * viewBox 24) into an RGBA bitmap by computing per-pixel distance to the
 * glyph's stroke segments. Keeps the tray icon dependency-free.
 */

type Point = [number, number]
type Segment = [Point, Point]

const OUTLINE: Point[] = [
  [12, 2.6],
  [20.5, 7.3],
  [20.5, 16.7],
  [12, 21.4],
  [3.5, 16.7],
  [3.5, 7.3],
]

const GLYPH_SEGMENTS: Segment[] = [
  ...OUTLINE.map((p, i): Segment => [p, OUTLINE[(i + 1) % OUTLINE.length]]),
  [
    [3.5, 7.3],
    [12, 12],
  ],
  [
    [20.5, 7.3],
    [12, 12],
  ],
  [
    [12, 12],
    [12, 21.4],
  ],
]

function distanceToSegment(px: number, py: number, [[ax, ay], [bx, by]]: Segment): number {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

export interface RasterOptions {
  /** Output bitmap size in pixels (square). */
  size: number
  /** Stroke RGB color. */
  color: [number, number, number]
  /** Stroke width in glyph units (viewBox 24). */
  strokeWidth?: number
  /** Optional filled dot (over-limit badge), in glyph units. */
  dot?: { x: number; y: number; r: number; color: [number, number, number] }
}

/** Returns an RGBA buffer (size × size × 4). */
export function rasterizeGlyph({ size, color, strokeWidth = 1.8, dot }: RasterOptions): Buffer {
  const buf = Buffer.alloc(size * size * 4)
  const scale = size / 24
  const halfStroke = (strokeWidth * scale) / 2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = x + 0.5
      const gy = y + 0.5
      let minDist = Infinity
      for (const seg of GLYPH_SEGMENTS) {
        const d = distanceToSegment(gx / scale, gy / scale, seg) * scale
        if (d < minDist) minDist = d
      }
      let alpha = Math.max(0, Math.min(1, halfStroke + 0.5 - minDist))
      let rgb = color
      if (dot) {
        const dDot = Math.hypot(gx - dot.x * scale, gy - dot.y * scale) - dot.r * scale
        const dotAlpha = Math.max(0, Math.min(1, 0.5 - dDot))
        if (dotAlpha > alpha) {
          alpha = dotAlpha
          rgb = dot.color
        }
      }
      const i = (y * size + x) * 4
      buf[i] = rgb[0]
      buf[i + 1] = rgb[1]
      buf[i + 2] = rgb[2]
      buf[i + 3] = Math.round(alpha * 255)
    }
  }
  return buf
}
