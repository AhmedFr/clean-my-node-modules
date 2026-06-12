import { useCallback, useRef, useState } from 'react'

export interface ToastState<T> {
  toast: T | null
  flashToast: (toast: T) => void
}

const TOAST_MS = 2400

/** Transient toast that auto-clears after a short delay. */
export function useToast<T>(): ToastState<T> {
  const [toast, setToast] = useState<T | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flashToast = useCallback((next: T) => {
    setToast(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), TOAST_MS)
  }, [])

  return { toast, flashToast }
}
