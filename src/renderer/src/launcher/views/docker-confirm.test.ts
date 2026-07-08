import { describe, expect, it } from 'vitest'
import { confirmSatisfied, needsTypedConfirm, requiredConfirmText } from './docker-confirm'

describe('needsTypedConfirm', () => {
  it('is true for volumes', () => {
    expect(needsTypedConfirm({ kind: 'volume' })).toBe(true)
  })

  it('is false for images, containers, and build cache', () => {
    expect(needsTypedConfirm({ kind: 'image' })).toBe(false)
    expect(needsTypedConfirm({ kind: 'container' })).toBe(false)
    expect(needsTypedConfirm({ kind: 'buildcache' })).toBe(false)
  })
})

describe('requiredConfirmText', () => {
  it('is the volume name for a per-item removal', () => {
    expect(requiredConfirmText({ kind: 'volume', name: 'pgdata' })).toBe('pgdata')
  })

  it('is "prune" for a bulk volume prune', () => {
    expect(requiredConfirmText({ kind: 'prune' })).toBe('prune')
  })
})

describe('confirmSatisfied', () => {
  it('is true when the typed text matches exactly', () => {
    expect(confirmSatisfied('pgdata', 'pgdata')).toBe(true)
  })

  it('is false on a partial match', () => {
    expect(confirmSatisfied('pgdata', 'pg')).toBe(false)
  })

  it('trims surrounding whitespace from the typed text before comparing', () => {
    expect(confirmSatisfied('pgdata', '  pgdata  ')).toBe(true)
  })

  it('is false for an empty typed value', () => {
    expect(confirmSatisfied('pgdata', '')).toBe(false)
  })

  it('is case-sensitive', () => {
    expect(confirmSatisfied('pgdata', 'PGDATA')).toBe(false)
  })
})
