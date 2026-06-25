import { PackageRow, PackageRowSkeleton } from '@renderer/components/PackageRow'
import { UIIcon } from '@renderer/components/UIIcon'
import type { PackageEntry } from '@shared/package.types'
import type { ReactNode } from 'react'
import { PACKAGES_COPY, SKELETON_ROWS } from './PackagesView.constants'

interface PackagesViewProps {
  /** Already filtered + sorted entries to render. */
  items: PackageEntry[]
  /** Total packages before the search filter (for the count + empty distinction). */
  totalCount: number
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
}

function Note({ color, text }: { color: string; text: string }): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 12px',
        margin: '0 0 4px',
        fontSize: 11.5,
        color,
      }}
    >
      {UIIcon.alert({ size: 13 })}
      {text}
    </div>
  )
}

/** A small spinning ring + label, used for the loading/refreshing captions. */
function LoadingCaption({ text }: { text: string }): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px 4px',
        fontSize: 11.5,
        color: 'var(--text-muted)',
        fontWeight: 550,
      }}
    >
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: '1.5px solid var(--surface-3)',
          borderTopColor: 'var(--text-muted)',
          animation: 'ccspin 0.7s linear infinite',
          flex: 'none',
        }}
      />
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
  computing,
  checkUpdates,
  enrichmentError,
  query,
  selectedIndex,
  onSelectIndex,
  onOpen,
}: PackagesViewProps): ReactNode {
  // First compute, nothing cached yet → skeleton list (communicates the shape + progress).
  if (computing && totalCount === 0) {
    return (
      <div className="cc-list">
        <LoadingCaption text={PACKAGES_COPY.analyzing} />
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
      {!checkUpdates && <Note color="var(--text-dim)" text={PACKAGES_COPY.updatesOff} />}
      {checkUpdates && enrichmentError && <Note color="#fbbf24" text={PACKAGES_COPY.offline} />}
      {/* Recompute over already-cached data → keep the list, show a quiet refreshing hint. */}
      {computing && <LoadingCaption text={PACKAGES_COPY.refreshing} />}

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
