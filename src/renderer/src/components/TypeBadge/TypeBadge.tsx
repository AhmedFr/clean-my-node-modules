import type { DockerItemKind } from '@shared/docker.types'
import type { ReactNode } from 'react'

const LABEL: Record<DockerItemKind, string> = {
  image: 'IMAGE',
  volume: 'VOLUME',
  container: 'CONTAINER',
  buildcache: 'CACHE',
}

/** Per-kind color, tuned for eye-scannability at a glance and legible on dark surfaces:
 * image = blue, volume = violet, container = green, buildcache = amber. */
const COLOR: Record<DockerItemKind, { bg: string; fg: string }> = {
  image: { bg: 'rgba(90,140,255,0.16)', fg: '#7ea6ff' },
  volume: { bg: 'rgba(168,120,255,0.16)', fg: '#b492ff' },
  container: { bg: 'rgba(80,190,120,0.16)', fg: '#6ddf9c' },
  buildcache: { bg: 'rgba(230,170,70,0.16)', fg: '#e6b45a' },
}

/** Tiny uppercase chip identifying a Docker item's kind (image/volume/container/build cache). */
export function TypeBadge({ kind }: { kind: DockerItemKind }): ReactNode {
  const { bg, fg } = COLOR[kind]
  return (
    <span
      style={{
        flex: 'none',
        padding: '2px 6px',
        borderRadius: 5,
        background: bg,
        color: fg,
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
