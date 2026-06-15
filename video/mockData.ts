/** Mock project rows for the showcase. Sizes are GB-scale so clearing the */
/** top rows visibly drains the gauge from over-limit (red) to safe (green). */

export type Framework = 'next' | 'node' | 'react' | 'svelte' | 'ts' | 'vue'

export interface MockProject {
  id: string
  name: string
  path: string
  framework: Framework
  /** node_modules size in GB. */
  sizeGB: number
  /** "last used" label, e.g. "5 months ago". */
  age: string
}

export const PROJECTS: MockProject[] = [
  { id: 'web', name: 'web', path: '~/code/acme/web', framework: 'next', sizeGB: 6.2, age: '2 months ago' },
  { id: 'api', name: 'api', path: '~/code/acme/services/api', framework: 'node', sizeGB: 5.4, age: '3 months ago' },
  {
    id: 'dashboard',
    name: 'dashboard',
    path: '~/code/acme/apps/dashboard',
    framework: 'react',
    sizeGB: 4.8,
    age: '5 months ago',
  },
  {
    id: 'mobile',
    name: 'mobile',
    path: '~/code/acme/apps/mobile',
    framework: 'react',
    sizeGB: 3.9,
    age: '7 months ago',
  },
  { id: 'docs', name: 'docs', path: '~/code/acme/docs', framework: 'svelte', sizeGB: 2.7, age: '9 months ago' },
  { id: 'cli', name: 'cli', path: '~/code/acme/packages/cli', framework: 'ts', sizeGB: 1.6, age: '1 year ago' },
]

/** GB limit the user set (the threshold the gauge measures against). */
export const LIMIT_GB = 5
/** Total node_modules on disk before cleaning (incl. folders off-screen). */
export const TOTAL_USED_GB = 26.32
/** Rows cleared during the animation, top-down. */
export const DELETE_ORDER = ['web', 'api', 'dashboard', 'mobile', 'docs'] as const
