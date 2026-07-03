import { PixelStepper } from '@renderer/components/PixelStepper'
import { PnpmStoreSettings } from '@renderer/components/PnpmStoreSettings'
import { Segmented } from '@renderer/components/Segmented'
import { Toggle } from '@renderer/components/Toggle'
import type { SetSetting } from '@renderer/hooks/useSettings'
import { BUY_URL } from '@shared/license.constants'
import type { ActivateResult, LicenseState } from '@shared/license.types'
import type { PnpmStoreInfo } from '@shared/pnpm-store.types'
import type { Settings } from '@shared/settings.types'
import type { ReactNode } from 'react'
import { useState } from 'react'

interface SettingsRowProps {
  label: string
  hint?: string
  children: ReactNode
}

function SettingsRow({ label, hint, children }: SettingsRowProps): ReactNode {
  return (
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
        <div style={{ fontSize: 13.5, fontWeight: 550, color: 'var(--text)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ flex: '0 0 auto' }}>{children}</div>
    </div>
  )
}

interface SettingsViewProps {
  settings: Settings
  setSetting: SetSetting
  accent: string
  store: PnpmStoreInfo | null
  onRefreshStore: () => void
  license: LicenseState
  activateLicense: (key: string) => Promise<ActivateResult>
}

function LicenseActivator({
  accent,
  activate,
}: {
  accent: string
  activate: (key: string) => Promise<ActivateResult>
}): ReactNode {
  const [key, setKey] = useState('')
  const [error, setError] = useState<null | 'invalid' | 'network'>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (): Promise<void> => {
    if (!key.trim() || busy) return
    setBusy(true)
    const result = await activate(key)
    setBusy(false)
    if (!result.ok) setError(result.reason)
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {error && (
        <span style={{ fontSize: 11.5, color: accent }}>{error === 'network' ? 'No connection' : 'Invalid'}</span>
      )}
      <input
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
          width: 170,
          background: 'var(--surface-2)',
          border: '1px solid var(--hairline)',
          borderRadius: 7,
          padding: '6px 9px',
          fontSize: 12,
          color: 'var(--text)',
          outline: 'none',
        }}
      />
      <button
        className="cc-btn ghost"
        disabled={busy}
        style={{ opacity: busy ? 0.6 : 1 }}
        onClick={() => void submit()}
      >
        Activate
      </button>
    </div>
  )
}

/** Full-window settings view. */
export function SettingsView({
  settings,
  setSetting,
  accent,
  store,
  onRefreshStore,
  license,
  activateLicense,
}: SettingsViewProps): ReactNode {
  const gb = settings.thresholdGB
  return (
    <div style={{ padding: '12px 18px 22px' }}>
      <SettingsRow label="Scan frequency" hint="How often Clean scans your disk in the background">
        <Segmented
          accent={accent}
          value={settings.scanInterval}
          onChange={(v) => setSetting('scanInterval', v)}
          options={[
            { value: '6h', label: '6h' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'manual', label: 'Off' },
          ]}
        />
      </SettingsRow>
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
      <SettingsRow
        label="Alert threshold"
        hint={`Notify me when node_modules folders exceed ${gb.toFixed(0)} GB total`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: 230 }}>
          <div style={{ flex: 1 }}>
            <PixelStepper valueGB={gb} accent={accent} onChange={(v) => setSetting('thresholdGB', v)} />
          </div>
          <span
            style={{
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 650,
              fontSize: 13,
              color: 'var(--text)',
              minWidth: 42,
              textAlign: 'right',
            }}
          >
            {gb.toFixed(0)} GB
          </span>
        </div>
      </SettingsRow>
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
      <SettingsRow label="Threshold notifications" hint="Show a desktop alert the moment you cross the limit">
        <Toggle on={settings.notify} accent={accent} onToggle={() => setSetting('notify', !settings.notify)} />
      </SettingsRow>
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
      <SettingsRow
        label="Check npm for updates & advisories"
        hint="In the Packages tab, look up latest versions and security warnings from npmjs.org"
      >
        <Toggle
          on={settings.checkUpdates}
          accent={accent}
          onToggle={() => setSetting('checkUpdates', !settings.checkUpdates)}
        />
      </SettingsRow>
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
      <SettingsRow
        label="Usage analytics"
        hint="Anonymous usage events help improve the app. No file paths or project names, ever"
      >
        <Toggle on={settings.analytics} accent={accent} onToggle={() => setSetting('analytics', !settings.analytics)} />
      </SettingsRow>
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
      <div style={{ padding: '13px 4px 4px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 550, color: 'var(--text)' }}>pnpm store</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
          Override detection if the store or pnpm can't be found automatically
        </div>
      </div>
      <PnpmStoreSettings settings={settings} setSetting={setSetting} store={store} onRefresh={onRefreshStore} />
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
      <SettingsRow
        label="License"
        hint={
          license.pro
            ? `Pro · ${license.email ?? 'licensed'} · cleanup unlocked`
            : license.needsReverify
              ? 'Pro license found. Connect to the internet to re-verify'
              : 'Free: scan & see everything; one-click cleanup needs a license'
        }
      >
        {license.pro ? (
          <span style={{ fontSize: 12.5, fontWeight: 650, color: '#34d399' }}>Pro ✓</span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="cc-btn danger"
              style={{ background: accent }}
              onClick={() => {
                window.clean.trackEvent('buy_clicked', { source: 'settings' })
                void window.clean.openExternal(BUY_URL)
              }}
            >
              Buy · €19
            </button>
            <LicenseActivator accent={accent} activate={activateLicense} />
          </div>
        )}
      </SettingsRow>
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
      <SettingsRow label="Uninstall" hint="Move Clean and its preferences to the Trash">
        <button
          className="cc-btn danger"
          style={{ background: '#d4483f' }}
          onClick={() => void window.clean.uninstall()}
        >
          Uninstall…
        </button>
      </SettingsRow>
    </div>
  )
}
