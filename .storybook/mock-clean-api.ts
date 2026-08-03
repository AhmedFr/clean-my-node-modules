import type { CleanApi } from '../src/preload/api.types'

/**
 * Stubs the subset of `window.clean` a component reads at mount time.
 *
 * Electron's preload script injects the real `CleanApi` on `window.clean`; the
 * Storybook host is a plain browser with no such global, so any component that
 * calls into it during render/effects (not just inside a click handler) needs a
 * stand-in or it throws. Only widen this with the methods a story actually needs.
 */
export function mockCleanApi(overrides: Partial<CleanApi>): void {
  const target = window as unknown as { clean: Partial<CleanApi> }
  target.clean = { ...target.clean, ...overrides }
}
