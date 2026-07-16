import type { IconRenderer } from '@renderer/components/UIIcon'

/** A package-manager cache the launcher will support but hasn't built yet. */
export interface CachePlaceholder {
  id: string
  name: string
  detail: string
}

/** npm/yarn/bun caches, shown disabled ("soon") until issue #2 M2 builds them. */
export const CACHE_PLACEHOLDERS: CachePlaceholder[] = [
  { id: 'npm', name: 'npm cache', detail: 'Global npm cache (coming soon)' },
  { id: 'yarn', name: 'yarn cache', detail: 'Global yarn cache (coming soon)' },
  { id: 'bun', name: 'bun cache', detail: 'Global bun cache (coming soon)' },
]

/** One live (present, actionable) cache shown at the top of the Caches tab, above the
 *  "coming soon" placeholders. `LauncherApp` builds these — the view stays presentational. */
export interface LiveCache {
  id: string
  icon: IconRenderer
  name: string
  /** Secondary line: store path, a status, or a short description. */
  detail: string
  size?: number
  disabled?: boolean
  busy?: boolean
  actionLabel?: string
  busyLabel?: string
  title?: string
  /** Render the action button as destructive (red) with a trash icon. */
  danger?: boolean
  onAction?: () => void
}

/** Query-filter live caches by name (case-insensitive substring), preserving each cache's
 *  original index so the keyboard-selected row stays correct while the list is filtered. */
export function visibleCaches(caches: LiveCache[], query: string): { cache: LiveCache; index: number }[] {
  const q = query.trim().toLowerCase()
  return caches
    .map((cache, index) => ({ cache, index }))
    .filter(({ cache }) => !q || cache.name.toLowerCase().includes(q))
}

/** The live cache that the Enter key should act on for the current selection and query.
 *  `sel` indexes the full list, but only `visibleCaches` are on screen — so Enter returns
 *  the selected cache ONLY when it is still visible (not filtered out by the query) and
 *  actionable (not disabled or busy). Returns null otherwise, so Enter never fires the
 *  action of a row the query has hidden from view. */
export function selectedActionableCache(caches: LiveCache[], query: string, sel: number): LiveCache | null {
  const c = caches[sel]
  if (!c || c.disabled || c.busy) return null
  return visibleCaches(caches, query).some((v) => v.index === sel) ? c : null
}
