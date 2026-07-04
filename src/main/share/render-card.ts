import type { ShareCardPayload } from '@shared/share.types'

export const CARD_WIDTH = 1200
export const CARD_HEIGHT = 675
export const CARD_SCALE = 2

const GB = 1024 ** 3
const MAX_BYTES = 1e15 // 1 PB cap; nobody has more dev junk than that

/** Validates an untrusted renderer payload; null unless every number is sane. */
export function coerceCardPayload(raw: unknown): ShareCardPayload | null {
  if (typeof raw !== 'object' || raw === null) return null
  const p = raw as Record<string, unknown>
  const out: Partial<ShareCardPayload> = {}
  for (const k of ['totalBytes', 'nodeModulesBytes', 'storeBytes', 'projectsCount'] as const) {
    const v = p[k]
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return null
    out[k] = Math.min(v, MAX_BYTES)
  }
  if ((out.totalBytes ?? 0) <= 0) return null
  if (p.source !== undefined && p.source !== 'reveal' && p.source !== 'header') return null
  out.source = (p.source as 'reveal' | 'header' | undefined) ?? 'reveal'
  return out as ShareCardPayload
}

/** 3.22 / 47.3 / 247: decimals shrink as the number grows. */
export function fmtGB(bytes: number): string {
  const gb = bytes / GB
  return gb >= 100 ? gb.toFixed(0) : gb >= 10 ? gb.toFixed(1) : gb.toFixed(2)
}

const METER = [
  '#e23d3d',
  '#e8503c',
  '#ef683c',
  '#f5883f',
  '#f5b14c',
  '#c9c25a',
  '#8fcf72',
  '#57d489',
  '#34d399',
  '#34d399',
  'rgba(255,255,255,.14)',
  'rgba(255,255,255,.14)',
]

/** Self-contained 1200x675 card; system fonts only, no external resources. */
export function renderCardHtml(p: ShareCardPayload): string {
  const cells = METER.map((c) => `<i style="background:${c}"></i>`).join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}
  html,body{width:${CARD_WIDTH}px;height:${CARD_HEIGHT}px;overflow:hidden}
  body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#f4f4f6;
    background:radial-gradient(760px 500px at 84% -8%,#2c1d3a 0%,transparent 55%),
      radial-gradient(640px 480px at 2% 8%,#2a1622 0%,transparent 52%),
      radial-gradient(640px 560px at 60% 112%,#0f2b26 0%,transparent 55%),#0a0a0d}
  .meter{display:flex;gap:8px}
  .meter i{display:block;width:30px;height:14px;border-radius:4px}
  .total{font-size:150px;font-weight:800;letter-spacing:-.03em;line-height:1}
  .total span{font-size:56px;font-weight:700;color:rgba(255,255,255,.55);margin-left:10px}
  .sub{font-size:30px;color:rgba(255,255,255,.72)}
  .split{font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:19px;color:rgba(255,255,255,.5)}
  .foot{position:absolute;bottom:34px;display:flex;align-items:center;gap:12px;
    font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:18px;color:rgba(255,255,255,.55)}
  .logo{width:30px;height:30px;border-radius:9px;background:linear-gradient(155deg,#ff8585,#d23a3a);
    display:flex;align-items:center;justify-content:center}
  .foot b{color:#f4f4f6;font-weight:650}
  </style></head><body>
  <div class="meter">${cells}</div>
  <div class="total">${fmtGB(p.totalBytes)}<span>GB</span></div>
  <div class="sub">of dev junk found on this Mac</div>
  <div class="split">${p.projectsCount} projects · ${fmtGB(p.nodeModulesBytes)} GB in node_modules · ${fmtGB(p.storeBytes)} GB in the pnpm store</div>
  <div class="foot"><span class="logo"><svg width="18" height="18" viewBox="0 0 32 32"><path d="M16 5 L26 10.5 V21.5 L16 27 L6 21.5 V10.5 Z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg></span><b>TidyDisk</b><span>·</span><span>free scan</span><span>·</span><span>tidydisk.app</span></div>
  </body></html>`
}
