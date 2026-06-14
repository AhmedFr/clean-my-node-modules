import { describe, expect, it } from 'vitest'
import { parseDuKb } from './folder-size'

describe('parseDuKb', () => {
  it('parses kilobytes from du -sk output into bytes', () => {
    expect(parseDuKb('123456\t/Users/me/Library/pnpm/store/v3\n')).toBe(123456 * 1024)
  })

  it('handles space-separated output', () => {
    expect(parseDuKb('42 /tmp/x')).toBe(42 * 1024)
  })

  it('returns 0 for garbage output', () => {
    expect(parseDuKb('')).toBe(0)
    expect(parseDuKb('du: cannot access')).toBe(0)
  })
})
