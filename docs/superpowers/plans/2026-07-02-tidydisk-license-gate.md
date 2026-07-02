# TidyDisk License Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the app's destructive actions (delete node_modules, Clean stale, pnpm store prune) behind a one-time lifetime license, while everything read-only stays free — the "free scan / paid clean" model from the GTM spec.

**Architecture:** Offline-verifiable Ed25519-signed license keys (`TIDY-<payload>.<signature>`), verified in the main process against a bundled public key — no server, no network, no phone-home, and no dependency on the still-open Lemon-Squeezy-vs-Paddle choice. A `LicenseStore` (JSON in `userData`, mirroring `SettingsStore`) persists the key and **re-verifies the signature on every load** (hand-editing `license.json` doesn't unlock). Enforcement lives inside the destructive `ipcMain.handle` bodies in `register-ipc.ts`; the renderer shows an inline `UnlockPrompt` instead of ever hitting the refusal. Keys are issued locally by `scripts/license/issue-license.mjs` using a gitignored private key.

**Tech Stack:** Electron 33 (Node 20 — `node:crypto` Ed25519), TypeScript, vitest, existing 3-layer IPC pattern (`shared/ipc.constants.ts` → preload bridge → `ipcMain.handle`).

## Global Constraints

- Package manager: **pnpm** (`pnpm test` = `vitest run`, `pnpm typecheck`, `pnpm lint` = `biome check .`).
- Spec: `docs/superpowers/specs/2026-07-01-tidydisk-gtm-and-monetization-design.md`. Paywall boundary verbatim: "**Gated:** `projects:delete` / trash a node_modules, 'Clean N stale', `pnpm store prune`. **Free:** all scanning, sizing, the Packages tab, Caches inspection, Reveal in Finder, open-in-editor, notifications."
- **No network code, accounts, telemetry, trial timers, or seat limits** in the license module (spec's "out of scope for the first slice").
- One folder per renderer component: `index.ts`, `Component.tsx`, `Component.types.ts`.
- Conventional-commit subjects (`feat: …`, `test: …`, `chore: …`).
- UI copy stays **brand-neutral** ("unlock one-click cleanup", "€19 · lifetime") — the TidyDisk rename is a separate issue/branch. The key prefix `TIDY-` is fine (invisible until launch).
- Never modify `clean-my-node-modules/` (design handoff bundle).
- Work on branch `feat/license-gate` cut from `main`.
- The private signing key `.license-signing.pem` must be **gitignored before it is ever created** and never committed (public repo!).

## File Structure

```
src/shared/license.types.ts               LicenseState, ActivateResult (shared main↔renderer)
src/shared/license.constants.ts           BUY_URL (placeholder checkout link)
src/main/license/license.constants.ts     LICENSE_PUBLIC_KEY_PEM (bundled public key)
src/main/license/license-verify.ts        parseLicenseKey() — pure signature check
src/main/license/license-verify.test.ts
src/main/license/license-store.ts         LicenseStore — JSON persistence + activate()
src/main/license/license-store.test.ts
src/main/license/index.ts                 barrel: LicenseStore, parseLicenseKey
src/main/ipc/register-ipc.ts              (modify) license IPC + gate delete/prune
src/main/ipc/register-ipc.test.ts         gate enforcement tests
src/main/app-context.types.ts             (modify) + license: LicenseStore
src/main/index.ts                         (modify) instantiate LicenseStore
src/shared/ipc.constants.ts               (modify) 3 new channels
src/preload/index.ts, api.types.ts        (modify) bridge methods
src/renderer/src/hooks/useLicense.ts      live license state hook (mirrors useSettings)
src/renderer/src/components/UnlockPrompt/ index.ts, UnlockPrompt.tsx, UnlockPrompt.types.ts
src/renderer/src/launcher/LauncherApp/LauncherApp.tsx   (modify) guards + prompt + settings props
src/renderer/src/launcher/views/SettingsView.tsx        (modify) License row
src/renderer/src/panel/PanelApp/PanelApp.tsx            (modify) guards + prompt + soft affordance
scripts/license/make-keypair.mjs          one-time keypair generation
scripts/license/issue-license.mjs         sign a key for a buyer
.gitignore                                (modify) + .license-signing.pem
package.json                              (modify) + "license:issue" script
```

---

### Task 1: License key format + offline verifier

**Files:**
- Create: `src/shared/license.types.ts`
- Create: `src/main/license/license.constants.ts`
- Create: `src/main/license/license-verify.ts`
- Test: `src/main/license/license-verify.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces: `parseLicenseKey(key: unknown, publicKeyPem?: string): LicensePayload | null` where `LicensePayload = { email: string; issuedAt: number }`; types `LicenseState = { pro: boolean; email?: string; activatedAt?: number }` and `ActivateResult = { ok: true; state: LicenseState } | { ok: false; reason: 'invalid' }`; constant `LICENSE_PUBLIC_KEY_PEM: string`.

Key format: `TIDY-` + `base64url(JSON payload)` + `.` + `base64url(ed25519 signature of the payload bytes)`. Payload JSON is compact: `{"e":"buyer@email","t":<unix seconds>}`.

- [ ] **Step 1: Create the branch**

```bash
git checkout main && git pull && git checkout -b feat/license-gate
```

- [ ] **Step 2: Write the shared types and the (placeholder) public-key constant**

`src/shared/license.types.ts`:

```ts
/** What the renderer knows about licensing. */
export interface LicenseState {
  pro: boolean
  /** buyer email embedded in the key (present when pro) */
  email?: string
  /** epoch ms when the key was activated on this machine */
  activatedAt?: number
}

export type ActivateResult = { ok: true; state: LicenseState } | { ok: false; reason: 'invalid' }
```

`src/main/license/license.constants.ts` (placeholder until Task 2 generates the real key):

```ts
/**
 * Ed25519 public key that license signatures are verified against.
 * The matching private key lives OUTSIDE the repo (.license-signing.pem,
 * gitignored) — see scripts/license/make-keypair.mjs.
 */
export const LICENSE_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
REPLACED-IN-TASK-2
-----END PUBLIC KEY-----`
```

- [ ] **Step 3: Write the failing tests**

`src/main/license/license-verify.test.ts`:

```ts
import { generateKeyPairSync, sign } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { parseLicenseKey } from './license-verify'

const { publicKey, privateKey } = generateKeyPairSync('ed25519')
const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString()

function makeKey(payload: object, key = privateKey): string {
  const bytes = Buffer.from(JSON.stringify(payload))
  const sig = sign(null, bytes, key)
  return `TIDY-${bytes.toString('base64url')}.${sig.toString('base64url')}`
}

describe('parseLicenseKey', () => {
  it('accepts a validly signed key and returns its payload', () => {
    const key = makeKey({ e: 'buyer@example.com', t: 1751400000 })
    expect(parseLicenseKey(key, pem)).toEqual({ email: 'buyer@example.com', issuedAt: 1751400000 })
  })

  it('tolerates surrounding whitespace', () => {
    const key = `  ${makeKey({ e: 'a@b.c', t: 1 })}\n`
    expect(parseLicenseKey(key, pem)?.email).toBe('a@b.c')
  })

  it('rejects a tampered payload', () => {
    const key = makeKey({ e: 'buyer@example.com', t: 1751400000 })
    const [head, sig] = key.slice('TIDY-'.length).split('.')
    const forged = Buffer.from(JSON.stringify({ e: 'thief@example.com', t: 1751400000 })).toString('base64url')
    expect(parseLicenseKey(`TIDY-${forged}.${sig}`, pem)).toBeNull()
    expect(head).not.toBe(forged)
  })

  it('rejects a key signed by a different private key', () => {
    const other = generateKeyPairSync('ed25519')
    expect(parseLicenseKey(makeKey({ e: 'a@b.c', t: 1 }, other.privateKey), pem)).toBeNull()
  })

  it('rejects malformed input without throwing', () => {
    for (const bad of ['', 'TIDY-', 'TIDY-abc', 'TIDY-a.b.c', 'nope', 42, null, undefined, { key: 1 }]) {
      expect(parseLicenseKey(bad as never, pem)).toBeNull()
    }
  })

  it('rejects a valid signature over a payload missing required fields', () => {
    expect(parseLicenseKey(makeKey({ e: 'a@b.c' }), pem)).toBeNull()
    expect(parseLicenseKey(makeKey({ t: 1 }), pem)).toBeNull()
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm test -- src/main/license/license-verify.test.ts`
Expected: FAIL — cannot find module `./license-verify`.

- [ ] **Step 5: Implement `license-verify.ts`**

```ts
import { createPublicKey, verify } from 'node:crypto'
import { LICENSE_PUBLIC_KEY_PEM } from './license.constants'

export interface LicensePayload {
  email: string
  issuedAt: number
}

const PREFIX = 'TIDY-'

/**
 * Parses and signature-checks a license key. Returns the signed payload,
 * or null for anything that isn't a genuinely issued key. Never throws.
 */
export function parseLicenseKey(key: unknown, publicKeyPem: string = LICENSE_PUBLIC_KEY_PEM): LicensePayload | null {
  if (typeof key !== 'string') return null
  const trimmed = key.trim()
  if (!trimmed.startsWith(PREFIX)) return null
  const parts = trimmed.slice(PREFIX.length).split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  try {
    const payload = Buffer.from(parts[0], 'base64url')
    const signature = Buffer.from(parts[1], 'base64url')
    if (!verify(null, payload, createPublicKey(publicKeyPem), signature)) return null
    const data: unknown = JSON.parse(payload.toString('utf8'))
    if (typeof data !== 'object' || data === null) return null
    const { e, t } = data as { e?: unknown; t?: unknown }
    if (typeof e !== 'string' || typeof t !== 'number') return null
    return { email: e, issuedAt: t }
  } catch {
    return null
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test -- src/main/license/license-verify.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/shared/license.types.ts src/main/license/
git commit -m "feat: offline-verifiable ed25519 license key format + verifier"
```

---

### Task 2: Key issuance scripts + the real keypair

**Files:**
- Create: `scripts/license/make-keypair.mjs`
- Create: `scripts/license/issue-license.mjs`
- Modify: `.gitignore` (add `.license-signing.pem`)
- Modify: `package.json` (add `license:issue` script)
- Modify: `src/main/license/license.constants.ts` (paste the real public key)

**Interfaces:**
- Consumes: the key format from Task 1 (`TIDY-<b64url payload>.<b64url sig>`, payload `{e, t}`).
- Produces: `.license-signing.pem` (repo root, gitignored) and `pnpm license:issue <email>` printing a valid key. `LICENSE_PUBLIC_KEY_PEM` becomes the real key — from here on, keys issued by the script activate the real app.

- [ ] **Step 1: Gitignore the private key FIRST**

Append to `.gitignore` (before the key can ever exist):

```
.license-signing.pem
```

- [ ] **Step 2: Write `scripts/license/make-keypair.mjs`**

```js
// One-time Ed25519 keypair generation for license signing.
// Refuses to overwrite an existing key — real buyers' keys depend on it.
import { generateKeyPairSync } from 'node:crypto'
import { existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const keyFile = fileURLToPath(new URL('../../.license-signing.pem', import.meta.url))
if (existsSync(keyFile)) {
  console.error('.license-signing.pem already exists — refusing to overwrite.')
  console.error('Issued licenses are only valid against this exact key. Back it up; never regenerate.')
  process.exit(1)
}
const { publicKey, privateKey } = generateKeyPairSync('ed25519')
writeFileSync(keyFile, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 })
console.log('Private key written to .license-signing.pem (gitignored).')
console.log('BACK IT UP somewhere safe (password manager) — losing it orphans every sold license.\n')
console.log('Paste this into LICENSE_PUBLIC_KEY_PEM in src/main/license/license.constants.ts:\n')
console.log(publicKey.export({ type: 'spki', format: 'pem' }).toString())
```

- [ ] **Step 3: Write `scripts/license/issue-license.mjs`**

```js
// Issues a signed lifetime license key for a buyer.
// Usage: pnpm license:issue buyer@email.com
import { createPrivateKey, sign } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const email = process.argv[2]
if (!email || !email.includes('@')) {
  console.error('Usage: pnpm license:issue buyer@email.com')
  process.exit(1)
}
const keyFile = fileURLToPath(new URL('../../.license-signing.pem', import.meta.url))
const privateKey = createPrivateKey(readFileSync(keyFile, 'utf8'))
const payload = Buffer.from(JSON.stringify({ e: email, t: Math.floor(Date.now() / 1000) }))
const signature = sign(null, payload, privateKey)
console.log(`TIDY-${payload.toString('base64url')}.${signature.toString('base64url')}`)
```

- [ ] **Step 4: Add the pnpm script**

In `package.json` `"scripts"`, after `"icon"`:

```json
"license:issue": "node scripts/license/issue-license.mjs",
```

- [ ] **Step 5: Generate the real keypair and bundle the public key**

Run: `node scripts/license/make-keypair.mjs`
Expected: prints a `-----BEGIN PUBLIC KEY-----` block. Replace the placeholder body of `LICENSE_PUBLIC_KEY_PEM` in `src/main/license/license.constants.ts` with the printed PEM (keep it byte-exact, including the header/footer lines).

Run: `git status --short`
Expected: `.license-signing.pem` does NOT appear (gitignored). If it appears, STOP and fix `.gitignore` before committing anything.

- [ ] **Step 6: Verify end-to-end issuance against the bundled key**

Run:

```bash
KEY=$(pnpm --silent license:issue smoke@test.dev) && npx tsx -e "
import { parseLicenseKey } from './src/main/license/license-verify'
const p = parseLicenseKey(process.env.KEY)
if (p?.email !== 'smoke@test.dev') { console.error('MISMATCH', p); process.exit(1) }
console.log('issued key verifies against bundled public key ✓', p)
" 
```

(If `tsx` isn't available, equivalent check: `pnpm test -- src/main/license` still passes, and keep the issued `$KEY` for the Task 8 manual pass.)
Expected: `issued key verifies against bundled public key ✓`.

- [ ] **Step 7: Run the full test suite (guard against regressions)**

Run: `pnpm test`
Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add scripts/license/ .gitignore package.json src/main/license/license.constants.ts
git commit -m "feat: license issuance scripts + bundled signing public key"
```

---

### Task 3: LicenseStore — persistence that re-verifies on load

**Files:**
- Create: `src/main/license/license-store.ts`
- Create: `src/main/license/index.ts`
- Test: `src/main/license/license-store.test.ts`

**Interfaces:**
- Consumes: `parseLicenseKey(key, publicKeyPem?)` from Task 1; `LicenseState`, `ActivateResult` from `@shared/license.types`.
- Produces: `class LicenseStore { constructor(filePath?: string, publicKeyPem?: string); get(): LicenseState; activate(key: unknown): ActivateResult }`. Persisted file shape: `{ key: string, activatedAt: number }` at `userData/license.json`.

- [ ] **Step 1: Write the failing tests**

`src/main/license/license-store.test.ts` (mirrors `settings-store.test.ts`):

```ts
import { generateKeyPairSync, sign } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp' } }))

// imported after the mock so the module's `import { app }` resolves
const { LicenseStore } = await import('./license-store')

const { publicKey, privateKey } = generateKeyPairSync('ed25519')
const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString()

function makeKey(email: string): string {
  const bytes = Buffer.from(JSON.stringify({ e: email, t: 1751400000 }))
  return `TIDY-${bytes.toString('base64url')}.${sign(null, bytes, privateKey).toString('base64url')}`
}

const dir = mkdtempSync(join(tmpdir(), 'cmn-license-'))
const fileIn = (name: string): string => join(dir, name)
afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('LicenseStore', () => {
  it('is free when the file is missing', () => {
    expect(new LicenseStore(fileIn('missing.json'), pem).get()).toEqual({ pro: false })
  })

  it('is free on corrupt JSON', () => {
    const f = fileIn('corrupt.json')
    writeFileSync(f, '{ not: valid')
    expect(new LicenseStore(f, pem).get().pro).toBe(false)
  })

  it('activates a valid key, persists it, and a fresh store reads it back', () => {
    const f = fileIn('roundtrip.json')
    const s = new LicenseStore(f, pem)
    const res = s.activate(makeKey('buyer@example.com'))
    expect(res.ok).toBe(true)
    expect(s.get()).toMatchObject({ pro: true, email: 'buyer@example.com' })
    expect(s.get().activatedAt).toBeTypeOf('number')
    const fresh = new LicenseStore(f, pem)
    expect(fresh.get()).toMatchObject({ pro: true, email: 'buyer@example.com' })
  })

  it('rejects an invalid key and stays free', () => {
    const s = new LicenseStore(fileIn('reject.json'), pem)
    expect(s.activate('TIDY-garbage.key')).toEqual({ ok: false, reason: 'invalid' })
    expect(s.get().pro).toBe(false)
  })

  it('re-verifies on load: a hand-edited license.json does not unlock', () => {
    const f = fileIn('forged.json')
    writeFileSync(f, JSON.stringify({ key: 'TIDY-forged.nope', activatedAt: 123, pro: true }))
    expect(new LicenseStore(f, pem).get().pro).toBe(false)
  })

  it('persists only the key + activatedAt (state is derived, not trusted)', () => {
    const f = fileIn('shape.json')
    new LicenseStore(f, pem).activate(makeKey('shape@example.com'))
    const raw = JSON.parse(readFileSync(f, 'utf8'))
    expect(Object.keys(raw).sort()).toEqual(['activatedAt', 'key'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/main/license/license-store.test.ts`
Expected: FAIL — cannot find module `./license-store`.

- [ ] **Step 3: Implement `license-store.ts`**

```ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { ActivateResult, LicenseState } from '@shared/license.types'
import { app } from 'electron'
import { parseLicenseKey } from './license-verify'

/**
 * JSON-file-backed license store in the app's userData directory.
 * Only the signed key is trusted: state is re-derived by verifying the
 * signature on every load, so editing license.json can't unlock the app.
 */
export class LicenseStore {
  private state: LicenseState

  constructor(
    private filePath = join(app.getPath('userData'), 'license.json'),
    private publicKeyPem?: string,
  ) {
    this.state = this.load()
  }

  get(): LicenseState {
    return { ...this.state }
  }

  activate(key: unknown): ActivateResult {
    const payload = parseLicenseKey(key, this.publicKeyPem)
    if (!payload) return { ok: false, reason: 'invalid' }
    const activatedAt = Date.now()
    this.state = { pro: true, email: payload.email, activatedAt }
    this.persist((key as string).trim(), activatedAt)
    return { ok: true, state: this.get() }
  }

  private load(): LicenseState {
    try {
      const raw = JSON.parse(readFileSync(this.filePath, 'utf8')) as { key?: unknown; activatedAt?: unknown }
      const payload = parseLicenseKey(raw.key, this.publicKeyPem)
      if (!payload) return { pro: false }
      return {
        pro: true,
        email: payload.email,
        activatedAt: typeof raw.activatedAt === 'number' ? raw.activatedAt : undefined,
      }
    } catch {
      return { pro: false }
    }
  }

  private persist(key: string, activatedAt: number): void {
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      writeFileSync(this.filePath, JSON.stringify({ key, activatedAt }, null, 2))
    } catch (err) {
      console.error('Failed to persist license', err)
    }
  }
}
```

`src/main/license/index.ts`:

```ts
export { LicenseStore } from './license-store'
export { parseLicenseKey } from './license-verify'
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/main/license/license-store.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/license/
git commit -m "feat: LicenseStore — persisted, signature-re-verified license state"
```

---

### Task 4: IPC plumbing + main-process enforcement

**Files:**
- Modify: `src/shared/ipc.constants.ts`
- Modify: `src/main/app-context.types.ts`
- Modify: `src/main/ipc/register-ipc.ts`
- Modify: `src/main/index.ts`
- Modify: `src/preload/api.types.ts`
- Modify: `src/preload/index.ts`
- Test: `src/main/ipc/register-ipc.test.ts`

**Interfaces:**
- Consumes: `LicenseStore` from Task 3.
- Produces: IPC channels `license:get` → `LicenseState`, `license:activate` → `ActivateResult`, broadcast `license:changed` with `LicenseState`; renderer API `window.clean.getLicense()`, `window.clean.activateLicense(key)`, `window.clean.onLicenseChanged(fn)`. Gated handlers: unlicensed `projects:delete` returns `0` **without deleting or removing the project**; unlicensed `pnpm-store:prune` returns `{ ok: false, freedBytes: 0 }` **without spawning pnpm**.

- [ ] **Step 1: Add the channels**

In `src/shared/ipc.constants.ts`, after `prunePnpmStore`:

```ts
  getLicense: 'license:get',
  activateLicense: 'license:activate',
```

and in the events section after `onSettingsChanged`:

```ts
  onLicenseChanged: 'license:changed',
```

- [ ] **Step 2: Extend AppContext**

In `src/main/app-context.types.ts`:

```ts
import type { LicenseStore } from './license/license-store'
```

and add to the interface (after `settings`):

```ts
  license: LicenseStore
```

- [ ] **Step 3: Write the failing enforcement tests**

`src/main/ipc/register-ipc.test.ts`:

```ts
import type { Project } from '@shared/project.types'
import { describe, expect, it, vi } from 'vitest'

type Handler = (event: unknown, ...args: unknown[]) => unknown
const handlers = new Map<string, Handler>()
const sent: Array<[string, unknown]> = []

vi.mock('electron', () => ({
  app: { quit: vi.fn(), getPath: () => '/tmp' },
  ipcMain: {
    handle: (ch: string, fn: Handler) => handlers.set(ch, fn),
    on: (ch: string, fn: Handler) => handlers.set(ch, fn),
  },
  BrowserWindow: {
    getAllWindows: () => [
      { isDestroyed: () => false, webContents: { send: (ch: string, p: unknown) => sent.push([ch, p]) } },
    ],
    fromWebContents: () => null,
  },
  screen: { getDisplayNearestPoint: vi.fn() },
  shell: { openExternal: vi.fn() },
}))

const deleteNodeModules = vi.fn(async (p: Project) => p.size)
vi.mock('../actions/project-actions', () => ({
  deleteNodeModules: (p: Project) => deleteNodeModules(p),
  revealInFinder: vi.fn(),
  openProject: vi.fn(),
}))
const prunePnpmStore = vi.fn(async () => ({ ok: true, freedBytes: 512 }))
vi.mock('../pnpm-store/pnpm-store', () => ({
  getPnpmStoreInfo: vi.fn(),
  prunePnpmStore: () => prunePnpmStore(),
}))
vi.mock('../actions/app-actions', () => ({ uninstallApp: vi.fn() }))
vi.mock('../actions/pick-path', () => ({ pickPath: vi.fn() }))

const { IPC } = await import('@shared/ipc.constants')
const { registerIpc } = await import('./register-ipc')

const project = { id: 'p1', size: 1024 } as Project

function makeCtx(pro: boolean) {
  const remove = vi.fn()
  const activate = vi.fn(() => ({ ok: true as const, state: { pro: true } }))
  const ctx = {
    projects: { all: [project], remove, lastScanTime: 0 },
    packages: { get: vi.fn(), compute: vi.fn() },
    settings: { get: () => ({ pnpmStorePath: undefined, pnpmBinaryPath: undefined }) },
    license: { get: () => ({ pro }), activate },
    panel: { hide: vi.fn(), browserWindow: null },
    launcher: { open: vi.fn(), hide: vi.fn(), browserWindow: null },
    runScan: vi.fn(),
  }
  handlers.clear()
  sent.length = 0
  deleteNodeModules.mockClear()
  prunePnpmStore.mockClear()
  // biome-ignore lint/suspicious/noExplicitAny: deliberately partial test double
  registerIpc(ctx as any)
  return { ctx, remove, activate }
}

const invoke = (ch: string, ...args: unknown[]) => handlers.get(ch)?.({}, ...args)

describe('license enforcement in IPC handlers', () => {
  it('unlicensed delete refuses: returns 0, nothing trashed, project kept', async () => {
    const { remove } = makeCtx(false)
    expect(await invoke(IPC.deleteNodeModules, 'p1')).toBe(0)
    expect(deleteNodeModules).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })

  it('licensed delete goes through', async () => {
    const { remove } = makeCtx(true)
    expect(await invoke(IPC.deleteNodeModules, 'p1')).toBe(1024)
    expect(deleteNodeModules).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledWith('p1')
  })

  it('unlicensed prune refuses without spawning pnpm', async () => {
    makeCtx(false)
    expect(await invoke(IPC.prunePnpmStore)).toEqual({ ok: false, freedBytes: 0 })
    expect(prunePnpmStore).not.toHaveBeenCalled()
  })

  it('licensed prune goes through', async () => {
    makeCtx(true)
    expect(await invoke(IPC.prunePnpmStore)).toEqual({ ok: true, freedBytes: 512 })
  })

  it('license:get returns the store state; activate broadcasts on success', async () => {
    const { activate } = makeCtx(false)
    expect(await invoke(IPC.getLicense)).toEqual({ pro: false })
    const res = await invoke(IPC.activateLicense, 'TIDY-x.y')
    expect(activate).toHaveBeenCalledWith('TIDY-x.y')
    expect(res).toEqual({ ok: true, state: { pro: true } })
    expect(sent).toContainEqual([IPC.onLicenseChanged, { pro: true }])
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm test -- src/main/ipc/register-ipc.test.ts`
Expected: FAIL — `IPC.getLicense` undefined handler / gates missing (delete returns 1024 for unlicensed).

- [ ] **Step 5: Implement in `register-ipc.ts`**

Add the license handlers (after the `setSetting` block):

```ts
  ipcMain.handle(IPC.getLicense, () => ctx.license.get())
  ipcMain.handle(IPC.activateLicense, (_e, key: unknown) => {
    const result = ctx.license.activate(key)
    if (result.ok) broadcast(IPC.onLicenseChanged, result.state)
    return result
  })
```

Gate the two destructive handlers. Replace the `prunePnpmStore` handler body:

```ts
  ipcMain.handle(IPC.prunePnpmStore, () => {
    // Free tier sees everything but mutates nothing — cleanup is the paid unlock.
    if (!ctx.license.get().pro) return { ok: false, freedBytes: 0 }
    const s = ctx.settings.get()
    return prunePnpmStore({ storePath: s.pnpmStorePath, binaryPath: s.pnpmBinaryPath })
  })
```

and the `deleteNodeModules` handler:

```ts
  ipcMain.handle(IPC.deleteNodeModules, async (_e, id: string) => {
    if (!ctx.license.get().pro) return 0
    const project = ctx.projects.all.find((p) => p.id === id)
    if (!project) return 0
    const freed = await deleteNodeModules(project)
    ctx.projects.remove(id)
    return freed
  })
```

- [ ] **Step 6: Instantiate the store in `src/main/index.ts`**

Add import `import { LicenseStore } from './license'` and, next to the other stores:

```ts
  const license = new LicenseStore()
```

and extend the registerIpc call:

```ts
  registerIpc({ projects, packages, settings, license, panel, launcher, runScan })
```

- [ ] **Step 7: Bridge it in the preload**

`src/preload/api.types.ts` — add imports and methods:

```ts
import type { ActivateResult, LicenseState } from '@shared/license.types'
```

in `CleanApi` (after `setSetting`):

```ts
  getLicense(): Promise<LicenseState>
  /** Verifies + persists a license key; broadcasts license:changed on success. */
  activateLicense(key: string): Promise<ActivateResult>
```

and with the other subscriptions:

```ts
  onLicenseChanged(fn: (s: LicenseState) => void): () => void
```

`src/preload/index.ts` — in the `api` object:

```ts
  getLicense: () => ipcRenderer.invoke(IPC.getLicense),
  activateLicense: (key) => ipcRenderer.invoke(IPC.activateLicense, key),
  onLicenseChanged: subscribe(IPC.onLicenseChanged),
```

- [ ] **Step 8: Run tests + typecheck**

Run: `pnpm test -- src/main/ipc/register-ipc.test.ts && pnpm typecheck`
Expected: 5 tests PASS; typecheck clean.

- [ ] **Step 9: Commit**

```bash
git add src/shared/ipc.constants.ts src/main/ src/preload/
git commit -m "feat: license IPC + gate destructive handlers in the main process"
```

---

### Task 5: useLicense hook + UnlockPrompt component

**Files:**
- Create: `src/renderer/src/hooks/useLicense.ts`
- Create: `src/renderer/src/components/UnlockPrompt/index.ts`
- Create: `src/renderer/src/components/UnlockPrompt/UnlockPrompt.tsx`
- Create: `src/renderer/src/components/UnlockPrompt/UnlockPrompt.types.ts`
- Create: `src/shared/license.constants.ts`

**Interfaces:**
- Consumes: `window.clean.getLicense/activateLicense/onLicenseChanged` from Task 4.
- Produces: `useLicense(): { license: LicenseState; activate: (key: string) => Promise<ActivateResult> }`; `<UnlockPrompt accent bytes? activate onClose />`; `BUY_URL: string`.

- [ ] **Step 1: Create the checkout-link constant**

`src/shared/license.constants.ts`:

```ts
/**
 * Where "Buy" sends people. Placeholder until the Merchant-of-Record product
 * exists (Lemon Squeezy / Paddle) — must stay https (openExternal guard).
 */
export const BUY_URL = 'https://tidydisk.app/#buy'
```

- [ ] **Step 2: Write `useLicense.ts`** (mirrors `useSettings.ts`)

```ts
import type { ActivateResult, LicenseState } from '@shared/license.types'
import { useCallback, useEffect, useState } from 'react'

export interface UseLicense {
  license: LicenseState
  activate: (key: string) => Promise<ActivateResult>
}

/** Live license state synced with the main process across all windows. */
export function useLicense(): UseLicense {
  const [license, setLicense] = useState<LicenseState>({ pro: false })

  useEffect(() => {
    let alive = true
    window.clean.getLicense().then((s) => {
      if (alive) setLicense(s)
    })
    const unsubscribe = window.clean.onLicenseChanged(setLicense)
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  const activate = useCallback(async (key: string) => {
    const result = await window.clean.activateLicense(key)
    if (result.ok) setLicense(result.state)
    return result
  }, [])

  return { license, activate }
}
```

- [ ] **Step 3: Write the component types**

`UnlockPrompt.types.ts`:

```ts
import type { ActivateResult } from '@shared/license.types'

export interface UnlockPromptProps {
  accent: string
  /** Bytes the blocked action would have freed — sharpens the pitch when known. */
  bytes?: number
  activate: (key: string) => Promise<ActivateResult>
  onClose: () => void
}
```

- [ ] **Step 4: Write `UnlockPrompt.tsx`**

Self-contained inline styling (design tokens) so it drops into both the launcher footer slot and the panel column:

```tsx
import { formatSizeStr } from '@renderer/lib/format'
import { BUY_URL } from '@shared/license.constants'
import type { ReactNode } from 'react'
import { useState } from 'react'
import type { UnlockPromptProps } from './UnlockPrompt.types'

/** Inline paywall shown when a free-tier user triggers a Clean action. */
export function UnlockPrompt({ accent, bytes, activate, onClose }: UnlockPromptProps): ReactNode {
  const [entering, setEntering] = useState(false)
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [invalid, setInvalid] = useState(false)

  const submit = async (): Promise<void> => {
    if (!key.trim() || busy) return
    setBusy(true)
    const result = await activate(key)
    setBusy(false)
    if (result.ok) onClose()
    else setInvalid(true)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 14px',
        minHeight: 44,
      }}
    >
      {entering ? (
        <>
          <input
            autoFocus
            value={key}
            onChange={(e) => {
              setKey(e.target.value)
              setInvalid(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit()
            }}
            placeholder="TIDY-…"
            spellCheck={false}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'var(--surface-2)',
              border: invalid ? `1px solid ${accent}` : '1px solid var(--hairline)',
              borderRadius: 7,
              padding: '6px 9px',
              fontSize: 12.5,
              color: 'var(--text)',
              outline: 'none',
            }}
          />
          {invalid && (
            <span style={{ fontSize: 11.5, color: accent, whiteSpace: 'nowrap' }}>Invalid key</span>
          )}
          <button className="cc-btn ghost" onClick={() => setEntering(false)}>
            Back
          </button>
          <button className="cc-btn danger" style={{ background: accent, opacity: busy ? 0.6 : 1 }} onClick={() => void submit()}>
            Activate
          </button>
        </>
      ) : (
        <>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 650, color: 'var(--text)' }}>
              {bytes ? `Reclaim ${formatSizeStr(bytes)} — unlock one-click cleanup` : 'Unlock one-click cleanup'}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 1 }}>
              €19 · lifetime license · scanning stays free forever
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
            <button className="cc-btn ghost" onClick={onClose}>
              Not now
            </button>
            <button className="cc-btn ghost" onClick={() => setEntering(true)}>
              I have a key
            </button>
            <button
              className="cc-btn danger"
              style={{ background: accent }}
              onClick={() => void window.clean.openExternal(BUY_URL)}
            >
              Buy · €19
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

`index.ts`:

```ts
export { UnlockPrompt } from './UnlockPrompt'
```

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: clean (component not yet used anywhere — that's Tasks 6–7).

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/hooks/useLicense.ts src/renderer/src/components/UnlockPrompt/ src/shared/license.constants.ts
git commit -m "feat: useLicense hook + UnlockPrompt paywall component"
```

---

### Task 6: Launcher gating — delete, prune, Settings License row

**Files:**
- Modify: `src/renderer/src/launcher/LauncherApp/LauncherApp.tsx`
- Modify: `src/renderer/src/launcher/views/SettingsView.tsx`

**Interfaces:**
- Consumes: `useLicense`, `UnlockPrompt` (Task 5).
- Produces: unlicensed delete/prune in the launcher opens the UnlockPrompt in the footer (never calls the IPC); `SettingsView` gains props `license: LicenseState` and `activateLicense: (key: string) => Promise<ActivateResult>`.

- [ ] **Step 1: Wire state + guards in `LauncherApp.tsx`**

Add imports:

```ts
import { UnlockPrompt } from '@renderer/components/UnlockPrompt'
import { useLicense } from '@renderer/hooks/useLicense'
```

Next to the existing `useSettings()` call add:

```ts
  const { license, activate: activateLicense } = useLicense()
```

Next to `const [confirm, setConfirm] = useState<Project | null>(null)` (line ~55) add:

```ts
  const [unlock, setUnlock] = useState<{ bytes?: number } | null>(null)
```

Replace `commitDelete` (line ~173) with:

```ts
  const commitDelete = useCallback(
    (p: Project) => {
      if (!license.pro) {
        setConfirm(null)
        setUnlock({ bytes: p.uniqueSize ?? p.size })
        return
      }
      setConfirm(null)
      setDeleting((s) => new Set(s).add(p.id))
      void window.clean.deleteNodeModules(p.id).then((freed) => {
        setDeleting((s) => {
          const n = new Set(s)
          n.delete(p.id)
          return n
        })
        setReclaimed((r) => r + freed)
        flashToast({
          icon: UIIcon.checkCircle,
          text: `Reclaimed ${formatSizeStr(freed || (p.uniqueSize ?? p.size))} · ${p.name}`,
          tone: 'good',
        })
      })
    },
    [flashToast, license.pro],
  )
```

Replace `handlePrune` (line ~196) with:

```ts
  const handlePrune = useCallback(async () => {
    if (!license.pro) {
      setUnlock({})
      return
    }
    const res = await prune()
    if (res?.ok) {
      flashToast({
        icon: UIIcon.checkCircle,
        text: `Reclaimed ${formatSizeStr(res.freedBytes)} · pnpm store`,
        tone: 'good',
      })
    }
  }, [prune, flashToast, license.pro])
```

- [ ] **Step 2: Let esc dismiss the prompt**

In the keyboard `onKey` handler, at the top of the `Escape` branch (before the `if (confirm)` check around line ~232), add:

```ts
        if (unlock) {
          setUnlock(null)
          return
        }
```

and add `unlock` to that effect's dependency array (the one listing `confirm`, ~line 312).

- [ ] **Step 3: Render the prompt in the footer slot**

The footer is a ternary starting `{confirm ? (` (line ~589). Extend it so unlock wins:

```tsx
          {unlock ? (
            <div className="cc-footer" style={{ background: mixColor('rgba(255,99,99,0)', accent, 0.08), padding: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <UnlockPrompt
                  accent={accent}
                  bytes={unlock.bytes}
                  activate={activateLicense}
                  onClose={() => setUnlock(null)}
                />
              </div>
            </div>
          ) : confirm ? (
```

(the rest of the existing `confirm ? … : …` chain is unchanged).

- [ ] **Step 4: Pass license props to SettingsView**

Find the `<SettingsView` element in `LauncherApp.tsx` and add:

```tsx
            license={license}
            activateLicense={activateLicense}
```

- [ ] **Step 5: Add the License row to `SettingsView.tsx`**

Extend the imports and props:

```ts
import type { ActivateResult, LicenseState } from '@shared/license.types'
import { BUY_URL } from '@shared/license.constants'
import { useState } from 'react'
```

```ts
interface SettingsViewProps {
  settings: Settings
  setSetting: SetSetting
  accent: string
  store: PnpmStoreInfo | null
  onRefreshStore: () => void
  license: LicenseState
  activateLicense: (key: string) => Promise<ActivateResult>
}
```

Add a local activator component after `SettingsRow` (same local-helper precedent):

```tsx
function LicenseActivator({
  accent,
  activate,
}: {
  accent: string
  activate: (key: string) => Promise<ActivateResult>
}): ReactNode {
  const [key, setKey] = useState('')
  const [invalid, setInvalid] = useState(false)
  const submit = async (): Promise<void> => {
    if (!key.trim()) return
    const result = await activate(key)
    if (!result.ok) setInvalid(true)
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {invalid && <span style={{ fontSize: 11.5, color: accent }}>Invalid</span>}
      <input
        value={key}
        onChange={(e) => {
          setKey(e.target.value)
          setInvalid(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void submit()
        }}
        placeholder="TIDY-…"
        spellCheck={false}
        style={{
          width: 170,
          background: 'var(--surface-2)',
          border: '1px solid var(--hairline)',
          borderRadius: 7,
          padding: '6px 9px',
          fontSize: 12,
          color: 'var(--text)',
          outline: 'none',
        }}
      />
      <button className="cc-btn ghost" onClick={() => void submit()}>
        Activate
      </button>
    </div>
  )
}
```

Then, in the view, insert a row **before** the Uninstall row (line ~109), updating the destructure to include the new props:

```tsx
      <SettingsRow
        label="License"
        hint={
          license.pro
            ? `Pro · ${license.email ?? 'licensed'} · cleanup unlocked`
            : 'Free — scan & see everything; one-click cleanup needs a license'
        }
      >
        {license.pro ? (
          <span style={{ fontSize: 12.5, fontWeight: 650, color: '#34d399' }}>Pro ✓</span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="cc-btn danger"
              style={{ background: accent }}
              onClick={() => void window.clean.openExternal(BUY_URL)}
            >
              Buy · €19
            </button>
            <LicenseActivator accent={accent} activate={activateLicense} />
          </div>
        )}
      </SettingsRow>
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
```

- [ ] **Step 6: Typecheck, lint, full tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all clean/green.

- [ ] **Step 7: Manual verification in dev**

Run: `pnpm dev` → open launcher (from the tray panel — remember it hides on blur in dev):
- ⌘⌫ on a project → UnlockPrompt appears in the footer (no deletion), esc dismisses.
- Caches tab → ↵ on the pnpm store → UnlockPrompt (no prune).
- ⌘, Settings → License row shows Free + Buy + key field; paste a key from `pnpm license:issue me@test.dev` → row flips to `Pro ✓`; delete now works and actually trashes.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/src/launcher/
git commit -m "feat: gate launcher delete/prune behind the license + Settings License row"
```

---

### Task 7: Panel gating + soft unlock affordance

**Files:**
- Modify: `src/renderer/src/panel/PanelApp/PanelApp.tsx`

**Interfaces:**
- Consumes: `useLicense`, `UnlockPrompt` (Task 5).
- Produces: unlicensed MiniRow delete / "Clean N stale" / pnpm prune in the panel opens the UnlockPrompt; a quiet "Free version" affordance under the list when unlicensed.

- [ ] **Step 1: Wire state + guards**

Add imports:

```ts
import { UnlockPrompt } from '@renderer/components/UnlockPrompt'
import { useLicense } from '@renderer/hooks/useLicense'
```

Inside `PanelApp`, next to the other hooks:

```ts
  const { license, activate: activateLicense } = useLicense()
  const [unlock, setUnlock] = useState<{ bytes?: number } | null>(null)
```

Replace `removeMany` (line ~65) with (guard first — covers both MiniRow deletes and Clean-stale, which calls it):

```ts
  const removeMany = useCallback(
    async (ids: string[], label?: string) => {
      if (!license.pro) {
        const bytes = projects
          .filter((p) => ids.includes(p.id))
          .reduce((a, p) => a + (p.uniqueSize ?? p.size), 0)
        setUnlock({ bytes })
        return
      }
      setDeleting((s) => new Set([...s, ...ids]))
      let freed = 0
      for (const id of ids) freed += await window.clean.deleteNodeModules(id)
      setDeleting((s) => {
        const n = new Set(s)
        for (const i of ids) n.delete(i)
        return n
      })
      setReclaimed((r) => r + freed)
      flashToast({ text: `Reclaimed ${formatSizeStr(freed)}${label ? ` · ${label}` : ''}`, good: true })
    },
    [flashToast, license.pro, projects],
  )
```

Replace `pruneStore` (line ~81) with:

```ts
  const pruneStore = useCallback(async () => {
    if (!license.pro) {
      setUnlock({})
      return
    }
    const result = await prune()
    if (result?.ok) {
      setReclaimed((r) => r + result.freedBytes)
      flashToast({ text: `Reclaimed ${formatSizeStr(result.freedBytes)} · pnpm store`, good: true })
    } else if (result) {
      flashToast({ text: 'pnpm store prune failed' })
    }
  }, [prune, flashToast, license.pro])
```

- [ ] **Step 2: Esc dismisses the prompt first**

In the keyboard handler's `Escape` branch (line ~116), before the existing checks:

```ts
      } else if (e.key === 'Escape') {
        if (unlock) setUnlock(null)
        else if (view !== 'main') setView('main')
        else void window.clean.closeWindow()
      }
```

and add `unlock` to that effect's dependency array (currently `[view]`).

- [ ] **Step 3: Render the prompt + soft affordance**

In the `view === 'main'` block, directly after the `{staleSet.length > 0 ? (<CleanStaleCta …>) : (<div style={{ height: 8 }} />)}` ternary (line ~210–219), add:

```tsx
              {unlock && (
                <>
                  <Separator />
                  <UnlockPrompt
                    accent={accent}
                    bytes={unlock.bytes}
                    activate={activateLicense}
                    onClose={() => setUnlock(null)}
                  />
                </>
              )}
              {!license.pro && !unlock && (
                <button
                  onClick={() => setUnlock({ bytes: freeable || undefined })}
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 15px 2px',
                    fontSize: 10.5,
                    color: 'var(--text-dim)',
                    textAlign: 'left',
                  }}
                >
                  Free version — scanning is free forever · unlock one-click cleanup
                </button>
              )}
```

(The panel window auto-sizes to content via the existing `window:set-height` flow, so the extra rows are absorbed automatically.)

- [ ] **Step 4: Typecheck, lint, full tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: clean/green.

- [ ] **Step 5: Manual verification in dev**

Run: `pnpm dev` → tray panel:
- Hover a project row → trash icon → UnlockPrompt slides in below the list (no deletion).
- "Clean N stale folders" → UnlockPrompt with the total freeable bytes in the pitch.
- The muted "Free version…" line shows when unlicensed; disappears after activating (activate in launcher Settings, panel updates live via the broadcast).

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/panel/
git commit -m "feat: gate panel cleanup actions + free-tier unlock affordance"
```

---

### Task 8: Full verification + dashboard

**Files:**
- Modify: `STATUS.html` (data block only)

- [ ] **Step 1: Full local CI parity**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: everything green (CI runs the same on the PR).

- [ ] **Step 2: End-to-end license lifecycle check**

```bash
pnpm license:issue e2e@test.dev
```

`pnpm dev` → activate that key in launcher Settings → confirm `license.json` appeared in the app's userData dir, delete works, prune works. Then quit, hand-edit `license.json`'s key to garbage, relaunch → app is Free again (re-verification works), the gate refuses.

- [ ] **Step 3: Update STATUS.html**

In the `STATUS` data block: move the "License gate (free scan / paid clean)" item in the TidyDisk milestone from `planned` to `done` (adjust its detail to what shipped), bump `updated`, append a one-line `log` entry, and add a `userActions` testing entry: "e2e-license-gate — run the packaged app, buy-flow dry-run: scan free, delete blocked, activate a real issued key, delete works".

- [ ] **Step 4: Commit + push + PR**

```bash
git add STATUS.html
git commit -m "docs: STATUS — license gate shipped"
git push -u origin feat/license-gate
gh pr create --title "feat: license gate — free scan, paid clean" --body "Implements the license-gate slice of docs/superpowers/specs/2026-07-01-tidydisk-gtm-and-monetization-design.md ..."
```

---

## Out of scope (per spec — do NOT build)

- Online activation / MoR API integration (keys are issued locally; instant-delivery automation is a later, app-untouched add-on: MoR webhook → sign → email).
- Trial timers, machine limits, seat management, license portal, deactivation.
- The TidyDisk rename, checkout page, and landing-page pricing section (separate issues).
