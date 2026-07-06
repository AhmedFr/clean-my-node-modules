---
title: "Why is node_modules so huge? What is actually inside"
description: "Why a 20-line app pulls in 300 MB of dependencies: transitive packages, duplicated versions, dev tooling, and platform binaries explained."
date: "2026-07-11"
---

You write a 20-line Express server, run `npm install`, and `node_modules` lands at 180 MB with 4,000 files. The famous joke pictures `node_modules` as heavier than a black hole. But the weight is not a bug or an accident. It is the direct result of a few deliberate design choices in the npm ecosystem, and once you see them, the size stops being mysterious.

## Transitive dependencies: you install 5, you get 800

Your `package.json` lists direct dependencies. Each of those has its own dependencies, and so on down the tree. Installing a typical web framework plus a test runner plus a bundler routinely resolves to 800 to 1,500 distinct packages.

See it for yourself:

```bash
npm ls --all | wc -l
```

The npm ecosystem historically favored many small, single-purpose packages over large standard libraries. That has real benefits (focused code, independent updates) and one obvious cost: the dependency graph explodes, and every node in the graph is a folder on your disk with its own `package.json`, README, license file, and often its own tests and source maps shipped in the tarball.

## Duplication: the same package, five times

Two of your dependencies need `lodash`, but one wants `^4.17.0` and another pins `4.16.6`. Package managers using a flat `node_modules` layout (npm, yarn classic) deduplicate what they can, but any version conflict means the same library is physically copied multiple times at different depths of the tree.

Check how bad it is in a project:

```bash
npm ls lodash
npm dedupe --dry-run
```

In large apps it is common to find the same utility library present in 3 to 6 different versions. Each copy is fully materialized on disk. pnpm attacks exactly this problem with a content-addressable store and hard links, which is why the same set of projects takes dramatically less real disk space under pnpm. We break that mechanism down in [The pnpm store explained](/blog/pnpm-store-explained).

## Dev dependencies outweigh your app

The runtime dependencies of most apps are modest. What is heavy is the toolchain: TypeScript ships a ~60 MB compiler, bundlers and their plugin ecosystems add tens of megabytes, test runners bring their own parsers and instrumentation, linters carry full ASTs for every syntax they support.

A quick way to feel the difference:

```bash
npm install --omit=dev
du -sh node_modules
```

Production-only installs are frequently 3 to 10 times smaller than the full development install. The 1 GB `node_modules` is mostly the workshop, not the product.

## Platform binaries: the silent heavyweights

Some packages ship precompiled native binaries for every platform and architecture they support: image processing (sharp), headless browsers (puppeteer downloads a full Chromium at ~170 MB), database drivers, SWC and esbuild with per-platform binaries. A handful of these can double the size of an otherwise ordinary project.

Find the heavy hitters inside any `node_modules`:

```bash
du -sh node_modules/* node_modules/.pnpm 2>/dev/null | sort -rh | head -20
```

Run that in one project and you will usually find 5 packages responsible for half the total.

## Files that exist for no runtime reason

Package tarballs frequently include documentation, example folders, test suites, TypeScript sources alongside compiled output, and source maps. None of it is needed to run your app, all of it is unpacked to your disk. Multiply small waste by 1,200 packages and it stops being small.

## So is the size a problem?

For a single active project: not really. Disk is cheap, and the toolchain earns its megabytes daily.

The real cost shows up in aggregate. Every project you ever cloned keeps its own full copy of this weight forever, whether you opened it last week or last year. Ten stale projects at 500 MB each is 5 GB of pure dead weight, and most working developers have far more than ten. That aggregate is the thing worth cleaning, and it is completely safe to clean because `node_modules` is always reproducible from the lockfile, as we covered in [How to delete node_modules safely](/blog/how-to-delete-node-modules-safely).

If you want to know your own number, [TidyDisk](/) scans your Mac for free and shows every `node_modules` folder, sized and sorted, with the stale ones flagged. Most people find 20+ GB on the first scan. Reclaiming it is one click and a 19 euro lifetime license, and everything goes to the Trash, so nothing is ever lost by mistake.
