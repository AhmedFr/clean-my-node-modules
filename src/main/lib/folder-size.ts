import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/** Parses `du -sk` output ("123456\t/path") into bytes. */
export function parseDuKb(stdout: string): number {
  const kb = parseInt(stdout.trim().split(/\s+/)[0], 10)
  return Number.isFinite(kb) ? kb * 1024 : 0
}

/** Folder size in bytes via `du -sk` (fast, native). */
export async function folderSize(path: string): Promise<number> {
  const { stdout } = await execFileAsync('du', ['-sk', path], {
    maxBuffer: 1024 * 1024,
  })
  return parseDuKb(stdout)
}
