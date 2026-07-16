# Docker images/volumes/containers/build-cache cleanup (launcher "Docker" tab)

Date: 2026-07-07
Status: awaiting user review
Branch (implementation): feat/docker-cleanup

## Goal

Add a fourth cleanup surface to the TidyDisk launcher: a "Docker" tab that lists
Docker's disk usage (images, volumes, stopped containers, build cache) with size,
created date, and in-use status, sortable like projects, and lets the user
reclaim space via the `docker` CLI. This is a large disk-cleaning win (Docker
images and build cache are frequently the single heaviest thing on a dev Mac)
and a natural extension of the free-scan / paid-clean model. Because Docker
removals are PERMANENT (no Trash), the safety model is the crux of the design.

## Decisions made with the user (2026-07-07)

- Safety model: **tiered by recoverability**. Images / build cache / stopped
  containers get a single confirm (like today's project delete); volumes get an
  EXTRA typed-name confirmation because the data is unrecoverable. Every Docker
  action is labeled "permanent, not sent to the Trash".
- Scope: **all four** `docker system df` categories (images, volumes, build
  cache, stopped containers).
- Row semantics: **created date + in-use flag** (honest; Docker exposes no true
  per-item "last used", so we do not fake one). Sort by size, created, unused-first.
- Cleanup: **per-item removal + bulk prune**.
- In-use items are **read-only** (no `-f`/force escape hatch): an image or volume
  a container holds cannot be removed through the GUI. This is Docker's own rule
  and a strong safety property.
- Listing/scanning is cache-and-refresh (never blocks the UI), mirroring the pnpm
  store.

## Architecture

Follows the pnpm-store / Caches feature verbatim (it is the closest analog).

### Shared — `src/shared/docker.types.ts`
```ts
export type DockerItemKind = 'image' | 'volume' | 'container' | 'buildcache';

export interface DockerItem {
  id: string;            // image ID / volume name / container ID / cache ID
  kind: DockerItemKind;
  name: string;          // repo:tag, volume name, container name, cache short-id
  sizeBytes: number;
  createdAt: number;     // ms epoch; 0 when docker does not report it
  inUse: boolean;        // referenced by an existing container / mounted
  removable: boolean;    // false when inUse (GUI never force-removes)
}

export interface DockerCategoryTotal {
  kind: DockerItemKind;
  sizeBytes: number;
  reclaimableBytes: number;
  count: number;
}

export interface DockerInfo {
  available: boolean;    // docker CLI found AND daemon reachable
  reason?: string;       // when unavailable: "not installed" | "daemon not running"
  checkedAt: number;
  totals: DockerCategoryTotal[];
  items: DockerItem[];
}

export interface DockerActionResult { ok: boolean; freedBytes: number }
```

### Main — `src/main/docker/`
- `find-docker.ts` — mirrors `find-pnpm.ts`: resolves the `docker` binary from an
  optional `settings.dockerBinaryPath` override, then the runtime bin dirs
  (`versionManagerBinDirs`), then known locations (`/usr/local/bin/docker`,
  `/opt/homebrew/bin/docker`, Docker Desktop's `/Applications/Docker.app/...`).
  Reuses the `pnpmExecEnv`-style spawn env so Finder-launched builds get a real
  PATH. Cached per run.
- `docker.ts` — CLI wrappers via `promisify(execFile)` (NO shell; args as arrays
  so item names/ids can never inject). Functions:
  - `getDockerInfo(force?)` — availability + full listing. In-memory + on-disk
    cache (`docker-cache.json` in userData) so the tab renders last-known state
    instantly; concurrent recomputes coalesced via an `inFlight` promise. Exactly
    the `getPnpmStoreInfo` shape.
  - `removeDockerItem(kind, id)` — per-item removal for images (`docker rmi <id>`),
    volumes (`docker volume rm <name>`), and stopped containers (`docker rm <id>`).
    Build cache has no clean single-record removal in the docker CLI, so it is
    listed for size awareness but reclaimed via bulk prune only (no per-item
    action on build-cache rows).
  - `pruneDocker(target)` where `target ∈ { danglingImages, unusedImages,
    stoppedContainers, buildCache, unusedVolumes }` — the corresponding
    `docker <x> prune -f` (the `-f` skips docker's own prompt; the GUI supplies
    the confirmation). Freed bytes come from a `docker system df` before/after
    diff, mirroring `prunePnpmStore` (`freedBytes = max(0, before - after)`).
- Availability probe: `docker version --format '{{.Server.Version}}'` — a
  nonzero exit or missing binary distinguishes "not installed" from "daemon not
  running", surfaced as `reason` (renders an explanatory empty state like the
  pnpm store's `reason`, not an error).
- Data source: `docker system df -v --format '{{json .}}'` is the richest single
  call (images, volumes with size + mount `Links`, containers, build cache).
  Enriched with `docker ps -a --format json` (container→image in-use map, states)
  and `docker image ls --all --format json` (tags, created, dangling). `inUse`:
  image referenced by any container; volume with `Links > 0`; container in
  `running` state (only stopped containers are removable).

### IPC — `src/shared/ipc.constants.ts` + `src/main/ipc/register-ipc.ts`
- Channels: `docker:get` (read-only, ungated), `docker:remove`, `docker:prune`.
- `docker:remove` / `docker:prune` handlers each OPEN with the license gate,
  identical to prune/delete:
  ```ts
  if (!ctx.license.get().pro) return { ok: false, freedBytes: 0 }
  ```
- Payload validation: `kind` checked against the union, `id` non-empty string,
  `prune target` checked against the allowed set — same discipline as
  `coerceSetting` / the analytics whitelist. Anything else is rejected.
- Preload: expose `getDocker`, `removeDockerItem`, `pruneDocker` on `window.clean`
  (`src/preload/index.ts` + `api.types.ts`).

### Renderer
- `src/renderer/src/launcher/views/DockerView.tsx` — clones `CachesView`:
  category sections (Images / Volumes / Containers / Build cache), each a list of
  rows filtered by the shared header `query`, plus per-category "Prune" actions
  and a totals/reclaimable summary. Unavailable → explanatory state from `reason`.
- Rows reuse `CacheRow` (icon, name, detail = created date + in-use badge, size,
  action). In-use rows render the badge and NO action button (`removable: false`);
  build-cache rows likewise have no per-item action (bulk prune only).
- `useDocker` hook clones `usePnpmStore`: `{ info, loading, busyId, remove,
  prune, refresh }`; mutations re-fetch on completion.
- Formatting reuses `formatSizeStr` and `relativeTime` (created date).

### Confirmation UX (extends the existing footer)
- Single-confirm items (image / container / build cache): reuse the current
  two-step footer bar (`confirm` state in `LauncherApp.tsx`), worded
  "Remove <name>? Frees N. This is permanent (not sent to the Trash)."
- Volume removals (per-item and the unused-volume prune): a SECOND step — the
  footer shows a small text input; the action stays disabled until the user
  types the exact volume name (per-item) or the word `prune` (bulk). This is the
  only new confirmation primitive.
- Free users hit the existing `UnlockPrompt` paywall (fires `paywall_shown` with
  a `docker` trigger), same as delete/prune.

### Launcher wiring — `src/renderer/src/launcher/LauncherApp/`
- `LauncherTab` union gains `'docker'`; Segmented gains `{ value:'docker',
  label:'Docker' }`; `⌘4` added to the shortcut branch; body switch renders
  `DockerView`; per-tab footer hints extended.

### Settings — `src/shared/settings.types.ts` + validation
- `docker?: boolean` (default true; when docker is absent the tab shows the
  explanatory empty state rather than hiding, so users learn the feature exists)
  and `dockerBinaryPath?: string` override. Add `DEFAULT_SETTINGS.docker = true`,
  a `coerceSetting` case for each (boolean / path string), and a Settings toggle
  + path override row mirroring the pnpm block.

### Analytics
- Extend `clean_performed`'s `kind` values with `docker_image | docker_volume |
  docker_container | docker_buildcache | docker_prune`; captured main-side in the
  `docker:remove` / `docker:prune` handlers with `freed_gb`, exactly like the
  existing prune/delete instrumentation. No new renderer-originated events beyond
  the shared `paywall_shown`.

## Error handling / edge cases
- Docker CLI missing → `available:false, reason:"not installed"`.
- CLI present, daemon down → `available:false, reason:"daemon not running"` with a
  hint to start Docker Desktop.
- A removal that Docker refuses (e.g. an image gained a container between listing
  and action) → `{ ok:false }`; the view refreshes and re-reads state (no crash).
- Slow `docker system df -v` on large setups → cache-and-refresh keeps the UI
  responsive; a lightweight spinner/pill during recompute (mirrors the pnpm
  store's footer pill).
- All CLI calls use `execFileAsync` with a timeout (prune can be slow; reuse the
  10-minute ceiling pattern) and array args (injection-safe).

## Testing
- Unit (main): `find-docker` resolution order; `docker system df -v` JSON parsing
  → `DockerItem[]`/totals (fixture-driven, no live daemon); `inUse`/`removable`
  derivation; freed-bytes diff math; payload validation rejects bad kind/id/target.
- Unit (renderer): `DockerView` category grouping + query filtering; the volume
  typed-name confirmation gating (action disabled until the name matches).
- Existing suites stay green; typecheck/lint/build green; the packaged app's
  Docker tab is a manual (user) verification since it needs a real daemon.

## Out of scope (later)
- Pricing bump to €29 that this unlocks (already in the business model / GTM doc).
- Menu-bar panel surfacing — Docker lives in the launcher only, to keep the tiny
  panel focused.
- Xcode / DerivedData / simulators and other non-Docker caches.
- Podman/nerdctl support (docker CLI only for v1).
- Any `-f`/force removal of in-use items.
