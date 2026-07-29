import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Navbar } from './Navbar'
import { SvgSprite } from '../SvgSprite'
import { getDictionary } from '@/lib/i18n'

const meta = {
  title: 'Chrome/Navbar',
  component: Navbar,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <>
        <SvgSprite />
        <Story />
      </>
    ),
  ],
  args: { dict: getDictionary('en'), locale: 'en' },
} satisfies Meta<typeof Navbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
