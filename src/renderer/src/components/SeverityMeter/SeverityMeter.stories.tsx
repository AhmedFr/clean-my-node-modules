import type { Meta, StoryObj } from '@storybook/react-vite'
import type { SeverityCounts } from '../../lib/severity'
import { SeverityMeter } from './SeverityMeter'

const MIXED: SeverityCounts = { critical: 2, high: 5, moderate: 8, low: 3, vulnerable: 18, outdated: 12 }
const CLEAN: SeverityCounts = { critical: 0, high: 0, moderate: 0, low: 0, vulnerable: 0, outdated: 4 }

const meta = {
  title: 'Primitives/SeverityMeter',
  component: SeverityMeter,
  args: { total: 240 },
} satisfies Meta<typeof SeverityMeter>

export default meta
type Story = StoryObj<typeof meta>

export const MixedSeverities: Story = { args: { counts: MIXED } }
export const AllClean: Story = { args: { counts: CLEAN } }
export const Computing: Story = { args: { counts: MIXED, computing: true } }
