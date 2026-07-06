---
title: "The pnpm store explained: where your disk space really goes"
description: "How pnpm's content-addressable store and hard links actually work, why du lies to you about project sizes, and how to clean the store safely."
date: "2026-07-18"
---

pnpm's headline feature is disk efficiency: install the same dependency in ten projects and it is stored on disk once. It delivers on that promise, but it also makes disk usage genuinely confusing. Tools report sizes that seem contradictory, cleanup intuition from npm stops applying, and the place where your space actually went is a folder most people have never opened.

## The two-level design

pnpm splits installation into two layers:

1. **The global store**, at `~/Library/pnpm/store` on macOS (check yours with `pnpm store path`). Every version of every package you have ever installed lives here exactly once, stored by content hash.
2. **Per-project `node_modules`**, which contains almost no real file data. Files inside `node_modules/.pnpm` are hard links pointing at the store, and your top-level `node_modules` entries are symlinks into `.pnpm`.

A hard link is not a copy. It is a second directory entry for the same bytes on disk. Ten projects hard-linking the same `react` package share one physical copy.

## Why du misleads you

Run `du -sh node_modules` in a pnpm project and you might see 800 MB. Delete that project and you may recover only 40 MB. Both numbers are honest; they answer different questions.

`du` counts the size of every file it can reach. It does not know (unless you compare inode counts across the whole disk) that 760 of those megabytes are hard links shared with the store and possibly with five other projects. The bytes are only truly freed when the last reference disappears, and the store always holds a reference until you prune it.

The practical consequences:

- **Deleting one pnpm project frees little.** The store still holds everything.
- **Summing `du` across pnpm projects wildly overcounts.** The same bytes are counted once per project.
- **The store itself is where the real bytes live.** Size it with `du -sh $(pnpm store path)`.

On APFS (the default macOS filesystem) there is a second twist: clones. Two files can share storage without even sharing an inode, which makes them invisible to both `du` and hard-link counting. Accurate accounting on modern macOS is genuinely hard, which is why naive disk tools get pnpm setups so wrong.

## Cleaning the store the right way

The store grows forever by default: every version of every package you ever installed stays, including packages no project references anymore. The built-in cleanup:

```bash
pnpm store prune
```

This removes packages that no project currently links to. It is completely safe: anything still referenced is kept, and anything removed would be re-downloaded on the next install that needs it. On a machine with a year of pnpm history, a first prune commonly frees several gigabytes.

Two related commands worth knowing:

```bash
pnpm store path     # where is my store?
pnpm store status   # verify store integrity
```

## What this means for cleanup strategy

If you are a pnpm user, the cleanup priorities flip compared to npm:

1. **Prune the store first.** That is where the dead weight concentrates.
2. **Then delete stale project `node_modules`.** Each one frees its unshared files immediately and releases references so the next prune can free more.
3. **Do not trust per-project `du` numbers.** They are upper bounds, often loose ones.

The order matters: deleting projects and then pruning frees the most, because prune can only remove what nothing links to anymore.

This measurement problem is also one of the reasons we built [TidyDisk](/) the way we did. It understands pnpm's layout: it sizes the store's real contents rather than double-counting hard links across projects, so the gigabytes it reports are gigabytes you actually get back. The scan is free, and cleanup always goes to the Trash, never through `rm -rf`, a habit we explain in [Why you should never rm -rf node_modules](/blog/never-rm-rf-node-modules).

## The bottom line

pnpm genuinely saves disk space, often dramatically. But it relocates the problem rather than eliminating it: the store accumulates every package version forever until you prune it, and standard sizing tools cannot see through the hard links. Learn `pnpm store prune`, run it after deleting old projects, and be suspicious of any tool that reports pnpm project sizes without mentioning the store.

Want to see your real number? [TidyDisk](/) shows your store, every project, and every stale `node_modules` in one list, free to scan, 19 euro once if you want the one-click cleanup.
