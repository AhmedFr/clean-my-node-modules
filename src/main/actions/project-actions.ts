import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { DeleteResult } from '@shared/delete.types'
import type { Project } from '@shared/project.types'
import { shell } from 'electron'

const execFileAsync = promisify(execFile)

/** Moves a project's node_modules to the Trash. Returns freed bytes. */
export async function deleteNodeModules(project: Project): Promise<number> {
  await shell.trashItem(join(project.absPath, 'node_modules'))
  return project.size
}

/** Pre-delete guard: unmounted result if the node_modules path is gone, else null. */
export function guardExists(nodeModulesPath: string, exists: (p: string) => boolean = existsSync): DeleteResult | null {
  return exists(nodeModulesPath) ? null : { freed: 0, blocked: 'unmounted' }
}

export function revealInFinder(project: Project): void {
  shell.showItemInFolder(join(project.absPath, 'node_modules'))
}

/** Opens the project in the user's editor; falls back to Finder. */
export async function openProject(project: Project): Promise<void> {
  try {
    await execFileAsync('open', ['-a', 'Visual Studio Code', project.absPath])
  } catch {
    await shell.openPath(project.absPath)
  }
}
