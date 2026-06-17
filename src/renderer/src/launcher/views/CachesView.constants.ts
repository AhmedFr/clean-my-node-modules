/** A package-manager cache the launcher will support but hasn't built yet. */
export interface CachePlaceholder {
  id: string
  name: string
  detail: string
}

/** npm/yarn/bun caches — shown disabled ("soon") until issue #2 M2 builds them. */
export const CACHE_PLACEHOLDERS: CachePlaceholder[] = [
  { id: 'npm', name: 'npm cache', detail: 'Global npm cache — coming soon' },
  { id: 'yarn', name: 'yarn cache', detail: 'Global yarn cache — coming soon' },
  { id: 'bun', name: 'bun cache', detail: 'Global bun cache — coming soon' },
]
