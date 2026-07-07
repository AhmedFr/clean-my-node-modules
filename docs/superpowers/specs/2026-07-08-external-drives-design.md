# External drives / scan locations — design

**Date:** 2026-07-08
**Status:** Approved design, pre-implementation
**Feature:** Let users include external drives (and arbitrary folders) in the node_modules scan.

## Problem

The scanner only ever walks `homedir()`. Projects living on an external SSD, a
second internal volume, or any non-home folder are invisible to TidyDisk. Users
with node_modules on external drives get no coverage and no way to reclaim that
space.

## Goal

Let the user opt specific extra locations into the scan:

- Auto-detected external volumes (mounted under `/Volumes`) shown as toggles.
- An "Add folder…" escape hatch for any arbitrary absolute path (a second
  internal partition, a specific directory, etc.).
- Home (`~`) stays always-on and is never removable.

## Non-goals

- No per-drive scan scheduling or per-root intervals.
- No greyed-out "drive disconnected" UI. An unplugged drive's projects simply
  drop out of the list on the next scan and reappear after re-plugging (the
  scanner already replaces the whole project set each run).
- No forcing a sleeping/unmounted drive to mount. We only scan what is currently
  mounted.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| What can be added | Auto-detected volumes **and** arbitrary folders |
| Unplug behavior | Projects just disappear on next scan; reappear on re-plug |
| Scan timing | Scan an external root whenever it is currently mounted, in **both** scheduled and manual scans; skip silently if not mounted |

## Data model

Add one field to `Settings` (`src/shared/settings.types.ts`):

```ts
/** Extra scan roots opted in by the user (absolute paths): toggled external
 *  volumes and arbitrary "Add folder…" paths. Home is implicit, never stored. */
scanRoots: string[]
```

Default `[]` in `src/shared/settings.constants.ts`.

Both a toggled `/Volumes/SSD-T7` and an added `/data/projects` are stored the
same way — as absolute path strings in `scanRoots`. There is no separate
"volumes" vs "folders" storage; the UI derives which is which by checking
whether a path currently appears in the detected-volumes list.

### Validation

Add a `scanRoots` case to `coerceSetting` (`src/main/settings/validate-setting.ts`):
accept only an array whose every element is a non-empty absolute string
(`path.isAbsolute`). Reject anything else (returns `null`, leaving settings
unchanged), consistent with the existing "never trust the renderer" comment in
`register-ipc.ts`.

## Roots resolution

Today `Scanner` is constructed as `new Scanner()` in `src/main/index.ts:30`,
defaulting `roots` to `[homedir()]`. Change:

1. `Scanner` no longer hardcodes roots. `runScan` (`src/main/index.ts:44`)
   computes the roots for each scan and passes them in. Adjust
   `Scanner.scan(roots, onProgress)` (or a `setRoots` before scan) so roots are
   evaluated fresh every run rather than once at construction.

2. A new pure helper `resolveScanRoots(scanRoots, { exists })`:
   - Start from `[homedir(), ...scanRoots]`.
   - **Filter to paths that currently exist** (injected `exists` predicate,
     defaulting to `fs.existsSync`). An unmounted `/Volumes/X` does not exist →
     silently skipped. This is the entirety of the "only mounted, skip
     otherwise" behavior.
   - **Dedupe** identical paths.
   - **Drop any root nested inside another** kept root (e.g. if the user adds a
     subfolder of home, or one drive path under another) to avoid double-walking
     and double-counting sizes.
   - Return the cleaned list.

Because `runScan` recomputes roots every scan, this identical logic covers both
scheduled and manual scans — mounted drives stay current, unmounted ones fall
out. No branching on scan type is needed.

## External-volume detection (for the toggle list)

New main-side `listExternalVolumes()`:

- Enumerate entries under `/Volumes`.
- Exclude symlinks and the boot disk. Detect the boot disk by comparing device
  ids: an entry is a separate physical volume when
  `stat(mountPoint).dev !== stat('/').dev`.
- Return `{ path, name }[]` for real external volumes currently mounted.

New IPC `listVolumes` returns each detected volume plus an `included` flag
derived from `settings.scanRoots`:
`{ path: string; name: string; included: boolean }[]`.

"Add folder…" reuses the existing `pickPath` IPC (`register-ipc.ts:121`,
`mode: 'folder'`).

## UI

New component folder `src/renderer/src/components/ScanLocationsSettings/`
(`index.ts`, `ScanLocationsSettings.tsx`, `ScanLocationsSettings.types.ts`),
rendered inside `SettingsView.tsx`. Contents:

```
Scan locations
──────────────────────────
☑ Home (~)              always   (disabled checkbox)
☐ /Volumes/SSD-T7                (detected volume toggle)
☐ /Volumes/Backup
  /data/projects           ✕     (added folder, removable)

[ + Add folder… ]
```

- Home row: disabled, always checked.
- Detected volumes: toggling ON adds the path to `scanRoots`; OFF removes it.
- Added folders (paths in `scanRoots` not present in the detected-volumes list):
  listed with a remove ✕ that drops them from `scanRoots`.
- "Add folder…": calls `pickPath('folder')`; on a returned absolute path, append
  to `scanRoots` (dedupe).
- All mutations go through `setSetting('scanRoots', next)`.

## Delete safety guard

Between scans a drive can be unmounted, leaving a stale project row whose
`node_modules` no longer exists. In the `deleteNodeModules` IPC handler
(`register-ipc.ts:75`), before trashing, verify the `node_modules` path exists.
If not, refuse cleanly and drop the project from the store.

To report the refusal, change the handler's return from a bare `number` to:

```ts
{ freed: number; blocked?: 'unmounted' }
```

The renderer treats `blocked: 'unmounted'` as "couldn't delete — drive not
connected" (brief inline message) rather than a silent no-op. (The live-indicator
feature extends this same shape with `blocked: 'live'`; whichever ships first
introduces the shape.)

## Testing

- `resolveScanRoots`: dedupe, nested-root drop, unmounted-filter (via injected
  `exists`), home always present.
- `listExternalVolumes`: boot-disk exclusion and symlink filtering, with mocked
  `fs.stat`/readdir.
- `coerceSetting('scanRoots', …)`: accepts array of absolute paths; rejects
  non-arrays, non-strings, relative paths.

## Files touched

- `src/shared/settings.types.ts` — add `scanRoots`.
- `src/shared/settings.constants.ts` — default `[]`.
- `src/main/settings/validate-setting.ts` — `scanRoots` case (+ test).
- `src/main/scanner/scanner.ts` — roots passed per-scan.
- `src/main/scanner/resolve-scan-roots.ts` — new pure helper (+ test).
- `src/main/volumes/list-external-volumes.ts` — new (+ test).
- `src/main/index.ts` — `runScan` builds roots via `resolveScanRoots`.
- `src/main/ipc/register-ipc.ts` — `listVolumes` IPC; delete unmount guard +
  return-shape change.
- `src/shared/ipc.constants.ts`, `src/preload/index.ts` — wire `listVolumes`.
- `src/renderer/src/components/ScanLocationsSettings/**` — new component.
- `src/renderer/src/launcher/views/SettingsView.tsx` — render it.
- Renderer delete callers — handle `{ freed, blocked }` result.
