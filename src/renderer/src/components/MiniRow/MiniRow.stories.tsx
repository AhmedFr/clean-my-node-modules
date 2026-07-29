import type { LiveInfo } from '@shared/liveness.types'
import type { Project } from '@shared/project.types'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { MiniRow } from './MiniRow'

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
  title: 'Rows/MiniRow',
  component: MiniRow,
  args: {
    p: project,
    accent: ACCENT,
    deleting: false,
    onDelete: () => {},
    onReveal: () => {},
  },
} satisfies Meta<typeof MiniRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Deleting: Story = { args: { deleting: true } }
export const Live: Story = { args: { live } }
