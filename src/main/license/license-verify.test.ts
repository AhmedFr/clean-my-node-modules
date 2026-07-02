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
