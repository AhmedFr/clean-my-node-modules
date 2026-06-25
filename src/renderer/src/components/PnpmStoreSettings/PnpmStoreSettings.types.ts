import type { SetSetting } from '@renderer/hooks/useSettings'
import type { PnpmStoreInfo } from '@shared/pnpm-store.types'
import type { Settings } from '@shared/settings.types'

export interface PnpmStoreSettingsProps {
  settings: Settings
  setSetting: SetSetting
  store: PnpmStoreInfo | null
  /** Re-resolve the store after an override changes. */
  onRefresh: () => void
}
