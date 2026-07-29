import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { UnlockPrompt } from './UnlockPrompt'

// Hosted as the full-width launcher footer (740px), not the 334px panel.
const meta = {
  title: 'Views/UnlockPrompt',
  component: UnlockPrompt,
  parameters: { panel: false },
  render: (args) => (
    <div style={{ width: 680, background: 'var(--panel-launcher)', borderRadius: 14 }}>
      <UnlockPrompt {...args} />
    </div>
  ),
  args: {
    accent: ACCENT,
    bytes: 8_400_000_000,
    activate: async () => ({ ok: true, state: { pro: true } }),
    onClose: () => {},
    needsReverify: false,
  },
} satisfies Meta<typeof UnlockPrompt>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const NoBytesKnown: Story = { args: { bytes: undefined } }
export const NeedsReverify: Story = { args: { needsReverify: true, bytes: undefined } }
