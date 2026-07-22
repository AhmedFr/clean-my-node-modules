import type { LauncherNavTarget } from '@shared/launcher-nav.types'
import { describe, expect, it } from 'vitest'
import { launcherNavState } from './launcherNav'

describe('launcherNavState', () => {
  it('settings opens the settings view, not a tab', () => {
    expect(launcherNavState('settings')).toEqual({ view: 'settings' })
  })

  it('each tab target opens the list view on that tab', () => {
    expect(launcherNavState('projects')).toEqual({ view: 'list', tab: 'projects' })
    expect(launcherNavState('caches')).toEqual({ view: 'list', tab: 'caches' })
    expect(launcherNavState('packages')).toEqual({ view: 'list', tab: 'packages' })
    expect(launcherNavState('docker')).toEqual({ view: 'list', tab: 'docker' })
  })

  it('ignores an unknown target rather than selecting a bogus tab (arrives over IPC)', () => {
    expect(launcherNavState('nope' as LauncherNavTarget)).toEqual({ view: 'list' })
  })

  it('maps settings-updates to the settings view with the updates tab', () => {
    expect(launcherNavState('settings-updates')).toEqual({ view: 'settings', settingsTab: 'updates' })
  })
})
