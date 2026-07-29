import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { WhyLifecycle } from './WhyLifecycle'
import { SvgSprite } from '../SvgSprite'
import { getDictionary } from '@/lib/i18n'

const meta = {
  title: 'Sections/WhyLifecycle',
  component: WhyLifecycle,
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
} satisfies Meta<typeof WhyLifecycle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
