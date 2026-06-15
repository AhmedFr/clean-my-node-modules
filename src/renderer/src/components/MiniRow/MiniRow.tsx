import { useState, type ReactNode } from 'react'
import { mixColor } from '@renderer/lib/colors'
import { formatSizeStr, relativeTime, staleness } from '@renderer/lib/format'
import { ProjectIcon } from '@renderer/components/ProjectIcon'
import { UIIcon } from '@renderer/components/UIIcon'
import type { MiniRowProps } from './MiniRow.types'

/** Compact project row inside the menu bar dropdown. */
export function MiniRow({ p, accent, deleting, onDelete, onReveal }: MiniRowProps): ReactNode {
  const [h, setH] = useState(false)
  const stale = staleness(p.lastUsed)
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onClick={onReveal}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: deleting ? '0 8px' : '6px 8px',
        margin: '0 6px',
        borderRadius: 7,
        cursor: 'default',
        background: h && !deleting ? 'var(--hairline)' : 'transparent',
        height: deleting ? 0 : 'auto',
        opacity: deleting ? 0 : 1,
        transform: deleting ? 'translateX(30px)' : 'none',
        overflow: 'hidden',
        transition: 'opacity .3s, transform .3s, height .3s, padding .3s',
      }}
    >
      <ProjectIcon p={p} size={23} radius={6} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 550,
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {p.name}
        </div>
        <div style={{ fontSize: 10.5, color: mixColor('rgba(150,154,162,0.95)', accent, stale * 0.85) }}>
          {relativeTime(p.lastUsed)}
        </div>
      </div>
      {h ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          title="Delete now"
          style={{
            border: 'none',
            cursor: 'pointer',
            width: 26,
            height: 26,
            borderRadius: 7,
            background: mixColor('#000', accent, 0.8),
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {UIIcon.trash({ size: 14 })}
        </button>
      ) : (
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 650,
            color: 'rgba(255,255,255,0.82)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatSizeStr(p.size)}
        </span>
      )}
    </div>
  )
}
