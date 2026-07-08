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

export function parseVolumeInspect(json: string): Map<string, string> {
  const out = new Map<string, string>()
  let arr: unknown
  try {
    arr = JSON.parse(json)
  } catch {
    return out
  }
  if (!Array.isArray(arr)) return out
  for (const v of arr as Record<string, unknown>[]) {
    const labels = (v.Labels ?? {}) as Record<string, string> | null
    const project = labels?.[P]
    if (v.Name && project) out.set(String(v.Name), project)
  }
  return out
}
