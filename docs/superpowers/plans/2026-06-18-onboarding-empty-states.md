# Onboarding, Pixel Stepper, Scan-Off & Honest Empty States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a guided first-run onboarding flow, a pixel-rectangle alert-threshold stepper, an explicit "Off" for automatic scanning, and honest empty/transient states across the launcher and the menu-bar panel.

**Architecture:** A new persisted `onboarded` flag gates a 2-step `Onboarding` flow rendered inside the launcher on first launch (auto-opened by the main process). Two new reusable renderer components — `PixelStepper` (replaces the range sliders) and `PingBadge` (subtle Tailwind-style ping ring) — are shared by onboarding, both settings surfaces, and the empty/scanning states. `scanInterval: 'manual'` keeps its meaning (scheduler already early-returns) and is relabelled "Off".

**Tech Stack:** Electron + electron-vite, React 18 + TypeScript, Vitest, Biome. Renderer uses CSS design tokens (`var(--…)`) and inline styles. Path aliases: `@renderer/*`, `@shared/*`.

**Spec:** `docs/superpowers/specs/2026-06-17-onboarding-empty-states-design.md`

**Per-task verification commands** (UI tasks have no component-test harness — they rely on these + in-app):
- `pnpm typecheck` → expect no output (clean)
- `pnpm lint` → expect "No fixes applied" (one pre-existing biome.json deprecation "info" is OK)
- `pnpm test` → expect all green
- `pnpm build` → expect main + preload + renderer built

---

## File Structure

**Create**
- `src/renderer/src/components/PixelStepper/{index.ts,PixelStepper.tsx,PixelStepper.types.ts,PixelStepper.constants.ts,PixelStepper.constants.test.ts}` — threshold stepper + pure helpers.
- `src/renderer/src/components/PingBadge/{index.ts,PingBadge.tsx,PingBadge.types.ts}` — icon + ping ring.
- `src/renderer/src/launcher/views/Onboarding/{index.ts,Onboarding.tsx,Onboarding.types.ts,WelcomeStep.tsx,SetupStep.tsx}` — guided 2-step flow.
- `src/renderer/src/panel/PanelApp/PanelEmpty.tsx` — panel first-run nudge + all-clean.

**Modify**
- `src/shared/settings.types.ts`, `src/shared/settings.constants.ts`, `src/main/settings/validate-setting.ts`, `src/main/settings/validate-setting.test.ts` — `onboarded` flag.
- `src/renderer/src/hooks/useSettings.ts` — expose a `loaded` flag.
- `src/renderer/src/styles/global.css` — `ping-soft` keyframe.
- `src/renderer/src/launcher/views/SettingsView.tsx`, `src/renderer/src/panel/PanelApp/PanelSettings.tsx` — stepper + "Off".
- `src/renderer/src/launcher/views/EmptyView.tsx`, `src/renderer/src/launcher/views/ScanningView.tsx`, `src/renderer/src/panel/PanelApp/ScanPanel.tsx` — honest copy + `PingBadge`.
- `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx` — gate onboarding, `loaded`, scan-off footer.
- `src/renderer/src/panel/PanelApp/PanelApp.tsx` — use `PanelEmpty`, gate first-run.
- `src/main/index.ts` — first-launch behaviour.

---

## Task 1: Add the `onboarded` setting

**Files:**
- Modify: `src/shared/settings.types.ts`
- Modify: `src/shared/settings.constants.ts:3-10`
- Modify: `src/main/settings/validate-setting.ts:24-41`
- Test: `src/main/settings/validate-setting.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `src/main/settings/validate-setting.test.ts` (inside the existing `describe`):

```ts
  it('coerces the onboarded boolean flag', () => {
    expect(coerceSetting('onboarded', true)).toEqual({ key: 'onboarded', value: true })
    expect(coerceSetting('onboarded', false)).toEqual({ key: 'onboarded', value: false })
    expect(coerceSetting('onboarded', 'yes')).toBeNull()
    expect(coerceSetting('onboarded', 1)).toBeNull()
  })
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `pnpm test -- validate-setting`
Expected: the new test fails (onboarded returns null because the case doesn't exist yet).

- [ ] **Step 3: Add `onboarded` to the type**

In `src/shared/settings.types.ts`, add the field to `Settings`:

```ts
export interface Settings {
  accent: string
  sizeStyle: SizeStyle
  density: Density
  thresholdGB: number
  scanInterval: ScanInterval
  notify: boolean
  onboarded: boolean
}
```

- [ ] **Step 4: Default it to false**

In `src/shared/settings.constants.ts`, add to `DEFAULT_SETTINGS`:

```ts
export const DEFAULT_SETTINGS: Settings = {
  accent: '#ff6363',
  sizeStyle: 'plain',
  density: 'roomy',
  thresholdGB: 5,
  scanInterval: 'daily',
  notify: true,
  onboarded: false,
}
```

- [ ] **Step 5: Coerce it in validate-setting**

In `src/main/settings/validate-setting.ts`, add a case alongside `notify` (before `default`):

```ts
    case 'onboarded':
      return typeof value === 'boolean' ? { key, value } : null
```

- [ ] **Step 6: Run tests — expect PASS**

Run: `pnpm test -- validate-setting`
Expected: PASS. Then `pnpm typecheck` → clean.

- [ ] **Step 7: Commit**

```bash
git add src/shared/settings.types.ts src/shared/settings.constants.ts src/main/settings/validate-setting.ts src/main/settings/validate-setting.test.ts
git commit -m "feat(settings): add persisted onboarded flag"
```

---

## Task 2: Expose a `loaded` flag from `useSettings`

So the launcher doesn't flash onboarding for returning users before settings load.

**Files:**
- Modify: `src/renderer/src/hooks/useSettings.ts`

- [ ] **Step 1: Add the loaded state**

Replace the body of `src/renderer/src/hooks/useSettings.ts` with:

```ts
import { DEFAULT_SETTINGS } from '@shared/settings.constants'
import type { Settings } from '@shared/settings.types'
import { useCallback, useEffect, useState } from 'react'

export type SetSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => void

/** Live settings synced with the main process; `loaded` is false until the first fetch resolves. */
export function useSettings(): [Settings, SetSetting, boolean] {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    window.clean.getSettings().then((s) => {
      if (alive) {
        setSettings(s)
        setLoaded(true)
      }
    })
    const unsubscribe = window.clean.onSettingsChanged(setSettings)
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  const setSetting = useCallback<SetSetting>((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    void window.clean.setSetting(key, value)
  }, [])

  return [settings, setSetting, loaded]
}
```

Note: existing consumers destructure `const [settings, setSetting] = useSettings()` — adding a third tuple element is backward compatible.

- [ ] **Step 2: Verify**

Run: `pnpm typecheck` → clean.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/hooks/useSettings.ts
git commit -m "feat(settings): expose loaded flag from useSettings"
```

---

## Task 3: PixelStepper pure helpers (TDD)

**Files:**
- Create: `src/renderer/src/components/PixelStepper/PixelStepper.constants.ts`
- Test: `src/renderer/src/components/PixelStepper/PixelStepper.constants.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/renderer/src/components/PixelStepper/PixelStepper.constants.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { STEPPER_CELLS, clampGb, gbToIndex, indexToGb, nudgeGb } from './PixelStepper.constants'

describe('PixelStepper helpers', () => {
  it('exposes 10 whole-GB cells', () => {
    expect(STEPPER_CELLS).toBe(10)
  })

  it('clamps to the 1–10 GB range', () => {
    expect(clampGb(0)).toBe(1)
    expect(clampGb(99)).toBe(10)
    expect(clampGb(5)).toBe(5)
    expect(clampGb(Number.NaN)).toBe(1)
  })

  it('maps GB to a 0-based block index, rounding fractional values', () => {
    expect(gbToIndex(1)).toBe(0)
    expect(gbToIndex(5)).toBe(4)
    expect(gbToIndex(10)).toBe(9)
    expect(gbToIndex(5.5)).toBe(5) // rounds up to the 6 GB block
  })

  it('maps a block index back to whole GB', () => {
    expect(indexToGb(0)).toBe(1)
    expect(indexToGb(9)).toBe(10)
    expect(indexToGb(99)).toBe(10)
  })

  it('nudges by one GB step and clamps at the ends', () => {
    expect(nudgeGb(5, 1)).toBe(6)
    expect(nudgeGb(5, -1)).toBe(4)
    expect(nudgeGb(10, 1)).toBe(10)
    expect(nudgeGb(1, -1)).toBe(1)
  })
})
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `pnpm test -- PixelStepper`
Expected: FAIL ("Failed to resolve import ./PixelStepper.constants").

- [ ] **Step 3: Implement the helpers**

Create `src/renderer/src/components/PixelStepper/PixelStepper.constants.ts`:

```ts
/** Alert-threshold range, in whole GB, for the pixel stepper. */
export const STEPPER_MIN_GB = 1
export const STEPPER_MAX_GB = 10
export const STEPPER_STEP_GB = 1
/** One clickable block per GB step (10 blocks for 1–10 GB). */
export const STEPPER_CELLS = (STEPPER_MAX_GB - STEPPER_MIN_GB) / STEPPER_STEP_GB + 1

/** Clamp any value into the stepper's GB range. */
export function clampGb(gb: number): number {
  if (!Number.isFinite(gb)) return STEPPER_MIN_GB
  return Math.min(STEPPER_MAX_GB, Math.max(STEPPER_MIN_GB, gb))
}

/** 0-based block index for a (possibly fractional) GB value. */
export function gbToIndex(gb: number): number {
  return Math.round((clampGb(gb) - STEPPER_MIN_GB) / STEPPER_STEP_GB)
}

/** Whole-GB value represented by block index `i`. */
export function indexToGb(i: number): number {
  const idx = Math.min(STEPPER_CELLS - 1, Math.max(0, Math.round(i)))
  return STEPPER_MIN_GB + idx * STEPPER_STEP_GB
}

/** Step a GB value by ±1 block, clamped. */
export function nudgeGb(gb: number, dir: -1 | 1): number {
  return indexToGb(gbToIndex(gb) + dir)
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm test -- PixelStepper`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/PixelStepper/PixelStepper.constants.ts src/renderer/src/components/PixelStepper/PixelStepper.constants.test.ts
git commit -m "feat(stepper): pixel-stepper GB<->index helpers"
```

---

## Task 4: PixelStepper component

**Files:**
- Create: `src/renderer/src/components/PixelStepper/PixelStepper.types.ts`
- Create: `src/renderer/src/components/PixelStepper/PixelStepper.tsx`
- Create: `src/renderer/src/components/PixelStepper/index.ts`

- [ ] **Step 1: Types**

Create `src/renderer/src/components/PixelStepper/PixelStepper.types.ts`:

```ts
export interface PixelStepperProps {
  /** Current value in GB. */
  valueGB: number
  /** Accent color for filled blocks. */
  accent: string
  /** Called with the new whole-GB value when the user picks a block. */
  onChange: (gb: number) => void
}
```

- [ ] **Step 2: Component**

Create `src/renderer/src/components/PixelStepper/PixelStepper.tsx`:

```tsx
import { mixColor } from '@renderer/lib/colors'
import { type ReactNode, useRef } from 'react'
import { STEPPER_CELLS, gbToIndex, indexToGb, nudgeGb } from './PixelStepper.constants'
import type { PixelStepperProps } from './PixelStepper.types'

/** Pixel-rectangle stepper for the alert threshold — each block is one GB step. */
export function PixelStepper({ valueGB, accent, onChange }: PixelStepperProps): ReactNode {
  const rowRef = useRef<HTMLDivElement>(null)
  const selIdx = gbToIndex(valueGB)

  const setFromClientX = (clientX: number): void => {
    const el = rowRef.current
    if (!el) return
    const { left, width } = el.getBoundingClientRect()
    const idx = Math.min(STEPPER_CELLS - 1, Math.max(0, Math.floor(((clientX - left) / width) * STEPPER_CELLS)))
    const gb = indexToGb(idx)
    if (gb !== valueGB) onChange(gb)
  }

  return (
    <div
      ref={rowRef}
      role="slider"
      tabIndex={0}
      aria-label="Alert threshold in gigabytes"
      aria-valuemin={1}
      aria-valuemax={10}
      aria-valuenow={indexToGb(selIdx)}
      onPointerDown={(e) => {
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        setFromClientX(e.clientX)
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) setFromClientX(e.clientX)
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault()
          onChange(nudgeGb(valueGB, 1))
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault()
          onChange(nudgeGb(valueGB, -1))
        }
      }}
      style={{ display: 'flex', gap: 2, cursor: 'pointer', outline: 'none', touchAction: 'none' }}
    >
      {Array.from({ length: STEPPER_CELLS }).map((_, i) => {
        const filled = i <= selIdx
        const selected = i === selIdx
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 18,
              borderRadius: 2.5,
              background: filled ? accent : 'var(--surface-2)',
              filter: selected ? 'brightness(1.3)' : 'none',
              boxShadow: selected ? `0 0 8px ${mixColor(accent, 'rgba(0,0,0,0)', 0.5)}` : 'none',
              transition: 'background .12s, filter .12s',
            }}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Barrel export**

Create `src/renderer/src/components/PixelStepper/index.ts`:

```ts
export { PixelStepper } from './PixelStepper'
export type { PixelStepperProps } from './PixelStepper.types'
```

- [ ] **Step 4: Verify**

Run: `pnpm typecheck` → clean. `pnpm lint` → clean.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/PixelStepper/PixelStepper.tsx src/renderer/src/components/PixelStepper/PixelStepper.types.ts src/renderer/src/components/PixelStepper/index.ts
git commit -m "feat(stepper): PixelStepper component (click/drag/keyboard)"
```

---

## Task 5: PingBadge component + keyframe

**Files:**
- Modify: `src/renderer/src/styles/global.css` (add keyframe near the other `@keyframes`)
- Create: `src/renderer/src/components/PingBadge/PingBadge.types.ts`
- Create: `src/renderer/src/components/PingBadge/PingBadge.tsx`
- Create: `src/renderer/src/components/PingBadge/index.ts`

- [ ] **Step 1: Add the keyframe**

In `src/renderer/src/styles/global.css`, add after the existing keyframes block:

```css
@keyframes ping-soft {
  70%,
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}
```

- [ ] **Step 2: Types**

Create `src/renderer/src/components/PingBadge/PingBadge.types.ts`:

```ts
import type { IconRenderer } from '@renderer/components/UIIcon'

export interface PingBadgeProps {
  icon: IconRenderer
  /** 'good' = green (all clean), 'accent' = brand color (scanning). */
  tone: 'good' | 'accent'
  /** Accent color, used when tone is 'accent'. */
  accent: string
  /** Outer diameter in px. */
  size?: number
  /** Icon glyph size in px. */
  iconSize?: number
}
```

- [ ] **Step 3: Component**

Create `src/renderer/src/components/PingBadge/PingBadge.tsx`:

```tsx
import { mixColor } from '@renderer/lib/colors'
import type { ReactNode } from 'react'
import type { PingBadgeProps } from './PingBadge.types'

const GOOD = '#34d399'

/** Icon tile wrapped in a subtle Tailwind-style ping ring. */
export function PingBadge({ icon, tone, accent, size = 54, iconSize = 26 }: PingBadgeProps): ReactNode {
  const color = tone === 'good' ? GOOD : accent
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: mixColor(color, 'rgba(0,0,0,0)', 0.32),
          animation: 'ping-soft 2.2s cubic-bezier(0, 0, 0.2, 1) infinite',
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: mixColor(color, 'rgba(0,0,0,0)', 0.14),
          color,
        }}
      >
        {icon({ size: iconSize })}
      </span>
    </div>
  )
}
```

- [ ] **Step 4: Barrel export**

Create `src/renderer/src/components/PingBadge/index.ts`:

```ts
export { PingBadge } from './PingBadge'
export type { PingBadgeProps } from './PingBadge.types'
```

- [ ] **Step 5: Verify & commit**

Run: `pnpm typecheck` → clean.

```bash
git add src/renderer/src/styles/global.css src/renderer/src/components/PingBadge
git commit -m "feat(ui): PingBadge with subtle ping ring + keyframe"
```

---

## Task 6: PixelStepper + "Off" in the launcher SettingsView

**Files:**
- Modify: `src/renderer/src/launcher/views/SettingsView.tsx`

- [ ] **Step 1: Swap the slider and add Off**

In `src/renderer/src/launcher/views/SettingsView.tsx`, add the import:

```ts
import { PixelStepper } from '@renderer/components/PixelStepper'
```

Replace the `scanInterval` `options` array's last entry so "Manual" reads "Off":

```ts
          options={[
            { value: '6h', label: '6h' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'manual', label: 'Off' },
          ]}
```

Replace the entire "Alert threshold" `SettingsRow` (the `<input type="range">` block) with:

```tsx
      <SettingsRow
        label="Alert threshold"
        hint={`Notify me when node_modules folders exceed ${gb.toFixed(0)} GB total`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: 230 }}>
          <div style={{ flex: 1 }}>
            <PixelStepper valueGB={gb} accent={accent} onChange={(v) => setSetting('thresholdGB', v)} />
          </div>
          <span
            style={{
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 650,
              fontSize: 13,
              color: 'var(--text)',
              minWidth: 42,
              textAlign: 'right',
            }}
          >
            {gb.toFixed(0)} GB
          </span>
        </div>
      </SettingsRow>
```

- [ ] **Step 2: Verify & commit**

Run: `pnpm typecheck` → clean. `pnpm lint` → clean.

```bash
git add src/renderer/src/launcher/views/SettingsView.tsx
git commit -m "feat(settings): pixel stepper + Off cadence in launcher settings"
```

---

## Task 7: PixelStepper + "Off" in the panel settings

**Files:**
- Modify: `src/renderer/src/panel/PanelApp/PanelSettings.tsx`

- [ ] **Step 1: Swap the slider and add Off**

In `src/renderer/src/panel/PanelApp/PanelSettings.tsx`, add the import:

```ts
import { PixelStepper } from '@renderer/components/PixelStepper'
```

Add `'Off'` to the cadence `Segmented` options:

```ts
          options={[
            { value: '6h', label: '6h' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'manual', label: 'Off' },
          ]}
```

Replace the `<input type="range">` (the threshold input) with:

```tsx
        <div style={{ marginTop: 10 }}>
          <PixelStepper
            valueGB={settings.thresholdGB}
            accent={accent}
            onChange={(v) => setSetting('thresholdGB', v)}
          />
        </div>
```

(Keep the existing label row that shows `{settings.thresholdGB.toFixed(1)} GB` above it; change `.toFixed(1)` to `.toFixed(0)`.)

- [ ] **Step 2: Verify & commit**

Run: `pnpm typecheck` → clean.

```bash
git add src/renderer/src/panel/PanelApp/PanelSettings.tsx
git commit -m "feat(settings): pixel stepper + Off cadence in panel settings"
```

---

## Task 8: Onboarding flow components

**Files:**
- Create: `src/renderer/src/launcher/views/Onboarding/Onboarding.types.ts`
- Create: `src/renderer/src/launcher/views/Onboarding/WelcomeStep.tsx`
- Create: `src/renderer/src/launcher/views/Onboarding/SetupStep.tsx`
- Create: `src/renderer/src/launcher/views/Onboarding/Onboarding.tsx`
- Create: `src/renderer/src/launcher/views/Onboarding/index.ts`

- [ ] **Step 1: Types**

Create `src/renderer/src/launcher/views/Onboarding/Onboarding.types.ts`:

```ts
export type OnboardingStep = 'welcome' | 'setup'
```

- [ ] **Step 2: Step dots helper + WelcomeStep**

Create `src/renderer/src/launcher/views/Onboarding/WelcomeStep.tsx`:

```tsx
import { AppIcon } from '@renderer/components/AppIcon'
import { UIIcon } from '@renderer/components/UIIcon'
import type { ReactNode } from 'react'

interface WelcomeStepProps {
  accent: string
  onNext: () => void
  onSkip: () => void
}

function Dots({ active }: { active: 0 | 1 }): ReactNode {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
      {[0, 1].map((i) => (
        <span
          key={i}
          style={{ width: 20, height: 5, borderRadius: 3, background: i === active ? 'var(--text-3)' : 'var(--surface-2)' }}
        />
      ))}
    </div>
  )
}

function Reassure({ children }: { children: ReactNode }): ReactNode {
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', color: 'var(--text-2)', fontSize: 12.5, margin: '7px 0' }}>
      <span style={{ color: 'var(--good)', display: 'flex', flex: 'none', marginTop: 1 }}>{UIIcon.checkCircle({ size: 15 })}</span>
      <span>{children}</span>
    </div>
  )
}

/** Onboarding step 1: brand, value prop, reassurance, primary CTA. */
export function WelcomeStep({ accent, onNext, onSkip }: WelcomeStepProps): ReactNode {
  return (
    <div style={{ padding: '34px 40px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <Dots active={0} />
      <AppIcon accent={accent} size={40} />
      <div style={{ fontSize: 19, fontWeight: 700, marginTop: 14, color: 'var(--text-strong)' }}>
        Clean my <span style={{ fontFamily: 'var(--mono-font)', color: 'var(--good)' }}>node_modules</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, maxWidth: 380 }}>
        Find and reclaim disk from heavy, stale dependency folders.
      </div>
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--hairline)',
          borderRadius: 11,
          padding: '11px 14px',
          marginTop: 18,
          textAlign: 'left',
          maxWidth: 420,
          width: '100%',
        }}
      >
        <Reassure>Scans your home folder — skips system &amp; hidden files</Reassure>
        <Reassure>
          Deletes to Trash, never <code style={{ fontFamily: 'var(--mono-font)', color: 'var(--text-3)' }}>rm -rf</code> — fully reversible
        </Reassure>
      </div>
      <button
        type="button"
        onClick={onNext}
        style={{
          marginTop: 20,
          width: '100%',
          maxWidth: 420,
          background: accent,
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '11px',
          fontSize: 13.5,
          fontWeight: 650,
          cursor: 'pointer',
        }}
      >
        Get started →
      </button>
      <button
        type="button"
        onClick={onSkip}
        style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 12, cursor: 'pointer' }}
      >
        Skip — use defaults
      </button>
    </div>
  )
}
```

- [ ] **Step 3: SetupStep**

Create `src/renderer/src/launcher/views/Onboarding/SetupStep.tsx`:

```tsx
import { PixelStepper } from '@renderer/components/PixelStepper'
import { Segmented } from '@renderer/components/Segmented'
import { UIIcon } from '@renderer/components/UIIcon'
import type { SetSetting } from '@renderer/hooks/useSettings'
import type { Settings } from '@shared/settings.types'
import type { ReactNode } from 'react'

interface SetupStepProps {
  settings: Settings
  setSetting: SetSetting
  accent: string
  onBack: () => void
  onScan: () => void
}

/** Onboarding step 2: alert limit (pixel stepper) + scan cadence (incl. Off). */
export function SetupStep({ settings, setSetting, accent, onBack, onScan }: SetupStepProps): ReactNode {
  return (
    <div style={{ padding: '34px 40px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 22 }}>
        <span style={{ width: 20, height: 5, borderRadius: 3, background: 'var(--surface-2)' }} />
        <span style={{ width: 20, height: 5, borderRadius: 3, background: 'var(--text-3)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Alert me when node_modules pass</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)', fontVariantNumeric: 'tabular-nums' }}>
            {settings.thresholdGB.toFixed(0)} GB
          </span>
        </div>
        <PixelStepper valueGB={settings.thresholdGB} accent={accent} onChange={(v) => setSetting('thresholdGB', v)} />

        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', margin: '22px 0 9px' }}>Scan automatically</div>
        <Segmented
          accent={accent}
          value={settings.scanInterval}
          onChange={(v) => setSetting('scanInterval', v)}
          options={[
            { value: '6h', label: '6h' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'manual', label: 'Off' },
          ]}
        />

        <button
          type="button"
          onClick={onScan}
          style={{
            marginTop: 24,
            width: '100%',
            background: accent,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '11px',
            fontSize: 13.5,
            fontWeight: 650,
            cursor: 'pointer',
          }}
        >
          Scan my disk →
        </button>
        <button
          type="button"
          onClick={onBack}
          style={{
            marginTop: 10,
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {UIIcon.chevronLeft({ size: 14 })} back
        </button>
      </div>
    </div>
  )
}
```

Note: `Segmented` infers its generic from `value={settings.scanInterval}` (a `ScanInterval`), so the option `value`s type-check.

- [ ] **Step 4: Orchestrator**

Create `src/renderer/src/launcher/views/Onboarding/Onboarding.tsx`:

```tsx
import type { SetSetting } from '@renderer/hooks/useSettings'
import type { Settings } from '@shared/settings.types'
import { type ReactNode, useState } from 'react'
import type { OnboardingStep } from './Onboarding.types'
import { SetupStep } from './SetupStep'
import { WelcomeStep } from './WelcomeStep'

interface OnboardingProps {
  settings: Settings
  setSetting: SetSetting
  accent: string
  /** Finish onboarding: mark onboarded + kick off the first scan. */
  onComplete: () => void
}

/** Guided 2-step first-run setup, shown in the launcher while !settings.onboarded. */
export function Onboarding({ settings, setSetting, accent, onComplete }: OnboardingProps): ReactNode {
  const [step, setStep] = useState<OnboardingStep>('welcome')
  return step === 'welcome' ? (
    <WelcomeStep accent={accent} onNext={() => setStep('setup')} onSkip={onComplete} />
  ) : (
    <SetupStep
      settings={settings}
      setSetting={setSetting}
      accent={accent}
      onBack={() => setStep('welcome')}
      onScan={onComplete}
    />
  )
}
```

- [ ] **Step 5: Barrel export**

Create `src/renderer/src/launcher/views/Onboarding/index.ts`:

```ts
export { Onboarding } from './Onboarding'
```

- [ ] **Step 6: Verify & commit**

Run: `pnpm typecheck` → clean. `pnpm lint` → clean.

```bash
git add src/renderer/src/launcher/views/Onboarding
git commit -m "feat(onboarding): guided 2-step welcome + setup screens"
```

---

## Task 9: Wire Onboarding into LauncherApp

**Files:**
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`

- [ ] **Step 1: Imports + loaded flag**

In `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`, add:

```ts
import { Onboarding } from '../views/Onboarding'
```

Change the settings destructure to capture `loaded`:

```ts
  const [settings, setSetting, settingsLoaded] = useSettings()
```

- [ ] **Step 2: Render onboarding / loading before the normal tree**

Immediately inside the returned `<div ref={rootRef} className="cc-window" …>`, before the `{/* ---------- Header ---------- */}` comment, the component must branch. Wrap the existing header/body/footer in a `settingsLoaded && settings.onboarded` guard. Concretely, replace the opening of the JSX so it reads:

```tsx
  return (
    <div
      ref={rootRef}
      className="cc-window"
      style={{
        boxShadow: `inset 0 0 0 1px var(--surface-1)${
          ratio > 0.85 ? `, 0 0 60px -10px ${mixColor(status, 'rgba(0,0,0,0)', 0.45)}` : ''
        }`,
      }}
    >
      {!settingsLoaded ? null : !settings.onboarded ? (
        <Onboarding
          settings={settings}
          setSetting={setSetting}
          accent={accent}
          onComplete={() => {
            setView('scanning')
            setSetting('onboarded', true)
          }}
        />
      ) : (
        <>
          {/* existing Header + divider + Body + Toast + divider + Footer go here, unchanged */}
        </>
      )}
    </div>
  )
```

Move the existing children (the Header block through the Footer block — everything that was previously the direct children of `cc-window`) inside that new `<> … </>`. Do not change their contents in this task.

- [ ] **Step 3: Verify the onboarding→scanning handoff compiles**

`onComplete` sets `view='scanning'` then flips `onboarded` true; on the next render the `onboarded` branch renders the normal tree with `view==='scanning'`, so `ScanningView` runs `window.clean.scan()`. No extra wiring needed.

- [ ] **Step 4: Verify & commit**

Run: `pnpm typecheck` → clean. `pnpm build` → renderer builds.

```bash
git add src/renderer/src/launcher/LauncherApp/LauncherApp.tsx
git commit -m "feat(onboarding): gate launcher on onboarded + loaded, hand off to scan"
```

---

## Task 10: Honest all-clean + ping in the launcher

**Files:**
- Modify: `src/renderer/src/launcher/views/EmptyView.tsx`
- Modify: `src/renderer/src/launcher/views/ScanningView.tsx:38-63` (icon block only)
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx` (NEXT_SCAN_LABEL + EmptyView props)

- [ ] **Step 1: Rewrite EmptyView with PingBadge + honest copy**

Replace `src/renderer/src/launcher/views/EmptyView.tsx` with:

```tsx
import { Kbd } from '@renderer/components/Kbd'
import { PingBadge } from '@renderer/components/PingBadge'
import { UIIcon } from '@renderer/components/UIIcon'
import { formatSizeStr } from '@renderer/lib/format'
import type { ReactNode } from 'react'

interface EmptyViewProps {
  reclaimedTotal: number
  /** Human label for the next scheduled scan, or null when automatic scan is off. */
  nextScanLabel: string | null
  accent: string
}

/** All-clean state: no node_modules folders remain. */
export function EmptyView({ reclaimedTotal, nextScanLabel, accent }: EmptyViewProps): ReactNode {
  return (
    <div style={{ padding: '50px 30px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
      <PingBadge icon={UIIcon.checkCircle} tone="good" accent={accent} size={72} iconSize={36} />
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)' }}>All clean</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, maxWidth: 320, lineHeight: 1.5 }}>
          {reclaimedTotal > 0 ? (
            <>
              You reclaimed <span style={{ color: 'var(--good)', fontWeight: 600 }}>{formatSizeStr(reclaimedTotal)}</span> this session. Nicely done.
            </>
          ) : (
            <>
              No <code style={{ fontFamily: 'var(--mono-font)', color: 'var(--text-3)' }}>node_modules</code> folders found. Your disk is in great shape.
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4, color: 'var(--text-dim)', fontSize: 12 }}>
        {nextScanLabel ? (
          <>
            {UIIcon.refresh({ size: 13 })} Next scan in {nextScanLabel} · <Kbd wide>⌘R</Kbd> to scan now
          </>
        ) : (
          <>
            {UIIcon.refresh({ size: 13 })} Automatic scan is off · <Kbd wide>⌘R</Kbd> to scan now
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update LauncherApp's NEXT_SCAN_LABEL + EmptyView usage**

In `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`, change `NEXT_SCAN_LABEL` to drop `manual` and type it to allow a missing key:

```ts
const NEXT_SCAN_LABEL: Record<string, string> = {
  '6h': '6 hours',
  daily: '18 hours',
  weekly: '5 days',
}
```

Update the `EmptyView` usage (in the Projects-tab empty branch) to pass `accent` and a nullable label:

```tsx
            <EmptyView
              reclaimedTotal={reclaimed}
              nextScanLabel={NEXT_SCAN_LABEL[settings.scanInterval] ?? null}
              accent={accent}
            />
```

(`'manual'` is absent from the record, so the lookup is `undefined` → `?? null` → "Automatic scan is off".)

- [ ] **Step 3: Ping the scanning icon**

In `src/renderer/src/launcher/views/ScanningView.tsx`, add the import:

```ts
import { PingBadge } from '@renderer/components/PingBadge'
```

Replace the icon block (the `<div style={{ position: 'relative', width: 84, height: 84 }}>…</div>` containing the two spinner rings + search icon) with:

```tsx
      <PingBadge icon={UIIcon.search} tone="accent" accent={accent} size={84} iconSize={32} />
```

- [ ] **Step 4: Verify & commit**

Run: `pnpm typecheck` → clean. `pnpm lint` → clean.

```bash
git add src/renderer/src/launcher/views/EmptyView.tsx src/renderer/src/launcher/views/ScanningView.tsx src/renderer/src/launcher/LauncherApp/LauncherApp.tsx
git commit -m "feat(launcher): honest all-clean copy + ping on clean/scan states"
```

---

## Task 11: Panel — first-run nudge, ping, scan-off label

**Files:**
- Create: `src/renderer/src/panel/PanelApp/PanelEmpty.tsx`
- Modify: `src/renderer/src/panel/PanelApp/PanelApp.tsx`
- Modify: `src/renderer/src/panel/PanelApp/ScanPanel.tsx:36-60` (icon block only)

- [ ] **Step 1: PanelEmpty component**

Create `src/renderer/src/panel/PanelApp/PanelEmpty.tsx`:

```tsx
import { AppIcon } from '@renderer/components/AppIcon'
import { PingBadge } from '@renderer/components/PingBadge'
import { UIIcon } from '@renderer/components/UIIcon'
import { formatSizeStr } from '@renderer/lib/format'
import type { ReactNode } from 'react'

interface PanelEmptyProps {
  onboarded: boolean
  reclaimed: number
  accent: string
  onOpenSetup: () => void
}

/** Panel body when there are no projects: first-run setup nudge, or all-clean. */
export function PanelEmpty({ onboarded, reclaimed, accent, onOpenSetup }: PanelEmptyProps): ReactNode {
  if (!onboarded) {
    return (
      <div style={{ padding: '24px 20px 26px', textAlign: 'center' }}>
        <AppIcon accent={accent} size={40} />
        <div style={{ fontSize: 14.5, fontWeight: 650, color: '#fff', marginTop: 10 }}>Finish setup</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
          Set your limit &amp; run the first scan in the full window.
        </div>
        <button
          type="button"
          onClick={onOpenSetup}
          style={{
            marginTop: 13,
            background: accent,
            color: '#fff',
            border: 'none',
            borderRadius: 9,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 650,
            cursor: 'pointer',
          }}
        >
          Open setup →
        </button>
      </div>
    )
  }
  return (
    <div style={{ padding: '24px 20px 28px', textAlign: 'center' }}>
      <PingBadge icon={UIIcon.checkCircle} tone="good" accent={accent} size={46} iconSize={24} />
      <div style={{ fontSize: 14.5, fontWeight: 650, color: '#fff', marginTop: 10 }}>All clean</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
        Reclaimed {formatSizeStr(reclaimed)} this session.
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Use PanelEmpty in PanelApp**

In `src/renderer/src/panel/PanelApp/PanelApp.tsx`:

Add the import:

```ts
import { PanelEmpty } from './PanelEmpty'
```

Capture `loaded` from settings (the panel also flashes otherwise) — but the panel's empty block only shows inside `view === 'main'`; gate on loaded to avoid a first-run flash. Change the destructure:

```ts
  const [settings, setSetting, settingsLoaded] = useSettings()
```

Replace the inline empty block (the `projects.length === 0 ? ( <div …>All clean…</div> ) : ( … )` ternary) so the empty branch uses `PanelEmpty`, and suppress it until settings load:

```tsx
          {projects.length === 0 ? (
            settingsLoaded ? (
              <PanelEmpty
                onboarded={settings.onboarded}
                reclaimed={reclaimed}
                accent={accent}
                onOpenSetup={() => void window.clean.openLauncher()}
              />
            ) : null
          ) : (
```

(The rest of the truthy branch — the reclaimable list — is unchanged.)

- [ ] **Step 3: Ping the panel scanning icon**

In `src/renderer/src/panel/PanelApp/ScanPanel.tsx`, add the import:

```ts
import { PingBadge } from '@renderer/components/PingBadge'
```

Replace the icon block (the `<div style={{ position: 'relative', width: 56, height: 56 }}>…</div>`) with:

```tsx
      <PingBadge icon={UIIcon.search} tone="accent" accent={accent} size={56} iconSize={24} />
```

- [ ] **Step 4: Verify & commit**

Run: `pnpm typecheck` → clean. `pnpm lint` → clean.

```bash
git add src/renderer/src/panel/PanelApp/PanelEmpty.tsx src/renderer/src/panel/PanelApp/PanelApp.tsx src/renderer/src/panel/PanelApp/ScanPanel.tsx
git commit -m "feat(panel): first-run setup nudge + ping on clean/scan states"
```

---

## Task 12: First-launch behaviour in the main process

**Files:**
- Modify: `src/main/index.ts:69-73`

- [ ] **Step 1: Gate auto-scan/auto-open on onboarded**

In `src/main/index.ts`, replace these lines:

```ts
  // first launch: populate inventory right away
  if (projects.all.length === 0) void runScan()

  // dev convenience: show the launcher without needing the tray
  if (is.dev) launcher.open()
```

with:

```ts
  // First launch: show onboarding front-and-center; it triggers the first scan.
  // Returning users: refresh inventory if empty, and keep the dev convenience.
  if (!settings.get().onboarded) {
    launcher.open()
  } else {
    if (projects.all.length === 0) void runScan()
    if (is.dev) launcher.open()
  }
```

- [ ] **Step 2: Verify & commit**

Run: `pnpm typecheck` → clean. `pnpm build` → main builds.

```bash
git add src/main/index.ts
git commit -m "feat(main): first launch opens onboarding instead of auto-scanning"
```

---

## Task 13: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Static checks**

Run each and confirm:
- `pnpm typecheck` → no output
- `pnpm lint` → "No fixes applied" (the single biome.json deprecation "info" is pre-existing and OK)
- `pnpm test` → all suites green (validate-setting + PixelStepper additions included)
- `pnpm build` → main + preload + renderer all built

- [ ] **Step 2: In-app pass (`pnpm dev`)**

Manually confirm (this is the user's checklist — these states can't be unit-tested here):
- First run (delete the persisted settings file or set `onboarded:false`): launcher auto-opens onboarding → step 1 reassurance → step 2 stepper + cadence incl. **Off** → **Scan my disk** → scanning (accent ping) → list.
- **Skip** on step 1 also scans and never shows onboarding again.
- Threshold stepper: click / drag / ←→ all change the value; both settings panels updated; panel had no slider regressions.
- Setting cadence to **Off** stops auto-scans; the launcher all-clean footer reads "Automatic scan is off".
- All-clean shows the green **ping**; "reclaimed X this session" only after deleting; "great shape" copy when nothing found.
- Panel shows **Finish setup** before onboarding completes (open the panel first), and the green-ping all-clean after.

- [ ] **Step 3: Update STATUS.html**

Move the relevant roadmap items to `done` (launch-at-login stays planned), add `userActions` test item for the onboarding pass, and append a `log` entry dated today. Commit:

```bash
git add STATUS.html
git commit -m "docs: STATUS — onboarding, pixel stepper, scan-Off, honest empty states"
```

---

## Self-review notes (author)

- **Spec coverage:** onboarding 2-step (Tasks 8–9, 12), pixel stepper (Tasks 3–4, 6–7), scan-Off (Tasks 6–7 labels + existing scheduler), honest empty states incl. ping (Tasks 5, 10–11), `onboarded` model + first-launch (Tasks 1, 9, 12), `loaded` anti-flash (Task 2). All spec sections map to a task.
- **Type consistency:** `useSettings` returns `[Settings, SetSetting, boolean]` (Task 2) and is destructured with the third element in Tasks 9 & 11. `PixelStepper` props (`valueGB/accent/onChange`) and `PingBadge` props (`icon/tone/accent/size/iconSize`) are used consistently. `EmptyView` gains `accent` + nullable `nextScanLabel`, updated at its only call site (Task 10).
- **No migration:** `scanInterval` keeps the `'manual'` value (relabelled "Off"); `validate-setting` already allows it.
