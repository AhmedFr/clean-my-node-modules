import type { LiveInfo } from '@shared/liveness.types'
import type { Project } from '@shared/project.types'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { Row } from './Row'

// Minimal realistic project fixture (all required Project fields).
const project: Project = {
  id: 'story-my-app',
  name: 'my-app',
  path: '~/code/my-app',
  absPath: '/Users/dev/code/my-app',
  kind: 'next',
  size: 1.2e9,
  uniqueSize: 0.9e9,
  lastUsed: 1751000000000,
}

const live: LiveInfo = { pid: 4821, command: 'next dev', port: 3000 }

const meta = {
  title: 'Rows/Row',
  component: Row,
  args: {
    p: project,
    accent: ACCENT,
    density: 'roomy',
    sizeStyle: 'bar',
    maxBytes: 3e9,
    selected: false,
    deleting: false,
    rowRef: () => {},
    onSelect: () => {},
    onOpen: () => {},
    onFinder: () => {},
    onDelete: () => {},
  },
} satisfies Meta<typeof Row>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Selected: Story = { args: { selected: true } }
export const Deleting: Story = { args: { deleting: true } }
export const SizeStylePlain: Story = { args: { sizeStyle: 'plain' } }
export const SizeStyleBar: Story = { args: { sizeStyle: 'bar' } }
export const SizeStyleRing: Story = { args: { sizeStyle: 'ring' } }
export const DensityRoomy: Story = { args: { density: 'roomy' } }
export const DensityCompact: Story = { args: { density: 'compact' } }
export const Live: Story = { args: { live } }
