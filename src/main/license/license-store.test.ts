import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'
import type { PolarValidation } from './polar-client'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp' }, net: { fetch: vi.fn() } }))

const { LicenseStore } = await import('./license-store')

const DAY = 24 * 60 * 60 * 1000
const T0 = 1_751_500_000_000

// Explicit `Promise<PolarValidation>` return types keep `mockImplementation`
// reassignments (e.g. granted -> invalid) type-checking against the full
// union rather than the narrow shape vi.fn() would otherwise infer.
const granted = (email = 'buyer@example.com') =>
  vi.fn(async (): Promise<PolarValidation> => ({ ok: true as const, email }))
const invalid = () => vi.fn(async (): Promise<PolarValidation> => ({ ok: false as const, reason: 'invalid' as const }))
const offline = () => vi.fn(async (): Promise<PolarValidation> => ({ ok: false as const, reason: 'network' as const }))

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
