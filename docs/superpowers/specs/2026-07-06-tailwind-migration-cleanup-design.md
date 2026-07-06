# Site Tailwind migration + component splits + repo cleanup

Date: 2026-07-06
Status: awaiting user review
Branch (implementation): feat/site-tailwind
Sequenced BEFORE the i18n + SEO project (2026-07-06-i18n-seo-design.md): both
touch every component, styling first keeps each PR reviewable.

## Goal

The site is already TypeScript; its styling is not Tailwind: a 484-line
hand-written `landing.css` + `blog.css` sit next to an installed-but-unused
Tailwind v4. Migrate all styling to Tailwind utilities with a pixel-faithful
result (user decision 2026-07-06), split oversized components, and clean the
repo of dead weight the user approved for deletion.

## Decisions made with the user (2026-07-06)

- Pixel-faithful: the deployed site must look identical before/after,
  verified by screenshot comparison. Zero design drift.
- Cleanup scope: design handoff bundle goes; video project,
  TIDYDISK-LAUNCH.html, and the local certificate files STAY.
- Approach: utilities on components + `@theme` tokens (option A), not
  `@apply` translation.

## Design

### Tokens and residual CSS

`site/app/globals.css` becomes the only CSS file:

- Tailwind import + `@theme` block: the `landing.css` custom properties become
  Tailwind tokens — colors (`bg`, `bg-soft`, `panel`, `ink`, `ink-2/3/4`,
  `line`, `line-2`, `accent`, `accent-deep`, `green`, `amber`), font families
  (`display`, `ui`, `mono`), and the `--maxw` content width.
- A small residual layer (~80 lines) for what utilities cannot express:
  `reveal` animation + keyframes, the `.lp-bg` noise `::after` overlay,
  `::selection`, the `.lp-nav.scrolled` state (toggled by RevealClient), and
  `.blog-prose` (markdown-rendered HTML cannot carry utility classes).
- `landing.css` and `blog.css` are deleted at the end. Any `lp-*`/`blog-*`
  class remaining in a component afterwards is a build-breaking grep check in
  the plan.

### Component management (split while converting)

One-folder-per-component convention holds throughout:

- `Features/` (~430 lines today): `Features.tsx` keeps the section
  composition; new `FeatureRow.tsx` (text column + visual slot layout) and
  one file per mock visual: `NotifVisual.tsx`, `LauncherVisual.tsx`,
  `ReclaimVisual.tsx`, `PackagesVisual.tsx`.
- `Hero/`: `Hero.tsx` (copy + CTAs) + `HeroScene.tsx` (menu-bar mock scene).
- New `components/ui-mock/`: shared typed fragments used by the mock panels
  (`UiRow`, `Pill`, `SizeLabel`, `GlassPanel`) so Hero/Launcher/Packages
  mocks stop duplicating markup. AppPanel adopts them too.
- All other components (Navbar, Footer, Download, FinalCta, StatementBand,
  HowItWorks, WhyLifecycle, FeatureGrid, PixelMeter, Pixrow, blog pages)
  convert in place.
- `app/og/page.tsx` keeps its inline styles: fixed 1200x630 capture helper;
  converting it risks the committed social card for zero benefit.

### Pixel-faithful gate

- BEFORE any styling change: build main, capture full-page reference
  screenshots of `/`, `/blog`, and one article at 1440 / 900 / 390 widths.
- After each conversion task and at the end: capture the same set, compare
  (ImageMagick `compare` if available, careful eyeballing otherwise).
- Any visible deviation is a bug by definition; no "close enough".

### Repo cleanup (same PR, separate commits)

Tracked deletions (reviewable in the PR):
- `clean-my-node-modules/` design handoff bundle (recoverable from history).
- The CLAUDE.md rule referencing it.
- `site/public/{next,vercel,globe,file,window}.svg` Next template leftovers.

Untracked disk-only deletions:
- `modules-handoff.zip`, root `.playwright-mcp/`, `dist/`, and `out/` EXCEPT
  `out/showcase.mp4` (still referenced by the pending "post the showcase
  video" user action).

Branch pruning: delete local + remote branches already merged into
origin/main (verified with git per branch, not guessed). Unmerged branches
(e.g. nextjs-shadcn-landing-free-tier if unmerged) are left alone.

Explicitly KEPT: `video/` + `remotion.config.ts`, `TIDYDISK-LAUNCH.html`,
`Certificates.p12`, `.license-signing.pem` (user decision).

## Testing

- Existing 19 site tests + typecheck + lint + build green after every task.
- Post-migration grep: no `lp-` or `blog-` class names left in components; no
  references to deleted files.
- Screenshot comparison evidence attached to the PR.

## Out of scope

- Any copy, routing, or metadata change (Project 2).
- The Electron app's styling (`src/`), which is not the landing page.
- og/page.tsx conversion.
