import type { UpdaterState, UpdateSummary } from '@shared/updater.types'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { mockCleanApi } from '../../../../../.storybook/mock-clean-api'
import { UpdateBanner } from './UpdateBanner'

// UpdateBanner reads its state from useUpdater() (window.clean.getUpdaterState /
// onUpdaterState), not from props — Electron's preload isn't present in Storybook,
// so each story stubs the updater snapshot it wants before the component mounts.
const INFO: UpdateSummary = {
  version: '1.5.0',
  releaseDate: '2026-07-20T00:00:00.000Z',
  sizeBytes: 42_600_000,
  notes: null,
}

function withUpdaterState(status: UpdaterState['status']): Decorator {
  return (Story) => {
    mockCleanApi({
      getUpdaterState: () => Promise.resolve({ currentVersion: '1.4.2', checkedAt: Date.now(), status }),
      onUpdaterState: () => () => {},
    })
    return <Story />
  }
}

// Hosted in the menu bar panel — default 334px framing.
const meta = {
  title: 'Views/UpdateBanner',
  component: UpdateBanner,
  args: {
    accent: ACCENT,
    dismissedVersion: undefined,
    onDismiss: () => {},
  },
} satisfies Meta<typeof UpdateBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Available: Story = {
  decorators: [withUpdaterState({ phase: 'available', info: INFO })],
}
export const Downloading: Story = {
  decorators: [withUpdaterState({ phase: 'downloading', info: INFO, percent: 47 })],
}
export const Downloaded: Story = {
  decorators: [withUpdaterState({ phase: 'downloaded', info: INFO })],
}
