import { CacheRow } from '@renderer/components/CacheRow'
import type { IconRenderer } from '@renderer/components/UIIcon'
import { UIIcon } from '@renderer/components/UIIcon'
import type { DockerItemKind } from '@shared/docker.types'
import type { ReactNode } from 'react'
import { dockerItemDetail, groupDockerItems } from './DockerView.constants'
import type { DockerViewProps } from './DockerView.types'

const KIND_ICON: Record<DockerItemKind, IconRenderer> = {
  image: UIIcon.box,
  volume: UIIcon.hdd,
  container: UIIcon.power,
  buildcache: UIIcon.hdd,
}

/** The launcher's "Docker" tab: images/volumes/containers/build cache, grouped by kind.
 * Phase A is read-only — no remove/prune actions yet (Task 9 adds them). */
export function DockerView({ info, query }: DockerViewProps): ReactNode {
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
                  fontSize: 11,
                  fontWeight: 650,
                  color: 'var(--text-faint)',
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                  padding: '0 12px',
                }}
              >
                {g.label}
              </div>
              {g.items.map((item) => (
                <CacheRow
                  key={item.id}
                  icon={KIND_ICON[item.kind]}
                  name={item.name}
                  detail={dockerItemDetail(item)}
                  size={item.sizeBytes}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
