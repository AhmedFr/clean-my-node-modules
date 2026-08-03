import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FinalCta } from './FinalCta'
import { SvgSprite } from '../SvgSprite'
import { getDictionary } from '@/lib/i18n'

const meta = {
  title: 'Sections/FinalCta',
  component: FinalCta,
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
} satisfies Meta<typeof FinalCta>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
