import { execFile } from 'node:child_process'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { shell } from 'electron'
import type { Project } from '@shared/project.types'

const execFileAsync = promisify(execFile)

/** Moves a project's node_modules to the Trash. Returns freed bytes. */
export async function deleteNodeModules(project: Project): Promise<number> {
  await shell.trashItem(join(project.absPath, 'node_modules'))
  return project.size
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
