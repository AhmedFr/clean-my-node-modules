# Share Card Implementation Plan (#27)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The screenshot-worthy scan result: a post-scan reveal in the launcher and a one-click copy-as-image share card (numbers only, TidyDisk-branded), plus a dev-only demo-data seeding script.

**Architecture:** Main process builds a self-contained HTML card (`src/main/share/render-card.ts`, pure + unit-tested) and captures it in a hidden offscreen BrowserWindow (`card-window.ts`) straight to the clipboard at 2x. One new invoke channel `share:copy-card` with a validated numeric payload; one new analytics event `share_card_copied`. Renderer gains a `result` view (count-up reveal) and a header share icon. `scripts/demo-data.mjs` seeds the two scan caches for marketing captures.

**Tech Stack:** Existing Electron/React/vitest stack. Zero new dependencies.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-04-share-card-design.md`. Card is **numbers only** (never project names/paths); identical for Free and Pro; card dims 1200×675 CSS px captured at 2x; footer contains `TidyDisk` and `tidydisk.app`.
- **No em dashes in any user-visible string** (card, reveal, toasts). Middots `·` are fine.
- New analytics event name verbatim: `share_card_copied` with props `{ total_gb, source: 'reveal' | 'header' }`, captured in the MAIN process handler behind the existing gate. It joins `ANALYTICS_EVENTS` but NOT `RENDERER_EVENTS`.
- Reveal appears only for launcher-initiated scans (the existing `scanning` view's `onDone`); background scans never interrupt; tray panel unchanged.
- Payloads from the renderer are untrusted: validate/clamp in main (`coerceCardPayload`), reject non-finite/negative, cap at 1e15 bytes, reject `totalBytes <= 0`.
- Cache shapes for the demo script are authoritative in code: `projects-cache.json` = `{ projects: Project[], lastScanTime: number }` (`src/main/projects/project-store.ts`), `pnpm-store-cache.json` = `{ key: string, info: PnpmStoreInfo }` with default-overrides key `'|'` (`src/main/pnpm-store/pnpm-store.ts`); `Project` per `src/shared/project.types.ts` (13 fields incl. `uniqueSize?`, `kind` from the `FrameworkKind` union).
- Branch `feat/share-card` (checked out). pnpm. Gates: `pnpm typecheck && pnpm lint && pnpm test` (+ build at ship). Conventional commits. One folder per renderer component. Never `git add -A`.

## File Structure

```
src/shared/share.types.ts                    ShareCardPayload (shared main↔renderer)
src/main/share/render-card.ts + .test.ts     coerceCardPayload, fmtGB, renderCardHtml, CARD_* consts
src/main/share/card-window.ts                offscreen window + capturePage + clipboard
src/main/share/index.ts                      barrel
src/shared/ipc.constants.ts                  + copyShareCard: 'share:copy-card'
src/main/analytics/analytics.ts              + 'share_card_copied' in ANALYTICS_EVENTS
src/main/ipc/register-ipc.ts + .test.ts      handler + validation + analytics capture
src/preload/index.ts + api.types.ts          bridge
src/renderer/src/components/ResultView/      index.ts, ResultView.tsx, ResultView.types.ts
src/renderer/src/launcher/LauncherApp/*      'result' view wiring + header share button
scripts/demo-data.mjs                        seed/restore the scan caches (dev only)
```

---

### Task 1: Card renderer (pure) + payload validation

**Files:** Create `src/shared/share.types.ts`, `src/main/share/render-card.ts`, `src/main/share/render-card.test.ts`.

**Interfaces (later tasks consume):** `ShareCardPayload = { totalBytes: number; nodeModulesBytes: number; storeBytes: number; projectsCount: number; source?: 'reveal' | 'header' }`; `coerceCardPayload(raw: unknown): ShareCardPayload | null` (source defaults to `'reveal'`); `fmtGB(bytes: number): string`; `renderCardHtml(p: ShareCardPayload): string`; `CARD_WIDTH = 1200`, `CARD_HEIGHT = 675`, `CARD_SCALE = 2`.

- [ ] **Step 1: shared type** `src/shared/share.types.ts`:

```ts
/** Untrusted renderer payload for the share card; main validates via coerceCardPayload. */
export interface ShareCardPayload {
  totalBytes: number
  nodeModulesBytes: number
  storeBytes: number
  projectsCount: number
  /** Where the copy was triggered from; analytics only. */
  source?: 'reveal' | 'header'
}
```

- [ ] **Step 2: failing tests** `src/main/share/render-card.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { coerceCardPayload, fmtGB, renderCardHtml } from './render-card'

const GB = 1024 ** 3
const valid = { totalBytes: 247.3 * GB, nodeModulesBytes: 214 * GB, storeBytes: 33.3 * GB, projectsCount: 14 }

describe('coerceCardPayload', () => {
  it('accepts a valid payload and defaults source to reveal', () => {
    expect(coerceCardPayload(valid)).toMatchObject({ ...valid, source: 'reveal' })
    expect(coerceCardPayload({ ...valid, source: 'header' })?.source).toBe('header')
  })
  it('rejects garbage, negatives, non-finite, missing fields, zero total, bad source', () => {
    for (const bad of [
      null, 42, 'x', {},
      { ...valid, totalBytes: -1 },
      { ...valid, storeBytes: Number.NaN },
      { ...valid, projectsCount: Number.POSITIVE_INFINITY },
      { ...valid, totalBytes: 0 },
      { ...valid, source: 'evil' },
      (() => { const { storeBytes, ...rest } = valid; return rest })(),
    ]) {
      expect(coerceCardPayload(bad)).toBeNull()
    }
  })
  it('caps absurd values at 1 PB', () => {
    expect(coerceCardPayload({ ...valid, totalBytes: 1e18 })?.totalBytes).toBe(1e15)
  })
})

describe('fmtGB', () => {
  it('scales decimals with magnitude', () => {
    expect(fmtGB(3.217 * GB)).toBe('3.22')
    expect(fmtGB(47.31 * GB)).toBe('47.3')
    expect(fmtGB(247.3 * GB)).toBe('247')
  })
})

describe('renderCardHtml', () => {
  const html = renderCardHtml({ ...valid, source: 'reveal' })
  it('contains the numbers, the brand, and the domain', () => {
    expect(html).toContain('247')
    expect(html).toContain('14 projects')
    expect(html).toContain('TidyDisk')
    expect(html).toContain('tidydisk.app')
  })
  it('never contains em dashes or project-identifying content', () => {
    expect(html).not.toContain('—')
  })
})
```

- [ ] **Step 3: run to see them fail** (`pnpm test -- src/main/share/render-card.test.ts` → module missing)
- [ ] **Step 4: implement** `src/main/share/render-card.ts`:

```ts
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

const METER = ['#e23d3d', '#e8503c', '#ef683c', '#f5883f', '#f5b14c', '#c9c25a', '#8fcf72', '#57d489', '#34d399', '#34d399', 'rgba(255,255,255,.14)', 'rgba(255,255,255,.14)']

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
```

- [ ] **Step 5: green + gates** (`pnpm test -- src/main/share && pnpm typecheck && pnpm lint`)
- [ ] **Step 6: commit** `feat(share): card renderer + payload validation`

---

### Task 2: Capture window, IPC, analytics event

**Files:** Create `src/main/share/card-window.ts`, `src/main/share/index.ts`. Modify `src/shared/ipc.constants.ts`, `src/main/analytics/analytics.ts`, `src/main/ipc/register-ipc.ts`, `src/main/ipc/register-ipc.test.ts`, `src/preload/api.types.ts`, `src/preload/index.ts`.

**Interfaces:** `copyCardToClipboard(payload): Promise<boolean>`; IPC `share:copy-card` → `{ ok: boolean }`; renderer API `copyShareCard(payload: ShareCardPayload): Promise<{ ok: boolean }>`; `'share_card_copied'` appended to `ANALYTICS_EVENTS` (NOT `RENDERER_EVENTS`).

- [ ] **Step 1:** `card-window.ts`:

```ts
import { BrowserWindow, clipboard } from 'electron'
import type { ShareCardPayload } from '@shared/share.types'
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
```

`index.ts` barrel: export `copyCardToClipboard`, re-export `coerceCardPayload`.

- [ ] **Step 2:** constants: `copyShareCard: 'share:copy-card',` in the invoke section. Analytics: append `'share_card_copied'` to `ANALYTICS_EVENTS` (leave `RENDERER_EVENTS` alone).
- [ ] **Step 3: failing tests** in `register-ipc.test.ts` — mock the share module at the top (call-time arrow around a hoist-safe spy, same pattern as the action mocks):

```ts
const copyCardToClipboard = vi.fn(async () => true)
vi.mock('../share', () => ({
  copyCardToClipboard: (p: unknown) => copyCardToClipboard(p),
  coerceCardPayload: (await import('../share/render-card')).coerceCardPayload,
}))
```

(If top-level await inside the factory fights the hoisting, mock only `../share/card-window` and let `register-ipc.ts` import `coerceCardPayload` from `../share/render-card` directly; adjust the handler import accordingly and note it in the report.)

New cases:

```ts
  it('share:copy-card rejects garbage without opening a window or capturing', async () => {
    const { analytics } = makeCtx(false)
    expect(await invoke(IPC.copyShareCard, { totalBytes: -5 })).toEqual({ ok: false })
    expect(copyCardToClipboard).not.toHaveBeenCalled()
    expect(analytics.capture).not.toHaveBeenCalled()
  })

  it('share:copy-card copies and captures share_card_copied with source', async () => {
    const { analytics } = makeCtx(false)
    const GBv = 1024 ** 3
    const res = await invoke(IPC.copyShareCard, {
      totalBytes: 247.3 * GBv, nodeModulesBytes: 214 * GBv, storeBytes: 33.3 * GBv,
      projectsCount: 14, source: 'header',
    })
    expect(res).toEqual({ ok: true })
    expect(analytics.capture).toHaveBeenCalledWith('share_card_copied', { total_gb: 247.3, source: 'header' })
  })
```

- [ ] **Step 4: handler** in `register-ipc.ts` (imports from `../share`):

```ts
  ipcMain.handle(IPC.copyShareCard, async (_e, raw: unknown) => {
    const payload = coerceCardPayload(raw)
    if (!payload) return { ok: false }
    const ok = await copyCardToClipboard(payload)
    if (ok) {
      ctx.analytics.capture('share_card_copied', {
        total_gb: Math.round((payload.totalBytes / GB) * 10) / 10,
        source: payload.source ?? 'reveal',
      })
    }
    return { ok }
  })
```

- [ ] **Step 5: preload** — `api.types.ts`: `copyShareCard(payload: ShareCardPayload): Promise<{ ok: boolean }>` (+ type import); `index.ts`: `copyShareCard: (payload) => ipcRenderer.invoke(IPC.copyShareCard, payload),`
- [ ] **Step 6: gates** full (`pnpm typecheck && pnpm lint && pnpm test`)
- [ ] **Step 7: commit** `feat(share): offscreen capture + share:copy-card IPC + funnel event`

---

### Task 3: Reveal view + header share button

**Files:** Create `src/renderer/src/components/ResultView/` (`index.ts`, `ResultView.tsx`, `ResultView.types.ts`). Modify `src/renderer/src/launcher/LauncherApp/LauncherApp.types.ts` (add `'result'` to `LauncherView`), `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`.

**Interfaces:** `<ResultView accent totalBytes nodeModulesBytes storeBytes projectsCount copied onCopy onContinue />`.

- [ ] **Step 1:** `ResultView.types.ts`:

```ts
export interface ResultViewProps {
  accent: string
  totalBytes: number
  nodeModulesBytes: number
  storeBytes: number
  projectsCount: number
  /** true briefly after a successful copy, drives the button label */
  copied: boolean
  onCopy: () => void
  onContinue: () => void
}
```

- [ ] **Step 2:** `ResultView.tsx` — centered column styled like `ScanningView` (padding `46px 30px 50px`): a count-up total using `formatSizeStr` (from `@renderer/lib/format`), animated over ~900ms with `requestAnimationFrame` and an ease-out curve, skipped entirely when `window.matchMedia('(prefers-reduced-motion: reduce)').matches`; a subline `Found across N projects · X in node_modules · Y in the pnpm store` (use `formatSizeStr` for X/Y); two buttons: `<button className="cc-btn danger" style={{ background: accent }} onClick={onCopy}>{copied ? 'Copied. Paste anywhere' : 'Copy as image'}</button>` and `<button className="cc-btn ghost" onClick={onContinue}>Continue</button>`. Title line above the number: `Your damage report`. No em dashes anywhere.
- [ ] **Step 3: LauncherApp wiring:**
  - `LauncherView` union gains `'result'`.
  - Scanning handoff (line ~468): `onDone={() => setView(totalUsed > 0 ? 'result' : 'list')}` (empty machines skip the reveal).
  - State: `const [cardCopied, setCardCopied] = useState(false)`; callback:

```ts
  const copyCard = useCallback(
    (source: 'reveal' | 'header') => {
      void window.clean
        .copyShareCard({
          totalBytes: totalUsed,
          nodeModulesBytes: Math.max(0, totalUsed - storeBytes),
          storeBytes,
          projectsCount: projects.length,
          source,
        })
        .then(({ ok }) => {
          if (!ok) return
          setCardCopied(true)
          setTimeout(() => setCardCopied(false), 2200)
          if (source === 'header') {
            flashToast({ icon: UIIcon.checkCircle, text: 'Image copied. Paste it anywhere.', tone: 'good' })
          }
        })
    },
    [totalUsed, storeBytes, projects.length, flashToast],
  )
```

  - Render: `{view === 'result' && (<ResultView accent={accent} totalBytes={totalUsed} nodeModulesBytes={Math.max(0, totalUsed - storeBytes)} storeBytes={storeBytes} projectsCount={projects.length} copied={cardCopied} onCopy={() => copyCard('reveal')} onContinue={() => setView('list')} />)}` next to the existing `view === 'scanning'` line.
  - Keyboard: in the Escape branch, before the confirm handling: `if (view === 'result') { setView('list'); return }` (deps already include `view`).
  - Header share button: next to the `<Gauge …/>` (line ~430), a small icon button (reuse the header's existing icon-button styling around it) with `title="Copy your scan as an image"`, `onClick={() => copyCard('header')}`, rendered only when `totalUsed > 0`. Icon: reuse an existing `UIIcon` glyph if one fits (e.g. a share/arrow glyph); if none exists, add a minimal `share` glyph to `UIIcon` following that file's pattern.
- [ ] **Step 4: gates** full suite + typecheck + lint (no new unit tests: renderer shell pattern).
- [ ] **Step 5: commit** `feat(share): post-scan damage reveal + header copy-as-image`

---

### Task 4: Demo-data seeding script

**Files:** Create `scripts/demo-data.mjs`. Modify `package.json` (script `"demo": "node scripts/demo-data.mjs"`).

- [ ] **Step 1:** the script:
  - Default target dir `~/Library/Application Support/tidydisk` (the dev userData for app name `tidydisk`); `--user-data <path>` overrides; refuse (exit 1 with message) if the dir does not exist.
  - `--restore`: move `projects-cache.json.bak` / `pnpm-store-cache.json.bak` back over the live files (error politely if no backups).
  - Seeding: back up existing live files to `.bak` first (never overwrite an existing `.bak`: refuse and tell the user to `--restore` first). Then write:
    - `projects-cache.json`: `{ projects, lastScanTime: Date.now() - 2 * 3600e3 }` with 14 projects, generic names (`api-gateway`, `legacy-dashboard`, `hackathon-2024`, `ecommerce-v2`, `design-system`, `mobile-app`, `analytics-pipeline`, `docs-site`, `chat-prototype`, `ml-experiments`, `portfolio-2023`, `admin-panel`, `game-jam`, `microservice-auth`), `path`/`absPath` under `~/dev/<name>`, `id` = `demo-<n>`, mixed `kind`s from the `FrameworkKind` union, `size` values summing to ~214 GB (biggest ~38 GB, long tail), `uniqueSize` at 55-85% of size, `lastUsed` spread 30-400 days back.
    - `pnpm-store-cache.json`: `{ key: '|', info: { available: true, path: <home>/Library/pnpm/store/v10, displayPath: '~/Library/pnpm/store/v10', sizeBytes: ~33 GB, checkedAt: Date.now(), source: 'pnpm', canPrune: true } }`.
  - Prints what it wrote and the restore command. Plain node, zero deps, no em dashes in output.
- [ ] **Step 2: verify by hand:** run seed → `cat` both files → run with `--restore` → originals back. Paste the transcript in the report. (No vitest: the script is dev tooling; correctness is the manual round-trip.)
- [ ] **Step 3: commit** `feat(tooling): demo-data seeder for marketing captures`

---

### Task 5: Verification + ship (controller)

- [ ] Full gates + build; manual dev pass (scan → reveal → copy → paste; header icon; demo seed → capture → restore).
- [ ] Final review; push; PR `feat/share-card` → main (closes #27); STATUS update.

## Out of scope (per spec)

Share sheets, save-to-file, card theming, project names on the card, panel reveal.
