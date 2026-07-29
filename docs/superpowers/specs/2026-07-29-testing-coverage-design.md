# Testing coverage: long-term enterprise-grade strategy (app, non-UI)

Date: 2026-07-29
Status: approved design, pending implementation plan

## Context

The Electron app has a strong pure-logic unit layer (55 vitest files across
`src/main` and renderer lib code) and a disciplined CI pipeline (biome,
typecheck, tests, build, unsigned macOS packaging). What it lacks is everything
that keeps quality from silently regressing over years:

- No coverage measurement of any kind (`@vitest/coverage-v8` not installed).
- Renderer logic untested: 11 hooks (`useProjects`, `useLicense`, `useUpdater`,
  ...) and `lib/staleness` have no tests.
- ~22 side-effectful main-process files untested, including the highest-risk
  code in the app: `actions/project-actions.ts` (deletes user folders),
  `scanner/scanner.ts`, `scheduler/scan-scheduler.ts`,
  `notifications/threshold-notifier.ts`, window management, tray.
- Nothing ever launches the real app: IPC wiring, the `window.clean` preload
  bridge, and window boot are proven only by "it compiles and packages".

## Scope

- **In scope:** Electron app (`src/main`, `src/preload`, renderer *logic*),
  coverage tooling and CI enforcement, one Playwright Electron smoke suite.
- **Out of scope:** React component/view tests (Storybook is being added in
  parallel and owns the UI layer), the site, release/packaging scripts, the
  Remotion video pipeline.

## Approach

Risk-tiered testing plus a coverage ratchet: test effort proportional to blast
radius (deletion code > scanner > glue), and CI enforces that coverage is
monotonically non-decreasing. Rejected alternatives: big-bang backfill to a
fixed 80% bar (weeks of low-value work), and E2E-heavy user journeys (brittle
and slow for a tray app).

## Phase 1 — Coverage foundation

- Upgrade root `vitest` to the current major (site is already on v4) to get
  `test.projects`; add `@vitest/coverage-v8`.
- Coverage config in `vitest.config.ts`:
  - Provider v8. Scope: `src/**/*.ts` only. Excluded: `**/*.tsx` (Storybook's
    domain), `**/*.types.ts`, `**/*.d.ts`, `**/index.ts` barrel files,
    `src/main/index.ts` (app bootstrap, covered by the E2E smoke instead).
  - `thresholds` (lines/functions/branches/statements) initialised to the
    measured baseline at implementation time, with `thresholds.autoUpdate:
    true` — vitest's built-in ratchet. Local coverage runs bump the numbers in
    the config; the bumps are committed; CI fails any PR that drops below.
- New script `test:coverage` (`vitest run --coverage`); CI's unit-test step
  switches to it and uploads the coverage summary as a PR artifact/summary.

## Phase 2 — Renderer logic (hooks + lib)

- Split vitest into two projects: `node` (`src/main`, `src/shared`,
  `src/preload`) and `jsdom` (`src/renderer/**`). Add `jsdom` and
  `@testing-library/react` (for `renderHook`) as devDependencies. No
  `user-event`, no component rendering — logic only.
- **Typed bridge mock:** one shared test harness, `src/renderer/src/test/
  mock-clean-bridge.ts`, that implements the `window.clean` surface from
  `src/preload/api.types.ts` with vitest mocks. Because it is typed against
  the real bridge type, any preload API change breaks the mock at typecheck
  time — sync is enforced by the compiler, not discipline.
- Test all 11 hooks (subscription lifecycle, unsubscribe on unmount, state
  transitions, the `alive` guard patterns) and `lib/staleness`.

## Phase 3 — Untested main-process code

By risk tier:

1. `actions/project-actions.ts` — tested against real temp directories with
   explicit safety cases: deletion never escapes the target path, refuses
   suspicious inputs, reports accurate freed bytes.
2. `scanner/scanner.ts`, `scheduler/scan-scheduler.ts`,
   `notifications/threshold-notifier.ts` — fixture-driven tests; fake timers
   for the scheduler.
3. `windows/window-utils.ts`, `lib/abbreviate-home.ts`, remaining pure logic
   currently untested.
4. Electron-glue files (`tray.ts`, `launcher-window.ts`, `panel-window.ts`,
   `card-window.ts`): extract decision logic into testable functions where it
   exists; do not mock Electron to death for pure wiring. A minimal
   `electron` alias shim in the vitest node project supports files that
   import it incidentally.

## Phase 4 — E2E smoke (Playwright Electron)

- `@playwright/test` with the `_electron` driver, suite under `e2e/`,
  separate from vitest. Runs the built app (`out/main/index.js`).
- Smoke scope only: app boots without errors; tray and windows are created;
  `window.clean` bridge is exposed with the expected methods; launcher window
  loads; a scan of a fixture directory completes and reports projects.
  New IPC surface added later must be added to the bridge-shape assertion.
- **Safety sandbox (hard rule):** the app deletes files, so the suite must be
  physically unable to touch real data. A test hook in `src/main/index.ts`:
  when `TIDYDISK_E2E_HOME` is set, call `app.setPath('userData', ...)` into a
  temp dir and seed settings so scan roots point only into the fixture tree.
  The E2E launcher creates the fixture in a temp dir per run.
- CI: the existing `package-macos` job gains a smoke step after packaging
  (build once, smoke against it). Kept on macOS since that is the shipped
  platform.

## Long-term policy (added to CLAUDE.md)

- New logic ships with tests in the same PR; the coverage ratchet enforces the
  floor automatically.
- New IPC handlers/bridge methods must be added to the E2E bridge-shape
  assertion (the typed mock already breaks at compile time).
- UI components are Storybook's responsibility; do not add component render
  tests here.

## Risks

- `thresholds.autoUpdate` only bumps when someone runs coverage locally; CI
  enforces the floor either way, so the ratchet can lag but never regress.
- Playwright + Electron on macOS runners can be flaky at boot; mitigate with
  generous launch timeout and a single retry, and keep the suite tiny.
- Extracting logic from Electron-glue files (Phase 3.4) touches shipped code;
  keep extractions mechanical and covered by the new tests.
