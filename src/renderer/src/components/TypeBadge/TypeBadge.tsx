import type { DockerItemKind } from '@shared/docker.types'
import type { ReactNode } from 'react'

const LABEL: Record<DockerItemKind, string> = {
  image: 'IMAGE',
  volume: 'VOLUME',
  container: 'CONTAINER',
  buildcache: 'CACHE',
}

/** Tiny uppercase chip identifying a Docker item's kind (image/volume/container/build cache). */
export function TypeBadge({ kind }: { kind: DockerItemKind }): ReactNode {
  return (
    <span
      style={{
        flex: 'none',
        padding: '2px 6px',
        borderRadius: 5,
        background: 'var(--surface-2)',
        color: 'var(--text-3)',
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '.04em',
      }}
    >
      {LABEL[kind]}
    </span>
  )
}
