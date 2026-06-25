import { PackageRow } from '@renderer/components/PackageRow'
import { UIIcon } from '@renderer/components/UIIcon'
import type { PackageEntry } from '@shared/package.types'
import type { ReactNode } from 'react'
import { PACKAGES_COPY } from './PackagesView.constants'

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
  return (
    <div className="cc-list">
      {!checkUpdates && <Note color="var(--text-dim)" text={PACKAGES_COPY.updatesOff} />}
      {checkUpdates && enrichmentError && <Note color="#fbbf24" text={PACKAGES_COPY.offline} />}

      {computing && totalCount === 0 ? (
        <Centered text={PACKAGES_COPY.analyzing} />
      ) : totalCount === 0 ? (
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
