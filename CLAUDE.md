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

## Branch / PR flow

- `main` is protected by convention: feature work happens on `feat/<name>` (or
  `fix/<name>`) branches and lands via PR so the user can review.
- Direct commits to main are OK only for docs, STATUS.html updates, and CI/config chores.
- CI (`.github/workflows/ci.yml`) runs typecheck + tests + build on every PR, plus an
  unsigned macOS packaging job. PRs should be green before review is requested.
- Conventional-commit style subjects: `feat(scope): …`, `fix: …`, `docs: …`, `ci: …`.

## Conventions

- Package manager: pnpm. Build-script approvals live in `pnpm-workspace.yaml`
  (pnpm 11), not package.json.
- One folder per component: `index.ts`, `Component.tsx`, `Component.types.ts`,
  optionally `.constants.ts` and tests.
- Site styling is Tailwind v4: tokens in `site/app/globals.css` `@theme`
  (colors like `ink-2`/`accent`/`ok`, fonts `display`/`ui`/`mono`), arbitrary
  values over scale-snapping for exact px, custom `max900:`/`max560:` variants
  for the inclusive breakpoints. The residual classes in globals.css
  (`lp-nav`, `reveal`, `lp-screen`, `blog-prose`, ...) are behavior hooks or
  markdown-facing; keep them stable.
