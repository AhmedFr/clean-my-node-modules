# TidyDisk launch copy pack (#28)

Final copy for the launch wave. Everything here is paste-ready. House rules: no em dashes,
no hype words HN allergic ("revolutionary", "game-changing"), prices always "19 euros
founding, 29 after launch". Product facts: free scan, one-time lifetime license via Polar,
signed + notarized, Apple Silicon macOS, MIT source, Trash never rm -rf, anonymous
analytics with a Settings opt-out.

---

## 1. Soft-launch tweet (post TODAY, Saturday)

> I built a Mac menu bar app that shows how much disk your dev junk is really eating.
> Ran it on my own machine after months of "cleaning up manually". The result hurt.
>
> [attach your own damage card image]
>
> Scan is free: tidydisk.app

Follow-up reply under it:

> The scan finds every node_modules folder, your pnpm store, and every package you have
> installed anywhere. Cleanup is one click, everything goes to the Trash, never rm -rf.
> One-time 19 euro license, founding price.

---

## 2. Show HN (Tuesday ~8am PT)

**Title:** `Show HN: TidyDisk – see how much disk your dev junk is really wasting`

**Body:**

> I kept running out of space on a 512 GB Mac and it was never my photos. It was
> gigabytes of node_modules, package manager caches, and build junk I forgot existed.
>
> So I built a menu bar app that scans for all of it and shows the real number, then
> clears it safely: everything goes to the Trash, never rm -rf.
>
> The technically interesting part was pnpm: on macOS, pnpm clones files copy-on-write
> with APFS, which makes hard-link counting useless for dedup detection (nlink is 1 on
> clones, and Apple exposes no API to tell a clone from a copy). TidyDisk measures the
> .pnpm subtree structurally instead, so it reports what deleting a node_modules folder
> would actually free versus what stays shared in the global store. Most cleaners get
> this wrong and overpromise reclaimed space.
>
> It also builds a machine-wide inventory of every package you have installed across
> projects, with versions, sizes, and security advisories from the npm registry.
>
> The scan is free. One-click cleanup is a one-time 19 euro license (founding price).
> Source is MIT on GitHub. macOS on Apple Silicon.
>
> https://tidydisk.app

**Prepared answers for the comments (paste as replies, adapt tone):**

- *"Why is it paid if it's MIT?"* > The code is open and you can build it yourself, gate
  and all, it's one `pnpm package` away. The 19 euros buys the signed and notarized
  build, instant license delivery, and funding for the roadmap (Docker images, Xcode
  DerivedData, build folders). Think of it as sponsorship with a receipt.
- *"Telemetry?"* > Anonymous usage analytics, on by default, one-click opt-out in
  Settings. It never captures file paths, project names, or package names, and that is
  enforced in code, not policy: the analytics layer only accepts flat numeric counters.
  Scan contents never leave your machine.
- *"Why not just npkill / du / GrandPerspective?"* > All great, I used them. The
  differences: honest pnpm math (see above), the machine-wide package inventory with
  advisories, scheduled background scans with a threshold alert, and deletion to the
  Trash so a mistake is reversible.
- *"License check?"* > Key validates online at activation and re-checks about weekly,
  with a 30-day offline grace window. No account, the key is the whole identity.
- *"Intel Mac?"* > Apple Silicon only right now. If there is demand I will add a
  universal build, it is an electron-builder flag plus CI minutes.

---

## 3. Reddit (Tuesday, after HN is up)

Targets: r/webdev, r/node, r/javascript, r/reactjs, r/macapps, r/SideProject.
One post per sub, spaced through the day, adapt the first line to the sub. Lead with
the finding, not the product. Link in a comment where sub rules require.

**Title:** `I measured node_modules across all my projects. The total made me a little sick.`

**Body:**

> [your damage card image]
>
> Turns out "my Mac is full" almost never means photos for developers. Mine was
> node_modules folders from projects I had not touched in months, plus a pnpm store I
> never thought about, plus caches on top.
>
> I built a small menu bar app (TidyDisk) that finds all of it and shows the honest
> freeable size. The pnpm part was genuinely tricky: APFS clones make hard links
> invisible, so most tools overcount what you would get back. It measures the shared
> store separately so the number is what you actually free.
>
> The scan is free if you want to check your own damage: tidydisk.app
> Cleanup is one click and goes to the Trash, never rm -rf.
>
> What is YOUR number? Post the card, I want to see the worst one.

The last line matters: it turns the thread into a leaderboard of damage cards, each one
carrying the brand and the domain.

---

## 4. Product Hunt (schedule Monday for Tuesday 12:01am PT)

- **Name:** TidyDisk
- **Tagline:** `See what is eating your dev disk. Reclaim it in one click.`
- **Topics:** Developer Tools, Mac, Productivity
- **Description:**

> TidyDisk lives in your macOS menu bar and shows what your dev projects really cost:
> every node_modules folder, your pnpm store, and every package installed anywhere on
> your machine, with versions and security advisories. Cleanup is one click and always
> goes to the Trash, never rm -rf. The scan is free forever. One-click cleanup is a
> one-time 19 euro lifetime license (founding price). MIT source on GitHub.

- **Gallery (in order):** 1) damage-reveal screenshot, 2) share card image, 3) launcher
  Projects tab, 4) Packages tab with advisory pills, 5) the 10s showcase video,
  6) pricing card from tidydisk.app. Capture 1-4 with `pnpm demo` seeded data, then
  `pnpm demo --restore`.
- **First comment (maker):**

> Hey PH! Solo dev here. TidyDisk started as a rage project after my third "clean up
> the Mac by hand" Saturday. The hard part was making the numbers honest: pnpm shares
> packages across projects via APFS clones, so naive cleaners promise space they cannot
> free. TidyDisk measures the shared store separately, so when it says you will get
> 12 GB back, you get 12 GB back.
>
> The scan is free, today's founding price for lifetime cleanup is 19 euros (goes to 29
> after launch), and there is a 30-day money-back, no questions.
>
> I will be here all day. Post your damage card, I want to crown the messiest machine.

---

## 5. dev.to / Hashnode article (publish Tuesday, evergreen SEO)

**Title:** `How much disk is node_modules actually costing you? (and why your cleaner is lying)`

**Outline + key passages:**

1. Hook: the 512 GB Mac that was always full, the manual cleanup Saturdays.
2. The anatomy of dev junk: node_modules per project, the global pnpm store, package
   manager caches, build outputs. Typical numbers per category.
3. **The APFS lie** (the technical meat, this is what gets it shared): why hard-link
   counting fails on macOS (copy-on-write clones report nlink 1, no API distinguishes a
   clone from a copy), why "you will free 40 GB" is often "you will free 9 GB", and how
   measuring the .pnpm subtree structurally fixes it.
4. What to do about it manually: the honest du incantations, npkill, pnpm store prune,
   and their sharp edges (rm -rf is forever).
5. TidyDisk exists because I got tired of doing step 4: free scan, one-click cleanup to
   the Trash, machine-wide package inventory with advisories. tidydisk.app.
6. Close with the share card: "run the free scan and post your number".

---

## 6. X thread (Tuesday, after HN)

1/ Your Mac is not full because of photos. It is full because of this:
[damage card image]

2/ Every project you have ever cloned left a node_modules behind. Average one is
200 MB to 2 GB. They do not clean themselves up.

3/ The sneaky part: if you use pnpm, most disk tools lie to you. APFS clones hide the
sharing, so "delete this to free 4 GB" often frees a fraction of that. I wrote a
scanner that measures the shared store separately, so the number is honest.

4/ I turned it into a menu bar app: TidyDisk. Free scan shows every folder, cache, and
package on your machine. Cleanup is one click, straight to the Trash, reversible.

5/ Founding price for lifetime cleanup is 19 euros this week, then 29. Scan is free
forever: tidydisk.app

6/ Run the scan and reply with your damage card. Worst machine gets a free license and
public admiration.

---

## 7. Objection crib sheet (for any channel)

| Objection | Answer |
| --- | --- |
| Electron, ew | It is a menu bar app that idles at ~0% CPU and scans with `du`. The UI being web tech is how one person ships signed macOS software with 156 tests. |
| Just use `find . -name node_modules -exec rm -rf` | Enjoy the day you paste that with a typo. TidyDisk goes to the Trash, shows real-vs-shared sizes first, and never touches projects you used recently. |
| Free alternatives exist | Yes, and the scan here is also free. You pay for one-click, honest math, and not thinking about it again. |
| Why online license check | Instant delivery and real refunds (revoked keys). 30-day offline grace, no account, the key is the identity. |
| Roadmap? | Docker images, Xcode DerivedData, build folders (.next, dist, target). Founding buyers get everything. |

## Timing checklist

- Sat: soft tweet + 1-2 Discords. Publish v1.0.0. Funnel rehearsal.
- Mon: schedule PH, final asset check, charge the comment battery.
- Tue 12:01am PT: PH live. ~8am PT: Show HN. Then Reddit spaced through the day, X thread.
- All day Tue: reply to everything within minutes. Speed of response is conversion.
