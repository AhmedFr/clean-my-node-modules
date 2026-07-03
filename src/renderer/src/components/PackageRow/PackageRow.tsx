import { UIIcon } from '@renderer/components/UIIcon'
import { formatSizeStr } from '@renderer/lib/format'
import type { CSSProperties, ReactNode } from 'react'
import { SEVERITY_COLOR } from './PackageRow.constants'
import type { PackageRowProps } from './PackageRow.types'

function Pill({ color, title, children }: { color: string; title?: string; children: ReactNode }): ReactNode {
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: '2px 7px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 650,
    lineHeight: 1.4,
    color,
    background: 'var(--surface-2)',
    boxShadow: `inset 0 0 0 1px ${color}`,
    whiteSpace: 'nowrap',
    flex: 'none',
  }
  return (
    <span style={style} title={title}>
      {children}
    </span>
  )
}

/** One package in the launcher's Packages tab. */
export function PackageRow({
  entry,
  selected = false,
  expanded = false,
  showUpdates = true,
  onSelect,
  onToggle,
  rowRef,
}: PackageRowProps): ReactNode {
  const { name, versions, projectCount, multipleVersions, size, latest, outdated, advisory } = entry
  const versionLabel =
    versions.length === 0 ? '—' : versions.length === 1 ? `v${versions[0]}` : `${versions.length} versions`
  const detail = `${projectCount} project${projectCount === 1 ? '' : 's'} · ${versionLabel}`

  return (
    <div
      ref={rowRef}
      role="option"
      aria-selected={selected}
      // Hover moves the selection so the list's sliding highlight follows the cursor.
      onMouseMove={() => {
        if (!selected) onSelect?.()
      }}
      onClick={onToggle}
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '10px 12px',
        borderRadius: 10,
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: 'var(--surface-2)',
          color: advisory ? SEVERITY_COLOR[advisory.severity] : 'var(--text-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        {UIIcon.box({ size: 15 })}
      </span>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{name}</div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text-dim)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={versions.join(', ')}
        >
          {detail}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
        {advisory && (
          <Pill color={SEVERITY_COLOR[advisory.severity]} title={advisory.title}>
            {UIIcon.alert({ size: 11 })}
            {advisory.severity}
          </Pill>
        )}
        {multipleVersions && (
          <Pill color="#fbbf24" title={`In use: ${versions.join(', ')}. Unify to reduce duplication`}>
            unify
          </Pill>
        )}
        {showUpdates && outdated && latest && (
          <Pill color="var(--good)" title={`Latest is ${latest}`}>
            {UIIcon.arrowUp({ size: 11 })}
            {latest}
          </Pill>
        )}
        <span
          style={{
            fontSize: 13,
            fontWeight: 650,
            color: 'var(--text-2)',
            fontVariantNumeric: 'tabular-nums',
            minWidth: 54,
            textAlign: 'right',
          }}
        >
          {size !== undefined ? formatSizeStr(size) : '—'}
        </span>
        <span
          style={{
            display: 'flex',
            color: expanded ? 'var(--text-2)' : 'var(--text-faint)',
            transition: 'transform 0.15s ease',
            transform: expanded ? 'rotate(90deg)' : 'none',
            flex: 'none',
          }}
        >
          {UIIcon.chevronRight({ size: 14 })}
        </span>
      </div>
    </div>
  )
}
