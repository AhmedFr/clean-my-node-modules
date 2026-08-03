import type { UpdaterState, UpdateSummary } from '@shared/updater.types'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { mockCleanApi } from '../../../../../.storybook/mock-clean-api'
import { UpdateSettings } from './UpdateSettings'

// UpdateSettings reads its state from useUpdater() (window.clean.getUpdaterState /
// onUpdaterState), not from props. Electron's preload isn't present in Storybook,
// so each story stubs the updater snapshot it wants before the component mounts.
const INFO: UpdateSummary = {
  version: '1.5.0',
  releaseDate: '2026-07-20T00:00:00.000Z',
  sizeBytes: 42_600_000,
  notes: 'Fixes a rare crash on wake and speeds up the initial disk scan.',
}
const CHECKED_AT = Date.now() - 3 * 60 * 60 * 1000

function withUpdaterState(state: UpdaterState): Decorator {
  return (Story) => {
    mockCleanApi({
      getUpdaterState: () => Promise.resolve(state),
      onUpdaterState: () => () => {},
    })
    return <Story />
  }
}

// Hosted full-width in the launcher's Settings > Updates tab (740px), not the 334px panel.
const meta = {
  title: 'Settings/UpdateSettings',
  component: UpdateSettings,
  parameters: { panel: false },
  render: (args) => (
    <div style={{ width: 680, background: 'var(--panel-launcher)', borderRadius: 14 }}>
      <UpdateSettings {...args} />
    </div>
  ),
  args: { accent: ACCENT },
} satisfies Meta<typeof UpdateSettings>

export default meta
type Story = StoryObj<typeof meta>

export const NeverChecked: Story = {
  decorators: [withUpdaterState({ currentVersion: '1.4.2', checkedAt: null, status: { phase: 'idle' } })],
}
export const UpToDate: Story = {
  decorators: [withUpdaterState({ currentVersion: '1.4.2', checkedAt: CHECKED_AT, status: { phase: 'idle' } })],
}
export const Checking: Story = {
  decorators: [withUpdaterState({ currentVersion: '1.4.2', checkedAt: CHECKED_AT, status: { phase: 'checking' } })],
}
export const Available: Story = {
  decorators: [
    withUpdaterState({ currentVersion: '1.4.2', checkedAt: CHECKED_AT, status: { phase: 'available', info: INFO } }),
  ],
}
export const Downloading: Story = {
  decorators: [
    withUpdaterState({
      currentVersion: '1.4.2',
      checkedAt: CHECKED_AT,
      status: { phase: 'downloading', info: INFO, percent: 63 },
    }),
  ],
}
export const Downloaded: Story = {
  decorators: [
    withUpdaterState({ currentVersion: '1.4.2', checkedAt: CHECKED_AT, status: { phase: 'downloaded', info: INFO } }),
  ],
}
export const ErrorNetwork: Story = {
  decorators: [
    withUpdaterState({
      currentVersion: '1.4.2',
      checkedAt: CHECKED_AT,
      status: { phase: 'error', message: 'fetch failed', kind: 'network' },
    }),
  ],
}
export const ErrorTranslocation: Story = {
  decorators: [
    withUpdaterState({
      currentVersion: '1.4.2',
      checkedAt: CHECKED_AT,
      status: { phase: 'error', message: 'translocated', kind: 'translocation' },
    }),
  ],
}
export const ErrorUnknown: Story = {
  decorators: [
    withUpdaterState({
      currentVersion: '1.4.2',
      checkedAt: CHECKED_AT,
      status: { phase: 'error', message: 'Unexpected token in JSON', kind: 'unknown' },
    }),
  ],
}
