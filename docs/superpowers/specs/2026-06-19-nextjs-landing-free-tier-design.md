# Next.js landing page (free tier) — design

**Date:** 2026-06-19
**Branch:** `nextjs-shadcn-landing-free-tier`
**Status:** Approved

## Goal

Migrate the static marketing site (`site/index.html` + `landing.css` + `landing.js`)
to a **Next.js 15 (App Router) + TypeScript** project deployed to **Vercel**, while
**removing every paid-tier ("$9") mention** so the app is presented as free & open
source. The visual design is ported **faithfully** — `landing.css` stays the source of
truth for the look; shadcn/ui is used only where it helps (CTA buttons).

## Decisions (locked)

- **Design approach:** Port the existing design faithfully. Keep `landing.css` as the
  authoritative stylesheet. shadcn used only for CTA buttons, styled to match `.lp-btn-*`.
- **Deploy target:** Vercel (full Next.js, no static export constraint).
- **Pricing section:** Replaced by a "Free & open source" **Download** section with two
  $0 cards — *Download (signed & notarized .app)* and *Build from source*.
- **Repo layout:** Replace `site/` in place. The static `index.html` / `landing.css` /
  `landing.js` are removed; `site/` becomes the Next.js app with its own `package.json`
  and `node_modules` (self-contained, not a pnpm workspace).
- **Download CTA:** Direct latest-release asset URL (see Download-URL section).

## Architecture

- **Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4 + shadcn/ui
  (new-york style), pnpm. Deployed on Vercel.
- **Routing:** Single route.
  - `app/layout.tsx` — `<head>` metadata (title, description, favicon data-URI, Google
    Fonts + Fontshare font links), renders the shared `<SvgSprite />` and `<div class="lp-bg">`,
    imports stylesheets.
  - `app/page.tsx` — composes the section components in order.
- **Stylesheets (import order matters):**
  1. `app/globals.css` — Tailwind v4 + shadcn tokens. **Tailwind preflight is the risk
     point**; `landing.css` is imported *after* so the bespoke `.lp-*` rules win. The
     bespoke classes are namespaced and set explicit sizes, so element-level preflight
     resets do not visually regress the port. Verified via the screenshot diff (see Testing).
  2. `app/landing.css` — the existing `site/landing.css`, copied ~verbatim.
- **Component convention (per repo + global CLAUDE.md):** one folder per component
  containing `index.ts`, `Component.tsx`, `Component.types.ts`, and `.constants.ts` when
  the component renders list/data content. Components live under `site/components/`.

### Components (server unless noted)

| Component | Responsibility | Notes |
|---|---|---|
| `SvgSprite` | The shared `<svg class="sprite">` symbol definitions | Static markup |
| `Navbar` | Sticky nav, brand, links, GitHub + Download CTAs | "Pricing" link → "Download" |
| `Hero` | Eyebrow, h1, sub, CTA row, micro line, menu-bar mockup scene | CTA → free Download |
| `StatementBand` | The "heaviest object" statement band w/ pixrows | |
| `Features` | 3 alternating feature blocks | row/visual data in `.constants.ts` |
| `FeatureGrid` | 6-card grid + "coming soon" pill | cards in `.constants.ts` |
| `WhyLifecycle` | npm-vs-pnpm lifecycle explainer | |
| `HowItWorks` | 3 numbered steps | step 01 copy de-paywalled |
| `Download` | **Replaces Pricing.** "Free & open source", two $0 cards | id="download" |
| `FinalCta` | Closing CTA card | free reframing |
| `Footer` | Brand, product links, OSS links, legal | "Pricing"→"Download" |

### Client components / behavior (ports of `landing.js`)

All marked `"use client"`; everything else stays a server component.

- `PixelMeter` — ports `buildMeter` + `statusColor`/`mix`/`hexToRgb`. Props: `used`,
  `threshold`, `cells`, plus passthrough `className`/`style`. Builds the cell grid in a
  `useEffect`/`useRef` (or directly during render with deterministic output).
- `Pixrow` — decorative pixel strips (ports the `.pixrow` fill loop).
- `useScrollReveal` hook (or a small `RevealProvider`) — adds `.in` to `.reveal`
  elements on scroll; also handles nav `.scrolled` toggle and the hero pointer-tilt.
  Respects `prefers-reduced-motion` and `pointer: fine` exactly as the original.

Color/meter helpers extracted to `site/lib/meter.ts` (single responsibility, unit-testable).

## Content changes — removing the paid tier

Every `$9` / "buy" / Lemon Squeezy reference is removed:

- **Hero CTA:** `Get the app — $9 one-time` → **`Download for macOS`** (free), → release asset.
- **Navbar:** `Get the app` button → Download; "Pricing" nav link → "Download".
- **How it works, step 01:** "Buy the signed .app — or clone the repo…" →
  "**Download** the signed .app — or clone the repo and build your own."
- **Final CTA copy:** "Reclaim the gigabytes you forgot you were paying for. Buy it once…"
  → free reframing, e.g. "Reclaim the gigabytes node_modules has been hoarding.
  Download it free — or build it yourself, it's all on GitHub."
- **Pricing → Download section (`id="download"`):** kicker "Download"; heading
  "**Free & open source.**"; two $0 cards:
  - **Download** (primary, featured): signed & notarized .app, runs in seconds, no
    toolchain → direct latest-release asset URL.
  - **Build from source**: clone, `pnpm install`, `pnpm package`; read it, fork it, PR →
    GitHub repo.
- Remove all `<!-- TODO: Lemon Squeezy … -->` comments.
- Footer "Pricing" link → "Download".

## Download-URL handling

The release pipeline (`.github/workflows/release.yml`) builds via electron-builder with
`artifactName: ${productName}-${version}.${ext}` → `Clean my node_modules-0.1.1.dmg`
(spaces + version) and publishes a **draft** release.

A stable `https://github.com/AhmedFr/clean-my-node-modules/releases/latest/download/<file>`
link requires: (a) a **version-less, URL-safe** asset name, and (b) a **published
(non-draft, non-prerelease)** "latest" release to exist.

**Plan:**
- Change electron-builder `artifactName` to `clean-my-node-modules-${arch}.${ext}`
  (e.g. `clean-my-node-modules-arm64.dmg`) so future releases produce a stable filename.
- Landing CTAs link to
  `https://github.com/AhmedFr/clean-my-node-modules/releases/latest/download/clean-my-node-modules-arm64.dmg`.
- **User actions (STATUS `userActions`):** publish a non-draft release with the new
  artifact name; until then the direct link 404s. Build-from-source card always works.

## Testing & verification

- `pnpm --dir site build` and `pnpm --dir site typecheck` pass; lint (Next default / biome) clean.
- Unit test `site/lib/meter.ts` (`statusColor`, `mix`, `buildMeter` cell output) with Vitest.
- **Faithful-port check:** Playwright screenshots of the new Next page vs the original
  static `site/index.html`, at desktop (1280) and mobile (390) widths; compare for drift.
  Iterate until visually faithful (modulo the intended paid-tier copy changes).
- Verify all CTAs/links resolve (GitHub, issues, releases, download asset).
- Vercel builds on deploy; optionally note (not necessarily add) a CI job for the site build.

## Out of scope

- Actual publishing of a release / changing release cadence (user action).
- Intel (x64) build — pipeline currently builds arm64 only; CTA targets arm64.
- Any Electron-app code changes beyond the `artifactName` tweak in release config.
- Analytics, i18n, blog, or additional routes.
