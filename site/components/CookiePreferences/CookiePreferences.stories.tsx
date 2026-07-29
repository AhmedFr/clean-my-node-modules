import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CookiePreferences } from './CookiePreferences'

const meta = {
  title: 'Sections/CookiePreferences',
  component: CookiePreferences,
  args: { label: 'Cookie preferences' },
} satisfies Meta<typeof CookiePreferences>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
