import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean } from '../test/mock-clean-bridge'
import { useAutoHeight } from './useAutoHeight'

const observers: Array<{ observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = []

beforeEach(() => {
  installMockClean()
  observers.length = 0
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      disconnect = vi.fn()
      constructor() {
        observers.push(this)
      }
    },
  )
})

describe('useAutoHeight', () => {
  it('syncs the window height to the element layout box and observes resizes', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'offsetHeight', { value: 240 })
    const { unmount } = renderHook(() => useAutoHeight({ current: el }))
    expect(vi.mocked(window.clean.setWindowHeight)).toHaveBeenCalledWith(240)
    expect(observers).toHaveLength(1)
    expect(observers[0].observe).toHaveBeenCalledWith(el)
    unmount()
    expect(observers[0].disconnect).toHaveBeenCalledOnce()
  })

  it('does nothing when the ref is empty', () => {
    renderHook(() => useAutoHeight({ current: null }))
    expect(vi.mocked(window.clean.setWindowHeight)).not.toHaveBeenCalled()
    expect(observers).toHaveLength(0)
  })
})
