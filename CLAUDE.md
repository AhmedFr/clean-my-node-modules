# Project rules

## STATUS.html — the always-current project dashboard (MANDATORY)

`STATUS.html` at the repo root is the user's single source of truth for where this
project stands. The user relies on it because implementation moves faster than they
can follow. **Letting it go stale defeats its purpose.**

At the end of EVERY session in which anything changed (feature built, bug fixed,
decision made, scope discussed), update the `STATUS` data block at the top of
`STATUS.html` before finishing:

1. Bump `updated` to today's date and adjust `phase`/`summary` if the headline changed.
2. Move roadmap items between statuses: `done` / `progress` / `planned` / `user`
   (`user` = blocked on the user). Add new items for new work; add new milestones
   sparingly.
3. Keep `userActions` truthful — this section lists things ONLY the user can do
   (manual testing, code review, external accounts/services, vision & scope
   decisions). Add an entry whenever new work creates a user-only obligation.
   Remove entries the moment the user reports them done or makes the decision.
   Keep `id`s stable; never reuse a removed id (checkbox state is stored against them).
4. Append one `log` entry per session (date + one sentence of what happened).

Only edit the `STATUS` data block — the markup and render script below it should not
need changes for routine updates.

## Conventions

- Package manager: pnpm. Build-script approvals live in `pnpm-workspace.yaml`
  (pnpm 11), not package.json.
- One folder per component: `index.ts`, `Component.tsx`, `Component.types.ts`,
  optionally `.constants.ts` and tests.
- `clean-my-node-modules/` is the original design handoff bundle — reference only,
  never modify it.
