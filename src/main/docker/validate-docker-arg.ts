import type { DockerItemKind, DockerPruneTarget } from '@shared/docker.types'

const REMOVABLE_KINDS: DockerItemKind[] = ['image', 'volume', 'container']
const PRUNE_TARGETS: DockerPruneTarget[] = [
  'danglingImages',
  'unusedImages',
  'stoppedContainers',
  'buildCache',
  'unusedVolumes',
]

/**
 * Validates an untrusted (kind, id) pair coming over IPC from the renderer.
 * `buildcache` is deliberately excluded — there is no per-item build-cache removal.
 */
export function coerceRemoveArgs(kind: unknown, id: unknown): { kind: DockerItemKind; id: string } | null {
  if (typeof kind !== 'string' || !(REMOVABLE_KINDS as string[]).includes(kind)) return null
  if (typeof id !== 'string' || id.trim() === '') return null
  return { kind: kind as DockerItemKind, id }
}

/** Validates an untrusted prune target coming over IPC from the renderer. */
export function coercePruneTarget(target: unknown): DockerPruneTarget | null {
  return typeof target === 'string' && (PRUNE_TARGETS as string[]).includes(target)
    ? (target as DockerPruneTarget)
    : null
}
