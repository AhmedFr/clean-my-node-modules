import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { FrameworkKind } from '@shared/project.types'

/** Ordered checks: the first dependency match wins (most specific first). */
const KIND_BY_DEPENDENCY: Array<[string, FrameworkKind]> = [
  ['next', 'next'],
  ['expo', 'expo'],
  ['react-native', 'expo'],
  ['@remix-run/react', 'remix'],
  ['@remix-run/node', 'remix'],
  ['astro', 'astro'],
  ['nuxt', 'vue'],
  ['vue', 'vue'],
  ['svelte', 'svelte'],
  ['react', 'react'],
  ['vite', 'vite'],
  ['typescript', 'ts'],
]

export async function detectKind(projectDir: string): Promise<FrameworkKind> {
  try {
    const raw = await readFile(join(projectDir, 'package.json'), 'utf8')
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const deps = { ...pkg.devDependencies, ...pkg.dependencies }
    for (const [dep, kind] of KIND_BY_DEPENDENCY) {
      if (deps[dep]) return kind
    }
  } catch {
    // unreadable/malformed package.json → generic node project
  }
  return 'node'
}
