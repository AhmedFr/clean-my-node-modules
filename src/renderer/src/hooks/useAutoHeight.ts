import { type RefObject, useEffect } from 'react'

/** Resizes the native window to hug the referenced element's height. */
export function useAutoHeight(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // offsetHeight, not getBoundingClientRect(): the latter returns the visual
    // (transformed) box, so the open scale() animation would report a height a
    // few px short and clip the footer. offsetHeight is the layout box, immune
    // to transforms, so the measurement is correct whether or not it's animating.
    const sync = (): void => window.clean.setWindowHeight(el.offsetHeight)
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
}
