# Showcase video (Remotion)

A 10-second, square (1080×1080), loopable promo for **Clean my node_modules**,
built entirely in code with [Remotion](https://remotion.dev) — no screen
recording, so every frame is crisp and the UI matches the real app
(same palette, cube glyph, and pixel gauge).

## Story (10s)

1. The launcher springs in, full of oversized `node_modules`; the pixel gauge
   glows red — **26 GB over a 5 GB limit**.
2. The cursor clicks the trash on the top rows in quick succession; each row
   swipes out and the list collapses up.
3. The gauge drains **red → amber → green** while a **"Reclaimed 23 GB"** badge
   counts up.
4. Settles on the brand card (cube + wordmark + tagline).

Captions are baked in so it reads with sound off. There is no audio track —
add a music bed before posting.

## Commands (run from the repo root)

```bash
pnpm video:studio      # live editor/preview at localhost
pnpm video:render      # → out/showcase.mp4 (the file to share)
pnpm video:still       # → out/still.png (single frame, --frame=130)
pnpm video:typecheck   # type-check just the video project
```

## Where to tweak

- **Captions / wording** — `Showcase/Showcase.tsx` (the three `<Caption>`s).
- **Timing & geometry** — `Showcase/Showcase.constants.ts`.
- **Animation logic** (deletions, gauge drain, cursor path) — `Showcase/timeline.ts`.
- **Mock projects / numbers** — `mockData.ts`.
- **Colors / fonts** — `theme.constants.ts` (mirrors the app).

## Other formats

The composition is square. For vertical (9:16) or landscape (16:9), add another
`<Composition>` in `Root.tsx` with different `width`/`height` and a layout tweak
in `Showcase.tsx`. Ask and I'll wire it up.
