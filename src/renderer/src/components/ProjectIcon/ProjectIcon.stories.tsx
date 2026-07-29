import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProjectIcon } from './ProjectIcon'

const meta = {
  title: 'Primitives/ProjectIcon',
  component: ProjectIcon,
} satisfies Meta<typeof ProjectIcon>

export default meta
type Story = StoryObj<typeof meta>

// No iconDataUrl on any of these, exercises the FrameworkIcon fallback path.
// Per the task brief: do not fabricate a fake iconDataUrl.
export const ReactProject: Story = { args: { p: { kind: 'react', name: 'my-app' } } }
export const NodeProject: Story = { args: { p: { kind: 'node', name: 'api-server' } } }
export const VueProject: Story = { args: { p: { kind: 'vue', name: 'dashboard' } } }
