import type { DockerItem, DockerProject } from '@shared/docker.types'
import type { InspectedContainer } from './docker-inspect'

/** Repository = name before the last ':'; undefined for dangling '<none>'. */
function repositoryOf(name: string): string | undefined {
  if (name === '<none>' || !name.includes(':')) return name === '<none>' ? undefined : name
  return name.slice(0, name.lastIndexOf(':'))
}

/** The single compose project referencing this image (by id or repo:tag), or undefined if 0 or >1. */
function soleProject(projects: Set<string>): string | undefined {
  return projects.size === 1 ? [...projects][0] : undefined
}

export function associateProjects(
  items: DockerItem[],
  containers: InspectedContainer[],
  volumeProjects: Map<string, string>,
): { items: DockerItem[]; projects: DockerProject[] } {
  // project name → working_dir (from any container that carries both)
  const workingDirs = new Map<string, string>()
  // image ref/id → set of projects whose containers reference it
  const imageProjects = new Map<string, Set<string>>()
  // volume name → set of projects whose containers mount it
  const volumeMountProjects = new Map<string, Set<string>>()

  for (const c of containers) {
    if (c.project && c.workingDir && !workingDirs.has(c.project)) workingDirs.set(c.project, c.workingDir)
    if (c.project) {
      for (const key of [c.imageRef, c.imageId].filter(Boolean)) {
        if (!imageProjects.has(key)) imageProjects.set(key, new Set())
        imageProjects.get(key)!.add(c.project)
      }
      for (const vol of c.mounts) {
        if (!volumeMountProjects.has(vol)) volumeMountProjects.set(vol, new Set())
        volumeMountProjects.get(vol)!.add(c.project)
      }
    }
  }

  const byId = new Map(containers.map((c) => [c.id, c]))
  const projectNames = new Set<string>()

  const out = items.map((item): DockerItem => {
    let project: string | undefined
    let repository: string | undefined
    if (item.kind === 'container') {
      project = byId.get(item.id)?.project
    } else if (item.kind === 'image') {
      repository = repositoryOf(item.name)
      project = soleProject(imageProjects.get(item.id) ?? imageProjects.get(item.name) ?? new Set())
    } else if (item.kind === 'volume') {
      project = volumeProjects.get(item.name) ?? soleProject(volumeMountProjects.get(item.name) ?? new Set())
    }
    if (project) projectNames.add(project)
    return { ...item, project, repository }
  })

  const projects: DockerProject[] = [...projectNames].map((name) => ({
    name,
    workingDir: workingDirs.get(name),
  }))
  return { items: out, projects }
}
