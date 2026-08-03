import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Hero } from './Hero'
import { SvgSprite } from '../SvgSprite'
import { getDictionary } from '@/lib/i18n'

const meta = {
  title: 'Sections/Hero',
  component: Hero,
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
} satisfies Meta<typeof Hero>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
