import { useUpdater } from '@renderer/hooks/useUpdater'
import { formatSizeStr, releaseDateLabel } from '@renderer/lib/format'
import type { ReactNode } from 'react'
import { bannerModel } from './UpdateBanner.constants'
import type { UpdateBannerProps } from './UpdateBanner.types'

/** Compact one-line update nudge for the menu bar panel. Clicking it deep-links to
 *  Settings -> Updates; all download/install actions live there, not here. */
export function UpdateBanner({ accent, dismissedVersion, onDismiss }: UpdateBannerProps): ReactNode {
  const { state } = useUpdater()
  const model = bannerModel(state.status, dismissedVersion)
  if (!model) return null

  const { info } = model
  const date = releaseDateLabel(info.releaseDate)
  const label =
    model.phase === 'downloading'
      ? `Downloading v${info.version}… ${model.percent ?? 0}%`
      : model.phase === 'downloaded'
        ? `v${info.version} ready to install`
        : `v${info.version} available${info.sizeBytes ? ` · ${formatSizeStr(info.sizeBytes)}` : ''}${date ? ` · ${date}` : ''}`

  return (
    <div
      onClick={() => void window.clean.openLauncher('settings-updates')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '6px 10px 2px',
        padding: '7px 10px',
        borderRadius: 8,
        background: 'var(--surface-2)',
        border: '1px solid var(--hairline)',
        cursor: 'pointer',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 3, background: accent, flex: '0 0 auto' }} />
      <span
        style={{
          fontSize: 11.5,
          color: 'var(--text)',
          flex: 1,
          minWidth: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </span>
      {model.dismissible && (
        <button
          aria-label="Dismiss"
          onClick={(e) => {
            e.stopPropagation()
            onDismiss(info.version)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            fontSize: 12,
            padding: '0 2px',
            flex: '0 0 auto',
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
