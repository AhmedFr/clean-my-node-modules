# Landing page repositioning: "all developer disk waste"

**Date:** 2026-07-16
**Status:** approved, ready for planning
**Scope:** `site/` only (Next.js + Tailwind v4 marketing site). No app code.

## Problem

TidyDisk shipped well beyond `node_modules`: Docker cleanup (images / volumes /
containers / build cache, grouped by project), a real Caches surface (pnpm store +
Docker build cache), per-tab headline data-viz, and a read-only menu bar panel
dashboard. The landing page still pitches the product as a `node_modules` cleaner:
the statement band literally reads "node_modules is the heaviest object in the known
universe," Docker appears nowhere on the page, and the "coming soon" pill still
promises caches and build outputs as future work when some have shipped. Worse, the
hero mockup renders the *old* reclaimable-list panel, a UI that no longer exists.

Reposition the page so the top of the funnel pitches **all developer disk waste**
(projects + caches + packages + Docker), with `node_modules` as the lead example
rather than the whole product.

## Decisions

Every decision below was made explicitly during brainstorming, with the visual
companion used to choose the Areas layout.

### D1 — Full repositioning of the core message (not a feature bolt-on)

Rework the top-of-page copy and add a centerpiece section, rather than just appending
Docker to the existing feature list. The headline "A tidy disk, without thinking about
it." is already tool-agnostic and **stays**.

### D2 — Statement band evolves, keeps the joke

`band.statement` keeps "node_modules is the heaviest object in the known universe" as
the setup, then widens the punchline: it is not alone (Docker images, build caches,
dead projects pile up too) and TidyDisk clears all of it. Keeps the memorable hook
while making breadth the point. (Rejected: replacing it with a breadth-first line, or
leaving it node_modules-only.)

### D3 — Hero subhead broadens

`hero.body` names the surface: dev work leaves behind heavy `node_modules`, Docker
images, build caches, and forgotten experiments; TidyDisk watches from the menu bar
and gives it back in one click, safely, to the Trash, never `rm -rf`. Keeps the
existing safety close (the `<code>rm -rf</code>` ending the type requires).

### D4 — New "Areas" section: four peer cards (companion choice A)

A new section placed **immediately after the statement band, before the Features
rows**. Four equal cards — **Projects / Caches / Packages / Docker** — each with an
icon, a one-line description, and a size/severity mini-bar mirroring the app's new
dashboard rows. Docker carries a subtle accent border as the newest area. This is the
visual embodiment of "it is not just node_modules." (Rejected in the companion: an
aggregate segmented bar (B), and a tabbed app-window mock (C) which would compete with
the hero mockup for "show the app" duty.)

### D5 — Docker spotlight feature row

Add a fifth row to the existing alternating `Features` section, with a hand-built
`DockerVisual` (matching the existing `NotifVisual`/`LauncherVisual`/`ReclaimVisual`/
`PackagesVisual` style — inline TSX/SVG, no image assets) showing Docker resources
**grouped by project** (project rows with logos, resource-type badges, sizes) — the
story the app tells. This changes the `features` tuple from 4 to 5 entries (see D8).

### D6 — Caches promoted from "coming soon" to real

The Caches area is covered as a real, shipped surface (its Areas card in D4, plus its
existing grid presence). The `grid.comingSoonText` pill is rewritten so it teases
**only genuinely-future** work (npm / yarn / bun caches, `.next` / `dist` build
outputs) and no longer implies the pnpm store or Docker build cache are unshipped. No
claiming shipped things as future; no teasing done things as coming. Caches does **not**
get its own spotlight feature row (companion decision) — its promotion is via the Areas
card + the corrected pill.

### D7 — Hero mockup rebuilt for accuracy

`Hero/HeroScene.tsx` currently renders the old reclaimable-list panel (via `AppPanel`),
which no longer exists in the shipped app. Rebuild the in-hero mockup to show the new
menu bar **panel dashboard**: the "Tracked on disk" aggregate hero plus the four
click-through area bars (Projects / Caches / Packages / Docker). This is a
component/visual change, not copy. It doubles as live proof of the repositioning at the
very top of the page.

### D8 — All 5 locales in this pass

en/fr/es/de/pt are all live with hreflang and every string lives in all 5 dictionaries.
English (`dictionaries/en.tsx`, the byte-for-byte source of truth) is authored first,
then fr/es/de/pt are translated in the same effort. The `Dictionary` type contract
(`lib/i18n/i18n.types.ts`) **forces** this: changing the `features` tuple to 5 entries
and adding the `areas` slice will not compile until all 5 dictionaries implement them.
Constraints inherited from the dictionary header comment:
- `ReactNode` fields reproduce the **same JSX structure** across locales (identical
  tags/classNames: `<code>`, `<b>`, `<em>`, the accent `<span className="text-accent">`);
  only human text is translated.
- Technical tokens are **not** translated: `node_modules`, `rm -rf`, `pnpm`,
  `npm install`, `.next`, `dist`, paths, and brand names (`Docker`). Prices stay `€19`.
- **No em dashes in any language.**

### D9 — Also broaden SEO metadata

`meta.description` (plain string, all 5 locales) currently enumerates "every
node_modules folder, your pnpm store, and every installed package" — it is broadened to
add Docker and caches/build artifacts to that enumeration, so the SoftwareApplication
JSON-LD (`HomePage.tsx`) and page `<meta>` no longer describe a node_modules-only tool.
`meta.title` ("see what is eating your dev disk, reclaim it in one click") is already
tool-agnostic and **stays unchanged**. The two JSON-LD offers (free scan / €19) are
unchanged.

## Architecture

The site is fully component-assembled and dictionary-driven; nothing here changes that.
Copy lives only in dictionaries; components are presentational and read `dict` slices.

### New

- **`site/components/Areas/`** — the peer-cards section (`Areas.tsx`, `Areas.types.ts`,
  `index.ts`, optional `Areas.constants.ts` for the per-card icon ids/accent flags).
  Reads a new `dict.areas` slice. One card component or an inline map over the four
  cards; follows the existing `FeatureGrid` card styling (rounded-2xl border, 42px
  accent icon tile, display-font title) and the `reveal`/`d1`/`d2` scroll-in pattern.
- **`site/components/Features/DockerVisual.tsx`** — the hand-built Docker-by-project
  mockup for the new feature row, sibling to the other `*Visual` components.

### Changed

- **`site/lib/i18n/i18n.types.ts`** — add `AreaCardCopy` + `AreasCopy` interfaces and an
  `areas: AreasCopy` field on `Dictionary`; widen `features` from a 4-tuple to a
  **5-tuple**. `AreasCopy` holds a `kicker`, an accent `heading` (`ReactNode`), a `lead`,
  and exactly four `AreaCardCopy` entries (`title`, `copy`; icon + accent flag stay in
  the component per the existing grid-card convention).
- **`site/lib/i18n/dictionaries/{en,fr,es,de,pt}.tsx`** — for each: broadened `hero.body`
  (D3), evolved `band.statement` (D2), a new `areas` slice (D4), a 5th `features` entry
  for Docker (D5), rewritten `grid.comingSoonText` (D6), broadened `meta.description`
  (D9). en authored first; the other four translated from it.
- **`site/components/Features/Features.tsx`** — destructure the 5th feature and render a
  fifth `FeatureRow` (num "05", alternating `flip`, `visual={<DockerVisual />}`), giving
  it an `id="docker"` anchor.
- **`site/components/pages/HomePage/HomePage.tsx`** — import and render `<Areas dict=…/>`
  between `<StatementBand>` and `<Features>`.
- **`site/components/Hero/HeroScene.tsx`** — rebuild the in-hero mockup as the new panel
  dashboard (D7). If the shared `AppPanel`/`ui-mock` primitives no longer fit, add a
  focused mock local to HeroScene rather than reshaping shared primitives used elsewhere.

### Unchanged / out of scope

- `WhyLifecycle`, `HowItWorks`, `Download` (pricing), `FinalCta`, `Footer`, `Navbar`,
  blog. Navbar gains no new link (YAGNI; the Areas section is visible immediately below
  the hero and needs no jump link).
- The per-tab data-viz and the panel dashboard are reflected only through the hero
  mockup (D7) and the Areas cards, not as their own sections (companion decision).
- No new image assets; all visuals stay inline TSX/SVG per the site's convention.

## Testing / verification

The site has no unit tests for marketing components; correctness is enforced by the
type system and the build, plus visual review. Verification steps:

1. **`pnpm typecheck`** (in `site/`) — the single strongest gate: the `Dictionary`
   contract fails to compile until the `areas` slice and the 5-tuple `features` are
   implemented in **all five** dictionaries with the right shapes. A green typecheck
   proves no locale was left behind and no JSX-structure field is missing.
2. **`pnpm build`** — the static export of `/`, `/fr`, `/es`, `/de`, `/pt` succeeds.
3. **Visual review** — render `/` and at least one non-English locale (e.g. `/fr`) in a
   real browser (Playwright, as prior site work did): confirm the evolved band, the new
   Areas cards, the Docker feature row + visual, the rebuilt hero mockup, and the
   corrected coming-soon pill all render in-theme and the JSX structure held across
   locales.
4. **Em-dash sweep** of the changed dictionary copy in all five locales.

## Risks

- **5-tuple cascade:** widening `features` touches every dictionary and `Features.tsx`.
  The compiler catches omissions, so the risk is tedium, not silent breakage.
- **Translation quality:** fr/es/de/pt Docker/areas copy is machine-translated (same
  caveat as the rest of the site); a native-speaker skim is a reasonable follow-up
  `userAction`, not a blocker.
- **Hero mockup scope creep:** rebuilding `HeroScene` is the least bounded task. Keep the
  mock faithful-but-simple (hero number + four bars), not a pixel-clone of the app, and
  do not reshape shared `ui-mock` primitives other sections depend on.

## Out of scope

- App code, the release, and any pricing/offer change.
- New locales or a Docker-specific blog article (the blog already mentions Docker).
- A native-speaker proofread of the new translated copy (track as a follow-up).
