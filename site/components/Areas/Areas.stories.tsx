import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Areas } from './Areas'
import { SvgSprite } from '../SvgSprite'
import { getDictionary } from '@/lib/i18n'

const meta = {
  title: 'Sections/Areas',
  component: Areas,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <>
        <SvgSprite />
        <Story />
      </>
    ),
  ],
  args: { dict: getDictionary('en') },
} satisfies Meta<typeof Areas>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
