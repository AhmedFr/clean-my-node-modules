import type { LiveInfo } from '@shared/liveness.types'
import { useEffect, useState } from 'react'

const POLL_MS = 45_000

/** Live projects keyed by id, refreshed every 45s while this component is mounted. */
export function useLiveProjects(): Record<string, LiveInfo> {
  const [live, setLive] = useState<Record<string, LiveInfo>>({})
  useEffect(() => {
    let active = true
    const tick = (): void => {
      void window.clean.getLiveProjects().then((r) => {
        if (active) setLive(r)
      })
    }
    tick()
    const id = setInterval(tick, POLL_MS)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])
  return live
}
