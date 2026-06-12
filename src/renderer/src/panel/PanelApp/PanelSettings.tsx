import type { ReactNode } from 'react'
import type { Settings } from '@shared/settings.types'
import type { SetSetting } from '@renderer/hooks/useSettings'
import { Segmented } from '@renderer/components/Segmented'
import { Toggle } from '@renderer/components/Toggle'
import { Separator } from './Separator'

interface PanelSettingsProps {
  settings: Settings
  setSetting: SetSetting
  accent: string
}

/** Compact settings inside the dropdown panel. */
export function PanelSettings({ settings, setSetting, accent }: PanelSettingsProps): ReactNode {
  return (
    <div style={{ padding: '4px 12px 12px' }}>
      <div
        style={{ padding: '10px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Scan frequency</div>
        <Segmented
          small
          accent={accent}
          value={settings.scanInterval}
          options={[
            { value: '6h', label: '6h' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
          ]}
          onChange={(v) => setSetting('scanInterval', v)}
        />
      </div>
      <Separator />
      <div style={{ padding: '8px 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Alert threshold</div>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 13, color: '#fff' }}>
            {settings.thresholdGB.toFixed(1)} GB
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={settings.thresholdGB}
          onChange={(e) => setSetting('thresholdGB', parseFloat(e.target.value))}
          style={{ width: '100%', marginTop: 10, accentColor: accent }}
        />
      </div>
      <Separator />
      <div
        style={{ padding: '8px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Notify when over limit</div>
        <Toggle on={settings.notify} accent={accent} onToggle={() => setSetting('notify', !settings.notify)} />
      </div>
    </div>
  )
}
