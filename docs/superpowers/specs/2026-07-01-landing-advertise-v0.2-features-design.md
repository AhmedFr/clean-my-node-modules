# Landing page — advertise the v0.2.0 features

**Date:** 2026-07-01
**Status:** Approved (design) — implementation deferred to a `feat/landing-v0.2-features` branch
**Scope:** `site/` only. No changes to the Electron app.

## Problem

Since v0.1.2 the app grew three real capabilities — a computer-wide **Packages** tab,
honest **real-vs-linked** pnpm sizing, and a **pnpm store Prune** in the Caches tab — but the
landing page still sells exactly one promise: *delete stale `node_modules`*. Every section
funnels that single story. New visitors have no idea the app now sees the pnpm store and
every installed package.

## Goal

Reposition the page around **"see and reclaim all the disk your JS dependencies cost"** — the
three surfaces the app now covers: project `node_modules`, the pnpm store, and every installed
package — while keeping `node_modules` as the concrete, searchable hook.

## Non-goals

- No change to the visual language / design tokens (`landing.css` stays the source of truth).
- No new page or route; all changes are edits to existing `site/` sections.
- Download / pricing stay as-is: free, OSS, CTA → latest GitHub release.
- No changes to the Electron app or its components.
- No A/B testing infrastructure.

## Positioning through-line

| Surface | Old framing | New framing |
| --- | --- | --- |
| Project `node_modules` | "the heaviest object in the universe — delete it" | unchanged, still the hook |
| pnpm store | mentioned once, in the lifecycle section | a first-class thing you can safely **Prune** |
| Installed packages | absent | **know every package** across your machine |

Headline promise moves from *"Get your disk back from node_modules"* to
*"Reclaim every byte your **dependencies** cost."*

## Section-by-section design

### 1. Hero — copy + scene (`components/Hero`, `components/AppPanel`)

**Copy** (chosen direction "dependencies cost"):

- Eyebrow: unchanged — `Open source · macOS menu bar app`
- H1: **`Reclaim every byte your `**`<span class="accent">dependencies</span>`**` cost.`**
- Subhead: *"Clean my node_modules lives in your menu bar and tracks every `node_modules`
  folder, your pnpm store, and every package you've installed on your Mac — see what they
  cost, then reclaim it safely. To the Trash, never `rm -rf`."*
- CTAs + micro-line (`MIT-licensed · macOS 13+ · Apple Silicon & Intel`): unchanged.

**Scene — option A (chosen):** keep the menu-bar dropdown panel (`AppPanel`) as the anchor —
it is the "lives in your menu bar" identity. Add **one floating Packages mini-card** to the
scene, positioned as a second floating element near the existing "Reclaimed 612 MB" toast.

- New markup only inside `Hero`'s `.lp-screen` scene (a `.scene-packages` card); no change to
  `AppPanel` itself.
- Card contents: a compact header (`Packages · 3 in use`) and 2–3 rows, each with package
  name, a `12 projects` usage chip, a size, and — on at least one row — a `unify` badge and a
  small severity/advisory pill. Static, illustrative (mirrors the real `PackageRow`), same
  glass-panel treatment as the existing toast/panel.
- New CSS in `landing.css` for `.scene-packages` (position, the badge, the advisory pill),
  reusing existing tokens. Respect `prefers-reduced-motion` for any entrance.

### 2. StatementBand (`components/StatementBand`)

No change. *"node_modules is the heaviest object in the known universe. We help you delete
it."* still works as the punch line under the broadened hero.

### 3. Features — numbered blocks (`components/Features`)

Add a **fourth numbered block** and fold one line into an existing block. Final order and
alternating layout: `01` (normal), `02` (flip), `03` (normal), **`04` (flip, new)**.

- `01 Always watching` — unchanged.
- `02 Total clarity` — add one bullet/sentence on **honest real-vs-linked sizing**: *"On pnpm,
  each folder shows the real bytes you'd free, separately from what's linked into the shared
  store — so the number is the truth, not double-counting."*
- `03 Safe payoff` — unchanged.
- **`04 Every package, accounted for` (NEW)** — the Packages tab.
  - Tag: `04` · `Whole-machine view`
  - H3: *"Every package you've installed — in one list."*
  - Body: *"Open the Packages tab for a computer-wide inventory of every dependency your
    projects pull in: how many projects use it, its size, the versions you're on, the latest
    on npm, and any security advisories. Spot the heavy and unused, unify versions that have
    drifted apart, and see what's flagged — all from projects you've already scanned."*
  - Bullets: `See how many projects use each package · its real size`;
    `A "unify" badge when the same package is installed at different versions`;
    `Latest-on-npm and security-advisory pills — expand a row for per-version severity`.
  - Visual (`.lp-feat-visual`): a mock packages list — 3–4 rows echoing the real `PackageRow`
    (name, `N projects`, versions with a `unify` badge on one, size, an "update available"
    chip, an advisory pill on one). Built with plain markup + `landing.css`, no app imports.

### 4. FeatureGrid (`components/FeatureGrid` + `.constants.ts`)

Refresh the card set so the new capabilities that don't get a full block are represented.
Grid renders whatever the constants array holds; target **eight** cards:

1. `Prune the pnpm store` (NEW) — *"Reclaim the shared store's dead versions with one safe
   click — it never deletes the store itself."* icon: `i-broom` (new) or `i-hdd`.
2. `Honest real-vs-linked sizing` (NEW) — *"On pnpm, see the bytes you'd actually free apart
   from what's linked into the store."* icon: `i-layers` (new) or `i-hdd`.
3. `Security advisories` (NEW) — *"A severity pill on any package with a known vulnerability,
   drawn from the npm advisory database."* icon: `i-shield` (new).
4. `Scheduled scans` — keep.
5. `Threshold alerts` — keep.
6. `Pixel disk meter` — keep.
7. `Reveal in Finder` — keep.
8. `Open in your editor` — keep.

`Framework detection` is dropped from the grid (still implied by the launcher visuals). If the
grid layout looks unbalanced at 8, fall back to 6 by also dropping `Reveal in Finder` /
`Open in editor` — decided during implementation against the rendered result.

### 5. WhyLifecycle (`components/WhyLifecycle`)

Make the existing "works both ends" footer literally true and add the honest-sizing idea:

- Keep the npm-vs-pnpm diagram and copy.
- The `.lp-explain-foot` already claims the app "safely prunes your pnpm store" — reinforce it
  with a short inline pill/line stating the **Caches tab** is where you do it (one click,
  `pnpm store prune`, never deletes the store).
- Add one sentence tying honest sizing to the diagram: *"That's also why sizes look small on
  pnpm — we count the shared store once and show you what's really yours to free."*

### 6. HowItWorks (`components/HowItWorks`)

Light copy only, still three steps. Broaden step 3 so it isn't `node_modules`-only:

- Step 3 body: *"When you cross the line, review the stale folders — or prune the pnpm store,
  or audit a heavy package — and reclaim the space. Your disk thanks you."*

### 7. Metadata + OG image (`app/layout.tsx`, `app/og/page.tsx`, `scripts/make-og.mjs`, `public/og.png`)

- Update the `<meta>` description / Open-Graph + Twitter description from the node_modules-only
  line to the broadened promise (e.g. *"See and reclaim all the disk your JS dependencies cost
  — every node_modules folder, your pnpm store, and every installed package. Free, open
  source, macOS menu bar app."*).
- Update the OG card copy in `app/og` to match the new H1, then re-render `public/og.png` via
  `scripts/make-og.mjs`.

### 8. Navbar (`components/Navbar`)

If the navbar renders section anchors, add a `Packages` (or `#features` already covers it)
link pointing at the new `04` block; if the nav is CTA-only, no change. Confirm on
implementation.

## New assets

- SVG sprite (`components/SvgSprite` / `components/Icon`): add `i-broom` (or reuse `i-hdd`),
  `i-layers`, `i-shield` for the new grid cards. Only add what's actually used.
- Refreshed `public/og.png` from the updated OG route.

## Data honesty / copy rules

- Registry-derived claims (latest version, advisories) must stay hedged the way the app is:
  they're optional, cached 24h, and everything local works offline. Don't imply real-time
  scanning of npm.
- Sizes/counts in mock visuals are illustrative and should look plausible (consistent with the
  existing hero numbers, e.g. 5.42 GB / 612 MB).

## Testing / verification

- `site/`: `pnpm --dir site lint`, `pnpm --dir site build`, and the existing DOM/vitest checks
  stay green.
- Visual pass in the browser at desktop + mobile widths (the page is already responsive;
  new sections must not break the `reveal` scroll animations or the pixel meter).
- Re-render and eyeball `public/og.png`.

## Rollout

- Branch `feat/landing-v0.2-features`; PR with CI green; user reviews before merge.
- Independent of the app release — ships whenever, and benefits from v0.2.0 being published so
  the Download CTA resolves to the newest build.

## Implementation checklist

1. Hero copy + `.scene-packages` mini-card (markup + `landing.css`).
2. New `04` Features block + honest-sizing line in `02`.
3. FeatureGrid constants refresh (+ any new icons in the sprite).
4. WhyLifecycle footer/pill + honest-sizing sentence.
5. HowItWorks step-3 copy.
6. Metadata + OG description + re-rendered `og.png`.
7. Navbar anchor (if applicable).
8. Lint, build, browser pass, OG re-render.
