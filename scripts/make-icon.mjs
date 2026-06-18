// Generates build/icon.png (1024×1024) for the macOS app icon by reusing the
// app's cube glyph + PNG encoder — mirrors src/main/tray/glyph-raster.ts and
// src/main/tray/png-encode.ts so the packaged icon matches the in-app AppIcon
// (white cube on the brand-accent gradient squircle). No image assets, no deps.
//
// Run with: pnpm icon   (node scripts/make-icon.mjs)
import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const SIZE = 1024
const ACCENT = [0xff, 0x63, 0x63] // brand accent (#ff6363) — AppIcon's default

// --- cube glyph (viewBox 24); mirrors src/main/tray/glyph-raster.ts ---
const OUTLINE = [
  [12, 2.6],
  [20.5, 7.3],
  [20.5, 16.7],
  [12, 21.4],
  [3.5, 16.7],
  [3.5, 7.3],
]
const SEGMENTS = [
  ...OUTLINE.map((p, i) => [p, OUTLINE[(i + 1) % OUTLINE.length]]),
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
function distSeg(px, py, [[ax, ay], [bx, by]]) {
  const dx = bx - ax
  const dy = by - ay
  const l = dx * dx + dy * dy
  const t = l === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

const lerp = (a, b, t) => a + (b - a) * t
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

// gradient endpoints (AppIcon: accent→white 12% top-left, accent→black 32% bottom-right)
const C1 = mix(ACCENT, [255, 255, 255], 0.12)
const C2 = mix(ACCENT, [0, 0, 0], 0.32)

// rounded-square geometry (macOS icon grid: ~80% of canvas, corner radius ≈22.37%,
// leaving a transparent margin so macOS can add its own drop shadow)
const S = Math.round(SIZE * 0.805)
const OFF = (SIZE - S) / 2
const R = S * 0.2237
function rrSDF(px, py) {
  const hw = S / 2
  const hh = S / 2
  const qx = Math.abs(px - SIZE / 2) - hw + R
  const qy = Math.abs(py - SIZE / 2) - hh + R
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - R
}

// cube glyph buffer geometry (centered, ~52% of the squircle)
const CUBE = Math.round(S * 0.52)
const CO = (SIZE - CUBE) / 2
const cubeScale = CUBE / 24
const halfStroke = (1.9 * cubeScale) / 2
function cubeAlpha(x, y) {
  const gx = (x + 0.5) / cubeScale
  const gy = (y + 0.5) / cubeScale
  let m = Infinity
  for (const s of SEGMENTS) {
    const d = distSeg(gx, gy, s) * cubeScale
    if (d < m) m = d
  }
  return Math.max(0, Math.min(1, halfStroke + 0.5 - m))
}

const buf = Buffer.alloc(SIZE * SIZE * 4)
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const cov = Math.max(0, Math.min(1, 0.5 - rrSDF(x + 0.5, y + 0.5)))
    if (cov <= 0) continue // transparent margin
    const t = (x + y) / (2 * (SIZE - 1)) // top-left light → bottom-right dark
    let r = lerp(C1[0], C2[0], t)
    let g = lerp(C1[1], C2[1], t)
    let b = lerp(C1[2], C2[2], t)
    const sheen = Math.max(0, 1 - (y - OFF) / (S * 0.5)) * 0.14 // subtle top highlight
    r = lerp(r, 255, sheen)
    g = lerp(g, 255, sheen)
    b = lerp(b, 255, sheen)
    const lx = x - CO
    const ly = y - CO
    if (lx >= 0 && lx < CUBE && ly >= 0 && ly < CUBE) {
      const a = cubeAlpha(lx, ly) // white cube stroke
      if (a > 0) {
        r = lerp(r, 255, a)
        g = lerp(g, 255, a)
        b = lerp(b, 255, a)
      }
    }
    const i = (y * SIZE + x) * 4
    buf[i] = Math.round(r)
    buf[i + 1] = Math.round(g)
    buf[i + 2] = Math.round(b)
    buf[i + 3] = Math.round(cov * 255)
  }
}

// --- PNG encode; mirrors src/main/tray/png-encode.ts ---
const CRC = (() => {
  const tbl = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tbl[n] = c >>> 0
  }
  return tbl
})()
function crc32(b) {
  let c = 0xffffffff
  for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const o = Buffer.alloc(12 + data.length)
  o.writeUInt32BE(data.length, 0)
  o.write(type, 4, 'ascii')
  data.copy(o, 8)
  o.writeUInt32BE(crc32(o.subarray(4, 8 + data.length)), 8 + data.length)
  return o
}
function encodePng(rgba, w, h) {
  const raw = Buffer.alloc(h * (w * 4 + 1))
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('build', { recursive: true })
writeFileSync('build/icon.png', encodePng(buf, SIZE, SIZE))
console.log(`wrote build/icon.png (${SIZE}×${SIZE})`)
