import { PixelStepper } from '@renderer/components/PixelStepper'
import { Segmented } from '@renderer/components/Segmented'
import { Toggle } from '@renderer/components/Toggle'
import type { SetSetting } from '@renderer/hooks/useSettings'
import type { Settings } from '@shared/settings.types'
import type { ReactNode } from 'react'
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
      <div style={{ padding: '10px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Scan frequency</div>
        <Segmented
          small
          accent={accent}
          value={settings.scanInterval}
          options={[
            { value: '6h', label: '6h' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'manual', label: 'Off' },
          ]}
          onChange={(v) => setSetting('scanInterval', v)}
        />
      </div>
      <Separator />
      <div style={{ padding: '8px 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Alert threshold</div>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 13, color: '#fff' }}>
            {settings.thresholdGB.toFixed(0)} GB
          </span>
        </div>
        <div style={{ marginTop: 10 }}>
          <PixelStepper valueGB={settings.thresholdGB} accent={accent} onChange={(v) => setSetting('thresholdGB', v)} />
        </div>
      </div>
      <Separator />
      <div style={{ padding: '8px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Notify when over limit</div>
        <Toggle on={settings.notify} accent={accent} onToggle={() => setSetting('notify', !settings.notify)} />
      </div>
    </div>
  )
}
