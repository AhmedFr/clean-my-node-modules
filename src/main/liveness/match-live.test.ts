import { describe, expect, it } from 'vitest'
import { matchLive } from './match-live'

const procs = [
  { pid: 1, command: 'node', cwd: '/u/app' },
  { pid: 2, command: 'node', cwd: '/u/app/packages/web' },
  { pid: 3, command: 'bash', cwd: '/u/other' },
]

describe('matchLive', () => {
  it('marks a dir live on exact cwd match', () => {
    const m = matchLive(procs, ['/u/app'])
    expect(m.get('/u/app')).toEqual({ pid: 1, command: 'node' })
  })
  it('marks a dir live when a process runs in a subfolder', () => {
    const m = matchLive([procs[1]], ['/u/app'])
    expect(m.get('/u/app')).toEqual({ pid: 2, command: 'node' })
  })
  it('leaves unrelated dirs out of the map', () => {
    const m = matchLive(procs, ['/u/nope'])
    expect(m.has('/u/nope')).toBe(false)
  })
  it('attaches a port when the matching pid is listening', () => {
    const m = matchLive([procs[0]], ['/u/app'], new Map([[1, 3000]]))
    expect(m.get('/u/app')).toEqual({ pid: 1, command: 'node', port: 3000 })
  })
})
