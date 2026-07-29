import { describe, expect, it } from 'vitest'
import { encodePng } from './png-encode'

describe('encodePng', () => {
  it('produces a valid PNG header with the right dimensions', () => {
    const w = 3
    const h = 2
    const png = encodePng(Buffer.alloc(w * h * 4, 0xff), w, h)
    // PNG signature
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    // IHDR chunk starts at byte 8: 4-byte length, 'IHDR', then width/height
    expect(png.subarray(12, 16).toString('ascii')).toBe('IHDR')
    expect(png.readUInt32BE(16)).toBe(w)
    expect(png.readUInt32BE(20)).toBe(h)
    // 8-bit RGBA
    expect(png[24]).toBe(8)
    expect(png[25]).toBe(6)
  })
})
