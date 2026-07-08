import { describe, expect, it } from 'vitest'
import { parseLsofPorts } from './parse-lsof-ports'

const SAMPLE = ['p123', 'n*:3000', 'p456', 'n127.0.0.1:5432', ''].join('\n')

describe('parseLsofPorts', () => {
  it('maps pid to its listening port', () => {
    expect(parseLsofPorts(SAMPLE)).toEqual(
      new Map([
        [123, 3000],
        [456, 5432],
      ]),
    )
  })
  it('returns an empty map for empty input', () => {
    expect(parseLsofPorts('')).toEqual(new Map())
  })
})
