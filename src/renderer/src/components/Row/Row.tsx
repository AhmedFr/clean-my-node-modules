import { ProjectIcon } from '@renderer/components/ProjectIcon'
import { SizeViz } from '@renderer/components/SizeViz'
import { UIIcon } from '@renderer/components/UIIcon'
import { mixColor } from '@renderer/lib/colors'
import { relativeTime, staleness } from '@renderer/lib/format'
import { type ReactNode, useState } from 'react'
import type { RowProps } from './Row.types'
import { RowAction } from './RowAction'

export function Row({
  p,
  selected,
  density,
  sizeStyle,
  maxBytes,
  accent,
  deleting,
  rowRef,
  onSelect,
  onOpen,
  onFinder,
  onDelete,
}: RowProps): ReactNode {
  const [hover, setHover] = useState(false)
  const stale = staleness(p.lastUsed)
  const real = p.uniqueSize ?? p.size
  const roomy = density === 'roomy'
  const showActions = selected || hover

  return (
    <div
      ref={rowRef}
      role="option"
      aria-selected={selected}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={() => {
        if (!selected) onSelect()
      }}
      onClick={onOpen}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: roomy ? 13 : 11,
        padding: roomy ? '11px 14px' : '7px 14px',
        borderRadius: 10,
        cursor: 'pointer',
        zIndex: 1,
        height: deleting ? 0 : 'auto',
        paddingTop: deleting ? 0 : undefined,
        paddingBottom: deleting ? 0 : undefined,
        opacity: deleting ? 0 : 1,
        transform: deleting ? 'translateX(40px) scale(.97)' : 'none',
        overflow: 'hidden',
        transition: 'opacity .32s ease, transform .32s ease, height .32s ease, padding .32s ease',
      }}
    >
      <ProjectIcon p={p} size={roomy ? 34 : 28} radius={roomy ? 9 : 8} />
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
        <span
          style={{
            fontWeight: 600,
            fontSize: roomy ? 14.5 : 13.5,
            color: 'var(--text-strong)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            flexShrink: 0,
          }}
        >
          {p.name}
        </span>
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-dim)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--mono-font)',
            minWidth: 0,
            maxWidth: '100%',
            flex: roomy ? undefined : 1,
            alignSelf: roomy ? 'stretch' : undefined,
          }}
        >
          {p.path}/node_modules
        </span>
      </div>
      <div
        style={{
          display: showActions ? 'none' : 'flex',
          alignItems: 'center',
          gap: 5,
          color: mixColor('rgba(150,154,162,0.9)', accent, stale * 0.9),
          fontSize: 12,
          whiteSpace: 'nowrap',
          minWidth: 92,
          justifyContent: 'flex-end',
        }}
      >
        <span style={{ opacity: 0.8 }}>{UIIcon.clock({ size: 13 })}</span>
        {relativeTime(p.lastUsed)}
      </div>
      <div style={{ display: showActions && sizeStyle !== 'plain' ? 'none' : 'flex', justifyContent: 'flex-end' }}>
        <SizeViz
          style={sizeStyle}
          bytes={real}
          apparentBytes={p.size}
          maxBytes={maxBytes}
          stale={stale}
          accent={accent}
          density={density}
        />
      </div>
      {showActions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RowAction icon={UIIcon.finder} label="Reveal in Finder" onClick={onFinder} />
          <RowAction icon={UIIcon.chevronRight} label="Open project" onClick={onOpen} />
          <RowAction icon={UIIcon.trash} label="Delete node_modules" danger onClick={onDelete} />
        </div>
      )}
    </div>
  )
}
