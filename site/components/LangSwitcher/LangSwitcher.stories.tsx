import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LangSwitcher } from './LangSwitcher'

const meta = {
  title: 'Primitives/LangSwitcher',
  component: LangSwitcher,
  args: { path: '/' },
} satisfies Meta<typeof LangSwitcher>

export default meta
type Story = StoryObj<typeof meta>

export const EnglishActive: Story = { args: { locale: 'en' } }
export const FrenchActive: Story = { args: { locale: 'fr' } }
export const SpanishActive: Story = { args: { locale: 'es' } }
export const GermanActive: Story = { args: { locale: 'de' } }
export const PortugueseActive: Story = { args: { locale: 'pt' } }
