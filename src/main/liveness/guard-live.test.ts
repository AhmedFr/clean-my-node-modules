import { describe, expect, it } from 'vitest'
import { liveGuard } from './guard-live'

describe('liveGuard', () => {
  it('blocks when the project dir is live', async () => {
    const detect = async () => new Map([['/u/app', { pid: 1, command: 'node' }]])
    expect(await liveGuard('/u/app', detect)).toEqual({ freed: 0, blocked: 'live' })
  })
  it('allows (null) when not live', async () => {
    const detect = async () => new Map()
    expect(await liveGuard('/u/app', detect)).toBeNull()
  })
})
