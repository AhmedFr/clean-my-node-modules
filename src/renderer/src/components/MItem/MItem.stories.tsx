import type { Meta, StoryObj } from '@storybook/react-vite'
import { UIIcon } from '../UIIcon'
import { MItem } from './MItem'

const meta = {
  title: 'Primitives/MItem',
  component: MItem,
  args: { label: 'Reveal in Finder', onClick: () => {} },
} satisfies Meta<typeof MItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithIcon: Story = { args: { icon: UIIcon.finder } }
export const WithShortcut: Story = { args: { icon: UIIcon.refresh, label: 'Rescan', shortcut: '⌘R' } }
export const Danger: Story = { args: { icon: UIIcon.trash, label: 'Delete node_modules', danger: true } }
