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

/** Pure: first matching dependency wins (most specific first); else 'node'. */
export function kindFromDeps(deps: Record<string, string | undefined>): FrameworkKind {
  for (const [dep, kind] of KIND_BY_DEPENDENCY) {
    if (deps[dep]) return kind
  }
  return 'node'
}

export async function detectKind(projectDir: string): Promise<FrameworkKind> {
  try {
    const raw = await readFile(join(projectDir, 'package.json'), 'utf8')
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    return kindFromDeps({ ...pkg.devDependencies, ...pkg.dependencies })
  } catch {
    // unreadable/malformed package.json → generic node project
    return 'node'
  }
}
