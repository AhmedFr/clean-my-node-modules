import { TypeBadge } from '@renderer/components/TypeBadge'
import { UIIcon } from '@renderer/components/UIIcon'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CacheRow } from './CacheRow'

const meta = {
  title: 'Rows/CacheRow',
  component: CacheRow,
  args: {
    icon: UIIcon.hdd,
    name: 'pnpm store',
    detail: '~/Library/pnpm/store/v3',
    size: 4.8e9,
    selected: false,
    disabled: false,
    busy: false,
    actionLabel: 'Prune',
    onAction: () => {},
    onSelect: () => {},
  },
} satisfies Meta<typeof CacheRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Selected: Story = { args: { selected: true } }
export const Disabled: Story = { args: { disabled: true, actionLabel: undefined, size: undefined } }
export const Busy: Story = { args: { busy: true } }
export const WithBadge: Story = { args: { name: 'Docker build cache', badge: <TypeBadge kind="buildcache" /> } }
export const DangerAction: Story = {
  args: { name: 'Docker build cache', actionLabel: 'Remove', actionIcon: UIIcon.trash, danger: true },
}
export const NoAction: Story = { args: { actionLabel: undefined, onAction: undefined } }
