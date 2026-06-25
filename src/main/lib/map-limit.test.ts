import { describe, expect, it } from 'vitest'
import { mapLimit } from './map-limit'

describe('mapLimit', () => {
  it('maps every item and preserves input order', async () => {
    const out = await mapLimit([1, 2, 3, 4], 2, async (n) => n * 10)
    expect(out).toEqual([10, 20, 30, 40])
  })

  it('passes the index to the callback', async () => {
    const out = await mapLimit(['a', 'b', 'c'], 2, async (_v, i) => i)
    expect(out).toEqual([0, 1, 2])
  })

  it('never runs more than `limit` tasks concurrently', async () => {
    let inFlight = 0
    let peak = 0
    await mapLimit([1, 2, 3, 4, 5, 6], 2, async () => {
      inFlight++
      peak = Math.max(peak, inFlight)
      await new Promise((r) => setTimeout(r, 5))
      inFlight--
    })
    expect(peak).toBeLessThanOrEqual(2)
  })

  it('returns [] for an empty input', async () => {
    expect(await mapLimit([], 4, async (n) => n)).toEqual([])
  })
})
