# Polar-validated licensing + launch analytics — design addendum

**Date:** 2026-07-03
**Status:** Approved (direction confirmed by user) — supersedes the "offline Ed25519 keys" section of
[`2026-07-01-tidydisk-gtm-and-monetization-design.md`](2026-07-01-tidydisk-gtm-and-monetization-design.md);
everything else in that spec (positioning, pricing, paywall boundary, launch plan) stands.
**Scope:** Rework `src/main/license/` on the unmerged `feat/license-gate` branch (PR #30) to validate
**Polar-issued license keys** online with a generous offline grace window, and add **PostHog product
analytics** so launch decisions run on real usage data. Copy implications are noted for the rename
pass (#26) but not implemented here.

## Why the change (decision record)

The offline Ed25519 design optimized a differentiator the buyer never asked for, at the cost of the
thing they feel immediately:

1. **Fulfilment** — manual key issuance put the founder in the loop of every sale; Polar keys are
   delivered instantly on the success page + email with zero human involvement.
2. **Revocation** — the 30-day money-back promise was unenforceable with unrevocable keys; now a
   refund revokes the key and the periodic check picks it up.
3. **Honesty** — the app already calls the npm registry; "no telemetry, 100% local" was a promise
   with an expiry date. Decision: **drop privacy-absolutist claims entirely**, run honest, disclosed,
   opt-out-able analytics, and sell reclaimed gigabytes instead of privacy purity.
4. **Risk** — no `.license-signing.pem` single point of failure; the private-key backup obligation
   disappears.

Accepted trade-offs, eyes open: the license path now depends on Polar's API (acceptable — their whole
product is that API); a paid user with >30 days of no connectivity sees a reconnect prompt; the
"never phones home" marketing line is retired before it was ever published.

## Part 1 — Polar license validation

### Model

- Buyer pays on Polar → Polar's native **License Keys benefit** generates + delivers the key
  instantly (success page, confirmation email, customer portal). No Custom benefit, no issuance
  scripts, no signing keypair.
- In-app activation: user pastes the key → main process calls Polar's public **customer-portal
  license-key validation endpoint** (`POST /v1/customer-portal/license-keys/validate`, keyed by our
  bundled `organization_id` — no secret required; exact request/response schema confirmed against
  Polar docs at implementation time) → on success, persist and go Pro.
- **Grace-window revalidation** (the design absorbing the offline cost):
  - `license.json` persists `{ key, status, lastValidatedAt, customerEmail? }`.
  - `isPro()` = status is valid **and** `lastValidatedAt` is within **30 days** (GRACE_DAYS = 30).
  - **Background revalidation**: on app launch (and at most once per running day), if
    `lastValidatedAt` > **7 days** (REVALIDATE_AFTER_DAYS = 7), silently revalidate. Network
    failure → keep the cached state (grace covers it); explicit `revoked`/`disabled` from the API →
    Free immediately and persist that.
  - Never interrupt mid-action: expiry of the grace window shows the normal UnlockPrompt with a
    "reconnect to re-verify your license" line, not an error dialog.
- Activation requires connectivity (buyer was just online buying); failure modes are distinguished
  in the UI: **invalid key** vs **network unreachable** ("check your connection and retry").
- **No device/activation limits** in v1 — validation only, no instance tracking (friction beats
  piracy-paranoia at €19).

### What changes in `src/main/license/`

- `license-verify.ts` (Ed25519) → replaced by `polar-client.ts`: one function
  `validateLicenseKey(key, { fetcher? }): Promise<PolarValidation>` over the app's existing
  hardened-runtime-safe Electron `net` HTTP pattern (`src/main/packages/registry-client.ts`
  precedent); injectable transport for tests.
- `license-store.ts` → keeps its shape (`get()`, `activate(key)` — now async) and gains
  `revalidateIfStale()`; persistence stays plain JSON in `userData`. Tampering story changes
  honestly: the cached state is only worth 30 days — after that the API is the source of truth.
- `license.constants.ts` → `POLAR_ORGANIZATION_ID` (+ `GRACE_DAYS`, `REVALIDATE_AFTER_DAYS`)
  replaces the public-key PEM.
- **Deleted**: `scripts/license/` (both scripts), the Ed25519 verifier + its tests, the bundled
  public key, `issue-license.e2e.test.ts`. `.gitignore` entries stay (harmless; the local pem can be
  discarded).
- **Unchanged** (the expensive, reviewed parts survive): IPC channels & payload validation, the
  destructive-handler enforcement (`isPro()` checked first, refusals side-effect-free), preload
  bridge, `useLicense`, `UnlockPrompt` (placeholder text becomes format-agnostic:
  "Paste your license key"), Settings License row, cross-window `license:changed` broadcast.
- IPC addition: main → renderer state can now change without user action (revalidation) — the
  existing `license:changed` broadcast already covers this; revalidation results reuse it.

### Testing

- Unit (vitest, mocked transport): valid key activates + persists; invalid key rejected; network
  error on activation surfaces `network` (not `invalid`); revalidation refresh, revocation →
  immediate Free, network-failure → cached state kept; grace-window expiry math; corrupt
  `license.json` tolerated.
- Enforcement tests in `register-ipc.test.ts` unchanged (they mock the store).
- Manual pass against a **Polar sandbox** organization + test product before launch (user-assisted).

## Part 2 — PostHog analytics

### Decisions (user-confirmed)

- **Identity:** anonymous per-install UUID (`distinct_id`, persisted in `userData`) → on license
  activation, `identify` with the Polar customer email. Full install→purchase→retention funnel,
  joinable with Polar sales.
- **Consent posture:** **on by default + Settings toggle** — "Anonymous usage analytics help
  improve the app" row; disabling stops capture immediately (a final `analytics_disabled` event is
  sent, then silence).
- **Hosting:** new dedicated project on **PostHog EU cloud** (`https://eu.i.posthog.com`). The
  project API key is a bundled constant (public by design, like any client-side PostHog key);
  creating the project + providing the key is a **user action**.

### Architecture

- `src/main/analytics/` (single-responsibility module): `install-id.ts` (UUID, JSON-persisted),
  `analytics.ts` wrapping `posthog-node` — `capture(event, props?)`, `identify(email)`,
  `shutdown()` (flush on quit, wired into the existing `before-quit` teardown).
- Main-process-first instrumentation: scan completion, gate refusals (= `paywall_shown`),
  activation, clean/prune actions all already flow through main — instrument there. The few
  renderer-originated events (e.g. `buy_clicked` with its source) go over one new IPC channel
  (`analytics:track`) that accepts **whitelisted event names only** (never free-form from the
  renderer).
- **No capture in dev** (`is.dev` guard) so development never pollutes launch data.
- Respect the toggle at the `capture()` choke point — one guard, not per-call-site checks.

### Event schema (v1 — the funnel, nothing else)

| Event | Properties | Decision it informs |
| --- | --- | --- |
| `app_launched` | `version` | actives / retention |
| `onboarding_completed` | — | install → setup drop-off |
| `scan_completed` | `total_gb`, `projects_count`, `duration_s` | does the scan shock? |
| `paywall_shown` | `trigger: delete\|clean_stale\|prune`, `teased_gb?` | which action converts |
| `buy_clicked` | `source: unlock_prompt\|settings\|panel_affordance` | paywall → checkout leak |
| `license_activated` | — (identify fires here) | checkout → activation leak |
| `license_revalidated` | `status` | revocation/grace health |
| `clean_performed` | `kind`, `freed_gb` | the core value delivered |
| `analytics_disabled` | — | opt-out rate |

**Privacy floor (not a promise, just not creepy):** event names + aggregate numbers only — never
file paths, project names, or package names.

## Part 3 — copy & config implications (tracked, not implemented here)

- **#26 rename pass**: remove "no account, no telemetry / 100% local / never phones home" claims
  from README, landing, and the GTM offer stack; the hero sells reclaimed gigabytes. Settings hint
  discloses analytics + license check plainly.
- **Polar product config**: benefit switches Custom → **License Keys**; description line "your
  license key is delivered by email shortly after purchase / verifies on your machine, works
  offline" → "your license key is delivered **instantly** after purchase."
- **Issue #24** updated to match (License Keys benefit, org id + PostHog key as the user-provided
  unblockers).

## Out of scope (v1)

Device/seat limits, offline activation codes, Polar webhooks, in-app update checks, A/B testing,
session replay, any dashboard work beyond PostHog defaults, crash reporting.

## Success criteria

- A Polar-sandbox key activates in-app; a revoked sandbox key drops to Free on revalidation; the
  app stays Pro offline within the grace window (clock-simulated in tests).
- The full funnel renders in PostHog EU from a packaged-app dry run (launch → scan → paywall →
  buy_clicked → activation).
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green; no Ed25519/issuance code remains.
