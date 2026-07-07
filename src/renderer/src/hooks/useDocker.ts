import type { DockerInfo } from '@shared/docker.types'
import { useCallback, useEffect, useState } from 'react'

interface UseDocker {
  info: DockerInfo | null
  /** True until Docker has been probed at least once. */
  loading: boolean
  refresh: () => Promise<void>
}

/** Docker images/volumes/containers/build-cache info, synced with the main process.
 * Phase-A subset (read-only); remove/prune land in a later task. */
export function useDocker(): UseDocker {
  const [info, setInfo] = useState<DockerInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    void window.clean.getDocker().then((i) => {
      if (alive) {
        setInfo(i)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      setInfo(await window.clean.getDocker(true))
    } finally {
      setLoading(false)
    }
  }, [])

  return { info, loading, refresh }
}
