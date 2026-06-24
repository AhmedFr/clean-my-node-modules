# Robust pnpm store detection + manual override + real/linked diff hint

**Date:** 2026-06-24
**Branch:** `feat/pnpm-store-robustness` (off `feat/real-vs-virtual-storage`, depends on its `uniqueSize` code)
**Status:** Design approved, awaiting spec review

## Problem

On the user's machine two symptoms appeared, which the user believed were one issue.
Investigation found **two independent root causes**:

1. **"Still no pnpm path found."** The user's pnpm is Homebrew's
   (`/opt/homebrew/bin/pnpm`), a `#!/usr/bin/env node` **script**. Running
   `pnpm store path` therefore needs `node` on PATH:
   - Full PATH (dev): works → `~/Library/pnpm/store/v11`.
   - Stripped PATH (Finder launch): `env: node: No such file or directory`
     (exit 127); the user's node is nvm, which a Finder-launched app doesn't see.

   The current code already tries to rescue this (`pnpmExecEnv` prepends a
   resolved node dir), and in reproduction it *succeeds* in both dev and a
   simulated Finder PATH — so an outright failure could not be reproduced with
   current code. The real robustness gaps are: `findPnpm` does not search
   nvm/volta/asdf/corepack node-bin dirs (an npm-global pnpm under nvm would not
   be found), there is **no manual override**, and failures are **silent** (the
   UI cannot say *why* the store is unavailable).

2. **No real/linked diff.** The projects cache predates the feature; every entry
   has `uniqueSize: undefined`. The back-fill (`project-store.ts`) sets
   `uniqueSize = size` for those, so `linked = size - uniqueSize = 0` and no diff
   renders. The measurement itself is correct — verified via `du` against the
   user's real projects (e.g. clean-my-node-modules: 294 MB real / 793 MB linked).
   A fresh scan populates it. This is **unrelated** to the pnpm-path issue.

## Goals

- Store **sizing** becomes a "no-fail zone": it works even when the pnpm binary
  or node cannot be executed.
- pnpm binary discovery handles **all common install methods** (standalone,
  Homebrew, npm-global, corepack) under any node manager.
- A **manual override** is the guaranteed escape hatch when auto-detection fails.
- Failures are **diagnosable** — the UI explains the state instead of silently
  showing "unavailable".
- The real/linked diff is **honestly represented** for legacy caches, with a
  clear path (a hint + Rescan action) to populate it.

## Non-goals

- Pruning when no runnable pnpm binary exists. Prune genuinely needs the binary;
  when none is found, sizing still works but Prune is disabled with a reason.
- Supporting non-pnpm package managers for the store (npm/yarn/bun) — out of scope.
- Auto-rescanning on stale cache (the user chose the hint approach instead).

## Design

### 1. Layered store resolution (`pnpm-store.ts`)

`readStoreInfo()` becomes a priority chain that stops at the first success and
records *how* it resolved:

1. **Manual store path** (from settings, if set): validate it exists and is a
   directory, then `du` it. `source: 'manual'`.
2. **Run pnpm**: `pnpm store path` via the existing node-prepended env
   (`pnpmExecEnv`), using the manual pnpm-binary override (if set) as the first
   candidate. `source: 'pnpm'`.
3. **Filesystem inference** (no pnpm execution): scan well-known store roots and
   pick the newest `v<N>` directory, then `du` it. `source: 'inferred'`.
4. **None found**: `available: false` with a human-readable `reason`.
   `source: 'none'`.

`PnpmStoreInfo` (in `src/shared/pnpm-store.types.ts`) gains:

```ts
source: 'manual' | 'pnpm' | 'inferred' | 'none'
reason?: string   // why unavailable / how resolved, for the UI
canPrune: boolean // true only when a runnable pnpm binary was resolved
```

`available` and `sizeBytes` keep their meaning. `canPrune` is independent of
`available`: the store size can come from inference while prune stays disabled.

### 2. Filesystem store-path inference (`infer-store.ts`, new)

Pure, testable function:

```ts
export function storeRootCandidates(env: NodeJS.ProcessEnv, home: string): string[]
export async function inferStoreDir(
  candidates: string[],
  exists: (p: string) => Promise<boolean>,   // injected for tests
  listVersions: (p: string) => Promise<string[]>,
): Promise<string | null>
```

Candidate store roots (first match wins, newest `v<N>` within):

- `$PNPM_HOME/store` (when `PNPM_HOME` is set)
- `~/Library/pnpm/store` (macOS standalone default)
- `~/.local/share/pnpm/store` (XDG / Linux-style)
- `$XDG_DATA_HOME/pnpm/store` (when set)

Within a root, list entries matching `^v\d+$`, sort numerically, pick the
highest that exists. The store path pnpm reports (e.g. `.../store/v11`) is
exactly this shape, so inference matches what pnpm would have said.

### 3. Shared runtime-bin discovery (`runtime-bins.ts`, new)

Today only `find-node.ts` knows version-manager bin dirs (nvm). Extract that
into a shared module so `findPnpm` can search the same dirs:

```ts
export function versionManagerBinDirs(
  env: NodeJS.ProcessEnv, home: string, nvmNodeBins: string[],
): string[]
export async function nvmNodeBins(home: string): Promise<string[]>
```

Returned dirs (deduped, ordered): PATH dirs, `$PNPM_HOME`, nvm version bins
(newest first), `~/.volta/bin`, `~/.asdf/shims`, `~/.local/state/fnm_multishells`
(best-effort) / fnm, Homebrew (`/opt/homebrew/bin`, `/usr/local/bin`), `/usr/bin`.

- `find-node.ts` refactors to consume `versionManagerBinDirs` (behavior preserved;
  existing tests must stay green).
- `find-pnpm.ts` builds candidates as `<binDir>/pnpm` for every dir, **prepending
  the manual `pnpmBinaryPath`** override when set. This finds npm-global and
  corepack pnpm (which live in the node bin dir), not just standalone/Homebrew.

`findPnpm` gains an optional override parameter (manual binary path) so it stays
pure/testable; the module-level resolved-cache is keyed to ignore the override or
is bypassed when an override is supplied.

### 4. Manual override settings

`src/main/settings` gains two optional fields:

```ts
pnpmStorePath?: string    // a store directory (…/store/v11)
pnpmBinaryPath?: string   // the pnpm executable
```

- `validate-setting.ts`: both validate as optional non-empty strings (trimmed);
  empty/whitespace clears the override. Existence is **not** required at
  set-time (the path may be created later); existence is checked at resolution
  time and reflected in the status line.
- Persisted and exposed through the existing settings IPC pattern.
- A new IPC channel `dialog:pickPath` opens a native Electron
  `dialog.showOpenDialog` (folder mode for the store, file mode for the binary)
  so the user picks rather than types. Single-responsibility action module
  (`src/main/actions/pick-path.ts`).

### 5. Settings UI — "pnpm store" section

A new section in Settings (renderer) with:

- **Store path** row: read-only text of the current value (or "auto-detected"),
  a "Choose…" button (folder picker), and a "Clear" button.
- **pnpm binary** row: same pattern (file picker).
- A **live status line** driven by `PnpmStoreInfo`:
  - `available`: `"Store: ~/Library/pnpm/store/v11 · 793 MB · detected automatically"`
    (or `· set manually` / `· inferred`).
  - `!available`: the `reason`, e.g. `"pnpm not found — choose its location or the store folder"`.
  - When `!canPrune` but `available`: a muted note that Prune needs a runnable
    pnpm binary.

Component folder per project convention: `PnpmStoreSettings/`
(`index.ts`, `PnpmStoreSettings.tsx`, `PnpmStoreSettings.types.ts`).

### 6. Real/linked diff — "rescan to compute" hint

- `Project.uniqueSize` becomes **optional** (`number | undefined`).
- `project-store.ts` **stops back-filling** `uniqueSize = size`; legacy entries
  keep `undefined` (= "split unknown"), distinct from a genuine `0`.
- Scanner already always sets a real `uniqueSize` (unchanged).
- Renderer:
  - `MiniRow`, `SizeViz`, `Row` treat `uniqueSize === undefined` as unknown:
    render the apparent size as the headline (today's behavior), no "linked"
    line, no tooltip claiming a split.
  - A single hint component (`RescanHint/`) renders in Panel + Launcher whenever
    **any** project has an unknown split: *"Real vs linked sizes need a rescan"*
    with a **Rescan** button (reuses the existing scan trigger). It disappears
    once every entry has a known split. No per-row noise.
  - Totals (`PanelApp`, `LauncherApp`, `DiskSummary`, `Gauge`) compute
    `realBytes` as `Σ (uniqueSize ?? size)` so legacy caches degrade to today's
    apparent-sum until rescanned.

## Component boundaries

| Unit | Responsibility | Depends on |
|---|---|---|
| `runtime-bins.ts` | Enumerate version-manager bin dirs | os, fs, path (pure + 1 fs read) |
| `find-node.ts` | Resolve a runnable `node` | `runtime-bins` |
| `find-pnpm.ts` | Resolve a runnable `pnpm` (+ manual override) | `runtime-bins`, settings |
| `infer-store.ts` | Find the store dir on disk without pnpm | fs (injected in tests) |
| `pnpm-store.ts` | Layered resolution → `PnpmStoreInfo`; prune | the above + settings + `folder-size` |
| `pick-path.ts` | Native folder/file picker IPC | electron `dialog` |
| settings (`*`) | Persist/validate `pnpmStorePath`, `pnpmBinaryPath` | — |
| `PnpmStoreSettings/` | Settings UI for overrides + status | settings + store IPC |
| `RescanHint/` | "Rescan to compute" affordance | scan IPC |
| `project-store.ts` | Cache; no longer back-fills `uniqueSize` | — |

## Error handling

- Every layer is wrapped so a thrown error falls through to the next layer, never
  crashing detection; the final `reason` summarizes the last failure.
- `du` failures on a resolved path → treated as size `0` with the path still
  reported (so the user sees the path even if sizing momentarily fails), and a
  `reason` noting the sizing error. (Mirrors the existing folder-size posture.)
- Manual paths that don't exist at resolution time → skipped with a `reason`
  ("set store path not found: …"), falling through to auto layers.

## Testing (TDD on pure logic)

- `runtime-bins.test.ts`: ordering, dedup, nvm-newest-first, manual-first.
- `find-pnpm.test.ts` (extend): finds npm-global/corepack pnpm in node bin dirs;
  manual override tried first; PATH-first ordering preserved.
- `find-node.test.ts`: stays green after the refactor (regression guard).
- `infer-store.test.ts`: newest `v<N>` selection; root precedence; none-found.
- `pnpm-store` resolution: decision order manual > pnpm > inferred > none, with
  the right `source`/`reason`/`canPrune` (inject finders + fs).
- `validate-setting.test.ts` (extend): `pnpmStorePath` / `pnpmBinaryPath`
  validation incl. clearing via empty.
- `project-store`: legacy cache leaves `uniqueSize` undefined; round-trips.
- Renderer components are not unit-tested in this project (consistent with
  existing convention); verified manually via the running app.

## Rollout / verification

- `pnpm typecheck && pnpm lint && pnpm test` green.
- Manual: launch dev with a stale cache → hint shows; Rescan → diff appears.
- Manual: simulate a broken pnpm (e.g. rename the binary on PATH) → store size
  still shows via inference; Prune disabled with a reason; set a manual store
  path → status reflects "set manually".
- Update `STATUS.html` per project rules.

## Open questions

None blocking. fnm layout detection is best-effort; if a user's fnm install is
not found by auto-detection, the manual binary override covers it.
