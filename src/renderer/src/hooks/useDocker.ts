import type { DockerActionResult, DockerInfo, DockerItemKind, DockerPruneTarget } from '@shared/docker.types'
import { useCallback, useEffect, useState } from 'react'

interface UseDocker {
  info: DockerInfo | null
  /** True until Docker has been probed at least once. */
  loading: boolean
  /** id of the item being removed, or `prune:<target>` while a prune runs; null when idle. */
  busyId: string | null
  refresh: () => Promise<void>
  remove: (kind: DockerItemKind, id: string) => Promise<DockerActionResult>
  prune: (target: DockerPruneTarget) => Promise<DockerActionResult>
}

/** Docker images/volumes/containers/build-cache info, synced with the main process. */
export function useDocker(): UseDocker {
  const [info, setInfo] = useState<DockerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

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

  const remove = useCallback(
    async (kind: DockerItemKind, id: string): Promise<DockerActionResult> => {
      setBusyId(id)
      try {
        const r = await window.clean.removeDockerItem(kind, id)
        await refresh()
        return r
      } finally {
        setBusyId(null)
      }
    },
    [refresh],
  )

  const prune = useCallback(
    async (target: DockerPruneTarget): Promise<DockerActionResult> => {
      setBusyId(`prune:${target}`)
      try {
        const r = await window.clean.pruneDocker(target)
        await refresh()
        return r
      } finally {
        setBusyId(null)
      }
    },
    [refresh],
  )

  return { info, loading, busyId, refresh, remove, prune }
}
