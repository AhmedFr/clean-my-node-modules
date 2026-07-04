---
title: "How to delete node_modules safely and get gigabytes back"
description: "A practical guide to deleting node_modules folders without breaking anything: what is safe, what to check first, and how to do it in seconds."
date: "2026-07-04"
---

Every JavaScript project you have ever cloned left something behind: a `node_modules` folder that can easily weigh 200 MB to over 1 GB. Multiply that by the dozens of projects sitting in your `~/code` or `~/dev` folder and you are often looking at 20, 50, sometimes 100 GB of disk space held by dependencies you have not touched in months.

The good news: `node_modules` is 100% disposable. The better news: you can get it all back in seconds when you need it.

## Why deleting node_modules is always safe

`node_modules` contains nothing original. It is a materialized copy of what your `package.json` and lockfile (`package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`) describe. Your code, your configuration, and your dependency versions all live outside of it.

That means the recovery path is always the same:

```bash
npm install   # or yarn, or pnpm install
```

Run that in the project folder and the entire `node_modules` tree comes back, byte for byte equivalent as far as your project is concerned, because the lockfile pins every version.

There are only two things worth checking before you delete:

1. **Is the project running right now?** Stop dev servers and watchers first. A running process with open file handles inside `node_modules` can behave strangely when the folder disappears under it.
2. **Do you have the lockfile committed?** If yes (you almost certainly do), reinstalling reproduces the exact same dependency tree. If the project has no lockfile, the reinstall still works but may resolve slightly newer versions.

That is the entire checklist. There is no state, no cache you will regret losing, no configuration inside `node_modules` that matters.

## How much space are we talking about?

Check a single project:

```bash
du -sh ./node_modules
```

Typical results range from 150 MB for a small library to 1.5 GB and beyond for a full-stack app with a bundler, a test runner, and a UI framework. If you want to see the total across everything you have, this finds every `node_modules` on disk and sizes it:

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} +
```

On a machine used daily for JavaScript work for a year or two, totals of 30 to 80 GB are completely normal. We wrote more about where all that weight comes from in [Why is node_modules so huge?](/blog/why-is-node-modules-so-huge).

## The manual way

For a single project, the classic approach:

```bash
cd ~/code/old-project
rm -rf node_modules
```

It works, but we recommend against `rm -rf` as a habit, for one simple reason: it is instant and irreversible. Type the wrong path, autocomplete the wrong folder, and there is no undo. Moving the folder to the Trash instead keeps a safety net:

```bash
# macOS: move to Trash instead of destroying immediately
osascript -e 'tell app "Finder" to delete POSIX file "'$PWD'/node_modules"'
```

Clunky, but recoverable. Anything that deletes developer files should default to recoverable.

## The batch problem

Deleting one folder is easy. The real problem is the other 40 projects you forgot about: the tutorial you followed in March, the take-home assignment from your last job hunt, the three abandoned side projects. Each one quietly holds hundreds of megabytes.

Finding them all, checking when you last touched each project, sizing each folder, and deciding what is safe to remove is exactly the kind of chore that never gets done by hand.

You can script it, and plenty of developers do. There are also CLI tools built for this. But if you want it to be a 10-second decision instead of a terminal session, this is precisely what we built [TidyDisk](/) for: it lives in your macOS menu bar, continuously knows where every `node_modules` folder is, how big it is, and how stale the project is, and lets you clean the ones you pick in one click. Everything goes to the Trash, never through `rm -rf`, so a mistake costs you nothing.

## What about the pnpm store and global caches?

If you use pnpm, deleting a project's `node_modules` frees less than you might expect, because pnpm hard-links files from a global content-addressable store. The store itself is cleaned separately with `pnpm store prune`. We cover that whole topic in [The pnpm store explained](/blog/pnpm-store-explained).

npm and yarn also keep global caches (`~/.npm`, `~/Library/Caches/Yarn`) that survive project deletions by design. Those are a separate cleanup with their own rules.

## The habit that keeps your disk clean

A simple routine that takes under a minute a month:

1. List projects you have not touched in 60+ days.
2. Delete their `node_modules` (to the Trash).
3. Reinstall on demand the day you actually return to one of them.

The cost of being wrong is one `npm install` and a coffee break. The payoff is tens of gigabytes back, permanently, because stale projects rarely come back to life.

If you would rather have that routine automated, [TidyDisk](/) does the scan for free: install it, and it shows you exactly how many gigabytes your `node_modules` folders are holding right now. Cleaning them in one click is a 19 euro lifetime license, and the scan alone usually pays for the download in saved surprise.
