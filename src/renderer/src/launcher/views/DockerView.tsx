import { CacheRow } from '@renderer/components/CacheRow'
import { FrameworkIcon } from '@renderer/components/FrameworkIcon'
import { TypeBadge } from '@renderer/components/TypeBadge'
import type { IconRenderer } from '@renderer/components/UIIcon'
import { UIIcon } from '@renderer/components/UIIcon'
import { formatSizeStr } from '@renderer/lib/format'
import type { DockerItem, DockerItemKind, DockerProject, DockerPruneTarget } from '@shared/docker.types'
import { Fragment, type ReactNode } from 'react'
import { type DisplayGroup, dockerItemDetail, groupDockerForDisplay, PRUNE_TARGET_LABEL } from './DockerView.constants'
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

/** Prune commands are global (`docker <x> prune -f` spans every project), so bulk-prune
 * buttons only appear on the "Other" section headers — never under a project header, where
 * they'd falsely imply a project-scoped prune. Targets are keyed by the item kinds present
 * in that specific group. */
function prunesForGroup(group: DisplayGroup): DockerPruneTarget[] {
  if (group.kind === 'repository') {
    const targets: DockerPruneTarget[] = []
    if (group.items.some((i) => i.kind === 'image' && i.name === '<none>')) targets.push('danglingImages')
    if (group.items.some((i) => i.kind === 'image' && i.removable)) targets.push('unusedImages')
    return targets
  }
  if (group.kind === 'buildcache') return ['buildCache']
  if (group.kind === 'unaffiliated') {
    const targets: DockerPruneTarget[] = []
    if (group.items.some((i) => i.kind === 'volume')) targets.push('unusedVolumes')
    if (group.items.some((i) => i.kind === 'container' && i.removable)) targets.push('stoppedContainers')
    return targets
  }
  return []
}

/** The project's own favicon when available; its framework mark when known; a generic box
 * glyph otherwise (e.g. a compose project with no detected framework). */
function DockerProjectIcon({ project, size = 22 }: { project: DockerProject; size?: number }): ReactNode {
  if (project.iconDataUrl) {
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
  group: DisplayGroup
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
        {group.kind === 'project' ? (
          <DockerProjectIcon project={group.project} size={22} />
        ) : (
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
        )}
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
          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
            {formatSizeStr(totalBytes)}
            {group.kind === 'project' ? ` · ${group.items.length} item${group.items.length === 1 ? '' : 's'}` : ''}
          </div>
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
                title={`Prune ${PRUNE_TARGET_LABEL[target].toLowerCase()}. Permanent — not sent to the Trash.`}
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
}: DockerViewProps): ReactNode {
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

  return (
    <div className="cc-list">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {groups.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            {query ? `No Docker resources match “${query}”.` : 'No Docker resources found.'}
          </div>
        ) : (
          groups.map((g, idx) => (
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
                {g.items.map((item: DockerItem) => {
                  const canRemove = item.removable && item.kind !== 'buildcache' && !!onRemove
                  return (
                    <CacheRow
                      key={item.id}
                      icon={KIND_ICON[item.kind]}
                      name={item.name}
                      badge={<TypeBadge kind={item.kind} />}
                      detail={dockerItemDetail(item)}
                      size={item.sizeBytes}
                      busy={busyId === item.id}
                      actionLabel={canRemove ? 'Remove' : undefined}
                      title={canRemove ? `Remove ${item.name} permanently — not sent to the Trash` : undefined}
                      busyLabel="Removing…"
                      onAction={canRemove ? () => onRemove?.(item) : undefined}
                    />
                  )
                })}
              </div>
            </Fragment>
          ))
        )}
      </div>
    </div>
  )
}
