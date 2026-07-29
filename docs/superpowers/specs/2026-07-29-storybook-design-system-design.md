# Storybook for the TidyDisk design system

**Date:** 2026-07-29
**Status:** Approved design, pending implementation plan

## Goal

A documented Storybook covering both component sets in the repo, so the design
system stays visible, respected, and future proof — with CI enforcement so
coverage cannot silently rot.

## Scope decisions (agreed with the user)

- **Coverage:** both the Electron app renderer components AND the site (Next.js)
  components.
- **Enforcement:** CI-enforced — Storybook must build on every PR, and every
  component folder must have stories (with an explicit exemption list).
- **Hosting:** local dev tool only. No deployment. CI builds it to catch
  breakage; publishing can be added later.

## Architecture: two Storybook configs (Approach A)

The two component sets live in incompatible dependency trees (app: React 18 +
Vite 5 + electron-vite; site: React 19 + Next 16 + Tailwind v4), so each gets
its own idiomatic Storybook. No composition/refs for now (YAGNI — can be added
later in ~20 min if a single browsable UI is ever wanted).

Storybook version: latest stable major at implementation time (10.x, currently
10.5.5). Both configs must stay on the same major.

### 1. App Storybook (repo root)

- Config in `.storybook/` at repo root; framework `@storybook/react-vite`.
- Stories glob: `src/renderer/src/components/**/*.stories.tsx` plus
  `docs/storybook/**/*.mdx`.
- Preview imports `src/renderer/src/styles/global.css` and wraps every story in
  a global decorator that renders a dark backdrop simulating the macOS
  vibrancy panel — the design tokens are white-alpha overlays and are invisible
  on a white canvas. The decorator offers the panel width (334px `.mb-panel`
  context) as the default frame; stories can opt out via parameters for
  full-width components.
- Scripts in root `package.json`: `storybook` (dev server) and
  `storybook:build`.

### 2. Site Storybook (`site/`)

- Config in `site/.storybook/`; framework `@storybook/nextjs-vite` (provides
  `next/link`, `next/image`, font mocks). Verify Next 16 compatibility at
  install time; if the vite variant lags Next 16, fall back to
  `@storybook/nextjs`.
- Preview imports `site/app/globals.css` so Tailwind v4 `@theme` tokens and the
  residual behavior classes work in stories.
- Stories glob: `site/components/**/*.stories.tsx` plus
  `site/docs/storybook/**/*.mdx`.
- Same script names inside `site/package.json`.

## Documentation pages (MDX)

Each Storybook opens on docs, not a bare component list:

- **Intro page** (per book): what this design system is, the component folder
  convention, how to add a new component + story, the exemption rule.
- **Tokens page** (per book):
  - App: live swatch rendering of the CSS-variable scale from `global.css` —
    brand/status colors, the text emphasis ramp, surface/hairline overlays,
    panel backgrounds, fonts.
  - Site: the Tailwind v4 `@theme` tokens from `site/app/globals.css` (colors
    like `ink-2`/`accent`/`ok`, fonts `display`/`ui`/`mono`).
- **Autodocs** enabled globally: props tables generated from the existing
  `.types.ts` files.

## Stories

One `Component.stories.tsx` inside each component folder (CSF3, typed with
`Meta`/`StoryObj`):

- A default story per component, plus one story per meaningful visual state
  (e.g. Toggle on/off/disabled; PixelMeter at several fill levels; Row hover /
  busy / freed states; UpdateBanner in each update phase).
- Components taking data props get small realistic fixtures inline in the
  story file (project names, sizes) — no shared fixture library until
  duplication actually hurts.
- Batched implementation order: primitives first (Toggle, Segmented, Spinner,
  Kbd, LiveDot, badges, meters, icons), then composite rows
  (Row, MiniRow, CacheRow, PackageRow), then panels/views (ResultView,
  settings components, UnlockPrompt, UpdateBanner). Site: `ui-mock` primitives
  and `Btn`/`Eyebrow`/`SectionHead` first, then sections (Hero, Features,
  Footer…), then `pages/*` last (these may end up exempt if they are
  page-level compositions with data dependencies).

## Coverage enforcement

- `stories-coverage.test.ts` in each world (app: under the renderer test tree;
  site: under `site/`), running with the existing Vitest setups:
  - Walks the component directories (`src/renderer/src/components/*`,
    `site/components/*` including `pages/*` and `ui-mock`).
  - Fails with a helpful message when a component folder contains no
    `*.stories.tsx`.
  - `EXEMPT` list as an explicit array in the test file with a required reason
    comment per entry. Initial exemptions: app `ErrorBoundary` (behavioral
    wrapper, nothing to show); site `JsonLd`, `SetHtmlLang`, `SvgSprite`,
    `RevealClient`, `CookieConsent`/`CookiePreferences` if they prove
    non-renderable in isolation. Exempting a component is therefore a visible,
    reviewable code change.
- CI (`.github/workflows/ci.yml`): add `storybook:build` for both books to the
  PR pipeline alongside the existing typecheck/tests/build. The coverage test
  rides the existing `pnpm test` / site test steps.

## Convention updates (the long-term maintenance layer)

- **CLAUDE.md**: the component-folder rule gains `.stories.tsx` as a required
  member; new short "Storybook" section: how to run each book, the coverage
  test + exemption rule, and that stories must be updated when a component's
  visual states change.
- **STATUS.html**: roadmap + log updated per project rules when work lands.

## Error handling / edge cases

- App tokens are translucent white: every app story must sit on the dark
  backdrop decorator or it renders invisible — this is why the decorator is
  global rather than per-story.
- Site components using Next server-only APIs or filesystem content (e.g.
  `pages/BlogArticle`) may not render in Storybook; they get client-safe
  fixture props or go on the EXEMPT list with a reason.
- Storybook deps live in each world's own package.json (root and `site/`), so
  the Electron builder's `files: ["out/**"]` packaging is unaffected.

## Testing

- The coverage test itself is the guardrail and runs in CI.
- `storybook:build` in CI catches broken stories, bad imports, and CSS
  regressions at PR time.
- No visual regression service for now (hosting decision: local only);
  Chromatic can be layered on later without changing any of the above.

## Out of scope

- Publishing/deploying the Storybook anywhere.
- Storybook composition (single merged UI).
- Interaction tests / play functions / a11y addon audits — possible later
  additions, not part of this work.
- Refactoring components themselves (this work documents the system as it is).
