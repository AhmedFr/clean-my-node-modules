import { UIIcon } from '@renderer/components/UIIcon'
import type { PackageEntry } from '@shared/package.types'
import type { ReactNode } from 'react'
import { SEVERITY_COLOR } from './PackageRow.constants'

interface PackageDetailsProps {
  entry: PackageEntry
  /** Open the package's npm page. */
  onOpen: () => void
}

/**
 * Inner content of an expanded package row (the row itself is the card): which
 * projects use each in-use version, and that version's worst advisory severity.
 */
export function PackageDetails({ entry, onOpen }: PackageDetailsProps): ReactNode {
  const rows = entry.versions.map((version) => ({
    version,
    advisory: entry.advisoriesByVersion?.[version],
    projects: [...new Set(entry.usages.filter((u) => u.version === version).map((u) => u.projectName))].sort((a, b) =>
      a.localeCompare(b),
    ),
  }))

  return (
    <div style={{ paddingBottom: 4 }}>
      {/* Hairline separates the header from the body without making a nested box. */}
      <div style={{ height: 1, background: 'var(--hairline)', margin: '0 12px 8px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 14px 8px 53px' }}>
        {rows.map(({ version, advisory, projects }) => (
          <div key={version} style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 12 }}>
            <span style={{ fontFamily: 'var(--mono-font)', color: 'var(--text-2)', minWidth: 64, flex: 'none' }}>
              {version}
            </span>
            <span style={{ minWidth: 78, flex: 'none' }}>
              {advisory ? (
                <span
                  title={advisory.title}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    color: SEVERITY_COLOR[advisory.severity],
                    fontWeight: 650,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: SEVERITY_COLOR[advisory.severity],
                      flex: 'none',
                    }}
                  />
                  {advisory.severity}
                </span>
              ) : (
                <span style={{ color: 'var(--text-faint)' }}>no advisory</span>
              )}
            </span>
            <span style={{ color: 'var(--text-dim)', minWidth: 0, lineHeight: 1.5 }}>{projects.join(' · ')}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
          {entry.latest && <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{`latest ${entry.latest}`}</span>}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpen()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid var(--surface-4)',
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: 8,
              background: 'var(--surface-1)',
              color: 'var(--text-2)',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {UIIcon.externalLink({ size: 13 })}
            Open on npm
          </button>
        </div>
      </div>
    </div>
  )
}
