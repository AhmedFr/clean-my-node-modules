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
