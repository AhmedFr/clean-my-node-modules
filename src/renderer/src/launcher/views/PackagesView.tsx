import { PackageRow, PackageRowSkeleton } from '@renderer/components/PackageRow'
import { UIIcon } from '@renderer/components/UIIcon'
import { relativeTime } from '@renderer/lib/format'
import type { PackageEntry } from '@shared/package.types'
import type { ReactNode } from 'react'
import { PACKAGES_COPY, SKELETON_ROWS } from './PackagesView.constants'

interface PackagesViewProps {
  /** Already filtered + sorted entries to render. */
  items: PackageEntry[]
  /** Total packages before the search filter (for the count + empty distinction). */
  totalCount: number
  /** When the inventory was last computed (ms epoch). */
  computedAt?: number
  /** Whether a compute is in flight. */
  computing: boolean
  /** Registry checks enabled (hides update/advisory columns when off). */
  checkUpdates: boolean
  /** Set when the last enrichment couldn't reach npm. */
  enrichmentError?: string
  query: string
  selectedIndex: number
  onSelectIndex: (i: number) => void
  onOpen: (entry: PackageEntry) => void
  /** Recompute the inventory from scratch. */
  onRefresh: () => void
}

/** Compact "time ago" with sub-day granularity (relativeTime only resolves days). */
function formatAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return relativeTime(ts)
}

function Spinner({ size = 12 }: { size?: number }): ReactNode {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1.5px solid var(--surface-3)',
        borderTopColor: 'var(--text-muted)',
        animation: 'ccspin 0.7s linear infinite',
        flex: 'none',
        display: 'inline-block',
      }}
    />
  )
}

/** Top bar: package count + last-scanned time + a rescan button. */
function MetaBar({
  count,
  computedAt,
  computing,
  onRefresh,
}: {
  count: number
  computedAt?: number
  computing: boolean
  onRefresh: () => void
}): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '2px 4px 8px',
        fontSize: 11.5,
        color: 'var(--text-dim)',
      }}
    >
      <span>{`${count} package${count === 1 ? '' : 's'}`}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {computedAt !== undefined && !computing && <span>{`Scanned ${formatAgo(computedAt)}`}</span>}
        <button
          type="button"
          onClick={onRefresh}
          disabled={computing}
          title="Re-scan installed packages"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: '1px solid var(--surface-4)',
            cursor: computing ? 'default' : 'pointer',
            padding: '4px 10px',
            borderRadius: 8,
            background: 'var(--surface-1)',
            color: computing ? 'var(--text-dim)' : 'var(--text-2)',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {computing ? <Spinner /> : UIIcon.refresh({ size: 13 })}
          {computing ? 'Re-scanning…' : 'Re-scan'}
        </button>
      </div>
    </div>
  )
}

function Note({ color, text }: { color: string; text: string }): ReactNode {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 4px 6px', fontSize: 11.5, color }}>
      {UIIcon.alert({ size: 13 })}
      {text}
    </div>
  )
}

function Centered({ text }: { text: string }): ReactNode {
  return <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>{text}</div>
}

/** The launcher's "Packages" tab: every directly-installed package across all projects. */
export function PackagesView({
  items,
  totalCount,
  computedAt,
  computing,
  checkUpdates,
  enrichmentError,
  query,
  selectedIndex,
  onSelectIndex,
  onOpen,
  onRefresh,
}: PackagesViewProps): ReactNode {
  // First compute, nothing cached yet → skeleton list (communicates shape + progress).
  if (computing && totalCount === 0) {
    return (
      <div className="cc-list">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '2px 4px 8px',
            fontSize: 11.5,
            color: 'var(--text-muted)',
            fontWeight: 550,
          }}
        >
          <Spinner />
          {PACKAGES_COPY.analyzing}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <PackageRowSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="cc-list">
      {totalCount > 0 && (
        <MetaBar count={totalCount} computedAt={computedAt} computing={computing} onRefresh={onRefresh} />
      )}
      {!checkUpdates && <Note color="var(--text-dim)" text={PACKAGES_COPY.updatesOff} />}
      {checkUpdates && enrichmentError && <Note color="#fbbf24" text={PACKAGES_COPY.offline} />}

      {totalCount === 0 ? (
        <Centered text={PACKAGES_COPY.emptyNoData} />
      ) : items.length === 0 ? (
        <Centered text={`No packages match “${query}”.`} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((entry, i) => (
            <PackageRow
              key={entry.name}
              entry={entry}
              selected={i === selectedIndex}
              showUpdates={checkUpdates}
              onSelect={() => onSelectIndex(i)}
              onOpen={() => onOpen(entry)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
