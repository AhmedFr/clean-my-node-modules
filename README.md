# Clean my node_modules

A macOS menu bar app that finds every `node_modules` folder on your disk, shows how much
space they take against a configurable limit, and lets you reclaim the stale ones, plus a
computer-wide view of the packages and caches those dependencies leave behind. Implemented
from the Claude Design handoff in `clean-my-node-modules/`.

Free and open source. No account, no telemetry: every measurement stays on your machine.

## Install

Download the latest signed & notarized build from the
[**Releases**](https://github.com/AhmedFr/clean-my-node-modules/releases/latest) page
(`clean-my-node-modules-arm64.dmg`, Apple Silicon), open the DMG, and drag the app to
`/Applications`. It lives in the menu bar; there is no dock icon.

Prefer to build it yourself? See [Development](#development).

## Features

- **Menu bar dropdown**: total `node_modules` size, pixel-cell meter against your GB limit,
  the four oldest projects with one-click delete, and a "Clean N stale folders" action
  (stale = untouched for 100+ days).
- **Full launcher window** (⌘O from the dropdown) with three tabs (⌘1/⌘2/⌘3):
  - **Projects**: Spotlight-style search across project names and paths, sort by
    last-used / size / name, keyboard navigation (↑↓, ↵ open, ⌘⌫ delete with confirm,
    ⌘R rescan, ⌘, settings, esc).
  - **Caches**: the global **pnpm store** size with a safe one-click **Prune** (never
    deletes the store itself), plus npm/yarn/bun placeholders. Robust store detection with
    manual store/binary overrides when pnpm lives somewhere unusual.
  - **Packages**: a computer-wide inventory of every package your projects directly depend
    on: how many projects use it, its size, the version(s) in use (a **unify** badge flags
    divergence), the latest version on npm, and a **security-advisory** pill. Expand a row
    for per-version severity and which projects are on each version. ↵ opens the package on
    npm.
- **Real scanning**: walks your home directory (skipping dot-folders, `Library`, etc.),
  sizes each `node_modules` via `du`, detects the framework from `package.json`, and infers
  last-used time from project file mtimes. Results are cached for instant relaunch.
- **Honest, real vs linked sizing**: on pnpm setups, each folder reports the **real**
  freeable bytes (its own content) separately from bytes **linked** into the shared pnpm
  store, so the numbers reflect what deleting actually frees.
- **Safe deletion**: folders are moved to the Trash, never `rm -rf`'d.
- **Background scans**: every 6h / daily / weekly (or manual), with a native notification
  when you cross your threshold.
- **Reveal in Finder** and **open-in-editor** row actions.
- **In-app Uninstall**: a one-click uninstall in Settings moves the app to the Trash and
  removes its settings + cache, then quits.

Registry lookups (latest version, advisories) power the Packages tab, are cached for 24h,
and can be turned off in Settings; all local sizing still works fully offline.

## Stack

Electron 33 + React 18 + TypeScript, built with electron-vite. Settings and the scan cache
are plain JSON files in the app's `userData` directory. The tray icon is rasterized at
runtime from the design's cube glyph (no image assets, no canvas dependency). The signed,
notarized macOS build ships via a tag-triggered GitHub Actions release pipeline.

## Development

```sh
pnpm install
pnpm dev        # runs the app; the launcher window opens automatically in dev
pnpm test       # vitest unit tests (scanner, stores, packages, formatting, color math)
pnpm typecheck
pnpm build      # production bundles in out/
pnpm package    # unsigned .app bundle via electron-builder
```

Cutting a release: `pnpm version minor && git push --follow-tags`. Pushing the `vX.Y.Z`
tag triggers `.github/workflows/release.yml`, which builds, signs, notarizes, and uploads
the DMG/ZIP to a GitHub release. Signing secrets are documented in `docs/SIGNING.md`.

## Layout

- `src/main/`: Electron main process, with `scanner/`, `projects/`, `packages/`,
  `pnpm-store/`, `settings/`, `tray/`, `windows/`, `scheduler/`, `notifications/`,
  `actions/`, `ipc/`, `lib/`
- `src/preload/`: the `window.clean` context-bridge API
- `src/renderer/src/`: `panel/` (menu bar dropdown), `launcher/` (full window with the
  Projects / Caches / Packages tabs), `components/` (one folder per component), `hooks/`, `lib/`
- `src/shared/`: types and constants shared across processes
- `site/`: the Next.js + Tailwind landing page (deploys to Vercel)
- `clean-my-node-modules/`: the original design handoff bundle (reference only)
