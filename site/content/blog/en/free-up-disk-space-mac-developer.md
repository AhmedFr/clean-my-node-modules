---
title: "Free up disk space on a Mac: the developer's checklist"
description: "A prioritized checklist for developers: node_modules, package caches, Xcode junk, Docker images, simulators, and browser caches, with real commands."
date: "2026-08-08"
---

Developer Macs fill up differently from normal Macs. The usual advice (empty the Trash, clear Downloads, offload photos) barely dents the problem, because the weight is in places Finder never shows you. This is the checklist we actually use, ordered by gigabytes-per-minute-of-effort.

## 1. Stale node_modules folders (usually the biggest win)

If you do JavaScript work, start here. Every project you ever cloned keeps a 200 MB to 1.5 GB dependency folder until you delete it, and all of it is reproducible from the lockfile with one `npm install`.

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + 2>/dev/null | sort -rh | head -20
```

Delete the ones belonging to projects you have not touched in two months. Full instructions and safety notes are in [How to delete node_modules safely](/blog/how-to-delete-node-modules-safely), and [TidyDisk](/) automates the whole loop from your menu bar if you would rather not do it manually. Typical recovery: **10 to 50 GB**.

## 2. Package manager stores and caches

```bash
pnpm store prune        # pnpm: removes unreferenced packages
npm cache verify        # npm: garbage-collects the cache safely
yarn cache clean        # yarn classic: clears ~/Library/Caches/Yarn
```

pnpm users should prune after deleting old projects, not before, so the prune can release everything the deleted projects were referencing (details in [The pnpm store explained](/blog/pnpm-store-explained)). Typical recovery: **2 to 10 GB**.

## 3. Xcode: the other black hole

Even if you only build one iOS app occasionally, Xcode accumulates staggering amounts of derived state:

```bash
du -sh ~/Library/Developer/Xcode/DerivedData
du -sh ~/Library/Developer/Xcode/iOS\ DeviceSupport 2>/dev/null
du -sh ~/Library/Developer/CoreSimulator
```

- **DerivedData** is a build cache; deleting it costs one slow rebuild. Often 5 to 20 GB.
- **iOS DeviceSupport** keeps debug symbols for every iOS version of every device you ever plugged in. Old versions are dead weight.
- **Simulators**: `xcrun simctl delete unavailable` removes simulators for runtimes you no longer have.

Typical recovery: **10 to 40 GB** on machines that build for Apple platforms.

## 4. Docker

Docker Desktop's disk image grows and rarely shrinks on its own:

```bash
docker system df                 # see what is used
docker system prune -a --volumes # remove unused images, containers, volumes
```

Read the warning before running the second command: `-a` removes all images not attached to a running container, and `--volumes` removes unreferenced volumes, including data you might want. Prune without `--volumes` first if unsure. Typical recovery: **5 to 30 GB**.

## 5. Homebrew

```bash
brew cleanup -s
du -sh $(brew --cache)
```

Homebrew keeps old versions and downloads around; `cleanup -s` clears both. Typical recovery: **1 to 5 GB**.

## 6. Everything else worth a look

```bash
du -sh ~/Library/Caches/* 2>/dev/null | sort -rh | head -15
```

Frequent finds: browser caches, Slack and Electron app caches, old iOS/Android emulator images from side projects, `~/Library/Caches/Google/AndroidStudio*`, and gigabytes of `pip`/`cargo`/`go` module caches (`pip cache purge`, `cargo cache -a` with the cargo-cache tool, `go clean -modcache`).

## The order matters

Work the list top to bottom. The first two items are pure recoverable state with near-zero cost; the Xcode and Docker items cost one rebuild or re-pull; the deeper cache cleaning trades future speed for space. Stop when you have the headroom you need.

## Keeping it clean

The uncomfortable truth about disk cleanup is that it is a subscription, not a purchase. Six weeks after a heroic cleaning session, the same folders are heavy again. Checklists do not run themselves.

For the JavaScript-shaped part of the problem (which is usually the largest), [TidyDisk](/) turns the checklist into a glance: it lives in the menu bar, continuously tracks every `node_modules` folder and your pnpm store, and cleans what you pick in one click, always to the Trash. The scan is free and takes about a minute; seeing your number is usually motivation enough.
