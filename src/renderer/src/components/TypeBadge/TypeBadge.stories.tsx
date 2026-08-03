import type { Meta, StoryObj } from '@storybook/react-vite'
import { TypeBadge } from './TypeBadge'

const meta = {
  title: 'Primitives/TypeBadge',
  component: TypeBadge,
} satisfies Meta<typeof TypeBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Image: Story = { args: { kind: 'image' } }
export const Volume: Story = { args: { kind: 'volume' } }
export const Container: Story = { args: { kind: 'container' } }
export const BuildCache: Story = { args: { kind: 'buildcache' } }
