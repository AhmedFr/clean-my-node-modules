# Onboarding, pixel stepper, scan-Off & honest empty states — design

**Date:** 2026-06-17
**Status:** Approved (pending spec review)
**Branch:** `feat/onboarding-empty-states`

## Goal

Give the app a best-in-class **first-arrival experience** and **honest empty/transient
states** across both surfaces (the full launcher window and the menu-bar panel), and
fold in two related controls the user asked for:

1. A **guided onboarding** flow on first launch.
2. A **pixel stepper** that replaces the raw `<input type="range">` alert-threshold slider.
3. The ability to turn **automatic scanning fully off** (surfaced consistently).
4. Distinct, truthful **empty/transient states** — never show "All clean" before a scan.

All four ship together as one PR (user chose "onboarding first, one big push").

## Decisions (from the brainstorm)

- **Onboarding shape:** guided **2-step** setup in the full window (not a minimal inline
  state, not a long wizard).
- **First launch:** auto-open the full window with onboarding front-and-center. If the
  panel is opened before onboarding completes, it shows a compact **"Finish setup"** nudge.
- **Pixel stepper:** **10 blocks, 1 GB steps, range 1–10 GB, flat accent fill**, the
  selected block glows brighter; interaction = click a block / drag / ←→ to nudge; live
  "X GB" label. Reused in onboarding **and** both settings surfaces.
- **Scan cadence with Off:** segmented `6h / Daily / Weekly / Off`. The existing
  `scanInterval: 'manual'` value already disables the scheduler — we keep that internal
  value and **relabel it "Off"** everywhere (no data migration), and **add it to the panel**
  (today the panel offers only 6h/Daily/Weekly).
- **Ping:** a **subtle** Tailwind-style ping ring (≈2.2s, scale ~1.8×, softer opacity)
  behind the state icon for **both** All-clean (green ring) and Scanning (accent ring).
  Optionally also ping the tray glyph while scanning.

## Flow

```
First launch (settings.onboarded === false)
  → main process auto-opens the launcher in onboarding mode
      Step 1 · Welcome  — value prop + 2 reassurance points; [Get started →] / [Skip – use defaults]
      Step 2 · Preferences — PixelStepper (alert limit) + cadence segmented (6h/Daily/Weekly/Off); [Scan my disk →] / [‹ back]
  → kicks off the first scan → Scanning state (live count + bar)
  → lands in the project list  (or All-clean if nothing was found)
  → settings.onboarded set true (also set true on Skip)
```

- **Skip** (step 1) sets `onboarded = true` and runs a scan with default settings.
- After onboarding, the flow never shows again.
- If the panel is opened while `onboarded === false`, it shows the **Finish setup** nudge
  whose button calls `openLauncher()`.

## States (post-onboarding)

**Launcher (full window)**
- **Scanning** — cube icon with subtle accent ping; "Scanning your disk…", "Walking ~/ —
  N folders · X so far", progress bar. (Driven by scan-progress events.)
- **All clean — fresh** — green check + subtle green ping; "All clean", "No
  `node_modules` folders found. Your disk is in great shape."; footer "↻ Next scan in
  {label} · ⌘R to scan now".
- **All clean — after cleaning** — same, body "You reclaimed {X} this session. Nicely done."
- **No search match** — unchanged ("No folders match "…"").

**Panel (menu-bar, 334px)**
- **Finish setup** — cube + "Finish setup", "Set your limit & run the first scan in the
  full window.", [Open setup →]. Only while `onboarded === false`.
- **Scanning** — compact, subtle ping, "Scanning…", "N folders · X so far", bar.
- **All clean** — compact green check + subtle ping, "All clean", "Reclaimed {X} this session."

The key correctness fix: the misleading pre-scan "All clean" is removed — empty states
render only when `onboarded === true` **and** a scan has actually completed; otherwise the
onboarding / scanning states show.

## Architecture & components

New components (one folder per component: `index.ts`, `Component.tsx`, `*.types.ts`,
optional `*.constants.ts` + test):

- **`components/PixelStepper/`** — the reusable stepper. Props: `valueGB`, `min` (1),
  `max` (10), `step` (1), `accent`, `onChange(gb)`. Renders 10 blocks (same rectangle
  rhythm as `PixelMeter`: height ~18, gap 2, radius 2.5); selected block brighter +
  soft glow. Click/drag sets value, `←/→` nudges, live label. Pure helpers
  `gbToIndex` / `indexToGb` / `clampGb` live in `PixelStepper.constants.ts` and are
  unit-tested.
- **`components/PingBadge/`** — an icon wrapped in a Tailwind-style ping ring. Props:
  `icon`, `tone` ('good' | 'accent' | 'neutral'), `accent`, `size`. Renders the core
  icon tile + an absolutely-positioned ring using a shared `ping` keyframe. Used by the
  all-clean and scanning states in both windows.
- **`launcher/views/Onboarding/`** — the guided flow. `Onboarding.tsx` owns the step
  state machine (`'welcome' | 'setup'`) and the "scan / skip" handoff; `WelcomeStep.tsx`
  and `SetupStep.tsx` are the two screens (layout only); `Onboarding.types.ts`. Renders
  inside the launcher above the normal views.

Changed:

- **`shared/settings.types.ts`** — add `onboarded: boolean` to `Settings`.
- **`shared/settings.constants.ts`** — `DEFAULT_SETTINGS.onboarded = false`.
- **`main/settings/validate-setting.ts`** — accept/coerce `onboarded` (boolean).
- **`main/index.ts`** — first-launch logic: if `!settings.onboarded`, auto-open the
  launcher (onboarding) and do **not** auto-run the scan (onboarding triggers it). Keep
  the dev convenience open. The existing "empty inventory → runScan" is gated on
  `onboarded`.
- **`launcher/LauncherApp`** — render `Onboarding` when `!settings.onboarded`; otherwise
  the existing list/caches/settings/scanning views. Refine the all-clean `EmptyView`
  (fresh vs reclaimed copy + `PingBadge`); make the scanning state use `PingBadge`.
- **`launcher/views/SettingsView.tsx`** — replace the range input with `PixelStepper`;
  cadence segmented gains **Off** (relabel `manual`).
- **`panel/PanelApp`** — add the **Finish setup** nudge (while not onboarded); refine the
  all-clean block and scanning (`ScanPanel`) with `PingBadge`; extract the inline
  empty/first-run block into a small `PanelEmpty` component for clarity.
- **`panel/PanelApp/PanelSettings.tsx`** — replace the range input with `PixelStepper`;
  cadence segmented gains **Off**.
- **`launcher/LauncherApp.tsx` `NEXT_SCAN_LABEL`** and panel `nextScanLabel` — map the
  off state to a clear label (e.g. "off"/"—").
- **`styles/global.css`** — add the `ping` / `ping-soft` keyframes.

Reused unchanged: `Segmented`, `useScanProgress` (to know a scan is active for the
scanning state), `useSettings`, `usePnpmStore`, `PixelMeter`, the toast infra.

## Data flow / first-run detection

- `onboarded` is the single source of truth for "show onboarding." It is persisted in
  settings (plain JSON in userData) and read by both windows via `useSettings`.
- "A scan has completed" is derived from `getLastScanTime()` / scan-progress state, used
  only to choose **Scanning** vs **All clean** once onboarded.
- `scanInterval: 'manual'` remains the off value; the scheduler already early-returns for
  it, so "Off" needs no main-process change beyond labels.

## Testing

- **`PixelStepper.constants.test.ts`** — `gbToIndex`/`indexToGb`/`clampGb` round-trip,
  clamping at 1 and 10, nudge stepping.
- **`validate-setting`** — extend to cover the new `onboarded` boolean coercion.
- Onboarding flow, ping motion, empty-state copy, and the settings swaps are verified in
  the running app (`pnpm dev`).

## Out of scope

- Configurable scan roots (still the home dir).
- Implementing npm/yarn/bun caches (issue #2 M2).
- Sub-GB threshold precision (stepper is whole-GB by decision; existing fractional values
  round to the nearest block on display and snap to whole-GB on change).
- Folding the pnpm store size into the GB gauge.
