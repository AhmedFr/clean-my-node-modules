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
