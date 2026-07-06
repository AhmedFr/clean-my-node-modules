---
title: "Why you should never rm -rf node_modules (use the Trash)"
description: "rm -rf has no undo, and node_modules cleanup is exactly where tired-hands mistakes happen. The case for Trash-based deletion, with commands."
date: "2026-08-29"
---

`rm -rf node_modules` is one of the most-typed commands in JavaScript development. It works, it is fast, and roughly once a career it destroys something that mattered. This article is the case for breaking the habit, and what to type instead.

## The failure mode is not hypothetical

`rm -rf` deletes immediately, recursively, silently, and permanently. There is no confirmation, no undo, and no recovery short of forensic tools or backups. Combined with shell autocomplete and muscle memory, the classic accidents look like this:

```bash
rm -rf node_modules   # fine, in the right directory
rm -rf node_module s  # a space: deletes node_module AND s, or errors if lucky
rm -rf ./node_modules # typed in ~ instead of the project? nothing to stop you
rm -rf $DIR/node_modules  # $DIR unset: this is rm -rf /node_modules
```

The unset-variable case has burned enough people that it is a cliche. None of these are skill issues; they are tiredness issues, and everyone is tired sometimes. The command's blast radius is unlimited and its speed is instant, which is exactly the wrong combination for a routine chore.

## The Trash exists for this

macOS has had a recoverable delete for forty years. Files in the Trash cost you nothing until you empty it, and they have saved uncountable mistakes. Dev tooling mostly ignores it because the POSIX-flavored path (`rm`) predates it and because writing to the Trash from a script takes one more line. That is a bad trade: the whole point of deleting `node_modules` is that it is low-stakes, and Trash-based deletion is what actually makes it low-stakes even when you pick the wrong folder.

Command-line options on macOS:

```bash
# Finder via AppleScript (works everywhere, no install)
osascript -e 'tell app "Finder" to delete POSIX file "'$PWD'/node_modules"'

# Homebrew tool, nicer ergonomics
brew install trash
trash node_modules
```

On modern macOS there is also a native `trash` command in some versions; `brew install trash` covers the rest. Both give you the same contract: the delete is instant from your project's point of view, and reversible from yours.

If you want the habit to stick, alias it:

```bash
alias rmnm='trash ./node_modules && echo "node_modules moved to Trash"'
```

## "But node_modules is disposable anyway"

True, [and it is why deleting it is safe at all](/blog/how-to-delete-node-modules-safely): everything comes back with `npm install`. The argument here is not about `node_modules` itself. It is about what is next to it when your fingers slip. The folder you meant to type, the sibling directory autocomplete grabbed, the path a variable failed to fill in. Trash-based deletion means the worst case of a cleanup session is dragging a folder back out, instead of explaining to yourself where three weeks of an unpushed branch went.

There is also a subtler point: habits transfer. The hands that `rm -rf node_modules` daily are the same hands that will one day type `rm -rf` next to something irreplaceable. Making the recoverable delete your default is cheap insurance across everything you do.

## What about the disk space?

Files in the Trash still occupy disk until you empty it, and if you are cleaning up to free space, that matters. The workflow is still better than rm: delete to the Trash, confirm your projects are fine, then empty the Trash deliberately (or let macOS's 30-day auto-empty do it). Separating "remove from project" from "destroy the bytes" is precisely what makes the process safe.

## Our bias, stated plainly

We built [TidyDisk](/) around this principle: every cleanup it performs goes through the macOS Trash, never through `rm -rf`, no exceptions. It finds every `node_modules` on your Mac, shows real sizes (including [honest pnpm accounting](/blog/pnpm-store-explained)), and cleans what you choose in one click that you can undo. The scan is free; the one-click cleanup is a 19 euro lifetime license.

Whether or not you ever install it, take the habit: on a Mac, deletion you can undo is strictly better than deletion you cannot. Alias `trash`, retire `rm -rf` from your daily rotation, and save it for the rare day you truly need it.
