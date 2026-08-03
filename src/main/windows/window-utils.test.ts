import { afterEach, describe, expect, it, vi } from 'vitest'

// `is.dev` is computed at module load, so each case stubs env then re-imports.
afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

async function loadIsDev(): Promise<boolean> {
  vi.resetModules()
  const { is } = await import('./window-utils')
  return is.dev
}

describe('is.dev', () => {
  it('true when the renderer dev-server URL is set', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', 'http://localhost:5173')
    vi.stubEnv('NODE_ENV', 'production')
    expect(await loadIsDev()).toBe(true)
  })
  it('true in NODE_ENV=development', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', '')
    vi.stubEnv('NODE_ENV', 'development')
    expect(await loadIsDev()).toBe(true)
  })
  it('false in a packaged run', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', '')
    vi.stubEnv('NODE_ENV', 'production')
    expect(await loadIsDev()).toBe(false)
  })
})
