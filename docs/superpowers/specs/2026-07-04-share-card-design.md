# Share card: the screenshot-worthy scan result (#27)

**Date:** 2026-07-04
**Status:** Approved direction (user confirmed placement, content, and scope 2026-07-04) — spec for review before planning.
**Scope:** The in-app viral artifact: a post-scan "here's your damage" reveal and a one-click
copy-as-image share card, plus a dev-only demo-data seeding script for marketing captures.

## Why (decision record)

The free scan's number is the growth loop: a user's own shocking total, rendered beautifully,
shared with TidyDisk branding attached. This must be a **product feature** (every user shares
their own number), not a one-off marketing screenshot. For our own captures, a demo-data script
seeds the scan caches with a curated dataset so the real UI renders dream numbers repeatably;
no re-installing gigabytes of dependencies (the founder's machine is clean precisely because
the product works).

User-confirmed decisions:
1. **Placement:** post-scan reveal in the launcher (the emotional peak) + a small persistent
   share affordance near the header gauge for later.
2. **Card content: numbers only.** Total GB (huge), project count, node_modules vs pnpm-store
   split, pixel-meter motif, TidyDisk brand + tidydisk.app. Never project names or paths: zero
   privacy risk by construction, consistent with the analytics floor.
3. **Demo-data script ships in the same branch.**

## Part 1: the share card image

- **Rendering:** main process builds a self-contained HTML string (inline CSS, system fonts,
  the app's design tokens and pixel-meter motif) and loads it in a hidden offscreen
  `BrowserWindow` via a `data:` URL; `webContents.capturePage()` → `clipboard.writeImage()`;
  window destroyed after capture. No new renderer entry, no new dependencies, no disk writes.
- **Dimensions:** 1200×675 (16:9, social-crop-safe) captured at 2x (2400×1350 physical) for
  retina crispness.
- **Layout:** dark glass background (the landing's radial-gradient family), the red→green
  pixel-cell meter, a huge total (`247.3 GB`), subline `of dev junk found on this Mac`,
  breakdown line `N projects · X GB in node_modules · Y GB in the pnpm store`, footer
  `TidyDisk · free scan · tidydisk.app`. No em dashes.
- **New IPC:** `share:copy-card` (invoke) with a validated numeric payload
  `{ totalBytes, nodeModulesBytes, storeBytes, projectsCount }` from the renderer; main clamps
  and formats. Returns `{ ok: boolean }` for the toast ("Image copied. Paste it anywhere.").
- **Module:** `src/main/share/` (single responsibility): `render-card.ts` (pure
  payload → HTML string, unit-testable), `card-window.ts` (window lifecycle + capture),
  `index.ts`.

## Part 2: the reveal + affordances

- **Post-scan reveal (launcher):** when a manual scan completes, the launcher shows a `result`
  view before returning to the list: the big total (count-up animation, respecting
  `prefers-reduced-motion`), the breakdown line, and two actions: `Copy as image` and
  `Continue` (esc also continues). Background/scheduled scans do NOT interrupt: reveal only
  for user-initiated scans from the launcher.
- **Persistent affordance:** a small share icon next to the launcher header gauge, always
  available once a scan exists; same copy action, no reveal.
- The tray panel is unchanged (its scan flow stays lightweight).

## Part 3: demo-data seeding script (dev/marketing only)

- `scripts/demo-data.mjs`: writes `projects-cache.json` and `pnpm-store-cache.json` into the
  DEV userData directory with a curated dataset: ~14 plausible projects (generic names like
  `api-gateway`, `legacy-dashboard`, `hackathon-2024`; no real client names), sizes summing to
  ~240 GB with honest real-vs-linked splits, stale last-used dates, mixed frameworks; pnpm
  store ~30 GB. Backs up any existing cache files to `.bak` first; `--restore` puts them back.
  Refuses to touch a packaged app's data dir. Cache shapes mirror `project-store.ts` /
  `pnpm-store.ts` exactly.
- Marketing captures = seed, launch `pnpm dev`, do NOT re-scan, screenshot the real UI.

## Analytics

One new event (extends the launch-funnel list to 10): `share_card_copied`
`{ total_gb, source: 'reveal' | 'header' }`, captured in the main-process IPC handler behind
the existing gate. It measures the viral loop directly.

## Out of scope

Sharing to specific networks (no share sheets), saving to file, card theming, project names on
the card, panel-side reveal, watermark-free unlocked variants. The card is identical for Free
and Pro users: it advertises the scan, which is free.

## Success criteria

- Scan from the launcher → reveal appears with correct numbers → Copy as image → a paste into
  any app shows the 2x card with correct numbers and branding.
- Header share icon works without a fresh scan (uses current totals).
- `share_card_copied` lands in PostHog (packaged app) with total_gb + source.
- Demo script seeds, app renders the dataset without a scan, `--restore` returns the real data.
- All gates green; render-card unit tests cover formatting, clamping, and payload validation.
