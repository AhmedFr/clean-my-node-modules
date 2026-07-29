# Storybook Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two documented Storybooks (Electron app + Next.js site) with MDX design-system docs, stories for every component, and CI-enforced coverage so the book never rots.

**Architecture:** Approach A from the spec (`docs/superpowers/specs/2026-07-29-storybook-design-system-design.md`): root `.storybook/` on `@storybook/react-vite` for the 32 renderer components (global dark vibrancy-panel decorator — the tokens are white-alpha and invisible on white), and `site/.storybook/` on `@storybook/nextjs-vite` for the site components (Tailwind v4). Coverage is enforced by a Vitest test per world that fails when a component folder lacks a `*.stories.tsx`, plus `storybook:build` in CI.

**Tech Stack:** Storybook 10.5.x (CSF3, autodocs, `@storybook/addon-docs`), Vitest (existing configs), pnpm, GitHub Actions.

## Global Constraints

- Package manager: pnpm (root `pnpm@11.1.2`; `site/` has its own lockfile — run site commands from `site/`).
- Storybook major: 10.x for BOTH books (verified: `@storybook/react-vite@10.5.5` peers allow vite ^5 + react 18; `@storybook/nextjs-vite@10.5.5` peers allow next ^16 + react 19).
- Root vitest only picks up `src/**/*.test.ts` — app coverage test must be a `.ts` file under `src/`. Site vitest picks up `components/**/*.test.{ts,tsx}`.
- App design tokens are translucent white (`global.css`): every app story renders inside the global dark decorator; never disable it without replacing the dark background.
- No em dashes in any user-facing copy (MDX docs pages included).
- Conventional commits: `feat(storybook): …`, `docs: …`, `ci: …`.
- Work happens on branch `feat/storybook`, lands via PR.
- Never edit component source files in this work — stories document the system as it is. If a component seems to need changes, note it in the PR description instead.

## File Structure

```
.storybook/main.ts                 app SB config (react-vite, globs, aliases)
.storybook/preview.tsx             app SB preview: global.css + dark panel decorator
.storybook/storybook.css           small body overrides for SB context
docs/storybook/Intro.mdx           app book intro page
docs/storybook/Tokens.mdx          app token reference (live swatches)
src/renderer/src/components/<C>/<C>.stories.tsx   one per component
src/renderer/src/components/stories-coverage.test.ts
site/.storybook/main.ts            site SB config (nextjs-vite)
site/.storybook/preview.ts         site SB preview: globals.css import
site/docs/storybook/Intro.mdx
site/docs/storybook/Tokens.mdx
site/components/<C>/<C>.stories.tsx
site/components/stories-coverage.test.ts
.github/workflows/ci.yml           modified: SB builds + site job
CLAUDE.md                          modified: convention + Storybook section
STATUS.html                        modified: roadmap/log (end of work)
```

---

### Task 1: App Storybook scaffold + first story (Toggle)

**Files:**
- Create: `.storybook/main.ts`, `.storybook/preview.tsx`, `.storybook/storybook.css`
- Create: `src/renderer/src/components/Toggle/Toggle.stories.tsx`
- Modify: `package.json` (scripts + devDeps), `.gitignore` (add `storybook-static/`)

**Interfaces:**
- Produces: the `panel` story parameter (`parameters: { panel: false }` opts a story out of the 334px panel frame; default is framed). All later app story tasks rely on this.
- Produces: scripts `pnpm storybook` (dev, port 6006) and `pnpm storybook:build`.

- [ ] **Step 1: Create branch**

```bash
git checkout -b feat/storybook
```

- [ ] **Step 2: Install dependencies (root)**

```bash
pnpm add -D storybook@^10.5.5 @storybook/react-vite@^10.5.5 @storybook/addon-docs@^10.5.5
```

- [ ] **Step 3: Write `.storybook/main.ts`**

```ts
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: [
    '../docs/storybook/**/*.mdx',
    '../src/renderer/src/components/**/*.stories.tsx',
  ],
  addons: ['@storybook/addon-docs'],
  async viteFinal(cfg) {
    const { mergeConfig } = await import('vite')
    return mergeConfig(cfg, {
      resolve: {
        // mirror tsconfig/vitest aliases so stories can import shared types
        alias: {
          '@shared': fileURLToPath(new URL('../src/shared', import.meta.url)),
          '@renderer': fileURLToPath(new URL('../src/renderer/src', import.meta.url)),
        },
      },
    })
  },
}
export default config
```

- [ ] **Step 4: Write `.storybook/storybook.css`**

`global.css` styles `body` for the frameless Electron panel (`overflow: hidden`, `user-select: none`, transparent background). Those break Storybook's scrolling docs pages, so override them in SB only:

```css
/* Storybook-only overrides: global.css assumes the frameless Electron panel. */
body {
  overflow: auto !important;
  user-select: text !important;
}
```

- [ ] **Step 5: Write `.storybook/preview.tsx`**

The design tokens are white-alpha overlays; the decorator provides the dark gradient that stands in for the macOS wallpaper + vibrancy, and frames stories at the panel's 334px width by default:

```tsx
import type { Preview } from '@storybook/react-vite'
import React from 'react'
import '../src/renderer/src/styles/global.css'
import './storybook.css'

const ACCENT = '#ff6363'

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { disable: true },
  },
  decorators: [
    (Story, ctx) => {
      const framed = ctx.parameters.panel !== false
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            background: 'linear-gradient(160deg, #3c4150 0%, #191a1f 70%)',
          }}
        >
          <div
            style={
              framed
                ? {
                    width: 334,
                    borderRadius: 12,
                    padding: 14,
                    background: 'var(--panel-menu)',
                    boxShadow:
                      'inset 0 1px 0 var(--surface-2), inset 0 0 0 1px var(--surface-3)',
                  }
                : undefined
            }
          >
            <Story />
          </div>
        </div>
      )
    },
  ],
}
export default preview
```

Note: `ACCENT` is exported for stories in later steps — add `export { ACCENT }` at the bottom. Stories import it as the canonical accent prop value.

- [ ] **Step 6: Add scripts and gitignore entry**

In root `package.json` scripts:

```json
"storybook": "storybook dev -p 6006",
"storybook:build": "storybook build"
```

In `.gitignore`, add a line: `storybook-static/`

- [ ] **Step 7: Write the first story, `src/renderer/src/components/Toggle/Toggle.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/preview'
import { Toggle } from './Toggle'

const meta = {
  title: 'Primitives/Toggle',
  component: Toggle,
  args: { accent: ACCENT, onToggle: () => {} },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const On: Story = { args: { on: true } }
export const Off: Story = { args: { on: false } }
```

If the relative import to `.storybook/preview` is ugly in practice, move `ACCENT` to a new tiny module `.storybook/constants.ts` and import from there in both preview and stories — pick one and use it consistently in ALL later story tasks.

- [ ] **Step 8: Verify the build works**

```bash
pnpm storybook:build
```

Expected: build succeeds, `storybook-static/` produced. Then spot-check interactively (`pnpm storybook`, open http://localhost:6006, Toggle renders on the dark panel; Ctrl-C after). If typecheck complains about story files (`pnpm typecheck`), add `.storybook` to `tsconfig.web.json` include or fix as needed until `pnpm typecheck` is green.

- [ ] **Step 9: Run existing checks**

```bash
pnpm typecheck && pnpm test && pnpm exec biome ci .
```

Expected: all green (run `pnpm format` first if biome complains about the new files).

- [ ] **Step 10: Commit**

```bash
git add .storybook src/renderer/src/components/Toggle/Toggle.stories.tsx package.json pnpm-lock.yaml .gitignore
git commit -m "feat(storybook): scaffold app Storybook with dark panel decorator + Toggle story"
```

---

### Task 2: App MDX docs (Intro + Tokens)

**Files:**
- Create: `docs/storybook/Intro.mdx`, `docs/storybook/Tokens.mdx`

**Interfaces:**
- Consumes: the app Storybook from Task 1 (globs already include `docs/storybook/**/*.mdx`).

- [ ] **Step 1: Write `docs/storybook/Intro.mdx`**

```mdx
import { Meta } from '@storybook/addon-docs/blocks'

<Meta title="Design System/Intro" />

# TidyDisk app design system

TidyDisk is a macOS menu bar app. Every component here renders inside a dark
vibrancy panel, so the design tokens are white-alpha overlays on a translucent
dark background. Stories are wrapped in a decorator that simulates that panel:
a dark gradient stands in for the wallpaper, and stories render inside the
334px panel frame by default (opt out with `parameters: { panel: false }`).

## Component convention

One folder per component under `src/renderer/src/components/`:

- `index.ts` re-exports
- `Component.tsx` the component
- `Component.types.ts` its props
- `Component.stories.tsx` its stories (required, enforced by
  `stories-coverage.test.ts`; purely behavioral components can be added to the
  EXEMPT list there, with a reason)

## Adding a component

1. Create the folder with the four files above.
2. Cover every meaningful visual state with a story: each boolean or union
   prop that changes what the user sees gets its own story.
3. `pnpm test` fails until the story file exists.

## Rules

- Colors, fonts, and surfaces come from the CSS variables in
  `src/renderer/src/styles/global.css` (see the Tokens page). No hand-typed
  rgba values in components.
- The accent color is a user setting; components receive it as an `accent`
  prop rather than reading a global.
```

- [ ] **Step 2: Write `docs/storybook/Tokens.mdx`**

Live swatches read the real CSS variables (global.css is imported by the preview, so `var(...)` resolves):

```mdx
import { Meta } from '@storybook/addon-docs/blocks'

<Meta title="Design System/Tokens" />

export const Swatch = ({ token, note }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
    <div
      style={{
        width: 44,
        height: 28,
        borderRadius: 6,
        background: `var(${token})`,
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    />
    <code>{token}</code>
    <span style={{ opacity: 0.6 }}>{note}</span>
  </div>
)

export const Group = ({ children }) => (
  <div
    style={{
      background: 'linear-gradient(160deg, #3c4150 0%, #191a1f 70%)',
      borderRadius: 10,
      padding: 16,
      color: 'rgba(255,255,255,0.9)',
      marginBottom: 16,
    }}
  >
    {children}
  </div>
)

# Design tokens

Single source of truth: `src/renderer/src/styles/global.css`. Components
reference these via `var(--token)` in inline styles.

## Brand and status

<Group>
  <Swatch token="--accent" note="brand red (default accent; user-configurable)" />
  <Swatch token="--good" note="success green" />
  <Swatch token="--good-line" note="success border" />
  <Swatch token="--good-wash" note="success fill" />
</Group>

## Text emphasis ramp

<Group>
  <Swatch token="--text-strong" note="0.95 white" />
  <Swatch token="--text" note="0.90 default" />
  <Swatch token="--text-2" note="0.80" />
  <Swatch token="--text-3" note="0.70" />
  <Swatch token="--text-muted" note="0.50" />
  <Swatch token="--text-dim" note="0.40" />
  <Swatch token="--text-faint" note="0.34" />
</Group>

## Surfaces and lines

<Group>
  <Swatch token="--hairline" note="dividers, 0.07" />
  <Swatch token="--surface-1" note="0.06 fill" />
  <Swatch token="--surface-2" note="0.08 fill" />
  <Swatch token="--surface-3" note="0.12 fill" />
  <Swatch token="--surface-4" note="0.14 fill" />
  <Swatch token="--border" note="0.10 border" />
</Group>

## Panels

<Group>
  <Swatch token="--panel-launcher" note="launcher window background" />
  <Swatch token="--panel-menu" note="menu bar dropdown background" />
  <Swatch token="--toast-bg" note="toast background" />
</Group>

## Fonts

- `--ui-font`: system UI stack
- `--mono-font`: JetBrains Mono, then system monospace
```

- [ ] **Step 3: Verify**

```bash
pnpm storybook:build
```

Expected: build green. Spot-check in dev mode that both pages render and swatches show real colors.

- [ ] **Step 4: Commit**

```bash
git add docs/storybook
git commit -m "feat(storybook): app Intro and Tokens docs pages"
```

---

### Task 3: App stories, batch 1 — primitives

**Files:**
- Create one `<C>.stories.tsx` in each of these component folders under `src/renderer/src/components/`: `Kbd`, `Spinner`, `Segmented`, `LiveDot`, `PingBadge`, `TypeBadge`, `Glyph`, `UIIcon`, `AppIcon`, `FrameworkIcon`, `ProjectIcon`, `PixelMeter`, `PixelStepper`, `Gauge`, `SeverityMeter`, `TabHeadline`, `MItem`

**Interfaces:**
- Consumes: `ACCENT` and the `panel` parameter from Task 1.

**The state enumeration rule (applies to every story task):** read the component's `.types.ts` and `.tsx` first. Every boolean prop and every union-typed prop that changes rendering gets its own story; numeric props that drive a visualization get 2-3 representative values (empty-ish, mid, over-threshold). Callbacks are stubbed with `() => {}`. Titles: `Primitives/<Name>` for this batch.

- [ ] **Step 1: Write the stories**

Worked example for a component with numeric-driven visuals, `PixelMeter/PixelMeter.stories.tsx` (props: `usedGB`, `thresholdGB`, `trackMaxGB`, `accent`, `cells?`):

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/preview'
import { PixelMeter } from './PixelMeter'

const meta = {
  title: 'Primitives/PixelMeter',
  component: PixelMeter,
  args: { accent: ACCENT, thresholdGB: 10, trackMaxGB: 30 },
} satisfies Meta<typeof PixelMeter>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = { args: { usedGB: 0 } }
export const UnderThreshold: Story = { args: { usedGB: 4 } }
export const OverThreshold: Story = { args: { usedGB: 18 } }
```

Per-component notes (from their types):

- `Kbd`: default + `wide` (children like `"⌘K"`).
- `Spinner`: read its props first; likely just size/color variants.
- `Segmented`: generic over option values — instantiate with 3 string options, one story per `small` value.
- `LiveDot`: takes `LiveInfo` from `@shared/liveness.types` — read that type, one story per liveness state it distinguishes.
- `PingBadge`: `tone: 'good' | 'accent'` — one story each; pick any `IconRenderer` from `UIIcon`.
- `TypeBadge`, `Glyph`, `AppIcon`, `TabHeadline`, `MItem`: enumerate per their types (`MItem`: default, with icon, with shortcut, `danger`).
- `UIIcon`: a gallery story rendering every exported icon with its name labeled (grid, `parameters: { panel: false }` if it needs width).
- `FrameworkIcon`: gallery story over every `FrameworkKind` value from `@shared/project.types`.
- `ProjectIcon`: kinds without `iconDataUrl` (fallback path) — do NOT fabricate a fake `iconDataUrl` unless a tiny inline data URI is trivial.
- `PixelStepper`: a couple of `valueGB` values.
- `Gauge`: under/over threshold, `calculating`, with `linkedBytes`.
- `SeverityMeter`: read `@renderer/lib/severity` for `SeverityCounts` shape; stories: mixed severities, all clean, `computing`.

- [ ] **Step 2: Verify**

```bash
pnpm storybook:build && pnpm typecheck
```

Expected: green. Spot-check a few stories in dev mode.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components
git commit -m "feat(storybook): stories for app primitives"
```

---

### Task 4: App stories, batch 2 — rows and composites

**Files:**
- Create stories in: `Row`, `MiniRow`, `CacheRow`, `PackageRow`, `Accordion`, `SizeViz`, `RescanHint`

**Interfaces:**
- Consumes: `ACCENT`, the state enumeration rule (Task 3), shared types via the `@shared` alias.

- [ ] **Step 1: Build fixtures inline per story file**

These components take domain objects (`Project`, `PackageEntry`, `LiveInfo`). Read the type in `src/shared/` and construct a minimal realistic literal in the story file. Worked example for `Row/Row.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Project } from '@shared/project.types'
import { ACCENT } from '../../../../../.storybook/preview'
import { Row } from './Row'

// Minimal realistic project fixture (all required Project fields).
const project: Project = {
  id: 'story-my-app',
  name: 'my-app',
  path: '~/code/my-app',
  absPath: '/Users/dev/code/my-app',
  kind: 'next',
  size: 1.2e9,
  uniqueSize: 0.9e9,
  lastUsed: 1751000000000,
}

const meta = {
  title: 'Rows/Row',
  component: Row,
  args: {
    p: project,
    accent: ACCENT,
    density: 'roomy',
    sizeStyle: 'bar',
    maxBytes: 3e9,
    selected: false,
    deleting: false,
    rowRef: () => {},
    onSelect: () => {},
    onOpen: () => {},
    onFinder: () => {},
    onDelete: () => {},
  },
} satisfies Meta<typeof Row>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Selected: Story = { args: { selected: true } }
export const Deleting: Story = { args: { deleting: true } }
```

Type facts (from `@shared`): `Density = 'compact' | 'roomy'`, `SizeStyle = 'plain' | 'bar' | 'ring'`, `LiveInfo = { pid: number; command: string; port?: number }` (e.g. `{ pid: 1234, command: 'next dev', port: 3000 }`). No `as` assertions in fixtures — complete the literals so they typecheck.

Story coverage per component:

- `Row`: default, selected, deleting, one story per `sizeStyle`, one per `density`, with `live` info.
- `MiniRow`: default, deleting, with live info.
- `CacheRow`: default, selected, disabled, busy, with badge, with `danger` action, no action.
- `PackageRow`: read `PackageEntry`; default, selected, expanded, `showUpdates` false, entry with an advisory.
- `Accordion`: closed, open, open with `card`.
- `SizeViz`: one story per `SizeStyle` at a mid ratio.
- `RescanHint`: single default story.

- [ ] **Step 2: Verify**

```bash
pnpm storybook:build && pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components
git commit -m "feat(storybook): stories for app rows and composites"
```

---

### Task 5: App stories, batch 3 — panels, settings, views

**Files:**
- Create stories in: `ResultView`, `UnlockPrompt`, `UpdateBanner`, `UpdateSettings`, `PnpmStoreSettings`, `ScanLocationsSettings`

**Interfaces:**
- Consumes: `ACCENT`, state enumeration rule, `@shared`/`@renderer` aliases.

- [ ] **Step 1: Write the stories**

- `ResultView` (all-primitive props): default, `copied: true`, zero-bytes case.
- `UnlockPrompt`, `UpdateBanner`, `UpdateSettings`: read their types; `UpdateBanner` gets one story per update phase its props distinguish.
- `PnpmStoreSettings` and `ScanLocationsSettings` take `settings: Settings` and `setSetting: SetSetting`: build a full `Settings` literal from `@shared/settings.types` (check `src/main/settings/` or `@shared` for an existing defaults object to copy values from) and stub `setSetting: () => {}`. `PnpmStoreSettings` also takes `store: PnpmStoreInfo | null` — one story with a store fixture, one with `null`.
- These are wider than the 334px panel if they belong to the launcher window — check where each is used (`grep -r "ComponentName" src/renderer/src/launcher src/renderer/src/panel`); launcher-hosted components get `parameters: { panel: false }` and their own width wrapper in the story via a `render` function if needed.
- Titles: `Views/<Name>` for `ResultView`/`UnlockPrompt`/`UpdateBanner`, `Settings/<Name>` for the settings components.

- [ ] **Step 2: Verify**

```bash
pnpm storybook:build && pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components
git commit -m "feat(storybook): stories for app views and settings"
```

---

### Task 6: App coverage enforcement test

**Files:**
- Create: `src/renderer/src/components/stories-coverage.test.ts`

**Interfaces:**
- Produces: the EXEMPT convention (`Record<name, reason>`) that CLAUDE.md documents in Task 12.

- [ ] **Step 1: Write the test**

```ts
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

const COMPONENTS_DIR = fileURLToPath(new URL('.', import.meta.url))

/** Components with no visual output of their own. Add sparingly, with a reason. */
const EXEMPT: Record<string, string> = {
  ErrorBoundary: 'behavioral wrapper, renders only its children or a crash screen',
}

it('every component folder has a stories file', () => {
  const missing = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !(e.name in EXEMPT))
    .filter(
      (e) =>
        !readdirSync(join(COMPONENTS_DIR, e.name)).some((f) =>
          f.endsWith('.stories.tsx'),
        ),
    )
    .map((e) => e.name)

  expect(
    missing,
    `Component folders without a *.stories.tsx: ${missing.join(', ')}. ` +
      'Add stories (see docs/storybook/Intro.mdx) or add the folder to EXEMPT with a reason.',
  ).toEqual([])
})
```

- [ ] **Step 2: Prove the test catches a gap**

```bash
mkdir src/renderer/src/components/FakeComponent && touch src/renderer/src/components/FakeComponent/FakeComponent.tsx
pnpm vitest run src/renderer/src/components/stories-coverage.test.ts
```

Expected: FAIL mentioning `FakeComponent`.

- [ ] **Step 3: Remove the dummy, verify green**

```bash
rm -rf src/renderer/src/components/FakeComponent
pnpm test
```

Expected: PASS (all suites). If any real component is still missing stories, this test just found a gap in Tasks 3-5 — write the missing story, do not exempt it.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/stories-coverage.test.ts
git commit -m "feat(storybook): enforce story coverage for app components"
```

---

### Task 7: Site Storybook scaffold + first story (Btn)

**Files:**
- Create: `site/.storybook/main.ts`, `site/.storybook/preview.ts`
- Create: `site/components/Btn/Btn.stories.tsx`
- Modify: `site/package.json` (scripts + devDeps), `site/.gitignore` or root `.gitignore` (`site/storybook-static/`)

**Interfaces:**
- Produces: site scripts `pnpm storybook` / `pnpm storybook:build` (run from `site/`).

- [ ] **Step 1: Install dependencies (in `site/`)**

```bash
cd site && pnpm add -D storybook@^10.5.5 @storybook/nextjs-vite@^10.5.5 @storybook/addon-docs@^10.5.5 vite@^7
```

(`vite` is a peer of the nextjs-vite framework and `site/` does not have it yet.)

- [ ] **Step 2: Write `site/.storybook/main.ts`**

```ts
import type { StorybookConfig } from '@storybook/nextjs-vite'

const config: StorybookConfig = {
  framework: '@storybook/nextjs-vite',
  stories: [
    '../docs/storybook/**/*.mdx',
    '../components/**/*.stories.tsx',
  ],
  addons: ['@storybook/addon-docs'],
}
export default config
```

(The nextjs-vite framework resolves the `@/*` tsconfig alias and mocks `next/link`, `next/image`, `next/font` itself; only add a `viteFinal` alias block if imports fail in Step 5.)

- [ ] **Step 3: Write `site/.storybook/preview.ts`**

```ts
import type { Preview } from '@storybook/nextjs-vite'
import '../app/globals.css'

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { disable: true },
  },
}
export default preview
```

The site body background (`--color-canvas`, near-black) comes from `globals.css` `@layer base`, so stories render on the real canvas automatically. Brand fonts (`--font-cabinet` etc.) are injected by `next/font` in the app layout and will be absent in Storybook; the token stacks fall through to system fonts, which is acceptable. Note this limitation in the site Intro page (Task 8).

- [ ] **Step 4: Write `site/components/Btn/Btn.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Btn } from './Btn'

const meta = {
  title: 'Primitives/Btn',
  component: Btn,
  args: { href: '#', children: 'Download for macOS' },
} satisfies Meta<typeof Btn>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = { args: { variant: 'primary' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Small: Story = { args: { variant: 'primary', size: 'sm' } }
export const Large: Story = { args: { variant: 'primary', size: 'lg' } }
```

- [ ] **Step 5: Scripts, gitignore, verify**

In `site/package.json` scripts add `"storybook": "storybook dev -p 6007"` and `"storybook:build": "storybook build"`. Add `storybook-static/` to the gitignore that covers `site/`. Then:

```bash
cd site && pnpm storybook:build && pnpm typecheck
```

Expected: green; spot-check dev mode (Btn variants render with Tailwind styling on the dark canvas).

- [ ] **Step 6: Commit**

```bash
git add site/.storybook site/components/Btn/Btn.stories.tsx site/package.json site/pnpm-lock.yaml .gitignore
git commit -m "feat(storybook): scaffold site Storybook with Btn stories"
```

---

### Task 8: Site MDX docs (Intro + Tokens)

**Files:**
- Create: `site/docs/storybook/Intro.mdx`, `site/docs/storybook/Tokens.mdx`

- [ ] **Step 1: Write `site/docs/storybook/Intro.mdx`**

```mdx
import { Meta } from '@storybook/addon-docs/blocks'

<Meta title="Design System/Intro" />

# TidyDisk site design system

The marketing site (tidydisk.app) is Next.js with Tailwind v4. All design
tokens live in `app/globals.css` under `@theme`: colors like `ink-2`,
`accent`, `ok`; fonts `display`, `ui`, `mono`. Components use Tailwind
utilities with arbitrary values for exact pixels, plus custom `max900:` and
`max560:` variants for the inclusive breakpoints.

## Component convention

One folder per component under `components/`, with `index.ts`, the component
file, a `.types.ts` when it has props, and a `.stories.tsx` (required,
enforced by `components/stories-coverage.test.ts`; non-visual components go
on its EXEMPT list with a reason).

## Known Storybook limitations

- Brand fonts are injected by `next/font` in the app layout, so Storybook
  falls back to system fonts. Spacing and color are faithful; letterforms are
  not.
- Page-level compositions in `components/pages/` read markdown content from
  disk and are exempt from stories.
```

- [ ] **Step 2: Write `site/docs/storybook/Tokens.mdx`**

Same Swatch pattern as the app book, using the site's Tailwind theme variables (`globals.css` is imported by the preview, so `var(--color-*)` resolves):

```mdx
import { Meta } from '@storybook/addon-docs/blocks'

<Meta title="Design System/Tokens" />

export const Swatch = ({ token, note }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
    <div
      style={{
        width: 44,
        height: 28,
        borderRadius: 6,
        background: `var(${token})`,
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    />
    <code>{token}</code>
    <span style={{ opacity: 0.6 }}>{note}</span>
  </div>
)

# Design tokens

Source of truth: the `@theme` block in `app/globals.css`. Use them through
Tailwind utilities (`text-ink-2`, `bg-accent`, `font-mono`).

## Canvas and panels

<Swatch token="--color-canvas" note="page background" />
<Swatch token="--color-canvas-soft" note="soft section background" />
<Swatch token="--color-panel" note="card / panel background" />

## Ink ramp

<Swatch token="--color-ink" note="primary text" />
<Swatch token="--color-ink-2" note="secondary, 0.70" />
<Swatch token="--color-ink-3" note="tertiary, 0.46" />
<Swatch token="--color-ink-4" note="faint, 0.30" />

## Lines

<Swatch token="--color-line" note="hairline, 0.09" />
<Swatch token="--color-line-2" note="stronger line, 0.14" />

## Brand and status

<Swatch token="--color-accent" note="brand red" />
<Swatch token="--color-accent-deep" note="gradient partner" />
<Swatch token="--color-ok" note="success" />
<Swatch token="--color-warn" note="warning" />

## Fonts

- `font-display`: Cabinet Grotesk (headlines)
- `font-ui`: General Sans (body)
- `font-mono`: JetBrains Mono (numbers, code)
```

- [ ] **Step 3: Verify and commit**

```bash
cd site && pnpm storybook:build
git add site/docs
git commit -m "feat(storybook): site Intro and Tokens docs pages"
```

---

### Task 9: Site stories, batch 1 — primitives and ui-mock

**Files:**
- Create stories in `site/components/`: `Eyebrow`, `SectionHead`, `Icon`, `PixelMeter`, `Pixrow`, `Wrap`, `LangSwitcher`, `ui-mock` (ONE file `ui-mock/ui-mock.stories.tsx` covering its exported pieces: `GlassPanel`, `PanelSep`, `Pico`, `Pill`, `RowMeta`, `SizeLabel`, `UiRow`)

**Interfaces:**
- Consumes: state enumeration rule from Task 3 (same rule, site edition; titles `Primitives/...` and `UI Mock/...`).

- [ ] **Step 1: Write the stories**

Read each component first. Notes:

- `Icon`: gallery story showing every icon name it exports.
- `ui-mock`: these compose into the fake app panel used on the landing page; one meta per file is fine (use `title: 'UI Mock/GlassPanel'` etc. via multiple named CSF files is NOT needed — a single stories file with `component: GlassPanel` for the meta and extra stories rendering the other pieces via `render:` functions keeps it to one file, satisfying the coverage rule).
- Components that are purely layout (`Wrap`) get one story with placeholder children.

- [ ] **Step 2: Verify and commit**

```bash
cd site && pnpm storybook:build && pnpm typecheck
git add site/components
git commit -m "feat(storybook): stories for site primitives and ui-mock"
```

---

### Task 10: Site stories, batch 2 — sections

**Files:**
- Create stories in `site/components/`: `Navbar`, `Hero`, `Features`, `FeatureGrid`, `HowItWorks`, `StatementBand`, `WhyLifecycle`, `Areas`, `AppPanel`, `FinalCta`, `Footer`, `Download`, `CookieConsent`, `CookiePreferences`, `LegalArticle`

**Interfaces:**
- Consumes: state enumeration rule; sections are full-width, so use `parameters: { layout: 'fullscreen' }` in their meta.

- [ ] **Step 1: Write the stories**

- Read each component first; many take no props (render as-is, single `Default` story), some take copy/locale props — check how `site/app` pages instantiate them and mirror those props as fixtures.
- `CookieConsent`/`CookiePreferences` are client components with consent state; if one genuinely cannot render standalone (e.g. it requires a provider that does not exist), move it to the site EXEMPT list in Task 11 with a reason instead of forcing a broken story.
- Titles: `Sections/<Name>`, `Chrome/Navbar`, `Chrome/Footer`, `Legal/...` as fits.

- [ ] **Step 2: Verify and commit**

```bash
cd site && pnpm storybook:build && pnpm typecheck
git add site/components
git commit -m "feat(storybook): stories for site sections"
```

---

### Task 11: Site coverage enforcement test

**Files:**
- Create: `site/components/stories-coverage.test.ts`

- [ ] **Step 1: Write the test**

Same shape as Task 6 but site-aware: `components/pages/*` are treated as units too, and the initial EXEMPT list covers the non-visual/server components:

```ts
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

const COMPONENTS_DIR = fileURLToPath(new URL('.', import.meta.url))

/** Non-visual or server-only components. Add sparingly, with a reason. */
const EXEMPT: Record<string, string> = {
  JsonLd: 'renders a script tag with structured data, nothing visual',
  SetHtmlLang: 'side-effect component, sets the html lang attribute',
  SvgSprite: 'invisible svg symbol definitions',
  RevealClient: 'scroll-reveal behavior wrapper, no visual output of its own',
  'pages/BlogArticle': 'server page composition, reads markdown from disk',
  'pages/BlogIndex': 'server page composition, reads markdown from disk',
  'pages/HomePage': 'server page composition',
  'pages/LegalPage': 'server page composition, reads markdown from disk',
  'pages/PrivacyPage': 'server page composition, reads markdown from disk',
}

const units = (): string[] => {
  const top = readdirSync(COMPONENTS_DIR, { withFileTypes: true }).filter((e) =>
    e.isDirectory(),
  )
  return top.flatMap((e) =>
    e.name === 'pages'
      ? readdirSync(join(COMPONENTS_DIR, 'pages'), { withFileTypes: true })
          .filter((p) => p.isDirectory())
          .map((p) => `pages/${p.name}`)
      : [e.name],
  )
}

it('every component folder has a stories file', () => {
  const missing = units()
    .filter((u) => !(u in EXEMPT))
    .filter(
      (u) =>
        !readdirSync(join(COMPONENTS_DIR, u)).some((f) =>
          f.endsWith('.stories.tsx'),
        ),
    )

  expect(
    missing,
    `Component folders without a *.stories.tsx: ${missing.join(', ')}. ` +
      'Add stories (see site/docs/storybook/Intro.mdx) or add the folder to EXEMPT with a reason.',
  ).toEqual([])
})
```

Adjust the EXEMPT list to match reality discovered in Tasks 9-10 (e.g. if `CookieConsent` got exempted, add it here with the reason; if `RevealClient` turned out renderable, remove it and write the story).

- [ ] **Step 2: Prove it catches a gap, then verify green**

```bash
cd site
mkdir components/FakeComponent && touch components/FakeComponent/FakeComponent.tsx
pnpm vitest run components/stories-coverage.test.ts   # expect FAIL naming FakeComponent
rm -rf components/FakeComponent
pnpm test                                             # expect PASS
```

- [ ] **Step 3: Commit**

```bash
git add site/components/stories-coverage.test.ts
git commit -m "feat(storybook): enforce story coverage for site components"
```

---

### Task 12: CI integration

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add app Storybook build to the `check` job**

After the existing `Build` step:

```yaml
      - name: Build Storybook
        run: pnpm storybook:build
```

- [ ] **Step 2: Add a `site` job**

The site has its own lockfile and is not currently covered by CI at all; this job runs its tests (including the new coverage test) and its Storybook build:

```yaml
  site:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: site
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: site/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Unit tests
        run: pnpm test

      - name: Build Storybook
        run: pnpm storybook:build
```

- [ ] **Step 3: Verify locally what CI will run**

```bash
pnpm storybook:build && pnpm test
cd site && pnpm storybook:build && pnpm test && pnpm typecheck
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: build both Storybooks and run site checks on PRs"
```

---

### Task 13: Convention docs (CLAUDE.md) + STATUS.html + PR

**Files:**
- Modify: `CLAUDE.md`, `STATUS.html`

- [ ] **Step 1: Update CLAUDE.md**

In the `## Conventions` section, change the component-folder bullet to:

```markdown
- One folder per component: `index.ts`, `Component.tsx`, `Component.types.ts`,
  `Component.stories.tsx`, optionally `.constants.ts` and tests. Story
  coverage is enforced by `stories-coverage.test.ts` in each component tree;
  purely behavioral components go on its EXEMPT list with a reason.
```

Add a new section after Conventions:

```markdown
## Storybook

- Two books: `pnpm storybook` at the root (app components, dark panel
  decorator) and `pnpm storybook` inside `site/` (Tailwind site components).
  Both build in CI on every PR (`storybook:build`).
- New components ship with stories covering every meaningful visual state
  (each boolean/union prop that changes rendering). Update stories when a
  component's visual states change.
- Design-system docs live in the books themselves: `docs/storybook/*.mdx`
  (app) and `site/docs/storybook/*.mdx` (site). Keep the Tokens pages in sync
  when tokens change in `global.css` / `site/app/globals.css`.
- Keep both books on the same Storybook major version.
```

- [ ] **Step 2: Update STATUS.html data block**

Per project rules: bump `updated`, add a roadmap item for the Storybook work as `done`, append a `log` entry (one sentence), adjust `userActions` only if something needs the user (nothing should).

- [ ] **Step 3: Full verification**

```bash
pnpm typecheck && pnpm test && pnpm exec biome ci . && pnpm build && pnpm storybook:build
cd site && pnpm typecheck && pnpm test && pnpm storybook:build
```

Expected: everything green.

- [ ] **Step 4: Commit and open PR**

```bash
git add CLAUDE.md STATUS.html
git commit -m "docs: Storybook convention in CLAUDE.md + STATUS update"
git push -u origin feat/storybook
gh pr create --title "feat: documented Storybooks for app + site with CI-enforced coverage" --body "$(cat <<'EOF'
Implements docs/superpowers/specs/2026-07-29-storybook-design-system-design.md

- Root Storybook (react-vite) for the 32 app components, dark vibrancy-panel decorator, Intro + live Tokens docs
- Site Storybook (nextjs-vite) for the site components, Tailwind v4 tokens docs
- stories-coverage.test.ts in both trees: a component folder without stories fails pnpm test (explicit EXEMPT list with reasons)
- CI: both storybook builds on every PR + new site job (typecheck, tests, storybook)
- CLAUDE.md: .stories.tsx is now a required member of every component folder

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Verification checklist (spec coverage)

- Two Storybooks, correct frameworks, same major: Tasks 1, 7.
- Dark panel decorator with opt-out: Task 1.
- Intro + Tokens MDX per book, autodocs on: Tasks 2, 8 (autodocs via `tags` in both previews).
- Stories for all components, batched primitives-first: Tasks 3-5, 9-10.
- Coverage tests with reviewable EXEMPT lists, riding existing vitest configs: Tasks 6, 11.
- CI builds both books + site tests on PRs: Task 12.
- CLAUDE.md convention + STATUS.html: Task 13.
- Out of scope (unchanged): no hosting, no composition, no visual regression, no component refactors.
