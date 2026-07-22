# Auto-update via electron-updater + GitHub Releases — Design

**Date:** 2026-07-22
**Status:** Approved

## Goal

TidyDisk users update in place instead of downloading a DMG and reinstalling. The flow
is deliberately user-driven: the app checks silently, the user clicks to download and
clicks again to restart and install.

## Context (verified)

- Builds are signed + notarized (`hardenedRuntime`, `notarize: true`) — a hard
  requirement for macOS auto-update.
- `package.json` already has `publish: { provider: "github", releaseType: "draft" }`,
  and published releases (e.g. v1.1.0) already contain `latest-mac.yml`, the ZIP, and
  blockmaps — everything electron-updater consumes. Repo is public.
- The release process does not change: `pnpm release` + upload + publish the draft.
  Publishing the GitHub release remains the "go live" switch.
- Users on versions before this feature ships still need one manual reinstall.

## Approach

`electron-updater` with `autoDownload = false`, wrapped in a single main-process
service exposing a state machine over IPC. Rejected alternatives: built-in
`autoUpdater` + update.electronjs.org (no release notes/size before download, poor
manual-flow support); hand-rolled GitHub API + DMG download (reinvents checksum and
atomic install; recreates the reinstall UX).

## 1. Main process: `UpdaterService`

New folder `src/main/updater/`:

- `updater-service.ts` wraps electron-updater with `autoDownload = false`,
  `autoInstallOnAppQuit = true` (a download click expresses intent; quitting after
  download applies the update even without the install click).
- State machine, every transition broadcast over IPC:

  ```ts
  type UpdaterState =
    | { phase: 'idle'; currentVersion: string }
    | { phase: 'checking' }
    | { phase: 'available'; info: UpdateSummary }      // version, date, sizeBytes, notes
    | { phase: 'downloading'; info: UpdateSummary; percent: number }
    | { phase: 'downloaded'; info: UpdateSummary }
    | { phase: 'error'; message: string; kind: 'network' | 'translocation' | 'unknown' }
  ```

- Public methods: `check()`, `download()`, `quitAndInstall()`, `getState()`.
- Auto-check: a few seconds after app ready (never delays startup), then every
  6 hours (same pattern as license revalidation). Disabled in dev / unpackaged builds.
- `UpdateSummary.notes` = GitHub release body; empty body → no changelog shown.

## 2. IPC + shared types + settings

- Invokable channels: `updaterCheck`, `updaterDownload`, `updaterInstall`.
- Broadcast: `onUpdaterState`.
- `UpdaterState`/`UpdateSummary` types in `src/shared/`.
- New persisted setting `dismissedUpdateVersion: string | null` in `SettingsStore`.
  Banner shows iff `available.version !== dismissedUpdateVersion`; a newer version
  naturally re-shows the banner.

## 3. Panel banner (tray dropdown only)

New component folder `src/renderer/src/components/UpdateBanner/`:

- Renders when phase is `available` / `downloading` / `downloaded` and not dismissed.
- Compact single row: "TidyDisk v1.2.0 available · 4.2 MB · Jul 20" + ✕.
- ✕ only in the `available` phase; `downloading` shows percent, `downloaded` shows
  "Ready to install".
- Clicking the body opens the Launcher on the Settings view, deep-linked/scrolled to
  the Updates section.
- No banner in the Launcher window.

## 4. Settings "Updates" section

New component folder `UpdateSettings/` (pattern: `ScanLocationsSettings`), new section
in `SettingsView`:

- Always: current version, "Check for updates" button, last-checked time.
- When update available: version, release date, download size, rendered release notes
  (markdown, restrained styling), and one action button that morphs:
  **Download update → progress → Restart and install**.
- Errors inline: network → "Try again"; translocation → "Move TidyDisk to
  Applications to enable updates".

## 5. Analytics, tests, release

- PostHog: `update_available`, `update_download_clicked`, `update_installed` (fired on
  next launch via persisted last-seen-version comparison), all with version props.
- Tests: vitest unit tests for state-machine transitions and banner-dismissal logic.
  Real download/install can't run in CI (needs signed app) → manual test checklist in
  the PR.
- Branch `feat/auto-update`, PR into `main`.
