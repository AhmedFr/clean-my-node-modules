import { Accordion } from '@renderer/components/Accordion'
import { FrameworkIcon } from '@renderer/components/FrameworkIcon'
import { RowAction } from '@renderer/components/Row'
import { SizeViz } from '@renderer/components/SizeViz'
import { TypeBadge } from '@renderer/components/TypeBadge'
import type { IconRenderer } from '@renderer/components/UIIcon'
import { UIIcon } from '@renderer/components/UIIcon'
import { formatSizeStr } from '@renderer/lib/format'
import type { DockerItem, DockerItemKind, DockerProject, DockerPruneTarget } from '@shared/docker.types'
import type { Density, SizeStyle } from '@shared/settings.types'
import { Fragment, type ReactNode, useState } from 'react'
import {
  type DisplayGroup,
  dockerGroupActive,
  dockerItemDetail,
  groupDockerForDisplay,
  PRUNE_TARGET_LABEL,
  projectRowExpanded,
  prunesForGroup,
} from './DockerView.constants'
import type { DockerViewProps } from './DockerView.types'

const KIND_ICON: Record<DockerItemKind, IconRenderer> = {
  image: UIIcon.box,
  volume: UIIcon.hdd,
  container: UIIcon.power,
  buildcache: UIIcon.hdd,
}

/** Generic header glyph for the non-project ("Other") groups. */
const GROUP_ICON: Record<'repository' | 'buildcache' | 'unaffiliated', IconRenderer> = {
  repository: UIIcon.box,
  buildcache: UIIcon.hdd,
  unaffiliated: UIIcon.hdd,
}

/** The project's own favicon when available; its framework mark when known; a generic box
 * glyph otherwise (e.g. a compose project with no detected framework). */
function DockerProjectIcon({ project, size = 22 }: { project: DockerProject; size?: number }): ReactNode {
  const [failed, setFailed] = useState(false)

  if (project.iconDataUrl && !failed) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface-1)',
          boxShadow: 'inset 0 0 0 1px var(--hairline)',
          overflow: 'hidden',
        }}
      >
        <img
          src={project.iconDataUrl}
          alt=""
          aria-hidden="true"
          onError={() => setFailed(true)}
          style={{ width: size * 0.72, height: size * 0.72, objectFit: 'contain', display: 'block' }}
        />
      </div>
    )
  }
  if (project.kind) return <FrameworkIcon kind={project.kind} size={size} radius={6} />
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-2)',
        color: 'var(--text-3)',
      }}
    >
      {UIIcon.box({ size: size * 0.6 })}
    </span>
  )
}

function GroupHeader({
  group,
  busyId,
  onPrune,
}: {
  group: Exclude<DisplayGroup, { kind: 'project' }>
  busyId?: string | null
  onPrune?: (target: DockerPruneTarget) => void
}): ReactNode {
  const totalBytes = group.items.reduce((s, i) => s + i.sizeBytes, 0)
  const targets = prunesForGroup(group)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '0 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface-2)',
            color: 'var(--text-3)',
          }}
        >
          {GROUP_ICON[group.kind]({ size: 13 })}
        </span>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 650,
              color: 'var(--text-2)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {group.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{formatSizeStr(totalBytes)}</div>
        </div>
      </div>
      {onPrune && targets.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
          {targets.map((target) => {
            const busy = busyId === `prune:${target}`
            return (
              <button
                key={target}
                type="button"
                onClick={() => onPrune(target)}
                disabled={busy}
                title={`Prune ${PRUNE_TARGET_LABEL[target].toLowerCase()}. Permanent, not sent to the Trash.`}
                style={{
                  border: '1px solid var(--surface-4)',
                  cursor: busy ? 'default' : 'pointer',
                  padding: '3px 9px',
                  borderRadius: 7,
                  background: 'var(--surface-1)',
                  color: busy ? 'var(--text-dim)' : 'var(--text-2)',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {busy ? 'Pruning…' : PRUNE_TARGET_LABEL[target]}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Same visual as `LiveDot` (the node_modules "running" indicator): an 8px green dot with a
 * soft glow. Not the `LiveDot` component itself — that takes a `LiveInfo` (command/port) a
 * Docker item doesn't have — just its exact style, with Docker-appropriate copy. */
function InUseDot(): ReactNode {
  return (
    <span
      role="img"
      title="In use by a container"
      aria-label="In use by a container"
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#35c759',
        boxShadow: '0 0 0 3px rgba(53,199,89,0.18)',
        flexShrink: 0,
      }}
    />
  )
}

/** Collapsed, clickable header for a compose-project group: logo/icon, name, item count,
 *  total size, a green active dot when any resource is in use, and a chevron that rotates
 *  when expanded. The whole row toggles expansion and drives the shared .cc-hl highlight. */
function DockerProjectRow({
  project,
  itemCount,
  totalBytes,
  active,
  expanded,
  onToggle,
  onHover,
}: {
  project: DockerProject
  itemCount: number
  totalBytes: number
  active: boolean
  expanded: boolean
  onToggle: () => void
  onHover: (el: HTMLDivElement) => void
}): ReactNode {
  return (
    <div
      role="option"
      aria-selected={expanded}
      onClick={onToggle}
      onMouseEnter={(e) => onHover(e.currentTarget)}
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 10,
        cursor: 'pointer',
      }}
    >
      <DockerProjectIcon project={project} size={22} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 650,
            color: 'var(--text-2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {project.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          {itemCount} item{itemCount === 1 ? '' : 's'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
        <span style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
          {formatSizeStr(totalBytes)}
        </span>
        {active && <InUseDot />}
        <span
          style={{
            display: 'flex',
            color: expanded ? 'var(--text-2)' : 'var(--text-faint)',
            transition: 'transform 0.15s ease',
            transform: expanded ? 'rotate(90deg)' : 'none',
          }}
        >
          {UIIcon.chevronRight({ size: 14 })}
        </span>
      </div>
    </div>
  )
}

/** One Docker resource row. Mirrors `Row.tsx` (the node_modules row) so both lists read as
 * the same list primitive: kind icon, name + colored `TypeBadge`, detail line, `SizeViz`
 * for size, and a hover-revealed trash `RowAction` in place of a persistent Remove button.
 * Non-removable items (build cache, or anything the caller has no `onRemove` for) get a
 * disabled trash with an explanatory title, and `onRemove` is never invoked for them. */
function DockerItemRow({
  item,
  density,
  sizeStyle,
  maxBytes,
  accent,
  busy,
  onRemove,
  onHover,
}: {
  item: DockerItem
  density: Density
  sizeStyle: SizeStyle
  maxBytes: number
  accent: string
  busy: boolean
  onRemove?: (item: DockerItem) => void
  onHover: (el: HTMLDivElement) => void
}): ReactNode {
  const [hover, setHover] = useState(false)
  const roomy = density === 'roomy'
  const canRemove = item.removable && item.kind !== 'buildcache' && !!onRemove
  const showActions = hover

  const disabledReason =
    item.kind === 'buildcache'
      ? 'Build cache is removed via Prune, not individually'
      : item.inUse
        ? "Currently in use, can't remove"
        : "Can't be removed individually"

  return (
    <div
      onMouseEnter={(e) => {
        setHover(true)
        onHover(e.currentTarget)
      }}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: roomy ? 13 : 11,
        padding: roomy ? '11px 14px' : '7px 14px',
        borderRadius: 10,
      }}
    >
      <span
        style={{
          width: roomy ? 34 : 28,
          height: roomy ? 34 : 28,
          borderRadius: roomy ? 9 : 8,
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface-2)',
          color: 'var(--text-3)',
        }}
      >
        {KIND_ICON[item.kind]({ size: roomy ? 16 : 14 })}
      </span>
      <div
        style={{
          minWidth: 0,
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: roomy ? 'column' : 'row',
          alignItems: roomy ? 'flex-start' : 'baseline',
          gap: roomy ? 2 : 9,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: '100%', flexShrink: 0 }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: roomy ? 14.5 : 13.5,
              color: 'var(--text-strong)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              minWidth: 0,
            }}
          >
            {item.name}
          </span>
          {item.inUse && <InUseDot />}
          <TypeBadge kind={item.kind} />
        </span>
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-dim)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            maxWidth: '100%',
            flex: roomy ? undefined : 1,
            alignSelf: roomy ? 'stretch' : undefined,
          }}
        >
          {dockerItemDetail(item)}
        </span>
      </div>
      <div style={{ display: showActions && sizeStyle !== 'plain' ? 'none' : 'flex', justifyContent: 'flex-end' }}>
        <SizeViz
          style={sizeStyle}
          bytes={item.sizeBytes}
          apparentBytes={item.sizeBytes}
          maxBytes={maxBytes}
          stale={0}
          accent={accent}
          density={density}
        />
      </div>
      {showActions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RowAction
            icon={UIIcon.trash}
            label={
              busy ? 'Removing…' : canRemove ? `Remove ${item.name} permanently, not sent to the Trash` : disabledReason
            }
            danger
            disabled={!canRemove || busy}
            onClick={canRemove ? () => onRemove?.(item) : () => {}}
          />
        </div>
      )}
    </div>
  )
}

/** The launcher's "Docker" tab: resources grouped by compose project first, then an "Other"
 * section (image repositories, build cache, unaffiliated resources) for anything unlinked. */
export function DockerView({
  info,
  loading,
  query,
  sortBy = 'size',
  typeFilter = 'all',
  busyId,
  onRemove,
  onPrune,
  accent,
  density,
  sizeStyle,
  maxBytes,
}: DockerViewProps): ReactNode {
  // Shared sliding highlight behind the hovered row, matching the node_modules list (.cc-hl).
  const [hl, setHl] = useState({ top: 0, height: 0, on: false })
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)

  if (loading && !info) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
        Checking Docker…
      </div>
    )
  }

  if (!info?.available) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
        {info?.reason ?? 'Docker not found'}
      </div>
    )
  }

  const groups = groupDockerForDisplay(info, { sortBy, typeFilter, query })
  const firstOtherIndex = groups.findIndex((g) => g.kind !== 'project')
  const hasQuery = query.trim().length > 0

  return (
    <div className="cc-list">
      <div
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}
        onMouseLeave={() => setHl((h) => ({ ...h, on: false }))}
      >
        <div
          className="cc-hl"
          style={{
            top: hl.top,
            height: hl.height,
            opacity: hl.on ? 1 : 0,
            background: 'var(--surface-2)',
            boxShadow: 'inset 0 0 0 1px var(--hairline)',
          }}
        />
        {groups.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            {query ? `No Docker resources match “${query}”.` : 'No Docker resources found.'}
          </div>
        ) : (
          groups.map((g, idx) => {
            if (g.kind === 'project') {
              const expanded = projectRowExpanded(hasQuery, expandedProjectId, g.id)
              return (
                <Accordion
                  key={g.id}
                  open={expanded}
                  header={
                    <DockerProjectRow
                      project={g.project}
                      itemCount={g.items.length}
                      totalBytes={g.items.reduce((s, i) => s + i.sizeBytes, 0)}
                      active={dockerGroupActive(g.items)}
                      expanded={expanded}
                      onToggle={() => setExpandedProjectId((cur) => (cur === g.id ? null : g.id))}
                      onHover={(el) => setHl({ top: el.offsetTop, height: el.offsetHeight, on: true })}
                    />
                  }
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    {g.items.map((item: DockerItem) => (
                      <DockerItemRow
                        key={item.id}
                        item={item}
                        density={density}
                        sizeStyle={sizeStyle}
                        maxBytes={maxBytes}
                        accent={accent}
                        busy={busyId === item.id}
                        onRemove={onRemove}
                        onHover={(el) => setHl({ top: el.offsetTop, height: el.offsetHeight, on: true })}
                      />
                    ))}
                  </div>
                </Accordion>
              )
            }
            return (
              <Fragment key={g.id}>
                {idx === firstOtherIndex && firstOtherIndex > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '2px 12px',
                      color: 'var(--text-faint)',
                      fontSize: 10.5,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '.05em',
                    }}
                  >
                    <span style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
                    Not linked to a project
                    <span style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <GroupHeader group={g} busyId={busyId} onPrune={onPrune} />
                  {g.items.map((item: DockerItem) => (
                    <DockerItemRow
                      key={item.id}
                      item={item}
                      density={density}
                      sizeStyle={sizeStyle}
                      maxBytes={maxBytes}
                      accent={accent}
                      busy={busyId === item.id}
                      onRemove={onRemove}
                      onHover={(el) => setHl({ top: el.offsetTop, height: el.offsetHeight, on: true })}
                    />
                  ))}
                </div>
              </Fragment>
            )
          })
        )}
      </div>
    </div>
  )
}
