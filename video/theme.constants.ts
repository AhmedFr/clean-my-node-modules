/**
 * Brand palette + color math, mirrored from the app (src/renderer/src/lib/colors)
 * so the video matches the real UI exactly.
 */

export const ACCENT = '#ff6363'
export const SAFE = '#34d399'
export const WARN = '#f5b14c'

/** Canvas background (deep app charcoal). */
export const BG = '#0e1014'
/** Launcher panel fill — near-opaque since there's no OS vibrancy behind it. */
export const PANEL = 'rgba(22,22,26,0.96)'
export const HAIRLINE = 'rgba(255,255,255,0.07)'

type Rgba = [number, number, number, number]

function parseColor(c: string): Rgba {
  if (c[0] === '#') {
    const h = c.slice(1)
    const n =
      h.length === 3
        ? h
            .split('')
            .map((x) => x + x)
            .join('')
        : h
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16), 1]
  }
  const m = c.match(/rgba?\(([^)]+)\)/)
  if (m) {
    const a = m[1].split(',').map((x) => parseFloat(x))
    return [a[0], a[1], a[2], a[3] == null ? 1 : a[3]]
  }
  return [136, 143, 152, 1]
}

/** Linear interpolation between two CSS colors (hex or rgb/rgba). */
export function mixColor(a: string, b: string, t: number): string {
  t = Math.max(0, Math.min(1, t))
  const A = parseColor(a)
  const B = parseColor(b)
  const r = Math.round(A[0] + (B[0] - A[0]) * t)
  const g = Math.round(A[1] + (B[1] - A[1]) * t)
  const bl = Math.round(A[2] + (B[2] - A[2]) * t)
  const al = (A[3] + (B[3] - A[3]) * t).toFixed(3)
  return `rgba(${r},${g},${bl},${al})`
}

/** ratio = used/threshold. Calm green → amber → danger accent. */
export function statusColor(ratio: number, accent = ACCENT): string {
  if (ratio <= 0.5) return mixColor('#22b378', SAFE, ratio / 0.5)
  if (ratio <= 0.82) return mixColor(SAFE, WARN, (ratio - 0.5) / 0.32)
  return mixColor(WARN, accent, Math.min(1, (ratio - 0.82) / 0.18))
}

/** "6.2 GB" / "820 MB" — matches the app's size labels. */
export function fmtSize(gb: number): string {
  if (gb >= 1) return `${gb.toFixed(gb >= 10 ? 1 : 1)} GB`
  return `${Math.round(gb * 1024)} MB`
}

/** Two-decimal GB for the big header total, e.g. "26.32 GB". */
export function fmtTotal(gb: number): string {
  return `${gb.toFixed(2)} GB`
}

export const UI_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", system-ui, sans-serif'
export const MONO_FONT = 'ui-monospace, "SF Mono", Menlo, monospace'
