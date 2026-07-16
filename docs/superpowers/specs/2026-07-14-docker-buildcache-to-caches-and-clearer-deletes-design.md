# Docker feature finish: build cache → Caches tab + clearer deletion buttons

**Date:** 2026-07-14
**Branch:** `feat/docker-project-grouping` (continues the existing Docker work)
**Status:** approved design, pending implementation plan

## Problem

Two rough edges left on the Docker tab before it's done:

1. **Build cache sits in the wrong place.** Docker's build cache is a global,
   not-project-linked cache — conceptually it belongs with the other package-manager
   caches (pnpm store, and the future npm/yarn/bun), not mixed into the
   project-grouped Docker list where it currently shows as a "Build cache" group in
   the "Not linked to a project" section.
2. **The deletion buttons don't read as deletion.** The bulk-prune buttons on the
   Docker "Other" group headers are labelled with just the *category*
   ("Unused images", "Unused volumes", "Build cache"), so they look like filter
   chips rather than destructive actions.

## Decisions (settled with the user)

- **Build cache presentation in Caches:** a single aggregated "Docker build cache"
  row (total size + one Delete button), mirroring the pnpm store row. Not a list of
  individual build-cache records (they aren't individually removable anyway — the
  CLI only prunes build cache as a whole).
- **Gauge accounting:** unchanged. Build cache keeps counting toward the Docker
  header gauge (it is genuinely Docker's disk). The Caches gauge is untouched. The
  Caches tab is simply *where you delete it*.
- **Bulk-prune button style:** delete verb + trash icon + danger (red) styling —
  "Delete unused images", "Delete dangling images", "Delete stopped containers",
  "Delete unused volumes". The "permanent, not sent to the Trash" tooltip stays.
- **Per-item delete:** keep the hover-revealed trash icon (matches the node_modules
  rows) — it already renders as a danger `RowAction`, so no behavioural change.

## Design

### Goal 1 — build cache moves to the Caches tab

**Docker tab stops showing build cache.**
`groupDockerForDisplay` (`DockerView.constants.ts`) no longer emits the `buildcache`
`DisplayGroup`. The `buildCache` prune target, `pruneEstimateBytes`, and
`PRUNE_TARGET_LABEL['buildCache']` all remain — they're still used by the shared
confirm/prune flow, now triggered from the Caches tab instead of a Docker group
header.

**Caches tab gains a "Docker build cache" row.**
- Size = sum of `docker.info.items` where `kind === 'buildcache'`.
- Rendered only when Docker is available (`docker.info.available`) and that size > 0.
- Its **Delete** button calls the existing `requestDockerPrune('buildCache')`,
  reusing: the Pro license gate, the confirm dialog, the reclaimed-bytes toast, and
  the permanent/no-Trash wording. Build cache does **not** need the typed-name gate
  (only volumes do), so it's a single-click confirm.
- Busy state driven by `docker.busyId === 'prune:buildCache'`.

**Caches tab becomes a list of live caches.**
Today the tab hard-codes the pnpm store at keyboard index 0. It becomes a small
ordered list of *live* caches (pnpm store, then Docker build cache when present);
keyboard ↑/↓ moves across them and Enter fires the selected cache's action. The
"soon" placeholders (npm/yarn/bun) stay below and remain non-selectable.

**Auto-scan extended to the Caches tab.**
The existing effect that background-scans Docker when the Docker tab opens with
missing/stale (>5 min) data also fires for the Caches tab (when `dockerEnabled`), so
the build-cache row is populated even if the user never opened the Docker tab. Same
staleness guard, same loop guard.

### Goal 2 — deletion buttons read as deletion

**Bulk-prune buttons (Docker tab group headers).**
New delete-verb button labels, distinct from the confirm-footer noun labels:

| Prune target      | Button label              | Confirm-footer label (unchanged) |
|-------------------|---------------------------|----------------------------------|
| danglingImages    | Delete dangling images    | Dangling images                  |
| unusedImages      | Delete unused images      | Unused images                    |
| stoppedContainers | Delete stopped containers | Stopped containers               |
| unusedVolumes     | Delete unused volumes     | Unused volumes                   |
| buildCache        | (no button in Docker tab; deleted from Caches) | Build cache          |

Buttons get a trash icon and danger (red border/text) styling. Tooltip unchanged.

**Docker build cache Delete button (Caches tab).**
Same danger + trash treatment. Requires a small optional `danger` + leading-icon
capability added to `CacheRow` (its action button). The pnpm store keeps its neutral
"Prune" button (reversible prune, and this change is scoped to Docker).

**Per-item hover trash.**
No change — already a danger `RowAction`, hover-revealed to match node_modules rows.

### Files touched

- `launcher/views/DockerView.constants.ts` — drop the `buildcache` display group;
  add delete-verb button labels (e.g. `PRUNE_BUTTON_LABEL`).
- `launcher/views/DockerView.tsx` — prune-button trash icon + danger styling, using
  the new button labels.
- `launcher/views/CachesView.tsx` (+ `.types` / `.constants`) — live-cache list;
  Docker build-cache row with a danger Delete button.
- `components/CacheRow/*` — optional `danger` + action-icon on the action button.
- `launcher/LauncherApp/LauncherApp.tsx` — compute build-cache size; pass it + the
  delete handler + busy state to `CachesView`; extend the Docker auto-scan effect to
  the Caches tab; update the caches keyboard nav to the live-cache list.

### Safety

No change to the safety model. Every delete still routes through the existing docker
confirm gate; the typed-name volume gate is byte-identical; build cache remains
non-individually-removable and is only ever cleared via the whole-cache prune.

### Testing

- `DockerView.constants` test: `groupDockerForDisplay` no longer returns a
  `buildcache` group even when build-cache items are present; the buildCache prune
  estimate/labels still resolve.
- `CachesView` test: the Docker build-cache row appears only when available + size>0;
  Delete invokes the build-cache handler; keyboard selection spans pnpm + build cache.
- `CacheRow` test: danger/icon action variant renders.
- Prune-button label test: Docker group headers render the delete-verb labels.
- Existing docker safety / confirm tests stay green (no gate change).
