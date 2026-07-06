# Landing Vision Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Broaden the hero to the "tidy disk" aspiration, mirror the statement band's right pixel strip, add vertical breathing room between feature rows, and swap the buy-button broom for a sparkles icon.

**Architecture:** Pure presentational changes in `site/`: copy in Hero, a `mirror` prop on Pixrow, two CSS gap values, one new sprite symbol + two icon swaps. Spec: `docs/superpowers/specs/2026-07-06-landing-vision-refresh-design.md`.

**Tech Stack:** Next.js 16 App Router site in `site/`, vitest, raw-string SVG sprite.

## Global Constraints

- All work inside `site/`, branch `feat/landing-vision`, PR to main.
- NO em dashes in any user-facing copy.
- Copy decisions are FIXED (user-approved 2026-07-06): hero h1 `A tidy disk, without thinking about it.`; buy icon = sparkles. Do not rewrite them.
- FeatureGrid keeps its `i-broom` (only the two buy CTAs change).
- Commit style `feat(site): ...`; every task ends with typecheck + tests green.

---

### Task 1: Hero copy

**Files:**
- Modify: `site/components/Hero/Hero.tsx:13-22` (h1 + subline only)

**Interfaces:**
- Produces: nothing consumed downstream; scene markup, CTAs, eyebrow, micro-line stay byte-identical.

- [ ] **Step 1: Replace the h1 and subline**

```tsx
        <h1 className="lp-h1 reveal d1">
          A <span className="accent word">tidy disk</span>, without thinking
          about it.
        </h1>
        <p className="lp-sub reveal d2">
          Dev work quietly eats your Mac: old projects, heavy dependencies,
          forgotten experiments. TidyDisk watches from the menu bar and gives
          the space back in one click. Safely, to the Trash, never{" "}
          <code>rm -rf</code>.
        </p>
```

- [ ] **Step 2: Verify** `pnpm typecheck && pnpm test` green; `grep -rn "—" site/components/Hero/` returns nothing.

- [ ] **Step 3: Commit** `feat(site): hero repositioned on the tidy-disk aspiration`

### Task 2: Mirrored pixel strip in the statement band

**Files:**
- Modify: `site/components/Pixrow/Pixrow.types.ts`, `site/components/Pixrow/Pixrow.tsx`
- Create: `site/components/Pixrow/Pixrow.test.ts`
- Modify: `site/components/StatementBand/StatementBand.tsx:12` (second strip gets `mirror`)

**Interfaces:**
- Produces: `PixrowProps = { cells?: number; mirror?: boolean }`; `pixrowColors(cells: number, mirror: boolean): string[]` exported from `Pixrow.tsx` for the test.

- [ ] **Step 1: Write the failing test** `site/components/Pixrow/Pixrow.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { pixrowColors } from "./Pixrow";

describe("pixrowColors", () => {
  it("mirrored strip is the reverse of the default strip", () => {
    expect(pixrowColors(7, true)).toEqual([...pixrowColors(7, false)].reverse());
  });

  it("default strip starts green and ends red", () => {
    const colors = pixrowColors(7, false);
    expect(colors[0]).not.toBe(colors[6]);
  });
});
```

- [ ] **Step 2: Run** `pnpm test` in `site/`. Expected: FAIL (`pixrowColors` not exported).

- [ ] **Step 3: Implement.** `Pixrow.types.ts`:

```ts
export interface PixrowProps {
  cells?: number;
  /** Reverse the green->red run so two strips can frame a centerpiece. */
  mirror?: boolean;
}
```

`Pixrow.tsx`:

```tsx
import { statusColor } from "@/lib/meter";
import type { PixrowProps } from "./Pixrow.types";

// Decorative pixel strip (brand motif), ported from landing.js. Deterministic,
// so it renders on the server.
export function pixrowColors(cells: number, mirror: boolean): string[] {
  return Array.from({ length: cells }, (_, i) => {
    const frac = (i + 0.5) / cells;
    return statusColor(mirror ? 1 - frac : frac);
  });
}

export function Pixrow({ cells = 7, mirror = false }: PixrowProps) {
  return (
    <div className="pixrow" aria-hidden>
      {pixrowColors(cells, mirror).map((background, i) => (
        <i key={i} style={{ background }} />
      ))}
    </div>
  );
}
```

`StatementBand.tsx`: the second `<Pixrow />` becomes `<Pixrow mirror />`.

- [ ] **Step 4: Run** `pnpm test` (all green) and `pnpm typecheck`.

- [ ] **Step 5: Commit** `feat(site): statement band pixel strips converge on the center`

### Task 3: Feature row breathing room

**Files:**
- Modify: `site/app/landing.css:229` and the `@media (max-width: 900px)` block (~line 460)

- [ ] **Step 1:** Line 229: `gap: 110px` -> `gap: 150px` (`.lp-features`).

- [ ] **Step 2:** Inside the existing `@media (max-width: 900px)` block, next to `.lp-feature { grid-template-columns: 1fr; gap: 32px; }`, add:

```css
  .lp-features { gap: 96px; }
```

- [ ] **Step 3: Commit** `fix(site): more vertical air between feature rows`

### Task 4: Sparkles buy icon

**Files:**
- Modify: `site/components/SvgSprite/SvgSprite.tsx` (add symbol to the `SYMBOLS` raw string, next to `i-broom`)
- Modify: `site/components/Download/Download.tsx:86`, `site/components/FinalCta/FinalCta.tsx:26` (`i-broom` -> `i-sparkles`)

- [ ] **Step 1: Add the symbol** (style-matched: currentColor stroke 2, round):

```html
  <symbol id="i-sparkles" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4.5 11.6 8.9 16 10.5l-4.4 1.6L10 16.5 8.4 12.1 4 10.5l4.4-1.6z" /><path d="M18 13.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" /><path d="M17.5 3.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6z" /></g></symbol>
```

- [ ] **Step 2:** Swap `<Icon id="i-broom" />` to `<Icon id="i-sparkles" />` in `Download.tsx` (Buy button) and `FinalCta.tsx` (Buy CTA). Do NOT touch `FeatureGrid.constants.ts`.

- [ ] **Step 3: Verify** `pnpm typecheck && pnpm test && pnpm build` green.

- [ ] **Step 4: Commit** `feat(site): sparkles icon on the buy CTAs`

### Task 5: OG card copy + re-capture og.png

**Files:**
- Modify: `site/app/og/page.tsx` (h1 + subline only; badge row and AppPanel stay)
- Regenerate: `site/public/og.png` via `site/scripts/make-og.mjs`

- [ ] **Step 1:** In `app/og/page.tsx` replace the h1 text with `A <span style={{ color: "var(--accent)" }}>tidy disk</span>, without thinking about it.` and the `<p>` text with `Dev work quietly eats your Mac. TidyDisk watches from the menu bar, shows what it costs, and gives the space back in one click. Safely, to the Trash.`

- [ ] **Step 2:** Per the script header: `pnpm add -D playwright` (chromium already installed locally), `pnpm build && PORT=3212 pnpm start &`, `BASE_URL=http://localhost:3212 node scripts/make-og.mjs`, kill the server, `pnpm remove playwright`. Confirm `public/og.png` is 1200x630 and shows the new headline.

- [ ] **Step 3: Commit** `feat(site): OG card follows the tidy-disk hero` (includes the regenerated og.png)

### Task 6: Visual verification + PR

- [ ] **Step 1:** `pnpm build && pnpm start -p 3456`; Playwright screenshots of: hero (new copy, "tidy disk" accented), statement band (green outer edges, red converging on the statement from BOTH sides), features section (gap visibly larger), Download + FinalCta buttons (sparkles renders crisply at button size). Fix anything off before proceeding.
- [ ] **Step 2:** Kill the server. Full gates: `pnpm typecheck && pnpm test && pnpm build`.
- [ ] **Step 3:** Update `STATUS.html` data block (roadmap item + log entry; no new userActions beyond PR review).
- [ ] **Step 4:** Push `feat/landing-vision`, open PR `feat(site): landing vision refresh (hero, band, spacing, buy icon)` with before/after intent per the spec; confirm CI green.
