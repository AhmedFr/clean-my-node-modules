import { CacheRow } from '@renderer/components/CacheRow'
import { UIIcon } from '@renderer/components/UIIcon'
import type { ReactNode } from 'react'
import { CACHE_PLACEHOLDERS, type LiveCache, visibleCaches } from './CachesView.constants'

interface CachesViewProps {
  /** Live caches (pnpm store, Docker build cache, …) in keyboard order. */
  caches: LiveCache[]
  /** Index (into `caches`) of the keyboard-selected live cache. */
  selectedIndex: number
  /** Search text from the shared header input; filters cache rows by name. */
  query: string
  onSelectIndex: (i: number) => void
}

/** The launcher's "Caches" tab: live global caches (pnpm store, Docker build cache) above
 *  the not-yet-built placeholders (npm/yarn/bun). */
export function CachesView({ caches, selectedIndex, query, onSelectIndex }: CachesViewProps): ReactNode {
  const q = query.trim().toLowerCase()
  const rows = visibleCaches(caches, query)
  const placeholders = CACHE_PLACEHOLDERS.filter((c) => !q || c.name.toLowerCase().includes(q))

  return (
    <div className="cc-list">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map(({ cache, index }) => (
          <CacheRow
            key={cache.id}
            icon={cache.icon}
            name={cache.name}
            detail={cache.detail}
            size={cache.size}
            selected={selectedIndex === index && !cache.disabled}
            disabled={cache.disabled}
            busy={cache.busy}
            actionLabel={cache.actionLabel}
            actionIcon={cache.danger ? UIIcon.trash : undefined}
            danger={cache.danger}
            title={cache.title}
            busyLabel={cache.busyLabel}
            onSelect={() => onSelectIndex(index)}
            onAction={cache.onAction}
          />
        ))}
        {placeholders.map((c) => (
          <CacheRow key={c.id} icon={UIIcon.hdd} name={c.name} detail={c.detail} disabled />
        ))}
        {rows.length === 0 && placeholders.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            No caches match “{query}”.
          </div>
        )}
      </div>
    </div>
  )
}
