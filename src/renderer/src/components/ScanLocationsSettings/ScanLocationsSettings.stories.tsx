import type { SetSetting } from '@renderer/hooks/useSettings'
import { DEFAULT_SETTINGS } from '@shared/settings.constants'
import type { Settings } from '@shared/settings.types'
import type { VolumeOption } from '@shared/volume.types'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { mockCleanApi } from '../../../../../.storybook/mock-clean-api'
import { ScanLocationsSettings } from './ScanLocationsSettings'

// ScanLocationsSettings fetches window.clean.listVolumes() on mount — Electron's
// preload isn't present in Storybook, so each story stubs the volume list it wants
// before the component mounts.
function withVolumes(volumes: VolumeOption[]): Decorator {
  return (Story) => {
    mockCleanApi({ listVolumes: () => Promise.resolve(volumes) })
    return <Story />
  }
}

const setSetting: SetSetting = async () => DEFAULT_SETTINGS

const SETTINGS_EMPTY: Settings = { ...DEFAULT_SETTINGS, scanRoots: [] }
const SETTINGS_POPULATED: Settings = {
  ...DEFAULT_SETTINGS,
  scanRoots: ['/Volumes/Backup', '/Users/dev/Projects'],
}

// Hosted full-width in the launcher's Settings > Scanning tab (740px), not the 334px panel.
const meta = {
  title: 'Settings/ScanLocationsSettings',
  component: ScanLocationsSettings,
  parameters: { panel: false },
  render: (args) => (
    <div style={{ width: 680, background: 'var(--panel-launcher)', borderRadius: 14 }}>
      <ScanLocationsSettings {...args} />
    </div>
  ),
  args: {
    settings: SETTINGS_EMPTY,
    accent: ACCENT,
    setSetting,
  },
} satisfies Meta<typeof ScanLocationsSettings>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [withVolumes([])],
}
export const WithVolumesAndFolders: Story = {
  args: { settings: SETTINGS_POPULATED },
  decorators: [
    withVolumes([
      { path: '/Volumes/Backup', name: 'Backup', included: true },
      { path: '/Volumes/Work SSD', name: 'Work SSD', included: false },
    ]),
  ],
}
