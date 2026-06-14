import { useState, type ReactNode } from 'react'
import { formatSizeStr } from '@renderer/lib/format'
import { UIIcon } from '@renderer/components/UIIcon'
import type { PnpmStoreInfo } from '@shared/pnpm-store.types'

interface PnpmStoreRowProps {
  store: PnpmStoreInfo
  pruning: boolean
  onPrune: () => void
}

/** Caches section row: global pnpm store size with a safe prune action. */
export function PnpmStoreRow({ store, pruning, onPrune }: PnpmStoreRowProps): ReactNode {
  const [hover, setHover] = useState(false)
  return (
    <>
      <div
        style={{
          padding: '8px 15px 4px',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
          color: 'rgba(255,255,255,0.42)',
        }}
      >
        Caches
      </div>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '6px 8px',
          margin: '0 6px 4px',
          borderRadius: 7,
          background: hover ? 'rgba(255,255,255,0.07)' : 'transparent',
        }}
      >
        <span
          style={{
            width: 23,
            height: 23,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          {UIIcon.hdd({ size: 13 })}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 550, color: 'rgba(255,255,255,0.92)' }}>
            pnpm store
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: 'rgba(150,154,162,0.95)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={store.displayPath}
          >
            {pruning ? 'Pruning unreferenced packages…' : store.displayPath}
          </div>
        </div>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 650,
            color: 'rgba(255,255,255,0.82)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatSizeStr(store.sizeBytes)}
        </span>
        <button
          onClick={onPrune}
          disabled={pruning}
          title="Remove packages no project references (pnpm store prune)"
          style={{
            border: '1px solid rgba(255,255,255,0.14)',
            cursor: pruning ? 'default' : 'pointer',
            padding: '4px 9px',
            borderRadius: 7,
            background: 'rgba(255,255,255,0.06)',
            color: pruning ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)',
            fontSize: 11.5,
            fontWeight: 600,
            flex: 'none',
          }}
        >
          {pruning ? 'Pruning…' : 'Prune'}
        </button>
      </div>
    </>
  )
}
