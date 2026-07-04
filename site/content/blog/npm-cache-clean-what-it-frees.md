---
title: "npm cache clean: what it actually frees (and what it does not)"
description: "What lives in the npm cache, when npm cache clean --force helps, why verify is usually better, and where the real disk savings are."
date: "2026-08-01"
---

`npm cache clean --force` is the first command most people reach for when npm-related disk usage gets out of hand. It is rarely the right one. Here is what the npm cache actually contains, what cleaning it frees, and where the space you are looking for really lives.

## What is in the npm cache

npm keeps a content-addressable cache at `~/.npm` (specifically `~/.npm/_cacache`). Every package tarball npm has ever downloaded is stored there, along with registry metadata. Its job is to make repeat installs fast and to let installs work offline.

Size yours:

```bash
du -sh ~/.npm
```

Typical sizes run from a few hundred megabytes to several gigabytes on machines with long npm histories.

Two properties matter:

1. **It is self-healing.** Data is verified by checksum on the way out; corrupted entries are re-fetched automatically. The historical reasons for routinely cleaning the cache mostly disappeared with npm 5.
2. **It is shared.** One cache serves every project. Deleting it slows down the next install of everything.

## What cleaning actually does

```bash
npm cache clean --force
```

This deletes the entire cache. The `--force` flag is required precisely because the npm team considers manual cleaning almost never necessary. You free the size of `~/.npm` once, and then installs start refilling it immediately, each one slower than it would have been because tarballs must be re-downloaded.

The gentler tool is:

```bash
npm cache verify
```

This checks integrity, garbage-collects unneeded data, and reports what it reclaimed, without throwing away valid entries. If you feel the cache is bloated, run `verify` first; it often trims a meaningful slice while keeping installs fast.

## When clean --force is actually right

- You are reclaiming space on a machine you are retiring from JavaScript work.
- The cache has grown past what your disk can afford and you accept slower installs.
- You are debugging a genuinely corrupted cache that `verify` cannot fix (rare).

Outside those cases, the cache is one of the few pieces of dev disk usage that earns its keep daily.

## Where the real space is

Here is the comparison that matters. On a typical dev machine:

| Location | Typical size | Cost of deleting |
|---|---|---|
| `~/.npm` cache | 0.5 to 3 GB | Slower future installs |
| All `node_modules` folders | 20 to 80 GB | One `npm install` per revived project |
| pnpm store (if used) | 2 to 15 GB | Re-download on next install after prune |

The cache is usually the smallest of the three and the only one with an ongoing performance benefit. Stale `node_modules` folders are ten to thirty times larger and give you nothing back. If you have fifteen minutes for disk cleanup, the cache is the last place to spend it. Start with [finding every node_modules folder on your Mac](/blog/find-node-modules-folders-mac), delete the stale ones, and if you use pnpm, run `pnpm store prune` as described in [The pnpm store explained](/blog/pnpm-store-explained).

Yarn users: the equivalent cache lives at `~/Library/Caches/Yarn` and is cleaned with `yarn cache clean`; the same logic applies.

## A sane cleanup order for npm users

1. Delete stale project `node_modules` folders (the big win, fully recoverable).
2. Run `npm cache verify` (free trim, no downside).
3. Only reach for `npm cache clean --force` when you need the last gigabyte and accept the cost.

If step 1 sounds tedious, that is the part [TidyDisk](/) automates: a free scan shows every `node_modules` on your Mac, sized and sorted by staleness, and one click sends the ones you choose to the Trash. The 19 euro lifetime license pays for itself the first time it saves you from doing this list by hand.
