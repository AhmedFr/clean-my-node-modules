import type { FrameworkKind } from '@shared/project.types'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FrameworkIcon } from './FrameworkIcon'

const KINDS: FrameworkKind[] = ['react', 'next', 'vue', 'svelte', 'node', 'astro', 'ts', 'vite', 'remix', 'expo']

const meta = {
  title: 'Primitives/FrameworkIcon',
  component: FrameworkIcon,
  args: { kind: 'node' },
} satisfies Meta<typeof FrameworkIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  parameters: { panel: false },
  // Ignores args — renders every FrameworkKind side by side.
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 20,
        padding: 24,
        background: 'var(--panel-menu, #17181d)',
      }}
    >
      {KINDS.map((kind) => (
        <div
          key={kind}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          <FrameworkIcon kind={kind} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{kind}</span>
        </div>
      ))}
    </div>
  ),
}
