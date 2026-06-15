import type { ReactNode } from 'react'
import type { Settings } from '@shared/settings.types'
import type { SetSetting } from '@renderer/hooks/useSettings'
import { Segmented } from '@renderer/components/Segmented'
import { Toggle } from '@renderer/components/Toggle'

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
}

/** Full-window settings view. */
export function SettingsView({ settings, setSetting, accent }: SettingsViewProps): ReactNode {
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
            { value: 'manual', label: 'Manual' },
          ]}
        />
      </SettingsRow>
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
      <SettingsRow
        label="Alert threshold"
        hint={`Notify me when node_modules folders exceed ${gb.toFixed(1)} GB total`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={gb}
            onChange={(e) => setSetting('thresholdGB', parseFloat(e.target.value))}
            style={{ width: 150, accentColor: accent }}
          />
          <span
            style={{
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 650,
              fontSize: 13,
              color: 'var(--text)',
              minWidth: 48,
            }}
          >
            {gb.toFixed(1)} GB
          </span>
        </div>
      </SettingsRow>
      <div style={{ height: 1, background: 'var(--surface-1)' }} />
      <SettingsRow label="Threshold notifications" hint="Show a desktop alert the moment you cross the limit">
        <Toggle on={settings.notify} accent={accent} onToggle={() => setSetting('notify', !settings.notify)} />
      </SettingsRow>
    </div>
  )
}
