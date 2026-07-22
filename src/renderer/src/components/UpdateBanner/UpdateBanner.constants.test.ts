import type { UpdaterState } from '@shared/updater.types'
import { describe, expect, it } from 'vitest'
import { bannerModel } from './UpdateBanner.constants'

const INFO = { version: '1.2.0', releaseDate: '2026-07-20T14:26:58.000Z', sizeBytes: 4200000, notes: null }

describe('bannerModel', () => {
  it('hides for idle, checking and error phases', () => {
    expect(bannerModel({ phase: 'idle' }, undefined)).toBeNull()
    expect(bannerModel({ phase: 'checking' }, undefined)).toBeNull()
    expect(bannerModel({ phase: 'error', message: 'x', kind: 'network' }, undefined)).toBeNull()
  })

  it('shows a dismissible banner when an update is available', () => {
    expect(bannerModel({ phase: 'available', info: INFO }, undefined)).toEqual({
      info: INFO,
      phase: 'available',
      dismissible: true,
    })
  })

  it('hides when that exact version was dismissed, but not a different one', () => {
    expect(bannerModel({ phase: 'available', info: INFO }, '1.2.0')).toBeNull()
    expect(bannerModel({ phase: 'available', info: INFO }, '1.1.5')).not.toBeNull()
  })

  it('ignores dismissal once a download is in flight or done', () => {
    const downloading: UpdaterState['status'] = { phase: 'downloading', info: INFO, percent: 30 }
    expect(bannerModel(downloading, '1.2.0')).toEqual({
      info: INFO,
      phase: 'downloading',
      percent: 30,
      dismissible: false,
    })
    expect(bannerModel({ phase: 'downloaded', info: INFO }, '1.2.0')).toEqual({
      info: INFO,
      phase: 'downloaded',
      dismissible: false,
    })
  })
})
