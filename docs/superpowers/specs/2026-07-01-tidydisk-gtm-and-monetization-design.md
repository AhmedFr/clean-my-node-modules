# TidyDisk — go-to-market, monetization & the license gate

**Date:** 2026-07-01
**Status:** Approved (direction: name + model + pricing) — implementation slice (license gate) to be planned next
**Scope:** Product positioning, monetization model, pricing, launch plan, and the one piece of
real app code the model requires: a license gate on the destructive ("Clean") actions.
Companion interactive doc: [`TIDYDISK-LAUNCH.html`](../../../TIDYDISK-LAUNCH.html).

## Problem

The app is currently OSS, free, and sold as a *node_modules cleaner* — but it already does
more than that (pnpm store Prune, a computer-wide Packages tab, honest real-vs-linked sizing).
Two things are true at once:

1. The **positioning is narrower than the product**, capping perceived value.
2. There is **no revenue path**. The goal is a concrete, small, motivating milestone:
   **first €1,000** from real paying developers.

The binding constraint on €1,000 is **not price and not the logo** — it is **distribution**.
At €19 the goal is 53 sales; at €29 it is 35. The whole plan is engineered to get ~35 developers
to see it and say yes.

## Goal

Reposition to **TidyDisk** — "see how much disk your dev junk really costs, reclaim it in one
click" — and ship a **free-scan / paid-clean** model that turns the free scan into the marketing
engine, priced as a **€19 founding → €29 lifetime** license. Reach €1,000 within ~2–4 weeks of a
focused organic launch, selling essentially the current app under the new name and gate.

## Non-goals

- **Not** a rebuild. Sell what exists; the broader Docker/Xcode/build-folder cleanup is roadmap
  used to *justify a later price raise*, not a launch blocker.
- **Not** a subscription. One-time lifetime license only ("we won't rent you your own disk space").
- **Not** a hard paywall. The scan and all *insight* stay free forever; only *reclaiming* is gated.
- **Not** hand-rolled payments/VAT. A Merchant-of-Record handles checkout + EU VAT.
- **No** account system, server, or telemetry. The app stays 100% local.

## Decisions (locked)

| Decision | Value | Why |
| --- | --- | --- |
| Name | **TidyDisk** (`tidydisk.app`) | Broader than node_modules, instantly legible, benefit-forward. |
| Model | **Free scan → paid clean** | The scan's shocking number is the viral artifact; monetize the moment convenience is worth paying for. |
| Price | **€19 founding → €29** lifetime | €19 is an impulse buy for an unknown brand; low friction ⇒ volume ⇒ reviews ⇒ compounding word of mouth. |
| Paywall boundary | The **Clean / delete / prune** actions | Everything you can *see* is free; everything that *frees bytes* needs a license. |
| Timeline | **2–4 weeks**, sell current app | Momentum over perfection. |
| Payments | **Lemon Squeezy or Paddle** (MoR) | Legal EU VAT handling + license-key issuance out of the box. |

Open, user-owned choices before public commit: confirm `tidydisk.app` availability, trademark,
and the npm package name.

## Positioning

- **Old:** "Finds stale `node_modules` and reclaims disk space."
- **New:** "You're a developer. Your Mac is full — and it's not your photos. It's gigabytes of
  `node_modules`, caches, and build junk you forgot existed. **TidyDisk** shows you exactly
  what's eating your disk, and clears it safely in one click."
- Subtitle / one-liner: *"The dev disk space you forgot you were wasting."*

The free scan produces a **number** → the number is a **screenshot** → the screenshot is what
spreads. Product markets itself; the €19 resolves the pain it surfaces.

## Offer stack (the €19 "grand slam")

1. One-click reclaim of all dev junk (node_modules + pnpm/npm/yarn/bun caches — shipped today).
2. **Lifetime license, all future updates free** — "your €19 buys the roadmap" (Docker, Xcode
   DerivedData, build folders).
3. **Safe by design** — Trash, never `rm -rf`; honest real-vs-linked sizing.
4. **100% local — no account, no telemetry.** For devs, privacy *is* trust.
5. **30-day money-back, no questions.** Risk reversal; refunds ≈ 0 because they watched the free
   scan work first.
6. **Founding price €19 → €29** — a real reason to buy today; early buyers grandfathered.

## Pricing ladder

| Stage | Price | Sales to €1,000 | Trigger |
| --- | --- | --- | --- |
| Founding | €19 | 53 | Launch — first ~100 buyers or first 30 days |
| Standard | €29 | 35 | After the founding window |
| Earned | €39 | 26 | After Docker/Xcode/build cleanup ships |

Market frame for the buyer: CleanMyMac ≈ $35/yr subscription (or ~$90); DaisyDisk $10 one-time;
every dev-specific tool (npkill, GrandPerspective, DevCleaner) is free. The **paid dev-cleaner
lane is nearly empty** — meet the free expectation on discovery, charge for the convenience.

## Launch plan (organic, 2–4 weeks)

**Week 1 — package & gate:** rename to TidyDisk; make the free-scan result screenshot-worthy
(share/OG image); ship the free/paid split; wire Lemon Squeezy/Paddle checkout + keys.

**Weeks 2–3 — the push (lead with the finding, tool as the fix):**
- **Show HN**, Tue–Thu ~8am PT — local-first + no-telemetry + disk-space is catnip for HN.
- **Reddit** — r/webdev, r/node, r/javascript, r/reactjs, r/macapps, r/SideProject.
- **Product Hunt** — scheduled, PH-exclusive founding price.
- **dev.to / Hashnode** — "how much is your node_modules actually costing you" (compounding SEO).
- **Build-in-public on X** — post the number; reply under "my mac is full" tweets.
- Reuse the existing **Remotion** showcase pipeline to render the 10s scan-and-reclaim clip.

**Week 4 — convert & compound:** ask every buyer for a testimonial + tweet; fix the landing page
against the top objection seen in comments; hit 35–53 sales → €1,000.

## Implementation slice — the license gate

This is the **only real code work** the model requires. Everything else is copy, assets, and a
payment account.

### Principle
Free tier = **full visibility, zero mutation**. The paid license unlocks **mutation**
(delete `node_modules`, `pnpm store prune`, future bulk-clean). This maps cleanly onto the
existing destructive IPC handlers, so the gate is a small, well-bounded addition — not a rewrite.

### Boundary (what's gated)
- **Gated:** `projects:delete` / trash a `node_modules`, "Clean N stale", `pnpm store prune`, and
  any future bulk/auto clean.
- **Free:** all scanning, sizing, the Packages tab, Caches inspection, Reveal in Finder,
  open-in-editor, notifications — i.e. everything that only *reads*.

### Architecture (follows existing patterns)
- New `src/main/license/` (TDD, single-responsibility, mirrors `src/main/actions/`,
  `src/main/packages/`):
  - `license-store.ts` — persist the key + cached activation result as plain JSON in `userData`
    (same mechanism as settings/scan cache). No new storage tech.
  - `license-verify.ts` — validate a key. Prefer **offline-verifiable signed keys** (verify a
    signature against a bundled public key) so the app keeps working offline and without a server;
    fall back to a one-time online activation against the MoR's license API, then cache the result.
  - `index.ts` exposes `isPro()` and `activate(key)`.
- **Enforce in the main process**, inside the destructive IPC handlers (not just the renderer):
  each gated handler calls `isPro()` and, if unlicensed, returns a `needsLicense` result instead
  of mutating. This keeps the gate honest even though perfect DRM is impossible for a local app —
  the goal is a fair, friction-right gate, not un-crackable DRM.
- New IPC: `license:get`, `license:activate`, following the existing `setSetting`/`app:uninstall`
  IPC + payload-validation pattern.

### Renderer surfaces (minimal, reuse existing components)
- When an unlicensed user triggers a Clean action: an **unlock prompt** — "Reclaim X GB — unlock
  one-click cleanup, €19 lifetime" — with **Buy** (opens the MoR checkout URL) and
  **Enter license key**.
- A **License** row in Settings: key field, status line (Free / Pro, activated date), Buy link —
  reuse the Settings section pattern (as the pnpm-store and Uninstall rows do).
- After a successful free scan, a soft, non-blocking "unlock cleanup" affordance near the total.

### Testing
- Unit tests (vitest, TDD) for `license-verify` (valid / tampered / expired-signature / offline
  path) and `license-store` (round-trip, corrupt-file tolerance), matching existing main-process
  test coverage.
- Gated IPC handlers tested to **refuse mutation when unlicensed** and proceed when Pro.

### Explicitly out of scope for the first slice
- Trial timers, seat management, machine-count limits, license portal UI, auto-renewal — none
  needed for a lifetime license and would add friction/complexity. Revisit only if piracy
  measurably eats revenue (it won't at this scale).

## Success criteria

- **Primary:** €1,000 in real sales (≈ 35–53 buyers) within ~4 weeks of launch.
- Free scan → paid unlock conversion visible and non-zero (measured only via MoR sale count +
  the buyer's own report — no in-app telemetry).
- The gate never blocks *reading*; a licensed user never sees a paywall again on any machine
  after entering the key.
- Refund rate low (risk-reversal working, expectations honest).

## Risks & mitigations

- **No audience (organic cold start).** → The free-scan screenshot is the growth loop; launch
  concentrated on the same Tue–Thu wave across HN/Reddit/PH to manufacture a spike.
- **"Devs won't pay, everything's free."** → We don't gate what's free elsewhere (the scan); we
  charge only for one-click convenience + safety + lifetime updates. €19 is impulse-tier.
- **Piracy of a local app.** → Accept it. Lightweight honest gate; price low enough that buying is
  easier than cracking.
- **MoR / VAT setup friction.** → Lemon Squeezy or Paddle absorbs it; this is Week-1 plumbing.
- **Trademark / domain collision on "TidyDisk".** → User verifies `tidydisk.app` + trademark +
  npm name *before* any public rename.

## References

- Interactive launch dashboard: `TIDYDISK-LAUNCH.html` (repo root).
- Existing patterns reused: `src/main/actions/app-actions.ts` (IPC + native dialog),
  `src/main/packages/*` (on-demand compute + JSON cache in `userData`, TDD),
  Settings section rows (pnpm store, Uninstall), Remotion `video/` pipeline (launch asset).
