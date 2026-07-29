import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { GB } from '../../lib/format'
import type { SeverityCounts } from '../../lib/severity'
import { TabHeadline } from './TabHeadline'

const CLEAN: SeverityCounts = { critical: 0, high: 0, moderate: 0, low: 0, vulnerable: 0, outdated: 0 }
const MIXED: SeverityCounts = { critical: 1, high: 3, moderate: 4, low: 2, vulnerable: 10, outdated: 6 }

const meta = {
  title: 'Primitives/TabHeadline',
  component: TabHeadline,
  args: {
    accent: ACCENT,
    // projects
    projectsUsed: 4 * GB,
    linkedBytes: 1.2 * GB,
    projectsCalculating: false,
    thresholdGB: 10,
    // caches
    cachesUsed: 2 * GB,
    cachesAvailable: true,
    cachesCalculating: false,
    cacheThresholdGB: 5,
    // docker
    dockerUsed: 3 * GB,
    dockerAvailable: true,
    dockerThresholdGB: 8,
    // packages
    severity: CLEAN,
    packagesTotal: 180,
    packagesCheckEnabled: true,
    packagesComputing: false,
    packagesDataReady: true,
  },
} satisfies Meta<typeof TabHeadline>

export default meta
type Story = StoryObj<typeof meta>

export const Projects: Story = { args: { tab: 'projects' } }
export const ProjectsCalculating: Story = { args: { tab: 'projects', projectsCalculating: true } }
export const Caches: Story = { args: { tab: 'caches' } }
export const CachesUnavailable: Story = { args: { tab: 'caches', cachesAvailable: false } }
export const Docker: Story = { args: { tab: 'docker' } }
export const DockerUnavailable: Story = { args: { tab: 'docker', dockerAvailable: false } }
export const PackagesReady: Story = { args: { tab: 'packages', severity: MIXED } }
export const PackagesComputing: Story = { args: { tab: 'packages', packagesComputing: true, severity: MIXED } }
export const PackagesCheckDisabled: Story = { args: { tab: 'packages', packagesCheckEnabled: false } }
