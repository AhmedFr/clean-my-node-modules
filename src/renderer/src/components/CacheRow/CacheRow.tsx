import { formatSizeStr } from '@renderer/lib/format'
import type { ReactNode } from 'react'
import type { CacheRowProps } from './CacheRow.types'

/** One global cache in the launcher's Caches tab (pnpm store, npm cache, …). */
export function CacheRow({
  icon,
  name,
  detail,
  size,
  selected = false,
  disabled = false,
  busy = false,
  actionLabel,
  onAction,
  onSelect,
}: CacheRowProps): ReactNode {
  return (
    <div
      onClick={disabled ? undefined : onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '10px 12px',
        borderRadius: 10,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        background: selected ? 'var(--surface-2)' : 'transparent',
        boxShadow: selected ? 'inset 0 0 0 1px var(--hairline)' : 'none',
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: 'var(--surface-2)',
          color: 'var(--text-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        {icon({ size: 15 })}
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
          title={detail}
        >
          {detail}
        </div>
      </div>
      {size !== undefined && (
        <span
          style={{
            fontSize: 13,
            fontWeight: 650,
            color: 'var(--text-2)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatSizeStr(size)}
        </span>
      )}
      {actionLabel && !disabled ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAction?.()
          }}
          disabled={busy}
          title="Remove packages no project references (pnpm store prune)"
          style={{
            border: '1px solid var(--surface-4)',
            cursor: busy ? 'default' : 'pointer',
            padding: '5px 11px',
            borderRadius: 8,
            background: 'var(--surface-1)',
            color: busy ? 'var(--text-dim)' : 'var(--text-2)',
            fontSize: 12,
            fontWeight: 600,
            flex: 'none',
          }}
        >
          {busy ? 'Pruning…' : actionLabel}
        </button>
      ) : disabled ? (
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: 'var(--text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '.05em',
            flex: 'none',
          }}
        >
          soon
        </span>
      ) : null}
    </div>
  )
}
