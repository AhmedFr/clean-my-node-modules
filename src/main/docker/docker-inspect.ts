export interface InspectedContainer {
  id: string
  /** image reference the container runs (repo:tag), from Config.Image */
  imageRef: string
  /** resolved image id when present (Image field), for id-based matching */
  imageId: string
  project?: string
  workingDir?: string
  /** named volume mounts (Mounts[].Name where Type === 'volume') */
  mounts: string[]
}

const P = 'com.docker.compose.project'
const WD = 'com.docker.compose.project.working_dir'

export function parseContainerInspect(json: string): InspectedContainer[] {
  let arr: unknown
  try {
    arr = JSON.parse(json)
  } catch {
    return []
  }
  if (!Array.isArray(arr)) return []
  return arr.map((c: Record<string, unknown>) => {
    const config = (c.Config ?? {}) as Record<string, unknown>
    const labels = (config.Labels ?? {}) as Record<string, string>
    const mounts = Array.isArray(c.Mounts) ? (c.Mounts as Record<string, unknown>[]) : []
    return {
      id: String(c.Id ?? ''),
      imageRef: String(config.Image ?? c.Image ?? ''),
      imageId: String(c.Image ?? ''),
      project: labels[P] || undefined,
      workingDir: labels[WD] || undefined,
      mounts: mounts.filter((m) => m.Type === 'volume' && m.Name).map((m) => String(m.Name)),
    }
  })
}

/** Parses `docker volume ls --format '{{.Name}}::{{.Label "com.docker.compose.project"}}'`
 * output into a name→project map. One `volume ls` call lists only volumes that currently
 * exist, so (unlike `docker volume inspect <names>`) it can never 404 on a stale/removed
 * name and fail the whole batch. Lines without the label print `name::` (empty after the
 * separator) and are skipped, along with blank and malformed (no `::`) lines. */
export function parseVolumeLabels(output: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const line of output.split('\n')) {
    if (!line.trim()) continue
    const sep = line.indexOf('::')
    if (sep === -1) continue
    const name = line.slice(0, sep)
    const project = line.slice(sep + 2)
    if (name && project) out.set(name, project)
  }
  return out
}
