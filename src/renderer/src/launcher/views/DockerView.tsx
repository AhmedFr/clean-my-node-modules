import { CacheRow } from '@renderer/components/CacheRow'
import type { IconRenderer } from '@renderer/components/UIIcon'
import { UIIcon } from '@renderer/components/UIIcon'
import type { DockerItemKind, DockerPruneTarget } from '@shared/docker.types'
import type { ReactNode } from 'react'
import { dockerItemDetail, groupDockerItems, PRUNE_TARGET_LABEL } from './DockerView.constants'
import type { DockerViewProps } from './DockerView.types'

const KIND_ICON: Record<DockerItemKind, IconRenderer> = {
  image: UIIcon.box,
  volume: UIIcon.hdd,
  container: UIIcon.power,
  buildcache: UIIcon.hdd,
}

/** Bulk-prune targets offered under each group's header, in display order. */
const GROUP_PRUNE_TARGETS: Record<DockerItemKind, DockerPruneTarget[]> = {
  image: ['danglingImages', 'unusedImages'],
  volume: ['unusedVolumes'],
  container: ['stoppedContainers'],
  buildcache: ['buildCache'],
}

/** The launcher's "Docker" tab: images/volumes/containers/build cache, grouped by kind. */
export function DockerView({ info, loading, query, busyId, onRemove, onPrune }: DockerViewProps): ReactNode {
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

  const groups = groupDockerItems(info.items, query)

  return (
    <div className="cc-list">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {groups.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            {query ? `No Docker resources match “${query}”.` : 'No Docker resources found.'}
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.kind} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '0 12px',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 650,
                    color: 'var(--text-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                  }}
                >
                  {g.label}
                </div>
                {onPrune && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {GROUP_PRUNE_TARGETS[g.kind].map((target) => {
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
              {g.items.map((item) => {
                const canRemove = item.removable && item.kind !== 'buildcache' && !!onRemove
                return (
                  <CacheRow
                    key={item.id}
                    icon={KIND_ICON[item.kind]}
                    name={item.name}
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
          ))
        )}
      </div>
    </div>
  )
}
