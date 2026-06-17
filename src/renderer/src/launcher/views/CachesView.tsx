import { CacheRow } from '@renderer/components/CacheRow'
import { UIIcon } from '@renderer/components/UIIcon'
import type { PnpmStoreInfo } from '@shared/pnpm-store.types'
import type { ReactNode } from 'react'
import { CACHE_PLACEHOLDERS } from './CachesView.constants'

interface CachesViewProps {
  store: PnpmStoreInfo | null
  pruning: boolean
  /** Index of the keyboard-selected enabled cache (0 = pnpm store). */
  selectedIndex: number
  /** Search text from the shared header input; filters cache rows by name. */
  query: string
  onSelectIndex: (i: number) => void
  onPrune: () => void
}

/** The launcher's "Caches" tab: global package-manager caches (pnpm now). */
export function CachesView({
  store,
  pruning,
  selectedIndex,
  query,
  onSelectIndex,
  onPrune,
}: CachesViewProps): ReactNode {
  const q = query.trim().toLowerCase()
  const storeAvailable = !!store?.available
  const showStore = !q || 'pnpm store'.includes(q)
  const placeholders = CACHE_PLACEHOLDERS.filter((c) => !q || c.name.toLowerCase().includes(q))

  return (
    <div className="cc-list">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {showStore && (
          <CacheRow
            icon={UIIcon.hdd}
            name="pnpm store"
            detail={
              pruning
                ? 'Pruning unreferenced packages…'
                : storeAvailable
                  ? (store?.displayPath ?? '')
                  : 'pnpm not found on your PATH'
            }
            size={storeAvailable ? store?.sizeBytes : undefined}
            selected={selectedIndex === 0 && storeAvailable}
            disabled={!storeAvailable}
            busy={pruning}
            actionLabel="Prune"
            onSelect={() => onSelectIndex(0)}
            onAction={onPrune}
          />
        )}
        {placeholders.map((c) => (
          <CacheRow key={c.id} icon={UIIcon.hdd} name={c.name} detail={c.detail} disabled />
        ))}
        {!showStore && placeholders.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            No caches match “{query}”.
          </div>
        )}
      </div>
    </div>
  )
}
