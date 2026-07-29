import type { Meta, StoryObj } from '@storybook/react-vite'
import { Accordion } from './Accordion'

const header = <div style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>react</div>

const body = (
  <div style={{ padding: '0 12px 10px', fontSize: 12, color: 'var(--text-dim)' }}>Used by 2 projects at 18.3.1.</div>
)

const meta = {
  title: 'Rows/Accordion',
  component: Accordion,
  args: {
    open: false,
    header,
    children: body,
    card: false,
  },
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}
export const Open: Story = { args: { open: true } }
export const OpenWithCard: Story = { args: { open: true, card: true } }
