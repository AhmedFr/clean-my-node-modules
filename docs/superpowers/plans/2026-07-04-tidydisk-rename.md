# TidyDisk Rename + Honest Copy Implementation Plan (#26)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the product to TidyDisk everywhere users can see it (app, packaging, README, landing site) and replace every claim the analytics/licensing pivot made false ("no telemetry", "nothing leaves your Mac", "$0 / every feature, no gates") with honest copy including the €19 offer. This is the RELEASE GATE for PR #30.

**Architecture:** Pure copy/config changes plus one structural section rebuild (the site's Download section becomes Free-scan + €19-Pro cards). No behavior changes; the only logic-adjacent edits are packaging identifiers. Branch `feat/tidydisk-rename` already contains the app (from feat/license-gate) merged with the site (from feat/landing-v0.2-features).

**Tech Stack:** Existing Electron app + Next.js site. No new dependencies.

## Global Constraints

- **No em dashes in ANY user-visible string** (app copy, README, site copy, OG card). Use commas, colons, periods.
- Name is exactly **TidyDisk** (one word, capital T and D). Domain: **https://tidydisk.app** (live).
- Checkout: `https://buy.polar.sh/polar_cl_znfuYWAHA5D9fRlZZ7FYmumBJGGmmSMpSIXdB1JE4y1` (already `BUY_URL` in `src/shared/license.constants.ts`; the site gets its own copy in `site/lib/links.ts` because site/ is a separate package).
- Pricing copy verbatim where prices appear: **19 euros / €19, one-time lifetime license, founding price (29 euros after launch), 30-day money-back, instant key delivery**. Scan is free forever; source stays MIT on GitHub (both remain true and stay in copy).
- Honesty floor: nowhere may the copy claim "no telemetry", "nothing leaves your Mac", "no accounts, no cloud", "every feature, no gates". The honest replacement framing: scans stay on the Mac; anonymous usage analytics with an opt-out; weekly online license check.
- The Settings hint "Anonymous usage events help improve the app. No file paths or project names, ever" is TRUE and stays unchanged.
- Deliberately OUT of scope: userData migration (installed base ~0), tray/app glyph evolution, video/ Remotion assets (#28), GitHub repo rename (user's call), STATUS legacy log entries (history stays as written).
- Work on branch `feat/tidydisk-rename`. pnpm. App gates: `pnpm typecheck && pnpm lint && pnpm test`. Site gates (run inside `site/`): `pnpm typecheck && pnpm lint && pnpm build` (site has its own lockfile; run `pnpm install` there first if needed).

---

### Task 1: App, packaging, README

**Files:** `package.json`, `src/renderer/panel.html`, `src/renderer/launcher.html`, `src/main/tray/tray.ts`, `src/main/actions/app-actions.ts`, `src/main/notifications/threshold-notifier.ts`, `src/renderer/src/launcher/views/SettingsView.tsx`, `src/renderer/src/launcher/views/Onboarding/WelcomeStep.tsx`, `docs/SIGNING.md`, `README.md`

- [ ] **Step 1: packaging identity** in `package.json`:
  - `"name": "tidydisk"`
  - `"description": "TidyDisk: macOS menu bar app that shows what your dev projects cost in disk space and reclaims it in one click"`
  - build config: `"appId": "com.ahmed.tidydisk"`, `"productName": "TidyDisk"`, dmg `"artifactName": "tidydisk-${arch}.${ext}"`
- [ ] **Step 2: exact string swaps** (preserve surrounding JSX/styles; anchor on the current strings):

| File | Current | New |
| --- | --- | --- |
| `panel.html` + `launcher.html` `<title>` | `Clean my node_modules` | `TidyDisk` |
| `tray.ts` tooltip | `'Clean my node_modules'` | `'TidyDisk'` |
| `app-actions.ts` dialog | `'Uninstall Clean my node_modules?'` | `'Uninstall TidyDisk?'` |
| `app-actions.ts` comment | `…/Clean my node_modules.app/…` | `…/TidyDisk.app/…` |
| `threshold-notifier.ts` title | `'Clean my node_modules'` | `'TidyDisk'` |
| `SettingsView.tsx` scan hint | `How often Clean scans your disk in the background` | `How often TidyDisk scans your disk in the background` |
| `SettingsView.tsx` uninstall hint | `Move Clean and its preferences to the Trash` | `Move TidyDisk and its preferences to the Trash` |
| `WelcomeStep.tsx` headline | `Clean my <span …>node_modules</span>` | `TidyDisk` (single word, keep the heading element and its non-span styling) |
| `docs/SIGNING.md` example | `dist/mac/Clean my node_modules.app` | `dist/mac/TidyDisk.app` |

- [ ] **Step 3: README rewrite.** Title `# TidyDisk`. Replace the intro (lines 1-15 region) with:

```markdown
# TidyDisk

A macOS menu bar app that shows what your dev projects really cost in disk space and
reclaims it in one click: every `node_modules` folder, your package manager caches, and
every installed package across your machine. Safely, to the Trash, never `rm -rf`.

Free to scan: install it and see everything at no cost. One-click cleanup is a one-time
**19 euro lifetime license** (founding price, 29 euros after launch, 30-day money-back),
with the key delivered instantly via [Polar](https://buy.polar.sh/polar_cl_znfuYWAHA5D9fRlZZ7FYmumBJGGmmSMpSIXdB1JE4y1).
The source is MIT on GitHub.

TidyDisk collects anonymous usage analytics (never file paths, project names, or package
names; opt out any time in Settings) and re-checks your license key online about once a
week, with a 30-day offline grace window.

## Install

Download the latest signed and notarized build from the
[**Releases**](https://github.com/AhmedFr/clean-my-node-modules/releases/latest) page
(Apple Silicon), open the DMG, and drag the app to `/Applications`. It lives in the menu
bar; there is no dock icon. From the next tagged release the DMG is named
`tidydisk-arm64.dmg`.
```

  Then, through the rest of the README: swap every remaining product-name occurrence to TidyDisk, delete the old "Free and open source. No account, no telemetry…" line if still present, keep the feature list/dev sections otherwise intact (the `window.clean` API name is code, not copy: leave it).
- [ ] **Step 4: gates + grep.** `pnpm typecheck && pnpm lint && pnpm test` green. `git grep -n "Clean my node_modules\|no telemetry" -- src package.json README.md docs/SIGNING.md` returns nothing.
- [ ] **Step 5: commit** `feat(brand): rename the app to TidyDisk + honest README`

---

### Task 2: Site rename + honest pricing

**Files (all under `site/`):** `lib/links.ts`, `app/layout.tsx`, `app/landing.css` (comment only), `app/og/page.tsx`, `components/Navbar/Navbar.tsx`, `components/Hero/Hero.tsx`, `components/Features/Features.tsx`, `components/FeatureGrid/FeatureGrid.tsx`, `components/WhyLifecycle/WhyLifecycle.tsx`, `components/Download/Download.tsx`, `components/FinalCta/FinalCta.tsx`, `components/Footer/Footer.tsx`, `public/og.png` (re-render)

- [ ] **Step 1: links.** In `lib/links.ts`: keep `REPO_URL`; change `DOWNLOAD_URL` to `` `${REPO_URL}/releases/latest` `` with comment `// direct .dmg link returns after the first TidyDisk-named release`; add `export const BUY_URL = 'https://buy.polar.sh/polar_cl_znfuYWAHA5D9fRlZZ7FYmumBJGGmmSMpSIXdB1JE4y1'`.
- [ ] **Step 2: metadata** in `app/layout.tsx`:
  - `TITLE = "TidyDisk: see what is eating your dev disk, reclaim it in one click"`
  - `DESCRIPTION = "TidyDisk lives in your macOS menu bar and shows what your dev projects really cost: every node_modules folder, your pnpm store, and every installed package. Free to scan. One-click cleanup with a 19 euro lifetime license. Safely, to the Trash, never rm -rf."`
  - `siteName: "TidyDisk"`; OG image `alt: "TidyDisk: the macOS menu bar app that reclaims the disk your dev projects cost"`
  - the non-Vercel fallback for the site URL becomes `https://tidydisk.app`
- [ ] **Step 3: name swaps** (exact strings from the inventory; JSX/styles preserved): `landing.css` header comment; Navbar brand text; Hero body sentence (`Clean my node_modules lives in your menu bar…` → `TidyDisk lives in your menu bar…`); Hero eyebrow `Open source · macOS menu bar app` → `macOS menu bar app · free scan`; Features block 1 sentence; both WhyLifecycle sentences; Footer brand + `© 2026 TidyDisk · MIT license`. Footer tagline → `The menu bar app that keeps dev junk from eating your Mac alive.` H1 and StatementBand stay as they are.
- [ ] **Step 4: honesty line.** `FeatureGrid.tsx` lead → `Your scans stay on your Mac. Anonymous usage analytics only, with a one-click opt-out in Settings. A quiet utility that keeps your disk honest.`
- [ ] **Step 5: Download section rebuild** (`Download.tsx`). Keep the section shell, the `lp-*` card classes, and the two-card layout; replace content:
  - Section heading: `Free to scan. <span className="accent">19 euros to clean.</span>` Sub-copy: `The scan is free forever and the source is MIT on GitHub. One-click cleanup is a one-time lifetime license: founding price 19 euros, then 29 after launch. 30-day money-back, no questions.`
  - Card A `$0 · Scan everything`: download the app, see every node_modules folder, cache, and package on your machine, no account. CTA `Download for macOS` → `DOWNLOAD_URL`.
  - Card B `€19 · Lifetime cleanup` (visually the featured card): one-click delete, Clean stale, pnpm store prune, all future updates, instant license key via Polar, founding price goes to 29 euros after launch. CTA `Buy TidyDisk · €19` → `BUY_URL`.
- [ ] **Step 6: FinalCta.** Copy → `Reclaim the gigabytes your dependencies have been hoarding. Scan free, unlock cleanup for 19 euros.` Primary CTA `Download free scan` → `DOWNLOAD_URL`; secondary `Buy · €19` → `BUY_URL` (replaces the repo link).
- [ ] **Step 7: OG card** (`app/og/page.tsx`): lockup text `TidyDisk`; the `Free & open source` chip → `Free scan · 19 euro lifetime cleanup`; re-render `public/og.png` with the site's existing og script (see `site/scripts/`; run it per its header comment).
- [ ] **Step 8: gates + grep.** Inside `site/`: `pnpm install` (if needed), `pnpm typecheck && pnpm lint && pnpm build` green. `git grep -n "Clean my node_modules\|nothing leaves your Mac\|no telemetry\|no gates" -- site` returns nothing (the `clean-my-node-modules` GitHub slug in `links.ts` is fine and expected).
- [ ] **Step 9: commit** `feat(site): TidyDisk rename + honest free-scan / €19 pricing`

---

### Task 3: Verification + ship (controller)

- [ ] STATUS.html: `<title>` and `app:` field → TidyDisk; milestone + log updates.
- [ ] Playwright visual pass of the site (desktop 1280 + mobile 390): brand, pricing cards, buy link target, no stale claims above the fold.
- [ ] Full app gates + `pnpm build`; final review; push; PR (`feat/tidydisk-rename` → main) noting it stacks on PR #30 + the landing PR and CLOSES the release gate.
