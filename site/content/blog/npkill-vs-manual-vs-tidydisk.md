---
title: "npkill vs manual cleanup vs TidyDisk: which should you use?"
description: "An honest comparison of the three ways to clean node_modules on a Mac: raw terminal commands, the npkill CLI, and the TidyDisk menu bar app."
date: "2026-08-15"
---

There are three reasonable ways to reclaim the disk space your JavaScript projects hoard: do it by hand in the terminal, use a CLI tool built for the job, or run an app that watches continuously. We build one of the three, so discount accordingly, but here is the honest comparison, including the cases where the answer is not us.

## Option 1: manual terminal commands

The zero-install option. Find and size everything:

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + | sort -rh
```

Then delete what you choose. Full command patterns are in [our guide to finding every node_modules folder](/blog/find-node-modules-folders-mac).

**Strengths:** No dependencies, works everywhere, scriptable, you see exactly what happens.

**Weaknesses:** You have to remember to do it. Sizing is slow on big disks, `du` double-counts pnpm hard links (details [here](/blog/pnpm-store-explained)), the staleness check is a shell contortion, and the natural deletion tool is `rm -rf`, which has no undo. Realistically, most people do this once, feel great, and never do it again.

**Best for:** one-off cleanups, remote servers, people who live in the terminal and like it that way.

## Option 2: npkill

[npkill](https://npkill.js.org/) is a well-made open source CLI: run `npx npkill`, it scans from the current directory, lists every `node_modules` with its size, and you delete with the space bar. It is free, it is fast to start, and it deserves its popularity.

**Strengths:** Free, no install (runs via npx), interactive and much friendlier than raw find/du, shows last-modified info, cross-platform.

**Weaknesses:** Still a session you have to remember to run. It scans from where you launch it, so folders outside that tree are missed. Deletion is immediate and permanent rather than to the Trash (there is no undo if you pick the wrong row). It covers `node_modules` only: no pnpm store awareness, and hard-linked pnpm folders report sizes that overstate what deletion will free.

**Best for:** developers who want a free, occasional, interactive cleanup and are comfortable in a terminal.

## Option 3: TidyDisk

[TidyDisk](/) is a macOS menu bar app. It scans continuously rather than on demand: every `node_modules` folder, your pnpm store, and your installed packages, sized correctly (it accounts for pnpm hard links instead of double-counting them) and ranked by staleness. Cleanup is one click, and everything goes to the Trash, never through `rm -rf`, so any mistake is reversible. The scan is free; one-click cleanup is a 19 euro lifetime license.

**Strengths:** The number is always current, no session to remember. pnpm-aware sizing. Trash-based deletion with real undo. Staleness ranking built in. No terminal needed.

**Weaknesses:** macOS only. The cleanup click costs money (once). People who want a scriptable, pipeable tool will prefer a CLI.

**Best for:** Mac developers who want the problem handled continuously rather than heroically, and anyone who has ever fat-fingered an `rm -rf`.

## The actual decision

| You are... | Use |
|---|---|
| Cleaning a server or CI machine | Manual commands |
| A terminal person doing a quarterly purge, free | npkill |
| On a Mac and want it continuous, safe, and one click | TidyDisk |

And two honest notes. First: if you clean twice a year and the terminal does not scare you, npkill is genuinely good and costs nothing; we would rather you use it than do nothing. Second: whatever you pick, delete to the Trash when you can and check [why rm -rf is the wrong habit](/blog/never-rm-rf-node-modules) when you cannot.

If the continuous option sounds like your speed, [download TidyDisk](/) and run the free scan. You will know your number in about a minute, and the first number is usually the convincing one.
