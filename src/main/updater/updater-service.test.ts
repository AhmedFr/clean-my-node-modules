import type { UpdaterState } from '@shared/updater.types'
import { describe, expect, it, vi } from 'vitest'
import type { AutoUpdaterLike } from './updater-service'
import { UpdaterService } from './updater-service'

class FakeAutoUpdater implements AutoUpdaterLike {
  autoDownload = true
  autoInstallOnAppQuit = false
  checkForUpdates = vi.fn(async () => undefined)
  downloadUpdate = vi.fn(async () => undefined)
  quitAndInstall = vi.fn()
  private listeners = new Map<string, (...args: unknown[]) => void>()
  on(event: string, listener: (...args: never[]) => void): unknown {
    this.listeners.set(event, listener as (...args: unknown[]) => void)
    return this
  }
  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.(...args)
  }
}

const INFO = {
  version: '1.2.0',
  releaseDate: '2026-07-20T14:26:58.000Z',
  releaseNotes: 'Notes',
  files: [{ url: 'TidyDisk-1.2.0-arm64-mac.zip', size: 4200000 }],
}

function makeService(execPath = '/Applications/TidyDisk.app/Contents/MacOS/TidyDisk') {
  const fake = new FakeAutoUpdater()
  const states: UpdaterState[] = []
  const onEvent = vi.fn()
  const service = new UpdaterService(fake, {
    currentVersion: '1.1.0',
    execPath,
    onState: (s) => states.push(s),
    onEvent,
  })
  return { fake, states, onEvent, service }
}

describe('UpdaterService', () => {
  it('configures manual download and install-on-quit', () => {
    const { fake } = makeService()
    expect(fake.autoDownload).toBe(false)
    expect(fake.autoInstallOnAppQuit).toBe(true)
  })

  it('starts idle with the current version and no checkedAt', () => {
    const { service } = makeService()
    expect(service.getState()).toEqual({ currentVersion: '1.1.0', checkedAt: null, status: { phase: 'idle' } })
  })

  it('walks check -> checking -> available and reports the event', () => {
    const { fake, service, states, onEvent } = makeService()
    service.check()
    expect(fake.checkForUpdates).toHaveBeenCalledOnce()
    fake.emit('checking-for-update')
    expect(states.at(-1)?.status.phase).toBe('checking')
    fake.emit('update-available', INFO)
    const last = states.at(-1)
    expect(last?.status).toEqual({
      phase: 'available',
      info: { version: '1.2.0', releaseDate: '2026-07-20T14:26:58.000Z', sizeBytes: 4200000, notes: 'Notes' },
    })
    expect(last?.checkedAt).toBeTypeOf('number')
    expect(onEvent).toHaveBeenCalledWith('update_available', { version: '1.2.0' })
  })

  it('returns to idle with checkedAt when no update exists', () => {
    const { fake, service, states } = makeService()
    service.check()
    fake.emit('update-not-available')
    expect(states.at(-1)?.status).toEqual({ phase: 'idle' })
    expect(states.at(-1)?.checkedAt).toBeTypeOf('number')
  })

  it('refuses download unless an update is available', () => {
    const { fake, service } = makeService()
    service.download()
    expect(fake.downloadUpdate).not.toHaveBeenCalled()
  })

  it('downloads from available, tracks progress and downloaded', () => {
    const { fake, service, states, onEvent } = makeService()
    fake.emit('update-available', INFO)
    service.download()
    expect(fake.downloadUpdate).toHaveBeenCalledOnce()
    expect(onEvent).toHaveBeenCalledWith('update_download_clicked', { version: '1.2.0' })
    fake.emit('download-progress', { percent: 41.7 })
    expect(states.at(-1)?.status).toMatchObject({ phase: 'downloading', percent: 42 })
    fake.emit('update-downloaded')
    expect(states.at(-1)?.status).toMatchObject({ phase: 'downloaded' })
  })

  it('refuses install unless downloaded', () => {
    const { fake, service } = makeService()
    service.quitAndInstall()
    expect(fake.quitAndInstall).not.toHaveBeenCalled()
    fake.emit('update-available', INFO)
    fake.emit('update-downloaded')
    service.quitAndInstall()
    expect(fake.quitAndInstall).toHaveBeenCalledOnce()
  })

  it('maps errors through classifyUpdaterError', () => {
    const { fake, states } = makeService()
    fake.emit('error', new Error('getaddrinfo ENOTFOUND github.com'))
    expect(states.at(-1)?.status).toEqual({
      phase: 'error',
      message: 'getaddrinfo ENOTFOUND github.com',
      kind: 'network',
    })
  })

  it('short-circuits to a translocation error without hitting the network', () => {
    const { fake, service, states } = makeService(
      '/private/var/folders/x/AppTranslocation/ABC/d/TidyDisk.app/Contents/MacOS/TidyDisk',
    )
    service.check()
    expect(fake.checkForUpdates).not.toHaveBeenCalled()
    expect(states.at(-1)?.status).toMatchObject({ phase: 'error', kind: 'translocation' })
  })

  it('dedupes the update_available event for repeated emissions of the same version', () => {
    const { fake, service, onEvent } = makeService()
    service.check()
    fake.emit('update-available', INFO)
    fake.emit('update-available', INFO)
    expect(onEvent).toHaveBeenCalledTimes(1)
    expect(onEvent).toHaveBeenCalledWith('update_available', { version: '1.2.0' })
  })

  it('reports the update_available event again when the version changes', () => {
    const { fake, service, onEvent } = makeService()
    service.check()
    fake.emit('update-available', INFO)
    fake.emit('update-available', { ...INFO, version: '1.3.0' })
    expect(onEvent).toHaveBeenCalledTimes(2)
    expect(onEvent).toHaveBeenNthCalledWith(1, 'update_available', { version: '1.2.0' })
    expect(onEvent).toHaveBeenNthCalledWith(2, 'update_available', { version: '1.3.0' })
  })

  it('background checks do not disturb a visible available state', () => {
    const { fake, service } = makeService()
    fake.emit('update-available', INFO)
    service.check('auto')
    expect(fake.checkForUpdates).not.toHaveBeenCalled()
  })

  it('a manual check still re-checks even when available', () => {
    const { fake, service } = makeService()
    fake.emit('update-available', INFO)
    service.check()
    expect(fake.checkForUpdates).toHaveBeenCalledOnce()
  })
})
