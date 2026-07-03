# Polar Licensing + Analytics Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the unmerged `feat/license-gate` branch so licenses are Polar-issued keys validated online with a 30-day offline grace window (replacing the offline Ed25519 design), and add PostHog EU funnel analytics.

**Architecture:** A `polar-client.ts` (Electron `net.fetch`, mirrors `registry-client.ts`) validates keys against Polar's public customer-portal endpoint. `LicenseStore` keeps its interface but activates asynchronously, derives `pro` from `lastValidatedAt` + grace window, and gains `revalidateIfStale()` wired to launch + a 24h timer. All Ed25519/issuance code is deleted. A new `src/main/analytics/` module wraps `posthog-node` (EU host, install-UUID distinct id, disabled in dev, gated on a new `analytics` setting); main-process events instrument the funnel directly, two renderer events arrive over a whitelisted IPC channel.

**Tech Stack:** Electron 33 (main-process `net.fetch`), TypeScript, vitest, `posthog-node` (new production dependency), existing 3-layer IPC pattern.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-03-polar-licensing-and-analytics-design.md`. Paywall boundary and enforcement contract are UNCHANGED from PR #30: unlicensed `projects:delete` returns `0` side-effect-free; unlicensed `pnpm-store:prune` returns `{ ok: false, freedBytes: 0 }` without spawning pnpm; gate check first in each handler.
- Polar endpoint (verified): `POST https://api.polar.sh/v1/customer-portal/license-keys/validate`, body `{ key, organization_id }`, no auth. 200 → `{ status: 'granted'|'revoked'|'disabled', customer: { email } , ... }`; 404 = key not found; 422 = malformed.
- Bundled values (client-safe by design): `POLAR_ORGANIZATION_ID = '01bea117-0916-42e2-ab77-beaaa1b1d845'`; `BUY_URL = 'https://buy.polar.sh/polar_cl_znfuYWAHA5D9fRlZZ7FYmumBJGGmmSMpSIXdB1JE4y1'`; PostHog key `phc_pLfY5cBKu6em8uBmhaoddk3yCYLhaGR43K7okmZCG4vK`, host `https://eu.i.posthog.com`.
- Grace values verbatim: `GRACE_DAYS = 30`, `REVALIDATE_AFTER_DAYS = 7`.
- Event names verbatim (nothing else): `app_launched`, `onboarding_completed`, `scan_completed`, `paywall_shown`, `buy_clicked`, `license_activated`, `license_revalidated`, `clean_performed`, `analytics_disabled`. Renderer may originate ONLY `paywall_shown` and `buy_clicked`.
- Analytics privacy floor: event names + aggregate numbers only; never file paths, project names, or package names. No capture when `is.dev`. Gate on the `analytics` setting at the `capture()` choke point.
- **No em dashes in any user-visible string** (settings hints, error messages, button copy).
- pnpm; gates: `pnpm typecheck && pnpm lint && pnpm test` (+ `pnpm build` at the end). Conventional commits. One folder per renderer component. Never modify `clean-my-node-modules/`.
- Work on the existing `feat/license-gate` branch (PR #30). Do not create a new branch.

## File Structure

```
src/shared/license.types.ts               (modify) ActivateResult reason gains 'network'
src/shared/license.constants.ts           (modify) real BUY_URL
src/main/license/license.constants.ts     (rewrite) POLAR_ORGANIZATION_ID, API base, grace values
src/main/license/polar-client.ts          (new) validateLicenseKey via net.fetch
src/main/license/polar-client.test.ts     (new)
src/main/license/license-store.ts         (rewrite) async activate, grace, revalidateIfStale
src/main/license/license-store.test.ts    (rewrite)
src/main/license/license-verify.ts        (DELETE, + its test)
src/main/license/issue-license.e2e.test.ts(DELETE)
src/main/license/index.ts                 (modify) barrel
scripts/license/                          (DELETE both scripts)
package.json                              (modify) drop license:issue; add posthog-node dependency
src/shared/settings.types.ts + .constants (modify) analytics: boolean (default true)
src/main/settings/validate-setting.ts     (modify) coerce 'analytics'
src/main/analytics/install-id.ts + test   (new) persisted random UUID
src/main/analytics/analytics.ts + test    (new) PostHog wrapper
src/main/analytics/index.ts               (new) barrel
src/shared/ipc.constants.ts               (modify) trackEvent channel
src/main/app-context.types.ts             (modify) + analytics
src/main/ipc/register-ipc.ts              (modify) trackEvent handler + license/clean events
src/main/ipc/register-ipc.test.ts         (modify) new cases
src/main/index.ts                         (modify) analytics + revalidation wiring
src/preload/index.ts + api.types.ts       (modify) trackEvent bridge
src/renderer/.../UnlockPrompt.tsx         (modify) reason-aware errors, new placeholder, buy_clicked
src/renderer/.../SettingsView.tsx         (modify) analytics toggle, activator reasons, buy_clicked
src/renderer/.../LauncherApp.tsx          (modify) paywall_shown at setUnlock sites
src/renderer/.../PanelApp.tsx             (modify) paywall_shown at setUnlock sites
```

---

### Task 1: Polar validation client

**Files:**
- Modify: `src/shared/license.types.ts`
- Rewrite: `src/main/license/license.constants.ts`
- Create: `src/main/license/polar-client.ts`
- Test: `src/main/license/polar-client.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `validateLicenseKey(key: string, post?: PostJson): Promise<PolarValidation>` where `PolarValidation = { ok: true; email?: string } | { ok: false; reason: 'invalid' | 'network' }` and `PostJson = (url: string, body: unknown) => Promise<{ status: number; json: unknown }>`; constants `POLAR_ORGANIZATION_ID`, `POLAR_API_BASE`, `GRACE_DAYS = 30`, `REVALIDATE_AFTER_DAYS = 7`; shared type `ActivateResult` reason widened to `'invalid' | 'network'`.

- [ ] **Step 1: Widen the shared ActivateResult**

In `src/shared/license.types.ts` replace the `ActivateResult` line:

```ts
export type ActivateResult = { ok: true; state: LicenseState } | { ok: false; reason: 'invalid' | 'network' }
```

- [ ] **Step 2: Rewrite `src/main/license/license.constants.ts`**

```ts
/** Polar organization the app validates license keys against (public by design). */
export const POLAR_ORGANIZATION_ID = '01bea117-0916-42e2-ab77-beaaa1b1d845'

/** Overridable for the Polar sandbox (POLAR_API_BASE=https://sandbox-api.polar.sh). */
export const POLAR_API_BASE = process.env.POLAR_API_BASE ?? 'https://api.polar.sh'

/** Pro survives this long offline after the last successful validation. */
export const GRACE_DAYS = 30

/** Re-validate silently in the background once the last check is older than this. */
export const REVALIDATE_AFTER_DAYS = 7
```

- [ ] **Step 3: Write the failing tests**

`src/main/license/polar-client.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ net: { fetch: vi.fn() } }))

const { validateLicenseKey } = await import('./polar-client')
const { POLAR_API_BASE, POLAR_ORGANIZATION_ID } = await import('./license.constants')

const respond = (status: number, json: unknown = null) => vi.fn(async () => ({ status, json }))

describe('validateLicenseKey', () => {
  it('accepts a granted key and returns the customer email', async () => {
    const post = respond(200, { status: 'granted', customer: { email: 'buyer@example.com' } })
    expect(await validateLicenseKey('POLAR-KEY', post)).toEqual({ ok: true, email: 'buyer@example.com' })
    expect(post).toHaveBeenCalledWith(`${POLAR_API_BASE}/v1/customer-portal/license-keys/validate`, {
      key: 'POLAR-KEY',
      organization_id: POLAR_ORGANIZATION_ID,
    })
  })

  it('tolerates a granted key with no customer email', async () => {
    const post = respond(200, { status: 'granted' })
    expect(await validateLicenseKey('K', post)).toEqual({ ok: true, email: undefined })
  })

  it('treats revoked and disabled as invalid', async () => {
    for (const status of ['revoked', 'disabled']) {
      expect(await validateLicenseKey('K', respond(200, { status }))).toEqual({ ok: false, reason: 'invalid' })
    }
  })

  it('treats 404 (not found) and 422 (malformed) as invalid', async () => {
    expect(await validateLicenseKey('K', respond(404))).toEqual({ ok: false, reason: 'invalid' })
    expect(await validateLicenseKey('K', respond(422))).toEqual({ ok: false, reason: 'invalid' })
  })

  it('treats 5xx and unexpected payloads as network trouble or invalid, never throws', async () => {
    expect(await validateLicenseKey('K', respond(500))).toEqual({ ok: false, reason: 'network' })
    expect(await validateLicenseKey('K', respond(200, null))).toEqual({ ok: false, reason: 'invalid' })
    const boom = vi.fn(async () => {
      throw new Error('offline')
    })
    expect(await validateLicenseKey('K', boom)).toEqual({ ok: false, reason: 'network' })
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm test -- src/main/license/polar-client.test.ts`
Expected: FAIL, cannot find module `./polar-client`.

- [ ] **Step 5: Implement `polar-client.ts`**

```ts
import { net } from 'electron'
import { POLAR_API_BASE, POLAR_ORGANIZATION_ID } from './license.constants'

export type PolarValidation = { ok: true; email?: string } | { ok: false; reason: 'invalid' | 'network' }

/** Minimal JSON POST, injectable for tests. */
export type PostJson = (url: string, body: unknown) => Promise<{ status: number; json: unknown }>

const REQUEST_TIMEOUT_MS = 8000

const postJson: PostJson = async (url, body) => {
  const res = await net.fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    // non-JSON error bodies are fine; status carries the verdict
  }
  return { status: res.status, json }
}

/**
 * Validates a license key against Polar's public customer-portal endpoint.
 * 404/422 or a non-granted status mean the key is bad; transport failures and
 * 5xx mean "can't tell right now" so the caller can fall back to cached state.
 * Never throws.
 */
export async function validateLicenseKey(key: string, post: PostJson = postJson): Promise<PolarValidation> {
  try {
    const { status, json } = await post(`${POLAR_API_BASE}/v1/customer-portal/license-keys/validate`, {
      key,
      organization_id: POLAR_ORGANIZATION_ID,
    })
    if (status === 404 || status === 422) return { ok: false, reason: 'invalid' }
    if (status !== 200) return { ok: false, reason: 'network' }
    const data = json as { status?: unknown; customer?: { email?: unknown } } | null
    if (data?.status !== 'granted') return { ok: false, reason: 'invalid' }
    return { ok: true, email: typeof data.customer?.email === 'string' ? data.customer.email : undefined }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test -- src/main/license/polar-client.test.ts`
Expected: 5 tests PASS. Then `pnpm typecheck` (the widened `ActivateResult` must not break existing call sites; `'invalid'` literals still satisfy the union).

- [ ] **Step 7: Commit**

```bash
git add src/shared/license.types.ts src/main/license/
git commit -m "feat(license): Polar validation client + grace-window constants"
```

---

### Task 2: LicenseStore rework, Ed25519 removal, wiring + renderer error states

**Files:**
- Rewrite: `src/main/license/license-store.ts` and `src/main/license/license-store.test.ts`
- Modify: `src/main/license/index.ts`, `src/shared/license.constants.ts`, `src/main/index.ts`, `src/main/ipc/register-ipc.test.ts`
- Modify: `src/renderer/src/components/UnlockPrompt/UnlockPrompt.tsx`, `src/renderer/src/launcher/views/SettingsView.tsx`
- Delete: `src/main/license/license-verify.ts`, `src/main/license/license-verify.test.ts`, `src/main/license/issue-license.e2e.test.ts`, `scripts/license/make-keypair.mjs`, `scripts/license/issue-license.mjs` (and the now-empty `scripts/license/`), the `license:issue` script in `package.json`

**Interfaces:**
- Consumes: `validateLicenseKey`, `PolarValidation` (Task 1).
- Produces: `class LicenseStore { constructor(filePath?, validate?, now?); get(): LicenseState; activate(key: unknown): Promise<ActivateResult>; revalidateIfStale(): Promise<null | { changed: boolean; outcome: 'refreshed' | 'revoked' | 'offline' }> }`. Persisted shape: `{ key: string, lastValidatedAt: number, email?: string }`. Task 4 consumes the `revalidateIfStale` outcome for the `license_revalidated` event.

- [ ] **Step 1: Write the failing store tests**

Rewrite `src/main/license/license-store.test.ts`:

```ts
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp' }, net: { fetch: vi.fn() } }))

const { LicenseStore } = await import('./license-store')

const DAY = 24 * 60 * 60 * 1000
const T0 = 1_751_500_000_000

const granted = (email = 'buyer@example.com') => vi.fn(async () => ({ ok: true as const, email }))
const invalid = () => vi.fn(async () => ({ ok: false as const, reason: 'invalid' as const }))
const offline = () => vi.fn(async () => ({ ok: false as const, reason: 'network' as const }))

const dir = mkdtempSync(join(tmpdir(), 'cmn-license-'))
const fileIn = (name: string): string => join(dir, name)
afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('LicenseStore', () => {
  it('is free when the file is missing or corrupt', () => {
    expect(new LicenseStore(fileIn('missing.json'), granted(), () => T0).get()).toEqual({ pro: false })
    const f = fileIn('corrupt.json')
    writeFileSync(f, '{ not: valid')
    expect(new LicenseStore(f, granted(), () => T0).get().pro).toBe(false)
  })

  it('activates a granted key, persists {key,lastValidatedAt,email}, fresh store reads it back', async () => {
    const f = fileIn('roundtrip.json')
    const s = new LicenseStore(f, granted(), () => T0)
    const res = await s.activate('  POLAR-KEY  ')
    expect(res.ok).toBe(true)
    expect(s.get()).toMatchObject({ pro: true, email: 'buyer@example.com' })
    expect(JSON.parse(readFileSync(f, 'utf8'))).toEqual({
      key: 'POLAR-KEY',
      lastValidatedAt: T0,
      email: 'buyer@example.com',
    })
    expect(new LicenseStore(f, granted(), () => T0).get().pro).toBe(true)
  })

  it('surfaces invalid vs network as distinct activation failures, staying free', async () => {
    const s = new LicenseStore(fileIn('fail.json'), invalid(), () => T0)
    expect(await s.activate('BAD')).toEqual({ ok: false, reason: 'invalid' })
    const s2 = new LicenseStore(fileIn('fail2.json'), offline(), () => T0)
    expect(await s2.activate('KEY')).toEqual({ ok: false, reason: 'network' })
    expect(s.get().pro).toBe(false)
    expect(s2.get().pro).toBe(false)
  })

  it('rejects non-string keys without calling the network', async () => {
    const validate = granted()
    const s = new LicenseStore(fileIn('nonstring.json'), validate, () => T0)
    expect(await s.activate(42)).toEqual({ ok: false, reason: 'invalid' })
    expect(validate).not.toHaveBeenCalled()
  })

  it('honours the 30-day grace window', async () => {
    const f = fileIn('grace.json')
    let now = T0
    const s = new LicenseStore(f, granted(), () => now)
    await s.activate('KEY')
    now = T0 + 29 * DAY
    expect(s.get().pro).toBe(true)
    now = T0 + 31 * DAY
    expect(s.get().pro).toBe(false)
  })

  it('revalidateIfStale: fresh state is a no-op that never calls the network', async () => {
    const f = fileIn('fresh.json')
    let now = T0
    const validate = granted()
    const s = new LicenseStore(f, validate, () => now)
    await s.activate('KEY')
    validate.mockClear()
    now = T0 + 6 * DAY
    expect(await s.revalidateIfStale()).toBeNull()
    expect(validate).not.toHaveBeenCalled()
  })

  it('revalidateIfStale refreshes the timestamp on success', async () => {
    const f = fileIn('refresh.json')
    let now = T0
    const s = new LicenseStore(f, granted(), () => now)
    await s.activate('KEY')
    now = T0 + 8 * DAY
    expect(await s.revalidateIfStale()).toEqual({ changed: false, outcome: 'refreshed' })
    expect(JSON.parse(readFileSync(f, 'utf8')).lastValidatedAt).toBe(T0 + 8 * DAY)
  })

  it('revalidateIfStale drops to Free immediately on revocation', async () => {
    const f = fileIn('revoke.json')
    let now = T0
    const validate = granted()
    const s = new LicenseStore(f, validate, () => now)
    await s.activate('KEY')
    validate.mockImplementation(async () => ({ ok: false as const, reason: 'invalid' as const }))
    now = T0 + 8 * DAY
    expect(await s.revalidateIfStale()).toEqual({ changed: true, outcome: 'revoked' })
    expect(s.get().pro).toBe(false)
    expect(new LicenseStore(f, validate, () => now).get().pro).toBe(false)
  })

  it('revalidateIfStale keeps cached Pro on network failure (grace covers it)', async () => {
    const f = fileIn('keep.json')
    let now = T0
    const validate = granted()
    const s = new LicenseStore(f, validate, () => now)
    await s.activate('KEY')
    validate.mockImplementation(async () => ({ ok: false as const, reason: 'network' as const }))
    now = T0 + 8 * DAY
    expect(await s.revalidateIfStale()).toEqual({ changed: false, outcome: 'offline' })
    expect(s.get().pro).toBe(true)
  })

  it('a key past grace can heal: successful revalidation restores Pro', async () => {
    const f = fileIn('heal.json')
    let now = T0
    const s = new LicenseStore(f, granted(), () => now)
    await s.activate('KEY')
    now = T0 + 40 * DAY
    expect(s.get().pro).toBe(false)
    expect(await s.revalidateIfStale()).toEqual({ changed: true, outcome: 'refreshed' })
    expect(s.get().pro).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/main/license/license-store.test.ts`
Expected: FAIL (constructor signature and methods do not match yet).

- [ ] **Step 3: Rewrite `license-store.ts`**

```ts
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { ActivateResult, LicenseState } from '@shared/license.types'
import { app } from 'electron'
import { GRACE_DAYS, REVALIDATE_AFTER_DAYS } from './license.constants'
import { validateLicenseKey } from './polar-client'

interface PersistedLicense {
  key: string
  lastValidatedAt: number
  email?: string
}

export type RevalidationOutcome = { changed: boolean; outcome: 'refreshed' | 'revoked' | 'offline' }

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * JSON-file-backed license state in the app's userData directory.
 * `pro` is derived from the last successful Polar validation plus a grace
 * window, so the app keeps working offline for GRACE_DAYS and refunds
 * (revocations) are picked up by the periodic background revalidation.
 */
export class LicenseStore {
  private persisted: PersistedLicense | null

  constructor(
    private filePath = join(app.getPath('userData'), 'license.json'),
    private validate: typeof validateLicenseKey = validateLicenseKey,
    private now: () => number = Date.now,
  ) {
    this.persisted = this.load()
  }

  get(): LicenseState {
    if (!this.persisted) return { pro: false }
    const withinGrace = this.now() - this.persisted.lastValidatedAt <= GRACE_DAYS * DAY_MS
    if (!withinGrace) return { pro: false }
    return { pro: true, email: this.persisted.email, activatedAt: this.persisted.lastValidatedAt }
  }

  async activate(key: unknown): Promise<ActivateResult> {
    if (typeof key !== 'string' || !key.trim()) return { ok: false, reason: 'invalid' }
    const result = await this.validate(key.trim())
    if (!result.ok) return { ok: false, reason: result.reason }
    this.persisted = { key: key.trim(), lastValidatedAt: this.now(), email: result.email }
    this.persist()
    return { ok: true, state: this.get() }
  }

  /**
   * Background refresh once the last check is REVALIDATE_AFTER_DAYS old.
   * Returns null when nothing was due; otherwise reports whether the public
   * state flipped and how the check ended. Network trouble keeps the cached
   * state so an offline user is never punished inside the grace window.
   */
  async revalidateIfStale(): Promise<RevalidationOutcome | null> {
    if (!this.persisted) return null
    if (this.now() - this.persisted.lastValidatedAt < REVALIDATE_AFTER_DAYS * DAY_MS) return null
    const wasPro = this.get().pro
    const result = await this.validate(this.persisted.key)
    if (result.ok) {
      this.persisted = {
        ...this.persisted,
        lastValidatedAt: this.now(),
        email: result.email ?? this.persisted.email,
      }
      this.persist()
      return { changed: this.get().pro !== wasPro, outcome: 'refreshed' }
    }
    if (result.reason === 'invalid') {
      this.persisted = null
      try {
        rmSync(this.filePath, { force: true })
      } catch (err) {
        console.error('Failed to clear license file', err)
      }
      return { changed: wasPro, outcome: 'revoked' }
    }
    return { changed: false, outcome: 'offline' }
  }

  private load(): PersistedLicense | null {
    try {
      const raw = JSON.parse(readFileSync(this.filePath, 'utf8')) as PersistedLicense
      if (typeof raw?.key !== 'string' || typeof raw?.lastValidatedAt !== 'number') return null
      return { key: raw.key, lastValidatedAt: raw.lastValidatedAt, email: typeof raw.email === 'string' ? raw.email : undefined }
    } catch {
      return null
    }
  }

  private persist(): void {
    if (!this.persisted) return
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      writeFileSync(this.filePath, JSON.stringify(this.persisted, null, 2))
    } catch (err) {
      console.error('Failed to persist license', err)
    }
  }
}
```

Update the barrel `src/main/license/index.ts`:

```ts
export { LicenseStore } from './license-store'
export type { RevalidationOutcome } from './license-store'
export { validateLicenseKey } from './polar-client'
```

- [ ] **Step 4: Delete the Ed25519 world**

```bash
git rm src/main/license/license-verify.ts src/main/license/license-verify.test.ts src/main/license/issue-license.e2e.test.ts
git rm -r scripts/license
```

Remove the `"license:issue"` line from `package.json` scripts. (Leave `.gitignore` as is; a stray local `.license-signing.pem` is now inert.)

- [ ] **Step 5: Real BUY_URL**

In `src/shared/license.constants.ts` replace the placeholder:

```ts
/** Polar hosted checkout for the founding lifetime license. */
export const BUY_URL = 'https://buy.polar.sh/polar_cl_znfuYWAHA5D9fRlZZ7FYmumBJGGmmSMpSIXdB1JE4y1'
```

- [ ] **Step 6: Wire revalidation in `src/main/index.ts`**

After `const license = new LicenseStore()` and inside `app.whenReady().then(...)`, add (imports: `IPC` and `broadcast` are already imported there):

```ts
  const revalidateLicense = (): void => {
    void license.revalidateIfStale().then((result) => {
      if (result?.changed) broadcast(IPC.onLicenseChanged, license.get())
    })
  }
  revalidateLicense()
  const licenseTimer = setInterval(revalidateLicense, 24 * 60 * 60 * 1000)
```

and in the existing `before-quit` handler add `clearInterval(licenseTimer)`.

- [ ] **Step 7: Renderer error states**

`UnlockPrompt.tsx`: replace the boolean `invalid` state with a reason:

```ts
const [error, setError] = useState<null | 'invalid' | 'network'>(null)
```

- `submit()`: `if (result.ok) onClose(); else setError(result.reason)`
- input `onChange` clears with `setError(null)`; border condition uses `error !== null`
- the error span becomes:

```tsx
{error && (
  <span style={{ fontSize: 11.5, color: accent, whiteSpace: 'nowrap' }}>
    {error === 'network' ? 'No connection. Retry?' : 'Invalid key'}
  </span>
)}
```

- placeholder changes from `"TIDY-…"` to `"Paste your license key"`.

`SettingsView.tsx` `LicenseActivator`: same reason treatment (`invalid` state becomes `error: null | 'invalid' | 'network'`, message `error === 'network' ? 'No connection' : 'Invalid'`).

- [ ] **Step 8: register-ipc test additions**

In `src/main/ipc/register-ipc.test.ts`: the fake ctx's `license` gains `revalidateIfStale: vi.fn()` (unused by handlers but keeps the type honest) and `activate` becomes `vi.fn(async () => ({ ok: true as const, state: { pro: true } }))`. Add the negative-broadcast case:

```ts
  it('failed activation does not broadcast license:changed', async () => {
    const { activate } = makeCtx(false)
    activate.mockImplementation(async () => ({ ok: false as const, reason: 'invalid' as const }))
    const res = await invoke(IPC.activateLicense, 'BAD')
    expect(res).toEqual({ ok: false, reason: 'invalid' })
    expect(sent).toEqual([])
  })
```

- [ ] **Step 9: Full gates**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: green; the deleted tests are gone, new store tests pass, all IPC tests pass.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(license): Polar-validated keys with 30-day grace; retire Ed25519 issuance"
```

---

### Task 3: Analytics core — module, setting, IPC channel

**Files:**
- Modify: `package.json` (add `posthog-node` as a production dependency), `src/shared/settings.types.ts`, `src/shared/settings.constants.ts`, `src/main/settings/validate-setting.ts`, `src/shared/ipc.constants.ts`, `src/main/app-context.types.ts`, `src/preload/api.types.ts`, `src/preload/index.ts`, `src/renderer/src/launcher/views/SettingsView.tsx`
- Create: `src/main/analytics/install-id.ts`, `src/main/analytics/install-id.test.ts`, `src/main/analytics/analytics.ts`, `src/main/analytics/analytics.test.ts`, `src/main/analytics/index.ts`

**Interfaces:**
- Produces: `getInstallId(filePath?): string`; `class Analytics { constructor(enabled: () => boolean, distinctId: string, client?: PostHogLike | null); capture(event: AnalyticsEvent, props?): void; identify(email: string): void; noteOptOut(): void; shutdown(): Promise<void> }`; `ANALYTICS_EVENTS` / `RENDERER_EVENTS` constants; IPC channel `analytics:track`; setting `analytics: boolean` (default `true`); renderer API `trackEvent(event, props?)`. Task 4 consumes all of it.

- [ ] **Step 1: Install the dependency**

Run: `pnpm add posthog-node`
Expected: lands in `"dependencies"` (NOT devDependencies) so electron-builder packages it. Run `pnpm test` once to confirm nothing broke.

- [ ] **Step 2: The `analytics` setting**

- `src/shared/settings.types.ts`: add `analytics: boolean` to `Settings`.
- `src/shared/settings.constants.ts`: add `analytics: true,` to `DEFAULT_SETTINGS`.
- `src/main/settings/validate-setting.ts`: add a case next to `notify`:

```ts
    case 'analytics':
      return typeof value === 'boolean' ? { key, value } : null
```

- [ ] **Step 3: Write the failing analytics tests**

`src/main/analytics/install-id.test.ts`:

```ts
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp' } }))

const { getInstallId } = await import('./install-id')

const dir = mkdtempSync(join(tmpdir(), 'cmn-install-id-'))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('getInstallId', () => {
  it('generates a UUID, persists it, and returns the same id on later calls', () => {
    const f = join(dir, 'id.json')
    const id = getInstallId(f)
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
    expect(getInstallId(f)).toBe(id)
    expect(JSON.parse(readFileSync(f, 'utf8'))).toEqual({ id })
  })

  it('regenerates on a corrupt file', () => {
    const f = join(dir, 'corrupt.json')
    writeFileSync(f, 'nope')
    expect(getInstallId(f)).toMatch(/^[0-9a-f-]{36}$/)
  })
})
```

`src/main/analytics/analytics.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp' } }))

const { Analytics } = await import('./analytics')

const fakeClient = () => ({ capture: vi.fn(), shutdown: vi.fn(async () => {}) })

describe('Analytics', () => {
  it('captures with the install id when enabled', () => {
    const client = fakeClient()
    const a = new Analytics(() => true, 'uuid-1', client)
    a.capture('scan_completed', { total_gb: 12.3 })
    expect(client.capture).toHaveBeenCalledWith({
      distinctId: 'uuid-1',
      event: 'scan_completed',
      properties: { total_gb: 12.3 },
    })
  })

  it('drops everything when the setting is off', () => {
    const client = fakeClient()
    const a = new Analytics(() => false, 'uuid-1', client)
    a.capture('app_launched')
    a.identify('x@y.z')
    expect(client.capture).not.toHaveBeenCalled()
  })

  it('is inert with a null client (dev mode) and never throws', async () => {
    const a = new Analytics(() => true, 'uuid-1', null)
    a.capture('app_launched')
    a.identify('x@y.z')
    a.noteOptOut()
    await a.shutdown()
  })

  it('identify sets the email as a person property on the same distinct id', () => {
    const client = fakeClient()
    const a = new Analytics(() => true, 'uuid-1', client)
    a.identify('buyer@example.com')
    expect(client.capture).toHaveBeenCalledWith({
      distinctId: 'uuid-1',
      event: '$set',
      properties: { $set: { email: 'buyer@example.com' } },
    })
  })

  it('noteOptOut fires exactly once even though capture is already gated off', () => {
    const client = fakeClient()
    const a = new Analytics(() => false, 'uuid-1', client)
    a.noteOptOut()
    expect(client.capture).toHaveBeenCalledWith({ distinctId: 'uuid-1', event: 'analytics_disabled' })
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm test -- src/main/analytics`
Expected: FAIL, modules missing.

- [ ] **Step 5: Implement**

`src/main/analytics/install-id.ts`:

```ts
import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app } from 'electron'

/** Stable anonymous id for this install; survives restarts, never leaves userData. */
export function getInstallId(filePath = join(app.getPath('userData'), 'install-id.json')): string {
  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf8')) as { id?: unknown }
    if (typeof raw.id === 'string' && raw.id.length > 0) return raw.id
  } catch {
    // fall through to generation
  }
  const id = randomUUID()
  try {
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, JSON.stringify({ id }))
  } catch (err) {
    console.error('Failed to persist install id', err)
  }
  return id
}
```

`src/main/analytics/analytics.ts`:

```ts
import { PostHog } from 'posthog-node'

const POSTHOG_KEY = 'phc_pLfY5cBKu6em8uBmhaoddk3yCYLhaGR43K7okmZCG4vK'
const POSTHOG_HOST = 'https://eu.i.posthog.com'

export const ANALYTICS_EVENTS = [
  'app_launched',
  'onboarding_completed',
  'scan_completed',
  'paywall_shown',
  'buy_clicked',
  'license_activated',
  'license_revalidated',
  'clean_performed',
  'analytics_disabled',
] as const
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number]

/** The only events the renderer may originate over IPC. */
export const RENDERER_EVENTS: readonly AnalyticsEvent[] = ['paywall_shown', 'buy_clicked']

export type AnalyticsProps = Record<string, string | number | boolean>

/** Structural subset of posthog-node we use; injectable for tests. */
export interface PostHogLike {
  capture(msg: { distinctId: string; event: string; properties?: Record<string, unknown> }): void
  shutdown(): Promise<void>
}

/**
 * Thin funnel-analytics wrapper. The privacy floor lives here by construction:
 * callers can only pass flat primitive properties, and every capture goes
 * through the enabled() gate. `client` is null in dev so local runs never
 * pollute launch data.
 */
export class Analytics {
  private client: PostHogLike | null

  constructor(
    private enabled: () => boolean,
    private distinctId: string,
    client?: PostHogLike | null,
  ) {
    this.client = client !== undefined ? client : new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST })
  }

  capture(event: AnalyticsEvent, properties?: AnalyticsProps): void {
    if (!this.client || !this.enabled()) return
    this.client.capture({ distinctId: this.distinctId, event, properties })
  }

  /** Links this install to the buyer email as a person property. */
  identify(email: string): void {
    if (!this.client || !this.enabled()) return
    this.client.capture({ distinctId: this.distinctId, event: '$set', properties: { $set: { email } } })
  }

  /** The one deliberate exception to the gate: sent at the moment of opting out. */
  noteOptOut(): void {
    this.client?.capture({ distinctId: this.distinctId, event: 'analytics_disabled' })
  }

  async shutdown(): Promise<void> {
    await this.client?.shutdown()
  }
}
```

`src/main/analytics/index.ts`:

```ts
export { Analytics, ANALYTICS_EVENTS, RENDERER_EVENTS } from './analytics'
export type { AnalyticsEvent, AnalyticsProps, PostHogLike } from './analytics'
export { getInstallId } from './install-id'
```

- [ ] **Step 6: IPC channel + bridge + AppContext**

- `src/shared/ipc.constants.ts`: add `trackEvent: 'analytics:track',` in the invoke section (it is fire-and-forget via `send`/`on`, grouped with `setWindowHeight`/`quitApp` style).
- `src/main/app-context.types.ts`: import `Analytics` from `'./analytics/analytics'` and add `analytics: Analytics` to `AppContext`.
- `src/preload/api.types.ts`:

```ts
  /** Fire-and-forget funnel event; main enforces the event whitelist. */
  trackEvent(event: 'paywall_shown' | 'buy_clicked', props?: Record<string, string | number | boolean>): void
```

- `src/preload/index.ts`: `trackEvent: (event, props) => ipcRenderer.send(IPC.trackEvent, event, props),`

- [ ] **Step 7: Settings toggle row**

In `SettingsView.tsx`, insert after the "Check npm for updates & advisories" row (with its divider):

```tsx
      <SettingsRow label="Usage analytics" hint="Anonymous usage events help improve the app. No file paths or project names, ever">
        <Toggle
          on={settings.analytics}
          accent={accent}
          onToggle={() => setSetting('analytics', !settings.analytics)}
        />
      </SettingsRow>
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
```

- [ ] **Step 8: Run gates**

Run: `pnpm test -- src/main/analytics && pnpm typecheck && pnpm lint`
Expected: analytics tests pass; typecheck flags nothing (AppContext consumers are updated in Task 4 — if `registerIpc` call sites complain about the missing `analytics` field already, add the field in `src/main/index.ts` minimally: `const analytics = new Analytics(() => settings.get().analytics, getInstallId(), is.dev ? null : undefined)` and pass it, leaving event wiring to Task 4).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(analytics): PostHog EU core — install id, gated wrapper, setting + IPC channel"
```

---

### Task 4: Instrumentation — main + renderer events

**Files:**
- Modify: `src/main/index.ts`, `src/main/ipc/register-ipc.ts`, `src/main/ipc/register-ipc.test.ts`
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`, `src/renderer/src/panel/PanelApp/PanelApp.tsx`, `src/renderer/src/components/UnlockPrompt/UnlockPrompt.tsx`, `src/renderer/src/launcher/views/SettingsView.tsx`

**Interfaces:**
- Consumes: `Analytics`, `getInstallId`, `RENDERER_EVENTS` (Task 3); `RevalidationOutcome` (Task 2); `window.clean.trackEvent` (Task 3).
- Produces: the complete event funnel of the spec. No new exports.

- [ ] **Step 1: Main wiring in `src/main/index.ts`**

Inside `app.whenReady().then(...)`, next to the other stores (Task 3 may have partially added this — finalize to exactly):

```ts
  const analytics = new Analytics(() => settings.get().analytics, getInstallId(), is.dev ? null : undefined)
  analytics.capture('app_launched', { version: app.getVersion() })
```

Instrument `runScan` (wrap the existing body):

```ts
  const runScan = async (): Promise<void> => {
    if (scanner.isScanning) return
    const startedAt = Date.now()
    try {
      const result = await scanner.scan((progress) => broadcast(IPC.onScanProgress, progress))
      projects.replaceAll(result)
      analytics.capture('scan_completed', {
        total_gb: Math.round((result.reduce((a, p) => a + (p.uniqueSize ?? p.size), 0) / GB) * 10) / 10,
        projects_count: result.length,
        duration_s: Math.round((Date.now() - startedAt) / 1000),
      })
    } catch (err) {
      console.error('Scan failed', err)
    }
  }
```

Settings watcher — extend the existing `settings.onChange((s) => { ... })` subscription. Keep the previous snapshot in a closure ABOVE the `unsubscribe` array:

```ts
  let prevSettings = settings.get()
```

and inside the existing `settings.onChange` callback, before the current body:

```ts
      if (!prevSettings.onboarded && s.onboarded) analytics.capture('onboarding_completed')
      if (prevSettings.analytics && !s.analytics) analytics.noteOptOut()
      prevSettings = s
```

Revalidation events — replace Task 2's `revalidateLicense` with:

```ts
  const revalidateLicense = (): void => {
    void license.revalidateIfStale().then((result) => {
      if (!result) return
      analytics.capture('license_revalidated', { status: result.outcome })
      if (result.changed) broadcast(IPC.onLicenseChanged, license.get())
    })
  }
```

`before-quit`: add `void analytics.shutdown()` after the existing teardown lines. Pass `analytics` into `registerIpc({ ..., analytics })`.

- [ ] **Step 2: register-ipc events + whitelist handler**

In `register-ipc.ts` add imports `import { RENDERER_EVENTS } from '../analytics'` and `import type { AnalyticsEvent, AnalyticsProps } from '../analytics'`, then:

The whitelisted renderer channel (near the other `ipcMain.on` handlers):

```ts
  ipcMain.on(IPC.trackEvent, (_e, event: unknown, props: unknown) => {
    // The renderer only ever originates these two; everything else is dropped.
    if (typeof event !== 'string' || !(RENDERER_EVENTS as readonly string[]).includes(event)) return
    ctx.analytics.capture(event as AnalyticsEvent, sanitizeProps(props))
  })
```

with, at module level:

```ts
/** Flat primitives only — the renderer cannot smuggle objects or paths-by-accident. */
function sanitizeProps(props: unknown): AnalyticsProps | undefined {
  if (typeof props !== 'object' || props === null) return undefined
  const out: AnalyticsProps = {}
  for (const [k, v] of Object.entries(props).slice(0, 10)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = v
  }
  return Object.keys(out).length ? out : undefined
}
```

Success-path events in the existing handlers:

- `activateLicense` handler, inside the `if (result.ok)` branch:

```ts
      ctx.analytics.capture('license_activated')
      if (result.state.email) ctx.analytics.identify(result.state.email)
```

- `deleteNodeModules` handler, after `ctx.projects.remove(id)`:

```ts
    ctx.analytics.capture('clean_performed', { kind: 'delete', freed_gb: Math.round((freed / GB) * 10) / 10 })
```

(add `import { GB } from '@shared/units.constants'` if not present)

- `prunePnpmStore` handler: make the licensed branch async and capture on success:

```ts
  ipcMain.handle(IPC.prunePnpmStore, async () => {
    if (!ctx.license.get().pro) return { ok: false, freedBytes: 0 }
    const s = ctx.settings.get()
    const result = await prunePnpmStore({ storePath: s.pnpmStorePath, binaryPath: s.pnpmBinaryPath })
    if (result.ok) {
      ctx.analytics.capture('clean_performed', { kind: 'prune', freed_gb: Math.round((result.freedBytes / GB) * 10) / 10 })
    }
    return result
  })
```

- [ ] **Step 3: register-ipc test additions**

Fake ctx gains `analytics: { capture: vi.fn(), identify: vi.fn() }` (expose the two spies from `makeCtx`). New cases:

```ts
  it('trackEvent forwards whitelisted renderer events with sanitized props', () => {
    const { analytics } = makeCtx(false)
    invoke(IPC.trackEvent, 'paywall_shown', { trigger: 'delete', teased_gb: 1.2, nested: { no: true } })
    expect(analytics.capture).toHaveBeenCalledWith('paywall_shown', { trigger: 'delete', teased_gb: 1.2 })
  })

  it('trackEvent drops non-whitelisted events entirely', () => {
    const { analytics } = makeCtx(false)
    invoke(IPC.trackEvent, 'license_activated', {})
    invoke(IPC.trackEvent, 42, {})
    expect(analytics.capture).not.toHaveBeenCalled()
  })

  it('successful activation captures license_activated and identifies the buyer', async () => {
    const { activate, analytics } = makeCtx(false)
    activate.mockImplementation(async () => ({ ok: true as const, state: { pro: true, email: 'b@x.y' } }))
    await invoke(IPC.activateLicense, 'KEY')
    expect(analytics.capture).toHaveBeenCalledWith('license_activated')
    expect(analytics.identify).toHaveBeenCalledWith('b@x.y')
  })

  it('licensed delete captures clean_performed with freed_gb', async () => {
    const { analytics } = makeCtx(true)
    await invoke(IPC.deleteNodeModules, 'p1')
    expect(analytics.capture).toHaveBeenCalledWith('clean_performed', { kind: 'delete', freed_gb: 0 })
  })
```

(the test project's `size: 1024` bytes rounds to `0` GB — that is the expected value.)

- [ ] **Step 4: Renderer events**

- `LauncherApp.tsx`:
  - `commitDelete` guard branch, before `return`: `window.clean.trackEvent('paywall_shown', { trigger: 'delete', teased_gb: Math.round(((p.uniqueSize ?? p.size) / GB) * 10) / 10 })` (`GB` already imported? if not, import from `@shared/units.constants`).
  - `handlePrune` guard branch: `window.clean.trackEvent('paywall_shown', { trigger: 'prune' })`
- `PanelApp.tsx`:
  - `removeMany` guard branch (after computing `bytes`): `window.clean.trackEvent('paywall_shown', { trigger: ids.length > 1 ? 'clean_stale' : 'delete', teased_gb: Math.round((bytes / GB) * 10) / 10 })`
  - `pruneStore` guard branch: `window.clean.trackEvent('paywall_shown', { trigger: 'prune' })`
  - soft affordance `onClick`, alongside `setUnlock(...)`: `window.clean.trackEvent('paywall_shown', { trigger: 'affordance' })`
- `UnlockPrompt.tsx` Buy button `onClick`, before `openExternal`: `window.clean.trackEvent('buy_clicked', { source: 'unlock_prompt' })`
- `SettingsView.tsx` License row Buy button `onClick`, before `openExternal`: `window.clean.trackEvent('buy_clicked', { source: 'settings' })`

- [ ] **Step 5: Full gates**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: green (existing enforcement tests untouched and passing).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(analytics): instrument the launch funnel across main and both windows"
```

---

### Task 5: Verification + ship

- [ ] **Step 1: CI parity** — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`, all green.
- [ ] **Step 2: Grep guards** — `git grep -l "TIDY-\|license-verify\|license:issue\|LICENSE_PUBLIC_KEY" -- src scripts package.json` returns nothing; `git grep -n "tidydisk.app/#buy"` returns nothing.
- [ ] **Step 3: Push + update PR #30** — push the branch; update the PR body: Polar-validated keys (30-day grace, background revalidation, refunds revoke), PostHog funnel analytics (events list, opt-out, dev-silent), Ed25519/issuance removed; note the two remaining placeholders are now real values.
- [ ] **Step 4: STATUS** — on the landing branch, move the rework milestone item to done, refresh the PR-review userAction (hold lifted), log entry. (Controller task.)

## Out of scope (per spec)

Polar webhooks, device/activation limits, session replay, crash reporting, A/B tests, PostHog dashboards, copy changes (#26).
