import type { PackageEntry } from '@shared/package.types'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PackageRow } from './PackageRow'

// Minimal realistic PackageEntry fixture (all required fields).
const entry: PackageEntry = {
  name: 'react',
  usages: [
    { projectId: 'story-my-app', projectName: 'my-app', version: '18.3.1', dev: false },
    { projectId: 'story-blog', projectName: 'blog', version: '18.3.1', dev: false },
  ],
  projectCount: 2,
  versions: ['18.3.1'],
  multipleVersions: false,
  size: 320000,
  latest: '18.3.1',
  outdated: false,
}

const outdatedEntry: PackageEntry = {
  ...entry,
  name: 'lodash',
  latest: '4.17.21',
  outdated: true,
}

const advisoryEntry: PackageEntry = {
  name: 'minimist',
  usages: [{ projectId: 'story-my-app', projectName: 'my-app', version: '1.2.5', dev: true }],
  projectCount: 1,
  versions: ['1.2.5'],
  multipleVersions: false,
  size: 8200,
  advisory: {
    severity: 'high',
    title: 'Prototype Pollution in minimist',
    url: 'https://example.com/advisory/minimist',
    vulnerableVersions: '<1.2.6',
  },
}

const meta = {
  title: 'Rows/PackageRow',
  component: PackageRow,
  args: {
    entry,
    selected: false,
    expanded: false,
    showUpdates: true,
    onSelect: () => {},
    onToggle: () => {},
    rowRef: () => {},
  },
} satisfies Meta<typeof PackageRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Selected: Story = { args: { selected: true } }
export const Expanded: Story = { args: { expanded: true } }
export const UpdatesHidden: Story = { args: { entry: outdatedEntry, showUpdates: false } }
export const WithAdvisory: Story = { args: { entry: advisoryEntry } }
