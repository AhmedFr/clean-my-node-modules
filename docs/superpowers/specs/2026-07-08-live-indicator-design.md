# Live/running indicator + delete guard — design

**Date:** 2026-07-08
**Status:** Approved design, pre-implementation
**Feature:** Show a green "live" dot on projects whose app is currently running,
and block deleting a running app's node_modules.

## Problem

A project may not have been *modified* in months yet be running 24/7 (a pm2
service, a long-lived dev server). Its node_modules looks like stale reclaimable
space by `lastUsed`, but deleting it would crash the running app. Users need to
see at a glance what is live and be prevented from deleting it out from under a
running process.

## Goal

- A green dot on rows whose project has a process running from inside it.
- The delete affordance disabled on those rows.
- A hard main-side refusal to delete a live project, re-checked at the instant
  of delete (not just from stale poll data).
- Refresh while the user is looking; near-zero cost when idle.

## Non-goals

- No configurable background polling interval. Liveness is only computed while a
  window is open (that is the only place dots are visible) plus the delete-time
  re-check.
- No distinct "serving vs running" dot states. Any process from the dir counts.
- No detection of container/Docker apps (documented blind spot).

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Live signal | **Any** process whose working directory is at/under the project dir (dev servers, watchers, workers, 24/7 apps) |
| Delete guard | **Hard block** on live rows, plus a re-check at the instant of delete; no override |
| Refresh cadence | Compute on window open, re-poll every ~45s **while a window is open**; no background timer; always re-check the one project before its delete |

## Detection core

New main module `src/main/liveness/`:

- `detectLiveProjects(projectDirs: string[]): Promise<Map<string, LiveInfo>>`
  keyed by project `absPath`.
- Mechanism, one batched call: `lsof -a -d cwd -u <uid>` lists every one of the
  current user's processes with its current working directory. A **pure parser**
  turns the machine-readable (`-F`) output into `{ pid, command, cwd }[]`.
- A project is **live** if any process `cwd` equals its dir or is under it
  (`cwd === dir || cwd.startsWith(dir + sep)`).
- Best-effort enrichment: a second call `lsof -iTCP -sTCP:LISTEN -P` maps
  pid → listening port, purely to label the tooltip (":3000"). It does **not**
  gate the dot.
- Cost: two `lsof` calls per refresh regardless of project count; matching is
  in-memory. Use non-blocking flags so `lsof` never hangs on a stuck mount.
- Failure is soft: if `lsof` is missing or errors, return an empty map. Dots
  simply don't show and deletes are never blocked by a detection failure.

```ts
interface LiveInfo {
  pid: number
  command: string   // e.g. "node"
  port?: number     // best-effort, tooltip only
}
```

### Documented blind spots

- **Containers/Docker:** the host cannot see a containerized process's project
  cwd, so such apps won't light up.
- **Nested monorepo projects:** a process in a subproject makes both it and its
  ancestor project match. This over-protects (worst case: an ancestor's delete is
  blocked while a child runs), which is safe.

## Data flow

- New IPC `getLiveProjects` → `Record<projectId, LiveInfo>`. Main computes
  liveness for `ctx.projects.all` dirs and keys the result by project `id`.
- New renderer hook `src/renderer/src/hooks/useLiveProjects/`: fetches on mount,
  then re-polls every 45s via an interval cleared on unmount (so polling only
  happens while a window is open). Exposes `liveById: Record<string, LiveInfo>`.
- Consumed by both `LauncherApp` and `PanelApp`; passed down to rows.

## UI

- New `src/renderer/src/components/LiveDot/` (`index.ts`, `LiveDot.tsx`,
  `LiveDot.types.ts`): a small green dot with tooltip
  `Running · <command>[ · :<port>]`.
- Render it in `Row.tsx` and `MiniRow.tsx` when the row's project is live
  (`live?: LiveInfo` prop).
- Disable the delete `RowAction` (`Row.tsx:132`) and the MiniRow delete
  (`MiniRow.tsx:61`) when live, with tooltip "This app is running".

## Hard block + delete-time re-check

In the `deleteNodeModules` IPC handler (`register-ipc.ts:75`), before trashing,
re-run liveness for **just that one project dir**. If live, refuse. Return shape:

```ts
{ freed: number; blocked?: 'live' | 'unmounted' }
```

(`'unmounted'` is shared with the external-drives feature; whichever ships first
introduces this shape.) The renderer shows a brief inline
"Can't delete — app is running" instead of a silent no-op. The single-project
re-check reuses `detectLiveProjects([dir])` — still two `lsof` calls, but only at
the moment of delete, which is negligible.

## Testing

- lsof `-F` output **parser**: fixture output → `{ pid, command, cwd }[]`
  (pure).
- `cwd → project` **matcher**: given parsed processes + project dirs → live map,
  including exact-match, under-dir match, and nested-project cases (pure).
- **Delete-guard refusal**: handler with a mocked live result returns
  `{ freed: 0, blocked: 'live' }` and does not trash.

## Files touched

- `src/main/liveness/liveness.ts` (+ `liveness.types.ts`, parser/matcher tests).
- `src/main/ipc/register-ipc.ts` — `getLiveProjects` IPC; delete re-check +
  return-shape change.
- `src/shared/ipc.constants.ts`, `src/preload/index.ts` — wire `getLiveProjects`.
- `src/renderer/src/hooks/useLiveProjects/**` — new hook.
- `src/renderer/src/components/LiveDot/**` — new component.
- `src/renderer/src/components/Row/Row.tsx`, `Row.types.ts` — live dot + disabled
  delete.
- `src/renderer/src/components/MiniRow/MiniRow.tsx`, `MiniRow.types.ts` — same.
- `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`,
  `src/renderer/src/panel/PanelApp/PanelApp.tsx` — use `useLiveProjects`, thread
  `live` into rows, handle `{ freed, blocked }` result.

## Sequencing

Build **external drives first** (smaller, lower risk); it establishes the
`{ freed, blocked }` return shape with `'unmounted'`. This feature then adds
`'live'` and the liveness module on top.
