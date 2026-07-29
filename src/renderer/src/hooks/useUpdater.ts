import type { UpdaterState } from '@shared/updater.types'
import { useEffect, useState } from 'react'

const INITIAL: UpdaterState = { currentVersion: '', checkedAt: null, status: { phase: 'idle' } }

/** Live updater state synced with the main process, plus the three user actions. */
export function useUpdater(): {
  state: UpdaterState
  check: () => void
  download: () => void
  install: () => void
} {
  const [state, setState] = useState<UpdaterState>(INITIAL)

  useEffect(() => {
    let alive = true
    void window.clean.getUpdaterState().then((s) => {
      if (alive) setState(s)
    })
    const unsubscribe = window.clean.onUpdaterState(setState)
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  return {
    state,
    check: () => void window.clean.updaterCheck(),
    download: () => void window.clean.updaterDownload(),
    install: () => void window.clean.updaterInstall(),
  }
}
