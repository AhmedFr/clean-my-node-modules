import { PixelStepper } from '@renderer/components/PixelStepper'
import { Segmented } from '@renderer/components/Segmented'
import { UIIcon } from '@renderer/components/UIIcon'
import type { SetSetting } from '@renderer/hooks/useSettings'
import type { Settings } from '@shared/settings.types'
import type { ReactNode } from 'react'

interface SetupStepProps {
  settings: Settings
  setSetting: SetSetting
  accent: string
  onBack: () => void
  onScan: () => void
}

/** Onboarding step 2: alert limit (pixel stepper) + scan cadence (incl. Off). */
export function SetupStep({ settings, setSetting, accent, onBack, onScan }: SetupStepProps): ReactNode {
  return (
    <div style={{ padding: '34px 40px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 22 }}>
        <span style={{ width: 20, height: 5, borderRadius: 3, background: 'var(--surface-2)' }} />
        <span style={{ width: 20, height: 5, borderRadius: 3, background: 'var(--text-3)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Alert me when node_modules pass</span>
          <span
            style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)', fontVariantNumeric: 'tabular-nums' }}
          >
            {settings.thresholdGB.toFixed(0)} GB
          </span>
        </div>
        <PixelStepper valueGB={settings.thresholdGB} accent={accent} onChange={(v) => setSetting('thresholdGB', v)} />

        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', margin: '22px 0 9px' }}>
          Scan automatically
        </div>
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

        <button
          type="button"
          onClick={onScan}
          style={{
            marginTop: 24,
            width: '100%',
            background: accent,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '11px',
            fontSize: 13.5,
            fontWeight: 650,
            cursor: 'pointer',
          }}
        >
          Scan my disk →
        </button>
        <button
          type="button"
          onClick={onBack}
          style={{
            marginTop: 10,
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {UIIcon.chevronLeft({ size: 14 })} back
        </button>
      </div>
    </div>
  )
}
