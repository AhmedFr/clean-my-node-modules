# Landing Page "All Developer Disk Waste" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposition the TidyDisk landing page from a node_modules cleaner to "all developer disk waste" (projects + caches + packages + Docker), across all 5 locales.

**Architecture:** The site (`site/`) is Next.js + Tailwind v4, fully component-assembled and dictionary-driven. All copy lives in `lib/i18n/dictionaries/{en,fr,es,de,pt}.tsx` under the `Dictionary` contract in `lib/i18n/i18n.types.ts`; components are presentational and read `dict` slices. All product visuals are hand-built inline TSX/SVG (no image assets). Work: broaden existing copy, add a new "Areas" section + dict slice, add Docker as a 5th feature row (widening the `features` tuple), rebuild the hero mockup to the new panel dashboard, and translate everything.

**Tech Stack:** Next.js (static export), React 18, Tailwind v4, TypeScript.

**Spec:** `docs/superpowers/specs/2026-07-16-landing-page-all-disk-waste-design.md` — read it before Task 1. Decisions referenced as D1-D9.

## Global Constraints

- **Work only in `site/`.** No app code. Run all commands from `site/`.
- **Package manager: pnpm.** `pnpm typecheck` (`tsc --noEmit`), `pnpm build` (`next build`), `pnpm lint` (`eslint`).
- **The `Dictionary` type is the gate.** Adding a required field or widening a tuple in `lib/i18n/i18n.types.ts` will not compile until **all five** dictionaries implement it. A green `pnpm typecheck` proves no locale was left behind.
- **`ReactNode` copy fields must reproduce the SAME JSX structure across all 5 locales** — identical tags and classNames (`<code>`, `<b>`, `<em>`, the accent `<span className="text-accent">`). Only the human-readable text is translated.
- **Do NOT translate technical tokens:** `node_modules`, `rm -rf`, `pnpm`, `npm install`, `.next`, `dist`, paths, and brand names (`Docker`, `npm`, `yarn`, `bun`). Prices read `€19` / "19 euros" as in English.
- **No em dashes in any language.** Use commas, colons, or full stops.
- **One folder per component:** `Component.tsx`, `Component.types.ts`, `index.ts`, optionally `.constants.ts`.
- **English is the source of truth** (`en.tsx`); author en first, then translate to fr/es/de/pt matching the tone of the existing dictionary copy.
- **No new image assets** — all visuals inline TSX/SVG.
- Conventional commit subjects: `feat(site): …`, `fix(site): …`, `chore(site): …`.

---

## File Structure

**Create:**
- `site/components/Areas/Areas.tsx`, `Areas.types.ts`, `Areas.constants.ts`, `index.ts` — the four-peer-cards section (Task 5)
- `site/components/Features/DockerVisual.tsx` — the hand-built Docker-by-project mockup (Task 2)
- `site/components/Hero/HeroPanel.tsx` — the new dashboard mock for the hero (Task 6)

**Modify:**
- `site/components/SvgSprite/SvgSprite.tsx` — add an `i-docker` symbol (Task 2)
- `site/lib/i18n/i18n.types.ts` — widen `features` to a 5-tuple; add `AreaCardCopy`/`AreasCopy` + `areas` field (Tasks 3, 4)
- `site/lib/i18n/dictionaries/{en,fr,es,de,pt}.tsx` — broadened + new copy (Tasks 1, 3, 4)
- `site/components/Features/Features.tsx` — render the 5th (Docker) row (Task 3)
- `site/components/pages/HomePage/HomePage.tsx` — render `<Areas>` between band and features (Task 5)
- `site/components/Hero/HeroScene.tsx` — swap `<AppPanel/>` for `<HeroPanel/>` (Task 6)

**Left unchanged:** `AppPanel` (still used by `app/og/page.tsx`), `WhyLifecycle`, `HowItWorks`, `Download`, `FinalCta`, `Footer`, `Navbar`, blog.

---

### Task 1: Broaden existing copy (all 5 locales)

Copy-only edits to existing dictionary fields. No type change, so typecheck stays green throughout. Covers D2 (band), D3 (hero subhead), D6 (coming-soon pill), D9 (meta description).

**Files:**
- Modify: `site/lib/i18n/dictionaries/en.tsx` then `fr.tsx`, `es.tsx`, `de.tsx`, `pt.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: no signature change (edits existing fields `hero.body`, `band.statement`, `grid.comingSoonText`, `meta.description`).

- [ ] **Step 1: Rewrite the four English fields in `en.tsx`**

`hero.body` (D3 — keep the trailing `<code>rm -rf</code>`):
```tsx
    body: (
      <>
        Dev work quietly eats your Mac: heavy <code>node_modules</code>, Docker
        images, build caches, forgotten experiments. TidyDisk watches from the
        menu bar and gives the space back in one click. Safely, to the Trash,
        never <code>rm -rf</code>.
      </>
    ),
```

`band.statement` (D2 — keep the joke, widen the punchline, keep `<code>` + accent `<em>`):
```tsx
    statement: (
      <>
        <code>node_modules</code> is the heaviest object in the known universe.
        But it is not alone: Docker images, build caches and dead projects pile
        up too. <em>TidyDisk clears all of it.</em>
      </>
    ),
```

`grid.comingSoonText` (D6 — frame explicitly as still-future so it never implies shipped things are unshipped):
```tsx
    comingSoonText: (
      <>
        Next up: npm, yarn &amp; bun caches, plus per-project build outputs like{" "}
        <code>.next</code> and <code>dist</code>.
      </>
    ),
```

`meta.description` (D9 — add Docker + caches to the enumeration, plain string):
```tsx
    description:
      "TidyDisk lives in your macOS menu bar and shows what your dev projects really cost: every node_modules folder, your pnpm store and package-manager caches, Docker images and volumes, and every installed package. Free to scan. One-click cleanup with a 19 euro lifetime license. Safely, to the Trash, never rm -rf.",
```

- [ ] **Step 2: Verify English compiles and renders**

Run: `cd site && pnpm typecheck`
Expected: PASS (no type change; edited fields keep their shapes).

- [ ] **Step 3: Translate the four fields into `fr.tsx`, `es.tsx`, `de.tsx`, `pt.tsx`**

For each of the four locale files, replace the same four fields with a translation of the English above. Rules (binding):
- Keep the **exact JSX structure**: `hero.body` keeps its `<code>node_modules</code>` and trailing `<code>rm -rf</code>`; `band.statement` keeps `<code>node_modules</code>` and the accent `<em>…</em>`; `comingSoonText` keeps `<code>.next</code>` and `<code>dist</code>`.
- Do **not** translate `node_modules`, `rm -rf`, `Docker`, `npm`, `yarn`, `bun`, `.next`, `dist`. Keep `19 euros` as the price wording (matching each locale's existing `download`/`meta` copy).
- **No em dashes.** Match the tone and register of the surrounding copy already in that dictionary.

- [ ] **Step 4: Verify all locales compile and build**

Run: `cd site && pnpm typecheck && pnpm build`
Expected: both PASS; static export of `/`, `/fr`, `/es`, `/de`, `/pt` succeeds.

- [ ] **Step 5: Em-dash sweep of the changed fields**

Run: `cd site && grep -n "—" lib/i18n/dictionaries/*.tsx`
Expected: no matches introduced by this task (report any pre-existing ones but do not touch unrelated lines).

- [ ] **Step 6: Commit**

```bash
git add site/lib/i18n/dictionaries
git commit -m "feat(site): broaden hero, band, pill and meta copy beyond node_modules (5 locales)"
```

---

### Task 2: Docker icon + DockerVisual component

Build the standalone Docker feature-row visual and the sprite icon it uses. Not yet wired into the page, so typecheck/build stay green (the component is simply unused until Task 3).

**Files:**
- Modify: `site/components/SvgSprite/SvgSprite.tsx`
- Create: `site/components/Features/DockerVisual.tsx`

**Interfaces:**
- Consumes: `GlassPanel`, `PanelSep`, `UiRow`, `RowMeta`, `SizeLabel` from `@/components/ui-mock`; `Icon` from `@/components/Icon`.
- Produces: `export function DockerVisual(): JSX.Element` (no props) — used by Task 3; and sprite symbol `id="i-docker"` — usable via `<Icon id="i-docker" />`.

- [ ] **Step 1: Add the `i-docker` symbol to the sprite**

In `site/components/SvgSprite/SvgSprite.tsx`, inside the `SYMBOLS` template string, add this line next to `i-layers` (stroke line-icon style, viewBox `0 0 24 24`, `currentColor`):
```
  <symbol id="i-docker" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13h15.5a3.5 3.5 0 0 1-3.5 5H8a5 5 0 0 1-5-5z" /><rect x="6" y="9.2" width="3" height="3" rx="0.5" /><rect x="10" y="9.2" width="3" height="3" rx="0.5" /><rect x="10" y="5.6" width="3" height="3" rx="0.5" /></g></symbol>
```

- [ ] **Step 2: Create `DockerVisual.tsx`**

Mirrors `PackagesVisual` structure: a `GlassPanel` with a header (Docker tab active), then two project groups with a logo tile, name, resource sub-line, and size. Create `site/components/Features/DockerVisual.tsx`:
```tsx
import { Icon } from "@/components/Icon";
import {
  GlassPanel,
  PanelSep,
  RowMeta,
  SizeLabel,
  UiRow,
} from "@/components/ui-mock";

// Feature 5: the Docker tab, resources grouped by the project they belong to.
export function DockerVisual() {
  return (
    <GlassPanel className="w-full max-w-[480px] overflow-hidden rounded-[14px]">
      <div className="flex items-center gap-[11px] px-[14px] py-[11px]">
        <span className="grid h-6 w-6 flex-none place-items-center rounded-[7px] bg-[linear-gradient(155deg,#8ad0ff,#2f7fd2)] [&_svg]:h-[14px] [&_svg]:w-[14px] [&_svg]:text-white">
          <Icon id="i-docker" />
        </span>
        <div className="ml-auto flex gap-[3px] rounded-[9px] bg-black/25 p-[3px]">
          <span className="rounded-[6px] px-[10px] py-1 text-[11.5px] font-semibold text-ink-3">
            Projects
          </span>
          <span className="rounded-[6px] px-[10px] py-1 text-[11.5px] font-semibold text-ink-3">
            Caches
          </span>
          <span className="rounded-[6px] bg-white/10 px-[10px] py-1 text-[11.5px] font-semibold text-ink">
            Docker
          </span>
        </div>
      </div>
      <PanelSep />
      <div className="flex items-center justify-between px-4 pb-1 pt-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          23.6 GB · grouped by project
        </span>
      </div>
      <div className="flex flex-col px-[6px] py-[5px]">
        <UiRow className="gap-[10px] px-2 py-[7px]">
          <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-[7px] bg-[rgba(97,218,251,0.14)] text-[13px]">
            🐳
          </span>
          <RowMeta name="api-gateway" sub="2 images · 1 volume · 1 container" />
          <SizeLabel value="9.4" unit="GB" />
        </UiRow>
        <UiRow className="gap-[10px] px-2 py-[7px]">
          <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-[7px] bg-[rgba(126,194,65,0.14)] text-[13px]">
            🐘
          </span>
          <RowMeta name="postgres-dev" sub="1 image · 2 volumes" />
          <SizeLabel value="6.1" unit="GB" />
        </UiRow>
        <UiRow className="gap-[10px] px-2 py-[7px]">
          <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-[7px] bg-white/[0.06] [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:text-ink-3">
            <Icon id="i-layers" />
          </span>
          <RowMeta name="Not linked to a project" sub="dangling images · build cache" />
          <SizeLabel value="8.1" unit="GB" />
        </UiRow>
      </div>
    </GlassPanel>
  );
}
```

- [ ] **Step 3: Verify it compiles and the icon resolves**

Run: `cd site && pnpm typecheck`
Expected: PASS. (DockerVisual is not imported anywhere yet; that is fine, it is a plain export, not an unused local.)

- [ ] **Step 4: Commit**

```bash
git add site/components/SvgSprite/SvgSprite.tsx site/components/Features/DockerVisual.tsx
git commit -m "feat(site): add the Docker-by-project feature visual + docker sprite icon"
```

---

### Task 3: Add the Docker feature row (widen the tuple, all 5 locales)

Widen `features` from a 4-tuple to a 5-tuple, add the Docker entry to every dictionary, and render the fifth row. The type change forces all 5 dictionaries at once (D8).

**Files:**
- Modify: `site/lib/i18n/i18n.types.ts`
- Modify: `site/lib/i18n/dictionaries/en.tsx` then `fr.tsx`, `es.tsx`, `de.tsx`, `pt.tsx`
- Modify: `site/components/Features/Features.tsx`

**Interfaces:**
- Consumes: `DockerVisual` from `./DockerVisual` (Task 2).
- Produces: `Dictionary.features` becomes `[FeatureCopy, FeatureCopy, FeatureCopy, FeatureCopy, FeatureCopy]` (5-tuple).

- [ ] **Step 1: Widen the `features` type**

In `site/lib/i18n/i18n.types.ts`, change the `features` field on the `Dictionary` interface from a 4-tuple to a 5-tuple:
```ts
  /** Exactly five feature rows, in display order (row 5 is Docker). */
  features: [FeatureCopy, FeatureCopy, FeatureCopy, FeatureCopy, FeatureCopy];
```

- [ ] **Step 2: Run typecheck to see it fail across all locales**

Run: `cd site && pnpm typecheck`
Expected: FAIL — every `dictionaries/*.tsx` errors that its `features` 4-tuple is not assignable to the 5-tuple. This confirms the contract is enforcing all locales.

- [ ] **Step 3: Add the English Docker feature (5th entry) in `en.tsx`**

Append as the 5th element of the `features: [ … ]` array in `en.tsx` (after the Packages entry):
```tsx
    {
      tagline: "Beyond node_modules",
      heading: "Your Docker disk, grouped by project.",
      body: "Docker quietly hoards gigabytes in images, volumes, containers and build cache. Open the Docker tab to see it grouped by the project each resource belongs to, with real logos, sizes and in-use badges. Reclaim dangling images, stopped containers and unused volumes in a click, with the same safe confirmations as the rest of TidyDisk.",
      bullets: [
        "Images, volumes, containers and build cache, each with its real size",
        <>
          Resources <b>grouped by project</b> from Compose labels and used-by
          links
        </>,
        "Safe, typed confirmations before anything is permanently removed",
      ],
    },
```

- [ ] **Step 4: Add the translated Docker feature to the other 4 locales**

In `fr.tsx`, `es.tsx`, `de.tsx`, `pt.tsx`, append a 5th `features` element that translates the English entry above. Rules: keep the second bullet's `<b>grouped by project</b>` structure (translate the wrapped text); do not translate `Docker`, `node_modules`, `Compose`; no em dashes; match the dictionary's tone.

- [ ] **Step 5: Render the fifth row in `Features.tsx`**

In `site/components/Features/Features.tsx`: import `DockerVisual`, destructure the 5th feature, and add a 5th `FeatureRow`. Change the destructure line and add the row:
```tsx
import { DockerVisual } from "./DockerVisual";
// …
  const [notif, launcher, reclaim, packages, docker] = dict.features;
```
Then add, after the Packages `FeatureRow` (num "04", which is `flip`), a fifth row (num "05", not flipped so it alternates correctly, with `id="docker"`):
```tsx
        <FeatureRow
          id="docker"
          num="05"
          tagline={docker.tagline}
          heading={docker.heading}
          body={docker.body}
          bullets={docker.bullets}
          visual={<DockerVisual />}
        />
```

- [ ] **Step 6: Verify all locales compile and build**

Run: `cd site && pnpm typecheck && pnpm build`
Expected: both PASS. The 5-tuple is satisfied by all 5 dictionaries and the row renders.

- [ ] **Step 7: Em-dash sweep + commit**

Run: `cd site && grep -n "—" lib/i18n/dictionaries/*.tsx` (expect no new matches).
```bash
git add site/lib/i18n site/components/Features/Features.tsx
git commit -m "feat(site): add Docker as the fifth feature row (5 locales)"
```

---

### Task 4: Add the `areas` dictionary slice (type + all 5 locales)

Add the typed `areas` slice and populate every dictionary. No component yet, so this ends green with the field present and implemented but unused (Task 5 renders it). Covers D4's copy.

**Files:**
- Modify: `site/lib/i18n/i18n.types.ts`
- Modify: `site/lib/i18n/dictionaries/en.tsx` then `fr.tsx`, `es.tsx`, `de.tsx`, `pt.tsx`

**Interfaces:**
- Produces: `AreaCardCopy` = `{ title: string; copy: string }`; `AreasCopy` = `{ kicker: string; heading: ReactNode; lead: string; cards: [AreaCardCopy, AreaCardCopy, AreaCardCopy, AreaCardCopy] }`; `Dictionary.areas: AreasCopy`. Card order is fixed: Projects, Caches, Packages, Docker.

- [ ] **Step 1: Add the types**

In `site/lib/i18n/i18n.types.ts`, add before the `Dictionary` interface:
```ts
/** One card in the four-up "areas" section (icon + accent flag stay in the component). */
export interface AreaCardCopy {
  title: string;
  copy: string;
}

export interface AreasCopy {
  kicker: string;
  /** Accent `<span className="text-accent">` around the last words. */
  heading: ReactNode;
  lead: string;
  /** Fixed order: Projects, Caches, Packages, Docker. */
  cards: [AreaCardCopy, AreaCardCopy, AreaCardCopy, AreaCardCopy];
}
```
Then add the field to `Dictionary` (place it right after `band`):
```ts
  areas: AreasCopy;
```

- [ ] **Step 2: Run typecheck to confirm it fails until all locales implement it**

Run: `cd site && pnpm typecheck`
Expected: FAIL — every dictionary is missing `areas`.

- [ ] **Step 3: Add the English `areas` slice in `en.tsx`**

Add after the `band: { … },` block:
```tsx
  areas: {
    kicker: "One tool, every kind of dev junk",
    heading: (
      <>
        Four places your disk quietly{" "}
        <span className="text-accent">fills up.</span>
      </>
    ),
    lead: "TidyDisk watches all of them and gives the space back, safely.",
    cards: [
      {
        title: "Projects",
        copy: "Heavy, stale node_modules ranked by the real bytes you would free.",
      },
      {
        title: "Caches",
        copy: "Your pnpm store and Docker build cache, pruned in one safe click.",
      },
      {
        title: "Packages",
        copy: "A machine-wide dependency inventory: version drift, duplicates, and security advisories.",
      },
      {
        title: "Docker",
        copy: "Images, volumes, containers and build cache, grouped by the project they belong to.",
      },
    ],
  },
```

- [ ] **Step 4: Add the translated `areas` slice to the other 4 locales**

In `fr.tsx`, `es.tsx`, `de.tsx`, `pt.tsx`, add the `areas` slice translating the English. Rules: keep the accent `<span className="text-accent">…</span>` in `heading` (translate the wrapped words); the card `title`s "Projects / Caches / Packages / Docker" stay as the app's tab names (do not translate `Docker`; translate the others only if the app UI/other dictionary entries already do, otherwise keep them as-is for consistency with the product); do not translate `node_modules`, `pnpm`, `Docker`; no em dashes.

- [ ] **Step 5: Verify all locales compile and build**

Run: `cd site && pnpm typecheck && pnpm build`
Expected: both PASS (field implemented in all 5, unused for now).

- [ ] **Step 6: Em-dash sweep + commit**

Run: `cd site && grep -n "—" lib/i18n/dictionaries/*.tsx` (expect no new matches).
```bash
git add site/lib/i18n
git commit -m "feat(site): add the four-area 'disk waste' dictionary slice (5 locales)"
```

---

### Task 5: Build and wire the Areas section

Create the four-peer-cards section and render it between the statement band and the features (D4). Reuses the site's `PixelMeter` for the size bars.

**Files:**
- Create: `site/components/Areas/Areas.tsx`, `Areas.types.ts`, `Areas.constants.ts`, `index.ts`
- Modify: `site/components/pages/HomePage/HomePage.tsx`

**Interfaces:**
- Consumes: `dict.areas` (Task 4); `PixelMeter` from `@/components/PixelMeter` (props `used`, `threshold`, `cells?`, `size?`); `Icon`, `Wrap`, `SectionHead`; `Dictionary` type.
- Produces: `export function Areas({ dict }: { dict: Dictionary }): JSX.Element`.

- [ ] **Step 1: Create `Areas.types.ts`**

```ts
import type { Dictionary } from "@/lib/i18n";

export interface AreasProps {
  dict: Dictionary;
}
```

- [ ] **Step 2: Create `Areas.constants.ts`**

Per-card icon id + a size/severity descriptor. Icons come from the sprite (Task 2 added `i-docker`); the others already exist.
```ts
// Per-card presentation for the four areas (copy lives in dict.areas.cards).
// `bar` drives the mini visual: a PixelMeter for size areas, a severity strip
// for Packages. Order matches dict.areas.cards: Projects, Caches, Packages, Docker.
export const AREA_ICONS = ["i-hdd", "i-layers", "i-box", "i-docker"] as const;

export type AreaBar =
  | { kind: "size"; used: number; threshold: number; label: string }
  | { kind: "sev"; label: string };

export const AREA_BARS: [AreaBar, AreaBar, AreaBar, AreaBar] = [
  { kind: "size", used: 41.2, threshold: 30, label: "41.2 GB" },
  { kind: "size", used: 6.4, threshold: 10, label: "6.4 GB" },
  { kind: "sev", label: "7 vulnerable" },
  { kind: "size", used: 23.6, threshold: 20, label: "23.6 GB" },
];

/** Docker is the newest area; give its card the accent border. */
export const AREA_ACCENT = [false, false, false, true] as const;
```

- [ ] **Step 3: Create `Areas.tsx`**

```tsx
import { Icon } from "@/components/Icon";
import { Wrap } from "@/components/Wrap";
import { SectionHead } from "@/components/SectionHead";
import { PixelMeter } from "@/components/PixelMeter";
import { AREA_ACCENT, AREA_BARS, AREA_ICONS } from "./Areas.constants";
import type { AreasProps } from "./Areas.types";

const DELAY = ["", " d1", " d2", " d3"];

export function Areas({ dict }: AreasProps) {
  const areas = dict.areas;
  return (
    <section className="relative pt-[100px]">
      <Wrap>
        <SectionHead
          kicker={areas.kicker}
          heading={areas.heading}
          lead={areas.lead}
        />
        <div className="mt-[46px] grid grid-cols-4 gap-[18px] max900:grid-cols-2 max560:grid-cols-1">
          {areas.cards.map((card, i) => {
            const bar = AREA_BARS[i];
            return (
              <div
                key={card.title}
                className={`reveal${DELAY[i]} rounded-2xl border p-[22px] transition-[transform,border-color,background] duration-200 hover:-translate-y-1 hover:bg-white/[0.045] ${
                  AREA_ACCENT[i]
                    ? "border-[rgba(255,99,99,0.25)] bg-white/[0.03] hover:border-[rgba(255,99,99,0.4)]"
                    : "border-line bg-white/[0.025] hover:border-line-2"
                }`}
              >
                <div className="grid h-[40px] w-[40px] place-items-center rounded-[11px] border border-[rgba(255,99,99,0.2)] bg-[rgba(255,99,99,0.12)] text-accent [&_svg]:h-[20px] [&_svg]:w-[20px]">
                  <Icon id={AREA_ICONS[i]} />
                </div>
                <h4 className="mt-[15px] font-display text-[18px] font-bold tracking-[-0.01em]">
                  {card.title}
                </h4>
                <p className="mt-[6px] min-h-[60px] text-[14px] leading-[1.45] text-ink-3">
                  {card.copy}
                </p>
                {bar.kind === "size" ? (
                  <PixelMeter
                    used={bar.used}
                    threshold={bar.threshold}
                    cells={18}
                    size="sm"
                    className="mt-[10px]"
                  />
                ) : (
                  <div className="mt-[10px] flex gap-[2px]">
                    <span className="h-[13px] flex-[2] rounded-[2px] bg-[#ff453a]" />
                    <span className="h-[13px] flex-[3] rounded-[2px] bg-[#f5b14c]" />
                    <span className="h-[13px] flex-[2] rounded-[2px] bg-[#ffd60a]" />
                    <span className="h-[13px] flex-[6] rounded-[2px] bg-white/9" />
                  </div>
                )}
                <div className="mt-[8px] font-mono text-[12px] text-ink-3">
                  {bar.label}
                </div>
              </div>
            );
          })}
        </div>
      </Wrap>
    </section>
  );
}
```

- [ ] **Step 4: Create `index.ts`**

```ts
export { Areas } from "./Areas";
export type { AreasProps } from "./Areas.types";
```

- [ ] **Step 5: Wire into `HomePage.tsx`**

Add the import with the other section imports:
```tsx
import { Areas } from "@/components/Areas";
```
Then render it between `<StatementBand>` and `<Features>`:
```tsx
        <StatementBand dict={dict} />
        <Areas dict={dict} />
        <Features dict={dict} />
```

- [ ] **Step 6: Verify**

Run: `cd site && pnpm typecheck && pnpm build`
Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add site/components/Areas site/components/pages/HomePage/HomePage.tsx
git commit -m "feat(site): four-area 'disk waste' section between band and features"
```

---

### Task 6: Rebuild the hero mockup to the new panel dashboard

Replace the hero's rendering of the old reclaimable-list panel (`AppPanel`) with a new dashboard mock matching the shipped app: a "Tracked on disk" hero number plus four area bars (D7). `AppPanel` is left untouched because `app/og/page.tsx` still uses it.

**Files:**
- Create: `site/components/Hero/HeroPanel.tsx`
- Modify: `site/components/Hero/HeroScene.tsx`

**Interfaces:**
- Consumes: `PixelMeter` from `@/components/PixelMeter`; `Icon`; `PanelSep` from `@/components/ui-mock`.
- Produces: `export function HeroPanel(): JSX.Element` (no props), rendered inside the hero's existing `<GlassPanel>`.

- [ ] **Step 1: Create `HeroPanel.tsx`**

A compact dashboard: the aggregate "Tracked on disk" number + a full-width meter, then four click-through-style rows each with a label, a small meter (or severity strip), a value, and a chevron. Matches the real panel.
```tsx
import { Icon } from "@/components/Icon";
import { PanelSep } from "@/components/ui-mock";
import { PixelMeter } from "@/components/PixelMeter";

const ROWS = [
  { name: "Projects", used: 41.2, threshold: 30, value: "41.2 GB", sev: false },
  { name: "Caches", used: 6.4, threshold: 10, value: "6.4 GB", sev: false },
  { name: "Packages", used: 0, threshold: 1, value: "7 vuln", sev: true },
  { name: "Docker", used: 23.6, threshold: 20, value: "23.6 GB", sev: false },
];

// The hero's recreation of the new read-only menu bar panel dashboard:
// a "Tracked on disk" aggregate plus four click-through area rows.
export function HeroPanel() {
  return (
    <div className="px-[15px] py-[13px]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-3">
        Tracked on disk
      </div>
      <div className="mt-[5px] flex items-center justify-between gap-[10px]">
        <span className="font-display text-[27px] font-bold tracking-[-0.01em] text-white">
          71.2 GB
        </span>
        <span className="whitespace-nowrap font-mono text-[12px] font-semibold text-accent">
          21.2 GB over
        </span>
      </div>
      <PixelMeter used={71.2} threshold={50} cells={32} className="mt-[6px]" />
      <PanelSep />
      <div className="flex flex-col gap-[2px] pt-[6px]">
        {ROWS.map((r) => (
          <div key={r.name} className="flex items-center gap-[10px] px-1 py-[6px]">
            <span className="w-[58px] flex-none text-[12px] font-semibold text-ink-2">
              {r.name}
            </span>
            <span className="min-w-0 flex-1">
              {r.sev ? (
                <span className="flex gap-[2px]">
                  <span className="h-[13px] flex-[2] rounded-[2px] bg-[#ff453a]" />
                  <span className="h-[13px] flex-[3] rounded-[2px] bg-[#f5b14c]" />
                  <span className="h-[13px] flex-[7] rounded-[2px] bg-white/9" />
                </span>
              ) : (
                <PixelMeter used={r.used} threshold={r.threshold} cells={16} size="sm" />
              )}
            </span>
            <span className="flex-none font-mono text-[12px] font-semibold text-ink-2">
              {r.value}
            </span>
            <span className="flex-none text-ink-4 [&_svg]:h-[13px] [&_svg]:w-[13px]">
              <Icon id="i-chev-right" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Swap it into `HeroScene.tsx`**

In `site/components/Hero/HeroScene.tsx`: replace the `import { AppPanel } from "@/components/AppPanel";` line with `import { HeroPanel } from "./HeroPanel";`, and replace `<AppPanel />` inside the dropdown `<GlassPanel>` with `<HeroPanel />`. Leave everything else (menu bar, floating Packages card, toast) unchanged.

- [ ] **Step 3: Verify AppPanel is still used elsewhere (not orphaned incorrectly)**

Run: `cd site && grep -rln "AppPanel" components app | grep -v "components/AppPanel/"`
Expected: `app/og/page.tsx` still references it (so it must NOT be deleted). `HeroScene.tsx` should no longer appear.

- [ ] **Step 4: Verify compile + build**

Run: `cd site && pnpm typecheck && pnpm build`
Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add site/components/Hero
git commit -m "feat(site): hero mockup shows the new panel dashboard, not the old list"
```

---

### Task 7: Whole-page visual verification

No code change unless the review finds a rendering issue. Confirms the assembled page renders correctly across locales (the spec's verification section).

**Files:** none (verification only; fixes, if any, go back to the relevant task's files).

- [ ] **Step 1: Full gate**

Run: `cd site && pnpm typecheck && pnpm build && pnpm lint`
Expected: typecheck + build PASS; lint clean (report any pre-existing warnings unrelated to this work).

- [ ] **Step 2: Visual review in a real browser**

Start the dev server (`cd site && pnpm dev`) or serve the build, and render `/` and `/fr` (a non-English locale). Confirm:
- Hero mockup shows the "Tracked on disk" dashboard with four bars (not the old list).
- The statement band reads the evolved line (node_modules joke + Docker/caches widening).
- The Areas section shows four cards (Projects / Caches / Packages / Docker), Docker with the accent border, each with a mini bar.
- The Docker feature row renders with the by-project `DockerVisual`.
- The coming-soon pill reads "Next up: npm, yarn & bun caches …".
- On `/fr`, the same structure holds with translated text and identical JSX (accent spans, `<code>` tokens intact).

Capture a screenshot of `/` for the record (as prior site work did with Playwright).

- [ ] **Step 3: Final em-dash sweep across the changed copy**

Run: `cd site && grep -n "—" lib/i18n/dictionaries/*.tsx`
Expected: no matches introduced by this work.

- [ ] **Step 4: STATUS + done**

This is a docs update handled by the controller after the plan completes (bump STATUS.html, note the landing-page repositioning + a native-speaker-proofread follow-up userAction). No commit in this task beyond any review fixes.

---

## Final Verification

- [ ] `cd site && pnpm typecheck` — clean (proves all 5 locales implement the `areas` slice and the 5-tuple `features`)
- [ ] `cd site && pnpm build` — static export of `/`, `/fr`, `/es`, `/de`, `/pt` succeeds
- [ ] `cd site && pnpm lint` — clean
- [ ] No em dashes introduced in any dictionary (`grep -n "—" site/lib/i18n/dictionaries/*.tsx`)
- [ ] `AppPanel` untouched and still used by `app/og/page.tsx`; hero uses `HeroPanel`
- [ ] Visual review of `/` and `/fr` confirms the repositioning renders in-theme

**Follow-up (not blocking, track as a userAction):** native-speaker proofread of the new fr/es/de/pt Docker/areas copy (same caveat as the rest of the machine-translated site).
