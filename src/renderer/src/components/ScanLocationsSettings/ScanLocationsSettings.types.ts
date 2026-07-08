import type { SetSetting } from '@renderer/hooks/useSettings'
import type { Settings } from '@shared/settings.types'

export interface ScanLocationsSettingsProps {
  settings: Settings
  accent: string
  setSetting: SetSetting
}
