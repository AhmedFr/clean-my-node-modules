---
title: "Monorepos and disk space: taming node_modules at scale"
description: "Why monorepos multiply dependency weight, how workspaces and pnpm help, and how to keep turbo caches, per-package builds, and stale clones in check."
date: "2026-09-05"
---

Monorepos concentrate everything: code, tooling, and disk usage. A single well-used monorepo can carry more dependency weight than a dozen small projects, and it adds new categories of disk consumption (build caches, per-package artifacts) that ordinary cleanup advice ignores. Here is where the gigabytes go and how to get them back.

## Where monorepos put their weight

**The root node_modules.** With npm, yarn, or pnpm workspaces, most dependencies hoist to a single root `node_modules`. In a repo with 20 packages this folder is routinely 1 to 3 GB. That is actually the efficient outcome: one shared copy instead of 20.

**Per-package node_modules.** Packages with conflicting versions or lifecycle scripts get their own nested `node_modules`. A handful is normal; dozens of heavy ones suggest version conflicts worth fixing with a `dedupe` pass:

```bash
npm dedupe --dry-run       # npm workspaces
pnpm dedupe --check        # pnpm 9+
```

**Build and task caches.** Turborepo's `.turbo`, Nx's `.nx/cache`, Vite and webpack caches inside `node_modules/.cache`, TypeScript's `.tsbuildinfo` files. These earn their space on an active repo and are pure waste on a stale clone. They can rival the dependency weight:

```bash
du -sh .turbo .nx/cache node_modules/.cache 2>/dev/null
```

**Duplicate clones.** The monorepo-specific multiplier: worktrees and second clones for parallel branches. Every clone carries the full `node_modules` and cache weight. Three working copies of a 4 GB monorepo is 12 GB, and the two you made for that hotfix in March are still there.

## The package manager choice matters more here

Everything in [npm vs yarn vs pnpm on disk](/blog/npm-yarn-pnpm-disk-space) is amplified by a monorepo, and pnpm has a structural advantage worth knowing about: because every project's `node_modules` is hard links into one store, your three clones of the monorepo largely share physical disk. With npm or yarn classic, each clone is a full physical copy. If you keep multiple working copies of a big repo, pnpm's store model is the single highest-leverage disk decision available ([how the store works](/blog/pnpm-store-explained)).

## Cleanup that respects an active monorepo

For the monorepo you work in daily:

1. **Leave the root `node_modules` alone.** Reinstalling a big workspace takes minutes; deleting it to reclaim space you will need again tomorrow is a net loss.
2. **Trim caches occasionally.** `.turbo` and friends regenerate on the next build. Clearing them on a repo you still use costs one cold build.
3. **Dedupe version conflicts.** Shrinks the per-package `node_modules` layer permanently.

For everything else, be ruthless:

4. **Stale clones and worktrees are the jackpot.** A forgotten second clone is multiple gigabytes of pure duplication. `git worktree list` shows worktrees you forgot; delete their `node_modules` first, then the worktree itself if the branch shipped.
5. **Archived monorepos** (the old company repo, the rewrite that got abandoned) keep full weight forever. Their `node_modules` and caches are [safe to delete](/blog/how-to-delete-node-modules-safely) like any other; the lockfile rebuilds everything if the repo ever wakes up.

And as always on macOS: delete to the Trash, not with `rm -rf`. The bigger the folder, the more that [habit](/blog/never-rm-rf-node-modules) is worth.

## Keeping score

The hard part in a monorepo world is knowing your current total. Weight accumulates across the repo, its clones, per-package folders, caches, and the pnpm store simultaneously; no single `du` shows it. [TidyDisk](/) keeps the running total in your Mac's menu bar: every `node_modules` across every clone, the pnpm store sized honestly (hard links counted once), staleness per project, one-click cleanup to the Trash. The scan is free, and monorepo users tend to see the biggest first numbers of anyone.

Whether you automate it or script it, check the number quarterly. Monorepos grow in silence, and the first `find` on a machine that hosts one is reliably a surprise.
