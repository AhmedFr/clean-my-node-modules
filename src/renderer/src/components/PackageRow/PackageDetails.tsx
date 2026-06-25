import { UIIcon } from '@renderer/components/UIIcon'
import type { PackageEntry } from '@shared/package.types'
import type { ReactNode } from 'react'
import { SEVERITY_COLOR } from './PackageRow.constants'

interface PackageDetailsProps {
  entry: PackageEntry
  /** Open the package's npm page. */
  onOpen: () => void
}

/** Expanded panel: which projects use each in-use version, and its severity. */
export function PackageDetails({ entry, onOpen }: PackageDetailsProps): ReactNode {
  const rows = entry.versions.map((version) => ({
    version,
    advisory: entry.advisoriesByVersion?.[version],
    projects: [...new Set(entry.usages.filter((u) => u.version === version).map((u) => u.projectName))].sort((a, b) =>
      a.localeCompare(b),
    ),
  }))

  return (
    <div
      style={{
        margin: '0 8px 4px 41px',
        padding: '8px 11px',
        background: 'var(--surface-1)',
        borderRadius: 8,
        boxShadow: 'inset 0 0 0 1px var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {rows.map(({ version, advisory, projects }) => (
        <div key={version} style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 12 }}>
          <span style={{ fontFamily: 'var(--mono-font)', color: 'var(--text-2)', minWidth: 70, flex: 'none' }}>
            {version}
          </span>
          <span style={{ minWidth: 72, flex: 'none' }}>
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
  )
}
