import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { Glyph } from './Glyph'

const meta = {
  title: 'Primitives/Glyph',
  component: Glyph,
} satisfies Meta<typeof Glyph>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { size: 20, color: 'currentColor' } }
export const Large: Story = { args: { size: 44, color: ACCENT, strokeWidth: 1.8 } }
export const Small: Story = { args: { size: 14 } }
