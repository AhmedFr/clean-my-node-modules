import { describe, expect, it } from 'vitest'
import { classifyUpdaterError, isTranslocated, summarizeUpdate } from './updater-logic'

describe('isTranslocated', () => {
  it('detects the App Translocation mount path', () => {
    expect(isTranslocated('/private/var/folders/x/AppTranslocation/ABC/d/TidyDisk.app/Contents/MacOS/TidyDisk')).toBe(
      true,
    )
  })
  it('passes a normal /Applications path', () => {
    expect(isTranslocated('/Applications/TidyDisk.app/Contents/MacOS/TidyDisk')).toBe(false)
  })
})

describe('classifyUpdaterError', () => {
  it('classifies network failures', () => {
    expect(classifyUpdaterError('net::ERR_INTERNET_DISCONNECTED')).toBe('network')
    expect(classifyUpdaterError('getaddrinfo ENOTFOUND github.com')).toBe('network')
    expect(classifyUpdaterError('HttpError: 503 status 503')).toBe('network')
  })
  it('classifies translocation mentions', () => {
    expect(classifyUpdaterError('cannot update in /AppTranslocation/ path')).toBe('translocation')
  })
  it('falls back to unknown', () => {
    expect(classifyUpdaterError('something exploded')).toBe('unknown')
  })
})

describe('summarizeUpdate', () => {
  it('picks the zip file size and passes fields through', () => {
    const s = summarizeUpdate({
      version: '1.2.0',
      releaseDate: '2026-07-20T14:26:58.000Z',
      releaseNotes: 'Fixes and speedups',
      files: [
        { url: 'tidydisk-arm64.dmg', size: 99 },
        { url: 'TidyDisk-1.2.0-arm64-mac.zip', size: 4200000 },
      ],
    })
    expect(s).toEqual({
      version: '1.2.0',
      releaseDate: '2026-07-20T14:26:58.000Z',
      sizeBytes: 4200000,
      notes: 'Fixes and speedups',
    })
  })

  it('strips HTML from notes and nulls empty ones', () => {
    expect(
      summarizeUpdate({ version: '1.2.0', releaseNotes: '<h2>New</h2><ul><li>Faster scans</li></ul>' }).notes,
    ).toBe('New\nFaster scans')
    expect(summarizeUpdate({ version: '1.2.0', releaseNotes: '' }).notes).toBeNull()
    expect(summarizeUpdate({ version: '1.2.0' }).notes).toBeNull()
  })

  it('joins ReleaseNoteInfo arrays', () => {
    const s = summarizeUpdate({
      version: '1.3.0',
      releaseNotes: [
        { version: '1.3.0', note: 'C' },
        { version: '1.2.0', note: 'B' },
      ],
    })
    expect(s.notes).toBe('1.3.0: C\n\n1.2.0: B')
  })

  it('defaults missing date and size', () => {
    const s = summarizeUpdate({ version: '1.2.0' })
    expect(s.releaseDate).toBe('')
    expect(s.sizeBytes).toBe(0)
  })
})
