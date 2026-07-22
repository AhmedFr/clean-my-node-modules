import type { UpdaterErrorKind, UpdateSummary } from '@shared/updater.types'

/** Structural slice of electron-updater's UpdateInfo that we consume; injectable for tests. */
export interface UpdateInfoLike {
  version: string
  releaseDate?: string
  releaseNotes?: string | Array<{ version: string; note: string | null }> | null
  files?: Array<{ url: string; size?: number }>
}

/** macOS App Translocation runs the app from a random read-only mount; updates cannot install there. */
export function isTranslocated(execPath: string): boolean {
  return execPath.includes('/AppTranslocation/')
}

export function classifyUpdaterError(message: string): UpdaterErrorKind {
  if (/apptranslocation/i.test(message)) return 'translocation'
  if (/net::|enotfound|etimedout|econn|getaddrinfo|socket|network|status [45]\d\d/i.test(message)) return 'network'
  return 'unknown'
}

/** GitHub release bodies can arrive as HTML; keep the text, drop the tags. */
function stripHtml(s: string): string {
  return s
    .replace(/<\/(h[1-6]|li|p|ul|ol|div|br)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
}

export function summarizeUpdate(info: UpdateInfoLike): UpdateSummary {
  // The DMG is for humans; the zip is what Squirrel.Mac downloads and applies.
  const zip = info.files?.find((f) => f.url.endsWith('.zip')) ?? info.files?.[0]
  // stripHtml runs per note fragment, not on the joined string: it drops blank
  // lines, which would otherwise collapse the '\n\n' separators between entries.
  const notes = Array.isArray(info.releaseNotes)
    ? info.releaseNotes
        .map((n) => stripHtml([n.version, n.note ?? ''].filter(Boolean).join(': ')))
        .filter((s) => s.length > 0)
        .join('\n\n')
    : stripHtml(info.releaseNotes ?? '')
  return {
    version: info.version,
    releaseDate: info.releaseDate ?? '',
    sizeBytes: zip?.size ?? 0,
    notes: notes.length > 0 ? notes : null,
  }
}
