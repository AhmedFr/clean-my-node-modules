# Docker tab: project-grouped display with type badges + used-by association

Date: 2026-07-08
Status: awaiting user review
Branch (implementation): feat/docker-project-grouping (stacked on feat/docker-cleanup / PR #40)

## Goal

Replace the Docker tab's category-grouped display (Images / Volumes / Containers /
Build cache sections) with a **project-grouped** list, so a developer can see at a
glance which Docker resources belong to which project. Each resource keeps a
**type badge**, there's a **type-filter chip row** and **Size / Name / Recent**
sort tabs mirroring the node_modules Projects tab, and resources are associated to
projects as aggressively as the data honestly allows (Compose labels + used-by
references), with the genuinely project-less remainder in an "Other" section.

## Decisions made with the user (2026-07-08)

- Presentation: **one project-grouped list + a type-filter chip row** (All /
  Images / Volumes / Containers / Cache). Not category tabs (that is the type
  axis, which fights the project-awareness goal).
- Association: **Compose labels + used-by references** (maximize coverage).
- Missing working_dir → generic Docker icon + Compose project name (group still
  works for cleanup).
- Sort: **Size / Name / Recent** tabs that reorder the GROUPS (Recent = newest
  resource, since Docker has no true "last used"); items within a group sort by
  size.
- Keep containers as a badged type.

## Honest ceiling (stated plainly)

Project *identity* only exists for **Docker Compose** projects (name +
`working_dir` from `com.docker.compose.project*` labels). A pure `docker run`
setup with no compose has no project structure, so everything falls to "Other".
The "used-by" logic extends coverage of images/volumes to the compose projects
that do exist; it does not invent projects for non-compose resources. This is a
data limitation, not a design shortcut.

## Association model (main process)

Project identity is always a Compose project. For each resource:

- **Containers**: `com.docker.compose.project` label → that project;
  `com.docker.compose.project.working_dir` → working_dir (for the logo). No
  compose label → Unaffiliated ("Other").
- **Images**: (a) a compose-built image carrying `com.docker.compose.project` →
  that project; else (b) **used-by**: if exactly ONE compose project's containers
  reference this image (by ImageID or repo:tag), group it under that project.
  Used by multiple compose projects, or unused/dangling → "Other" (repo-grouped).
  Rationale for single-project-only: an item lives in exactly one group so the
  size sort never double-counts.
- **Volumes**: (a) `com.docker.compose.project` label → that project; else (b)
  **used-by**: the single compose project whose container mounts it; else → "Other".
- **Build cache**: never associated → its own "Build cache" group in "Other".

## Data sources (behind the existing cache-and-refresh)

Current: `docker version`, `docker system df -v` (inventory), `docker system df`
(freed-bytes). This adds two batched reads:

- `docker ps -aq` then `docker container inspect <ids…>` — one call returning
  each container's `.Config.Labels` (compose project + working_dir), `.Image` /
  `.Image` id (image reference for used-by), and `.Mounts[].Name` (named-volume
  mounts for used-by). This is the enrichment backbone.
- `docker volume inspect <names…>` — one call for volume `.Labels` (compose
  project). (df -v already gives volume size + link count; inspect adds labels.)

Both fail-soft: if inspect fails or the daemon hiccups, association degrades to
"everything in Other" rather than erroring (the tab still lists + cleans). Cached
in `docker-cache.json` like today; recomputed on refresh/⌘R.

Per distinct project working_dir, reuse the scanner's `detectKind(workingDir)` +
`findProjectIcon(workingDir)` (from `src/main/scanner/`) to compute the project
logo. Guard when the dir no longer exists on disk → `kind`/`iconDataUrl`
undefined → the renderer falls back to a generic Docker icon + the compose name.

## Data model changes (`src/shared/docker.types.ts`)

```ts
export interface DockerItem {
  // …existing: id, kind, name, sizeBytes, createdAt, inUse, removable
  /** Compose project this resource is grouped under; undefined = unaffiliated. */
  project?: string
  /** Image repository (name before the last ':'), for repo sub-grouping in Other. */
  repository?: string
}

/** A Compose project surfaced as a group header, with a detected logo. */
export interface DockerProject {
  name: string
  workingDir?: string
  /** Reused from the scanner; undefined → renderer shows a generic Docker icon. */
  kind?: FrameworkKind
  iconDataUrl?: string
}

export interface DockerInfo {
  // …existing: available, reason?, checkedAt, totals, items
  projects: DockerProject[]
}
```

`buildDockerItems` stays pure; a new pure `associateProjects(items, containers,
volumeLabels)` computes `project`/`repository` and the `DockerProject[]` from the
inspect data — fully unit-testable with fixtures, no daemon.

## Renderer

- Pure `groupDockerForDisplay(info, { sortBy, typeFilter, query })` in
  `DockerView.constants.ts` → an ordered list of groups. A group is one of:
  `{ kind: 'project', project: DockerProject, items }` |
  `{ kind: 'repository', repository, items }` |
  `{ kind: 'buildcache', items }` | `{ kind: 'unaffiliated', items }`.
  Ordering: project groups first (sorted by the active tab), then a
  "Not linked to a project" divider, then repository/buildcache/unaffiliated
  groups (sorted). `typeFilter` drops non-matching items (and now-empty groups);
  `query` filters by item name or project name. Group sort keys: Size = total
  group bytes; Name = project/repo name; Recent = max item `createdAt`. Items
  within a group sort by size desc. Unit-tested.
- `DockerView.tsx` reworked: group headers render the project logo (reuse
  `ProjectIcon`-style rendering driven by `DockerProject.kind` + `iconDataUrl`,
  generic Docker icon fallback) or a repo/cache/orphan header; rows render via
  the existing row with a new `TypeBadge` (IMAGE / VOLUME / CONTAINER / CACHE).
  Per-group prune actions stay (dangling images, build cache, unused volumes,
  stopped containers) where they map cleanly.
- `LauncherApp.tsx`: add `dockerSortBy` state + a type-filter chip row, cloning
  the Projects/Packages sort-tab pattern. The Docker keyboard guard and body
  branch already exist.

## Safety (unchanged — regression-guarded)

This is presentation + data-enrichment only. Every row still carries its
`DockerItem.id` and `kind`, and cleanup is still driven by
`requestDockerRemove(item)` / `requestDockerPrune(target)`. The typed-name
volume-confirmation gate (`dockerConfirm`, `dockerConfirmBlocked`,
`commitDockerConfirm`, `docker-confirm.ts`) is untouched. A test asserts the
confirm-flow wiring is unchanged, and the existing docker + confirm tests stay
green.

## Testing

- Pure unit tests (vitest, no daemon): `associateProjects` (compose-label,
  used-by single project, used-by multi-project → Other, orphan, image
  repository extraction), the working_dir → generic-icon fallback path, and
  `groupDockerForDisplay` (group ordering, each type-filter chip, each sort key,
  query filter, empty-group omission).
- Container/volume inspect JSON parsing tested with fixtures.
- Existing `docker-parse`, `docker`, `validate-docker-arg`, `docker-confirm`, and
  `register-ipc` docker tests remain green; typecheck / lint / build green.
- Manual (user, needs a real daemon + a compose project): the group with the
  right logo, images appearing under the project whose container uses them, the
  filter chips, the sort tabs, and the volume typed-name confirm still firing.

## Out of scope

- Docker networks (no meaningful disk footprint).
- Any change to what the cleanup actions do (remove/prune commands unchanged).
- Inventing project identity for non-compose (`docker run`) resources.
