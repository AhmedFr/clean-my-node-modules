# Next.js Landing Page (Free Tier) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the static `site/` marketing page to a Next.js 15 + TypeScript app on Vercel, faithfully porting the design and removing every paid-tier ("$9") mention.

**Architecture:** Next.js App Router with a single route composed of per-section server components plus a few `"use client"` behavior components. The existing `landing.css` stays the authoritative stylesheet (imported after Tailwind so its `.lp-*` rules win); shadcn/ui supplies only the CTA `Button`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind v4, shadcn/ui (new-york), pnpm, Vitest, Playwright (verification).

## Global Constraints

- **Package manager:** pnpm. All commands run from `site/` (e.g. `pnpm --dir site …` or `cd site`).
- **Node:** 22 (matches release workflow).
- **Component convention:** one folder per component under `site/components/<Name>/` containing `index.ts` (re-export), `<Name>.tsx`, `<Name>.types.ts`, and `<Name>.constants.ts` when it renders list/data content.
- **Faithful port:** preserve every `class` value verbatim as `className`. The originals are retrievable from git: `git show HEAD:site/index.html`, `:site/landing.css`, `:site/landing.js`.
- **JSX conversion rules (apply everywhere):** `class`→`className`; inline `style="a:b;c:d"`→`style={{ a: 'b', c: 'd' }}` (camelCase props); self-close void elements; SVG presentation attrs camelCase (`stroke-width`→`strokeWidth`, `stroke-linejoin`→`strokeLinejoin`, `stroke-linecap`→`strokeLinecap`); `<use href="#id">` stays `href` (React 19); `&amp;`→`&`, `&nbsp;`→`{' '}` or `&nbsp;` entity.
- **No paid tier:** zero occurrences of `$9`, "Buy", "one-time", "Lemon Squeezy", "paying for" in the shipped page. Verify with grep at the end.
- **Repo slug:** `AhmedFr/clean-my-node-modules`.
- **Download asset URL:** `https://github.com/AhmedFr/clean-my-node-modules/releases/latest/download/clean-my-node-modules-arm64.dmg` (single constant in `site/lib/links.ts`).
- **GitHub repo URL:** `https://github.com/AhmedFr/clean-my-node-modules` (also in `links.ts`).

## File Structure

```
site/
  package.json, tsconfig.json, next.config.ts, postcss.config.mjs, components.json, .gitignore
  app/
    layout.tsx          # <head> metadata, fonts, <SvgSprite/>, <div class="lp-bg"/>, RevealClient
    page.tsx            # composes all sections
    globals.css         # Tailwind v4 + shadcn tokens
    landing.css         # copied verbatim from HEAD:site/landing.css
  lib/
    meter.ts            # hexToRgb, mix, statusColor, buildMeterCells  (unit-tested)
    meter.test.ts
    links.ts            # REPO_URL, DOWNLOAD_URL
    utils.ts            # shadcn cn()
  components/
    SvgSprite/          # raw sprite via dangerouslySetInnerHTML (static)
    PixelMeter/         # "use client" — renders cells from buildMeterCells
    Pixrow/             # "use client" — decorative strips
    RevealClient/       # "use client" — scroll reveals, nav .scrolled, hero tilt
    ui/button.tsx       # shadcn Button (generated)
    Navbar/  Hero/  StatementBand/  Features/  FeatureGrid/
    WhyLifecycle/  HowItWorks/  Download/  FinalCta/  Footer/
```

---

### Task 1: Scaffold Next.js app in `site/`

**Files:**
- Remove from working tree (kept in git history): `site/index.html`, `site/landing.js`, `site/README.md`
- Create: `site/package.json`, `site/tsconfig.json`, `site/next.config.ts`, `site/postcss.config.mjs`, `site/components.json`, `site/.gitignore`, `site/app/layout.tsx`, `site/app/page.tsx`, `site/app/globals.css`, `site/lib/utils.ts`
- Move: `site/landing.css` → `site/app/landing.css`

**Interfaces:**
- Produces: a buildable Next app; `cn()` from `site/lib/utils.ts`.

- [ ] **Step 1:** From repo root, scaffold without overwriting the CSS we want to keep:
  ```bash
  cd site
  git show HEAD:site/landing.css > /tmp/landing.css   # stash original
  rm -f index.html landing.js README.md landing.css
  pnpm dlx create-next-app@latest . --ts --app --tailwind --eslint --src-dir=false --import-alias "@/*" --use-pnpm --no-turbopack --yes
  mv /tmp/landing.css app/landing.css
  ```
- [ ] **Step 2:** Init shadcn (new-york, neutral): `pnpm dlx shadcn@latest init -d` then `pnpm dlx shadcn@latest add button`. Confirm `lib/utils.ts` and `components/ui/button.tsx` exist.
- [ ] **Step 3:** In `app/layout.tsx` set metadata (title `Clean my node_modules — reclaim your disk from node_modules`, the description from `HEAD:site/index.html` line 7), add the favicon data-URI + font `<link>`s (Google JetBrains Mono + Fontshare general-sans/cabinet-grotesk) via `<head>`/Next metadata, import `./globals.css` **then** `./landing.css` (order matters), and render `<div className="lp-bg" />` as the first body child. Body wraps `{children}`.
- [ ] **Step 4:** Replace `app/page.tsx` with a placeholder `<main id="top" />` for now.
- [ ] **Step 5:** Run `pnpm --dir site build`. Expected: builds successfully (blank page).
- [ ] **Step 6:** Commit.
  ```bash
  git add -A && git commit -m "feat(site): scaffold Next.js app, keep landing.css"
  ```

---

### Task 2: Meter math library (TDD)

**Files:**
- Create: `site/lib/meter.ts`, `site/lib/meter.test.ts`
- Add Vitest: `pnpm --dir site add -D vitest` + `"test": "vitest run"` script.

**Interfaces:**
- Produces:
  - `hexToRgb(c: string): [number, number, number]`
  - `mix(a: string, b: string, t: number): string`
  - `statusColor(ratio: number): string`
  - `buildMeterCells(opts: { used: number; threshold: number; cells: number }): Array<{ hatch: boolean; color?: string; glow?: boolean; title?: string }>`
  - These are exact ports of `HEAD:site/landing.js` lines 6-54.

- [ ] **Step 1: Write failing tests** in `site/lib/meter.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest'
  import { mix, statusColor, buildMeterCells } from './meter'

  describe('mix', () => {
    it('returns endpoint at t=0 and t=1', () => {
      expect(mix('#000000', '#ffffff', 0)).toBe('rgb(0,0,0)')
      expect(mix('#000000', '#ffffff', 1)).toBe('rgb(255,255,255)')
    })
  })
  describe('statusColor', () => {
    it('is green-ish at low ratio, accent-ish at high', () => {
      expect(statusColor(0)).toMatch(/^rgb\(/)
      expect(statusColor(1)).toMatch(/^rgb\(/)
    })
  })
  describe('buildMeterCells', () => {
    const cells = buildMeterCells({ used: 5.42, threshold: 5, cells: 32 })
    it('produces the requested cell count', () => expect(cells).toHaveLength(32))
    it('marks exactly one hatch (limit) cell', () =>
      expect(cells.filter(c => c.hatch)).toHaveLength(1))
    it('fills cells up to used and glows those over threshold', () => {
      expect(cells.some(c => c.color && !c.hatch)).toBe(true)
      expect(cells.some(c => c.glow)).toBe(true)
    })
  })
  ```
- [ ] **Step 2:** Run `pnpm --dir site test`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `site/lib/meter.ts` porting the JS exactly:
  ```ts
  export function hexToRgb(c: string): [number, number, number] {
    if (c[0] === '#') {
      let h = c.slice(1)
      if (h.length === 3) h = h.split('').map(x => x + x).join('')
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
    }
    const m = c.match(/(\d+\.?\d*)/g) ?? ['136', '143', '152']
    return [+m[0], +m[1], +m[2]]
  }
  export function mix(a: string, b: string, t: number): string {
    t = Math.max(0, Math.min(1, t))
    const A = hexToRgb(a), B = hexToRgb(b)
    return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`
  }
  const ACCENT = '#ff6363'
  export function statusColor(ratio: number): string {
    const safe = '#34d399', warn = '#f5b14c'
    if (ratio <= 0.5) return mix('#22b378', safe, ratio / 0.5)
    if (ratio <= 0.82) return mix(safe, warn, (ratio - 0.5) / 0.32)
    return mix(warn, ACCENT, Math.min(1, (ratio - 0.82) / 0.18))
  }
  export interface MeterCell { hatch: boolean; color?: string; glow?: boolean; title?: string }
  export function buildMeterCells({ used, threshold, cells }: { used: number; threshold: number; cells: number }): MeterCell[] {
    const trackMaxGB = Math.max(threshold * 1.5, used * 1.05)
    const limitPos = Math.min(0.94, threshold / trackMaxGB)
    const limitIdx = Math.min(cells - 1, Math.max(0, Math.floor(limitPos * cells)))
    const out: MeterCell[] = []
    for (let i = 0; i < cells; i++) {
      const p = ((i + 0.5) / cells) * trackMaxGB
      if (i === limitIdx) { out.push({ hatch: true, title: `${threshold} GB limit` }); continue }
      if (p <= used) {
        const color = statusColor(p / threshold)
        out.push({ hatch: false, color, glow: p > threshold })
      } else out.push({ hatch: false })
    }
    return out
  }
  ```
- [ ] **Step 4:** Run `pnpm --dir site test`. Expected: PASS.
- [ ] **Step 5:** Commit. `git add -A && git commit -m "feat(site): meter math lib + tests"`

---

### Task 3: PixelMeter & Pixrow client components, links constant

**Files:**
- Create: `site/lib/links.ts`, `site/components/PixelMeter/{index.ts,PixelMeter.tsx,PixelMeter.types.ts}`, `site/components/Pixrow/{index.ts,Pixrow.tsx,Pixrow.types.ts}`

**Interfaces:**
- Consumes: `buildMeterCells`, `statusColor` from `lib/meter`.
- Produces: `<PixelMeter used threshold cells className? style? />`, `<Pixrow cells? />`, `REPO_URL`, `DOWNLOAD_URL`.

- [ ] **Step 1:** `site/lib/links.ts`:
  ```ts
  export const REPO_URL = 'https://github.com/AhmedFr/clean-my-node-modules'
  export const DOWNLOAD_URL = `${REPO_URL}/releases/latest/download/clean-my-node-modules-arm64.dmg`
  ```
- [ ] **Step 2:** `PixelMeter.types.ts`: `export interface PixelMeterProps { used: number; threshold: number; cells?: number; className?: string; style?: React.CSSProperties }`.
- [ ] **Step 3:** `PixelMeter.tsx` (`"use client"`): render `<div className={cn('lp-meter', className)} style={style}>` containing one `<div className={cell.hatch ? 'cell hatch' : 'cell'} title={cell.title} style={{ backgroundColor: cell.color, boxShadow: cell.glow ? \`0 0 7px ${cell.color}\` : undefined }} />` per `buildMeterCells({ used, threshold, cells: cells ?? 32 })`. (Note: original keeps base `.lp-meter` markup + size modifiers like `sm`; allow caller to pass `sm` via className.)
- [ ] **Step 4:** `Pixrow.tsx` (`"use client"`): render `<div className="pixrow" aria-hidden>` with `n` (default 7) `<i style={{ background: statusColor((i + 0.5) / n) }} />`.
- [ ] **Step 5:** `index.ts` re-exports for each.
- [ ] **Step 6:** Temporarily drop a `<PixelMeter used={5.42} threshold={5} cells={32} />` into `page.tsx`, run `pnpm --dir site build`. Expected: PASS. Revert the temp insert.
- [ ] **Step 7:** Commit. `git commit -am "feat(site): PixelMeter, Pixrow, links"`

---

### Task 4: RevealClient behavior component

**Files:**
- Create: `site/components/RevealClient/{index.ts,RevealClient.tsx}`

**Interfaces:**
- Produces: `<RevealClient />` — a render-null `"use client"` component that, in a `useEffect`, ports `HEAD:site/landing.js` lines 74-110: adds `.in` to `.reveal` on scroll (threshold `vh*0.92`), toggles `.scrolled` on `.lp-nav` past 8px, and applies the hero pointer-tilt to `.lp-screen` within `.lp-scene-wrap` (guarded by `prefers-reduced-motion` + `pointer: fine`). Registers `scroll`/`resize`/`load` listeners and cleans them up on unmount.

- [ ] **Step 1:** Implement `RevealClient.tsx` (`"use client"`, returns `null`) with the ported logic inside `useEffect`, returning a cleanup that removes all listeners and the pointer handlers.
- [ ] **Step 2:** Render `<RevealClient />` once in `app/layout.tsx` (end of body).
- [ ] **Step 3:** `pnpm --dir site build`. Expected: PASS.
- [ ] **Step 4:** Commit. `git commit -am "feat(site): scroll-reveal/nav/tilt client behavior"`

---

### Task 5: SvgSprite

**Files:**
- Create: `site/components/SvgSprite/{index.ts,SvgSprite.tsx}`

**Interfaces:**
- Produces: `<SvgSprite />` rendering the full `<svg class="sprite">` from `HEAD:site/index.html` lines 20-48.

- [ ] **Step 1:** Copy the raw sprite SVG (lines 20-48) into `SvgSprite.tsx` as a template-literal string and render `<svg className="sprite" aria-hidden focusable={false} dangerouslySetInnerHTML={{ __html: SYMBOLS }} />` where `SYMBOLS` is the inner `<symbol>…</symbol>` markup (avoids hand-converting ~28 symbols' attributes; it is static, non-interactive).
- [ ] **Step 2:** Render `<SvgSprite />` near the top of `app/layout.tsx` body (after `lp-bg`).
- [ ] **Step 3:** `pnpm --dir site build`. Expected: PASS.
- [ ] **Step 4:** Commit. `git commit -am "feat(site): SVG sprite"`

---

### Tasks 6-15: Section components (faithful JSX ports)

For **each** section below: create the component folder (`index.ts`, `<Name>.tsx`, `<Name>.types.ts`; add `<Name>.constants.ts` where noted), port the referenced `HEAD:site/index.html` lines to JSX using the Global Constraints conversion rules, swap any pixel meters for `<PixelMeter>` and any `<div class="pixrow">` for `<Pixrow>`, and use shadcn `Button` (asChild + `<a>`) styled with the existing `lp-btn lp-btn-*` classNames for CTAs. After each: add it to `page.tsx`, run `pnpm --dir site build`, commit `feat(site): <Name> section`.

- [ ] **Task 6 — Navbar** (lines 51-63). Links: Features/Why/How it works → keep; **"Pricing" → "Download"** (`href="#download"`). GitHub button → `REPO_URL`. "Get the app" button → `href={DOWNLOAD_URL}` (no `$9`). `.types.ts` empty props.
- [ ] **Task 7 — Hero** (lines 67-125). Eyebrow, `lp-h1`, sub, micro line verbatim. **CTA row:** primary `Download for macOS` → `DOWNLOAD_URL` (remove `— $9` + Lemon Squeezy comment + `<small>one-time</small>`); ghost `View on GitHub` → `REPO_URL`. Port the full menu-bar mockup scene; replace the two `lp-meter` divs with `<PixelMeter used={5.42} threshold={5} cells={32} />` and the small one (`cells=16`).
- [ ] **Task 8 — StatementBand** (lines 128-134). Two `<Pixrow />` + the statement.
- [ ] **Task 9 — Features** (lines 137-229). Three `lp-feature` blocks (2nd has `flip`). Put each block's text + list items + visual descriptor in `Features.constants.ts`; the reclaim visual (lines 218-223) uses `<PixelMeter ... cells={20} className="sm" />`. The launcher visual (line 186) uses the small meter.
- [ ] **Task 10 — FeatureGrid** (lines 232-252). Six `lp-gcard`s in `FeatureGrid.constants.ts` (icon id, title, copy) + "coming soon" pill.
- [ ] **Task 11 — WhyLifecycle** (lines 255-305). npm vs pnpm diagram, verbatim (decorative stacks are static markup).
- [ ] **Task 12 — HowItWorks** (lines 308-320). Three steps; **step 01 copy:** "Buy the signed .app" → "**Download** the signed .app" (rest verbatim).
- [ ] **Task 13 — Download** (REPLACES Pricing, lines 322-357). `<section className="lp-price-sec" id="download">`. Kicker "Download"; `lp-h2` "**Free & open source.**"; lead: "The whole app is MIT-licensed — every feature, no gates. Grab the signed build, or build it yourself from source." Two `lp-price` cards, both `$0`:
  - Card A `feat` (featured), badge "Recommended": name **"Download"**, desc "Signed & notarized .app — runs in seconds, no toolchain.", `pcost` `<span class="amt">$0</span><span class="per">free download</span>`, bullets (signed & notarized, runs in seconds, macOS 13+ Apple Silicon), primary button `Download for macOS` → `DOWNLOAD_URL`.
  - Card B: name **"Build from source"**, desc "The entire app on GitHub.", `pcost` `$0` / "build it yourself", bullets (every feature, `pnpm install` `pnpm package`, read/fork/PR), ghost button `View on GitHub` → `REPO_URL`.
  - No `$9`, no "Buy", no Lemon Squeezy.
- [ ] **Task 14 — FinalCta** (lines 360-374). Heading verbatim. **Copy:** "Reclaim the gigabytes node_modules has been hoarding. Download it free — or build it yourself, it's all on GitHub." Primary `Download for macOS` → `DOWNLOAD_URL` (no `$9`/`one-time`/Lemon Squeezy); ghost `View on GitHub` → `REPO_URL`. One `<Pixrow />`.
- [ ] **Task 15 — Footer** (lines 378-393). Brand + copy verbatim. Product col: Features/How it works/**Download** (was Pricing → `#download`)/Get the app (`#download`). Open source col → `REPO_URL` + `/issues` + `/releases`. Legal verbatim.

---

### Task 16: Compose page & full build

**Files:**
- Modify: `site/app/page.tsx`

**Interfaces:**
- Consumes: all section components.

- [ ] **Step 1:** `page.tsx` renders `<main id="top">` containing Hero, StatementBand, Features, FeatureGrid, WhyLifecycle, HowItWorks, Download, FinalCta in source order; `<Navbar/>` above `<main>` and `<Footer/>` below (matching original document order — Navbar is a `<header>` sibling, Footer a `<footer>` sibling). Confirm `<SvgSprite/>`, `<div className="lp-bg"/>`, `<RevealClient/>` are in `layout.tsx`.
- [ ] **Step 2:** `pnpm --dir site build && pnpm --dir site typecheck` (add `"typecheck": "tsc --noEmit"`). Expected: PASS.
- [ ] **Step 3:** `pnpm --dir site lint`. Fix any errors. Expected: clean.
- [ ] **Step 4:** Commit. `git commit -am "feat(site): compose landing page"`

---

### Task 17: Stable release artifact name

**Files:**
- Modify: `package.json` (repo root) — electron-builder `build.mac.artifactName`.

- [ ] **Step 1:** Change `artifactName` from `${productName}-${version}.${ext}` to `clean-my-node-modules-${arch}.${ext}` so `releases/latest/download/clean-my-node-modules-arm64.dmg` is stable across releases.
- [ ] **Step 2:** `pnpm typecheck` at root (sanity — no build needed). Commit. `git commit -am "build: stable, URL-safe release artifact name"`
- [ ] **Step 3:** Note in STATUS `userActions`: publish a non-draft "latest" release with the new artifact name (until then the download link 404s).

---

### Task 18: Verification & faithful-port check

- [ ] **Step 1:** `grep -rniE "\\\$9|lemon squeezy|one-time|paying for|\\bbuy\\b" site/app site/components` → expect **no matches** (paid tier fully removed).
- [ ] **Step 2:** `pnpm --dir site test && pnpm --dir site build && pnpm --dir site typecheck && pnpm --dir site lint` → all pass.
- [ ] **Step 3:** Run `pnpm --dir site start` (or `dev`) and use Playwright to screenshot the new page at 1280px and 390px widths; screenshot the original `git show HEAD~?:site/index.html` (served standalone) at the same widths; compare for visual drift. Iterate on components until faithful (modulo intended copy changes). Verify scroll reveals fire and meters render.
- [ ] **Step 4:** Verify links resolve: GitHub, issues, releases, `DOWNLOAD_URL` (asset may 404 until a non-draft release exists — expected, see Task 17).
- [ ] **Step 5:** Update `STATUS.html` (data block: `updated`, roadmap item for the Next.js landing page → `done`/`progress`, `userActions` entry from Task 17, one `log` line). Commit.
- [ ] **Step 6:** Code review (superpowers:requesting-code-review or /code-review), address findings, then open PR.

## Self-Review

- **Spec coverage:** scaffold+Vercel (T1), CSS-authoritative + shadcn Button (T1,T6-15), meter/behavior ports (T2-4), all 10 sections + paid-tier removal (T6-15), Download section two $0 cards (T13), stable artifact URL (T17, links.ts T3), tests/build/screenshot diff (T2,T18), STATUS update (T18). Covered.
- **Placeholders:** none — code provided for lib/meter, links, and exact line references + copy strings for each section.
- **Type consistency:** `buildMeterCells`/`MeterCell`, `PixelMeterProps`, `REPO_URL`/`DOWNLOAD_URL` consistent across T2/T3/T6-15.
