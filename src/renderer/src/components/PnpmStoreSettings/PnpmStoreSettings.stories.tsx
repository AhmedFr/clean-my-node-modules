import type { SetSetting } from '@renderer/hooks/useSettings'
import type { PnpmStoreInfo } from '@shared/pnpm-store.types'
import { DEFAULT_SETTINGS } from '@shared/settings.constants'
import type { Settings } from '@shared/settings.types'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PnpmStoreSettings } from './PnpmStoreSettings'

const SETTINGS: Settings = { ...DEFAULT_SETTINGS }

const SETTINGS_WITH_OVERRIDES: Settings = {
  ...DEFAULT_SETTINGS,
  pnpmStorePath: '/Users/dev/pnpm-store',
  pnpmBinaryPath: '/opt/homebrew/bin/pnpm',
}

const setSetting: SetSetting = async () => SETTINGS

const STORE: PnpmStoreInfo = {
  available: true,
  path: '/Users/dev/Library/pnpm/store/v10',
  displayPath: '~/Library/pnpm/store/v10',
  sizeBytes: 6_800_000_000,
  checkedAt: Date.now(),
  source: 'pnpm',
  canPrune: true,
}

const STORE_MANUAL: PnpmStoreInfo = {
  ...STORE,
  path: '/Users/dev/pnpm-store',
  displayPath: '/Users/dev/pnpm-store',
  source: 'manual',
}

const STORE_NEEDS_BINARY: PnpmStoreInfo = {
  ...STORE,
  source: 'inferred',
  canPrune: false,
}

const STORE_UNAVAILABLE: PnpmStoreInfo = {
  available: false,
  path: null,
  displayPath: '',
  sizeBytes: 0,
  checkedAt: Date.now(),
  source: 'none',
  canPrune: false,
  reason: 'pnpm store not found on this Mac',
}

// Hosted full-width in the launcher's Settings > Scanning tab (740px), not the 334px panel.
const meta = {
  title: 'Settings/PnpmStoreSettings',
  component: PnpmStoreSettings,
  parameters: { panel: false },
  render: (args) => (
    <div style={{ width: 680, background: 'var(--panel-launcher)', borderRadius: 14 }}>
      <PnpmStoreSettings {...args} />
    </div>
  ),
  args: {
    settings: SETTINGS,
    setSetting,
    store: STORE,
    onRefresh: () => {},
  },
} satisfies Meta<typeof PnpmStoreSettings>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const ManualOverrides: Story = { args: { settings: SETTINGS_WITH_OVERRIDES, store: STORE_MANUAL } }
export const Checking: Story = { args: { store: null } }
export const NeedsBinary: Story = { args: { store: STORE_NEEDS_BINARY } }
export const Unavailable: Story = { args: { store: STORE_UNAVAILABLE } }
