# Landing page vision refresh: broad pain, centered band, breathing room, buy icon

Date: 2026-07-06
Status: awaiting user review
Branch: feat/landing-vision (from main, post-blog-merge)

## Goal

Four user-requested changes to the landing page, from their notes of 2026-07-06:

1. Market the pain/aspiration of a tidy dev disk, not "bytes and dependencies
   cost"; the hero becomes broad, node_modules/packages stay as later sections.
2. In the node_modules statement band, mirror the right pixel strip so the two
   strips' colors converge on the statement (green at the outer edges, red
   toward the center).
3. The alternating screenshot+text feature rows are too packed vertically; add
   breathing room between them.
4. The Buy TidyDisk button icon (currently a broom) does not fit; replace it.

## Decisions already made with the user (2026-07-06)

- Hero direction: **"Aspiration: a tidy disk"** (chosen over pain-led and
  confrontational variants).
- Buy icon: **sparkles** (chosen over key, unlock, checkcircle).

## Design

### 1. Hero reposition (components/Hero/Hero.tsx)

Copy only; scene, CTAs, eyebrow, and micro-line unchanged.

- h1: `A tidy disk, without thinking about it.` with the accent span on
  "tidy disk" (keep the `accent word` class so it stays in the display face).
- Subline: `Dev work quietly eats your Mac: old projects, heavy dependencies,
  forgotten experiments. TidyDisk watches from the menu bar and gives the
  space back in one click. Safely, to the Trash, never rm -rf.`
  (`rm -rf` keeps its `<code>` styling; it is the safety differentiator.)
- No em dashes. node_modules is no longer mentioned in the hero; its first
  appearance is the statement band, as the user wants.
- The `<title>`/description in layout.tsx are already broad ("see what is
  eating your dev disk") and stay unchanged.

### 1b. OG card follows the hero (user added to scope 2026-07-06)

`app/og/page.tsx` (the 1200x630 capture helper) gets the same repositioning:
headline `A tidy disk, without thinking about it.` with the accent span on
"tidy disk", and the subline broadened to match the hero's voice:
`Dev work quietly eats your Mac. TidyDisk watches from the menu bar, shows
what it costs, and gives the space back in one click. Safely, to the Trash.`
The badge row ("Download for macOS", "Free scan · 19 euro lifetime cleanup")
and the AppPanel visual stay. `public/og.png` is re-captured via
`scripts/make-og.mjs` (temporary playwright dep, per the script header) and
committed; social embeds change with the deploy.

### 2. Statement band mirrored pixel strips (components/Pixrow, StatementBand)

`Pixrow` gains a `mirror?: boolean` prop (default false). Cell color becomes
`statusColor(mirror ? 1 - frac : frac)` where `frac = (i + 0.5) / cells`.
`statusColor` is green at low ratios and red at high ones, so the default
strip already runs green -> red left-to-right; the left strip therefore stays
as-is, with red landing on the side touching the statement. The right strip
gets `mirror`, so it runs red -> green left-to-right. Result: red converges on the statement from both
sides, green sits at the outer edges, and the eye is pulled to the middle.
Exactly the user's ask ("green on the left and red on the right for the left
one, the right one mirrored").

On narrow viewports the band wraps (strips above and below the statement);
mirroring still frames the statement correctly, no extra handling.

### 3. Feature row breathing room (app/landing.css)

`.lp-features` currently separates the four screenshot+text rows with
`gap: 110px`, which reads packed because the glass-panel visuals visually
extend past their boxes (glows). Change:

- Desktop: `.lp-features { gap: 150px; }`
- `<= 900px` (stacked layout): add `.lp-features { gap: 96px; }` to the
  existing media query so stacked features do not inherit the desktop gap
  rhythm blindly (they currently inherit 110px; 96px with the inner 32px
  text/visual gap keeps hierarchy: within-feature < between-features).

No structural/markup change.

### 4. Sparkles buy icon (SvgSprite, Download, FinalCta)

Add an `i-sparkles` symbol to the sprite in the established style (raw string,
`viewBox="0 0 24 24"`, `fill="none" stroke="currentColor" stroke-width="2"`,
round caps/joins): one large four-point sparkle center-left plus two small
ones top-right and bottom-right. Replace `i-broom` with `i-sparkles` on BOTH
buy CTAs (Download section and FinalCta) so the purchase action is visually
consistent. The FeatureGrid "clean" card keeps its broom; there it depicts
cleaning, which is what the user liked it less for on the payment button, not
in general.

## Testing / verification

- `pnpm typecheck && pnpm test && pnpm build` green (existing meter tests
  cover statusColor; Pixrow stays a presentational map, mirroring covered by
  a small unit test on the color sequence being the reverse of the default).
- Playwright pass on `next start`: screenshot hero (new copy, accent on
  "tidy disk"), statement band (green edges / red center), feature section
  (visibly larger separation), Download + FinalCta (sparkles icon renders).
- No em dashes in any changed copy.

## Out of scope

- Metadata title/description changes (already broad).
- Any reordering of page sections (user confirmed the current order works:
  broad hero first, node_modules band + features after).
