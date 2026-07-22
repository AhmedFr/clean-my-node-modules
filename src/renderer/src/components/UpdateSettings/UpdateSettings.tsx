import { useUpdater } from '@renderer/hooks/useUpdater'
import { formatSizeStr, relativeTime, releaseDateLabel } from '@renderer/lib/format'
import type { ReactNode } from 'react'
import type { UpdateSettingsProps } from './UpdateSettings.types'

/** The Updates tab of Settings: version info, manual check, and the two-click
 *  download -> restart-and-install flow. All updater actions live here. */
export function UpdateSettings({ accent }: UpdateSettingsProps): ReactNode {
  const { state, check, download, install } = useUpdater()
  const { status } = state
  const info = 'info' in status ? status.info : null
  const meta = info
    ? [info.sizeBytes ? formatSizeStr(info.sizeBytes) : null, releaseDateLabel(info.releaseDate)]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '13px 4px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 550, color: 'var(--text)' }}>
            TidyDisk {state.currentVersion || '…'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
            {status.phase === 'checking'
              ? 'Checking…'
              : state.checkedAt
                ? `Last checked ${relativeTime(state.checkedAt)}`
                : 'Updates are checked automatically in the background'}
          </div>
        </div>
        <button className="cc-btn ghost" disabled={status.phase === 'checking'} onClick={check}>
          Check for updates
        </button>
      </div>

      {status.phase === 'idle' && state.checkedAt !== null && (
        <div style={{ padding: '2px 4px 10px', fontSize: 12, color: 'var(--text-dim)' }}>Up to date.</div>
      )}

      {info && (
        <>
          <div style={{ height: 1, background: 'var(--surface-1)' }} />
          <div style={{ padding: '13px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 550, color: 'var(--text)' }}>
                  Version {info.version} available
                </div>
                {meta && <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>{meta}</div>}
              </div>
              {status.phase === 'available' && (
                <button className="cc-btn danger" style={{ background: accent }} onClick={download}>
                  Download update
                </button>
              )}
              {status.phase === 'downloading' && (
                <span
                  aria-live="polite"
                  style={{
                    fontSize: 12.5,
                    color: 'var(--text-dim)',
                    fontVariantNumeric: 'tabular-nums',
                    flex: '0 0 auto',
                  }}
                >
                  Downloading… {status.percent}%
                </span>
              )}
              {status.phase === 'downloaded' && (
                <button className="cc-btn danger" style={{ background: accent }} onClick={install}>
                  Restart and install
                </button>
              )}
            </div>
            {info.notes && (
              <div
                style={{
                  marginTop: 10,
                  padding: '10px 12px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 7,
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: 'var(--text)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {info.notes}
              </div>
            )}
          </div>
        </>
      )}

      {status.phase === 'error' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '2px 4px 10px',
            fontSize: 12,
            color: 'var(--text-dim)',
          }}
        >
          <span>
            {status.kind === 'translocation'
              ? 'Updates need TidyDisk to run from the Applications folder. Move the app there and relaunch.'
              : status.kind === 'network'
                ? 'Could not reach the update server.'
                : `Update check failed: ${status.message}`}
          </span>
          {status.kind !== 'translocation' && (
            <button className="cc-btn ghost" onClick={check}>
              Try again
            </button>
          )}
        </div>
      )}
    </>
  )
}
