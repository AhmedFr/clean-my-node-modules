import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { folderSize, measureNodeModules, parseDuKb } from './folder-size'

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

describe('measureNodeModules', () => {
  let root: string
  let nm: string

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'cmnm-measure-'))
    nm = join(root, 'node_modules')
    // .pnpm subtree = store-backed package content (shared/linked)
    mkdirSync(join(nm, '.pnpm', 'left-pad@1.0.0', 'node_modules', 'left-pad'), { recursive: true })
    writeFileSync(
      join(nm, '.pnpm', 'left-pad@1.0.0', 'node_modules', 'left-pad', 'index.js'),
      Buffer.alloc(256 * 1024, 1),
    )
    // a real cache dir that lives in node_modules -> the project's own freeable content
    mkdirSync(join(nm, '.cache'), { recursive: true })
    writeFileSync(join(nm, '.cache', 'blob.bin'), Buffer.alloc(64 * 1024, 2))
  })

  afterAll(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('reports unique as apparent minus the .pnpm subtree', async () => {
    const { apparent, unique } = await measureNodeModules(nm)
    const total = await folderSize(nm)
    const pnpm = await folderSize(join(nm, '.pnpm'))
    expect(apparent).toBe(total)
    expect(unique).toBe(total - pnpm)
    expect(unique).toBeGreaterThan(0) // the .cache content is real and freeable
    expect(apparent).toBeGreaterThan(unique) // .pnpm contributes shared bytes
  })

  it('treats a folder without .pnpm as fully unique', async () => {
    const plain = join(root, 'plain-nm')
    mkdirSync(plain, { recursive: true })
    writeFileSync(join(plain, 'real.bin'), Buffer.alloc(32 * 1024, 3))
    const { apparent, unique } = await measureNodeModules(plain)
    expect(apparent).toBeGreaterThan(0)
    expect(unique).toBe(apparent)
  })
})
