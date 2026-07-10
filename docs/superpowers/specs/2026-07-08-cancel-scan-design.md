# Cancel an in-progress scan — design

**Date:** 2026-07-08
**Status:** Approved design, pre-implementation
**Feature:** Let the user cancel a running disk scan; cancelling reverts cleanly to the pre-scan state.

## Problem

A scan can take a while (the `du` sizing phase over large `node_modules` trees),
and it may have been started by a mis-click. Today there is no way to stop it:
the user must wait for it to finish. There should be a Cancel control, and
cancelling should leave no partial results behind.

## Goal

- A **Cancel** control on both scanning surfaces (full-window `ScanningView` and
  menu-bar `ScanPanel`), plus **ESC** to cancel while scanning.
- Cancel is **near-instant** even mid-size of a huge folder (kills the in-flight
  `du` subprocesses).
- Cancelling **reverts cleanly**: no partial results are shown, and the app
  returns to its pre-scan state and view.

## Non-goals

- No pause/resume. Cancel fully aborts; the user can re-scan later.
- No progress-preserving partial scan. A cancelled scan discards its results.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Cancel surfaces | **Both** the full-window `ScanningView` and the panel `ScanPanel` |
| Cancel speed | **Instant** — pass an `AbortSignal` to the `du` subprocesses so cancel SIGTERMs the ~4 in-flight ones |
| Trigger | A Cancel button on both surfaces, **plus ESC** while scanning |

## Abort mechanism (`Scanner`)

`Scanner` (`src/main/scanner/scanner.ts`) gains an `AbortController` created per
run and a `cancel()` method:

- `scan(roots, onProgress)` creates a fresh `AbortController` for the run; its
  `signal` is threaded through `run()`.
- `cancel()` aborts the current run's controller (no-op if idle).
- `run()` checks `signal.aborted` at the natural boundaries:
  - inside `walk()` — before descending into subdirectories (stop the walk);
  - in the sizing `mapLimit` callback — before sizing each found `node_modules`.
- The signal threads down `buildProject(nm, cache, signal) → measureNodeModules(nmPath, signal) → folderSize(path, signal) → execFileAsync('du', […], { signal })`.
  An aborted signal makes `du` reject with an `AbortError` (the child is
  SIGTERM'd), which `buildProject`'s existing `try/catch` turns into `null`; the
  post-sizing `signal.aborted` check then bails.

Because sizing runs at `SIZE_CONCURRENCY` (4), at most ~4 `du` processes are ever
in flight, and all are killed on abort → cancel completes in well under 100ms.

## Cancellation contract

`Scanner.scan` returns a result object instead of a bare array:

```ts
interface ScanOutcome {
  cancelled: boolean
  projects: Project[] // empty when cancelled
}
```

`run()`:
- On any aborted check: emit a final `{ done: true }` progress (so the renderer's
  "scanning" flag clears), then return `{ cancelled: true, projects: [] }`.
- On normal completion: return `{ cancelled: false, projects: <sorted> }`.
- `finally`: clear `this.current` and the controller.

## Clean revert (main)

`runScan` (`src/main/index.ts`) honors the outcome:

```ts
const { cancelled, projects: found } = await scanner.scan(roots, onProgress)
if (cancelled) {
  analytics.capture('scan_cancelled')
  return { cancelled: true }
}
projects.replaceAll(found)
analytics.capture('scan_completed', …)
return { cancelled: false }
```

- On cancel, `projects.replaceAll` is **not** called → a cancelled re-scan keeps
  the previous list; a cancelled first scan stays empty. No partial data lands.
- `runScan` returns `{ cancelled: boolean }` so the renderer can route the UI.
- `scan_cancelled` is a new analytics event (no paths/names).

## IPC

- New channel `cancelScan: 'projects:cancel-scan'` (`src/shared/ipc.constants.ts`).
- Handler: `ipcMain.handle(IPC.cancelScan, () => ctx.cancelScan())`, where the ipc
  ctx gains `cancelScan: () => void` wired in `index.ts` to `scanner.cancel()`
  (parallel to the existing `runScan`).
- `scan()`'s return type changes to `Promise<{ cancelled: boolean }>` end to end:
  main handler `ipcMain.handle(IPC.scan, () => ctx.runScan())`, preload, and
  `CleanApi.scan(): Promise<{ cancelled: boolean }>`.

## UI (both surfaces)

`ScanningView` and `ScanPanel` each gain a Cancel button and an `onCancel: () => void`
prop. The existing scan-start effect routes on the result:

```ts
void window.clean.scan().then((res) => {
  if (res.cancelled) onCancel()
  else setTimeout(onDone, delay) // existing delay: 380 (launcher) / 350 (panel)
})
```

- Cancel button → `void window.clean.cancelScan()`. This makes the in-flight
  `scan()` resolve `{ cancelled: true }`, so routing happens through the single
  `.then` above (no double navigation). A local `cancelling` state may dim the
  button / show "Cancelling…".
- `onCancel` routing: launcher → `setView('list')`; panel → `setView('main')`.
- **ESC** cancels while scanning, wired into each surface's existing keyboard
  handler: launcher `LauncherApp` ESC branch when `view === 'scanning'` →
  `window.clean.cancelScan()`; panel `PanelApp` ESC branch when `view === 'scan'`
  → `window.clean.cancelScan()`. (The `.then` still performs the actual view
  change on the cancelled result.)

## Testing

- `runScan` cancel branch: with a mocked scanner returning `{ cancelled: true }`,
  assert `projects.replaceAll` is NOT called and `runScan` returns
  `{ cancelled: true }`; with `{ cancelled: false, projects }`, assert
  `replaceAll(projects)` IS called.
- Sizing abort: `folderSize(path, signal)` with an already-aborted signal rejects
  (du not run / killed) — assert it rejects/propagates so the scan bails.
- Scan-outcome shape: a normal scan over a fixture root returns
  `{ cancelled: false, projects }`.

## Files touched

- `src/main/scanner/scanner.ts` — AbortController, `cancel()`, `scan` returns
  `ScanOutcome`, signal threaded through `walk`/`mapLimit`/`buildProject`.
- `src/main/lib/folder-size.ts` — `folderSize`/`measureNodeModules` accept an
  optional `AbortSignal`, passed to `execFileAsync('du', …, { signal })`.
- `src/main/index.ts` — `runScan` honors the outcome + returns `{ cancelled }`;
  ipc ctx gains `cancelScan: () => scanner.cancel()`.
- `src/main/ipc/register-ipc.ts` — `cancelScan` handler; `scan` handler returns
  the outcome; `AppContext` gains `cancelScan`.
- `src/shared/ipc.constants.ts` — `cancelScan` channel.
- `src/preload/index.ts`, `src/preload/api.types.ts` — `cancelScan()`; `scan()`
  return type.
- `src/renderer/src/launcher/views/ScanningView.tsx`,
  `src/renderer/src/panel/PanelApp/ScanPanel.tsx` — Cancel button + `onCancel`.
- `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`,
  `src/renderer/src/panel/PanelApp/PanelApp.tsx` — pass `onCancel`; ESC-to-cancel.
