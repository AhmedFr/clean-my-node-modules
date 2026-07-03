import { formatSizeStr } from '@renderer/lib/format'
import type { PnpmStoreInfo } from '@shared/pnpm-store.types'
import type { ReactNode } from 'react'
import type { PnpmStoreSettingsProps } from './PnpmStoreSettings.types'

const SOURCE_LABEL: Record<PnpmStoreInfo['source'], string> = {
  manual: 'set manually',
  pnpm: 'detected automatically',
  inferred: 'found on disk',
  none: '',
}

function statusLine(store: PnpmStoreInfo | null): string {
  if (!store) return 'Checking…'
  if (store.available) {
    const label = SOURCE_LABEL[store.source]
    const base = `${store.displayPath} · ${formatSizeStr(store.sizeBytes)}`
    return label ? `${base} · ${label}` : base
  }
  return store.reason ?? 'pnpm store not found'
}

function PathRow({
  label,
  value,
  placeholder,
  mode,
  onPick,
  onClear,
}: {
  label: string
  value: string
  placeholder: string
  mode: 'file' | 'folder'
  onPick: (path: string) => void
  onClear: () => void
}): ReactNode {
  return (
    <div style={{ padding: '11px 4px' }}>
      <div style={{ fontSize: 13.5, fontWeight: 550, color: 'var(--text)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            color: value ? 'var(--text-muted)' : 'var(--text-dim)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'ui-monospace, monospace',
          }}
          title={value || placeholder}
        >
          {value || placeholder}
        </div>
        <button
          className="cc-btn ghost"
          onClick={() => {
            void window.clean.pickPath(mode).then((p) => {
              if (p) onPick(p)
            })
          }}
        >
          Choose…
        </button>
        {value && (
          <button className="cc-btn ghost" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

/** Manual pnpm store / binary overrides with a live detection status line. */
export function PnpmStoreSettings({ settings, setSetting, store, onRefresh }: PnpmStoreSettingsProps): ReactNode {
  const apply = (key: 'pnpmStorePath' | 'pnpmBinaryPath', value: string): void => {
    void setSetting(key, value).then(() => onRefresh())
  }
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', padding: '2px 4px 8px' }}>{statusLine(store)}</div>
      {store?.available && !store.canPrune && (
        <div style={{ fontSize: 11.5, color: 'var(--text-dim)', padding: '0 4px 8px' }}>
          Pruning needs a runnable pnpm binary. Set one below to enable it.
        </div>
      )}
      <PathRow
        label="pnpm store folder"
        value={settings.pnpmStorePath ?? ''}
        placeholder="Auto-detected. Choose to override"
        mode="folder"
        onPick={(p) => apply('pnpmStorePath', p)}
        onClear={() => apply('pnpmStorePath', '')}
      />
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
      <PathRow
        label="pnpm binary"
        value={settings.pnpmBinaryPath ?? ''}
        placeholder="Auto-detected. Choose to override"
        mode="file"
        onPick={(p) => apply('pnpmBinaryPath', p)}
        onClear={() => apply('pnpmBinaryPath', '')}
      />
    </div>
  )
}
