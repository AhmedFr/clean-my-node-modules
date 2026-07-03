import { formatSizeStr } from '@renderer/lib/format'
import { BUY_URL } from '@shared/license.constants'
import type { ReactNode } from 'react'
import { useState } from 'react'
import type { UnlockPromptProps } from './UnlockPrompt.types'

/** Inline paywall shown when a free-tier user triggers a Clean action. */
export function UnlockPrompt({ accent, bytes, activate, onClose, needsReverify }: UnlockPromptProps): ReactNode {
  const [entering, setEntering] = useState(false)
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<null | 'invalid' | 'network'>(null)

  const submit = async (): Promise<void> => {
    if (!key.trim() || busy) return
    setBusy(true)
    const result = await activate(key)
    setBusy(false)
    if (result.ok) onClose()
    else setError(result.reason)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 14px',
        minHeight: 44,
      }}
    >
      {entering ? (
        <>
          <input
            autoFocus
            value={key}
            onChange={(e) => {
              setKey(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit()
            }}
            placeholder="Paste your license key"
            spellCheck={false}
            disabled={busy}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'var(--surface-2)',
              border: error !== null ? `1px solid ${accent}` : '1px solid var(--hairline)',
              borderRadius: 7,
              padding: '6px 9px',
              fontSize: 12.5,
              color: 'var(--text)',
              outline: 'none',
            }}
          />
          {error && (
            <span style={{ fontSize: 11.5, color: accent, whiteSpace: 'nowrap' }}>
              {error === 'network' ? 'No connection. Retry?' : 'Invalid key'}
            </span>
          )}
          <button className="cc-btn ghost" disabled={busy} onClick={() => setEntering(false)}>
            Back
          </button>
          <button
            className="cc-btn danger"
            style={{ background: accent, opacity: busy ? 0.6 : 1 }}
            disabled={busy}
            onClick={() => void submit()}
          >
            Activate
          </button>
        </>
      ) : (
        <>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 650, color: 'var(--text)' }}>
              {needsReverify
                ? 'Reconnect to re-verify your license'
                : bytes
                  ? `Reclaim ${formatSizeStr(bytes)} with one-click cleanup`
                  : 'Unlock one-click cleanup'}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 1 }}>
              {needsReverify
                ? 'Pro re-checks automatically when you are back online. You can also paste your key again.'
                : '€19 · lifetime license · scanning stays free forever'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
            <button className="cc-btn ghost" onClick={onClose}>
              Not now
            </button>
            <button className="cc-btn ghost" onClick={() => setEntering(true)}>
              I have a key
            </button>
            {!needsReverify && (
              <button
                className="cc-btn danger"
                style={{ background: accent }}
                onClick={() => {
                  window.clean.trackEvent('buy_clicked', { source: 'unlock_prompt' })
                  void window.clean.openExternal(BUY_URL)
                }}
              >
                Buy · €19
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
