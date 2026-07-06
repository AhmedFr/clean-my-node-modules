---
title: "How to find every node_modules folder on your Mac"
description: "Terminal commands to locate and size every node_modules folder on macOS, sort them by size and staleness, and decide what to delete."
date: "2026-07-25"
---

Before you can clean up, you need to know what is there. Most developers guess they have "a few" `node_modules` folders and discover dozens. This guide gives you the exact commands to find all of them, size them, and rank them by how safe they are to delete.

## The basic find

Start from the folder where your projects live (adjust `~/code` to your layout):

```bash
find ~/code -name node_modules -type d -prune
```

The `-prune` flag matters: it stops `find` from descending into each `node_modules` it finds, which skips the nested `node_modules` inside dependencies (those disappear with their parent anyway) and makes the command dramatically faster.

If your projects are scattered, search your whole home folder. Expect this to take a while on a large disk:

```bash
find ~ -name node_modules -type d -prune 2>/dev/null
```

The `2>/dev/null` hides permission errors from system folders you cannot read anyway.

## Add sizes

Pipe each hit through `du`:

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + 2>/dev/null | sort -rh
```

`sort -rh` puts the biggest folders on top. On a machine with a year of active JavaScript work, the top of this list is usually a shock: individual folders of 800 MB to 2 GB, and totals in the tens of gigabytes.

For the single total number:

```bash
find ~/code -name node_modules -type d -prune -exec du -sk {} + 2>/dev/null | awk '{s+=$1} END {printf "%.1f GB\n", s/1048576}'
```

One caveat if you use pnpm: hard links make these numbers overcount, sometimes badly. The bytes are shared with the global store, and deleting a project frees less than `du` suggests. The details are in [The pnpm store explained](/blog/pnpm-store-explained).

## Rank by staleness

Size tells you what is worth deleting; age tells you what is safe. A `node_modules` you have not touched in six months belongs to a project you are probably not coming back to soon, and reinstalling later costs one `npm install`.

This lists each project folder with the last time anything in the project (excluding `node_modules` itself) was modified:

```bash
for nm in $(find ~/code -name node_modules -type d -prune); do
  proj=$(dirname "$nm")
  last=$(find "$proj" -path "$proj/node_modules" -prune -o -type f -newer "$nm" -print -quit 2>/dev/null)
  mod=$(stat -f "%Sm" -t "%Y-%m-%d" "$proj")
  size=$(du -sh "$nm" 2>/dev/null | cut -f1)
  echo "$mod  $size  $proj"
done | sort
```

Anything at the top of that list (oldest first) with a fat size column is a prime candidate. Deleting is safe because `node_modules` is always reproducible from the lockfile, as covered in [How to delete node_modules safely](/blog/how-to-delete-node-modules-safely).

## The maintenance problem

These commands work. The trouble is that disk cleanup is not a one-time event. New projects appear, old ones go stale, and three months from now the same gigabytes are back. Nobody re-runs a five-line shell loop on a schedule.

That gap between "possible in the terminal" and "actually happens" is exactly what [TidyDisk](/) closes. It sits in your macOS menu bar and keeps the answer current: every `node_modules` folder, its true size (pnpm-aware, so no hard-link double counting), and how stale its project is, ranked and ready. When the total crosses a threshold you care about, you see it without asking.

## Decide, then delete

Whichever route you take, the decision framework is the same:

1. **Active projects (touched this week): keep.** The reinstall cost would annoy you.
2. **Recent projects (touched this month): keep unless huge.**
3. **Everything older: delete.** If you return to the project someday, `npm install` rebuilds everything in a minute or two.

And when you delete, prefer the Trash over `rm -rf`. The Trash costs nothing and turns a mistyped path from a disaster into a non-event.

Run the free scan in [TidyDisk](/) and you will have your complete, honest number in about a minute. Most first scans find 20+ GB. Getting it back is one click with a 19 euro lifetime license.
