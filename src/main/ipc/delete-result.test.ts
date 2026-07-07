import { describe, expect, it } from 'vitest'
import { guardExists } from '../actions/project-actions'

describe('guardExists', () => {
  it('returns unmounted when node_modules is gone', () => {
    expect(guardExists('/gone/node_modules', () => false)).toEqual({ freed: 0, blocked: 'unmounted' })
  })
  it('returns null when present (proceed)', () => {
    expect(guardExists('/here/node_modules', () => true)).toBeNull()
  })
})
