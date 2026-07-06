---
title: "npm vs yarn vs pnpm: which wastes the least disk space?"
description: "How npm, yarn, and pnpm each lay out node_modules on disk, what that costs across many projects, and which one hoards the least."
date: "2026-08-22"
---

Package managers are usually compared on install speed and lockfile ergonomics. Compare them on disk usage instead and the differences are bigger: across a machine with many projects, the gap between the best and worst layout is often measured in tens of gigabytes.

## How each one uses your disk

**npm** materializes a full, flat `node_modules` per project. Every package is physically copied into every project that uses it. Fifty projects using TypeScript means fifty copies of the TypeScript compiler. npm also keeps a global download cache at `~/.npm` (tarballs, not installed trees), which is modest by comparison.

**yarn classic (v1)** behaves like npm on disk: full physical copies per project, plus its own cache at `~/Library/Caches/Yarn`. Disk-wise, treat it as npm with a different lockfile.

**yarn berry (v2+) with Plug'n'Play** is the radical one: there is no `node_modules` at all. Dependencies stay as zip archives in `.yarn/cache` and are resolved at runtime. Zips are compressed and one file per package, so per-project disk usage drops sharply. The cost is ecosystem compatibility: tooling that expects a physical `node_modules` needs shims, which is a big part of why PnP adoption stayed limited. Berry can also run in `nodeLinker: node-modules` mode, which puts you back in npm territory.

**pnpm** keeps one content-addressable store per machine (`~/Library/pnpm/store` on macOS) and builds each project's `node_modules` out of hard links into it. Fifty projects using the same TypeScript version share one physical copy. Per-project marginal cost approaches zero for shared dependencies; the store grows with the union of everything you use, not the sum. The fine print (why `du` overcounts, why the store needs pruning) is in [The pnpm store explained](/blog/pnpm-store-explained).

## The numbers on a real machine

The exact figures depend on your stack, but the shape is consistent. Take a developer with 30 projects averaging 900 MB of dependencies each, with heavy overlap between projects:

| Manager | Approximate total on disk |
|---|---|
| npm / yarn classic | 25 to 30 GB (30 full copies) |
| yarn berry PnP | 6 to 10 GB (compressed zips, shared cache) |
| pnpm | 8 to 12 GB (one store + hard links, before pruning) |

pnpm and PnP land in the same league; npm and yarn classic cost roughly three times more for the same projects. The overlap assumption is doing the work here: if your projects share few dependencies, the gap shrinks.

## Disk is not the only axis

Choosing a package manager on disk usage alone would be strange. The compatibility ranking is roughly the reverse of the disk ranking: npm works with everything, pnpm works with nearly everything (occasional trouble with packages that assume a flat layout), PnP requires the most accommodation. Monorepo support, install speed, and team familiarity all weigh in, and we look at the monorepo angle specifically in [Monorepos and disk space](/blog/monorepo-disk-space).

But if disk pressure is a real constraint for you, the practical advice is:

1. **Already on pnpm:** you are in the efficient camp; your maintenance is `pnpm store prune` after deleting old projects.
2. **On npm or yarn classic:** you do not need to migrate to fix your disk. Deleting stale project `node_modules` folders recovers most of the waste regardless of manager, since [they are always reproducible](/blog/how-to-delete-node-modules-safely).
3. **Migrating anyway:** pnpm is the least disruptive of the efficient options; most projects switch with a lockfile import and minor scripts changes.

## Whatever you use, the leak is the same

All four layouts share one failure mode: nothing ever deletes itself. Stale projects keep their full weight (npm, yarn) or keep references pinning the store (pnpm) until you act. The manager determines how fast the disk fills, not whether it fills.

That ongoing part is what [TidyDisk](/) handles: it knows every `node_modules` on your Mac and your pnpm store, sizes them without hard-link double counting, flags what is stale, and cleans what you pick in one click, to the Trash. The scan is free, and it works the same whichever package manager fills your disk.
