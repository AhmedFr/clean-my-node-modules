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
