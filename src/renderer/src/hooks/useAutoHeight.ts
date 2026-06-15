import { type RefObject, useEffect } from 'react'

/** Resizes the native window to hug the referenced element's height. */
export function useAutoHeight(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const sync = (): void => window.clean.setWindowHeight(el.getBoundingClientRect().height)
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
}
