# Clean my node_modules

A macOS menu bar app that finds every `node_modules` folder on your disk, shows how much
space they take against a configurable limit, and lets you reclaim the stale ones —
implemented from the Claude Design handoff in `clean-my-node-modules/`.

## Features

- **Menu bar dropdown** — total `node_modules` size, pixel-cell meter against your GB limit,
  the four oldest projects with one-click delete, and a "Clean N stale folders" action
  (stale = untouched for 100+ days).
- **Full launcher window** (⌘O from the dropdown) — Spotlight-style search across project
  names and paths, sort by last-used / size / name, keyboard navigation (↑↓, ↵ open,
  ⌘⌫ delete with confirm, ⌘R rescan, ⌘, settings, esc).
- **Real scanning** — walks your home directory (skipping dot-folders, `Library`, etc.),
  sizes each `node_modules` via `du`, detects the framework from `package.json`, and infers
  last-used time from project file mtimes. Results are cached for instant relaunch.
- **Safe deletion** — folders are moved to the Trash, never `rm -rf`'d.
- **Background scans** — every 6h / daily / weekly (or manual), with a native notification
  when you cross your threshold.
- Reveal in Finder and open-in-editor row actions.

## Stack

Electron 33 + React 18 + TypeScript, built with electron-vite. Settings and the scan cache
are plain JSON files in the app's `userData` directory. The tray icon is rasterized at
runtime from the design's cube glyph (no image assets, no canvas dependency).

## Development

```sh
pnpm install
pnpm dev        # runs the app; the launcher window opens automatically in dev
pnpm test       # vitest unit tests (formatting, color math)
pnpm typecheck
pnpm build      # production bundles in out/
pnpm package    # unsigned .app bundle via electron-builder
```

## Layout

- `src/main/` — Electron main process: `scanner/`, `projects/`, `settings/`, `tray/`,
  `windows/`, `scheduler/`, `notifications/`, `ipc/`
- `src/preload/` — the `window.clean` context-bridge API
- `src/renderer/src/` — `panel/` (menu bar dropdown), `launcher/` (full window),
  `components/` (one folder per component), `hooks/`, `lib/`
- `src/shared/` — types and constants shared across processes
- `clean-my-node-modules/` — the original design handoff bundle (reference only)
