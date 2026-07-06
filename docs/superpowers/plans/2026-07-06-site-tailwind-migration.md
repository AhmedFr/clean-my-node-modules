# Site Tailwind Migration + Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace landing.css/blog.css with Tailwind v4 utilities + `@theme` tokens, pixel-faithfully; split oversized components; delete repo dead weight per the approved spec.

**Architecture:** Spec `docs/superpowers/specs/2026-07-06-tailwind-migration-cleanup-design.md`. Convert section by section while `landing.css` still loads (its rules go dead per component, harmless); delete both CSS files at the end behind a grep gate + screenshot comparison.

**Tech Stack:** Tailwind v4 (`@theme`), Next.js 16 App Router, vitest, Playwright MCP for screenshots.

## Global Constraints

- PIXEL-FAITHFUL: reference screenshots (`/`, `/blog`, one article, `/og`) at 1440/900/390 from the pre-change build, compared after every task. Use arbitrary values (`text-[15.5px]`, `gap-[30px]`) over nearest-scale snapping whenever the original value is off-scale.
- Behavior hook classes KEPT (unstyled or residual-styled, documented in globals.css): `lp-nav`+`scrolled`, `reveal`+`in`+`d1..d3`, `lp-screen`, `lp-scene-wrap` (RevealClient queries these), `blog-prose`, `sprite`.
- All gates green after every task: `pnpm typecheck && pnpm test && pnpm lint && pnpm build` in `site/`.
- One commit per task, `feat(site):`/`chore:` style.
- No copy changes whatsoever.

---

### Task 0: Reference screenshots (before ANY change)

- [ ] `pnpm build && pnpm start -p 3460`; capture full-page screenshots of `/`, `/blog`, `/blog/how-to-delete-node-modules-safely`, `/og` at widths 1440, 900, 390 into the session scratchpad `refs/` dir (12 files, named `ref-<page>-<width>.png`). Kill the server. NOT committed.

### Task 1: globals.css rewrite — @theme tokens + residual layer; drop shadcn stack

**Files:** rewrite `site/app/globals.css`; delete `site/components/ui/` and `site/components.json`; `pnpm remove shadcn @base-ui/react class-variance-authority tw-animate-css` (KEEP clsx + tailwind-merge + `lib/utils.ts` cn()).

New globals.css shape (tokens copied verbatim from landing.css `:root`):

```css
@import "tailwindcss";

@theme {
  --color-*: initial;
  --color-canvas: #0a0a0d;
  --color-canvas-soft: #101015;
  --color-panel: #16161b;
  --color-ink: #f4f4f6;
  --color-ink-2: rgba(255, 255, 255, 0.70);
  --color-ink-3: rgba(255, 255, 255, 0.46);
  --color-ink-4: rgba(255, 255, 255, 0.30);
  --color-line: rgba(255, 255, 255, 0.09);
  --color-line-2: rgba(255, 255, 255, 0.14);
  --color-accent: #ff6363;
  --color-accent-deep: #e23d3d;
  --color-ok: #34d399;
  --color-warn: #f5b14c;
  --color-white: #fff;
  --font-display: "Cabinet Grotesk", "General Sans", -apple-system, sans-serif;
  --font-ui: "General Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
```

plus a `@layer base` (body defaults, selection, `img,svg{display:block}`, base `code` chrome, smooth scroll) and the residual layer: `.reveal/.in/.d1-.d3` + keyframes, `.lp-nav.scrolled`, `.lp-bg` + noise `::after`, `.blog-prose` typography (moved verbatim from blog.css), `.sprite`. `--color-green`/`--color-amber` usages in components map to `ok`/`warn`; inline `var(--green)`/`var(--accent)`-style references in TSX switch to the emitted `var(--color-ok)`/`var(--color-accent)` names. `app/og/page.tsx` var references renamed the same way (inline styles stay).

- [ ] Rewrite globals.css; delete `components/ui/`, `components.json`; remove the four deps.
- [ ] Gates + screenshot compare (site still styled by landing.css; only /og var renames could shift — must not).
- [ ] Commit `feat(site): Tailwind theme tokens + residual layer; drop unused shadcn stack`.

### Task 2: shared ui-mock kit + AppPanel

**Files:** create `site/components/ui-mock/{index.ts,GlassPanel.tsx,UiRow.tsx,Pill.tsx,SizeLabel.tsx,ui-mock.types.ts}`; convert `site/components/AppPanel/`.

**Interfaces (consumed by Tasks 3-4):**
- `GlassPanel({ className?, children })` — glass chrome (blur/border/radius) as utilities.
- `UiRow({ icon, name, sub, right, highlighted? })` — the list-row layout used by launcher/packages mocks.
- `Pill({ tone: "unify" | "upd" | "sev", children })`, `SizeLabel({ value, unit })`.

- [ ] Build the kit from the `.glass-panel`, `.ui-row`, `.pill`, `.sz` rules in landing.css (exact values, arbitrary where off-scale); convert AppPanel to utilities + the kit.
- [ ] Gates + screenshots (hero dropdown + /og both embed AppPanel). Commit `feat(site): shared ui-mock kit; AppPanel on Tailwind`.

### Task 3: Hero split + Navbar + StatementBand + page shell

**Files:** `Hero/Hero.tsx` (copy/CTAs) + new `Hero/HeroScene.tsx` (menu-bar scene incl. scene-bar, dropdown, packages card, toast — uses ui-mock kit); convert `Navbar/`, `StatementBand/`, `Pixrow/` (cells keep inline statusColor backgrounds), the `lp-bg` div in `app/layout.tsx`, `.wrap` container pattern (becomes a utility recipe `mx-auto w-full max-w-[1160px] px-7`), buttons (`.lp-btn*` become utility strings shared via a small `components/Btn/` primitive since 4+ callsites repeat them).

- [ ] Convert; keep `lp-nav`, `lp-screen`, `lp-scene-wrap`, `reveal d*` hook classes in markup.
- [ ] Gates + screenshots at 3 widths (nav responsive rules!). Commit `feat(site): hero/nav/band on Tailwind; Btn primitive; Hero scene split`.

### Task 4: Features split + conversion

**Files:** `Features/Features.tsx` → composition only; new `Features/FeatureRow.tsx` + `Features/NotifVisual.tsx`, `LauncherVisual.tsx`, `ReclaimVisual.tsx`, `PackagesVisual.tsx` (uses ui-mock kit + PixelMeter).

- [ ] Split + convert (grid, flip order, tag chips, check lists, vis-glow/vis-card).
- [ ] Gates + screenshots. Commit `feat(site): Features split into row + visual components on Tailwind`.

### Task 5: FeatureGrid + WhyLifecycle + HowItWorks

- [ ] Convert the three sections (grid cards, lifecycle diagram rows incl. npm/pnpm bars, steps). Gates + screenshots. Commit `feat(site): grid/lifecycle/how sections on Tailwind`.

### Task 6: Download + FinalCta + Footer

- [ ] Convert (price cards incl. `feat` variant + badge, final card gradient, footer columns). Gates + screenshots. Commit `feat(site): pricing/final/footer on Tailwind`.

### Task 7: Blog pages + delete both CSS files

**Files:** convert `app/blog/layout.tsx`, `page.tsx`, `[slug]/page.tsx` chrome to utilities (`blog-prose` stays a residual class on the markdown container); delete `site/app/landing.css`, `site/app/blog/blog.css`; remove their imports.

- [ ] Convert + delete + grep gate: `grep -rn "lp-\|blog-" site/components site/app --include="*.tsx"` returns ONLY the documented hook classes.
- [ ] Full screenshot comparison of all 12 references + fix every diff. Gates. Commit `feat(site): blog on Tailwind; landing.css and blog.css deleted`.

### Task 8: Repo cleanup (approved list)

- [ ] Tracked: `git rm -r clean-my-node-modules site/public/{next,vercel,globe,file,window}.svg`; edit root CLAUDE.md to drop the handoff rule. Commit `chore: remove design handoff bundle and template assets`.
- [ ] Untracked disk: `rm -rf .playwright-mcp dist modules-handoff.zip; find out -type f ! -name showcase.mp4 -delete` (run at repo root of the MAIN checkout, not the worktree — verify paths first).
- [ ] Branches: for each remote branch, check `git cherry`/`git branch -r --merged origin/main`; delete only fully-merged ones (local + remote). Report what was kept and why.

### Task 9: STATUS + PR

- [ ] STATUS.html: milestone → BUILT/PR, log entry, userAction review PR.
- [ ] Full gates; push `feat/site-tailwind`; PR with the screenshot-comparison summary; CI green.
