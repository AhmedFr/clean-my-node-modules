import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { ResultView } from './ResultView'

// Hosted full-width in the launcher window (740px), not the 334px panel.
const meta = {
  title: 'Views/ResultView',
  component: ResultView,
  parameters: { panel: false },
  render: (args) => (
    <div style={{ width: 680, background: 'var(--panel-launcher)', borderRadius: 14 }}>
      <ResultView {...args} />
    </div>
  ),
  args: {
    accent: ACCENT,
    totalBytes: 42_300_000_000,
    nodeModulesBytes: 30_100_000_000,
    storeBytes: 12_200_000_000,
    projectsCount: 14,
    copied: false,
    onCopy: () => {},
    onContinue: () => {},
  },
} satisfies Meta<typeof ResultView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Copied: Story = { args: { copied: true } }
export const ZeroBytes: Story = {
  args: { totalBytes: 0, nodeModulesBytes: 0, storeBytes: 0, projectsCount: 0 },
}
