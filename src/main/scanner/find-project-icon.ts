import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'

/** Common favicon/logo locations, most canonical first. */
const ICON_CANDIDATES = [
  'public/favicon.svg',
  'public/favicon.png',
  'public/favicon.ico',
  'public/logo.svg',
  'public/logo.png',
  'public/favicon-32x32.png',
  'public/apple-touch-icon.png',
  'app/favicon.ico',
  'src/app/favicon.ico',
  'static/favicon.svg',
  'static/favicon.png',
  'src/favicon.svg',
  'src/favicon.png',
  'src/assets/logo.svg',
  'src/assets/logo.png',
  'assets/logo.svg',
  'assets/logo.png',
  'favicon.svg',
  'favicon.png',
  'favicon.ico',
  'logo.svg',
  'logo.png',
]

const MAX_ICON_BYTES = 256 * 1024

const MIME_BY_EXT: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

/**
 * Finds the project's own favicon/logo and returns it as a data URL so the
 * renderer can show it without filesystem access. Returns undefined when no
 * suitable icon exists (caller falls back to the framework icon).
 */
export async function findProjectIcon(projectDir: string): Promise<string | undefined> {
  for (const candidate of ICON_CANDIDATES) {
    const filePath = join(projectDir, candidate)
    try {
      const info = await stat(filePath)
      if (!info.isFile() || info.size === 0 || info.size > MAX_ICON_BYTES) continue
      const mime = MIME_BY_EXT[extname(candidate)]
      if (!mime) continue
      const data = await readFile(filePath)
      return `data:${mime};base64,${data.toString('base64')}`
    } catch {
      // candidate missing — try the next one
    }
  }
  return undefined
}
