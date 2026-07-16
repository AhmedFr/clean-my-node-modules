# Docker Tab — Collapsible Project Rows (shared Accordion) — Design

**Date:** 2026-07-09
**Status:** Approved
**Branch context:** builds on `feat/docker-project-grouping`

## Goal

The Docker tab renders every group's header plus all its item rows always-visible,
producing a long flat list. Make each **project** group a clickable, collapsed-by-default
row (icon/logo, name, item count, total size, active status); clicking reveals its items.
Extract the Packages tab's accordion into a shared primitive and use it in both tabs.

## Decisions (locked during brainstorming)

1. **Expand mode:** accordion — one project open at a time (matches Packages).
2. **Scope of collapsing:** only **project** groups collapse. The "Other" groups
   (unassociated images by repository, build cache, orphan volumes/containers) render
   exactly as today — always-expanded, under the "Not linked to a project" divider,
   with their bulk-prune buttons.
3. **Reuse:** extract a generic `Accordion` primitive and retrofit **both** tabs onto it
   (the Packages tab must stay pixel-identical).
4. **Collapsed-row size:** plain text (no SizeViz bar), to keep the row calm.

## Background — current code

- `DockerView.tsx` renders `groupDockerForDisplay(info, …)` → `DisplayGroup[]`
  (`project` | `repository` | `buildcache` | `unaffiliated`). Each group renders a
  `GroupHeader` + all `g.items` as `DockerItemRow`s. A shared `.cc-hl` sliding highlight
  (single absolute div positioned from the hovered row's `offsetTop`/`offsetHeight`)
  sits behind the rows; each `DockerItemRow` calls `onHover(el)` to move it.
- `DockerProjectIcon` (local to DockerView) already resolves: real logo (`iconDataUrl`)
  → framework mark (`FrameworkIcon`) → generic box.
- `InUseDot` (local to DockerView) is the green in-use dot.
- **Packages accordion** lives in `PackagesView.tsx`: a wrapper `<div>` per entry that,
  **when open**, becomes a solid card via this exact inline style:
  ```ts
  { position: 'relative', zIndex: 1, background: 'var(--surface-2)', borderRadius: 10,
    boxShadow: 'inset 0 0 0 1px var(--hairline)', overflow: 'hidden' }
  ```
  Inside: `<PackageRow expanded={open} onToggle=… />` (header; chevron rotates 90° when
  open) + `{open && <PackageDetails … />}` (body). The Packages `.cc-hl` skips the open
  row (`entry.name !== expandedName`) because the open row is its own card.

## Architecture

### 1. `Accordion` — shared primitive

New `components/Accordion/` (`Accordion.tsx`, `Accordion.types.ts`, `Accordion.constants.ts`, `index.ts`).

```ts
export interface AccordionProps {
  open: boolean
  /** The always-visible clickable header (caller owns the click + chevron). */
  header: ReactNode
  /** The body, rendered only when open. */
  children?: ReactNode
  /** When true, the open block becomes one solid rounded card (header + body share a
   *  surface). Packages uses this; Docker does not (its rows stay flat for the sliding
   *  highlight). */
  card?: boolean
}
```

```tsx
export function Accordion({ open, header, children, card = false }: AccordionProps): ReactNode {
  return (
    <div style={open && card ? ACCORDION_OPEN_CARD : undefined}>
      {header}
      {open ? children : null}
    </div>
  )
}
```

`Accordion.constants.ts` exports `ACCORDION_OPEN_CARD` = the exact style above (so the
Packages retrofit is byte-identical).

**Why `card` is optional (the `.cc-hl` reconciliation):** the open card is a
`position: relative` context. In Packages the body (`PackageDetails`) is a static panel
with no per-row highlight, so a card is fine. In Docker the body is interactive
`DockerItemRow`s that rely on the outer list's sliding `.cc-hl`; wrapping them in a
`position: relative` card would make their `offsetTop` card-relative and break the
highlight. With `card` omitted, `Accordion` renders a plain **static** `<div>` wrapper,
which is not an `offsetParent`, so the item rows' `offsetTop` stays relative to the outer
positioned list container and `.cc-hl` keeps working across headers and items.

### 2. Packages retrofit (pixel-identical)

In `PackagesView.tsx`, replace the inline open-card wrapper + `{open && <PackageDetails/>}`
with:

```tsx
<Accordion open={open} card header={
  <PackageRow entry={entry} selected={i === selectedIndex} expanded={open}
    showUpdates={checkUpdates} rowRef={…} onSelect={…} onToggle={…} />
}>
  <PackageDetails entry={entry} onOpen={() => onOpen(entry)} />
</Accordion>
```

The rendered DOM/CSS is identical (same wrapper style via `ACCORDION_OPEN_CARD`, header
then body-when-open). No change to `usePackagesTab`, `PackageRow`, `PackageDetails`, the
`.cc-hl` measurement, keyboard nav, or the selected-row logic.

### 3. Docker — collapsible project rows

**New local `DockerProjectRow`** (in `DockerView.tsx`, matching the file's local-component
pattern) — the collapsed/clickable project header:
- left: `DockerProjectIcon` (logo → framework → generic),
- name, and a subtitle `"{n} item{s}"`,
- right: total size (plain, tabular-nums) · an `InUseDot` when any item is in-use · a
  chevron (`UIIcon.chevronRight`, `transform: rotate(90deg)` + `transition` when expanded,
  mirroring `PackageRow`).
- The whole row is a button (`onClick` toggles); `onMouseEnter` calls `onHover(el)` to
  drive `.cc-hl`, exactly like `DockerItemRow`. It carries `position: relative; zIndex: 1`
  so it sits above the highlight.
- No prune buttons (projects never expose prune; `prunesForGroup` already returns `[]` for
  them).

**DockerView changes:**
- Local state `const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)`.
  Clicking a project toggles it (accordion: opening one replaces the previous).
- Expansion resolution uses the new pure helper `projectRowExpanded(hasQuery, expandedProjectId, group.id)`:
  when the header search box has text, all project groups render expanded (their items are
  already query-filtered by `groupDockerForDisplay`, so results are never hidden); with no
  query, only the accordion-selected project is open.
- Render: for `kind === 'project'` groups, wrap in `<Accordion open={expanded}` (no `card`)
  `header={<DockerProjectRow … onToggle={() => setExpandedProjectId(id => id === g.id ? null : g.id)} onHover={…} />}>`
  and put the `DockerItemRow`s as children. For the "Other" groups, render exactly as
  today (`GroupHeader` + always-visible `DockerItemRow`s).
- `GroupHeader` keeps handling the Other groups (its project branch becomes dead once
  projects use `DockerProjectRow`; remove the now-unused project branch from `GroupHeader`
  to keep it focused).
- **Spacing:** the current 4px vertical rhythm inside a group (header→items and
  between items) is preserved by having the Docker caller wrap the `Accordion` body items
  in a `<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>`. `Accordion`
  itself imposes no gap (so the Packages `card` wrapper stays flush/pixel-identical). The
  14px gap between groups is the outer list container's existing gap and is unchanged.

### 4. Pure helpers (tested)

Added to `DockerView.constants.ts` (with tests in `DockerView.constants.test.ts`):
```ts
/** True when any resource in the group is in use by a container (drives the active dot). */
export function dockerGroupActive(items: DockerItem[]): boolean
/** Whether a project row shows expanded: a non-empty search expands all projects;
 *  otherwise only the accordion-selected id is open. */
export function projectRowExpanded(hasQuery: boolean, expandedId: string | null, groupId: string): boolean
```

## Data flow

```
groupDockerForDisplay(info, {sortBy,typeFilter,query})  ->  DisplayGroup[]
DockerView
  expandedProjectId (accordion state)
  query (search override)
  per project group:
    expanded = projectRowExpanded(!!query.trim(), expandedProjectId, g.id)
    <Accordion open={expanded} header={<DockerProjectRow active={dockerGroupActive(g.items)} …/>}>
       g.items -> <DockerItemRow …/>   (flat children; .cc-hl works)
    </Accordion>
  other groups: <GroupHeader/> + items (unchanged)
```

## Error / edge handling

- Project groups are only created when they have items (`groupDockerForDisplay` guards
  `of.length`), so no empty project rows.
- If `expandedProjectId` points at a group filtered out by a query, the id simply doesn't
  match any rendered group — no crash, nothing expanded from it.
- Loading / `!available` states in DockerView are unchanged.
- The Docker safety flow (typed-name confirm, `onRemove`/`onPrune`, per-item hover trash,
  `canRemove` gate) is untouched — this is presentation only.

## Testing

- `dockerGroupActive`: true when any item `inUse`, false when none, false for empty.
- `projectRowExpanded`: query true → always expanded regardless of id; query false →
  expanded only when `expandedId === groupId`; `expandedId` null → collapsed.
- `Accordion`, `DockerProjectRow`, and the Packages retrofit are JSX — gated by
  typecheck/lint/build. Packages pixel-parity and Docker interaction are manual QA
  (no jsdom in this repo).

## Out of scope

- No main-process change (renderer-only; hot-reloads in dev).
- No keyboard navigation for the Docker tab (it is mouse-driven today; unchanged).
- No SizeViz bar on the collapsed project row (plain text).
- "Other" groups' layout and prune behavior unchanged.
- No change to `usePackagesTab` or the Packages keyboard/selection logic.
