import { useEffect, useState } from 'react'
import type { Project } from '@shared/project.types'

/** Live project inventory synced with the main process. */
export function useProjects(): Project[] {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    let alive = true
    window.clean.getProjects().then((p) => {
      if (alive) setProjects(p)
    })
    const unsubscribe = window.clean.onProjectsChanged(setProjects)
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  return projects
}
