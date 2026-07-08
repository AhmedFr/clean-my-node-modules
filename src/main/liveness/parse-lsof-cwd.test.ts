import { describe, expect, it } from 'vitest'
import { parseLsofCwd } from './parse-lsof-cwd'

const SAMPLE = [
  'p123',
  'cnode',
  'fcwd',
  'n/Users/me/projects/app',
  'p456',
  'cpostgres',
  'fcwd',
  'n/Users/me/db',
  '',
].join('\n')

describe('parseLsofCwd', () => {
  it('extracts pid, command, and cwd per process', () => {
    expect(parseLsofCwd(SAMPLE)).toEqual([
      { pid: 123, command: 'node', cwd: '/Users/me/projects/app' },
      { pid: 456, command: 'postgres', cwd: '/Users/me/db' },
    ])
  })
  it('returns [] for empty input', () => {
    expect(parseLsofCwd('')).toEqual([])
  })
  it('skips a process with no cwd line', () => {
    expect(parseLsofCwd('p1\ncbash\n')).toEqual([])
  })
})
