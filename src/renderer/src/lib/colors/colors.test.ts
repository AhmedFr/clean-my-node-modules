import { describe, expect, it } from 'vitest'
import { mixColor, statusColor } from './colors'

describe('mixColor', () => {
  it('returns the first color at t=0', () => {
    expect(mixColor('#000000', '#ffffff', 0)).toBe('rgba(0,0,0,1.000)')
  })

  it('returns the second color at t=1', () => {
    expect(mixColor('#000000', '#ffffff', 1)).toBe('rgba(255,255,255,1.000)')
  })

  it('interpolates midway', () => {
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('rgba(128,128,128,1.000)')
  })

  it('expands 3-digit hex', () => {
    expect(mixColor('#fff', '#fff', 0)).toBe('rgba(255,255,255,1.000)')
  })

  it('parses rgba inputs and interpolates alpha', () => {
    expect(mixColor('rgba(0,0,0,0)', 'rgba(0,0,0,1)', 0.25)).toBe('rgba(0,0,0,0.250)')
  })

  it('clamps t outside [0,1]', () => {
    expect(mixColor('#000', '#fff', 2)).toBe('rgba(255,255,255,1.000)')
    expect(mixColor('#000', '#fff', -1)).toBe('rgba(0,0,0,1.000)')
  })
})

describe('statusColor', () => {
  it('is green territory when well under the limit', () => {
    expect(statusColor(0.1)).toMatch(/^rgba\(/)
    expect(statusColor(0)).toBe('rgba(34,179,120,1.000)')
  })

  it('hits the warn amber at ratio 0.82', () => {
    expect(statusColor(0.82)).toBe('rgba(245,177,76,1.000)')
  })

  it('reaches the accent at ratio >= 1', () => {
    expect(statusColor(1, '#ff6363')).toBe('rgba(255,99,99,1.000)')
    expect(statusColor(5, '#ff6363')).toBe('rgba(255,99,99,1.000)')
  })
})
